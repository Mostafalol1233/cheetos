#!/usr/bin/env node

/**
 * WhatsApp Session Reset Script
 * Clears corrupted WhatsApp session data and restarts the connection
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🔄 Resetting WhatsApp session...');

const authDir = path.join(__dirname, 'baileys_auth_info');

try {
  if (fs.existsSync(authDir)) {
    fs.rmSync(authDir, { recursive: true, force: true });
    console.log('✅ WhatsApp auth folder cleared successfully');
  } else {
    console.log('ℹ️ WhatsApp auth folder not found (already clean)');
  }

  console.log('🔄 Please restart your backend server to reconnect WhatsApp');
  console.log('💡 Or use the admin panel: Settings > WhatsApp > Reset Auth');

} catch (err) {
  console.error('❌ Failed to reset WhatsApp session:', err.message);
  process.exit(1);
}

console.log('✅ WhatsApp session reset complete');
process.exit(0);