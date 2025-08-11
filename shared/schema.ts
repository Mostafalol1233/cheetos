import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean, timestamp, jsonb, uuid, decimal } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const games = pgTable("games", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description").notNull(),
  price: integer("price").notNull(),
  currency: varchar("currency").notNull().default("EGP"),
  image: text("image").notNull(),
  category: varchar("category").notNull(),
  isPopular: boolean("is_popular").default(false),
  stock: integer("stock").default(9999),
  packages: text("packages").array().default(sql`'{}'::text[]`),
  packagePrices: text("package_prices").array().default(sql`'{}'::text[]`),
});

export const categories = pgTable("categories", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  slug: varchar("slug").notNull().unique(),
  description: text("description").notNull(),
  image: text("image").notNull(),
  gradient: text("gradient").notNull(),
  icon: text("icon").notNull(),
});

// Users table for tracking gaming preferences
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: varchar("session_id").notNull().unique(),
  preferences: jsonb("preferences").default('{}'),
  createdAt: timestamp("created_at").defaultNow(),
  lastActive: timestamp("last_active").defaultNow(),
});

// User play history for recommendations
export const userGameHistory = pgTable("user_game_history", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  action: varchar("action").notNull(), // 'viewed', 'added_to_cart', 'purchased'
  timestamp: timestamp("timestamp").defaultNow(),
  metadata: jsonb("metadata").default('{}'), // store additional data like time spent, package selected
});

// Achievements system
export const achievements = pgTable("achievements", {
  id: varchar("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(),
  category: varchar("category").notNull(), // 'explorer', 'collector', 'spender', 'social'
  threshold: integer("threshold").notNull(), // number needed to unlock
  points: integer("points").notNull().default(100),
});

// User achievements tracking
export const userAchievements = pgTable("user_achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  achievementId: varchar("achievement_id").references(() => achievements.id).notNull(),
  progress: integer("progress").default(0),
  completed: boolean("completed").default(false),
  completedAt: timestamp("completed_at"),
});

// Social sharing tracking
export const socialShares = pgTable("social_shares", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").references(() => users.id).notNull(),
  gameId: varchar("game_id").references(() => games.id).notNull(),
  platform: varchar("platform").notNull(), // 'facebook', 'twitter', 'whatsapp', 'telegram'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Database relations
export const usersRelations = relations(users, ({ many }) => ({
  gameHistory: many(userGameHistory),
  achievements: many(userAchievements),
  socialShares: many(socialShares),
}));

export const gamesRelations = relations(games, ({ many }) => ({
  userHistory: many(userGameHistory),
  socialShares: many(socialShares),
}));

export const userGameHistoryRelations = relations(userGameHistory, ({ one }) => ({
  user: one(users, { fields: [userGameHistory.userId], references: [users.id] }),
  game: one(games, { fields: [userGameHistory.gameId], references: [games.id] }),
}));

export const achievementsRelations = relations(achievements, ({ many }) => ({
  userAchievements: many(userAchievements),
}));

export const userAchievementsRelations = relations(userAchievements, ({ one }) => ({
  user: one(users, { fields: [userAchievements.userId], references: [users.id] }),
  achievement: one(achievements, { fields: [userAchievements.achievementId], references: [achievements.id] }),
}));

// Schema validation
export const insertGameSchema = createInsertSchema(games);
export const insertCategorySchema = createInsertSchema(categories);
export const insertUserSchema = createInsertSchema(users);
export const insertUserGameHistorySchema = createInsertSchema(userGameHistory);
export const insertAchievementSchema = createInsertSchema(achievements);
export const insertUserAchievementSchema = createInsertSchema(userAchievements);
export const insertSocialShareSchema = createInsertSchema(socialShares);

// Type exports
export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UserGameHistory = typeof userGameHistory.$inferSelect;
export type InsertUserGameHistory = z.infer<typeof insertUserGameHistorySchema>;
export type Achievement = typeof achievements.$inferSelect;
export type InsertAchievement = z.infer<typeof insertAchievementSchema>;
export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = z.infer<typeof insertUserAchievementSchema>;
export type SocialShare = typeof socialShares.$inferSelect;
export type InsertSocialShare = z.infer<typeof insertSocialShareSchema>;

// Frontend types
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};

export type GameRecommendation = {
  game: Game;
  score: number;
  reason: string;
};
