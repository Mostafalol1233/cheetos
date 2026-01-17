import { useEffect, useState } from "react";

const paymentMethods = [
  { id: "pm1", name: "Vodafone Cash", image: "/payments/vodafone-logo.png" },
  { id: "pm2", name: "InstaPay", image: "/payments/instapay-logo.png" },
  { id: "pm3", name: "Etisalat Cash", image: "/payments/etisalat-logo.png" },
  { id: "pm4", name: "Orange Cash", image: "/payments/orange-logo-new.png" },
  { id: "pm5", name: "We Pay", image: "/payments/we-pay-logo.png" },
  { id: "pm6", name: "PayPal", image: "/payments/paypal-logo.png" },
];

export default function PaymentMethods() {
  const [reduceMotion, setReduceMotion] = useState(false);
  useEffect(() => {
    try {
      const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
      const handler = () => setReduceMotion(Boolean(mq.matches));
      handler();
      mq.addEventListener?.('change', handler);
      return () => mq.removeEventListener?.('change', handler);
    } catch { }
  }, []);
  return (
    <div className="bg-background py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-foreground mb-2">
          Payment Methods We Accept
        </h2>
        <p className="text-muted-foreground text-center mb-12">
          Secure payments through multiple trusted providers
        </p>

        {/* Continuous scrolling container - Images Only */}
        <div className="relative overflow-hidden">
          <div className={`flex ${reduceMotion ? '' : 'animate-scroll-rtl'} gap-8`}>
            {/* First set of payment methods - Images Only */}
            {paymentMethods.map((method, index) => (
              <div
                key={`first-${method.name}`}
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-card shadow-sm px-6 py-4">
                <img
                  src={method.image}
                  alt={method.name}
                  className="w-20 h-12 md:h-16 object-contain opacity-80 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}

            {/* Duplicate set for seamless loop - Images Only */}
            {paymentMethods.map((method, index) => (
              <div
                key={`second-${method.name}`}
                className="flex-shrink-0 flex items-center justify-center rounded-2xl bg-card shadow-sm px-6 py-4">
                <img
                  src={method.image}
                  alt={method.name}
                  className="w-20 h-12 md:h-16 object-contain opacity-80 hover:opacity-100 transition-all duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
