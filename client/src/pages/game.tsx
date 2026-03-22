import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Star, ShieldCheck, Clock, HelpCircle, BookOpen, RefreshCw, FileText } from "lucide-react";
import { motion } from "framer-motion";
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
  'valorant': '/images/currency-valorant-vp.png',
  'valornt': '/images/currency-valorant-vp.png',
  'fortnite': '/images/currency-fortnite-vbucks.png',
  'roblox': '/images/currency-roblox-robux.png',
  'honor-of-kings': '/images/currency-hok-tokens.png',
  'hok': '/images/currency-hok-tokens.png',
  'mobile-legends': '/images/currency-mlbb-diamonds.png',
  'mobile-legends-bang-bang': '/images/currency-mlbb-diamonds.png',
  'mlbb': '/images/currency-mlbb-diamonds.png',
  'tiktok': '/images/currency-tiktok-coins.png',
  'tiktok-coins': '/images/currency-tiktok-coins.png',
  'minecraft': '/images/currency-minecraft-coins.png',
  'yalla-ludo': '/images/currency-yalla-diamonds.png',
  'yalla': '/images/currency-yalla-diamonds.png',
  'wolf-team': '/images/currency-wolfteam-wcoin.png',
  'wolfteam': '/images/currency-wolfteam-wcoin.png',
  'e-football': '/images/currency-efootball-coin.png',
  'efootball': '/images/currency-efootball-coin.png',
  'clash-of-clans': '/images/currency-coc-gems.svg',
  'coc': '/images/currency-coc-gems.svg',
  'apex-legends': '/images/currency-apex-coins.svg',
  'apex': '/images/currency-apex-coins.svg',
  'genshin-impact': '/images/currency-genshin-primogems.svg',
  'genshin': '/images/currency-genshin-primogems.svg',
  'google-play': '/images/giftcard-google-play.svg',
  'steam': '/images/giftcard-steam.svg',
  'steam-wallet': '/images/giftcard-steam.svg',
  'playstation': '/images/giftcard-psn.svg',
  'playstation-store': '/images/giftcard-psn.svg',
  'ps-store': '/images/giftcard-psn.svg',
  'xbox': '/images/giftcard-xbox.svg',
  'xbox-gift-card': '/images/giftcard-xbox.svg',
  'xbox-live': '/images/giftcard-xbox.svg',
  'discord-nitro': '/images/currency-gift-card.png',
  'discord': '/images/currency-gift-card.png',
  'netflix': '/images/giftcard-netflix.svg',
  'netflix-gift-card': '/images/giftcard-netflix.svg',
  'ea-play': '/images/currency-gift-card.png',
  'itunes': '/images/giftcard-itunes.svg',
  'itunes-app-store': '/images/giftcard-itunes.svg',
  'app-store': '/images/giftcard-itunes.svg',
  'amazon': '/images/giftcard-amazon.svg',
  'amazon-gift-card': '/images/giftcard-amazon.svg',
  'spotify': '/images/giftcard-spotify.svg',
  'spotify-gift-card': '/images/giftcard-spotify.svg',
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

const GAME_FAQS: Record<string, Array<{ q: string; a: string }>> = {
  'gift-cards': [
    { q: 'كيف أستلم الكود بعد الشراء؟', a: 'بعد تأكيد الدفع، هيتبعتلك كود الكرت على واتساب فورًا.' },
    { q: 'هل الكروت أصلية؟', a: 'نعم، جميع الكروت أصلية ومضمونة 100%.' },
    { q: 'كام بياخد التوصيل؟', a: 'التوصيل فوري بعد تأكيد الدفع، في الغالب أقل من 15 دقيقة.' },
    { q: 'لو الكود مش شغال أعمل إيه؟', a: 'تواصل معنا على واتساب وهنحل المشكلة فورًا.' },
  ],
  'default': [
    { q: 'كيف يتم الشحن؟', a: 'بعد إتمام الدفع، يتم الشحن مباشرة على حسابك في اللعبة بأسرع وقت.' },
    { q: 'كام بياخد الشحن؟', a: 'عادةً خلال 5-15 دقيقة بعد تأكيد الدفع.' },
    { q: 'هل الدفع آمن؟', a: 'نعم، جميع معاملاتنا مؤمّنة وخاضعة للرقابة.' },
    { q: 'لو عندي مشكلة بعد الشحن؟', a: 'تواصل مع الدعم على واتساب وهنساعدك فورًا.' },
  ],
};

