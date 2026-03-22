import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { checkConnection } from './db.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get all available images from backend/public
function getAvailableImages() {
  const publicDir = path.join(__dirname, '..', 'public');
  try {
    if (!fs.existsSync(publicDir)) {
        console.warn('Public directory not found at:', publicDir);
        return [];
    }
    const files = fs.readdirSync(publicDir);
    return files.filter(f => /\.(jpg|jpeg|png|webp|gif)$/i.test(f));
  } catch (err) {
    console.error('Could not read public directory:', err.message);
    return [];
  }
}

async function updateProductImages() {
  try {
    console.log('🖼️  Updating product images from backend/public...\n');

    // Ensure DB connection
    const isConnected = await checkConnection(3, 2000);
    if (!isConnected) {
        console.error('❌ Skipping image seeding due to database connection failure.');
        process.exit(1);
    }

    const availableImages = getAvailableImages();
    console.log(`Found ${availableImages.length} images available\n`);

    if (availableImages.length === 0) {
      console.error('No images found in public directory');
      // Don't fail, just exit
      process.exit(0);
    }

    // Get all games
    const games = await pool.query('SELECT id, name FROM games ORDER BY id');
    console.log(`Updating ${games.rowCount} products...\n`);

    let updatedCount = 0;
    let imageIndex = 0;

    for (const game of games.rows) {
      // Cycle through available images
      const imageName = availableImages[imageIndex % availableImages.length];
      const imagePath = `/${imageName}`;

      await pool.query(
        'UPDATE games SET image = $1 WHERE id = $2',
        [imagePath, game.id]
      );

      console.log(`✓ ${game.name.substring(0, 50)}`);
      console.log(`  Image: ${imagePath}\n`);

      updatedCount++;
      imageIndex++;
    }

    console.log(`\n✅ Updated ${updatedCount} product images`);

    // Show sample of updated products
    const samples = await pool.query(`
      SELECT name, image FROM games 
      LIMIT 5
    `);

    console.log('\n📋 Sample products:');
    samples.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.image}`);
    });

    process.exit(0);
  } catch (err) {
    console.error('Error in seeding script:', err.message);
    process.exit(1);
  }
}

updateProductImages();
