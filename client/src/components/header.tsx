import { Link } from "wouter";
import { ShoppingCart, Sun, Moon, Menu, X, Gamepad2, Sparkles, Zap, User, LogOut, Home, FolderOpen, MessageCircleQuestion } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AccessibilityToolbar } from "@/components/accessibility-mode";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import { useQuery } from "@tanstack/react-query";

interface HeaderProps {
  onCartClick: () => void;
}

export function Header({ onCartClick }: HeaderProps) {
  const { getItemCount } = useCart();
  const itemCount = getItemCount();
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserAuth();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHovered, setIsHovered] = useState<string | null>(null);

  const { data: siteSettings } = useQuery({
    queryKey: ['/api/public/settings/site'],
    queryFn: async () => {
      const res = await fetch('/api/public/settings/site');
      return res.json();
    },
  });

  const logoUrl = siteSettings?.logo_url || "https://files.catbox.moe/brmkrj.png";
  const headerBgUrl = siteSettings?.header_bg_url;

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
      className={`fixed w-full top-0 z-50 transition-all duration-500 flex flex-col items-center ${
        isScrolled 
          ? "bg-card/95 backdrop-blur-2xl border-b border-gold-primary/20 shadow-2xl shadow-gold-primary/10" 
          : "bg-transparent"
      }`}
      style={{
        background: isScrolled 
          ? undefined 
          : 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(52,152,219,0.05) 50%, rgba(0,0,0,0.1) 100%)'
      }}
    >
      {/* Header Image Section */}
      {headerBgUrl && (
        <div className={`w-full transition-all duration-500 overflow-hidden ${isScrolled ? 'h-0 opacity-0' : 'h-32 md:h-48 xl:h-64 opacity-100'}`}>
           <img 
             src={headerBgUrl} 
             alt="Header Banner" 
             className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-700"
           />
        </div>
      )}

      <div className={`container mx-auto px-4 w-full transition-all duration-500 ${isScrolled || !headerBgUrl ? 'py-3' : 'py-6'}`}>
        <div className="flex items-center justify-between">
          {/* Enhanced Logo */}
          <Link href="/">
            <div className="flex items-center space-x-3 cursor-pointer group text-nowrap relative">
              <div className="relative">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center overflow-hidden bg-gradient-to-br from-black via-gray-900 to-black transition-all duration-500 border border-gold-primary/50 shadow-[0_0_30px_rgba(52,152,219,0.4)] group-hover:shadow-[0_0_50px_rgba(52,152,219,0.8)] group-hover:scale-110 group-hover:rotate-3">
                  <img src={logoUrl} alt="Logo" className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gold-primary/20 to-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl"></div>
                </div>
                {/* Animated sparkles around logo */}
                <Sparkles className="absolute -top-2 -right-2 w-4 h-4 text-gold-primary opacity-0 group-hover:opacity-100 transition-all duration-500 animate-pulse" />
                <Zap className="absolute -bottom-2 -left-2 w-3 h-3 text-neon-pink opacity-0 group-hover:opacity-100 transition-all duration-500 animate-bounce" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-gold-primary via-neon-pink to-neon-blue bg-clip-text text-transparent group-hover:from-gold-secondary group-hover:via-neon-blue group-hover:to-gold-primary transition-all duration-500 animate-pulse">
                  Diaa Sadek
                </h1>
                <p className="text-[10px] md:text-xs font-bold text-muted-foreground group-hover:text-gold-primary transition-all duration-300 uppercase tracking-widest flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {t("premium_store")}
                  <Sparkles className="w-3 h-3" />
                </p>
              </div>
            </div>
          </Link>

          {/* Enhanced Desktop Navigation */}
          <div className="hidden lg:flex items-center space-x-6 xl:space-x-8">
            <nav className="flex items-center space-x-4 xl:space-x-6">
              {[
                { name: t('home'), href: '/', icon: <Home className="w-4 h-4" /> },
                { name: t('categories'), href: '/#categories', icon: <FolderOpen className="w-4 h-4" /> },
                { name: t('games'), href: '/games', icon: <Gamepad2 className="w-4 h-4" /> },
                { name: t('support'), href: '/support', icon: <MessageCircleQuestion className="w-4 h-4" /> },
              ].map((item) => (
                <Link key={item.name} href={item.href}>
                  <span 
                    className="text-foreground hover:text-gold-primary transition-all duration-300 font-medium relative py-2 cursor-pointer group flex items-center gap-2"
                    onMouseEnter={() => setIsHovered(item.name)}
                    onMouseLeave={() => setIsHovered(null)}
                  >
                    <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-125 absolute -left-6">
                      {item.icon}
                    </span>
                    <span className="group-hover:translate-x-1 transition-transform duration-300">
                      {item.name}
                    </span>
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-gold-primary to-neon-pink transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(255,204,51,0.5)]"></span>
                  </span>
                </Link>
              ))}
              <button
                onClick={() => window.dispatchEvent(new Event('open-live-chat'))}
                className="text-foreground hover:text-gold-primary transition-all duration-300 font-medium relative py-2 cursor-pointer group flex items-center gap-2"
                onMouseEnter={() => setIsHovered('live_chat')}
                onMouseLeave={() => setIsHovered(null)}
              >
                <span className="text-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform group-hover:scale-125 absolute -left-6">
                  <Sparkles className="w-4 h-4" />
                </span>
                <span className="group-hover:translate-x-1 transition-transform duration-300">
                  {t('live_chat')}
                </span>
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gradient-to-r from-neon-blue to-neon-pink transition-all duration-300 group-hover:w-full shadow-[0_0_10px_rgba(0,255,255,0.5)]"></span>
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-neon-blue rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse"></span>
              </button>
            </nav>

            <div className="h-8 w-px bg-gradient-to-b from-transparent via-gold-primary/30 to-transparent"></div>

            <div className="flex items-center space-x-4">
              <AccessibilityToolbar />
              <LanguageCurrencySwitcher />
              
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-gold-primary/10 hover:text-gold-primary transition-all duration-300 hover:scale-110 hover:shadow-[0_0_20px_rgba(255,204,51,0.3)] relative group"
                aria-label="Toggle Theme"
              >
                {theme === "dark" ? (
                  <Sun className="h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                ) : (
                  <Moon className="h-5 w-5 transition-transform duration-300 group-hover:-rotate-12" />
                )}
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-primary/20 to-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>

              <Button
                onClick={onCartClick}
                className="relative bg-gradient-to-r from-gold-primary via-neon-pink to-neon-blue text-background px-6 py-3 rounded-full hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(255,204,51,0.4)] hover:shadow-[0_0_40px_rgba(255,204,51,0.8)] font-bold border border-gold-primary/30 hover:border-gold-primary/60 group"
                aria-label={`Shopping Cart with ${itemCount} items`}
              >
                <ShoppingCart className="mr-2 h-5 w-5 transition-transform duration-300 group-hover:rotate-12" />
                <span className="hidden sm:inline">{t('cart')}</span> 
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-neon-pink to-red-500 text-white text-xs font-bold rounded-full min-w-[24px] h-6 flex items-center justify-center border-2 border-background animate-bounce shadow-[0_0_15px_rgba(255,0,150,0.6)]">
                    {itemCount}
                    <Sparkles className="w-3 h-3 ml-1" />
                  </span>
                )}
                <div className="absolute inset-0 rounded-full bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Button>

              {/* User Authentication */}
              {isAuthenticated ? (
                <div className="flex items-center space-x-2">
                  <Link href="/profile">
                    <Button
                      variant="ghost"
                      className="text-foreground hover:text-gold-primary transition-all duration-300 hover:bg-gold-primary/10 px-4 py-2 rounded-full hover:scale-105"
                    >
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    className="text-foreground hover:text-red-400 transition-all duration-300 hover:bg-red-500/10 px-4 py-2 rounded-full hover:scale-105"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link href="/login">
                  <Button
                    className="bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black font-semibold px-6 py-3 rounded-full hover:scale-110 transition-all duration-500 shadow-[0_0_20px_rgba(255,204,51,0.4)] hover:shadow-[0_0_40px_rgba(255,204,51,0.8)] border border-gold-primary/30 hover:border-gold-primary/60"
                  >
                    <User className="mr-2 h-4 w-4" />
                    Sign In
                  </Button>
                </Link>
              )}
            </div>
          </div>

          {/* Enhanced Mobile Menu Toggle */}
          <div className="lg:hidden flex items-center space-x-4">
            <Button
              onClick={onCartClick}
              size="icon"
              variant="ghost"
              className="relative hover:bg-gold-primary/10 transition-all duration-300 hover:scale-110"
            >
              <ShoppingCart className="h-6 w-6" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-gradient-to-r from-neon-pink to-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center animate-bounce shadow-[0_0_10px_rgba(255,0,150,0.5)]">
                  {itemCount}
                </span>
              )}
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="text-foreground hover:text-gold-primary transition-all duration-300 hover:scale-110 hover:bg-gold-primary/10 relative group"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6 transition-transform duration-300 rotate-90 group-hover:rotate-180" />
              ) : (
                <Menu className="h-6 w-6 transition-transform duration-300 group-hover:scale-110" />
              )}
              <div className="absolute inset-0 rounded-full bg-gradient-to-r from-gold-primary/20 to-neon-blue/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            </Button>
          </div>
        </div>

        {/* Enhanced Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="lg:hidden absolute top-full left-0 w-full bg-card/95 backdrop-blur-2xl border-b border-gold-primary/20 shadow-2xl animate-fade-in border-t">
            <div className="container px-4 py-8 flex flex-col space-y-6">
              {/* Menu Items with Icons */}
              <div className="space-y-4">
                <Link href="/" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                    <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                      <Home className="w-6 h-6" />
                    </span>
                    <span className="group-hover:text-gold-primary transition-colors duration-300">{t('home')}</span>
                  </div>
                </Link>
                <Link href="/#categories" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                    <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                      <FolderOpen className="w-6 h-6" />
                    </span>
                    <span className="group-hover:text-gold-primary transition-colors duration-300">{t('categories')}</span>
                  </div>
                </Link>
                <Link href="/games" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                    <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                      <Gamepad2 className="w-6 h-6" />
                    </span>
                    <span className="group-hover:text-gold-primary transition-colors duration-300">{t('games')}</span>
                  </div>
                </Link>
                <Link href="/support" onClick={() => setIsMobileMenuOpen(false)}>
                  <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                    <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                      <MessageCircleQuestion className="w-6 h-6" />
                    </span>
                    <span className="group-hover:text-gold-primary transition-colors duration-300">{t('support')}</span>
                  </div>
                </Link>
                <button 
                  onClick={() => {
                    window.dispatchEvent(new Event('open-live-chat'));
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-neon-blue/50 transition-all duration-300 group"
                >
                  <span className="group-hover:scale-125 transition-transform duration-300 text-neon-blue">
                    <Sparkles className="w-6 h-6" />
                  </span>
                  <span className="group-hover:text-neon-blue transition-colors duration-300">{t('live_chat')}</span>
                </button>
              </div>

              {/* User Authentication Mobile */}
              <div className="pt-4 border-t border-border/30">
                {isAuthenticated ? (
                  <div className="space-y-4">
                    <Link href="/profile" onClick={() => setIsMobileMenuOpen(false)}>
                      <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                        <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                          <User className="w-6 h-6" />
                        </span>
                        <span className="group-hover:text-gold-primary transition-colors duration-300">{user?.name || 'Profile'}</span>
                      </div>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setIsMobileMenuOpen(false);
                      }}
                      className="w-full flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-red-500/50 transition-all duration-300 group"
                    >
                      <span className="group-hover:scale-125 transition-transform duration-300 text-red-400">
                        <LogOut className="w-6 h-6" />
                      </span>
                      <span className="group-hover:text-red-400 transition-colors duration-300">Sign Out</span>
                    </button>
                  </div>
                ) : (
                  <Link href="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    <div className="flex items-center space-x-4 text-lg font-medium py-3 border-b border-border/30 hover:border-gold-primary/50 transition-all duration-300 group cursor-pointer">
                      <span className="group-hover:scale-125 transition-transform duration-300 text-gold-primary">
                        <User className="w-6 h-6" />
                      </span>
                      <span className="group-hover:text-gold-primary transition-colors duration-300">Sign In</span>
                    </div>
                  </Link>
                )}
              </div>
              
              {/* Enhanced Theme Toggle */}
              <div className="flex items-center justify-between pt-6 border-t border-border/30">
                <span className="font-bold text-gold-primary flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Theme
                </span>
                <div className="flex items-center space-x-2 bg-gradient-to-r from-muted to-muted/50 p-1 rounded-full border border-gold-primary/20">
                  <button 
                    onClick={() => setTheme("light")}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                      theme === "light" 
                        ? "bg-gradient-to-r from-gold-primary to-gold-secondary shadow-lg shadow-gold-primary/30 text-background" 
                        : "text-muted-foreground hover:text-gold-primary"
                    }`}
                  >
                    <Sun className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => setTheme("dark")}
                    className={`p-3 rounded-full transition-all duration-300 hover:scale-110 ${
                      theme === "dark" 
                        ? "bg-gradient-to-r from-neon-blue to-neon-pink shadow-lg shadow-neon-blue/30 text-background" 
                        : "text-muted-foreground hover:text-neon-blue"
                    }`}
                  >
                    <Moon className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {/* Fun Footer */}
              <div className="text-center pt-4 border-t border-border/30">
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-gold-primary animate-pulse" />
                  Made with ❤️ by Diaa Sadek
                  <Sparkles className="w-4 h-4 text-neon-pink animate-pulse" />
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
