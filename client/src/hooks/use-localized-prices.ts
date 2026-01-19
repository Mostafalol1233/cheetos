import { useState, useEffect } from "react";
import { useLocalization } from "@/lib/localization";

interface LocalizedPrice {
  packageIndex: number;
  price: number;
  isEstimated: boolean;
  formatted: string;
}

interface UseLocalizedPricesResult {
  prices: LocalizedPrice[] | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useLocalizedPrices(gameId: string): UseLocalizedPricesResult {
  const { currency } = useLocalization();
  const [prices, setPrices] = useState<LocalizedPrice[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPrices = async () => {
    if (!gameId) return;

    // Frontend currently uses EGP only. Keep admin-set prices exactly as stored
    // and skip remote localization to avoid mismatches between dashboard and user view.
    if (currency === "EGP") {
      setPrices(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/api/localization/prices/${encodeURIComponent(gameId)}?currency=${currency}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch prices: ${response.status}`);
      }

      const data = await response.json();
      setPrices(data.prices);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch prices");
      setPrices(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPrices();
  }, [gameId, currency]);

  return {
    prices,
    isLoading,
    error,
    refetch: fetchPrices,
  };
}
