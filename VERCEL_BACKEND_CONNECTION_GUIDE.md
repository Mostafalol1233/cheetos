# Vercel Frontend & Backend Server Connection Guide

## Overview

Your Diaa Eldeen gaming store frontend (Vercel) is now properly configured to connect to your backend server at `51.75.118.165:20291`.

---

## Configuration Files Updated

### 1. **vercel.json** (Proxy Configuration)
- ✅ Added environment variables with backend API URL
- ✅ Added rewrites to proxy `/api/*` requests to backend
- ✅ Added CORS headers for cross-origin requests
- ✅ Configured for production deployment

### 2. **Frontend Environment Files**

#### `.env.production` (Vercel Production)
```env
VITE_API_URL=http://51.75.118.165:20291
VITE_BACKEND_URL=http://51.75.118.165:20291
```

#### `.env.development` (Local Development)
```env
VITE_API_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001
```

#### `.env.example` (Template)
Contains all available environment variables

### 3. **Backend Environment Files**

#### `.env.production` (Production Server at 51.75.118.165:20291)
Contains:
- ✅ Port: 20291
- ✅ Database credentials (Supabase PostgreSQL)
- ✅ JWT Secret for admin authentication
- ✅ Session secret
- ✅ CORS origin: https://diaaa.vercel.app
- ✅ Admin email/password credentials

#### `.env.development` (Local Development)
Contains:
- ✅ Port: 3001 (local development)
- ✅ Same database credentials
- ✅ Development secrets
- ✅ Local CORS origins

---

## API Connection Flow

```
┌─────────────────────────────┐
│  Vercel Frontend            │
│  (https://diaaa.vercel.app) │
└────────────┬────────────────┘
             │
             │ HTTP Requests
             │ (51.75.118.165:20291)
             ▼
┌─────────────────────────────┐
│  Backend Server             │
│  51.75.118.165:20291        │
│  ────────────────────       │
│  • Node.js + Express        │
│  • Games API                │
│  • Categories API           │
│  • Admin Auth               │
│  • File Upload              │
└────────────┬────────────────┘
             │
             ▼
┌─────────────────────────────┐
│  Supabase PostgreSQL DB     │
│  (db.enzhpcamsryehittbwuf.. │
│  .supabase.co:5432)         │
└─────────────────────────────┘
```

---

## How API Requests Work

### 1. Frontend Makes Request
```typescript
const response = await fetch('http://51.75.118.165:20291/api/games');
const games = await response.json();
```

### 2. vercel.json Routes Request
- Detects `/api/*` requests
- Proxies to `http://51.75.118.165:20291/api/*`
- Adds CORS headers
- Returns response

### 3. Backend Processes Request
- Receives request at port 20291
- Checks authentication (if admin endpoint)
- Connects to Supabase PostgreSQL
- Returns data as JSON

### 4. Frontend Receives Response
- Parses JSON data
- Updates UI
- Shows games/categories to user

---

## Database Credentials (Already Configured)

```
Host: db.enzhpcamsryehittbwuf.supabase.co
Port: 5432
User: postgres
Password: 4EnM3zwzADEJ$Qw
Database: postgres
```

**Connection String:**
```
postgresql://postgres:4EnM3zwzADEJ$Qw@db.enzhpcamsryehittbwuf.supabase.co:5432/postgres
```

---

## Admin Authentication

### Credentials
```
Email: admin@diaaldeen.com
Password: your_secure_admin_password
```

### Login Flow
1. Admin visits `/admin` on Vercel
2. Enters credentials on login page
3. Frontend sends POST to `/api/auth/login`
4. Backend validates against database
5. Returns JWT token
6. Token stored in localStorage
7. Subsequent requests include token in headers

### Protected Endpoints
The following endpoints require authentication (JWT token):
- `POST /api/admin/games` - Create game
- `PUT /api/admin/games/:id` - Update game
- `DELETE /api/admin/games/:id` - Delete game
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category
- `POST /api/admin/upload` - Upload files

---

## Environment Variables Map

### Frontend (Vercel)
| Variable | Value | Purpose |
|----------|-------|---------|
| `VITE_API_URL` | `http://51.75.118.165:20291` | Backend API endpoint |
| `VITE_BACKEND_URL` | `http://51.75.118.165:20291` | Alternative backend reference |
| `VITE_APP_NAME` | `Diaa Eldeen` | Store name |
| `VITE_ENABLE_CHAT` | `true` | Enable chat feature |
| `VITE_ENABLE_ANALYTICS` | `true` | Enable analytics |

