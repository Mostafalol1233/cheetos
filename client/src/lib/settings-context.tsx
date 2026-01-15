import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { apiRequest } from "./queryClient";

export interface Settings {
  id: string;
  primaryColor: string;
  accentColor: string;
  logoUrl: string | null;
  headerImageUrl: string | null;
  whatsappNumber: string | null;
  facebookUrl: string | null;
  trustBadges: string[] | null;
  footerText: string | null;
}

interface SettingsContextValue {
  settings: Settings | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

const SettingsContext = createContext<SettingsContextValue | undefined>(undefined);

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await apiRequest("GET", "/api/settings");
      const data = await res.json();
      const normalized: Settings = {
        id: data.id,
        primaryColor: data.primaryColor || "#0066FF",
        accentColor: data.accentColor || "#FFCC00",
        logoUrl: data.logoUrl ?? null,
        headerImageUrl: data.headerImageUrl ?? null,
        whatsappNumber: data.whatsappNumber ?? null,
        facebookUrl: data.facebookUrl ?? null,
        trustBadges: Array.isArray(data.trustBadges) ? data.trustBadges : null,
        footerText: data.footerText ?? null
      };
      setSettings(normalized);
    } catch (err: any) {
      setError(err?.message || "Failed to load settings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (!settings) return;
    const root = document.documentElement;
    root.style.setProperty("--primary-color", settings.primaryColor);
    root.style.setProperty("--accent-color", settings.accentColor);
  }, [settings]);

  const value: SettingsContextValue = {
    settings,
    isLoading,
    error,
    refresh: load
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error("useSettings must be used within SettingsProvider");
  return ctx;
}

