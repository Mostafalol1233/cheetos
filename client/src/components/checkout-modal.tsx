import { useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [paymentMethod, setPaymentMethod] = useState("Orange Cash");
  const [confirmMethod, setConfirmMethod] = useState<'whatsapp' | 'live'>('whatsapp');
  const [paymentMessage, setPaymentMessage] = useState("");
  const { toast } = useToast();

  const SELLER_WHATSAPP = import.meta.env.VITE_SELLER_WHATSAPP || "+201234567890";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim()) {
      alert("Please fill in all required fields");
      return;
    }

    // Validate phone number format
    const fullPhone = `${countryCode}${customerPhone}`;
    if (!/^\+\d{1,3}\d{7,15}$/.test(fullPhone.replace(/\s/g, ''))) {
      alert("Please enter a valid phone number");
      return;
    }

    // Generate WhatsApp message
    const orderSummary = cart
      .map(item => `- ${item.name} x${item.quantity} — ${item.price * item.quantity} جنيه`)
      .join('\n');

    const message = `مرحبًا 👋
*🎮 طلب من Diaa Eldeen*

🛒 *ملخص الطلب:*
${orderSummary}

💰 *الإجمالي:* ${getTotalPrice()} جنيه
💳 *طريقة الدفع:* ${paymentMethod}
👤 *الاسم:* ${customerName}
📱 *رقم الهاتف:* ${countryCode}${customerPhone}

شكراً لك! 🔥 يسعدنا خدمتك 💎`;

    try {
      const items = cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
      const res = await apiRequest('POST', '/api/transactions/checkout', {
        customerName,
        customerPhone: `${countryCode}${customerPhone}`,
        paymentMethod,
        items,
      });
      const { id: transactionId } = await res.json();

      if (confirmMethod === 'whatsapp') {
        const whatsappUrl = `https://wa.me/${SELLER_WHATSAPP.replace('+', '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
      } else {
        setLocation(`/checkout/security/${transactionId}`);
      }
      toast({
        title: "Purchase Confirmed",
        description: `Transaction ${transactionId} for ${items.length} item(s) has been initiated. Total: ${getTotalPrice()} EGP`,
        duration: 4000,
      });
    } catch (err) {
      alert(String(err));
      return;
    }

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

          {/* Confirmation Method */}
          <div>
            <Label>Confirmation Method *</Label>
            <RadioGroup value={confirmMethod} onValueChange={(val) => setConfirmMethod(val as 'whatsapp' | 'live')} className="mt-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="method-whatsapp" value="whatsapp" />
                <Label htmlFor="method-whatsapp">WhatsApp</Label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <RadioGroupItem id="method-live" value="live" />
                <Label htmlFor="method-live">Live Message (Secure)</Label>
              </div>
            </RadioGroup>
            {confirmMethod === 'live' && (
              <p className="text-xs text-muted-foreground mt-2">You will be redirected to a security page to submit your payment message and receipt.</p>
            )}
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
                <SelectItem value="PayPal">PayPal</SelectItem>
                <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
              </SelectContent>
            </Select>
            <div className="mt-3 text-sm bg-muted/30 rounded-lg p-3">
              {paymentMethod === 'Orange Cash' && (
                <div>
                  <p className="font-medium">Transfer number:</p>
                  <p className="text-foreground">01001387284</p>
                </div>
              )}
              {paymentMethod === 'Vodafone Cash' && (
                <div>
                  <p className="font-medium">Transfer number:</p>
                  <p className="text-foreground">01001387284</p>
                </div>
              )}
              {paymentMethod === 'Etisalat Cash' && (
                <div>
                  <p className="font-medium">Transfer number:</p>
                  <p className="text-foreground">01001387284</p>
                </div>
              )}
              {paymentMethod === 'WE Pay' && (
                <div>
                  <p className="font-medium">Transfer numbers:</p>
                  <p className="text-foreground">01001387284 or 01029070780</p>
                </div>
              )}
              {paymentMethod === 'InstaPay' && (
                <div>
                  <p className="font-medium">Account:</p>
                  <p className="text-foreground">DiaaEldeenn</p>
                </div>
              )}
              {paymentMethod === 'PayPal' && (
                <div>
                  <p className="font-medium">PayPal Account:</p>
                  <p className="text-foreground">support@diaaeldeen.com</p>
                </div>
              )}
              {paymentMethod === 'Bank Transfer' && (
                <div>
                  <p className="font-medium">Bank:</p>
                  <p className="text-foreground">CIB Bank - Account Number: 0123456789</p>
                </div>
              )}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {confirmMethod === 'whatsapp' ? (
              <>
                <SiWhatsapp className="mr-2" />
                Send Order via WhatsApp
              </>
            ) : (
              <>Proceed to Secure Confirmation</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
