import { 
  type Game, 
  type InsertGame, 
  type Category, 
  type InsertCategory,
  type User,
  type InsertUser,
  type UserGameHistory,
  type InsertUserGameHistory,
  type Achievement,
  type InsertAchievement,
  type UserAchievement,
  type InsertUserAchievement,
  type SocialShare,
  type InsertSocialShare,
  type GameRecommendation
} from "@shared/schema";
import { db } from "./db";
import { 
  games,
  categories,
  users,
  userGameHistory,
  achievements,
  userAchievements,
  socialShares
} from "@shared/schema";
import { eq, desc, and, count, sql, inArray, like } from "drizzle-orm";

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

  // Users & Tracking
  getOrCreateUser(sessionId: string): Promise<User>;
  trackUserAction(userId: string, gameId: string, action: string, metadata?: any): Promise<UserGameHistory>;
  
  // Recommendations
  getRecommendationsForUser(userId: string): Promise<GameRecommendation[]>;
  
  // Achievements
  getAchievements(): Promise<Achievement[]>;
  getUserAchievements(userId: string): Promise<UserAchievement[]>;
  updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement>;
  
  // Social
  trackSocialShare(userId: string, gameId: string, platform: string): Promise<SocialShare>;
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
        image: "/attached_assets/3PUV4qNkMVDI.png",
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

  // Stub implementations for new methods (MemStorage fallback)
  async getOrCreateUser(sessionId: string): Promise<User> {
    throw new Error("User tracking not available in memory storage");
  }

  async trackUserAction(userId: string, gameId: string, action: string, metadata?: any): Promise<UserGameHistory> {
    throw new Error("User tracking not available in memory storage");
  }

  async getRecommendationsForUser(userId: string): Promise<GameRecommendation[]> {
    // Return random popular games as fallback
    const popularGames = await this.getPopularGames();
    return popularGames.slice(0, 4).map(game => ({
      game,
      score: Math.random(),
      reason: "Popular game"
    }));
  }

  async getAchievements(): Promise<Achievement[]> {
    return [];
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return [];
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement> {
    throw new Error("Achievements not available in memory storage");
  }

  async trackSocialShare(userId: string, gameId: string, platform: string): Promise<SocialShare> {
    throw new Error("Social tracking not available in memory storage");
  }
}

// Database Storage Implementation with Advanced Features
export class DatabaseStorage implements IStorage {
  constructor() {
    this.seedInitialData();
  }

  private async seedInitialData() {
    // Seed achievements
    const achievementData: InsertAchievement[] = [
      {
        id: "explorer-1",
        name: "Window Shopper",
        description: "View 5 different games",
        icon: "eye",
        category: "explorer",
        threshold: 5,
        points: 100
      },
      {
        id: "explorer-2", 
        name: "Gaming Enthusiast",
        description: "View 20 different games",
        icon: "binoculars",
        category: "explorer",
        threshold: 20,
        points: 250
      },
      {
        id: "collector-1",
        name: "First Purchase",
        description: "Add your first game to cart",
        icon: "shopping-cart",
        category: "collector",
        threshold: 1,
        points: 200
      },
      {
        id: "collector-2",
        name: "Cart Master",
        description: "Add 10 games to cart",
        icon: "shopping-bag",
        category: "collector",
        threshold: 10,
        points: 500
      },
      {
        id: "social-1",
        name: "Share the Joy",
        description: "Share your first game discovery",
        icon: "share-2",
        category: "social", 
        threshold: 1,
        points: 150
      },
      {
        id: "social-2",
        name: "Social Butterfly",
        description: "Share 5 game discoveries",
        icon: "users",
        category: "social",
        threshold: 5,
        points: 350
      }
    ];

    try {
      await db.insert(achievements).values(achievementData).onConflictDoNothing();
    } catch (error) {
      // Achievements already exist, no problem
    }
  }

  // Games Implementation
  async getGames(): Promise<Game[]> {
    return await db.select().from(games);
  }

