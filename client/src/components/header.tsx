import { Link, useLocation } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut, Menu, X, Home, Grid3X3, MessageCircle, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserAuth();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { settings } = useSettings();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  const navLinks = [
    { href: "/", label: t('home'), icon: Home },
    { href: "/games", label: t('games') || "Games", icon: Gamepad2 },
    { href: "/support", label: t('support'), icon: MessageCircle },
    { href: "/track-order", label: t('track_order') || "Track Order", icon: Package },
  ];

  return (
    <>
      {/* Main Header */}
      <header
        className={cn(
          "fixed w-full top-0 z-50 transition-all duration-500",
          isScrolled
            ? "py-2 glass shadow-lg shadow-black/10"
            : "py-4 bg-gradient-to-b from-background/90 to-transparent"
        )}
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <img
                  src="/images/logo.png"
                  alt="GameCart Logo"
                  className="h-10 w-auto object-contain hover:scale-105 transition-transform"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="hidden flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center shadow-glow-blue">
                      <Gamepad2 className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  <span className="text-xl md:text-2xl font-bold font-gaming tracking-wider">
                    <span className="bg-gradient-to-r from-cyber-blue via-neon-purple to-neon-pink bg-clip-text text-transparent drop-shadow-sm">
                      Diaa
                    </span>
                    <span className="text-foreground ml-1">Store</span>
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-1">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      className={cn(
                        "relative px-4 py-2 rounded-xl font-medium transition-all duration-300 flex items-center gap-2",
                        isActive
                          ? "text-cyber-blue"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <Icon className="w-4 h-4" />
                      {link.label}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-cyber-blue/10 border border-cyber-blue/30 rounded-xl -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {/* Categories Dropdown */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent hover:bg-cyber-blue/10 hover:text-cyber-blue text-muted-foreground data-[state=open]:text-cyber-blue">
                      <Grid3X3 className="w-4 h-4 mr-2" />
                      {t('categories')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[400px] gap-3 p-4 md:w-[500px] md:grid-cols-2 glass border-cyber-blue/20">
                        <li className="row-span-3">
                          <NavigationMenuLink asChild>
                            <Link href="/games" className="flex h-full w-full select-none flex-col justify-end rounded-xl bg-gradient-to-b from-cyber-blue/20 to-neon-purple/20 p-6 no-underline outline-none focus:shadow-md hover:shadow-glow-blue transition-all">
                              <Gamepad2 className="h-8 w-8 text-cyber-blue" />
                              <div className="mb-2 mt-4 text-lg font-bold text-foreground">
                                All Games
                              </div>
                              <p className="text-sm leading-tight text-muted-foreground">
                                Browse our full collection of games and top-ups
                              </p>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        <li>
                          <Link href="/category/mobile-games">
                            <NavigationMenuLink className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-cyber-blue/10 hover:text-cyber-blue">
                              <div className="text-sm font-semibold leading-none">Mobile Games</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                PUBG, Free Fire, Mobile Legends
                              </p>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        <li>
                          <Link href="/category/pc-games">
                            <NavigationMenuLink className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-neon-purple/10 hover:text-neon-purple">
                              <div className="text-sm font-semibold leading-none">PC Games</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                Steam, Valorant, League of Legends
                              </p>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                        <li>
                          <Link href="/category/gift-cards">
                            <NavigationMenuLink className="block select-none space-y-1 rounded-xl p-3 leading-none no-underline outline-none transition-all hover:bg-cyber-gold/10 hover:text-cyber-gold">
                              <div className="text-sm font-semibold leading-none">Gift Cards</div>
                              <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                iTunes, Google Play, PlayStation
                              </p>
                            </NavigationMenuLink>
                          </Link>
                        </li>
                      </ul>
                    </NavigationMenuContent>
                  </NavigationMenuItem>
                </NavigationMenuList>
              </NavigationMenu>
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2 md:gap-4">
              <LanguageCurrencySwitcher />

              {/* Theme Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleTheme}
                  className="rounded-xl hover:bg-cyber-blue/10 hover:text-cyber-blue transition-all duration-300"
                >
                  <AnimatePresence mode="wait">
                    {theme === "dark" ? (
                      <motion.div
                        key="sun"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Sun className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="moon"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Moon className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>

              {/* User Auth */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-cyber-blue/10 hover:text-cyber-blue">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{user?.name}</span>
                    </Button>
                  </Link>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="icon"
                    className="rounded-xl hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Link href="/login" className="hidden md:block">
                  <Button className="btn-gaming rounded-xl px-6">
                    Sign In
                  </Button>
                </Link>
              )}

              {/* Mobile Menu Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="rounded-xl hover:bg-cyber-blue/10"
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <X className="h-6 w-6" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Menu className="h-6 w-6" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] glass z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-6">
                {/* Close Button */}
                <div className="flex justify-end mb-8">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl hover:bg-cyber-blue/10"
                  >
                    <X className="h-6 w-6" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-2">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isActive = location === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link href={link.href}>
                          <div
                            className={cn(
                              "flex items-center gap-4 px-4 py-4 rounded-xl transition-all duration-300",
                              isActive
                                ? "bg-cyber-blue/20 text-cyber-blue border border-cyber-blue/30"
                                : "hover:bg-muted text-foreground"
                            )}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="font-medium">{link.label}</span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Categories Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-4 border-t border-border mt-4"
                  >
                    <p className="text-sm font-semibold text-muted-foreground px-4 mb-2">Categories</p>
                    <Link href="/category/mobile-games">
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground">
                        <span className="text-cyber-blue">📱</span>
                        Mobile Games
                      </div>
                    </Link>
                    <Link href="/category/pc-games">
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground">
                        <span className="text-neon-purple">💻</span>
                        PC Games
                      </div>
                    </Link>
                    <Link href="/category/gift-cards">
                      <div className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground">
                        <span className="text-cyber-gold">🎁</span>
                        Gift Cards
                      </div>
                    </Link>
                  </motion.div>
                </nav>

                {/* User Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-8 pt-4 border-t border-border"
                >
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link href="/profile">
                        <div className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-all text-foreground">
                          <User className="w-5 h-5" />
                          <span className="font-medium">{user?.name || "Profile"}</span>
                        </div>
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-destructive/10 text-destructive w-full transition-all"
                      >
                        <LogOut className="w-5 h-5" />
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <Link href="/login">
                      <Button className="w-full btn-gaming rounded-xl py-4">
                        Sign In
                      </Button>
                    </Link>
                  )}
                </motion.div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Spacer for fixed header */}
      <div className="h-20" />
    </>
  );
}
