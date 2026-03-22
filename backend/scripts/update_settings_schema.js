
import pool from '../db.js';

const run = async () => {
  console.log('Updating settings table schema...');
  
  try {
    // 1. Check if settings table exists
    const checkTable = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'settings'
      );
    `);

    if (!checkTable.rows[0].exists) {
      console.log('Settings table does not exist. Creating it...');
      await pool.query(`
        CREATE TABLE settings (
          id VARCHAR(50) PRIMARY KEY DEFAULT 'default',
          primary_color VARCHAR(50),
          accent_color VARCHAR(50),
          logo_url TEXT,
          header_image_url TEXT,
          whatsapp_number VARCHAR(50),
          trust_badges JSONB,
          footer_text TEXT,
          bonus_percent DECIMAL(5,2) DEFAULT 0,
          updated_at TIMESTAMP DEFAULT NOW()
        )
      `);
      // Insert default row if needed
      await pool.query(`
        INSERT INTO settings (id, primary_color, accent_color) 
        VALUES ('default', '#0066FF', '#FFCC00') 
        ON CONFLICT DO NOTHING
      `);
    }

    // 2. Add new columns if they don't exist
    const columns = [
      'header_heading_text TEXT',
      'header_button_text TEXT',
      'header_button_url TEXT'
    ];

    for (const colDef of columns) {
      const colName = colDef.split(' ')[0];
      try {
        await pool.query(`ALTER TABLE settings ADD COLUMN ${colDef}`);
        console.log(`Added column: ${colName}`);
      } catch (err) {
        if (err.code === '42701') { // duplicate_column
          console.log(`Column already exists: ${colName}`);
        } else {
          console.error(`Error adding column ${colName}:`, err.message);
        }
      }
    }

    console.log('Schema update complete.');
    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err);
    process.exit(1);
  }
};

run();
