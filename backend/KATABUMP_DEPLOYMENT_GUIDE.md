# GameCart Backend - Deployment Guide

## Overview
Complete guide for deploying GameCart backend to Katabump and connecting it with Vercel frontend.

## Architecture

```
┌─────────────────────────────────────────────────┐
│        Frontend (Vercel)                         │
│   https://gamecart.vercel.app                    │
└────────────────────┬────────────────────────────┘
                     │
                     │ API Calls
                     │ (HTTPS)
                     ▼
┌─────────────────────────────────────────────────┐
│        Backend (Katabump)                        │
│   https://gamecart.katabump.com                  │
│   - Games Management                             │
│   - Categories Management                        │
│   - Image Uploads                                │
│   - Inventory Control                            │
│   - Search & Filtering                           │
└─────────────────────────────────────────────────┘
```

## Step 1: Prepare Backend for Katabump

### 1.1 Ensure correct directory structure
```
your-repo/
├── backend/
│   ├── index.js
│   ├── package.json
│   ├── Procfile
│   ├── .env.example
│   ├── data/
│   └── uploads/
├── client/
├── server/
└── ...
```

### 1.2 Verify Procfile exists
File: `backend/Procfile`
```
web: node index.js
```

### 1.3 Update package.json
File: `backend/package.json`
- Ensure `"type": "module"` is set for ES modules
- All dependencies are listed
- Start script is: `"start": "node index.js"`

### 1.4 Create .gitignore
File: `backend/.gitignore`
```
node_modules/
uploads/*
!uploads/.gitkeep
data/*
!data/.gitkeep
.env
.DS_Store
```

## Step 2: Deploy to Katabump

### 2.1 Create Katabump Account
1. Go to [katabump.com](https://katabump.com)
2. Sign up for free account
3. Connect your GitHub

### 2.2 Create New App
1. Click "Create App"
2. Select your GitHub repository
3. Configure deployment:
   - **Branch**: `main` (or your branch)
   - **Root Directory**: `backend`
   - **Build Command**: Leave empty (Node auto-detected)
   - **Start Command**: Leave empty (uses Procfile)

### 2.3 Set Environment Variables
In Katabump dashboard → Settings → Environment Variables:

```
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://gamecart.vercel.app
```

Replace `gamecart.vercel.app` with your actual Vercel domain.

### 2.4 Deploy
1. Click "Deploy" button
2. Wait for deployment to complete (usually 2-5 minutes)
3. Get your backend URL: `https://your-app.katabump.com`

## Step 3: Verify Backend Deployment

### 3.1 Test API
Open in browser or use curl:
```bash
curl https://your-app.katabump.com/api/health
```

Expected response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-20T10:30:00.000Z"
}
```

### 3.2 Test API endpoints
```bash
# Get all games
curl https://your-app.katabump.com/api/games

# Get categories
curl https://your-app.katabump.com/api/categories

# Get stats
curl https://your-app.katabump.com/api/admin/stats
```

## Step 4: Update Frontend Configuration

### 4.1 Update environment variables
File: `.env.production`
```
VITE_API_URL=https://your-app.katabump.com
VITE_BACKEND_URL=https://your-app.katabump.com
```

File: `.env.development`
```
VITE_API_URL=http://localhost:3001
VITE_BACKEND_URL=http://localhost:3001
```

### 4.2 Update API client
File: `client/src/lib/api.ts` (or similar)
```typescript
export const API_BASE_URL = 
  process.env.VITE_API_URL || 'http://localhost:3001';

// Or with more flexibility:
export const API_BASE_URL = 
  import.meta.env.PROD 
    ? 'https://your-app.katabump.com'
    : 'http://localhost:3001';
```

### 4.3 Update all API calls
Replace hardcoded URLs with `API_BASE_URL`:

```typescript
// ❌ Don't do this:
fetch('http://localhost:3001/api/games')

// ✅ Do this:
fetch(`${API_BASE_URL}/api/games`)
```

### 4.4 Update CORS if needed
If frontend URL is different, update backend CORS:
File: `backend/index.js`
```javascript
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'https://gamecart.vercel.app', // Add your Vercel URL
  ],
  credentials: true
}));
```

Then redeploy backend.

## Step 5: Connect Frontend & Backend

### 5.1 Deploy frontend changes
```bash
# In frontend/root directory
git add .
git commit -m "Update API endpoints for production"
git push
```

Vercel will auto-deploy.

### 5.2 Test integration
1. Visit your Vercel app: `https://gamecart.vercel.app`
2. Check browser console for any errors
3. Try creating a game in admin panel
4. Verify data is saved

