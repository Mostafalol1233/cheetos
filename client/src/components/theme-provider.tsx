import { createContext, useContext, useEffect, useState, ReactNode } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  isNight: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark");
  const [isNight, setIsNight] = useState(true);

  useEffect(() => {
    const updateTheme = () => {
      const now = new Date();
      const hour = now.getHours();
      
      // Night: 6 PM (18:00) to 6 AM (6:00)
      // Day: 6 AM (6:00) to 6 PM (18:00)
      const nightTime = hour >= 18 || hour < 6;
      
      setIsNight(nightTime);
      setTheme(nightTime ? "dark" : "light");
      
      // Apply theme to document
      if (nightTime) {
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

  const value: ThemeContextType = {
    theme,
    isNight
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