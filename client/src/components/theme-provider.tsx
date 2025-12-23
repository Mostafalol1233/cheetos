import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isNight: boolean;
  setTheme: (t: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
    return saved ?? "dark";
  });
  const [isNight, setIsNight] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Night: 6 PM (18:00) to 6 AM (6:00)
      // Day: 6 AM (6:00) to 6 PM (18:00)
      const nightTime = hour >= 18 || hour < 6;
      
      setIsNight(nightTime);
      // Respect manual override if present
      const saved = typeof window !== 'undefined' ? (localStorage.getItem('theme') as Theme | null) : null;
      const nextTheme = saved ?? (nightTime ? "dark" : "light");
      setTheme(nextTheme);
      
      if (nextTheme === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    // Update on mount
    updateTheme();

    // Update every minute to check for time changes
    const interval = setInterval(updateTheme, 60000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme', theme);
    }
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const value: ThemeContextType = {
    theme,
    isNight,
    setTheme
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
