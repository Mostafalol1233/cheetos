import { pool } from "./db";
import { sendOrderCodeEmail } from "./email";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const SITE_URL = process.env.FRONTEND_URL || "https://diaasadek.com";

// ─── Authorization (max 2 accounts) ─────────────────────────────────────────

function getAllowedIds(): string[] {
  const ids: string[] = [];
  if (process.env.TELEGRAM_CHAT_ID) ids.push(String(process.env.TELEGRAM_CHAT_ID));
  if (process.env.TELEGRAM_SELLER_CHAT_ID) ids.push(String(process.env.TELEGRAM_SELLER_CHAT_ID));
  return ids;
}

function isAuthorized(chatId: string | number): boolean {
  return getAllowedIds().includes(String(chatId));
}

// ─── Pending Approval State ──────────────────────────────────────────────────
// Tracks when an admin clicked "اعتماد" and chose a code type.
// Key = chatId, Value = { orderId, codeType, customerEmail, customerName }

interface PendingApproval {
  orderId: string;
  codeType: "text" | "image";
  customerEmail: string;
  customerName: string;
}

const pendingApprovals = new Map<string, PendingApproval>();

// ─── Telegram API Helpers ────────────────────────────────────────────────────

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
  await tg("sendPhoto", { chat_id: chatId, photo: photoUrl, caption, parse_mode: "HTML" });
}

async function editMsg(chatId: string, messageId: number, text: string, keyboard?: any[][]): Promise<void> {
  const body: any = { chat_id: chatId, message_id: messageId, text, parse_mode: "HTML" };
  if (keyboard) body.reply_markup = { inline_keyboard: keyboard };
  await tg("editMessageText", body);
}

async function answerCbq(id: string, text: string, showAlert = false): Promise<void> {
  await tg("answerCallbackQuery", { callback_query_id: id, text, show_alert: showAlert });
}

async function broadcast(text: string, keyboard?: any[][]): Promise<void> {
  await Promise.all(getAllowedIds().map(id => sendMsg(id, text, keyboard)));
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function cairoDate(ts: number | string | Date): string {
  return new Date(ts).toLocaleString("ar-EG", { timeZone: "Africa/Cairo" });
}

function whatsappLink(phone: string): string {
  const cleaned = phone.replace(/\D/g, "");
  const normalized = cleaned.startsWith("0") ? `2${cleaned}` : cleaned.startsWith("2") ? cleaned : `2${cleaned}`;
  return `https://wa.me/${normalized}`;
}

function buildOrderText(o: any, items: any[]): string {
  const itemLines = items.map((i: any) =>
    `  • <b>${i.name || "منتج"}</b> x${i.quantity || 1} — ${i.price || "?"} ج.م`
  ).join("\n");

  const receipt = o.receipt_url
    ? `<a href="${SITE_URL}${o.receipt_url.startsWith("/") ? o.receipt_url : "/" + o.receipt_url}">عرض الإيصال 🧾</a>`
    : "لم يتم الرفع";

  const phone = o.customer_phone || "—";
  const whatsapp = o.customer_phone
    ? `\n📲 <a href="${whatsappLink(o.customer_phone)}">فتح واتساب مباشرة</a>`
    : "";

  return `🛒 <b>طلب جديد</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>رقم الطلب:</b> <code>${o.id}</code>
📅 <b>التاريخ:</b> ${cairoDate(o.created_at)}
👤 <b>الاسم:</b> ${o.customer_name || "زائر"}
📧 <b>الإيميل:</b> <code>${o.customer_email || "—"}</code>
📞 <b>الهاتف:</b> <code>${phone}</code>${whatsapp}
🎮 <b>آيدي اللاعب:</b> <code>${o.player_id || "—"}</code>

📦 <b>المنتجات:</b>
${itemLines}

💰 <b>الإجمالي:</b> <b>${o.total_amount} ج.م</b>
💳 <b>طريقة الدفع:</b> ${o.payment_method}
🧾 <b>الإيصال:</b> ${receipt}`.trim();
}

function orderButtons(orderId: string): any[][] {
  return [
    [
      { text: "✅ اعتماد وإرسال كود", callback_data: `approve:${orderId}` },
    ],
    [
      { text: "⚙️ جاري التنفيذ", callback_data: `status:${orderId}:processing` },
      { text: "❌ إلغاء", callback_data: `status:${orderId}:cancelled` },
    ],
  ];
}

// ─── Public Notification Functions ──────────────────────────────────────────

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
      sendPhoto(id, fullUrl, `🧾 إيصال الطلب ${order.id}`)
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
  const statusNames: Record<string, string> = {
    pending: "قيد الانتظار", processing: "جاري التنفيذ", completed: "مكتمل", cancelled: "ملغي", refunded: "مسترجع",
  };
  const s = statusNames[order.status] || order.status.toUpperCase();
  await broadcast(`${e} <b>تحديث الطلب</b>\n🆔 <code>${order.id}</code>\n👤 ${order.customer_name || order.customer_email || "زائر"}\n📊 الحالة: <b>${s}</b>`);
}