const REDEEM_STEPS: Record<string, Array<string>> = {
  'steam-wallet': [
    'افتح تطبيق Steam على جهازك',
    'اضغط على اسمك في الأعلى يمين → "استرداد كود Steam"',
    'أدخل الكود المكوّن من 15 خانة',
    'هيتضاف الرصيد لمحفظتك فورًا',
  ],
  'google-play': [
    'افتح متجر Google Play على أندرويد',
    'اضغط على صورتك → الدفع والاشتراكات',
    'اختر "استرداد رمز الهدية"',
    'أدخل الكود وهيتضاف الرصيد فورًا',
  ],
  'itunes-app-store': [
    'افتح App Store على iPhone أو iPad',
    'اضغط على صورتك في الأعلى',
    'اختر "Redeem Gift Card or Code"',
    'أدخل الكود وهيتضاف لحسابك',
  ],
  'playstation-store': [
    'افتح PlayStation Store على جهازك',
    'اضغط على ... → Redeem Codes',
    'أدخل كود الـ 12 خانة',
    'هيتضاف الرصيد لمحفظة PSN فورًا',
  ],
  'xbox-gift-card': [
    'ادخل على account.microsoft.com',
    'اختر "Redeem a code"',
    'أدخل كود الـ 25 خانة',
    'هيتضاف الرصيد لحساب Xbox فورًا',
  ],
  'amazon-gift-card': [
    'ادخل على amazon.com وتسجّل الدخول',
    'اختر "Gift Cards" → "Redeem a Gift Card"',
    'أدخل الكود',
    'هيتضاف الرصيد لمحفظة Amazon فورًا',
  ],
  'netflix-gift-card': [
    'ادخل على netflix.com/redeem',
    'سجّل الدخول بحسابك أو أنشئ حساب جديد',
    'أدخل كود الكرت',
    'هيتفعّل الاشتراك تلقائيًا',
  ],
  'spotify-gift-card': [
    'ادخل على spotify.com/redeem',
    'سجّل الدخول بحساب Spotify',
    'أدخل كود الكرت',
    'هيتفعّل Premium فورًا',
  ],
  'default-game': [
    'أكمل عملية الشراء وادفع',
    'أرسل لنا إيصال الدفع على واتساب',
    'أرسل Player ID الخاص بك في اللعبة',
    'هيتم الشحن خلال 5-15 دقيقة',
  ],
};

