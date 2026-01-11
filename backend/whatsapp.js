
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  downloadContentFromMessage
} from "@whiskeysockets/baileys";
import pool from './db.js';
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import qrcode from "qrcode-terminal";
import { storage } from "./storage.js";

// Store connection state
let sock = null;
let qrCode = null;
let isConnected = false;
let connectionStatus = "disconnected";
let lastAdminNotifyAt = 0;

// Path to store auth credentials
const AUTH_FOLDER = path.join(process.cwd(), "baileys_auth_info");

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

export const getQRCode = () => qrCode;
export const getConnectionStatus = () => ({ connected: isConnected, status: connectionStatus });

export async function sendWhatsAppMessage(to, text) {
  if (!sock) {
    throw new Error("WhatsApp client not initialized");
  }
  if (!isConnected) {
    throw new Error("WhatsApp not connected");
  }
  
  // Format phone number
  const cleanPhone = to.replace(/[^\d]/g, '');
  const id = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
  
  try {
    const result = await sock.sendMessage(id, { text });
    return { status: 'sent', id: result.key.id };
  } catch (err) {
    console.error('Failed to send WhatsApp message:', err);
    throw err;
  }
}

export async function sendWhatsAppMedia(to, mediaUrl, caption) {
  if (!sock) throw new Error("WhatsApp client not initialized");
  if (!isConnected) throw new Error("WhatsApp not connected");
  const cleanPhone = to.replace(/[^\d]/g, '');
  const id = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
  try {
    const result = await sock.sendMessage(id, { image: { url: mediaUrl }, caption: caption || '' });
    return { status: 'sent', id: result.key.id };
  } catch (err) {
    console.error('Failed to send WhatsApp media:', err?.message || err);
    throw err;
  }
}

export async function sendWithRetry(fn, maxRetries = 3) {
  let attempt = 0;
  let delay = 500;
  while (attempt < maxRetries) {
    try {
      return await fn();
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, delay));
      delay = Math.min(5000, delay * 2);
    }
  }
}

