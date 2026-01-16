import { pgTable, text, decimal, boolean, integer, varchar, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Games table
export const games = pgTable("games", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency", { length: 10 }).notNull().default("EGP"),
  image: text("image").notNull(),
  category: text("category").notNull(),
  isPopular: boolean("is_popular").notNull().default(false),
  stock: integer("stock").notNull().default(50),
  packages: text("packages").array(),
  packagePrices: text("package_prices").array(),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  packageDiscountPrices: text("package_discount_prices").array()
});

// Categories table
export const categories = pgTable("categories", {
  id: varchar("id", { length: 50 }).primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  gradient: text("gradient").notNull(),
  icon: varchar("icon", { length: 50 }).notNull()
});

export const gamePackages = pgTable("game_packages", {
  id: serial("id").primaryKey(),
  gameId: varchar("game_id", { length: 50 }).references(() => games.id, { onDelete: 'cascade' }),
  name: text("name").notNull(),
  slug: text("slug").unique(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  discountPrice: decimal("discount_price", { precision: 10, scale: 2 }),
  bonus: text("bonus"),
  image: text("image"),
  createdAt: integer("created_at").default(Date.now()),
});

export const headerImageEdits = pgTable("header_image_edits", {
  id: serial("id").primaryKey(),
  imageUrl: text("image_url").notNull(),
  metadata: text("metadata"), // JSON string for crop data, dimensions etc
  createdAt: integer("created_at").default(Date.now()),
});

export const gamesRelations = relations(games, ({ many }) => ({
  packagesList: many(gamePackages),
}));

export const gamePackagesRelations = relations(gamePackages, ({ one }) => ({
  game: one(games, {
    fields: [gamePackages.gameId],
    references: [games.id],
  }),
}));

// Schema types
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);
export const insertGamePackageSchema = createInsertSchema(gamePackages);
export const selectGamePackageSchema = createSelectSchema(gamePackages);
export const insertHeaderImageEditSchema = createInsertSchema(headerImageEdits);
export const selectHeaderImageEditSchema = createSelectSchema(headerImageEdits);

export type Game = z.infer<typeof selectGameSchema> & { packagesList?: GamePackage[] };
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type GamePackage = z.infer<typeof selectGamePackageSchema>;
export type InsertGamePackage = z.infer<typeof insertGamePackageSchema>;
export type HeaderImageEdit = z.infer<typeof selectHeaderImageEditSchema>;
export type InsertHeaderImageEdit = z.infer<typeof insertHeaderImageEditSchema>;

// Chat Messages table
export interface ChatMessage {
  id: string;
  sender: "user" | "support";
  message: string;
  timestamp: number;
  sessionId: string;
  userId?: string;
}

export const chatMessageSchema = z.object({
  id: z.string(),
  sender: z.enum(["user", "support"]),
  message: z.string().min(1),
  timestamp: z.number(),
  sessionId: z.string(),
  userId: z.string().optional()
});

export const insertChatMessageSchema = chatMessageSchema.omit({ id: true, timestamp: true });

export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

// Users table
export const users = pgTable("users", {
  id: varchar("id", { length: 50 }).primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").notNull().unique(),
  role: text("role").notNull().default("user"), // 'admin' or 'user'
  createdAt: integer("created_at").notNull().default(Date.now()),
});

export const insertUserSchema = createInsertSchema(users);
export const selectUserSchema = createSelectSchema(users);
export type User = z.infer<typeof selectUserSchema>;
export type InsertUser = z.infer<typeof insertUserSchema>;

// Chat Messages table
export const chatMessages = pgTable("chat_messages", {
  id: varchar("id", { length: 50 }).primaryKey(),
  sender: text("sender").notNull(), // 'user', 'support', or specific username
  message: text("message").notNull(),
  timestamp: integer("timestamp").notNull(),
  sessionId: text("session_id").notNull(),
  userId: varchar("user_id", { length: 50 }), // Optional link to registered user
  read: boolean("read").notNull().default(false),
});

export const insertChatMessageTableSchema = createInsertSchema(chatMessages);
export type InsertChatMessageTable = z.infer<typeof insertChatMessageTableSchema>;

// Transactions table
export const transactions = pgTable("transactions", {
  id: varchar("id", { length: 50 }).primaryKey(),
  userId: varchar("user_id", { length: 50 }), // Optional (guest checkout)
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  status: text("status").notNull().default("pending"),
  items: text("items").notNull(), // JSON string of items
  paymentMethod: text("payment_method").notNull(),
  customerName: text("customer_name"),
  customerPhone: text("customer_phone"),
  timestamp: integer("timestamp").notNull().default(Date.now()),
});

export const insertTransactionSchema = createInsertSchema(transactions);
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;

// WhatsApp Messages (Audit)
export const whatsappMessages = pgTable("whatsapp_messages", {
  id: varchar("id", { length: 50 }).primaryKey(),
  waMessageId: text("wa_message_id"),
  direction: text("direction").notNull(), // 'inbound', 'outbound'
  fromPhone: text("from_phone"),
  toPhone: text("to_phone"),
  message: text("message"),
  timestamp: integer("timestamp").notNull().default(Date.now()),
  status: text("status").default("sent"),
});

// Seller Alerts
export const sellerAlerts = pgTable("seller_alerts", {
  id: varchar("id", { length: 50 }).primaryKey(),
  type: text("type").notNull(),
  summary: text("summary"),
  read: boolean("read").default(false),
  flagged: boolean("flagged").default(false),
  createdAt: integer("created_at").notNull().default(Date.now()),
});

export const orders = pgTable("orders", {
  id: varchar("id", { length: 50 }).primaryKey(),
  createdAt: integer("created_at").notNull().default(Date.now()),
  userId: varchar("user_id", { length: 50 }),
  items: text("items").notNull(),
  paymentMethod: text("payment_method").notNull(),
  status: text("status").notNull().default("pending"),
  playerId: text("player_id"),
  serverId: text("server_id")
});