  async getGameById(id: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.id, id));
    return game;
  }

  async getGameBySlug(slug: string): Promise<Game | undefined> {
    const [game] = await db.select().from(games).where(eq(games.slug, slug));
    return game;
  }

  async getGamesByCategory(category: string): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.category, category));
  }

  async getPopularGames(): Promise<Game[]> {
    return await db.select().from(games).where(eq(games.isPopular, true));
  }

  async createGame(insertGame: InsertGame): Promise<Game> {
    const [game] = await db.insert(games).values(insertGame).returning();
    return game;
  }

  // Categories Implementation
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories);
  }

  async getCategoryById(id: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.id, id));
    return category;
  }

  async createCategory(insertCategory: InsertCategory): Promise<Category> {
    const [category] = await db.insert(categories).values(insertCategory).returning();
    return category;
  }

  // User & Tracking Implementation
  async getOrCreateUser(sessionId: string): Promise<User> {
    let [user] = await db.select().from(users).where(eq(users.sessionId, sessionId));
    
    if (!user) {
      [user] = await db.insert(users).values({
        sessionId,
        preferences: {},
      }).returning();
    } else {
      // Update last active
      [user] = await db.update(users)
        .set({ lastActive: new Date() })
        .where(eq(users.id, user.id))
        .returning();
    }
    
    return user;
  }

  async trackUserAction(userId: string, gameId: string, action: string, metadata: any = {}): Promise<UserGameHistory> {
    const [history] = await db.insert(userGameHistory).values({
      userId,
      gameId,
      action,
      metadata
    }).returning();

    // Update achievement progress
    await this.updateAchievementProgressForAction(userId, action);
    
    return history;
  }

  private async updateAchievementProgressForAction(userId: string, action: string) {
    // Get relevant achievements based on action
    const relevantAchievements = await db.select().from(achievements)
      .where(action === 'viewed' ? eq(achievements.category, 'explorer') : eq(achievements.category, 'collector'));

    for (const achievement of relevantAchievements) {
      // Count user's progress for this type of action
      const [progressCount] = await db.select({ count: count() })
        .from(userGameHistory)
        .where(and(
          eq(userGameHistory.userId, userId),
          eq(userGameHistory.action, action)
        ));

      await this.updateAchievementProgress(userId, achievement.id, progressCount.count);
    }
  }

  // Recommendation Engine
  async getRecommendationsForUser(userId: string): Promise<GameRecommendation[]> {
    // Get user's game history
    const userHistory = await db.select({
      gameId: userGameHistory.gameId,
      action: userGameHistory.action,
      game: games
    })
    .from(userGameHistory)
    .innerJoin(games, eq(userGameHistory.gameId, games.id))
    .where(eq(userGameHistory.userId, userId))
    .orderBy(desc(userGameHistory.timestamp));

    // Get user's viewed/purchased games
    const viewedGames = new Set(userHistory.map(h => h.gameId));
    const purchasedGames = new Set(
      userHistory.filter(h => h.action === 'added_to_cart').map(h => h.gameId)
    );

    // Get user's preferred categories
    const categoryPreferences = new Map<string, number>();
    userHistory.forEach(h => {
      const category = h.game.category;
      categoryPreferences.set(category, (categoryPreferences.get(category) || 0) + 1);
    });

    // Get all games not yet viewed
    const allGames = await this.getGames();
    const candidateGames = allGames.filter(game => !viewedGames.has(game.id));

    // Score recommendations
    const recommendations: GameRecommendation[] = candidateGames.map(game => {
      let score = 0;
      let reason = "Recommended for you";

      // Category preference score
      const categoryScore = categoryPreferences.get(game.category) || 0;
      score += categoryScore * 0.4;

      // Popular games boost
      if (game.isPopular) {
        score += 0.3;
        reason = "Popular game in your interests";
      }

      // Price similarity to purchased games
      if (purchasedGames.size > 0) {
        const avgPurchasePrice = userHistory
          .filter(h => h.action === 'added_to_cart')
          .reduce((sum, h) => sum + h.game.price, 0) / purchasedGames.size;
        
        const priceDiff = Math.abs(game.price - avgPurchasePrice) / avgPurchasePrice;
        score += (1 - priceDiff) * 0.2;
      }

      // Category-based reasons
      if (categoryScore > 0) {
        reason = `Similar to your ${game.category.replace('-', ' ')} preferences`;
      }

      return { game, score, reason };
    });

    // Sort by score and return top recommendations
    return recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);
  }

  // Achievements Implementation
  async getAchievements(): Promise<Achievement[]> {
    return await db.select().from(achievements);
  }

  async getUserAchievements(userId: string): Promise<UserAchievement[]> {
    return await db.select({
      id: userAchievements.id,
      userId: userAchievements.userId,
      achievementId: userAchievements.achievementId,
      progress: userAchievements.progress,
      completed: userAchievements.completed,
      completedAt: userAchievements.completedAt
    })
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));
  }

  async updateAchievementProgress(userId: string, achievementId: string, progress: number): Promise<UserAchievement> {
    // Get achievement details
    const [achievement] = await db.select().from(achievements).where(eq(achievements.id, achievementId));
    if (!achievement) throw new Error("Achievement not found");

    // Get or create user achievement record
    let [userAchievement] = await db.select().from(userAchievements)
      .where(and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      ));

    const isCompleted = progress >= achievement.threshold;
    const completedAt = isCompleted && !userAchievement?.completed ? new Date() : userAchievement?.completedAt;

    if (!userAchievement) {
      [userAchievement] = await db.insert(userAchievements).values({
        userId,
        achievementId,
        progress,
        completed: isCompleted,
        completedAt
      }).returning();
    } else {
      [userAchievement] = await db.update(userAchievements)
        .set({
          progress,
          completed: isCompleted,
          completedAt
        })
        .where(eq(userAchievements.id, userAchievement.id))
        .returning();
    }

    return userAchievement;
  }

  // Social Sharing
  async trackSocialShare(userId: string, gameId: string, platform: string): Promise<SocialShare> {
    const [share] = await db.insert(socialShares).values({
      userId,
      gameId,
      platform
    }).returning();

    // Update social achievement progress
    const shareCount = await db.select({ count: count() })
      .from(socialShares)
      .where(eq(socialShares.userId, userId));

    const socialAchievements = await db.select().from(achievements)
      .where(eq(achievements.category, 'social'));

    for (const achievement of socialAchievements) {
      await this.updateAchievementProgress(userId, achievement.id, shareCount[0].count);
    }

    return share;
  }
}

export const storage = new DatabaseStorage();
