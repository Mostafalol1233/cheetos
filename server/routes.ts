import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema } from "@shared/schema";
import crypto from "crypto";
import { getQRCode, getConnectionStatus, sendWhatsAppMessage } from "./whatsapp";
import { setupAuth, hashPassword } from "./auth";
import fs from "fs";
import path from "path";
import passport from "passport";

export function registerRoutes(app: Express): Server {
  // Setup Auth
  setupAuth(app);

  // Middleware to protect routes
  const requireAuth = (req: any, res: any, next: any) => {
    if (req.isAuthenticated()) return next();
    res.status(401).json({ message: "Unauthorized" });
  };

  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.isAuthenticated() && req.user.role === 'admin') return next();
    res.status(403).json({ message: "Forbidden" });
  };

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password || !email) return res.status(400).json({ message: "Missing fields" });
      
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      const hashedPassword = hashPassword(password);
      
      await storage.createUser({
        username,
        password: hashedPassword,
        email,
        role: "user"
      });
      
      res.json({ message: "Registered successfully" });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.json({ message: "Logged in", user: req.user });
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.json({ message: "Logged out" });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json({ user: req.user });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // --- WhatsApp Routes ---
  app.get("/api/whatsapp/qr", (req, res) => {
    const qr = getQRCode();
    res.json({ qr });
  });

  app.get("/api/whatsapp/status", (req, res) => {
    res.json(getConnectionStatus());
  });

  app.post("/api/whatsapp/send", requireAdmin, async (req, res) => {
    try {
      const { to, text } = req.body;
      await sendWhatsAppMessage(to, text);
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- JSON Import Route ---
  app.post("/api/admin/import-json", requireAdmin, async (req, res) => {
    try {
      const filePath = path.join(process.cwd(), "digital_cards_egp_dataset.json");
      if (!fs.existsSync(filePath)) {
        return res.status(404).json({ message: "File not found" });
      }
      
      const content = fs.readFileSync(filePath, "utf-8");
      const json = JSON.parse(content);
      const products = json.products || [];

      const groups: Record<string, any[]> = {};
      for (const p of products) {
        const name = p.product_name || "Unknown Product";
        if (!groups[name]) groups[name] = [];
        groups[name].push(p);
      }

      let created = 0;
      let updated = 0;

      for (const [name, items] of Object.entries(groups)) {
        const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-");
        let game = await storage.getGameBySlug(slug);
        
        const packages = items.map(i => i.denomination);
        const packagePrices = items.map(i => String(i.price_EGP));
        const basePrice = packagePrices[0]; 
        const totalStock = items.reduce((sum, i) => sum + (i.stock_estimate || 0), 0);
        
        if (game) {
          await storage.updateGame(game.id, {
            packages,
            packagePrices,
            price: basePrice,
            stock: totalStock
          });
          updated++;
        } else {
          let category = "online-games";
          const platform = items[0].platform?.toLowerCase() || "";
          if (platform.includes("mobile") || platform.includes("android") || platform.includes("ios")) {
            category = "mobile-games";
          } else if (items[0].category?.toLowerCase().includes("gift")) {
            category = "gift-cards";
          }
          
          await storage.createGame({
            id: `game_${Date.now()}_${created}`,
            name: name,
            slug,
            description: items[0].notes || `${name} Top-Up`,
            price: basePrice,
            currency: "EGP",
            image: "/attached_assets/placeholder.png", 
            category,
            isPopular: false,
            stock: totalStock,
            packages,
            packagePrices
          });
          created++;
        }
      }
      
      res.json({ message: "Import completed", created, updated });
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  // --- Existing Routes (Updated) ---
  
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

  // Alias route for slug for compatibility
  app.get("/api/games/slug/:slug", async (req, res) => {
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

  // Chat endpoints
  app.get("/api/chat/:sessionId", async (req, res) => {
    try {
      const { sessionId } = req.params;
      const messages = await storage.getChatMessages(sessionId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch messages" });
    }
  });

  app.post("/api/chat/message", async (req, res) => {
    try {
      const { sender, message, sessionId } = req.body;
      const userId = (req.user as any)?.id; // If authenticated
      
      const validated = insertChatMessageSchema.parse({ sender, message, sessionId });
      
      await storage.createChatMessage({
        sender,
        message,
        sessionId
      });

      // Create Alert if from user
      if (sender === 'user') {
        await storage.createSellerAlert({
          id: `alert_${Date.now()}`,
          type: 'customer_message',
          summary: `Session ${sessionId.slice(0,8)}: ${message.slice(0,50)}`,
          read: false,
          flagged: false,
          createdAt: Date.now()
        });
      }
      
      res.json({ sender, message, timestamp: Date.now(), sessionId });
    } catch (error) {
      console.error(error);
      res.status(400).json({ message: "Invalid message data" });
    }
  });

  app.get("/api/admin/alerts", async (_req, res) => {
    try {
      const r = await storage.getSellerAlerts();
      res.json(r);
    } catch (err) {
      res.json([]);
    }
  });

  app.post("/api/admin/alerts/:id/read", async (req, res) => {
    try {
      await storage.markSellerAlertRead(req.params.id);
      res.json({ ok: true });
    } catch (err) {
      res.status(500).json({ ok: false });
    }
  });

  // Transactions
  app.post("/api/transactions/checkout", async (req, res) => {
    try {
      const { customerName, customerPhone, paymentMethod, items } = req.body || {};
      const userId = (req.user as any)?.id;

      if (!customerName || !customerPhone || !paymentMethod || !Array.isArray(items)) {
        return res.status(400).json({ message: "Invalid checkout payload" });
      }
      
      const total = items.reduce((sum: number, it: any) => sum + Number(it.price) * Number(it.quantity || 1), 0);
      const id = `tx_${Date.now()}`;
      
      await storage.createTransaction({
        id,
        userId: userId || null,
        totalAmount: total,
        status: 'pending',
        items: JSON.stringify(items),
        paymentMethod,
        customerName,
        customerPhone,
      });

      await storage.createSellerAlert({
        id: `alert_${Date.now()}`,
        type: 'new_order',
        summary: `Order ${id} • ${total} EGP`,
        read: false,
        flagged: false,
        createdAt: Date.now()
      });

      res.json({ id });
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Checkout failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
