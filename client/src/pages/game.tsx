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
import { useLocalizedPrices } from "@/hooks/use-localized-prices";
import { useLocalization } from "@/lib/localization";
import { ProductPackGrid } from "@/components/product-pack-card";
import { SEO } from "@/components/SEO";

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

  const { currency } = useLocalization();
  const { prices: localizedPrices, isLoading: pricesLoading } = useLocalizedPrices(game?.id || game?.slug || '');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    if (game) {
      // SEO will handle title
    }
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
    // Use localized prices if available
    if (localizedPrices && localizedPrices[index]) {
      const localized = localizedPrices[index];
      return {
        base: localized.price,
        final: localized.price,
        original: null, // Localized prices don't have discounts for now
        currency: currency,
        isEstimated: localized.isEstimated
      };
    }

    // --- Fallback and Currency Conversion Logic ---
    const baseEgp = Number(packagePrices[index] ?? game.price ?? 0);
    const packageDiscountEgp = coerceNumberOrNull(packageDiscountPrices[index]);
    const gameDiscountEgp = gameLevelDiscount;
    const computedDiscountEgp = computeAutoDiscount(baseEgp, index);

    // Priority: package discount > game discount > auto discount > base price
    let finalEgp = baseEgp;
    if (packageDiscountEgp != null && packageDiscountEgp > 0 && packageDiscountEgp < baseEgp) {
      finalEgp = packageDiscountEgp;
    } else if (gameDiscountEgp != null && gameDiscountEgp > 0 && gameDiscountEgp < baseEgp) {
      finalEgp = gameDiscountEgp;
    } else if (computedDiscountEgp != null && computedDiscountEgp > 0 && computedDiscountEgp < baseEgp) {
      finalEgp = computedDiscountEgp;
    }

    const hasDiscount = finalEgp !== baseEgp;

    // If current currency is EGP, return original values
    if (currency === 'EGP') {
      return {
        base: baseEgp,
        final: finalEgp,
        original: hasDiscount ? baseEgp : null,
        currency: 'EGP',
        isEstimated: false
      };
    }

    // --- Automatic Conversion for other currencies ---
    const EGP_TO_USD_RATE = 1 / 50;
    const EGP_TO_TRY_RATE = 1 / 1.5; // Placeholder rate

    let finalConverted = 0;
    let baseConverted = 0;
    
    if (currency === 'USD') {
      finalConverted = finalEgp * EGP_TO_USD_RATE;
      baseConverted = baseEgp * EGP_TO_USD_RATE;
    } else if (currency === 'TRY') {
      finalConverted = finalEgp * EGP_TO_TRY_RATE;
      baseConverted = baseEgp * EGP_TO_TRY_RATE;
    } else {
      // If currency is unknown, default to EGP
       return {
        base: baseEgp,
        final: finalEgp,
        original: hasDiscount ? baseEgp : null,
        currency: 'EGP',
        isEstimated: false
      };
    }
    
    // Round to 2 decimal places
    finalConverted = Math.round(finalConverted * 100) / 100;
    baseConverted = Math.round(baseConverted * 100) / 100;

    return {
      base: baseConverted,
      final: finalConverted,
      original: hasDiscount ? baseConverted : null,
      currency: currency,
      isEstimated: true // Mark this price as an estimate
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
    <>
      <SEO
        title={`شحن ${game.name} - متجر ضياء | Diaa Gaming Top Up - أفضل أسعار في مصر`}
        description={`اشحن عملات ${game.name} بسهولة في متجر ضياء. خدمة شحن آمنة وسريعة في مصر مع Diaa Sadek. احصل على العملات بأفضل الأسعار. شحن فوري ودعم 24/7.`}
        keywords={[`شحن ${game.name}`, game.name, 'ضياء', 'Diaa', 'شحن ألعاب', 'gaming top up Egypt', 'ألعاب إلكترونية مصر', 'شحن عملات', 'top up games', 'Free Fire', 'PUBG', 'ألعاب موبايل']}
        image={`/images/${game.slug}.webp`}
        url={`${window.location.origin}/game/${game.slug}`}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Product",
          "name": game.name,
          "description": `شحن عملات ${game.name} في متجر ضياء - خدمة آمنة وسريعة في مصر`,
          "brand": {
            "@type": "Brand",
            "name": "ضياء",
            "alternateName": "Diaa Sadek"
          },
          "manufacturer": {
            "@type": "Organization",
            "name": "متجر ضياء"
          },
          "category": "Gaming Top-Up",
          "offers": {
            "@type": "Offer",
            "priceCurrency": "EGP",
            "availability": "https://schema.org/InStock",
            "seller": {
              "@type": "Organization",
              "name": "متجر ضياء"
            },
            "priceValidUntil": new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.9",
            "reviewCount": "1500",
            "bestRating": "5",
            "worstRating": "1"
          },
          "review": [
            {
              "@type": "Review",
              "author": {
                "@type": "Person",
                "name": "عميل سعيد"
              },
              "reviewRating": {
                "@type": "Rating",
                "ratingValue": "5",
                "bestRating": "5"
              },
              "reviewBody": "خدمة ممتازة وشحن سريع جداً"
            }
          ],
          "areaServed": {
            "@type": "Country",
            "name": "Egypt"
          },
          "serviceType": "Gaming Currency Top-Up"
        }}
      />

      {/* FAQ Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          "mainEntity": [
            {
              "@type": "Question",
              "name": `كيف أشحن عملات ${game.name} في متجر ضياء؟`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `يمكنك اختيار باقة الشحن المطلوبة من صفحة ${game.name} في متجر ضياء، ثم إتمام الدفع بأمان للحصول على العملات فوراً.`
              }
            },
            {
              "@type": "Question",
              "name": `هل شحن ${game.name} آمن في مصر؟`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `نعم، متجر ضياء يضمن أمان جميع عمليات الشحن لـ ${game.name} مع حماية بياناتك الشخصية.`
              }
            },
            {
              "@type": "Question",
              "name": `ما هي سرعة شحن ${game.name} في Diaa؟`,
              "acceptedAnswer": {
                "@type": "Answer",
                "text": `الشحن يتم فوراً بعد الدفع، مما يتيح لك الاستمتاع بلعب ${game.name} دون تأخير.`
              }
            }
          ]
        })}
      </script>

      {/* HowTo Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `كيفية شحن ${game.name} في متجر ضياء`,
          "description": `دليل خطوة بخطوة لشحن عملات ${game.name} بأمان في متجر ضياء`,
          "step": [
            {
              "@type": "HowToStep",
              "name": "اختر اللعبة",
              "text": `اذهب إلى صفحة ${game.name} في متجر ضياء`
            },
            {
              "@type": "HowToStep",
              "name": "اختر الباقة",
              "text": "اختر كمية العملات التي تريدها"
            },
            {
              "@type": "HowToStep",
              "name": "ادفع بأمان",
              "text": "أكمل عملية الدفع باستخدام طرق الدفع المتاحة"
            },
            {
              "@type": "HowToStep",
              "name": "احصل على العملات",
              "text": "ستحصل على العملات فوراً في حسابك"
            }
          ],
          "totalTime": "PT5M",
          "supply": [
            {
              "@type": "HowToSupply",
              "name": "حساب لعبة صالح"
            }
          ]
        })}
      </script>
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
        {/* Game Image - Large Centered Image */}
        <div className="relative w-full flex justify-center">
          <div className="relative max-w-4xl w-full">
            <ImageWithFallback 
              src={(game as any).image_url || game.image} 
              alt={game.name} 
              className="w-full h-auto max-h-[800px] object-contain mx-auto" 
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
                  currency: pricing.currency || currency,
                  image:
                    (Array.isArray((game as any).packageThumbnails) &&
                      (game as any).packageThumbnails[index]) ||
                    game.image,
                  highlight: false,
                };
              })}
              onSelectPack={(id) => handleBuyNow(Number(id))}
            />
          </div>
        )}
      </div>
    </div>
    </>
  );
}
