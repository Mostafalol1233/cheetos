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
      { id: "crossfire", name: "CROSSFIRE", slug: "crossfire", description: "ZP Points & Weapons", price: "50.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 ZP", "5000 ZP"], packagePrices: ["50.00", "240.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "freefire", name: "FREE FIRE", slug: "freefire", description: "Diamonds & Battle Pass", price: "90.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["100 Diamonds"], packagePrices: ["90.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "pubg", name: "PUBG MOBILE", slug: "pubg-mobile", description: "UC Currency & Royal Pass", price: "29.99", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["60 UC"], packagePrices: ["29.99"], discountPrice: null, packageDiscountPrices: null },
      { id: "roblox", name: "ROBLOX", slug: "roblox", description: "Robux Currency & Premium", price: "250.00", currency: "EGP", image: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["400 Robux"], packagePrices: ["250.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "lol", name: "LEAGUE OF LEGENDS", slug: "league-of-legends", description: "RP Points", price: "125.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["650 RP"], packagePrices: ["125.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "callofduty", name: "CALL OF DUTY", slug: "call-of-duty", description: "COD Points & Battle Pass", price: "250.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 COD Points"], packagePrices: ["250.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "valorant", name: "VALORANT", slug: "valorant", description: "VP Points & Battle Pass", price: "200.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["475 VP"], packagePrices: ["200.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "cod-mobile", name: "COD MOBILE", slug: "cod-mobile", description: "CP Points & Battle Pass", price: "150.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["320 CP"], packagePrices: ["150.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "apex", name: "APEX LEGENDS", slug: "apex-legends", description: "Apex Coins & Battle Pass", price: "280.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 Apex Coins"], packagePrices: ["280.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "clash-royale", name: "CLASH ROYALE", slug: "clash-royale", description: "Gems & Gold", price: "40.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "clash-clans", name: "CLASH OF CLANS", slug: "clash-of-clans", description: "Gems & Gold Pass", price: "40.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "fortnite", name: "FORTNITE", slug: "fortnite", description: "V-Bucks & Battle Pass", price: "200.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: false, stock: randomStock(), packages: ["1000 V-Bucks"], packagePrices: ["200.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "minecraft", name: "MINECRAFT", slug: "minecraft", description: "Minecoins & Realms", price: "100.00", currency: "EGP", image: "https://images.unsplash.com/photo-1628260412297-a3377e45006f?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: false, stock: randomStock(), packages: ["320 Minecoins"], packagePrices: ["100.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "gta5", name: "GTA V ONLINE", slug: "gta-v-online", description: "Shark Cards & Premium", price: "300.00", currency: "EGP", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["$100,000 Red Shark Card"], packagePrices: ["300.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "steam", name: "STEAM WALLET", slug: "steam-wallet", description: "Steam Wallet Codes", price: "500.00", currency: "EGP", image: "https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=500&auto=format&fit=crop&q=60", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null, discountPrice: null, packageDiscountPrices: null },
      { id: "playstore", name: "GOOGLE PLAY STORE", slug: "google-play-store", description: "Google Play Gift Cards", price: "250.00", currency: "EGP", image: "https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?w=500&auto=format&fit=crop&q=60", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null, discountPrice: null, packageDiscountPrices: null },
      { id: "playstation", name: "PLAYSTATION STORE", slug: "playstation-store", description: "PlayStation Store Gift Cards", price: "500.00", currency: "EGP", image: "https://images.unsplash.com/photo-1606318801954-d46d46d3360a?w=500&auto=format&fit=crop&q=60", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null, discountPrice: null, packageDiscountPrices: null },
      { id: "netflix", name: "NETFLIX", slug: "netflix", description: "Netflix Subscription Cards", price: "200.00", currency: "EGP", image: "https://images.unsplash.com/photo-1574375927938-d5a98e8efe30?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1 Month Subscription"], packagePrices: ["200.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "genshin", name: "GENSHIN IMPACT", slug: "genshin-impact", description: "Primogems & Genesis Crystals", price: "125.00", currency: "EGP", image: "https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=500&auto=format&fit=crop&q=60", category: "online-games", isPopular: true, stock: randomStock(), packages: ["60 Genesis Crystals", "300 Genesis Crystals", "980 Genesis Crystals", "1980 Genesis Crystals", "3280 Genesis Crystals", "6480 Genesis Crystals"], packagePrices: ["125.00", "250.00", "590.00", "1090.00", "1700.00", "3300.00"], discountPrice: null, packageDiscountPrices: null },
      { id: "garena", name: "GARENA SHELLS", slug: "garena-shells", description: "Shells for Free Fire & LoL", price: "50.00", currency: "EGP", image: "https://images.unsplash.com/photo-1563013544-824ae1b704d3?w=500&auto=format&fit=crop&q=60", category: "gift-cards", isPopular: true, stock: randomStock(), packages: ["100 Shells", "200 Shells", "330 Shells", "500 Shells", "1000 Shells"], packagePrices: ["50.00", "100.00", "165.00", "250.00", "500.00"], discountPrice: null, packageDiscountPrices: null }
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
      customerName: tx.customerName || null,
      customerPhone: tx.customerPhone || null,
      totalAmount: Number(tx.totalAmount),
      status: (tx as any).status ? String((tx as any).status) : 'pending',
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
