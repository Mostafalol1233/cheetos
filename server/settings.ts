import { db } from "./db";
import { settings, type Settings } from "@shared/settings-schema";

export async function getSingleSettings(): Promise<Settings | null> {
  const rows = await db.select().from(settings).limit(1);
  if (rows.length > 0) return rows[0];
  const fallback: Settings = {
    id: "default",
    primaryColor: "#0066FF",
    accentColor: "#FFCC00",
    logoUrl: null,
    headerImageUrl: null,
    whatsappNumber: null,
    trustBadges: null,
    footerText: null,
    updatedAt: Date.now()
  } as Settings;
  await db.insert(settings).values(fallback).onConflictDoNothing({ target: settings.id });
  return fallback;
}

export async function updateSettings(payload: Partial<Settings>): Promise<Settings> {
  const existing = await getSingleSettings();
  const id = existing?.id || "default";
  const updatedAt = Date.now();
  await db
    .insert(settings)
    .values({ id, updatedAt, ...payload } as any)
    .onConflictDoUpdate({
      target: settings.id,
      set: { ...payload, updatedAt } as any
    });
  const rows = await db.select().from(settings).where(settings.id.eq(id)).limit(1);
  return rows[0] as Settings;
}

