import { pgTable, text, boolean, integer, serial } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

export const heroSlides = pgTable("hero_slides", {
  id: serial("id").primaryKey(),
  createdAt: integer("created_at").default(Date.now()),
  backgroundImageUrl: text("background_image_url"),
  titleAr: text("title_ar"),
  titleEn: text("title_en"),
  promoTextAr: text("promo_text_ar"),
  promoTextEn: text("promo_text_en"),
  buttonText: text("button_text"),
  buttonLink: text("button_link"),
  isActive: boolean("is_active").notNull().default(true),
  displayOrder: integer("display_order").notNull().default(0)
});

export const insertHeroSlideSchema = createInsertSchema(heroSlides);
export const selectHeroSlideSchema = createSelectSchema(heroSlides);

export type HeroSlide = z.infer<typeof selectHeroSlideSchema>;
export type InsertHeroSlide = z.infer<typeof insertHeroSlideSchema>;

