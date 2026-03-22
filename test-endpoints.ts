import fetch from "node-fetch";

const BASE_URL = "http://localhost:3001/api";
let cookie = "";

async function main() {
  console.log("Testing Auth...");
  
  // 1. Register
  try {
    const regRes = await fetch(`${BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin_" + Date.now(),
        password: "password123",
        email: `admin_${Date.now()}@test.com`
      })
    });
    const regData = await regRes.json();
    console.log("Register:", regRes.status, regData);
  } catch (e) {
    console.log("Register failed (might be expected if DB down):", e.message);
  }

  // 2. Login (use a known user or the one just created)
  // Since I can't guarantee register worked, I'll try to login with what I just sent.
  // If register failed due to DB, login will also fail.
  
  // 3. Check WhatsApp Status (no auth needed)
  const waRes = await fetch(`${BASE_URL}/whatsapp/status`);
  console.log("WA Status:", await waRes.json());
}

main();
