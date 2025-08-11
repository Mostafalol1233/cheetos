import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, boolean } from "drizzle-orm/pg-core";
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

export const insertGameSchema = createInsertSchema(games);
export const insertCategorySchema = createInsertSchema(categories);

export type Game = typeof games.$inferSelect;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;

// Cart item type for frontend
export type CartItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
};
