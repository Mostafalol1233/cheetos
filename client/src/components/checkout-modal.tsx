import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useCart } from "@/lib/cart-context";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const { cart, getTotalPrice, clearCart } = useCart();
  const [, setLocation] = useLocation();
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [countryCode, setCountryCode] = useState("+20");
  const [paymentMethod, setPaymentMethod] = useState("Orange Cash");
  const [confirmMethod, setConfirmMethod] = useState<'whatsapp' | 'live'>('whatsapp');
  const [deliveryChannel, setDeliveryChannel] = useState<'whatsapp' | 'email'>('whatsapp');
  const [paymentMessage, setPaymentMessage] = useState("");
  const { toast } = useToast();
  const { t } = useTranslation();

  const [payInfo, setPayInfo] = useState<{ title: string; value: string } | null>(null);

  const SELLER_WHATSAPP = import.meta.env.VITE_SELLER_WHATSAPP || "+201011696196";

  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch(`/api/public/payment-details?method=${encodeURIComponent(paymentMethod)}`);
        if (!res.ok) return setPayInfo(null);
        const data = await res.json();
        setPayInfo(data && typeof data === 'object' ? data : null);
      } catch {
        setPayInfo(null);
      }
    };
    load();
  }, [paymentMethod]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!customerName.trim() || !customerPhone.trim()) {
      alert(t('please_fill_required'));
      return;
    }

    if (deliveryChannel === 'email' && customerEmail.trim()) {
      const email = customerEmail.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        alert('Invalid email');
        return;
      }
    }

    // Validate phone number format
    const fullPhone = `${countryCode}${customerPhone}`;
    if (!/^\+\d{1,3}\d{7,15}$/.test(fullPhone.replace(/\s/g, ''))) {
      alert(t('invalid_phone'));
      return;
    }

    // Generate WhatsApp message
    const orderSummary = cart
      .map(item => `- ${item.name} x${item.quantity} — ${item.price * item.quantity} ${t('egp')}`)
      .join('\n');

    const message = `مرحبًا 👋
*🎮 طلب من Diaa Eldeen*

🛒 *ملخص الطلب:*
${orderSummary}

💰 *الإجمالي:* ${getTotalPrice()} ${t('egp')}
💳 *طريقة الدفع:* ${paymentMethod}
👤 *الاسم:* ${customerName}
📱 *رقم الهاتف:* ${countryCode}${customerPhone}

شكراً لك! 🔥 يسعدنا خدمتك 💎`;

    try {
      const items = cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
      const res = await apiRequest('POST', '/api/transactions/checkout', {
        customerName,
        customerPhone: `${countryCode}${customerPhone}`,
        customerEmail: customerEmail.trim() || null,
        paymentMethod,
        confirmationMethod: confirmMethod,
        deliveryChannel,
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
        title: t('purchase_confirmed'),
        description: `${t('transaction_initiated')}: ${transactionId}. ${t('total')}: ${getTotalPrice()} ${t('egp')}`,
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
    setCustomerEmail("");
    setCountryCode("+20");
    setPaymentMethod("Orange Cash");
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="text-green-500" />
            {t('complete_order')}
          </DialogTitle>
          <DialogDescription>
            {t('checkout_desc')}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted/50 rounded-lg p-4">
            <h4 className="font-medium mb-2">{t('order_summary')}:</h4>
            {cart.map(item => (
              <div key={item.id} className="flex justify-between text-sm">
                <span>{item.name} x{item.quantity}</span>
                <span>{(item.price * item.quantity).toFixed(2)} {t('egp')}</span>
              </div>
            ))}
            <div className="border-t mt-2 pt-2 font-bold">
              {t('total')}: {getTotalPrice()} {t('egp')}
            </div>
          </div>

          <div>
            <Label>Receive your order via</Label>
            <RadioGroup value={deliveryChannel} onValueChange={(val) => setDeliveryChannel(val as 'whatsapp' | 'email')} className="mt-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="deliver-whatsapp" value="whatsapp" />
                <Label htmlFor="deliver-whatsapp">WhatsApp</Label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <RadioGroupItem id="deliver-email" value="email" />
                <Label htmlFor="deliver-email">Email</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Confirmation Method */}
          <div>
            <Label>{t('confirmation_method')} *</Label>
            <RadioGroup value={confirmMethod} onValueChange={(val) => setConfirmMethod(val as 'whatsapp' | 'live')} className="mt-2">
              <div className="flex items-center gap-2">
                <RadioGroupItem id="method-whatsapp" value="whatsapp" />
                <Label htmlFor="method-whatsapp">{t('whatsapp')}</Label>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <RadioGroupItem id="method-live" value="live" />
                <Label htmlFor="method-live">{t('live_message_secure')}</Label>
              </div>
            </RadioGroup>
            {confirmMethod === 'live' && (
              <p className="text-xs text-muted-foreground mt-2">{t('live_redirect_hint')}</p>
            )}
          </div>

          {/* Customer Information */}
          <div>
            <Label htmlFor="name">{t('full_name')} *</Label>
            <Input
              id="name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder={t('enter_full_name')}
              required
            />
          </div>

          <div className="flex gap-2">
            <div className="w-24">
              <Label>{t('country')}</Label>
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
              <Label htmlFor="phone">{t('phone_number')} *</Label>
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
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="you@email.com"
              required={deliveryChannel === 'email'}
            />
          </div>

          <div>
            <Label>{t('payment_method')}</Label>
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
            {payInfo?.value ? (
              <div className="mt-3 text-sm bg-muted/30 rounded-lg p-3">
                <div>
                  <p className="font-medium">{payInfo.title || t('transfer_number')}:</p>
                  <p className="text-foreground">{payInfo.value}</p>
                </div>
              </div>
            ) : null}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-green-600 hover:bg-green-700 text-white"
          >
            {confirmMethod === 'whatsapp' ? (
              <>
                <SiWhatsapp className="mr-2" />
                {t('send_order_whatsapp')}
              </>
            ) : (
              <>{t('proceed_secure_confirmation')}</>
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