## Step 6: Image Upload Configuration

### 6.1 Verify uploads work
1. In admin panel, try uploading a game image
2. Check if image appears in game details
3. Verify file in backend: `backend/uploads/`

### 6.2 Serve images
Images are served at: `https://your-app.katabump.com/uploads/filename.jpg`

Update any hardcoded image paths if needed.

## Step 7: Database/Data Management

### 7.1 Current setup (JSON files)
- Games stored in: `backend/data/games.json`
- Categories stored in: `backend/data/categories.json`
- Images stored in: `backend/uploads/`

### 7.2 Backup data
Use admin panel:
```bash
# Export
GET https://your-app.katabump.com/api/admin/export

# Download JSON and save
```

### 7.3 Restore data
```bash
# Upload JSON file
POST https://your-app.katabump.com/api/admin/import
```

### 7.4 Migrate to database (Optional)
For production with more data, migrate to MongoDB:

File: `backend/index.js`
```javascript
// Add MongoDB connection
import { MongoClient } from 'mongodb';

const MONGO_URL = process.env.MONGODB_URL;
const client = new MongoClient(MONGO_URL);
const db = client.db('gamecart');
const games = db.collection('games');

// Then replace file operations with MongoDB calls
```

Update Katabump env vars:
```
MONGODB_URL=mongodb+srv://user:pass@cluster.mongodb.net/gamecart
```

## Step 8: Troubleshooting

### Issue: CORS errors in frontend
**Solution:**
1. Check frontend URL in backend CORS config
2. Add frontend URL to `FRONTEND_URL` in Katabump env vars
3. Redeploy backend

### Issue: Images not loading
**Solution:**
1. Check image path in frontend: `/uploads/filename.jpg`
2. Verify file exists in Katabump filesystem
3. Check backend logs for upload errors

### Issue: Data not persisting
**Solution:**
1. Check file permissions on Katabump
2. Verify `data/` and `uploads/` directories exist
3. Check disk space
4. Review backend logs

### Issue: App crashes after deployment
**Solution:**
1. Check Katabump logs: Dashboard → Logs
2. Verify all dependencies in `package.json`
3. Check environment variables
4. Ensure port is 3001 (or set in `PORT` env var)

### Get backend logs
```bash
# In Katabump dashboard
Dashboard → App Name → Logs

# Or use Katabump CLI if available
```

## Step 9: Security Considerations

⚠️ **Important for Production:**

### 9.1 Add authentication
```javascript
// backend/middleware/auth.js
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.API_KEY) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

// Use on admin routes
app.delete('/api/admin/games/:id', authMiddleware, ...);
```

### 9.2 Add API key to Katabump
```
API_KEY=your-secret-key-123456
```

### 9.3 Enable HTTPS only
Katabump auto-enables HTTPS. Redirect HTTP to HTTPS in frontend.

### 9.4 Rate limiting
Install `express-rate-limit`:
```bash
npm install express-rate-limit
```

Add to backend:
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

app.use('/api/', limiter);
```

## Step 10: Continuous Integration/Deployment

### 10.1 Automatic deployments
- Katabump automatically deploys when you push to GitHub
- Use this workflow:
  1. Make changes locally
  2. Test with `npm run dev`
  3. Commit: `git commit -m "..."`
  4. Push: `git push`
  5. Katabump auto-deploys

### 10.2 Revert to previous version
In Katabump dashboard, use deployment history to rollback.

## Quick Reference

| Task | Command |
|------|---------|
| Local dev | `cd backend && npm run dev` |
| Install deps | `npm install` |
| Build | `npm start` |
| Export data | `curl https://api.katabump.com/api/admin/export` |
| Check logs | Katabump Dashboard → Logs |
| Update env vars | Katabump Dashboard → Settings |
| Restart app | Katabump Dashboard → Restart |

## Support

Need help? Resources:
- Katabump docs: https://katabump.com/docs
- Express.js: https://expressjs.com
- Vercel: https://vercel.com/docs

---

**🎮 Your GameCart backend is now live!**

Frontend: `https://gamecart.vercel.app`
Backend: `https://your-app.katabump.com`
