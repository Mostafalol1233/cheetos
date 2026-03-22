import { useParams, useLocation, Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Zap, Star, ShieldCheck, Clock, HelpCircle, BookOpen, RefreshCw, FileText, Send } from "lucide-react";
import { motion } from "framer-motion";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";
import { useState, useEffect } from "react";
import { API_BASE_URL } from "@/lib/queryClient";

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
  'free-fire': '/images/freefire-Icon_1_1.webp',
  'freefire': '/images/freefire-Icon_1_1.webp',
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

type LangText = { ar: string; en: string };
type FAQItem = { q: LangText; a: LangText };

const GAME_FAQS: Record<string, FAQItem[]> = {
  'gift-cards': [
    {
      q: { ar: 'كيف أستلم الكود بعد الشراء؟', en: 'How do I receive the code after purchase?' },
      a: { ar: 'بعد تأكيد الدفع، هيتبعتلك كود الكرت على واتساب فورًا.', en: 'After payment is confirmed, the gift card code will be sent to you instantly via WhatsApp.' },
    },
    {
      q: { ar: 'هل الكروت أصلية؟', en: 'Are the gift cards genuine?' },
      a: { ar: 'نعم، جميع الكروت أصلية ومضمونة 100%.', en: 'Yes, all our gift cards are 100% genuine and guaranteed.' },
    },
    {
      q: { ar: 'كام بياخد التوصيل؟', en: 'How long does delivery take?' },
      a: { ar: 'التوصيل فوري بعد تأكيد الدفع، في الغالب أقل من 15 دقيقة.', en: 'Delivery is instant after payment confirmation, usually within 15 minutes.' },
    },
    {
      q: { ar: 'لو الكود مش شغال أعمل إيه؟', en: 'What if the code doesn\'t work?' },
      a: { ar: 'تواصل معنا على واتساب وهنحل المشكلة فورًا.', en: 'Contact us on WhatsApp and we will resolve it immediately.' },
    },
  ],
  'default': [
    {
      q: { ar: 'كيف يتم الشحن؟', en: 'How does the top-up work?' },
      a: { ar: 'بعد إتمام الدفع، يتم الشحن مباشرة على حسابك في اللعبة بأسرع وقت.', en: 'After completing payment, the top-up is applied directly to your game account as fast as possible.' },
    },
    {
      q: { ar: 'كام بياخد الشحن؟', en: 'How long does the top-up take?' },
      a: { ar: 'عادةً خلال 5-15 دقيقة بعد تأكيد الدفع.', en: 'Usually within 5–15 minutes after payment is confirmed.' },
    },
    {
      q: { ar: 'هل الدفع آمن؟', en: 'Is the payment secure?' },
      a: { ar: 'نعم، جميع معاملاتنا مؤمّنة وخاضعة للرقابة.', en: 'Yes, all our transactions are secure and monitored.' },
    },
    {
      q: { ar: 'لو عندي مشكلة بعد الشحن؟', en: 'What if I have an issue after the top-up?' },
      a: { ar: 'تواصل مع الدعم على واتساب وهنساعدك فورًا.', en: 'Contact our support on WhatsApp and we will help you right away.' },
    },
  ],
};

