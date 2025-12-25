import { Switch, Route, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart-context";
import { AccessibilityProvider } from "./components/accessibility-mode";
import { ThemeProvider } from "./components/theme-provider";
import { TranslationProvider } from "./lib/translation";
import { AuthProvider, useAuth } from "./lib/auth-context";
import { useState } from "react";
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
