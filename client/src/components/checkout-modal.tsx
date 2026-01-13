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

  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

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

  const validateStep = (step: number) => {
    switch (step) {
      case 1:
        return deliveryChannel !== undefined;
      case 2:
        return customerName.trim() && customerPhone.trim() && 
               (deliveryChannel !== 'email' || customerEmail.trim());
      case 3:
        return paymentMethod !== undefined;
      case 4:
        return confirmMethod !== undefined;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (validateStep(currentStep) && currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

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
    setConfirmMethod('whatsapp');
    setDeliveryChannel('whatsapp');
    setCurrentStep(1);
    setCurrentStep(1);
  };

  if (!isOpen) return null;

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">How would you like to receive your order?</Label>
              <RadioGroup value={deliveryChannel} onValueChange={(val) => setDeliveryChannel(val as 'whatsapp' | 'email')} className="mt-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem id="deliver-whatsapp" value="whatsapp" />
                  <div className="flex items-center gap-2">
                    <SiWhatsapp className="text-green-500" />
                    <Label htmlFor="deliver-whatsapp" className="font-medium">WhatsApp</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-auto">Receive digital codes instantly</p>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 mt-2">
                  <RadioGroupItem id="deliver-email" value="email" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="deliver-email" className="font-medium">Email</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-auto">Get codes via email</p>
                </div>
              </RadioGroup>
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Customer Information</Label>
              <div className="mt-4 space-y-4">
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
                  <Label htmlFor="email">Email {deliveryChannel === 'email' ? '*' : ''}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    placeholder="you@email.com"
                    required={deliveryChannel === 'email'}
                  />
                </div>
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Payment Method</Label>
              <div className="mt-4 grid grid-cols-2 gap-3">
                {[
                  { value: "Orange Cash", label: "Orange Cash", icon: "📱" },
                  { value: "Vodafone Cash", label: "Vodafone Cash", icon: "📞" },
                  { value: "Etisalat Cash", label: "Etisalat Cash", icon: "📶" },
                  { value: "WE Pay", label: "WE Pay", icon: "💳" },
                  { value: "InstaPay", label: "InstaPay", icon: "🏦" },
                  { value: "PayPal", label: "PayPal", icon: "💰" }
                ].map((method) => (
                  <button
                    key={method.value}
                    type="button"
                    onClick={() => setPaymentMethod(method.value)}
                    className={`p-4 border-2 rounded-lg text-center transition-all hover:border-gold-primary ${
                      paymentMethod === method.value
                        ? 'border-gold-primary bg-gold-primary/10'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <div className="text-2xl mb-2">{method.icon}</div>
                    <div className="text-sm font-medium">{method.label}</div>
                  </button>
                ))}
              </div>
              {payInfo?.value ? (
                <div className="mt-3 text-sm bg-muted/30 rounded-lg p-3">
                  <div>
                    <p className="font-medium">{payInfo.title || t('transfer_number')}:</p>
                    <p className="text-foreground">{payInfo.value}</p>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        );
      case 4:
        return (
          <div className="space-y-4">
            <div>
              <Label className="text-lg font-medium">Confirmation Method</Label>
              <RadioGroup value={confirmMethod} onValueChange={(val) => setConfirmMethod(val as 'whatsapp' | 'live')} className="mt-4">
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50">
                  <RadioGroupItem id="method-whatsapp" value="whatsapp" />
                  <div className="flex items-center gap-2">
                    <SiWhatsapp className="text-green-500" />
                    <Label htmlFor="method-whatsapp" className="font-medium">{t('whatsapp')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-auto">Send payment details via WhatsApp</p>
                </div>
                <div className="flex items-center gap-3 p-4 border rounded-lg hover:bg-muted/50 mt-2">
                  <RadioGroupItem id="method-live" value="live" />
                  <div className="flex items-center gap-2">
                    <Label htmlFor="method-live" className="font-medium">{t('live_message_secure')}</Label>
                  </div>
                  <p className="text-sm text-muted-foreground ml-auto">Upload receipt securely</p>
                </div>
              </RadioGroup>
              {confirmMethod === 'live' && (
                <p className="text-xs text-muted-foreground mt-2">{t('live_redirect_hint')}</p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <SiWhatsapp className="text-green-500" />
            {t('complete_order')} ({currentStep}/{totalSteps})
          </DialogTitle>
          <DialogDescription>
            {t('checkout_desc')}
          </DialogDescription>
        </DialogHeader>

        {/* Progress Indicator */}
        <div className="flex items-center justify-center space-x-2 mb-6">
          {[1, 2, 3, 4].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step <= currentStep
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                {step}
              </div>
              {step < 4 && (
                <div
                  className={`w-8 h-0.5 ${
                    step < currentStep ? 'bg-green-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Order Summary - Always visible */}
        <div className="bg-muted/50 rounded-lg p-4 mb-4">
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

        <form onSubmit={handleSubmit} className="space-y-4">
          {renderStepContent()}

          {/* Navigation Buttons */}
          <div className="flex gap-2 pt-4">
            {currentStep > 1 && (
              <Button
                type="button"
                variant="outline"
                onClick={prevStep}
                className="flex-1"
              >
                Previous
              </Button>
            )}
            {currentStep < totalSteps ? (
              <Button
                type="button"
                onClick={nextStep}
                disabled={!validateStep(currentStep)}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                Next
              </Button>
            ) : (
              <Button
                type="submit"
                className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold text-lg py-3"
              >
                {confirmMethod === 'whatsapp' ? (
                  <>
                    <SiWhatsapp className="mr-2" />
                    Complete Order
                  </>
                ) : (
                  <>Submit Payment Confirmation</>
                )}
              </Button>
            )}
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
