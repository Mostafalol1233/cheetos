import express from 'express';
import cors from 'cors';
import multer from 'multer';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// JWT Configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your_jwt_secret_key_change_this_in_production';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@diaaldeen.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// Auth Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Middleware
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:5000',
    'http://localhost:3000',
    'https://diaaa.vercel.app',
    process.env.FRONTEND_URL || '*'
  ],
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Setup multer for file uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Database file path
const dbFilePath = path.join(__dirname, 'data', 'games.json');
const categoriesFilePath = path.join(__dirname, 'data', 'categories.json');

// Ensure data directory exists
if (!fs.existsSync(path.join(__dirname, 'data'))) {
  fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });
}

// Default data
const defaultGames = [
  {
    id: 'game_1',
    name: 'Valorant',
    slug: 'valorant',
    description: 'Tactical 5v5 team-based competitive shooter',
    price: '0',
    currency: 'EGP',
    image: '/images/valorant.jpg',
    category: 'shooters',
    isPopular: true,
    stock: 100,
    packages: [],
    packagePrices: []
  },
  {
    id: 'game_2',
    name: 'CS:GO',
    slug: 'csgo',
    description: 'Counter-Strike: Global Offensive - legendary FPS',
    price: '0',
    currency: 'EGP',
    image: '/images/csgo.jpg',
    category: 'shooters',
    isPopular: true,
    stock: 100,
    packages: [],
    packagePrices: []
  }
];

const defaultCategories = [
  {
    id: 'cat_1',
    name: 'Shooters',
    slug: 'shooters',
    description: 'First-person and third-person shooter games',
    image: '/images/shooters.jpg',
    gradient: 'from-red-600 to-orange-600',
    icon: 'Crosshair'
  },
  {
    id: 'cat_2',
    name: 'RPG',
    slug: 'rpg',
    description: 'Role-playing games with rich stories',
    image: '/images/rpg.jpg',
    gradient: 'from-purple-600 to-pink-600',
    icon: 'Wand2'
  },
  {
    id: 'cat_3',
    name: 'Casual',
    slug: 'casual',
    description: 'Casual and indie games',
    image: '/images/casual.jpg',
    gradient: 'from-yellow-500 to-green-500',
    icon: 'Smile'
  }
];

// Helper functions
function loadGames() {
  try {
    if (fs.existsSync(dbFilePath)) {
      const data = fs.readFileSync(dbFilePath, 'utf-8');
      return JSON.parse(data);
    }
    return defaultGames;
  } catch (error) {
    console.error('Error loading games:', error);
    return defaultGames;
  }
}

function saveGames(games) {
  try {
    fs.writeFileSync(dbFilePath, JSON.stringify(games, null, 2));
  } catch (error) {
    console.error('Error saving games:', error);
  }
}

function loadCategories() {
  try {
    if (fs.existsSync(categoriesFilePath)) {
      const data = fs.readFileSync(categoriesFilePath, 'utf-8');
      return JSON.parse(data);
    }
    return defaultCategories;
  } catch (error) {
    console.error('Error loading categories:', error);
    return defaultCategories;
  }
}

function saveCategories(categories) {
  try {
    fs.writeFileSync(categoriesFilePath, JSON.stringify(categories, null, 2));
  } catch (error) {
    console.error('Error saving categories:', error);
  }
}

// Initialize data files
if (!fs.existsSync(dbFilePath)) {
  saveGames(defaultGames);
}
if (!fs.existsSync(categoriesFilePath)) {
  saveCategories(defaultCategories);
}

// ==================== AUTHENTICATION ENDPOINTS ====================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    // Simple authentication (in production, use bcrypt for password hashing)
    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      const token = jwt.sign(
        { email, role: 'admin' },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: { email, role: 'admin' }
      });
    } else {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
  } catch (error) {
    res.status(500).json({ message: 'Login failed', error: error.message });
  }
});

// Verify Token
app.get('/api/admin/verify', authenticateToken, (req, res) => {
  try {
    res.json({
      message: 'Token is valid',
      user: req.user
    });
  } catch (error) {
    res.status(500).json({ message: 'Verification failed', error: error.message });
  }
});