export default function GamePage() {
  const { slug } = useParams();
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'faq' | 'redeem' | 'terms'>('description');

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
  const isGiftCard = game.category === 'gift-cards';

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

  const faqs = isGiftCard ? GAME_FAQS['gift-cards'] : GAME_FAQS['default'];
  const redeemSteps = REDEEM_STEPS[gameSlug] || (isGiftCard ? [] : REDEEM_STEPS['default-game']);

  const tabs = [
    { id: 'description' as const, label: language === 'ar' ? 'وصف المنتج' : 'Description', icon: BookOpen },
    { id: 'faq' as const, label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs', icon: HelpCircle },
    { id: 'redeem' as const, label: language === 'ar' ? 'طريقة الاستخدام' : 'How to redeem?', icon: RefreshCw },
    { id: 'terms' as const, label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', icon: FileText },
  ];

  return (
    <>
      <SEO
        title={`${isGiftCard ? 'كرت' : 'شحن'} ${game.name} - متجر ضياء | Diaa Gaming Store`}
        description={`${isGiftCard ? 'اشتري كرت' : 'اشحن عملات'} ${game.name} بسهولة في متجر ضياء. خدمة آمنة وسريعة في مصر.`}
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

        <div className="container mx-auto px-3 sm:px-4 pb-8">
          <div className="grid lg:grid-cols-2 gap-5 sm:gap-8 items-start">
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
                    {isGiftCard ? 'Gift Card Code 🎁' : 'Direct Top-up 🚀'}
                  </span>
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/70 backdrop-blur-sm text-white text-xs font-bold border border-white/10">
                    <Clock className="w-3 h-3 text-green-400" />
                    {isGiftCard ? 'Code via WhatsApp ⚡' : 'Instant Delivery ⚡'}
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

              {isGiftCard && (
                <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/30">
                  <div className="flex items-start gap-3">
                    <span className="text-2xl mt-0.5">🎁</span>
                    <div>
                      <p className="text-sm font-bold text-green-400 mb-1">
                        {language === 'ar' ? 'طريقة استلام الكود' : 'How to receive your code'}
                      </p>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        {language === 'ar'
                          ? 'بعد إتمام الدفع، هيتبعتلك كود الكرت على واتساب فورًا. تأكد من إدخال رقم واتسابك الصح في صفحة الدفع.'
                          : 'After payment is confirmed, your gift card code will be sent to you via WhatsApp instantly.'}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">✅ {language === 'ar' ? 'توصيل فوري' : 'Instant delivery'}</span>
                        <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full font-medium">🔒 {language === 'ar' ? 'كود أصلي 100%' : '100% Authentic'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="p-4 rounded-xl bg-card border border-border/30">
                <p className="text-sm text-muted-foreground flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gold-primary" />
                  {isGiftCard
                    ? (language === 'ar' ? 'الكود هيوصلك على واتساب بعد الدفع مباشرة' : 'Code sent via WhatsApp right after payment')
                    : (language === 'ar' ? 'الشحن فوري على حسابك بعد تأكيد الدفع' : 'Top-up goes directly to your account after payment')}
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

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
                {packagesArr.map((pkg: any, index: number) => {
                  const pricing = getPricing(pkg, index);
                  const pkgName = pkg.name || pkg;
                  const bonus = pkg.bonus;
                  const isHot = index < 2 || pkg.hot_deal;
                  const isSelected = selectedPkg === index;
                  const pkgImage = pkg.image || null;

                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.04 }}
                      whileHover={{ y: -6, scale: 1.03 }}
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
                        <div className="absolute top-3 left-3 z-10">
                          <span className="bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full uppercase tracking-wide shadow-md">
                            🔥 HOT
                          </span>
                        </div>
                      )}

                      {pricing.pct > 0 && (
                        <div className="absolute top-3 right-3 z-10">
                          <span className="bg-red-600 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md">
                            -{pricing.pct}%
                          </span>
                        </div>
                      )}

                      <div className="p-4 sm:p-5 flex flex-col items-center gap-3">
                        <div className="relative flex items-center justify-center">
                          <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center">
                            {pkgImage ? (
                              <img
                                src={pkgImage}
                                alt={pkgName}
                                className="w-full h-full object-contain drop-shadow-xl"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent && currencyImageUrl) {
                                    parent.innerHTML = `<img src="${currencyImageUrl}" alt="${pkgName}" style="width:100%;height:100%;object-fit:contain;filter:drop-shadow(0 4px 12px rgba(0,0,0,0.5));" />`;
                                  } else if (parent) {
                                    parent.innerHTML = `<div style="width:96px;height:96px;border-radius:20px;background:linear-gradient(135deg,#D4AF37,#b8962e);display:flex;align-items:center;justify-content:center;"><span style="color:#000;font-weight:900;font-size:13px;text-align:center;padding:8px;">${pkgName}</span></div>`;
                                  }
                                }}
                              />
                            ) : currencyImageUrl ? (
                              <img
                                src={currencyImageUrl}
                                alt={pkgName}
                                className="w-full h-full object-contain drop-shadow-xl"
                              />
                            ) : (
                              <CurrencyAmountIcon amount={pkgName} gameSlug={gameSlug} />
                            )}
                          </div>
                        </div>

                        <div className="text-center w-full space-y-1.5">
                          <p className="text-sm sm:text-base font-bold text-foreground leading-tight">
                            {pkgName}
                          </p>
                          {bonus && (
                            <p className="text-xs sm:text-sm font-bold text-gold-primary">
                              +{bonus} Bonus 🎁
                            </p>
                          )}
                          {pricing.original !== null && (
                            <p className="text-xs sm:text-sm text-muted-foreground line-through">
                              {formatEGP(pricing.original)}
                            </p>
                          )}
                          <p className={`text-lg sm:text-xl font-black ${pricing.original !== null ? 'text-red-400' : 'text-foreground'}`}>
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

          {/* Info Tabs Section */}
          <section className="mt-12 border-t border-border/30 pt-8">
            {/* Tab Buttons */}
            <div className="flex flex-wrap gap-2 mb-6">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all duration-200 border
                      ${isActive
                        ? 'bg-gold-primary text-black border-gold-primary shadow-md'
                        : 'bg-card text-muted-foreground border-border/40 hover:border-gold-primary/50 hover:text-foreground'
                      }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Tab Content */}
            <div className="bg-card border border-border/30 rounded-2xl p-6">
              {activeTab === 'description' && (
                <div
                  className="prose prose-sm max-w-none dark:prose-invert text-foreground leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: game.description || (language === 'ar' ? 'لا يوجد وصف متاح.' : 'No description available.') }}
                />
              )}

              {activeTab === 'faq' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {language === 'ar' ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
                  </h3>
                  {faqs.map((faq, i) => (
                    <div key={i} className="border border-border/30 rounded-xl overflow-hidden">
                      <div className="flex items-start gap-3 p-4">
                        <span className="w-6 h-6 rounded-full bg-gold-primary/20 text-gold-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                          {i + 1}
                        </span>
                        <div>
                          <p className="font-semibold text-foreground text-sm mb-1">{faq.q}</p>
                          <p className="text-muted-foreground text-sm leading-relaxed">{faq.a}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === 'redeem' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {language === 'ar' ? 'طريقة الاستخدام' : 'How to Redeem'}
                  </h3>
                  {redeemSteps.length > 0 ? (
                    <ol className="space-y-3">
                      {redeemSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3">
                          <span className="w-7 h-7 rounded-full bg-gold-primary text-black text-sm font-black flex items-center justify-center shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-foreground text-sm leading-relaxed pt-0.5">{step}</span>
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p className="text-muted-foreground text-sm">
                      {language === 'ar'
                        ? 'تواصل معنا على واتساب لمعرفة طريقة الاستخدام.'
                        : 'Contact us on WhatsApp for redemption instructions.'}
                    </p>
                  )}
                </div>
              )}

              {activeTab === 'terms' && (
                <div className="space-y-4 text-sm text-muted-foreground leading-relaxed">
                  <h3 className="text-lg font-bold text-foreground mb-4">
                    {language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions'}
                  </h3>
                  <ul className="space-y-3">
                    {(language === 'ar' ? [
                      'جميع المبيعات نهائية وغير قابلة للاسترداد بعد إرسال الكود أو تنفيذ الشحن.',
                      'يجب التأكد من صحة بيانات الحساب (Player ID أو الإيميل) قبل إتمام الشراء.',
                      'لن نتحمل مسؤولية الأموال المفقودة بسبب بيانات خاطئة.',
                      'في حالة وجود مشكلة، يجب التواصل معنا خلال 24 ساعة من الشراء.',
                      'نحتفظ بالحق في رفض أي طلب يبدو مشبوهاً أو احتيالياً.',
                      'الأسعار قابلة للتغيير دون إشعار مسبق.',
                    ] : [
                      'All sales are final and non-refundable once the code has been sent or top-up executed.',
                      'Ensure your account details (Player ID or email) are correct before purchase.',
                      'We are not responsible for funds lost due to incorrect information.',
                      'Any issues must be reported within 24 hours of purchase.',
                      'We reserve the right to refuse any suspicious or fraudulent orders.',
                      'Prices are subject to change without prior notice.',
                    ]).map((term, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-gold-primary mt-0.5">•</span>
                        <span>{term}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
