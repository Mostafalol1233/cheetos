import React, { useEffect } from 'react';
import { useCheckout, PaymentMethod } from '../../state/checkout';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';
import { PaymentIcon } from '../payment-icon';

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export const PaymentMethods: React.FC = () => {
  const { paymentMethod, setPaymentMethod, availablePaymentMethods, fetchPaymentMethods, error } = useCheckout();
  const [loading, setLoading] = React.useState(true);

  useEffect(() => {
    fetchPaymentMethods().finally(() => setLoading(false));
  }, [fetchPaymentMethods]);

  const onSelect = (m: PaymentMethod) => {
    setPaymentMethod(m);
  };

  if (loading) {
     return <div className="text-center py-4 text-muted-foreground">Loading payment methods...</div>;
  }

  if (availablePaymentMethods.length === 0) {
    return (
      <div className="text-center py-4 text-destructive">
        {error || "No payment methods available. Please contact support."}
      </div>
    );
  }

  return (
    <div>
      <div role="radiogroup" aria-label="Payment methods" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {availablePaymentMethods.map((m) => {
          const selected = paymentMethod === m.key;
          return (
            <Card
              key={m.key}
              className={classNames(
                'relative cursor-pointer transition-all duration-200 hover:shadow-md focus-within:ring-2 focus-within:ring-primary',
                selected ? 'ring-2 ring-primary border-primary bg-primary/5' : 'hover:border-primary/50'
              )}
              onClick={() => onSelect(m.key)}
              role="radio"
              aria-checked={selected}
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelect(m.key);
                }
              }}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="h-12 w-12 md:h-14 md:w-14 flex items-center justify-center rounded-xl bg-card">
                      <PaymentIcon methodKey={m.key} className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{m.label}</h3>
                      {m.info?.accountNumber && (
                        <p className="text-sm text-muted-foreground font-mono">{m.info.accountNumber}</p>
                      )}
                      {m.info?.address && (
                        <p className="text-sm text-muted-foreground font-mono">{m.info.address}</p>
                      )}
                      {m.info?.email && (
                        <p className="text-sm text-muted-foreground font-mono">{m.info.email}</p>
                      )}
                    </div>
                  </div>
                  {selected && (
                    <CheckCircle className="h-6 w-6 text-primary" aria-hidden="true" />
                  )}
                </div>
                {m.info?.instructions && (
                  <p className="text-sm text-muted-foreground mt-2">{m.info.instructions}</p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};
