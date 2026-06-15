const db = require('./database');

const imageMap = [
  { title: 'Double Truffle Burger', image: '/images/double_truffle_burger.png' },
  { title: 'Spicy Jalapeño Crisp',  image: '/images/spicy_jalapeno_crisp.png' },
  { title: 'Classic Cheeseburger',  image: '/images/classic_cheeseburger.png' },
  { title: 'Truffle Parmesan Fries',image: '/images/truffle_parmesan_fries.png' },
  { title: 'Onion Rings',           image: '/images/onion_rings.png' },
  { title: 'Craft Cola',            image: '/images/craft_cola.png' },
  { title: 'Fresh Lemonade',        image: '/images/fresh_lemonade.png' },
  { title: 'Chocolate Brownie',     image: '/images/chocolate_brownie.png' },
];

const update = db.prepare('UPDATE products SET image = ? WHERE title = ?');

for (const item of imageMap) {
  const result = update.run(item.image, item.title);
  console.log(`✅ ${item.title} → ${item.image} (${result.changes} row updated)`);
}

console.log('\nDone! All product images have been updated.');
process.exit(0);
