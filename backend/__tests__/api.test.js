const request = require('supertest');
const { createTestDb } = require('./setup');
const { SimulatedPayment } = require('../payment');
const { createApp } = require('../index');

let db;
let app;

beforeEach(() => {
  db = createTestDb();
  const paymentSvc = new SimulatedPayment();
  app = createApp(db, paymentSvc);
});

afterEach(() => {
  db.close();
});

// ============================================
// PRODUCTS API
// ============================================

describe('GET /api/products', () => {
  it('returns all products', async () => {
    const res = await request(app).get('/api/products');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBe(3);
  });

  it('parses modifiers JSON correctly', async () => {
    const res = await request(app).get('/api/products');
    const mieAyam = res.body.find((p) => p.title === 'Mie Ayam Bakso Spesial');
    expect(mieAyam).toBeDefined();
    expect(Array.isArray(mieAyam.modifiers)).toBe(true);
    expect(mieAyam.modifiers[0].id).toBe('porsi');
  });

  it('returns empty array for modifiers when product has none', async () => {
    const res = await request(app).get('/api/products');
    const mieGoreng = res.body.find((p) => p.title === 'Mie Goreng Jawa');
    expect(mieGoreng.modifiers).toEqual([]);
  });

  it('filters products by category_id', async () => {
    const res = await request(app).get('/api/products?category_id=mie-kuah');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].title).toBe('Mie Ayam Bakso Spesial');
  });

  it('returns all products when category_id is "all"', async () => {
    const res = await request(app).get('/api/products?category_id=all');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
  });
});

