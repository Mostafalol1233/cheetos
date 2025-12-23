import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const gamesPath = path.join(__dirname, '..', 'data', 'games.json');
const publicDir = path.join(__dirname, '..', '..', 'client', 'public');
const attachedAssetsDir = path.join(__dirname, '..', '..', 'attached_assets');

console.log('Checking media assets...');

if (!fs.existsSync(gamesPath)) {
    console.error('games.json not found!');
    process.exit(1);
}

const games = JSON.parse(fs.readFileSync(gamesPath, 'utf8'));
let missing = 0;
let found = 0;

games.forEach(game => {
    if (game.image) {
        // Remove leading slash for path joining
        const relPath = game.image.startsWith('/') ? game.image.slice(1) : game.image;
        
        let exists = false;
        
        // Check in backend/public
        if (fs.existsSync(path.join(__dirname, '..', 'public', relPath))) {
            exists = true;
        }

        if (exists) {
            console.log(`[OK] ${game.name}: ${game.image}`);
            found++;
        } else {
            console.error(`[MISSING] ${game.name}: ${game.image}`);
            missing++;
        }
    } else {
        console.warn(`[NO IMAGE] ${game.name}`);
    }
});

console.log(`\nSummary: ${found} found, ${missing} missing.`);
if (missing > 0) process.exit(1);
