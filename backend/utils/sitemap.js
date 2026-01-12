import pool from '../db.js';

export async function generateSitemap() {
  try {
    // Get all games
    const gamesResult = await pool.query(`
      SELECT slug, name, updated_at, created_at,
             CASE WHEN stock > 0 THEN 1 ELSE 0 END as in_stock
      FROM games
      WHERE deleted = false
      ORDER BY updated_at DESC, name ASC
    `);
    const games = gamesResult.rows;

    // Get all categories
    const categoriesResult = await pool.query(`
      SELECT slug, name, updated_at
      FROM categories
      ORDER BY updated_at DESC, name ASC
    `);
    const categories = categoriesResult.rows;

    const baseUrl = process.env.FRONTEND_URL || 'https://diaasadek.com';
    const currentDate = new Date().toISOString();

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
  <url>
    <loc>${baseUrl}</loc>
    <lastmod>${currentDate.split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <image:image>
      <image:loc>${baseUrl}/logo.png</image:loc>
      <image:title>متجر ضياء - شحن ألعاب إلكترونية</image:title>
      <image:caption>أفضل متجر شحن ألعاب في مصر</image:caption>
      <image:license>${baseUrl}/license</image:license>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/images/hero-banner.webp</image:loc>
      <image:title>شحن ألعاب إلكترونية في مصر</image:title>
      <image:caption>خدمة شحن ألعاب آمنة وسريعة</image:caption>
    </image:image>
  </url>
  <url>
    <loc>${baseUrl}/games</loc>
    <lastmod>${currentDate.split('T')[0]}</lastmod>
    <changefreq>daily</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/categories</loc>
    <lastmod>${currentDate.split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;

    // Add categories
    categories.forEach(cat => {
      const lastMod = cat.updated_at ? new Date(cat.updated_at).toISOString().split('T')[0] : currentDate.split('T')[0];
      sitemap += `
  <url>
    <loc>${baseUrl}/category/${cat.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
    });

    // Add games with images
    games.forEach(game => {
      const lastMod = game.updated_at ? new Date(game.updated_at).toISOString().split('T')[0] : currentDate.split('T')[0];
      const priority = game.in_stock ? 0.7 : 0.5;
      const changeFreq = game.in_stock ? 'weekly' : 'monthly';

      sitemap += `
  <url>
    <loc>${baseUrl}/game/${game.slug}</loc>
    <lastmod>${lastMod}</lastmod>
    <changefreq>${changeFreq}</changefreq>
    <priority>${priority}</priority>
    <image:image>
      <image:loc>${baseUrl}/images/${game.slug}.webp</image:loc>
      <image:title>شحن ${game.name} - متجر ضياء</image:title>
      <image:caption>شحن عملات ${game.name} بأمان في متجر ضياء</image:caption>
      <image:license>${baseUrl}/license</image:license>
    </image:image>
    <image:image>
      <image:loc>${baseUrl}/images/${game.slug}-thumb.webp</image:loc>
      <image:title>${game.name} - صورة مصغرة</image:title>
      <image:caption>معاينة شحن ${game.name}</image:caption>
    </image:image>
  </url>`;
    });

    // Add static pages
    const staticPages = [
      { path: '/support', priority: 0.6, changefreq: 'monthly' },
      { path: '/faq', priority: 0.6, changefreq: 'monthly' },
      { path: '/terms', priority: 0.4, changefreq: 'yearly' },
      { path: '/privacy', priority: 0.4, changefreq: 'yearly' },
      { path: '/track-order', priority: 0.5, changefreq: 'monthly' }
    ];

    staticPages.forEach(page => {
      sitemap += `
  <url>
    <loc>${baseUrl}${page.path}</loc>
    <lastmod>${currentDate.split('T')[0]}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
    });

    sitemap += `
</urlset>`;

    return sitemap;
  } catch (error) {
    console.error('Error generating sitemap:', error);
    return null;
  }
}