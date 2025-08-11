
import { db } from './server/db';
import { games, categories } from './shared/schema';
import { eq } from 'drizzle-orm';

async function updateImagePaths() {
  console.log('🔄 تحديث مسارات الصور للإنتاج...');
  
  try {
    // تحديث صور الألعاب
    const imageMappings = [
      { id: 'crossfire', image: '/CROSSFIRE.png' },
      { id: 'freefire', image: '/FREE_FIRE.jpg' },
      { id: 'pubg', image: '/PUBG_MOBILE.jpg' },
      { id: 'roblox', image: '/ROBLOX.png' },
      { id: 'lol', image: '/LEAGUE_OF_LEGENDS.png' },
      { id: 'cod', image: '/CALL_OF_DUTY.png' },
      { id: 'apex', image: '/APEX_LEGENDS.png' },
      { id: 'valorant', image: '/VALORANT.jpg' },
      { id: 'fortnite', image: '/FORTNITE.jpg' },
      { id: 'minecraft', image: '/MINECRAFT.png' },
      { id: 'coc', image: '/CLASH_OF_CLANS.webp' },
      { id: 'ml', image: '/MOBILE_LEGENDS.png' },
      { id: 'codm', image: '/COD_MOBILE.png' },
      { id: 'steam', image: '/image_1754933742848.png' },
      { id: 'googleplay', image: '/image_1754933739944.png' },
      { id: 'playstation', image: '/image_1754933736969.png' },
      { id: 'xbox', image: '/xbox_card.png' },
      { id: 'appstore', image: '/apple_card.png' }
    ];

    for (const mapping of imageMappings) {
      await db.update(games)
        .set({ image: mapping.image })
        .where(eq(games.id, mapping.id));
    }

    // تحديث صور الفئات
    await db.update(categories)
      .set({ image: '/image_1754931426972.png' })
      .where(eq(categories.id, 'hot-deals'));

    await db.update(categories)
      .set({ image: '/image_1754931426972.png' })
      .where(eq(categories.id, 'online-games'));

    await db.update(categories)
      .set({ image: '/image_1754931426972.png' })
      .where(eq(categories.id, 'mobile-games'));

    await db.update(categories)
      .set({ image: '/image_1754931426972.png' })
      .where(eq(categories.id, 'gift-cards'));

    console.log('✅ تم تحديث جميع مسارات الصور بنجاح!');
    
    // عرض النتائج
    const updatedGames = await db.select().from(games);
    console.log('\n📊 عدد الألعاب:', updatedGames.length);
    console.log('🎮 تم تحديث جميع البيانات للإنتاج!');
    
  } catch (error) {
    console.error('❌ خطأ في تحديث البيانات:', error);
    throw error;
  }
}

// تشغيل التحديث
if (require.main === module) {
  updateImagePaths()
    .then(() => {
      console.log('تم الانتهاء من التحديث بنجاح');
      process.exit(0);
    })
    .catch((error) => {
      console.error('فشل التحديث:', error);
      process.exit(1);
    });
}

export { updateImagePaths };
