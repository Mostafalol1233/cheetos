# Backend Folder Structure

This backend is organized under the `backend/` directory. It exposes a Node.js + Express API and serves static assets required by the frontend.

## Top-Level
- `index.js` — Entry point for the Express server. Configures middleware, routes, static assets, and startup checks.
- `db.js` — Database connection pooling and helpers.
- `storage.js` — Utility functions for file storage and paths.
- `package.json` — Backend dependencies and scripts.

## Directories
- `middleware/` — Reusable Express middleware
  - `logger.js` — Request logging
  - `error.js` — Error handling
- `routes/` — Route modules
  - `game-verification.js` — Verification utilities/features
- `public/` — Static files served under `/images`, `/media`, etc.
- `data/` — JSON data files for games, categories, alerts, WhatsApp messages
- `scripts/` — One-off maintenance and seeding scripts
  - `seed-db.js` — Database seeding
  - `update-packages.js` — Packages maintenance
  - `verify-media.js` — Media verification
  - `test-endpoints.js` — API smoke tests
- `tests/` — Backend API tests
  - `api.test.js` — Basic endpoint checks

## Conventions
- Routes: mount under `/api/*`. Use descriptive names and consistent casing.
- Images: normalize to `/uploads/`, `/images/`, or `/media/` paths; avoid hardcoded hosts.
- Environment: `.env` controls `PORT`, `NODE_ENV`, and `FRONTEND_URL`.
- Startup flags:
  - `ENABLE_IMAGE_SEEDING` — seeds image paths when true
  - `ENABLE_IMAGE_OVERRIDES` — applies overrides on startup when true

## Development
- Start backend: `node backend/index.js`
- Start frontend: `vite` (root)
- Playwright dev server: `npx vite --port 5173`

## Notes
- All backend logic resides in `backend/`. The old `server/` TypeScript helper is not used in production builds and is excluded from type-checking.
