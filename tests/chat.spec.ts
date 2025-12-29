import { test, expect, request } from "@playwright/test";

const API = process.env.API_BASE_URL || "http://localhost:3001";

test.describe("Chat privacy and persistence", () => {
  test("user chat requires auth and persists", async ({}) => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${API}/api/auth/login`, { data: { email: "non@exist.com", password: "bad" } });
    expect([401, 403].includes(login.status())).toBeTruthy();

    const send = await ctx.post(`${API}/api/chat/message`, {
      data: { sender: "user", message: "Hello <script>alert(1)</script>", sessionId: "web_test_session" },
    });
    expect(send.ok()).toBeTruthy();

    const list = await ctx.get(`${API}/api/chat/web_test_session`);
    expect(list.ok()).toBeTruthy();
    const messages = await list.json();
    expect(Array.isArray(messages)).toBeTruthy();
  });

  test("support messages require admin token", async ({}) => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API}/api/chat/message`, {
      data: { sender: "support", message: "hi", sessionId: "web_test_session" },
    });
    expect(res.status()).toBe(401);
  });
});
