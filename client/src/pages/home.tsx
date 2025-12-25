import { useState, useEffect } from "react";
import { Gamepad2, Zap, Headphones, Shield, Tag, Flame } from "lucide-react";
import { SiTelegram, SiTiktok, SiYoutube, SiFacebook, SiWhatsapp } from "react-icons/si";

import { ShoppingCategories } from "@/components/shopping-categories";
import { PopularGames } from "@/components/popular-games";

import PaymentMethods from "@/components/payment-methods";

import { Footer } from "@/components/footer";
import { useTranslation } from "@/lib/translation";

export default function Home() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { t } = useTranslation();
  const [daysLeft, setDaysLeft] = useState<number>(() => {
    const target = new Date('2026-01-01T00:00:00Z').getTime();
    const now = Date.now();
    return Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
  });
  const [pulseKey, setPulseKey] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      const target = new Date('2026-01-01T00:00:00Z').getTime();
      const now = Date.now();
      const newDays = Math.max(0, Math.ceil((target - now) / (1000 * 60 * 60 * 24)));
      if (newDays !== daysLeft) {
        setDaysLeft(newDays);
        setPulseKey((k) => k + 1);
      }
    }, 60 * 1000);
    return () => clearInterval(interval);
  }, [daysLeft]);

  const shareCountdown = async () => {
    const text = `${daysLeft} days left until 2026! Join me on Diaa Eldeen 🎮`;
    const url = window.location.origin;
    if ((navigator as any).share) {
      try { await (navigator as any).share({ title: 'Countdown to 2026', text, url }); } catch {}
      return;
    }
    const twitter = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`;
    window.open(twitter, '_blank');
  };

  return (
    <div className="min-h-screen text-foreground font-gaming overflow-x-hidden custom-cursor bg-gradient-to-b from-darker-bg dark:via-gray-900 dark:to-black via-gray-50 to-white animate-fade-in">

      {/* Hero Section */}
      <section className="relative w-full h-[500px] flex items-center justify-center overflow-hidden">
        {/* Background Image/Gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-darker-bg dark:via-purple-900/40 dark:to-darker-bg via-blue-50 to-purple-50 z-0"></div>
        <div className="absolute inset-0 bg-[url('/attached_assets/large-image-logo.png')] bg-cover bg-center opacity-20 dark:opacity-20 mix-blend-overlay animate-pulse"></div>
        
        {/* Content */}
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-gold-primary via-gray-900 dark:via-white to-neon-pink mb-6 drop-shadow-[0_0_15px_rgba(255,204,51,0.5)] animate-fade-in">
            {t('hero_title')}
          </h1>
          <p className="text-xl md:text-2xl text-gray-700 dark:text-gray-300 mb-8 font-light tracking-wide animate-fade-in animation-delay-500">
            {t('hero_subtitle')}
          </p>
          <div className="flex justify-center gap-4 animate-fade-in animation-delay-1000">
            <button 
              onClick={() => document.getElementById('categories')?.scrollIntoView({ behavior: 'smooth' })}
              className="px-8 py-3 bg-gradient-to-r from-gold-primary to-gold-secondary text-black font-bold rounded-full hover:scale-105 transition-transform shadow-[0_0_20px_rgba(255,204,51,0.4)]"
            >
              {t('shop_now')}
            </button>
            <button 
              onClick={() => window.location.href='/games'}
              className="px-8 py-3 border border-neon-pink/50 text-neon-pink font-bold rounded-full hover:bg-neon-pink/10 transition-colors backdrop-blur-sm"
            >
              {t('view_all_games')}
            </button>
          </div>
        </div>

        {/* Decorative Particles */}
        <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-gold-primary rounded-full animate-float"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-neon-pink rounded-full animate-float animation-delay-1000"></div>
      </section>

      {/* Countdown to 2026 */}
      <section className="container mx-auto px-4 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6 bg-card/50 border border-gold-primary/30 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <Flame className="w-10 h-10 text-neon-pink animate-twinkle" />
            <div>
              <div className="text-2xl md:text-3xl font-bold">
                <span key={pulseKey} className="inline-block animate-fade-in">{daysLeft}</span> days left until 2026
              </div>
              <p className="text-muted-foreground text-sm">Stay tuned for New Year offers and friend collaborations.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={shareCountdown}
              className="px-4 py-2 rounded-full bg-gradient-to-r from-gold-primary to-neon-pink text-black font-semibold hover:scale-105 transition-transform"
            >
              Share with a friend
            </button>
            <a
              href="#"
              onClick={(e) => { e.preventDefault(); shareCountdown(); }}
              className="text-neon-pink underline-offset-4 hover:underline"
            >Invite now</a>
          </div>
        </div>
      </section>

      {/* Shopping Categories */}
      <div id="categories">
        <ShoppingCategories />
      </div>

      {/* Most Popular Games */}
      <PopularGames />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float">
              <Zap className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('features_fast_delivery_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-500">
              <Headphones className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Online Support</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('features_online_support_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1000">
              <Shield className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Secure Payment</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('features_secure_payment_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1500">
              <Tag className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-gray-900 dark:text-white font-semibold mb-2">Best Prices</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">{t('features_best_prices_desc')}</p>
          </div>
        </div>
      </section>

      {/* About Diaa Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-gray-100 dark:from-gray-900 to-white dark:to-black rounded-3xl p-8 md:p-12 border border-gold-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-bold text-gold-primary mb-4">{t('about_title')}</h2>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-4">
                {t('about_p1')}
              </p>
              <p className="text-gray-700 dark:text-gray-300 text-lg mb-6">
                {t('about_p2')}
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">1K+</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('happy_customers')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">5K+</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('orders_completed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">24/7</p>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t('customer_support')}</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-neon-pink/20 via-purple-900/20 to-gold-primary/20 border border-gold-primary/30 p-4">
              <div className="relative w-full h-64 md:h-96 bg-gradient-to-br from-gray-200 dark:from-gray-800 to-white dark:to-black rounded-xl flex items-center justify-center overflow-hidden group">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold-primary/10 via-neon-pink/10 to-purple-600/10 animate-pulse"></div>
                
                {/* Main image or placeholder */}
                <div className="relative z-10 flex flex-col items-center justify-center">
                  <Gamepad2 className="w-16 h-16 text-gold-primary mb-4 animate-float" />
                  <p className="text-gray-600 dark:text-gray-400 text-sm">Premium Gaming Experience</p>
                </div>
                
                {/* Decorative elements */}
                <div className="absolute top-2 right-2 w-20 h-20 bg-gradient-to-br from-gold-primary to-transparent rounded-full opacity-20 blur-2xl"></div>
                <div className="absolute bottom-2 left-2 w-24 h-24 bg-gradient-to-tr from-neon-pink to-transparent rounded-full opacity-20 blur-2xl"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">{t('reviews_title')}</h2>
          <p className="text-gray-600 dark:text-gray-400">{t('reviews_subtitle')}</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">A</div>
              <div className="ml-4">
                <p className="font-bold text-gray-900 dark:text-white">Ahmed Hassan</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">"Fast delivery and great prices! I got my game currency instantly. Highly recommended!"</p>
          </div>

          {/* Review 2 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">M</div>
              <div className="ml-4">
                <p className="font-bold text-gray-900 dark:text-white">Mona Ali</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">"Best gaming store ever! The support team is super helpful and responsive. 10/10"</p>
          </div>

          {/* Review 3 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">K</div>
              <div className="ml-4">
                <p className="font-bold text-gray-900 dark:text-white">Karim Mohamed</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">"Competitive prices and instant delivery. This is my go-to store for all gaming needs!"</p>
          </div>
        </div>
      </section>



      {/* Payment Methods */}
      <section className="container mx-auto px-4 py-8">
        <PaymentMethods />
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
