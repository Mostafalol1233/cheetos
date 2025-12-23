
import fs from "fs";
import path from "path";

const DATA_DIR = path.join(process.cwd(), "data");

export class MemStorage {
  constructor() {
    this.games = new Map();
    this.categories = new Map();
    this.chatMessages = new Map();
    this.users = new Map();
    this.transactions = new Map();
    this.whatsappMessages = new Map();
    this.sellerAlerts = new Map();
    this.posts = new Map();
    this.tutorials = new Map();
    this.seoSettings = {
      title: "GameCart | Digital Game Store",
      description: "Buy game credits, gift cards, and more instantly.",
      keywords: "games, credits, gift cards, pubg, freefire",
      ogImage: "/public/og-image.jpg"
    };
    
    // Ensure data directory exists
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }

    this.initialize();
  }

  // Load data from JSON files if they exist, otherwise use defaults
  initialize() {
    this.loadData("games", this.games);
    this.loadData("categories", this.categories);
    this.loadData("chatMessages", this.chatMessages);
    this.loadData("users", this.users);
    this.loadData("transactions", this.transactions);
    this.loadData("whatsappMessages", this.whatsappMessages);
    this.loadData("sellerAlerts", this.sellerAlerts);
    this.loadData("posts", this.posts);
    this.loadData("tutorials", this.tutorials);
    
    // SEO settings is an object, not a Map
    const seoFile = path.join(DATA_DIR, "seo.json");
    if (fs.existsSync(seoFile)) {
      try {
        const data = JSON.parse(fs.readFileSync(seoFile, "utf-8"));
        this.seoSettings = { ...this.seoSettings, ...data };
      } catch (err) {
        console.error("Failed to load seo.json:", err);
      }
    }

    // If categories are empty (first run), populate defaults
    if (this.categories.size === 0) {
      this.populateDefaults();
    }
  }

  populateDefaults() {
    const categoryData = [
      { id: "hot-deals", name: "HOT DEALS", slug: "hot-deals", description: "Limited time offers and special prices", image: "https://images.unsplash.com/photo-1607083206869-4c7672e72a8a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-red-600 to-orange-600", icon: "Zap" },
      { id: "online-games", name: "ONLINE GAMES", slug: "online-games", description: "PC and console game credits", image: "https://images.unsplash.com/photo-1542751371-adc38448a05e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-blue-600 to-purple-700", icon: "Monitor" },
      { id: "mobile-games", name: "MOBILE GAMES", slug: "mobile-games", description: "Mobile game currencies and items", image: "https://pixabay.com/get/g90b527228ccda2f18b3f0e3084562c379b9c93c65ed89df111aca00916e1de7d1ddf33e39091e139d840610f9b4eafcf17b00169a6a1680e66eea5c28fed5595_1280.jpg", gradient: "from-red-600 to-pink-700", icon: "Smartphone" },
      { id: "gift-cards", name: "GIFT CARDS", slug: "gift-cards", description: "Digital vouchers and gift cards", image: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600", gradient: "from-green-600 to-teal-700", icon: "Gift" }
    ];

    categoryData.forEach(cat => this.categories.set(cat.id, cat));
    this.saveData("categories", this.categories);

    const randomStock = () => Math.floor(Math.random() * 71) + 30;

    const gameData = [
      { id: "crossfire", name: "CROSSFIRE", slug: "crossfire", description: "ZP Points & Weapons", price: "50.00", currency: "EGP", image: "/public/assets/crossfire_tactical_game_artwork.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 ZP", "5000 ZP"], packagePrices: ["50.00", "240.00"] },
      { id: "freefire", name: "FREE FIRE", slug: "freefire", description: "Diamonds & Battle Pass", price: "90.00", currency: "EGP", image: "/public/assets/FREE_FIRE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["100 Diamonds"], packagePrices: ["90.00"] },
      { id: "pubg", name: "PUBG MOBILE", slug: "pubg-mobile", description: "UC Currency & Royal Pass", price: "29.99", currency: "EGP", image: "/public/assets/pubg_mobile_battle_royale_scene.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["60 UC"], packagePrices: ["29.99"] },
      { id: "roblox", name: "ROBLOX", slug: "roblox", description: "Robux Currency & Premium", price: "250.00", currency: "EGP", image: "/public/assets/ROBLOX.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["400 Robux"], packagePrices: ["250.00"] },
      { id: "lol", name: "LEAGUE OF LEGENDS", slug: "league-of-legends", description: "RP Points", price: "125.00", currency: "EGP", image: "/public/assets/LEAGUE_OF_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["650 RP"], packagePrices: ["125.00"] },
      { id: "callofduty", name: "CALL OF DUTY", slug: "call-of-duty", description: "COD Points & Battle Pass", price: "250.00", currency: "EGP", image: "/public/assets/call_of_duty_modern_warfare_soldier.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 COD Points"], packagePrices: ["250.00"] },
      { id: "valorant", name: "VALORANT", slug: "valorant", description: "VP Points & Battle Pass", price: "200.00", currency: "EGP", image: "/public/assets/VALORANT.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["475 VP"], packagePrices: ["200.00"] },
      { id: "cod-mobile", name: "COD MOBILE", slug: "cod-mobile", description: "CP Points & Battle Pass", price: "150.00", currency: "EGP", image: "/public/assets/COD_MOBILE.png", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["320 CP"], packagePrices: ["150.00"] },
      { id: "apex", name: "APEX LEGENDS", slug: "apex-legends", description: "Apex Coins & Battle Pass", price: "280.00", currency: "EGP", image: "/public/assets/APEX_LEGENDS.png", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1000 Apex Coins"], packagePrices: ["280.00"] },
      { id: "clash-royale", name: "CLASH ROYALE", slug: "clash-royale", description: "Gems & Gold", price: "40.00", currency: "EGP", image: "/public/assets/CLASH_ROYALE.jpg", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "clash-clans", name: "CLASH OF CLANS", slug: "clash-of-clans", description: "Gems & Gold Pass", price: "40.00", currency: "EGP", image: "/public/assets/CLASH_OF_CLANS.webp", category: "mobile-games", isPopular: true, stock: randomStock(), packages: ["80 Gems"], packagePrices: ["40.00"] },
      { id: "fortnite", name: "FORTNITE", slug: "fortnite", description: "V-Bucks & Battle Pass", price: "200.00", currency: "EGP", image: "/public/assets/FORTNITE.jpg", category: "online-games", isPopular: false, stock: randomStock(), packages: ["1000 V-Bucks"], packagePrices: ["200.00"] },
      { id: "minecraft", name: "MINECRAFT", slug: "minecraft", description: "Minecoins & Realms", price: "100.00", currency: "EGP", image: "/public/assets/MINECRAFT.png", category: "online-games", isPopular: false, stock: randomStock(), packages: ["320 Minecoins"], packagePrices: ["100.00"] },
      { id: "gta5", name: "GTA V ONLINE", slug: "gta-v-online", description: "Shark Cards & Premium", price: "300.00", currency: "EGP", image: "/public/assets/OIP_1754946009491.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["$100,000 Red Shark Card"], packagePrices: ["300.00"] },
      { id: "steam", name: "STEAM WALLET", slug: "steam-wallet", description: "Steam Wallet Codes", price: "500.00", currency: "EGP", image: "/public/assets/image_1754945109051.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstore", name: "GOOGLE PLAY STORE", slug: "google-play-store", description: "Google Play Gift Cards", price: "250.00", currency: "EGP", image: "/public/assets/image_1754945106383.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "playstation", name: "PLAYSTATION STORE", slug: "playstation-store", description: "PlayStation Store Gift Cards", price: "500.00", currency: "EGP", image: "/public/assets/image_1754945102153.png", category: "gift-cards", isPopular: true, stock: randomStock(), packages: null, packagePrices: null },
      { id: "netflix", name: "NETFLIX", slug: "netflix", description: "Netflix Subscription Cards", price: "200.00", currency: "EGP", image: "/public/assets/OIP_1754945924514.jpg", category: "online-games", isPopular: true, stock: randomStock(), packages: ["1 Month Subscription"], packagePrices: ["200.00"] }
    ];

    gameData.forEach(game => this.games.set(game.id, game));
    this.saveData("games", this.games);
  }

  loadData(key, map) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    if (fs.existsSync(filePath)) {
      try {
        const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));
        if (Array.isArray(data)) {
          data.forEach(item => map.set(item.id, item));
        }
      } catch (err) {
        console.error(`Failed to load ${key}.json:`, err);
      }
    }
  }

  saveData(key, map) {
    const filePath = path.join(DATA_DIR, `${key}.json`);
    try {
      const data = Array.from(map.values());
      fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
      console.error(`Failed to save ${key}.json:`, err);
    }
  }

  saveSeo() {
    const filePath = path.join(DATA_DIR, "seo.json");
    try {
      fs.writeFileSync(filePath, JSON.stringify(this.seoSettings, null, 2));
    } catch (err) {
      console.error("Failed to save seo.json:", err);
    }
  }

  async getGames() {
    return Array.from(this.games.values());
  }

  async getGameById(id) {
    return this.games.get(id);
  }

  async getGameBySlug(slug) {
    return Array.from(this.games.values()).find(g => g.slug === slug);
  }

  async getGamesByCategory(category) {
    return Array.from(this.games.values()).filter(g => g.category === category);
  }

  async getPopularGames() {
    return Array.from(this.games.values()).filter(g => g.isPopular);
  }

  async createGame(insertGame) {
    const game = { ...insertGame, price: String(insertGame.price) };
    this.games.set(game.id, game);
    this.saveData("games", this.games);
    return game;
  }

  async updateGame(id, updates) {
    const game = this.games.get(id);
    if (!game) return undefined;
    const updated = { ...game, ...updates };
    this.games.set(id, updated);
    this.saveData("games", this.games);
    return updated;
  }

  async deleteGame(id) {
    const res = this.games.delete(id);
    this.saveData("games", this.games);
    return res;
  }

  async getCategories() {
    return Array.from(this.categories.values());
  }

  async getCategoryById(id) {
    return this.categories.get(id);
  }

  async createCategory(category) {
    const cat = { ...category };
    this.categories.set(cat.id, cat);
    this.saveData("categories", this.categories);
    return cat;
  }

  async getChatMessages(sessionId) {
    return Array.from(this.chatMessages.values())
      .filter(m => m.sessionId === sessionId)
      .sort((a, b) => a.timestamp - b.timestamp);
  }

  async createChatMessage(message) {
    const msg = { 
      ...message, 
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now()
    };
    this.chatMessages.set(msg.id, msg);
    this.saveData("chatMessages", this.chatMessages);
    return msg;
  }

  async getAllChats() {
    return Array.from(this.chatMessages.values());
  }

  async getUser(id) {
    return this.users.get(id);
  }

  async getUserByUsername(username) {
    return Array.from(this.users.values()).find(u => u.username === username);
  }

  async getUserByEmail(email) {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async createUser(user) {
    const newUser = { 
      ...user, 
      id: user.id || `user_${Date.now()}`,
      role: user.role || 'user',
      createdAt: Date.now()
    };
    this.users.set(newUser.id, newUser);
    this.saveData("users", this.users);
    return newUser;
  }

  async createTransaction(tx) {
    const newTx = {
      ...tx,
      id: tx.id,
      userId: tx.userId || null,
      customerName: tx.customerName || null,
      customerPhone: tx.customerPhone || null,
      totalAmount: Number(tx.totalAmount),
      timestamp: Date.now()
    };
    this.transactions.set(newTx.id, newTx);
    this.saveData("transactions", this.transactions);
    return newTx;
  }

  async createWhatsAppMessage(msg) {
    this.whatsappMessages.set(msg.id, msg);
    this.saveData("whatsappMessages", this.whatsappMessages);
    return msg;
  }

  async createSellerAlert(alert) {
    this.sellerAlerts.set(alert.id, alert);
    this.saveData("sellerAlerts", this.sellerAlerts);
    return alert;
  }

  async getSellerAlerts() {
    return Array.from(this.sellerAlerts.values())
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async markSellerAlertRead(id) {
    const alert = this.sellerAlerts.get(id);
    if (alert) {
      alert.read = true;
      this.sellerAlerts.set(id, alert);
      this.saveData("sellerAlerts", this.sellerAlerts);
    }
  }

  async getPosts() {
    return Array.from(this.posts.values());
  }

  async createPost(post) {
    const id = `post_${Date.now()}`;
    const newPost = { ...post, id, createdAt: Date.now() };
    this.posts.set(id, newPost);
    this.saveData("posts", this.posts);
    return newPost;
  }

  async updatePost(id, updates) {
    const post = this.posts.get(id);
    if (!post) return undefined;
    const updated = { ...post, ...updates };
    this.posts.set(id, updated);
    this.saveData("posts", this.posts);
    return updated;
  }

  async deletePost(id) {
    const res = this.posts.delete(id);
    this.saveData("posts", this.posts);
    return res;
  }

  async getTutorials() {
    return Array.from(this.tutorials.values());
  }

  async createTutorial(tutorial) {
    const id = `tut_${Date.now()}`;
    const newTut = { ...tutorial, id, createdAt: Date.now() };
    this.tutorials.set(id, newTut);
    this.saveData("tutorials", this.tutorials);
    return newTut;
  }

  async updateTutorial(id, updates) {
    const tut = this.tutorials.get(id);
    if (!tut) return undefined;
    const updated = { ...tut, ...updates };
    this.tutorials.set(id, updated);
    this.saveData("tutorials", this.tutorials);
    return updated;
  }

  async deleteTutorial(id) {
    const res = this.tutorials.delete(id);
    this.saveData("tutorials", this.tutorials);
    return res;
  }

  async getSeoSettings() {
    return this.seoSettings;
  }

  async updateSeoSettings(settings) {
    this.seoSettings = { ...this.seoSettings, ...settings };
    this.saveSeo();
    return this.seoSettings;
  }
}

export const storage = new MemStorage();
