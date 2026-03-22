import { db } from './server/db.js';
import { games } from './shared/schema.js';
import { eq } from 'drizzle-orm';

// Script لتحديث مسارات الصور للإنتاج
const updateImagePaths = async () => {
  console.log('🔄 تحديث مسارات الصور للإنتاج...');
  
  try {
    // تحديث الصور الاحترافية الجديدة
    await db.update(games)
      .set({ image: '/assets/image_1754933742848.png' })
      .where(eq(games.id, 'steam'));
    
    await db.update(games)
      .set({ image: '/assets/image_1754933739944.png' })  
      .where(eq(games.id, 'googleplay'));
    
    await db.update(games)
      .set({ image: '/assets/image_1754933736969.png' })
      .where(eq(games.id, 'playstation'));

    // تحديث باقي الألعاب لاستخدام مسارات /assets
    const imageMappings = [
      { id: 'crossfire', image: '/assets/CROSSFIRE.png' },
      { id: 'freefire', image: '/assets/FREE_FIRE.jpg' },
      { id: 'pubg', image: '/assets/PUBG_MOBILE.jpg' },
      { id: 'roblox', image: '/assets/ROBLOX.png' },
      { id: 'lol', image: '/assets/LEAGUE_OF_LEGENDS.png' },
      { id: 'cod', image: '/assets/CALL_OF_DUTY.png' },
      { id: 'apex', image: '/assets/APEX_LEGENDS.png' },
      { id: 'coc', image: '/assets/CLASH_OF_CLANS.webp' },
      { id: 'ml', image: '/assets/MOBILE_LEGENDS.png' },
      { id: 'codm', image: '/assets/COD_MOBILE.png' },
      { id: 'valorant', image: '/assets/VALORANT.jpg' },
      { id: 'fortnite', image: '/assets/FORTNITE.jpg' },
      { id: 'minecraft', image: '/assets/MINECRAFT.png' },
      { id: 'xbox', image: '/assets/xbox_card.png' },
      { id: 'appstore', image: '/assets/apple_card.png' }
    ];

    for (const mapping of imageMappings) {
      await db.update(games)
        .set({ image: mapping.image })
        .where(eq(games.id, mapping.id));
    }

    console.log('✅ تم تحديث جميع مسارات الصور بنجاح!');
    
    // عرض النتائج
    const updatedGames = await db.select().from(games);
    console.log('\n📊 الألعاب المحدثة:');
    updatedGames.forEach(game => {
      console.log(`- ${game.name}: ${game.image}`);
    });

  } catch (error) {
    console.error('❌ خطأ في تحديث مسارات الصور:', error);
  }
};

// تشغيل التحديث
updateImagePaths();