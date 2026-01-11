import React from 'react';
import { useCheckout } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export function StepResult() {
  const { orderStatus, orderId, error, reset } = useCheckout();

  const isSuccess = orderStatus === 'paid';
  const isFailed = orderStatus === 'failed';

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {isSuccess ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">
                Order Successful!
              </h2>
              <p className="text-muted-foreground mb-4">
                Your order has been placed successfully. We'll contact you soon with the next steps.
              </p>
              {orderId && (
                <p className="text-sm text-muted-foreground mb-4">
                  Order ID: {orderId}
                </p>
              )}
            </>
          ) : isFailed ? (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">
                Order Failed
              </h2>
              <p className="text-muted-foreground mb-4">
                {error || 'There was an issue processing your order. Please try again.'}
              </p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-700 mb-2">
                Order Pending
              </h2>
              <p className="text-muted-foreground mb-4">
                Your order is being processed. Please check back later.
              </p>
            </>
          )}

          <Button onClick={reset} className="w-full">
            {isSuccess ? 'Place Another Order' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}