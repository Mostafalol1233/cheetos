import express from 'express';
import pool from '../db.js';
import { authenticateToken, ensureAdmin } from '../middleware/auth.js';
import crypto from 'crypto';
import https from 'https';

const router = express.Router();

// Country name to flag emoji mapping
const countryFlags = {
  "algeria": "🇩🇿", "argentina": "🇦🇷", "australia": "🇦🇺", "austria": "🇦🇹",
  "belgium": "🇧🇪", "brazil": "🇧🇷", "bulgaria": "🇧🇬", "cameroon": "🇨🇲",
  "canada": "🇨🇦", "chile": "🇨🇱", "china": "🇨🇳", "colombia": "🇨🇴",
  "costa rica": "🇨🇷", "croatia": "🇭🇷", "denmark": "🇩🇰", "egypt": "🇪🇬",
  "england": "🏴", "finland": "🇫🇮", "france": "🇫🇷", "germany": "🇩🇪",
  "ghana": "🇬🇭", "greece": "🇬🇷", "honduras": "🇭🇳", "iceland": "🇮🇸",
  "iran": "🇮🇷", "iraq": "🇮🇶", "ireland": "🇮🇪", "israel": "🇮🇱",
  "italy": "🇮🇹", "ivory coast": "🇨🇮", "jamaica": "🇯🇲", "japan": "🇯🇵",
  "mexico": "🇲🇽", "morocco": "🇲🇦", "netherlands": "🇳🇱", "new zealand": "🇳🇿",
  "nigeria": "🇳🇬", "northern ireland": "🏴", "norway": "🇳🇴", "panama": "🇵🇦",
  "paraguay": "🇵🇾", "peru": "🇵🇪", "poland": "🇵🇱", "portugal": "🇵🇹",
  "qatar": "🇶🇦", "romania": "🇷🇴", "russia": "🇷🇺", "saudi arabia": "🇸🇦",
  "scotland": "🏴", "senegal": "🇸🇳", "serbia": "🇷🇸", "slovakia": "🇸🇰",
  "slovenia": "🇸🇮", "south africa": "🇿🇦", "south korea": "🇰🇷", "spain": "🇪🇸",
  "sweden": "🇸🇪", "switzerland": "🇨🇭", "tunisia": "🇹🇳", "turkey": "🇹🇷",
  "ukraine": "🇺🇦", "united arab emirates": "🇦🇪", "united kingdom": "🇬🇧",
  "united states": "🇺🇸", "usa": "🇺🇸", "uruguay": "🇺🇾", "venezuela": "🇻🇪",
  "wales": "🏴"
};

function getFlag(countryName) {
  if (!countryName) return "";
  const normalized = countryName.toLowerCase().trim();
  // Try exact match first
  if (countryFlags[normalized]) return countryFlags[normalized];
  // Try partial matches
  for (const [key, flag] of Object.entries(countryFlags)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return flag;
    }
  }
  return "";
}

