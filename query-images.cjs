const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    console.log('==========================================');
    console.log('        VEGETABLES - IMAGE URLS');
    console.log('==========================================\n');
    const vegRes = await pool.query('SELECT DISTINCT name, imageUrl FROM items WHERE category = $1 ORDER BY name', ['Vegetables']);
    vegRes.rows.forEach(row => {
      const photoId = row.imageUrl ? row.imageUrl.split('photo-')[1]?.split('?')[0] || 'UNKNOWN' : 'NO URL';
      console.log(`📦 ${row.name.padEnd(15)} | Photo ID: ${photoId}`);
      console.log(`   Full URL: ${row.imageUrl}\n`);
    });

    console.log('\n==========================================');
    console.log('         FRUITS - IMAGE URLS');
    console.log('==========================================\n');
    const fruitRes = await pool.query('SELECT DISTINCT name, imageUrl FROM items WHERE category = $1 ORDER BY name', ['Fruits']);
    fruitRes.rows.forEach(row => {
      const photoId = row.imageUrl ? row.imageUrl.split('photo-')[1]?.split('?')[0] || 'UNKNOWN' : 'NO URL';
      console.log(`📦 ${row.name.padEnd(15)} | Photo ID: ${photoId}`);
      console.log(`   Full URL: ${row.imageUrl}\n`);
    });

    console.log('\n==========================================');
    console.log('    FOCUS ITEMS (Requested Products)');
    console.log('==========================================\n');
    const focusItems = ['Tomato', 'Potato', 'Onion', 'Carrot', 'Apple', 'Banana', 'Orange'];
    const focusRes = await pool.query('SELECT name, imageUrl, category FROM items WHERE name = ANY($1) ORDER BY category, name', [focusItems]);
    focusRes.rows.forEach(row => {
      const photoId = row.imageUrl ? row.imageUrl.split('photo-')[1]?.split('?')[0] || 'UNKNOWN' : 'NO URL';
      console.log(`⭐ ${row.name.padEnd(15)} [${row.category}] | Photo ID: ${photoId}`);
      console.log(`   Full URL: ${row.imageUrl}\n`);
    });

    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
