
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
  password?: string;
  countryCode?: string;
  notes?: string;
  deliveryMethod?: 'email' | 'whatsapp';
};

export type PaymentMethod = 'vodafone_cash' | 'instapay' | 'orange_cash' | 'etisalat_cash' | 'we_pay' | 'credit_card' | 'other';

export type PaymentConfig = {
  key: PaymentMethod;
  label: string;
  type?: string; // 'wallet', 'instapay', 'card'
  info?: {
    accountNumber?: string;
    instructions?: string;
    address?: string;
    email?: string;
  }
};

// Deprecated: Use availablePaymentMethods from state instead
// PAYMENT_METHODS removed to prevent static data usage
export const PAYMENT_METHODS: PaymentConfig[] = [];

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
  generatedPassword?: string;
  availablePaymentMethods: PaymentConfig[];
  promoCode?: string;
  promoDiscount: number;

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
  setGeneratedPassword: (p?: string) => void;
  setError: (e?: string) => void;
  setPromoCode: (code?: string, discount?: number) => void;
  reset: () => void;
  fetchPaymentMethods: () => Promise<void>;
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

let hasClearedLegacyCheckoutStorage = false;

function clearLegacyCheckoutStorageOnce() {
  if (hasClearedLegacyCheckoutStorage) return;
  hasClearedLegacyCheckoutStorage = true;
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const raw = window.localStorage.getItem('checkout-storage');
    if (!raw) return;
    const data = JSON.parse(raw);
    if (data && typeof data === 'object' && ('step' in data || 'orderStatus' in data || 'orderId' in data)) {
      window.localStorage.removeItem('checkout-storage');
    }
  } catch {
  }
}

export function clearCheckoutStorage() {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.removeItem('checkout-storage');
    }
  } catch (e) {
    console.error('Failed to clear checkout storage', e);
  }
}

export const useCheckout = create<CheckoutState>()(
  persist(
    (set, get) => {
      clearLegacyCheckoutStorageOnce();
      return {
        step: 'cart',
        cart: [],
        contact: initialContact,
        paymentMethod: undefined,
        paymentData: {},
        idempotencyKey: generateIdempotencyKey(),
        orderId: undefined,
        orderStatus: 'idle',
        error: undefined,
        generatedPassword: undefined,
        availablePaymentMethods: [],
        promoCode: undefined,
        promoDiscount: 0,

        subtotal: () => {
          return get().cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
        },
        total: () => {
          return Math.max(0, get().subtotal() - get().promoDiscount);
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
        setGeneratedPassword: (p) => set({ generatedPassword: p }),
        setError: (e) => set({ error: e }),
        setPromoCode: (code, discount) => set({ promoCode: code, promoDiscount: discount ?? 0 }),
        reset: () => {
          clearCheckoutStorage();
          set({
            step: 'cart',
            cart: [],
            contact: initialContact,
            paymentMethod: undefined,
            paymentData: {},
            idempotencyKey: generateIdempotencyKey(),
            orderId: undefined,
            orderStatus: 'idle',
            error: undefined,
            generatedPassword: undefined,
            promoCode: undefined,
            promoDiscount: 0,
          })
        },
        fetchPaymentMethods: async () => {
          try {
            const res = await fetch('/api/payments/config');
            if (!res.ok) throw new Error('Failed to fetch payment methods');
            const data = await res.json();
            const methods: PaymentConfig[] = data.map((m: any) => ({
              key: m.id,
              label: m.name,
              type: m.type,
              info: {
                accountNumber: m.details?.number,
                address: m.details?.address,
                email: m.details?.email,
                instructions: m.details?.instructions
              }
            }));
            set({ availablePaymentMethods: methods });
          } catch (error) {
            console.error('Error loading payment methods:', error);
            // Fallback to empty or error state
            set({ availablePaymentMethods: [] });
          }
        }
      };
    },
    {
      name: 'checkout-storage',
      partialize: (state) => ({
        cart: state.cart,
        contact: state.contact,
        // Only persist early steps. If in review/processing/result, reset to cart to force re-verification.
        step: (['cart', 'details', 'payment'].includes(state.step)) ? state.step : 'cart'
      })
    }
  )
);
