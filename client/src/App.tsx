import { Switch, Route, useLocation } from "wouter";
import { queryClient, API_BASE_URL, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart-context";
import { AccessibilityProvider } from "./components/accessibility-mode";
import { ThemeProvider } from "./components/theme-provider";
import { SettingsProvider } from "./lib/settings-context";
import { TranslationProvider } from "./lib/translation";
import { LocalizationProvider } from "./lib/localization";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { UserAuthProvider } from "./lib/user-auth-context";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import Home from "./pages/home";
import GamePage from "./pages/game";
import AdminDashboard from "./pages/admin";
import AdminLoginPage from "./pages/admin-login";
import CategoryPage from "./pages/category";
import GamesPage from "./pages/games";
import PacksPage from "./pages/packs";
import SupportPage from "./pages/support";
import UserLoginPage from "./pages/user-login";
import UserProfilePage from "./pages/user-profile";
import NotFound from "@/pages/not-found";
import FAQPage from "./pages/faq";
import TermsPage from "./pages/terms";
import PrivacyPage from "./pages/privacy";
import RefundsPage from "./pages/refunds";
import Checkout from "./pages/Checkout";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { FloatingWhatsAppButton } from "@/components/floating-whatsapp-button";
import { Header } from "@/components/header";
import { CartSidebar } from "@/components/cart-sidebar";
import { Analytics } from "@vercel/analytics/react";

import PackageDetailsPage from "./pages/package-details";
import PackageCheckoutPage from "./pages/package-checkout";
import MaintenancePage from "./pages/maintenance";

// Protected admin route component
function ProtectedAdminRoute() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p>Loading...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    window.location.href = "/admin/login";
    return null;
  }

  return <AdminDashboard />;
}

import { ScrollToTop } from "@/components/scroll-to-top";

