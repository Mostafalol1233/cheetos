
import "dotenv/config";
import { pool } from "./server/db.ts";
import { notifyNewOrder } from "./server/telegram.ts";

async function testTelegram() {
  console.log("🚀 Starting Telegram Test for new ID...");
  console.log("NEW CHAT_ID:", process.env.TELEGRAM_CHAT_ID);
  
  try {
    const { rows } = await pool.query(
      "SELECT * FROM orders ORDER BY created_at DESC LIMIT 1"
    );
    
    if (!rows.length) {
      console.log("❌ No orders found in database.");
      return;
    }

    const o = rows[0];
    let items = [];
    try {
      items = typeof o.items === 'string' ? JSON.parse(o.items) : (o.items || []);
    } catch {
      items = Array.isArray(o.items) ? o.items : [];
    }

    console.log(`📦 Sending test for order: ${o.id}`);
    await notifyNewOrder({
      id: o.id,
      customer_name: o.customer_name || "Test User",
      customer_email: o.customer_email || "test@example.com",
      customer_phone: o.customer_phone || "0123456789",
      items,
      total_amount: o.total_amount,
      payment_method: o.payment_method,
      player_id: o.player_id,
      receipt_url: o.receipt_url,
      created_at: o.created_at
    });

    console.log("✅ Test message sent successfully!");
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

testTelegram().then(() => {
  process.exit(0);
});
