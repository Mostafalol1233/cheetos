# GameCart Backend API Documentation

## Overview
Complete Node.js + Express backend for GameCart - a gaming ecommerce platform. Manage games, categories, inventory, pricing, and images all through RESTful API endpoints.

## Features
✅ Complete CRUD operations for games and categories  
✅ Image upload and management  
✅ Real-time inventory management  
✅ Price and package management  
✅ Search and filtering capabilities  
✅ Dashboard statistics  
✅ Data export/import for backup  
✅ CORS enabled for frontend integration  
✅ File upload with multer  
✅ JSON-based data persistence  

## Installation

### 1. Navigate to backend directory
```bash
cd backend
```

### 2. Install dependencies
```bash
npm install
```

### 3. Create .env file
```bash
cp .env.example .env
```

### 4. Configure environment variables
Edit `.env`:
```
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:5173
```

### 5. Start the server
```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Server will run on `http://localhost:3001`

## Deployment on Katabump

### 1. Create Procfile
```bash
web: node index.js
```

### 2. Push to git repository
```bash
git add .
git commit -m "Add GameCart backend"
git push
```

### 3. Deploy on Katabump
- Connect your GitHub repository
- Select the `backend` folder as root directory
- Set environment variables in Katabump dashboard:
  - `NODE_ENV=production`
  - `PORT=3001`
  - `FRONTEND_URL=https://your-vercel-frontend.vercel.app`
- Deploy!

Your backend will be available at: `https://your-app.katabump.com`

## API Endpoints

### 📋 Games Management

#### Get All Games
```http
GET /api/games
```
Returns all games in the system.

#### Get Game by ID
```http
GET /api/games/:id
```
Parameters:
- `id` - Game ID

#### Get Game by Slug
```http
GET /api/games/slug/:slug
```
Parameters:
- `slug` - Game slug (URL-friendly name)

#### Get Popular Games
```http
GET /api/games/popular
```
Returns games marked as popular.

#### Get Games by Category
```http
GET /api/games/category/:category
```
Parameters:
- `category` - Category name or ID

#### Create Game
```http
POST /api/admin/games
Content-Type: multipart/form-data

{
  "name": "Game Name",
  "slug": "game-slug",
  "description": "Game description",
  "price": "99.99",
  "currency": "EGP",
  "category": "shooters",
  "isPopular": true,
  "stock": 100,
  "packages": ["Standard", "Deluxe"],
  "packagePrices": ["99.99", "149.99"],
  "image": <file>
}
```

#### Update Game
```http
PUT /api/admin/games/:id
Content-Type: multipart/form-data

{
  "name": "Updated Name",
  "price": "129.99",
  "stock": 50,
  "image": <file> (optional)
}
```

#### Delete Game
```http
DELETE /api/admin/games/:id
```

#### Bulk Update Stock
```http
PUT /api/admin/games-bulk/stock

{
  "updates": [
    { "id": "game_1", "stock": 50 },
    { "id": "game_2", "stock": 30 }
  ]
}
```

### 📂 Categories Management

#### Get All Categories
```http
GET /api/categories
```

#### Get Category by ID
```http
GET /api/categories/:id
```

#### Create Category
```http
POST /api/admin/categories
Content-Type: multipart/form-data

{
  "name": "Category Name",
  "slug": "category-slug",
  "description": "Description",
  "gradient": "from-red-600 to-orange-600",
  "icon": "Crosshair",
  "image": <file>
}
```

#### Update Category
```http
PUT /api/admin/categories/:id
Content-Type: multipart/form-data

{
  "name": "Updated Name",
  "gradient": "from-blue-600 to-cyan-600",
  "image": <file> (optional)
}
```

#### Delete Category
```http
DELETE /api/admin/categories/:id
```

### 🔍 Search & Filter