describe('POST /api/products', () => {
  it('creates a new product', async () => {
    const res = await request(app)
      .post('/api/products')
      .send({
        category_id: 'minuman',
        title: 'Es Jeruk',
        price: 12000,
        description: 'Jeruk segar',
        image: null,
        modifiers: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.id).toBeDefined();

    // Verify it was created
    const products = await request(app).get('/api/products?category_id=minuman');
    expect(products.body.length).toBe(2);
  });
});

describe('PUT /api/products/:id', () => {
  it('updates an existing product', async () => {
    const products = await request(app).get('/api/products');
    const firstId = products.body[0].id;

    const res = await request(app)
      .put(`/api/products/${firstId}`)
      .send({
        category_id: 'mie-kuah',
        title: 'Mie Ayam Updated',
        price: 30000,
        description: 'Updated desc',
        image: null,
        modifiers: [],
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify update
    const updated = await request(app).get('/api/products');
    const product = updated.body.find((p) => p.id === firstId);
    expect(product.title).toBe('Mie Ayam Updated');
    expect(product.price).toBe(30000);
  });
});

describe('DELETE /api/products/:id', () => {
  it('deletes a product', async () => {
    const products = await request(app).get('/api/products');
    const firstId = products.body[0].id;

    const res = await request(app).delete(`/api/products/${firstId}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify deletion
    const remaining = await request(app).get('/api/products');
    expect(remaining.body.length).toBe(2);
  });
});

// ============================================
// CATEGORIES API
// ============================================

describe('GET /api/categories', () => {
  it('returns all categories sorted by sort_order', async () => {
    const res = await request(app).get('/api/categories');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(3);
    expect(res.body[0].id).toBe('mie-kuah');
    expect(res.body[1].id).toBe('mie-goreng');
    expect(res.body[2].id).toBe('minuman');
  });
});

describe('POST /api/categories', () => {
  it('creates a new category', async () => {
    const res = await request(app)
      .post('/api/categories')
      .send({ id: 'cemilan', label: 'Cemilan', sort_order: 4 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const categories = await request(app).get('/api/categories');
    expect(categories.body.length).toBe(4);
  });
});

describe('PUT /api/categories/:id', () => {
  it('updates a category', async () => {
    const res = await request(app)
      .put('/api/categories/minuman')
      .send({ label: 'Minuman Segar', sort_order: 3 });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const categories = await request(app).get('/api/categories');
    const updated = categories.body.find((c) => c.id === 'minuman');
    expect(updated.label).toBe('Minuman Segar');
  });
});

describe('DELETE /api/categories/:id', () => {
  it('fails to delete category with products', async () => {
    const res = await request(app).delete('/api/categories/mie-kuah');
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Cannot delete');
  });

  it('deletes an empty category', async () => {
    // Create a category with no products
    await request(app)
      .post('/api/categories')
      .send({ id: 'empty-cat', label: 'Empty', sort_order: 99 });

    const res = await request(app).delete('/api/categories/empty-cat');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

// ============================================
// ORDERS API
// ============================================

describe('POST /api/orders', () => {
  it('creates a new order', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.orderId).toBeDefined();
  });

  it('returns 400 when no items are provided', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        total: 0,
        items: [],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('No items');
  });

  it('returns 400 when customer info is missing', async () => {
    const res = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('Customer name and phone required');
  });
});

describe('GET /api/orders/:id', () => {
  it('returns an order with items', async () => {
    // Create order first
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 33000,
        items: [
          { id: 1, title: 'Mie Ayam', price: 25000 },
          { id: 3, title: 'Es Teh', price: 8000 },
        ],
        customer_name: 'Siti',
        customer_phone: '08987654321',
      });

    const orderId = createRes.body.orderId;
    const res = await request(app).get(`/api/orders/${orderId}`);

    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.customer_name).toBe('Siti');
    expect(res.body.items).toHaveLength(2);
    expect(res.body.total).toBe(33000);
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).get('/api/orders/99999');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders', () => {
  beforeEach(async () => {
    // Create two orders
    await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08111111111',
      });

    await request(app)
      .post('/api/orders')
      .send({
        total: 8000,
        items: [{ id: 3, title: 'Es Teh', price: 8000 }],
        customer_name: 'Siti',
        customer_phone: '08222222222',
      });
  });

  it('returns all orders', async () => {
    const res = await request(app).get('/api/orders');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);
  });

  it('filters orders by status', async () => {
    const res = await request(app).get('/api/orders?status=pending');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(2);

    const confirmed = await request(app).get('/api/orders?status=confirmed');
    expect(confirmed.body.length).toBe(0);
  });
});

describe('GET /api/orders/search', () => {
  let orderId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    orderId = createRes.body.orderId;
  });

  it('finds order by ID', async () => {
    const res = await request(app).get(`/api/orders/search?id=${orderId}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(orderId);
    expect(res.body.customer_name).toBe('Budi');
    expect(res.body.items).toBeDefined();
  });

  it('returns 404 for non-existent order ID', async () => {
    const res = await request(app).get('/api/orders/search?id=99999');
    expect(res.status).toBe(404);
  });

  it('finds orders by phone number', async () => {
    const res = await request(app).get('/api/orders/search?phone=08123456789');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThanOrEqual(1);
  });

  it('returns 404 for non-matching phone', async () => {
    const res = await request(app).get('/api/orders/search?phone=00000000000');
    expect(res.status).toBe(404);
  });

  it('returns 400 when no search parameter provided', async () => {
    const res = await request(app).get('/api/orders/search');
    expect(res.status).toBe(400);
  });
});

describe('POST /api/orders/:id/pay', () => {
  let orderId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    orderId = createRes.body.orderId;
  });

  it('processes payment and confirms order', async () => {
    const res = await request(app).post(`/api/orders/${orderId}/pay`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Number(res.body.orderId)).toBe(Number(orderId));

    // Verify order status changed to confirmed
    const order = await request(app).get(`/api/orders/${orderId}`);
    expect(order.body.status).toBe('confirmed');
    expect(order.body.payment_status).toBe('success');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).post('/api/orders/99999/pay');
    expect(res.status).toBe(404);
  });

  it('returns 400 if order is already processed', async () => {
    // Pay first
    await request(app).post(`/api/orders/${orderId}/pay`);
    // Try to pay again
    const res = await request(app).post(`/api/orders/${orderId}/pay`);
    expect(res.status).toBe(400);
    expect(res.body.error).toContain('already processed');
  });
});

describe('PUT /api/orders/:id/complete', () => {
  let orderId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    orderId = createRes.body.orderId;
    // Confirm via payment
    await request(app).post(`/api/orders/${orderId}/pay`);
  });

  it('marks order as completed', async () => {
    const res = await request(app).put(`/api/orders/${orderId}/complete`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const order = await request(app).get(`/api/orders/${orderId}`);
    expect(order.body.status).toBe('completed');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).put('/api/orders/99999/complete');
    expect(res.status).toBe(404);
  });
});

describe('POST /api/orders/:id/confirm-payment', () => {
  let orderId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    orderId = createRes.body.orderId;
  });

  it('confirms payment from frontend callback', async () => {
    const res = await request(app).post(`/api/orders/${orderId}/confirm-payment`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const order = await request(app).get(`/api/orders/${orderId}`);
    expect(order.body.status).toBe('confirmed');
    expect(order.body.payment_status).toBe('success');
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app).post('/api/orders/99999/confirm-payment');
    expect(res.status).toBe(404);
  });
});

