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
    "unknown": "Unknown",
    "egp": "EGP",
    
    // FAQ
    "faq_title": "Frequently Asked Questions",
    "faq_subtitle": "Find answers to common questions about our services, payments, and delivery.",
    "contact_support": "Contact Support",
    "still_have_questions": "Still have questions? Contact our support team!",

    "faq_q1": "How do I purchase game currency or gift cards?",
    "faq_a1": "Browse our games, select the package you want, add it to your cart, and proceed to checkout. You can pay via Vodafone Cash, Orange Cash, PayPal, or other available payment methods.",
    "faq_q2": "How long does delivery take?",
    "faq_a2": "Most digital products are delivered instantly after payment confirmation.",
    "faq_q3": "What payment methods do you accept?",
    "faq_a3": "We accept Vodafone Cash, Orange Cash, Etisalat Cash, WE Pay, InstaPay, Bank Transfer, and PayPal.",
    "faq_q4": "Is my payment information secure?",
    "faq_a4": "Yes, we use encrypted payment processing and never store your full payment details.",
    "faq_q5": "Can I get a refund?",
    "faq_a5": "Refunds are available for unused products within 7 days of purchase. Please contact support for assistance.",
    "faq_q6": "What if I don't receive my order?",
    "faq_a6": "If you don't receive your order within the expected timeframe, please contact our support team.",
    "faq_q7": "Do you offer customer support?",
    "faq_a7": "Yes! We offer 24/7 customer support via live chat on our website or WhatsApp.",
    "faq_q8": "Are your prices competitive?",
    "faq_a8": "Absolutely! We offer the best prices in the market with regular discounts and special offers.",
    
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

    // Header / Nav
    "live_chat": "Live Chat",
    "premium_store": "Premium Store",

    // Home
    "hero_title": "LEVEL UP YOUR GAME",
    "hero_subtitle": "Premium Currencies, Gift Cards & Instant Delivery",
    "shop_now": "Shop Now",
    "view_all_games": "View All Games",
    "shopping_categories": "Shopping Categories",
    "popular_games": "Most Popular Games",
    "features_fast_delivery": "Fast Delivery",
    "features_fast_delivery_desc": "Get your products quickly and reliably.",
    "features_online_support": "Online Support",
    "features_online_support_desc": "24 hours a day, 7 days a week.",
    "features_secure_payment": "Secure Payment",
    "features_secure_payment_desc": "Pay with Multiple Payment Methods.",
    "features_best_prices": "Best Prices",
    "features_best_prices_desc": "Discover unbeatable prices.",
    "about_title": "About Diaa Eldeen",
    "about_p1": "Welcome to Diaa Eldeen - Your trusted gaming partner since day one. We specialize in providing premium digital gaming products with fast delivery and exceptional customer service.",
    "about_p2": "Our mission is to make gaming accessible and affordable for everyone. Whether you're looking for game currencies, gift cards, or digital vouchers, we've got you covered with the best prices and fastest delivery in the market.",
    "happy_customers": "Happy Customers",
    "orders_completed": "Orders Completed",
    "customer_support": "Customer Support",
    "reviews_title": "What Our Customers Say",
    "reviews_subtitle": "Real testimonials from real gamers",

    // Cart
    "shopping_cart": "Shopping Cart",
    "cart_empty": "Your cart is empty",
    "total": "Total",
    "checkout_whatsapp": "Continue (Choose payment method)",

    "complete_order": "Complete Your Order",
    "checkout_desc": "Provide your contact details and payment method to create the order.",
    "order_summary": "Order Summary",
    "confirmation_method": "Confirmation Method",
    "whatsapp": "WhatsApp",
    "live_message_secure": "Live Message (Secure)",
    "live_redirect_hint": "You will be redirected to a security page to submit your payment message and receipt.",
    "full_name": "Full Name",
    "enter_full_name": "Enter your full name",
    "country": "Country",
    "phone_number": "Phone Number",
    "transfer_number": "Transfer number",
    "transfer_numbers": "Transfer numbers",
    "account": "Account",
    "paypal_account": "PayPal Account",
    "bank": "Bank",
    "send_order_whatsapp": "Send Order via WhatsApp",
    "proceed_secure_confirmation": "Proceed to Secure Confirmation",
    "please_fill_required": "Please fill in all required fields",
    "invalid_phone": "Please enter a valid phone number",
    "purchase_confirmed": "Purchase Confirmed",
    "transaction_initiated": "Transaction initiated",


    // Game
    "available_packages": "Available Packages",
    "includes_taxes": "Includes taxes",
    "package": "Package",
    "default_package": "Default Package",
    "out_of_stock": "Out of Stock",
    "in_stock": "In Stock",
    "added_to_cart": "Added to cart",
    "item_unavailable": "This item is currently unavailable.",
    "game_not_found": "Game Not Found",
    "game_not_found_desc": "The requested game could not be found.",

    "available_games": "Available Games",
    "games_found": "games found",
    "more_packages": "more packages",
    "starting_from": "Starting from",
    "buy": "Buy",
    "no_games_available": "No Games Available",
    "no_games_in_category": "There are currently no games available in this category.",
    "browse_other_categories": "Browse Other Categories",
    "category_not_found": "Category Not Found",
    "category_not_found_desc": "The category you're looking for doesn't exist.",

    "hot": "HOT",
    "loading_preview": "Loading Preview...",
    "fast_delivery": "Fast Delivery",
    "stock_label": "Stock",

    "browse_games_desc": "Browse our complete collection of games",
    "all_categories": "All Categories",
    "no_games_found": "No Games Found",
    "try_adjust_search": "Try adjusting your search or filter criteria.",
    "clear_filters": "Clear Filters",
    "added": "Added!",
    "add": "Add",

    // Generic UI
    "explore_now": "Explore Now",
    "loading_popular_games": "Loading popular games...",
    "standard_package_available": "Standard Package Available",
    "in_stock_prefix": "In Stock",
    "view_details": "View Details",
    "preview": "Preview",
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
    "unknown": "غير معروف",
    "egp": "جنيه",
    
    // FAQ
    "faq_title": "الأسئلة الشائعة",
    "faq_subtitle": "ابحث عن إجابات للأسئلة الشائعة حول خدماتنا والدفع والتسليم.",
    "contact_support": "اتصل بالدعم",
    "still_have_questions": "لا تزال لديك أسئلة؟ اتصل بفريق الدعم لدينا!",

    "faq_q1": "كيف يمكنني شراء عملات الألعاب أو بطاقات الهدايا؟",
    "faq_a1": "تصفح الألعاب، اختر الباقة، أضفها إلى السلة ثم أكمل الطلب. يمكنك الدفع عبر فودافون كاش أو أورنج كاش أو باي بال وغيرها.",
    "faq_q2": "كم يستغرق التسليم؟",
    "faq_a2": "معظم المنتجات الرقمية يتم تسليمها فور تأكيد الدفع.",
    "faq_q3": "ما طرق الدفع المتاحة؟",
    "faq_a3": "نقبل فودافون كاش، أورنج كاش، اتصالات كاش، WE Pay، إنستا باي، تحويل بنكي، وباي بال.",
    "faq_q4": "هل معلومات الدفع آمنة؟",
    "faq_a4": "نعم، نستخدم معالجة دفع مشفرة ولا نقوم بتخزين تفاصيل الدفع كاملة.",
    "faq_q5": "هل يمكنني استرداد المبلغ؟",
    "faq_a5": "يمكن الاسترداد للمنتجات غير المستخدمة خلال 7 أيام. تواصل مع الدعم للمساعدة.",
    "faq_q6": "ماذا لو لم يصلني طلبي؟",
    "faq_a6": "إذا لم يصل طلبك في الوقت المتوقع، تواصل مع الدعم وسنحل المشكلة فوراً.",
    "faq_q7": "هل يوجد دعم عملاء؟",
    "faq_a7": "نعم، دعم 24/7 عبر المحادثة المباشرة أو واتساب.",
    "faq_q8": "هل الأسعار تنافسية؟",
    "faq_a8": "بالتأكيد! نقدم أفضل الأسعار مع خصومات وعروض خاصة.",
    
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
    "total_amount": "المبلغ الإجمالي",
    "order_date": "تاريخ الطلب",
    "items": "العناصر",
    "track_order": "تتبع الطلب",
    "tracking": "جاري التتبع...",
    
    // Common actions
    "back_to_home": "العودة إلى الرئيسية",

    // Header / Nav
    "live_chat": "محادثة مباشرة",
    "premium_store": "متجر مميز",

    // Home
    "hero_title": "ارتقِ بلعبتك",
    "hero_subtitle": "عملات ألعاب، بطاقات هدايا وتسليم فوري",
    "shop_now": "تسوق الآن",
    "view_all_games": "عرض كل الألعاب",
    "shopping_categories": "فئات التسوق",
    "popular_games": "الأكثر طلباً",
    "features_fast_delivery": "تسليم سريع",
    "features_fast_delivery_desc": "احصل على منتجاتك بسرعة وبكل موثوقية.",
    "features_online_support": "دعم متواصل",
    "features_online_support_desc": "24 ساعة يومياً، 7 أيام بالأسبوع.",
    "features_secure_payment": "دفع آمن",
    "features_secure_payment_desc": "ادفع بطرق دفع متعددة.",
    "features_best_prices": "أفضل الأسعار",
    "features_best_prices_desc": "اكتشف أسعاراً لا تُنافس.",
    "about_title": "عن ضياء الدين",
    "about_p1": "مرحباً بك في ضياء الدين - شريكك الموثوق في عالم الألعاب منذ اليوم الأول. نوفّر منتجات رقمية مميزة بسرعة تسليم وخدمة عملاء ممتازة.",
    "about_p2": "مهمتنا جعل الألعاب سهلة ومتاحة للجميع. سواء كنت تبحث عن عملات الألعاب أو بطاقات الهدايا أو القسائم الرقمية، ستجد أفضل الأسعار وأسرع تسليم لدينا.",
    "happy_customers": "عملاء سعداء",
    "orders_completed": "طلبات مكتملة",
    "customer_support": "دعم العملاء",
    "reviews_title": "آراء عملائنا",
    "reviews_subtitle": "تجارب حقيقية من لاعبين حقيقيين",

    // Cart
    "shopping_cart": "سلة التسوق",
    "cart_empty": "سلتك فارغة",
    "total": "الإجمالي",
    "checkout_whatsapp": "متابعة (اختر طريقة الدفع)",

    "complete_order": "إتمام الطلب",
    "checkout_desc": "أدخل بيانات التواصل وطريقة الدفع لإنشاء الطلب.",
    "order_summary": "ملخص الطلب",
    "confirmation_method": "طريقة التأكيد",
    "whatsapp": "واتساب",
    "live_message_secure": "رسالة مباشرة (آمن)",
    "live_redirect_hint": "سيتم تحويلك إلى صفحة آمنة لإرسال رسالة الدفع والإيصال.",
    "full_name": "الاسم الكامل",
    "enter_full_name": "أدخل اسمك الكامل",
    "country": "الدولة",
    "phone_number": "رقم الهاتف",
    "payment_method": "طريقة الدفع",
    "transfer_number": "رقم التحويل",
    "transfer_numbers": "أرقام التحويل",
    "account": "الحساب",
    "paypal_account": "حساب باي بال",
    "bank": "البنك",
    "send_order_whatsapp": "إرسال الطلب عبر واتساب",
    "proceed_secure_confirmation": "متابعة للتأكيد الآمن",
    "please_fill_required": "يرجى ملء جميع الحقول المطلوبة",
    "invalid_phone": "يرجى إدخال رقم هاتف صحيح",
    "purchase_confirmed": "تم تأكيد الشراء",
    "transaction_initiated": "تم بدء العملية",

    // Game
    "available_packages": "الباقات المتاحة",
    "includes_taxes": "شامل الضرائب",
    "package": "باقة",
    "default_package": "الباقة الافتراضية",
    "out_of_stock": "غير متوفر",
    "in_stock": "متوفر",
    "added_to_cart": "تمت الإضافة إلى السلة",
    "item_unavailable": "هذا المنتج غير متاح حالياً.",
    "game_not_found": "اللعبة غير موجودة",
    "game_not_found_desc": "لم يتم العثور على اللعبة المطلوبة.",

    "available_games": "الألعاب المتاحة",
    "games_found": "لعبة",
    "more_packages": "باقات أخرى",
    "starting_from": "ابتداءً من",
    "buy": "شراء",
    "no_games_available": "لا توجد ألعاب متاحة",
    "no_games_in_category": "لا توجد ألعاب متاحة حالياً في هذه الفئة.",
    "browse_other_categories": "تصفح فئات أخرى",
    "category_not_found": "الفئة غير موجودة",
    "category_not_found_desc": "الفئة التي تبحث عنها غير موجودة.",

    "hot": "الأكثر طلباً",
    "loading_preview": "جاري تحميل المعاينة...",
    "fast_delivery": "تسليم سريع",
    "stock_label": "المخزون",

    "browse_games_desc": "تصفح مجموعتنا الكاملة من الألعاب",
    "all_categories": "كل الفئات",
    "no_games_found": "لم يتم العثور على ألعاب",
    "try_adjust_search": "جرّب تعديل البحث أو خيارات الفلترة.",
    "clear_filters": "مسح الفلاتر",
    "added": "تمت الإضافة!",
    "add": "إضافة",

    // Generic UI
    "explore_now": "استكشف الآن",
    "loading_popular_games": "جاري تحميل الألعاب الأكثر طلباً...",
    "standard_package_available": "باقة قياسية متاحة",
    "in_stock_prefix": "المتوفر",
    "view_details": "عرض التفاصيل",
    "preview": "معاينة",
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
      // Keep layout direction LTR for all languages to avoid reversing the UI.
      document.documentElement.dir = "ltr";
      document.documentElement.lang = language;
      document.documentElement.dataset.lang = language;
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

