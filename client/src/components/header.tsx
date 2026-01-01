import { Link } from "wouter";
import { ShoppingCart, Sun, Moon, Menu, X, Gamepad2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessibilityToolbar } from "@/components/accessibility-mode";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/components/theme-provider";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
<<<<<<< HEAD
=======
const logo = "/attached_assets/favicon_1766968131270.png";
>>>>>>> 11187337703f9d57d38b3a578353a54b6fa7deaf

interface HeaderProps {
  onCartClick: () => void;
}

export function Header({ onCartClick }: HeaderProps) {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const { theme, setTheme } = useTheme();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header 
      dir="ltr"
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? "bg-card/98 backdrop-blur-xl border-b border-gold-primary/15 shadow-xl py-3" 
          : "bg-transparent py-5"
      }`}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group text-nowrap">
              <div className="relative">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-xl flex items-center justify-center overflow-hidden bg-black transition-transform transform group-hover:scale-105 duration-300 border border-gold-primary/40 shadow-[0_0_20px_rgba(52,152,219,0.3)]">
                  <Gamepad2 className="w-8 h-8 md:w-12 md:h-12 text-gold-primary" />
                </div>
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent group-hover:from-gold-secondary group-hover:to-neon-blue transition-all duration-300">
                  Diaa Sadek
                </h1>
                <p className="text-xs font-medium text-muted-foreground group-hover:text-gold-primary transition-colors uppercase tracking-widest">{t("premium_store")}</p>
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-8">
            <nav className="flex items-center space-x-6">
              {[
                { name: t('home'), href: '/' },
                { name: t('categories'), href: '/#categories' },
                { name: t('games'), href: '/games' },
                { name: t('support'), href: '/support' },
              ].map((item) => (
                <Link key={item.name} href={item.href}>
                  <span className="text-foreground hover:text-gold-primary transition-colors font-medium relative py-2 cursor-pointer group">
                    {item.name}
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-primary transition-all duration-300 group-hover:w-full"></span>
                  </span>
                </Link>
              ))}
              <button
                onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                className="text-foreground hover:text-gold-primary transition-colors font-medium relative py-2 cursor-pointer group"
              >
                {t('live_chat')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold-primary transition-all duration-300 group-hover:w-full"></span>
              </button>
            </nav>

            <div className="h-6 w-px bg-border"></div>

            <div className="flex items-center space-x-3">
              <AccessibilityToolbar />
              <LanguageSwitcher />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-gold-primary/10 hover:text-gold-primary transition-colors"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </Button>

              <Button
                onClick={onCartClick}
                className="relative bg-gradient-to-r from-gold-primary to-gold-secondary text-background px-5 py-2 rounded-full hover:scale-105 transition-all duration-300 shadow-[0_0_15px_rgba(255,204,51,0.3)] hover:shadow-[0_0_25px_rgba(255,204,51,0.5)] font-bold"
                aria-label={`Shopping Cart with ${itemCount} items`}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                <span>{t('cart')}</span> 
                {itemCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-neon-pink text-white text-[10px] font-bold rounded-full min-w-[20px] h-5 flex items-center justify-center border-2 border-background animate-bounce">
                    {itemCount}
                  </span>
                )}
              </Button>
            </div>
          </div>

          {/* Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-4">
            <Button
              onClick={onCartClick}
              size="icon"
              variant="ghost"
              className="relative"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute top-0 right-0 bg-neon-pink text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {itemCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground"
            >
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-card border-b border-border shadow-xl animate-fade-in">
            <div className="container px-4 py-6 flex flex-col space-y-4">
              <Link href="/">
                <span className="text-lg font-medium py-2 border-b border-border/50" onClick={() => setIsMobileMenuOpen(false)}>{t('home')}</span>
              </Link>
              <Link href="/#categories">
                <span className="text-lg font-medium py-2 border-b border-border/50" onClick={() => setIsMobileMenuOpen(false)}>{t('categories')}</span>
              </Link>
              <Link href="/games">
                <span className="text-lg font-medium py-2 border-b border-border/50" onClick={() => setIsMobileMenuOpen(false)}>{t('games')}</span>
              </Link>
              <Link href="/support">
                <span className="text-lg font-medium py-2 border-b border-border/50" onClick={() => setIsMobileMenuOpen(false)}>{t('support')}</span>
              </Link>
              <button 
                onClick={() => {
                  window.dispatchEvent(new Event('open-live-chat'));
                  setIsMobileMenuOpen(false);
                }}
                className="text-left text-lg font-medium py-2 border-b border-border/50"
              >
                {t('live_chat')}
              </button>
              
              <div className="flex items-center justify-between pt-4">
                <span className="font-medium">Theme</span>
                <div className="flex items-center space-x-2 bg-muted p-1 rounded-full">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`p-2 rounded-full transition-all ${theme === "light" ? "bg-background shadow-sm text-gold-primary" : "text-muted-foreground"}`}
                  >
                    <Sun className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`p-2 rounded-full transition-all ${theme === "dark" ? "bg-background shadow-sm text-gold-primary" : "text-muted-foreground"}`}
                  >
                    <Moon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
