# دليل نشر Cheetos Gaming على Vercel

## خطوات النشر:

### 1. إعداد Vercel
1. اذهب إلى https://vercel.com وأنشئ حساب جديد أو ادخل
2. اربط حسابك مع GitHub
3. اضغط "New Project"
4. استورد هذا المشروع من GitHub

### 2. إعداد المتغيرات البيئية
في لوحة تحكم Vercel، اذهب لـ Settings > Environment Variables وأضف:

```
DATABASE_URL = your_neon_database_url_here
```

### 3. إعداد قاعدة البيانات (Neon)
1. اذهب إلى https://neon.tech وأنشئ حساب
2. أنشئ مشروع جديد
3. انسخ Connection String
4. ضعه في DATABASE_URL في Vercel

### 4. النشر
1. اضغط "Deploy" في Vercel
2. انتظر انتهاء عملية البناء
3. ستحصل على رابط موقعك على .vercel.app

## إعدادات مهمة:
- Build Command: `cd client && npm run build`
- Output Directory: `client/dist`
- Install Command: `npm install`

## استكشاف الأخطاء:
- تأكد من أن DATABASE_URL صحيح
- تحقق من Build Logs في Vercel
- تأكد من أن جميع الصور في مجلد attached_assets

## بعد النشر:
1. اختبر جميع الصفحات
2. تأكد من عمل طرق الدفع
3. اختبر إضافة منتجات للسلة
4. تحقق من صفحات تفاصيل الألعاب