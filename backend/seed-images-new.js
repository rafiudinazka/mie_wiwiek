const db = require('./database');

const imageMap = [
  { title: 'Mie Kocok Bandung', image: '/images/mie_kocok_bandung_1781020834237.png' },
  { title: 'Mie Celor Palembang', image: '/images/mie_celor_palembang_1781020846324.png' },
  { title: 'Mie Tek-Tek', image: '/images/mie_tek_tek_1781020858366.png' },
  { title: 'Indomie Goreng Double', image: '/images/indomie_goreng_double_1781020871853.png' },
  { title: 'Bakso Sapi Jumbo (3 pcs)', image: '/images/bakso_sapi_jumbo_1781020883882.png' },
  { title: 'Pangsit Goreng (5 pcs)', image: '/images/pangsit_goreng_1781020904989.png' },
  { title: 'Telur Rebus', image: '/images/telur_rebus_1781020917976.png' },
  { title: 'Ceker Ayam (2 pcs)', image: '/images/ceker_ayam_1781020930321.png' },
  { title: 'Es Cincau Hijau', image: '/images/es_teh_manis_1781020687153.png' },
  { title: 'Teh Botol', image: '/images/es_teh_manis_1781020687153.png' }
];

const update = db.prepare('UPDATE products SET image = ? WHERE title = ?');

for (const item of imageMap) {
  const result = update.run(item.image, item.title);
  console.log(`✅ ${item.title} → ${item.image} (${result.changes} row updated)`);
}

console.log('\nDone! Selected product images have been updated.');
process.exit(0);
