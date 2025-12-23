import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart-context";
import { AccessibilityProvider } from "./components/accessibility-mode";
import { ThemeProvider } from "./components/theme-provider";
import { AuthProvider, useAuth } from "./lib/auth-context";
import Home from "./pages/home";
import GamePage from "./pages/game";
import AdminDashboard from "./pages/admin";
import AdminLoginPage from "./pages/admin-login";
import CategoryPage from "./pages/category";
import GamesPage from "./pages/games";
import SupportPage from "./pages/support";
import CheckoutSecurityPage from "./pages/checkout-security";
import NotFound from "@/pages/not-found";
import QrLoginPage from "./pages/qr-login";
import QrConfirmPage from "./pages/qr-confirm";
import { LiveChatWidget } from "@/components/live-chat-widget";

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
        {/* QR login removed */}
        <Route path="/admin" component={ProtectedAdminRoute} />
        <Route path="/category/:slug" component={CategoryPage} />
        <Route path="/game/:slug" component={GamePage} />

        <Route component={NotFound} />
      </Switch>
    );
  }

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <AuthProvider>
          <AccessibilityProvider>
            <TooltipProvider>
              <CartProvider>
                <Toaster />
                <Router />
                <LiveChatWidget />
              </CartProvider>
            </TooltipProvider>
          </AccessibilityProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
