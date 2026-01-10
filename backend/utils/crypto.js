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

export function decryptText(payload) {
  if (!payload || typeof payload !== 'string') throw new Error('Invalid payload');
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
