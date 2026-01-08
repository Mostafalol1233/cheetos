# Environment Configuration Files - Ready to Deploy

## Location: Backend Server (51.75.118.165:20291)

### File: backend/.env (Production)

Copy and paste this exactly into your backend server's `.env` file:

```env
# Backend Environment Variables - Production

# Server Configuration
PORT=22135
NODE_ENV=production
HOST=0.0.0.0

# Frontend URL (for CORS)
FRONTEND_URL=https://diaaa.vercel.app

# Database Configuration (PostgreSQL/Supabase)
DATABASE_URL="postgresql://postgres:4EnM3zwzADEJ\\$Qw@db.enzhpcamsryehittbwuf.supabase.co:5432/postgres"
PGHOST="db.enzhpcamsryehittbwuf.supabase.co"
PGPORT="5432"
PGUSER="postgres"
PGPASSWORD="4EnM3zwzADEJ\\$Qw"
PGDATABASE="postgres"

# Session & Security
SESSION_SECRET="SSNH+DUx59yMjok+evGVGKV9HfP0uBsRBOAE5cJdShuutgHmpSM8XmLVaszzVHYh/RZe5neFERb0lkwpyp4Fzw=="

# JWT Token Secret (for admin authentication)
JWT_SECRET="your_jwt_secret_key_change_in_production"

# Admin Authentication Credentials
ADMIN_EMAIL="admin@diaaldeen.com"
ADMIN_PASSWORD="your_secure_admin_password"

# CORS Configuration
CORS_ORIGIN="https://diaaa.vercel.app,http://localhost:5173,http://localhost:3000"

# File Upload Settings
MAX_FILE_SIZE=52428800
UPLOAD_DIR="./uploads"

# Email Configuration (Optional)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your_email@gmail.com"
SMTP_PASSWORD="your_app_password"

# API Server
API_URL="http://fi4.bot-hosting.net:22135"
API_PORT="22135"

# Environment
APP_NAME="Diaa Eldeen Gaming Store"
APP_ENVIRONMENT="production"
```

---

## Location: Vercel Frontend Dashboard

### Environment Variables to Set in Vercel Dashboard:

```
Name: VITE_API_URL
Value: http://fi4.bot-hosting.net:22135

Name: VITE_BACKEND_URL
Value: http://fi4.bot-hosting.net:22135

Name: VITE_APP_NAME
Value: Diaa Eldeen

Name: VITE_APP_DESCRIPTION
Value: Premium Gaming Store

Name: VITE_ENABLE_CHAT
Value: true

Name: VITE_ENABLE_ANALYTICS
Value: true

Name: VITE_ENABLE_SOCIAL_SHARING
Value: true

Name: VITE_TELEGRAM_URL
Value: https://t.me/diaaldeen

Name: VITE_TIKTOK_URL
Value: https://tiktok.com/@diaaldeen

Name: VITE_YOUTUBE_URL
Value: https://youtube.com/@diaaldeen

Name: VITE_FACEBOOK_URL
Value: https://facebook.com/diaaldeen

Name: VITE_ADMIN_PATH
Value: /admin

Name: VITE_AUTH_TOKEN_KEY
Value: admin_token
```

---

## Steps to Deploy Backend Server

### 1. SSH into Server
```bash
ssh -i your_key.pem user@51.75.118.165
```

### 2. Create Backend Directory
```bash
mkdir -p /home/user/gamecart/backend
cd /home/user/gamecart/backend
```

### 3. Copy Files from Repository
```bash
# Copy all backend files
git clone your_repo.git
cd your_repo/backend
```

### 4. Create .env File
```bash
nano .env
# Paste the configuration above (change passwords!)
# Press Ctrl+O, Enter, Ctrl+X to save
```

### 5. Install Dependencies
```bash
npm install
```

### 6. Test Configuration
```bash
npm run dev
# Should start on http://localhost:3001
# Test: curl http://localhost:3001/api/health
```

### 7. Start Production Server
```bash
# Option 1: Using npm
npm start

# Option 2: Using PM2 (recommended for production)
npm install -g pm2
pm2 start index.js --name "gamecart-backend"
pm2 save
pm2 startup
```

### 8. Verify It's Running on Port 20291
```bash
lsof -i :20291
# Should show node.js listening on port 20291
```

---

## Steps to Set Environment Variables on Vercel

### 1. Go to Vercel Dashboard
```
https://vercel.com/dashboard
```

### 2. Select Your Project
```
diaaa (or your project name)
```

### 3. Go to Settings
```
Project Settings → Environment Variables
```

### 4. Add Variables
- Copy each variable from the list above
- Paste Name and Value
- Click Save
- Repeat for all variables

