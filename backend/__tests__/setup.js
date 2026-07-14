const Database = require('better-sqlite3');

/**
 * Create a mock pg Pool that wraps an in-memory SQLite database.
 * This lets us run the async PostgreSQL-style route handlers
 * against a fast, local, in-memory database for testing.
 */
function createTestPool() {
  const db = new Database(':memory:');

  // Schema – mirrors database.js but in SQLite dialect
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
      is_available BOOLEAN DEFAULT 1,
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

    CREATE TABLE IF NOT EXISTS admin_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );

    CREATE TABLE IF NOT EXISTS cashiers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      username TEXT UNIQUE NOT NULL,
      pin TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Seed test data
  db.prepare('INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)').run('mie-kuah', 'Mie Kuah', 1);
  db.prepare('INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)').run('mie-goreng', 'Mie Goreng', 2);
  db.prepare('INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)').run('minuman', 'Minuman', 3);

  db.prepare('INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)')
    .run('mie-kuah', 'Mie Ayam Bakso Spesial', 25000, 'Mie ayam dengan bakso sapi jumbo', null,
      JSON.stringify([{ id: 'porsi', name: 'Porsi', required: true, options: [{ label: 'Regular', price: 0 }, { label: 'Jumbo', price: 8000 }] }]));
  db.prepare('INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)')
    .run('mie-goreng', 'Mie Goreng Jawa', 22000, 'Mie goreng bumbu kecap manis', null, null);
  db.prepare('INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)')
    .run('minuman', 'Es Teh Manis', 8000, 'Teh manis segar', null, null);

  db.prepare("INSERT INTO admin_settings (key, value) VALUES ('admin_pin', '1234')").run();

  db.prepare('INSERT INTO cashiers (name, username, pin) VALUES (?, ?, ?)').run('Kasir Test', 'kasir1', '0000');

  /**
   * Convert PostgreSQL-style $1, $2 placeholders to SQLite ? placeholders,
   * and handle PostgreSQL-specific SQL that SQLite doesn't understand.
   */
  function convertQuery(sql) {
    // Replace $1, $2, ... with ?
    let converted = sql.replace(/\$\d+/g, '?');

    // Handle INSERT ... ON CONFLICT ... DO UPDATE SET value = EXCLUDED.value
    // SQLite supports INSERT OR REPLACE for simple upserts
    if (converted.includes('ON CONFLICT')) {
      converted = converted.replace(
        /INSERT INTO (\w+) \(([^)]+)\) VALUES \(([^)]+)\)\s+ON CONFLICT \((\w+)\) DO UPDATE SET value = EXCLUDED\.value/gi,
        'INSERT OR REPLACE INTO $1 ($2) VALUES ($3)'
      );
    }

    // Handle RETURNING id -> we handle this by returning lastInsertRowid
    const hasReturning = /RETURNING\s+id/i.test(converted);
    converted = converted.replace(/\s+RETURNING\s+id/gi, '');

    // Handle AT TIME ZONE for date filtering
    converted = converted.replace(/DATE\(created_at AT TIME ZONE '[^']+'\)/g, "DATE(created_at, 'localtime')");
    converted = converted.replace(/CURRENT_DATE/g, "DATE('now', 'localtime')");

    // Handle TRUE/FALSE -> 1/0
    converted = converted.replace(/= TRUE/g, '= 1');
    converted = converted.replace(/, TRUE\)/g, ', 1)');

    return { sql: converted, hasReturning };
  }

  /**
   * Mock pool.query(sql, params) – returns { rows: [...] }
   */
  async function query(sql, params = []) {
    const { sql: convertedSql, hasReturning } = convertQuery(sql);
    const trimmed = convertedSql.trim().toUpperCase();

    if (trimmed.startsWith('SELECT') || trimmed.startsWith('WITH')) {
      const rows = db.prepare(convertedSql).all(...params);
      return { rows };
    } else {
      const info = db.prepare(convertedSql).run(...params);
      if (hasReturning) {
        return { rows: [{ id: info.lastInsertRowid }] };
      }
      return { rows: [], rowCount: info.changes };
    }
  }

  /**
   * Mock pool.connect() – returns a client with query(), release(), and transaction support
   */
  async function connect() {
    return {
      query: async (sql, params = []) => query(sql, params),
      release: () => {},
    };
  }

  function end() {
    db.close();
  }

  return { query, connect, end, _db: db };
}

module.exports = { createTestPool };
