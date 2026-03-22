
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

// Helper function to get all admin phone numbers
export function getAdminPhones() {
  const adminPhoneStr = process.env.ADMIN_PHONE || '';
  if (!adminPhoneStr.trim()) return [];

  return adminPhoneStr.split(',')
    .map(phone => phone.trim())
    .filter(phone => phone.length > 0)
    .map(phone => {
      // Ensure phone starts with +
      return phone.startsWith('+') ? phone : `+${phone}`;
    });
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

export async function startWhatsApp(retryCount = 0) {
  const maxRetries = 3;
  
  try {
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
    // Add longer timeouts to prevent timeout errors
    qrTimeout: 60000,
    defaultQueryTimeoutMs: 60000,
    // Add retry configuration
    maxRetries: 3,
    retryRequestDelayMs: 1000,
    // Add keep-alive settings
    keepAliveIntervalMs: 30000,
    // Add browser settings to avoid detection
    browser: ['GameCart Bot', 'Chrome', '1.0.0'],
  });

  // Add error event listener to catch socket errors
  sock.ev.on('error', (err) => {
    console.error('WhatsApp socket error:', err?.message || err);
    // If it's a decryption error, don't crash - just log and continue
    if (err?.message?.includes('Bad MAC') || err?.message?.includes('decrypt')) {
      console.warn('⚠️ WhatsApp decryption error detected - session may need reset');
    }
    // Handle timeout errors specifically
    if (err?.message?.includes('Timed Out') || err?.output?.statusCode === 408) {
      console.warn('⚠️ WhatsApp timeout error - this is usually temporary');
    }
  });

  // Add connection event listener to handle timeouts better
  sock.ev.on('connection.update', async (update) => {
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

      // Log the disconnect reason
      if (statusCode === 408) {
        console.log('📡 WhatsApp disconnected due to timeout - will reconnect automatically');
      } else if (statusCode === 515) {
        console.log('🔄 WhatsApp disconnected due to restart - quick reconnect');
      } else if (!shouldReconnect) {
        console.log('🚫 WhatsApp logged out - manual reconnection required');
      }

      if (shouldReconnect) {
        const delay = statusCode === 515 ? 1000 : statusCode === 408 ? 5000 : 5000;
        console.log(`⏰ Reconnecting in ${delay/1000} seconds...`);
        setTimeout(() => startWhatsApp(), delay);
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
          const adminPhones = getAdminPhones();
          if (adminPhones.length > 0) {
            const msg = `🤖 GameCart Bot Connected\n✅ Status: Online\n📱 Number: ${botNumber}\n📅 ${new Date(now).toLocaleString()}`;
            for (const adminPhone of adminPhones) {
              try {
                const cleanPhone = adminPhone.replace(/[^\d]/g, '');
                const jid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
                await sock.sendMessage(jid, { text: msg });
              } catch (e) {
                console.error(`Failed to send welcome message to ${adminPhone}:`, e?.message || e);
              }
            }
            lastAdminNotifyAt = now;
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
    try {
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

                // Always log inbound messages to console - NO rate limiting for console logs
                const userDisplay = userInfo ? `${userInfo.full_name || 'Unknown User'} (${userInfo.email || 'no email'})` : (isGroup ? groupName : displayPhone);
                const messageType = hasImage ? '📷 IMAGE' : '💬 TEXT';
                const messageContent = text || (mediaUrl ? `[Image: ${mediaUrl.split('/').pop()}]` : '[Empty message]');
                const confirmationStatus = hasRecentConfirmation ? '⚠️ RECENT CONFIRMATION EXISTS' : '✅ NO RECENT CONFIRMATION';

                // Send payment confirmation to admin if it's an image (likely payment proof)
                if (hasImage && !hasRecentConfirmation) {
                  try {
                    const adminPhones = getAdminPhones();
                    if (adminPhones.length > 0) {
                      const caption = `💳 Payment Confirmation Received\n👤 From: ${userDisplay}\n📱 Phone: ${displayPhone}\n🔗 Image Link: ${mediaUrl}\n📅 ${new Date().toLocaleString()}`;
                      for (const adminPhone of adminPhones) {
                        try {
                          const cleanAdminPhone = adminPhone.replace(/[^\d]/g, '');
                          const adminJid = cleanAdminPhone.includes('@s.whatsapp.net') ? cleanAdminPhone : `${cleanAdminPhone}@s.whatsapp.net`;
                          await sock.sendMessage(adminJid, { image: { url: mediaUrl }, caption });
                          console.log(`📤 Payment confirmation sent to admin: ${cleanAdminPhone}`);
                        } catch (adminErr) {
                          console.error(`Failed to send payment confirmation to ${adminPhone}:`, adminErr?.message || adminErr);
                        }
                      }
                    }
                  } catch (adminErr) {
                    console.error('Failed to send payment confirmation to admin:', adminErr?.message || adminErr);
                  }
                }

                console.log(`📨 [${isGroup ? 'GROUP' : 'PRIVATE'}] ${displayPhone}: ${messageContent.substring(0, 100)}${messageContent.length > 100 ? '...' : ''}`);
              } catch (err) {
                console.error('Failed processing inbound WhatsApp message:', err?.message || err);
              }
            }
          } catch (decryptErr) {
            // Handle decryption errors gracefully - only log once per minute to avoid spam
            if (decryptErr.message?.includes('Bad MAC') || decryptErr.message?.includes('decrypt message')) {
              decryptionErrorCount++;
              
              // Only log every 10th error or if it's the first few to avoid log spam
              if (decryptionErrorCount <= 3 || decryptionErrorCount % 10 === 0) {
                console.warn(`⚠️ WhatsApp decryption error #${decryptionErrorCount} (session may need reset):`, decryptErr.message);
              }

              // If we get too many decryption errors, automatically reset the session
              if (decryptionErrorCount >= 3) {
                console.error('🚨 Too many decryption errors! Automatically resetting WhatsApp session...');
                try {
                  // Clear the auth folder to reset session
                  if (fs.existsSync(AUTH_FOLDER)) {
                    fs.rmSync(AUTH_FOLDER, { recursive: true, force: true });
                    console.log('✅ WhatsApp session cleared successfully');
                  }
                  // Reset connection state
                  isConnected = false;
                  connectionStatus = "disconnected";
                  qrCode = null;
                  sock = null;
                  decryptionErrorCount = 0;

                  // Restart WhatsApp after a short delay
                  setTimeout(() => {
                    console.log('🔄 Restarting WhatsApp connection...');
                    startWhatsApp().catch(err => console.error('Failed to restart WhatsApp:', err));
                  }, 2000);
                } catch (resetErr) {
                  console.error('❌ Failed to reset WhatsApp session:', resetErr.message);
                  decryptionErrorCount = 0; // Reset counter even if reset failed
                }
              }
            } else {
              console.error('Failed to process WhatsApp message:', decryptErr?.message || decryptErr);
            }
          }
        }
      }
    }
    } catch (outerErr) {
      console.error('🚨 Critical error in WhatsApp message handler:', outerErr?.message || outerErr);
      // Don't let message processing errors crash the entire handler
    }
  });
  } catch (error) {
    console.error(`❌ WhatsApp connection failed (attempt ${retryCount + 1}/${maxRetries}):`, error?.message || error);
    
    if (retryCount < maxRetries - 1) {
      const delay = Math.min(30000, 5000 * Math.pow(2, retryCount)); // Exponential backoff: 5s, 10s, 20s
      console.log(`⏰ Retrying WhatsApp connection in ${delay/1000} seconds...`);
      setTimeout(() => startWhatsApp(retryCount + 1), delay);
    } else {
      console.error('🚨 Max WhatsApp connection retries reached. Will retry automatically later.');
      // Reset connection state
      isConnected = false;
      connectionStatus = "disconnected";
      qrCode = null;
      sock = null;
      
      // Try again in 5 minutes
      setTimeout(() => startWhatsApp(0), 5 * 60 * 1000);
    }
  }
}

function startConnectionMonitor() {
  setInterval(() => {
    if (sock && isConnected) {
      // Only check if we're supposed to be connected but socket is actually closed
      // This prevents unnecessary reconnections during temporary network issues
      if (sock.ws?.readyState !== 1) { // 1 = OPEN
        console.log('🔄 Connection monitor detected closed socket, attempting reconnect...');
        startWhatsApp().catch(err => console.error('Failed to reconnect:', err));
      }
    }
  }, 30 * 60 * 1000); // Check every 30 minutes instead of 10
}

