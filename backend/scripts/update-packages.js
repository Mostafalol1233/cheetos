
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesPath = path.join(__dirname, '../data/games.json');
const assetsPath = path.join(__dirname, '../public/attached_assets');

// User Input Data
const updates = [
  {
    name: "Crossfire",
    currency: "ZP",
    packages: ["1,000 ZP", "5,000 ZP", "10,000 ZP", "20,000 ZP", "50,000 ZP", "100,000 ZP"],
    description: "CrossFire tends to have a wide range of ZP packages that allow players to purchase weapons, characters, and other items in the game."
  },
  {
    name: "PUBG Mobile",
    currency: "UC",
    packages: ["100 UC", "300 UC", "600 UC", "1,200 UC", "3,000 UC", "6,000 UC", "10,000 UC", "30,000 UC"],
    description: "UC is the in-game currency used in PUBG Mobile for purchasing skins, crates, and other cosmetics."
  },
  {
    name: "Roblox",
    currency: "Robux",
    packages: ["80 Robux", "400 Robux", "800 Robux", "1,700 Robux", "4,500 Robux", "10,000 Robux", "22,500 Robux"],
    description: "Roblox uses Robux for purchasing in-game items, avatar accessories, and access to specific game passes within Roblox games."
  },
  {
    name: "Fortnite",
    currency: "V-Bucks",
    packages: ["1,000 V-Bucks", "2,800 V-Bucks", "5,000 V-Bucks", "13,500 V-Bucks"],
    description: "Fortnite's currency, V-Bucks, is used to buy skins, emotes, and other cosmetics."
  },
  {
    name: "League of Legends",
    currency: "RP",
    packages: ["650 RP", "1,300 RP", "3,250 RP", "5,200 RP", "13,500 RP"],
    description: "In League of Legends, RP (Riot Points) is used for purchasing skins, champions, and other premium content."
  },
  {
    name: "Call of Duty Mobile",
    currency: "CP",
    packages: ["80 CP", "200 CP", "520 CP", "1,200 CP", "2,400 CP", "5,000 CP"],
    description: "CP (Call of Duty Points) is used for purchasing in-game items like skins, blueprints, and other premium content."
  },
  {
    name: "Free Fire",
    currency: "Diamonds",
    packages: ["10 Diamonds", "100 Diamonds", "500 Diamonds", "1,000 Diamonds", "3,000 Diamonds", "5,000 Diamonds", "10,000 Diamonds"],
    description: "Diamonds in Free Fire are used for unlocking skins, outfits, and premium events."
  },
  {
    name: "Clash of Clans",
    currency: "Gems",
    packages: ["20 Gems", "100 Gems", "500 Gems", "1,000 Gems", "2,000 Gems", "5,000 Gems", "10,000 Gems"],
    description: "Gems are used to speed up upgrades and buy special items in Clash of Clans."
  },
  {
    name: "Minecraft",
    currency: "Minecoins",
    packages: ["320 Minecoins", "1,000 Minecoins", "2,500 Minecoins", "5,000 Minecoins"],
    description: "Minecoins are the currency used in Minecraft to buy skins, texture packs, and other in-game items."
  },
  {
    name: "Apex Legends",
    currency: "Apex Coins",
    packages: ["100 Apex Coins", "200 Apex Coins", "500 Apex Coins", "1,000 Apex Coins", "2,000 Apex Coins", "4,000 Apex Coins"],
    description: "Apex Coins are used for skins, battle passes, and other cosmetic items in Apex Legends."
  },
  {
    name: "Genshin Impact",
    currency: "Primogems",
    packages: ["50 Primogems", "300 Primogems", "980 Primogems", "1,600 Primogems", "3,200 Primogems", "6,400 Primogems"],
    description: "Primogems are the main currency in Genshin Impact for wishing on banners and purchasing items."
  },
  {
    name: "Garena",
    currency: "Diamonds",
    packages: ["100 Diamonds", "300 Diamonds", "1,000 Diamonds", "2,500 Diamonds", "5,000 Diamonds"],
    description: "Garena typically has different games with Diamonds as the universal currency (mainly used for Free Fire)."
  }
];

