const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export async function sendTelegramMessage(text: string): Promise<void> {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.warn("[Telegram] Bot token or chat ID not configured, skipping notification");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text,
        parse_mode: "HTML",
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error("[Telegram] Failed to send message:", body);
    }
  } catch (err) {
    console.error("[Telegram] Error sending message:", err);
  }
}

export async function notifyNewOrder(order: {
  id: string;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  items: any[];
  totalAmount?: string | number;
  paymentMethod: string;
  playerId?: string;
  serverId?: string;
  receiptUrl?: string;
  createdAt: number;
}): Promise<void> {
  const date = new Date(order.createdAt).toLocaleString("ar-EG", {
    timeZone: "Africa/Cairo",
  });

  const itemLines = order.items
    .map((item: any) => `  • ${item.name || item.game || "Item"} x${item.quantity || 1} — ${item.price || ""} EGP`)
    .join("\n");

  const receiptLine = order.receiptUrl
    ? `\n🧾 <b>Receipt:</b> <a href="${process.env.FRONTEND_URL || "https://diaasadek.com"}${order.receiptUrl}">View Receipt</a>`
    : "\n🧾 <b>Receipt:</b> Not uploaded";

  const message = `
🛒 <b>NEW ORDER RECEIVED</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order.id}</code>
📅 <b>Date:</b> ${date}

👤 <b>Customer:</b> ${order.customerName || "Guest"}
📧 <b>Email:</b> ${order.customerEmail || "—"}
📞 <b>Phone:</b> ${order.customerPhone || "—"}

🎮 <b>Player ID:</b> ${order.playerId || "—"}
🌐 <b>Server ID:</b> ${order.serverId || "—"}

📦 <b>Items:</b>
${itemLines}

💰 <b>Total:</b> ${order.totalAmount} EGP
💳 <b>Payment:</b> ${order.paymentMethod}
${receiptLine}
━━━━━━━━━━━━━━━━━━━━
`.trim();

  await sendTelegramMessage(message);
}

export async function notifyOrderStatusChange(order: {
  id: string;
  status: string;
  customerName?: string;
  customerEmail?: string;
}): Promise<void> {
  const statusEmoji: Record<string, string> = {
    pending: "⏳",
    processing: "⚙️",
    completed: "✅",
    cancelled: "❌",
    refunded: "💸",
  };

  const emoji = statusEmoji[order.status] || "📋";

  const message = `
${emoji} <b>ORDER STATUS UPDATED</b>
━━━━━━━━━━━━━━━━━━━━
🆔 <b>Order ID:</b> <code>${order.id}</code>
👤 <b>Customer:</b> ${order.customerName || order.customerEmail || "Guest"}
📊 <b>New Status:</b> ${order.status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
`.trim();

  await sendTelegramMessage(message);
}
