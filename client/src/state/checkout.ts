
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
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/vodafone.png',
    info: { 
      accountNumber: '010XXXXXXXX',
      instructions: 'Send the total amount to this wallet number and upload the receipt.'
    }
  },
  {
    key: 'instapay',
    label: 'InstaPay',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/instapay.png',
    info: { 
      accountNumber: 'username@instapay',
      instructions: 'Send via InstaPay to this address and upload the receipt.'
    }
  },
  {
    key: 'orange_cash',
    label: 'Orange Cash',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/orange.png',
    info: { 
      accountNumber: '012XXXXXXXX',
      instructions: 'Send the total amount to this wallet number and upload the receipt.'
    }
  },
  {
    key: 'etisalat_cash',
    label: 'Etisalat Cash',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/etisalat.png',
    info: { 
      accountNumber: '011XXXXXXXX',
      instructions: 'Send the total amount to this wallet number and upload the receipt.'
    }
  },
  {
    key: 'we_pay',
    label: 'WePay',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/we.png',
    info: { 
      accountNumber: '015XXXXXXXX',
      instructions: 'Send the total amount to this wallet number and upload the receipt.'
    }
  },
  {
    key: 'credit_card',
    label: 'Credit Card',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/mastercard.png', 
    info: { instructions: 'Secure payment via Credit/Debit Card.' }
  },
  {
    key: 'other',
    label: 'Other Methods',
    logo: 'https://raw.githubusercontent.com/game-cart/assets/main/payments/generic.png', 
    info: { instructions: 'Contact support for other payment options.' }
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
