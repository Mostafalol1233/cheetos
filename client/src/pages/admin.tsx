import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Trash2, Edit, Plus, MessageSquare } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';

interface Game {
  id: string;
  name: string;
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

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('games');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');

  // Fetch games
  const { data: games = [] } = useQuery({
    queryKey: ['/api/games'],
    queryFn: () => fetch('/api/games').then(res => res.json())
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ['/api/categories'],
    queryFn: () => fetch('/api/categories').then(res => res.json())
  });

  // Fetch all chats
  const { data: allChats = [], refetch: refetchChats } = useQuery({
    queryKey: ['/api/chat/all'],
    queryFn: () => fetch('/api/chat/all').then(res => res.json()),
    enabled: activeTab === 'chats'
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const res = await fetch(`/api/admin/games/${gameId}`, { method: 'DELETE' });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async (game: Partial<Game> & { id: string }) => {
      const res = await fetch(`/api/admin/games/${game.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
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
      const res = await fetch('/api/admin/games', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(gameData)
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
    }
  });

  // Send reply mutation
  const replyMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/chat/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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

  const sessionChats = selectedSession ? allChats.filter((msg: ChatMessage) => msg.sessionId === selectedSession) : [];

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gold-primary mb-8">Diaa Eldeen Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="games">Games & Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="chats">Support Chat</TabsTrigger>
          </TabsList>

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
                      <Button variant="outline" size="sm" className="flex-1">
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </Button>
                      <Button variant="destructive" size="sm" className="flex-1">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
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
        </Tabs>
      </div>
    </div>
  );
}
