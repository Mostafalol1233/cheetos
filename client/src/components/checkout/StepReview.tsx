import React from 'react';
import { useCheckout, PAYMENT_METHODS } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { ensureIdempotencyKey } from '@/state/checkout';
import { apiRequest } from '@/lib/queryClient';

export function StepReview() {
  const { cart, contact, paymentMethod, subtotal, total, setOrderMeta, setError, setStep } = useCheckout();

  const selectedPayment = PAYMENT_METHODS.find(m => m.key === paymentMethod);

  const handleSubmit = async () => {
    try {
      const key = ensureIdempotencyKey();
      const orderData = {
        customer_name: contact.fullName,
        customer_email: contact.email,
        customer_phone: contact.phone,
        items: cart.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
        })),
        total_amount: total(),
        payment_method: paymentMethod,
      };

      const response = await apiRequest('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': key,
        },
        body: JSON.stringify(orderData),
      });

      setOrderMeta(response.id, 'processing');
      setStep('processing');
    } catch (error) {
      console.error('Order submission failed:', error);
      setError('Failed to submit order. Please try again.');
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

      <Button onClick={handleSubmit} className="w-full" size="lg">
        Place Order
      </Button>
    </div>
  );
}