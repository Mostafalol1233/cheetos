import dotenv from 'dotenv';
import pool, { checkConnection } from './db.js';

dotenv.config();

// Real products data
const products = [
  {
    product_id: "CF_ZP_5000",
    category: "Game Top-Up Cards / Credits",
    product_name: "CrossFire ZP",
    denomination: "5000 ZP",
    platform: "PC",
    price_EGP: 149,
    stock_estimate: 1000,
    notes: "Approximate market price for digital code/top-up."
  },
  {
    product_id: "CF_ZP_10000",
    category: "Game Top-Up Cards / Credits",
    product_name: "CrossFire ZP",
    denomination: "10000 ZP",
    platform: "PC",
    price_EGP: 215,
    stock_estimate: 800,
    notes: "Approximate market price for digital code/top-up."
  },
  {
    product_id: "CF_ZP_100000",
    category: "Game Top-Up Cards / Credits",
    product_name: "CrossFire ZP",
    denomination: "100000 ZP",
    platform: "PC",
    price_EGP: 2400,
    stock_estimate: 300,
    notes: "Approximate market price for digital code/top-up."
  },
  {
    product_id: "FF_DIAMONDS_100",
    category: "Game Top-Up Cards / Credits",
    product_name: "Free Fire Diamonds",
    denomination: "100 Diamonds",
    platform: "Mobile (iOS/Android)",
    price_EGP: 105,
    stock_estimate: 2500,
    notes: "Approximate market price for digital top-up."
  },
  {
    product_id: "FF_DIAMONDS_530",
    category: "Game Top-Up Cards / Credits",
    product_name: "Free Fire Diamonds",
    denomination: "530 Diamonds",
    platform: "Mobile (iOS/Android)",
    price_EGP: 470,
    stock_estimate: 1800,
    notes: "Approximate market price for digital top-up."
  },
  {
    product_id: "FF_DIAMONDS_1080",
    category: "Game Top-Up Cards / Credits",
    product_name: "Free Fire Diamonds",
    denomination: "1080 Diamonds",
    platform: "Mobile (iOS/Android)",
    price_EGP: 580,
    stock_estimate: 1200,
    notes: "Approximate market price for digital top-up."
  },
  {
    product_id: "PUBG_UC_60",
    category: "Game Top-Up Cards / Credits",
    product_name: "PUBG Mobile UC",
    denomination: "60 UC",
    platform: "Mobile (iOS/Android)",
    price_EGP: 45,
    stock_estimate: 5000,
    notes: "Official Midasbuy price."
  },
  {
    product_id: "PUBG_UC_325",
    category: "Game Top-Up Cards / Credits",
    product_name: "PUBG Mobile UC",
    denomination: "325 UC",
    platform: "Mobile (iOS/Android)",
    price_EGP: 225,
    stock_estimate: 3500,
    notes: "Estimated price based on official Midasbuy rates."
  },
  {
    product_id: "PUBG_UC_660",
    category: "Game Top-Up Cards / Credits",
    product_name: "PUBG Mobile UC",
    denomination: "660 UC (600+60)",
    platform: "Mobile (iOS/Android)",
    price_EGP: 450,
    stock_estimate: 2500,
    notes: "Estimated price based on official Midasbuy rates."
  },
  {
    product_id: "PUBG_UC_1800",
    category: "Game Top-Up Cards / Credits",
    product_name: "PUBG Mobile UC",
    denomination: "1800 UC (1500+300)",
    platform: "Mobile (iOS/Android)",
    price_EGP: 1200,
    stock_estimate: 1500,
    notes: "Estimated price based on official Midasbuy rates."
  },
  {
    product_id: "CODM_CP_80",
    category: "Game Top-Up Cards / Credits",
    product_name: "Call of Duty Mobile CP",
    denomination: "80 CP",
    platform: "Mobile (iOS/Android)",
    price_EGP: 45,
    stock_estimate: 4000,
    notes: "Official Codashop price."
  },
  {
    product_id: "CODM_CP_420",
    category: "Game Top-Up Cards / Credits",
    product_name: "Call of Duty Mobile CP",
    denomination: "420 CP",
    platform: "Mobile (iOS/Android)",
    price_EGP: 225,
    stock_estimate: 2800,
    notes: "Official Codashop price."
  },
  {
    product_id: "CODM_CP_880",
    category: "Game Top-Up Cards / Credits",
    product_name: "Call of Duty Mobile CP",
    denomination: "880 CP",
    platform: "Mobile (iOS/Android)",
    price_EGP: 450,
    stock_estimate: 1900,
    notes: "Official Codashop price."
  },
  {
    product_id: "ROBLOX_ROBUX_400",
    category: "Game Top-Up Cards / Credits",
    product_name: "Roblox Robux",
    denomination: "400 Robux ($5 USD)",
    platform: "PC/Mobile/Console",
    price_EGP: 300,
    stock_estimate: 3000,
    notes: "Estimated price based on $5 USD card equivalent."
  },
  {
    product_id: "ROBLOX_ROBUX_800",
    category: "Game Top-Up Cards / Credits",
    product_name: "Roblox Robux",
    denomination: "800 Robux ($10 USD)",
    platform: "PC/Mobile/Console",
    price_EGP: 625,
    stock_estimate: 2200,
    notes: "Approximate market price for $10 USD gift card."
  },
  {
    product_id: "ROBLOX_ROBUX_4500",
    category: "Game Top-Up Cards / Credits",
    product_name: "Roblox Robux",
    denomination: "4500 Robux ($50 USD)",
    platform: "PC/Mobile/Console",
    price_EGP: 3100,
    stock_estimate: 800,
    notes: "Estimated price based on $50 USD gift card equivalent."
  },
  {
    product_id: "COC_GEMS_80",
    category: "Game Top-Up Cards / Credits",
    product_name: "Clash of Clans Gems",
    denomination: "80 Gems",
    platform: "Mobile (iOS/Android)",
    price_EGP: 40,
    stock_estimate: 3500,
    notes: "Approximate market price for smallest gem pack."
  },
  {
    product_id: "COC_GEMS_500",
    category: "Game Top-Up Cards / Credits",
    product_name: "Clash of Clans Gems",
    denomination: "500 Gems",
    platform: "Mobile (iOS/Android)",
    price_EGP: 175,
    stock_estimate: 2000,
    notes: "Approximate market price."
  },
  {
    product_id: "COC_GEMS_1200",
    category: "Game Top-Up Cards / Credits",
    product_name: "Clash of Clans Gems",
    denomination: "1200 Gems",
    platform: "Mobile (iOS/Android)",
    price_EGP: 550,
    stock_estimate: 1000,
    notes: "Approximate market price."
  },
  {
    product_id: "NETFLIX_BASIC_1M",
    category: "Subscriptions",
    product_name: "Netflix Subscription",
    denomination: "1 Month Basic",
    platform: "All",
    price_EGP: 100,
    stock_estimate: 9999,
    notes: "Official monthly price in Egypt."
  },
  {
    product_id: "NETFLIX_STANDARD_1M",
    category: "Subscriptions",
    product_name: "Netflix Subscription",
    denomination: "1 Month Standard",
    platform: "All",
    price_EGP: 170,
    stock_estimate: 9999,
    notes: "Official monthly price in Egypt."
  },
  {
    product_id: "NETFLIX_PREMIUM_1M",
    category: "Subscriptions",
    product_name: "Netflix Subscription",
    denomination: "1 Month Premium",
    platform: "All",
    price_EGP: 220,
    stock_estimate: 9999,
    notes: "Estimated official monthly price in Egypt."
  },
  {
    product_id: "SPOTIFY_IND_1M",
    category: "Subscriptions",
    product_name: "Spotify Premium",
    denomination: "1 Month Individual",
    platform: "All",
    price_EGP: 70,
    stock_estimate: 9999,
    notes: "Official monthly price in Egypt (rounded from 69.99 EGP)."
  },
  {
    product_id: "YOUTUBE_PREM_IND_1M",
    category: "Subscriptions",
    product_name: "YouTube Premium",
    denomination: "1 Month Individual",
    platform: "All",
    price_EGP: 88,
    stock_estimate: 9999,
    notes: "Official monthly price in Egypt (rounded from 87.99 EGP)."
  },
  {
    product_id: "YOUTUBE_PREM_FAM_1M",
    category: "Subscriptions",
    product_name: "YouTube Premium",
    denomination: "1 Month Family",
    platform: "All",
    price_EGP: 160,
    stock_estimate: 9999,
    notes: "Official monthly price in Egypt (rounded from 159.99 EGP)."
  },
  {
    product_id: "XBOX_GAMEPASS_ULT_1M",
    category: "Subscriptions",
    product_name: "Xbox Game Pass Ultimate",
    denomination: "1 Month",
    platform: "Xbox/PC",
    price_EGP: 270,
    stock_estimate: 9999,
    notes: "Official new monthly price in Egypt."
  },
  {
    product_id: "PS_PLUS_ESS_12M",
    category: "Subscriptions",
    product_name: "PlayStation Plus Essential",
    denomination: "12 Months",
    platform: "PS4/PS5",
    price_EGP: 750,
    stock_estimate: 1500,
    notes: "Approximate market price for 12-month subscription."
  },
  {
    product_id: "GP_CARD_USD_10",
    category: "Console / Platform Gift Cards",
    product_name: "Google Play Gift Card (US)",
    denomination: "$10 USD",
    platform: "Android",
    price_EGP: 685,
    stock_estimate: 2000,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "GP_CARD_USD_50",
    category: "Console / Platform Gift Cards",
    product_name: "Google Play Gift Card (US)",
    denomination: "$50 USD",
    platform: "Android",
    price_EGP: 3400,
    stock_estimate: 800,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "APPLE_CARD_USD_20",
    category: "Console / Platform Gift Cards",
    product_name: "Apple App Store & iTunes Card (US)",
    denomination: "$20 USD",
    platform: "iOS/Mac",
    price_EGP: 970,
    stock_estimate: 1500,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "APPLE_CARD_USD_50",
    category: "Console / Platform Gift Cards",
    product_name: "Apple App Store & iTunes Card (US)",
    denomination: "$50 USD",
    platform: "iOS/Mac",
    price_EGP: 2400,
    stock_estimate: 700,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "PSN_CARD_USD_25",
    category: "Console / Platform Gift Cards",
    product_name: "PlayStation Store (PSN) Card (US)",
    denomination: "$25 USD",
    platform: "PS4/PS5",
    price_EGP: 1300,
    stock_estimate: 1200,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "PSN_CARD_USD_50",
    category: "Console / Platform Gift Cards",
    product_name: "PlayStation Store (PSN) Card (US)",
    denomination: "$50 USD",
    platform: "PS4/PS5",
    price_EGP: 2500,
    stock_estimate: 600,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "XBOX_CARD_USD_15",
    category: "Console / Platform Gift Cards",
    product_name: "Xbox Live / Microsoft Store Card (US)",
    denomination: "$15 USD",
    platform: "Xbox/PC",
    price_EGP: 750,
    stock_estimate: 1000,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "XBOX_CARD_USD_50",
    category: "Console / Platform Gift Cards",
    product_name: "Xbox Live / Microsoft Store Card (US)",
    denomination: "$50 USD",
    platform: "Xbox/PC",
    price_EGP: 2450,
    stock_estimate: 500,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "NINTENDO_ESHOP_USD_20",
    category: "Console / Platform Gift Cards",
    product_name: "Nintendo eShop Card (US)",
    denomination: "$20 USD",
    platform: "Nintendo Switch",
    price_EGP: 1185,
    stock_estimate: 900,
    notes: "Approximate market price for US region card."
  },
  {
    product_id: "NINTENDO_ESHOP_USD_50",
    category: "Console / Platform Gift Cards",
    product_name: "Nintendo eShop Card (US)",
    denomination: "$50 USD",
    platform: "Nintendo Switch",
    price_EGP: 2999,
    stock_estimate: 400,
    notes: "Approximate market price for US region card."
  }
];

