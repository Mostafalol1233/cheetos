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

      CREATE TABLE IF NOT EXISTS worldcup_prediction_changes (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        old_home_score_pred INTEGER,
        old_away_score_pred INTEGER,
        new_home_score_pred INTEGER NOT NULL,
        new_away_score_pred INTEGER NOT NULL,
        changed_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS worldcup_losers (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        match_id TEXT NOT NULL,
        eliminated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(user_id)
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
    if (match.status === 'finished' || match.status === 'live') {
      return res.status(400).json({ message: 'انتهت أو بدأت المباراة، لا يمكن التوقع' });
    }
    // Check if match date has passed
    if (match.match_date) {
      const matchTime = new Date(match.match_date);
      const now = new Date();
      if (now >= matchTime) {
        return res.status(400).json({ message: 'بدأت المباراة، لا يمكن التوقع' });
      }
    }

    // Check if user is already a loser
    const loserResult = await pool.query('SELECT * FROM worldcup_losers WHERE user_id = $1', [userId]);
    if (loserResult.rows.length) {
      return res.status(400).json({ message: 'لقد تم استبعادك من المسابقة' });
    }

    const homeScore = parseInt(home_score_pred);
    const awayScore = parseInt(away_score_pred);
    if (isNaN(homeScore) || isNaN(awayScore) || homeScore < 0 || awayScore < 0 || homeScore > 20 || awayScore > 20) {
      return res.status(400).json({ message: 'نتيجة غير صالحة' });
    }

    // Get existing prediction to log change
    const existingPredResult = await pool.query(
      'SELECT * FROM worldcup_predictions WHERE user_id = $1 AND match_id = $2',
      [userId, match_id]
    );

    const id = crypto.randomUUID();
    await pool.query(
      `INSERT INTO worldcup_predictions (id, user_id, match_id, home_score_pred, away_score_pred)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (user_id, match_id) DO UPDATE
       SET home_score_pred = $4, away_score_pred = $5, created_at = NOW()`,
      [id, userId, match_id, homeScore, awayScore]
    );

    // Log the change
    const changeId = crypto.randomUUID();
    const oldHome = existingPredResult.rows.length ? existingPredResult.rows[0].home_score_pred : null;
    const oldAway = existingPredResult.rows.length ? existingPredResult.rows[0].away_score_pred : null;
    await pool.query(
      `INSERT INTO worldcup_prediction_changes (id, user_id, match_id, old_home_score_pred, old_away_score_pred, new_home_score_pred, new_away_score_pred)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [changeId, userId, match_id, oldHome, oldAway, homeScore, awayScore]
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

    console.log('🔄 Updating match:', { id, home_team, away_team, home_flag, away_flag, match_date, round, home_score, away_score, status });

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
      console.log('✅ Match marked as finished, updating predictions and losers...');
      await pool.query(
        `UPDATE worldcup_predictions SET is_correct = (home_score_pred = $1 AND away_score_pred = $2)
         WHERE match_id = $3`,
        [parseInt(home_score), parseInt(away_score), id]
      );

      // Add users who got it wrong to losers (if not already there)
      await pool.query(`
        INSERT INTO worldcup_losers (id, user_id, match_id)
        SELECT $1, p.user_id, $2
        FROM worldcup_predictions p
        WHERE p.match_id = $2
          AND p.is_correct = FALSE
          AND p.user_id NOT IN (SELECT user_id FROM worldcup_losers)
      `, [crypto.randomUUID(), id]);
    }

    console.log('✅ Match updated successfully!');
    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error updating match:', err);
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

router.get('/admin/prediction-changes', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { match_id, user_id } = req.query;
    let query = `
      SELECT pc.*, 
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             m.home_team, m.away_team, m.match_date
      FROM worldcup_prediction_changes pc
      JOIN users u ON pc.user_id = u.id
      JOIN worldcup_matches m ON pc.match_id = m.id
    `;
    const params = [];
    if (match_id) {
      query += ' WHERE pc.match_id = $1';
      params.push(match_id);
      if (user_id) {
        query += ' AND pc.user_id = $2';
        params.push(user_id);
      }
    } else if (user_id) {
      query += ' WHERE pc.user_id = $1';
      params.push(user_id);
    }
    query += ' ORDER BY pc.changed_at DESC';

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/admin/losers', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT l.*, 
             u.name as user_name, u.email as user_email, u.phone as user_phone,
             m.home_team, m.away_team, m.match_date
      FROM worldcup_losers l
      JOIN users u ON l.user_id = u.id
      JOIN worldcup_matches m ON l.match_id = m.id
      ORDER BY l.eliminated_at DESC
    `);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/clear-losers', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    await pool.query('DELETE FROM worldcup_losers');
    res.json({ success: true, message: 'تم مسح قائمة الخاسرين' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to get prediction history for a user or match
router.get('/admin/prediction-history', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { user_id, match_id } = req.query;
    let query = `
      SELECT 
        pc.*,
        u.name as user_name, u.email as user_email, u.phone as user_phone,
        m.home_team, m.away_team
      FROM worldcup_prediction_changes pc
      JOIN users u ON pc.user_id = u.id
      JOIN worldcup_matches m ON pc.match_id = m.id
    `;
    const params = [];
    const conditions = [];
    if (user_id) {
      conditions.push('pc.user_id = $' + (params.length + 1));
      params.push(user_id);
    }
    if (match_id) {
      conditions.push('pc.match_id = $' + (params.length + 1));
      params.push(match_id);
    }
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    query += ' ORDER BY pc.changed_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Prediction history error:', err);
    res.status(500).json({ message: err.message });
  }
});

// Endpoint to revert a prediction to a previous version
router.post('/admin/revert-prediction', authenticateToken, ensureAdmin, async (req, res) => {
  try {
    const { change_id } = req.body;
    if (!change_id) {
      return res.status(400).json({ message: 'يرجى تحديد التغيير المراد الرجوع اليه' });
    }
    // Get the change details
    const changeResult = await pool.query('SELECT * FROM worldcup_prediction_changes WHERE id = $1', [change_id]);
    if (!changeResult.rows.length) {
      return res.status(404).json({ message: 'التغيير غير موجود' });
    }
    const change = changeResult.rows[0];
    // If this is the first prediction (old values are null), we can't revert further
    if (change.old_home_score_pred === null && change.old_away_score_pred === null) {
      return res.status(400).json({ message: 'لا يمكن الرجوع اكثر من ذلك، هذه هي اول توقعات للمستخدم' });
    }
    // Revert the prediction
    await pool.query(
      `UPDATE worldcup_predictions 
       SET home_score_pred = $1, away_score_pred = $2, created_at = NOW()
       WHERE user_id = $3 AND match_id = $4`,
      [change.old_home_score_pred, change.old_away_score_pred, change.user_id, change.match_id]
    );
    // Log this revert as a new change for history
    const newChangeId = crypto.randomUUID();
    await pool.query(
      `INSERT INTO worldcup_prediction_changes 
       (id, user_id, match_id, old_home_score_pred, old_away_score_pred, new_home_score_pred, new_away_score_pred)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [newChangeId, change.user_id, change.match_id, change.new_home_score_pred, change.new_away_score_pred, change.old_home_score_pred, change.old_away_score_pred]
    );
    res.json({ success: true, message: 'تم الرجوع الى التوقع السابق بنجاح' });
  } catch (err) {
    console.error('❌ Revert prediction error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/sync', authenticateToken, ensureAdmin, async (req, res) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ message: 'مفتاح API غير مضبوط. أضف FOOTBALL_DATA_API_KEY في إعدادات البيئة.' });
  }

  try {
    console.log('📡 Syncing with football-data.org API...');
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
          console.log('📥 API Response Status:', apiRes.statusCode);
          console.log('📦 API Response Body (first 500 chars):', body.substring(0, 500));
          try { 
            const parsed = JSON.parse(body);
            resolve(parsed); 
          } catch (err) { 
            console.error('❌ JSON Parse Error:', err);
            reject(new Error('فشل تحليل البيانات')); 
          }
        });
      }).on('error', (err) => {
        console.error('❌ API Request Error:', err);
        reject(err);
      });
    });

    if (!data.matches) {
      console.error('❌ API response missing matches:', data);
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
        
        // If match is finished, update predictions correctness and add losers
        if (status === 'finished' && homeScore !== null && awayScore !== null) {
          const matchId = existing.rows[0].id;
          await pool.query(
            'UPDATE worldcup_predictions SET is_correct = (home_score_pred = $1 AND away_score_pred = $2) WHERE match_id = $3',
            [homeScore, awayScore, matchId]
          );
          
          // Add users who got it wrong to losers
          await pool.query(`
            INSERT INTO worldcup_losers (id, user_id, match_id)
            SELECT $1, p.user_id, $2
            FROM worldcup_predictions p
            WHERE p.match_id = $2
              AND p.is_correct = FALSE
              AND p.user_id NOT IN (SELECT user_id FROM worldcup_losers)
          `, [crypto.randomUUID(), matchId]);
        }
      } else {
        const id = crypto.randomUUID();
        await pool.query(
          'INSERT INTO worldcup_matches (id, home_team, away_team, home_flag, away_flag, match_date, round, status, api_match_id, home_score, away_score) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)',
          [id, homeTeam, awayTeam, homeFlag, awayFlag, matchDate, round, status, apiId, homeScore, awayScore]
        );
        inserted++;
      }
    }

    console.log(`✅ Sync complete! ${inserted} new matches added.`);
    res.json({ success: true, message: `تمت المزامنة — ${inserted} مباريات جديدة`, total: data.matches.length });
  } catch (err) {
    console.error('❌ Sync error:', err);
    res.status(500).json({ message: err.message });
  }
});

router.post('/admin/refresh-scores', authenticateToken, ensureAdmin, async (req, res) => {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    return res.status(400).json({ message: 'مفتاح API غير مضبوط. أضف FOOTBALL_DATA_API_KEY في إعدادات البيئة.' });
  }

  try {
    console.log('🔄 Refreshing scores from football-data.org API...');
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
          console.log('📥 API Response Status:', apiRes.statusCode);
          console.log('📦 API Response Body (first 500 chars):', body.substring(0, 500));
          try { 
            const parsed = JSON.parse(body);
            resolve(parsed); 
          } catch (err) { 
            console.error('❌ JSON Parse Error:', err);
            reject(new Error('فشل تحليل البيانات')); 
          }
        });
      }).on('error', (err) => {
        console.error('❌ API Request Error:', err);
        reject(err);
      });
    });

    if (!data.matches) {
      console.error('❌ API response missing matches:', data);
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
        
        // If match is finished, update predictions correctness and add losers
        if (status === 'finished' && homeScore !== null && awayScore !== null) {
          const matchId = existing.rows[0].id;
          await pool.query(
            'UPDATE worldcup_predictions SET is_correct = (home_score_pred = $1 AND away_score_pred = $2) WHERE match_id = $3',
            [homeScore, awayScore, matchId]
          );
          
          // Add users who got it wrong to losers
          await pool.query(`
            INSERT INTO worldcup_losers (id, user_id, match_id)
            SELECT $1, p.user_id, $2
            FROM worldcup_predictions p
            WHERE p.match_id = $2
              AND p.is_correct = FALSE
              AND p.user_id NOT IN (SELECT user_id FROM worldcup_losers)
          `, [crypto.randomUUID(), matchId]);
        }
        updated++;
      }
    }

    console.log(`✅ Refresh complete! ${updated} matches updated.`);
    res.json({ success: true, message: `تم تحديث ${updated} مباراة`, total: data.matches.length });
  } catch (err) {
    console.error('❌ Refresh error:', err);
    res.status(500).json({ message: err.message });
  }
});

export default router;
