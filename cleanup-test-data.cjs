const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    console.log('Cleaning up old test data...');
    
    // First delete all sales_items for test customers
    await pool.query(`
      DELETE FROM sale_items WHERE sale_id IN (
        SELECT s.id FROM sales s
        JOIN users u ON s.user_id = u.id
        WHERE u.role = 'customer' AND (u.username LIKE 'today_customer_%' OR u.username LIKE 'regular_customer_%')
      )
    `);
    
    // Delete all sales for test customers
    await pool.query(`
      DELETE FROM sales WHERE user_id IN (
        SELECT id FROM users WHERE role = 'customer' AND (username LIKE 'today_customer_%' OR username LIKE 'regular_customer_%')
      )
    `);
    
    // Delete all test customer users
    const result = await pool.query(
      "DELETE FROM users WHERE role = 'customer' AND (username LIKE 'today_customer_%' OR username LIKE 'regular_customer_%')"
    );
    console.log(`Deleted ${result.rowCount} old test customer records`);
    
    await pool.end();
    console.log('Done!');
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