export async function notifyNewCustomer(customer: {
  name?: string;
  email: string;
  createdAt: number;
}): Promise<void> {
  await broadcast(`👤 <b>تسجيل عميل جديد</b>
━━━━━━━━━━━━━━━━━━━━
👤 <b>الاسم:</b> ${customer.name || "—"}
📧 <b>الإيميل:</b> ${customer.email}
📅 <b>التاريخ:</b> ${cairoDate(customer.createdAt)}`);
}

export async function sendTelegramMessage(text: string, chatId?: string): Promise<void> {
  if (chatId) {
    await sendMsg(chatId, text);
  } else {
    await broadcast(text);
  }
}

// ─── Command Handlers ────────────────────────────────────────────────────────

async function cmdOrders(chatId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, customer_name, customer_email, customer_phone, total_amount, status, created_at
     FROM orders ORDER BY created_at DESC LIMIT 10`
  );
  if (!rows.length) { await sendMsg(chatId, "📦 لا يوجد طلبات حالياً."); return; }

  const statusEmoji: Record<string, string> = {
    pending: "⏳", processing: "⚙️", completed: "✅",
    cancelled: "❌", pending_approval: "⏳", refunded: "💸",
  };
  const statusLabel: Record<string, string> = {
    pending: "انتظار", processing: "جاري", completed: "مكتمل",
    cancelled: "ملغي", pending_approval: "انتظار", refunded: "مسترجع",
  };

  const lines = rows.map((o: any, i: number) => {
    const e = statusEmoji[o.status] || "📋";
    const s = statusLabel[o.status] || o.status;
    const name = (o.customer_name || o.customer_email || "زائر").slice(0, 16);
    return `${i + 1}. ${e} <code>${o.id.slice(0, 8)}</code> — ${name}\n    💰 ${o.total_amount} ج.م | ${s}`;
  }).join("\n\n");

  // Two buttons per row for compact layout
  const keyboard: any[][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const row: any[] = [
      { text: `${i + 1}. ${(rows[i].customer_name || rows[i].customer_email || "زائر").slice(0, 14)}`, callback_data: `details:${rows[i].id}` }
    ];
    if (rows[i + 1]) {
      row.push({ text: `${i + 2}. ${(rows[i + 1].customer_name || rows[i + 1].customer_email || "زائر").slice(0, 14)}`, callback_data: `details:${rows[i + 1].id}` });
    }
    keyboard.push(row);
  }

  await sendMsg(chatId,
    `📦 <b>آخر 10 طلبات</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━━━\n👇 اضغط على اسم العميل لعرض تفاصيل طلبه كاملاً`,
    keyboard
  );
}

async function cmdPending(chatId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT id, customer_name, customer_email, customer_phone, total_amount, created_at
     FROM orders WHERE status IN ('pending','pending_approval') ORDER BY created_at DESC LIMIT 15`
  );
  if (!rows.length) { await sendMsg(chatId, "✅ لا يوجد طلبات معلقة!"); return; }

  const lines = rows.map((o: any, i: number) => {
    const name = (o.customer_name || o.customer_email || "زائر").slice(0, 16);
    const phone = o.customer_phone ? ` | 📞 ${o.customer_phone}` : "";
    return `${i + 1}. ⏳ <code>${o.id.slice(0, 8)}</code> — ${name}\n    💰 ${o.total_amount} ج.م${phone}`;
  }).join("\n\n");

  // Two buttons per row
  const keyboard: any[][] = [];
  for (let i = 0; i < rows.length; i += 2) {
    const row: any[] = [
      { text: `${i + 1}. ${(rows[i].customer_name || rows[i].customer_email || "زائر").slice(0, 14)}`, callback_data: `details:${rows[i].id}` }
    ];
    if (rows[i + 1]) {
      row.push({ text: `${i + 2}. ${(rows[i + 1].customer_name || rows[i + 1].customer_email || "زائر").slice(0, 14)}`, callback_data: `details:${rows[i + 1].id}` });
    }
    keyboard.push(row);
  }

  await sendMsg(chatId,
    `⏳ <b>طلبات معلقة — بانتظار الاعتماد (${rows.length})</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}\n━━━━━━━━━━━━━━━━━━━━\n👇 اضغط على اسم العميل لعرض طلبه والاعتماد`,
    keyboard
  );
}

