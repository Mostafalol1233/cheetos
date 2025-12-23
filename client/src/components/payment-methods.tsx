import { CreditCard, Smartphone, Wallet, Banknote } from "lucide-react";

const paymentMethods = [
  { 
    id: "visa", 
    name: "Visa", 
    image: "/attached_assets/image_32_1754945434846.png",
    color: "text-blue-600" 
  },
  { 
    id: "mastercard", 
    name: "Mastercard", 
    image: "/attached_assets/image_31_1754945434846.png",
    color: "text-red-500" 
  },
  { 
    id: "vodafone", 
    name: "Vodafone Cash", 
    image: "/attached_assets/image_33_1754945434846.png",
    color: "text-red-600" 
  },
  { 
    id: "orange", 
    name: "Orange Money", 
    image: "/attached_assets/image_36_1754945434846.png",
    color: "text-orange-500" 
  },
  { 
    id: "etisalat", 
    name: "Etisalat Cash", 
    image: "/attached_assets/image_34_1754945434846.png",
    color: "text-green-500" 
  },
  { 
    id: "instapay", 
    name: "InstaPay", 
    image: "/attached_assets/image_29_1754945434846.png",
    color: "text-blue-500" 
  },
  { 
    id: "cib", 
    name: "CIB Bank", 
    image: "/attached_assets/image_30_1754945434846.png",
    color: "text-blue-700" 
  },
  { 
    id: "we", 
    name: "WE Pay", 
    image: "/attached_assets/image_35_1754945434846.png",
    color: "text-purple-500" 
  },
];

export default function PaymentMethods() {
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
          <div className="flex animate-scroll-rtl space-x-6">
            {/* First set of payment methods */}
            {paymentMethods.map((method, index) => (
              <div 
                key={`first-${method.name}`}
                className="bg-darker-bg p-4 rounded-lg border border-gray-800 hover:border-gold-primary transition-all duration-300 hover:scale-105 flex flex-col items-center group min-w-[120px] flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform duration-300 filter brightness-75 contrast-125"
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
                className="bg-darker-bg p-4 rounded-lg border border-gray-800 hover:border-gold-primary transition-all duration-300 hover:scale-105 flex flex-col items-center group min-w-[120px] flex-shrink-0"
              >
                <img 
                  src={method.image} 
                  alt={method.name}
                  className="w-12 h-12 object-contain mb-2 group-hover:scale-110 transition-transform duration-300 filter brightness-75 contrast-125"
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
