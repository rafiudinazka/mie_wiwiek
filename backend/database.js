const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.warn("⚠️ DATABASE_URL belum diatur di environment/file .env!");
}

const pool = new Pool({
  connectionString,
  ssl: connectionString && connectionString.includes('supabase') ? { rejectUnauthorized: false } : false
});

const initDb = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS categories (
        id VARCHAR(255) PRIMARY KEY,
        label VARCHAR(255) NOT NULL,
        sort_order INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS products (
        id SERIAL PRIMARY KEY,
        category_id VARCHAR(255) NOT NULL,
        title VARCHAR(255) NOT NULL,
        price REAL NOT NULL,
        description TEXT,
        image TEXT,
        modifiers TEXT,
        is_available BOOLEAN DEFAULT TRUE,
        FOREIGN KEY (category_id) REFERENCES categories(id)
      );

      CREATE TABLE IF NOT EXISTS orders (
        id SERIAL PRIMARY KEY,
        total REAL NOT NULL,
        status VARCHAR(50) DEFAULT 'pending',
        customer_name VARCHAR(255),
        customer_phone VARCHAR(50),
        payment_method VARCHAR(50) DEFAULT 'simulated',
        payment_transaction_id VARCHAR(255),
        payment_status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS order_items (
        id SERIAL PRIMARY KEY,
        order_id INTEGER NOT NULL,
        product_id INTEGER,
        product_title VARCHAR(255) NOT NULL,
        quantity INTEGER DEFAULT 1,
        price_at_time REAL NOT NULL,
        modifiers_json TEXT,
        is_addon BOOLEAN DEFAULT FALSE,
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS cashiers (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        username VARCHAR(255) NOT NULL UNIQUE,
        pin VARCHAR(255) NOT NULL,
        is_active INTEGER DEFAULT 1,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS admin_settings (
        key VARCHAR(255) PRIMARY KEY,
        value TEXT NOT NULL
      );
    `);

    // Seed Data if empty
    const countRes = await pool.query('SELECT count(*) as count FROM categories');
    if (parseInt(countRes.rows[0].count) === 0) {
      console.log('Seeding database...');
      
      const categories = [
        { id: 'mie-kuah', label: 'Mie Kuah', sort_order: 1 },
        { id: 'mie-goreng', label: 'Mie Goreng', sort_order: 2 },
        { id: 'topping', label: 'Topping', sort_order: 3 },
        { id: 'minuman', label: 'Minuman', sort_order: 4 },
        { id: 'cemilan', label: 'Cemilan', sort_order: 5 },
      ];

      for (const c of categories) {
        await pool.query('INSERT INTO categories (id, label, sort_order) VALUES ($1, $2, $3)', [c.id, c.label, c.sort_order]);
      }

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
        }
      ];

      for (const p of products) {
        await pool.query(
          'INSERT INTO products (category_id, title, price, description, image, modifiers) VALUES ($1, $2, $3, $4, $5, $6)',
          [p.category_id, p.title, p.price, p.description, p.image || null, p.modifiers || null]
        );
      }
      
      console.log('Database seeded successfully.');
    }

    // Seed default admin settings if empty
    const adminCount = await pool.query('SELECT count(*) as count FROM admin_settings');
    if (parseInt(adminCount.rows[0].count) === 0) {
      console.log('Seeding admin settings...');
      await pool.query(`
        INSERT INTO admin_settings (key, value) VALUES 
        ('admin_pin', '1234'),
        ('security_question', ''),
        ('security_answer', '')
        ON CONFLICT (key) DO NOTHING
      `);
      console.log('Admin settings seeded (default PIN: 1234).');
    }

    // Seed default cashier if empty
    const cashierCount = await pool.query('SELECT count(*) as count FROM cashiers');
    if (parseInt(cashierCount.rows[0].count) === 0) {
      console.log('Seeding default cashier account...');
      await pool.query('INSERT INTO cashiers (name, username, pin, is_active) VALUES ($1, $2, $3, $4)', ['Kasir 1', 'kasir1', '0000', 1]);
      console.log('Default cashier seeded (username: kasir1, PIN: 0000).');
    }

    console.log('Database connected and initialized successfully (PostgreSQL).');
  } catch (error) {
    console.error('Failed to initialize database:', error);
  }
};

module.exports = { pool, initDb };
