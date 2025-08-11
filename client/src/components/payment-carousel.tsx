import { CreditCard, Smartphone, University, QrCode, Banknote } from "lucide-react";
import { 
  SiPaypal, 
  SiMastercard, 
  SiVisa
} from "react-icons/si";

const paymentMethods = [
  { icon: SiPaypal, name: "PayPal", bg: "bg-blue-600" },
  { icon: SiMastercard, name: "Mastercard", bg: "bg-red-500" },
  { icon: SiVisa, name: "Visa", bg: "bg-blue-700" },
  { icon: Smartphone, name: "Vodafone Cash", bg: "bg-red-600" },
  { icon: Smartphone, name: "Orange Money", bg: "bg-orange-500" },
  { icon: CreditCard, name: "We Pay", bg: "bg-green-600" },
  { icon: University, name: "Bank Transfer", bg: "bg-blue-600" },
  { icon: QrCode, name: "InstaPay", bg: "bg-purple-600" },
  { icon: CreditCard, name: "Meta Pay", bg: "bg-gray-800" },
  { icon: Banknote, name: "Cash", bg: "bg-green-700" }
];

export function PaymentCarousel() {
  return (
    <section className="bg-card-bg/50 py-8 overflow-hidden">
      <div className="container mx-auto px-4 mb-4">
        <h2 className="text-xl font-bold text-white text-center">
          Pay with Your preferred payment method
        </h2>
      </div>
      
      <div className="relative">
        <div className="flex animate-slide">
          {/* First set of payment logos */}
          <div className="flex space-x-8 px-4 min-w-full">
            {paymentMethods.map((method, index) => (
              <div
                key={`set1-${index}`}
                className={`flex-shrink-0 ${method.bg} p-3 rounded-lg shadow-lg`}
              >
                <method.icon className="text-white text-2xl" />
              </div>
            ))}
          </div>
          
          {/* Duplicate set for seamless loop */}
          <div className="flex space-x-8 px-4 min-w-full">
            {paymentMethods.map((method, index) => (
              <div
                key={`set2-${index}`}
                className={`flex-shrink-0 ${method.bg} p-3 rounded-lg shadow-lg`}
              >
                <method.icon className="text-white text-2xl" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
