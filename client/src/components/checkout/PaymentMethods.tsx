import React from 'react';
import { PAYMENT_METHODS, PaymentMethod, useCheckout } from '../../state/checkout';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle } from 'lucide-react';

function classNames(...xs: Array<string | false | undefined>) {
  return xs.filter(Boolean).join(' ');
}

export const PaymentMethods: React.FC = () => {
  const { paymentMethod, setPaymentMethod } = useCheckout();

  const onSelect = (m: PaymentMethod) => {
    setPaymentMethod(m);
  };

  return (
    <div>
      <div role="radiogroup" aria-label="Payment methods" className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {PAYMENT_METHODS.map((m) => {
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
                    <img src={m.logo} alt="" className="h-12 w-12 object-contain" />
                    <div>
                      <h3 className="font-semibold text-lg">{m.label}</h3>
                      {m.info?.accountNumber && (
                        <p className="text-sm text-muted-foreground font-mono">{m.info.accountNumber}</p>
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

      {/* Selected method details */}
      {paymentMethod && (
        <div className="mt-6 p-4 bg-muted rounded-lg">
          {(() => {
            const conf = PAYMENT_METHODS.find(c => c.key === paymentMethod)!;
            const number = conf.info?.accountNumber;
            return (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <img src={conf.logo} alt="" className="h-8 w-8 object-contain" />
                  <div>
                    <h4 className="font-medium">{conf.label} Selected</h4>
                    <p className="text-sm text-muted-foreground">Complete your payment using this method</p>
                  </div>
                </div>
                {number && (
                  <div className="flex items-center gap-2 p-2 bg-background rounded border">
                    <span className="text-sm font-mono select-all" aria-label="Recipient number">{number}</span>
                    <button
                      type="button"
                      className="ml-auto px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
                      onClick={async () => {
                        try {
                          await navigator.clipboard.writeText(number);
                        } catch {}
                      }}
                      aria-label="Copy number"
                    >
                      Copy
                    </button>
                  </div>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
