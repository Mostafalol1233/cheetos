import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Games API routes
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games" });
    }
  });

  app.get("/api/games/popular", async (req, res) => {
    try {
      const games = await storage.getPopularGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch popular games" });
    }
  });

  app.get("/api/games/:slug", async (req, res) => {
    try {
      const game = await storage.getGameBySlug(req.params.slug);
      if (!game) {
        return res.status(404).json({ error: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch game" });
    }
  });

  app.get("/api/games/category/:category", async (req, res) => {
    try {
      const games = await storage.getGamesByCategory(req.params.category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch games by category" });
    }
  });

  // Categories API routes
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.get("/api/categories/:id", async (req, res) => {
    try {
      const category = await storage.getCategoryById(req.params.id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch category" });
    }
  });

  // Advanced Features API Routes
  
  // User tracking and recommendations
  app.post("/api/user/track", async (req, res) => {
    try {
      const { sessionId, gameId, action, metadata } = req.body;
      
      // Get or create user
      const user = await storage.getOrCreateUser(sessionId);
      
      // Track action
      const history = await storage.trackUserAction(user.id, gameId, action, metadata);
      
      res.json(history);
    } catch (error) {
      console.error("Error tracking user action:", error);
      res.status(500).json({ error: "Failed to track user action" });
    }
  });

  app.get("/api/user/:sessionId/recommendations", async (req, res) => {
    try {
      const user = await storage.getOrCreateUser(req.params.sessionId);
      const recommendations = await storage.getRecommendationsForUser(user.id);
      res.json(recommendations);
    } catch (error) {
      console.error("Error getting recommendations:", error);
      res.status(500).json({ error: "Failed to get recommendations" });
    }
  });

  // Achievements API
  app.get("/api/achievements", async (req, res) => {
    try {
      const achievements = await storage.getAchievements();
      res.json(achievements);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch achievements" });
    }
  });

  app.get("/api/user/:sessionId/achievements", async (req, res) => {
    try {
      const user = await storage.getOrCreateUser(req.params.sessionId);
      const userAchievements = await storage.getUserAchievements(user.id);
      
      // Join with achievement details
      const achievements = await storage.getAchievements();
      const achievementMap = new Map(achievements.map(a => [a.id, a]));
      
      const detailedAchievements = userAchievements.map(ua => ({
        ...ua,
        achievement: achievementMap.get(ua.achievementId)
      }));
      
      res.json(detailedAchievements);
    } catch (error) {
      console.error("Error fetching user achievements:", error);
      res.status(500).json({ error: "Failed to fetch user achievements" });
    }
  });

  // Social sharing
  app.post("/api/user/share", async (req, res) => {
    try {
      const { sessionId, gameId, platform } = req.body;
      
      const user = await storage.getOrCreateUser(sessionId);
      const share = await storage.trackSocialShare(user.id, gameId, platform);
      
      res.json(share);
    } catch (error) {
      console.error("Error tracking social share:", error);
      res.status(500).json({ error: "Failed to track social share" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
