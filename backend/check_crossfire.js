import pool from './db.js';

(async () => {
  try {
    const gameRes = await pool.query("SELECT id, name FROM games WHERE name ILIKE '%crossfire%'");
    console.log('Games matching Crossfire:', gameRes.rows);
    if (gameRes.rows.length > 0) {
      const gameId = gameRes.rows[0].id;
      const pkgRes = await pool.query('SELECT name, price, discount_price FROM game_packages WHERE game_id = $1', [gameId]);
      console.log('Packages for', gameRes.rows[0].name + ':', pkgRes.rows);
    }
  } catch (e) {
    console.error('Error:', e.message);
  }
  process.exit(0);
})();