// Logout (client-side token removal)
app.post('/api/admin/logout', authenticateToken, (req, res) => {
  try {
    // Token is deleted on client side
    res.json({ message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Logout failed', error: error.message });
  }
});

// ==================== GAMES ENDPOINTS ====================

// Get all games
app.get('/api/games', (req, res) => {
  try {
    const games = loadGames();
    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch games', error: error.message });
  }
});

// Get popular games
app.get('/api/games/popular', (req, res) => {
  try {
    const games = loadGames();
    const popular = games.filter(game => game.isPopular);
    res.json(popular);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch popular games', error: error.message });
  }
});

// Get games by category
app.get('/api/games/category/:category', (req, res) => {
  try {
    const { category } = req.params;
    const games = loadGames();
    const filtered = games.filter(game => game.category === category);
    res.json(filtered);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch games by category', error: error.message });
  }
});

// Get single game by slug
app.get('/api/games/slug/:slug', (req, res) => {
  try {
    const { slug } = req.params;
    const games = loadGames();
    const game = games.find(g => g.slug === slug);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch game', error: error.message });
  }
});

// Get single game by ID
app.get('/api/games/:id', (req, res) => {
  try {
    const { id } = req.params;
    const games = loadGames();
    const game = games.find(g => g.id === id);
    
    if (!game) {
      return res.status(404).json({ message: 'Game not found' });
    }
    
    res.json(game);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch game', error: error.message });
  }
});

// Create new game
app.post('/api/admin/games', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { name, slug, description, price, currency, category, isPopular, stock, packages, packagePrices } = req.body;
    const games = loadGames();

    // Check if slug already exists
    if (games.some(g => g.slug === slug)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Game with this slug already exists' });
    }

    const newGame = {
      id: `game_${Date.now()}`,
      name,
      slug,
      description,
      price: price || '0',
      currency: currency || 'EGP',
      image: req.file ? `/uploads/${req.file.filename}` : '/images/default.jpg',
      category,
      isPopular: isPopular === 'true' || isPopular === true,
      stock: parseInt(stock) || 50,
      packages: packages ? (Array.isArray(packages) ? packages : JSON.parse(packages)) : [],
      packagePrices: packagePrices ? (Array.isArray(packagePrices) ? packagePrices : JSON.parse(packagePrices)) : []
    };

    games.push(newGame);
    saveGames(games);

    res.status(201).json(newGame);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create game', error: error.message });
  }
});

// Update game
app.put('/api/admin/games/:id', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, price, currency, category, isPopular, stock, packages, packagePrices } = req.body;
    const games = loadGames();
    
    const gameIndex = games.findIndex(g => g.id === id);
    if (gameIndex === -1) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Game not found' });
    }

    const oldGame = games[gameIndex];

    // Check if new slug conflicts with another game
    if (slug && slug !== oldGame.slug && games.some(g => g.slug === slug)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Game with this slug already exists' });
    }

    // Delete old image if new one is uploaded
    if (req.file && oldGame.image && oldGame.image.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, oldGame.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const updatedGame = {
      ...oldGame,
      name: name || oldGame.name,
      slug: slug || oldGame.slug,
      description: description || oldGame.description,
      price: price !== undefined ? price : oldGame.price,
      currency: currency || oldGame.currency,
      category: category || oldGame.category,
      isPopular: isPopular !== undefined ? (isPopular === 'true' || isPopular === true) : oldGame.isPopular,
      stock: stock !== undefined ? parseInt(stock) : oldGame.stock,
      packages: packages ? (Array.isArray(packages) ? packages : JSON.parse(packages)) : oldGame.packages,
      packagePrices: packagePrices ? (Array.isArray(packagePrices) ? packagePrices : JSON.parse(packagePrices)) : oldGame.packagePrices,
      image: req.file ? `/uploads/${req.file.filename}` : oldGame.image
    };

    games[gameIndex] = updatedGame;
    saveGames(games);

    res.json(updatedGame);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update game', error: error.message });
  }
});

// Delete game
app.delete('/api/admin/games/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const games = loadGames();
    const gameIndex = games.findIndex(g => g.id === id);

    if (gameIndex === -1) {
      return res.status(404).json({ message: 'Game not found' });
    }

    const game = games[gameIndex];

    // Delete image if it exists
    if (game.image && game.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, game.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    games.splice(gameIndex, 1);
    saveGames(games);

    res.json({ message: 'Game deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete game', error: error.message });
  }
});

