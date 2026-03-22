
import pool, { preferIPv4 } from './backend/db.js';

async function main() {
  await preferIPv4();
  try {
    const res = await pool.query(`
      SELECT id, name, slug, packages, package_prices, package_discount_prices 
      FROM games 
      WHERE slug = 'crossfire' OR name = 'Crossfire' OR name = 'CROSSFIRE'
    `);
    
    if (res.rows.length === 0) {
      console.log('No Crossfire game found in DB');
    } else {
      console.log('Found Crossfire game(s):');
      res.rows.forEach(row => {
        console.log('ID:', row.id);
        console.log('Name:', row.name);
        console.log('Slug:', row.slug);
        console.log('Packages:', JSON.stringify(row.packages, null, 2));
        console.log('Package Prices:', JSON.stringify(row.package_prices, null, 2));
        console.log('Package Discount Prices:', JSON.stringify(row.package_discount_prices, null, 2));
      });
    }
  } catch (err) {
    console.error(err);
  } finally {
    await pool.end();
  }
}

main();