#### Search Games
```http
GET /api/search?q=valorant&category=shooters&minPrice=0&maxPrice=100&inStock=true
```
Query Parameters:
- `q` - Search query
- `category` - Filter by category
- `minPrice` - Minimum price
- `maxPrice` - Maximum price
- `inStock` - Show only in-stock items (true/false)

### 📊 Dashboard & Admin

#### Get Statistics
```http
GET /api/admin/stats
```
Returns:
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

#### Export All Data
```http
GET /api/admin/export
```
Returns complete backup of games and categories.

#### Import Data
```http
POST /api/admin/import

{
  "games": [...],
  "categories": [...]
}
```

#### Upload File
```http
POST /api/admin/upload
Content-Type: multipart/form-data

{
  "file": <file>
}
```
Returns:
```json
{
  "message": "File uploaded successfully",
  "filename": "file-123456.jpg",
  "path": "/uploads/file-123456.jpg",
  "url": "/uploads/file-123456.jpg"
}
```

### 🏥 Health Check
```http
GET /api/health
```

## Data Storage

Data is stored in JSON files:
- `data/games.json` - All games
- `data/categories.json` - All categories

Uploaded files are stored in:
- `uploads/` - User-uploaded images

## Frontend Integration

### Update Frontend API URL

In your Vercel frontend, update the API base URL to point to your Katabump backend:

**React/Vite:**
```typescript
// src/lib/api.ts or similar
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://your-app.katabump.com';

// Example API call
const response = await fetch(`${API_BASE_URL}/api/games`);
const games = await response.json();
```

**Environment Variables (.env):**
```
VITE_API_URL=https://your-app.katabump.com
```

## Example: Creating a Game with Frontend

```typescript
const createGame = async (formData: FormData) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/games`, {
    method: 'POST',
    body: formData // FormData handles multipart/form-data
  });
  return response.json();
};

// Usage
const form = new FormData();
form.append('name', 'Valorant');
form.append('slug', 'valorant');
form.append('description', 'Tactical shooter');
form.append('price', '0');
form.append('currency', 'EGP');
form.append('category', 'shooters');
form.append('isPopular', 'true');
form.append('stock', '100');
form.append('image', imageFile);

await createGame(form);
```

## Example: Updating Game Stock

```typescript
const updateStock = async (id: string, stock: number) => {
  const response = await fetch(`${API_BASE_URL}/api/admin/games/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ stock })
  });
  return response.json();
};
```

## Error Handling

All error responses follow this format:
```json
{
  "message": "Error description",
  "error": "Detailed error message (development only)"
}
```

Status codes:
- `200` - Success
- `201` - Created
- `400` - Bad request
- `404` - Not found
- `500` - Server error

## Limitations & Notes

1. **Data Storage**: Uses JSON files. For large scale, migrate to MongoDB/PostgreSQL
2. **File Size**: Max 50MB per file
3. **Concurrent Operations**: Single-threaded, OK for small-medium projects
4. **Authentication**: No auth middleware included (add as needed)
5. **Rate Limiting**: Not implemented (add for production)

## Security Considerations

Before going to production:
1. Add authentication/authorization middleware
2. Implement rate limiting
3. Add input validation (currently basic)
4. Enable HTTPS only
5. Add request logging
6. Implement API key authentication
7. Add password protection to admin endpoints

## Troubleshooting

### Port already in use
```bash
# Change PORT in .env or use:
PORT=3002 npm run dev
```

### CORS errors
- Check `FRONTEND_URL` in .env
- Ensure frontend URL is in CORS whitelist in `index.js`

### File upload not working
- Check `uploads/` directory exists
- Verify file permissions
- Check `Content-Type: multipart/form-data` in request

### Data not persisting
- Check `data/` directory exists and is writable
- Verify JSON file permissions
- Check disk space

## Support & Documentation

For more information:
- Express.js docs: https://expressjs.com
- Multer docs: https://github.com/expressjs/multer
- CORS docs: https://github.com/expressjs/cors

---

**Happy Gaming! 🎮**
