
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

  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: "info" }),
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
      console.log("[WhatsApp] New QR Code generated - Scan with WhatsApp App");
      qrcode.generate(qr, { small: true });
    }

    if (connection === "close") {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;
      
      console.log(`[WhatsApp] Connection closed. Status code: ${statusCode}, Error: ${lastDisconnect?.error?.message}`);
      
      // Handle Stream Errored (515) specifically
      if (statusCode === 515) {
        console.log("[WhatsApp] Stream Errored (515). Attempting immediate restart...");
      }

      isConnected = false;
      connectionStatus = "disconnected";
      qrCode = null;

      if (shouldReconnect) {
        console.log("[WhatsApp] Reconnecting...");
        setTimeout(() => startWhatsApp(), statusCode === 515 ? 1000 : 5000); // Fast reconnect for 515
      } else {
        console.log("[WhatsApp] Logged out. Clear auth folder to restart.");
      }
    } else if (connection === "open") {
      console.log("[WhatsApp] Connection established successfully!");
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
          console.log(`[WhatsApp] Status message sent to ${botId}`);
          const adminPhone = process.env.ADMIN_PHONE || '';
          if (adminPhone) {
            try {
              const cleanPhone = adminPhone.replace(/[^\d]/g, '');
              const jid = cleanPhone.includes('@s.whatsapp.net') ? cleanPhone : `${cleanPhone}@s.whatsapp.net`;
              await sock.sendMessage(jid, { text: msg });
              console.log(`[WhatsApp] Admin notified at ${jid}`);
            } catch (e) {
              console.warn('[WhatsApp] Failed to notify admin:', e.message);
            }
          }
        } else {
          console.log('[WhatsApp] Skipping status message (rate-limited)');
        }
      } catch (err) {
        console.error("[WhatsApp] Failed to send welcome message:", err.message);
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
          console.log("replying to", msg.key.remoteJid);
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
                 console.error("Failed to log WA message:", err);
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
      console.log(`[WhatsApp Monitor] Status: ${connectionStatus}, Connected: ${isConnected}`);
      // If we think we are connected but the socket is closed, trigger reconnect
      if (isConnected && sock.ws?.readyState !== 1) { // 1 = OPEN
         console.warn("[WhatsApp Monitor] Socket state inconsistent. Reconnecting...");
         startWhatsApp();
      }
    } else {
      console.log("[WhatsApp Monitor] Client not initialized.");
    }
  }, 10 * 60 * 1000); // Check every 10 minutes
}