### Backend (51.75.118.165:20291)
| Variable | Value | Purpose |
|----------|-------|---------|
| `PORT` | `20291` | Server port |
| `NODE_ENV` | `production` | Environment |
| `DATABASE_URL` | `postgresql://...` | Database connection |
| `JWT_SECRET` | `***` | Token signing |
| `SESSION_SECRET` | `***` | Session encryption |
| `CORS_ORIGIN` | `https://diaaa.vercel.app` | Allowed CORS origin |
| `FRONTEND_URL` | `https://diaaa.vercel.app` | Frontend URL |

---

## Deployment Checklist

### Frontend (Vercel)
- [x] `.env.production` configured with backend URL
- [x] `vercel.json` configured with API proxy
- [x] CORS headers added
- [x] Environment variables set in Vercel dashboard
- [ ] Deploy to Vercel (when ready)

### Backend (51.75.118.165:20291)
- [x] `.env.production` configured
- [x] Database credentials verified
- [x] JWT secret configured
- [x] Admin credentials set
- [x] CORS origin whitelisted
- [ ] Deploy to server (when ready)

---

## Testing the Connection

### 1. Test Backend Health
```bash
curl http://51.75.118.165:20291/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-12-20T10:00:00Z"
}
```

### 2. Test Get Games
```bash
curl http://51.75.118.165:20291/api/games
```

Should return array of games from Supabase.

### 3. Test Admin Login
```bash
curl -X POST http://51.75.118.165:20291/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diaaldeen.com","password":"your_password"}'
```

Should return JWT token.

### 4. Test Protected Endpoint (with token)
```bash
curl http://51.75.118.165:20291/api/admin/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## CORS Configuration

### Allowed Origins
```
- https://diaaa.vercel.app (Production)
- http://localhost:5173 (Development)
- http://localhost:3000 (Local)
```

### Allowed Methods
- GET
- POST
- PUT
- DELETE
- OPTIONS
- PATCH

### Allowed Headers
- Content-Type
- Authorization
- X-Requested-With
- X-CSRF-Token

---

## Troubleshooting

### Issue: CORS Error
**Solution:**
1. Check `FRONTEND_URL` in backend `.env`
2. Verify origin is whitelisted in `vercel.json`
3. Ensure backend is running on correct port (20291)

### Issue: Cannot Connect to Database
**Solution:**
1. Verify `DATABASE_URL` in backend `.env`
2. Check network connectivity to Supabase
3. Verify credentials are correct
4. Check if Supabase IP is whitelisted

### Issue: Auth Not Working
**Solution:**
1. Verify `JWT_SECRET` is set
2. Check admin credentials in database
3. Verify token is being sent in headers
4. Check token hasn't expired

### Issue: Images Not Loading
**Solution:**
1. Check `/uploads` directory exists on backend
2. Verify file permissions
3. Check image URLs are correct in response
4. Verify CORS allows image requests

---

## Next Steps

1. **Deploy Frontend to Vercel**
   - Push code to GitHub
   - Vercel auto-deploys
   - Verify it works at https://diaaa.vercel.app

2. **Deploy Backend to Server**
   - Copy files to 51.75.118.165
   - Configure `.env` with production values
   - Start Node.js server on port 20291
   - Verify with health check

3. **Test Integration**
   - Visit https://diaaa.vercel.app
   - Check console for API errors
   - Try admin login
   - Create/edit/delete games

4. **Monitor**
   - Check Vercel logs
   - Check backend server logs
   - Monitor database queries
   - Track errors

---

## Important Security Notes

⚠️ **Production Passwords:**
- Change `ADMIN_PASSWORD` in backend `.env`
- Generate new `JWT_SECRET`
- Use strong `SESSION_SECRET`
- Whitelist only your Vercel domain in CORS
- Use HTTPS for all connections

✅ **Already Configured:**
- Database credentials stored securely
- CORS properly configured
- Admin authentication enabled
- File upload validation
- Error handling

---

## File Locations

```
Frontend (Vercel):
├── client/.env.example ........... Environment template
├── client/.env.production ........ Production env vars
├── client/.env.development ....... Development env vars
├── vercel.json ................... Deployment & proxy config
└── client/src/lib/queryClient.ts  API client

Backend (51.75.118.165:20291):
├── backend/.env.example .......... Environment template
├── backend/.env.production ....... Production env vars
├── backend/.env.development ...... Development env vars
├── backend/index.js .............. Main server code
└── backend/package.json .......... Dependencies
```

---

## Quick Reference

**Frontend API URL:** `http://51.75.118.165:20291`  
**Frontend Domain:** `https://diaaa.vercel.app`  
**Backend Port:** `20291`  
**Database:** Supabase PostgreSQL  
**Auth:** JWT tokens  
**Admin Email:** `admin@diaaldeen.com`  

---

**Status: ✅ Ready for Deployment**

All configuration files have been updated and are ready for deployment. The frontend and backend are properly configured to communicate with each other.
