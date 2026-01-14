import "dotenv/config";
import { pool } from "./db";
import { settings } from "@shared/settings-schema";

async function main() {
  console.log("Migrating database...");

  try {
    // Users
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(50) PRIMARY KEY,
        username VARCHAR(255) NOT NULL UNIQUE,
        password TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        role VARCHAR(50) DEFAULT 'user',
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created users table");

    // Chat Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(50) PRIMARY KEY,
        sender TEXT NOT NULL,
        message TEXT NOT NULL,
        timestamp INTEGER NOT NULL,
        session_id TEXT NOT NULL,
        user_id VARCHAR(50),
        read BOOLEAN DEFAULT false
      );
    `);
    console.log("Created chat_messages table");

    // Transactions
    await pool.query(`
      CREATE TABLE IF NOT EXISTS transactions (
        id VARCHAR(50) PRIMARY KEY,
        user_id VARCHAR(50),
        total_amount DECIMAL(10, 2) NOT NULL,
        status TEXT DEFAULT 'pending',
        items TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        customer_name TEXT,
        customer_phone TEXT,
        timestamp INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created transactions table");

    // WhatsApp Messages
    await pool.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_messages (
        id VARCHAR(50) PRIMARY KEY,
        wa_message_id TEXT,
        direction TEXT NOT NULL,
        from_phone TEXT,
        to_phone TEXT,
        message TEXT,
        timestamp INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
        status TEXT DEFAULT 'sent'
      );
    `);
    console.log("Created whatsapp_messages table");

    // Seller Alerts
    await pool.query(`
      CREATE TABLE IF NOT EXISTS seller_alerts (
        id VARCHAR(50) PRIMARY KEY,
        type TEXT NOT NULL,
        summary TEXT,
        read BOOLEAN DEFAULT false,
        flagged BOOLEAN DEFAULT false,
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created seller_alerts table");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(50) PRIMARY KEY,
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
        user_id VARCHAR(50),
        items TEXT NOT NULL,
        payment_method TEXT NOT NULL,
        status TEXT DEFAULT 'pending',
        player_id TEXT,
        server_id TEXT
      );
    `);
    console.log("Created orders table");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS hero_slides (
        id SERIAL PRIMARY KEY,
        created_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
        background_image_url TEXT,
        title_ar TEXT,
        title_en TEXT,
        promo_text_ar TEXT,
        promo_text_en TEXT,
        button_text TEXT,
        button_link TEXT,
        is_active BOOLEAN DEFAULT true,
        display_order INTEGER DEFAULT 0
      );
    `);
    console.log("Created hero_slides table");

    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id VARCHAR(50) PRIMARY KEY,
        primary_color VARCHAR(20) NOT NULL DEFAULT '#0066FF',
        accent_color VARCHAR(20) NOT NULL DEFAULT '#FFCC00',
        logo_url TEXT,
        header_image_url TEXT,
        whatsapp_number VARCHAR(32),
        trust_badges JSONB,
        footer_text TEXT,
        updated_at INTEGER DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      );
    `);
    console.log("Created settings table");

    console.log("Migration complete!");
    process.exit(0);
  } catch (err) {
    console.error("Migration failed:", err);
    process.exit(1);
  }
}

main();
