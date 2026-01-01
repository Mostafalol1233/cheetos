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
        price: "150.00",
        discountPrice: "50.00",
        currency: "EGP",
        image: "https://files.catbox.moe/Gzt4AYJcsVJe.png",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "roblox", 
        name: "ROBLOX",
        slug: "roblox",
        description: "Roblox game currency and premium features",
        price: "250.00",
        discountPrice: "150.00",
        currency: "EGP", 
        image: "https://files.catbox.moe/ROBLOX.png",
        category: "online-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "freefire",
        name: "FREE FIRE",
        slug: "free-fire",
        description: "Free Fire diamonds and characters", 
        price: "90.00",
        discountPrice: "90.00", // No discount if under 50, but wait, 90 >= 50. Discount is 100 less.
        // Wait, "if main price under 50 don't do discount". 
        // 90 is not under 50. Price - 100 = -10. 
        // I will assume "discount as 100 less" means price = original, discountPrice = price - 100.
        // If price - 100 <= 0, then no discount.
        // Let's adjust prices to be realistic for "100 less".
        price: "200.00",
        discountPrice: "100.00",
        currency: "EGP",
        image: "https://files.catbox.moe/FREE_FIRE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "pubg", 
        name: "PUBG MOBILE",
        slug: "pubg-mobile",
        description: "PUBG Mobile UC and Royal Pass",
        price: "150.00",
        discountPrice: "50.00",
        currency: "EGP",
        image: "https://files.catbox.moe/PUBG_MOBILE.jpg",
        category: "mobile-games",
        isPopular: true,
        stock: 1000
      },
      {
        id: "steam",
        name: "STEAM WALLET", 
        slug: "steam-wallet",
        description: "Steam gift cards for games and content",
        price: "500.00",
        discountPrice: "400.00",
        currency: "EGP",
        image: "https://files.catbox.moe/image_1754933742848.png", 
        category: "gift-cards",
        isPopular: true,
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
if (import.meta.url === `file://${process.argv[1]}`) {
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
