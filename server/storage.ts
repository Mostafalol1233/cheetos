import { 
  type Game, 
  type InsertGame, 
  type Category, 
  type InsertCategory,
  type ChatMessage,
  type InsertChatMessage,
  type User,
  type InsertUser,
  type InsertTransaction,
  type InsertChatMessageTable
} from "@shared/schema";

// Helper types for manual management since we aren't using Drizzle types fully for in-memory
export type Transaction = {
  id: string;
  userId: string | null;
  totalAmount: number;
  status: string;
  items: string;
  paymentMethod: string;
  customerName: string | null;
  customerPhone: string | null;
  timestamp: number;
};

export type WhatsAppMessage = {
  id: string;
  waMessageId: string | null;
  direction: string;
  fromPhone: string | null;
  toPhone: string | null;
  message: string | null;
  timestamp: number;
  status: string | null;
};

export type SellerAlert = {
  id: string;
  type: string;
  summary: string | null;
  read: boolean | null;
  flagged: boolean | null;
  createdAt: number;
};

export interface IStorage {
  // Games & Categories
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
  
  // Chat
  getChatMessages(sessionId: string): Promise<ChatMessage[]>;
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getAllChats(): Promise<ChatMessage[]>;

  // Users
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Transactions
  createTransaction(tx: InsertTransaction & { id: string }): Promise<Transaction>;
  
  // WhatsApp
  createWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppMessage>;
  
  // Alerts
  createSellerAlert(alert: SellerAlert): Promise<SellerAlert>;
  getSellerAlerts(): Promise<SellerAlert[]>;
  markSellerAlertRead(id: string): Promise<void>;
}

const randomStock = () => Math.floor(Math.random() * 71) + 30;

