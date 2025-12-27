import { CreditCard, Smartphone, Wallet, Banknote } from "lucide-react";

const paymentMethods = [
  { 
    id: "visa", 
    name: "Visa", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%231434CB' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='20' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EVisa%3C/text%3E%3C/svg%3E",
    color: "text-blue-600" 
  },
  { 
    id: "mastercard", 
    name: "Mastercard", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23EB001B' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EMC%3C/text%3E%3C/svg%3E",
    color: "text-red-500" 
  },
  { 
    id: "vodafone", 
    name: "Vodafone Cash", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23EF0606' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='18' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EVF%3C/text%3E%3C/svg%3E",
    color: "text-red-600" 
  },
  { 
    id: "orange", 
    name: "Orange Money", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23FF6600' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EOM%3C/text%3E%3C/svg%3E",
    color: "text-orange-500" 
  },
  { 
    id: "etisalat", 
    name: "Etisalat Cash", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23009900' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EET%3C/text%3E%3C/svg%3E",
    color: "text-green-500" 
  },
  { 
    id: "instapay", 
    name: "InstaPay", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%230066CC' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EIP%3C/text%3E%3C/svg%3E",
    color: "text-blue-500" 
  },
  { 
    id: "cib", 
    name: "CIB Bank", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23003399' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='16' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3ECIB%3C/text%3E%3C/svg%3E",
    color: "text-blue-700" 
  },
  { 
    id: "we", 
    name: "WE Pay", 
    image: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 60'%3E%3Crect fill='%23660099' width='100' height='60'/%3E%3Ctext x='50%25' y='50%25' font-size='18' font-weight='bold' fill='%23fff' text-anchor='middle' dy='.3em'%3EWE%3C/text%3E%3C/svg%3E",
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
