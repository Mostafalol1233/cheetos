import React from 'react';
import { useCheckout } from '../../state/checkout';

export const OrderSummary: React.FC = () => {
  const { cart, subtotal, total, removeItem, updateItemQty } = useCheckout();

  if (cart.length === 0) {
    return (
      <div className="rounded-md border p-4 text-sm text-gray-600">Your cart is empty.</div>
    );
  }

  return (
    <div className="rounded-md border p-4">
      <h3 className="text-base font-semibold mb-3">Order summary</h3>
      <ul className="divide-y">
        {cart.map(item => (
          <li key={item.id} className="py-3 flex items-center gap-3">
            {item.image && <img src={item.image} alt="" className="h-12 w-12 rounded object-cover" />}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-gray-900 truncate">{item.name}</div>
              <div className="text-xs text-gray-600">${item.price.toFixed(2)}</div>
            </div>
            <div className="flex items-center gap-2">
              <label className="sr-only" htmlFor={`qty-${item.id}`}>Quantity</label>
              <input
                id={`qty-${item.id}`}
                type="number"
                min={1}
                className="w-16 rounded border px-2 py-1 text-sm"
                value={item.quantity}
                onChange={(e) => updateItemQty(item.id, parseInt(e.target.value || '1', 10))}
              />
              <button
                type="button"
                className="text-sm text-red-600 hover:underline"
                onClick={() => removeItem(item.id)}
              >Remove</button>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex justify-between text-sm">
        <span>Subtotal</span>
        <span>${subtotal().toFixed(2)}</span>
      </div>
      <div className="mt-1 flex justify-between text-base font-semibold">
        <span>Total</span>
        <span>${total().toFixed(2)}</span>
      </div>
    </div>
  );
};
