# دليل الرفع على Vercel خطوة بخطوة

## الخطوة 1: إعداد قاعدة البيانات على Neon

### إنشاء قاعدة البيانات
1. اذهب إلى [neon.tech](https://neon.tech)
2. اضغط "Sign up" وأنشئ حساب جديد
3. اضغط "Create a project"
4. اختر:
   - Region: Frankfurt (أقرب لمصر)
   - Database name: gaming_store
   - PostgreSQL version: 16 (الأحدث)
5. اضغط "Create project"

### الحصول على رابط الاتصال
1. في لوحة التحكم، اذهب إلى "Connection string"
2. انسخ الرابط الذي يبدأ بـ `postgresql://`
3. احفظه - ستحتاجه لاحقاً

## الخطوة 2: رفع الكود إلى GitHub

### إنشاء Repository
1. اذهب إلى [github.com](https://github.com)
2. اضغط "New repository"
3. اكتب اسم المشروع: `gaming-store`
4. اتركه Public
5. اضغط "Create repository"

### رفع الكود
```bash
# في terminal المشروع
git init
git add .
git commit -m "Gaming store initial setup"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gaming-store.git
git push -u origin main
```

## الخطوة 3: إعداد Vercel

### إنشاء حساب Vercel
1. اذهب إلى [vercel.com](https://vercel.com)
2. اضغط "Sign up"
3. اختر "Continue with GitHub"
4. وافق على الصلاحيات

### ربط المشروع
1. في لوحة تحكم Vercel، اضغط "New Project"
2. ابحث عن `gaming-store` repo
3. اضغط "Import"
4. في إعدادات Build:
   - Framework Preset: `Other`
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - Install Command: `npm install`

## الخطوة 4: إضافة متغيرات البيئة

1. في صفحة المشروع في Vercel، اذهب إلى "Settings"
2. اضغط "Environment Variables"
3. أضف:
   - **Key**: `DATABASE_URL`
   - **Value**: الرابط الذي نسخته من Neon
   - **Environment**: Production, Preview, Development
4. اضغط "Save"

## الخطوة 5: رفع الصور

### خيار 1: استخدام Cloudinary (الأفضل)
1. اذهب إلى [cloudinary.com](https://cloudinary.com)
2. أنشئ حساب مجاني
3. ارفع جميع الصور من مجلد `attached_assets`
4. انسخ URLs الصور
5. حدث قاعدة البيانات بالروابط الجديدة

### خيار 2: استخدام مجلد public
1. انسخ جميع الصور إلى `public/assets`
2. حدث قاعدة البيانات:
```sql
UPDATE games SET image = '/assets/CROSSFIRE.png' WHERE id = 'crossfire';
-- كرر لكل الألعاب
```

## الخطوة 6: إعداد قاعدة البيانات في Production

### إضافة الجداول
1. في terminal المشروع المحلي:
```bash
# تأكد من وجود DATABASE_URL في .env
echo "DATABASE_URL=your_neon_url" > .env

# إضافة الجداول
npm run db:push
```

### إضافة البيانات الأولية
```bash
# إضافة الفئات والألعاب
npm run db:seed
```

## الخطوة 7: Deploy النهائي

1. في Vercel، اذهب إلى "Deployments"
2. اضغط "Redeploy" إذا لزم الأمر
3. انتظر حتى يكتمل البناء
4. اضغط على الرابط لمشاهدة الموقع

## الخطوة 8: التحقق من العمل

### فحص الموقع
1. افتح رابط الموقع
2. تأكد من ظهور:
   - الفئات الأربعة
   - الألعاب في كل فئة
   - الصور بشكل صحيح

### فحص قاعدة البيانات
في Neon dashboard:
1. اذهب إلى "SQL Editor"
2. شغل:
```sql
SELECT COUNT(*) FROM categories; -- يجب أن يكون 4
SELECT COUNT(*) FROM games;      -- يجب أن يكون 21
```

## مشاكل شائعة وحلولها

### الصور لا تظهر
- تأكد من رفع الصور إلى `public/assets`
- أو استخدم Cloudinary
- تأكد من تحديث مسارات الصور في قاعدة البيانات

### خطأ في قاعدة البيانات
- تأكد من صحة DATABASE_URL
- تأكد من تشغيل `db:push` قبل `db:seed`
- تحقق من أن قاعدة البيانات في Neon تعمل

### فشل في البناء
- تحقق من logs في Vercel
- تأكد من أن جميع dependencies موجودة
- تأكد من صحة vercel.json

## بعد النجاح

### ربط Domain مخصص (اختياري)
1. في Vercel Settings > Domains
2. أضف domain الخاص بك
3. اتبع التعليمات لتحديث DNS

### مراقبة الأداء
- استخدم Analytics في Vercel
- راقب استخدام قاعدة البيانات في Neon
- تأكد من عدم تجاوز الحدود المجانية

## روابط مهمة

- [Neon Dashboard](https://console.neon.tech/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [GitHub Repository](https://github.com/YOUR_USERNAME/gaming-store)
- موقعك النهائي: `https://gaming-store-xxx.vercel.app`