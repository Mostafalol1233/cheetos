import { CreditCard, Smartphone, Wallet, Banknote } from "lucide-react";

const paymentMethods = [
  { id: "instapay", name: "InstaPay", icon: Wallet, color: "text-blue-500" },
  { id: "mastercard", name: "Mastercard", icon: CreditCard, color: "text-red-500" },
  { id: "visa", name: "Visa", icon: CreditCard, color: "text-blue-600" },
  { id: "vodafone", name: "Vodafone Cash", icon: Smartphone, color: "text-red-600" },
  { id: "etisalat", name: "Etisalat Cash", icon: Smartphone, color: "text-green-500" },
  { id: "we", name: "WE Pay", icon: Smartphone, color: "text-purple-500" },
  { id: "orange", name: "Orange Money", icon: Banknote, color: "text-orange-500" },
];

export default function PaymentMethods() {
  return (
    <div className="relative bg-card/50 backdrop-blur-sm rounded-2xl p-6 border border-gold-primary/20">
      <h3 className="text-xl font-bold text-foreground mb-6 text-center">
        Payment Methods We Accept
      </h3>
      
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
        {paymentMethods.map((method) => {
          const IconComponent = method.icon;
          return (
            <div
              key={method.id}
              className="flex flex-col items-center justify-center bg-white/90 dark:bg-gray-800/90 rounded-xl p-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 min-h-[80px]"
            >
              <IconComponent className={`w-8 h-8 ${method.color} mb-2`} />
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