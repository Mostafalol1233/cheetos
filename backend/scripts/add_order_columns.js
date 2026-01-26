import pool from '../db.js';

const migrate = async () => {
  try {
    console.log('Migrating orders table...');
    
    // Add player_id
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS player_id TEXT;
    `);
    console.log('Added player_id');

    // Add notes
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS notes TEXT;
    `);
    console.log('Added notes');

    // Add receipt_url
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS receipt_url TEXT;
    `);
    console.log('Added receipt_url');

    // Add payment_details
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS payment_details JSONB;
    `);
    console.log('Added payment_details');

    // Add delivery_method
    await pool.query(`
      ALTER TABLE orders 
      ADD COLUMN IF NOT EXISTS delivery_method TEXT;
    `);
    console.log('Added delivery_method');

    console.log('Migration complete');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0);
  }
};

migrate();
