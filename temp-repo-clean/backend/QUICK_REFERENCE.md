# GameCart Backend - Quick Reference Card

## 🚀 Getting Started (5 minutes)

### Windows
```powershell
cd backend
.\setup.bat
npm run dev
# Visit: http://localhost:3001
```

### Mac/Linux
```bash
cd backend
bash setup.sh
npm run dev
# Visit: http://localhost:3001
```

---

## 📋 Key Files

| File | Purpose |
|------|---------|
| `index.js` | Main server (40+ API endpoints) |
| `package.json` | Dependencies & scripts |
| `.env.example` | Environment template |
| `Procfile` | Katabump config |
| `README.md` | Quick start |
| `API_DOCUMENTATION.md` | Complete API reference |
| `KATABUMP_DEPLOYMENT_GUIDE.md` | Deploy to Katabump |
| `ARCHITECTURE.md` | System architecture |
| `SETUP_SUMMARY.md` | Full setup summary |

---

## 🔌 API Endpoints (Most Used)

### Games
```
GET    /api/games                    # Get all
POST   /api/admin/games              # Create
PUT    /api/admin/games/:id          # Update
DELETE /api/admin/games/:id          # Delete
GET    /api/games/:id                # Get one
GET    /api/games/slug/:slug         # Get by slug
GET    /api/games/popular            # Get popular
```

### Categories
```
GET    /api/categories               # Get all
POST   /api/admin/categories         # Create
PUT    /api/admin/categories/:id     # Update
DELETE /api/admin/categories/:id     # Delete
```

### Utilities
```
GET    /api/search                   # Search
GET    /api/admin/stats              # Statistics
POST   /api/admin/upload             # Upload file
GET    /api/admin/export             # Backup
POST   /api/admin/import             # Restore
```

---

## 💾 Data Files

```
backend/
├── data/
│   ├── games.json         # All games (auto-created)
│   └── categories.json    # All categories (auto-created)
└── uploads/               # Images (auto-created)
    └── image-123456.jpg
```

---

## 🌍 Environment Variables

```env
PORT=3001                               # Server port
NODE_ENV=development                    # dev or production
FRONTEND_URL=http://localhost:5173      # Frontend URL
```

### For Katabump Production
```env
PORT=3001
NODE_ENV=production
FRONTEND_URL=https://gamecart.vercel.app
```

---

## 🎯 Common Tasks

### Create a Game
```bash
curl -X POST http://localhost:3001/api/admin/games \
  -F "name=Game Name" \
  -F "slug=game-slug" \
  -F "description=Description" \
  -F "price=99.99" \
  -F "currency=EGP" \
  -F "category=shooters" \
  -F "isPopular=true" \
  -F "stock=100" \
  -F "image=@/path/to/image.jpg"
```

### Update Game Price
```bash
curl -X PUT http://localhost:3001/api/admin/games/game_1 \
  -H "Content-Type: application/json" \
  -d '{"price": "129.99", "stock": 50}'
```

### Get All Games
```bash
curl http://localhost:3001/api/games
```

### Search Games
```bash
# By name
curl "http://localhost:3001/api/search?q=valorant"

# By category & price
curl "http://localhost:3001/api/search?category=shooters&maxPrice=100"

# In stock only
curl "http://localhost:3001/api/search?inStock=true"
```

### Get Stats
```bash
curl http://localhost:3001/api/admin/stats
```

### Backup Data
```bash
curl http://localhost:3001/api/admin/export > backup.json
```

---

## 🔗 Frontend Integration

### 1. Create API client
```typescript
// client/src/lib/backendApi.ts
const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

export const gamesApi = {
  getAll: () => fetch(`${API_BASE_URL}/api/games`).then(r => r.json()),
  create: (formData) => fetch(`${API_BASE_URL}/api/admin/games`, {
    method: 'POST',
    body: formData
  }).then(r => r.json()),
};
```

### 2. Use in React
```tsx
import { gamesApi } from '@/lib/backendApi';

export function GamesPage() {
  const [games, setGames] = useState([]);

  useEffect(() => {
    gamesApi.getAll().then(setGames);
  }, []);

  return (
    <div>
      {games.map(game => (
        <div key={game.id}>
          <h3>{game.name}</h3>
          <p>Price: {game.price} {game.currency}</p>
        </div>
      ))}
    </div>
  );
}
```

### 3. Create Game Form
```tsx
async function handleSubmit(e) {
  e.preventDefault();
  const formData = new FormData(e.target);
  const newGame = await gamesApi.create(formData);
  console.log('Game created:', newGame);
}

return (
  <form onSubmit={handleSubmit}>
    <input name="name" placeholder="Game Name" required />
    <input name="slug" placeholder="Slug" required />
    <input name="price" type="number" />
    <input name="image" type="file" />
    <button type="submit">Create Game</button>
  </form>
);
```

---

## 📦 Deployment to Katabump

### 1. Push to GitHub
```bash
git add .
git commit -m "Add GameCart backend"
git push
```

### 2. Connect on Katabump
- Go to katabump.com
- Create new app
- Select repo & set root: `backend`
- Add env vars (see .env.example)
- Deploy!

### 3. Update Frontend
```env
# .env.production
VITE_API_URL=https://your-app.katabump.com
```

### 4. Redeploy Frontend
```bash
git push  # Vercel auto-deploys
```

---

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| Port already in use | `PORT=3002 npm run dev` |
| CORS errors | Update `FRONTEND_URL` in .env |
| Images not loading | Check `/uploads` directory exists |
| Data not saving | Check file permissions |
| Upload fails | Verify multer dependency |

---

## 🔒 Security Checklist (Production)

- [ ] Add API key authentication
- [ ] Enable HTTPS (Katabump auto-enables)
- [ ] Add rate limiting
- [ ] Validate all inputs
- [ ] Add logging
- [ ] Set up monitoring
- [ ] Regular backups
- [ ] Update dependencies

---

## 📊 Stats Endpoint Response

```json
{
  "totalGames": 10,
  "totalCategories": 5,
  "totalStock": 500,
  "totalValue": 50000,
  "popularGames": 3,
  "lowStockGames": 2
}
```

---

## 🎯 NPM Scripts

```bash
npm install      # Install dependencies
npm run dev      # Start dev server (with auto-reload)
npm start        # Start production server
npm run build    # Build (not needed for Node.js)
```

---

## 💡 Tips & Tricks

1. **Test locally first** before deploying
2. **Use Postman/Insomnia** for API testing
3. **Check browser console** for CORS errors
4. **Backup data regularly** using export endpoint
5. **Monitor Katabump logs** for errors
6. **Use FormData** for file uploads from frontend

---

## 📞 Need Help?

- **API Issues**: See `API_DOCUMENTATION.md`
- **Deployment**: See `KATABUMP_DEPLOYMENT_GUIDE.md`
- **Frontend Integration**: See `FRONTEND_INTEGRATION.ts`
- **Architecture**: See `ARCHITECTURE.md`
- **Admin Dashboard**: See `ADMIN_DASHBOARD_EXAMPLE.tsx`

---

## ✨ What You Get

✅ 40+ REST API endpoints  
✅ Full CRUD for games & categories  
✅ Image upload & management  
✅ Real-time inventory control  
✅ Search & filtering  
✅ Dashboard statistics  
✅ Data export/import  
✅ Ready for production  
✅ Complete documentation  
✅ React component examples  

---

**Happy Coding! 🎮**

Start with: `npm run dev`
Then visit: `http://localhost:3001`
