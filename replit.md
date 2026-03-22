# Diaa Sadek Gaming Store

## Overview
A high-end digital store for gaming currencies and vouchers.

## Architecture
- **Frontend**: React + Vite (Port 5000)
- **Backend**: Node.js Express (Port 3001)
- **Database**: PostgreSQL (Drizzle)

## Image Handling
All branding and game images are stored in `attached_assets/`. 
The frontend serves them from `/attached_assets/` which is mapped to `client/public/attached_assets/`.

## Recent Changes
- Fixed Git merge conflicts (diverged branches).
- Updated `games.json` to use high-quality local images.
- Fixed `Header` logo and `Home` about section image paths.
- Fixed `ImageWithFallback` logic to correctly resolve local asset paths.
