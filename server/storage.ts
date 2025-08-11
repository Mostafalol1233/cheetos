import { type Game, type InsertGame, type Category, type InsertCategory } from "@shared/schema";

export interface IStorage {
  // Games
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  getGameBySlug(slug: string): Promise<Game | undefined>;
  getGamesByCategory(category: string): Promise<Game[]>;
  getPopularGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  
  // Categories
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
}

export class MemStorage implements IStorage {
  private games: Map<string, Game>;
  private categories: Map<string, Category>;

  constructor() {
    this.games = new Map();
    this.categories = new Map();
    this.seedData();
  }

  private seedData() {
    // Seed categories
    const categories: Category[] = [
      {
        id: "hot-deals",
        name: "العروض الخاصة",
        slug: "hot-deals",
        description: "غير متاح حالياً - قريباً عروض حصرية",
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
        gradient: "from-purple-600 to-pink-700",
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

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });

    // Seed games
    const games: Game[] = [
      {
        id: "crossfire",
        name: "CROSSFIRE", 
        slug: "crossfire",
        description: "ZP Points & Weapons",
        price: 50,
        currency: "EGP",
        image: "/attached_assets/9IkjvXJyoLcz.png",
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
        image: "/attached_assets/fvmrGYFs1bWd.png",
        category: "online-games", 
        isPopular: true,
        stock: 9999,
        packages: ["400 Robux", "800 Robux", "1,000 Robux", "1,700 Robux", "2,400 Robux", "5,250 Robux"],
        packagePrices: ["62", "124", "155", "320", "450", "1229"]
      },
      {
        id: "valorant",
        name: "VALORANT",
        slug: "valorant",
        description: "VP Points",
        price: 150,
        currency: "EGP",
        image: "/attached_assets/ng7TgBiu0Ucx.png",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["475 VP", "1000 VP", "2050 VP"],
        packagePrices: ["150", "300", "600"]
      },
      {
        id: "8ballpool",
        name: "8 BALL POOL", 
        slug: "8-ball-pool",
        description: "Coins & Cash",
        price: 30,
        currency: "EGP",
        image: "/attached_assets/fVOdgoGRKmOW.png",
        category: "mobile-games",
        isPopular: true,
        stock: 9999,
        packages: ["25K Coins", "100K Coins", "500K Coins"],
        packagePrices: ["30", "110", "500"]
      },
      {
        id: "minecraft",
        name: "MINECRAFT",
        slug: "minecraft",
        description: "Minecoins",
        price: 60, 
        currency: "EGP",
        image: "/attached_assets/Y8BRadjjEQpP.jpeg",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["1020 Minecoins", "3500 Minecoins"],
        packagePrices: ["60", "200"]
      },
      {
        id: "discord",
        name: "DISCORD",
        slug: "discord", 
        description: "Nitro Subscriptions",
        price: 120,
        currency: "EGP", 
        image: "/attached_assets/onXjRgoXMhxQ.jpg",
        category: "gift-cards",
        isPopular: true,
        stock: 9999,
        packages: ["Nitro 1 Month", "Nitro 3 Months"],
        packagePrices: ["120", "340"]
      },
      {
        id: "mobilelegends",
        name: "MOBILE LEGENDS",
        slug: "mobile-legends",
        description: "Diamonds",
        price: 45,
        currency: "EGP",
        image: "/attached_assets/10BuEgRzy7MA.jpg",
        category: "mobile-games", 
        isPopular: true,
        stock: 9999,
        packages: ["86 Diamonds", "172 Diamonds", "344 Diamonds"],
        packagePrices: ["45", "85", "160"]
      },
      {
        id: "steam",
        name: "STEAM",
        slug: "steam",
        description: "Wallet Cards",
        price: 200,
        currency: "EGP",
        image: "/attached_assets/GjvZaDsFWbFZ.jpg",
        category: "gift-cards",
        isPopular: true,
        stock: 9999,
        packages: ["20$ Card", "50$ Card", "100$ Card"],
        packagePrices: ["200", "500", "1000"]
      },
      {
        id: "lol",
        name: "LEAGUE OF LEGENDS",
        slug: "league-of-legends",
        description: "RP Points", 
        price: 75,
        currency: "EGP",
        image: "/attached_assets/bFau002DSzsQ.jpg",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["650 RP", "1380 RP", "2800 RP"],
        packagePrices: ["75", "150", "300"]
      },
      {
        id: "googleplay",
        name: "GOOGLE PLAY",
        slug: "google-play",
        description: "Gift Cards",
        price: 50,
        currency: "EGP", 
        image: "/attached_assets/g5IIKjMslT6S.jpg",
        category: "gift-cards",
        isPopular: true,
        stock: 9999,
        packages: ["25 EGP", "50 EGP", "100 EGP"],
        packagePrices: ["30", "55", "110"]
      },
      {
        id: "tiktok",
        name: "TIKTOK",
        slug: "tiktok",
        description: "Coins & Gifts",
        price: 10,
        currency: "EGP",
        image: "/attached_assets/x1MBSN3bxZgz.png",
        category: "mobile-games",
        isPopular: true,
        stock: 9999,
        packages: ["100 Coins", "500 Coins", "1000 Coins", "2500 Coins", "5000 Coins"],
        packagePrices: ["10", "45", "85", "200", "380"]
      },
      {
        id: "fortnite",
        name: "FORTNITE",
        slug: "fortnite",
        description: "V-Bucks & Battle Pass",
        price: 120,
        currency: "EGP",
        image: "/attached_assets/5IdYpWiPNmzE.jpg",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["1,000 V-Bucks", "2,800 V-Bucks", "5,000 V-Bucks", "13,500 V-Bucks"],
        packagePrices: ["120", "320", "550", "1200"]
      },
      {
        id: "callofduty",
        name: "CALL OF DUTY",
        slug: "call-of-duty",
        description: "COD Points & Battle Pass",
        price: 150,
        currency: "EGP",
        image: "/attached_assets/ckPuB6N0MNQg.jpg",
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
        image: "/attached_assets/ckPuB6N0MNQg.jpg",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["1,000 AC", "2,150 AC", "4,350 AC", "10,000 AC"],
        packagePrices: ["140", "280", "520", "1100"]
      }
    ];

    games.forEach(game => {
      this.games.set(game.id, game);
    });
  }

  // Games
  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameBySlug(slug: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(game => game.slug === slug);
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.category === category);
  }

  async getPopularGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(game => game.isPopular);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = { 
      ...insertGame,
      currency: insertGame.currency || "EGP",
      isPopular: insertGame.isPopular ?? false,
      stock: insertGame.stock ?? 9999,
      packages: insertGame.packages ?? [],
      packagePrices: insertGame.packagePrices ?? []
    };
    this.games.set(game.id, game);
    return game;
  }

  // Categories
  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = { ...insertCategory };
    this.categories.set(category.id, category);
    return category;
  }
}

export const storage = new MemStorage();
