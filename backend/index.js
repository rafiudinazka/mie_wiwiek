require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const db = require('./database');
const { paymentService } = require('./payment');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ============================================
// PRODUCTS API
// ============================================

app.get('/api/categories', (req, res) => {
  const categories = db.prepare('SELECT * FROM categories ORDER BY sort_order').all();
  res.json(categories);
});

app.get('/api/products', (req, res) => {
  const { category_id } = req.query;
  let query = 'SELECT * FROM products';
  const params = [];

  if (category_id && category_id !== 'all') {
    query += ' WHERE category_id = ?';
    params.push(category_id);
  }

  const products = db.prepare(query).all(...params);
  
  // Parse modifiers JSON
  const parsedProducts = products.map(p => ({
    ...p,
    modifiers: p.modifiers ? JSON.parse(p.modifiers) : []
  }));

  res.json(parsedProducts);
});

app.post('/api/products', (req, res) => {
  const { category_id, title, price, description, image, modifiers } = req.body;
  const stmt = db.prepare('INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)');
  try {
    const info = stmt.run(category_id, title, price, description, image, JSON.stringify(modifiers || []));
    res.json({ id: info.lastInsertRowid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const { category_id, title, price, description, image, modifiers } = req.body;
  const stmt = db.prepare('UPDATE products SET category_id = ?, title = ?, price = ?, description = ?, image = ?, modifiers = ? WHERE id = ?');
  try {
    stmt.run(category_id, title, price, description, image, JSON.stringify(modifiers || []), id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', (req, res) => {
  const { id } = req.params;
  const stmt = db.prepare('DELETE FROM products WHERE id = ?');
  try {
    stmt.run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// CATEGORIES API
// ============================================

app.post('/api/categories', (req, res) => {
  const { id, label, sort_order } = req.body;
  const stmt = db.prepare('INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)');
  try {
    stmt.run(id, label, sort_order || 0);
    res.json({ success: true, id });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  const { label, sort_order } = req.body;
  const stmt = db.prepare('UPDATE categories SET label = ?, sort_order = ? WHERE id = ?');
  try {
    stmt.run(label, sort_order, id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', (req, res) => {
  const { id } = req.params;
  // Check if category has products
  const products = db.prepare('SELECT COUNT(*) as count FROM products WHERE category_id = ?').get(id);
  if (products.count > 0) {
    return res.status(400).json({ error: 'Cannot delete category with products' });
  }
  const stmt = db.prepare('DELETE FROM categories WHERE id = ?');
  try {
    stmt.run(id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// ORDERS API
// ============================================

// Get all orders with optional status filter
app.get('/api/orders', (req, res) => {
  const { status, today } = req.query;
  let query = 'SELECT * FROM orders';
  const params = [];
  const conditions = [];

  if (status) {
    conditions.push('status = ?');
    params.push(status);
  }

  if (today === 'true') {
    conditions.push("DATE(created_at) = DATE('now', 'localtime')");
  }

  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }

  query += ' ORDER BY created_at DESC';

  try {
    const orders = db.prepare(query).all(...params);
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get confirmed orders (for cashier)
app.get('/api/orders/confirmed', (req, res) => {
  try {
    const orders = db.prepare(`
      SELECT * FROM orders 
      WHERE status = 'confirmed' 
      ORDER BY created_at ASC
    `).all();

    // Get items for each order
    const ordersWithItems = orders.map(order => {
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return { ...order, items };
    });

    res.json(ordersWithItems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Search order by ID (exact match)
app.get('/api/orders/search', (req, res) => {
  const { id, phone } = req.query;
  
  try {
    if (id) {
      // Search by order ID - exact match, single result
      const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
      if (!order) {
        return res.status(404).json({ error: 'Pesanan tidak ditemukan' });
      }
      const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
      return res.json({ ...order, items });
    }
    
    if (phone) {
      // Search by phone - may return multiple orders
      const orders = db.prepare(`
        SELECT * FROM orders 
        WHERE customer_phone LIKE ? 
        AND status IN ('pending', 'confirmed')
        ORDER BY created_at DESC 
        LIMIT 10
      `).all(`%${phone}%`);
      
      if (orders.length === 0) {
        return res.status(404).json({ error: 'Tidak ada pesanan aktif untuk nomor ini' });
      }
      
      // Attach items to each order
      const ordersWithItems = orders.map(order => {
        const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(order.id);
        return { ...order, items };
      });
      
      return res.json(ordersWithItems);
    }
    
    return res.status(400).json({ error: 'Parameter id atau phone diperlukan' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get single order with items
app.get('/api/orders/:id', (req, res) => {
  const { id } = req.params;
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }
    const items = db.prepare('SELECT * FROM order_items WHERE order_id = ?').all(id);
    res.json({ ...order, items });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create new order (status: pending, waiting for payment)
app.post('/api/orders', (req, res) => {
  const { total, items, customer_name, customer_phone } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items in order' });
  }

  if (!customer_name || !customer_phone) {
    return res.status(400).json({ error: 'Customer name and phone required' });
  }

  const insertOrder = db.prepare(`
    INSERT INTO orders (total, status, customer_name, customer_phone, payment_status) 
    VALUES (?, 'pending', ?, ?, 'pending')
  `);
  
  const insertItem = db.prepare(`
    INSERT INTO order_items (order_id, product_id, product_title, quantity, price_at_time, modifiers_json) 
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const transaction = db.transaction((orderItems) => {
    const info = insertOrder.run(total, customer_name, customer_phone);
    const orderId = info.lastInsertRowid;

    for (const item of orderItems) {
      insertItem.run(
        orderId, 
        item.id || null, 
        item.title,
        item.quantity || 1, 
        item.totalPrice || item.price,
        item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
      );
    }
    return orderId;
  });

  try {
    const orderId = transaction(items);
    res.json({ success: true, orderId });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// Add items to an existing order
app.post('/api/orders/:id/add-items', async (req, res) => {
  const { id } = req.params;
  const { items, extraTotal } = req.body;
  
  if (!items || items.length === 0) {
    return res.status(400).json({ error: 'No items to add' });
  }

  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'completed') {
      return res.status(400).json({ error: 'Cannot add items to a completed order' });
    }

    // Process payment for the extra total using payment service
    const paymentResult = await paymentService.createPayment(
      `${id}-addon-${Date.now()}`,
      extraTotal, 
      { name: order.customer_name, phone: order.customer_phone }
    );

    const insertItem = db.prepare(`
      INSERT INTO order_items (order_id, product_id, product_title, quantity, price_at_time, modifiers_json, is_addon) 
      VALUES (?, ?, ?, ?, ?, ?, 1)
    `);

    const processAddonItems = db.transaction((orderItems) => {
      for (const item of orderItems) {
        insertItem.run(
          id, 
          item.id || null, 
          item.title,
          item.quantity || 1, 
          item.totalPrice || item.price,
          item.selectedOptions ? JSON.stringify(item.selectedOptions) : null
        );
      }
      db.prepare('UPDATE orders SET total = total + ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?').run(extraTotal, id);
    });

    if (paymentResult.success) {
      if (paymentResult.snapToken) {
        processAddonItems(items);
        return res.json({ 
          success: true, 
          orderId: id,
          snapToken: paymentResult.snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
          redirectUrl: paymentResult.redirectUrl,
          message: 'Addon snap token created'
        });
      }

      processAddonItems(items);
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

// Process payment for an order
app.post('/api/orders/:id/pay', async (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status !== 'pending') {
      return res.status(400).json({ error: 'Order already processed' });
    }

    // Process payment using payment service
    const paymentResult = await paymentService.createPayment(
      id, 
      order.total, 
      { name: order.customer_name, phone: order.customer_phone }
    );

    if (paymentResult.success) {
      // For Midtrans: return snapToken, don't confirm yet (wait for webhook)
      if (paymentResult.snapToken) {
        // Save the midtrans order ID for webhook matching
        db.prepare(`
          UPDATE orders 
          SET payment_transaction_id = ?,
              payment_method = 'midtrans'
          WHERE id = ?
        `).run(paymentResult.transactionId, id);

        return res.json({ 
          success: true, 
          orderId: id,
          snapToken: paymentResult.snapToken,
          clientKey: process.env.MIDTRANS_CLIENT_KEY,
          redirectUrl: paymentResult.redirectUrl,
          message: 'Snap token created'
        });
      }

      // For simulated payment: confirm immediately
      db.prepare(`
        UPDATE orders 
        SET status = 'confirmed', 
            payment_status = 'success',
            payment_method = ?,
            payment_transaction_id = ?
        WHERE id = ?
      `).run(paymentResult.paymentMethod, paymentResult.transactionId, id);

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

// Mark order as completed (customer picked up)
app.put('/api/orders/:id/complete', (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare('UPDATE orders SET status = ? WHERE id = ?').run('completed', id);
    res.json({ success: true, message: 'Order completed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Confirm payment from frontend (after Snap popup success)
// This is needed because webhook can't reach localhost during development
app.post('/api/orders/:id/confirm-payment', (req, res) => {
  const { id } = req.params;
  
  try {
    const order = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    db.prepare(`
      UPDATE orders 
      SET status = 'confirmed', 
          payment_status = 'success'
      WHERE id = ?
    `).run(id);

    console.log(`✅ Order #${id} confirmed via frontend callback`);
    res.json({ success: true, message: 'Order confirmed' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Payment webhook (for Midtrans notifications)
app.post('/api/payment/webhook', async (req, res) => {
  try {
    const result = await paymentService.handleWebhook(req.body);
    console.log('📩 Webhook received:', result);
    
    if (result.status === 'success' && result.orderId) {
      db.prepare(`
        UPDATE orders 
        SET status = 'confirmed', 
            payment_status = 'success',
            payment_transaction_id = ?
        WHERE id = ?
      `).run(result.midtransOrderId || '', result.orderId);
      console.log(`✅ Order #${result.orderId} confirmed via webhook`);
    } else if (result.status === 'failed' && result.orderId) {
      db.prepare(`
        UPDATE orders 
        SET payment_status = 'failed'
        WHERE id = ?
      `).run(result.orderId);
      console.log(`❌ Order #${result.orderId} payment failed`);
    }
    
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook error:', err);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Get Midtrans client key for frontend
app.get('/api/payment/client-key', (req, res) => {
  res.json({ 
    clientKey: process.env.MIDTRANS_CLIENT_KEY || null,
    gateway: process.env.PAYMENT_GATEWAY || 'simulated',
    isProduction: process.env.NODE_ENV === 'production'
  });
});

// ============================================
// ADMIN API
// ============================================

app.post('/api/admin/login', (req, res) => {
  const { pin } = req.body;
  // Simple hardcoded PIN for now (1234)
  if (pin === '1234') {
    res.json({ success: true, token: 'admin-token-123' });
  } else {
    res.status(401).json({ error: 'Invalid PIN' });
  }
});

// Dashboard stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const totalProducts = db.prepare('SELECT COUNT(*) as count FROM products').get().count;
    const totalCategories = db.prepare('SELECT COUNT(*) as count FROM categories').get().count;
    
    const todayOrders = db.prepare(`
      SELECT COUNT(*) as count, COALESCE(SUM(total), 0) as revenue 
      FROM orders 
      WHERE DATE(created_at) = DATE('now', 'localtime')
      AND status IN ('confirmed', 'completed')
    `).get();

    const pendingOrders = db.prepare(`
      SELECT COUNT(*) as count FROM orders WHERE status = 'confirmed'
    `).get().count;

    res.json({
      totalProducts,
      totalCategories,
      todayOrdersCount: todayOrders.count,
      todayRevenue: todayOrders.revenue,
      pendingOrders
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ============================================
// SERVE FRONTEND (Monolith Mode)
// ============================================

// Serve static files from the built frontend
const distPath = path.join(__dirname, '..', 'dist');
app.use(express.static(distPath));

// SPA fallback: serve index.html for any non-API route
app.get('{*path}', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

// ============================================
// START SERVER
// ============================================

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
  console.log(`📦 Payment Gateway: ${process.env.PAYMENT_GATEWAY || 'simulated'}`);
  console.log(`🌐 Frontend served from: ${distPath}`);
});
