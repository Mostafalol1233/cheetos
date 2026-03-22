import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, HelpCircle, Star, ShieldCheck, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";
import { useState } from "react";

const CURRENCY_IMAGES: Record<string, string> = {
  'pubg-mobile': '/images/currency-pubg-uc.png',
  'pubg': '/images/currency-pubg-uc.png',
  'free-fire': '/images/currency-freefire-diamonds.png',
  'freefire': '/images/currency-freefire-diamonds.png',
  'garena-free-fire': '/images/currency-freefire-diamonds.png',
  'call-of-duty-mobile': '/images/currency-cod-cp.png',
  'call-of-duty': '/images/currency-cod-cp.png',
  'crossfire': '/images/currency-crossfire-zp.png',
  'league-of-legends': '/images/currency-lol-rp.png',
  'valorant': '/images/currency-lol-rp.png',
  'fortnite': '/images/currency-fortnite-vbucks.png',
  'roblox': '/images/currency-roblox-robux.png',
  'honor-of-kings': '/images/currency-roblox-robux.png',
  'hok': '/images/currency-roblox-robux.png',
  'google-play': '/images/currency-gift-card.png',
  'steam': '/images/currency-gift-card.png',
  'playstation': '/images/currency-gift-card.png',
  'ps-store': '/images/currency-gift-card.png',
  'xbox': '/images/currency-gift-card.png',
  'xbox-live': '/images/currency-gift-card.png',
  'discord-nitro': '/images/currency-gift-card.png',
  'netflix': '/images/currency-gift-card.png',
  'ea-play': '/images/currency-gift-card.png',
};

const HERO_IMAGES: Record<string, string> = {
  'free-fire': '/images/free-fire-game.png',
  'freefire': '/images/free-fire-game.png',
  'pubg': '/images/pubg-game.png',
  'pubg-mobile': '/images/pubg-game.png',
  'crossfire': '/images/crossfire-game.png',
  'minecraft': '/images/minecraft.webp',
  'honor-of-kings': '/images/hok-main.webp',
  'hok': '/images/hok-main.webp',
  'valorant': '/images/VALORANT.jpg',
  'roblox': '/images/roblox.webp',
  'steam': '/images/Steam-Logo-White_4.webp',
  'xbox': '/images/xbox-live.webp',
  'xbox-live': '/images/xbox-live.webp',
  'playstation': '/images/ps-store.webp',
  'ps-store': '/images/ps-store.webp',
  'discord': '/images/dis-co.webp',
  'discord-nitro': '/images/dis-co.webp',
  'netflix': '/images/netflix_-_Home_1.webp',
  'google-play': '/images/gplay1-64c83ac2e830f.webp',
  'ea-play': '/images/ea-play-icon-1.webp',
  'yalla-ludo': '/images/yalla-ludo-2-67563efa1ab95.webp',
};