const REDEEM_STEPS: Record<string, LangText[]> = {
  'steam-wallet': [
    { ar: 'افتح تطبيق Steam على جهازك', en: 'Open the Steam app on your device' },
    { ar: 'اضغط على اسمك في الأعلى يمين ← "استرداد كود Steam"', en: 'Click your name at the top right → "Redeem a Steam Wallet Code"' },
    { ar: 'أدخل الكود المكوّن من 15 خانة', en: 'Enter the 15-character code' },
    { ar: 'هيتضاف الرصيد لمحفظتك فورًا', en: 'The balance will be added to your wallet immediately' },
  ],
  'google-play': [
    { ar: 'افتح متجر Google Play على أندرويد', en: 'Open the Google Play Store on Android' },
    { ar: 'اضغط على صورتك ← الدفع والاشتراكات', en: 'Tap your profile picture → Payments & subscriptions' },
    { ar: 'اختر "استرداد رمز الهدية"', en: 'Select "Redeem gift code"' },
    { ar: 'أدخل الكود وهيتضاف الرصيد فورًا', en: 'Enter the code and the balance will be added instantly' },
  ],
  'itunes-app-store': [
    { ar: 'افتح App Store على iPhone أو iPad', en: 'Open the App Store on your iPhone or iPad' },
    { ar: 'اضغط على صورتك في الأعلى', en: 'Tap your profile picture at the top' },
    { ar: 'اختر "Redeem Gift Card or Code"', en: 'Select "Redeem Gift Card or Code"' },
    { ar: 'أدخل الكود وهيتضاف لحسابك', en: 'Enter the code and it will be added to your account' },
  ],
  'playstation-store': [
    { ar: 'افتح PlayStation Store على جهازك', en: 'Open the PlayStation Store on your device' },
    { ar: 'اضغط على ... ← Redeem Codes', en: 'Tap the ··· menu → Redeem Codes' },
    { ar: 'أدخل كود الـ 12 خانة', en: 'Enter the 12-character code' },
    { ar: 'هيتضاف الرصيد لمحفظة PSN فورًا', en: 'The balance will be added to your PSN wallet immediately' },
  ],
  'xbox-gift-card': [
    { ar: 'ادخل على account.microsoft.com', en: 'Go to account.microsoft.com' },
    { ar: 'اختر "Redeem a code"', en: 'Select "Redeem a code"' },
    { ar: 'أدخل كود الـ 25 خانة', en: 'Enter the 25-character code' },
    { ar: 'هيتضاف الرصيد لحساب Xbox فورًا', en: 'The balance will be added to your Xbox account immediately' },
  ],
  'amazon-gift-card': [
    { ar: 'ادخل على amazon.com وتسجّل الدخول', en: 'Go to amazon.com and sign in' },
    { ar: 'اختر "Gift Cards" ← "Redeem a Gift Card"', en: 'Select "Gift Cards" → "Redeem a Gift Card"' },
    { ar: 'أدخل الكود', en: 'Enter the code' },
    { ar: 'هيتضاف الرصيد لمحفظة Amazon فورًا', en: 'The balance will be added to your Amazon wallet immediately' },
  ],
  'netflix-gift-card': [
    { ar: 'ادخل على netflix.com/redeem', en: 'Go to netflix.com/redeem' },
    { ar: 'سجّل الدخول بحسابك أو أنشئ حساب جديد', en: 'Sign in to your account or create a new one' },
    { ar: 'أدخل كود الكرت', en: 'Enter the gift card code' },
    { ar: 'هيتفعّل الاشتراك تلقائيًا', en: 'Your subscription will be activated automatically' },
  ],
  'spotify-gift-card': [
    { ar: 'ادخل على spotify.com/redeem', en: 'Go to spotify.com/redeem' },
    { ar: 'سجّل الدخول بحساب Spotify', en: 'Sign in to your Spotify account' },
    { ar: 'أدخل كود الكرت', en: 'Enter the gift card code' },
    { ar: 'هيتفعّل Premium فورًا', en: 'Spotify Premium will activate immediately' },
  ],
  'discord-nitro': [
    { ar: 'أكمل الدفع وأرسل الإيصال على واتساب', en: 'Complete payment and send the receipt on WhatsApp' },
    { ar: 'هنبعتلك لينك تفعيل Discord Nitro', en: 'We will send you a Discord Nitro activation link' },
    { ar: 'افتح الرابط وسجّل الدخول بحساب Discord', en: 'Open the link and sign in to your Discord account' },
    { ar: 'هيتفعّل Nitro على حسابك فورًا', en: 'Nitro will be activated on your account immediately' },
  ],
  'default-game': [
    { ar: 'أكمل عملية الشراء وادفع', en: 'Complete your purchase and pay' },
    { ar: 'أرسل لنا إيصال الدفع على واتساب', en: 'Send us the payment receipt on WhatsApp' },
    { ar: 'أرسل Player ID الخاص بك في اللعبة', en: 'Send your in-game Player ID' },
    { ar: 'هيتم الشحن خلال 5-15 دقيقة', en: 'Top-up will be completed within 5–15 minutes' },
  ],
};

