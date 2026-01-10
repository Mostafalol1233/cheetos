import { useEffect, useState } from "react";

const paymentMethods = [
  { id: "pm1", name: "Payment 1", image: "https://i.postimg.cc/wRzp9C8N/image-29-1754874736252.png" },
  { id: "pm2", name: "Payment 2", image: "https://i.postimg.cc/tnbj9KQY/image-32-1754945434846.png" },
  { id: "pm3", name: "Payment 3", image: "https://i.postimg.cc/RJmBvk57/image-33-1754945434846.png" },
  { id: "pm4", name: "Payment 4", image: "https://i.postimg.cc/5QJVfhdk/image-34-1754945434846.png" },
  { id: "pm5", name: "Payment 5", image: "https://i.postimg.cc/JHQW0pM3/image-35-1754945434846.png" },
  { id: "pm6", name: "Payment 6", image: "https://i.postimg.cc/XBg0qs4h/image-36-1754945434846.png" },
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
        
        {/* Continuous scrolling container - Images Only */}
        <div className="relative overflow-hidden">
          <div className={`flex ${reduceMotion ? '' : 'animate-scroll-rtl'} gap-8`}>
            {/* First set of payment methods - Images Only */}
            {paymentMethods.map((method, index) => (
              <div 
                key={`first-${method.name}`}
                className="flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-20 h-20 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            ))}
            
            {/* Duplicate set for seamless loop - Images Only */}
            {paymentMethods.map((method, index) => (
              <div 
                key={`second-${method.name}`}
                className="flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-20 h-20 object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
