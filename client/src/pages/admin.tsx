import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit, Plus, MessageSquare, Bell, Check, AlertCircle, Info, Search, Package, Shield, ShoppingCart } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

interface Game {
  id: string;
  name: string;
  slug?: string;
  price: string;
  stock: number;
  category: string;
  image: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'support';
  message: string;
  sessionId: string;
  timestamp: number;
}

interface Alert {
  id: number;
  type: 'stock' | 'system' | 'order' | 'security';
  priority: 'low' | 'medium' | 'high';
  summary: string;
  details: any;
  timestamp: number;
  read: boolean;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('games');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsLimit, setCardsLimit] = useState(20);
  const [newCardGameId, setNewCardGameId] = useState<string>('');
  const [newCardCode, setNewCardCode] = useState('');
  const [alertStatus, setAlertStatus] = useState<string>('all');
  const [alertType, setAlertType] = useState<string>('all');
  const [alertSearch, setAlertSearch] = useState('');

  // Fetch games
  const { data: games = [] } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/admin/alerts', alertStatus, alertType, alertSearch],
    enabled: activeTab === 'alerts',
    refetchInterval: 5000, // Real-time updates
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const params = new URLSearchParams();
      if (alertStatus !== 'all') params.append('status', alertStatus);
      if (alertType !== 'all') params.append('type', alertType);
      if (alertSearch) params.append('q', alertSearch);
      
      const res = await fetch(`/api/admin/alerts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return await res.json();
    }
  });

  // Mark alert as read mutation
  const markAlertReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`/api/admin/alerts/${id}/read`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
    }
  });

  // Fetch game cards (admin)
  const { data: cardsResponse } = useQuery<{ items: Array<{ id: string; game_id: string; card_code: string; is_used: boolean; created_at: string }>; page: number; limit: number; total: number }>({
    queryKey: ['/api/admin/game-cards', `?page=${cardsPage}&limit=${cardsLimit}`],
    enabled: activeTab === 'cards',
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`/api/admin/game-cards?page=${cardsPage}&limit=${cardsLimit}`,
        { headers: token ? { Authorization: `Bearer ${token}` } : undefined }
      );
      return await res.json();
    }
  });
  const gameCards = cardsResponse?.items || [];
  const gameCardsTotal = cardsResponse?.total || 0;

  // Fetch all chats
  const { data: allChats = [], refetch: refetchChats } = useQuery<ChatMessage[]>({
    queryKey: ['/api/chat/all'],
    enabled: activeTab === 'chats'
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/games/${gameId}`, { 
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async (game: Partial<Game> & { id: string }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(game)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      setEditingGame(null);
    }
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameData: Omit<Game, 'id'>) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(gameData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    }
  });

  // Create game card mutation
  const createCardMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      if (!newCardGameId || !newCardCode.trim() || newCardCode.trim().length > 200) {
        throw new Error('Invalid card data');
      }
      const res = await fetch('/api/admin/game-cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ game_id: newCardGameId, card_code: newCardCode.trim() })
      });
      return await res.json();
    },
    onSuccess: () => {
      setNewCardCode('');
      setNewCardGameId('');
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-cards'] });
    }
  });

  // Update game card mutation (mark used / update code)
  const updateCardMutation = useMutation({
    mutationFn: async (payload: { id: string; is_used?: boolean; card_code?: string }) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`/api/admin/game-cards/${payload.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(payload)
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-cards'] });
    }
  });

  // Delete game card
  const deleteCardMutation = useMutation({
    mutationFn: async (id: string) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`/api/admin/game-cards/${id}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-cards'] });
    }
  });

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          sender: 'support',
          message: replyMessage,
          sessionId: selectedSession
        })
      });
      return res.json();
    },
    onSuccess: () => {
      setReplyMessage('');
      refetchChats();
      queryClient.invalidateQueries({ queryKey: [`/api/admin/chat/${selectedSession}`] });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/categories/${categoryId}`, {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    }
  });

  // Update category mutation
  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; slug?: string; description?: string; gradient?: string; icon?: string; image?: string }) => {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.slug) formData.append('slug', data.slug);
      if (data.description) formData.append('description', data.description);
      if (data.gradient) formData.append('gradient', data.gradient);
      if (data.icon) formData.append('icon', data.icon);
      if (data.image) formData.append('image', data.image);
      
      const res = await fetch(`/api/admin/categories/${data.id}`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Failed to update category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    }
  });

  const handleDeleteGame = (gameId: string) => {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGameMutation.mutate(gameId);
    }
  };

  const handleUpdateGameStock = (game: Game, newStock: number) => {
    updateGameMutation.mutate({ ...game, stock: newStock });
  };

  const handleCreateGame = () => {
    const name = prompt('Game name:');
    if (name) {
      createGameMutation.mutate({
        name,
        price: '99.99',
        stock: 50,
        category: 'online-games',
        image: '/placeholder.jpg'
      });
    }
  };

  // Fetch chat messages for selected session
  const { data: sessionMessages = [] } = useQuery<ChatMessage[]>({
    queryKey: [`/api/admin/chat/${selectedSession}`],
    enabled: !!selectedSession && activeTab === 'chats',
    refetchInterval: 2000,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/chat/${selectedSession}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  });

  const sessionChats = sessionMessages;

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/upload', {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });
      const data = await res.json();
      if (data.url && editingGame) {
        setEditingGame({ ...editingGame, image: data.url });
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gold-primary mb-8">Diaa Eldeen Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-8">
            <TabsTrigger value="games">Games & Products</TabsTrigger>
            <TabsTrigger value="packages">Packages</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="cards">Game Cards</TabsTrigger>
            <TabsTrigger value="chats">Support Chat</TabsTrigger>
            <TabsTrigger value="chat-widget">Chat Widget</TabsTrigger>
            <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
            <TabsTrigger value="alerts">
              Alerts
              {alerts.some(a => !a.read) && (
                <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              )}
            </TabsTrigger>
          </TabsList>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-foreground">System Alerts</h2>
                <div className="flex gap-2">
                  <Select value={alertStatus} onValueChange={setAlertStatus}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="read">Read</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={alertType} onValueChange={setAlertType}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                      <SelectItem value="order">Order</SelectItem>
                      <SelectItem value="security">Security</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search alerts..."
                      value={alertSearch}
                      onChange={(e) => setAlertSearch(e.target.value)}
                      className="pl-8 w-[200px]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid gap-4">
                {alerts.length === 0 ? (
                  <Card className="bg-card/50 border-gold-primary/30 p-8 text-center text-muted-foreground">
                    No alerts found matching your criteria.
                  </Card>
                ) : (
                  alerts.map((alert) => (
                    <Card key={alert.id} className={`bg-card/50 border-gold-primary/30 ${!alert.read ? 'border-l-4 border-l-gold-primary' : ''}`}>
                      <CardContent className="p-6 flex items-start justify-between gap-4">
                        <div className="flex gap-4">
                          <div className={`p-2 rounded-full ${
                            alert.priority === 'high' ? 'bg-red-500/20 text-red-500' :
                            alert.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-500' :
                            'bg-blue-500/20 text-blue-500'
                          }`}>
                            {alert.type === 'stock' ? <Package className="w-5 h-5" /> :
                             alert.type === 'security' ? <Shield className="w-5 h-5" /> :
                             alert.type === 'order' ? <ShoppingCart className="w-5 h-5" /> :
                             <AlertCircle className="w-5 h-5" />}
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <h3 className="font-semibold text-lg">{alert.summary}</h3>
                              {!alert.read && (
                                <span className="bg-gold-primary/20 text-gold-primary text-xs px-2 py-0.5 rounded-full">New</span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {new Date(alert.timestamp).toLocaleString()} • {alert.type.toUpperCase()}
                            </p>
                            {alert.details && (
                              <div className="mt-2 text-xs bg-muted/50 p-2 rounded overflow-x-auto max-w-2xl font-mono">
                                {typeof alert.details === 'string' ? alert.details : JSON.stringify(alert.details, null, 2)}
                              </div>
                            )}
                          </div>
                        </div>
                        {!alert.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAlertReadMutation.mutate(alert.id)}
                            className="text-muted-foreground hover:text-foreground shrink-0"
                          >
                            <Check className="w-4 h-4 mr-2" />
                            Mark as Read
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Games Tab */}
          <TabsContent value="games" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Games</h2>
              <Button onClick={handleCreateGame} className="bg-gold-primary hover:bg-gold-primary/80">
                <Plus className="w-4 h-4 mr-2" />
                Add New Game
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game: Game) => (
                <Card key={game.id} className="bg-card/50 border-gold-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      <p className="text-lg font-bold text-gold-primary">{game.price} EGP</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Stock</p>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          value={game.stock}
                          onChange={(e) => handleUpdateGameStock(game, parseInt(e.target.value))}
                          className="w-20"
                        />
                        <span className="text-sm text-foreground">{game.stock} items</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Category</p>
                      <p className="text-sm">{game.category}</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingGame(game)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteGame(game.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Packages Tab */}
          <TabsContent value="packages" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Packages</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game: Game) => (
                <Card key={game.id} className="bg-card/50 border-gold-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button
                      variant="outline"
                      className="w-full"
                      onClick={() => {
                        window.location.href = `/admin/packages/${game.id}`;
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Manage Packages
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Categories Tab */}
          <TabsContent value="categories" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Categories</h2>
              <Button className="bg-gold-primary hover:bg-gold-primary/80">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat: Category) => (
                <Card key={cat.id} className="bg-card/50 border-gold-primary/30">
                  <CardHeader>
                    <CardTitle>{cat.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">ID: {cat.id}</p>
                    <p className="text-sm text-muted-foreground">Slug: {cat.slug}</p>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          const name = prompt('Category name:', cat.name);
                          if (name) {
                            updateCategoryMutation.mutate({ id: cat.id, name });
                          }
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm" 
                        className="flex-1"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete "${cat.name}"?`)) {
                            deleteCategoryMutation.mutate(cat.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Game Cards Tab */}
          <TabsContent value="cards" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Manage Game Cards</h2>
              <div className="flex items-center gap-2">
                <Select value={newCardGameId} onValueChange={setNewCardGameId}>
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {games.map((g) => (
                      <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  value={newCardCode}
                  onChange={(e) => setNewCardCode(e.target.value)}
                  placeholder="Card code"
                  className="w-64"
                />
                <Button
                  onClick={() => createCardMutation.mutate()}
                  disabled={!newCardGameId || !newCardCode.trim() || newCardCode.trim().length > 200 || createCardMutation.isPending}
                  className="bg-gold-primary hover:bg-gold-primary/80"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Card
                </Button>
              </div>
            </div>

            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Cards Inventory</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead>
                      <tr className="text-muted-foreground">
                        <th className="text-left p-2">Code</th>
                        <th className="text-left p-2">Game</th>
                        <th className="text-left p-2">Used</th>
                        <th className="text-left p-2">Created</th>
                        <th className="text-left p-2">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gameCards.map((c) => {
                        const gameName = games.find(g => g.id === c.game_id)?.name || '—';
                        return (
                          <tr key={c.id} className="border-t border-gold-primary/20">
                            <td className="p-2 font-mono">{c.card_code}</td>
                            <td className="p-2">{gameName}</td>
                            <td className="p-2">{c.is_used ? 'Yes' : 'No'}</td>
                            <td className="p-2">{new Date(c.created_at).toLocaleString()}</td>
                            <td className="p-2 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateCardMutation.mutate({ id: c.id, is_used: !c.is_used })}
                              >
                                {c.is_used ? 'Mark Unused' : 'Mark Used'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteCardMutation.mutate(c.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        );
                      })}
                      {gameCards.length === 0 && (
                        <tr>
                          <td className="p-4 text-center text-muted-foreground" colSpan={5}>No cards found.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <div className="text-xs text-muted-foreground">Total: {gameCardsTotal}</div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCardsPage(p => Math.max(1, p - 1))}
                      disabled={cardsPage <= 1}
                    >
                      Prev
                    </Button>
                    <span className="text-sm">Page {cardsPage}</span>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const maxPage = Math.max(1, Math.ceil(gameCardsTotal / cardsLimit));
                        setCardsPage(p => Math.min(maxPage, p + 1));
                      }}
                      disabled={cardsPage >= Math.ceil(gameCardsTotal / cardsLimit)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Chat Tab */}
          <TabsContent value="chats" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Customer Support Chat</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Sessions List */}
              <div className="lg:col-span-1">
                <Card className="bg-card/50 border-gold-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Sessions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {Array.from(new Set(allChats.map((msg: ChatMessage) => msg.sessionId))).map((sessionId) => (
                          <Button
                            key={sessionId}
                            variant={selectedSession === sessionId ? 'default' : 'outline'}
                            onClick={() => setSelectedSession(sessionId as string)}
                            className="w-full justify-start text-xs"
                          >
                            <MessageSquare className="w-4 h-4 mr-2" />
                            {(sessionId as string).substring(0, 12)}...
                          </Button>
                        ))}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Messages */}
              <div className="lg:col-span-2">
                {selectedSession ? (
                  <Card className="bg-card/50 border-gold-primary/30 h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">Chat: {(selectedSession as string).substring(0, 12)}...</CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1 mb-4 p-4 border rounded-lg border-gold-primary/20">
                        <div className="space-y-3">
                          {sessionChats.map((msg: ChatMessage) => (
                            <div
                              key={msg.id}
                              className={`p-3 rounded-lg ${
                                msg.sender === 'user'
                                  ? 'bg-blue-900/30 text-blue-100 ml-8'
                                  : 'bg-green-900/30 text-green-100 mr-8'
                              }`}
                            >
                              <p className="text-sm font-bold">{msg.sender === 'user' ? 'Customer' : 'You'}</p>
                              <p className="text-sm">{msg.message}</p>
                              <p className="text-xs opacity-60 mt-1">
                                {new Date(msg.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>

                      {/* Reply Form */}
                      <div className="flex gap-2">
                        <Input
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          placeholder="Type your reply..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && replyMessage.trim()) {
                              replyMutation.mutate();
                            }
                          }}
                        />
                        <Button
                          onClick={() => replyMutation.mutate()}
                          disabled={!replyMessage.trim() || replyMutation.isPending}
                          className="bg-gold-primary"
                        >
                          Send
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card/50 border-gold-primary/30 h-96 flex items-center justify-center">
                    <p className="text-muted-foreground">Select a chat session to view messages</p>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          {/* Chat Widget Config Tab */}
          <TabsContent value="chat-widget" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Live Chat Widget Configuration</h2>
            </div>

            <ChatWidgetConfigPanel />
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Integration</h2>
            <p className="text-sm text-muted-foreground mb-4">Manage your connected WhatsApp number and send test messages.</p>

            {/* Connection Status */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <WhatsAppConnectionPanel />
              </CardContent>
            </Card>

            {/* Seller Alerts */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Seller Alerts</CardTitle>
              </CardHeader>
              <CardContent>
                <SellerAlertsPanel />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Game Dialog */}
      <Dialog open={!!editingGame} onOpenChange={(open) => !open && setEditingGame(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update game info and image. You can paste a URL or upload an image.
            </DialogDescription>
          </DialogHeader>
          {editingGame && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">Name</Label>
                <Input
                  id="name"
                  value={editingGame.name}
                  onChange={(e) => setEditingGame({ ...editingGame, name: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="slug" className="text-right">Slug</Label>
                <Input
                  id="slug"
                  value={editingGame.slug || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, slug: e.target.value })}
                  placeholder="Auto-generated if empty"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="price" className="text-right">Price</Label>
                <Input
                  id="price"
                  value={editingGame.price}
                  onChange={(e) => setEditingGame({ ...editingGame, price: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountPrice" className="text-right">Discount Price</Label>
                <Input
                  id="discountPrice"
                  type="number"
                  value={(editingGame as any).discountPrice || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, discountPrice: e.target.value || null } as any)}
                  placeholder="Optional - shows as strikethrough"
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="stock" className="text-right">Stock</Label>
                <Input
                  id="stock"
                  type="number"
                  value={editingGame.stock}
                  onChange={(e) => setEditingGame({ ...editingGame, stock: parseInt(e.target.value) || 0 })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="category" className="text-right">Category</Label>
                <Select
                  value={editingGame.category}
                  onValueChange={(val) => setEditingGame({ ...editingGame, category: val })}
                >
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c.id} value={c.slug}>{c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image" className="text-right">Image URL</Label>
                <Input
                  id="image"
                  value={editingGame.image}
                  onChange={(e) => setEditingGame({ ...editingGame, image: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Upload</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="col-span-3"
                />
              </div>
              {editingGame.image && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <img src={editingGame.image} alt="Preview" className="h-32 object-contain rounded-md border" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGame(null)}>Cancel</Button>
            <Button type="submit" onClick={() => updateGameMutation.mutate(editingGame as Game)}>Save changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ChatWidgetConfigPanel() {
  const [enabled, setEnabled] = useState(true);
  const [iconUrl, setIconUrl] = useState('/images/message-icon.svg');
  const [welcomeMessage, setWelcomeMessage] = useState('Hello! How can we help you?');
  const [position, setPosition] = useState('bottom-right');

  // Fetch config
  const { data: config } = useQuery({
    queryKey: ['/api/admin/chat-widget/config'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/chat-widget/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    onSuccess: (data) => {
      if (data) {
        setEnabled(data.enabled !== false);
        setIconUrl(data.iconUrl || '/images/message-icon.svg');
        setWelcomeMessage(data.welcomeMessage || 'Hello! How can we help you?');
        setPosition(data.position || 'bottom-right');
      }
    }
  });

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/chat-widget/config', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(configData)
      });
      if (!res.ok) throw new Error('Failed to update config');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat-widget/config'] });
      queryClient.invalidateQueries({ queryKey: ['/api/chat-widget/config'] });
    }
  });

  const handleSave = () => {
    updateConfigMutation.mutate({
      enabled,
      iconUrl,
      welcomeMessage,
      position
    });
  };

  return (
    <Card className="bg-card/50 border-gold-primary/30">
      <CardHeader>
        <CardTitle>Widget Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Enable Widget</Label>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(e) => setEnabled(e.target.checked)}
            className="w-4 h-4"
          />
        </div>
        <div>
          <Label>Icon URL</Label>
          <Input
            value={iconUrl}
            onChange={(e) => setIconUrl(e.target.value)}
            placeholder="/images/message-icon.svg"
          />
          {iconUrl && (
            <div className="mt-2 border rounded p-2">
              <img src={iconUrl} alt="Icon preview" className="w-16 h-16 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
          )}
        </div>
        <div>
          <Label>Welcome Message</Label>
          <Input
            value={welcomeMessage}
            onChange={(e) => setWelcomeMessage(e.target.value)}
            placeholder="Hello! How can we help you?"
          />
        </div>
        <div>
          <Label>Position</Label>
          <Select value={position} onValueChange={setPosition}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bottom-right">Bottom Right</SelectItem>
              <SelectItem value="bottom-left">Bottom Left</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={handleSave} disabled={updateConfigMutation.isPending} className="bg-gold-primary">
          Save Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function WhatsAppConnectionPanel() {
  const { data: cfg } = useQuery<{ connected: boolean; phoneNumberId: string | null }>({
    queryKey: ['/api/admin/whatsapp/config'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/whatsapp/config', {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch WhatsApp config');
      return res.json();
    }
  });
  const [to, setTo] = useState('');
  const [text, setText] = useState('Hello from Diaa Eldeen!');
  const sendMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch('/api/admin/whatsapp/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to, text })
      });
      return res.json();
    }
  });

  return (
    <div className="space-y-3">
      <p className="text-sm">Connected: <span className={cfg?.connected ? 'text-green-500' : 'text-red-500'}>{cfg?.connected ? 'Yes' : 'No'}</span></p>
      <p className="text-sm">Phone Number ID: <span className="font-mono">{cfg?.phoneNumberId || 'not set'}</span></p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-2">
        <Input placeholder="Recipient (E.164)" value={to} onChange={(e) => setTo(e.target.value)} />
        <Input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} />
        <Button onClick={() => sendMutation.mutate()} disabled={!to || !text} className="bg-gold-primary">Send Test</Button>
      </div>
      {!cfg?.connected && (
        <p className="text-xs text-muted-foreground">Set WHATSAPP_TOKEN, WHATSAPP_PHONE_NUMBER_ID, and WHATSAPP_VERIFY_TOKEN in backend environment.</p>
      )}
    </div>
  );
}

function SellerAlertsPanel() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const { data: alerts = [], refetch } = useQuery<Array<{ id: string; type: string; summary: string; created_at: string; read: boolean; flagged: boolean }>>({
    queryKey: ['/api/admin/alerts'],
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await fetch('/api/admin/alerts', { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      return res.json();
    }
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/alerts/${id}/read`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      return res.json();
    },
    onSuccess: () => refetch()
  });

  const flagAlert = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/alerts/${id}/flag`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      return res.json();
    },
    onSuccess: () => refetch()
  });

  return (
    <div className="space-y-2">
      {alerts.length === 0 ? (
        <p className="text-sm text-muted-foreground">No alerts yet.</p>
      ) : (
        alerts.map((a) => (
          <div key={a.id} className="flex items-center justify-between border rounded-lg p-3 text-sm">
            <div>
              <p className="font-medium">{(a.type ? String(a.type) : '').replace('_', ' ') || 'alert'}</p>
              <p className="text-muted-foreground">{a.summary}</p>
              <p className="text-xs">{new Date(a.created_at).toLocaleString()}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => markRead.mutate(a.id)} disabled={a.read}>Mark Read</Button>
              <Button variant="secondary" size="sm" onClick={() => flagAlert.mutate(a.id)} disabled={a.flagged}>Flag</Button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
