import { Link, useLocation } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut, Menu, X, Home, Grid3X3, MessageCircle, Package, Flame, Smartphone, Gift, Monitor, ChevronRight } from "lucide-react";
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

const CATEGORY_BG_MAP: Record<string, string> = {
  "hot-deals":    "bg-orange-500/10 border-orange-500/20 hover:bg-orange-500/20",
  "mobile-games": "bg-purple-500/10 border-purple-500/20 hover:bg-purple-500/20",
  "gift-cards":   "bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20",
  "online-games": "bg-blue-500/10 border-blue-500/20 hover:bg-blue-500/20",
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
            ? "py-1.5 shadow-xl shadow-black/40 bg-black/98 border-b border-gold-primary/20"
            : "py-2 bg-gradient-to-b from-black/90 to-black/80 border-b border-white/8"
        )}
        style={{
          backdropFilter: 'none',
        }}
      >
        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-gold-primary/60 to-transparent" />
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={cn("flex items-center transition-all duration-300", isScrolled ? "h-14" : "h-16")}>
                  <img
                    src="https://files.catbox.moe/brmkrj.png"
                    alt="Diaa Store Logo"
                    className="h-full w-auto object-contain drop-shadow-[0_0_8px_rgba(212,175,55,0.4)] group-hover:drop-shadow-[0_0_12px_rgba(212,175,55,0.7)] transition-all duration-300"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/diaa-logo-new.png";
                    }}
                  />
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
                    <NavigationMenuTrigger className="bg-transparent font-gaming tracking-widest text-lg hover:bg-gold-primary/10 hover:text-gold-primary text-muted-foreground data-[state=open]:text-gold-primary data-[state=open]:bg-gold-primary/10">
                      {t('categories')}
                    </NavigationMenuTrigger>
                    <NavigationMenuContent>
                      <ul className="grid w-[440px] gap-2 p-4 md:w-[540px] md:grid-cols-2 bg-card border border-border/60 rounded-2xl shadow-2xl">
                        {/* All Games shortcut */}
                        <li className="col-span-2">
                          <NavigationMenuLink asChild>
                            <Link
                              href="/games"
                              className="flex items-center gap-3 select-none rounded-xl bg-gold-primary/8 border border-gold-primary/20 px-4 py-3 no-underline outline-none hover:bg-gold-primary/15 transition-all group"
                            >
                              <div className="w-10 h-10 rounded-xl bg-gold-primary/15 border border-gold-primary/25 flex items-center justify-center shrink-0">
                                <Gamepad2 className="w-5 h-5 text-gold-primary" />
                              </div>
                              <div className="flex-1">
                                <div className="text-sm font-bold text-foreground group-hover:text-gold-primary transition-colors">All Games</div>
                                <p className="text-xs text-muted-foreground mt-0.5">Browse our full collection of top-ups</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold-primary group-hover:translate-x-0.5 transition-all" />
                            </Link>
                          </NavigationMenuLink>
                        </li>
                        {/* Dynamic categories from API */}
                        {navCategories.map((cat) => {
                          const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                          const iconColor = CATEGORY_COLOR_MAP[cat.slug] || "text-gold-primary";
                          const bgStyle = CATEGORY_BG_MAP[cat.slug] || "bg-white/5 border-white/10 hover:bg-white/10";
                          return (
                            <li key={cat.id}>
                              <NavigationMenuLink asChild>
                                <Link href={`/category/${cat.slug}`}>
                                  <div className={`flex items-center gap-3 select-none rounded-xl border p-3 leading-none no-underline outline-none transition-all group cursor-pointer ${bgStyle}`}>
                                    <div className={`w-9 h-9 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
                                      <IconComp className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className={`text-sm font-semibold leading-none text-foreground group-hover:${iconColor} transition-colors`}>{cat.name}</div>
                                      <p className="mt-1 line-clamp-1 text-xs leading-snug text-muted-foreground">{cat.description}</p>
                                    </div>
                                    <ChevronRight className={`w-3.5 h-3.5 text-muted-foreground group-hover:${iconColor} group-hover:translate-x-0.5 transition-all opacity-0 group-hover:opacity-100`} />
                                  </div>
                                </Link>
                              </NavigationMenuLink>
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
                    <Button className="rounded-xl px-6 bg-gold-primary text-background hover:bg-gold-primary/90 transition-colors font-semibold">
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
              className="fixed inset-0 bg-black/60 z-40 lg:hidden"
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-card border-l border-border/60 z-50 lg:hidden overflow-y-auto shadow-2xl"
            >
              <div className="p-5">
                {/* Header */}
                <div className="flex items-center justify-between mb-7">
                  <div className="flex items-center gap-2">
                    <img
                      src="https://files.catbox.moe/brmkrj.png"
                      alt="Diaa Store Logo"
                      className="h-11 w-auto object-contain"
                      onError={(e) => { (e.target as HTMLImageElement).src = "/images/diaa-logo-new.png"; }}
                    />
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>

                {/* Navigation Links */}
                <nav className="space-y-1">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isActive = location === link.href;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.07 }}
                      >
                        <Link href={link.href}>
                          <div
                            className={cn(
                              "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200",
                              isActive
                                ? "bg-gold-primary/15 text-gold-primary border border-gold-primary/30"
                                : "hover:bg-muted text-foreground"
                            )}
                          >
                            <div className={cn(
                              "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                              isActive ? "bg-gold-primary/20" : "bg-muted"
                            )}>
                              <Icon className="w-4 h-4" />
                            </div>
                            <span className="font-medium flex items-center flex-1">
                              {link.label}
                              {link.href === "/track-order" && hasOrderNotification && (
                                <span className="ml-2 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                              )}
                            </span>
                            {isActive && <ChevronRight className="w-4 h-4 text-gold-primary" />}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Categories Section */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.28 }}
                    className="pt-5"
                  >
                    <div className="flex items-center gap-2 px-4 mb-3">
                      <div className="w-4 h-0.5 rounded-full bg-gold-primary/50" />
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Categories</p>
                    </div>

                    {/* All Games */}
                    <Link href="/games">
                      <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gold-primary/10 hover:text-gold-primary transition-all text-foreground group mb-1">
                        <div className="w-8 h-8 rounded-lg bg-gold-primary/10 flex items-center justify-center shrink-0">
                          <Gamepad2 className="w-4 h-4 text-gold-primary" />
                        </div>
                        <span className="font-medium flex-1">All Games</span>
                        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-gold-primary opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                      </div>
                    </Link>

                    {navCategories.map((cat, idx) => {
                      const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                      const iconColor = CATEGORY_COLOR_MAP[cat.slug] || "text-gold-primary";
                      const bgStyle = CATEGORY_BG_MAP[cat.slug] || "bg-white/5 border-white/10 hover:bg-white/10";
                      return (
                        <motion.div
                          key={cat.id}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.32 + idx * 0.06 }}
                        >
                          <Link href={`/category/${cat.slug}`}>
                            <div className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-muted transition-all text-foreground group mb-1">
                              <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 ${iconColor}`}>
                                <IconComp className="w-4 h-4" />
                              </div>
                              <span className="font-medium flex-1">{cat.name}</span>
                              <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                </nav>

                {/* User Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mt-6 pt-5 border-t border-border"
                >
                  {isAuthenticated ? (
                    <div className="space-y-2">
                      <Link href="/profile">
                        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted transition-all text-foreground relative group">
                          <div className="w-9 h-9 rounded-xl bg-gold-primary/15 border border-gold-primary/30 flex items-center justify-center">
                            <User className="w-4 h-4 text-gold-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{user?.name || "Profile"}</p>
                            <p className="text-xs text-muted-foreground">View profile</p>
                          </div>
                          {hasOrderNotification && (
                            <span className="absolute top-3 right-3 inline-flex h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_0_3px_rgba(248,113,113,0.4)]" />
                          )}
                        </div>
                      </Link>
                      <button
                        onClick={logout}
                        className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-destructive/10 text-destructive w-full transition-all"
                      >
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <LogOut className="w-4 h-4" />
                        </div>
                        <span className="font-medium">Sign Out</span>
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Link href="/login">
                        <Button className="w-full rounded-xl py-5 bg-gold-primary text-background hover:bg-gold-primary/90 font-semibold text-base">
                          Sign In
                        </Button>
                      </Link>
                      <Link href="/login?tab=register">
                        <Button variant="outline" className="w-full rounded-xl py-5 border-gold-primary/40 text-gold-primary hover:bg-gold-primary/10 font-medium text-base">
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
