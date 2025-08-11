import { db } from './db';
import { games, categories } from '@shared/schema';

// Function to generate random stock between 30-100
const randomStock = () => Math.floor(Math.random() * 71) + 30;

export async function seedDatabase() {
  console.log('🌱 Starting database seeding...');

  try {
    // Clear existing data
    await db.delete(games);
    await db.delete(categories);

    // Seed Categories
    const categoryData = [
      {
        id: "hot-deals",
        name: "HOT DEALS",
        slug: "hot-deals",
        description: "Limited time offers and special prices",
        image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        gradient: "from-red-600 to-orange-600",
        icon: "Zap"
      },
      {
        id: "online-games",
        name: "ONLINE GAMES", 
        slug: "online-games",
        description: "PC and console game credits",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        gradient: "from-blue-600 to-purple-700",
        icon: "Monitor"
      },
      {
        id: "mobile-games",
        name: "MOBILE GAMES",
        slug: "mobile-games", 
        description: "Mobile game currencies and items",
        image: "https://pixabay.com/get/g90b527228ccda2f18b3f0e3084562c379b9c93c65ed89df111aca00916e1de7d1ddf33e39091e139d840610f9b4eafcf17b00169a6a1680e66eea5c28fed5595_1280.jpg",
        gradient: "from-red-600 to-pink-700", 
        icon: "Smartphone"
      },
      {
        id: "gift-cards",
        name: "GIFT CARDS",
        slug: "gift-cards",
        description: "Digital vouchers and gift cards",
        image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        gradient: "from-green-600 to-teal-700",
        icon: "Gift"
      }
    ];

    await db.insert(categories).values(categoryData);

    // Seed Games with original data using attached assets
    const gameData = [
      {
        id: "crossfire",
        name: "CROSSFIRE",
        slug: "crossfire",
        description: "ZP Points & Weapons",
        price: "50.00",
        currency: "EGP",
        image: "/attached_assets/CROSSFIRE.png",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["1000 ZP", "5000 ZP", "10000 ZP", "25000 ZP", "50000 ZP", "100000 ZP"],
        packagePrices: ["50.00", "240.00", "480.00", "1200.00", "2400.00", "4800.00"]
      },
      {
        id: "freefire",
        name: "FREE FIRE",
        slug: "freefire",
        description: "Diamonds & Battle Pass",
        price: "90.00",
        currency: "EGP",
        image: "/attached_assets/FREE_FIRE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["100 Diamonds", "210 Diamonds", "530+53 Diamonds", "1080+108 Diamonds", "2200+220 Diamonds"],
        packagePrices: ["90.00", "200.00", "399.00", "799.00", "1599.00"]
      },
      {
        id: "pubg",
        name: "PUBG MOBILE",
        slug: "pubg-mobile",
        description: "UC Currency & Royal Pass",
        price: "29.99",
        currency: "EGP",
        image: "/attached_assets/PUBG_MOBILE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["60 UC", "300+25 UC", "600+60 UC", "1500+300 UC", "3000+850 UC", "8100 UC"],
        packagePrices: ["29.99", "149.99", "284.99", "759.99", "1499.99", "2849.99"]
      },
      {
        id: "roblox",
        name: "ROBLOX",
        slug: "roblox",
        description: "Robux Currency & Premium",
        price: "250.00",
        currency: "EGP",
        image: "/attached_assets/ROBLOX.png",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["400 Robux", "800 Robux", "1700 Robux", "4500 Robux", "10000 Robux"],
        packagePrices: ["250.00", "500.00", "999.00", "2499.00", "4999.00"]
      },
      {
        id: "lol",
        name: "LEAGUE OF LEGENDS",
        slug: "league-of-legends",
        description: "RP Points",
        price: "125.00",
        currency: "EGP",
        image: "/attached_assets/LEAGUE_OF_LEGENDS.png",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["650 RP", "1380 RP", "2800 RP", "5000 RP", "7200 RP"],
        packagePrices: ["125.00", "250.00", "500.00", "875.00", "1250.00"]
      },
      {
        id: "callofduty",
        name: "CALL OF DUTY",
        slug: "call-of-duty",
        description: "COD Points & Battle Pass",
        price: "250.00",
        currency: "EGP",
        image: "/attached_assets/CALL_OF_DUTY.png",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["1000 COD Points", "2400 COD Points", "5000 COD Points", "10000 COD Points"],
        packagePrices: ["250.00", "599.00", "1199.00", "2399.00"]
      },
      {
        id: "valorant",
        name: "VALORANT",
        slug: "valorant",
        description: "VP Points & Battle Pass",
        price: "200.00",
        currency: "EGP",
        image: "/attached_assets/VALORANT.jpg",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["475 VP", "1000 VP", "2050 VP", "3650 VP", "5350 VP"],
        packagePrices: ["200.00", "400.00", "800.00", "1400.00", "2000.00"]
      },
      {
        id: "cod-mobile",
        name: "COD MOBILE",
        slug: "cod-mobile",
        description: "CP Points & Battle Pass",
        price: "150.00",
        currency: "EGP",
        image: "/attached_assets/COD_MOBILE.png",
        category: "mobile-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["320 CP", "800 CP", "1600 CP", "4000 CP", "8000 CP"],
        packagePrices: ["150.00", "350.00", "700.00", "1750.00", "3500.00"]
      },
      {
        id: "apex",
        name: "APEX LEGENDS",
        slug: "apex-legends",
        description: "Apex Coins & Battle Pass",
        price: "280.00",
        currency: "EGP",
        image: "/attached_assets/APEX_LEGENDS.png",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["1000 Apex Coins", "2150 Apex Coins", "4350 Apex Coins", "6700 Apex Coins", "11500 Apex Coins"],
        packagePrices: ["280.00", "600.00", "1200.00", "1800.00", "3000.00"]
      },
      {
        id: "clash-royale",
        name: "CLASH ROYALE",
        slug: "clash-royale",
        description: "Gems & Gold",
        price: "40.00",
        currency: "EGP",
        image: "/attached_assets/CLASH_ROYALE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["80 Gems", "500 Gems", "1200 Gems", "2500 Gems", "6500 Gems", "14000 Gems"],
        packagePrices: ["40.00", "200.00", "480.00", "1000.00", "2600.00", "5600.00"]
      },
      {
        id: "clash-clans",
        name: "CLASH OF CLANS",
        slug: "clash-of-clans",
        description: "Gems & Gold Pass",
        price: "40.00",
        currency: "EGP",
        image: "/attached_assets/CLASH_OF_CLANS.webp",
        category: "mobile-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["80 Gems", "500 Gems", "1200 Gems", "2500 Gems", "6500 Gems", "14000 Gems"],
        packagePrices: ["40.00", "200.00", "480.00", "1000.00", "2600.00", "5600.00"]
      },
      {
        id: "fortnite",
        name: "FORTNITE",
        slug: "fortnite",
        description: "V-Bucks & Battle Pass",
        price: "200.00",
        currency: "EGP",
        image: "/attached_assets/FORTNITE.jpg",
        category: "online-games",
        isPopular: false,
        stock: randomStock(),
        packages: ["1000 V-Bucks", "2800 V-Bucks", "5000 V-Bucks", "13500 V-Bucks"],
        packagePrices: ["200.00", "500.00", "900.00", "2400.00"]
      },
      {
        id: "minecraft",
        name: "MINECRAFT",
        slug: "minecraft",
        description: "Minecoins & Realms",
        price: "100.00",
        currency: "EGP",
        image: "/attached_assets/MINECRAFT.png",
        category: "online-games",
        isPopular: false,
        stock: randomStock(),
        packages: ["320 Minecoins", "840 Minecoins", "1720 Minecoins", "3500 Minecoins"],
        packagePrices: ["100.00", "250.00", "500.00", "1000.00"]
      },
      {
        id: "gta5",
        name: "GTA V ONLINE",
        slug: "gta-v-online",
        description: "Shark Cards & Premium",
        price: "300.00",
        currency: "EGP",
        image: "/attached_assets/OIP_1754946009491.jpg",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["$100,000 Red Shark Card", "$500,000 Tiger Shark Card", "$1,250,000 Bull Shark Card", "$3,500,000 Great White Shark Card", "$8,000,000 Megalodon Shark Card"],
        packagePrices: ["300.00", "1250.00", "3000.00", "8400.00", "19200.00"]
      },
      {
        id: "steam",
        name: "STEAM WALLET",
        slug: "steam-wallet",
        description: "Steam Wallet Codes",
        price: "500.00",
        currency: "EGP",
        image: "/attached_assets/image_1754945109051.png",
        category: "gift-cards",
        isPopular: true,
        stock: randomStock()
      },
      {
        id: "playstore",
        name: "GOOGLE PLAY STORE",
        slug: "google-play-store",
        description: "Google Play Gift Cards",
        price: "250.00",
        currency: "EGP",
        image: "/attached_assets/image_1754945106383.png",
        category: "gift-cards",
        isPopular: true,
        stock: randomStock()
      },
      {
        id: "playstation",
        name: "PLAYSTATION STORE",
        slug: "playstation-store",
        description: "PlayStation Store Gift Cards",
        price: "500.00",
        currency: "EGP",
        image: "/attached_assets/image_1754945102153.png",
        category: "gift-cards",
        isPopular: true,
        stock: randomStock()
      },
      {
        id: "netflix",
        name: "NETFLIX",
        slug: "netflix",
        description: "Netflix Subscription Cards",
        price: "200.00",
        currency: "EGP",
        image: "/attached_assets/OIP_1754945924514.jpg",
        category: "online-games",
        isPopular: true,
        stock: randomStock(),
        packages: ["1 Month Subscription", "3 Months Subscription", "6 Months Subscription", "12 Months Subscription"],
        packagePrices: ["200.00", "570.00", "1080.00", "2040.00"]
      }
    ];

    await db.insert(games).values(gameData);

    console.log('✅ Database seeded successfully!');
    console.log(`📦 Created ${categoryData.length} categories`);
    console.log(`🎮 Created ${gameData.length} games`);
    console.log('📊 All games have random stock between 30-100 units');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      console.log('🎉 Seeding completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Seeding failed:', error);
      process.exit(1);
    });
}