async function cmdStats(chatId: string): Promise<void> {
  const todayTs = new Date().setHours(0, 0, 0, 0);
  const { rows } = await pool.query(
    `SELECT
      COUNT(*) as total,
      COUNT(CASE WHEN created_at >= $1 THEN 1 END) as today,
      COALESCE(SUM(CASE WHEN created_at >= $1 THEN total_amount::numeric END),0) as today_rev,
      COALESCE(SUM(total_amount::numeric),0) as total_rev,
      COUNT(CASE WHEN status='pending' OR status='pending_approval' THEN 1 END) as pending,
      COUNT(CASE WHEN status='completed' THEN 1 END) as completed,
      COUNT(CASE WHEN status='cancelled' THEN 1 END) as cancelled
     FROM orders`,
    [new Date(new Date().setHours(0,0,0,0)).toISOString()]
  );
  const r = rows[0];
  await sendMsg(chatId, `📊 <b>إحصائيات المتجر</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>اليوم</b>
  📦 الطلبات: <b>${r.today}</b>
  💰 الأرباح: <b>${parseFloat(r.today_rev).toFixed(2)} ج.م</b>

📋 <b>الإجمالي</b>
  📦 إجمالي الطلبات: <b>${r.total}</b>
  💰 إجمالي الأرباح: <b>${parseFloat(r.total_rev).toFixed(2)} ج.م</b>
  ⏳ معلق: ${r.pending}
  ✅ مكتمل: ${r.completed}
  ❌ ملغي: ${r.cancelled}`);
}

async function cmdSearch(chatId: string, query: string): Promise<void> {
  if (!query) { await sendMsg(chatId, "الاستخدام: /search رقم_الطلب_أو_الإيميل"); return; }
  const { rows } = await pool.query(
    `SELECT * FROM orders WHERE id ILIKE $1 OR customer_email ILIKE $1 ORDER BY created_at DESC LIMIT 1`,
    [`%${query}%`]
  );
  if (!rows.length) { await sendMsg(chatId, `❌ لم يتم العثور على الطلب: <code>${query}</code>`); return; }
  const o = rows[0];
  let items = [];
  try {
    items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
  } catch {
    items = Array.isArray(o.items) ? o.items : [];
  }
  const text = buildOrderText(o, items);
  await sendMsg(chatId, text, orderButtons(o.id));
}

