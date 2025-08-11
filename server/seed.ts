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
        stock: randomStock()
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
        stock: randomStock()
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
        stock: randomStock()
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
        stock: randomStock()
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
        stock: randomStock()
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
        stock: randomStock()
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
        stock: randomStock()
      },
      {
        id: "gta5",
        name: "GTA V ONLINE",
        slug: "gta-v-online",
        description: "Shark Cards & Premium",
        price: "300.00",
        currency: "EGP",
        image: "/attached_assets/GTA_V.jpg",
        category: "online-games",
        isPopular: false,
        stock: randomStock()
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
        image: "/attached_assets/NETFLIX.png",
        category: "gift-cards",
        isPopular: false,
        stock: randomStock()
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