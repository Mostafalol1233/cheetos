import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertChatMessageSchema, orders as ordersTable } from "../shared/schema";
import { heroSlides, type InsertHeroSlide } from "@shared/hero-slides-schema";
import crypto from "crypto";
import { getQRCode, getConnectionStatus, sendWhatsAppMessage } from "./whatsapp";
import { setupAuth, hashPassword } from "./auth";
import fs from "fs";
import path from "path";
import passport from "passport";
import { getSingleSettings, updateSettings } from "./settings";
import multer from "multer";

export function registerRoutes(app: Express): Server {
  // Setup Auth
  setupAuth(app);

  const receiptsDir = path.join(process.cwd(), "attached_assets", "receipts");
  try {
    if (!fs.existsSync(receiptsDir)) {
      fs.mkdirSync(receiptsDir, { recursive: true });
    }
  } catch { }
  const upload = multer({ dest: receiptsDir });

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
        id: crypto.randomBytes(12).toString("hex"),
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

  app.post("/api/uploads/receipt", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ message: "No file uploaded" });
    // Assuming static serving is set up for attached_assets
    const url = `/attached_assets/receipts/${req.file.filename}`;
    res.json({ url });
  });

  const PAYMENT_DETAILS: Record<string, { title: string; value: string; instructions?: string }> = {
    "Vodafone Cash": {
      title: "Vodafone Cash Number",
      value: "+201000000000",
      instructions: "Send the exact total amount, then upload the payment receipt."
    },
    "Orange Cash": {
      title: "Orange Cash Number",
      value: "+201100000000",
      instructions: "Send the payment and keep a screenshot of the transfer."
    },
    "Etisalat Cash": {
      title: "Etisalat Cash Number",
      value: "+201200000000",
      instructions: "Transfers usually appear within a few minutes."
    },
    "WE Pay": {
      title: "WE Pay Number",
      value: "+201300000000",
      instructions: "Use your WE Pay app to complete the transfer."
    },
    "InstaPay": {
      title: "InstaPay Address",
      value: "diaa@example.com",
      instructions: "Use InstaPay to send to this address, then confirm payment."
    },
    "PayPal": {
      title: "PayPal Email",
      value: "payments@example.com",
      instructions: "Send as friends and family where possible."
    },
    "WhatsApp": {
      title: "WhatsApp Number",
      value: "+201011696196",
      instructions: "You will complete the order directly via WhatsApp chat."
    }
  };

  app.get("/api/public/payment-details", (req, res) => {
    try {
      const raw = req.query.method;
      const method = typeof raw === "string" ? raw : Array.isArray(raw) ? raw[0] : "";
      if (!method) {
        return res.status(400).json({ message: "method is required" });
      }
      const info = PAYMENT_DETAILS[method] || null;
      if (!info) {
        return res.json(null);
      }
      res.json(info);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to load payment details" });
    }
  });

  app.get("/api/settings", async (_req, res) => {
    try {
      const s = await getSingleSettings();
      res.json(s);
    } catch (err: any) {
      res.status(500).json({ message: err.message });
    }
  });

  app.put("/api/settings", requireAdmin, async (req, res) => {
    try {
      const payload = req.body || {};
      const s = await updateSettings(payload);
      res.json(s);
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

      const validated = insertChatMessageSchema.parse({ sender, message, sessionId, userId });

      await storage.createChatMessage({
        sender,
        message,
        sessionId,
        userId
      });

      // Create Alert if from user
      if (sender === 'user') {
        await storage.createSellerAlert({
          id: `alert_${Date.now()}`,
          type: 'customer_message',
          summary: `Session ${sessionId.slice(0, 8)}: ${message.slice(0, 50)}`,
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
        totalAmount: total.toFixed(2),
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

  app.post("/api/orders", async (req, res) => {
    try {
      const { items, payment_method, player_id, server_id, customer_email, customer_name, customer_phone } = req.body || {};
      let userId = (req.user as any)?.id || null;
      let newUserCreated = false;
      let generatedPassword = "";

      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({ message: "No items in order" });
      }
      if (!payment_method) {
        return res.status(400).json({ message: "Payment method required" });
      }

      // Automatic account creation
      let user = null;
      if (!userId && customer_email) {
        user = await storage.getUserByEmail(customer_email);

        if (!user) {
          generatedPassword = crypto.randomBytes(8).toString('hex');
          const hashedPassword = hashPassword(generatedPassword);
          const username = customer_email.split('@')[0] + Math.floor(Math.random() * 10000);

          user = await storage.createUser({
            id: crypto.randomBytes(12).toString("hex"),
            username,
            password: hashedPassword,
            email: customer_email,
            role: "user"
          });
          newUserCreated = true;
        }

        if (user) {
          userId = user.id;
          // Log the user in to establish session
          await new Promise<void>((resolve, reject) => {
            req.login(user, (err) => {
              if (err) reject(err);
              else resolve();
            });
          });
        }
      }

      const id = `order_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      await storage.createSellerAlert({
        id: `alert_${Date.now()}`,
        type: "new_order",
        summary: `Order ${id}`,
        read: false,
        flagged: false,
        createdAt: Date.now()
      });
      await storage.createWhatsAppMessage({
        id: `wa_${Date.now()}`,
        waMessageId: null,
        direction: "outbound",
        fromPhone: null,
        toPhone: null,
        message: null,
        timestamp: Date.now(),
        status: "queued"
      });
      const { db } = await import("./db");
      await db.insert(ordersTable).values({
        id,
        userId,
        items: JSON.stringify(items),
        paymentMethod: payment_method,
        status: "pending",
        playerId: player_id || null,
        serverId: server_id || null
      } as any);

      res.status(201).json({
        id,
        status: "pending",
        user: user,
        newAccount: newUserCreated,
        generatedPassword: newUserCreated ? generatedPassword : undefined
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create order" });
    }
  });

  app.get("/api/hero-slides", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const rows = await db.select().from(heroSlides).where(heroSlides.isActive.eq(true)).orderBy(heroSlides.displayOrder);
      res.json(rows);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to load slides" });
    }
  });

  app.post("/api/admin/hero-slides", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("./db");
      const payload = req.body as InsertHeroSlide;
      const nextOrder = typeof payload.displayOrder === "number" ? payload.displayOrder : 0;
      const rows = await db.insert(heroSlides).values({ ...payload, displayOrder: nextOrder } as any).returning();
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create slide" });
    }
  });

  app.put("/api/admin/hero-slides/:id", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("./db");
      const id = Number(req.params.id);
      const payload = req.body as Partial<InsertHeroSlide>;
      const rows = await db.update(heroSlides).set(payload as any).where(heroSlides.id.eq(id)).returning();
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to update slide" });
    }
  });

  app.delete("/api/admin/hero-slides/:id", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("./db");
      const id = Number(req.params.id);
      await db.delete(heroSlides).where(heroSlides.id.eq(id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete slide" });
    }
  });


  return createServer(app);
}
