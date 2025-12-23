# قائمة مراجعة الملفات والأصول - Assets Checklist

## حالة الملفات الحالية ✅

### الصور المحدثة حديثاً
- `image_1754933742848.png` - Steam Wallet (احترافية) ✅
- `image_1754933739944.png` - Google Play (احترافية) ✅  
- `image_1754933736969.png` - PlayStation Store (احترافية) ✅

### صور الألعاب الموجودة
- `CROSSFIRE.png` ✅
- `FREE_FIRE.jpg` ✅
- `PUBG_MOBILE.jpg` ✅
- `ROBLOX.png` ✅
- `LEAGUE_OF_LEGENDS.png` ✅
- `CALL_OF_DUTY.png` ✅
- `APEX_LEGENDS.png` ✅
- `CLASH_OF_CLANS.webp` ✅
- `MOBILE_LEGENDS.png` ✅
- `COD_MOBILE.png` ✅
- `VALORANT.jpg` ✅
- `FORTNITE.jpg` ✅
- `MINECRAFT.png` ✅

## حالة النسخ للإنتاج

### تم النسخ إلى public/assets ✅
جميع الملفات تم نسخها من `attached_assets` إلى `public/assets` جاهزة للإنتاج.

### مسارات قاعدة البيانات
- **التطوير**: `/attached_assets/filename`
- **الإنتاج**: `/assets/filename`

## الإجراءات المطلوبة للإنتاج

### 1. نسخ الصور (مكتمل) ✅
```bash
cp -r attached_assets/* public/assets/
```

### 2. تحديث قاعدة البيانات للإنتاج
```bash
node update-images-for-production.js
```

### 3. التحقق من الصور في الإنتاج
بعد الرفع، تأكد من عمل:
- `https://your-domain.vercel.app/assets/CROSSFIRE.png`
- `https://your-domain.vercel.app/assets/image_1754933742848.png`

## قائمة الألعاب والصور

### فئة ONLINE GAMES
1. **CROSSFIRE** - `/assets/CROSSFIRE.png` ✅
2. **ROBLOX** - `/assets/ROBLOX.png` ✅
3. **LEAGUE OF LEGENDS** - `/assets/LEAGUE_OF_LEGENDS.png` ✅
4. **CALL OF DUTY** - `/assets/CALL_OF_DUTY.png` ✅
5. **APEX LEGENDS** - `/assets/APEX_LEGENDS.png` ✅
6. **VALORANT** - `/assets/VALORANT.jpg` ✅
7. **FORTNITE** - `/assets/FORTNITE.jpg` ✅
8. **MINECRAFT** - `/assets/MINECRAFT.png` ✅

### فئة MOBILE GAMES  
1. **FREE FIRE** - `/assets/FREE_FIRE.jpg` ✅
2. **PUBG MOBILE** - `/assets/PUBG_MOBILE.jpg` ✅
3. **CLASH OF CLANS** - `/assets/CLASH_OF_CLANS.webp` ✅
4. **MOBILE LEGENDS** - `/assets/MOBILE_LEGENDS.png` ✅
5. **COD MOBILE** - `/assets/COD_MOBILE.png` ✅

### فئة GIFT CARDS
1. **STEAM WALLET** - `/assets/image_1754933742848.png` ✅ (محدث)
2. **GOOGLE PLAY** - `/assets/image_1754933739944.png` ✅ (محدث)
3. **PLAYSTATION STORE** - `/assets/image_1754933736969.png` ✅ (محدث)
4. **XBOX LIVE** - `/assets/xbox_card.png` (يحتاج صورة)
5. **APPLE APP STORE** - `/assets/apple_card.png` (يحتاج صورة)

## ملاحظات مهمة

### للتطوير المحلي
- استخدم `/attached_assets/` في المسارات
- الصور تُعرض عبر Express static middleware

### للإنتاج (Vercel)
- استخدم `/assets/` في المسارات  
- الصور تُعرض عبر مجلد `public/assets`
- تأكد من تحديث قاعدة البيانات بالمسارات الصحيحة

### الصور المفقودة
- Xbox Live gift card
- Apple App Store gift card
- يمكن إضافتها لاحقاً أو استخدام صور placeholder

## التحقق النهائي قبل الرفع

- [ ] جميع الصور منسوخة إلى `public/assets` ✅
- [ ] مسارات قاعدة البيانات محدثة للإنتاج
- [ ] اختبار عرض الصور محلياً
- [ ] ملفات Vercel جاهزة (`vercel.json`)
- [ ] متغيرات البيئة معدة (DATABASE_URL)

**الحالة**: جاهز للرفع! 🚀