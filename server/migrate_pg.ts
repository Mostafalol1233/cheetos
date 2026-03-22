
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import path from 'path';

// Load env from backend/.env
dotenv.config({ path: path.join(process.cwd(), 'backend', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // Neon/Supabase require SSL
});

async function main() {
  console.log("Migrating database using pg...");

  try {
    // Header Image Edits
    await pool.query(`
      CREATE TABLE IF NOT EXISTS header_image_edits (
        id SERIAL PRIMARY KEY,
        image_url TEXT NOT NULL,
        metadata TEXT,
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created header_image_edits table");

    // Game Packages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_packages (
        id SERIAL PRIMARY KEY,
        game_id VARCHAR(50),
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        price DECIMAL(10, 2) NOT NULL,
        discount_price DECIMAL(10, 2),
        bonus TEXT,
        image TEXT,
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created game_packages table");

    // Add columns to orders if they don't exist
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS guest_email TEXT,
      ADD COLUMN IF NOT EXISTS guest_phone TEXT,
      ADD COLUMN IF NOT EXISTS total_amount DECIMAL(10, 2),
      ADD COLUMN IF NOT EXISTS payment_proof_url TEXT,
      ADD COLUMN IF NOT EXISTS notes TEXT,
      ADD COLUMN IF NOT EXISTS audit_log TEXT;
    `);
    console.log("Updated orders table columns");
    
    // Add facebook_url to settings if it was missing
    await pool.query(`
        ALTER TABLE settings ADD COLUMN IF NOT EXISTS facebook_url TEXT;
    `);

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
