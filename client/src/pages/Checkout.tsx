import React, { useEffect } from 'react';
import { useCheckout } from '@/state/checkout';
import { useCart } from '@/lib/cart-context';
import { StepCart } from './checkout/StepCart';
import { StepDetails } from './checkout/StepDetails';
import { StepPayment } from './checkout/StepPayment';
import { StepReview } from './checkout/StepReview';
import { StepProcessing } from './checkout/StepProcessing';
import { StepResult } from './checkout/StepResult';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const steps = [
  { key: 'cart', label: 'Cart', component: StepCart },
  { key: 'details', label: 'Details', component: StepDetails },
  { key: 'payment', label: 'Payment', component: StepPayment },
  { key: 'review', label: 'Review', component: StepReview },
  { key: 'processing', label: 'Processing', component: StepProcessing },
  { key: 'result', label: 'Result', component: StepResult },
];

export default function Checkout() {
  const { step, setStep, cart, setCart, contact, paymentMethod, error } = useCheckout();
  const { cart: globalCart } = useCart();

  useEffect(() => {
    // Sync checkout cart with global cart on mount
    if (globalCart.length > 0 && cart.length === 0) {
      setCart(globalCart);
    }
  }, [globalCart, cart, setCart]);

  const currentStepIndex = steps.findIndex(s => s.key === step);
  const currentStep = steps[currentStepIndex];
  const progress = ((currentStepIndex + 1) / (steps.length - 2)) * 100; // Exclude processing and result

  useEffect(() => {
    // Redirect if cart is empty and not on result step
    if (cart.length === 0 && step !== 'result') {
      setStep('cart');
    }
  }, [cart, step, setStep]);

  const canGoNext = () => {
    switch (step) {
      case 'cart':
        return cart.length > 0;
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

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Progress Bar */}
          {step !== 'processing' && step !== 'result' && (
            <div className="mb-8">
              <div className="flex justify-between mb-2">
                {steps.slice(0, -2).map((s, i) => (
                  <span
                    key={s.key}
                    className={`text-sm ${
                      i <= currentStepIndex ? 'text-primary font-semibold' : 'text-muted-foreground'
                    }`}
                  >
                    {s.label}
                  </span>
                ))}
              </div>
              <Progress value={progress} className="h-2" />
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
                    <div className="space-y-2">
                      {cart.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span>{item.name} × {item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                    <div className="border-t mt-4 pt-4">
                      <div className="flex justify-between font-semibold">
                        <span>Total:</span>
                        <span>${cart.reduce((sum, item) => sum + item.price * item.quantity, 0).toFixed(2)}</span>
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
              >
                <ChevronLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              {step !== 'review' && (
                <Button onClick={handleNext} disabled={!canGoNext()}>
                  Next
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive rounded-md">
              <p className="text-destructive">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}