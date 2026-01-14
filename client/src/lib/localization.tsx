import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export type Currency = "EGP" | "USD" | "TRY";
export type Country = string | null;

interface LocalizationContextType {
  country: Country;
  currency: Currency;
  setCurrency: (currency: Currency) => void;
  setCountry: (country: Country) => void;
  isLoading: boolean;
  detectUserLocation: () => Promise<void>;
}

const LocalizationContext = createContext<LocalizationContextType | undefined>(undefined);

interface LocalizationProviderProps {
  children: ReactNode;
}

export function LocalizationProvider({ children }: LocalizationProviderProps) {
  const [country, setCountryState] = useState<Country>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("user-country") as Country;
    }
    return null;
  });

  const [currency, setCurrencyState] = useState<Currency>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("user-currency") as Currency;
      return (saved === "EGP" || saved === "USD" || saved === "TRY") ? saved : "USD";
    }
    return "USD";
  });

  const [isLoading, setIsLoading] = useState(false);

  const setCountry = (newCountry: Country) => {
    setCountryState(newCountry);
    if (typeof window !== "undefined") {
      if (newCountry) {
        localStorage.setItem("user-country", newCountry);
      } else {
        localStorage.removeItem("user-country");
      }
    }
  };

  const setCurrency = (newCurrency: Currency) => {
    setCurrencyState(newCurrency);
    if (typeof window !== "undefined") {
      localStorage.setItem("user-currency", newCurrency);
    }
  };

  const detectUserLocation = async () => {
    // If currency is already set manually by user, don't overwrite it with auto-detection
    if (localStorage.getItem("user-currency")) {
      // We still might want to detect country if not set
      if (localStorage.getItem("user-country")) {
        return; 
      }
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/localization/detect");
      if (response.ok) {
        const data = await response.json();
        
        // Only update country if not manually set
        if (!localStorage.getItem("user-country")) {
          setCountry(data.country);
        }
        
        // Only set currency if it hasn't been manually set by the user
        // This is the critical fix for the revert issue
        if (!localStorage.getItem("user-currency")) {
          setCurrency(data.currency);
        }
      }
    } catch (error) {
      console.warn("Failed to detect user location:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-detect location on first load if not already set in storage
  useEffect(() => {
    const hasSetCurrency = localStorage.getItem("user-currency");
    const hasSetCountry = localStorage.getItem("user-country");
    if ((!hasSetCurrency || !hasSetCountry) && !isLoading) {
      detectUserLocation();
    }
  }, [isLoading]);

  const value: LocalizationContextType = {
    country,
    currency,
    setCurrency,
    setCountry,
    isLoading,
    detectUserLocation,
  };

  return (
    <LocalizationContext.Provider value={value}>
      {children}
    </LocalizationContext.Provider>
  );
}

export function useLocalization() {
  const context = useContext(LocalizationContext);
  if (!context) {
    throw new Error("useLocalization must be used within LocalizationProvider");
  }
  return context;
}