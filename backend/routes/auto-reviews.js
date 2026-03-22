import pool from '../db.js';

const ARABIC_NAMES = [
  'محمد احمد', 'احمد محمود', 'عمر حسين', 'علي حسن', 'يوسف ابراهيم',
  'خالد محمد', 'مصطفي علي', 'تامر عبدالله', 'كريم سامي', 'هشام نبيل',
  'سارة محمد', 'نور احمد', 'ريم علي', 'دينا حسن', 'منى ابراهيم',
  'ياسمين خالد', 'مريم سامي', 'ايمان عمر', 'رانيا تامر', 'هبه مصطفي',
  'زياد احمد', 'عبدالرحمن محمد', 'سيف الدين', 'اسامه كريم', 'باسل حسين',
  'شيماء ماجد', 'محمود رامي', 'حسن فتحي', 'عمرو صلاح', 'ادم سمير',
];

const ENGLISH_NAMES = [
  'Alex Johnson', 'Chris Martin', 'Sam Williams', 'Jake Davis', 'Ryan Miller',
  'Emma Wilson', 'Lily Anderson', 'Sophie Brown', 'Mia Thomas', 'Zoe Jackson',
  'Omar Hassan', 'Karim Nour', 'Tarek Adel', 'Adam Samir', 'Nader Fathy',
];

const GAME_TEMPLATES = {
  'free-fire': {
    ar: [
      'والله عم ضياء عم الدنيا كلها، شحنت ماسات free fire وجات في ثواني مش بتصدق',
      'الراجل ده تمام التمام، بشحن free fire منه وما بتحصلش مشكله خالص',
      'جربت حاجات كتير بس صراحه المكان ده مش زيه، ماسات ff وصلت علطول',
      'بشحن فري فاير من هنا من زمان والحمدلله ما اتعبتش خالص',
      'سريع جداً والاسعار بتريح، ماسات free fire جت بسرعه',
    ],
    en: [
      'Bought Free Fire diamonds and got them instantly! Great service.',
      'Amazing deal on FF diamonds, delivery was super fast. Highly recommended!',
      'Best place to top up Free Fire in Egypt. Fast and reliable.',
      'Got my FF diamonds in seconds, no issues at all. Love it!',
    ],
  },
  'pubg-mobile': {
    ar: [
      'ياسلام عم ضياء ده راجل محترم اوي، UC جه في دقيقه وانا متصدقتش',
      'بشحن pubg منه بقاله وقت وما تعبتش، سريع وبسعر كويس',
      'UC وصلت وانا لسه مسجلش خروج من الصفحه، سرعتهم دي مش طبيعيه',
      'الحمدلله لقيت المكان ده، بشحن pubg وما بفكرش في حاجه تانيه',
    ],
    en: [
      'Got my PUBG Mobile UC instantly! Best gaming store in Egypt, no doubt.',
      'Bought PUBG UC here, fast delivery and great prices. Will definitely come back!',
      'Super fast top up for PUBG Mobile. Absolutely recommend this place.',
    ],
  },
  'valorant': {
    ar: [
      'VP جات في ثواني، عم ضياء مش بيخذل والله',
      'اشتريت Valorant points ولقيتها في حسابي على طول، عجبني جداً',
      'افضل مكان لشحن valorant، سريع والاسعار تمام',
    ],
    en: [
      'Purchased Valorant Points and received them instantly. Excellent service!',
      'Best place to buy VP in Egypt. Fast, cheap, and reliable.',
      'Got my Valorant Points in seconds. Never disappointed here.',
    ],
  },
  'spotify-gift-card': {
    ar: [
      'اشتريت spotify وشغلته في نص دقيقه بالظبط، تجربه حلوه',
      'spotify شهر كامل بسعر كويس، الكود جه على طول والحمدلله',
      'الكود جه وانا مفكرتش والله، سريعين جداً وما عنديش اي شكوي',
    ],
    en: [
      'Bought Spotify Premium and activated it instantly. Great deal!',
      'Spotify 1 Month subscription at a great price. Fast delivery too!',
      'Excellent service! Got my Spotify gift card in no time.',
    ],
  },
  'discord-nitro': {
    ar: [
      'discord nitro جاني في اقل من دقيقه، عم ضياء عم الدنيا',
      'nitro وصل بسرعه وسعره اوفر من اي مكان تاني، مرسي',
      'جربت discord nitro من هنا وتجربه ممتازه، هرجع تاني',
    ],
    en: [
      'Got my Discord Nitro instantly. The best place for this!',
      'Discord Nitro at great price, super fast activation. Loved it!',
      'Bought Discord Nitro here, easy and fast. Totally recommend.',
    ],
  },
  'roblox': {
    ar: [
      'اولادي طلبوا robux وجاتلهم علطول، فرحانين جداً',
      'robux وصلت في ثواني والعيال بيلعبوا دلوقتي، تمام بجد',
      'بشتري roblox من هنا دايماً، سريع وما فيش مشاكل',
    ],
    en: [
      'Got Roblox Robux instantly for my kid! Amazing service.',
      'Best place to buy Robux in Egypt. Fast and safe!',
      'Bought Roblox gift card and it worked perfectly.',
    ],
  },
  'crossfire': {
    ar: [
      'ZP لـ crossfire جاتلي علطول، تجربه ممتازه',
      'crossfire ZP بسعر كويس والتوصيل سريع، شكراً',
      'دايما بشحن crossfire من هنا، ما بتعبتش خالص',
    ],
    en: [
      'CrossFire ZP delivered instantly! Great prices here.',
      'Bought CrossFire credits here, fast and reliable. Recommended!',
    ],
  },
  'minecraft': {
    ar: [
      'اشتريت minecraft وفعلته بسهوله، خدمه ممتازه',
      'minecraft coins جات بسرعه وبسعر كويس، تمام',
    ],
    en: [
      'Got Minecraft quickly from here. Excellent experience!',
      'Bought Minecraft credits here. Fast delivery and fair price.',
    ],
  },
  'mobile-legends': {
    ar: [
      'diamonds لـ mobile legends وصلتلي في دقيقه، كنت مستعجل وما اتاخرش',
      'عم ضياء ده واد محترم والله، اشتريت ml diamonds وما في اي مشكله',
      'بشحن mobile legends من هنا من زمان، ما اتغيرتش عنه',
    ],
    en: [
      'Mobile Legends diamonds arrived instantly! Great service.',
      'Bought ML diamonds here, super fast. Recommended!',
    ],
  },
  'google-play': {
    ar: [
      'اشتريت google play card وشغلته علطول، سهل وسريع',
      'بطاقه google play وصلت في دقيقه، ما في اي تعقيد',
    ],
    en: [
      'Google Play card worked instantly! Great experience.',
      'Bought Google Play gift card here. Fast and easy.',
    ],
  },
};

