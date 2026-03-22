import React, { useState } from 'react';
import { useCheckout, ensureIdempotencyKey } from '@/state/checkout';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Loader2, Tag, CheckCircle, XCircle } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { PaymentIcon } from '../payment-icon';
import { useUserAuth } from '@/lib/user-auth-context';
import type { PaymentMethod } from '@/state/checkout';

export function StepReview() {
  const {
    cart, contact, paymentMethod, paymentData, subtotal, total,
    setOrderMeta, setError, setStep, reset, availablePaymentMethods,
    setGeneratedPassword, promoCode, promoDiscount, setPromoCode
  } = useCheckout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deliverVia, setDeliverVia] = useState<'email' | 'whatsapp'>(contact.deliveryMethod || 'email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();
  const [logoError, setLogoError] = useState(false);
  const { user } = useUserAuth();

  const [promoInput, setPromoInput] = useState(promoCode || '');
  const [promoValidating, setPromoValidating] = useState(false);
  const [promoApplied, setPromoApplied] = useState(!!promoCode && promoDiscount > 0);
  const [promoError, setPromoError] = useState('');

  const selectedPayment = availablePaymentMethods.find(m => m.key === paymentMethod);

  const handleValidatePromo = async () => {
    if (!promoInput.trim()) return;
    setPromoValidating(true);
    setPromoError('');

    try {
      const res = await fetch(`${API_BASE_URL}/api/promo/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: promoInput.trim().toUpperCase(), order_total: subtotal() })
      });
      const data = await res.json();

      if (!res.ok) {
        setPromoError(data.message || 'Invalid promo code');
        setPromoCode(undefined, 0);
        setPromoApplied(false);
      } else {
        setPromoCode(promoInput.trim().toUpperCase(), data.discount);
        setPromoApplied(true);
        toast({ title: `✅ Promo applied! You save ${data.discount.toFixed(2)} EGP` });
      }
    } catch {
      setPromoError('Could not validate promo code. Please try again.');
    } finally {
      setPromoValidating(false);
    }
  };

  const handleRemovePromo = () => {
    setPromoCode(undefined, 0);
    setPromoApplied(false);
    setPromoInput('');
    setPromoError('');
  };

  const saveUserCheckoutPreferences = (response: any) => {
    try {
      const effectiveUser = response?.user || user;
      if (!effectiveUser || !effectiveUser.id) return;
      const prefsKey = `user_checkout_prefs_${effectiveUser.id}`;
      const prefs = { lastPaymentMethod: paymentMethod || null, lastDeliveryMethod: deliverVia };
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
      localStorage.setItem(`user_has_completed_checkout_${effectiveUser.id}`, '1');
    } catch {}
  };

  if (cart.length === 0 || !contact.email || !contact.phone) {
    return (
      <div className="text-center py-10 space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Session Expired or Invalid Data</h2>
        <p className="text-muted-foreground">It looks like some checkout information is missing. Please start over.</p>
        <div className="flex justify-center gap-4">
          <Button variant="outline" onClick={() => window.location.href = '/'}>Go Home</Button>
          <Button onClick={() => {
            const { reset } = useCheckout.getState();
            reset();
            localStorage.removeItem('checkout-storage');
            localStorage.removeItem('checkout_package');
            window.location.reload();
          }}>Restart Checkout</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (cart.length === 0) { setError("Your cart is empty."); return; }
    if (!contact.email || !contact.phone) { setError("Contact information is missing."); return; }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const key = ensureIdempotencyKey();
      const orderItems = cart.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
      const token = localStorage.getItem('userToken');

      const res = await fetch(`${API_BASE_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          items: orderItems,
          total_amount: total(),
          payment_method: paymentMethod,
          delivery_method: deliverVia,
          customer_name: contact.fullName,
          customer_email: contact.email,
          customer_phone: contact.phone ? `${contact.countryCode || ''}${contact.phone}` : undefined,
          customer_password: contact.password,
          notes: contact.notes,
          player_id: paymentData?.playerId,
          receipt_url: paymentData?.receiptUrl,
          payment_details: paymentData ? { ...paymentData, receiptUrl: paymentData.receiptUrl } : undefined,
          idempotency_key: key,
          promo_code: promoCode,
          promo_discount: promoDiscount,
        })
      });

      localStorage.removeItem('checkout_package');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Order failed with status ${res.status}`);
      }

      const response = await res.json();

      // Apply promo code (increment used_count)
      if (promoCode) {
        fetch(`${API_BASE_URL}/api/promo/apply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: promoCode })
        }).catch(() => {});
      }

      // Mark abandoned cart as recovered
      if (contact.email) {
        fetch(`${API_BASE_URL}/api/abandoned-cart/recover`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: contact.email })
        }).catch(() => {});
      }

      if (response?.id) { saveUserCheckoutPreferences(response); }
      localStorage.removeItem('cart');
      if (response.id) {
        localStorage.setItem('order_notification', JSON.stringify({ id: response.id, unread: true }));
      }

      if (response.generatedPassword || (contact.password && response.newAccount)) {
        localStorage.setItem('auto_login_data', JSON.stringify({
          email: response.user?.email || contact.email,
          password: contact.password || response.generatedPassword
        }));
        setLocation('/login?redirect=/profile');
        return;
      }

      if (response.token || localStorage.getItem('userToken')) {
        setLocation('/profile');
        return;
      }

      setLocation('/profile');
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to submit order. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Review Your Order</h2>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Contact Details</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setStep('details')}>Edit</Button>
          </CardHeader>
          <CardContent className="space-y-2 pt-4">
            <p><strong>Name:</strong> {contact.fullName}</p>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Phone:</strong> {contact.phone}</p>
            {contact.notes && <p><strong>Notes:</strong> {contact.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xl">Payment Method</CardTitle>
            <Button variant="ghost" size="sm" onClick={() => setStep('payment')}>Edit</Button>
          </CardHeader>
          <CardContent className="pt-4">
            {selectedPayment && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {paymentMethod && <PaymentIcon methodKey={paymentMethod} className="w-8 h-8" />}
                </div>
                <div>
                  <p className="font-medium">{selectedPayment.label}</p>
                  {selectedPayment.info?.accountNumber && (
                    <p className="text-sm text-muted-foreground">{selectedPayment.info.accountNumber}</p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Delivery Preference</CardTitle></CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="inline-flex items-center space-x-2">
              <input type="radio" name="deliver" value="email" checked={deliverVia === 'email'} onChange={() => setDeliverVia('email')} className="text-primary" />
              <span>Email</span>
            </label>
            <label className="inline-flex items-center space-x-2">
              <input type="radio" name="deliver" value="whatsapp" checked={deliverVia === 'whatsapp'} onChange={() => setDeliverVia('whatsapp')} className="text-primary" />
              <span>WhatsApp</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Order Items</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {item.image && <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded" />}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Qty: {item.quantity} × {item.price.toFixed(2)} EGP</p>
                  </div>
                </div>
                <p className="font-semibold">{(item.price * item.quantity).toFixed(2)} EGP</p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />

          {/* Promo Code Section */}
          <div className="mb-4">
            <p className="text-sm font-medium mb-2 flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-gold-primary" />
              Promo Code
            </p>
            {promoApplied ? (
              <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-3 py-2">
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
                <span className="text-sm font-mono font-bold text-green-400">{promoCode}</span>
                <span className="text-sm text-green-400 ml-1">— {promoDiscount.toFixed(2)} EGP off</span>
                <button onClick={handleRemovePromo} className="ml-auto text-muted-foreground hover:text-foreground">
                  <XCircle className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter promo code"
                  value={promoInput}
                  onChange={e => { setPromoInput(e.target.value.toUpperCase()); setPromoError(''); }}
                  className="font-mono uppercase"
                  onKeyDown={e => e.key === 'Enter' && handleValidatePromo()}
                />
                <Button
                  variant="outline"
                  onClick={handleValidatePromo}
                  disabled={promoValidating || !promoInput.trim()}
                  className="shrink-0"
                >
                  {promoValidating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
                </Button>
              </div>
            )}
            {promoError && <p className="text-sm text-destructive mt-1">{promoError}</p>}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal:</span>
              <span>{subtotal().toFixed(2)} EGP</span>
            </div>
            {promoDiscount > 0 && (
              <div className="flex justify-between text-sm text-green-400">
                <span>Promo Discount ({promoCode}):</span>
                <span>-{promoDiscount.toFixed(2)} EGP</span>
              </div>
            )}
            <Separator />
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{total().toFixed(2)} EGP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button onClick={handleSubmit} className="w-full" size="lg" disabled={isSubmitting}>
        {isSubmitting ? (
          <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Placing Order...</>
        ) : (
          'Place Order'
        )}
      </Button>
    </div>
  );
}