export default function GamePage() {
  const { slug } = useParams();
  const { language } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedPkg, setSelectedPkg] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'description' | 'faq' | 'redeem' | 'terms'>('description');
  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewStats, setReviewStats] = useState<any>(null);
  const [reviewForm, setReviewForm] = useState({ user_name: '', user_email: '', rating: 0, comment: '' });
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    const gameSlug = (game as any)?.slug || '';
    if (!gameSlug) return;
    fetch(`${API_BASE_URL}/api/reviews/game/${gameSlug}`)
      .then(r => r.json())
      .then(data => {
        setReviews(data.reviews || []);
        setReviewStats(data.stats || null);
      })
      .catch(() => {});
  }, [(game as any)?.slug]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-gold-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground">{language === 'ar' ? 'جاري التحميل...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">
            {language === 'ar' ? 'اللعبة غير موجودة' : 'Game not found'}
          </h1>
          <Link href="/"><Button className="btn-gaming">{language === 'ar' ? 'الرئيسية' : 'Home'}</Button></Link>
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

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewForm.user_name || reviewForm.rating === 0) {
      setReviewError(language === 'ar' ? 'الاسم والتقييم مطلوبان' : 'Name and rating are required');
      return;
    }
    setReviewSubmitting(true);
    setReviewError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ game_slug: gameSlug, ...reviewForm })
      });
      if (!res.ok) throw new Error('Failed to submit review');
      setReviewSubmitted(true);
      setReviewForm({ user_name: '', user_email: '', rating: 0, comment: '' });
      const data = await fetch(`${API_BASE_URL}/api/reviews/game/${gameSlug}`).then(r => r.json());
      setReviews(data.reviews || []);
      setReviewStats(data.stats || null);
    } catch {
      setReviewError(language === 'ar' ? 'فشل إرسال التقييم، حاول مرة أخرى' : 'Failed to submit review. Please try again.');
    } finally {
      setReviewSubmitting(false);
    }
  };

  const tabs = [
    { id: 'description' as const, label: language === 'ar' ? 'وصف المنتج' : 'Description', icon: BookOpen },
    { id: 'faq' as const, label: language === 'ar' ? 'الأسئلة الشائعة' : 'FAQs', icon: HelpCircle },
    { id: 'redeem' as const, label: language === 'ar' ? 'طريقة الاستخدام' : 'How to redeem?', icon: RefreshCw },
    { id: 'terms' as const, label: language === 'ar' ? 'الشروط والأحكام' : 'Terms & Conditions', icon: FileText },
  ];

  return (
    <>
      <SEO
        title={language === 'ar'
          ? `${isGiftCard ? 'كرت' : 'شحن'} ${game.name} - متجر ضياء | Diaa Gaming Store`
          : `${isGiftCard ? 'Buy' : 'Top Up'} ${game.name} - Diaa Gaming Store Egypt`}
        description={language === 'ar'
          ? `${isGiftCard ? 'اشتري كرت' : 'اشحن عملات'} ${game.name} بسهولة في متجر ضياء. خدمة آمنة وسريعة في مصر.`
          : `${isGiftCard ? 'Buy' : 'Top up'} ${game.name} easily at Diaa Store. Secure and fast service in Egypt.`}
        keywords={[game.name, 'Diaa Store', 'ضياء', 'gaming top up Egypt', 'شحن ألعاب']}
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
                            {currencyImageUrl ? (
                              <img
                                src={currencyImageUrl}
                                alt={pkgName}
                                className="w-full h-full object-contain drop-shadow-xl"
                              />
                            ) : pkgImage ? (
                              <img
                                src={pkgImage}
                                alt={pkgName}
                                className="w-full h-full object-contain drop-shadow-xl"
                                onError={(e) => {
                                  const target = e.target as HTMLImageElement;
                                  target.style.display = 'none';
                                  const parent = target.parentElement;
                                  if (parent) {
                                    parent.innerHTML = `<div style="width:96px;height:96px;border-radius:20px;background:linear-gradient(135deg,#D4AF37,#b8962e);display:flex;align-items:center;justify-content:center;"><span style="color:#000;font-weight:900;font-size:13px;text-align:center;padding:8px;">${pkgName}</span></div>`;
                                  }
                                }}
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
                          <p className="font-semibold text-foreground text-sm mb-1">{language === 'ar' ? faq.q.ar : faq.q.en}</p>
                          <p className="text-muted-foreground text-sm leading-relaxed">{language === 'ar' ? faq.a.ar : faq.a.en}</p>
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
                          <span className="text-foreground text-sm leading-relaxed pt-0.5">
                            {language === 'ar' ? step.ar : step.en}
                          </span>
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

          {/* Reviews & Ratings Section */}
          <section className="mt-12 border-t border-border/30 pt-8">
            <h2 className="text-xl font-bold text-foreground mb-6 flex items-center gap-2">
              <span className="w-1.5 h-6 bg-gold-primary rounded-full inline-block" />
              <Star className="w-5 h-5 text-gold-primary fill-gold-primary" />
              {language === 'ar' ? 'تقييمات العملاء' : 'Customer Reviews'}
              {reviewStats && Number(reviewStats.total) > 0 && (
                <span className="text-sm text-muted-foreground font-normal">
                  ({reviewStats.total} {language === 'ar' ? 'تقييم' : 'reviews'})
                </span>
              )}
            </h2>

            {reviewStats && Number(reviewStats.total) > 0 && (
              <div className="flex items-center gap-4 mb-6 p-4 bg-card border border-border/30 rounded-xl">
                <div className="text-center">
                  <p className="text-4xl font-black text-gold-primary">{reviewStats.avg_rating || '0'}</p>
                  <div className="flex gap-0.5 justify-center mt-1">
                    {[1,2,3,4,5].map(s => (
                      <Star key={s} className={`w-4 h-4 ${s <= Math.round(Number(reviewStats.avg_rating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{reviewStats.total} {language === 'ar' ? 'تقييم' : 'reviews'}</p>
                </div>
                <div className="flex-1 space-y-1">
                  {[5,4,3,2,1].map(star => (
                    <div key={star} className="flex items-center gap-2">
                      <span className="text-xs w-2 text-muted-foreground">{star}</span>
                      <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-yellow-400 rounded-full"
                          style={{ width: `${Number(reviewStats.total) > 0 ? (Number(reviewStats[`${star === 5 ? 'five' : star === 4 ? 'four' : star === 3 ? 'three' : star === 2 ? 'two' : 'one'}_star`]) / Number(reviewStats.total)) * 100 : 0}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="space-y-4">
                {reviews.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground bg-card border border-border/30 rounded-xl">
                    <Star className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                    <p>{language === 'ar' ? 'لا توجد تقييمات بعد. كن أول من يقيّم!' : 'No reviews yet. Be the first to review!'}</p>
                  </div>
                ) : (
                  reviews.map((review) => (
                    <div key={review.id} className="p-4 bg-card border border-border/30 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-foreground text-sm">{review.user_name}</span>
                        <div className="flex gap-0.5">
                          {[1,2,3,4,5].map(s => (
                            <Star key={s} className={`w-3.5 h-3.5 ${s <= review.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-600'}`} />
                          ))}
                        </div>
                      </div>
                      {review.comment && <p className="text-sm text-muted-foreground leading-relaxed">{review.comment}</p>}
                      <p className="text-xs text-muted-foreground/60">
                        {new Date(review.created_at).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="bg-card border border-border/30 rounded-xl p-5">
                <h3 className="font-bold text-foreground mb-4">
                  {language === 'ar' ? 'اكتب تقييمك' : 'Write a Review'}
                </h3>
                {reviewSubmitted ? (
                  <div className="text-center py-6 space-y-2">
                    <div className="text-3xl">⭐</div>
                    <p className="font-semibold text-green-400">
                      {language === 'ar' ? 'شكراً على تقييمك!' : 'Thank you for your review!'}
                    </p>
                    <button
                      onClick={() => setReviewSubmitted(false)}
                      className="text-sm text-muted-foreground hover:text-foreground underline"
                    >
                      {language === 'ar' ? 'إضافة تقييم آخر' : 'Write another review'}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmitReview} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'اختر تقييمك *' : 'Your Rating *'}
                      </label>
                      <div className="flex gap-1">
                        {[1,2,3,4,5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                            className="p-1"
                          >
                            <Star className={`w-7 h-7 transition-colors ${star <= reviewForm.rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-500 hover:text-yellow-300'}`} />
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'اسمك *' : 'Your Name *'}
                      </label>
                      <input
                        type="text"
                        value={reviewForm.user_name}
                        onChange={e => setReviewForm(f => ({ ...f, user_name: e.target.value }))}
                        placeholder={language === 'ar' ? 'مثال: أحمد محمد' : 'e.g. John Smith'}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-gold-primary"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'الإيميل (اختياري)' : 'Email (Optional)'}
                      </label>
                      <input
                        type="email"
                        value={reviewForm.user_email}
                        onChange={e => setReviewForm(f => ({ ...f, user_email: e.target.value }))}
                        placeholder="name@example.com"
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-gold-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        {language === 'ar' ? 'تعليقك (اختياري)' : 'Your Comment (Optional)'}
                      </label>
                      <textarea
                        value={reviewForm.comment}
                        onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                        placeholder={language === 'ar' ? 'شاركنا تجربتك...' : 'Share your experience...'}
                        rows={3}
                        className="w-full px-3 py-2 rounded-lg bg-background border border-border text-foreground text-sm focus:outline-none focus:border-gold-primary resize-none"
                      />
                    </div>
                    {reviewError && <p className="text-sm text-destructive">{reviewError}</p>}
                    <button
                      type="submit"
                      disabled={reviewSubmitting || reviewForm.rating === 0 || !reviewForm.user_name}
                      className="w-full flex items-center justify-center gap-2 bg-gold-primary text-black font-bold py-2.5 rounded-lg hover:bg-gold-primary/80 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                      {reviewSubmitting ? (
                        <><span className="animate-spin">⏳</span> {language === 'ar' ? 'جارٍ الإرسال...' : 'Submitting...'}</>
                      ) : (
                        <><Send className="w-4 h-4" /> {language === 'ar' ? 'إرسال التقييم' : 'Submit Review'}</>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </div>
          </section>
        </div>

        <Footer />
      </div>
    </>
  );
}