// Bulk update game stock
app.put('/api/admin/games-bulk/stock', authenticateToken, (req, res) => {
  try {
    const { updates } = req.body; // Array of { id, stock }
    const games = loadGames();

    updates.forEach(({ id, stock }) => {
      const game = games.find(g => g.id === id);
      if (game) {
        game.stock = parseInt(stock);
      }
    });

    saveGames(games);
    res.json({ message: 'Stock updated successfully', games });
  } catch (error) {
    res.status(400).json({ message: 'Failed to update stock', error: error.message });
  }
});

// ==================== CATEGORIES ENDPOINTS ====================

// Get all categories
app.get('/api/categories', (req, res) => {
  try {
    const categories = loadCategories();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch categories', error: error.message });
  }
});

// Get single category
app.get('/api/categories/:id', (req, res) => {
  try {
    const { id } = req.params;
    const categories = loadCategories();
    const category = categories.find(c => c.id === id);

    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch category', error: error.message });
  }
});

// Create category
app.post('/api/admin/categories', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { name, slug, description, gradient, icon } = req.body;
    const categories = loadCategories();

    if (categories.some(c => c.slug === slug)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Category with this slug already exists' });
    }

    const newCategory = {
      id: `cat_${Date.now()}`,
      name,
      slug,
      description,
      image: req.file ? `/uploads/${req.file.filename}` : '/images/default-category.jpg',
      gradient: gradient || 'from-blue-600 to-cyan-600',
      icon: icon || 'Package'
    };

    categories.push(newCategory);
    saveCategories(categories);

    res.status(201).json(newCategory);
  } catch (error) {
    res.status(400).json({ message: 'Failed to create category', error: error.message });
  }
});

// Update category
app.put('/api/admin/categories/:id', authenticateToken, upload.single('image'), (req, res) => {
  try {
    const { id } = req.params;
    const { name, slug, description, gradient, icon } = req.body;
    const categories = loadCategories();

    const catIndex = categories.findIndex(c => c.id === id);
    if (catIndex === -1) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(404).json({ message: 'Category not found' });
    }

    const oldCategory = categories[catIndex];

    if (slug && slug !== oldCategory.slug && categories.some(c => c.slug === slug)) {
      if (req.file) fs.unlinkSync(req.file.path);
      return res.status(400).json({ message: 'Category with this slug already exists' });
    }

    if (req.file && oldCategory.image && oldCategory.image.startsWith('/uploads/')) {
      const oldImagePath = path.join(__dirname, oldCategory.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
    }

    const updatedCategory = {
      ...oldCategory,
      name: name || oldCategory.name,
      slug: slug || oldCategory.slug,
      description: description || oldCategory.description,
      gradient: gradient || oldCategory.gradient,
      icon: icon || oldCategory.icon,
      image: req.file ? `/uploads/${req.file.filename}` : oldCategory.image
    };

    categories[catIndex] = updatedCategory;
    saveCategories(categories);

    res.json(updatedCategory);
  } catch (error) {
    res.status(400).json({ message: 'Failed to update category', error: error.message });
  }
});

// Delete category
app.delete('/api/admin/categories/:id', authenticateToken, (req, res) => {
  try {
    const { id } = req.params;
    const categories = loadCategories();
    const catIndex = categories.findIndex(c => c.id === id);

    if (catIndex === -1) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const category = categories[catIndex];

    if (category.image && category.image.startsWith('/uploads/')) {
      const imagePath = path.join(__dirname, category.image);
      if (fs.existsSync(imagePath)) {
        fs.unlinkSync(imagePath);
      }
    }

    categories.splice(catIndex, 1);
    saveCategories(categories);

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete category', error: error.message });
  }
});

// ==================== FILE UPLOAD & SERVE ====================

// Serve uploaded files statically
app.use('/uploads', express.static(uploadDir));