describe('GET /api/orders/confirmed', () => {
  it('returns confirmed orders with items', async () => {
    // Create and pay for an order
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    const orderId = createRes.body.orderId;
    await request(app).post(`/api/orders/${orderId}/pay`);

    const res = await request(app).get('/api/orders/confirmed');
    expect(res.status).toBe(200);
    expect(res.body.length).toBe(1);
    expect(res.body[0].items).toBeDefined();
    expect(res.body[0].items.length).toBeGreaterThan(0);
  });
});

describe('POST /api/orders/:id/add-items', () => {
  let orderId;

  beforeEach(async () => {
    const createRes = await request(app)
      .post('/api/orders')
      .send({
        total: 25000,
        items: [{ id: 1, title: 'Mie Ayam', price: 25000 }],
        customer_name: 'Budi',
        customer_phone: '08123456789',
      });
    orderId = createRes.body.orderId;
    // Pay to confirm
    await request(app).post(`/api/orders/${orderId}/pay`);
  });

  it('adds items to an existing order', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/add-items`)
      .send({
        items: [{ id: 3, title: 'Es Teh', price: 8000 }],
        extraTotal: 8000,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify items and total updated
    const order = await request(app).get(`/api/orders/${orderId}`);
    expect(order.body.items.length).toBe(2);
    expect(order.body.total).toBe(33000);
  });

  it('marks addon items with is_addon flag', async () => {
    await request(app)
      .post(`/api/orders/${orderId}/add-items`)
      .send({
        items: [{ id: 3, title: 'Es Teh', price: 8000 }],
        extraTotal: 8000,
      });

    const order = await request(app).get(`/api/orders/${orderId}`);
    const addonItem = order.body.items.find((i) => i.product_title === 'Es Teh');
    expect(addonItem.is_addon).toBe(1);
  });

  it('returns 400 when no items provided', async () => {
    const res = await request(app)
      .post(`/api/orders/${orderId}/add-items`)
      .send({ items: [], extraTotal: 0 });

    expect(res.status).toBe(400);
  });

  it('returns 404 for non-existent order', async () => {
    const res = await request(app)
      .post('/api/orders/99999/add-items')
      .send({
        items: [{ id: 3, title: 'Es Teh', price: 8000 }],
        extraTotal: 8000,
      });

    expect(res.status).toBe(404);
  });

  it('returns 400 for completed order', async () => {
    // Complete the order first
    await request(app).put(`/api/orders/${orderId}/complete`);

    const res = await request(app)
      .post(`/api/orders/${orderId}/add-items`)
      .send({
        items: [{ id: 3, title: 'Es Teh', price: 8000 }],
        extraTotal: 8000,
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('completed');
  });
});

// ============================================
// ADMIN API
// ============================================

describe('POST /api/admin/login', () => {
  it('returns success for correct PIN', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ pin: '1234' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  it('returns 401 for incorrect PIN', async () => {
    const res = await request(app)
      .post('/api/admin/login')
      .send({ pin: '0000' });

    expect(res.status).toBe(401);
    expect(res.body.error).toContain('Invalid PIN');
  });
});

describe('GET /api/admin/stats', () => {
  it('returns dashboard statistics', async () => {
    const res = await request(app).get('/api/admin/stats');

    expect(res.status).toBe(200);
    expect(res.body.totalProducts).toBe(3);
    expect(res.body.totalCategories).toBe(3);
    expect(typeof res.body.todayOrdersCount).toBe('number');
    expect(typeof res.body.todayRevenue).toBe('number');
    expect(typeof res.body.pendingOrders).toBe('number');
  });
});

// ============================================
// PAYMENT CONFIG API
// ============================================

describe('GET /api/payment/client-key', () => {
  it('returns payment config', async () => {
    const res = await request(app).get('/api/payment/client-key');

    expect(res.status).toBe(200);
    expect(res.body.gateway).toBeDefined();
    expect(typeof res.body.isProduction).toBe('boolean');
  });
});

describe('POST /api/payment/webhook', () => {
  it('processes webhook payload', async () => {
    const res = await request(app)
      .post('/api/payment/webhook')
      .send({ orderId: 1 });

    expect(res.status).toBe(200);
    expect(res.body.received).toBe(true);
  });
});