async function initWorldCupTables() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS worldcup_matches (
        id TEXT PRIMARY KEY,
        home_team TEXT NOT NULL,
        away_team TEXT NOT NULL,
        home_flag TEXT DEFAULT '',
        away_flag TEXT DEFAULT '',
        match_date TIMESTAMP,
        home_score INTEGER DEFAULT NULL,
        away_score INTEGER DEFAULT NULL,
        status TEXT DEFAULT 'upcoming',
        round TEXT DEFAULT '',
        api_match_id TEXT DEFAULT '',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS worldcup_predictions (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        home_score_pred INTEGER NOT NULL,
        away_score_pred INTEGER NOT NULL,
        is_correct BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id, match_id)
      );

      CREATE TABLE IF NOT EXISTS worldcup_settings (
        id INTEGER PRIMARY KEY DEFAULT 1,
        title TEXT DEFAULT 'كأس العالم 2026',
        subtitle TEXT DEFAULT 'توقع النتيجة واربح كوداً مجاناً',
        video_url TEXT DEFAULT '',
        prize_description TEXT DEFAULT 'كود مجاني لأحد منتجات المتجر',
        is_active BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT NOW()
      );

      INSERT INTO worldcup_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;
    `);
  } catch (err) {
    console.error('World Cup tables init error:', err.message);
  }
}

initWorldCupTables();

router.get('/settings', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM worldcup_settings WHERE id = 1');
    res.json(result.rows[0] || {});
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/matches', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM worldcup_matches ORDER BY match_date ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/my-predictions', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT p.*, m.home_team, m.away_team, m.home_score, m.away_score, m.status, m.match_date, m.round
       FROM worldcup_predictions p
       JOIN worldcup_matches m ON p.match_id = m.id
       WHERE p.user_id = $1
       ORDER BY m.match_date ASC`,
      [req.user.userId || req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/predict', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId || req.user.id;
    const { match_id, home_score_pred, away_score_pred } = req.body;

    if (!match_id || home_score_pred === undefined || away_score_pred === undefined) {
      return res.status(400).json({ message: 'بيانات ناقصة' });
    }

    const matchResult = await pool.query(
      'SELECT * FROM worldcup_matches WHERE id = $1',
      [match_id]
    );
    if (!matchResult.rows.length) {
      return res.status(404).json({ message: 'المباراة غير موجودة' });
    }

    const match = matchResult.rows[0];
    if (match.status === 'finished') {
      return res.status(400).json({ message: 'انتهت المباراة، لا يمكن التوقع' });
    }

    const homeScore = parseInt(home_score_pred);
    const awayScore = parseInt(away_score_pred);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
      return res.status(400).json({ message: 'نتيجة غير صالحة' });
    }

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO worldcup_predictions (id, user_id, match_id, home_score_pred, away_score_pred)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, match_id) DO UPDATE
       SET home_score_pred = $4, away_score_pred = $5, created_at = NOW()`,
      [id, userId, match_id, homeScore, awayScore]
    );

    res.json({ success: true, message: 'تم حفظ توقعك بنجاح' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/predictions', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { match_id } = req.query;
    let query = `
      SELECT p.*, 
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             m.home_team, m.away_team, m.home_score, m.away_score, m.status as match_status,
             m.match_date, m.round
      FROM worldcup_predictions p
      JOIN users u ON p.user_id = u.id
      JOIN worldcup_matches m ON p.match_id = m.id
    `;
    const params = [];
    if (match_id) {
      query += ' WHERE p.match_id = $1';
      params.push(match_id);
    }
    query += ' ORDER BY m.match_date ASC, p.created_at ASC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/matches', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM worldcup_matches ORDER BY match_date ASC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/matches', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { home_team, away_team, home_flag, away_flag, match_date, round } = req.body;
    if (!home_team || !away_team) {
      return res.status(400).json({ message: 'اسما الفريقين مطلوبان' });
    }
    const id = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO worldcup_matches (id, home_team, away_team, home_flag, away_flag, match_date, round, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'upcoming') RETURNING *`,
      [id, home_team, away_team, home_flag || '', away_flag || '', match_date || null, round || '']
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/admin/matches/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { home_team, away_team, home_flag, away_flag, match_date, round, home_score, away_score, status } = req.body;
    const { id } = req.params;

    const result = await pool.query(
      `UPDATE worldcup_matches SET
        home_team = COALESCE($1, home_team),
        away_team = COALESCE($2, away_team),
        home_flag = COALESCE($3, home_flag),
        away_flag = COALESCE($4, away_flag),
        match_date = COALESCE($5, match_date),
        round = COALESCE($6, round),
        home_score = $7,
        away_score = $8,
        status = COALESCE($9, status)
       WHERE id = $10 RETURNING *`,
      [home_team, away_team, home_flag, away_flag, match_date, round,
       home_score !== undefined ? parseInt(home_score) : null,
       away_score !== undefined ? parseInt(away_score) : null,
       status, id]
    );

    if (!result.rows.length) return res.status(404).json({ message: 'مباراة غير موجودة' });

    if (status === 'finished' && home_score !== undefined && away_score !== undefined) {
      await pool.query(
        `UPDATE worldcup_predictions SET is_correct = (home_score_pred = $1 AND away_score_pred = $2)
         WHERE match_id = $3`,
        [parseInt(home_score), parseInt(away_score), id]
      );
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/admin/matches/:id', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM worldcup_predictions WHERE match_id = $1', [req.params.id]);
    await pool.query('DELETE FROM worldcup_matches WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/admin/settings', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { title, subtitle, video_url, prize_description, is_active } = req.body;
    const result = await pool.query(
      `UPDATE worldcup_settings SET
        title = COALESCE($1, title),
        subtitle = COALESCE($2, subtitle),
        video_url = COALESCE($3, video_url),
        prize_description = COALESCE($4, prize_description),
        is_active = COALESCE($5, is_active)
       WHERE id = 1 RETURNING *`,
      [title, subtitle, video_url, prize_description, is_active]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/sync', authenticateToken, ensureAdmin, async (req, res) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ message: 'مفتاح API غير مضبوط. أضف FOOTBALL_DATA_API_KEY في إعدادات البيئة.' });
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.football-data.org',
        path: '/v4/competitions/WC/matches',
        headers: { 'X-Auth-Token': apiKey }
      };
      https.get(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('فشل تحليل البيانات')); }
        });
      }).on('error', reject);
    });

    if (!data.matches) {
      return res.status(500).json({ message: 'لم يتم استلام مباريات من API' });
    }

    let inserted = 0;
    for (const m of data.matches) {
      const homeTeam = m.homeTeam?.name || 'TBD';
      const awayTeam = m.awayTeam?.name || 'TBD';
      const homeFlag = getFlag(homeTeam);
      const awayFlag = getFlag(awayTeam);
      const matchDate = m.utcDate || null;
      const round = m.stage || m.group || '';
      const apiId = String(m.id || '');
      const homeScore = m.score?.fullTime?.home ?? null;
      const awayScore = m.score?.fullTime?.away ?? null;
      const status = m.status === 'FINISHED' ? 'finished' : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'live' : 'upcoming';

      const existing = await pool.query('SELECT id, home_flag, away_flag FROM worldcup_matches WHERE api_match_id = $1', [apiId]);
      if (existing.rows.length) {
        await pool.query(
          'UPDATE worldcup_matches SET home_score = $1, away_score = $2, status = $3, home_flag = COALESCE($4, home_flag), away_flag = COALESCE($5, away_flag) WHERE api_match_id = $6',
          [homeScore, awayScore, status, homeFlag, awayFlag, apiId]
        );
      } else {
        const id = crypto.randomUUID();
        await pool.query(
          'INSERT INTO worldcup_matches (id, home_team, away_team, home_flag, away_flag, match_date, round, status, api_match_id, home_score, away_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [id, homeTeam, awayTeam, homeFlag, awayFlag, matchDate, round, status, apiId, homeScore, awayScore]
        );
        inserted++;
      }
    }

    res.json({ success: true, message: `تمت المزامنة — ${inserted} مباريات جديدة`, total: data.matches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/refresh-scores', authenticateToken, ensureAdmin, async (req, res) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ message: 'مفتاح API غير مضبوط. أضف FOOTBALL_DATA_API_KEY في إعدادات البيئة.' });
  }

  try {
    const data = await new Promise((resolve, reject) => {
      const options = {
        hostname: 'api.football-data.org',
        path: '/v4/competitions/WC/matches',
        headers: { 'X-Auth-Token': apiKey }
      };
      https.get(options, (apiRes) => {
        let body = '';
        apiRes.on('data', chunk => body += chunk);
        apiRes.on('end', () => {
          try { resolve(JSON.parse(body)); }
          catch { reject(new Error('فشل تحليل البيانات')); }
        });
      }).on('error', reject);
    });

    if (!data.matches) {
      return res.status(500).json({ message: 'لم يتم استلام مباريات من API' });
    }

    let updated = 0;
    for (const m of data.matches) {
      const apiId = String(m.id || '');
      const homeScore = m.score?.fullTime?.home ?? null;
      const awayScore = m.score?.fullTime?.away ?? null;
      const status = m.status === 'FINISHED' ? 'finished' : m.status === 'IN_PLAY' || m.status === 'PAUSED' ? 'live' : 'upcoming';

      const existing = await pool.query('SELECT id FROM worldcup_matches WHERE api_match_id = $1', [apiId]);
      if (existing.rows.length) {
        await pool.query(
          'UPDATE worldcup_matches SET home_score = $1, away_score = $2, status = $3 WHERE api_match_id = $4',
          [homeScore, awayScore, status, apiId]
        );
        
        // If match is finished, update predictions correctness
        if (status === 'finished' && homeScore !== null && awayScore !== null) {
          await pool.query(
            'UPDATE worldcup_predictions SET is_correct = (home_score_pred = $1 AND away_score_pred = $2) WHERE match_id = $3',
            [homeScore, awayScore, existing.rows[0].id]
          );
        }
        updated++;
      }
    }

    res.json({ success: true, message: `تم تحديث ${updated} مباراة`, total: data.matches.length });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
