import React, { useEffect } from 'react';
import { useCheckout } from '@/state/checkout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StepProcessing() {
  const { orderId, orderStatus, setOrderMeta, setStep } = useCheckout();

  useEffect(() => {
    if (orderStatus === 'processing') {
      // Simulate payment completion after 5 seconds
      const timer = setTimeout(() => {
        setOrderMeta(orderId, 'paid');
        setStep('result');
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [orderStatus, orderId, setOrderMeta, setStep]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Processing Your Order</h2>
          <p className="text-muted-foreground mb-4">
            Please complete your payment using the selected method.
          </p>
          {orderId && (
            <div className="flex items-center justify-center gap-2">
              <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
              <Button size="sm" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(orderId); } catch {} }}>
                Copy
              </Button>
            </div>
          )}
          <div className="mt-4 text-sm text-muted-foreground">
            This may take a few moments...
          </div>
        </CardContent>
      </Card>
    </div>
  );
}