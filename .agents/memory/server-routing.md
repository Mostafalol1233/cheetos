---
name: Server routing architecture
description: The actual running server uses server/index.ts → server/routes.ts. backend/index.js is a separate legacy file that is NOT used in the Vite dev setup.
---

## Rule
All new API routes MUST be added to `server/routes.ts` inside the `registerRoutes()` function.

**Why:** The workflow runs `tsx server/index.ts` which calls `registerRoutes()` from `server/routes.ts`. The file `backend/index.js` exists but is only used if you run `node index.js` directly — it is NOT wired into the Vite dev server.

## Auth in server/routes.ts
- `requireAuth` / `requireAdmin` use Passport.js sessions (not JWT)
- User-facing routes that need JWT auth require a custom middleware using `jwt.verify(token, JWT_SECRET)` from the Authorization header
- The JWT_SECRET defaults to 'your_jwt_secret_key_change_this_in_production' if not set in env
- `req.jwtUser.userId || req.jwtUser.id` — the user ID field varies, check both

## DB pool
- Import from `server/db.ts`: `import { pool } from "./db"`
- This is a Neon serverless pool (@neondatabase/serverless)
- Run CREATE TABLE statements as separate pool.query() calls, not bundled in one string
