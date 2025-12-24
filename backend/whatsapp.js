
import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion
} from "@whiskeysockets/baileys";
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

export async function startWhatsApp() {
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
          
          if (from && text) {
             try {
                 const phoneNumber = from.replace('@s.whatsapp.net', '');
                 const id = `wa_${Date.now()}_${Math.random().toString(36).slice(2,9)}`;
                 await storage.createWhatsAppMessage({
                   id,
                   waMessageId: msg.key.id || null,
                   direction: 'inbound',
                   fromPhone: from,
                   toPhone: null,
                   message: text,
                   timestamp: Date.now(),
                   status: 'received'
                 });
                 
                 await storage.createSellerAlert({
                   id: `alert_${Date.now()}`,
                   type: 'whatsapp_message',
                   summary: `New WhatsApp from ${from}: ${text.slice(0, 50)}`,
                   read: false,
                   flagged: false,
                   createdAt: Date.now()
                 });
                 
                 // Only log user messages (not system messages)
                 console.log(`📱 User message from ${phoneNumber}: ${text.substring(0, 60)}${text.length > 60 ? '...' : ''}`);
             } catch (err) {
                 // Silent fail
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

