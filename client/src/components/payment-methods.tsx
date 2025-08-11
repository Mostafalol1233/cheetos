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
    <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-primary/20">
      <h3 className="text-xl font-bold text-foreground mb-6 text-center">
        Payment Methods We Accept
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {paymentMethods.map((method) => {
          return (
            <div
              key={method.id}
              className="flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 hover:-translate-y-2 hover:rotate-1 min-h-[80px] cursor-pointer group"
            >
              <img 
                src={method.image} 
                alt={method.name}
                className="w-8 h-8 mb-2 object-contain transition-transform duration-300 group-hover:scale-125"
              />
              <span className="text-xs font-medium text-center text-gray-700 dark:text-gray-300">
                {method.name}
              </span>
            </div>
          );
        })}
      </div>
      
      <p className="text-sm text-muted-foreground text-center mt-4">
        Secure payments through multiple trusted providers
      </p>
    </div>
  );
}