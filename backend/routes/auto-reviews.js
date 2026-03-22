import pool from '../db.js';

const ARABIC_NAMES = [
  'محمد أحمد', 'أحمد محمود', 'عمر حسين', 'علي حسن', 'يوسف إبراهيم',
  'خالد محمد', 'مصطفى علي', 'تامر عبدالله', 'كريم سامي', 'هشام نبيل',
  'سارة محمد', 'نور أحمد', 'ريم علي', 'دينا حسن', 'منى إبراهيم',
  'ياسمين خالد', 'مريم سامي', 'إيمان عمر', 'رانيا تامر', 'هبة مصطفى',
  'زياد أحمد', 'عبدالرحمن محمد', 'سيف الدين', 'أسامة كريم', 'باسل حسين',
];

const ENGLISH_NAMES = [
  'Alex Johnson', 'Chris Martin', 'Sam Williams', 'Jake Davis', 'Ryan Miller',
  'Emma Wilson', 'Lily Anderson', 'Sophie Brown', 'Mia Thomas', 'Zoe Jackson',
  'Omar Hassan', 'Karim Nour', 'Tarek Adel', 'Adam Samir', 'Nader Fathy',
];

const GAME_TEMPLATES = {
  'free-fire': {
    ar: [
      'Free Fire أحسن لعبة شحنت فيها الماسات من متجر ضياء، التسليم كان فوري وما في مشاكل خالص',
      'شحنت Free Fire diamonds من هنا وجالتني على طول، الأسعار كمان معقولة جداً',
      'متجر ضياء أحسن متجر لشحن ألعاب، اشتريت ماسات Free Fire ووصلت في ثواني',
      'بشحن Free Fire من ضياء دايماً، ما فيش أحسن منه في مصر كلها',
      'الخدمة ممتازة وسعر ماسات Free Fire بخصم حلو',
    ],
    en: [
      'Bought Free Fire diamonds here and got them instantly! Great service from Diaa store.',
      'Amazing deal on Free Fire diamonds, delivery was super fast. Highly recommended!',
      'Diaa is the best place to top up Free Fire in Egypt. Fast and reliable.',
    ],
  },
  'pubg-mobile': {
    ar: [
      'اشتريت UC لـ PUBG Mobile من ضياء وجاتلي فوراً، أحسن متجر في مصر',
      'كل ما بشحن PUBG بروح لمتجر ضياء، سريع وبسعر كويس',
      'PUBG UC وصلت في دقيقة واحدة بس! الخدمة دي مش بتتلاقاش في أي مكان تاني',
      'شحنت UC لـ PUBG واستمتعت بالسيزون الجديد، شكراً ضياء',
    ],
    en: [
      'Got my PUBG Mobile UC instantly! Best gaming store in Egypt, no doubt.',
      'Bought PUBG UC here, fast delivery and great prices. Will definitely come back!',
      'Super fast top up for PUBG Mobile. Diaa Store is the best!',
    ],
  },
  'valorant': {
    ar: [
      'شحنت Valorant Points وجاتلي على طول، أحسن خدمة',
      'VP لـ Valorant وصلت فوراً وباعت سكن جديد، عالي جداً',
      'متجر ضياء رائع لشحن Valorant، الأسعار مناسبة والتسليم سريع',
    ],
    en: [
      'Purchased Valorant Points and received them instantly. Excellent service!',
      'Best place to buy VP in Egypt. Fast, cheap, and reliable.',
      'Got my Valorant Points in seconds. Diaa Store never disappoints!',
    ],
  },
  'spotify-gift-card': {
    ar: [
      'اشتريت Spotify Premium وشغّلته في نص دقيقة، تجربة رائعة',
      'Spotify شهر كامل بثمن بخس من ضياء، أنصح بيه جداً',
      'اشتريت Spotify 3 Months وما في أي مشكلة، التفعيل سهل وسريع',
    ],
    en: [
      'Bought Spotify Premium from Diaa and activated it instantly. Great deal!',
      'Spotify 1 Month subscription at a great price. Fast delivery too!',
      'Excellent service! Got my Spotify gift card in no time.',
    ],
  },
  'discord-nitro': {
    ar: [
      'اشتريت Discord Nitro من ضياء، وصل فوراً وفعّلته بسهولة',
      'Nitro جالي في أقل من دقيقة، سعره كمان أوفر من المواقع التانية',
      'تجربة ممتازة مع Discord Nitro من متجر ضياء',
    ],
    en: [
      'Got my Discord Nitro instantly from Diaa Store. The best!',
      'Discord Nitro at great price, super fast activation. Loved it!',
      'Bought Discord Nitro here, easy and fast. Totally recommend Diaa Store.',
    ],
  },
  'roblox': {
    ar: [
      'اشتريت Robux لـ Roblox وجاتلي على طول، أولادي مبسوطين جداً',
      'Robux وصلت في ثواني، والخدمة ممتازة من ضياء',
      'بشتري Roblox Robux من ضياء دايماً، سريع وآمن',
    ],
    en: [
      'Got Roblox Robux instantly for my kid! Amazing service.',
      'Best place to buy Robux in Egypt. Fast and safe!',
      'Bought Roblox gift card and it worked perfectly. Great store!',
    ],
  },
  'crossfire': {
    ar: [
      'شحنت ZP لـ CrossFire وجاتلي فوراً، أحسن تجربة',
      'CrossFire ZP بسعر حلو من ضياء، شكراً',
      'تسليم سريع لـ CrossFire ZP، أنصح بمتجر ضياء',
    ],
    en: [
      'CrossFire ZP delivered instantly! Great prices at Diaa Store.',
      'Bought CrossFire credits here, fast and reliable. Recommended!',
    ],
  },
  'minecraft': {
    ar: [
      'اشتريت Minecraft من ضياء وفعّلته بسهولة، خدمة ممتازة',
      'Minecraft Coins جات بسرعة وبسعر كويس، شكراً ضياء',
    ],
    en: [
      'Got Minecraft quickly from Diaa Store. Excellent experience!',
      'Bought Minecraft credits here. Fast delivery and fair price.',
    ],
  },
};

const DEFAULT_TEMPLATES = {
  ar: [
    'خدمة ممتازة من متجر ضياء، التسليم كان سريع جداً وما في مشاكل',
    'أنصح بمتجر ضياء لأي حاجة محتاجها للألعاب، أسعار كويسة وخدمة رائعة',
    'من أفضل المتاجر في مصر، بشري منهم دايماً وما بيخذلوش',
    'الخدمة سريعة والأسعار منافسة، شكراً لمتجر ضياء',
    'جربت متاجر كتير بس ضياء أحسنهم كلهم، التسليم فوري والدعم متاح',
  ],
  en: [
    'Amazing service from Diaa Store! Fast delivery and great prices.',
    'Best gaming store in Egypt. Always reliable and fast!',
    'Highly recommend Diaa Store for all your gaming needs. 5 stars!',
    'Excellent prices and instant delivery. Will shop again for sure.',
    'Diaa Store never disappoints. Fast, safe, and affordable!',
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