async function cmdStock(chatId: string): Promise<void> {
  const { rows } = await pool.query(
    `SELECT name, stock FROM games WHERE stock <= 5 AND deleted = false ORDER BY stock ASC LIMIT 10`
  );
  if (!rows.length) { await sendMsg(chatId, "✅ جميع المنتجات متوفرة بكمية كافية."); return; }
  const lines = rows.map((g: any) => `• ${g.name}: متبقي <b>${g.stock}</b>`).join("\n");
  await sendMsg(chatId, `⚠️ <b>تنبيه انخفاض المخزون</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}`);
}

async function cmdUsers(chatId: string): Promise<void> {
  const { rows } = await pool.query(`SELECT COUNT(*) as total FROM users WHERE role = 'user'`);
  const { rows: today } = await pool.query(
    `SELECT COUNT(*) as count FROM users WHERE role = 'user' AND created_at >= NOW() - INTERVAL '24 hours'`
  );
  await sendMsg(chatId, `👥 <b>إحصائيات المستخدمين</b>\n━━━━━━━━━━━━━━━━━━━━\nإجمالي العملاء: <b>${rows[0].total}</b>\nعملاء جدد (آخر 24 ساعة): <b>${today[0].count}</b>`);
}

async function cmdTopGames(chatId: string): Promise<void> {
  const { rows } = await pool.query(`
    SELECT g.name, COUNT(o.id) as sales
    FROM orders o, jsonb_array_elements(o.items::jsonb) AS item
    JOIN games g ON g.name = item->>'name'
    WHERE o.status = 'completed'
    GROUP BY g.name
    ORDER BY sales DESC
    LIMIT 5
  `);
  if (!rows.length) { await sendMsg(chatId, "📉 لا توجد بيانات مبيعات بعد."); return; }
  const lines = rows.map((r: any, i: number) => `${i + 1}. ${r.name}: <b>${r.sales} مبيعات</b>`).join("\n");
  await sendMsg(chatId, `🔥 <b>الألعاب الأكثر مبيعاً</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines}`);
}

async function cmdRevenue(chatId: string): Promise<void> {
  const { rows } = await pool.query(`
    SELECT
      TO_CHAR(created_at, 'Month') as month,
      SUM(total_amount::numeric) as rev
    FROM orders
    WHERE status = 'completed' AND created_at >= NOW() - INTERVAL '6 months'
    GROUP BY 1, created_at
    ORDER BY created_at DESC
    LIMIT 6
  `);
  const lines = rows.map((r: any) => `• ${r.month.trim()}: <b>${parseFloat(r.rev).toFixed(2)} ج.م</b>`).join("\n");
  await sendMsg(chatId, `💰 <b>الأرباح الشهرية (آخر 6 أشهر)</b>\n━━━━━━━━━━━━━━━━━━━━\n${lines || "لا توجد بيانات بعد."}`);
}

async function cmdMaintenance(chatId: string, toggle: string): Promise<void> {
  if (toggle !== "on" && toggle !== "off") {
    await sendMsg(chatId, "الاستخدام: /maintenance on|off");
    return;
  }
  const isMaintenance = toggle === "on";
  await pool.query("UPDATE settings SET maintenance_mode = $1", [isMaintenance]);
  await sendMsg(chatId, `🛠 <b>وضع الصيانة:</b> ${isMaintenance ? "<b>تفعيل</b> 🔴" : "<b>إيقاف</b> 🟢"}`);
}

async function cmdBroadcast(chatId: string, message: string): Promise<void> {
  if (!message) { await sendMsg(chatId, "الاستخدام: /broadcast الرسالة"); return; }
  await broadcast(`📢 <b>إعلان من الإدارة</b>\n━━━━━━━━━━━━━━━━━━━━\n${message}`);
  await sendMsg(chatId, "✅ تم إرسال الإعلان لجميع المشرفين.");
}

// ─── Approve: Send Code to User's Email ────────────────────────────────────

