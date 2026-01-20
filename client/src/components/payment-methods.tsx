import { useEffect, useState } from "react";
import { useCheckout } from "../state/checkout";
import { PaymentIcon } from "./payment-icon";

export default function PaymentMethods() {
  const { availablePaymentMethods, fetchPaymentMethods } = useCheckout();
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    fetchPaymentMethods();
  }, [fetchPaymentMethods]);

  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = () => setReduceMotion(Boolean(mq.matches));
      handler();
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    } catch { }
  }, []);

  if (availablePaymentMethods.length === 0) {
    return (
      <div className="bg-background py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">
            Payment methods are currently unavailable. Please try again later.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-foreground mb-2">
          Payment Methods We Accept
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          Secure payments through multiple trusted providers
        </p>

        {/* Continuous scrolling container - Icons Only */}
        <div className="relative overflow-hidden">
          <div className={`flex ${reduceMotion ? '' : 'animate-scroll-rtl'} gap-8`}>
            {/* First set of payment methods */}
            {availablePaymentMethods.map((method) => (
              <div
                key={`first-${method.key}`}
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-card shadow-sm px-8 py-6 min-w-[120px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <PaymentIcon methodKey={method.key} className="w-8 h-8" />
                  <span className="text-sm font-medium">{method.label}</span>
                </div>
              </div>
            ))}

            {/* Duplicate set for seamless loop */}
            {availablePaymentMethods.map((method) => (
              <div
                key={`second-${method.key}`}
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-card shadow-sm px-8 py-6 min-w-[120px]"
              >
                <div className="flex flex-col items-center gap-2">
                  <PaymentIcon methodKey={method.key} className="w-8 h-8" />
                  <span className="text-sm font-medium">{method.label}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