function CurrencyAmountIcon({ amount, gameSlug }: { amount: string; gameSlug: string }) {
  const bgColors: Record<string, string> = {
    'pubg-mobile': 'from-yellow-600 to-yellow-400',
    'pubg': 'from-yellow-600 to-yellow-400',
    'free-fire': 'from-blue-600 to-cyan-400',
    'freefire': 'from-blue-600 to-cyan-400',
    'call-of-duty-mobile': 'from-green-700 to-green-500',
    'crossfire': 'from-orange-600 to-red-500',
    'league-of-legends': 'from-blue-500 to-purple-600',
    'valorant': 'from-red-600 to-pink-500',
    'fortnite': 'from-purple-600 to-blue-600',
    'roblox': 'from-red-600 to-red-400',
    'default': 'from-gold-primary to-orange-500',
  };
  const bg = bgColors[gameSlug] || bgColors['default'];

  return (
    <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${bg} flex items-center justify-center shadow-lg`}>
      <span className="text-white font-black text-xs text-center leading-tight px-1">{amount}</span>
    </div>
  );
}

export default function GamePage() {
  const { slug } = useParams();
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const [playerId, setPlayerId] = useState('');
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">جاري التحميل...</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">اللعبة غير موجودة</h1>
          <Link href="/"><Button className="btn-gaming">الرئيسية</Button></Link>
        </div>
      </div>
    );
  }

  const gameSlug = (game as any).slug || '';
  const heroImage = HERO_IMAGES[gameSlug] || (game as any).image_url || game.image || '';
  const currencyImageUrl = CURRENCY_IMAGES[gameSlug] || null;

  const packagesList: any[] = Array.isArray((game as any).packagesList) ? (game as any).packagesList : [];
  const packagesArr: any[] = packagesList.length > 0
    ? packagesList
    : (Array.isArray((game as any).packages) ? (game as any).packages : []).map((p: any, i: number) => ({
        name: typeof p === 'string' ? p : p?.name || '',
        price: ((game as any).packagePrices || [])[i] ?? 0,
        discountPrice: ((game as any).packageDiscountPrices || [])[i] ?? null,
        image: null,
        bonus: null,
      }));

  const isOutOfStock = Number(game.stock) <= 0;

  const getPricing = (pkg: any, index: number) => {
    const base = Number(pkg.price || ((game as any).packagePrices || [])[index] || 0);
    const disc = pkg.discountPrice ?? ((game as any).packageDiscountPrices || [])[index] ?? null;
    const hasDisc = disc !== null && Number(disc) > 0 && Number(disc) < base;
    return {
      base,
      final: hasDisc ? Number(disc) : base,
      original: hasDisc ? base : null,
      pct: hasDisc ? Math.round((1 - Number(disc) / base) * 100) : 0,
    };
  };

  const formatEGP = (v: number) => `${v.toLocaleString('en-EG')} EGP`;

  const handleBuyNow = (index: number) => {
    setLocation(`/package/${slug}/${index}`);
  };

  const category = Array.isArray(categories)
    ? categories.find((c) => c.slug === game.category)
    : undefined;

  return (
    <>
      <SEO
        title={`شحن ${game.name} - متجر ضياء | Diaa Gaming Top Up`}
        description={`اشحن عملات ${game.name} بسهولة في متجر ضياء. خدمة شحن آمنة وسريعة في مصر.`}
        keywords={[`شحن ${game.name}`, game.name, 'ضياء', 'Diaa', 'شحن ألعاب']}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-6 pb-4">
          <Button
            onClick={() => setLocation("/")}
            variant="ghost"
            className="mb-4 hover:bg-white/5 text-muted-foreground hover:text-foreground rounded-xl"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {language === 'ar' ? 'رجوع' : 'Back'}
          </Button>
        </div>

        <div className="container mx-auto px-4 pb-8">
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              <div className="relative rounded-2xl overflow-hidden aspect-[4/3] bg-card border border-border/30 shadow-xl">
                <ImageWithFallback
                  src={heroImage}
                  alt={game.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                <div className="absolute top-3 left-3 flex flex-col gap-2">
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-bold border border-white/10">
                    <Zap className="w-3 h-3 text-yellow-400" />
                    Direct Top-up 🚀
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-bold border border-white/10">
                    <Clock className="w-3 h-3 text-green-400" />
                    Instant Delivery ⚡
                  </span>
                </div>
              </div>

              <div className="flex gap-3 mt-4">
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-card border border-border/30 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4 text-green-400 shrink-0" />
                  <span>{language === 'ar' ? 'دفع آمن 100%' : '100% Secure Payment'}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 p-3 rounded-xl bg-card border border-border/30 text-sm text-muted-foreground">
                  <Star className="w-4 h-4 text-gold-primary shrink-0" />
                  <span>{language === 'ar' ? 'أفضل الأسعار' : 'Best Prices'}</span>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.4, delay: 0.1 }}
              className="space-y-5"
            >
              {category && (
                <Link href={`/category/${category.slug}`}>
                  <span className="inline-flex items-center gap-1.5 text-xs text-gold-primary font-medium bg-gold-primary/10 px-3 py-1.5 rounded-full hover:bg-gold-primary/20 transition-colors border border-gold-primary/20 cursor-pointer">
                    {category.name}
                  </span>
                </Link>
              )}

              <h1 className="text-3xl md:text-4xl font-black text-foreground leading-tight">
                {game.name}
              </h1>

              <div
                className="text-muted-foreground text-sm leading-relaxed line-clamp-3 prose prose-sm max-w-none dark:prose-invert"
                dangerouslySetInnerHTML={{ __html: game.description }}
              />

              {isOutOfStock && (
                <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive text-sm font-medium">
                  ⚠️ {language === 'ar' ? 'نفذت الكمية حالياً' : 'Currently out of stock'}
                </div>
              )}

              <div className="p-4 rounded-xl bg-card border border-border/30">
                <label className="flex items-center gap-2 text-sm font-bold text-foreground mb-2">
                  {language === 'ar' ? 'Player ID' : 'Player ID'}
                  <span className="text-destructive">*</span>
                  <button className="text-muted-foreground hover:text-foreground">
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </label>
                <input
                  type="text"
                  value={playerId}
                  onChange={e => setPlayerId(e.target.value)}
                  placeholder={language === 'ar' ? 'أدخل Player ID الخاص بك' : 'Enter your Player ID'}
                  className="w-full bg-background border border-border rounded-lg px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-primary/60 focus:ring-1 focus:ring-gold-primary/30 transition"
                />
                <p className="text-xs text-muted-foreground mt-2">
                  {language === 'ar'
                    ? '⚠️ تأكد من إدخال الـ ID الصحيح قبل الشراء'
                    : '⚠️ Make sure to enter the correct ID before purchasing'}
                </p>
              </div>
            </motion.div>
          </div>

          {packagesArr.length > 0 && (
            <section className="mt-10">
              <h2 className="text-xl font-bold text-foreground mb-5 flex items-center gap-2">
                <span className="w-1.5 h-6 bg-gold-primary rounded-full inline-block" />
                {language === 'ar' ? 'اختر الباقة' : 'Select Package'}
                <span className="text-sm text-muted-foreground font-normal ml-2">
                  ({packagesArr.length} {language === 'ar' ? 'خيار' : 'options'})
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {packagesArr.map((pkg: any, index: number) => {
                  const pricing = getPricing(pkg, index);
                  const pkgName = pkg.name || pkg;
                  const bonus = pkg.bonus;
                  const isHot = index < 2 || pkg.hot_deal;
                  const isSelected = selectedPkg === index;
                  const pkgImage = pkg.image || currencyImageUrl || null;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      whileHover={{ y: -5, scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => !isOutOfStock && (setSelectedPkg(index), handleBuyNow(index))}
                      className={`relative cursor-pointer rounded-2xl border-2 transition-all duration-200 overflow-hidden
                        ${isOutOfStock ? 'opacity-40 cursor-not-allowed' : ''}
                        ${isSelected
                          ? 'border-gold-primary bg-gold-primary/10 shadow-xl shadow-gold-primary/25'
                          : 'border-border/40 bg-card hover:border-gold-primary/60 hover:bg-card/80 hover:shadow-lg'}
                      `}
                    >
                      {isHot && (
                        <div className="absolute top-2.5 left-2.5 z-10">
                          <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                            🔥 HOT
                          </span>
                        </div>
                      )}

                      {pricing.pct > 0 && (
                        <div className="absolute top-2.5 right-2.5 z-10">
                          <span className="bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                            -{pricing.pct}%
                          </span>
                        </div>
                      )}

                      <div className="p-5 flex flex-col items-center gap-3">
                        <div className="w-20 h-20 flex items-center justify-center">
                          {pkgImage ? (
                            <img
                              src={pkgImage}
                              alt={pkgName}
                              className="w-full h-full object-contain drop-shadow-xl"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.style.display = 'none';
                                const parent = target.parentElement;
                                if (parent) {
                                  parent.innerHTML = `<div style="width:80px;height:80px;border-radius:16px;background:linear-gradient(135deg,#D4AF37,#b8962e);display:flex;align-items:center;justify-content:center;"><span style="color:#000;font-weight:900;font-size:12px;text-align:center;padding:6px;">${pkgName}</span></div>`;
                                }
                              }}
                            />
                          ) : (
                            <CurrencyAmountIcon amount={pkgName} gameSlug={gameSlug} />
                          )}
                        </div>

                        <div className="text-center w-full">
                          <p className="text-sm font-bold text-foreground leading-tight mb-1.5">
                            {pkgName}
                          </p>
                          {bonus && (
                            <p className="text-xs font-bold text-gold-primary mb-1.5">
                              +{bonus} Bonus 🎁
                            </p>
                          )}
                          {pricing.original !== null && (
                            <p className="text-xs text-muted-foreground line-through mb-0.5">
                              {formatEGP(pricing.original)}
                            </p>
                          )}
                          <p className={`text-base font-black ${pricing.original !== null ? 'text-red-400' : 'text-foreground'}`}>
                            {formatEGP(pricing.final)}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {selectedPkg === null && !isOutOfStock && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-6"
                >
                  <p className="text-center text-muted-foreground text-sm mb-3">
                    {language === 'ar' ? 'اختر باقة من الأعلى للمتابعة' : 'Select a package above to continue'}
                  </p>
                </motion.div>
              )}
            </section>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
