import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "en" | "ar";

interface TranslationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Common
    "home": "Home",
    "games": "Games",
    "categories": "Categories",
    "support": "Support",
    "cart": "Cart",
    "checkout": "Checkout",
    "search": "Search",
    "add_to_cart": "Add to Cart",
    "view": "View",
    "price": "Price",
    "stock": "Stock",
    "popular": "Popular",
    "back": "Back",
    "loading": "Loading...",
    "error": "Error",
    "success": "Success",
    
    // FAQ
    "faq_title": "Frequently Asked Questions",
    "faq_subtitle": "Find answers to common questions about our services, payments, and delivery.",
    "contact_support": "Contact Support",
    "still_have_questions": "Still have questions? Contact our support team!",
    
    // Terms
    "terms_title": "Terms of Service",
    "last_updated": "Last updated",
    
    // Privacy
    "privacy_title": "Privacy Policy",
    
    // Refunds
    "refunds_title": "Refund Policy",
    
    // Track Order
    "track_order_title": "Track Your Order",
    "enter_order_id": "Enter your order ID to check the status of your purchase.",
    "order_id": "Order ID",
    "status": "Status",
    "payment_method": "Payment Method",
    "total_amount": "Total Amount",
    "order_date": "Order Date",
    "items": "Items",
    "track_order": "Track Order",
    "tracking": "Tracking...",
    
    // Common actions
    "back_to_home": "Back to Home",
  },
  ar: {
    // Common
    "home": "الرئيسية",
    "games": "الألعاب",
    "categories": "الفئات",
    "support": "الدعم",
    "cart": "السلة",
    "checkout": "الدفع",
    "search": "بحث",
    "add_to_cart": "أضف إلى السلة",
    "view": "عرض",
    "price": "السعر",
    "stock": "المخزون",
    "popular": "شائع",
    "back": "رجوع",
    "loading": "جاري التحميل...",
    "error": "خطأ",
    "success": "نجح",
    
    // FAQ
    "faq_title": "الأسئلة الشائعة",
    "faq_subtitle": "ابحث عن إجابات للأسئلة الشائعة حول خدماتنا والدفع والتسليم.",
    "contact_support": "اتصل بالدعم",
    "still_have_questions": "لا تزال لديك أسئلة؟ اتصل بفريق الدعم لدينا!",
    
    // Terms
    "terms_title": "شروط الخدمة",
    "last_updated": "آخر تحديث",
    
    // Privacy
    "privacy_title": "سياسة الخصوصية",
    
    // Refunds
    "refunds_title": "سياسة الاسترداد",
    
    // Track Order
    "track_order_title": "تتبع طلبك",
    "enter_order_id": "أدخل معرف الطلب للتحقق من حالة الشراء.",
    "order_id": "معرف الطلب",
    "status": "الحالة",
    "payment_method": "طريقة الدفع",
    "total_amount": "المبلغ الإجمالي",
    "order_date": "تاريخ الطلب",
    "items": "العناصر",
    "track_order": "تتبع الطلب",
    "tracking": "جاري التتبع...",
    
    // Common actions
    "back_to_home": "العودة إلى الرئيسية",
  }
};

const TranslationContext = createContext<TranslationContextType | undefined>(undefined);

export function TranslationProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("language") as Language | null;
      return saved || "en";
    }
    return "en";
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("language", language);
      document.documentElement.dir = language === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = language;
    }
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <TranslationContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </TranslationContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(TranslationContext);
  if (!context) {
    throw new Error("useTranslation must be used within TranslationProvider");
  }
  return context;
}

