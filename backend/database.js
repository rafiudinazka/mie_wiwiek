const Database = require('better-sqlite3');
const path = require('path');

// Support custom DB path via env var (useful for Railway volumes)
const dbPath = process.env.DB_PATH || path.join(__dirname, 'pemesanan.db');
const db = new Database(dbPath);

// Initialize Schema
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

  CREATE TABLE IF NOT EXISTS cashiers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    username TEXT NOT NULL UNIQUE,
    pin TEXT NOT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS admin_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
  );
`);

// Migration: Add new columns if they don't exist
const columns = db.prepare("PRAGMA table_info(orders)").all();
const columnNames = columns.map(col => col.name);

if (!columnNames.includes('customer_name')) {
  db.exec('ALTER TABLE orders ADD COLUMN customer_name TEXT');
}
if (!columnNames.includes('customer_phone')) {
  db.exec('ALTER TABLE orders ADD COLUMN customer_phone TEXT');
}
if (!columnNames.includes('payment_method')) {
  db.exec('ALTER TABLE orders ADD COLUMN payment_method TEXT DEFAULT "simulated"');
}
if (!columnNames.includes('payment_transaction_id')) {
  db.exec('ALTER TABLE orders ADD COLUMN payment_transaction_id TEXT');
}
if (!columnNames.includes('payment_status')) {
  db.exec('ALTER TABLE orders ADD COLUMN payment_status TEXT DEFAULT "pending"');
}
if (!columnNames.includes('updated_at')) {
  db.exec('ALTER TABLE orders ADD COLUMN updated_at DATETIME DEFAULT CURRENT_TIMESTAMP');
}

// Migration: Add new columns to order_items if needed
const itemColumns = db.prepare("PRAGMA table_info(order_items)").all();
const itemColumnNames = itemColumns.map(col => col.name);

if (!itemColumnNames.includes('product_title')) {
  db.exec('ALTER TABLE order_items ADD COLUMN product_title TEXT');
}
if (!itemColumnNames.includes('modifiers_json')) {
  db.exec('ALTER TABLE order_items ADD COLUMN modifiers_json TEXT');
}
if (!itemColumnNames.includes('is_addon')) {
  db.exec('ALTER TABLE order_items ADD COLUMN is_addon BOOLEAN DEFAULT 0');
}

// Migration: Add is_available column to products if needed
const productColumns = db.prepare("PRAGMA table_info(products)").all();
const productColumnNames = productColumns.map(col => col.name);

if (!productColumnNames.includes('is_available')) {
  db.exec('ALTER TABLE products ADD COLUMN is_available INTEGER DEFAULT 1');
}

// Seed Data if empty
const count = db.prepare('SELECT count(*) as count FROM categories').get();
if (count.count === 0) {
  console.log('Seeding database...');
  
  const insertCategory = db.prepare('INSERT INTO categories (id, label, sort_order) VALUES (?, ?, ?)');
  const insertProduct = db.prepare('INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES (?, ?, ?, ?, ?, ?)');

  const categories = [
    { id: 'mie-kuah', label: 'Mie Kuah', sort_order: 1 },
    { id: 'mie-goreng', label: 'Mie Goreng', sort_order: 2 },
    { id: 'topping', label: 'Topping', sort_order: 3 },
    { id: 'minuman', label: 'Minuman', sort_order: 4 },
    { id: 'cemilan', label: 'Cemilan', sort_order: 5 },
  ];

  categories.forEach(c => insertCategory.run(c.id, c.label, c.sort_order));

  const products = [
    // === MIE KUAH ===
    { 
      category_id: 'mie-kuah', 
      title: "Mie Ayam Bakso Spesial", 
      price: 25000, 
      description: "Mie ayam dengan bakso sapi jumbo, pangsit goreng, dan kuah kaldu gurih.",
      image: "/images/mie_ayam_bakso_1781020663641.webp",
      modifiers: JSON.stringify([
        { id: 'porsi', name: 'Porsi', required: true, options: [
          { label: 'Regular', price: 0 },
          { label: 'Jumbo', price: 8000 }
        ]},
        { id: 'mie', name: 'Jenis Mie', required: true, options: [
          { label: 'Mie Keriting', price: 0 },
          { label: 'Mie Lurus', price: 0 },
          { label: 'Mie Lebar', price: 0 }
        ]},
        { id: 'level', name: 'Level Pedas', required: false, options: [
          { label: 'Tidak Pedas', price: 0 },
          { label: 'Pedas Sedang', price: 0 },
          { label: 'Pedas Mantap', price: 0 },
          { label: 'Pedas Gila', price: 2000 }
        ]}
      ])
    },
    { 
      category_id: 'mie-kuah', 
      title: "Mie Yamin Komplit", 
      price: 28000, 
      description: "Mie yamin manis dengan ayam suwir, bakso, pangsit rebus, dan kuah terpisah.",
      image: "/images/mie_yamin_komplit_1781020736159.webp",
      modifiers: JSON.stringify([
        { id: 'porsi', name: 'Porsi', required: true, options: [
          { label: 'Regular', price: 0 },
          { label: 'Jumbo', price: 8000 }
        ]}
      ])
    },
    { 
      category_id: 'mie-kuah', 
      title: "Mie Kocok Bandung", 
      price: 30000, 
      description: "Mie lebar dengan kikil sapi, tauge, dan kuah kaldu sapi yang kaya rasa.",
      image: "/images/mie_kocok_bandung_1781020834237.webp",
      modifiers: null
    },
    { 
      category_id: 'mie-kuah', 
      title: "Soto Mie Bogor", 
      price: 28000, 
      description: "Mie kuning dengan risol, daging sapi, kikil, tomat, dan kuah santan gurih.",
      image: "/images/soto_mie_bogor_1781020757875.webp",
      modifiers: null
    },
    { 
      category_id: 'mie-kuah', 
      title: "Mie Celor Palembang", 
      price: 26000, 
      description: "Mie khas Palembang dengan kuah udang kental, telur, dan tauge.",
      image: "/images/mie_celor_palembang_1781020846324.webp",
      modifiers: null
    },

    // === MIE GORENG ===
    { 
      category_id: 'mie-goreng', 
      title: "Mie Goreng Jawa", 
      price: 22000, 
      description: "Mie goreng bumbu kecap manis khas Jawa dengan telur, sayuran, dan kerupuk.",
      image: "/images/mie_goreng_jawa_1781020674734.webp",
      modifiers: JSON.stringify([
        { id: 'level', name: 'Level Pedas', required: true, options: [
          { label: 'Tidak Pedas', price: 0 },
          { label: 'Pedas Sedang', price: 0 },
          { label: 'Pedas Mantap', price: 0 }
        ]},
        { id: 'tambahan', name: 'Tambahan', required: false, options: [
          { label: 'Telur Ceplok', price: 5000 },
          { label: 'Ayam Suwir', price: 8000 },
          { label: 'Sosis', price: 6000 }
        ]}
      ])
    },
    { 
      category_id: 'mie-goreng', 
      title: "Mie Goreng Aceh", 
      price: 30000, 
      description: "Mie tebal goreng dengan bumbu rempah khas Aceh, seafood, dan acar timun.",
      image: "/images/mie_goreng_aceh_1781020747769.webp",
      modifiers: JSON.stringify([
        { id: 'protein', name: 'Pilihan Protein', required: true, options: [
          { label: 'Seafood', price: 0 },
          { label: 'Ayam', price: 0 },
          { label: 'Daging Sapi', price: 5000 },
          { label: 'Campur', price: 5000 }
        ]}
      ])
    },
    { 
      category_id: 'mie-goreng', 
      title: "Mie Tek-Tek", 
      price: 20000, 
      description: "Mie goreng legendaris ala gerobak dengan telur, sayuran, dan bumbu rahasia.",
      image: "/images/mie_tek_tek_1781020858366.webp",
      modifiers: null
    },
    { 
      category_id: 'mie-goreng', 
      title: "Indomie Goreng Double", 
      price: 18000, 
      description: "Dua bungkus Indomie goreng dimasak dengan telur, sosis, dan sayuran segar.",
      image: "/images/indomie_goreng_double_1781020871853.webp",
      modifiers: JSON.stringify([
        { id: 'tambahan', name: 'Tambahan', required: false, options: [
          { label: 'Telur Mata Sapi', price: 4000 },
          { label: 'Keju Mozarella', price: 7000 },
          { label: 'Kornet', price: 6000 }
        ]}
      ])
    },

    // === TOPPING ===
    { 
      category_id: 'topping', 
      title: "Bakso Sapi Jumbo (3 pcs)", 
      price: 12000, 
      description: "Bakso sapi premium ukuran jumbo, kenyal dan gurih.",
      image: "/images/bakso_sapi_jumbo_1781020883882.webp",
      modifiers: null
    },
    { 
      category_id: 'topping', 
      title: "Pangsit Goreng (5 pcs)", 
      price: 10000, 
      description: "Pangsit goreng renyah berisi daging ayam cincang.",
      image: "/images/pangsit_goreng_1781020904989.webp",
      modifiers: null
    },
    { 
      category_id: 'topping', 
      title: "Telur Rebus", 
      price: 5000, 
      description: "Telur ayam rebus setengah matang.",
      image: "/images/telur_rebus_1781020917976.webp",
      modifiers: null
    },
    { 
      category_id: 'topping', 
      title: "Ceker Ayam (2 pcs)", 
      price: 8000, 
      description: "Ceker ayam empuk yang dimasak bersama bumbu rempah.",
      image: "/images/ceker_ayam_1781020930321.webp",
      modifiers: null
    },

    // === MINUMAN ===
    { 
      category_id: 'minuman', 
      title: "Es Teh Manis", 
      price: 8000, 
      description: "Teh manis segar dengan es batu, penyegar setelah makan mie pedas.",
      image: "/images/es_teh_manis_1781020687153.webp",
      modifiers: JSON.stringify([
        { id: 'suhu', name: 'Suhu', required: true, options: [
          { label: 'Dingin', price: 0 },
          { label: 'Hangat', price: 0 }
        ]}
      ])
    },
    { 
      category_id: 'minuman', 
      title: "Es Jeruk Peras", 
      price: 12000, 
      description: "Jeruk segar diperas langsung dengan gula asli dan es batu.",
      image: "/images/es_jeruk_peras_1781020769727.webp",
      modifiers: null
    },
    { 
      category_id: 'minuman', 
      title: "Es Cincau Hijau", 
      price: 10000, 
      description: "Cincau hijau segar dengan santan, gula merah, dan es batu.",
      modifiers: null
    },
    { 
      category_id: 'minuman', 
      title: "Teh Botol", 
      price: 6000, 
      description: "Teh botol kemasan original, dingin menyegarkan.",
      modifiers: null
    },

    // === CEMILAN ===
    { 
      category_id: 'cemilan', 
      title: "Lumpia Goreng (4 pcs)", 
      price: 15000, 
      description: "Lumpia goreng isi rebung dan udang, disajikan dengan saus sambal.",
      image: "/images/lumpia_goreng_1781020714218.webp",
      modifiers: null
    },
    { 
      category_id: 'cemilan', 
      title: "Tahu Goreng Crispy", 
      price: 12000, 
      description: "Tahu sutra goreng renyah dengan taburan bumbu kacang dan kecap.",
      image: "/images/tahu_goreng_crispy_1781020780907.webp",
      modifiers: null
    },
    { 
      category_id: 'cemilan', 
      title: "Siomay Bandung (5 pcs)", 
      price: 18000, 
      description: "Siomay ikan tenggiri dengan kentang, tahu, pare, telur, dan bumbu kacang.",
      image: "/images/siomay_bandung_1781020701411.webp",
      modifiers: null
    },
  ];

  products.forEach(p => insertProduct.run(
    p.category_id, 
    p.title, 
    p.price, 
    p.description, 
    p.image || null,
    p.modifiers || null
  ));
  
  console.log('Database seeded successfully.');
}

// Seed default admin settings if empty
const adminCount = db.prepare('SELECT count(*) as count FROM admin_settings').get();
if (adminCount.count === 0) {
  console.log('Seeding admin settings...');
  const insertSetting = db.prepare('INSERT OR IGNORE INTO admin_settings (key, value) VALUES (?, ?)');
  insertSetting.run('admin_pin', '1234');
  insertSetting.run('security_question', '');
  insertSetting.run('security_answer', '');
  console.log('Admin settings seeded (default PIN: 1234).');
}

// Seed default cashier if empty
const cashierCount = db.prepare('SELECT count(*) as count FROM cashiers').get();
if (cashierCount.count === 0) {
  console.log('Seeding default cashier account...');
  db.prepare('INSERT INTO cashiers (name, username, pin, is_active) VALUES (?, ?, ?, ?)').run('Kasir 1', 'kasir1', '0000', 1);
  console.log('Default cashier seeded (username: kasir1, PIN: 0000).');
}

module.exports = db;
