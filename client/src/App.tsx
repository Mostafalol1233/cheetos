import { Switch, Route, useLocation } from "wouter";
import { queryClient, API_BASE_URL, apiRequest } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart-context";
import { AccessibilityProvider } from "./components/accessibility-mode";
import { ThemeProvider } from "./components/theme-provider";
import { TranslationProvider } from "./lib/translation";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { useState, useEffect } from "react";
import Home from "./pages/home";
import GamePage from "./pages/game";
import AdminDashboard from "./pages/admin";
import AdminLoginPage from "./pages/admin-login";
import AdminPackagesPage from "./pages/admin-packages";
import CategoryPage from "./pages/category";
import GamesPage from "./pages/games";
import SupportPage from "./pages/support";
import CheckoutSecurityPage from "./pages/checkout-security";
import NotFound from "@/pages/not-found";
import QrLoginPage from "./pages/qr-login";
import QrConfirmPage from "./pages/qr-confirm";
import FAQPage from "./pages/faq";
import TermsPage from "./pages/terms";
import PrivacyPage from "./pages/privacy";
import RefundsPage from "./pages/refunds";
import TrackOrderPage from "./pages/track-order";
import { LiveChatWidget } from "@/components/live-chat-widget";
import { Header } from "@/components/header";
import { CartSidebar } from "@/components/cart-sidebar";
import { CheckoutModal } from "@/components/checkout-modal";
import { ChristmasSnow } from "@/components/christmas-snow";

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

  function Router() {
    return (
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/games" component={GamesPage} />
        <Route path="/support" component={SupportPage} />
        <Route path="/checkout/security/:id" component={CheckoutSecurityPage} />
        <Route path="/admin/login" component={AdminLoginPage} />
        <Route path="/admin/packages/:gameId" component={AdminPackagesPage} />
        {/* QR login removed */}
        <Route path="/admin" component={ProtectedAdminRoute} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/game/:slug" component={GamePage} />
        <Route path="/faq" component={FAQPage} />
        <Route path="/terms" component={TermsPage} />
        <Route path="/privacy" component={PrivacyPage} />
        <Route path="/refunds" component={RefundsPage} />
        <Route path="/track-order" component={TrackOrderPage} />

        <Route component={NotFound} />
      </Switch>
    );
  }

function AppShell() {
  const [location] = useLocation();
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const isAdminRoute = location === "/admin" || location.startsWith("/admin/") || location === "/admin/login";
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
      apiRequest("POST", "/api/metrics/interaction", { event_type: "click", element, page, success: true, ua }).catch(() => {});
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
      } catch {}
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
      if (entries.length) apiRequest("POST", "/api/metrics/perf", { entries, ua: navigator.userAgent }).catch(() => {});
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

  return (
    <>
      {!isAdminRoute ? <Header onCartClick={() => setIsCartOpen(true)} /> : null}

      <div className={!isAdminRoute && !isHomeRoute ? "pt-24" : ""}>
        <Router />
      </div>

      {!isAdminRoute ? (
        <>
          <CartSidebar
            isOpen={isCartOpen}
            onClose={() => setIsCartOpen(false)}
            onCheckout={() => {
              setIsCartOpen(false);
              setIsCheckoutOpen(true);
            }}
          />
          <CheckoutModal isOpen={isCheckoutOpen} onClose={() => setIsCheckoutOpen(false)} />
        </>
      ) : null}

      <LiveChatWidget />
      <ChristmasSnow />
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <TranslationProvider>
          <AuthProvider>
            <AccessibilityProvider>
              <TooltipProvider>
                <CartProvider>
                  <Toaster />
                  <AppShell />
                </CartProvider>
              </TooltipProvider>
            </AccessibilityProvider>
          </AuthProvider>
        </TranslationProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
