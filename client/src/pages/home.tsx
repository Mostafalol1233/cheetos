import { useState } from "react";
import { Gamepad2, Zap, Headphones, Shield, Tag } from "lucide-react";
import { SiTelegram, SiTiktok, SiYoutube, SiFacebook, SiWhatsapp } from "react-icons/si";


import { ShoppingCategories } from "@/components/shopping-categories";
import { PopularGames } from "@/components/popular-games";

import PaymentMethods from "@/components/payment-methods";
import { HeroCarousel } from "@/components/hero-carousel";

import { Footer } from "@/components/footer";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";

export default function Home() {
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const { t } = useTranslation();


  return (
    <>
      <SEO
        title="متجر ضياء - شحن ألعاب إلكترونية في مصر | Diaa Gaming Store - أفضل متجر ألعاب"
        description="متجر ضياء أفضل متجر شحن ألعاب إلكترونية في مصر. اشحن عملات Free Fire, PUBG, وجميع الألعاب بأمان وسرعة مع Diaa Sadek. خدمة موثوقة وأسعار تنافسية."
        keywords={[
          "متجر ألعاب", "شحن ألعاب", "Diaa", "ضياء", "top up games Egypt",
          "شحن ألعاب إلكترونية", "gaming store Egypt", "Diaa Sadek", "متجر ضياء",
          "شحن عملات ألعاب", "ألعاب إلكترونية مصر", "top up Egypt", "gaming top up",
          "ضياء ألعاب", "Diaa gaming", "شحن ألعاب اونلاين", "متجر ألعاب مصر",
          "gaming store", "شحن ألعاب سريع", "Free Fire", "PUBG", "ألعاب موبايل",
          "شحن ألعاب مجاني", "أفضل متجر ألعاب مصر", "gaming shop Egypt"
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "متجر ضياء - الصفحة الرئيسية",
          "description": "اكتشف متجر ضياء لشحن ألعاب إلكترونية في مصر. شحن آمن وسريع لجميع الألعاب مع Diaa Sadek.",
          "url": window.location.origin,
          "isPartOf": {
            "@type": "WebSite",
            "name": "متجر ضياء",
            "url": window.location.origin
          },
          "about": {
            "@type": "Organization",
            "name": "متجر ضياء",
            "description": "متخصص في شحن ألعاب إلكترونية في مصر"
          },
          "mainEntity": {
            "@type": "ItemList",
            "name": "ألعاب متاحة للشحن",
            "description": "قائمة بجميع الألعاب المتاحة للشحن في متجر ضياء"
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [{
              "@type": "ListItem",
              "position": 1,
              "name": "الرئيسية",
              "item": window.location.origin
            }]
          }
        }}
      />
      <div className="min-h-screen text-foreground font-gaming overflow-x-hidden custom-cursor bg-background animate-fade-in">

      {/* Hero Section */}
      <section className="container mx-auto px-4 pt-6">
        <HeroCarousel />
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
          <div className="flex flex-col items-center group">
            <div className="bg-gradient-to-br from-gold-primary to-neon-pink w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float shadow-lg group-hover:shadow-xl transition-shadow">
              <Zap className="text-white text-2xl" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Fast Delivery</h3>
            <p className="text-muted-foreground text-sm">{t('features_fast_delivery_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-gradient-to-br from-neon-pink to-gold-primary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-500 shadow-lg group-hover:shadow-xl transition-shadow">
              <Headphones className="text-white text-2xl" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Online Support</h3>
            <p className="text-muted-foreground text-sm">{t('features_online_support_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1000 shadow-lg group-hover:shadow-xl transition-shadow">
              <Shield className="text-white text-2xl" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Secure Payment</h3>
            <p className="text-muted-foreground text-sm">{t('features_secure_payment_desc')}</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1500">
              <Tag className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-foreground font-semibold mb-2">Best Prices</h3>
            <p className="text-muted-foreground text-sm">{t('features_best_prices_desc')}</p>
          </div>
        </div>
      </section>

      {/* About Diaa Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-card/50 backdrop-blur-sm rounded-3xl p-6 md:p-10 border border-gold-primary/30 shadow-lg shadow-gold-primary/5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-bold text-gold-primary mb-4">{t('about_title')}</h2>
              <p className="text-muted-foreground text-lg mb-4">
                {t('about_p1')}
              </p>
              <p className="text-muted-foreground text-lg mb-6">
                {t('about_p2')}
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">1K+</p>
                  <p className="text-muted-foreground text-sm">{t('happy_customers')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">5K+</p>
                  <p className="text-muted-foreground text-sm">{t('orders_completed')}</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">24/7</p>
                  <p className="text-muted-foreground text-sm">{t('customer_support')}</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-neon-pink/20 via-purple-900/20 to-gold-primary/20 border border-gold-primary/30">
              <div className="relative w-full bg-card/80 rounded-xl flex items-center justify-center overflow-hidden group">
                {/* Animated background */}
                <div className="absolute inset-0 bg-gradient-to-r from-gold-primary/10 via-neon-pink/10 to-purple-600/10 animate-pulse"></div>
                
                {/* Main image or placeholder */}
                <div className="relative z-10 flex flex-col items-center justify-center w-full p-8">
                  <img 
                    src="https://i.postimg.cc/zG8jHjqS/large-image-logo.png" 
                    alt="Diaa Sadek Logo"
                    className="w-full max-w-[440px] h-auto object-contain transition-transform duration-500 group-hover:scale-105"
                  />
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
            <p className="text-gray-700 dark:text-gray-300">Fast delivery and great prices</p>
          </div>

          {/* Review 2 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">M</div>
              <div className="ml-4">
                <p className="font-bold text-gray-900 dark:text-white">Mohamed Ali</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-700 dark:text-gray-300">"Best gaming store 10/10"</p>
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
            <p className="text-gray-700 dark:text-gray-300">"Competitive prices and instant delivery. This is my go-to store for all gaming needs</p>
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
    </>
  );
}