const DEFAULT_TEMPLATES = {
  ar: [
    'خدمه سريعه وما في اي مشاكل، الحمدلله لقيت المكان ده',
    'الراجل ده امين وشاطر، بشتري منه وما بقلقش علي حاجه',
    'عم ضياء عم الدنيا كلها، راجل محترم ومضمون',
    'سريع وبسعر كويس، مش هلاقي احسن من كده',
    'بشري من هنا دايماً والحمدلله ما اتعبتش خالص',
    'اشتريت وجالي علطول، بجد تجربه حلوه',
    'ما قدرتش الاقي غيره، الخدمه دي مش بتتلاقاش في كل مكان',
  ],
  en: [
    'Amazing service! Fast delivery and great prices.',
    'Best gaming store in Egypt. Always reliable and fast!',
    'Highly recommend for all your gaming needs. 5 stars!',
    'Excellent prices and instant delivery. Will shop again.',
    'Fast, safe, and affordable. Really happy with my purchase.',
  ],
};

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateReview(gameName, gameSlug) {
  const useArabic = Math.random() < 0.65;
  const templates = GAME_TEMPLATES[gameSlug];
  let comment, userName;

  if (useArabic) {
    userName = pickRandom(ARABIC_NAMES);
    const arTemplates = templates ? templates.ar : DEFAULT_TEMPLATES.ar;
    comment = pickRandom(arTemplates);
  } else {
    userName = pickRandom(ENGLISH_NAMES);
    const enTemplates = templates ? templates.en : DEFAULT_TEMPLATES.en;
    comment = pickRandom(enTemplates);
  }

  const rating = Math.random() < 0.75 ? 5 : Math.random() < 0.8 ? 4 : 3;

  return { userName, comment, rating };
}

export async function generateAutoReviews() {
  try {
    const gamesResult = await pool.query(
      'SELECT id, name, slug FROM games WHERE is_popular = true OR category IN (\'gift-cards\', \'mobile-games\', \'online-games\') ORDER BY RANDOM() LIMIT 20'
    );

    if (!gamesResult.rows.length) return;

    const game = pickRandom(gamesResult.rows);
    const { userName, comment, rating } = generateReview(game.name, game.slug);

    const countCheck = await pool.query(
      'SELECT COUNT(*) as cnt FROM reviews WHERE game_slug = $1 AND user_name = $2',
      [game.slug, userName]
    );
    if (parseInt(countCheck.rows[0].cnt) > 0) return;

    await pool.query(
      `INSERT INTO reviews (game_slug, user_name, rating, comment, is_approved, created_at)
       VALUES ($1, $2, $3, $4, true, $5)`,
      [game.slug, userName, rating, comment, Date.now()]
    );

    console.log(`[AutoReviews] Added review for ${game.name} by ${userName}`);
  } catch (err) {
    console.error('[AutoReviews] Error generating review:', err.message);
  }
}

export function startAutoReviewSchedule() {
  generateAutoReviews();
  setInterval(generateAutoReviews, 60 * 60 * 1000);
  console.log('[AutoReviews] Scheduled auto-review generation every hour');
}
