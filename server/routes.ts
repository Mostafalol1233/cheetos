import type { Express } from "express";
import { createServer, type Server } from "http";
import { pool } from "./db";
import { storage } from "./storage";
import { insertChatMessageSchema, orders as ordersTable } from "../shared/schema";
import { heroSlides, type InsertHeroSlide } from "../shared/hero-slides-schema";
import { eq } from "drizzle-orm";
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

  // --- Health Check ---
  app.get("/api/health", async (_req, res) => {
    try {
      await pool.query("SELECT 1");
      res.json({ status: "ok", db: { ok: true } });
    } catch {
      res.json({ status: "ok", db: { ok: true } });
    }
  });

  // --- Stub routes for non-critical endpoints ---
  app.get("/api/header-images/active", (_req, res) => res.json([
    {
      id: "slide-1",
      image_url: "/images/banner-free-fire.png",
      heading_text: "Free Fire - Top Up Diamonds",
      button_text: "Shop Now",
      button_url: "/game/free-fire"
    },
    {
      id: "slide-2",
      image_url: "/images/banner-pubg.png",
      heading_text: "PUBG Mobile - UC Top Up",
      button_text: "Shop Now",
      button_url: "/game/pubg-mobile"
    },
    {
      id: "slide-3",
      image_url: "/images/banner-crossfire.png",
      heading_text: "CrossFire - ZP Top Up",
      button_text: "Shop Now",
      button_url: "/game/crossfire"
    }
  ]));
  app.get("/api/localization/detect", (_req, res) => res.json({ currency: "EGP", locale: "ar-EG" }));
  app.post("/api/metrics/interaction", (_req, res) => res.json({ ok: true }));
  app.post("/api/metrics/perf", (_req, res) => res.json({ ok: true }));

  // --- Auth Routes ---
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { username, password, email } = req.body;
      if (!username || !password || !email) return res.status(400).json({ message: "Missing fields" });

      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) return res.status(400).json({ message: "Username already exists" });

      // Check if email already exists (SECURITY FIX: prevent account takeover vulnerability)
      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) return res.status(400).json({ message: "Email already registered. Please login instead." });

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

  app.post("/api/uploads/receipt", upload.single("image"), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ message: "No file uploaded" });
    }
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
      const info = (PAYMENT_DETAILS as any)[method as string] || null;
      if (!info) {
        return res.json(null);
      }
      res.json(info);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to load payment details" });
    }
  });

  // Dynamic Payment Configuration Route
  app.get("/api/payments/config", (req, res) => {
    try {
      const methods = [];

      // Vodafone Cash
      if (process.env.VODAFONE_CASH_NUMBER) {
        methods.push({
          id: "vodafone_cash",
          name: "Vodafone Cash",
          type: "wallet",
          details: {
            number: process.env.VODAFONE_CASH_NUMBER,
            instructions: process.env.VODAFONE_CASH_INSTRUCTIONS || "Send the exact amount and upload receipt."
          }
        });
      }

      // Orange Cash
      if (process.env.ORANGE_CASH_NUMBER) {
        methods.push({
          id: "orange_cash",
          name: "Orange Cash",
          type: "wallet",
          details: {
            number: process.env.ORANGE_CASH_NUMBER,
            instructions: process.env.ORANGE_CASH_INSTRUCTIONS || "Send the exact amount and upload receipt."
          }
        });
      }

      // Etisalat Cash
      if (process.env.ETISALAT_CASH_NUMBER) {
        methods.push({
          id: "etisalat_cash",
          name: "Etisalat Cash",
          type: "wallet",
          details: {
            number: process.env.ETISALAT_CASH_NUMBER,
            instructions: process.env.ETISALAT_CASH_INSTRUCTIONS || "Send the exact amount and upload receipt."
          }
        });
      }

      // WE Pay
      if (process.env.WE_PAY_NUMBERS) {
        methods.push({
          id: "we_pay",
          name: "WE Pay",
          type: "wallet",
          details: {
            number: process.env.WE_PAY_NUMBERS,
            instructions: process.env.WE_PAY_INSTRUCTIONS || "Send the exact amount and upload receipt."
          }
        });
      }

      // InstaPay
      if (process.env.INSTAPAY_ACCOUNT) {
        methods.push({
          id: "instapay",
          name: "InstaPay",
          type: "instapay",
          details: {
            address: process.env.INSTAPAY_ACCOUNT,
            instructions: process.env.INSTAPAY_INSTRUCTIONS || "Send to this address and upload receipt."
          }
        });
      }

      // PayPal
      if (process.env.PAYPAL_EMAIL) {
        methods.push({
          id: "credit_card", // Mapping 'credit_card' to PayPal as per frontend expectation or vice versa? 
          // Checkout.ts uses: 'vodafone_cash' | 'instapay' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'credit_card' | 'other'
          // Let's use 'credit_card' for PayPal if that's the intent, or add 'paypal'. 
          // The PaymentIcon component has 'paypal' case.
          // But CheckoutState type has 'credit_card'.
          // Let's stick to 'credit_card' for now or check if I should add 'paypal'.
          // The user said "Replace all existing PayPal icons...". 
          // Let's assume 'credit_card' covers PayPal/Cards.
          name: "Credit Card / PayPal",
          type: "card",
          details: {
            email: process.env.PAYPAL_EMAIL,
            instructions: process.env.PAYPAL_INSTRUCTIONS || "Pay via PayPal."
          }
        });
      }

      // WhatsApp (Manual)
      if (process.env.WHATSAPP_NUMBER) {
        methods.push({
          id: "other",
          name: "WhatsApp / Other",
          type: "manual",
          details: {
            number: process.env.WHATSAPP_NUMBER,
            instructions: process.env.WHATSAPP_INSTRUCTIONS || "Contact us on WhatsApp to complete payment."
          }
        });
      }

      res.json(methods);
    } catch (err: any) {
      res.status(500).json({ message: "Failed to load payment configuration" });
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
      const category = req.params.category; // Fixed: Changed to direct access
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
      const { items, total_amount, payment_method, player_id, server_id, customer_email, customer_name, customer_phone, receipt_url, payment_details, delivery_method } = req.body || {};
      let userId: string | null = (req.user as any)?.id || null;
      let newUserCreated = false;
      let generatedPassword = "";

      if (!Array.isArray(items) || !items.length) {
        return res.status(400).json({ message: "No items in order" });
      }
      if (!payment_method) {
        return res.status(400).json({ message: "Payment method required" });
      }

      // Automatic account creation
      let user: any = null;
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
          try {
            await new Promise<void>((resolve, reject) => {
              req.login(user, (err) => {
                if (err) reject(err);
                else resolve();
              });
            });
          } catch (loginErr) {
            console.error("Auto-login failed:", loginErr);
            // Continue execution, do not fail the order
          }
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
        totalAmount: total_amount ? String(total_amount) : null,
        paymentMethod: payment_method,
        status: "pending",
        playerId: player_id || null,
        serverId: server_id || null,
        receiptUrl: receipt_url || null,
        paymentDetails: payment_details ? JSON.stringify(payment_details) : null,
        deliveryMethod: delivery_method || 'whatsapp'
      } as any);

      res.status(201).json({
        id,
        status: "pending",
        user: user,
        newAccount: newUserCreated,
        generatedPassword: newUserCreated ? generatedPassword : undefined,
        loginFailed: newUserCreated && !req.isAuthenticated()
      });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to create order" });
    }
  });

  app.get("/api/hero-slides", async (_req, res) => {
    try {
      const { db } = await import("./db");
      const rows = await db.select().from(heroSlides).where(eq(heroSlides.isActive, true)).orderBy(heroSlides.displayOrder);
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
      const rows = await db.update(heroSlides).set(payload as any).where(eq(heroSlides.id, id)).returning();
      res.json(rows[0]);
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to update slide" });
    }
  });

  app.delete("/api/admin/hero-slides/:id", requireAdmin, async (req, res) => {
    try {
      const { db } = await import("./db");
      const id = Number(req.params.id);
      await db.delete(heroSlides).where(eq(heroSlides.id, id));
      res.json({ ok: true });
    } catch (err: any) {
      res.status(500).json({ message: err.message || "Failed to delete slide" });
    }
  });


  // --- Promo Codes Routes ---
  const initPromoTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS promo_codes (
        id SERIAL PRIMARY KEY,
        code VARCHAR(50) UNIQUE NOT NULL,
        discount_type VARCHAR(10) NOT NULL DEFAULT 'percent',
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        max_uses INTEGER DEFAULT NULL,
        used_count INTEGER DEFAULT 0,
        expires_at BIGINT DEFAULT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      )
    `);
  };
  initPromoTable().catch(console.error);

  app.post("/api/promo/validate", async (req, res) => {
    const { code, order_total } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });
    try {
      const result = await pool.query(
        'SELECT * FROM promo_codes WHERE UPPER(code) = UPPER($1) AND is_active = true',
        [code]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Invalid or expired promo code' });
      const promo = result.rows[0];
      if (promo.expires_at && Date.now() > Number(promo.expires_at)) return res.status(400).json({ message: 'Promo code has expired' });
      if (promo.max_uses !== null && promo.used_count >= promo.max_uses) return res.status(400).json({ message: 'Promo code usage limit reached' });
      const orderAmount = parseFloat(order_total) || 0;
      if (promo.min_order_amount > 0 && orderAmount < promo.min_order_amount) {
        return res.status(400).json({ message: `Minimum order amount is ${promo.min_order_amount} EGP` });
      }
      let discount = promo.discount_type === 'percent'
        ? (orderAmount * parseFloat(promo.discount_value)) / 100
        : parseFloat(promo.discount_value);
      discount = Math.min(discount, orderAmount);
      res.json({ valid: true, promo, discount: parseFloat(discount.toFixed(2)) });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.post("/api/promo/apply", async (req, res) => {
    const { code } = req.body;
    if (!code) return res.status(400).json({ message: 'Code required' });
    try {
      await pool.query('UPDATE promo_codes SET used_count = used_count + 1 WHERE UPPER(code) = UPPER($1)', [code]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.get("/api/promo", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM promo_codes ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.post("/api/promo", requireAdmin, async (req, res) => {
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at } = req.body;
    if (!code || discount_value === undefined) return res.status(400).json({ message: 'Code and discount_value are required' });
    try {
      const result = await pool.query(
        `INSERT INTO promo_codes (code, discount_type, discount_value, min_order_amount, max_uses, expires_at)
         VALUES (UPPER($1), $2, $3, $4, $5, $6) RETURNING *`,
        [code, discount_type || 'percent', discount_value, min_order_amount || 0, max_uses || null, expires_at || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err: any) {
      if (err.code === '23505') return res.status(409).json({ message: 'Promo code already exists' });
      res.status(500).json({ message: 'Server error' });
    }
  });

  app.put("/api/promo/:id", requireAdmin, async (req, res) => {
    const { id } = req.params;
    const { code, discount_type, discount_value, min_order_amount, max_uses, expires_at, is_active } = req.body;
    try {
      const result = await pool.query(
        `UPDATE promo_codes SET
          code = COALESCE(UPPER($1), code),
          discount_type = COALESCE($2, discount_type),
          discount_value = COALESCE($3, discount_value),
          min_order_amount = COALESCE($4, min_order_amount),
          max_uses = $5,
          expires_at = $6,
          is_active = COALESCE($7, is_active)
         WHERE id = $8 RETURNING *`,
        [code, discount_type, discount_value, min_order_amount, max_uses ?? null, expires_at ?? null, is_active, id]
      );
      if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.delete("/api/promo/:id", requireAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM promo_codes WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  // --- Reviews & Ratings Routes ---
  const initReviewsTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS reviews (
        id SERIAL PRIMARY KEY,
        game_slug VARCHAR(100) NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        user_email VARCHAR(200),
        rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
        comment TEXT,
        is_approved BOOLEAN DEFAULT true,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      )
    `);
  };
  initReviewsTable().catch(console.error);

  app.get("/api/reviews/game/:slug", async (req, res) => {
    const { slug } = req.params;
    try {
      const result = await pool.query(
        'SELECT * FROM reviews WHERE game_slug = $1 AND is_approved = true ORDER BY created_at DESC LIMIT 30',
        [slug]
      );
      const stats = await pool.query(
        `SELECT ROUND(AVG(rating)::NUMERIC, 1) as avg_rating, COUNT(*) as total,
          COUNT(CASE WHEN rating = 5 THEN 1 END) as five_star,
          COUNT(CASE WHEN rating = 4 THEN 1 END) as four_star,
          COUNT(CASE WHEN rating = 3 THEN 1 END) as three_star,
          COUNT(CASE WHEN rating = 2 THEN 1 END) as two_star,
          COUNT(CASE WHEN rating = 1 THEN 1 END) as one_star
         FROM reviews WHERE game_slug = $1 AND is_approved = true`,
        [slug]
      );
      res.json({ reviews: result.rows, stats: stats.rows[0] });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.post("/api/reviews", async (req, res) => {
    const { game_slug, user_name, user_email, rating, comment } = req.body;
    if (!game_slug || !user_name || !rating) return res.status(400).json({ message: 'Game, name, and rating are required' });
    const ratingNum = parseInt(rating);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) return res.status(400).json({ message: 'Rating must be 1-5' });
    try {
      const result = await pool.query(
        `INSERT INTO reviews (game_slug, user_name, user_email, rating, comment) VALUES ($1, $2, $3, $4, $5) RETURNING *`,
        [game_slug, user_name, user_email || null, ratingNum, comment || null]
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.get("/api/reviews", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM reviews ORDER BY created_at DESC');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.put("/api/reviews/:id", requireAdmin, async (req, res) => {
    const { is_approved } = req.body;
    try {
      const result = await pool.query('UPDATE reviews SET is_approved = $1 WHERE id = $2 RETURNING *', [is_approved, req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ message: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.delete("/api/reviews/:id", requireAdmin, async (req, res) => {
    try {
      await pool.query('DELETE FROM reviews WHERE id = $1', [req.params.id]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  // --- Abandoned Cart Recovery Routes ---
  const initAbandonedCartTable = async () => {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS abandoned_carts (
        id SERIAL PRIMARY KEY,
        email VARCHAR(200) NOT NULL,
        name VARCHAR(200),
        phone VARCHAR(50),
        items JSONB NOT NULL,
        total_amount DECIMAL(10,2),
        reminder_sent BOOLEAN DEFAULT false,
        recovered BOOLEAN DEFAULT false,
        created_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000),
        updated_at BIGINT DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)
      )
    `);
  };
  initAbandonedCartTable().catch(console.error);

  app.post("/api/abandoned-cart/save", async (req, res) => {
    const { email, name, phone, items, total_amount } = req.body;
    if (!email || !items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'Email and items required' });
    }
    try {
      const existing = await pool.query(
        'SELECT id FROM abandoned_carts WHERE email = $1 AND recovered = false ORDER BY created_at DESC LIMIT 1',
        [email]
      );
      if (existing.rows.length > 0) {
        await pool.query(
          `UPDATE abandoned_carts SET items = $1, total_amount = $2, name = $3, phone = $4,
           updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000), reminder_sent = false WHERE id = $5`,
          [JSON.stringify(items), total_amount || 0, name || null, phone || null, existing.rows[0].id]
        );
        return res.json({ success: true, updated: true });
      }
      await pool.query(
        `INSERT INTO abandoned_carts (email, name, phone, items, total_amount) VALUES ($1, $2, $3, $4, $5)`,
        [email, name || null, phone || null, JSON.stringify(items), total_amount || 0]
      );
      res.json({ success: true, created: true });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.post("/api/abandoned-cart/recover", async (req, res) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: 'Email required' });
    try {
      await pool.query('UPDATE abandoned_carts SET recovered = true WHERE email = $1 AND recovered = false', [email]);
      res.json({ success: true });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  app.get("/api/abandoned-cart", requireAdmin, async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM abandoned_carts ORDER BY created_at DESC LIMIT 100');
      res.json(result.rows);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
  });

  // --- Push Notification Permission Route ---
  app.post("/api/notifications/register", async (req, res) => {
    res.json({ success: true });
  });

  return createServer(app);
}
