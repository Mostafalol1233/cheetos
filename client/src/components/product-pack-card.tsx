import React from "react";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/image-with-fallback";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingCart } from "lucide-react";

export interface ProductPackCardProps {
  name: string;
  originalPrice?: string | number | null;
  finalPrice: string | number;
  currency?: string;
  image?: string | null;
  badgeLabel?: string;
  highlight?: boolean;
  onClick?: () => void;
  href?: string;
  bonus?: string | null;
}

export function ProductPackCard({
  name,
  originalPrice,
  finalPrice,
  currency = "EGP",
  image,
  badgeLabel = "HOT",
  highlight,
  onClick,
  href,
  bonus,
}: ProductPackCardProps) {
  const showStrike = originalPrice != null && originalPrice !== "";

  const Content = (
      <div className={cn(
        "group relative flex flex-col rounded-3xl border bg-card/90 p-4 sm:p-6 text-left shadow-lg outline-none transition-all duration-300",
        "hover:-translate-y-2 hover:shadow-2xl hover:border-primary/50",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        highlight &&
          "border-primary bg-gradient-to-br from-primary/10 via-card to-secondary/10 shadow-xl",
        "min-h-[280px] sm:min-h-[320px] cursor-pointer w-full overflow-hidden"
      )}
    >
      {/* Dynamic Background Effect */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

      {/* Badge */}
      {badgeLabel && (
        <div className="absolute left-4 top-4 z-10 inline-flex items-center rounded-full bg-gradient-to-r from-red-600 to-red-500 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white shadow-lg animate-pulse">
          {badgeLabel}
        </div>
      )}

      {/* Product image */}
      {image && (
        <div className="mb-4 sm:mb-6 flex w-full items-center justify-center">
          <div className="relative flex h-32 w-32 sm:h-40 sm:w-40 items-center justify-center overflow-hidden rounded-2xl bg-muted/20 ring-4 ring-background shadow-inner">
            <ImageWithFallback
              src={image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              width={160}
              height={160}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex flex-1 flex-col justify-between gap-2">
        <div>
          <p className="line-clamp-2 text-sm font-semibold text-foreground">
            {name}
          </p>
        </div>

        <div className="mt-1 flex items-end justify-between gap-2">
          <div className="flex flex-col">
            {showStrike && (
              <span className="text-xs font-medium text-red-600 line-through">
                {originalPrice} {currency}
              </span>
            )}
            <span className="text-destructive font-extrabold text-2xl sm:text-3xl leading-tight">
              {finalPrice} {currency}
            </span>
            {bonus && (
              <span className="text-xs font-bold text-amber-400 mt-1">
                +{bonus} Bonus
              </span>
            )}
          </div>

          <span className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-4 py-2 text-sm font-bold uppercase tracking-wide shadow-md hover:scale-105 transition-transform min-w-[100px]">
            Buy Now
          </span>
        </div>
      </div>
    </div>
  );

  if (href) {
    return (
        <Link href={href} className="block w-full">
            {Content}
        </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      className="block w-full text-left"
      aria-label={name}
    >
      {Content}
    </button>
  );
}

export interface ProductPackGridProps {
  packs: Array<{
    id: string;
    name: string;
    originalPrice?: string | number | null;
    finalPrice: string | number;
    currency?: string;
    image?: string | null;
    highlight?: boolean;
    bonus?: string | null;
  }>;
  onSelectPack?: (id: string) => void;
}

export function ProductPackGrid({ packs, onSelectPack }: ProductPackGridProps) {
  if (!packs || packs.length === 0) {
    return (
      <div className="grid gap-4 rounded-2xl border border-dashed border-border/70 bg-muted/10 p-6 text-center text-sm text-muted-foreground">
        No packages available yet.
      </div>
    );
  }

  return (
    <div className="grid gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4" aria-label="Available packages">
      {packs.map((pack) => (
        <ProductPackCard
          key={pack.id}
          name={pack.name}
          originalPrice={pack.originalPrice}
          finalPrice={pack.finalPrice}
          currency={pack.currency}
          image={pack.image}
          highlight={pack.highlight}
          bonus={pack.bonus}
          onClick={() => onSelectPack?.(pack.id)}
        />
      ))}
    </div>
  );
}
