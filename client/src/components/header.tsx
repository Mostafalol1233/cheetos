import { Link, useLocation } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut, Menu, X, Home, Grid3X3, MessageCircle, Package, Flame, Smartphone, Gift, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect } from "react";
import { useTranslation } from "@/lib/translation";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import type { Category } from "@shared/schema";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";

const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  "hot-deals":    Flame,
  "mobile-games": Smartphone,
  "gift-cards":   Gift,
  "online-games": Monitor,
};

const CATEGORY_COLOR_MAP: Record<string, string> = {
  "hot-deals":    "text-orange-400",
  "mobile-games": "text-purple-400",
  "gift-cards":   "text-emerald-400",
  "online-games": "text-blue-400",
};

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserAuth();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { settings } = useSettings();
  const [hasOrderNotification, setHasOrderNotification] = useState(false);

  const { data: navCategories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  // Load and sync order notification state
  useEffect(() => {
    const update = () => {
      const notif = localStorage.getItem('order_notification');
      if (notif) {
        try {
          const parsed = JSON.parse(notif);
          setHasOrderNotification(!!parsed.unread);
        } catch {
          setHasOrderNotification(false);
        }
      } else {
        setHasOrderNotification(false);
      }
    };
    update();
    const handleStorage = () => update();
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

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
                whileTap={{ scale: 1.98 }}
              >
                <div className="h-24 w-auto flex items-center">
                  <img
                    src="https://files.catbox.moe/brmkrj.png"
                    alt="GameCart Logo"
                    className="h-full w-auto max-h-24 object-contain hover:scale-105 transition-transform"
                  />
                </div>
                <div className="hidden flex items-center gap-3">
                  <div className="relative">
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-gold-primary to-gold-secondary flex items-center justify-center shadow-[0_0_20px_rgba(255,215,0,0.5)]">
                      <Gamepad2 className="w-5 h-5 text-black" />
                    </div>
                  </div>
                  <span className="text-xl md:text-2xl font-bold font-gaming tracking-wider">
                    <span className="bg-gradient-to-r from-gold-primary via-gold-accent to-gold-secondary bg-clip-text text-transparent drop-shadow-sm">
                      Diaa
                    </span>
                    <span className="text-foreground ml-1">Store</span>
                  </span>
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-4">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                return (
                  <Link key={link.href} href={link.href}>
                    <motion.div
                      className={cn(
                        "relative px-4 py-2 rounded-xl font-gaming tracking-widest text-lg transition-all duration-300 flex items-center gap-2",
                        isActive
                          ? "text-gold-primary"
                          : "text-muted-foreground hover:text-gold-primary hover:tracking-[0.2em]"
                      )}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <span className="relative inline-flex items-center">
                        {link.label}
                        {link.href === "/track-order" && hasOrderNotification && (
                          <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                        )}
                      </span>
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gold-primary/10 border border-gold-primary/40 rounded-xl -z-10"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                    </motion.div>
                  </Link>
                );
              })}

              {/* Categories Dropdown — dynamic from API */}
              <NavigationMenu>
                <NavigationMenuList>
                  <NavigationMenuItem>
                    <NavigationMenuTrigger className="bg-transparent font-gaming tracking-widest text-lg hover:bg-gold-primary/10 hover:text-gold-primary text-muted-foreground data-[state=open]:text-gold-primary">
                      {t('categories')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[420px] gap-2 p-4 md:w-[520px] md:grid-cols-2 bg-card border border-white/8 rounded-xl shadow-2xl">
                        {/* All Games shortcut */}
                        <li className="col-span-2">
                          <NavigationMenuLink asChild>
                            <Link
                              href="/games"
                              className="flex items-center gap-3 select-none rounded-xl bg-cyan-400/8 border border-cyan-400/20 px-4 py-3 no-underline outline-none hover:bg-cyan-400/15 transition-all group"
                            >
                              <div className="w-9 h-9 rounded-lg bg-cyan-400/15 border border-cyan-400/25 flex items-center justify-center shrink-0">
                                <Gamepad2 className="w-4 h-4 text-cyan-400" />
                              </div>
                              <div>
                                <div className="text-sm font-bold text-foreground group-hover:text-cyan-400 transition-colors">All Games</div>
                                <p className="text-xs text-muted-foreground">Browse our full collection of top-ups</p>
                              </div>
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        {/* Dynamic categories from API */}
                        {navCategories.map((cat) => {
                          const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                          const iconColor = CATEGORY_COLOR_MAP[cat.slug] || "text-cyan-400";
                          return (
                            <li key={cat.id}>
                              <Link href={`/category/${cat.slug}`}>
                                <NavigationMenuLink className="flex items-center gap-3 select-none rounded-xl p-3 leading-none no-underline outline-none hover:bg-white/5 transition-all group">
                                  <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
                                    <IconComp className="w-4 h-4" />
                                  </div>
                                  <div>
                                    <div className={`text-sm font-semibold leading-none text-foreground group-hover:${iconColor} transition-colors`}>{cat.name}</div>
                                    <p className="mt-1 line-clamp-1 text-xs leading-snug text-muted-foreground">{cat.description}</p>
                                  </div>
                                </NavigationMenuLink>
                              </Link>
                            </li>
                          );
                        })}
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
                  className="rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary transition-all duration-300"
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
                    <Button variant="ghost" size="sm" className="rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary relative">
                      <User className="mr-2 h-4 w-4" />
                      <span className="hidden sm:inline">{user?.name}</span>
                      {hasOrderNotification && (
                        <span className="absolute -top-1 -right-1 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                      )}
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
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login?tab=register">
                    <Button variant="ghost" className="rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary">
                      Sign Up
                    </Button>
                  </Link>
                  <Link href="/login">
                    <Button className="rounded-xl px-6 bg-gold-primary text-background hover:bg-gold-accent transition-colors">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary"
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
                            <span className="font-medium flex items-center">
                              {link.label}
                              {link.href === "/track-order" && hasOrderNotification && (
                                <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                              )}
                            </span>
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Categories Section — dynamic from API */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="pt-4 border-t border-border mt-4"
                  >
                    <p className="text-sm font-semibold text-muted-foreground px-4 mb-2">Categories</p>
                    <Link href="/games">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground">
                        <Gamepad2 className="w-4 h-4 text-cyan-400" />
                        All Games
                      </div>
                    </Link>
                    {navCategories.map((cat) => {
                      const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                      const iconColor = CATEGORY_COLOR_MAP[cat.slug] || "text-cyan-400";
                      return (
                        <Link key={cat.id} href={`/category/${cat.slug}`}>
                          <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground">
                            <IconComp className={`w-4 h-4 ${iconColor}`} />
                            {cat.name}
                          </div>
                        </Link>
                      );
                    })}
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
                        <div className="flex items-center gap-4 px-4 py-4 rounded-xl hover:bg-muted transition-all text-foreground relative">
                          <User className="w-5 h-5" />
                          <span className="font-medium">{user?.name || "Profile"}</span>
                          {hasOrderNotification && (
                            <span className="absolute top-3 right-3 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                          )}
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
                    <div className="space-y-3">
                      <Link href="/login">
                        <Button className="w-full btn-gaming rounded-xl py-4">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/login?tab=register">
                        <Button variant="outline" className="w-full rounded-xl py-4 border-gold-primary text-gold-primary hover:bg-gold-primary/10">
                          Sign Up
                        </Button>
                      </Link>
                    </div>
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
