import { test, expect, request } from "@playwright/test";

const API = process.env.API_BASE_URL || "http://localhost:3001";
const rnd = Math.random().toString(36).slice(2, 8);
const email = `user_${rnd}@example.com`;
const password = `P@ss-${rnd}-123`;

test.describe("User auth", () => {
  test("register and verify", async ({}) => {
    const ctx = await request.newContext();
    const res = await ctx.post(`${API}/api/auth/register`, {
      data: { email, password, name: "Test User" },
    });
    expect(res.ok()).toBeTruthy();
    // fetch verification token from DB via admin endpoint if available or simulate verification failure and ensure requires token
    const bad = await ctx.post(`${API}/api/auth/verify`, { data: { email, token: "bad" } });
    expect(bad.status()).toBe(400);
  });

  test("login requires verification", async ({}) => {
    const ctx = await request.newContext();
    const login = await ctx.post(`${API}/api/auth/login`, { data: { email, password } });
    expect(login.status()).toBe(403);
  });
});
