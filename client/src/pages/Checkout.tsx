import React, { useEffect } from 'react';
import { useCheckout } from '@/state/checkout';
import { useCart } from '@/lib/cart-context';
import { StepDetails } from '@/components/checkout/StepDetails';
import { StepPayment } from '@/components/checkout/StepPayment';
import { StepReview } from '@/components/checkout/StepReview';
import { StepProcessing } from '@/components/checkout/StepProcessing';
import { StepResult } from '@/components/checkout/StepResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { useUserAuth } from "@/lib/user-auth-context";
import { useLocation } from "wouter";

const steps = [
  { key: 'details', label: 'Details', component: StepDetails },
  { key: 'payment', label: 'Payment', component: StepPayment },
  { key: 'review', label: 'Review', component: StepReview },
  { key: 'processing', label: 'Processing', component: StepProcessing },
  { key: 'result', label: 'Result', component: StepResult },
];

import { Link } from "wouter";

export function CheckoutContent({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { step, setStep, cart, setCart, contact, paymentMethod, error } = useCheckout();
  const { cart: globalCart } = useCart();
  const { isAuthenticated, user } = useUserAuth();
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
        console.error("Failed to parse checkout package", e);
      }
    } else if (globalCart.length > 0) {
      // Sync checkout cart with global cart
      setCart(globalCart);
    }
  }, [globalCart, setCart]);

  const currentStepIndex = steps.findIndex(s => s.key === step);
  // Default to details if step is 'cart' (legacy) or invalid
  const currentStep = steps[currentStepIndex] || steps[0];
  const progress = ((currentStepIndex + 1) / (steps.length - 2)) * 100; // Exclude processing and result

  useEffect(() => {
    // Redirect if cart is empty and not on result step
    // But give it a moment to load from localStorage
    const timer = setTimeout(() => {
      if (cart.length === 0 && step !== 'result') {
        // Optional: setLocation('/'); 
      }
    }, 500);
    return () => clearTimeout(timer);
  }, [cart, step]);

  // If step is 'cart' which we removed, go to 'details'
  useEffect(() => {
    if (step === 'cart') {
      setStep('details');
    }
  }, [step, setStep]);

  const canGoNext = () => {
    switch (step) {
      case 'details':
        return contact.fullName && contact.email && contact.phone;
      case 'payment':
        return paymentMethod;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const handleNext = () => {
    if (canGoNext()) {
      const nextIndex = Math.min(currentStepIndex + 1, steps.length - 1);
      setStep(steps[nextIndex].key as any);
    }
  };

  const handleBack = () => {
    if (currentStepIndex > 0) {
      setStep(steps[currentStepIndex - 1].key as any);
    }
  };

  const StepComponent = currentStep.component;

  // if (!isAuthenticated) {
  //   return null; // or a loading spinner while redirecting
  // }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {!isEmbedded && (
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-6">Checkout</h1>
              {/* Progress Bar */}
              <div className="relative mb-8">
                <Progress value={progress} className="h-2" />
                <div className="absolute top-0 left-0 w-full flex justify-between -mt-2">
                  {steps.slice(0, 3).map((s, i) => ( // Show first 3 steps in progress bar
                    <div
                      key={s.key}
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i <= currentStepIndex ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                        }`}
                    >
                      {i + 1}
                    </div>
                  ))}
                </div>
                <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                  {steps.slice(0, 3).map((s) => (
                    <span key={s.key}>{s.label}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          <Card>
            <CardContent className="p-6">
              <StepComponent
                onNext={handleNext}
                onBack={handleBack}
                canGoNext={canGoNext()}
              />
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