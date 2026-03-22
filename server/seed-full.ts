import "dotenv/config";
import { db } from "./db";
import { games, categories } from "@shared/schema";
import fs from "fs";
import path from "path";

export async function seedFullDatabase() {
  console.log("🌱 Seeding full database from games.json...");

  try {
    const gamesJsonPath = path.join(process.cwd(), "backend", "data", "games.json");
    if (!fs.existsSync(gamesJsonPath)) {
      console.error("❌ games.json not found at", gamesJsonPath);
      return;
    }

    const gamesDataRaw = JSON.parse(fs.readFileSync(gamesJsonPath, "utf-8"));
    
    // Ensure we have categories for these games
    // We'll extract unique categories from gamesData and ensure they exist
    // But for now let's just use the standard categories from seed-db.ts or ensure they exist
    
    console.log("📂 Seeding categories...");
    const categoriesData = [
      {
        id: "hot-deals",
        name: "HOT DEALS",
        slug: "hot-deals", 
        description: "Currently Unavailable - Coming Soon",
        image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?w=500&auto=format&fit=crop&q=60",
        gradient: "from-gray-600 to-gray-700",
        icon: "clock"
      },
      {
        id: "online-games",
        name: "ONLINE GAMES",
        slug: "online-games",
        description: "PC and console game credits", 
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60",
        gradient: "from-purple-600 to-pink-700",
        icon: "globe"
      },
      {
        id: "mobile-games", 
        name: "MOBILE GAMES",
        slug: "mobile-games",
        description: "Mobile game currencies and items",
        image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=500&auto=format&fit=crop&q=60", 
        gradient: "from-red-600 to-pink-700",
        icon: "smartphone"
      },
      {
        id: "gift-cards",
        name: "GIFT CARDS", 
        slug: "gift-cards",
        description: "Digital vouchers and gift cards",
        image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500&auto=format&fit=crop&q=60",
        gradient: "from-green-600 to-blue-700", 
        icon: "gift"
      },
      // Add 'shooters' if it's used in games.json
      {
        id: "shooters",
        name: "SHOOTERS",
        slug: "shooters",
        description: "FPS and tactical shooters",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60",
        gradient: "from-red-600 to-orange-700",
        icon: "crosshair"
      },
       {
        id: "action",
        name: "ACTION",
        slug: "action",
        description: "Action games",
        image: "https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=500&auto=format&fit=crop&q=60",
        gradient: "from-blue-600 to-cyan-700",
        icon: "sword"
      }
    ];

    await db.insert(categories).values(categoriesData).onConflictDoNothing();
    console.log("✅ Categories seeded");

    console.log(`🎮 Seeding ${gamesDataRaw.length} games...`);
    
    // Transform games data to match schema if necessary
    // Schema expects: id, name, slug, description, price, discountPrice, currency, image, category, isPopular, stock, packages, packagePrices, discountPrices, packageDiscountPrices
    
    for (const game of gamesDataRaw) {
        // Ensure numeric fields are strings if schema requires decimal/string
        // The schema usually defines price as decimal which is returned as string in JS, but insert expects string or number.
        // Let's sanitize.
        
        const gameRecord = {
            id: game.id,
            name: game.name,
            slug: game.slug,
            description: game.description,
            price: game.price?.toString(),
            discountPrice: game.discountPrice?.toString() || null,
            currency: game.currency || "USD",
            image: game.image,
            category: game.category,
            isPopular: !!game.isPopular,
            stock: game.stock || 0,
            packages: game.packages || [],
            packagePrices: (game.packagePrices || []).map((p: any) => p?.toString()),
            discountPrices: (game.discountPrices || []).map((p: any) => p?.toString()),
            packageDiscountPrices: (game.packageDiscountPrices || []).map((p: any) => p?.toString())
        };
        
        await db.insert(games).values(gameRecord).onConflictDoUpdate({
            target: games.id,
            set: gameRecord
        });
    }

    console.log("✅ Games seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding database:", error);
    process.exit(1);
  }
}

import { fileURLToPath } from "url";

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  seedFullDatabase().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