// Base rates (Price per 1 unit of currency in EGP, approx)
const rates = {
  "ZP": 0.045,        // 1000 = 45
  "UC": 0.5,          // 60 = 30
  "Robux": 0.35,      // 400 = 150
  "V-Bucks": 0.45,    // 1000 = 450 (est)
  "RP": 0.5,          // 650 = 325 (est)
  "CP": 0.5,          // 80 = 40 (est)
  "Diamonds": 0.34,   // 100 = 34
  "Gems": 0.5,        // 20 = 10 (est)
  "Minecoins": 0.175, // 1720 = 300
  "Apex Coins": 0.5,  // 100 = 50 (est)
  "Primogems": 0.5    // 50 = 25 (est)
};

function cleanAmount(pkgStr) {
  return parseInt(pkgStr.replace(/,/g, '').replace(/\D/g, '')) || 0;
}

function calculatePrice(pkgStr, currency) {
  const amount = cleanAmount(pkgStr);
  const rate = rates[currency] || 0.5;
  let price = Math.ceil(amount * rate);
  
  // Round to nice numbers (optional, e.g. nearest 5 or 10)
  if (price > 100) {
    price = Math.ceil(price / 10) * 10;
  }
  return price.toString();
}

// Read existing games
let games = [];
if (fs.existsSync(gamesPath)) {
  games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
}

// Get available assets
const assets = fs.readdirSync(assetsPath);
function findAsset(slug) {
  // Try exact match first
  const extensions = ['.jpg', '.png', '.webp', '.jpeg'];
  
  // 1. Try slug directly
  for (const ext of extensions) {
    if (assets.includes(slug + ext)) return `/attached_assets/${slug}${ext}`;
  }

  // 2. Try uppercase slug (common in this repo)
  const upperSlug = slug.toUpperCase().replace(/-/g, '_');
  for (const ext of extensions) {
    if (assets.includes(upperSlug + ext)) return `/attached_assets/${upperSlug}${ext}`;
  }

  // 3. Try partial match
  const match = assets.find(a => a.toLowerCase().includes(slug.replace(/-/g, '_')));
  if (match) return `/attached_assets/${match}`;

  return null;
}

// Process updates
let addedCount = 0;
let updatedCount = 0;

updates.forEach(update => {
  const slug = update.name.toLowerCase().replace(/ /g, '-');
  const existingGame = games.find(g => g.slug === slug || g.name.toLowerCase() === update.name.toLowerCase());

  const newPackagePrices = update.packages.map(p => calculatePrice(p, update.currency));

  if (existingGame) {
    // Update existing
    console.log(`Updating ${existingGame.name}...`);
    existingGame.packages = update.packages;
    existingGame.packagePrices = newPackagePrices;
    existingGame.description = update.description; // Update description too
    updatedCount++;
  } else {
    // Check for asset before adding
    const imagePath = findAsset(slug);
    if (imagePath) {
      console.log(`Adding new game: ${update.name} (Asset found: ${imagePath})`);
      const newGame = {
        id: `game_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        name: update.name,
        slug: slug,
        description: update.description,
        price: "0",
        currency: "EGP",
        image: imagePath,
        category: ["crossfire", "pubg-mobile", "free-fire", "call-of-duty-mobile", "apex-legends", "fortnite"].includes(slug) ? "shooters" : "casual",
        isPopular: true, // Default to popular for new imports
        stock: 100,
        packages: update.packages,
        packagePrices: newPackagePrices
      };
      games.push(newGame);
      addedCount++;
    } else {
      console.log(`Skipping ${update.name} (No matching asset found)`);
    }
  }
});

// Save back
fs.writeFileSync(gamesPath, JSON.stringify(games, null, 2));
console.log(`\nDone! Updated: ${updatedCount}, Added: ${addedCount}`);
