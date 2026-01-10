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
    "terms_acceptance_title": "1. Acceptance of Terms",
    "terms_acceptance_content": "By accessing and using Diaa Eldeen's services, you accept and agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use our services.",
    "terms_services_title": "2. Services",
    "terms_services_content": "Diaa Eldeen provides digital gaming products including game currencies, gift cards, and related services. We reserve the right to modify, suspend, or discontinue any service at any time.",
    "terms_payment_title": "3. Payment and Pricing",
    "terms_payment_content": "All prices are displayed in EGP (Egyptian Pounds) unless otherwise stated. Payment must be made in full before delivery. We accept various payment methods as listed on our website.",
    "terms_delivery_title": "4. Delivery",
    "terms_delivery_content": "Digital products are delivered instantly after payment confirmation. Physical products may take 1-3 business days. Delivery times may vary based on location and product type.",
    "terms_refunds_title": "5. Refunds and Returns",
    "terms_refunds_content": "Refunds are available for unused digital products within 7 days of purchase. Physical products can be returned within 14 days if unopened. Contact support for refund requests.",
    "terms_liability_title": "6. Limitation of Liability",
    "terms_liability_content": "Diaa Eldeen is not responsible for any damages or losses resulting from the use of our products. Our liability is limited to the purchase price of the product.",
    "terms_privacy_title": "7. Privacy",
    "terms_privacy_content": "Your privacy is important to us. Please review our Privacy Policy for details on how we collect, use, and protect your personal information.",
    "terms_changes_title": "8. Changes to Terms",
    "terms_changes_content": "We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting on our website.",
    
    // Privacy
    "privacy_title": "Privacy Policy",
    "privacy_intro": "This Privacy Policy describes how Diaa Eldeen collects, uses, and protects your personal information.",
    "privacy_collection_title": "Information We Collect",
    "privacy_collection_content": "We collect information you provide directly to us, such as your name, email address, phone number, and payment information when you make a purchase.",
    "privacy_usage_title": "How We Use Your Information",
    "privacy_usage_content": "We use your information to process orders, provide customer support, send updates, and improve our services.",
    "privacy_sharing_title": "Information Sharing",
    "privacy_sharing_content": "We do not sell or rent your personal information to third parties. We may share information only as required by law or to protect our rights.",
    "privacy_security_title": "Data Security",
    "privacy_security_content": "We implement appropriate security measures to protect your personal information against unauthorized access, alteration, or disclosure.",
    "privacy_cookies_title": "Cookies",
    "privacy_cookies_content": "We use cookies to enhance your browsing experience and analyze website traffic.",
    "privacy_contact_title": "Contact Us",
    "privacy_contact_content": "If you have any questions about this Privacy Policy, please contact our support team.",
    
    // Refunds
    "refunds_title": "Refund Policy",
    "refunds_intro": "We want you to be satisfied with your purchase. Here's our refund policy:",
    "refunds_digital_title": "Digital Products",
    "refunds_digital_content": "Unused digital products can be refunded within 7 days of purchase. Once a digital product has been used or redeemed, it cannot be refunded.",
    "refunds_physical_title": "Physical Products",
    "refunds_physical_content": "Physical products can be returned within 14 days if they are unopened and in original packaging. Shipping costs for returns are the customer's responsibility.",
    "refunds_process_title": "Refund Process",
    "refunds_process_content": "To request a refund, contact our support team with your order details. Refunds will be processed within 3-5 business days after approval.",
    "refunds_exceptions_title": "Exceptions",
    "refunds_exceptions_content": "Refunds are not available for products purchased during promotional periods or for accounts that violate our terms of service.",
    "refunds_contact": "Contact our support team to initiate a refund request.",
    
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
    
    // Terms
    "terms_title": "شروط الخدمة",
    "last_updated": "آخر تحديث",
    "terms_acceptance_title": "1. قبول الشروط",
    "terms_acceptance_content": "بالوصول إلى خدمات ضياء الدين واستخدامها، أنت توافق على الالتزام بهذه الشروط والأحكام. إذا كنت لا توافق على هذه الشروط، يرجى عدم استخدام خدماتنا.",
    "terms_services_title": "2. الخدمات",
    "terms_services_content": "يوفر ضياء الدين منتجات ألعاب رقمية بما في ذلك عملات الألعاب وبطاقات الهدايا والخدمات ذات الصلة. نحتفظ بالحق في تعديل أو تعليق أو إيقاف أي خدمة في أي وقت.",
    "terms_payment_title": "3. الدفع والتسعير",
    "terms_payment_content": "جميع الأسعار معروضة بالجنيه المصري إلا إذا ذكر خلاف ذلك. يجب دفع المبلغ كاملاً قبل التسليم. نقبل طرق دفع مختلفة كما هو مدرج على موقعنا.",
    "terms_delivery_title": "4. التسليم",
    "terms_delivery_content": "يتم تسليم المنتجات الرقمية فوراً بعد تأكيد الدفع. قد تستغرق المنتجات المادية 1-3 أيام عمل. قد تختلف أوقات التسليم حسب الموقع ونوع المنتج.",
    "terms_refunds_title": "5. الاسترداد والإرجاع",
    "terms_refunds_content": "يمكن استرداد المنتجات الرقمية غير المستخدمة خلال 7 أيام من الشراء. يمكن إرجاع المنتجات المادية خلال 14 يوماً إذا كانت غير مفتوحة. اتصل بالدعم لطلبات الاسترداد.",
    "terms_liability_title": "6. تحديد المسؤولية",
    "terms_liability_content": "ضياء الدين غير مسؤول عن أي أضرار أو خسائر ناتجة عن استخدام منتجاتنا. مسؤوليتنا محدودة بسعر شراء المنتج.",
    "terms_privacy_title": "7. الخصوصية",
    "terms_privacy_content": "خصوصيتك مهمة بالنسبة لنا. يرجى مراجعة سياسة الخصوصية للحصول على تفاصيل حول كيفية جمعنا واستخدامنا وحماية معلوماتك الشخصية.",
    "terms_changes_title": "8. تغييرات الشروط",
    "terms_changes_content": "نحتفظ بالحق في تعديل هذه الشروط في أي وقت. ستكون التغييرات فعالة فوراً عند نشرها على موقعنا.",
    
    // Privacy
    "privacy_title": "سياسة الخصوصية",
    "privacy_intro": "تصف سياسة الخصوصية هذه كيفية جمع ضياء الدين واستخدام وحماية معلوماتك الشخصية.",
    "privacy_collection_title": "المعلومات التي نجمعها",
    "privacy_collection_content": "نجمع المعلومات التي تقدمها مباشرة لنا، مثل اسمك وعنوان بريدك الإلكتروني ورقم هاتفك ومعلومات الدفع عند إجراء عملية شراء.",
    "privacy_usage_title": "كيف نستخدم معلوماتك",
    "privacy_usage_content": "نستخدم معلوماتك لمعالجة الطلبات وتقديم دعم العملاء وإرسال التحديثات وتحسين خدماتنا.",
    "privacy_sharing_title": "مشاركة المعلومات",
    "privacy_sharing_content": "لا نبيع أو نؤجر معلوماتك الشخصية لأطراف ثالثة. قد نشارك المعلومات فقط كما يتطلبه القانون أو لحماية حقوقنا.",
    "privacy_security_title": "أمان البيانات",
    "privacy_security_content": "نطبق إجراءات أمنية مناسبة لحماية معلوماتك الشخصية من الوصول غير المصرح به أو التعديل أو الكشف.",
    "privacy_cookies_title": "ملفات تعريف الارتباط",
    "privacy_cookies_content": "نستخدم ملفات تعريف الارتباط لتحسين تجربة التصفح الخاصة بك وتحليل حركة الموقع.",
    "privacy_contact_title": "اتصل بنا",
    "privacy_contact_content": "إذا كان لديك أي أسئلة حول سياسة الخصوصية هذه، يرجى الاتصال بفريق الدعم لدينا.",
    
    // Refunds
    "refunds_title": "سياسة الاسترداد",
    "refunds_intro": "نريد أن تكون راضياً عن مشترياتك. إليك سياسة الاسترداد لدينا:",
    "refunds_digital_title": "المنتجات الرقمية",
    "refunds_digital_content": "يمكن استرداد المنتجات الرقمية غير المستخدمة خلال 7 أيام من الشراء. بمجرد استخدام أو استبدال منتج رقمي، لا يمكن استرداده.",
    "refunds_physical_title": "المنتجات المادية",
    "refunds_physical_content": "يمكن إرجاع المنتجات المادية خلال 14 يوماً إذا كانت غير مفتوحة وفي تغليفها الأصلي. تكاليف الشحن للإرجاع مسؤولية العميل.",
    "refunds_process_title": "عملية الاسترداد",
    "refunds_process_content": "لطلب استرداد، اتصل بفريق الدعم مع تفاصيل طلبك. سيتم معالجة الاسترداد خلال 3-5 أيام عمل بعد الموافقة.",
    "refunds_exceptions_title": "الاستثناءات",
    "refunds_exceptions_content": "الاسترداد غير متاح للمنتجات المشتراة خلال فترات الترويج أو للحسابات التي تنتهك شروطنا.",
    "refunds_contact": "اتصل بفريق الدعم لدينا لبدء طلب استرداد.",
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

