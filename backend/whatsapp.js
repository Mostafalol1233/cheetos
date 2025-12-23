
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

const LOG_DIR = path.join(process.cwd(), "logs");
const LOG_FILE = path.join(LOG_DIR, "whatsapp.log");
if (!fs.existsSync(LOG_DIR)) {
  try { fs.mkdirSync(LOG_DIR, { recursive: true }); } catch {}
}
function writeLog(level, msg) {
  const line = `[${new Date().toISOString()}] [${level}] ${msg}\n`;
  try { fs.appendFileSync(LOG_FILE, line); } catch {}
}

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
    writeLog('error', `Failed to send WhatsApp message: ${err?.message || String(err)}`);
    throw err;
  }
}

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  writeLog('info', `using WA v${version.join('.')}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }),
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
      writeLog('info', 'New QR Code generated');
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      writeLog('warn', `Connection closed. Status code: ${statusCode}, Error: ${lastDisconnect?.error?.message}`);
      
      // Handle Stream Errored (515) specifically
      if (statusCode === 515) {
        writeLog('warn', 'Stream Errored (515). Attempting immediate restart...');
      }

      isConnected = false;
      connectionStatus = "disconnected";
      qrCode = null;

      if (shouldReconnect) {
        writeLog('info', 'Reconnecting...');
        setTimeout(() => startWhatsApp(), statusCode === 515 ? 1000 : 5000);
      } else {
        writeLog('info', 'Logged out. Clear auth folder to restart.');
      }
    } else if (connection === "open") {
      writeLog('info', 'Connection established successfully');
      isConnected = true;
      connectionStatus = "connected";
      qrCode = null;

      // Send welcome message to self (rate-limited)
      try {
        const now = Date.now();
        const botId = sock.user.id.split(':')[0] + "@s.whatsapp.net";
        if (now - lastAdminNotifyAt >= 60 * 60 * 1000) {
          const msg = [
            "🤖 GameCart Bot Connected",
            "",
            "✅ Status: Online",
            `📅 Time: ${new Date(now).toLocaleString()}`,
            `📱 WA Version: ${version.join('.')}`,
            "",
            "What this bot does:",
            "• Monitors WhatsApp inbox and logs new messages",
            "• Records alerts for seller dashboard",
            "• Confirms orders and payment messages",
            "• Auto-reconnects on disconnects",
            "",
            "No action needed. If you see frequent reconnects, we limit status messages to once per hour to avoid noise."
          ].join('\n');
          await sock.sendMessage(botId, { text: msg });
          lastAdminNotifyAt = now;
          writeLog('info', `Status message sent to ${botId}`);
          const adminPhone = process.env.ADMIN_PHONE || '';
          if (adminPhone) {
            try {
              const cleanPhone = adminPhone.replace(/[^\d]/g, '');
              const jid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
              await sock.sendMessage(jid, { text: msg });
              writeLog('info', `Admin notified at ${jid}`);
            } catch (e) {
              writeLog('warn', `Failed to notify admin: ${e.message}`);
            }
          }
        } else {
          writeLog('info', 'Skipping status message (rate-limited)');
        }
      } catch (err) {
        writeLog('error', `Failed to send welcome message: ${err.message}`);
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
          writeLog('info', `replying to ${msg.key.remoteJid}`);
          const from = msg.key.remoteJid;
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          
          if (from && text) {
             try {
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
             } catch (err) {
                writeLog('error', `Failed to log WA message: ${err?.message || String(err)}`);
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
      writeLog('info', `Status: ${connectionStatus}, Connected: ${isConnected}`);
      if (isConnected && sock.ws?.readyState !== 1) {
         writeLog('warn', 'Socket state inconsistent. Reconnecting...');
         startWhatsApp();
      }
    } else {
      writeLog('info', 'Client not initialized.');
    }
  }, 10 * 60 * 1000);
}
