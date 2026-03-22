const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pool = new Pool({ connectionString: 'postgresql://postgres:Hani%401434@localhost:5432/smart_store' });

(async () => {
  try {
    // Load user-provided mapping if exists
    const mappingPath = path.join(__dirname, 'server', 'image-mapping.json');
    let updates = null;

    if (fs.existsSync(mappingPath)) {
      const raw = fs.readFileSync(mappingPath, 'utf8');
      try {
        updates = JSON.parse(raw);
        console.log(`Using image mapping from ${mappingPath} (${updates.length} entries)`);
      } catch (e) {
        console.error('Failed to parse image-mapping.json:', e.message);
        process.exit(1);
      }
    }

    // Fallback built-in updates (keeps existing behavior)
    if (!updates) {
      updates = [
        { name: 'Tomato', url: 'https://picsum.photos/seed/tomato/400/400' },
        { name: 'Potato', url: 'https://picsum.photos/seed/potato/400/400' },
        { name: 'Onion', url: 'https://picsum.photos/seed/onion/400/400' },
        { name: 'Carrot', url: 'https://picsum.photos/seed/carrot/400/400' },
        { name: 'Cabbage', url: 'https://picsum.photos/seed/cabbage/400/400' },
        { name: 'Broccoli', url: 'https://picsum.photos/seed/broccoli/400/400' },
        { name: 'Bell Pepper', url: 'https://picsum.photos/seed/bell-pepper/400/400' },
        { name: 'Cauliflower', url: 'https://picsum.photos/seed/cauliflower/400/400' },
        { name: 'Cucumber', url: 'https://picsum.photos/seed/cucumber/400/400' },
        { name: 'Apple', url: 'https://picsum.photos/seed/apple/400/400' },
        { name: 'Banana', url: 'https://picsum.photos/seed/banana/400/400' },
        { name: 'Orange', url: 'https://picsum.photos/seed/orange/400/400' },
        { name: 'Mango', url: 'https://picsum.photos/seed/mango/400/400' },
        { name: 'Grapes', url: 'https://picsum.photos/seed/grapes/400/400' }
      ];
      console.log('No custom mapping found — using picsum seeds fallback');
    }

    let totalUpdated = 0;

    for (const update of updates) {
      const result = await pool.query(
        'UPDATE items SET image_url = $1 WHERE name = $2',
        [update.url, update.name]
      );
      totalUpdated += result.rowCount;
      console.log(`✓ ${update.name}: ${result.rowCount} row(s) updated`);
    }

    console.log(`\n📊 Total rows updated: ${totalUpdated}`);
    await pool.end();
  } catch (e) {
    console.error('Error:', e.message);
    process.exit(1);
  }
})();