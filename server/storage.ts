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
        name: "HOT DEALS",
        slug: "hot-deals",
        description: "Exclusive offers and limited-time deals",
        image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600",
        gradient: "from-amber-600 to-orange-700",
        icon: "fire"
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
        description: "Military FPS Game",
        price: 50,
        currency: "EGP",
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        category: "online-games",
        isPopular: true,
        stock: 9999,
        packages: ["Standard", "Premium", "Elite"],
        packagePrices: ["50", "100", "200"]
      },
      {
        id: "freefire", 
        name: "FREEFIRE",
        slug: "freefire",
        description: "Battle Royale Game",
        price: 25,
        currency: "EGP",
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        category: "mobile-games",
        isPopular: true,
        stock: 9999,
        packages: ["100 Diamonds", "310 Diamonds", "520 Diamonds"],
        packagePrices: ["25", "75", "120"]
      },
      {
        id: "pubg",
        name: "PUBG MOBILE",
        slug: "pubg-mobile", 
        description: "UC Currency",
        price: 100,
        currency: "EGP",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        category: "mobile-games",
        isPopular: true,
        stock: 9999,
        packages: ["60 UC", "325 UC", "660 UC", "1800 UC"],
        packagePrices: ["30", "100", "200", "500"]
      },
      {
        id: "roblox",
        name: "ROBLOX",
        slug: "roblox",
        description: "Robux Currency", 
        price: 80,
        currency: "EGP",
        image: "https://pixabay.com/get/g19762184a330df869b33c9a4ffa03500a279be4001ad2290376ea1b13def6a5c475807b1db8c2a5633c59a1cb70ecd0339cab81fa13b3d02a8f43a1ef06995d6_1280.jpg",
        category: "online-games", 
        isPopular: true,
        stock: 9999,
        packages: ["80 Robux", "400 Robux", "800 Robux"],
        packagePrices: ["20", "80", "150"]
      },
      {
        id: "valorant",
        name: "VALORANT",
        slug: "valorant",
        description: "VP Points",
        price: 150,
        currency: "EGP",
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
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
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
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
        image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
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
        image: "https://pixabay.com/get/g10d26011346828455851a2f29d7cf45c7323768c32da4c5b67e074002fc3cf6689348448ff36c39a1d7f0037939acf859a63f752fb9a752c4ca1f7c91c820f03_1280.jpg",
        category: "online-games",
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
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
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
        image: "https://pixabay.com/get/g3c0405add31c7b6d079cf5046cc84a77c5afeda3ee5ba0744c408102a18f0cc66b5e4a2cc3bf2b6d4ef929e16b1dfa03bfa0e1eb0a860dcdfc8661332afa8ad2_1280.jpg",
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
        image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
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
        image: "https://pixabay.com/get/gbb6c3e781eb05d87f66084173226b926c59a88cf2715a0b42a6ed6c7e941d6b75e431d8717b2ade3ad1ab04343fc4c4c9378fccdb0888ad8bb8660e63ff72405_1280.jpg",
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
        image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&h=200",
        category: "mobile-games",
        isPopular: true,
        stock: 9999,
        packages: ["100 Coins", "500 Coins", "1000 Coins", "2500 Coins", "5000 Coins"],
        packagePrices: ["10", "45", "85", "200", "380"]
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
    const game: Game = { ...insertGame };
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
