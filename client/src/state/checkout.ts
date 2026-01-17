
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CartItem = {
  id: string;
  name: string;
  image?: string;
  price: number;
  quantity: number;
  gameId?: string;
};

export type ContactDetails = {
  fullName: string;
  email: string;
  phone: string;
  countryCode?: string;
  notes?: string;
};

export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'credit_card' | 'other';

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
    key: 'vodafone_cash',
    label: 'Vodafone Cash',
    logo: '/payments/vodafone-logo.png',
    info: {
      accountNumber: '01068586636',
      instructions: 'Send the total amount to this Vodafone Cash wallet and upload the transfer receipt.'
    }
  },
  {
    key: 'instapay',
    label: 'InstaPay',
    logo: '/payments/instapay-logo.png',
    info: {
      accountNumber: 'diaaeldeen@instapay',
      instructions: 'Send via InstaPay to this address and upload your transfer confirmation.'
    }
  },
  {
    key: 'orange_cash',
    label: 'Orange Cash',
    logo: '/payments/orange-logo-new.png',
    info: {
      accountNumber: '01068586636',
      instructions: 'Send the total amount to this Orange Cash wallet and upload the receipt.'
    }
  },
  {
    key: 'etisalat_cash',
    label: 'Etisalat Cash',
    logo: '/payments/etisalat-logo.png',
    info: {
      accountNumber: '01068586636',
      instructions: 'Send the total amount to this Etisalat Cash wallet and upload the receipt.'
    }
  },
  {
    key: 'we_pay',
    label: 'WePay',
    logo: '/payments/we-pay-logo.png',
    info: {
      accountNumber: '01068586636',
      instructions: 'Send the total amount to this WePay wallet and upload the receipt.'
    }
  },
  {
    key: 'credit_card',
    label: 'PayPal',
    logo: '/payments/paypal-logo.png',
    info: {
      accountNumber: 'diaaeldeen@paypal.com',
      instructions: 'Send payment via PayPal and upload the confirmation screenshot.'
    }
  },
  {
    key: 'other',
    label: 'Other Methods',
    logo: '/favicon.png',
    info: { instructions: 'Contact support on WhatsApp for other payment options.' }
  }
];

export type CheckoutStep = 'cart' | 'details' | 'payment' | 'review' | 'processing' | 'result';

export type OrderStatus = 'idle' | 'processing' | 'paid' | 'failed' | 'pending_approval';

export interface CheckoutState {
  step: CheckoutStep;
  cart: CartItem[];
  contact: ContactDetails;
  paymentMethod?: PaymentMethod;
  paymentData?: any; // For extra fields like receipt, player ID
  idempotencyKey?: string;
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
  setPaymentData: (d: any) => void;
  setIdempotencyKey: (k: string) => void;
  setOrderMeta: (id?: string, status?: OrderStatus) => void;
  setError: (e?: string) => void;
  reset: () => void;
}

const initialContact: ContactDetails = { fullName: '', email: '', phone: '', countryCode: '+20', notes: '' };

export function generateIdempotencyKey() {
  return 'idemp_' + Math.random().toString(36).substring(2, 15);
}

export function ensureIdempotencyKey() {
  const state = useCheckout.getState();
  if (state.idempotencyKey) return state.idempotencyKey;

  const newKey = generateIdempotencyKey();
  state.setIdempotencyKey(newKey);
  return newKey;
}

export const useCheckout = create<CheckoutState>()(
  persist(
    (set, get) => ({
      step: 'cart',
      cart: [],
      contact: initialContact,
      paymentMethod: undefined,
      paymentData: {},
      idempotencyKey: generateIdempotencyKey(),
      orderId: undefined,
      orderStatus: 'idle',
      error: undefined,

      subtotal: () => {
        return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
      },
      total: () => {
        return get().subtotal();
      },

      setStep: (s) => set({ step: s }),
      setCart: (items) => set({ cart: items }),
      updateItemQty: (id, qty) => set((state) => ({
        cart: state.cart.map((i) => (i.id === id ? { ...i, quantity: qty } : i))
      })),
      removeItem: (id) => set((state) => ({
        cart: state.cart.filter((i) => i.id !== id)
      })),
      clearCart: () => set({ cart: [] }),
      setContact: (c) => set((state) => ({ contact: { ...state.contact, ...c } })),
      setPaymentMethod: (m) => set({ paymentMethod: m }),
      setPaymentData: (d) => set((state) => ({ paymentData: { ...state.paymentData, ...d } })),
      setIdempotencyKey: (k) => set({ idempotencyKey: k }),
      setOrderMeta: (id, status) => set((state) => ({
        orderId: id !== undefined ? id : state.orderId,
        orderStatus: status !== undefined ? status : state.orderStatus
      })),
      setError: (e) => set({ error: e }),
      reset: () => set((state) => ({
        step: 'cart',
        cart: [],
        contact: state.contact, // Preserve contact details for convenience
        paymentMethod: undefined,
        paymentData: {},
        idempotencyKey: generateIdempotencyKey(),
        orderId: undefined,
        orderStatus: 'idle',
        error: undefined
      }))
    }),
    {
      name: 'checkout-storage',
      skipHydration: false,
    }
  )
);
