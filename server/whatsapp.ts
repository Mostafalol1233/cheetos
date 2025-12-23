import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  type WASocket,
  type ConnectionState,
  type Contact
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import pino from "pino";
import fs from "fs";
import path from "path";
import { storage } from "./storage";

// Store connection state
let sock: WASocket | null = null;
let qrCode: string | null = null;
let isConnected = false;
let connectionStatus = "disconnected";

// Path to store auth credentials
const AUTH_FOLDER = path.join(process.cwd(), "baileys_auth_info");

if (!fs.existsSync(AUTH_FOLDER)) {
  fs.mkdirSync(AUTH_FOLDER, { recursive: true });
}

export const getQRCode = () => qrCode;
export const getConnectionStatus = () => ({ connected: isConnected, status: connectionStatus });

export async function startWhatsApp() {
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_FOLDER);
  const { version, isLatest } = await fetchLatestBaileysVersion();

  console.log(`using WA v${version.join(".")}, isLatest: ${isLatest}`);

  sock = makeWASocket({
    version,
    logger: pino({ level: "silent" }) as any,
    printQRInTerminal: true, // We also capture it for frontend
    auth: state,
    generateHighQualityLinkPreview: true,
  });

  sock.ev.on("connection.update", async (update: Partial<ConnectionState>) => {
    const { connection, lastDisconnect, qr } = update;

    if (qr) {
      qrCode = qr;
      connectionStatus = "scan_qr";
      console.log("New QR Code generated");
    }

    if (connection === "close") {
      const shouldReconnect = (lastDisconnect?.error as Boom)?.output?.statusCode !== DisconnectReason.loggedOut;
      console.log("connection closed due to ", lastDisconnect?.error, ", reconnecting ", shouldReconnect);
      isConnected = false;
      connectionStatus = "disconnected";
      qrCode = null;
      if (shouldReconnect) {
        startWhatsApp();
      } else {
        // Handle logout - maybe clear auth folder?
        console.log("Logged out. Clear auth folder to restart.");
      }
    } else if (connection === "open") {
      console.log("opened connection");
      isConnected = true;
      connectionStatus = "connected";
      qrCode = null;
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type === "notify") {
      for (const msg of messages) {
        if (!msg.key.fromMe) {
          console.log("replying to", msg.key.remoteJid);
          // Here you can handle incoming messages, e.g., store in DB
          // For now, we just log it.
          const from = msg.key.remoteJid;
          const text = msg.message?.conversation || msg.message?.extendedTextMessage?.text;
          
          if (from && text) {
             // Store in DB for admin to see
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
                 
                 // Also create an alert
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

export async function sendWhatsAppMessage(to: string, text: string) {
  if (!sock || !isConnected) {
    throw new Error("WhatsApp not connected");
  }

  // Format phone number: remove + and ensure suffix
  let id = to.replace(/[^0-9]/g, "");
  if (!id.endsWith("@s.whatsapp.net")) {
    id += "@s.whatsapp.net";
  }

  const sentMsg = await sock.sendMessage(id, { text });
  return sentMsg;
}

// Start immediately unless disabled via env
if (process.env.ENABLE_WHATSAPP !== 'false') {
  startWhatsApp().catch(err => console.error("Failed to start WhatsApp:", err));
}
