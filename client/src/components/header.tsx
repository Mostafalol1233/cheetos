import { Link, useLocation } from "wouter";
import { Sun, Moon, Gamepad2, User, LogOut, Menu, X, Home, MessageCircle, ChevronRight, ChevronDown, Bell, Trophy, Flame, Smartphone, Gift, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LanguageCurrencySwitcher } from "@/components/language-currency-switcher";
import { useTheme } from "@/components/theme-provider";
import { useUserAuth } from "@/lib/user-auth-context";
import { useState, useEffect, useRef } from "react";
import { useTranslation } from "@/lib/translation";
import { useSettings } from "@/lib/settings-context";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/queryClient";
import type { Category } from "@shared/schema";
import { requestNotificationPermission, getNotificationPermission } from "@/lib/notification-service";


const CATEGORY_ICON_MAP: Record<string, React.ElementType> = {
  "hot-deals":    Flame,
  "mobile-games": Smartphone,
  "gift-cards":   Gift,
  "online-games": Monitor,
};

const CATEGORY_DESC: Record<string, string> = {
  "hot-deals":    "Best offers & discounts",
  "mobile-games": "Top-up directly to your account",
  "gift-cards":   "Steam, PSN, Xbox & more",
  "online-games": "PC & online game credits",
};

function NotificationButton() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const { data: announcement } = useQuery<{
    id: number; title: string; message: string; html_content: string | null;
    bg_color: string; text_color: string; icon: string; dismissible: boolean; created_at: number;
  } | null>({
    queryKey: ["announcement-active"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/announcements/active`);
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  useEffect(() => {
    if (!announcement) return;
    const key = `ann_dismissed_${announcement.id}`;
    if (localStorage.getItem(key)) setDismissed(s => new Set(s).add(announcement.id));
  }, [announcement?.id]);

  useEffect(() => {
    const handleOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const hasNew = !!(announcement && !dismissed.has(announcement.id));

  const handleDismissInPanel = () => {
    if (!announcement) return;
    localStorage.setItem(`ann_dismissed_${announcement.id}`, "1");
    setDismissed(s => new Set(s).add(announcement.id));
  };

  return (
    <div className="relative" ref={ref}>
      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setOpen(v => !v)}
          className={`rounded-xl transition-all duration-300 relative ${open ? 'text-gold-primary bg-gold-primary/10' : 'hover:bg-gold-primary/10 hover:text-gold-primary'}`}
        >
          <Bell className="h-5 w-5" />
          {hasNew && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 ring-2 ring-background animate-pulse" />
          )}
        </Button>
      </motion.div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full right-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50"
          >
            <div className="px-4 py-3 border-b border-border/60 bg-muted/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-3.5 h-3.5 text-gold-primary" />
                <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">الإشعارات</p>
              </div>
              {hasNew && <span className="text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full">جديد</span>}
            </div>

            {announcement && !dismissed.has(announcement.id) ? (
              <div className="p-3">
                <div
                  className="rounded-xl p-3.5 relative overflow-hidden"
                  style={{ backgroundColor: announcement.bg_color }}
                >
                  <div className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.07) 50%, transparent 60%)" }} />
                  <div className="flex items-start gap-2.5 relative">
                    <span className="text-2xl shrink-0 mt-0.5">{announcement.icon || "📢"}</span>
                    <div className="flex-1 min-w-0">
                      {announcement.title && (
                        <p className="text-xs font-black uppercase tracking-wider mb-1"
                          style={{ color: announcement.text_color, opacity: 0.75, fontFamily: "ui-monospace,monospace" }}>
                          {announcement.title}
                        </p>
                      )}
                      {announcement.html_content ? (
                        <div className="text-sm font-semibold leading-snug [&_a]:underline [&_a]:font-bold"
                          style={{ color: announcement.text_color }}
                          dangerouslySetInnerHTML={{ __html: announcement.html_content }} />
                      ) : (
                        <p className="text-sm font-semibold leading-snug" style={{ color: announcement.text_color }}>
                          {announcement.message}
                        </p>
                      )}
                    </div>
                    {announcement.dismissible && (
                      <button onClick={handleDismissInPanel}
                        className="shrink-0 rounded-full p-0.5 hover:bg-black/20 transition-colors"
                        style={{ color: announcement.text_color }}>
                        <X className="w-3.5 h-3.5 opacity-70" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-10 text-center text-muted-foreground text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-20" />
                <p>لا توجد إشعارات جديدة</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Header() {
  const { theme, setTheme } = useTheme();
  const { user, isAuthenticated, logout } = useUserAuth();
  const { t } = useTranslation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { settings } = useSettings();
  const [hasOrderNotification, setHasOrderNotification] = useState(false);

  /* ── Giveaway LIVE badge ── */
  const { data: giveawayCfg } = useQuery<{ draw_time?: string } | null>({
    queryKey: [`${API_BASE_URL}/api/giveaway/config`],
    staleTime: 60000,
    gcTime: Infinity,
  });
  const [isLive, setIsLive] = useState(false);
  useEffect(() => {
    if (!giveawayCfg?.draw_time) return;
    const check = () => {
      const now = Date.now();
      const drawMs = new Date(giveawayCfg.draw_time!).getTime();
      setIsLive(now >= drawMs && now < drawMs + 5 * 3600000);
    };
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [giveawayCfg?.draw_time]);

  const { data: navCategories = [] } = useQuery<Category[]>({
    queryKey: [`${API_BASE_URL}/api/categories`],
    queryFn: () => fetch(`${API_BASE_URL}/api/categories`).then(r => r.json()),
    staleTime: 5 * 60 * 1000,
  });

  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
    { href: "/world-cup", label: "كأس العالم", icon: Trophy, highlight: true },
    { href: "/support", label: t('support'), icon: MessageCircle },
  ];

  return (
    <>
      {/* Main Header */}
      <header
        className={cn(
          "w-full transition-all duration-300 border-b",
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

        {/* World Cup 2026 — subtle marquee strip just below the gold line */}
        <div className="absolute top-[2px] left-0 right-0 h-[22px] overflow-hidden pointer-events-none"
          style={{ background: "linear-gradient(90deg, transparent, rgba(201,168,76,0.04) 30%, rgba(201,168,76,0.04) 70%, transparent)" }}>
          <div className="flex items-center h-full gap-8 text-[9px] font-bold tracking-[0.25em] text-[#c9a84c]/30 uppercase whitespace-nowrap animate-[marquee_28s_linear_infinite]"
            style={{ width: "max-content" }}>
            {Array(8).fill(null).map((_, i) => (
              <span key={i} className="flex items-center gap-3">
                <Trophy className="w-2.5 h-2.5 inline-block" />
                FIFA World Cup 2026
                <span className="opacity-40">·</span>
                توقع النتيجة واربح
                <span className="opacity-40">·</span>
              </span>
            ))}
          </div>
        </div>
        
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            {/* Logo */}
            <Link href="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer group"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
              >
                <div className={cn("flex items-center transition-all duration-300", isScrolled ? "h-12 sm:h-14" : "h-20 sm:h-24")}>
                  <img
                    src="https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/diaa-store-logo.png"
                    alt="Diaa Store Logo"
                    className="h-full w-auto object-contain transition-all duration-300"
                    style={{ maxWidth: 'none' }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = "/images/diaa-logo-new.png";
                    }}
                  />
                </div>
              </motion.div>
            </Link>

            {/* Desktop Navigation — GitHub style */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((link) => {
                const isActive = location === link.href;
                const isWC = (link as any).highlight;
                return (
                  <Link key={link.href} href={link.href}>
                    <div className={cn(
                      "relative px-3 py-2 rounded-md text-sm font-semibold transition-colors cursor-pointer flex items-center gap-1.5",
                      isWC
                        ? isActive ? "text-[#c9a84c]" : "text-[#c9a84c]/70 hover:text-[#c9a84c]"
                        : isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-white/5"
                    )}>
                      {isWC && <Trophy className="w-3.5 h-3.5 shrink-0" />}
                      {link.label}
                      {link.href === "/track-order" && hasOrderNotification && (
                        <span className="inline-flex h-2 w-2 rounded-full bg-red-500" />
                      )}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full bg-gold-primary"
                          transition={{ type: "spring", bounce: 0.2, duration: 0.35 }}
                        />
                      )}
                    </div>
                  </Link>
                );
              })}

              {/* Categories Dropdown — GitHub mega style */}
              <div className="relative" ref={categoriesRef}>
                <button
                  onClick={() => setCategoriesOpen(v => !v)}
                  className={cn(
                    "px-3 py-1.5 rounded-md text-sm font-semibold transition-colors flex items-center gap-1.5 cursor-pointer",
                    categoriesOpen ? "text-foreground bg-white/8" : "text-muted-foreground hover:text-foreground hover:bg-white/6"
                  )}
                >
                  {t('categories')}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${categoriesOpen ? "rotate-180" : ""}`} />
                </button>
                <AnimatePresence>
                  {categoriesOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 6 }}
                      transition={{ duration: 0.12 }}
                      className="absolute top-full left-0 mt-2 w-80 bg-popover border border-border rounded-xl shadow-2xl overflow-hidden z-50"
                    >
                      {/* Panel header */}
                      <div className="px-4 py-3 border-b border-border/60 bg-muted/30">
                        <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest">Browse</p>
                      </div>

                      {/* All Games */}
                      <Link href="/games" onClick={() => setCategoriesOpen(false)}>
                        <div className="flex items-center gap-3.5 px-4 py-3.5 hover:bg-muted/60 transition-colors cursor-pointer group border-b border-border/40">
                          <div className="w-9 h-9 rounded-lg bg-gold-primary/12 flex items-center justify-center shrink-0 group-hover:bg-gold-primary/20 transition-colors">
                            <Gamepad2 className="w-4.5 h-4.5 text-gold-primary" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground">All Games</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Browse the complete catalog</p>
                          </div>
                          <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" />
                        </div>
                      </Link>

                      {/* Category items */}
                      {navCategories.map((cat) => {
                        const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                        const desc = CATEGORY_DESC[cat.slug] || "";
                        return (
                          <Link key={cat.id} href={`/category/${cat.slug}`} onClick={() => setCategoriesOpen(false)}>
                            <div className="flex items-center gap-3.5 px-4 py-3 hover:bg-muted/60 transition-colors cursor-pointer group">
                              <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-border transition-colors">
                                <IconComp className="w-4 h-4 text-foreground/60 group-hover:text-foreground transition-colors" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-foreground/90 group-hover:text-foreground">{cat.name}</p>
                                {desc && <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>}
                              </div>
                            </div>
                          </Link>
                        );
                      })}

                      {/* Footer */}
                      <div className="border-t border-border/60 bg-muted/20 px-4 py-2.5">
                        <Link href="/games" onClick={() => setCategoriesOpen(false)}>
                          <span className="text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
                            View all games <span className="text-gold-primary font-semibold">→</span>
                          </span>
                        </Link>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* LIVE badge — giveaway draw in progress */}
              {isLive && (
                <Link href="/giveaway">
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg cursor-pointer transition-colors"
                    style={{ background: "rgba(220,38,38,0.07)", border: "1px solid rgba(220,38,38,0.16)" }}
                    onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(220,38,38,0.13)"; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.background = "rgba(220,38,38,0.07)"; }}>
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-50"
                        style={{ background: "#ef4444" }} />
                      <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: "#ef4444" }} />
                    </span>
                    <span className="text-[11px] font-black tracking-[0.18em]"
                      style={{ color: "#f87171", fontFamily: "ui-monospace,monospace" }}>LIVE</span>
                  </div>
                </Link>
              )}
            </nav>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
              <LanguageCurrencySwitcher />

              {/* Push Notification Toggle */}
              <NotificationButton />

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="rounded-full hover:bg-muted"
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

              {/* User Auth */}
              {isAuthenticated ? (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/profile">
                    <Button variant="ghost" size="sm" className="rounded-full hover:bg-muted gap-2 pl-2 pr-4 relative">
                      <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="hidden sm:inline font-medium">{user?.name}</span>
                      {hasOrderNotification && (
                        <span className="absolute top-0 right-0 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-background" />
                      )}
                    </Button>
                  </Link>
                  <Button
                    onClick={logout}
                    variant="ghost"
                    size="icon"
                    className="rounded-full hover:bg-destructive/10 hover:text-destructive"
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="hidden md:flex items-center gap-2">
                  <Link href="/login?tab=register">
                    <Button variant="ghost" className="rounded-full hover:bg-muted font-medium">
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
              <div className="lg:hidden">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="rounded-full hover:bg-muted"
                >
                  <AnimatePresence mode="wait">
                    {isMobileMenuOpen ? (
                      <motion.div
                        key="close"
                        initial={{ rotate: -90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: 90, opacity: 0 }}
                      >
                        <X className="h-5 w-5" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="menu"
                        initial={{ rotate: 90, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        exit={{ rotate: -90, opacity: 0 }}
                      >
                        <Menu className="h-5 w-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Button>
              </div>
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
                      src="https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/diaa-store-logo.png"
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

                {/* Navigation Links — premium */}
                <nav className="space-y-1">
                  {navLinks.map((link, index) => {
                    const Icon = link.icon;
                    const isActive = location === link.href;
                    const isWC = (link as any).highlight;
                    return (
                      <motion.div
                        key={link.href}
                        initial={{ opacity: 0, x: 16 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.055, type: "spring", stiffness: 260, damping: 22 }}
                      >
                        <Link href={link.href}>
                          <div className={cn(
                            "relative flex items-center gap-3.5 px-4 py-3.5 rounded-xl overflow-hidden transition-all duration-200 cursor-pointer",
                            isActive ? "text-foreground" : isWC ? "text-[#c9a84c]/80 hover:text-[#c9a84c]" : "text-foreground/65 hover:text-foreground"
                          )}>
                            {/* active gradient sweep */}
                            {isActive && <div className="absolute inset-0 bg-gradient-to-r from-gold-primary/14 via-gold-primary/6 to-transparent pointer-events-none" />}
                            {/* active left accent bar */}
                            {isActive && <div className="absolute left-0 top-2.5 bottom-2.5 w-[3px] rounded-r-full bg-gold-primary" />}
                            {/* hover bg */}
                            {!isActive && <div className={cn("absolute inset-0 opacity-0 hover:opacity-100 rounded-xl transition-opacity", isWC ? "bg-[#c9a84c]/5" : "bg-white/4")} />}

                            <div className={cn(
                              "relative z-10 w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                              isActive ? "bg-gold-primary/18" : isWC ? "bg-[#c9a84c]/10" : "bg-white/6"
                            )}>
                              <Icon className={cn("w-[17px] h-[17px]", isActive ? "text-gold-primary" : isWC ? "text-[#c9a84c]" : "text-foreground/40")} />
                            </div>

                            <span className="relative z-10 font-semibold text-[14.5px] flex-1 leading-none">{link.label}</span>

                            {isWC && !isActive && (
                              <span className="relative z-10 text-[9px] font-black text-[#c9a84c]/45 uppercase tracking-[0.18em]">2026</span>
                            )}
                            {isActive && <ChevronRight className="relative z-10 w-3.5 h-3.5 text-gold-primary/40 shrink-0" />}
                          </div>
                        </Link>
                      </motion.div>
                    );
                  })}

                  {/* Categories */}
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.28 }}
                    className="pt-5"
                  >
                    <p className="text-[10px] font-black text-muted-foreground/45 uppercase tracking-[0.22em] px-4 mb-3">Categories</p>

                    {/* All Games — wide row */}
                    <Link href="/games">
                      <div className="flex items-center gap-3.5 px-4 py-3.5 rounded-xl bg-gold-primary/6 border border-gold-primary/14 hover:bg-gold-primary/10 hover:border-gold-primary/25 transition-all cursor-pointer group mb-3">
                        <div className="w-9 h-9 rounded-xl bg-gold-primary/15 flex items-center justify-center shrink-0 group-hover:bg-gold-primary/22 transition-colors">
                          <Gamepad2 className="w-4.5 h-4.5 text-gold-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-foreground">All Games</p>
                          <p className="text-[11px] text-muted-foreground/60 mt-0.5">Browse complete catalog</p>
                        </div>
                        <ChevronRight className="w-3.5 h-3.5 text-gold-primary/40 group-hover:text-gold-primary/70 transition-colors shrink-0" />
                      </div>
                    </Link>

                    {/* Category grid — 2 cols */}
                    <div className="grid grid-cols-2 gap-2">
                      {navCategories.map((cat, idx) => {
                        const IconComp = CATEGORY_ICON_MAP[cat.slug] || Gift;
                        const desc = CATEGORY_DESC[cat.slug] || "";
                        return (
                          <motion.div
                            key={cat.id}
                            initial={{ opacity: 0, scale: 0.93 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.32 + idx * 0.055 }}
                          >
                            <Link href={`/category/${cat.slug}`}>
                              <div className="flex flex-col gap-2.5 p-3.5 rounded-xl bg-white/[0.035] border border-white/8 hover:border-white/16 hover:bg-white/6 transition-all cursor-pointer group h-full">
                                <div className="w-9 h-9 rounded-lg bg-white/8 group-hover:bg-white/12 flex items-center justify-center transition-colors">
                                  <IconComp className="w-[18px] h-[18px] text-foreground/50 group-hover:text-foreground/80 transition-colors" />
                                </div>
                                <div>
                                  <p className="font-bold text-xs text-foreground/80 group-hover:text-foreground transition-colors leading-tight">{cat.name}</p>
                                  {desc && <p className="text-[10px] text-muted-foreground/50 mt-0.5 leading-tight">{desc}</p>}
                                </div>
                              </div>
                            </Link>
                          </motion.div>
                        );
                      })}
                    </div>
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
                        <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl hover:bg-muted transition-all text-foreground relative group cursor-pointer">
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
