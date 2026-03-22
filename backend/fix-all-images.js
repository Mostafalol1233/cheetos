import dotenv from 'dotenv';
import pkg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pkg;

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Map database image names to actual files in /public
const imageNameMappings = {
  'VALORANT': '/VALORANT.jpg',
  'PUBG_MOBILE': '/PUBG_MOBILE.jpg',
  'FREE_FIRE': '/FREE_FIRE.jpg',
  'FORTNITE': '/FORTNITE.jpg',
  'CLASH_ROYALE': '/CLASH_ROYALE.jpg',
  'APEX_LEGENDS': '/APEX_LEGENDS.png',
  'CALL_OF_DUTY': '/CALL_OF_DUTY.png',
  'COD_MOBILE': '/COD_MOBILE.png',
  'CROSSFIRE': '/CROSSFIRE.png',
  'ROBLOX': '/ROBLOX.png',
  'MINECRAFT': '/MINECRAFT.png',
  'LEAGUE_OF_LEGENDS': '/LEAGUE_OF_LEGENDS.png',
  'MOBILE_LEGENDS': '/MOBILE_LEGENDS.png'
};

async function fixAllImagePaths() {
  try {
    console.log('🔧 Fixing all image paths in database...\n');
    
    // Get all current games
    const allGames = await pool.query('SELECT id, name, image FROM games ORDER BY id');
    
    console.log(`Found ${allGames.rowCount} games\n`);
    
    let fixedCount = 0;
    const unhandledGames = [];
    
    for (const game of allGames.rows) {
      let newPath = null;
      
      // Try to find a match for this game
      for (const [pattern, correctPath] of Object.entries(imageNameMappings)) {
        if (game.name.toUpperCase().includes(pattern) || 
            game.image.includes(pattern)) {
          newPath = correctPath;
          break;
        }
      }
      
      // If still no match, use a placeholder from random images or try to find similar filename
      if (!newPath) {
        // Try to extract the actual filename from the path
        const match = game.image.match(/([A-Za-z0-9_\-]+)\.(jpg|png|webp)$/i);
        if (match && match[0]) {
          // Search for a file that starts with this pattern
          const randomImages = [
            '/29VN2MnJPsLm.jpg', '/5IdYpWiPNmzE.jpg', '/Z4sjX84G63jO.jpg',
            '/gv6sPf9ON595.jpg', '/LYZAxzSbJSIo.jpg', '/NYbqmtE1rZCb.jpg',
            '/3PUV4qNkMVDI.png', '/fJpYcbM9idap.png', '/sKBGSmAuiCFd.png'
          ];
          newPath = randomImages[Math.floor(Math.random() * randomImages.length)];
          unhandledGames.push({
            id: game.id,
            name: game.name,
            oldPath: game.image,
            newPath: newPath,
            reason: 'Using random placeholder'
          });
        }
      }
      
      if (newPath && newPath !== game.image) {
        await pool.query(
          'UPDATE games SET image = $1 WHERE id = $2',
          [newPath, game.id]
        );
        console.log(`✓ ${game.name}`);
        console.log(`  ${game.image} → ${newPath}\n`);
        fixedCount++;
      }
    }
    
    console.log(`\n✅ Fixed ${fixedCount} game image paths\n`);
    
    if (unhandledGames.length > 0) {
      console.log('⚠️  Games with placeholder images:');
      unhandledGames.forEach(game => {
        console.log(`  - ${game.name}: ${game.newPath}`);
      });
      console.log('');
    }
    
    // Verify all games now have valid paths
    const finalGames = await pool.query('SELECT name, image FROM games ORDER BY id');
    console.log('Final image paths:');
    finalGames.rows.forEach(row => {
      console.log(`  ${row.name}: ${row.image}`);
    });
    
    process.exit(0);
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

fixAllImagePaths();
