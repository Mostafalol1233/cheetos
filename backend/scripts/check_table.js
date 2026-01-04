
import pool from '../db.js';

(async () => {
  try {
    const res = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'game_packages'
      );
    `);
    console.log('Table game_packages exists:', res.rows[0].exists);
    process.exit(0);
  } catch (err) {
    console.error('Check failed:', err);
    process.exit(1);
  }
})();
