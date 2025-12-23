# ⚡ Quick Reference Card - Diaa Eldeen Gaming Store

## 🚀 Quick Deploy Guide

### Frontend (Vercel - Already Done ✅)
```
✅ vercel.json configured
✅ .env files created
✅ No action needed
```

### Backend (51.75.118.165:20291 - Ready to Deploy)
```bash
# 1. SSH into server
ssh user@51.75.118.165

# 2. Copy backend files
cd /home/user/gamecart
git clone <your-repo>
cd gamecart/backend

# 3. Create .env (use values below)
nano .env

# 4. Install and start
npm install
npm start

# 5. Verify
curl http://51.75.118.165:20291/api/health
```

---

## 🔧 Environment Configuration

### Backend .env (Copy & Paste)
```env
PORT=20291
NODE_ENV=production
DATABASE_URL="postgresql://postgres:4EnM3zwzADEJ\\$Qw@db.enzhpcamsryehittbwuf.supabase.co:5432/postgres"
SESSION_SECRET="SSNH+DUx59yMjok+evGVGKV9HfP0uBsRBOAE5cJdShuutgHmpSM8XmLVaszzVHYh/RZe5neFERb0lkwpyp4Fzw=="
JWT_SECRET="your_jwt_secret_key"
ADMIN_EMAIL="admin@diaaldeen.com"
ADMIN_PASSWORD="your_secure_password"
CORS_ORIGIN="https://diaaa.vercel.app"
FRONTEND_URL="https://diaaa.vercel.app"
API_URL="http://51.75.118.165:20291"
```

---

## 📍 API Endpoints

### Public (No Auth)
```
GET    /api/games                   Get all games
GET    /api/games/:id               Get game by ID
GET    /api/categories              Get categories
GET    /api/search?q=name           Search
GET    /api/health                  Check health
```

### Admin (Need JWT Token)
```
POST   /api/auth/login              Login with email/password
POST   /api/admin/games             Create game
PUT    /api/admin/games/:id         Edit game
DELETE /api/admin/games/:id         Delete game
POST   /api/admin/categories        Create category
```

---

## 🧪 Test Commands

### Health Check
```bash
curl http://51.75.118.165:20291/api/health
```
**Expected:** `{"status": "OK", "timestamp": "..."}`

### Get Games
```bash
curl http://51.75.118.165:20291/api/games
```
**Expected:** Array of games

### Admin Login
```bash
curl -X POST http://51.75.118.165:20291/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diaaldeen.com","password":"your_password"}'
```
**Expected:** `{"success": true, "token": "eyJ..."}`

---

## 🔐 Admin Credentials

```
Email: admin@diaaldeen.com
Password: (from your .env file)
```

### First Login
1. Visit `https://diaaa.vercel.app/admin`
2. Enter email and password
3. Get JWT token
4. Use token for admin operations

---

## 🛠️ Troubleshooting

| Problem | Solution |
|---------|----------|
| Port 20291 blocked | Check firewall rules |
| Cannot connect to DB | Verify DATABASE_URL |
| Login fails | Check ADMIN_EMAIL/PASSWORD |
| CORS error | Verify CORS_ORIGIN in .env |
| Images not loading | Check /uploads directory exists |

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `FINAL_STATUS.md` | Complete overview (START HERE) |
| `DEPLOYMENT_CHECKLIST.md` | Step-by-step checklist |
| `ENV_SETUP_GUIDE.md` | Environment setup |
| `VERCEL_BACKEND_CONNECTION_GUIDE.md` | Technical guide |
| `DEPLOYMENT_SUMMARY.md` | Changes made |

---

## 🎯 Deployment Checklist

- [ ] Backend files copied to 51.75.118.165
- [ ] .env file created with production values
- [ ] npm install completed
- [ ] npm start running on port 20291
- [ ] Health check passes
- [ ] Admin login works
- [ ] Frontend can reach backend
- [ ] Games load properly
- [ ] Admin can create/edit/delete
- [ ] Images upload works
- [ ] Ready for users!

---

## 📱 Frontend Settings (Vercel)

These are already set in vercel.json and .env files:
```
VITE_API_URL=http://51.75.118.165:20291
VITE_BACKEND_URL=http://51.75.118.165:20291
```

No additional action needed for Vercel!

---

## 🔄 Data Flow

```
User visits: https://diaaa.vercel.app
            ↓
Frontend sends request: /api/games
            ↓
vercel.json routes to: http://51.75.118.165:20291/api/games
            ↓
Backend processes request
            ↓
Connects to Supabase PostgreSQL
            ↓
Returns games as JSON
            ↓
Frontend displays games
```

---

## 💾 Database

```
Service: Supabase PostgreSQL
Host: db.enzhpcamsryehittbwuf.supabase.co
Port: 5432
Database: postgres
User: postgres
Password: 4EnM3zwzADEJ$Qw
```

---

## 🌐 Live URLs

```
Frontend: https://diaaa.vercel.app
Backend: http://51.75.118.165:20291
Admin: https://diaaa.vercel.app/admin
Health: http://51.75.118.165:20291/api/health
```

---

## ⚡ Shortcuts

### Restart Backend (on server)
```bash
pm2 restart gamecart-backend
# or
ps aux | grep node
kill -9 <PID>
npm start
```

### View Server Logs
```bash
tail -f /var/log/gamecart.log
# or
pm2 logs gamecart-backend
```

### Test API (with auth)
```bash
TOKEN=$(curl -X POST http://51.75.118.165:20291/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@diaaldeen.com","password":"xxx"}' | jq -r .token)

curl http://51.75.118.165:20291/api/admin/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## ✅ Success Indicators

All should return data:
```bash
curl http://51.75.118.165:20291/api/games
curl http://51.75.118.165:20291/api/categories
curl http://51.75.118.165:20291/api/health
```

Admin login should work:
```bash
curl -X POST http://51.75.118.165:20291/api/auth/login \
  -d '{"email":"admin@diaaldeen.com","password":"xxx"}'
```

Frontend should load:
```
https://diaaa.vercel.app
```

---

## 📞 Support Resources

- **API Docs:** backend/API_DOCUMENTATION.md
- **Architecture:** backend/ARCHITECTURE.md
- **Setup:** backend/README.md
- **Deployment:** DEPLOYMENT_CHECKLIST.md

---

## 🎮 Game Management

### Create Game (via API)
```bash
curl -X POST http://51.75.118.165:20291/api/admin/games \
  -H "Authorization: Bearer $TOKEN" \
  -F "name=Game Name" \
  -F "slug=game-slug" \
  -F "price=99.99" \
  -F "category=shooters" \
  -F "stock=100" \
  -F "image=@game.jpg"
```

### Update Game
```bash
curl -X PUT http://51.75.118.165:20291/api/admin/games/game_id \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"price":"149.99","stock":50}'
```

### Delete Game
```bash
curl -X DELETE http://51.75.118.165:20291/api/admin/games/game_id \
  -H "Authorization: Bearer $TOKEN"
```

---

## 📊 Admin Dashboard Features

✅ View Statistics
✅ Manage Games (CRUD)
✅ Manage Categories
✅ Upload Images
✅ Search Products
✅ View Orders
✅ Export Data
✅ Import Data

---

**Everything is configured and ready to deploy!** 🚀

Start with: `FINAL_STATUS.md` for complete overview
Then read: `DEPLOYMENT_CHECKLIST.md` for step-by-step
Finally: `ENV_SETUP_GUIDE.md` for actual deployment

---

**Status: ✅ READY FOR PRODUCTION**
**Last Updated: December 20, 2025**