### 5. Redeploy Project
```
Click the Redeploy button or wait for automatic deployment
```

---

## Verify Connection is Working

### Test 1: Backend Health Check
```bash
curl http://51.75.118.165:20291/api/health
```

Expected Response:
```json
{
  "status": "OK",
  "timestamp": "2024-12-20T10:00:00.000Z"
}
```

### Test 2: Get Games
```bash
curl http://51.75.118.165:20291/api/games
```

Expected Response:
```json
[
  {
    "id": "game_1",
    "name": "Valorant",
    "price": "0",
    ...
  },
  ...
]
```

### Test 3: Admin Login
```bash
curl -X POST http://51.75.118.165:20291/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diaaldeen.com","password":"your_password"}'
```

Expected Response:
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "email": "admin@diaaldeen.com"
  }
}
```

### Test 4: Frontend Can Reach Backend
1. Visit `https://diaaa.vercel.app`
2. Open DevTools (F12)
3. Go to Network tab
4. Reload page
5. Should see requests to `51.75.118.165:20291`
6. Should see responses with data

---

## Important Security Notes

⚠️ **CHANGE THESE VALUES:**
- `JWT_SECRET` - Generate a random string
- `ADMIN_PASSWORD` - Use a strong password
- `SESSION_SECRET` - Already provided but can change

✅ **KEEP SECURE:**
- Database password - Don't share
- Admin credentials - Don't expose
- JWT secret - Treat like password

🔒 **PRODUCTION CHECKLIST:**
- [ ] Change JWT_SECRET to random string
- [ ] Change ADMIN_PASSWORD to strong password
- [ ] Enable HTTPS/SSL
- [ ] Whitelist Vercel IP in firewall
- [ ] Setup firewall to allow port 20291
- [ ] Monitor server logs
- [ ] Setup automated backups
- [ ] Enable database encryption

---

## Troubleshooting

### Issue: "Cannot connect to database"
**Solution:**
1. Verify DATABASE_URL is correct
2. Check network connectivity to Supabase
3. Verify firewall allows port 5432 outbound
4. Check database credentials

### Issue: "Port 20291 already in use"
**Solution:**
```bash
# Find what's using the port
lsof -i :20291
# Kill the process (if it's wrong)
kill -9 PID
# Then restart your app
```

### Issue: "CORS error on frontend"
**Solution:**
1. Verify FRONTEND_URL in backend .env
2. Verify Vercel domain is in CORS_ORIGIN
3. Check vercel.json has CORS headers
4. Restart backend after env changes

### Issue: "Admin login not working"
**Solution:**
1. Verify ADMIN_EMAIL is correct
2. Verify ADMIN_PASSWORD is correct
3. Check JWT_SECRET is set
4. Verify database connection works

---

## File Checklist

### Backend Files Needed
```
backend/
├── index.js ........................ Main server file
├── package.json ................... Dependencies
├── .env ........................... Environment (CREATE THIS!)
├── .env.example ................... Template (reference)
├── Procfile ....................... Deployment config
└── uploads/ ....................... Image directory
```

### Files Already Created
- ✅ `.env.example` - Template file
- ✅ `.env.development` - Development config
- ✅ `.env.production` - Production reference
- ✅ `vercel.json` - Proxy configuration
- ✅ Frontend `.env` files

### What You Need to Do
- [ ] Create `.env` file on server
- [ ] Set environment variables in Vercel
- [ ] Deploy backend to 51.75.118.165
- [ ] Test connection
- [ ] Go live!

---

## Database Connection Details

```
Service: Supabase PostgreSQL
Host: db.enzhpcamsryehittbwuf.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: 4EnM3zwzADEJ$Qw
Connection String: postgresql://postgres:4EnM3zwzADEJ$Qw@db.enzhpcamsryehittbwuf.supabase.co:5432/postgres
```

---

## Quick Links

- **Vercel Dashboard:** https://vercel.com/dashboard
- **Supabase Dashboard:** https://app.supabase.com
- **Server SSH:** ssh user@51.75.118.165
- **Frontend:** https://diaaa.vercel.app
- **Backend API:** http://51.75.118.165:20291

---

## Support

Need help?
1. Check `VERCEL_BACKEND_CONNECTION_GUIDE.md`
2. Check `DEPLOYMENT_CHECKLIST.md`
3. Check server logs for errors
4. Verify all env variables are set
5. Test API endpoints with curl

---

**Status: Ready to Deploy ✅**

All configuration files are prepared and documented.
Follow the steps above to deploy and your application will be live!

---

**Created: December 20, 2025**
**Updated: Production Ready**
