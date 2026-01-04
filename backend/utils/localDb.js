import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const GAME_FILE = path.join(DATA_DIR, 'game.json');
const GAMES_FILE = path.join(DATA_DIR, 'games.json');

const getCanonicalFile = () => {
  if (fs.existsSync(GAME_FILE)) return GAME_FILE;
  return GAMES_FILE;
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const init = () => {
  try {
    const canonical = getCanonicalFile();
    if (!fs.existsSync(canonical)) {
      fs.writeFileSync(canonical, '[]');
    }
  } catch (error) {
    console.error('Error initializing local DB:', error);
  }
};

const getGames = () => {
  try {
    init(); // Ensure file exists
    const canonical = getCanonicalFile();
    const data = fs.readFileSync(canonical, 'utf8');
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error('Error reading local DB:', error);
    return [];
  }
};

const saveGames = (games) => {
  try {
    init();
    const canonical = getCanonicalFile();
    const tmp = `${canonical}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Array.isArray(games) ? games : [], null, 2));
    fs.renameSync(tmp, canonical);
    return true;
  } catch (error) {
    console.error('Error writing local DB:', error);
    return false;
  }
};

const findGame = (idOrSlug) => {
  const games = getGames();
  return games.find(g => g.id === idOrSlug || g.slug === idOrSlug);
};

const updateGame = (id, updates) => {
  const games = getGames();
  const index = games.findIndex(g => g.id === id);
  
  if (index === -1) return null;
  
  const updatedGame = { ...games[index], ...updates };
  games[index] = updatedGame;
  saveGames(games);
  return updatedGame;
};

const createGame = (game) => {
  const games = getGames();
  games.push(game);
  saveGames(games);
  return game;
};

const deleteGame = (id) => {
  let games = getGames();
  const initialLength = games.length;
  games = games.filter(g => g.id !== id && g.slug !== id);
  
  if (games.length < initialLength) {
    saveGames(games);
    return true;
  }
  return false;
};

export default {
  init,
  getGames,
  saveGames,
  findGame,
  updateGame,
  createGame,
  deleteGame
};
