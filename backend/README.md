# GameCart Backend

Node.js backend for the GameCart gaming ecommerce platform.

## Quick Start

```bash
npm install
npm run dev
```

Server runs on port 3001 by default.

## Project Structure

```
backend/
├── index.js                   # Main backend server
├── package.json              # Dependencies
├── .env.example              # Environment variables template
├── API_DOCUMENTATION.md      # Complete API reference
├── Procfile                  # Katabump deployment config
├── data/
│   ├── games.json           # Games database (JSON)
│   └── categories.json       # Categories database (JSON)
└── uploads/                 # Uploaded images directory
```

## Key Features

- ✅ Full CRUD for games & categories
- ✅ Image upload with multer
- ✅ Inventory management
- ✅ Price & package configuration
- ✅ Search & filtering
- ✅ Dashboard statistics
- ✅ Data export/import
- ✅ CORS-enabled for frontend
- ✅ Error handling
- ✅ JSON-based persistence

## Environment Variables

Copy `.env.example` to `.env`:

```env
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

## API Endpoints

### Games
- `GET /api/games` - Get all games
- `GET /api/games/:id` - Get game by ID
- `POST /api/admin/games` - Create game
- `PUT /api/admin/games/:id` - Update game
- `DELETE /api/admin/games/:id` - Delete game

### Categories
- `GET /api/categories` - Get all categories
- `POST /api/admin/categories` - Create category
- `PUT /api/admin/categories/:id` - Update category
- `DELETE /api/admin/categories/:id` - Delete category

### Utilities
- `GET /api/search` - Search games
- `GET /api/admin/stats` - Get statistics
- `POST /api/admin/upload` - Upload files
- `GET /api/admin/export` - Export data
- `POST /api/admin/import` - Import data

## Deployment on Katabump

1. Connect your GitHub repository
2. Set deployment root to `backend` folder
3. Add environment variables:
   - `NODE_ENV=production`
   - `FRONTEND_URL=https://your-vercel-app.vercel.app`
4. Deploy!

## Frontend Integration

Update your frontend to use the backend API:

```typescript
const API_BASE_URL = 'https://your-katabump-app.com';

// Fetch games
const response = await fetch(`${API_BASE_URL}/api/games`);
const games = await response.json();
```

## File Upload Example

```typescript
const form = new FormData();
form.append('name', 'Game Name');
form.append('slug', 'game-slug');
form.append('description', 'Description');
form.append('price', '99.99');
form.append('currency', 'EGP');
form.append('category', 'shooters');
form.append('isPopular', 'true');
form.append('stock', '100');
form.append('image', imageFile);

const response = await fetch(`${API_BASE_URL}/api/admin/games`, {
  method: 'POST',
  body: form
});

const newGame = await response.json();
```

## License

MIT
