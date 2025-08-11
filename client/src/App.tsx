import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CartProvider } from "./lib/cart-context";
import { AccessibilityProvider } from "./components/accessibility-mode";
import { ThemeProvider } from "./components/theme-provider";
import Home from "./pages/home";
import GamePage from "./pages/game";

import CategoryPage from "./pages/category";
import GamesPage from "./pages/games";
import SupportPage from "./pages/support";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/games" component={GamesPage} />
      <Route path="/support" component={SupportPage} />
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
        <AccessibilityProvider>
          <TooltipProvider>
            <CartProvider>
              <Toaster />
              <Router />
            </CartProvider>
          </TooltipProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
