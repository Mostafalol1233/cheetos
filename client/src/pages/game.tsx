import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Star, Package, ArrowLeft, Sparkles, Gift, Zap, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
import type { Game, Category } from "@shared/schema";
import { Link } from "wouter";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { useLocalizedPrices } from "@/hooks/use-localized-prices";
import { useLocalization } from "@/lib/localization";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";

export default function GamePage() {
  const { slug } = useParams();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  const { currency } = useLocalization();
  const { prices: localizedPrices } = useLocalizedPrices(game?.id || game?.slug || '');

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">{t('game_not_found')}</h1>
          <p className="text-muted-foreground mb-6">{t('game_not_found_desc')}</p>
          <Link href="/">
            <Button className="btn-gaming">Go Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  const packagesList = Array.isArray((game as any).packagesList) ? (game as any).packagesList : [];

  // Prioritize rich package objects if available, otherwise fallback to simple strings mapped to objects
  const packages = packagesList.length > 0
    ? packagesList
    : (Array.isArray((game as any).packages) ? (game as any).packages : []).map((p: any) => ({
      name: typeof p === 'string' ? p : p?.name || p?.amount || '',
      image: null,
      bonus: null
    })).filter((p: any) => p.name);

  // Helper to safely get package data regardless of source
  const getPackageData = (index: number) => {
    if (packagesList.length > 0 && packagesList[index]) {
      return packagesList[index];
    }
    return packages[index] || {};
  };

  const packagePrices = Array.isArray((game as any).packagePrices) && (game as any).packagePrices.length > 0
    ? (game as any).packagePrices
    : packagesList.map((p: any) => p?.price ?? 0);

  const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices) && (game as any).packageDiscountPrices.length > 0
    ? (game as any).packageDiscountPrices
    : packagesList.map((p: any) => (p?.discountPrice ?? null));

  const packageBonuses = packagesList.map((p: any) => p?.bonus || null);

  const category = Array.isArray(categories)
    ? categories.find((c) => c.slug === game.category)
    : undefined;

  const isOutOfStock = Number(game.stock) <= 0;

  const getPackagePricing = (index: number) => {
    if (localizedPrices && localizedPrices[index]) {
      const localized = localizedPrices[index];
      return {
        base: localized.price,
        final: localized.price,
        original: null,
        currency: currency,
      };
    }

    const basePrice = Number(packagePrices[index] ?? game.price ?? 0);
    const discountPrice = packageDiscountPrices[index];
    const hasDiscount = discountPrice && discountPrice > 0 && discountPrice < basePrice;

    return {
      base: basePrice,
      final: hasDiscount ? discountPrice : basePrice,
      original: hasDiscount ? basePrice : null,
      currency: 'EGP',
    };
  };

  const formatPrice = (price: number, curr: string) => {
    return new Intl.NumberFormat('en-EG', {
      style: 'currency',
      currency: 'EGP',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const handlePackageClick = (index: number) => {
    setLocation(`/package/${slug}/${index}`);
  };

  return (
    <>
      <SEO
        title={`شحن ${game.name} - متجر ضياء | Diaa Gaming Top Up`}
        description={`اشحن عملات ${game.name} بسهولة في متجر ضياء. خدمة شحن آمنة وسريعة في مصر.`}
        keywords={[`شحن ${game.name}`, game.name, 'ضياء', 'Diaa', 'شحن ألعاب']}
        image={`/images/${game.slug}.webp`}
        url={`${window.location.origin}/game/${game.slug}`}
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section with Game Image */}
        <div className="relative">
          {/* Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-b from-cyber-blue/10 via-background to-background" />

          <div className="container mx-auto px-4 pt-8 pb-12 relative z-10">
            {/* Back Button */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Button
                onClick={() => setLocation("/")}
                variant="ghost"
                className="mb-6 hover:bg-cyber-blue/10 hover:text-cyber-blue rounded-xl"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                {t('back')}
              </Button>
            </motion.div>

            <div className="grid lg:grid-cols-2 gap-8 items-start">
              {/* Game Image */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="relative"
              >
                <div className="relative rounded-3xl overflow-hidden glass border border-white/10">
                  <ImageWithFallback
                    src={(game as any).image_url || game.image}
                    alt={game.name}
                    className="w-full h-auto max-h-[500px] object-cover"
                  />

                  {/* Badges */}
                  <div className="absolute top-4 left-4 flex flex-col gap-2">
                    {game.isPopular && (
                      <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-cyber-gold to-plasma-orange text-black text-sm font-bold flex items-center gap-1.5 shadow-lg">
                        <Star className="w-4 h-4" />
                        Popular
                      </span>
                    )}
                    {!isOutOfStock && (
                      <span className="px-3 py-1.5 rounded-full bg-electric-green/90 text-black text-sm font-bold shadow-lg">
                        ✓ In Stock
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* Game Info */}
              <motion.div
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="space-y-6"
              >
                {/* Category */}
                {category && (
                  <Link href={`/category/${category.slug}`}>
                    <span className="inline-flex items-center gap-2 text-sm text-cyber-blue font-medium bg-cyber-blue/10 px-4 py-2 rounded-full hover:bg-cyber-blue/20 transition-colors border border-cyber-blue/20 cursor-pointer">
                      {category.name}
                    </span>
                  </Link>
                )}

                <h1 className="text-4xl md:text-5xl font-bold text-foreground font-gaming">
                  {game.name}
                </h1>

                <div
                  className="text-muted-foreground text-lg leading-relaxed prose prose-lg max-w-none dark:prose-invert"
                  dangerouslySetInnerHTML={{ __html: game.description }}
                />

                {isOutOfStock && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive font-medium">
                    ⚠️ This item is currently out of stock
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        </div>

        {/* Packages Section */}
        {packages.length > 0 && (
          <section className="container mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8"
            >
              <div>
                <h2 className="text-3xl font-bold text-foreground flex items-center gap-3">
                  <Package className="w-8 h-8 text-cyber-blue" />
                  Select Package
                </h2>
                <p className="text-muted-foreground mt-1">Choose your preferred amount</p>
              </div>
              <span className="px-4 py-2 rounded-full glass border border-white/10 text-sm font-medium text-muted-foreground">
                {packages.length} {packages.length === 1 ? "package" : "packages"} available
              </span>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {packages.map((pkgItem: any, index: number) => {
                const pkgData = getPackageData(index);
                const name = pkgData.name || (typeof pkgItem === 'string' ? pkgItem : pkgItem.name);
                const image = pkgData.image || (game as any).image_url || game.image;

                const pricing = getPackagePricing(index);
                // Prefer bonus from rich object, then array
                const bonus = pkgData.bonus || packageBonuses[index];
                const hasDiscount = pricing.original !== null;
                const discountPercent = hasDiscount
                  ? Math.round((1 - pricing.final / pricing.original!) * 100)
                  : 0;

                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    viewport={{ once: true }}
                    whileHover={{ y: -8, scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => !isOutOfStock && handlePackageClick(index)}
                    className={`relative cursor-pointer ${isOutOfStock ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    <div className="relative p-6 rounded-2xl glass border border-white/10 hover:border-cyber-blue/50 transition-all duration-300 h-full flex flex-col group overflow-hidden">
                      {/* Discount Badge */}
                      {hasDiscount && (
                        <div className="absolute top-0 right-0 z-20">
                          <div className="bg-gradient-to-r from-neon-pink to-plasma-orange text-white text-xs font-bold px-3 py-1.5 rounded-bl-xl rounded-tr-2xl">
                            -{discountPercent}%
                          </div>
                        </div>
                      )}

                      {/* Bonus Badge */}
                      {bonus && (
                        <div className="absolute top-0 left-0 z-20">
                          <div className="bg-gradient-to-r from-cyber-gold to-plasma-orange text-black text-xs font-bold px-3 py-1.5 rounded-br-xl rounded-tl-2xl flex items-center gap-1 shadow-lg">
                            <Gift className="w-3 h-3" />
                            +{bonus}
                          </div>
                        </div>
                      )}

                      {/* Package Content */}
                      <div className="flex-1 flex flex-col items-center text-center pt-4">
                        {/* Package Image or Icon */}
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-cyber-blue/20 to-neon-purple/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform overflow-hidden relative shadow-lg">
                          {image ? (
                            <ImageWithFallback
                              src={image}
                              alt={name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <Sparkles className="w-10 h-10 text-cyber-blue" />
                          )}
                          {/* Glow overlay */}
                          <div className="absolute inset-0 bg-cyber-blue/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>

                        {/* Package Name/Amount */}
                        <h3 className="text-xl font-bold text-foreground mb-2 line-clamp-2group-hover:text-cyber-blue transition-colors">
                          {name}
                        </h3>

                        {/* Price */}
                        <div className="mt-auto pt-4 relative z-10">
                          {hasDiscount && (
                            <p className="text-sm text-muted-foreground line-through mb-1">
                              {formatPrice(pricing.original!, pricing.currency)}
                            </p>
                          )}
                          <p className="text-2xl font-bold text-cyber-blue text-glow-cyber-blue">
                            {formatPrice(pricing.final, pricing.currency)}
                          </p>
                        </div>

                        {/* CTA */}
                        <Button
                          className="w-full mt-4 btn-gaming group/btn shadow-lg shadow-cyber-blue/20"
                          disabled={isOutOfStock}
                        >
                          <Zap className="w-4 h-4 mr-2 group-hover/btn:animate-pulse" />
                          Buy Now
                        </Button>
                      </div>

                      {/* Hover Glow Effect */}
                      <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl -z-10" />
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </>
  );
}