async function handleApproveCode(chatId: string, code: string): Promise<void> {
  const pending = pendingApprovals.get(chatId);
  if (!pending) return;

  pendingApprovals.delete(chatId);

  try {
    await pool.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", ["completed", pending.orderId]);

    await sendOrderCodeEmail({
      to: pending.customerEmail,
      customerName: pending.customerName,
      orderId: pending.orderId,
      code,
      codeType: pending.codeType,
    });

    await sendMsg(chatId, `✅ <b>تم إرسال الكود بنجاح!</b>
━━━━━━━━━━━━━━━━━━━━
📦 الطلب: <code>${pending.orderId}</code>
📧 إلى: <code>${pending.customerEmail}</code>
🎯 نوع الكود: ${pending.codeType === "text" ? "كود نصي 📝" : "كود صورة 🖼️"}
📊 الحالة: تم تحديثها إلى <b>مكتمل ✅</b>`);

    const others = getAllowedIds().filter(id => id !== chatId);
    await Promise.all(others.map(id =>
      sendMsg(id, `✅ الطلب <code>${pending.orderId}</code> تم اعتماده وإرسال الكود إلى العميل بواسطة المشرف`)
    ));
  } catch (err) {
    console.error("[Telegram] Approve code error:", err);
    await sendMsg(chatId, "❌ فشل إرسال الكود. حاول مرة أخرى.");
  }
}

async function handleApproveImage(chatId: string, photoFileId: string): Promise<void> {
  const pending = pendingApprovals.get(chatId);
  if (!pending) return;

  pendingApprovals.delete(chatId);

  try {
    // Get file path from Telegram to get the public URL
    const fileData = await tg("getFile", { file_id: photoFileId });
    const filePath = fileData?.result?.file_path;
    const imageUrl = filePath ? `https://api.telegram.org/file/bot${TOKEN}/${filePath}` : null;

    await pool.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", ["completed", pending.orderId]);

    await sendOrderCodeEmail({
      to: pending.customerEmail,
      customerName: pending.customerName,
      orderId: pending.orderId,
      code: imageUrl || "تم إرسال الكود كصورة",
      codeType: "image",
      imageUrl: imageUrl || undefined,
    });

    await sendMsg(chatId, `✅ <b>تم إرسال صورة الكود بنجاح!</b>
━━━━━━━━━━━━━━━━━━━━
📦 الطلب: <code>${pending.orderId}</code>
📧 إلى: <code>${pending.customerEmail}</code>
🖼️ نوع الكود: كود صورة
📊 الحالة: تم تحديثها إلى <b>مكتمل ✅</b>`);

    const others = getAllowedIds().filter(id => id !== chatId);
    await Promise.all(others.map(id =>
      sendMsg(id, `✅ الطلب <code>${pending.orderId}</code> تم اعتماده وإرسال صورة الكود إلى العميل`)
    ));
  } catch (err) {
    console.error("[Telegram] Approve image error:", err);
    await sendMsg(chatId, "❌ فشل إرسال الكود. حاول مرة أخرى.");
  }
}

// ─── Command Router ──────────────────────────────────────────────────────────

