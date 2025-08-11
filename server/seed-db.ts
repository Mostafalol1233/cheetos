import { db } from "./db";
import { games, categories } from "@shared/schema";

export async function seedDatabase() {
  console.log("🌱 Seeding database...");
  
  try {
    // Seed categories
    console.log("📂 Seeding categories...");
    const categoriesData = [
      {
        id: "hot-deals",
        name: "HOT DEALS",
        slug: "hot-deals", 
        description: "Currently Unavailable - Coming Soon",
        image: "/image_1754931426972.png",
        gradient: "from-gray-600 to-gray-700",
        icon: "clock"
      },
      {
        id: "online-games",
        name: "ONLINE GAMES",
        slug: "online-games",
        description: "PC and console game credits", 
        image: "/image_1754931426972.png",
        gradient: "from-purple-600 to-pink-700",
        icon: "globe"
      },
      {
        id: "mobile-games", 
        name: "MOBILE GAMES",
        slug: "mobile-games",
        description: "Mobile game currencies and items",
        image: "/image_1754931426972.png", 
        gradient: "from-red-600 to-pink-700",
        icon: "smartphone"
      },
      {
        id: "gift-cards",
        name: "GIFT CARDS", 
        slug: "gift-cards",
        description: "Digital vouchers and gift cards",
        image: "/image_1754931426972.png",
        gradient: "from-green-600 to-blue-700", 
        icon: "gift"
      }
    ];

    await db.insert(categories).values(categoriesData).onConflictDoNothing();
    console.log("✅ Categories seeded successfully");

    // Seed games
    console.log("🎮 Seeding games...");
    const gamesData = [
      // Online Games
      {
        id: "crossfire",
        name: "CROSSFIRE",
        slug: "crossfire", 
        description: "CrossFire gaming currency and items",
        price: "5.00",
        currency: "USD",
        image: "/CROSSFIRE.png",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "roblox", 
        name: "ROBLOX",
        slug: "roblox",
        description: "Roblox game currency and premium features",
        price: "10.00",
        currency: "USD", 
        image: "/ROBLOX.png",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "lol",
        name: "LEAGUE OF LEGENDS", 
        slug: "league-of-legends",
        description: "LoL Riot Points and champions",
        price: "10.00",
        currency: "USD",
        image: "/LEAGUE_OF_LEGENDS.png", 
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "cod",
        name: "CALL OF DUTY",
        slug: "call-of-duty",
        description: "COD Points and battle pass", 
        price: "15.00",
        currency: "USD",
        image: "/CALL_OF_DUTY.png",
        category: "online-games", 
        isPopular: true,
        stock: 1000
      },
      {
        id: "apex",
        name: "APEX LEGENDS",
        slug: "apex-legends", 
        description: "Apex Coins and battle pass",
        price: "10.00",
        currency: "USD",
        image: "/APEX_LEGENDS.png",
        category: "online-games",
        isPopular: true, 
        stock: 1000
      },
      {
        id: "valorant",
        name: "VALORANT", 
        slug: "valorant",
        description: "Valorant Points and weapon skins",
        price: "15.00",
        currency: "USD",
        image: "/VALORANT.jpg",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "fortnite",
        name: "FORTNITE",
        slug: "fortnite",
        description: "V-Bucks and battle pass", 
        price: "10.00",
        currency: "USD",
        image: "/FORTNITE.jpg",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "minecraft",
        name: "MINECRAFT", 
        slug: "minecraft",
        description: "Minecraft Java & Bedrock editions",
        price: "27.00",
        currency: "USD",
        image: "/MINECRAFT.png",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },

      // Mobile Games
      {
        id: "freefire",
        name: "FREE FIRE",
        slug: "free-fire",
        description: "Free Fire diamonds and characters", 
        price: "5.00",
        currency: "USD",
        image: "/FREE_FIRE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "pubg", 
        name: "PUBG MOBILE",
        slug: "pubg-mobile",
        description: "PUBG Mobile UC and Royal Pass",
        price: "10.00",
        currency: "USD",
        image: "/PUBG_MOBILE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "coc",
        name: "CLASH OF CLANS",
        slug: "clash-of-clans", 
        description: "Clash of Clans gems and gold pass",
        price: "5.00",
        currency: "USD",
        image: "/CLASH_OF_CLANS.webp",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "ml",
        name: "MOBILE LEGENDS", 
        slug: "mobile-legends",
        description: "Mobile Legends diamonds and skins",
        price: "5.00",
        currency: "USD", 
        image: "/MOBILE_LEGENDS.png",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "codm",
        name: "COD MOBILE",
        slug: "cod-mobile",
        description: "Call of Duty Mobile CP and battle pass",
        price: "10.00", 
        currency: "USD",
        image: "/COD_MOBILE.png",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },

      // Gift Cards
      {
        id: "steam",
        name: "STEAM WALLET", 
        slug: "steam-wallet",
        description: "Steam gift cards for games and content",
        price: "20.00",
        currency: "USD",
        image: "/image_1754933742848.png", 
        category: "gift-cards",
        isPopular: true,
        stock: 1000
      },
      {
        id: "googleplay",
        name: "GOOGLE PLAY",
        slug: "google-play", 
        description: "Google Play Store gift cards",
        price: "25.00",
        currency: "USD",
        image: "/image_1754933739944.png",
        category: "gift-cards",
        isPopular: true,
        stock: 1000
      },
      {
        id: "playstation",
        name: "PLAYSTATION STORE",
        slug: "playstation-store",
        description: "PlayStation Store gift cards",
        price: "50.00", 
        currency: "USD",
        image: "/image_1754933736969.png",
        category: "gift-cards",
        isPopular: true,
        stock: 1000
      },
      {
        id: "xbox",
        name: "XBOX LIVE", 
        slug: "xbox-live",
        description: "Xbox Live gift cards and Game Pass",
        price: "25.00",
        currency: "USD",
        image: "/xbox_card.png",
        category: "gift-cards",
        isPopular: false,
        stock: 1000
      },
      {
        id: "appstore", 
        name: "APPLE APP STORE",
        slug: "apple-app-store", 
        description: "Apple App Store and iTunes gift cards",
        price: "25.00",
        currency: "USD",
        image: "/apple_card.png", 
        category: "gift-cards",
        isPopular: false,
        stock: 1000
      }
    ];

    await db.insert(games).values(gamesData).onConflictDoNothing();
    console.log("✅ Games seeded successfully");

    console.log("🎉 Database seeding completed!");
    
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    throw error;
  }
}

// Run seeding if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log("Seeding finished successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}