import { db } from "./db";
import { games, categories } from "@shared/schema";

const categoryData = [
  {
    id: "hot-deals",
    name: "HOT DEALS",
    slug: "hot-deals",
    description: "Currently Unavailable - Coming Soon",
    image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    gradient: "from-gray-600 to-gray-700",
    icon: "clock"
  },
  {
    id: "online-games",
    name: "ONLINE GAMES", 
    slug: "online-games",
    description: "PC and console game credits",
    image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    gradient: "from-blue-600 to-purple-700",
    icon: "globe"
  },
  {
    id: "mobile-games",
    name: "MOBILE GAMES",
    slug: "mobile-games", 
    description: "Mobile game currencies and items",
    image: "https://pixabay.com/get/g90b527228ccda2f18b3f0e3084562c379b9c93c65ed89df111aca00916e1de7d1ddf33e39091e139d840610f9b4eafcf17b00169a6a1680e66eea5c28fed5595_1280.jpg",
    gradient: "from-red-600 to-pink-700", 
    icon: "smartphone"
  },
  {
    id: "gift-cards",
    name: "GIFT CARDS",
    slug: "gift-cards",
    description: "Digital vouchers and gift cards",
    image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    gradient: "from-green-600 to-teal-700",
    icon: "gift"
  }
];

