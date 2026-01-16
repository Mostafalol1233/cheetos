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
    if (!isAuthenticated) {
      setLocation('/user-login?redirect=/checkout');
    }
  }, [isAuthenticated, setLocation]);

  useEffect(() => {
    // Sync checkout cart with global cart on mount
    if (globalCart.length > 0) {
      setCart(globalCart);
    }
  }, [globalCart, setCart]);

  const currentStepIndex = steps.findIndex(s => s.key === step);
  // Default to details if step is 'cart' (legacy) or invalid
  const currentStep = steps[currentStepIndex] || steps[0]; 
  const progress = ((currentStepIndex + 1) / (steps.length - 2)) * 100; // Exclude processing and result

  useEffect(() => {
    // Redirect if cart is empty and not on result step
    if (cart.length === 0 && step !== 'result') {
      // If global cart is also empty, maybe redirect to home? 
      // But for now just stay or maybe redirect to home.
      if (globalCart.length === 0) {
          // Optional: setLocation('/'); 
      }
    }
    
    // If step is 'cart' which we removed, go to 'details'
    if (step === 'cart') {
        setStep('details');
    }
  }, [cart, step, setStep, globalCart]);

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

  if (!isAuthenticated) {
      return null; // or a loading spinner while redirecting
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Stepper Header */}
          {step !== 'processing' && step !== 'result' && (
            <div className="mb-8">
              <nav aria-label="Checkout steps" className="mb-6">
                <ol className="flex items-center justify-center space-x-4">
                  {steps.slice(0, -2).map((s, i) => {
                    const isCompleted = i < currentStepIndex;
                    const isCurrent = i === currentStepIndex;
                    return (
                      <li key={s.key} className="flex items-center">
                        <div className={`flex items-center justify-center w-8 h-8 rounded-full ${
                          isCompleted ? 'bg-primary text-primary-foreground' :
                          isCurrent ? 'bg-primary text-primary-foreground' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <span className="text-sm font-medium">{i + 1}</span>
                          )}
                        </div>
                        <span className={`ml-2 text-sm font-medium ${
                          isCurrent ? 'text-primary' : isCompleted ? 'text-foreground' : 'text-muted-foreground'
                        }`}>
                          {s.label}
                        </span>
                        {i < steps.length - 3 && (
                          <ChevronRight className="w-4 h-4 mx-2 text-muted-foreground" />
                        )}
                      </li>
                    );
                  })}
                </ol>
              </nav>
              <Progress value={progress} className="h-2" aria-label={`Step ${currentStepIndex + 1} of ${steps.length - 2}`} />
            </div>
          )}

          {/* Main Content */}
          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <StepComponent />
                </CardContent>
              </Card>
            </div>

            {/* Order Summary Sidebar */}
            {step !== 'processing' && step !== 'result' && (
              <div className="lg:col-span-1">
                <Card className="sticky top-4">
                  <CardContent className="p-4">
                    <h3 className="font-semibold mb-4">Order Summary</h3>
                    <div className="space-y-2 mb-4">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>EGP {(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t pt-4">
                      <div className="flex justify-between font-semibold text-lg">
                        <span>Total:</span>
                        <span>EGP {cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Navigation */}
          {step !== 'processing' && step !== 'result' && (
            <div className="flex justify-between mt-8">
              <Button
                variant="outline"
                onClick={handleBack}
                disabled={currentStepIndex === 0}
                aria-label="Go to previous step"
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {step !== 'review' && (
                <Button
                  onClick={handleNext}
                  disabled={!canGoNext()}
                  aria-label="Go to next step"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div
              role="alert"
              aria-live="assertive"
              className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md"
            >
              <p className="text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}