async function handleCommand(chatId: string, text: string): Promise<void> {
  // If admin is waiting to send a code, treat any text as the code
  const pending = pendingApprovals.get(chatId);
  if (pending && pending.codeType === "text") {
    await handleApproveCode(chatId, text.trim());
    return;
  }

  const [cmd, ...args] = text.trim().split(/\s+/);
  const arg = args.join(" ");

  if (cmd === "/start" || cmd === "/myid") {
    await sendMsg(chatId, `👋 <b>مرحباً بك في بوت إدارة المتجر</b>
━━━━━━━━━━━━━━━━━━━━
🔑 معرف الدردشة الخاص بك: <code>${chatId}</code>

⚠️ إذا لم يكن البوت يستجيب، أرسل هذا الرقم للمطور لإضافتك كمسؤول.`);
    if (!isAuthorized(chatId)) return;
  }

  if (!isAuthorized(chatId)) {
    await sendMsg(chatId, `⛔ <b>غير مصرح لك</b>\n\nعذراً، هذا الحساب (<code>${chatId}</code>) غير مسجل في قائمة المسؤولين.`);
    return;
  }

  if (cmd === "/orders") await cmdOrders(chatId);
  else if (cmd === "/pending") await cmdPending(chatId);
  else if (cmd === "/stats") await cmdStats(chatId);
  else if (cmd === "/search") await cmdSearch(chatId, arg);
  else if (cmd === "/stock") await cmdStock(chatId);
  else if (cmd === "/users") await cmdUsers(chatId);
  else if (cmd === "/top") await cmdTopGames(chatId);
  else if (cmd === "/revenue") await cmdRevenue(chatId);
  else if (cmd === "/maintenance") await cmdMaintenance(chatId, arg);
  else if (cmd === "/broadcast") await cmdBroadcast(chatId, arg);
  else if (cmd === "/cancel") {
    if (pendingApprovals.has(chatId)) {
      pendingApprovals.delete(chatId);
      await sendMsg(chatId, "🚫 تم إلغاء عملية الاعتماد.");
    } else {
      await sendMsg(chatId, "لا يوجد عملية معلقة لإلغائها.");
    }
  }
  else if (cmd === "/help") {
    await sendMsg(chatId, `🤖 <b>أوامر البوت</b>
━━━━━━━━━━━━━━━━━━━━
/orders — آخر 10 طلبات
/pending — جميع الطلبات المعلقة
/stats — الأرباح وإحصائيات الطلبات
/search ID — البحث عن طلب معين
/stock — فحص المنتجات منخفضة المخزون
/users — إحصائيات العملاء
/top — الألعاب الأكثر مبيعاً
/revenue — أرباح آخر 6 أشهر
/maintenance on|off — تبديل وضع الصيانة
/broadcast MSG — إرسال تنبيه للمشرفين
/cancel — إلغاء عملية الاعتماد الحالية
/myid — معرف الدردشة الخاص بك
/help — عرض هذه القائمة`);
  }
}

// ─── Callback Handler ─────────────────────────────────────────────────────

