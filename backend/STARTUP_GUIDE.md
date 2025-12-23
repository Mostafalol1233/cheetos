# 🎮 GameCart Backend - Startup Guide

## Quick Start (5 minutes)

### Windows Users
```bash
cd backend
.\start.bat
```

### Mac/Linux Users
```bash
cd backend
bash start.sh
```

### Manual Start
```bash
cd backend
npm install
npm start
```

## Expected Output

When the backend starts successfully, you should see:

```
╔════════════════════════════════════════╗
║     GameCart Backend Server             ║
║     Running on port 3001                ║
║     Environment: development            ║
╚════════════════════════════════════════╝

API Documentation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Games:
  GET    /api/games                  - Get all games
  GET    /api/games/:id              - Get game by ID
  ...
```

## Verify Backend is Working

### Test 1: Health Check
```bash
curl http://localhost:3001/api/health
```

Expected response:
```json
{"status":"OK","timestamp":"2025-12-20T..."}
```

### Test 2: Get All Games
```bash
curl http://localhost:3001/api/games
```

Expected response:
```json
[
  {"id":"game_1","name":"Valorant",...},
  {"id":"game_2","name":"CS:GO",...}
]
```

### Test 3: Get Categories
```bash
curl http://localhost:3001/api/categories
```

Expected response:
```json
[
  {"id":"cat_1","name":"Shooters",...},
  {"id":"cat_2","name":"RPG",...}
]
```

## Environment Variables

The backend uses these variables from `.env`:

- `PORT` - Server port (default: 3001)
- `NODE_ENV` - Environment (development/production)
- `FRONTEND_URL` - Frontend URL for CORS
- `JWT_SECRET` - JWT signing key
- `ADMIN_EMAIL` - Admin email
- `ADMIN_PASSWORD` - Admin password

## Troubleshooting

### "Port 3001 already in use"
```bash
# Use a different port
PORT=3002 npm start

# Or kill the process using port 3001
# Windows: netstat -ano | findstr :3001
# Mac/Linux: lsof -i :3001
```

### "Cannot find module 'express'"
```bash
npm install
```

### "Data directories not found"
The backend automatically creates:
- `data/` - For games.json and categories.json
- `uploads/` - For uploaded images

### CORS errors from frontend
Check that `FRONTEND_URL` in `.env` matches your frontend URL:
- Development: `http://localhost:5173`
- Production: `https://diaaa.vercel.app`

## File Locations

- **Server code**: `backend/index.js`
- **Config**: `backend/.env`
- **Games data**: `backend/data/games.json` (auto-created)
- **Categories data**: `backend/data/categories.json` (auto-created)
- **Uploads**: `backend/uploads/` (auto-created)

## API Base URL

- **Development**: `http://localhost:3001`
- **Production**: `http://51.75.118.165:20291` or Katabump URL

## Default Admin Credentials

- **Email**: `admin@diaaldeen.com`
- **Password**: `admin123`

⚠️ Change these in production!

## Next Steps

1. ✅ Start backend with `npm start`
2. ✅ Test with `/api/health`
3. ✅ Connect frontend to backend
4. ✅ Create test games
5. ✅ Deploy to production

## Documentation

- Full API docs: `API_DOCUMENTATION.md`
- Deployment: `KATABUMP_DEPLOYMENT_GUIDE.md`
- Architecture: `ARCHITECTURE.md`
- Integration: `FRONTEND_INTEGRATION.ts`

---

**Backend is ready! 🚀**
