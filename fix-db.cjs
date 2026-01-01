const { Pool } = require('pg');
const path = require('path');
// Load backend .env specifically to target the correct database
const dotenv = require('dotenv');
const envConfig = dotenv.config({ path: path.resolve(__dirname, 'backend', '.env') });

// If DATABASE_URL is not set from backend/.env, try root .env but log warning
if (!process.env.DATABASE_URL) {
  console.log('Backend .env did not provide DATABASE_URL, trying root .env');
  dotenv.config({ path: path.resolve(__dirname, '.env') });
}

console.log('Using DATABASE_URL host:', new URL(process.env.DATABASE_URL).host);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixDb() {
  try {
    console.log('Connecting to DB...');
    const client = await pool.connect();
    console.log('Connected.');

    console.log('Dropping games table to reset schema...');
    await client.query('DROP TABLE IF EXISTS games CASCADE');
    await client.query('DROP TABLE IF EXISTS game_cards CASCADE'); // Also drop dependent/related tables if needed

    console.log('Recreating games table...');
    await client.query(`
      CREATE TABLE games (
        id VARCHAR(50) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        slug VARCHAR(255) UNIQUE NOT NULL,
        description TEXT NOT NULL DEFAULT '',
        price DECIMAL(10, 2) DEFAULT 0,
        currency VARCHAR(10) DEFAULT 'EGP',
        image VARCHAR(255),
        image_url TEXT,
        category VARCHAR(100),
        category_id VARCHAR(50),
        is_popular BOOLEAN DEFAULT false,
        stock INTEGER DEFAULT 100,
        stock_amount INTEGER DEFAULT 0,
        packages JSONB DEFAULT '[]',
        package_prices JSONB DEFAULT '[]',
        package_discount_prices JSONB DEFAULT '[]',
        discount_price DECIMAL(10, 2),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    console.log('Table recreated with correct schema.');
    
    // Verify
    const res2 = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'games';
    `);
    console.log('New columns:', res2.rows.map(r => `${r.column_name}(${r.data_type})`).join(', '));

    client.release();
  } catch (err) {
    console.error('Error:', err);
  } finally {
    await pool.end();
  }
}

fixDb();
