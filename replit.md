# Diaa Sadek Gaming Store

## Overview
A high-end digital store for gaming currencies and vouchers.

## Architecture
- **Frontend**: React + TypeScript + Vite running on PORT 5000
- **Backend**: Node.js Express running on PORT 3001 (entry: `index.js` → `backend/index.js`)
- **Database**: PostgreSQL (via backend DB connection)
- **Workflows**: "Frontend" runs Vite, "Start application" runs the Node.js backend
- **Vite Proxy**: All `/api`, `/images`, `/media`, `/uploads`, `/socket.io` routes are proxied from port 5000 to backend port 3001

## Key Files
- `index.js` — Root shim, delegates to `backend/index.js`
- `backend/index.js` — Main Express server with all routes and middleware
- `client/src/App.tsx` — Root React component with routes
- `client/src/pages/game.tsx` — Individual game detail page
- `client/src/pages/games.tsx` — Games list page
- `client/src/components/popular-games.tsx` — Popular games section on home page
- `client/src/components/image-with-fallback.tsx` — Image component with error fallback
- `client/src/components/dynamic-loading-progress.tsx` — Loading screen component

## Image Handling
- Game images stored in `client/public/images/` (static files)
- Backend serves `/images/*` from root `images/` dir AND `client/public/images/` (fallback)
- Image priority order: local slug map → DB image URL → slug-based path
- Generated AI banner images: `banner-free-fire.png`, `banner-pubg.png`, `banner-crossfire.png`
- Fortnite uses AI-generated local image (`fortnite-game.png`) since external URL was blocked
- GAME_SLUG_IMAGES maps game slugs to local image files in game.tsx, games.tsx, popular-games.tsx

## Recent Changes
- Fixed "Image unavailable" by adding `client/public/images/` as static asset dir in backend
- Generated AI game images for Free Fire, PUBG, Crossfire (banners) and Fortnite (card)
- Fixed loading screens: replaced blue gradients with pure black (#000000)
- Fixed game card image display: square aspect ratio with object-contain
- Image priority fixed: local slug images always take precedence over broken DB CDN URLs
- Removed non-existent file references from GAME_SLUG_IMAGES mappings
- Made registration logAudit non-blocking (prevents potential timeout/500 errors)
- Increased game package card sizes: image 96x96 (sm:112x112), price text lg/xl for mobile
- Currency images (diamond/UC/etc) now shown in package cards as main image when no pkg image
- Package image error fallback now shows currency icon before gradient placeholder
- Popular games grid: 2 columns on mobile (was 1), consistent aspect-[4/3] ratio, hover shadow
- Added real packages to all gift cards in PostgreSQL DB (Steam, Google Play, Amazon, PSN, Xbox, iTunes, Netflix, Spotify)
- Updated gift cards category image to a new branded SVG banner (`/images/category-gift-cards.svg`)
- Moved Fortnite from gift-cards to online-games category
- Made all gift card games popular and visible on main page
- game.tsx: Gift cards show "How to receive your code" info box instead of Player ID field
- game.tsx: Gift card badges show "Gift Card Code" and "Code via WhatsApp" instead of "Direct Top-up"/"Instant Delivery"
