import React, { useState } from 'react';
import { useCheckout, PAYMENT_METHODS } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ensureIdempotencyKey } from '@/state/checkout';
import { API_BASE_URL } from '@/lib/queryClient';
import { Loader2 } from 'lucide-react';
import { useSettings } from '@/lib/settings-context';
import { FaPaypal } from 'react-icons/fa';

export function StepReview() {
  const { cart, contact, paymentMethod, paymentData, subtotal, total, setOrderMeta, setError, setStep } = useCheckout();
  const [deliverVia, setDeliverVia] = useState<'email' | 'whatsapp'>('email');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { settings } = useSettings();
  const [logoError, setLogoError] = useState(false);

  const selectedPayment = PAYMENT_METHODS.find(m => m.key === paymentMethod);

  const handleSubmit = async () => {
    if (isSubmitting) return;

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
          customer_email: contact.email,
          customer_phone: contact.phone ? `${contact.countryCode || ''}${contact.phone}` : undefined,
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

      if (response.token) {
        localStorage.setItem('userToken', response.token);
        if (response.user) {
          localStorage.setItem('userData', JSON.stringify(response.user));
        }
        localStorage.removeItem('cart');
        localStorage.setItem('order_notification', JSON.stringify({ id: response.id, unread: true }));
        window.location.href = '/track-order?id=' + response.id;
        return;
      }

      if (response.id) {
        localStorage.removeItem('cart');
        setOrderMeta(response.id, response.status || 'pending_approval');
      }

      if (deliverVia === 'whatsapp') {
        const waNumber = settings?.whatsappNumber?.replace(/\D/g, '') || '201011696196';
        const message = `*New Order #${response.id}*\nName: ${contact.fullName}\nTotal: ${total()} EGP\nItems:\n${cart.map(i => `- ${i.name} x${i.quantity}`).join('\n')}\n\nPayment: WhatsApp Order`;

        window.open(`https://wa.me/${waNumber}?text=${encodeURIComponent(message)}`, '_blank');
      }

      if (localStorage.getItem('userToken') && response.id) {
        localStorage.setItem('order_notification', JSON.stringify({ id: response.id, unread: true }));
        window.location.href = '/track-order?id=' + response.id;
        return;
      }

      if (response.id) {
        localStorage.setItem('order_notification', JSON.stringify({ id: response.id, unread: true }));
        window.location.href = '/track-order?id=' + response.id;
        return;
      }

      setStep('processing');
    } catch (error) {
      console.error('Order submission failed:', error);
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
                  {logoError || !selectedPayment.logo ? (
                    <FaPaypal className="w-8 h-8 text-[#003087]" />
                  ) : (
                    <img
                      src={selectedPayment.logo}
                      alt={selectedPayment.label}
                      className="w-8 h-8 object-contain"
                      onError={() => setLogoError(true)}
                    />
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
