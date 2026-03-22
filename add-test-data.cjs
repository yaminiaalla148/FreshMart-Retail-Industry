const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    console.log('Adding comprehensive test data...\n');

    // Ensure salary column exists on users table
    await pool.query("ALTER TABLE users ADD COLUMN IF NOT EXISTS salary integer;");

    // Get all users (managers)
    const usersRes = await pool.query('SELECT id, branch_id FROM users WHERE role = $1 ORDER BY branch_id', ['branch_manager']);
    const managers = usersRes.rows;

    // Get items for each branch
    const itemsRes = await pool.query(`
      SELECT DISTINCT i.id, i.name, i.price, i.stock, f.branch_id 
      FROM items i 
      JOIN racks r ON i.rack_id = r.id
      JOIN floors f ON r.floor_id = f.id
      ORDER BY f.branch_id, i.id
    `);
    const items = itemsRes.rows;

    // Get branches
    const branchesRes = await pool.query('SELECT id, name FROM branches');
    const branches = branchesRes.rows;

    for (const branch of branches) {
      console.log(`\n📍 Processing ${branch.name} (Branch ${branch.id})...`);
      // --- Create branch manager and sales staff ---
      // Manager username and creation (salary 50000)
      const managerUsername = `manager_branch_${branch.id}`;
      const managerName = `Manager ${branch.name.replace(/[^a-zA-Z0-9 ]/g, '')}`;
      await pool.query(
        `INSERT INTO users (username, password, role, name, branch_id, salary)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, password = EXCLUDED.password, salary = EXCLUDED.salary`,
        [managerUsername, 'manager123', 'branch_manager', managerName, branch.id, 50000]
      );

      // Sales staff names pools
      const maleNames = ['Suresh Kumar','Vijay Singh','Ramesh Iyer','Amit Shah','Karan Patel','Deepak Verma','Sunil Rao'];
      const femaleNames = ['Sneha Sharma','Priya Nair','Meera Desai','Anita Kapoor','Rekha Sen','Divya Joshi','Pooja Reddy'];

      // For alternating distribution: branch index parity
      const branchIndex = branches.findIndex(b => b.id === branch.id);
      let maleCount = 3, femaleCount = 2;
      if (branchIndex % 2 === 1) { // for second, fourth... branches, invert
        maleCount = 2; femaleCount = 3;
      }

      const createRandomSalary = () => Math.floor(Math.random() * (30000 - 10000 + 1)) + 10000;

      // create male staff
      for (let m = 0; m < maleCount; m++) {
        const name = maleNames[(branch.id + m) % maleNames.length] + ` (M)`;
        const username = `sales_m_${branch.id}_${m}`;
        const salary = createRandomSalary();
        await pool.query(
          `INSERT INTO users (username, password, role, name, branch_id, salary)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, salary = EXCLUDED.salary`,
          [username, 'sales123', 'sales_staff', name, branch.id, salary]
        );
      }

      // create female staff
      for (let f = 0; f < femaleCount; f++) {
        const name = femaleNames[(branch.id + f) % femaleNames.length] + ` (F)`;
        const username = `sales_f_${branch.id}_${f}`;
        const salary = createRandomSalary();
        await pool.query(
          `INSERT INTO users (username, password, role, name, branch_id, salary)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (username) DO UPDATE SET name = EXCLUDED.name, salary = EXCLUDED.salary`,
          [username, 'sales123', 'sales_staff', name, branch.id, salary]
        );
      }
      
      const branchItems = items.filter(i => i.branch_id === branch.id);
      if (branchItems.length === 0) {
        console.log('  ⚠️  No items found for this branch');
        continue;
      }

      // 1. Update 5 items to have low stock (< 10)
      const lowStockItems = branchItems.slice(0, 5);
      for (const item of lowStockItems) {
        await pool.query('UPDATE items SET stock = $1 WHERE id = $2', [
          Math.floor(Math.random() * 8) + 1, // 1-8 units
          item.id
        ]);
      }
      console.log(`  ✓ Updated 5 items with low stock`);

      // 2. Create 10 today's customers with purchases
      const todayCustomerNames = ['Rajesh Kumar', 'customer2', 'Priya Singh', 'customer4', 'Amit Patel',
                                  'customer6', 'Vikram Gupta', 'customer8', 'Sana Khan', 'customer10'];
      
      const generatePhone = () => {
        return '9' + Math.floor(Math.random() * 900000000 + 100000000).toString().padStart(9, '0');
      };
      
      for (let i = 0; i < 10; i++) {
        // Create/get customer
        const custName = todayCustomerNames[i] || `customer${i + 1}`;
        // Generate phone number for all customers
        const custPhone = generatePhone();
        const custRes = await pool.query(
          `INSERT INTO users (username, role, name, phone, branch_id) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (username) DO UPDATE SET name=$3 RETURNING id`,
          [`today_customer_${branch.id}_${i}`, 'customer', custName, custPhone, branch.id]
        );
        const customerId = custRes.rows[0].id;

        // Create sale for today with amount capped at 5000 rupees
        const saleItems = [];
        let totalAmount = 0;
        const itemCount = Math.floor(Math.random() * 8) + 2; // 2-9 items per purchase
        const maxSaleAmount = 5000; // Cap at 5000
        
        for (let j = 0; j < itemCount; j++) {
          const randomItem = branchItems[Math.floor(Math.random() * branchItems.length)];
          const qty = Math.floor(Math.random() * 4) + 1; // 1-4 quantity
          const price = randomItem.price * (1 - (Math.random() * 0.1));
          const itemCost = price * qty;
          
          // Only add if it stays within 5000
          if (totalAmount + itemCost <= maxSaleAmount) {
            totalAmount += itemCost;
            saleItems.push({ itemId: randomItem.id, quantity: qty, price });
          }
        }

        // Insert sale
        const saleRes = await pool.query(
          `INSERT INTO sales (branch_id, user_id, total_amount, items_count, created_at) 
           VALUES ($1, $2, $3, $4, NOW()) RETURNING id`,
          [branch.id, customerId, Math.round(totalAmount), saleItems.length]
        );
        const saleId = saleRes.rows[0].id;

        // Add sale items
        for (const si of saleItems) {
          await pool.query(
            `INSERT INTO sale_items (sale_id, item_id, quantity, price_at_sale) 
             VALUES ($1, $2, $3, $4)`,
            [saleId, si.itemId, si.quantity, si.price]
          );
        }
      }
      console.log(`  ✓ Created 10 today's customers with purchases`);

      // 3. Create 30 regular customers (with multiple purchases, some from past)
      // Each customer billing distributed from 1000-5000 rupees
      const regularCustomerNames = ['Rajesh Kumar', 'customer12', 'Priya Singh', 'customer14', 'Amit Patel',
                                    'customer16', 'Vikram Gupta', 'customer18', 'Sana Khan', 'customer20',
                                    'Meera Desai', 'customer22', 'Rohan Sharma', 'customer24', 'Arjun Reddy',
                                    'customer26', 'Anjali Verma', 'customer28', 'Nitin Joshi', 'customer30',
                                    'Deepak Kumar', 'customer32', 'Pooja Nair', 'customer34', 'Suresh Reddy',
                                    'customer36', 'Neha Kapoor', 'customer38', 'Arun Singh', 'customer40'];
      
      for (let i = 0; i < 30; i++) {
        // Generate phone number for all customers
        const custPhone = generatePhone();
        const custRes = await pool.query(
          `INSERT INTO users (username, role, name, phone, branch_id) 
           VALUES ($1, $2, $3, $4, $5) 
           ON CONFLICT (username) DO UPDATE SET name=$3 RETURNING id`,
          [`regular_customer_${branch.id}_${i}`, 'customer', regularCustomerNames[i] || `customer${i + 11}`, custPhone, branch.id]
        );
        const customerId = custRes.rows[0].id;

        // Set target billing amount for this customer (1000-5000 range, distributed)
        const targetBilling = Math.random() < 0.25 
          ? Math.floor(Math.random() * 1500) + 1000      // 25% customers: 1000-2500
          : Math.random() < 0.5
          ? Math.floor(Math.random() * 1500) + 2500      // 25% customers: 2500-4000
          : Math.random() < 0.75
          ? Math.floor(Math.random() * 1000) + 3000      // 25% customers: 3000-4000
          : Math.floor(Math.random() * 1000) + 4000;     // 25% customers: 4000-5000
        
        // Create purchases to reach target billing
        const purchaseCount = Math.floor(Math.random() * 8) + 2; // 2-10 purchases
        let customerTotalSpent = 0;
        
        for (let p = 0; p < purchaseCount; p++) {
          // Stop if we've reached or exceeded target
          if (customerTotalSpent >= targetBilling) break;
          
          const remainingBudget = targetBilling - customerTotalSpent;
          
          const saleItems = [];
          let totalAmount = 0;
          const itemCount = Math.floor(Math.random() * 4) + 1; // 1-4 items per purchase
          
          for (let j = 0; j < itemCount; j++) {
            const randomItem = branchItems[Math.floor(Math.random() * branchItems.length)];
            const qty = Math.floor(Math.random() * 3) + 1; // 1-3 quantity
            const price = randomItem.price * (1 - (Math.random() * 0.15));
            const itemCost = price * qty;
            
            // Only add item if it doesn't exceed remaining budget
            if (totalAmount + itemCost <= remainingBudget) {
              totalAmount += itemCost;
              saleItems.push({ itemId: randomItem.id, quantity: qty, price });
            }
          }

          if (totalAmount > 0 && saleItems.length > 0) {
            customerTotalSpent += totalAmount;
            
            // Some sales today, some from past
            const daysAgo = p === 0 ? 0 : Math.floor(Math.random() * 30) + 1;
            const saleDate = new Date();
            saleDate.setDate(saleDate.getDate() - daysAgo);

            const saleRes = await pool.query(
              `INSERT INTO sales (branch_id, user_id, total_amount, items_count, created_at) 
               VALUES ($1, $2, $3, $4, $5) RETURNING id`,
              [branch.id, customerId, Math.round(totalAmount), saleItems.length, saleDate.toISOString()]
            );
            const saleId = saleRes.rows[0].id;

            for (const si of saleItems) {
              await pool.query(
                `INSERT INTO sale_items (sale_id, item_id, quantity, price_at_sale) 
                 VALUES ($1, $2, $3, $4)`,
                [saleId, si.itemId, si.quantity, si.price]
              );
            }
          }
        }
      }
      console.log(`  ✓ Created 30 regular customers with 5-20 purchases (up to ₹5000 each)`);

      // 4. SKIP additional sales that would exceed customer billing caps
      // (All sales are now within the 5000 rupee per-customer limit from sections 2-3)
    }

    console.log('\n✅ Test data added successfully!\n');
    await pool.end();
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