async function handleCallback(cbq: any): Promise<void> {
  const chatId = String(cbq.message?.chat?.id);
  const msgId = cbq.message?.message_id;
  const data: string = cbq.data || "";

  if (!isAuthorized(chatId)) { await answerCbq(cbq.id, "⛔ غير مصرح لك", true); return; }

  // ── Status Change ─────────────────────────────────────────────────────────
  if (data.startsWith("status:")) {
    const [, orderId, newStatus] = data.split(":");
    try {
      await pool.query("UPDATE orders SET status = $1, updated_at = NOW() WHERE id = $2", [newStatus, orderId]);
      const emojis: Record<string, string> = { completed: "✅", processing: "⚙️", cancelled: "❌" };
      const e = emojis[newStatus] || "📋";
      const statusNames: Record<string, string> = { completed: "مكتمل", processing: "جاري التنفيذ", cancelled: "ملغي" };
      const s = statusNames[newStatus] || newStatus;
      await answerCbq(cbq.id, `${e} تم التحديث إلى ${s}`);
      const original = cbq.message?.text || "";
      await editMsg(chatId, msgId, `${original}\n\n${e} <b>تم التحديث إلى: ${s}</b>`);
      const others = getAllowedIds().filter(id => id !== chatId);
      await Promise.all(others.map(id =>
        sendMsg(id, `${e} الطلب <code>${orderId}</code> تم تحديثه إلى <b>${s}</b> بواسطة المشرف`)
      ));
    } catch (err) {
      await answerCbq(cbq.id, "❌ فشل التحديث", true);
      console.error("[Telegram] Callback update error:", err);
    }
  }

  // ── View Details ──────────────────────────────────────────────────────────
  else if (data.startsWith("details:")) {
    const orderId = data.split(":")[1];
    try {
      const { rows } = await pool.query("SELECT * FROM orders WHERE id = $1", [orderId]);
      if (!rows.length) { await answerCbq(cbq.id, "❌ الطلب غير موجود", true); return; }
      const o = rows[0];
      let items: any[] = [];
      try {
        items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
      } catch {
        items = Array.isArray(o.items) ? o.items : [];
      }
      const text = buildOrderText(o, items);
      await sendMsg(chatId, text, orderButtons(o.id));
      await answerCbq(cbq.id, "🔍 تم جلب التفاصيل");
    } catch (err) {
      await answerCbq(cbq.id, "❌ فشل جلب البيانات", true);
    }
  }

  // ── Approve: Ask Code Type ────────────────────────────────────────────────
  else if (data.startsWith("approve:")) {
    const orderId = data.split(":")[1];
    try {
      const { rows } = await pool.query(
        "SELECT id, customer_name, customer_email FROM orders WHERE id = $1",
        [orderId]
      );
      if (!rows.length) { await answerCbq(cbq.id, "❌ الطلب غير موجود", true); return; }
      const o = rows[0];

      await answerCbq(cbq.id, "اختر نوع الكود");
      await sendMsg(chatId,
        `✅ <b>اعتماد الطلب</b>
━━━━━━━━━━━━━━━━━━━━
📦 الطلب: <code>${orderId}</code>
👤 العميل: ${o.customer_name || o.customer_email}
📧 الإيميل: <code>${o.customer_email}</code>

اختر نوع الكود الذي تريد إرساله للعميل:`,
        [
          [
            { text: "📝 كود نصي", callback_data: `codetype:${orderId}:text` },
            { text: "🖼️ كود صورة", callback_data: `codetype:${orderId}:image` },
          ],
          [{ text: "🚫 إلغاء", callback_data: `cancelapprove:${orderId}` }]
        ]
      );
    } catch (err) {
      await answerCbq(cbq.id, "❌ خطأ", true);
    }
  }

  // ── Code Type Chosen ──────────────────────────────────────────────────────
  else if (data.startsWith("codetype:")) {
    const parts = data.split(":");
    const orderId = parts[1];
    const codeType = parts[2] as "text" | "image";

    try {
      const { rows } = await pool.query(
        "SELECT id, customer_name, customer_email FROM orders WHERE id = $1",
        [orderId]
      );
      if (!rows.length) { await answerCbq(cbq.id, "❌ الطلب غير موجود", true); return; }
      const o = rows[0];

      pendingApprovals.set(chatId, {
        orderId,
        codeType,
        customerEmail: o.customer_email,
        customerName: o.customer_name || o.customer_email,
      });

      await answerCbq(cbq.id, codeType === "text" ? "أرسل الكود النصي الآن" : "أرسل صورة الكود الآن");

      if (codeType === "text") {
        await sendMsg(chatId, `📝 <b>أرسل الكود النصي الآن</b>
━━━━━━━━━━━━━━━━━━━━
📦 الطلب: <code>${orderId}</code>
📧 سيُرسل إلى: <code>${o.customer_email}</code>

✍️ اكتب الكود في رسالة جديدة وسيتم إرساله مباشرة للعميل.
(أرسل /cancel للإلغاء)`);
      } else {
        await sendMsg(chatId, `🖼️ <b>أرسل صورة الكود الآن</b>
━━━━━━━━━━━━━━━━━━━━
📦 الطلب: <code>${orderId}</code>
📧 سيُرسل إلى: <code>${o.customer_email}</code>

📸 أرسل الصورة في رسالة جديدة وسيتم إرسالها مباشرة للعميل.
(أرسل /cancel للإلغاء)`);
      }
    } catch (err) {
      await answerCbq(cbq.id, "❌ خطأ", true);
    }
  }

  // ── Cancel Approve ────────────────────────────────────────────────────────
  else if (data.startsWith("cancelapprove:")) {
    pendingApprovals.delete(chatId);
    await answerCbq(cbq.id, "تم الإلغاء");
    await sendMsg(chatId, "🚫 تم إلغاء عملية الاعتماد.");
  }
}

