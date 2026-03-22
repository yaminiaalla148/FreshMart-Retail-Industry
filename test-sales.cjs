const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    // Get manager user
    const managerRes = await pool.query('SELECT id FROM users WHERE username = $1', ['manager1']);
    const customerId = managerRes.rows[0]?.id;
    
    // Get some items
    const itemRes = await pool.query('SELECT id FROM items LIMIT 5');
    const itemIds = itemRes.rows.map(r => r.id);
    
    if (!customerId || itemIds.length === 0) {
      console.log('Not enough data to create sales');
      await pool.end();
      return;
    }
    
    // Create 2 sales for today
    for (let s = 0; s < 2; s++) {
      const saleRes = await pool.query(
        'INSERT INTO sales (branch_id, user_id, total_amount, items_count, created_at) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [12, customerId, 500 + (s * 200), 5, new Date()]
      );
      const saleId = saleRes.rows[0].id;
      
      // Add items to sale
      for (let i = 0; i < itemIds.length; i++) {
        await pool.query(
          'INSERT INTO sale_items (sale_id, item_id, quantity, price_at_sale) VALUES ($1, $2, $3, $4)',
          [saleId, itemIds[i], i + 1, 100 + (i * 50)]
        );
      }
    }
    
    console.log('✓ Created test sales with items for branch 12');
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();
