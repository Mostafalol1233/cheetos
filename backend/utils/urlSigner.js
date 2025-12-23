import crypto from 'crypto';
import cloudinary from '../config/cloudinary.js';

const tokens = new Map();
const issuedPerOrder = new Map();

export function generateSignedUrl(publicId, ttlSeconds = 600, requesterIp = null, singleUse = true) {
  const now = Math.floor(Date.now() / 1000);
  const expiresAt = now + Math.max(60, Math.min(600, ttlSeconds));
  const url = cloudinary.url(publicId, {
    type: 'authenticated',
    resource_type: 'image',
    sign_url: true,
    expires_at: expiresAt,
    secure: true,
  });

  const token = crypto.randomBytes(16).toString('hex');
  tokens.set(token, { publicId, expiresAt: expiresAt * 1000, ip: requesterIp, used: false });
  return { url, expiresAt: expiresAt * 1000, token };
}

export function canIssueForOrder(orderId, requesterIp, singleUse = true) {
  if (!singleUse) return true;
  const prev = issuedPerOrder.get(orderId);
  if (!prev) return true;
  if (prev.ip && requesterIp && prev.ip !== requesterIp) return false;
  if (prev.used) return false;
  return false;
}

export function markIssued(orderId, requesterIp) {
  issuedPerOrder.set(orderId, { ip: requesterIp, used: true, ts: Date.now() });
}

export function validateToken(token, requesterIp) {
  const t = tokens.get(token);
  if (!t) return false;
  if (t.used) return false;
  if (t.ip && requesterIp && t.ip !== requesterIp) return false;
  if (Date.now() > t.expiresAt) return false;
  t.used = true;
  tokens.set(token, t);
  return true;
}

