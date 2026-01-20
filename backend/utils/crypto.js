import crypto from 'crypto';

// Derive a 32-byte key from ENCRYPTION_KEY env using SHA-256
function getKey() {
  const secret = process.env.ENCRYPTION_KEY || '';
  if (!secret) {
    throw new Error('ENCRYPTION_KEY is not set');
  }
  return crypto.createHash('sha256').update(String(secret)).digest(); // 32 bytes
}

// AES-256-GCM encryption. Returns a compact string: v1:base64(iv).base64(ciphertext).base64(tag)
export function encryptText(plainText) {
  const key = getKey();
  const iv = crypto.randomBytes(12); // recommended 96-bit IV for GCM
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(String(plainText), 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  const out = `v1:${iv.toString('base64')}.${ciphertext.toString('base64')}.${authTag.toString('base64')}`;
  return out;
}

// Legacy decryption for JSON format from socket.js (IV/Tag/Data hex)
export function decryptLegacy(payload) {
  try {
    let parsed;
    if (typeof payload === 'object') parsed = payload;
    else if (typeof payload === 'string' && payload.startsWith('{')) parsed = JSON.parse(payload);
    else return null;

    if (!parsed.iv || !parsed.tag || !parsed.data) return null;

    const key = (process.env.PAYMENT_ENCRYPTION_KEY || '').padEnd(32, '0').slice(0, 32);
    const iv = Buffer.from(parsed.iv, 'hex');
    const tag = Buffer.from(parsed.tag, 'hex');
    const encrypted = Buffer.from(parsed.data, 'hex');

    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(key), iv);
    decipher.setAuthTag(tag);
    const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
    return decrypted.toString('utf8');
  } catch (e) {
    return null;
  }
}

export function decryptText(payload) {
  if (!payload) return '';
  // Check for Legacy JSON first
  if (typeof payload === 'string' && payload.trim().startsWith('{')) {
    const legacy = decryptLegacy(payload);
    if (legacy) return legacy;
  }

  if (typeof payload !== 'string') throw new Error('Invalid payload');
  if (!payload.startsWith('v1:')) throw new Error('Unsupported crypto format');
  const [, rest] = payload.split('v1:');
  const parts = rest.split('.');
  if (parts.length !== 3) throw new Error('Malformed encrypted data');
  const iv = Buffer.from(parts[0], 'base64');
  const ciphertext = Buffer.from(parts[1], 'base64');
  const authTag = Buffer.from(parts[2], 'base64');
  const key = getKey();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(authTag);
  const decrypted = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return decrypted.toString('utf8');
}

export function safePreview(str, visible = 4) {
  const s = String(str || '');
  if (s.length <= visible) return s;
  return `${s.slice(0, visible)}${'*'.repeat(Math.max(0, s.length - visible * 2))}${s.slice(-visible)}`;
}
