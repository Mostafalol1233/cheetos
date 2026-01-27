import React, { useState } from 'react';
import { useCheckout, ensureIdempotencyKey } from '@/state/checkout';
import { useLocation } from "wouter";
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { API_BASE_URL } from '@/lib/queryClient';
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { PaymentIcon } from '../payment-icon';
import { useUserAuth } from '@/lib/user-auth-context';
import type { PaymentMethod } from '@/state/checkout';

export function StepReview() {
  const { cart, contact, paymentMethod, paymentData, subtotal, total, setOrderMeta, setError, setStep, reset, availablePaymentMethods, setGeneratedPassword } = useCheckout();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [deliverVia, setDeliverVia] = useState<'email' | 'whatsapp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();
  const [logoError, setLogoError] = useState(false);
  const { user } = useUserAuth();

  const selectedPayment = availablePaymentMethods.find(m => m.key === paymentMethod);


  const saveUserCheckoutPreferences = (response: any) => {
    try {
      const effectiveUser = response?.user || user;
      if (!effectiveUser || !effectiveUser.id) return;

      const prefsKey = `user_checkout_prefs_${effectiveUser.id}`;
      const prefs = {
        lastPaymentMethod: paymentMethod || null,
        lastDeliveryMethod: deliverVia,
      };
      localStorage.setItem(prefsKey, JSON.stringify(prefs));
      localStorage.setItem(`user_has_completed_checkout_${effectiveUser.id}`, '1');
    } catch {
    }
  };



  // Validation Guard: If data is missing (e.g. page refresh cleared non-persisted parts or persistence failed), show error.
  if (cart.length === 0 || !contact.email) {
    return (
      <div className="text-center py-10 space-y-4">
        <h2 className="text-xl font-semibold text-destructive">Session Expired or Invalid Data</h2>
        <p className="text-muted-foreground">It looks like some checkout information is missing. Please start over.</p>
        <Button onClick={() => {
          reset();
          window.location.reload();
        }}>
          Restart Checkout
        </Button>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (isSubmitting) return;

    // Client-side validation to prevent 400s
    if (cart.length === 0) {
      setError("Your cart is empty.");
      return;
    }
    if (!contact.email || !contact.phone) {
      setError("Contact information is missing.");
      return;
    }

    setIsSubmitting(true);
    setError(undefined);

    try {
      const key = ensureIdempotencyKey();

      const orderItems = cart.map(item => ({
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
      }));

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
          delivery_method: deliverVia, // Aligning with backend field name
          customer_name: contact.fullName,
          customer_phone: contact.phone ? `${contact.countryCode || ''}${contact.phone}` : undefined,
          customer_password: contact.password, // Pass custom password if provided
          notes: contact.notes,
          player_id: paymentData?.playerId, // Optional chaining for paymentData
          receipt_url: paymentData?.receiptUrl, // Optional chaining for paymentData
          payment_details: paymentData ? { ...paymentData, receiptUrl: paymentData.receiptUrl } : undefined, // Include all paymentData
          idempotency_key: key,
        })
      });

      // Clear checkout state regardless of outcome
      localStorage.removeItem('checkout_package');

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || `Order failed with status ${res.status}`);
      }

      const response = await res.json();

      if (response?.id) {
        saveUserCheckoutPreferences(response);
      }

      // Handle successful order - clear storage
      localStorage.removeItem('cart');
      if (response.id) {
        localStorage.setItem('order_notification', JSON.stringify({ id: response.id, unread: true }));
      }

      // Logic:
      // 1. If we have a generated password (or custom password was used to create account),
      // we redirect to Login page for the user to manually sign in.
      // 2. We do NOT auto-login anymore as per request.

      if (response.generatedPassword || (contact.password && response.newAccount)) {
        // Store credentials to pre-fill the login form
        localStorage.setItem('auto_login_data', JSON.stringify({
          email: response.user?.email || contact.email,
          password: contact.password || response.generatedPassword
        }));

        // Redirect to Login Page
        setLocation('/login?redirect=/profile');
        return;
      }

      // If user was ALREADY logged in (token exists in response or local), just go to profile
      if (response.token || localStorage.getItem('userToken')) {
        setLocation('/profile');
        return;
      }

      // Default fallback (e.g. WhatsApp guest checkout without account) -> Profile (will show guest view or redirect)
      // Or maybe login page?
      setLocation('/profile');

      return;

      return;

    } catch (error) {
      // console.error('Order submission failed:', error);
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
          <CardHeader>
            <CardTitle>Contact Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p><strong>Name:</strong> {contact.fullName}</p>
            <p><strong>Email:</strong> {contact.email}</p>
            <p><strong>Phone:</strong> {contact.phone}</p>
            {contact.notes && <p><strong>Notes:</strong> {contact.notes}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {selectedPayment && (
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 flex items-center justify-center">
                  {paymentMethod && (
                    <PaymentIcon methodKey={paymentMethod} className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{selectedPayment.label}</p>
                  {selectedPayment.info?.accountNumber && (
                    <p className="text-sm text-muted-foreground">
                      {selectedPayment.info.accountNumber}
                    </p>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Delivery Preference</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <label className="inline-flex items-center space-x-2">
              <input
                type="radio"
                name="deliver"
                value="email"
                checked={deliverVia === 'email'}
                onChange={() => setDeliverVia('email')}
                className="text-primary"
              />
              <span>Email</span>
            </label>
            <label className="inline-flex items-center space-x-2">
              <input
                type="radio"
                name="deliver"
                value="whatsapp"
                checked={deliverVia === 'whatsapp'}
                onChange={() => setDeliverVia('whatsapp')}
                className="text-primary"
              />
              <span>WhatsApp</span>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Order Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {cart.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded"
                    />
                  )}
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × {item.price.toFixed(2)} EGP
                    </p>
                  </div>
                </div>
                <p className="font-semibold">
                  {(item.price * item.quantity).toFixed(2)} EGP
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>{subtotal().toFixed(2)} EGP</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>{total().toFixed(2)} EGP</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        className="w-full"
        size="lg"
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Placing Order...
          </>
        ) : (
          'Place Order'
        )}
      </Button>
    </div>
  );
}
