
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const AUTH_FOLDER = path.join(rootDir, "baileys_auth_info");

console.log(`Checking for WhatsApp session at: ${AUTH_FOLDER}`);

if (fs.existsSync(AUTH_FOLDER)) {
  console.log('🗑️ Removing session folder...');
  try {
    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
    console.log('✅ Session cleared successfully. Restart the server to re-scan QR code.');
  } catch (err) {
    console.error('❌ Failed to remove session folder:', err.message);
  }
} else {
  console.log('ℹ️ No session folder found.');
}
