import pool from './db.js';

const createTables = async () => {
  try {
    console.log('Creating tables...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id TEXT PRIMARY KEY,
        action TEXT NOT NULL,
        summary TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS orders (
        id TEXT PRIMARY KEY,
        user_id TEXT,
        customer_name TEXT,
        customer_email TEXT,
        customer_phone TEXT,
        items JSONB,
        total_amount NUMERIC,
        currency TEXT DEFAULT 'EGP',
        status TEXT DEFAULT 'pending',
        payment_method TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        name TEXT,
        role TEXT DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS games (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        price NUMERIC,
        currency TEXT DEFAULT 'EGP',
        image TEXT,
        category TEXT,
        is_popular BOOLEAN DEFAULT FALSE,
        stock INTEGER DEFAULT 0,
        discount_price NUMERIC,
        packages JSONB,
        package_prices JSONB,
        package_discount_prices JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS categories (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        slug TEXT UNIQUE,
        description TEXT,
        image TEXT,
        gradient TEXT,
        icon TEXT
      );

      CREATE TABLE IF NOT EXISTS countdowns (
        id VARCHAR(50) PRIMARY KEY,
        title VARCHAR(120) NOT NULL,
        target_at TIMESTAMP NOT NULL,
        image_url TEXT,
        text TEXT,
        share_text TEXT,
        styles JSONB DEFAULT '{}',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('Tables created successfully');
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    // pool.end() might hang if there are active connections, but for a script it should be fine.
    // However, db.js exports a pool instance that might be shared. 
    // Since this is a standalone script run, we can just let the process exit or force exit.
    process.exit(0);
  }
};

createTables();