// Category mapping
const categoryMap = {
  'Game Top-Up Cards / Credits': 'game-topups',
  'Subscriptions': 'subscriptions',
  'Console / Platform Gift Cards': 'gift-cards'
};

// Placeholder images for different product categories
const placeholderImages = {
  'game-topups': ['/fJpYcbM9idap.png', '/5IdYpWiPNmzE.jpg', '/Z4sjX84G63jO.jpg'],
  'subscriptions': ['/gv6sPf9ON595.jpg', '/3PUV4qNkMVDI.png', '/sKBGSmAuiCFd.png'],
  'gift-cards': ['/LYZAxzSbJSIo.jpg', '/29VN2MnJPsLm.jpg', '/fvmrGYFs1bWd.png']
};

function getRandomImage(category) {
  const images = placeholderImages[category] || placeholderImages['subscriptions'];
  return images[Math.floor(Math.random() * images.length)];
}

async function seedProducts() {
  try {
    console.log('🌱 Starting product seeding...\n');

    // Check connection
    const isConnected = await checkConnection(3, 2000);
    if (!isConnected) {
        console.error('❌ Skipping seeding due to DB connection failure');
        process.exit(1);
    }

    let insertedCount = 0;
    let skippedCount = 0;

    for (const product of products) {
      try {
        // Check if product already exists
        const exists = await pool.query('SELECT id FROM games WHERE id = $1', [product.product_id]);
        
        if (exists.rows.length > 0) {
          console.log(`⏭️  ${product.product_name} (${product.denomination}) - Already exists`);
          skippedCount++;
          continue;
        }

        // Create slug from product name and denomination
        const slug = `${product.product_name.toLowerCase().replace(/\s+/g, '-')}-${product.denomination.toLowerCase().replace(/\s+/g, '-')}`.substring(0, 100);

        // Get category slug
        const categorySlug = categoryMap[product.category] || 'other';

        // Insert product
        await pool.query(
          `INSERT INTO games (id, name, slug, description, price, currency, image, category, stock, is_popular)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
          [
            product.product_id,
            `${product.product_name} - ${product.denomination}`,
            slug,
            `${product.product_name}\n${product.denomination}\nPlatform: ${product.platform}\n${product.notes}`,
            product.price_EGP,
            'EGP',
            getRandomImage(categorySlug),
            categorySlug,
            product.stock_estimate,
            false // Not popular by default
          ]
        );

        console.log(`✓ ${product.product_name} (${product.denomination}) - ${product.price_EGP} EGP`);
        insertedCount++;
      } catch (err) {
        console.error(`✗ Error inserting ${product.product_name}: ${err.message}`);
      }
    }

    console.log(`\n✅ Seeding complete!`);
    console.log(`   Inserted: ${insertedCount} products`);
    console.log(`   Skipped: ${skippedCount} products (already exist)\n`);

    // Show summary by category
    const summary = await pool.query(`
      SELECT category, COUNT(*) as count, SUM(stock) as total_stock 
      FROM games 
      WHERE category IN ('game-topups', 'subscriptions', 'gift-cards')
      GROUP BY category
      ORDER BY category
    `);

    console.log('📊 Product Summary by Category:');
    for (const row of summary.rows) {
      console.log(`   ${row.category}: ${row.count} products (${row.total_stock} total stock)`);
    }

    const totalGames = await pool.query('SELECT COUNT(*) as count FROM games');
    console.log(`\n📦 Total games in database: ${totalGames.rows[0].count}`);

    process.exit(0);
  } catch (err) {
    console.error('Fatal error:', err.message);
    process.exit(1);
  }
}

seedProducts();
