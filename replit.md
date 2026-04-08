# Diaa Sadek Gaming Store

## Overview
A high-end digital store for gaming currencies and vouchers.

## Architecture
- **Frontend**: React + TypeScript + Vite running on PORT 5000
- **Backend**: Node.js Express running on PORT 22135 (entry: `index.js` → `backend/index.js`)
- **Database**: PostgreSQL (via backend DB connection)
- **Workflows**: "Frontend" runs Vite, "Start application" runs the Node.js backend
- **Vite Proxy**: All `/api`, `/images`, `/media`, `/uploads`, `/socket.io` routes are proxied from port 5000 to backend port 22135

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
- All game main (logo) images are hosted on Cloudinary (ddzbutb12) in the `image` DB column
- ALL game banner/hero images are hosted on Cloudinary in the `banner_image` DB column (all 24 games)
- Image priority order (game.tsx hero): banner_image (DB) → bannerImage → image_url (DB) → Cloudinary image (DB) → HERO_IMAGES fallback → image (DB)
- Image priority order (games.tsx / popular-games.tsx): banner_image (DB) → image (DB Cloudinary) → GAME_SLUG_IMAGES fallback → image (DB)
- TikTok, Wolf Team, e-football use their logo Cloudinary images as banners (no proper banner art available)
- Hero carousel (header_versions table) image_url fields all updated to Cloudinary URLs (gamecart/headers/)
- Local static images in `client/public/images/` still used for currency icons and GAME_SLUG_IMAGES fallbacks
- Logo in loading screen uses Cloudinary URL (gamecart/logo.png)
- `banner_image` column added to games table in DB and to Drizzle schema (shared/schema.ts)

## Recent Changes
- Uploaded hero carousel images to Cloudinary (crossfire-banner-new, hero-pubg, hero-free-fire) and updated header_versions table URLs
- Fixed Valornt Turk banner: uploaded valorant-turk-banner.png to Cloudinary and updated banner_image in DB
- Set banner_image for TikTok, Wolf Team, e-Football using their existing Cloudinary logo images
- All games now have Cloudinary banner_image URLs (previously 3 games had empty/wrong banners)
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
- game.tsx: Removed Player ID field from ALL games (not just gift cards) - no longer needed
- game.tsx: Added 4 info tabs at bottom of each game page (Description, FAQs, How to redeem, Terms & Conditions)
- game.tsx: Tabs use pill-style buttons with gold active state
- header.tsx: Navigation menu redesigned - cleaner, more professional (removed font-gaming/tracking-widest), now uses subtle underline for active links
- Discord Nitro added to database with 4 packages (1/3/6/12 month subscriptions)
- admin.tsx: WhatsAppConnectionPanel completely rewritten with better UI, reconnect/disconnect buttons, error states, Arabic text, animated connection indicator
- backend/index.js: Core file cleanup improved - runs immediately on startup, checks every 2min, covers /tmp and /home/runner dirs, uses regex pattern for core files
- Migrated ALL 14 broken local /images/ game images to Cloudinary: fortnite, crossfire, pubg, free-fire, all gift cards, discord-nitro, COD mobile
- Updated getGameImage() in games.tsx and popular-games.tsx to prefer Cloudinary DB URLs over local slug map
- Loading screen logo updated from catbox.moe to Cloudinary
- Popular games cards changed to aspect-ratio 3/4, object-cover, hover scale-105 for better visual
- Receipt upload limit increased from 5MB to 20MB (backend/index.js receiptUpload)
- Admin orders table scroll position now preserved across data refetches (useRef in OrdersPanel)
- ADMIN_PASSWORD moved from hardcoded default to required env secret; login blocked if not set
- Login rate limiting added: max 10 attempts per 15 min (backend/routes/auth.js loginRateLimiter)
- ENCRYPTION_KEY env var added for AES-256-GCM code encryption (game_card_codes table)
- Admin panel tabs completely reorganized: 27 tabs → 22, grouped logically (Sales/Products/Support/Design/System)
- Tabs renamed to Arabic with emoji icons for clarity
- Removed useless tabs: Interactions, Catbox Upload, Image Manager, Advanced Editor, Home Preview
- Default admin tab changed from 'games' to 'orders'
- Added description banner to Digital Codes tab explaining how auto-delivery works
- Post-merge setup script created at `scripts/post-merge.sh` — installs npm deps for root/backend/client (runs automatically after task merges)
- Admin panel: "Large Image URL" renamed to "Banner Image URL", edit dialog now loads and saves `banner_image` field correctly
- game.tsx: Fixed heroImage priority — banner_image now takes precedence over image_url (prevents wrong images showing)
- Fixed merge conflict in game.tsx heroImage line (was causing Vite pre-transform error)