export async function startWhatsApp() {
  if (process.env.RESET_WHATSAPP === 'true') {
    console.log('🔄 RESET_WHATSAPP is set. Clearing session...');
    try {
      if (fs.existsSync(AUTH_FOLDER)) {
        fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
        console.log('✅ WhatsApp session cleared successfully');
      }
    } catch (err) {
      console.error('❌ Failed to clear WhatsApp session:', err.message);
    }
  }

  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }), // Silent to reduce noise
    printQRInTerminal: false,
    auth: state,
    generateHighQualityLinkPreview: true,
    connectTimeoutMs: 60000,
  });

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = "scan_qr";
      console.log("\n╔════════════════════════════════════════╗");
      console.log("║   WhatsApp QR Code - Scan to Connect   ║");
      console.log("╚════════════════════════════════════════╝\n");
      qrcode.generate(qr, { small: true });
      console.log("\n");
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      isConnected = false;
      connectionStatus = "disconnected";
      qrCode = null;

      if (shouldReconnect) {
        setTimeout(() => startWhatsApp(), statusCode === 515 ? 1000 : 5000);
      }
    } else if (connection === "open") {
      isConnected = true;
      connectionStatus = "connected";
      qrCode = null;
      
      const botNumber = sock.user.id.split(':')[0];
      console.log(`\n✅ WhatsApp Bot Connected to: ${botNumber}\n`);

      // Send welcome message to admin (rate-limited)
      try {
        const now = Date.now();
        if (now - lastAdminNotifyAt >= 60 * 60 * 1000) {
          const adminPhone = process.env.ADMIN_PHONE || '';
          if (adminPhone) {
            try {
              const cleanPhone = adminPhone.replace(/[^\d]/g, '');
              const jid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
              const msg = `🤖 GameCart Bot Connected\n✅ Status: Online\n📱 Number: ${botNumber}\n📅 ${new Date(now).toLocaleString()}`;
              await sock.sendMessage(jid, { text: msg });
              lastAdminNotifyAt = now;
            } catch (e) {
              // Silent fail
            }
          }
        }
      } catch (err) {
        // Silent fail
      }
    }
  });

  // Start connection monitor
  startConnectionMonitor();
  
  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      for (const msg of messages) {
        if (!msg.key.fromMe) {
          const from = msg.key.remoteJid;
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          const hasImage = !!(msg.message && (msg.message.imageMessage || msg.message.documentMessage && (msg.message.documentMessage.mimetype || '').startsWith('image')));

          if (from && (text || hasImage)) {
            try {
              const phoneNumber = from.replace('@s.whatsapp.net', '');
              const id = `wa_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

              let mediaUrl = null;
              if (hasImage) {
                try {
                  const stream = await downloadContentFromMessage(msg.message.imageMessage || msg.message.documentMessage, 'image');
                  const parts = [];
                  for await (const chunk of stream) parts.push(chunk);
                  const buffer = Buffer.concat(parts);
                  const filename = `wa_${Date.now()}_${Math.random().toString(36).slice(2,9)}.jpg`;
                  const uploadDir = path.join(process.cwd(), 'uploads');
                  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
                  const dest = path.join(uploadDir, filename);
                  fs.writeFileSync(dest, buffer);
                  const front = (process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 20291}`).replace(/\/$/, '');
                  mediaUrl = `${front}/uploads/${filename}`;
                } catch (mediaErr) {
                  console.error('Failed to save inbound media:', mediaErr?.message || mediaErr);
                }
              }

              await storage.createWhatsAppMessage({
                id,
                waMessageId: msg.key.id || null,
                direction: 'inbound',
                fromPhone: from,
                toPhone: null,
                message: text || (mediaUrl ? `Image received: ${mediaUrl}` : ''),
                mediaUrl: mediaUrl || null,
                timestamp: Date.now(),
                status: 'received'
              });

              // Create seller alert
              const alertId = `alert_${Date.now()}`;
              const summary = text ? `New WhatsApp from ${phoneNumber}: ${text.slice(0, 80)}` : `Image received from ${phoneNumber}`;
              await storage.createSellerAlert({ id: alertId, type: hasImage ? 'payment_confirmation' : 'whatsapp_message', summary, read: false, flagged: false, createdAt: Date.now() });

              // Lookup user by phone in database (if available) to include name/email and latest transaction
              let userInfo = null;
              try {
                const phoneDigits = phoneNumber.replace(/[^\d]/g, '');
                const q = await pool.query('SELECT id, name AS full_name, email FROM users WHERE phone = $1 OR phone = $2 LIMIT 1', [phoneDigits, `+${phoneDigits}`]);
                if (q.rows.length > 0) userInfo = q.rows[0];
              } catch (dbErr) {
                // ignore
              }

              // Gather recent pending transaction for user (if any)
              let itemsSummary = '';
              if (userInfo && userInfo.id) {
                try {
                  const tx = await pool.query('SELECT id FROM transactions WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 1', [userInfo.id]);
                  if (tx.rows.length > 0) {
                    const txId = tx.rows[0].id;
                    const tis = await pool.query('SELECT game_id, quantity, price FROM transaction_items WHERE transaction_id = $1', [txId]);
                    itemsSummary = tis.rows.map(r => `- ${r.game_id} x${r.quantity} @ ${r.price}`).join('\n');
                  }
                } catch (txErr) { /* ignore */ }
              }

              // Notify admin/connected numbers
              const adminPhone = (process.env.ADMIN_PHONE || '').trim();
              const connectedPhone = (process.env.CONNECTED_PHONE || '').trim();
              const userDisplay = userInfo ? `${userInfo.full_name || ''} <${userInfo.email || ''}>` : phoneNumber;
              const notifyText = `📌 Payment confirmation received\nFrom: ${userDisplay}\nPhone: ${phoneNumber}\n${itemsSummary ? `Items:\n${itemsSummary}\n` : ''}${mediaUrl ? `Image: ${mediaUrl}` : ''}`;
              if (adminPhone) {
                try { await sendWhatsAppMessage(adminPhone, notifyText); } catch (e) { console.error('Failed to notify admin about inbound WA:', e?.message || e); }
              }
              if (connectedPhone && connectedPhone !== adminPhone) {
                try { await sendWhatsAppMessage(connectedPhone, notifyText); } catch (e) { console.error('Failed to notify connected about inbound WA:', e?.message || e); }
              }

              console.log(`📱 User message from ${phoneNumber}: ${ (text || '').substring(0, 60) }${(text && text.length > 60) ? '...' : ''}`);
            } catch (err) {
              console.error('Failed processing inbound WhatsApp message:', err?.message || err);
            }
          }
        }
      }
    }
  });
}

function startConnectionMonitor() {
  setInterval(() => {
    if (sock) {
      // If we think we are connected but the socket is closed, trigger reconnect
      if (isConnected && sock.ws?.readyState !== 1) { // 1 = OPEN
         startWhatsApp();
      }
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
}