// Upload image
app.post('/api/admin/upload', authenticateToken, upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    res.json({
      message: 'File uploaded successfully',
      filename: req.file.filename,
      path: `/uploads/${req.file.filename}`,
      url: `/uploads/${req.file.filename}`
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to upload file', error: error.message });
  }
});

// ==================== DASHBOARD ENDPOINTS ====================

// Get dashboard stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const games = loadGames();
    const categories = loadCategories();

    const stats = {
      totalGames: games.length,
      totalCategories: categories.length,
      totalStock: games.reduce((sum, game) => sum + (game.stock || 0), 0),
      totalValue: games.reduce((sum, game) => sum + (parseFloat(game.price) * (game.stock || 0)), 0),
      popularGames: games.filter(g => g.isPopular).length,
      lowStockGames: games.filter(g => g.stock < 10).length
    };

    res.json(stats);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch stats', error: error.message });
  }
});

// Get all data (for export/backup)
app.get('/api/admin/export', (req, res) => {
  try {
    const games = loadGames();
    const categories = loadCategories();

    res.json({
      games,
      categories,
      exportedAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to export data', error: error.message });
  }
});

// Import data (from backup)
app.post('/api/admin/import', authenticateToken, (req, res) => {
  try {
    const { games, categories } = req.body;

    if (!games || !Array.isArray(games)) {
      return res.status(400).json({ message: 'Invalid games data' });
    }

    saveGames(games);
    if (categories && Array.isArray(categories)) {
      saveCategories(categories);
    }

    res.json({ message: 'Data imported successfully' });
  } catch (error) {
    res.status(400).json({ message: 'Failed to import data', error: error.message });
  }
});

// ==================== SEARCH & FILTER ====================

// Search games
app.get('/api/search', (req, res) => {
  try {
    const { q, category, minPrice, maxPrice, inStock } = req.query;
    let games = loadGames();

    if (q) {
      const query = q.toLowerCase();
      games = games.filter(g => 
        g.name.toLowerCase().includes(query) || 
        g.description.toLowerCase().includes(query) ||
        g.slug.toLowerCase().includes(query)
      );
    }

    if (category) {
      games = games.filter(g => g.category === category);
    }

    if (minPrice) {
      games = games.filter(g => parseFloat(g.price) >= parseFloat(minPrice));
    }

    if (maxPrice) {
      games = games.filter(g => parseFloat(g.price) <= parseFloat(maxPrice));
    }

    if (inStock === 'true') {
      games = games.filter(g => g.stock > 0);
    }

    res.json(games);
  } catch (error) {
    res.status(500).json({ message: 'Search failed', error: error.message });
  }
});

// ==================== HEALTH CHECK ====================

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'GameCart Backend API',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    endpoints: {
      games: '/api/games',
      categories: '/api/categories',
      admin: '/api/admin/*',
      search: '/api/search',
      health: '/api/health'
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ message: 'Endpoint not found' });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`
╔════════════════════════════════════════╗
║     GameCart Backend Server             ║
║     Running on port ${PORT}              ║
║     Environment: ${process.env.NODE_ENV || 'development'}         ║
╚════════════════════════════════════════╝
  `);
  console.log(`
API Documentation:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Games:
  GET    /api/games                  - Get all games
  GET    /api/games/:id              - Get game by ID
  GET    /api/games/slug/:slug       - Get game by slug
  GET    /api/games/popular          - Get popular games
  GET    /api/games/category/:cat    - Get games by category
  POST   /api/admin/games            - Create game (multipart)
  PUT    /api/admin/games/:id        - Update game (multipart)
  DELETE /api/admin/games/:id        - Delete game

Categories:
  GET    /api/categories             - Get all categories
  GET    /api/categories/:id         - Get category by ID
  POST   /api/admin/categories       - Create category (multipart)
  PUT    /api/admin/categories/:id   - Update category (multipart)
  DELETE /api/admin/categories/:id   - Delete category

Utilities:
  GET    /api/search                 - Search games (q, category, minPrice, maxPrice)
  GET    /api/admin/stats            - Dashboard statistics
  GET    /api/admin/export           - Export all data
  POST   /api/admin/import           - Import data
  POST   /api/admin/upload           - Upload file (multipart)

Health:
  GET    /api/health                 - Health check
  GET    /                            - API info
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `);
});

export default app;
