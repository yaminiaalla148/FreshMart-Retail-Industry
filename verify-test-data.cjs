const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    const res = await pool.query(
      "SELECT username, name, phone FROM users WHERE role = 'customer' AND username LIKE 'today_customer_%' ORDER BY id LIMIT 10"
    );
    console.log('\\n✅ Test Customers (with variable names and phone numbers):\\n');
    console.table(res.rows);
    await pool.end();
  } catch(e) {
    console.error('Error:', e);
    process.exit(1);
  }
})();
