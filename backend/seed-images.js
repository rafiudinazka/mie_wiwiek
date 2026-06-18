const db = require('./database');

const imageMap = [
  { title: 'Double Truffle Burger', image: '/images/double_truffle_burger.webp' },
  { title: 'Spicy Jalapeño Crisp',  image: '/images/spicy_jalapeno_crisp.webp' },
  { title: 'Classic Cheeseburger',  image: '/images/classic_cheeseburger.webp' },
  { title: 'Truffle Parmesan Fries',image: '/images/truffle_parmesan_fries.webp' },
  { title: 'Onion Rings',           image: '/images/onion_rings.webp' },
  { title: 'Craft Cola',            image: '/images/craft_cola.webp' },
  { title: 'Fresh Lemonade',        image: '/images/fresh_lemonade.webp' },
  { title: 'Chocolate Brownie',     image: '/images/chocolate_brownie.webp' },
];

const update = db.prepare('UPDATE products SET image = ? WHERE title = ?');

for (const item of imageMap) {
  const result = update.run(item.image, item.title);
  console.log(`✅ ${item.title} → ${item.image} (${result.changes} row updated)`);
}

console.log('\nDone! All product images have been updated.');
process.exit(0);