export class MemStorage implements IStorage {
  private games: Map<string, Game> = new Map();
  private categories: Map<string, Category> = new Map();
  private chatMessages: Map<string, ChatMessage> = new Map(); // Stores simple messages
  private dbChatMessages: Map<string, any> = new Map(); // Stores DB schema messages
  private users: Map<string, User> = new Map();
  private transactions: Map<string, Transaction> = new Map();
  private whatsappMessages: Map<string, WhatsAppMessage> = new Map();
  private sellerAlerts: Map<string, SellerAlert> = new Map();

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
      { id: "crossfire", name: "CROSSFIRE", slug: "crossfire", description: "ZP Points & Weapons", price: "50.00", oldPrice: null, currency: "EGP", image: "/attached_assets/generated_images/crossfire_tactical_game_artwork.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 ZP", "5000 ZP"], packagePrices: ["50.00", "240.00"] },
      { id: "freefire", name: "FREE FIRE", slug: "freefire", description: "Diamonds & Battle Pass", price: "90.00", oldPrice: null, currency: "EGP", image: "/attached_assets/FREE_FIRE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["100 Diamonds"], packagePrices: ["90.00"] },
      { id: "pubg", name: "PUBG MOBILE", slug: "pubg-mobile", description: "UC Currency & Royal Pass", price: "29.99", oldPrice: null, currency: "EGP", image: "/attached_assets/generated_images/pubg_mobile_battle_royale_scene.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["60 UC"], packagePrices: ["29.99"] },
      { id: "roblox", name: "ROBLOX", slug: "roblox", description: "Robux Currency & Premium", price: "250.00", oldPrice: null, currency: "EGP", image: "/attached_assets/ROBLOX.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["400 Robux"], packagePrices: ["250.00"] },
      { id: "lol", name: "LEAGUE OF LEGENDS", slug: "league-of-legends", description: "RP Points", price: "125.00", oldPrice: null, currency: "EGP", image: "/attached_assets/LEAGUE_OF_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["650 RP"], packagePrices: ["125.00"] },
      { id: "callofduty", name: "CALL OF DUTY", slug: "call-of-duty", description: "COD Points & Battle Pass", price: "250.00", oldPrice: null, currency: "EGP", image: "/attached_assets/generated_images/call_of_duty_modern_warfare_soldier.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 COD Points"], packagePrices: ["250.00"] },
      { id: "valorant", name: "VALORANT", slug: "valorant", description: "VP Points & Battle Pass", price: "200.00", oldPrice: null, currency: "EGP", image: "/attached_assets/VALORANT.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["475 VP"], packagePrices: ["200.00"] },
      { id: "cod-mobile", name: "COD MOBILE", slug: "cod-mobile", description: "CP Points & Battle Pass", price: "150.00", oldPrice: null, currency: "EGP", image: "/attached_assets/COD_MOBILE.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["320 CP"], packagePrices: ["150.00"] },
      { id: "apex", name: "APEX LEGENDS", slug: "apex-legends", description: "Apex Coins & Battle Pass", price: "280.00", oldPrice: null, currency: "EGP", image: "/attached_assets/APEX_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 Apex Coins"], packagePrices: ["280.00"] },
      { id: "clash-royale", name: "CLASH ROYALE", slug: "clash-royale", description: "Gems & Gold", price: "40.00", oldPrice: null, currency: "EGP", image: "/attached_assets/CLASH_ROYALE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "clash-clans", name: "CLASH OF CLANS", slug: "clash-of-clans", description: "Gems & Gold Pass", price: "40.00", oldPrice: null, currency: "EGP", image: "/attached_assets/CLASH_OF_CLANS.webp", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "fortnite", name: "FORTNITE", slug: "fortnite", description: "V-Bucks & Battle Pass", price: "200.00", oldPrice: null, currency: "EGP", image: "/attached_assets/FORTNITE.jpg", category: "online-games", isPopular: false, stock: randomStock(), packages: ["1000 V-Bucks"], packagePrices: ["200.00"] },
      { id: "minecraft", name: "MINECRAFT", slug: "minecraft", description: "Minecoins & Realms", price: "100.00", oldPrice: null, currency: "EGP", image: "/attached_assets/MINECRAFT.png", category: "online-games", isPopular: false, stock: randomStock(), packages: ["320 Minecoins"], packagePrices: ["100.00"] },
      { id: "gta5", name: "GTA V ONLINE", slug: "gta-v-online", description: "Shark Cards & Premium", price: "300.00", oldPrice: null, currency: "EGP", image: "/attached_assets/OIP_1754946009491.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["$100,000 Red Shark Card"], packagePrices: ["300.00"] },
      { id: "steam", name: "STEAM WALLET", slug: "steam-wallet", description: "Steam Wallet Codes", price: "500.00", oldPrice: null, currency: "EGP", image: "/attached_assets/image_1754945109051.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstore", name: "GOOGLE PLAY STORE", slug: "google-play-store", description: "Google Play Gift Cards", price: "250.00", oldPrice: null, currency: "EGP", image: "/attached_assets/image_1754945106383.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstation", name: "PLAYSTATION STORE", slug: "playstation-store", description: "PlayStation Store Gift Cards", price: "500.00", oldPrice: null, currency: "EGP", image: "/attached_assets/image_1754945102153.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "netflix", name: "NETFLIX", slug: "netflix", description: "Netflix Subscription Cards", price: "200.00", oldPrice: null, currency: "EGP", image: "/attached_assets/OIP_1754945924514.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1 Month Subscription"], packagePrices: ["200.00"] }
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

  async updateGame(id: string, updates: Partial<Game>): Promise<Game | undefined> {
    const game = this.games.get(id);
    if (!game) return undefined;
    const updated = { ...game, ...updates };
    this.games.set(id, updated);
    return updated;
  }

  async deleteGame(id: string): Promise<boolean> {
    return this.games.delete(id);
  }

  async getCategories(): Promise<Category[]> {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    return this.categories.get(id);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const cat: Category = { ...category };
    this.categories.set(cat.id, cat);
    return cat;
  }

  async getChatMessages(sessionId: string): Promise<ChatMessage[]> {
    // Filter from simple messages
    return Array.from(this.chatMessages.values())
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async createChatMessage(message: InsertChatMessage): Promise<ChatMessage> {
    const msg: ChatMessage = { 
      ...message, 
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    this.chatMessages.set(msg.id, msg);
    return msg;
  }

  async getAllChats(): Promise<ChatMessage[]> {
    return Array.from(this.chatMessages.values());
  }

  // --- Users ---
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const newUser: User = { 
      ...user, 
      id: user.id || `user_${Date.now()}`,
      role: user.role || 'user',
      createdAt: Date.now()
    };
    this.users.set(newUser.id, newUser);
    return newUser;
  }

  // --- Transactions ---
  async createTransaction(tx: InsertTransaction & { id: string }): Promise<Transaction> {
    const newTx: Transaction = {
      ...tx,
      id: tx.id,
      userId: tx.userId || null,
      status: (tx as any).status ?? 'pending',
      customerName: tx.customerName || null,
      customerPhone: tx.customerPhone || null,
      totalAmount: Number(tx.totalAmount),
      timestamp: Date.now()
    };
    this.transactions.set(newTx.id, newTx);
    return newTx;
  }

  // --- WhatsApp ---
  async createWhatsAppMessage(msg: WhatsAppMessage): Promise<WhatsAppMessage> {
    this.whatsappMessages.set(msg.id, msg);
    return msg;
  }

  // --- Alerts ---
  async createSellerAlert(alert: SellerAlert): Promise<SellerAlert> {
    this.sellerAlerts.set(alert.id, alert);
    return alert;
  }

  async getSellerAlerts(): Promise<SellerAlert[]> {
    return Array.from(this.sellerAlerts.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async markSellerAlertRead(id: string): Promise<void> {
    const alert = this.sellerAlerts.get(id);
    if (alert) {
      alert.read = true;
      this.sellerAlerts.set(id, alert);
    }
  }
}

export const storage = new MemStorage();
