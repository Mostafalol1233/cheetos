import React, { useEffect } from 'react';
import { useCheckout } from '@/state/checkout';
import { useCart } from '@/lib/cart-context';
import { StepDetails } from '@/components/checkout/StepDetails';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useUserAuth } from "@/lib/user-auth-context";
import { useLocation } from "wouter";

const steps: { key: string; label: string; component: React.ComponentType<any> }[] = [
  { key: 'details', label: 'Details', component: StepDetails },
];

export function CheckoutContent({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { step, setStep, cart, setCart } = useCheckout();
  const { cart: globalCart } = useCart();
  const [, setLocation] = useLocation();

  useEffect(() => {
    // Check for single package checkout
    const checkoutPackageJson = localStorage.getItem('checkout_package');
    if (checkoutPackageJson) {
      try {
        const pkg = JSON.parse(checkoutPackageJson);
        setCart([{
          id: `${pkg.gameId}-${pkg.packageIndex}`,
          name: `${pkg.gameName} - ${pkg.packageName}`,
          price: pkg.price,
          quantity: 1,
          image: pkg.gameImage,
          gameId: pkg.gameId
        }]);
      } catch (e) {
        // console.error("Failed to parse checkout package", e);
      }
    } else if (globalCart.length > 0) {
      // Sync checkout cart with global cart
      setCart(globalCart);
    }
  }, [globalCart, setCart]);

  useEffect(() => {
    // Redirect if cart is empty
    const timer = setTimeout(() => {
      if (cart.length === 0) {
        // Optional: setLocation('/'); 
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cart]);

  // Always reset to details on mount since it's the only step
  useEffect(() => {
      setStep('details');
  }, [setStep]);

  const handleStartOver = () => {
    const { reset } = useCheckout.getState();
    reset(); // Clear state
    localStorage.removeItem('checkout_package');
    window.location.reload();
  };

  const StepComponent = steps[0].component;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            {!isEmbedded && <h1 className="text-3xl font-bold">Checkout</h1>}
            <Button variant="ghost" size="sm" onClick={handleStartOver} className="text-muted-foreground hover:text-destructive">
              Start Over
            </Button>
          </div>

          <Card>
            <CardContent className="p-6">
              <StepComponent />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutContent />;
}
