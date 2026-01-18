import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Star, Package, ArrowLeft, Sparkles, Gift, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Game, Category } from "@shared/schema";
import { Link } from "wouter";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
// import { useLocalizedPrices } from "@/hooks/use-localized-prices";

// ... inside GamePage ...

// const { prices: localizedPrices } = useLocalizedPrices(game?.id || game?.slug || '');

// ...

<ImageWithFallback
  src={getHeroImage()}
  alt={game.name}
  className="w-full h-auto object-contain bg-black/10"
/>

// ...

const getPackagePricing = (index: number) => {
  // Localization temporarily disabled to fix price mismatch
  // if (localizedPrices && localizedPrices[index]) { ... }

  const basePrice = Number(packagePrices[index] ?? game.price ?? 0);
  // ...
};

// ...

{/* Bonus in Details */ }
{
  bonus && (
    <div className="text-xs font-bold text-[#fbbf24] mt-1 mb-1 uppercase tracking-wide">
      {bonus} Bonus
    </div>
  )
}

{/* Prices */ }
<div className="mt-auto mb-2 space-y-0.5">
  {hasDiscount && (
    <p className="text-xs text-muted-foreground line-through decoration-red-500/50">
      {formatPrice(pricing.original!, pricing.currency)}
    </p>
  )}
  <p className="text-lg font-black text-white">
    {formatPrice(pricing.final, pricing.currency)}
  </p>
</div>

{/* In Stock Indicator */ }
<div className="flex items-center justify-center gap-1.5 mb-3">
  <div className={`w-2 h-2 rounded-full ${isOutOfStock ? 'bg-red-500' : 'bg-green-500'}`} />
  <span className={`text-xs font-bold ${isOutOfStock ? 'text-red-400' : 'text-green-400'}`}>
    {isOutOfStock ? 'Out of stock' : 'In stock'}
  </span>
</div>

{/* Fake Stars - No text count */ }
<div className="flex items-center justify-center gap-0.5 mb-3">
  {[1, 2, 3, 4, 5].map(i => (
    <Star key={i} className="w-3 h-3 text-[#fbbf24] fill-[#fbbf24]" />
  ))}
</div>

