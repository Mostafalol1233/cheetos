import { Link } from "wouter";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessibilityToolbar } from "@/components/accessibility-mode";
import { useCart } from "@/lib/cart-context";

interface HeaderProps {
  onCartClick: () => void;
}

export function Header({ onCartClick }: HeaderProps) {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();

  return (
    <header className="relative z-50 bg-card/90 backdrop-blur-md border-b border-gold-primary/20 sticky top-0">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-4 cursor-pointer group">
              <div className="relative">
                <div className="w-16 h-16 rounded-xl flex items-center justify-center overflow-hidden bg-black transition-transform transform group-hover:scale-105 duration-300 border border-gold-primary/10">
                  <img 
                    src="/public/assets/ninja-gaming-logo.png" 
                    alt="Diaa Eldeen | Premium Game Store Logo"
                    className="w-14 h-14 object-contain"
                    width="56"
                    height="56"
                  />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent group-hover:from-gold-secondary group-hover:to-neon-blue transition-all duration-300">
                  Diaa Eldeen
                </h1>
                <p className="text-sm text-muted-foreground group-hover:text-gold-primary transition-colors">Premium Game Store</p>
              </div>
            </div>
          </Link>

          {/* Navigation & Cart */}
          <div className="flex items-center space-x-2 md:space-x-6">
            <nav className="hidden md:flex space-x-8 items-center">
              <Link href="/" className="text-foreground hover:text-gold-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-gold-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">Home</Link>
              <Link href="/games" className="text-foreground hover:text-gold-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-gold-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">Games</Link>
              <Link href="/support" className="text-foreground hover:text-gold-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-gold-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left">Support</Link>
              <button
                onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                className="text-foreground hover:text-gold-primary transition-colors font-medium relative after:content-[''] after:absolute after:w-full after:scale-x-0 after:h-0.5 after:bottom-0 after:left-0 after:bg-gold-primary after:origin-bottom-right after:transition-transform after:duration-300 hover:after:scale-x-100 hover:after:origin-bottom-left"
              >
                Live Chat
              </button>
            </nav>

            <AccessibilityToolbar />
            
            {/* Shopping Cart Button */}
            <Button
              onClick={onCartClick}
              className="relative bg-gradient-to-r from-gold-primary to-gold-secondary text-background px-4 py-2 rounded-xl hover:scale-105 transition-all duration-300 shadow-lg hover:shadow-gold-primary/20"
              aria-label={`Shopping Cart with ${itemCount} items`}
            >
              <ShoppingCart className="mr-2 h-4 w-4" />
              <span className="hidden xs:inline">Cart</span> 
              <span className="ml-1">({itemCount})</span>
              {itemCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-neon-pink text-white text-xs rounded-full w-6 h-6 flex items-center justify-center animate-bounce">
                  {itemCount}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
