import { pgTable, text, decimal, boolean, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

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
  packagePrices: text("package_prices").array()
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

// Schema types
export const insertGameSchema = createInsertSchema(games);
export const selectGameSchema = createSelectSchema(games);
export const insertCategorySchema = createInsertSchema(categories);
export const selectCategorySchema = createSelectSchema(categories);

export type Game = z.infer<typeof selectGameSchema>;
export type InsertGame = z.infer<typeof insertGameSchema>;
export type Category = z.infer<typeof selectCategorySchema>;
export type InsertCategory = z.infer<typeof insertCategorySchema>;