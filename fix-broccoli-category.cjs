const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    console.log('Fixing broccoli category...\n');

    // Update broccoli items to have "Vegetables" category
    const result = await pool.query(
      `UPDATE items SET category = $1 WHERE name = $2 AND (category = $3 OR category = $4)`,
      ['Vegetables', 'Broccoli', '', null]
    );

    console.log(`✓ Updated ${result.rowCount} broccoli items with category "Vegetables"`);
    console.log('\n✅ Broccoli category fixed!');
    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
