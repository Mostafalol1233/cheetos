import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../data');
const SEED_FILE = path.join(DATA_DIR, 'games.json');
const PERSISTENT_FILE = path.join(DATA_DIR, 'games_persistent.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const init = () => {
  try {
    if (!fs.existsSync(PERSISTENT_FILE)) {
      console.log('Initializing persistent game data from seed...');
      if (fs.existsSync(SEED_FILE)) {
        const seedData = fs.readFileSync(SEED_FILE, 'utf8');
        fs.writeFileSync(PERSISTENT_FILE, seedData);
      } else {
        fs.writeFileSync(PERSISTENT_FILE, '[]');
      }
    }
  } catch (error) {
    console.error('Error initializing local DB:', error);
  }
};

const getGames = () => {
  try {
    init(); // Ensure file exists
    const data = fs.readFileSync(PERSISTENT_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading local DB:', error);
    return [];
  }
};

const saveGames = (games) => {
  try {
    fs.writeFileSync(PERSISTENT_FILE, JSON.stringify(games, null, 2));
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
