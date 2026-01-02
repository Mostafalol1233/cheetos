import { useEffect, useState } from "react";

const paymentMethods = [
  { id: "pm1", name: "Vodafone Cash", image: "https://upload.wikimedia.org/wikipedia/commons/1/1f/Vodafone_icon.svg" },
  { id: "pm2", name: "Orange Cash", image: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Orange_logo.svg" },
  { id: "pm3", name: "Etisalat Cash", image: "https://upload.wikimedia.org/wikipedia/commons/1/1b/Etisalat_logo.svg" },
  { id: "pm4", name: "WE Pay", image: "https://upload.wikimedia.org/wikipedia/commons/9/96/Telecom_Egypt_logo.svg" },
  { id: "pm5", name: "InstaPay", image: "https://upload.wikimedia.org/wikipedia/commons/7/7b/Instapay_logo.svg" },
  { id: "pm6", name: "PayPal", image: "https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" },
  { id: "pm7", name: "Visa", image: "https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" },
  { id: "pm8", name: "Mastercard", image: "https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" },
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
    } catch {}
  }, []);
  return (
    <div className="bg-dark-bg py-16 overflow-hidden">
      <div className="container mx-auto px-4">
        <h2 className="text-3xl font-bold text-center text-white mb-2">
          Payment Methods We Accept
        </h2>
        <p className="text-gray-400 text-center mb-12">
          Secure payments through multiple trusted providers
        </p>
        
        {/* Continuous scrolling container */}
        <div className="relative">
          <div className={`flex ${reduceMotion ? '' : 'animate-scroll-rtl'} space-x-6`}>
            {/* First set of payment methods */}
            {paymentMethods.map((method, index) => (
              <div 
                key={`first-${method.name}`}
                className="bg-darker-bg p-4 rounded-lg border border-gray-800 hover:border-gold-primary transition-all duration-300 flex flex-col items-center group min-w-[120px] flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-12 h-12 object-contain mb-2 filter brightness-75 contrast-125"
                />
                <span className="text-xs text-gray-300 text-center font-medium group-hover:text-gold-primary transition-colors duration-300">
                  {method.name}
                </span>
              </div>
            ))}
            
            {/* Duplicate set for seamless loop */}
            {paymentMethods.map((method, index) => (
              <div 
                key={`second-${method.name}`}
                className="bg-darker-bg p-4 rounded-lg border border-gray-800 hover:border-gold-primary transition-all duration-300 flex flex-col items-center group min-w-[120px] flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-12 h-12 object-contain mb-2 filter brightness-75 contrast-125"
                />
                <span className="text-xs text-gray-300 text-center font-medium group-hover:text-gold-primary transition-colors duration-300">
                  {method.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
