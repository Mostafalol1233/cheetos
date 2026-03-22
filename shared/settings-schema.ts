import { pgTable, text, varchar, boolean, integer, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const settings = pgTable("settings", {
  id: varchar("id", { length: 50 }).primaryKey(),
  primaryColor: varchar("primary_color", { length: 20 }).notNull().default("#0066FF"),
  accentColor: varchar("accent_color", { length: 20 }).notNull().default("#FFCC00"),
  logoUrl: text("logo_url"),
  headerImageUrl: text("header_image_url"),
  whatsappNumber: varchar("whatsapp_number", { length: 32 }),
  facebookUrl: text("facebook_url"),
  trustBadges: jsonb("trust_badges").$type<string[] | null>().default(null),
  footerText: text("footer_text"),
  updatedAt: integer("updated_at").default(Date.now())
});

export const insertSettingsSchema = createInsertSchema(settings);
export const selectSettingsSchema = createSelectSchema(settings);

export type Settings = z.infer<typeof selectSettingsSchema>;
export type InsertSettings = z.infer<typeof insertSettingsSchema>;

