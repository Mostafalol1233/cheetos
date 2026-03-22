
import pool from '../db.js';

async function addEmailVerified() {
  try {
    console.log('Adding email_verified column to users table...');
    await pool.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS email_verified BOOLEAN DEFAULT FALSE
    `);
    console.log('Column added successfully');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    process.exit(0);
  }
}

addEmailVerified();
