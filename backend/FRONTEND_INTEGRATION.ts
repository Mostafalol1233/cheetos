// Example integration with React frontend
// Save this as: client/src/lib/backendApi.ts

const API_BASE_URL = process.env.VITE_API_URL || 'http://localhost:3001';

// Helper function for API calls
export const apiCall = async (
  endpoint: string,
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
) => {
  const options: RequestInit = {
    method,
    headers: {
      'Content-Type': 'application/json',
    },
  };

  if (data && method !== 'GET') {
    options.body = JSON.stringify(data);
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, options);
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// Helper for multipart requests (file uploads)
export const apiCallMultipart = async (
  endpoint: string,
  formData: FormData,
  method: 'POST' | 'PUT' = 'POST'
) => {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'API request failed');
  }

  return response.json();
};

// ==================== GAMES API ====================

export const gamesApi = {
  // Get all games
  getAll: () => apiCall('/api/games'),

  // Get game by ID
  getById: (id: string) => apiCall(`/api/games/${id}`),

  // Get game by slug
  getBySlug: (slug: string) => apiCall(`/api/games/slug/${slug}`),

  // Get popular games
  getPopular: () => apiCall('/api/games/popular'),

  // Get games by category
  getByCategory: (category: string) => apiCall(`/api/games/category/${category}`),

  // Create game with image
  create: (formData: FormData) => apiCallMultipart('/api/admin/games', formData),

  // Update game
  update: (id: string, formData: FormData) => 
    apiCallMultipart(`/api/admin/games/${id}`, formData, 'PUT'),

  // Delete game
  delete: (id: string) => apiCall(`/api/admin/games/${id}`, 'DELETE'),

  // Bulk update stock
  updateStock: (updates: { id: string; stock: number }[]) =>
    apiCall('/api/admin/games-bulk/stock', 'PUT', { updates }),
};

// ==================== CATEGORIES API ====================

export const categoriesApi = {
  // Get all categories
  getAll: () => apiCall('/api/categories'),

  // Get category by ID
  getById: (id: string) => apiCall(`/api/categories/${id}`),

  // Create category
  create: (formData: FormData) => apiCallMultipart('/api/admin/categories', formData),

  // Update category
  update: (id: string, formData: FormData) =>
    apiCallMultipart(`/api/admin/categories/${id}`, formData, 'PUT'),

  // Delete category
  delete: (id: string) => apiCall(`/api/admin/categories/${id}`, 'DELETE'),
};

// ==================== SEARCH & FILTER API ====================

export const searchApi = {
  search: (params: {
    q?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    inStock?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.category) queryParams.append('category', params.category);
    if (params.minPrice) queryParams.append('minPrice', params.minPrice.toString());
    if (params.maxPrice) queryParams.append('maxPrice', params.maxPrice.toString());
    if (params.inStock) queryParams.append('inStock', 'true');

    return apiCall(`/api/search?${queryParams.toString()}`);
  },
};

// ==================== ADMIN API ====================

export const adminApi = {
  // Get dashboard stats
  getStats: () => apiCall('/api/admin/stats'),

  // Export all data
  exportData: () => apiCall('/api/admin/export'),

  // Import data
  importData: (data: { games: any[]; categories?: any[] }) =>
    apiCall('/api/admin/import', 'POST', data),

  // Upload file
  uploadFile: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiCallMultipart('/api/admin/upload', formData);
  },
};

// ==================== HEALTH CHECK ====================

export const healthCheck = () => apiCall('/api/health');