const gameData = [
  {
    id: "crossfire",
    name: "CROSSFIRE", 
    slug: "crossfire",
    description: "ZP Points & Weapons",
    price: 50,
    currency: "EGP",
    image: "/attached_assets/wGWSvv3eoYT6.png",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["10,000 ZP", "20,000 ZP", "50,000 ZP", "100,000 ZP"],
    packagePrices: ["50", "100", "200", "400"]
  },
  {
    id: "freefire", 
    name: "FREE FIRE",
    slug: "freefire",
    description: "Diamonds & Battle Pass",
    price: 50,
    currency: "EGP",
    image: "/attached_assets/LYZAxzSbJSIo.jpg",
    category: "mobile-games",
    isPopular: true,
    stock: 9999,
    packages: ["100 Diamonds", "210 Diamonds", "583 Diamonds", "1080 Diamonds", "2200 Diamonds"],
    packagePrices: ["50", "90", "200", "400", "800"]
  },
  {
    id: "pubg",
    name: "PUBG MOBILE",
    slug: "pubg-mobile", 
    description: "UC Currency & Royal Pass",
    price: 30,
    currency: "EGP",
    image: "/attached_assets/WsJBkd0UFiuQ.jpeg",
    category: "mobile-games",
    isPopular: true,
    stock: 9999,
    packages: ["60 UC", "300+25 UC", "600+60 UC", "660 UC", "8100 UC"],
    packagePrices: ["30", "150", "285", "285", "2850"]
  },
  {
    id: "roblox",
    name: "ROBLOX",
    slug: "roblox",
    description: "Robux Currency & Premium", 
    price: 155,
    currency: "EGP",
    image: "/attached_assets/S1ndFeZPWmZN.jpeg",
    category: "online-games", 
    isPopular: true,
    stock: 9999,
    packages: ["400 Robux", "800 Robux", "1,000 Robux", "1,700 Robux", "2,400 Robux", "5,250 Robux"],
    packagePrices: ["155", "310", "390", "625", "930", "1950"]
  },
  {
    id: "lol",
    name: "LEAGUE OF LEGENDS",
    slug: "league-of-legends",
    description: "RP Points", 
    price: 75,
    currency: "EGP",
    image: "/attached_assets/3PUV4qNkMVDI.png",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["650 RP", "1380 RP", "2800 RP"],
    packagePrices: ["75", "150", "300"]
  },
  {
    id: "callofduty",
    name: "CALL OF DUTY",
    slug: "call-of-duty",
    description: "COD Points & Battle Pass",
    price: 150,
    currency: "EGP",
    image: "/attached_assets/XIEgXHiFGlho.png",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["1,100 CP", "2,400 CP", "5,000 CP", "10,000 CP"],
    packagePrices: ["150", "300", "550", "1000"]
  },
  {
    id: "apex",
    name: "APEX LEGENDS",
    slug: "apex-legends",
    description: "Apex Coins & Battle Pass",
    price: 140,
    currency: "EGP",
    image: "/attached_assets/5rYBWOVnHXv3.png",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["1,000 AC", "2,150 AC", "4,350 AC", "10,000 AC"],
    packagePrices: ["140", "280", "520", "1100"]
  },
  // More Mobile Games
  {
    id: "clashofclans",
    name: "CLASH OF CLANS",
    slug: "clash-of-clans",
    description: "Gems & Gold Pass",
    price: 80,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "mobile-games",
    isPopular: true,
    stock: 9999,
    packages: ["500 Gems", "1,200 Gems", "2,500 Gems", "6,500 Gems", "14,000 Gems"],
    packagePrices: ["80", "160", "320", "800", "1600"]
  },
  {
    id: "clashroyale",
    name: "CLASH ROYALE",
    slug: "clash-royale",
    description: "Gems & Pass Royale",
    price: 80,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "mobile-games",
    isPopular: false,
    stock: 9999,
    packages: ["500 Gems", "1,200 Gems", "2,500 Gems", "6,500 Gems"],
    packagePrices: ["80", "160", "320", "800"]
  },
  {
    id: "mobilelegends",
    name: "MOBILE LEGENDS",
    slug: "mobile-legends",
    description: "Diamonds & Battle Pass",
    price: 60,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1493711662062-fa541adb3fc8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "mobile-games",
    isPopular: true,
    stock: 9999,
    packages: ["86 Diamonds", "172 Diamonds", "344 Diamonds", "706 Diamonds", "1412 Diamonds"],
    packagePrices: ["60", "120", "240", "480", "960"]
  },
  {
    id: "codmobile",
    name: "COD MOBILE",
    slug: "cod-mobile",
    description: "CP Currency & Battle Pass",
    price: 150,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1518709268805-4e9042af2176?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "mobile-games",
    isPopular: true,
    stock: 9999,
    packages: ["80 CP", "400 CP", "800 CP", "1600 CP", "4000 CP"],
    packagePrices: ["150", "300", "600", "1200", "3000"]
  },
  {
    id: "lolwr",
    name: "LOL WILD RIFT",
    slug: "lol-wild-rift",
    description: "Wild Cores & Battle Pass",
    price: 100,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1560253023-3ec5d502959f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "mobile-games",
    isPopular: false,
    stock: 9999,
    packages: ["525 Wild Cores", "1075 Wild Cores", "2200 Wild Cores", "3500 Wild Cores"],
    packagePrices: ["100", "200", "400", "600"]
  },
  // More Online Games
  {
    id: "valorant",
    name: "VALORANT",
    slug: "valorant",
    description: "VP Points & Battle Pass",
    price: 150,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1511512578047-dfb367046420?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["475 VP", "1000 VP", "2050 VP", "3650 VP", "5350 VP"],
    packagePrices: ["150", "300", "600", "1000", "1500"]
  },
  {
    id: "fortnite",
    name: "FORTNITE",
    slug: "fortnite",
    description: "V-Bucks & Battle Pass",
    price: 120,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["1,000 V-Bucks", "2,800 V-Bucks", "5,000 V-Bucks", "13,500 V-Bucks"],
    packagePrices: ["120", "280", "500", "1200"]
  },
  {
    id: "fifa",
    name: "FIFA ULTIMATE TEAM",
    slug: "fifa-ultimate-team",
    description: "FIFA Points",
    price: 100,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1574629810360-7efbbe195018?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "online-games",
    isPopular: false,
    stock: 9999,
    packages: ["500 FIFA Points", "1,050 FIFA Points", "2,200 FIFA Points", "4,600 FIFA Points"],
    packagePrices: ["100", "200", "400", "800"]
  },
  {
    id: "minecraft",
    name: "MINECRAFT",
    slug: "minecraft",
    description: "Minecoins & Marketplace",
    price: 80,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1614375051920-0d96f7e7f6ad?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "online-games",
    isPopular: true,
    stock: 9999,
    packages: ["320 Minecoins", "840 Minecoins", "1720 Minecoins", "3500 Minecoins"],
    packagePrices: ["80", "160", "320", "600"]
  },
  // Gift Cards
  {
    id: "steam",
    name: "STEAM WALLET",
    slug: "steam-wallet",
    description: "Steam Digital Gift Cards",
    price: 100,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1606711434541-c24e6dc4b346?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "gift-cards",
    isPopular: true,
    stock: 9999,
    packages: ["100 EGP", "200 EGP", "500 EGP", "1000 EGP"],
    packagePrices: ["100", "200", "500", "1000"]
  },
  {
    id: "playstation",
    name: "PLAYSTATION STORE",
    slug: "playstation-store",
    description: "PlayStation Store Gift Cards",
    price: 150,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "gift-cards",
    isPopular: true,
    stock: 9999,
    packages: ["150 EGP", "300 EGP", "500 EGP", "1000 EGP"],
    packagePrices: ["150", "300", "500", "1000"]
  },
  {
    id: "xbox",
    name: "XBOX LIVE",
    slug: "xbox-live",
    description: "Xbox Live Gift Cards",
    price: 150,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1556438064-2d7646166914?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "gift-cards",
    isPopular: false,
    stock: 9999,
    packages: ["150 EGP", "300 EGP", "500 EGP", "1000 EGP"],
    packagePrices: ["150", "300", "500", "1000"]
  },
  {
    id: "googleplay",
    name: "GOOGLE PLAY",
    slug: "google-play",
    description: "Google Play Gift Cards",
    price: 100,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "gift-cards",
    isPopular: true,
    stock: 9999,
    packages: ["100 EGP", "200 EGP", "500 EGP", "1000 EGP"],
    packagePrices: ["100", "200", "500", "1000"]
  },
  {
    id: "appstore",
    name: "APPLE APP STORE",
    slug: "apple-app-store",
    description: "App Store & iTunes Gift Cards",
    price: 100,
    currency: "EGP",
    image: "https://images.unsplash.com/photo-1472214103451-9374bd1c798e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
    category: "gift-cards",
    isPopular: false,
    stock: 9999,
    packages: ["100 EGP", "200 EGP", "500 EGP", "1000 EGP"],
    packagePrices: ["100", "200", "500", "1000"]
  }
];

async function seedDatabase() {
  try {
    console.log("Seeding database...");
    
    // Insert categories
    await db.insert(categories).values(categoryData).onConflictDoNothing();
    console.log("Categories seeded");
    
    // Insert games  
    await db.insert(games).values(gameData).onConflictDoNothing();
    console.log("Games seeded");
    
    console.log("Database seeded successfully!");
  } catch (error) {
    console.error("Error seeding database:", error);
  }
}

// Run seeding if this file is executed directly
seedDatabase();

export { seedDatabase };