
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

export type PaymentMethod = 'credit_card' | 'paypal' | 'whatsapp' | 'other';

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
    key: 'credit_card',
    label: 'Credit Card',
    logo: '/payments-images/instapay-logo.png', // Placeholder for card/bank
    info: { instructions: 'Pay securely using your Credit Card.' }
  },
  {
    key: 'paypal',
    label: 'PayPal',
    logo: '/payments-images/paypal-logo.png',
    info: { instructions: 'Fast and secure payment via PayPal.' }
  },
  {
    key: 'whatsapp',
    label: 'WhatsApp Order',
    logo: '/payments-images/vodafone-logo.png', // Representative of mobile wallets
    info: { instructions: 'Complete your order via WhatsApp chat.' }
  },
  {
    key: 'other',
    label: 'Other Methods',
    logo: '/payments-images/we-pay-logo.png', // Generic placeholder
    info: { instructions: 'Upload receipt or pay via Player ID.' }
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

function generateIdempotencyKey() {
  return 'idemp_' + Math.random().toString(36).substring(2, 15);
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
      reset: () => set({
        step: 'cart',
        cart: [],
        contact: initialContact,
        paymentMethod: undefined,
        paymentData: {},
        idempotencyKey: generateIdempotencyKey(),
        orderId: undefined,
        orderStatus: 'idle',
        error: undefined
      })
    }),
    {
      name: 'checkout-storage',
      skipHydration: false,
    }
  )
);