function Router() {
  return (
    <div className="">
      <ScrollToTop />
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/games" component={GamesPage} />
        <Route path="/packs" component={PacksPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/checkout" component={Checkout} />
        {/* <Route path="/checkout/security/:id" component={CheckoutSecurityPage} /> Legacy */}
        <Route path="/login" component={UserLoginPage} />
        <Route path="/profile" component={UserProfilePage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        {/* QR login removed */}
        <Route path="/admin" component={ProtectedAdminRoute} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/game/:slug" component={GamePage} />
        <Route path="/package/:gameSlug/:packageIndex" component={PackageCheckoutPage} />
        <Route path="/packages/:slug" component={PackageDetailsPage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refunds" component={RefundsPage} />

        <Route component={NotFound} />
      </Switch>
    </div>
  );
}

function AppShell() {
  const [location] = useLocation();
  const { toast } = useToast();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const [healthState, setHealthState] = useState<{
    ok: boolean;
    checking: boolean;
    reason?: string;
  }>({ ok: true, checking: true });

  const runHealthCheck = async () => {
    setHealthState((s) => ({ ...s, checking: true }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/health`, { cache: 'no-store' });
      if (!res.ok) {
        setHealthState({ ok: false, checking: false, reason: 'Backend or database is temporarily unavailable.' });
        return;
      }
      const data = await res.json().catch(() => ({} as any));
      const dbOk = (data as any)?.db?.ok;
      if (dbOk === false || (data as any)?.status === 'maintenance') {
        setHealthState({ ok: false, checking: false, reason: 'Database connection is currently unavailable.' });
        return;
      }
      setHealthState({ ok: true, checking: false });
    } catch {
      setHealthState({ ok: false, checking: false, reason: 'Cannot connect to backend server.' });
    }
  };

  useEffect(() => {
    const onDown = (e: any) => {
      const reason = e?.detail?.reason;
      setHealthState({ ok: false, checking: false, reason: reason ? String(reason) : 'Cannot connect to backend server.' });
    };
    window.addEventListener('backend:down', onDown);
    return () => window.removeEventListener('backend:down', onDown);
  }, []);

  useEffect(() => {
    runHealthCheck();
    const id = window.setInterval(() => {
      runHealthCheck();
    }, 15000);
    return () => window.clearInterval(id);
  }, []);

  // Global credentials popup for guest-checkout auto-account creation.
  // Keeps showing on any page until user clicks X.
  useEffect(() => {
    try {
      const raw = localStorage.getItem('new_user_creds');
      if (!raw) return;
      const creds = JSON.parse(raw);
      if (!creds?.email || !creds?.password) return;

      toast({
        title: 'Account created - save your credentials',
        description: (
          <div className="space-y-2">
            <div className="text-xs break-all">
              <span className="opacity-80">Email:</span> {String(creds.email)}
            </div>
            <div className="text-xs break-all">
              <span className="opacity-80">Password:</span> {String(creds.password)}
            </div>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(String(creds.email)).catch(() => {})}
              >
                Copy Email
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigator.clipboard.writeText(String(creds.password)).catch(() => {})}
              >
                Copy Password
              </Button>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => {
                  localStorage.removeItem('new_user_creds');
                  // Show a tiny confirmation
                  toast({ title: 'Saved', description: 'Credentials popup closed.', duration: 1500 });
                }}
              >
                X
              </Button>
            </div>
            <div className="text-[11px] opacity-80">
              This message will keep appearing until you close it.
            </div>
          </div>
        ) as any,
        duration: 600000, // 10 minutes
        className: 'border border-green-500/40 bg-green-950 text-white'
      });
    } catch {
    }
  }, [toast, location]);

  const isAdminRoute = location === "/admin" || location.startsWith("/admin/") || location === "/admin/login";
  const isProfileRoute = location === "/profile";
  const isHomeRoute = location === "/" || location.startsWith("/#");

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      const target = (e.target as HTMLElement)?.closest("button, a, [role=button]") as HTMLElement | null;
      if (!target) return;
      const tag = target.tagName.toLowerCase();
      const label = target.getAttribute("aria-label") || target.textContent?.trim() || "";
      const element = label ? `${tag}:${label.slice(0, 120)}` : tag;
      const page = window.location.pathname;
      const ua = navigator.userAgent;
      apiRequest("POST", "/api/metrics/interaction", { event_type: "click", element, page, success: true, ua }).catch(() => { });
    };
    document.addEventListener("click", handler, { capture: true });
    return () => document.removeEventListener("click", handler, { capture: true } as any);
  }, []);

  useEffect(() => {
    const entries: { name: string; value: number; page: string }[] = [];
    const page = window.location.pathname;
    const observe = (type: string, cb: (entry: PerformanceEntry) => void) => {
      try {
        const po = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) cb(entry);
        });
        // @ts-ignore
        po.observe({ type, buffered: true });
      } catch { }
    };
    observe("paint", (e) => {
      if (e.name === "first-contentful-paint") entries.push({ name: "FCP", value: e.startTime, page });
    });
    observe("largest-contentful-paint", (e: any) => {
      const v = e.renderTime || e.loadTime || e.startTime;
      if (typeof v === "number") entries.push({ name: "LCP", value: v, page });
    });
    let clsTotal = 0;
    observe("layout-shift", (e: any) => {
      if (!e.hadRecentInput) clsTotal += e.value || 0;
    });
    const send = () => {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) entries.push({ name: "TTFB", value: nav.responseStart, page });
      if (clsTotal > 0) entries.push({ name: "CLS", value: clsTotal, page });
      if (entries.length) apiRequest("POST", "/api/metrics/perf", { entries, ua: navigator.userAgent }).catch(() => { });
    };
    const vis = () => {
      if (document.visibilityState === "hidden") send();
    };
    window.addEventListener("beforeunload", send);
    document.addEventListener("visibilitychange", vis);
    setTimeout(() => send(), 3000);
    return () => {
      window.removeEventListener("beforeunload", send);
      document.removeEventListener("visibilitychange", vis);
    };
  }, []);

  if (!healthState.ok && !isAdminRoute) {
    return <MaintenancePage reason={healthState.reason} onRetry={runHealthCheck} />;
  }

  return (
    <>
      {!isAdminRoute ? <Header /> : null}

      <div className={!isAdminRoute && !isHomeRoute ? "pt-24" : ""}>
        <Router />
      </div>


    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <SettingsProvider>
          <TranslationProvider>
            <LocalizationProvider>
              <AuthProvider>
                <UserAuthProvider>
                  <AccessibilityProvider>
                    <TooltipProvider>
                      <CartProvider>
                        <Toaster />
                        <Analytics />
                        <AppShell />
                      </CartProvider>
                    </TooltipProvider>
                  </AccessibilityProvider>
                </UserAuthProvider>
              </AuthProvider>
            </LocalizationProvider>
          </TranslationProvider>
        </SettingsProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
