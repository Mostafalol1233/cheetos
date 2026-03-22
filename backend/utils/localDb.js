import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_FILE = (() => {
  const gamesJson = path.join(DATA_DIR, 'games.json');
  const legacyJson = path.join(DATA_DIR, 'game.json');
  if (fs.existsSync(gamesJson)) return gamesJson;
  return legacyJson;
})();
const PERSISTENT_FILE = path.join(DATA_DIR, 'games-persistent.json');
const CATEGORIES_FILE = path.join(DATA_DIR, 'categories.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function init() {
  ensureDataDir();
  try {
    const hasPersistent = fs.existsSync(PERSISTENT_FILE);
    const hasSeed = fs.existsSync(SEED_FILE);
    if (!hasPersistent) {
      if (hasSeed) {
        const seed = fs.readFileSync(SEED_FILE, 'utf8');
        fs.writeFileSync(PERSISTENT_FILE, seed || '[]');
      } else {
        fs.writeFileSync(PERSISTENT_FILE, '[]');
      }
    } else if (hasSeed) {
      const current = fs.readFileSync(PERSISTENT_FILE, 'utf8').trim();
      if (current === '[]') {
        const seed = fs.readFileSync(SEED_FILE, 'utf8');
        fs.writeFileSync(PERSISTENT_FILE, seed || '[]');
      }
    }
  } catch (err) {
    console.error('LocalDB init error:', err);
  }
}

function readPersistent() {
  try {
    init();
    const data = fs.readFileSync(PERSISTENT_FILE, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writePersistent(games) {
  try {
    ensureDataDir();
    const arr = Array.isArray(games) ? games : [];
    const txt = JSON.stringify(arr, null, 2);
    fs.writeFileSync(PERSISTENT_FILE, txt, 'utf8');
    // Also update legacy seed file so parts of the app that read backend/data/games.json
    // (index.js and admin utilities) will see the latest edits.
    try {
      const seedPath = path.join(DATA_DIR, 'games.json');
      fs.writeFileSync(seedPath, txt, 'utf8');
    } catch (e) {
      // non-fatal
    }
    return true;
  } catch (err) {
    console.error('LocalDB write error:', err);
    return false;
  }
}

function getGames() {
  return readPersistent();
}

function findGame(idOrSlug) {
  const all = readPersistent();
  return all.find(g => g.id === idOrSlug || g.slug === idOrSlug) || null;
}

function createGame(game) {
  const all = readPersistent();
  const next = [...all, { ...game, updated_at: new Date().toISOString() }];
  writePersistent(next);
  return game;
}

function updateGame(id, updates) {
  const all = readPersistent();
  const idx = all.findIndex(g => g.id === id || g.slug === id);
  if (idx === -1) return null;
  const updated = { ...all[idx], ...updates, updated_at: new Date().toISOString() };
  all[idx] = updated;
  writePersistent(all);
  return updated;
}

function deleteGame(id) {
  const all = readPersistent();
  const idx = all.findIndex(g => g.id === id || g.slug === id);
  if (idx === -1) return false;
  const next = [...all.slice(0, idx), ...all.slice(idx + 1)];
  writePersistent(next);
  return true;
}

function getCategories() {
  try {
    if (fs.existsSync(CATEGORIES_FILE)) {
      const data = fs.readFileSync(CATEGORIES_FILE, 'utf8');
      const parsed = JSON.parse(data);
      return Array.isArray(parsed) ? parsed : [];
    }
  } catch {}
  return [];
}

function findCategory(idOrSlug) {
  const all = getCategories();
  return all.find(c => c.id === idOrSlug || c.slug === idOrSlug) || null;
}

export default {
  init,
  getGames,
  findGame,
  createGame,
  updateGame,
  deleteGame,
  saveGames: writePersistent,
  getCategories,
  findCategory
};
