import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Search, Star, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";

const SLUG_DISPLAY_NAMES: Record<string, string> = {
  "hot-deals":    "Hot Deals",
  "mobile-games": "Mobile Games",
  "gift-cards":   "Gift Cards",
  "online-games": "Online Games",
};

const getDisplayName = (name: string, slug: string) =>
  name && name.length > 3 ? name : (SLUG_DISPLAY_NAMES[slug] || name);

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: category } = useQuery<Category[], Error, Category | undefined>({
    queryKey: ["/api/categories"],
    select: (categories) => categories?.find(cat => cat.slug === slug),
  });

  useEffect(() => {
    if (category) {
      document.title = `${category.name} Games | Diaa Eldeen`;
    }
    return () => {
      document.title = "Diaa Eldeen | Premium Game Store";
    };
  }, [category]);

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/category", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">{t('category_not_found')}</h1>
          <p className="text-muted-foreground mb-6">{t('category_not_found_desc')}</p>
          <Link
            href="/"
            className="inline-flex items-center px-6 py-3 rounded-xl bg-gold-primary/15 border border-gold-primary/30 text-gold-primary hover:bg-gold-primary/25 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back_to_home')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${category.name} - متجر ضياء | Diaa Gaming Store - شحن ألعاب ${category.name} في مصر`}
        description={`اكتشف ألعاب ${category.name} في متجر ضياء. شحن ألعاب إلكترونية آمن وسريع في مصر مع Diaa Sadek. أفضل الأسعار والخدمة الموثوقة.`}
        keywords={[category.name, 'ألعاب', 'ضياء', 'Diaa', 'شحن ألعاب', 'gaming Egypt', 'ألعاب إلكترونية', 'top up games', 'gaming store مصر']}
        image={category.image || '/logo.png'}
        url={`${window.location.origin}/category/${category.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": `ألعاب ${category.name} - متجر ضياء`,
          "description": `مجموعة ألعاب ${category.name} المتاحة للشحن في متجر ضياء`,
          "url": `${window.location.origin}/category/${category.slug}`,
          "isPartOf": {
            "@type": "WebSite",
            "name": "متجر ضياء",
            "url": window.location.origin
          },
          "about": {
            "@type": "Thing",
            "name": category.name,
            "description": `فئة ${category.name} في ألعاب إلكترونية`
          },
          "mainEntity": {
            "@type": "ItemList",
            "name": `ألعاب ${category.name}`,
            "description": `قائمة ألعاب ${category.name} المتاحة في متجر ضياء`
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "الرئيسية",
                "item": window.location.origin
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": category.name,
                "item": `${window.location.origin}/category/${category.slug}`
              }
            ]
          }
        }}
      />
      <div className="min-h-screen bg-background text-foreground">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="mb-8">
            <Link
              href="/"
              className="inline-flex items-center text-muted-foreground hover:text-gold-primary transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t('back_to_home')}
            </Link>

            <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} h-52 mb-8 shadow-2xl`}>
              <ImageWithFallback
                src={category.image}
                alt={`${category.name} category`}
                className="absolute inset-0 w-full h-full object-cover opacity-70 scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/30 to-transparent" />
              <div className="relative z-10 h-full flex flex-col justify-end p-8">
                <h1 className="text-4xl md:text-5xl font-black text-white mb-2 drop-shadow-lg">{getDisplayName(category.name, category.slug)}</h1>
                <p className="text-white/85 text-base drop-shadow">{category.description}</p>
              </div>
            </div>
          </div>

          {/* Games Grid */}
          {games.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-3xl font-bold text-foreground mb-1 flex items-center">
                    <span className="w-2 h-2 bg-gold-primary rounded-full mr-3"></span>
                    {t('available_games')} ({games.length})
                  </h2>
                </div>
                <div className="flex items-center text-muted-foreground bg-card/50 px-4 py-2 rounded-full">
                  <Search className="w-4 h-4 mr-2" />
                  <span>{games.length} {t('games_found')}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {games.map((game) => {
                  const packages = Array.isArray(game.packages) ? game.packages : [];
                  const packagePrices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
                  const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices)
                    ? (game as any).packageDiscountPrices
                    : (Array.isArray((game as any).discountPrices) ? (game as any).discountPrices : []);

                  const coerceNumberOrNull = (v: unknown) => {
                    if (v === null || v === undefined || v === '') return null;
                    const n = Number(v);
                    return Number.isFinite(n) ? n : null;
                  };

                  const getPricing = (index: number) => {
                    const base = Number(packagePrices[index] ?? game.price ?? 0);
                    const packageDiscount = coerceNumberOrNull(packageDiscountPrices[index]);
                    const gameDiscount = coerceNumberOrNull((game as any)?.discountPrice ?? (game as any)?.discount_price ?? null);

                    let final = base;
                    if (packageDiscount != null && packageDiscount > 0 && packageDiscount < base) {
                      final = packageDiscount;
                    } else if (gameDiscount != null && gameDiscount > 0 && gameDiscount < base) {
                      final = gameDiscount;
                    }

                    const hasDiscount = final !== base;
                    return {
                      base,
                      final,
                      original: hasDiscount ? base : null,
                    };
                  };

                  const isOutOfStock = Number(game.stock) <= 0;

                  const handleBuy = () => {
                    if (isOutOfStock) {
                      toast({ title: t('out_of_stock'), description: t('item_unavailable'), duration: 2500 });
                      return;
                    }
                    const packagesArr = Array.isArray(game.packages) ? game.packages : [];
                    const pricesArr = Array.isArray(game.packagePrices) ? game.packagePrices : [];
                    const pkgName = packagesArr[0];
                    const pkgPrice = pricesArr[0];
                    addToCart({
                      id: pkgName ? `${game.id}-0` : game.id,
                      name: pkgName ? `${game.name} - ${pkgName}` : game.name,
                      price: parseFloat((pkgPrice || game.price).toString()),
                      image: game.image,
                    });
                    toast({ title: t('success'), description: `${game.name} ${t('added_to_cart')}`, duration: 2000 });
                  };

                  return (
                    <Card key={game.id} className="overflow-hidden border-gold-primary/10 hover:border-gold-primary/50 hover:shadow-xl hover:scale-105 transition-all duration-300 group">
                      <div className="aspect-[4/3] relative overflow-hidden bg-gradient-to-br from-muted to-card">
                        <ImageWithFallback
                          src={game.image}
                          alt={game.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        {game.isPopular && (
                          <div className="absolute top-3 right-3 bg-gradient-to-r from-gold-primary to-neon-pink text-white px-3 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                            <Star className="w-3 h-3 mr-1" />
                            {t('popular')}
                          </div>
                        )}
                      </div>
                      <CardContent className="p-4">
                        <h3 className="font-bold text-lg mb-3 text-foreground">{game.name}</h3>

                        {/* Card Amounts/Packages */}
                        {packages.length > 0 ? (
                          <div className="mb-3 space-y-1">
                            {packages.slice(0, 2).map((pkg: string, idx: number) => {
                              const pricing = getPricing(idx);

                              return (
                                <div key={idx} className="flex items-center justify-between text-xs">
                                  <span className="text-muted-foreground">{pkg}</span>
                                  <div className="flex items-center gap-1">
                                    {pricing.original != null && (
                                      <span className="text-red-400 line-through text-[10px]">{pricing.base} EGP</span>
                                    )}
                                    <span className="text-gold-primary font-bold">{pricing.final} EGP</span>
                                  </div>
                                </div>
                              );
                            })}
                            {packages.length > 2 && (
                              <div className="text-xs text-muted-foreground">+{packages.length - 2} {t('more_packages')}</div>
                            )}
                          </div>
                        ) : (
                          <div className="mb-3">
                            {(() => {
                              const base = Number(game.price);
                              const discount = coerceNumberOrNull((game as any).discountPrice);
                              const hasDiscount = discount != null && discount > 0 && discount < base;
                              const finalPrice = hasDiscount ? (discount as number) : base;
                              return hasDiscount ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-gray-500 line-through text-sm">{base} EGP</span>
                                  <span className="text-gold-primary font-bold text-lg">{finalPrice} EGP</span>
                                </div>
                              ) : (
                                <div className="text-gold-primary font-bold text-lg">{finalPrice} EGP</div>
                              );
                            })()}
                          </div>
                        )}

                        <Link href={`/game/${game.slug}`} className="w-full block">
                          <Button size="sm" className="w-full bg-gradient-to-r from-gold-primary to-amber-600 hover:shadow-lg text-background disabled:bg-muted disabled:hover:bg-muted transition-all">
                            <ShoppingCart className="w-4 h-4 mr-2" />
                            {isOutOfStock ? t('out_of_stock') : t('view_packages')}
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-16">
              <Package className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-xl font-semibold text-foreground mb-2">
                {t('no_games_available')}
              </h3>
              <p className="text-muted-foreground mb-6">
                {t('no_games_in_category')}
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-6 py-3 rounded-xl bg-gold-primary/15 border border-gold-primary/30 text-gold-primary hover:bg-gold-primary/25 transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('browse_other_categories')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
