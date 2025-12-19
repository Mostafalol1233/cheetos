import { 
  type Game, 
  type InsertGame, 
  type Category, 
  type InsertCategory
} from "@shared/schema";

export interface IStorage {
  getGames(): Promise<Game[]>;
  getGameById(id: string): Promise<Game | undefined>;
  getGameBySlug(slug: string): Promise<Game | undefined>;
  getGamesByCategory(category: string): Promise<Game[]>;
  getPopularGames(): Promise<Game[]>;
  createGame(game: InsertGame): Promise<Game>;
  updateGame(id: string, game: Partial<Game>): Promise<Game | undefined>;
  deleteGame(id: string): Promise<boolean>;
  getCategories(): Promise<Category[]>;
  getCategoryById(id: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
}

const randomStock = () => Math.floor(Math.random() * 71) + 30;

export class MemStorage implements IStorage {
  private games: Map<string, Game> = new Map();
  private categories: Map<string, Category> = new Map();

  constructor() {
    this.initialize();
  }

  private initialize() {
    const categoryData: Category[] = [
      { id: "hot-deals", name: "HOT DEALS", slug: "hot-deals", description: "Limited time offers and special prices", image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-red-600 to-orange-600", icon: "Zap" },
      { id: "online-games", name: "ONLINE GAMES", slug: "online-games", description: "PC and console game credits", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-blue-600 to-purple-700", icon: "Monitor" },
      { id: "mobile-games", name: "MOBILE GAMES", slug: "mobile-games", description: "Mobile game currencies and items", image: "https://pixabay.com/get/g90b527228ccda2f18b3f0e3084562c379b9c93c65ed89df111aca00916e1de7d1ddf33e39091e139d840610f9b4eafcf17b00169a6a1680e66eea5c28fed5595_1280.jpg", gradient: "from-red-600 to-pink-700", icon: "Smartphone" },
      { id: "gift-cards", name: "GIFT CARDS", slug: "gift-cards", description: "Digital vouchers and gift cards", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-green-600 to-teal-700", icon: "Gift" }
    ];

    categoryData.forEach(cat => this.categories.set(cat.id, cat));

    const gameData: Game[] = [
      { id: "crossfire", name: "CROSSFIRE", slug: "crossfire", description: "ZP Points & Weapons", price: "50.00", currency: "EGP", image: "/attached_assets/generated_images/crossfire_tactical_game_artwork.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 ZP", "5000 ZP"], packagePrices: ["50.00", "240.00"] },
      { id: "freefire", name: "FREE FIRE", slug: "freefire", description: "Diamonds & Battle Pass", price: "90.00", currency: "EGP", image: "/attached_assets/FREE_FIRE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["100 Diamonds"], packagePrices: ["90.00"] },
      { id: "pubg", name: "PUBG MOBILE", slug: "pubg-mobile", description: "UC Currency & Royal Pass", price: "29.99", currency: "EGP", image: "/attached_assets/generated_images/pubg_mobile_battle_royale_scene.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["60 UC"], packagePrices: ["29.99"] },
      { id: "roblox", name: "ROBLOX", slug: "roblox", description: "Robux Currency & Premium", price: "250.00", currency: "EGP", image: "/attached_assets/ROBLOX.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["400 Robux"], packagePrices: ["250.00"] },
      { id: "lol", name: "LEAGUE OF LEGENDS", slug: "league-of-legends", description: "RP Points", price: "125.00", currency: "EGP", image: "/attached_assets/LEAGUE_OF_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["650 RP"], packagePrices: ["125.00"] },
      { id: "callofduty", name: "CALL OF DUTY", slug: "call-of-duty", description: "COD Points & Battle Pass", price: "250.00", currency: "EGP", image: "/attached_assets/generated_images/call_of_duty_modern_warfare_soldier.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 COD Points"], packagePrices: ["250.00"] },
      { id: "valorant", name: "VALORANT", slug: "valorant", description: "VP Points & Battle Pass", price: "200.00", currency: "EGP", image: "/attached_assets/VALORANT.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["475 VP"], packagePrices: ["200.00"] },
      { id: "cod-mobile", name: "COD MOBILE", slug: "cod-mobile", description: "CP Points & Battle Pass", price: "150.00", currency: "EGP", image: "/attached_assets/COD_MOBILE.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["320 CP"], packagePrices: ["150.00"] },
      { id: "apex", name: "APEX LEGENDS", slug: "apex-legends", description: "Apex Coins & Battle Pass", price: "280.00", currency: "EGP", image: "/attached_assets/APEX_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 Apex Coins"], packagePrices: ["280.00"] },
      { id: "clash-royale", name: "CLASH ROYALE", slug: "clash-royale", description: "Gems & Gold", price: "40.00", currency: "EGP", image: "/attached_assets/CLASH_ROYALE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "clash-clans", name: "CLASH OF CLANS", slug: "clash-of-clans", description: "Gems & Gold Pass", price: "40.00", currency: "EGP", image: "/attached_assets/CLASH_OF_CLANS.webp", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "fortnite", name: "FORTNITE", slug: "fortnite", description: "V-Bucks & Battle Pass", price: "200.00", currency: "EGP", image: "/attached_assets/FORTNITE.jpg", category: "online-games", isPopular: false, stock: randomStock(), packages: ["1000 V-Bucks"], packagePrices: ["200.00"] },
      { id: "minecraft", name: "MINECRAFT", slug: "minecraft", description: "Minecoins & Realms", price: "100.00", currency: "EGP", image: "/attached_assets/MINECRAFT.png", category: "online-games", isPopular: false, stock: randomStock(), packages: ["320 Minecoins"], packagePrices: ["100.00"] },
      { id: "gta5", name: "GTA V ONLINE", slug: "gta-v-online", description: "Shark Cards & Premium", price: "300.00", currency: "EGP", image: "/attached_assets/OIP_1754946009491.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["$100,000 Red Shark Card"], packagePrices: ["300.00"] },
      { id: "steam", name: "STEAM WALLET", slug: "steam-wallet", description: "Steam Wallet Codes", price: "500.00", currency: "EGP", image: "/attached_assets/image_1754945109051.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstore", name: "GOOGLE PLAY STORE", slug: "google-play-store", description: "Google Play Gift Cards", price: "250.00", currency: "EGP", image: "/attached_assets/image_1754945106383.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstation", name: "PLAYSTATION STORE", slug: "playstation-store", description: "PlayStation Store Gift Cards", price: "500.00", currency: "EGP", image: "/attached_assets/image_1754945102153.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "netflix", name: "NETFLIX", slug: "netflix", description: "Netflix Subscription Cards", price: "200.00", currency: "EGP", image: "/attached_assets/OIP_1754945924514.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1 Month Subscription"], packagePrices: ["200.00"] }
    ];

    gameData.forEach(game => this.games.set(game.id, game));
  }

  async getGames(): Promise<Game[]> {
    return Array.from(this.games.values());
  }

  async getGameById(id: string): Promise<Game | undefined> {
    return this.games.get(id);
  }

  async getGameBySlug(slug: string): Promise<Game | undefined> {
    return Array.from(this.games.values()).find(g => g.slug === slug);
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return Array.from(this.games.values()).filter(g => g.category === category);
  }

  async getPopularGames(): Promise<Game[]> {
    return Array.from(this.games.values()).filter(g => g.isPopular);
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const game: Game = { ...insertGame, price: String(insertGame.price) } as Game;
    this.games.set(game.id, game);
    return game;
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const category: Category = insertCategory as Category;
    this.categories.set(category.id, category);
    return category;
  }
}

export const storage = new MemStorage();
