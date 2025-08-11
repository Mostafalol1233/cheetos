import { useRef, useEffect, useState } from "react";
import instapayLogo from "@assets/image_29_1754874736252.png";
import mastercardLogo from "@assets/image_31_1754874736252.png";
import visaLogo from "@assets/image_32_1754874736252.png";
import vodafoneLogo from "@assets/image_33_1754874736252.png";
import etisalatLogo from "@assets/image_34_1754874736252.png";
import wepayLogo from "@assets/image_35_1754874736252.png";
import orangeLogo from "@assets/image_36_1754874736252.png";

const paymentMethods = [
  { id: "instapay", name: "InstaPay", logo: instapayLogo },
  { id: "mastercard", name: "Mastercard", logo: mastercardLogo },
  { id: "visa", name: "Visa", logo: visaLogo },
  { id: "vodafone", name: "Vodafone Cash", logo: vodafoneLogo },
  { id: "etisalat", name: "Etisalat Cash", logo: etisalatLogo },
  { id: "we", name: "WE Pay", logo: wepayLogo },
  { id: "orange", name: "Orange Money", logo: orangeLogo },
];

export default function PaymentMethods() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isPaused, setIsPaused] = useState(false);

  // Auto-scroll animation
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let animationId: number;
    let scrollPosition = 0;
    const scrollSpeed = 0.5;

    const animate = () => {
      if (!isPaused && container) {
        scrollPosition += scrollSpeed;
        
        // Reset when we've scrolled past half the content (since we duplicated it)
        if (scrollPosition >= container.scrollWidth / 2) {
          scrollPosition = 0;
        }
        
        container.scrollLeft = scrollPosition;
      }
      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [isPaused]);

  return (
    <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-primary/20">
      <h3 className="text-xl font-bold text-foreground mb-4 text-center">
        Payment Methods We Accept
      </h3>
      
      <div 
        ref={containerRef}
        className="overflow-hidden relative"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-6 w-max animate-scroll">
          {/* First set of payment methods */}
          {paymentMethods.map((method) => (
            <div
              key={`first-${method.id}`}
              className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[120px]"
            >
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={method.logo}
                  alt={method.name}
                  className="h-8 w-auto object-contain"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                  {method.name}
                </span>
              </div>
            </div>
          ))}
          
          {/* Duplicate set for seamless loop */}
          {paymentMethods.map((method) => (
            <div
              key={`second-${method.id}`}
              className="flex-shrink-0 bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-w-[120px]"
            >
              <div className="flex flex-col items-center space-y-2">
                <img
                  src={method.logo}
                  alt={method.name}
                  className="h-8 w-auto object-contain"
                />
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300 text-center">
                  {method.name}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}