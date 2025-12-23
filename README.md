# Gaming Store Platform

متجر ألعاب رقمي شامل مع واجهة تفاعلية وميزات غنية للاعبين.

## التقنيات المستخدمة

- **Frontend**: React.js مع TypeScript
- **Backend**: Node.js مع Express
- **Database**: PostgreSQL مع Drizzle ORM
- **UI**: Tailwind CSS + Radix UI
- **Animation**: Framer Motion

## المميزات

- 🎮 متجر شامل للألعاب والعملات الرقمية
- 📱 دعم الألعاب المحمولة وألعاب PC
- 💳 بطاقات الهدايا الرقمية
- 🌟 نظام التوصيات الذكية
- 🏆 نظام الإنجازات والنقاط
- 📊 تتبع تفاعل المستخدمين
- 🔒 جلسات آمنة

## إعداد قاعدة البيانات

### إنشاء قاعدة البيانات على Neon

1. اذهب إلى [Neon](https://neon.tech)
2. أنشئ حساب جديد أو سجل الدخول
3. أنشئ مشروع جديد
4. انسخ رابط الاتصال (DATABASE_URL)

### متغيرات البيئة المطلوبة

```env
DATABASE_URL=postgresql://username:password@hostname/database?sslmode=require
```

### إعداد قاعدة البيانات محلياً

```bash
# إضافة الجداول
npm run db:push

# إضافة البيانات الأولية
npm run db:seed
```

## الرفع على Vercel

### خطوات الرفع

1. **رفع الكود إلى GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin <your-repo-url>
   git push -u origin main
   ```

2. **ربط المشروع بـ Vercel**
   - اذهب إلى [Vercel](https://vercel.com)
   - أنشئ حساب جديد أو سجل الدخول
   - اضغط "New Project"
   - اربط GitHub repo
   - اختر المشروع الخاص بك

3. **إضافة متغيرات البيئة في Vercel**
   - في لوحة تحكم المشروع في Vercel
   - اذهب إلى Settings > Environment Variables
   - أضف:
     ```
     DATABASE_URL = <your-neon-database-url>
     ```

4. **تحديث الصور**
   - ارفع الصور إلى مجلد `public/assets`
   - أو استخدم خدمة مثل Cloudinary للصور

5. **Deploy**
   - Vercel سيقوم بالرفع تلقائياً
   - تأكد من تشغيل migrations في Production

## هيكل المشروع

```
├── client/              # Frontend React app
│   ├── src/
│   └── index.html
├── server/              # Backend Express server  
│   ├── index.ts         # Server entry point
│   ├── routes.ts        # API routes
│   ├── storage.ts       # Database operations
│   └── seed-db.ts       # Database seeding
├── shared/              # Shared types and schemas
│   └── schema.ts        # Drizzle database schema
├── public/              # Static assets for production
├── attached_assets/     # Development assets
└── vercel.json          # Vercel configuration
```

## API Endpoints

- `GET /api/categories` - جلب فئات الألعاب
- `GET /api/games/popular` - جلب الألعاب الشائعة
- `GET /api/games/category/:category` - جلب ألعاب فئة معينة
- `GET /api/games/:slug` - جلب تفاصيل لعبة
- `POST /api/user/track` - تتبع تفاعل المستخدم

## قاعدة البيانات

### الجداول الرئيسية

- **games**: معلومات الألعاب والأسعار
- **categories**: فئات الألعاب
- **users**: بيانات المستخدمين
- **user_game_history**: سجل تفاعل المستخدمين
- **achievements**: نظام الإنجازات
- **social_shares**: مشاركات وسائل التواصل

## التطوير المحلي

```bash
# تشغيل الخادم
npm run dev

# بناء المشروع
npm run build

# تشغيل production
npm start
```

## ملاحظات مهمة للإنتاج

1. **الصور**: تأكد من رفع جميع الصور إلى مجلد `public/assets`
2. **قاعدة البيانات**: استخدم Neon PostgreSQL للإنتاج
3. **متغيرات البيئة**: لا تنسى إضافة DATABASE_URL في Vercel
4. **CORS**: مُعد للعمل مع أي domain في الإنتاج

## الدعم

للمساعدة أو الاستفسارات، تواصل معنا.