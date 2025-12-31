# Diaa Eldeen Gaming Store

## Overview

A full-stack digital gaming store platform for selling game credits, gift cards, and digital vouchers. The platform features a React/TypeScript frontend with a Node.js/Express backend, PostgreSQL database via Drizzle ORM, and integrations for WhatsApp notifications and Cloudinary image hosting.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS with CSS variables for theming
- **UI Components**: Radix UI primitives with shadcn/ui patterns
- **Animation**: Framer Motion
- **State Management**: TanStack React Query for server state
- **Routing**: Client-side SPA with fallback routing configured in vercel.json

### Backend Architecture
- **Runtime**: Node.js with Express
- **Location**: `backend/` directory contains the production API server (`index.js`)
- **Authentication**: JWT-based admin authentication with token verification middleware
- **File Uploads**: Multer for handling multipart form data
- **API Design**: RESTful endpoints under `/api/*` prefix
- **Data Storage**: Hybrid approach using PostgreSQL for primary data and JSON files for fallback/caching

### Database Layer
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts`
- **Connection**: Uses `@neondatabase/serverless` for Neon PostgreSQL in production
- **Migrations**: Managed via `drizzle-kit push` command

### Project Structure
```
├── client/           # React frontend source
├── backend/          # Express API server (production)
├── server/           # TypeScript server utilities (development helpers)
├── shared/           # Shared schema and types
├── api/              # Vercel serverless function stubs
├── attached_assets/  # Static image assets
└── data/             # JSON data files for categories/games
```

## External Dependencies

### Database
- **Provider**: Neon PostgreSQL (serverless)
- **Connection**: Via `DATABASE_URL` environment variable
- **ORM**: Drizzle with Neon serverless adapter

### Deployment
- **Frontend**: Vercel (configured via `vercel.json`)
- **Backend**: External server at `51.75.118.165:20291` (Cloudflare-proxied)
- **API Proxy**: Vercel rewrites route `/api/*` requests to backend server

### Third-Party Services
- **Cloudinary**: Image upload and CDN hosting
- **WhatsApp**: Order notifications via `@whiskeysockets/baileys` library
- **Catbox.moe**: Alternative image hosting option

### Key Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `JWT_SECRET`: Token signing key for admin auth
- `ADMIN_EMAIL` / `ADMIN_PASSWORD`: Admin credentials
- `FRONTEND_URL`: CORS allowed origin
- `VITE_API_URL`: Backend API base URL for frontend

### Development Commands
- `npm run dev`: Start Vite development server
- `npm run build`: Build frontend for production
- `npm start`: Run production backend server
- `npm run db:push`: Push schema changes to database
- `npm run db:seed`: Seed database with initial data