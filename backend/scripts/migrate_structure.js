
import pool from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gamesFilePath = path.join(__dirname, '..', 'data', 'games.json');

const migrate = async () => {
  try {
    console.log('Starting migration...');

    // 1. Create game_packages table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS game_packages (
        id SERIAL PRIMARY KEY,
        game_id TEXT REFERENCES games(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        price NUMERIC DEFAULT 0,
        discount_price NUMERIC,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('Created game_packages table.');

    // 2. Add columns to games if missing (for safety)
    // We assume games table exists from init_db.js

    // 3. Read games.json
    if (!fs.existsSync(gamesFilePath)) {
      console.log('games.json not found. Skipping data migration.');
      return;
    }
    const data = fs.readFileSync(gamesFilePath, 'utf8');
    const games = JSON.parse(data) || [];

    console.log(`Found ${games.length} games to migrate.`);

    for (const game of games) {
      // Upsert game
      const { 
        id, name, slug, description, price, currency, image, category, 
        isPopular, is_popular, stock, discountPrice, 
        packages, packagePrices, packageDiscountPrices, discountPrices,
        packageThumbnails, package_thumbnails
      } = game;

      const popular = isPopular || is_popular || false;
      const dPrice = discountPrice ? Number(discountPrice) : null;

      await pool.query(`
        INSERT INTO games (id, name, slug, description, price, currency, image, category, is_popular, stock, discount_price)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          slug = EXCLUDED.slug,
          description = EXCLUDED.description,
          price = EXCLUDED.price,
          currency = EXCLUDED.currency,
          image = EXCLUDED.image,
          category = EXCLUDED.category,
          is_popular = EXCLUDED.is_popular,
          stock = EXCLUDED.stock,
          discount_price = EXCLUDED.discount_price;
      `, [id, name, slug, description || '', Number(price) || 0, currency || 'EGP', image || '', category || 'other', popular, Number(stock) || 0, dPrice]);

      // Handle packages
      // Clear existing packages for this game to avoid duplication on re-run
      await pool.query('DELETE FROM game_packages WHERE game_id = $1', [id]);

      const pkgNames = Array.isArray(packages) ? packages : [];
      const pkgPrices = Array.isArray(packagePrices) ? packagePrices : [];
      const pkgDiscounts = Array.isArray(packageDiscountPrices) ? packageDiscountPrices : (Array.isArray(discountPrices) ? discountPrices : []);
      const pkgImages = Array.isArray(packageThumbnails) ? packageThumbnails : (Array.isArray(package_thumbnails) ? package_thumbnails : []);

      for (let i = 0; i < pkgNames.length; i++) {
        const pName = pkgNames[i];
        const pPrice = Number(pkgPrices[i] || 0);
        const pDiscount = pkgDiscounts[i] ? Number(pkgDiscounts[i]) : null;
        const pImage = pkgImages[i] || null;

        if (pName) {
            await pool.query(`
                INSERT INTO game_packages (game_id, name, price, discount_price, image)
                VALUES ($1, $2, $3, $4, $5)
            `, [id, pName, pPrice, pDiscount, pImage]);
        }
      }
    }

    console.log('Migration completed successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
  } finally {
    process.exit(0); // db.js pool keeps process alive
  }
};

migrate();
