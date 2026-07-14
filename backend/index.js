require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

function createApp(pool, paymentSvc) {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: '2mb' }));

// ============================================
// PRODUCTS API
// ============================================

app.get('/api/categories', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM categories ORDER BY sort_order');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products', async (req, res) => {
  const { category_id, include_unavailable } = req.query;
  let query = 'SELECT * FROM products';
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  if (category_id && category_id !== 'all') {
    conditions.push(`category_id = $${paramIndex++}`);
    params.push(category_id);
  }

  if (include_unavailable !== 'true') {
    conditions.push('is_available = TRUE');
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  try {
    const { rows } = await pool.query(query, params);
    const parsedProducts = rows.map(p => ({
      ...p,
      modifiers: p.modifiers ? JSON.parse(p.modifiers) : []
    }));
    res.json(parsedProducts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { category_id, title, price, description, image, modifiers } = req.body;
  try {
    const { rows } = await pool.query(
      'INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [category_id, title, price, description, image, JSON.stringify(modifiers || [])]
    );
    res.json({ id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  const { category_id, title, price, description, image, modifiers } = req.body;
  try {
    await pool.query(
      'UPDATE products SET category_id = $1, title = $2, price = $3, description = $4, image = $5, modifiers = $6 WHERE id = $7',
      [category_id, title, price, description, image, JSON.stringify(modifiers || []), id]
    );
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await pool.query('DELETE FROM products WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products/:id/toggle-availability', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT id, is_available FROM products WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const product = rows[0];
    const newStatus = !product.is_available;
    await pool.query('UPDATE products SET is_available = $1 WHERE id = $2', [newStatus, id]);

    res.json({ 
      success: true, 
      is_available: newStatus,
      message: newStatus ? 'Produk ditandai tersedia' : 'Produk ditandai habis'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CATEGORIES API
// ============================================

app.post('/api/categories', async (req, res) => {
  const { id, label, sort_order } = req.body;
  try {
    await pool.query('INSERT INTO categories (id, label, sort_order) VALUES ($1, $2, $3)', [id, label, sort_order || 0]);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  const { label, sort_order } = req.body;
  try {
    await pool.query('UPDATE categories SET label = $1, sort_order = $2 WHERE id = $3', [label, sort_order, id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT COUNT(*) as count FROM products WHERE category_id = $1', [id]);
    if (parseInt(rows[0].count) > 0) {
      return res.status(400).json({ error: 'Cannot delete category with products' });
    }
    await pool.query('DELETE FROM categories WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ORDERS API
// ============================================

app.get('/api/orders', async (req, res) => {
  const { status, today } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (status) {
    conditions.push(`status = $${paramIndex++}`);
    params.push(status);
  }

  if (today === 'true') {
    conditions.push("DATE(created_at AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE");
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  try {
    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/confirmed', async (req, res) => {
  try {
    const { rows: orders } = await pool.query(`
      SELECT * FROM orders 
      WHERE status = 'confirmed' 
      ORDER BY created_at ASC
    `);

    const ordersWithItems = await Promise.all(orders.map(async (order) => {
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return { ...order, items };
    }));

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/search', async (req, res) => {
  const { id, phone } = req.query;
  
  try {
    if (id) {
      const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
      if (rows.length === 0) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      const order = rows[0];
      const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
      return res.json({ ...order, items });
    }
    
    if (phone) {
      const { rows: orders } = await pool.query(`
        SELECT * FROM orders 
        WHERE customer_phone LIKE $1 
        AND status IN ('pending', 'confirmed')
        ORDER BY created_at DESC 
        LIMIT 10
      `, [`%${phone}%`]);
      
      if (orders.length === 0) {
        return res.status(404).json({ error: 'Tidak ada pesanan aktif untuk nomor ini' });
      }
      
      const ordersWithItems = await Promise.all(orders.map(async (order) => {
        const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [order.id]);
        return { ...order, items };
      }));
      
      return res.json(ordersWithItems);
    }
    
    return res.status(400).json({ error: 'Parameter id atau phone diperlukan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const order = rows[0];
    const { rows: items } = await pool.query('SELECT * FROM order_items WHERE order_id = $1', [id]);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders', async (req, res) => {
  const { total, items, customer_name, customer_phone } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  if (!customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Customer name and phone required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { rows } = await client.query(`
      INSERT INTO orders (total, status, customer_name, customer_phone, payment_status) 
      VALUES ($1, 'pending', $2, $3, 'pending') RETURNING id
    `, [total, customer_name, customer_phone]);
    
    const orderId = rows[0].id;

    for (const item of items) {
      await client.query(`
        INSERT INTO order_items (order_id, product_id, product_title, quantity, price_at_time, modifiers_json) 
        VALUES ($1, $2, $3, $4, $5, $6)
      `, [
        orderId, 
        item.id || null, 
        item.title,
        item.quantity || 1, 
        item.totalPrice || item.price,
        item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
      ]);
    }

    await client.query('COMMIT');
    res.json({ success: true, orderId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  } finally {
    client.release();
  }
});

app.post('/api/orders/:id/add-items', async (req, res) => {
  const { id } = req.params;
  const { items, extraTotal } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items to add' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Cannot add items to a completed order' });
    }

    const paymentResult = await paymentSvc.createPayment(
      `${id}-addon-${Date.now()}`,
      extraTotal, 
      { name: order.customer_name, phone: order.customer_phone }
    );

    const client = await pool.connect();
    
    const processAddonItems = async (orderItems) => {
      try {
        await client.query('BEGIN');
        for (const item of orderItems) {
          await client.query(`
            INSERT INTO order_items (order_id, product_id, product_title, quantity, price_at_time, modifiers_json, is_addon) 
            VALUES ($1, $2, $3, $4, $5, $6, TRUE)
          `, [
            id, 
            item.id || null, 
            item.title,
            item.quantity || 1, 
            item.totalPrice || item.price,
            item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
          ]);
        }
        await client.query('UPDATE orders SET total = total + $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2', [extraTotal, id]);
        await client.query('COMMIT');
      } catch (e) {
        await client.query('ROLLBACK');
        throw e;
      } finally {
        client.release();
      }
    };

    if (paymentResult.success) {
      if (paymentResult.snapToken) {
        await processAddonItems(items);
        return res.json({ 
          success: true, 
          orderId: id,
          snapToken: paymentResult.snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
          redirectUrl: paymentResult.redirectUrl,
          message: 'Addon snap token created'
        });
      }

      await processAddonItems(items);
      res.json({ 
        success: true, 
        orderId: id,
        message: 'Addon payment successful'
      });
    } else {
      res.status(400).json({ error: paymentResult.message || 'Payment failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add items' });
  }
});

app.post('/api/orders/:id/pay', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    const order = rows[0];

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    const paymentResult = await paymentSvc.createPayment(
      id, 
      order.total, 
      { name: order.customer_name, phone: order.customer_phone }
    );

    if (paymentResult.success) {
      if (paymentResult.snapToken) {
        await pool.query(`
          UPDATE orders 
          SET payment_transaction_id = $1,
              payment_method = 'midtrans'
          WHERE id = $2
        `, [paymentResult.transactionId, id]);

        return res.json({ 
          success: true, 
          orderId: id,
          snapToken: paymentResult.snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
          redirectUrl: paymentResult.redirectUrl,
          message: 'Snap token created'
        });
      }

      await pool.query(`
        UPDATE orders 
        SET status = 'confirmed', 
            payment_status = 'success',
            payment_method = $1,
            payment_transaction_id = $2
        WHERE id = $3
      `, [paymentResult.paymentMethod, paymentResult.transactionId, id]);

      res.json({ 
        success: true, 
        orderId: id,
        transactionId: paymentResult.transactionId,
        message: 'Payment successful, order confirmed'
      });
    } else {
      res.status(400).json({ error: paymentResult.message || 'Payment failed' });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

app.post('/api/orders/:id/pay-direct', async (req, res) => {
  const { id } = req.params;

  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    const order = rows[0];

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    const transactionId = `DIRECT-${id}-${Date.now()}`;

    await pool.query(`
      UPDATE orders 
      SET status = 'confirmed', 
          payment_status = 'success',
          payment_method = 'direct',
          payment_transaction_id = $1
      WHERE id = $2
    `, [transactionId, id]);

    console.log(`✅ Order #${id} confirmed via direct payment`);

    res.json({
      success: true,
      orderId: id,
      transactionId,
      message: 'Direct payment successful, order confirmed'
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Direct payment failed' });
  }
});

app.put('/api/orders/:id/complete', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['completed', id]);
    res.json({ success: true, message: 'Order completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/orders/:id/confirm-payment', async (req, res) => {
  const { id } = req.params;
  
  try {
    const { rows } = await pool.query('SELECT * FROM orders WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }

    await pool.query(`
      UPDATE orders 
      SET status = 'confirmed', 
          payment_status = 'success'
      WHERE id = $1
    `, [id]);

    console.log(`✅ Order #${id} confirmed via frontend callback`);
    res.json({ success: true, message: 'Order confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/payment/webhook', async (req, res) => {
  try {
    const result = await paymentSvc.handleWebhook(req.body);
    console.log('📩 Webhook received:', result);
    
    if (result.status === 'success' && result.orderId) {
      await pool.query(`
        UPDATE orders 
        SET status = 'confirmed', 
            payment_status = 'success',
            payment_transaction_id = $1
        WHERE id = $2
      `, [result.midtransOrderId || '', result.orderId]);
      console.log(`✅ Order #${result.orderId} confirmed via webhook`);
    } else if (result.status === 'failed' && result.orderId) {
      await pool.query(`
        UPDATE orders 
        SET payment_status = 'failed'
        WHERE id = $1
      `, [result.orderId]);
      console.log(`❌ Order #${result.orderId} payment failed`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

app.get('/api/payment/client-key', (req, res) => {
  res.json({ 
    clientKey: process.env.MIDTRANS_CLIENT_KEY || null,
    gateway: process.env.PAYMENT_GATEWAY || 'simulated',
    isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true'
  });
});

// ============================================
// ADMIN API
// ============================================

app.post('/api/admin/login', async (req, res) => {
  const { pin } = req.body;
  try {
    const { rows } = await pool.query("SELECT value FROM admin_settings WHERE key = 'admin_pin'");
    const adminPin = rows.length > 0 ? rows[0].value : '1234';
    if (pin === adminPin) {
      res.json({ success: true, token: 'admin-token-123' });
    } else {
      res.status(401).json({ error: 'Invalid PIN' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/stats', async (req, res) => {
  try {
    const prodRes = await pool.query('SELECT COUNT(*) as count FROM products');
    const totalProducts = parseInt(prodRes.rows[0].count);

    const catRes = await pool.query('SELECT COUNT(*) as count FROM categories');
    const totalCategories = parseInt(catRes.rows[0].count);
    
    const todayRes = await pool.query(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
      FROM orders 
      WHERE DATE(created_at AT TIME ZONE 'Asia/Jakarta') = CURRENT_DATE
      AND status IN ('confirmed', 'completed')
    `);
    
    const pendRes = await pool.query(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'
    `);

    res.json({
      totalProducts,
      totalCategories,
      todayOrdersCount: parseInt(todayRes.rows[0].count),
      todayRevenue: parseFloat(todayRes.rows[0].revenue),
      pendingOrders: parseInt(pendRes.rows[0].count)
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ADMIN SETTINGS API (PIN, Security Question)
// ============================================

app.get('/api/admin/security-question', async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT value FROM admin_settings WHERE key = 'security_question'");
    const question = rows.length > 0 ? rows[0].value : '';
    res.json({ question, isSetup: !!question });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/setup-security', async (req, res) => {
  const { question, answer, pin } = req.body;

  if (!question || !answer) {
    return res.status(400).json({ error: 'Pertanyaan dan jawaban wajib diisi' });
  }

  try {
    const { rows } = await pool.query("SELECT value FROM admin_settings WHERE key = 'admin_pin'");
    const adminPin = rows.length > 0 ? rows[0].value : '1234';
    if (pin !== adminPin) {
      return res.status(401).json({ error: 'PIN salah' });
    }

    await pool.query(`
      INSERT INTO admin_settings (key, value) VALUES ('security_question', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [question]);

    await pool.query(`
      INSERT INTO admin_settings (key, value) VALUES ('security_answer', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [answer.toLowerCase().trim()]);

    res.json({ success: true, message: 'Pertanyaan keamanan berhasil disimpan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/forgot-pin', async (req, res) => {
  const { answer, newPin } = req.body;

  if (!answer || !newPin) {
    return res.status(400).json({ error: 'Jawaban dan PIN baru wajib diisi' });
  }

  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ error: 'PIN harus 4 digit angka' });
  }

  try {
    const qRows = await pool.query("SELECT value FROM admin_settings WHERE key = 'security_question'");
    if (qRows.rows.length === 0 || !qRows.rows[0].value) {
      return res.status(400).json({ error: 'Pertanyaan keamanan belum diatur. Hubungi pengembang untuk reset PIN.' });
    }

    const aRows = await pool.query("SELECT value FROM admin_settings WHERE key = 'security_answer'");
    const storedAnswer = aRows.rows.length > 0 ? aRows.rows[0].value : '';

    if (answer.toLowerCase().trim() !== storedAnswer) {
      return res.status(401).json({ error: 'Jawaban keamanan salah' });
    }

    await pool.query(`
      INSERT INTO admin_settings (key, value) VALUES ('admin_pin', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [newPin]);

    res.json({ success: true, message: 'PIN berhasil direset' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/change-pin', async (req, res) => {
  const { currentPin, newPin } = req.body;

  if (!currentPin || !newPin) {
    return res.status(400).json({ error: 'PIN lama dan baru wajib diisi' });
  }

  if (newPin.length !== 4 || !/^\d{4}$/.test(newPin)) {
    return res.status(400).json({ error: 'PIN harus 4 digit angka' });
  }

  try {
    const { rows } = await pool.query("SELECT value FROM admin_settings WHERE key = 'admin_pin'");
    const adminPin = rows.length > 0 ? rows[0].value : '1234';

    if (currentPin !== adminPin) {
      return res.status(401).json({ error: 'PIN lama salah' });
    }

    await pool.query(`
      INSERT INTO admin_settings (key, value) VALUES ('admin_pin', $1)
      ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value
    `, [newPin]);

    res.json({ success: true, message: 'PIN berhasil diubah' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CASHIER ACCOUNTS API
// ============================================

app.post('/api/cashier/login', async (req, res) => {
  const { username, pin } = req.body;

  if (!username || !pin) {
    return res.status(400).json({ error: 'Username dan PIN wajib diisi' });
  }

  try {
    const { rows } = await pool.query('SELECT * FROM cashiers WHERE username = $1 AND is_active = 1', [username]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Username tidak ditemukan atau akun tidak aktif' });
    }

    const cashier = rows[0];

    if (cashier.pin !== pin) {
      return res.status(401).json({ error: 'PIN salah' });
    }

    res.json({ 
      success: true, 
      cashier: { id: cashier.id, name: cashier.name, username: cashier.username }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/cashiers', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT id, name, username, is_active, created_at FROM cashiers ORDER BY created_at DESC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/cashiers', async (req, res) => {
  const { name, username, pin } = req.body;

  if (!name || !username || !pin) {
    return res.status(400).json({ error: 'Nama, username, dan PIN wajib diisi' });
  }

  if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
    return res.status(400).json({ error: 'PIN harus 4 digit angka' });
  }

  try {
    const { rows: existing } = await pool.query('SELECT id FROM cashiers WHERE username = $1', [username]);
    if (existing.length > 0) {
      return res.status(400).json({ error: 'Username sudah digunakan' });
    }

    const { rows } = await pool.query('INSERT INTO cashiers (name, username, pin) VALUES ($1, $2, $3) RETURNING id', [name, username, pin]);
    res.json({ success: true, id: rows[0].id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/cashiers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, username, pin, is_active } = req.body;

  try {
    const { rows: cashiers } = await pool.query('SELECT * FROM cashiers WHERE id = $1', [id]);
    if (cashiers.length === 0) {
      return res.status(404).json({ error: 'Kasir tidak ditemukan' });
    }
    const cashier = cashiers[0];

    if (username && username !== cashier.username) {
      const { rows: existing } = await pool.query('SELECT id FROM cashiers WHERE username = $1 AND id != $2', [username, id]);
      if (existing.length > 0) {
        return res.status(400).json({ error: 'Username sudah digunakan' });
      }
    }

    const updatedName = name || cashier.name;
    const updatedUsername = username || cashier.username;
    const updatedPin = pin || cashier.pin;
    const updatedActive = is_active !== undefined ? is_active : cashier.is_active;

    await pool.query(
      'UPDATE cashiers SET name = $1, username = $2, pin = $3, is_active = $4 WHERE id = $5',
      [updatedName, updatedUsername, updatedPin, updatedActive, id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/cashiers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const { rows } = await pool.query('SELECT id FROM cashiers WHERE id = $1', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Kasir tidak ditemukan' });
    }
    await pool.query('DELETE FROM cashiers WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVE FRONTEND (Monolith Mode)
// ============================================

const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

  return app;
}

// ============================================
// INIT APP FOR VERCEL & LOCAL
// ============================================

const { pool, initDb } = require('./database');
const { paymentService } = require('./payment');

const app = createApp(pool, paymentService);

// Ensure DB is initialized before handling requests
// In serverless, it runs on first cold start.
initDb();

if (require.main === module) {
  const PORT = process.env.PORT || 3001;
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Server running at http://localhost:${PORT}`);
    console.log(`📦 Payment Gateway: ${process.env.PAYMENT_GATEWAY || 'simulated'}`);
    const distPath = path.join(__dirname, '..', 'dist');
    console.log(`🌐 Frontend served from: ${distPath}`);
  });
}

// Export for Vercel serverless functions
module.exports = app;
