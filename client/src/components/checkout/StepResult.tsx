import React from 'react';
import { useCheckout } from '@/state/checkout';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, XCircle } from 'lucide-react';

export function StepResult() {
  const { orderStatus, orderId, error, reset, contact } = useCheckout();

  // Treat pending_approval as success from user perspective (order created successfully)
  const isSuccess = orderStatus === 'paid' || orderStatus === 'pending_approval';
  const isFailed = orderStatus === 'failed';

  const credsRaw = typeof window !== 'undefined' ? localStorage.getItem('new_user_creds') : null;
  const creds = React.useMemo(() => {
    try {
      return credsRaw ? JSON.parse(credsRaw) : null;
    } catch {
      return null;
    }
  }, [credsRaw]);

  const emailToShow = creds?.email || contact?.email;
  const passwordToShow = creds?.password;

  const copyText = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
  };

  React.useEffect(() => {
    if (!isSuccess) return;

    // Redirect user to profile so they can track order status.
    const timer = window.setTimeout(() => {
      window.location.href = '/profile';
    }, 1200);

    return () => window.clearTimeout(timer);
  }, [isSuccess]);

  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <Card className="w-full max-w-md">
        <CardContent className="p-6 text-center">
          {isSuccess ? (
            <>
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-green-700 mb-2">Order Created!</h2>
              <p className="text-muted-foreground mb-4">
                Your order has been submitted successfully. Redirecting to your profile to track the status...
              </p>

              {orderId && (
                <div className="flex items-center justify-center gap-2 mb-3">
                  <p className="text-sm text-muted-foreground">Order ID: {orderId}</p>
                </div>
              )}

              {(emailToShow || passwordToShow) && (
                <div className="text-left border rounded-lg p-3 bg-muted/40 space-y-2 mb-4">
                  <p className="text-sm font-semibold">Your account credentials</p>

                  {emailToShow && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs break-all">
                        <span className="text-muted-foreground">Email:</span> {emailToShow}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => copyText(String(emailToShow))}>
                        Copy
                      </Button>
                    </div>
                  )}

                  {passwordToShow && (
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs break-all">
                        <span className="text-muted-foreground">Password:</span> {passwordToShow}
                      </div>
                      <Button type="button" variant="outline" size="sm" onClick={() => copyText(String(passwordToShow))}>
                        Copy
                      </Button>
                    </div>
                  )}

                  <p className="text-[11px] text-muted-foreground">Save these details to login from another device.</p>
                </div>
              )}
            </>
          ) : isFailed ? (
            <>
              <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-red-700 mb-2">Order Failed</h2>
              <p className="text-muted-foreground mb-4">{error || 'There was an issue processing your order. Please try again.'}</p>
            </>
          ) : (
            <>
              <XCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-yellow-700 mb-2">Order Pending</h2>
              <p className="text-muted-foreground mb-4">Your order is being processed. Please check back later.</p>
            </>
          )}

          <Button
            onClick={() => {
              if (isSuccess) {
                window.location.href = '/profile';
                return;
              }
              reset();
              window.location.href = '/checkout';
            }}
            className="w-full"
          >
            {isSuccess ? 'Go to Profile' : 'Try Again'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
