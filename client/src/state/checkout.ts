import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
};

export type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
  notes?: string;
};

export type PaymentMethod = 'orange_cash' | 'etisalat_cash' | 'vodafone_cash' | 'other';

export type PaymentConfig = {
  key: PaymentMethod;
  label: string;
  logo: string; // path or url
  info?: {
    accountNumber?: string;
    instructions?: string;
  }
};

export const PAYMENT_METHODS: PaymentConfig[] = [
  {
    key: 'orange_cash',
    label: 'Orange Cash',
    logo: '/images/mastercard.png',
    info: { accountNumber: '+201234567890', instructions: 'Send the exact amount, then share the transaction ID.' }
  },
  {
    key: 'etisalat_cash',
    label: 'Etisalat Cash',
    logo: '/images/visa.png',
    info: { accountNumber: '+201109998877', instructions: 'Transfer via Etisalat Cash and keep your ref code.' }
  },
  {
    key: 'vodafone_cash',
    label: 'Vodafone Cash',
    logo: '/images/vodafone.png',
    info: { accountNumber: '+201000112233', instructions: 'Use Vodafone Cash; fees are paid by sender.' }
  },
  {
    key: 'other',
    label: 'Other',
    logo: '/images/paypal.png',
    info: { instructions: 'Choose this if you want a different method; we will contact you.' }
  }
];

export type CheckoutStep = 'cart' | 'details' | 'payment' | 'review' | 'processing' | 'result';

export type OrderStatus = 'idle' | 'processing' | 'paid' | 'failed';

export interface CheckoutState {
  step: CheckoutStep;
  cart: CartItem[];
  contact: ContactDetails;
  paymentMethod?: PaymentMethod;
  idempotencyKey?: string; // prevents duplicate orders
  orderId?: string;
  orderStatus: OrderStatus;
  error?: string;

  // derived helpers
  subtotal: () => number;
  total: () => number;

  // actions
  setStep: (s: CheckoutStep) => void;
  setCart: (items: CartItem[]) => void;
  updateItemQty: (id: string, qty: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
  setContact: (c: Partial<ContactDetails>) => void;
  setPaymentMethod: (m?: PaymentMethod) => void;
  setIdempotencyKey: (k: string) => void;
  setOrderMeta: (id?: string, status?: OrderStatus) => void;
  setError: (e?: string) => void;
  reset: () => void;
}

const initialContact: ContactDetails = { fullName: '', email: '', phone: '', notes: '' };

function generateIdempotencyKey() {
  // RFC4122 v4-like simple generator
  return 'idemp_' + crypto.getRandomValues(new Uint32Array(4)).join('-');
}

export const useCheckout = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 'cart',
      cart: [],
      contact: initialContact,
      paymentMethod: undefined,
      idempotencyKey: undefined,
      orderId: undefined,
      orderStatus: 'idle',
      error: undefined,

      subtotal: () => get().cart.reduce((s, it) => s + it.price * it.quantity, 0),
      total: () => get().subtotal(),

      setStep: (s) => set({ step: s }),
      setCart: (items) => set({ cart: items }),
      updateItemQty: (id, qty) => set({ cart: get().cart.map(it => it.id === id ? { ...it, quantity: Math.max(1, qty) } : it) }),
      removeItem: (id) => set({ cart: get().cart.filter(it => it.id !== id) }),
      clearCart: () => set({ cart: [] }),
      setContact: (c) => set({ contact: { ...get().contact, ...c } }),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setIdempotencyKey: (k) => set({ idempotencyKey: k }),
      setOrderMeta: (id, status) => set({ orderId: id, orderStatus: status ?? get().orderStatus }),
      setError: (e) => set({ error: e }),
      reset: () => set({ step: 'cart', cart: [], contact: initialContact, paymentMethod: undefined, idempotencyKey: undefined, orderId: undefined, orderStatus: 'idle', error: undefined })
    }),
    {
      name: 'checkout-state-v1',
      partialize: (state) => ({
        step: state.step,
        cart: state.cart,
        contact: state.contact,
        paymentMethod: state.paymentMethod,
        idempotencyKey: state.idempotencyKey,
        orderId: state.orderId,
        orderStatus: state.orderStatus,
      })
    }
  )
);

export function ensureIdempotencyKey() {
  const { idempotencyKey, setIdempotencyKey } = useCheckout.getState();
  if (!idempotencyKey) {
    const key = generateIdempotencyKey();
    setIdempotencyKey(key);
    return key;
  }
  return idempotencyKey;
}
