
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

// Load env from root
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '../.env') });

const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function createTable() {
  try {
    console.log("Creating orders table...");
    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(255) PRIMARY KEY,
        user_id VARCHAR(255),
        customer_name VARCHAR(255),
        customer_email VARCHAR(255),
        customer_phone VARCHAR(255),
        items JSONB,
        total_amount DECIMAL(10, 2),
        currency VARCHAR(10) DEFAULT 'EGP',
        status VARCHAR(50),
        payment_method VARCHAR(50),
        notes TEXT,
        player_id VARCHAR(255),
        receipt_url TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log("Orders table created successfully");
  } catch (err) {
    console.error("Error creating table:", err);
  } finally {
    await pool.end();
    process.exit();
  }
}

createTable();
