import React, { useState } from 'react';
import { useCheckout, PAYMENT_METHODS } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ensureIdempotencyKey } from '@/state/checkout';
import { apiRequest } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';

export function StepReview() {
  const { cart, contact, paymentMethod, paymentData, subtotal, total, setOrderMeta, setError, setStep } = useCheckout();
  const [deliverVia, setDeliverVia] = useState<'email'|'whatsapp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();

  const selectedPayment = PAYMENT_METHODS.find(m => m.key === paymentMethod);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    setError(undefined);

    try {
      const key = ensureIdempotencyKey();
      const orderData = {
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: total(),
        payment_method: paymentMethod,
        deliver_via: deliverVia,
        customer_name: contact.fullName,
        customer_email: contact.email,
        customer_phone: (contact.countryCode || '') + contact.phone,
        notes: contact.notes,
        player_id: paymentData?.playerId,
        receipt_url: paymentData?.receiptUrl,
      };

      const res = await apiRequest('POST', '/api/orders', { ...orderData, idempotency_key: key });
      const response = await res.json();

      // Handle Auto-Login / User Session
      if (response.token && response.user) {
        localStorage.setItem('userToken', response.token);
        localStorage.setItem('userData', JSON.stringify(response.user));
        // Force reload to pick up auth state and redirect to orders
        window.location.href = '/account/orders';
        return;
      }

      // Handle redirect to orders if account created or already logged in (fallback)
      if (response.status === 'pending_approval' || response.status === 'processing') {
         // If we have a token (either new or existing), redirect to orders
         if (localStorage.getItem('userToken')) {
            window.location.href = '/account/orders';
            return;
         }
      }

      setOrderMeta(response.id, response.status || 'processing');
      
      if (paymentMethod === 'whatsapp') {
          const waNumber = settings?.whatsapp_number?.replace(/\D/g, '') || '201000000000';
          const message = `*New Order #${response.id}*\nName: ${contact.fullName}\nTotal: ${total()} EGP\nItems:\n${cart.map(i => `- ${i.name} x${i.quantity}`).join('\n')}\n\nPayment: WhatsApp Order`;
          
          window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }

      if (response.user) {
        // Force reload to pick up auth state and redirect to orders
        window.location.href = '/account/orders';
        return;
      }

      setStep('processing');
    } catch (error) {
      console.error('Order submission failed:', error);
      setError('Failed to submit order. Please try again.');
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
                <img
                  src={selectedPayment.logo}
                  alt={selectedPayment.label}
                  className="w-8 h-8 object-contain"
                />
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
                      Qty: {item.quantity} × ${item.price.toFixed(2)}
                    </p>
                  </div>
                </div>
                <p className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            ))}
          </div>
          <Separator className="my-4" />
          <div className="space-y-2">
            <div className="flex justify-between">
              <span>Subtotal:</span>
              <span>${subtotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-lg">
              <span>Total:</span>
              <span>${total().toFixed(2)}</span>
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
