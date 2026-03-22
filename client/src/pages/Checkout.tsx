import React, { useEffect, useState, useRef } from 'react';
import { useCheckout } from '@/state/checkout';
import { useCart } from '@/lib/cart-context';
import { StepDetails } from '@/components/checkout/StepDetails';
import { StepPayment } from '@/components/checkout/StepPayment';
import { StepReview } from '@/components/checkout/StepReview';
import { StepProcessing } from '@/components/checkout/StepProcessing';
import { StepResult } from '@/components/checkout/StepResult';
import { useUserAuth } from "@/lib/user-auth-context";
import { useLocation } from "wouter";
import { ShieldCheck, Zap, Clock, Package, Tag, CheckCircle, X, Loader2 } from 'lucide-react';
import ImageWithFallback from '@/components/image-with-fallback';
import { API_BASE_URL } from '@/lib/queryClient';

const VISIBLE_STEPS = [
  { key: 'details', label: 'Details', icon: '①' },
  { key: 'payment', label: 'Payment', icon: '②' },
  { key: 'review',  label: 'Review',  icon: '③' },
];

const ALL_STEPS: { key: string; label: string; component: React.ComponentType<any> }[] = [
  { key: 'details',    label: 'Details',    component: StepDetails },
  { key: 'payment',    label: 'Payment',    component: StepPayment },
  { key: 'review',     label: 'Review',     component: StepReview },
  { key: 'processing', label: 'Processing', component: StepProcessing },
  { key: 'result',     label: 'Result',     component: StepResult },
];

