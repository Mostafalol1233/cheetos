import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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

  const SELLER_WHATSAPP = "+201234567890"; // Default number

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

    // Clear cart and close modal
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="text-green-500" />
            Complete Your Order
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">Order Summary:</h4>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} EGP</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 font-bold">
              Total: {getTotalPrice()} EGP
            </div>
          </div>

          {/* Customer Information */}
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="w-24">
              <Label>Country</Label>
              <Select value={countryCode} onValueChange={setCountryCode}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="+20">🇪🇬 +20</SelectItem>
                  <SelectItem value="+966">🇸🇦 +966</SelectItem>
                  <SelectItem value="+971">🇦🇪 +971</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex-1">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input
                id="phone"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="1234567890"
                required
              />
            </div>
          </div>

          <div>
            <Label>Payment Method</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Orange Cash">Orange Cash</SelectItem>
                <SelectItem value="Vodafone Cash">Vodafone Cash</SelectItem>
                <SelectItem value="Etisalat Cash">Etisalat Cash</SelectItem>
                <SelectItem value="WE Pay">WE Pay</SelectItem>
                <SelectItem value="InstaPay">InstaPay</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            <SiWhatsapp className="mr-2" />
            Send Order via WhatsApp
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}