import dotenv from 'dotenv';
import pkg from 'pg';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Mapping of old paths to new correct paths
const imageMappings = {
  'VALORANT': '/VALORANT.jpg',
  'PUBG_MOBILE': '/PUBG_MOBILE.jpg',
  'FREE_FIRE': '/FREE_FIRE.jpg',
  'FORTNITE': '/FORTNITE.jpg',
  'CLASH_ROYALE': '/CLASH_ROYALE.jpg',
  'MOBILE_LEGENDS': '/MOBILE_LEGENDS.png'
};

async function fixImagePaths() {
  try {
    console.log('Fixing image paths...\n');
    
    // Fix games table image paths
    for (const [oldPath, newPath] of Object.entries(imageMappings)) {
      const result = await pool.query(
        `UPDATE games SET image = $1 WHERE image LIKE $2 OR image LIKE $3`,
        [newPath, `%${oldPath}%`, `%${oldPath.replace(/_/g, ' ')}%`]
      );
      if (result.rowCount > 0) {
        console.log(`✓ Updated ${result.rowCount} game(s) with ${oldPath} → ${newPath}`);
      }
    }

    // Fix category images
    const categoryMappings = {
      'MOBILE_LEGENDS': '/MOBILE_LEGENDS.png'
    };

    for (const [oldName, newPath] of Object.entries(categoryMappings)) {
      const result = await pool.query(
        `UPDATE categories SET image = $1 WHERE slug = 'mobile-games'`,
        [newPath]
      );
      if (result.rowCount > 0) {
        console.log(`✓ Updated ${result.rowCount} category image to ${newPath}`);
      }
    }

    // Verify all images now point to /public
    const games = await pool.query(`
      SELECT id, name, image FROM games 
      WHERE image NOT LIKE 'https://%' 
      ORDER BY id
    `);

    console.log('\nVerifying images:');
    const issues = [];
    for (const game of games.rows) {
      if (!game.image.startsWith('/')) {
        issues.push(`${game.name}: ${game.image}`);
      }
    }

    if (issues.length > 0) {
      console.log('\n⚠️  Games with potentially incorrect paths:');
      issues.forEach(issue => console.log(`  - ${issue}`));
    } else {
      console.log('✓ All local image paths are correct\n');
    }

    // Show sample of updated games
    const samples = await pool.query(`
      SELECT name, image FROM games 
      WHERE image NOT LIKE 'https://%'
      LIMIT 5
    `);
    
    console.log('Sample games after fix:');
    samples.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.image}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixImagePaths();
