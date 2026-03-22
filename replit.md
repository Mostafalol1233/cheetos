# Diaa Sadek Gaming Store

## Overview
A high-end digital store for gaming currencies and vouchers.

## Architecture
- **Frontend**: React + Vite (integrated into Express in dev mode)
- **Backend**: Node.js Express (PORT=5000, single server for both API and frontend)
- **Database**: PostgreSQL via Neon (Drizzle ORM)
- **Workflow**: `npm run dev` → `tsx server/index.ts`

## Key Files
- `server/index.ts` — Express + Vite entry point
- `server/routes.ts` — All API routes
- `server/settings.ts` — Site settings (color, logo, etc.)
- `shared/schema.ts` — Main DB schema
- `shared/settings-schema.ts` — Settings table schema
- `shared/hero-slides-schema.ts` — Hero slides schema
- `drizzle.config.ts` — Drizzle config (includes all three schema files)
- `client/src/App.tsx` — Root React component with AppShell

## Environment Setup
- PORT must be 5000 for Replit webview
- All env vars set in Replit shared environment
- Secrets: JWT_SECRET, ADMIN_PASSWORD, CLOUDINARY_API_SECRET, SMTP_PASS, AI_API_KEY, DATABASE_URL (managed by Replit)

## Image Handling
All branding and game images are stored in `attached_assets/`. 
The frontend serves them from `/attached_assets/` which is mapped to `client/public/attached_assets/`.

## Recent Changes
- Configured all environment variables for Replit
- Fixed `drizzle.config.ts` to include all schema files (settings, hero-slides)
- Fixed React hooks violation in `AppShell` (useEffect after early return)
- Added missing API routes: `/api/health`, `/api/header-images/active`, `/api/localization/detect`, `/api/metrics/*`
- Fixed `server/settings.ts` to use proper Drizzle `eq()` import and syntax
