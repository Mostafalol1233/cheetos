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

  const packages = game.packages || [];
  const packagePrices = game.packagePrices || [];
  const categoryLabel = (game.category ? String(game.category) : "").replace('-', ' ').toUpperCase();
  const category = Array.isArray(categories)
    ? categories.find((c) => c.slug === game.category)
    : undefined;
  const isOutOfStock = Number(game.stock) <= 0;

  const computeDiscount = (base: number) => {
    if (!Number.isFinite(base) || base < 50) return null;
    const d = base - 100;
    if (!Number.isFinite(d) || d <= 0) return null;
    if (d >= base) return null;
    return d;
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
    const packagePrice = packagePrices[selectedPackage] || game.price;
    
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
        {/* Game Image - Large Square Box at Top */}
        <div className="relative w-full">
          <div className="aspect-square overflow-hidden rounded-3xl shadow-2xl border border-gold-primary/20">
            <ImageWithFallback src={(game as any).image_url || game.image} alt={game.name} className="w-full h-full object-cover" />
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
            <p className="text-muted-foreground text-lg leading-relaxed">{game.description}</p>
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
              packs={packages.map((pkg, index) => {
                const base = Number(packagePrices[index] || game.price || 0);
                const computedDiscount = computeDiscount(base);
                const effectiveFinal = computedDiscount ?? base;
                return {
                  id: String(index),
                  name: String(pkg),
                  originalPrice: computedDiscount != null ? base : null,
                  finalPrice: effectiveFinal,
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
                    const base = Number(packagePrices[selectedPackage] || game.price || 0);
                    const computed = computeDiscount(base);
                    const finalPrice = computed ?? base;

                    return computed != null ? (
                      <>
                        <span className="line-through text-red-600 text-xl sm:text-2xl">
                          {base} {game.currency}
                        </span>
                        <span className="bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-3xl font-black text-transparent sm:text-5xl">
                          {finalPrice} {game.currency}
                        </span>
                      </>
                    ) : (
                      <span className="bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-3xl font-black text-transparent sm:text-5xl">
                        {finalPrice} {game.currency}
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
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/80 bg-background/95 px-4 py-3 shadow-[0_-4px_20px_rgba(0,0,0,0.35)] backdrop-blur-sm sm:hidden">
          <div className="mx-auto flex max-w-md items-center gap-3">
            <div className="flex-1 text-xs leading-snug text-muted-foreground">
              <div className="flex items-center gap-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                <Zap className="h-3 w-3" />
                {t("instant_delivery")}
              </div>
              <div className="font-semibold text-foreground">
                {packages[selectedPackage] || t("default_package")} · 
                {(() => {
                    const base = Number(packagePrices[selectedPackage] || game.price || 0);
                    const computed = computeDiscount(base);
                    const finalPrice = computed ?? base;
                    if (computed != null) {
                      return (
                        <>
                          <span className="line-through text-red-600 text-[10px]">{base}</span> {finalPrice}
                        </>
                      );
                    }
                    return <>{finalPrice}</>;
                })()}
                 {game.currency}
              </div>
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
