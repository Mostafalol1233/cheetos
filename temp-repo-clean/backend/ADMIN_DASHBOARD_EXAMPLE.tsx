// Admin Dashboard Example Component
// Save this as: client/src/components/admin-dashboard.tsx

import { useState, useEffect, ReactNode } from 'react';
import { adminApi, gamesApi, categoriesApi } from '@/lib/backendApi';

interface Stats {
  totalGames: number;
  totalCategories: number;
  totalStock: number;
  totalValue: number;
  popularGames: number;
  lowStockGames: number;
}

interface Game {
  id: string;
  name: string;
  slug: string;
  price: string;
  stock: number;
  [key: string]: any;
}

interface FormData {
  [key: string]: string | boolean | File | null;
}

export function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadStats = async () => {
      try {
        setLoading(true);
        const data = await adminApi.getStats();
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load stats');
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  if (loading) return <div>Loading statistics...</div>;
  if (error) return <div className="text-red-600">Error: {error}</div>;
  if (!stats) return <div>No data available</div>;

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
      <StatCard label="Total Games" value={stats.totalGames} />
      <StatCard label="Categories" value={stats.totalCategories} />
      <StatCard label="Total Stock" value={stats.totalStock} />
      <StatCard label="Total Value" value={`${stats.totalValue.toLocaleString()}`} />
      <StatCard label="Popular Games" value={stats.popularGames} />
      <StatCard label="Low Stock" value={stats.lowStockGames} className="text-yellow-600" />
    </div>
  );
}

function StatCard({ 
  label, 
  value, 
  className = '' 
}: { 
  label: string; 
  value: string | number; 
  className?: string;
}) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow">
      <p className="text-sm text-gray-600">{label}</p>
      <p className={`text-2xl font-bold ${className}`}>{value}</p>
    </div>
  );
}

// ==================== CREATE GAME FORM ====================

interface GameFormProps {
  onSuccess?: () => void;
}

export function CreateGameForm({ onSuccess }: GameFormProps) {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    slug: '',
    description: '',
    price: '0',
    currency: 'EGP',
    category: 'shooters',
    isPopular: false,
    stock: '50',
  });
  const [image, setImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
    const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;
    setFormData((prev: FormData) => ({ ...prev, [name]: val }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImage(e.target.files?.[0] || null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const form = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        form.append(key, String(value));
      });

      if (image) {
        form.append('image', image);
      }

      await gamesApi.create(form);
      setSuccess(true);
      setFormData({
        name: '',
        slug: '',
        description: '',
        price: '0',
        currency: 'EGP',
        category: 'shooters',
        isPopular: false,
        stock: '50',
      });
      setImage(null);
      onSuccess?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create game');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-lg border bg-white p-6">
      <h2 className="text-xl font-bold">Create New Game</h2>

      {error && <div className="rounded bg-red-100 p-3 text-red-700">{error}</div>}
      {success && <div className="rounded bg-green-100 p-3 text-green-700">Game created successfully!</div>}

      <input
        type="text"
        name="name"
        placeholder="Game Name"
        value={formData.name}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />

      <input
        type="text"
        name="slug"
        placeholder="Game Slug (URL-friendly)"
        value={formData.slug}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
      />

      <textarea
        name="description"
        placeholder="Description"
        value={formData.description}
        onChange={handleChange}
        required
        className="w-full border px-3 py-2 rounded"
        rows={3}
      />

      <input
        type="number"
        name="price"
        placeholder="Price"
        value={formData.price}
        onChange={handleChange}
        step="0.01"
        className="w-full border px-3 py-2 rounded"
      />

      <select
        name="currency"
        value={formData.currency}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      >
        <option value="EGP">EGP</option>
        <option value="USD">USD</option>
        <option value="EUR">EUR</option>
      </select>

      <select
        name="category"
        value={formData.category}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      >
        <option value="shooters">Shooters</option>
        <option value="rpg">RPG</option>
        <option value="casual">Casual</option>
      </select>

      <input
        type="number"
        name="stock"
        placeholder="Stock"
        value={formData.stock}
        onChange={handleChange}
        className="w-full border px-3 py-2 rounded"
      />

      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          name="isPopular"
          checked={formData.isPopular}
          onChange={handleChange}
        />
        <span>Mark as Popular</span>
      </label>

      <input
        type="file"
        accept="image/*"
        onChange={handleImageChange}
        className="w-full"
      />
      {image && <p className="text-sm text-gray-600">Selected: {image.name}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Creating...' : 'Create Game'}
      </button>
    </form>
  );
}

// ==================== GAMES MANAGEMENT TABLE ====================

interface Game {
  id: string;
  name: string;
  price: string;
  stock: number;
  category: string;
  isPopular: boolean;
}

export function GamesTable() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadGames = async () => {
      try {
        const data = await gamesApi.getAll();
        setGames(data as Game[]);
      } catch (err) {
        console.error('Failed to load games:', err);
      } finally {
        setLoading(false);
      }
    };

    loadGames();
  }, []);

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this game?')) {
      try {
        await gamesApi.delete(id);
        setGames((games: Game[]) => games.filter((g: Game) => g.id !== id));
      } catch (err) {
        console.error('Failed to delete game:', err);
      }
    }
  };

  if (loading) return <div>Loading games...</div>;

  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 text-left">Name</th>
            <th className="px-4 py-2 text-left">Category</th>
            <th className="px-4 py-2 text-right">Price</th>
            <th className="px-4 py-2 text-right">Stock</th>
            <th className="px-4 py-2 text-center">Popular</th>
            <th className="px-4 py-2 text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {games.map(game => (
            <tr key={game.id} className="border-t hover:bg-gray-50">
              <td className="px-4 py-2">{game.name}</td>
              <td className="px-4 py-2">{game.category}</td>
              <td className="px-4 py-2 text-right">{game.price}</td>
              <td className={`px-4 py-2 text-right ${game.stock < 10 ? 'text-orange-600 font-bold' : ''}`}>
                {game.stock}
              </td>
              <td className="px-4 py-2 text-center">
                {game.isPopular ? '⭐' : '-'}
              </td>
              <td className="px-4 py-2 text-center">
                <button
                  onClick={() => handleDelete(game.id)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
