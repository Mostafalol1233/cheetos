import React from 'react';
import { useCheckout } from '@/state/checkout';
import { PaymentMethods } from './PaymentMethods';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function StepPayment() {
  const { paymentMethod } = useCheckout();

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Select Payment Method</h2>
      <Card>
        <CardHeader>
          <CardTitle>Choose How to Pay</CardTitle>
        </CardHeader>
        <CardContent>
          <PaymentMethods />
          <div className="mt-6">
            <Button
              disabled={!paymentMethod}
              className="w-full"
              onClick={() => {
                // This will be handled by the parent stepper
              }}
            >
              Review Order
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}