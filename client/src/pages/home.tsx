import { useState } from "react";
import { ShoppingCart, Gamepad2, Zap, Headphones, Shield, Tag, Flame, Gift } from "lucide-react";
import { SiTelegram, SiTiktok, SiYoutube, SiFacebook, SiWhatsapp } from "react-icons/si";
import { Button } from "@/components/ui/button";

import { ShoppingCategories } from "@/components/shopping-categories";
import { PopularGames } from "@/components/popular-games";
import { GameRecommendationEngine } from "@/components/game-recommendation-engine";
import { DynamicLoadingProgress } from "@/components/dynamic-loading-progress";
import { AccessibilityToolbar } from "@/components/accessibility-mode";

import { Link } from "wouter";

import PaymentMethods from "@/components/payment-methods";
import { CartSidebar } from "@/components/cart-sidebar";
import { CheckoutModal } from "@/components/checkout-modal";
import { useCart } from "@/lib/cart-context";

export default function Home() {
  const { getItemCount } = useCart();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const itemCount = getItemCount();

  return (
    <div className="min-h-screen text-foreground font-gaming overflow-x-hidden custom-cursor bg-gradient-to-b from-darker-bg via-gray-900 to-black">

      
      {/* Header */}
      <header className="relative z-50 bg-card/90 backdrop-blur-md border-b border-gold-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-black">
                  <img 
                    src="/attached_assets/ninja-gaming-logo.png" 
                    alt="Diaa Eldeen Logo"
                    className="w-14 h-14 object-contain"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                  Diaa Eldeen
                </h1>
                <p className="text-sm text-muted-foreground">Premium Game Store</p>
              </div>
            </div>

            {/* Navigation & Cart */}
            <div className="flex items-center space-x-6">
              <nav className="hidden md:flex space-x-6">
                <Link href="/" className="text-foreground hover:text-gold-primary transition-colors font-medium">Home</Link>
                <Link href="/games" className="text-foreground hover:text-gold-primary transition-colors font-medium">Games</Link>
                <AccessibilityToolbar />
                <Link href="/support" className="text-foreground hover:text-gold-primary transition-colors font-medium">Support</Link>
              </nav>
              
              {/* Shopping Cart Button */}
              <Button
                onClick={() => setIsCartOpen(true)}
                className="relative bg-gradient-to-r from-gold-primary to-gold-secondary text-background px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300"
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                Cart ({itemCount})
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-neon-pink text-white text-xs rounded-full w-6 h-6 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Shopping Categories */}
      <ShoppingCategories />

      {/* Most Popular Games */}
      <PopularGames />

      {/* Features Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float">
              <Zap className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-white font-semibold mb-2">Fast Delivery</h3>
            <p className="text-gray-400 text-sm">Get your products quickly and reliably.</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-500">
              <Headphones className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-white font-semibold mb-2">Online Support</h3>
            <p className="text-gray-400 text-sm">24 hours a day, 7 days a week.</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1000">
              <Shield className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-white font-semibold mb-2">Secure Payment</h3>
            <p className="text-gray-400 text-sm">Pay with Multiple Payment Methods.</p>
          </div>
          
          <div className="flex flex-col items-center">
            <div className="bg-gradient-to-br from-gold-primary to-gold-secondary w-16 h-16 rounded-full flex items-center justify-center mb-4 animate-float animation-delay-1500">
              <Tag className="text-darker-bg text-2xl" />
            </div>
            <h3 className="text-white font-semibold mb-2">Best Prices</h3>
            <p className="text-gray-400 text-sm">Discover unbeatable prices.</p>
          </div>
        </div>
      </section>

      {/* About Diaa Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-3xl p-8 md:p-12 border border-gold-primary/30">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
            {/* Text Content */}
            <div>
              <h2 className="text-3xl font-bold text-gold-primary mb-4">About Diaa Eldeen</h2>
              <p className="text-gray-300 text-lg mb-4">
                Welcome to Diaa Eldeen - Your trusted gaming partner since day one. We specialize in providing premium digital gaming products with fast delivery and exceptional customer service.
              </p>
              <p className="text-gray-300 text-lg mb-6">
                Our mission is to make gaming accessible and affordable for everyone. Whether you're looking for game currencies, gift cards, or digital vouchers, we've got you covered with the best prices and fastest delivery in the market.
              </p>
              <div className="flex gap-4">
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">1K+</p>
                  <p className="text-gray-400 text-sm">Happy Customers</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">5K+</p>
                  <p className="text-gray-400 text-sm">Orders Completed</p>
                </div>
                <div className="text-center">
                  <p className="text-3xl font-bold text-gold-primary">24/7</p>
                  <p className="text-gray-400 text-sm">Customer Support</p>
                </div>
              </div>
            </div>

            {/* Image */}
            <div className="rounded-2xl overflow-hidden">
              <img
                src="/attached_assets/image_(5)_1766184169669.png"
                alt="Diaa Eldeen"
                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Customer Reviews Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-foreground mb-2">What Our Customers Say</h2>
          <p className="text-gray-400">Real testimonials from real gamers</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Review 1 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">A</div>
              <div className="ml-4">
                <p className="font-bold text-white">Ahmed Hassan</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-300">"Fast delivery and great prices! I got my game currency instantly. Highly recommended!"</p>
          </div>

          {/* Review 2 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">M</div>
              <div className="ml-4">
                <p className="font-bold text-white">Mona Ali</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-300">"Best gaming store ever! The support team is super helpful and responsive. 10/10"</p>
          </div>

          {/* Review 3 */}
          <div className="bg-card/50 backdrop-blur border border-gold-primary/20 rounded-2xl p-6 hover:border-gold-primary/50 transition-colors">
            <div className="flex items-center mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center text-white font-bold">K</div>
              <div className="ml-4">
                <p className="font-bold text-white">Karim Mohamed</p>
                <p className="text-sm text-gold-primary">⭐⭐⭐⭐⭐</p>
              </div>
            </div>
            <p className="text-gray-300">"Competitive prices and instant delivery. This is my go-to store for all gaming needs!"</p>
          </div>
        </div>
      </section>



      {/* Payment Methods */}
      <section className="container mx-auto px-4 py-8">
        <PaymentMethods />
      </section>

      {/* Footer */}
      <footer className="bg-darker-bg border-t border-gray-800 py-12">
        <div className="container mx-auto px-4">
          {/* Character Showcase */}
          <div className="text-center mb-12">
            <div className="inline-block mb-4">
              <img 
                src="/attached_assets/image_(5)_1766184169669.png" 
                alt="Crossfire Character"
                className="h-48 object-contain"
              />
            </div>
          </div>

          {/* Social Links */}
          <div className="flex justify-center space-x-8 mb-8">
            <a
              href="https://t.me/+7iivzambZno1NzBk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 text-3xl transition-all duration-300 hover:scale-125"
              title="Telegram"
            >
              <SiTelegram />
            </a>
            <a
              href="https://wa.me/201234567890"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 text-3xl transition-all duration-300 hover:scale-125"
              title="WhatsApp"
            >
              <SiWhatsapp />
            </a>
            <a
              href="https://www.facebook.com/DiaElDeenSadek"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:text-blue-500 text-3xl transition-all duration-300 hover:scale-125"
              title="Facebook"
            >
              <SiFacebook />
            </a>
            <a
              href="https://tiktok.com/@diaa_eldeen"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-400 text-3xl transition-all duration-300 hover:scale-125"
              title="TikTok"
            >
              <SiTiktok />
            </a>
            <a
              href="https://youtube.com/channel/UCTMMrq_QBRQOCmqWdyp-Ttw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-400 text-3xl transition-all duration-300 hover:scale-125"
              title="YouTube"
            >
              <SiYoutube />
            </a>
          </div>
          <p className="text-gray-400 text-center">© 2024 Diaa Eldeen. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2 text-center">Premium Game Store - منشئ محتوى ألعاب فيديو</p>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onCheckout={() => {
          setIsCartOpen(false);
          setIsCheckoutOpen(true);
        }}
      />

      {/* Checkout Modal */}
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </div>
  );
}