function PromoCodeInput() {
  const { promoCode, promoDiscount, setPromoCode, cart } = useCheckout();
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);

  const handleApply = async () => {
    if (!input.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE_URL}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: input.trim(), order_total: total })
      });
      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Invalid code'); return; }
      setPromoCode(input.trim().toUpperCase(), data.discount);
    } catch { setError('Failed to apply code'); }
    finally { setLoading(false); }
  };

  const handleRemove = () => { setPromoCode(undefined, 0); setInput(''); setError(''); };

  if (promoCode) {
    return (
      <div className="flex items-center justify-between bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2 text-sm">
        <div className="flex items-center gap-2 text-green-400">
          <CheckCircle className="w-4 h-4 shrink-0" />
          <span className="font-mono font-bold">{promoCode}</span>
          <span className="text-green-300">−{promoDiscount.toFixed(0)} EGP</span>
        </div>
        <button onClick={handleRemove} className="text-muted-foreground hover:text-red-400">
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            type="text"
            value={input}
            onChange={e => { setInput(e.target.value.toUpperCase()); setError(''); }}
            onKeyDown={e => e.key === 'Enter' && handleApply()}
            placeholder="Promo code"
            className="w-full pl-8 pr-3 py-2 text-xs rounded-lg bg-white/5 border border-white/10 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-primary/50 transition-colors"
          />
        </div>
        <button
          onClick={handleApply}
          disabled={loading || !input.trim()}
          className="px-3 py-2 text-xs font-semibold rounded-lg bg-gold-primary/20 hover:bg-gold-primary/30 text-gold-primary border border-gold-primary/30 disabled:opacity-40 transition-all flex items-center gap-1"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
        </button>
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

export function CheckoutContent({ isEmbedded = false }: { isEmbedded?: boolean }) {
  const { step, setStep, cart, setCart, contact, paymentMethod, promoDiscount } = useCheckout();
  const { cart: globalCart } = useCart();
  const { isAuthenticated } = useUserAuth();
  const [, setLocation] = useLocation();
  const abandonedSaved = useRef(false);

  useEffect(() => {
    if (step === 'cart') setStep('details');
  }, [step, setStep]);

  useEffect(() => {
    const checkoutPackageJson = localStorage.getItem('checkout_package');
    if (checkoutPackageJson) {
      try {
        const pkg = JSON.parse(checkoutPackageJson);
        setCart([{
          id: `${pkg.gameId}-${pkg.packageIndex}`,
          name: `${pkg.gameName} - ${pkg.packageName}`,
          price: pkg.price,
          quantity: 1,
          image: pkg.gameImage,
          gameId: pkg.gameId
        }]);
      } catch (e) {}
    } else if (globalCart.length > 0) {
      setCart(globalCart);
    }
  }, [globalCart, setCart]);

  const rawStepIndex = ALL_STEPS.findIndex(s => s.key === step);
  const currentStepIndex = rawStepIndex >= 0 ? rawStepIndex : 0;
  const currentStep = ALL_STEPS[currentStepIndex] || ALL_STEPS[0];
  const visibleStepIndex = VISIBLE_STEPS.findIndex(s => s.key === step);

  useEffect(() => {
    if (cart.length === 0 && !localStorage.getItem('checkout_package')) {
      if (step !== 'details' && step !== 'result') setStep('details');
    }
    const hasContactInfo = contact.fullName && contact.email && contact.phone;
    if ((step === 'payment' || step === 'review') && !hasContactInfo) setStep('details');
    if (step === 'processing' || step === 'result') setStep('details');
  }, [step, cart.length, contact]);

  // Abandoned cart tracking — save when user has email and items
  useEffect(() => {
    if (abandonedSaved.current) return;
    if (!contact.email || cart.length === 0) return;
    if (step === 'result') return;
    const total = cart.reduce((s, i) => s + i.price * i.quantity, 0);
    abandonedSaved.current = true;
    fetch(`${API_BASE_URL}/api/abandoned-cart/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: contact.email,
        name: contact.fullName || undefined,
        phone: contact.phone || undefined,
        items: cart.map(i => ({ name: i.name, price: i.price, quantity: i.quantity })),
        total_amount: total
      })
    }).catch(() => {});
  }, [contact.email, cart, step]);

  const handleStartOver = () => {
    const { reset } = useCheckout.getState();
    reset();
    localStorage.removeItem('checkout_package');
    window.location.reload();
  };

  const handleNext = () => {
    const nextIndex = Math.min(currentStepIndex + 1, ALL_STEPS.length - 1);
    setStep(ALL_STEPS[nextIndex].key as any);
  };

  const handleBack = () => {
    if (currentStepIndex > 0) setStep(ALL_STEPS[currentStepIndex - 1].key as any);
  };

  if (!currentStep) { setStep('details'); return null; }

  const StepComponent = currentStep.component;

  const isTerminalStep = step === 'processing' || step === 'result';

  /* ---------- Order summary data ---------- */
  const cartItem = cart[0];
  const itemImage = cartItem?.image || '';
  const itemName = cartItem?.name || 'Your Order';
  const itemPrice = cartItem?.price ?? 0;
  const formatPrice = (p: number) =>
    new Intl.NumberFormat('en-EG', { style: 'currency', currency: 'EGP', minimumFractionDigits: 0 }).format(p);

  return (
    <div className="min-h-screen bg-background">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-gold-primary/4 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-gold-primary/3 rounded-full blur-[120px]" />
      </div>

      <div className="relative z-10 container mx-auto px-4 py-10 max-w-5xl">

        {/* Header */}
        {!isEmbedded && !isTerminalStep && (
          <div className="mb-8">
            <button
              onClick={() => setLocation('/')}
              className="text-muted-foreground hover:text-foreground text-sm flex items-center gap-1.5 mb-5 transition-colors"
            >
              ← Back to Store
            </button>
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-foreground tracking-tight">Checkout</h1>
              <button
                onClick={handleStartOver}
                className="text-xs text-muted-foreground hover:text-red-400 transition-colors"
              >
                Start Over
              </button>
            </div>

            {/* Step progress */}
            <div className="flex items-center gap-0 mt-6">
              {VISIBLE_STEPS.map((s, i) => {
                const isDone = visibleStepIndex > i;
                const isCurrent = visibleStepIndex === i;
                return (
                  <React.Fragment key={s.key}>
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                        isDone    ? 'bg-gold-primary text-background shadow-[0_0_12px_rgba(255,215,0,0.4)]' :
                        isCurrent ? 'bg-gold-primary/20 border-2 border-gold-primary text-gold-primary' :
                                    'bg-white/5 border border-white/15 text-muted-foreground'
                      }`}>
                        {isDone ? '✓' : i + 1}
                      </div>
                      <span className={`text-sm font-medium hidden sm:block ${isCurrent ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {s.label}
                      </span>
                    </div>
                    {i < VISIBLE_STEPS.length - 1 && (
                      <div className={`flex-1 h-px mx-3 transition-all duration-500 ${isDone ? 'bg-gold-primary/50' : 'bg-white/10'}`} />
                    )}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        )}

        {/* Main layout — sidebar + step card */}
        <div className={`grid gap-6 ${isTerminalStep ? '' : 'lg:grid-cols-[1fr_340px]'}`}>

          {/* Step content card */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden">
              <div className="p-6 md:p-8">
                <StepComponent
                  onNext={handleNext}
                  onBack={handleBack}
                  canGoNext={(() => {
                    switch (step) {
                      case 'details': return !!(contact.fullName && contact.email && contact.phone);
                      case 'payment': return !!paymentMethod;
                      case 'review':  return true;
                      default:        return false;
                    }
                  })()}
                />
              </div>
            </div>
          </div>

          {/* Order summary sidebar */}
          {!isTerminalStep && (
            <div className="order-1 lg:order-2">
              <div className="rounded-2xl border border-white/8 bg-card/60 backdrop-blur-sm shadow-xl overflow-hidden sticky top-6">
                {/* Product image banner */}
                <div className="relative h-36 bg-gradient-to-br from-card to-muted overflow-hidden">
                  {itemImage ? (
                    <ImageWithFallback
                      src={itemImage}
                      alt={itemName}
                      className="w-full h-full object-cover opacity-70"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-14 h-14 text-gold-primary/30" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-card/20 to-transparent" />
                </div>

                <div className="p-5">
                  <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1 font-medium">Order Summary</p>
                  <p className="text-foreground font-bold text-sm leading-snug mb-4 line-clamp-2">{itemName}</p>

                  <div className="border-t border-white/8 pt-4 space-y-2.5 mb-4">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Subtotal</span>
                      <span className="text-foreground font-medium">{formatPrice(itemPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Fees</span>
                      <span className="text-green-400 font-medium">Free</span>
                    </div>
                    {promoDiscount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-green-400">Discount</span>
                        <span className="text-green-400 font-medium">−{formatPrice(promoDiscount)}</span>
                      </div>
                    )}
                  </div>

                  {/* Promo Code Input */}
                  <div className="mb-4">
                    <PromoCodeInput />
                  </div>

                  <div className="flex justify-between items-center border-t border-white/8 pt-4 mb-5">
                    <span className="font-bold text-foreground">Total</span>
                    <span className="text-xl font-black text-gold-primary">
                      {formatPrice(Math.max(0, itemPrice - promoDiscount))}
                    </span>
                  </div>

                  {/* Trust badges */}
                  <div className="space-y-2">
                    {[
                      { icon: ShieldCheck, label: 'Secure & Safe Payment' },
                      { icon: Zap,         label: 'Instant Delivery' },
                      { icon: Clock,       label: '24/7 Support' },
                    ].map(({ icon: Icon, label }) => (
                      <div key={label} className="flex items-center gap-2.5 text-xs text-muted-foreground">
                        <Icon className="w-3.5 h-3.5 text-gold-primary shrink-0" />
                        {label}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Checkout() {
  return <CheckoutContent />;
}
