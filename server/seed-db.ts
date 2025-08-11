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