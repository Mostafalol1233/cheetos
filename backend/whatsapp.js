
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
let lastInboundMessageAt = 0; // Track last inbound message time for rate limiting
let decryptionErrorCount = 0; // Track decryption errors

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

  // Validate and format phone number
  if (!to || typeof to !== 'string') {
    throw new Error("Invalid phone number provided");
  }

  const cleanPhone = to.replace(/[^\d]/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    throw new Error(`Invalid phone number length: ${cleanPhone.length} digits`);
  }

  // Ensure it's not a group ID (groups end with @g.us)
  if (cleanPhone.includes('@g.us') || cleanPhone.includes('@s.whatsapp.net')) {
    throw new Error("Cannot send messages to groups or invalid recipients");
  }

  const id = `${cleanPhone}@s.whatsapp.net`;

  try {
    const result = await sock.sendMessage(id, { text });
    console.log(`✅ WhatsApp message sent to ${cleanPhone}: ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
    return { status: 'sent', id: result.key.id };
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp message to ${cleanPhone}:`, err?.message || err);
    return { status: 'failed', error: err?.message || 'Unknown error' };
  }
}

export async function sendWhatsAppMedia(to, mediaUrl, caption) {
  if (!sock) throw new Error("WhatsApp client not initialized");
  if (!isConnected) throw new Error("WhatsApp not connected");

  // Validate inputs
  if (!to || typeof to !== 'string') {
    throw new Error("Invalid phone number provided");
  }
  if (!mediaUrl || typeof mediaUrl !== 'string') {
    throw new Error("Invalid media URL provided");
  }

  const cleanPhone = to.replace(/[^\d]/g, '');
  if (cleanPhone.length < 10 || cleanPhone.length > 15) {
    throw new Error(`Invalid phone number length: ${cleanPhone.length} digits`);
  }

  // Ensure it's not a group ID
  if (cleanPhone.includes('@g.us') || cleanPhone.includes('@s.whatsapp.net')) {
    throw new Error("Cannot send media to groups or invalid recipients");
  }

  const id = `${cleanPhone}@s.whatsapp.net`;

  // Determine if mediaUrl is a local file or remote URL
  let imagePath = mediaUrl;
  if (mediaUrl.includes('/uploads/')) {
    // Extract filename from URL and use local path
    const filename = mediaUrl.split('/uploads/')[1];
    if (filename) {
      imagePath = path.join(process.cwd(), 'uploads', filename);
    }
  }

  try {
    const result = await sock.sendMessage(id, { image: { url: imagePath }, caption: caption || '' });
    console.log(`✅ WhatsApp media sent to ${cleanPhone}: ${mediaUrl}`);
    return { status: 'sent', id: result.key.id };
  } catch (err) {
    console.error(`❌ Failed to send WhatsApp media to ${cleanPhone}:`, err?.message || err);
    return { status: 'failed', error: err?.message || 'Unknown error' };
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

  // Add error event listener to catch socket errors
  sock.ev.on('error', (err) => {
    console.error('WhatsApp socket error:', err?.message || err);
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
          try {
            const from = msg.key.remoteJid;
            const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
            const hasImage = !!(msg.message && (msg.message.imageMessage || msg.message.documentMessage && (msg.message.documentMessage.mimetype || '').startsWith('image')));

            if (from && (text || hasImage)) {
              try {
                // Extract and format phone number properly
                let phoneNumber = '';
                let isGroup = false;
                let groupName = '';
                let groupLink = '';

                if (from.includes('@g.us')) {
                  // Group message - extract group ID and try to get group info
                  phoneNumber = from.replace('@g.us', '');
                  isGroup = true;

                  try {
                    // Try to get group metadata
                    const groupMetadata = await sock.groupMetadata(from);
                    groupName = groupMetadata.subject || 'Unknown Group';
                    // Note: WhatsApp doesn't provide direct group links via API
                    groupLink = `Group ID: ${phoneNumber}`;
                  } catch (groupErr) {
                    groupName = 'Unknown Group';
                    groupLink = `Group ID: ${phoneNumber}`;
                  }
                } else if (from.includes('@s.whatsapp.net')) {
                  // Individual message - extract phone number
                  phoneNumber = from.replace('@s.whatsapp.net', '');
                } else {
                  phoneNumber = from;
                }

                // Format phone number for display
                const displayPhone = isGroup ?
                  `Group:${phoneNumber.substring(0, 10)}...` :
                  phoneNumber.replace(/(\d{3})(\d{3})(\d{4})/, '+$1-$2-$3');

                const id = `wa_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;

                let mediaUrl = null;
                let imagePath = null;
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
                    console.log(`📸 Inbound media saved to: ${dest}`);
                    const front = (process.env.FRONTEND_URL || `http://localhost:${process.env.PORT || 20291}`).replace(/\/$/, '');
                    mediaUrl = `${front}/uploads/${filename}`;
                    imagePath = dest; // Local path for sending
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

                // Check if this user already has a recent payment confirmation to avoid spam
                let hasRecentConfirmation = false;
                if (userInfo && userInfo.id) {
                  try {
                    const recentConf = await pool.query(
                      'SELECT id FROM payment_confirmations WHERE transaction_id IN (SELECT id FROM transactions WHERE user_id = $1) AND created_at > NOW() - INTERVAL \'1 hour\'',
                      [userInfo.id]
                    );
                    hasRecentConfirmation = recentConf.rows.length > 0;
                  } catch (confErr) {
                    // ignore
                  }
                }

                // Send payment confirmation to admin if it's an image (likely payment proof)
                if (hasImage && !hasRecentConfirmation) {
                  try {
                    const adminPhone = process.env.ADMIN_PHONE || '';
                    if (adminPhone) {
                      const cleanAdminPhone = adminPhone.replace(/[^\d]/g, '');
                      const adminJid = cleanAdminPhone.includes('@s.whatsapp.net') ? cleanAdminPhone : `${cleanAdminPhone}@s.whatsapp.net`;
                      const caption = `💳 Payment Confirmation Received\n👤 From: ${userDisplay}\n📱 Phone: ${displayPhone}\n🔗 Image Link: ${mediaUrl}\n📅 ${new Date().toLocaleString()}`;
                      await sock.sendMessage(adminJid, { image: { url: imagePath }, caption });
                      console.log(`📤 Payment confirmation sent to admin: ${cleanAdminPhone}`);
                    }
                  } catch (adminErr) {
                    console.error('Failed to send payment confirmation to admin:', adminErr?.message || adminErr);
                  }
                }

                // Always log inbound messages to console - NO rate limiting for console logs
                const userDisplay = userInfo ? `${userInfo.full_name || 'Unknown User'} (${userInfo.email || 'no email'})` : (isGroup ? groupName : displayPhone);
                const messageType = hasImage ? '📷 IMAGE' : '💬 TEXT';
                const messageContent = text || (mediaUrl ? `[Image: ${mediaUrl.split('/').pop()}]` : '[Empty message]');
                const confirmationStatus = hasRecentConfirmation ? '⚠️ RECENT CONFIRMATION EXISTS' : '✅ NO RECENT CONFIRMATION';

                console.log(`📨 [${isGroup ? 'GROUP' : 'PRIVATE'}] ${displayPhone}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`);
              } catch (err) {
                console.error('Failed processing inbound WhatsApp message:', err?.message || err);
              }
            }
          } catch (decryptErr) {
            // Handle decryption errors gracefully
            if (decryptErr.message?.includes('Bad MAC') || decryptErr.message?.includes('decrypt message')) {
              decryptionErrorCount++;
              console.warn(`⚠️ WhatsApp decryption error #${decryptionErrorCount} (session may need reset):`, decryptErr.message);

              // If we get too many decryption errors, suggest resetting the session
              if (decryptionErrorCount >= 5) {
                console.error('🚨 Too many decryption errors! Consider resetting WhatsApp session by setting RESET_WHATSAPP=true');
                console.error('This usually happens when the WhatsApp session becomes corrupted.');
                decryptionErrorCount = 0; // Reset counter to avoid spam
              }
            } else {
              console.error('Failed to process WhatsApp message:', decryptErr?.message || decryptErr);
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

