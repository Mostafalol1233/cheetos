import { pool } from "./db";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.FRONTEND_URL || "https://diaasadek.com";

function getAllowedIds(): string[] {
  const ids: string[] = [];
  if (process.env.TELEGRAM_CHAT_ID) ids.push(String(process.env.TELEGRAM_CHAT_ID));
  if (process.env.TELEGRAM_SELLER_CHAT_ID) ids.push(String(process.env.TELEGRAM_SELLER_CHAT_ID));
  return ids;
}

function isAuthorized(chatId: string | number): boolean {
  return getAllowedIds().includes(String(chatId));
}

async function tg(method: string, body: object): Promise<any> {
  if (!TOKEN) return null;
  try {
    const res = await fetch(`https://api.telegram.org/bot${TOKEN}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Telegram] ${method} error:`, err);
    return null;
  }
}

async function sendMsg(chatId: string, text: string, keyboard?: any[][]): Promise<any> {
  const body: any = { chat_id: chatId, text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  return tg("sendMessage", body);
}

async function sendPhoto(chatId: string, photoUrl: string, caption: string): Promise<void> {
  await tg("sendPhoto", { chat_id: chatId, photo: photoUrl, caption });
}

async function editMsg(chatId: string, messageId: number, text: string): Promise<void> {
  await tg("editMessageText", { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" });
}

async function answerCbq(id: string, text: string): Promise<void> {
  await tg("answerCallbackQuery", { callback_query_id: id, text, show_alert: false });
}

async function broadcast(text: string, keyboard?: any[][]): Promise<void> {
  await Promise.all(getAllowedIds().map(id => sendMsg(id, text, keyboard)));
}

function cairoDate(ts: number | string | Date): string {
  return new Date(ts).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function buildOrderText(o: any, items: any[]): string {
  const itemLines = items.map((i: any) =>
    `  • ${i.name || "Item"} x${i.quantity || 1} — ${i.price || "?"} EGP`
  ).join("\n");
  const receipt = o.receipt_url
    ? `<a href="${SITE_URL}${o.receipt_url.startsWith("/") ? o.receipt_url : "/" + o.receipt_url}">View Receipt</a>`
    : "Not uploaded";

  return `🛒 <b>NEW ORDER</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>ID:</b> <code>${o.id}</code>
📅 <b>Date:</b> ${cairoDate(o.created_at)}
👤 <b>Name:</b> ${o.customer_name || "Guest"}
📧 <b>Email:</b> ${o.customer_email || "—"}
📞 <b>Phone:</b> ${o.customer_phone || "—"}
🎮 <b>Player ID:</b> ${o.player_id || "—"}

📦 <b>Items:</b>
${itemLines}

💰 <b>Total:</b> ${o.total_amount} EGP
💳 <b>Payment:</b> ${o.payment_method}
🧾 <b>Receipt:</b> ${receipt}`.trim();
}

function orderButtons(orderId: string): any[][] {
  return [[
    { text: "✅ Complete", callback_data: `status:${orderId}:completed` },
    { text: "⚙️ Processing", callback_data: `status:${orderId}:processing` },
    { text: "❌ Cancel", callback_data: `status:${orderId}:cancelled` },
  ]];
}

// ─── Public Notification Functions ─────────────────────────────────────────

export async function notifyNewOrder(order: {
  id: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  items: any[];
  total_amount?: string | number;
  payment_method: string;
  player_id?: string;
  receipt_url?: string;
  created_at: number | string;
}): Promise<void> {
  const text = buildOrderText(order, order.items);
  const buttons = orderButtons(order.id);
  await Promise.all(getAllowedIds().map(id => sendMsg(id, text, buttons)));

  if (order.receipt_url) {
    const fullUrl = order.receipt_url.startsWith("http")
      ? order.receipt_url
      : `${SITE_URL}${order.receipt_url.startsWith("/") ? order.receipt_url : "/" + order.receipt_url}`;
    await Promise.all(getAllowedIds().map(id =>
      sendPhoto(id, fullUrl, `🧾 Receipt for order ${order.id}`)
    ));
  }
}

export async function notifyOrderStatusChange(order: {
  id: string;
  status: string;
  customer_name?: string;
  customer_email?: string;
}): Promise<void> {
  const emojis: Record<string, string> = {
    pending: "⏳", processing: "⚙️", completed: "✅", cancelled: "❌", refunded: "💸",
  };
  const e = emojis[order.status] || "📋";
  await broadcast(`${e} <b>ORDER UPDATED</b>\n🆔 <code>${order.id}</code>\n👤 ${order.customer_name || order.customer_email || "Guest"}\n📊 Status: <b>${order.status.toUpperCase()}</b>`);
}

export async function notifyNewCustomer(customer: {
  name?: string;
  email: string;
  createdAt: number;
}): Promise<void> {
  await broadcast(`👤 <b>NEW CUSTOMER REGISTERED</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>Name:</b> ${customer.name || "—"}
📧 <b>Email:</b> ${customer.email}
📅 <b>Date:</b> ${cairoDate(customer.createdAt)}`);
}

export async function sendTelegramMessage(text: string, chatId?: string): Promise<void> {
  if (chatId) {
    await sendMsg(chatId, text);
  } else {
    await broadcast(text);
  }
}

// ─── Command Handlers ───────────────────────────────────────────────────────

async function cmdOrders(chatId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, customer_name, customer_email, total_amount, status, created_at
     FROM orders ORDER BY created_at DESC LIMIT 10`
  );
  if (!rows.length) { await sendMsg(chatId, "📦 No orders yet."); return; }
  const lines = rows.map((o: any) =>
    `• <code>${o.id.slice(-16)}</code>\n  ${o.customer_name || o.customer_email || "Guest"} | ${o.total_amount} EGP | <b>${o.status}</b> | ${cairoDate(o.created_at)}`
  ).join("\n\n");
  await sendMsg(chatId, `📦 <b>Last 10 Orders</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}`);
}

async function cmdPending(chatId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, customer_name, customer_email, total_amount, created_at FROM orders WHERE status IN ('pending','pending_approval') ORDER BY created_at DESC LIMIT 15`
  );
  if (!rows.length) { await sendMsg(chatId, "✅ No pending orders!"); return; }
  const lines = rows.map((o: any) =>
    `• <code>${o.id.slice(-16)}</code>\n  ${o.customer_name || o.customer_email || "Guest"} | ${o.total_amount} EGP | ${cairoDate(o.created_at)}`
  ).join("\n\n");
  await sendMsg(chatId, `⏳ <b>Pending Orders (${rows.length})</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}`);
}

async function cmdStats(chatId: string): Promise<void> {
  const todayTs = new Date().setHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN created_at::bigint >= $1 OR created_at >= $2 THEN 1 END) as today,
      COALESCE(SUM(CASE WHEN (created_at::bigint >= $1 OR created_at >= $2) THEN total_amount::numeric END),0) as today_rev,
      COALESCE(SUM(total_amount::numeric),0) as total_rev,
      COUNT(CASE WHEN status='pending' OR status='pending_approval' THEN 1 END) as pending,
      COUNT(CASE WHEN status='completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status='cancelled' THEN 1 END) as cancelled
     FROM orders`,
    [todayTs, new Date(todayTs).toISOString()]
  );
  const r = rows[0];
  await sendMsg(chatId, `📊 <b>Store Stats</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>Today</b>
  📦 Orders: <b>${r.today}</b>
  💰 Revenue: <b>${parseFloat(r.today_rev).toFixed(2)} EGP</b>

📋 <b>All Time</b>
  📦 Total Orders: <b>${r.total}</b>
  💰 Total Revenue: <b>${parseFloat(r.total_rev).toFixed(2)} EGP</b>
  ⏳ Pending: ${r.pending}
  ✅ Completed: ${r.completed}
  ❌ Cancelled: ${r.cancelled}`);
}

async function cmdSearch(chatId: string, query: string): Promise<void> {
  if (!query) { await sendMsg(chatId, "Usage: /search ORDER_ID"); return; }
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE id ILIKE $1 OR customer_email ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
    [`%${query}%`]
  );
  if (!rows.length) { await sendMsg(chatId, `❌ Order not found: <code>${query}</code>`); return; }
  const o = rows[0];
  let items = [];
  try { items = JSON.parse(o.items || "[]"); } catch {}
  const text = buildOrderText(o, items);
  await sendMsg(chatId, text, orderButtons(o.id));
}

async function handleCommand(chatId: string, text: string): Promise<void> {
  const [cmd, ...args] = text.trim().split(/\s+/);
  const arg = args.join(" ");

  if (cmd === "/start" || cmd === "/myid") {
    await sendMsg(chatId, `🔑 Your Chat ID: <code>${chatId}</code>\nShare with admin to get access.`);
    if (!isAuthorized(chatId)) return;
  }

  if (!isAuthorized(chatId)) {
    await sendMsg(chatId, "⛔ You are not authorized to use this bot.");
    return;
  }

  if (cmd === "/orders") await cmdOrders(chatId);
  else if (cmd === "/pending") await cmdPending(chatId);
  else if (cmd === "/stats") await cmdStats(chatId);
  else if (cmd === "/search") await cmdSearch(chatId, arg);
  else if (cmd === "/help") {
    await sendMsg(chatId, `🤖 <b>Bot Commands</b>
━━━━━━━━━━━━━━━━━━━━
/orders — Last 10 orders
/pending — All pending orders
/stats — Revenue & order counts
/search ID — Look up any order
/myid — Your Telegram chat ID
/help — Show this menu`);
  }
}

async function handleCallback(cbq: any): Promise<void> {
  const chatId = String(cbq.message?.chat?.id);
  const msgId = cbq.message?.message_id;
  const data: string = cbq.data || "";

  if (!isAuthorized(chatId)) { await answerCbq(cbq.id, "⛔ Not authorized"); return; }

  if (data.startsWith("status:")) {
    const [, orderId, newStatus] = data.split(":");
    try {
      await pool.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, orderId]);
      const emojis: Record<string, string> = { completed: "✅", processing: "⚙️", cancelled: "❌" };
      const e = emojis[newStatus] || "📋";
      await answerCbq(cbq.id, `${e} Marked as ${newStatus}`);
      const original = cbq.message?.text || "";
      await editMsg(chatId, msgId, `${original}\n\n${e} <b>Updated to: ${newStatus.toUpperCase()}</b>`);
      const others = getAllowedIds().filter(id => id !== chatId);
      await Promise.all(others.map(id =>
        sendMsg(id, `${e} Order <code>${orderId}</code> marked as <b>${newStatus}</b> by admin`)
      ));
    } catch (err) {
      await answerCbq(cbq.id, "❌ Update failed");
      console.error("[Telegram] Callback update error:", err);
    }
  }
}

// ─── Daily Summary ──────────────────────────────────────────────────────────

async function sendDailySummary(): Promise<void> {
  try {
    const y = new Date();
    y.setDate(y.getDate() - 1);
    y.setHours(0, 0, 0, 0);
    const yEnd = new Date(y); yEnd.setHours(23, 59, 59, 999);
    const { rows } = await pool.query(
      `SELECT COUNT(*) as total,
        COALESCE(SUM(total_amount::numeric),0) as revenue,
        COUNT(CASE WHEN status='completed' THEN 1 END) as done,
        COUNT(CASE WHEN status='pending' OR status='pending_approval' THEN 1 END) as pend,
        COUNT(CASE WHEN status='cancelled' THEN 1 END) as cancel
       FROM orders WHERE created_at >= $1 AND created_at <= $2`,
      [y.toISOString(), yEnd.toISOString()]
    );
    const r = rows[0];
    await broadcast(`🌅 <b>Good Morning! Daily Summary</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>${y.toLocaleDateString("ar-EG")}</b>

📦 Orders: <b>${r.total}</b>
💰 Revenue: <b>${parseFloat(r.revenue).toFixed(2)} EGP</b>
✅ Completed: ${r.done}
⏳ Pending: ${r.pend}
❌ Cancelled: ${r.cancel}
━━━━━━━━━━━━━━━━━━━━
Have a great day! 🎮`);
  } catch (err) { console.error("[Telegram] Daily summary error:", err); }
}

function scheduleDailySummary(): void {
  const now = new Date();
  const next = new Date();
  next.setUTCHours(5, 0, 0, 0); // 8 AM Cairo = 5 AM UTC
  if (next <= now) next.setDate(next.getDate() + 1);
  setTimeout(() => {
    sendDailySummary();
    setInterval(sendDailySummary, 24 * 60 * 60 * 1000);
  }, next.getTime() - now.getTime());
  console.log(`[Telegram] Daily summary scheduled for ${next.toUTCString()}`);
}

// ─── Low Activity Alert ─────────────────────────────────────────────────────

let lastOrderTime = Date.now();
let lastAlertSent = 0;

export function updateLastOrderTime(): void {
  lastOrderTime = Date.now();
}

async function checkLowActivity(): Promise<void> {
  const now = Date.now();
  const hour = new Date().getUTCHours() + 3; // Cairo UTC+3
  if (hour < 10 || hour > 23) return;
  const sixHours = 6 * 60 * 60 * 1000;
  if (now - lastOrderTime > sixHours && now - lastAlertSent > sixHours) {
    lastAlertSent = now;
    const hrs = Math.round((now - lastOrderTime) / 3600000);
    await broadcast(`⚠️ <b>Low Activity Alert</b>\nNo new orders in the last <b>${hrs} hours</b>.\nConsider checking your store or running a promotion! 🎯`);
  }
}

// ─── Polling ────────────────────────────────────────────────────────────────

let lastUpdateId = 0;
let pollingActive = false;

async function poll(): Promise<void> {
  try {
    const data = await tg("getUpdates", {
      offset: lastUpdateId + 1,
      timeout: 20,
      allowed_updates: ["message", "callback_query"],
    });
    if (data?.result?.length) {
      for (const update of data.result) {
        lastUpdateId = update.update_id;
        if (update.message?.text) {
          await handleCommand(String(update.message.chat.id), update.message.text).catch(console.error);
        }
        if (update.callback_query) {
          await handleCallback(update.callback_query).catch(console.error);
        }
      }
    }
  } catch { /* retry silently */ }
  if (pollingActive) setTimeout(poll, 2000);
}

export function startBotPolling(): void {
  if (pollingActive || !TOKEN) {
    if (!TOKEN) console.warn("[Telegram] No bot token — polling skipped");
    return;
  }
  pollingActive = true;
  console.log("[Telegram] Bot polling started ✓");
  scheduleDailySummary();
  setInterval(checkLowActivity, 30 * 60 * 1000);
  poll();
}
