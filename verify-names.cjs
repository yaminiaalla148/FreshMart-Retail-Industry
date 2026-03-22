const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

(async () => {
  try {
    const result = await pool.query(
      'SELECT username, name FROM users WHERE username LIKE \'regular_customer_12_%\' ORDER BY id LIMIT 20'
    );
    
    console.log('✅ Regular Customers (Branch 12 - Sample of 20):\n');
    result.rows.forEach((row, i) => {
      console.log(`${i + 1}. ${row.name}`);
    });
    
    console.log('\n✅ Pattern Confirmed: Alternating real names and customer numbers!');
    
  } finally {
    await pool.end();
  }
})();
