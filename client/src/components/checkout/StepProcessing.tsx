import React, { useEffect, useState } from 'react';
import { useCheckout } from '@/state/checkout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function StepProcessing() {
  const { orderId, orderStatus, setOrderMeta, setStep, setError } = useCheckout();
  const [timeLeft, setTimeLeft] = useState(30); // 30 second timeout
  const [canCancel, setCanCancel] = useState(false);

  useEffect(() => {
    if (orderStatus === 'processing') {
      // Allow cancel after 5 seconds
      const cancelTimer = setTimeout(() => setCanCancel(true), 5000);

      // Countdown timer
      const countdown = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Timeout - mark as failed
            setOrderMeta(orderId, 'failed');
            setError('Payment processing timed out. Please try again.');
            setStep('result');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Simulate payment completion after random time (5-25 seconds)
      const completionTime = Math.random() * 20000 + 5000;
      const completionTimer = setTimeout(() => {
        if (orderStatus === 'processing') {
          setOrderMeta(orderId, 'paid');
          setStep('result');
        }
      }, completionTime);

      return () => {
        clearTimeout(cancelTimer);
        clearTimeout(completionTimer);
        clearInterval(countdown);
      };
    }
  }, [orderStatus, orderId, setOrderMeta, setStep, setError]);

  const handleCancel = () => {
    setOrderMeta(orderId, 'failed');
    setError('Order was cancelled by user.');
    setStep('result');
  };

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-12 h-12 animate-spin mx-auto mb-4 text-primary" />
          <h2 className="text-2xl font-semibold mb-2">Processing Your Payment</h2>
          <p className="text-muted-foreground mb-4">
            Please complete your payment using the selected method. Do not close this page.
          </p>
          {orderId && (
            <div className="flex items-center justify-center gap-2 mb-4">
              <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
              <Button size="sm" variant="ghost" onClick={async () => { try { await navigator.clipboard.writeText(orderId); } catch {} }}>
                Copy
              </Button>
            </div>
          )}
          <div className="text-sm text-muted-foreground mb-4">
            Time remaining: {timeLeft} seconds
          </div>
          <div className="w-full bg-muted rounded-full h-2 mb-4">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-1000"
              style={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
            ></div>
          </div>
          {canCancel && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="mt-4"
            >
              <X className="w-4 h-4 mr-2" />
              Cancel Order
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}