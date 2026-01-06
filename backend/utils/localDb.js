import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '..', 'data');
const SEED_FILE = path.join(DATA_DIR, 'game.json');
const PERSISTENT_FILE = path.join(DATA_DIR, 'games-persistent.json');

function ensureDataDir() {
  try {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  } catch {}
}

function init() {
  ensureDataDir();
  try {
    if (!fs.existsSync(PERSISTENT_FILE)) {
      if (fs.existsSync(SEED_FILE)) {
        const seed = fs.readFileSync(SEED_FILE, 'utf8');
        fs.writeFileSync(PERSISTENT_FILE, seed);
      } else {
        fs.writeFileSync(PERSISTENT_FILE, '[]');
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
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(arr, null, 2), 'utf8');
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

export default {
  init,
  getGames,
  findGame,
  createGame,
  updateGame,
  deleteGame,
  saveGames: writePersistent,
};

