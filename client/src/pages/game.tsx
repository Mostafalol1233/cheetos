import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Package, ArrowLeft, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import type { Game } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { Link } from "wouter";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { ProductPackGrid } from "@/components/product-pack-card";

export default function GamePage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<number>(0);
  const [ctaVisible, setCtaVisible] = useState<boolean>(false);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (game) {
      document.title = `${game.name} | Diaa Eldeen`;
    }
    return () => {
      document.title = "Diaa Eldeen | Premium Game Store";
    };
  }, [game]);

  useEffect(() => {
    const onScroll = () => {
      const threshold = 320;
      setCtaVisible(window.scrollY > threshold);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('game_not_found')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('game_not_found_desc')}</p>
        </div>
      </div>
    );
  }

  const packagesList = Array.isArray((game as any).packagesList) ? (game as any).packagesList : [];
  const packages = Array.isArray((game as any).packages) && (game as any).packages.length > 0
    ? (game as any).packages
    : packagesList.map((p: any) => p?.name || p?.amount || '').filter(Boolean);

  const packagePrices = Array.isArray((game as any).packagePrices) && (game as any).packagePrices.length > 0
    ? (game as any).packagePrices
    : packagesList.map((p: any) => p?.price ?? 0);

  const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices) && (game as any).packageDiscountPrices.length > 0
    ? (game as any).packageDiscountPrices
    : (Array.isArray((game as any).discountPrices) && (game as any).discountPrices.length > 0
      ? (game as any).discountPrices
      : packagesList.map((p: any) => (p?.discountPrice ?? null)));
  const categoryLabel = (game.category ? String(game.category) : "").replace('-', ' ').toUpperCase();
  const category = Array.isArray(categories)
    ? categories.find((c) => c.slug === game.category)
    : undefined;
  const isOutOfStock = Number(game.stock) <= 0;

  const coerceNumberOrNull = (v: unknown) => {
    if (v === null || v === undefined || v === '') return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  };

  const gameLevelDiscount = coerceNumberOrNull((game as any)?.discountPrice ?? (game as any)?.discount_price ?? null);

  const computeAutoDiscount = (base: number, index: number) => {
    if (!Number.isFinite(base) || base <= 0) return null;
    const key = `${(game as any)?.id || ''}:${String(slug || '')}:${index}`;
    let h = 0;
    for (let i = 0; i < key.length; i++) h = (h * 31 + key.charCodeAt(i)) >>> 0;
    const pct = 0.06 + ((h % 8) / 100); // 6% .. 13%
    const discounted = Math.floor(base * (1 - pct));
    if (!Number.isFinite(discounted) || discounted <= 0 || discounted >= base) return null;
    return discounted;
  };

  const getPackagePricing = (index: number) => {
    const base = Number(packagePrices[index] ?? game.price ?? 0);
    const packageDiscount = coerceNumberOrNull(packageDiscountPrices[index]);
    const gameDiscount = gameLevelDiscount;
    const computed = computeAutoDiscount(base, index);
    
    // Priority: package discount > game discount > auto discount > base price
    let final = base;
    if (packageDiscount != null && packageDiscount > 0 && packageDiscount < base) {
      final = packageDiscount;
    } else if (gameDiscount != null && gameDiscount > 0 && gameDiscount < base) {
      final = gameDiscount;
    } else if (computed != null && computed > 0 && computed < base) {
      final = computed;
    }
    
    const hasDiscount = final !== base;
    return {
      base,
      final,
      original: hasDiscount ? base : null,
    };
  };

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        title: t('out_of_stock'),
        description: t('item_unavailable'),
        duration: 2500,
      });
      return;
    }

    const packageName = packages[selectedPackage] || t('default_package');
    const pricing = getPackagePricing(selectedPackage);
    const packagePrice = pricing.final;
    
    addToCart({
      id: `${game.id}-${selectedPackage}`,
      name: `${game.name} - ${packageName}`,
      price: parseFloat(String(packagePrice)),
      image: game.image,
    });

    toast({
      title: t('success'),
      description: `${game.name} (${packageName}) ${t('added_to_cart')}`,
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        onClick={() => setLocation("/")}
        variant="ghost"
        className="mb-6 text-foreground hover:text-gold-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('back')}
      </Button>

      <div className="space-y-8">
        {/* Game Image - Large Box at Top */}
        <div className="relative w-full">
          <div className="relative overflow-hidden rounded-3xl shadow-2xl border border-gold-primary/20 bg-gray-100 dark:bg-gray-800 inline-block max-w-full">
            <ImageWithFallback 
              src={(game as any).image_url || game.image} 
              alt={game.name} 
              className="w-auto h-auto max-w-full max-h-[600px] object-contain" 
            />
            {game.isPopular && (
              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-primary to-neon-pink text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                <Star className="w-5 h-5 mr-2" />
                {t('popular')}
              </div>
            )}
          </div>
        </div>

        {/* Game Details Below Image */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black text-foreground mb-3">{game.name}</h1>
            <div 
              className="text-muted-foreground text-lg leading-relaxed prose prose-lg max-w-none dark:prose-invert"
              dangerouslySetInnerHTML={{ __html: game.description }}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOutOfStock ? (
              <span className="text-sm text-red-700 dark:text-red-300 font-bold bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-full border border-red-200 dark:border-red-800">
                {t('out_of_stock')}
              </span>
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                ✓ {game.stock} {t('in_stock')}
              </span>
            )}

            {category ? (
              <Link href={`/category/${category.slug}`}>
                <span className="inline-flex items-center gap-2 text-sm text-gold-primary font-bold bg-gold-primary/10 px-4 py-2 rounded-full cursor-pointer hover:bg-gold-primary/20 transition-colors border border-gold-primary/20">
                  {category.image ? (
                    <ImageWithFallback src={category.image} alt={category.name} className="w-5 h-5 rounded object-cover" />
                  ) : null}
                  {category.name}
                </span>
              </Link>
            ) : (
              <span className="text-sm text-gold-primary font-bold bg-gold-primary/10 px-4 py-2 rounded-full border border-gold-primary/20">
                {categoryLabel || t('unknown')}
              </span>
            )}
          </div>
        </div>

        {/* Package Selection */}
        {packages.length > 0 && (
          <div className="space-y-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <h3 className="flex items-center text-3xl font-bold text-foreground">
                <Package className="mr-3 h-7 w-7 text-gold-primary" />
                {t("available_packages")}
              </h3>
              <span className="inline-flex items-center rounded-full border border-gold-primary/10 bg-card/50 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {packages.length} {packages.length === 1 ? "option" : "options"}
              </span>
            </div>

            <ProductPackGrid
              packs={packages.map((pkg: unknown, index: number) => {
                const pricing = getPackagePricing(index);
                return {
                  id: String(index),
                  name: String(pkg),
                  originalPrice: pricing.original,
                  finalPrice: pricing.final,
                  currency: game.currency,
                  image:
                    (Array.isArray((game as any).packageThumbnails) &&
                      (game as any).packageThumbnails[index]) ||
                    game.image,
                  highlight: index === selectedPackage,
                };
              })}
              onSelectPack={(id) => setSelectedPackage(Number(id))}
            />
          </div>
        )}

        {/* Purchase Section */}
        <Card className="border-gold-primary/30 bg-gradient-to-br from-card to-card/50 shadow-xl">
          <CardContent className="p-6 sm:p-8">
            <div className="mb-6 sm:mb-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="mb-2 text-xl font-bold text-foreground sm:text-2xl">
                  {packages[selectedPackage] || t("default_package")}
                </h3>
                <div className="flex items-center gap-3">
                  {(() => {
                    const pricing = getPackagePricing(selectedPackage);
                    return pricing.original != null ? (
                      <>
                        <span className="line-through text-red-600 text-xl sm:text-2xl">
                          {pricing.base} {game.currency}
                        </span>
                        <span className="bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-3xl font-black text-transparent sm:text-5xl">
                          {pricing.final} {game.currency}
                        </span>
                      </>
                    ) : (
                      <span className="bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-3xl font-black text-transparent sm:text-5xl">
                        {pricing.final} {game.currency}
                      </span>
                    );
                  })()}
                </div>
              </div>
              <div className="rounded-xl bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
                <p className="font-semibold uppercase tracking-wide text-foreground/70">
                  {t("includes_taxes")}
                </p>
                <p>{t("secure_checkout")}</p>
              </div>
            </div>

            <Button
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-destructive via-primary to-secondary py-4 text-lg font-bold text-white shadow-lg transition-transform duration-150 hover:scale-[1.02] hover:shadow-xl disabled:scale-100 disabled:bg-muted disabled:text-muted-foreground"
            >
              <ShoppingCart className="h-6 w-6" />
              {isOutOfStock ? t("out_of_stock") : t("add_to_cart")}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Sticky CTA */}
      {ctaVisible && !isOutOfStock && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-gold-primary/20 bg-background/95 p-4 backdrop-blur sm:hidden">
          <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold text-foreground">
                {packages[selectedPackage] || t("default_package")} · 
                {(() => {
                    const pricing = getPackagePricing(selectedPackage);
                    if (pricing.original != null) {
                      return (
                        <>
                          <span className="ml-1 line-through text-xs text-red-500">{pricing.base} {game.currency}</span>
                          <span className="ml-2 text-gold-primary">{pricing.final} {game.currency}</span>
                        </>
                      );
                    }
                    return (
                      <span className="ml-1 text-gold-primary">{pricing.final} {game.currency}</span>
                    );
                })()}
              </div>
              <div className="text-xs text-muted-foreground truncate">{game.name}</div>
            </div>
            <Button
              size="sm"
              onClick={handleAddToCart}
              className="flex items-center gap-1 rounded-xl bg-destructive px-4 py-2 text-xs font-bold text-destructive-foreground shadow-lg hover:bg-destructive/90"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("add_to_cart")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
