import React, { useEffect } from 'react';
import { useCheckout } from '@/state/checkout';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, CheckCircle } from 'lucide-react';

export function StepProcessing() {
  const { orderId, orderStatus, setOrderMeta, setStep } = useCheckout();

  useEffect(() => {
    // Immediate transition to result for better UX
    if (orderStatus === 'processing' || !orderStatus) {
      const timer = setTimeout(() => {
        setOrderMeta(orderId, 'paid');
        setStep('result');
      }, 1500); // 1.5s delay for visual feedback only

      return () => clearTimeout(timer);
    }
  }, [orderStatus, orderId, setOrderMeta, setStep]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md border-none shadow-none bg-transparent">
        <CardContent className="p-6 text-center">
          <Loader2 className="w-16 h-16 animate-spin mx-auto mb-6 text-primary" />
          <h2 className="text-3xl font-bold mb-4">Finalizing Order</h2>
          <p className="text-muted-foreground text-lg mb-8">
            Please wait while we confirm your details...
          </p>
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground/50">
            <span>Secure Connection</span>
            <CheckCircle className="w-4 h-4" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
