import { useState } from "react";
import { ShoppingCart, Gamepad2, Zap, Headphones, Shield, Tag } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiTiktok, SiYoutube } from "react-icons/si";
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
    <div className="min-h-screen bg-background text-foreground font-gaming overflow-x-hidden custom-cursor">

      
      {/* Header */}
      <header className="relative z-50 bg-card/90 backdrop-blur-md border-b border-gold-primary/20">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden">
                  <img 
                    src="/attached_assets/image_1754931426972.png" 
                    alt="Cheetos Gaming Logo"
                    className="w-16 h-16 object-cover rounded-xl"
                  />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                  Cheetos Gaming
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

      {/* AI Recommendations Section */}
      <section className="container mx-auto px-4 py-16">
        <GameRecommendationEngine />
      </section>

      {/* Popular Games Section */}
      <section className="container mx-auto px-4 py-16">
        <PopularGames />
      </section>

      {/* Payment Methods */}
      <section className="container mx-auto px-4 py-8">
        <PaymentMethods />
      </section>

      {/* Footer */}
      <footer className="bg-darker-bg border-t border-gray-800 py-8">
        <div className="container mx-auto px-4 text-center">
          <div className="flex justify-center space-x-6 mb-6">
            <a
              href="https://whatsapp.com/channel/0029VapyTOs9MF8vWPdZ9z3R"
              target="_blank"
              rel="noopener noreferrer"
              className="text-green-500 hover:text-green-400 text-2xl transition-colors"
            >
              <SiWhatsapp />
            </a>
            <a
              href="https://t.me/+7iivzambZno1NzBk"
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:text-blue-400 text-2xl transition-colors"
            >
              <SiTelegram />
            </a>
            <a
              href="https://tiktok.com/@cheetos_gaming1"
              target="_blank"
              rel="noopener noreferrer"
              className="text-pink-500 hover:text-pink-400 text-2xl transition-colors"
            >
              <SiTiktok />
            </a>
            <a
              href="https://youtube.com/channel/UCTMMrq_QBRQOCmqWdyp-Ttw"
              target="_blank"
              rel="noopener noreferrer"
              className="text-red-500 hover:text-red-400 text-2xl transition-colors"
            >
              <SiYoutube />
            </a>
          </div>
          <p className="text-gray-400">© 2024 Cheetos Gaming. All rights reserved.</p>
          <p className="text-gray-500 text-sm mt-2">Premium Game Store - منشئ محتوى ألعاب فيديو</p>
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
