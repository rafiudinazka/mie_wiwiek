const Database = require('better-sqlite3');
const path = require('path');

/**
 * Create a fresh in-memory SQLite database with the same schema 
 * as the production database, seeded with minimal test data.
 * @returns {import('better-sqlite3').Database}
 */
function createTestDb() {
  const db = new Database(':memory:');

  // Schema (same as database.js)
  db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      sort_order INTEGER DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category_id TEXT NOT NULL,
      title TEXT NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      image TEXT,
      modifiers TEXT,
      FOREIGN KEY (category_id) REFERENCES categories(id)
    );

    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      total REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      customer_name TEXT,
      customer_phone TEXT,
      payment_method TEXT DEFAULT 'simulated',
      payment_transaction_id TEXT,
      payment_status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER,
      product_title TEXT NOT NULL,
      quantity INTEGER DEFAULT 1,
      price_at_time REAL NOT NULL,
      modifiers_json TEXT,
      is_addon BOOLEAN DEFAULT 0,
      FOREIGN KEY (order_id) REFERENCES orders(id)
    );
  `);

  // Seed minimal test data
  const insertCategory = db.prepare(
    'INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)'
  );
  const insertProduct = db.prepare(
    'INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)'
  );

  insertCategory.run('mie-kuah', 'Mie Kuah', 1);
  insertCategory.run('mie-goreng', 'Mie Goreng', 2);
  insertCategory.run('minuman', 'Minuman', 3);

  insertProduct.run(
    'mie-kuah',
    'Mie Ayam Bakso Spesial',
    25000,
    'Mie ayam dengan bakso sapi jumbo',
    null,
    JSON.stringify([
      {
        id: 'porsi',
        name: 'Porsi',
        required: true,
        options: [
          { label: 'Regular', price: 0 },
          { label: 'Jumbo', price: 8000 },
        ],
      },
    ])
  );

  insertProduct.run(
    'mie-goreng',
    'Mie Goreng Jawa',
    22000,
    'Mie goreng bumbu kecap manis',
    null,
    null
  );

  insertProduct.run(
    'minuman',
    'Es Teh Manis',
    8000,
    'Teh manis segar',
    null,
    null
  );

  return db;
}

module.exports = { createTestDb };
