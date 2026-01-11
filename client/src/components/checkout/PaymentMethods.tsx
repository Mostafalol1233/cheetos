import React from 'react';
import { PAYMENT_METHODS, PaymentMethod, useCheckout } from '../../state/checkout';

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
      <div role="radiogroup" aria-label="Payment methods" className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {PAYMENT_METHODS.map((m) => {
          const selected = paymentMethod === m.key;
          return (
            <button
              key={m.key}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() => onSelect(m.key)}
              className={classNames(
                'relative flex flex-col items-center justify-center rounded-lg border p-3 focus:outline-none focus:ring-2 focus:ring-offset-2',
                selected ? 'border-blue-600 ring-2 ring-blue-600' : 'border-gray-300 hover:border-gray-400'
              )}
            >
              <img src={m.logo} alt="" className="h-10 w-10 object-contain" />
              <span className="mt-2 text-sm font-medium text-gray-900">{m.label}</span>
              {selected && (
                <span aria-hidden className="absolute top-1 right-1 h-5 w-5 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs">✓</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Provider-specific info panel */}
      {paymentMethod && (
        <div className="mt-4 rounded-md border border-gray-200 p-4 bg-gray-50">
          {(() => {
            const conf = PAYMENT_METHODS.find(c => c.key === paymentMethod)!;
            const number = conf.info?.accountNumber;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <img src={conf.logo} alt="" className="h-6 w-6 object-contain" />
                  <div className="text-sm font-medium text-gray-900">{conf.label} details</div>
                </div>
                {number && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-700 select-all" aria-label="Recipient number">{number}</span>
                    <button
                      type="button"
                      className="ml-2 inline-flex items-center rounded bg-gray-800 px-2 py-1 text-xs font-semibold text-white hover:bg-black focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                {conf.info?.instructions && (
                  <p className="text-xs text-gray-600">{conf.info.instructions}</p>
                )}
              </div>
            );
          })()}
        </div>
      )}
    </div>
  );
};
