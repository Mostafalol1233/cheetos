import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export function registerRoutes(app: Express): Server {
  // Get all categories
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  // Get all games
  app.get("/api/games", async (req, res) => {
    try {
      const games = await storage.getGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games" });
    }
  });

  // Get popular games
  app.get("/api/games/popular", async (req, res) => {
    try {
      const games = await storage.getPopularGames();
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch popular games" });
    }
  });

  // Get games by category
  app.get("/api/games/category/:category", async (req, res) => {
    try {
      const { category } = req.params;
      const games = await storage.getGamesByCategory(category);
      res.json(games);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch games by category" });
    }
  });

  // Get game by slug
  app.get("/api/games/:slug", async (req, res) => {
    try {
      const { slug } = req.params;
      const game = await storage.getGameBySlug(slug);
      if (!game) {
        return res.status(404).json({ message: "Game not found" });
      }
      res.json(game);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch game" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}