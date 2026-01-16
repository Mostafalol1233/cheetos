import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductPackGrid } from "@/components/product-pack-card";
import { useCart } from "@/lib/cart-context";
import { useLocalization } from "@/lib/localization";
import ImageWithFallback from "@/components/image-with-fallback";

export default function PacksPage() {
  const { data: games = [], isLoading } = useQuery<any[]>({ queryKey: ["/api/games"] });
  const { addToCart } = useCart();
  const { currency } = useLocalization();

  const computeDiscount = (base: number) => {
    if (!Number.isFinite(base) || base < 50) return null;
    const d = base - 100;
    if (!Number.isFinite(d) || d <= 0) return null;
    if (d >= base) return null;
    return d;
  };

  // Aggregate packs from all games for demo; adapt to /api/packs if available
  const packs = React.useMemo(() => {
    const out: any[] = [];
    (games || ([] as any[])).forEach((g: any) => {
      // Handle both legacy packages and new packagesList
      const packages = Array.isArray(g.packages) ? g.packages : [];
      const packagesList = Array.isArray(g.packagesList) ? g.packagesList : [];
      
      if (packages.length > 0 || packagesList.length > 0) {
        const items = packagesList.length > 0 ? packagesList : packages.map((pkg: string, idx: number) => ({
          name: pkg,
          price: Number((g.packagePrices && g.packagePrices[idx]) || g.price || 0),
          discountPrice: Array.isArray(g.packageDiscountPrices) ? g.packageDiscountPrices[idx] : null,
          image: (g.packageThumbnails && g.packageThumbnails[idx]) || g.image,
        }));
        
        items.forEach((pkg: any, idx: number) => {
          const base = Number(pkg.price || 0);
          const discount = pkg.discountPrice != null ? Number(pkg.discountPrice) : null;
          // Treat discountPrice as final price (big font); price as original/strikethrough
          const final = (discount != null && Number.isFinite(discount) && discount > 0 && discount < base) ? discount : base;
          const hasDiscount = final !== base;
          out.push({
            id: `${g.id}-pkg-${idx}`,
            name: pkg.name || pkg,
            originalPrice: hasDiscount ? base : null,
            finalPrice: final,
            currency: currency,
            image: pkg.image || g.image,
            href: `/packages/${pkg.slug || (pkg.name || pkg).toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
          });
        });
      }
    });
    return out;
  }, [games]);

  const handleSelect = (id: string) => {
    // naive add: find pack and add to cart
    const p = packs.find((x) => x.id === id);
    if (!p) return;
    addToCart({ id: p.id, name: p.name, price: Number(p.finalPrice), image: p.image });
  };

  return (
    <div className="min-h-screen bg-background py-8">
      <div className="container mx-auto px-4">
        <header className="mb-6">
          <h1 className="text-3xl font-bold text-foreground">Packages & Gift Cards</h1>
          <p className="text-muted-foreground mt-2">Browse available packs — responsive grid with sticky CTA.</p>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[160px] w-full rounded-xl bg-gray-200" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
        ) : (
          <section>
            <ProductPackGrid packs={packs} onSelectPack={handleSelect} />
          </section>
        )}
      </div>

      {/* Sticky CTA for mobile */}
      <div className="fixed left-0 right-0 bottom-0 z-50 p-4 bg-gradient-to-t from-background/80 to-transparent backdrop-blur sm:hidden">
        <div className="container mx-auto px-4">
          <Button className="w-full bg-destructive text-destructive-foreground py-3 font-bold flex items-center justify-center gap-2">
            ⚡ Buy Now
          </Button>
        </div>
      </div>
    </div>
  );
}
