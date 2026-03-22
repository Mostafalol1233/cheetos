import pkg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pkg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function insertGames() {
  try {
    const result = await pool.query(`
      INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, packages, package_prices) 
      VALUES 
        ('gildand', 'Gildand Gifteming Store', 'gildand-gifteming', 'Gildand Gift Cards & Vouchers', 300.00, 'EGP', '/attached_assets/Gildand.png', 'gift-cards', true, 90, ARRAY['500 EGP','1000 EGP','2500 EGP','5000 EGP'], ARRAY['300.00','600.00','1500.00','3000.00']),
        ('xbox-live', 'XBOX LIVE', 'xbox-live', 'Xbox Live Gold & Game Pass', 250.00, 'EGP', '/XBOX.png', 'online-games', true, 75, ARRAY['1 Month','3 Months','12 Months'], ARRAY['250.00','600.00','2000.00'])
      ON CONFLICT (id) DO NOTHING
      RETURNING *;
    `);

    console.log('✓ Games inserted successfully:');
    result.rows.forEach(row => {
      console.log(`  - ${row.name} (${row.slug})`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error inserting games:', err.message);
    process.exit(1);
  }
}

insertGames();
