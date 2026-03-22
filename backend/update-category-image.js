import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function updateCategoryImage() {
  try {
    console.log('🔄 Updating mobile-games category image...');
    
    const result = await pool.query(
      `UPDATE categories 
       SET image = $1 
       WHERE slug = 'mobile-games' 
       RETURNING *`,
      ['/attached_assets/MOBILE_LEGENDS.png']
    );

    if (result.rows.length > 0) {
      console.log('✓ Category updated:');
      console.log(result.rows[0]);
    } else {
      console.log('⚠ No mobile-games category found');
    }

    await pool.end();
    process.exit(0);
  } catch (err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
}

updateCategoryImage();
