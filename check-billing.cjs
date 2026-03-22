const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    const res = await pool.query(`
      SELECT u.name, SUM(s.total_amount)::int as total 
      FROM users u 
      JOIN sales s ON u.id = s.user_id 
      WHERE u.role = 'customer' 
      GROUP BY u.id, u.name 
      ORDER BY total DESC 
      LIMIT 15
    `);
    
    console.log('\n✅ Top 15 Customers by Spending:\n');
    res.rows.forEach(r => {
      const exceedsBudget = r.total > 5000 ? ' ❌ EXCEEDS 5000!' : ' ✅';
      console.log(`  ${r.name.padEnd(20)} ₹${String(r.total).padStart(6)} ${exceedsBudget}`);
    });
    
    const exceeding = res.rows.filter(r => r.total > 5000);
    console.log(`\n📊 Summary: ${exceeding.length} customers exceed ₹5000 limit\n`);
    
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
