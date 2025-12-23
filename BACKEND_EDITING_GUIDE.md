# Backend Editing Guide

This project contains two server directories:

- `server/`: TypeScript server used to serve the frontend build and optionally host local API routes for development.
- `backend/`: Designated backend deployment directory. All backend business logic and API endpoints must be edited here.

## Correct Editing Location

- Make all API, middleware, data, and route changes in `backend/`.
- Do not modify API logic in `server/`. The `server` app should only serve the frontend and proxy `/api/*` to the deployed backend.

## How Proxying Works

- When the `BACKEND_URL` environment variable is set, the `server` process forwards all `/api/*` requests to that backend URL instead of handling routes locally.
- If `BACKEND_URL` is not set, `server` will register its local routes (development fallback).

## Environment Variables

- `BACKEND_URL`: Set to your backend origin (e.g., `http://localhost:3001` or `https://api.example.com`).
- `ENABLE_WHATSAPP`: Set to `false` to disable WhatsApp connection in environments where it is not required.

## Development

1. Start backend: `node backend/index.js`.
2. Build frontend: `npm run build`.
3. Start frontend server with proxy: `$env:BACKEND_URL='http://localhost:3001'; node dist/index.js`.

## Production

- Configure your host (e.g., Vercel) to rewrite `/api/*` to your deployed backend.
- Keep frontend builds in `dist/public`.

## Summary

- Edit backend code only in `backend/`.
- Use `BACKEND_URL` to direct the `server` app to the deployed backend.
- Maintain separation: frontend hosting/proxy in `server/`, backend logic in `backend/`.