// ─── Daily Summary ────────────────────────────────────────────────────────

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
    await broadcast(`🌅 <b>صباح الخير! ملخص اليوم الماضي</b>
━━━━━━━━━━━━━━━━━━━━
📅 <b>${y.toLocaleDateString("ar-EG")}</b>

📦 الطلبات: <b>${r.total}</b>
💰 الأرباح: <b>${parseFloat(r.revenue).toFixed(2)} ج.م</b>
✅ مكتمل: ${r.done}
⏳ معلق: ${r.pend}
❌ ملغي: ${r.cancel}
━━━━━━━━━━━━━━━━━━━━
نتمنى لك يوماً سعيداً! 🎮`);
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
  console.log(`[Telegram] الملخص اليومي مجدول لـ ${next.toUTCString()}`);
}

// ─── Low Activity Alert ───────────────────────────────────────────────────

let lastOrderTime = Date.now();
let lastAlertSent = 0;

export function updateLastOrderTime(): void {
  lastOrderTime = Date.now();
}

async function checkLowActivity(): Promise<void> {
  const now = Date.now();
  const hour = new Date().getUTCHours() + 3;
  if (hour < 10 || hour > 23) return;
  const sixHours = 6 * 60 * 60 * 1000;
  if (now - lastOrderTime > sixHours && now - lastAlertSent > sixHours) {
    lastAlertSent = now;
    const hrs = Math.round((now - lastOrderTime) / 3600000);
    await broadcast(`⚠️ <b>تنبيه انخفاض النشاط</b>\nلا توجد طلبات جديدة منذ <b>${hrs} ساعات</b>.\nربما يجب عليك التحقق من المتجر أو عمل عرض ترويجي! 🎯`);
  }
}

// ─── Polling ──────────────────────────────────────────────────────────────

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

        // Text messages
        if (update.message?.text) {
          const chatId = String(update.message.chat.id);
          await handleCommand(chatId, update.message.text).catch(console.error);
        }

        // Photo messages (for image code approval)
        if (update.message?.photo) {
          const chatId = String(update.message.chat.id);
          if (isAuthorized(chatId)) {
            const pending = pendingApprovals.get(chatId);
            if (pending && pending.codeType === "image") {
              const photos = update.message.photo;
              const bestPhoto = photos[photos.length - 1];
              await handleApproveImage(chatId, bestPhoto.file_id).catch(console.error);
            }
          }
        }

        // Callback queries
        if (update.callback_query) {
          await handleCallback(update.callback_query).catch(console.error);
        }
      }
    }
  } catch { /* retry silently */ }
  if (pollingActive) setTimeout(poll, 2000);
}

async function setBotCommands(): Promise<void> {
  await tg("setMyCommands", {
    commands: [
      { command: "orders", description: "آخر 10 طلبات" },
      { command: "pending", description: "الطلبات المعلقة" },
      { command: "stats", description: "إحصائيات المتجر" },
      { command: "search", description: "البحث عن طلب برقم الآيدي أو الإيميل" },
      { command: "stock", description: "المنتجات منخفضة المخزون" },
      { command: "users", description: "إحصائيات العملاء" },
      { command: "top", description: "الأكثر مبيعاً" },
      { command: "cancel", description: "إلغاء عملية الاعتماد الحالية" },
      { command: "help", description: "عرض قائمة المساعدة" }
    ]
  });
}

export function startBotPolling(): void {
  if (pollingActive || !TOKEN) {
    if (!TOKEN) console.warn("[Telegram] لا يوجد توكن — تم تخطي الاستطلاع");
    return;
  }
  pollingActive = true;
  console.log("[Telegram] تم تشغيل البوت ✓");
  setBotCommands().catch(err => console.error("[Telegram] خطأ في تعيين الأوامر:", err));
  scheduleDailySummary();
  setInterval(checkLowActivity, 30 * 60 * 1000);
  poll();
}
