import React from "react";
import { cn } from "@/lib/utils";
import ImageWithFallback from "@/components/image-with-fallback";

export interface ProductPackCardProps {
  name: string;
  originalPrice?: string | number | null;
  finalPrice: string | number;
  currency?: string;
  image?: string | null;
  badgeLabel?: string;
  highlight?: boolean;
  onClick?: () => void;
}

export function ProductPackCard({
  name,
  originalPrice,
  finalPrice,
  currency,
  image,
  badgeLabel = "HOT",
  highlight,
  onClick,
}: ProductPackCardProps) {
  const showStrike = originalPrice != null && originalPrice !== "";

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex flex-col rounded-2xl border bg-card/80 p-4 text-left shadow-sm outline-none transition-all duration-200",
        "hover:-translate-y-1 hover:shadow-xl hover:border-primary/60",
        "focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        highlight &&
          "border-primary bg-gradient-to-br from-primary/5 via-background to-secondary/5 shadow-lg",
        "min-h-[180px] cursor-pointer"
      )}
      aria-label={name}
    >
      {/* Badge */}
      {badgeLabel && (
        <div className="pointer-events-none absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-destructive px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-destructive-foreground shadow-sm">
          {badgeLabel}
        </div>
      )}

      {/* Product image */}
      {image && (
        <div className="mb-3 flex w-full items-center justify-center">
          <div className="relative flex h-20 w-20 items-center justify-center overflow-hidden rounded-xl bg-muted/40 ring-1 ring-border/70">
            <ImageWithFallback
              src={image}
              alt={name}
              className="h-full w-full object-contain transition-transform duration-200 group-hover:scale-105"
              width={96}
              height={96}
              sizes="(max-width: 640px) 48px, 96px"
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
            <span className="text-destructive font-extrabold text-lg">
              {finalPrice} {currency}
            </span>
          </div>

          <span className="inline-flex items-center rounded-full bg-primary/10 px-2 py-1 text-[11px] font-medium uppercase tracking-wide text-primary group-hover:bg-primary/20">
            Buy
          </span>
        </div>
      </div>
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
          onClick={() => onSelectPack?.(pack.id)}
        />
      ))}
    </div>
  );
}
