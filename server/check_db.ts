
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    console.log("Connecting to:", process.env.DATABASE_URL?.split('@')[1]); // Log host part only for safety
    const res = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    console.log("Tables found:", res.rows.map(r => r.table_name));
    
    // Check specific columns in orders
    const columns = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'orders'
    `);
    console.log("Orders columns:", columns.rows.map(r => r.column_name));

  } catch (err) {
    console.error("Check failed:", err);
  } finally {
    await pool.end();
  }
}

check();
