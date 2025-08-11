import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [paymentMethod, setPaymentMethod] = useState("Orange Cash");

  const SELLER_WHATSAPP = import.meta.env.VITE_SELLER_WHATSAPP || "+201234567890";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Generate WhatsApp message
    const orderSummary = cart
      .map(item => `- ${item.name} x${item.quantity} — ${item.price * item.quantity} جنيه`)
      .join('\n');

    const message = `مرحبًا 👋
أريد شراء من Cheetos Gaming 🎮

🛒 ملخص الطلب:
${orderSummary}

💰 الإجمالي: ${getTotalPrice()} جنيه
💳 طريقة الدفع: ${paymentMethod}
📱 الاسم: ${customerName}
📞 رقم الهاتف: ${countryCode}${customerPhone}

شكراً لك! 🔥🎮💎`;

    const whatsappUrl = `https://wa.me/${SELLER_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(message)}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');

    // Clear cart and close modals
    clearCart();
    onClose();
    
    // Reset form
    setCustomerName("");
    setCustomerPhone("");
    setCountryCode("+20");
    setPaymentMethod("Orange Cash");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-60 flex items-center justify-center p-4">
      <div className="bg-card-bg rounded-2xl p-6 w-full max-w-md relative">
        <Button
          variant="ghost"
          size="icon"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-white"
        >
          <X className="h-5 w-5" />
        </Button>
        
        <h2 className="text-xl font-bold text-white mb-6 text-center">
          Complete Your Order
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="customerName" className="text-white text-sm font-medium">
              Full Name *
            </Label>
            <Input
              id="customerName"
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              className="mt-2 bg-darker-bg text-white border-gray-600 focus:border-gold-primary"
              placeholder="Enter your full name"
            />
          </div>
          
          <div>
            <Label htmlFor="customerPhone" className="text-white text-sm font-medium">
              Phone Number *
            </Label>
            <div className="flex mt-2">
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger className="w-24 bg-darker-bg text-white border-gray-600 focus:border-gold-primary rounded-r-none">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+20">🇪🇬 +20</SelectItem>
                  <SelectItem value="+966">🇸🇦 +966</SelectItem>
                  <SelectItem value="+971">🇦🇪 +971</SelectItem>
                  <SelectItem value="+1">🇺🇸 +1</SelectItem>
                </SelectContent>
              </Select>
              
              <Input
                id="customerPhone"
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                className="flex-1 bg-darker-bg text-white border-gray-600 border-l-0 focus:border-gold-primary rounded-l-none"
                placeholder="1234567890"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="paymentMethod" className="text-white text-sm font-medium">
              Payment Method
            </Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger className="mt-2 bg-darker-bg text-white border-gray-600 focus:border-gold-primary">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Orange Cash">Orange Cash</SelectItem>
                <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                <SelectItem value="Cash in Hand">Cash in Hand</SelectItem>
                <SelectItem value="InstaPay">InstaPay</SelectItem>
                <SelectItem value="We Pay">We Pay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex space-x-3 mt-6">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="flex-1 bg-gray-600 hover:bg-gray-700 text-white border-gray-500"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-darker-bg font-semibold hover:scale-105 transition-transform"
            >
              Send to WhatsApp
              <SiWhatsapp className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
