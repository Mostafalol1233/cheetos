import { useState, useEffect } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trash2, Edit, Plus, MessageSquare, Bell, Check, AlertCircle, Info, Search, Package, Shield, ShoppingCart, Wand2 } from 'lucide-react';
import { API_BASE_URL, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import QRCode from 'qrcode';

interface Game {
  id: string;
  name: string;
  slug?: string;
  price: string | number;
  discountPrice?: string | number | null;
  stock: number;
  category: string;
  image: string;
  packagesList?: Array<{
    id?: string;
    name?: string;
    amount?: string;
    price?: number;
    discountPrice?: number | null;
    discount_price?: number | null;
    image?: string | null;
  }>;
  packages?: string[];
  packagePrices?: number[];
  packageDiscountPrices?: Array<number | null>;
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

type AiPlannedAction =
  | { type: 'set_game_price'; gameSlug: string; price: number }
  | { type: 'set_game_discount'; gameSlug: string; discountPrice: number | null }
  | { type: 'set_game_stock'; gameSlug: string; stock: number }
  | { type: 'set_package_price'; gameSlug: string; packageName: string; price: number }
  | { type: 'set_package_discount'; gameSlug: string; packageName: string; discountPrice: number | null }
  | { type: 'bulk_add_cards'; gameSlug: string; cards: string[] };

const apiPath = (path: string) => (path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

export default function AdminDashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('games');
  const [searchGameTerm, setSearchGameTerm] = useState('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [packagesGameId, setPackagesGameId] = useState<string | null>(null);
  const [packagesDraft, setPackagesDraft] = useState<Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }>>([]);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsLimit, setCardsLimit] = useState(20);
  const [newCardGameId, setNewCardGameId] = useState<string>('');
  const [newCardCode, setNewCardCode] = useState('');
  const [alertStatus, setAlertStatus] = useState<string>('all');
  const [alertType, setAlertType] = useState<string>('all');
  const [alertSearch, setAlertSearch] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);

  // AI Assistant
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiPlanSource, setAiPlanSource] = useState<string>('');
  const [aiPlannedActions, setAiPlannedActions] = useState<AiPlannedAction[]>([]);
  const [aiRejected, setAiRejected] = useState<Array<{ message: string; action: any }>>([]);

  // WhatsApp & Email
  const [adminPhone, setAdminPhone] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('');
  const [testEmailSubject, setTestEmailSubject] = useState('Test from GameCart Admin');
  const [testEmailBody, setTestEmailBody] = useState('This is a test email from the admin dashboard.');

  // Fetch games
  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  const gameHasPackages = (g: any) => {
    const list = Array.isArray(g?.packagesList) ? g.packagesList : [];
    const legacy = Array.isArray(g?.packages) ? g.packages : [];
    return list.length > 0 || legacy.length > 0;
  };

  const getDerivedMinPackagePrice = (g: any) => {
    const list = Array.isArray(g?.packagesList) ? g.packagesList : [];
    const prices = list
      .map((p: any) => {
        const base = Number(p?.price || 0);
        const rawDiscount = p?.discountPrice ?? p?.discount_price;
        const discount = rawDiscount !== undefined && rawDiscount !== null && rawDiscount !== '' ? Number(rawDiscount) : null;
        if (Number.isFinite(discount) && (discount as number) > 0 && (discount as number) < base) return Number(discount);
        return base;
      })
      .filter((n: any) => Number.isFinite(n) && n > 0);

    if (!prices.length) return null;
    return Math.min(...(prices as number[]));
  };

  const { data: adminPackagesData = [], isFetching: isFetchingAdminPackages } = useQuery<Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }>>({
    queryKey: packagesGameId ? [`/api/games/${packagesGameId}/packages`] : ['_disabled_admin_packages'],
    enabled: !!packagesGameId,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${packagesGameId}/packages`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch packages');
      return Array.isArray(data) ? data : [];
    }
  });
  useEffect(() => {
    if (!packagesGameId) return;
    const normalized = (Array.isArray(adminPackagesData) ? adminPackagesData : []).map((p: any) => ({
      amount: String(p?.amount || ''),
      price: Number(p?.price || 0),
      discountPrice: p?.discountPrice != null ? Number(p.discountPrice) : null,
      image: p?.image || null
    }));
    setPackagesDraft(normalized);
  }, [packagesGameId, adminPackagesData]);

  const savePackagesMutation = useMutation({
    mutationFn: async (payload: { gameId: string; packages: Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }> }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/games/${payload.gameId}/packages`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ packages: payload.packages })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update packages');
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${variables.gameId}/packages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${variables.gameId}`] });
      if (editingGame?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${editingGame.slug}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/slug/${editingGame.slug}`] });
      }
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update packages', variant: 'destructive' });
    }
  });

  // Admin phone & test email
  const { data: adminPhoneData, refetch: refetchAdminPhone, isLoading: isLoadingAdminPhone } = useQuery<{ adminPhone: string | null }>({
    queryKey: ['/api/admin/settings/whatsapp-number'],
    enabled: true,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/settings/whatsapp-number'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch admin phone');
      return data;
    }
  });
  useEffect(() => {
    if (adminPhoneData?.adminPhone) setAdminPhone(adminPhoneData.adminPhone);
  }, [adminPhoneData?.adminPhone]);

  const updateAdminPhoneMutation = useMutation({
    mutationFn: async (adminPhone: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/settings/whatsapp-number'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ adminPhone })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update admin phone');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Success', description: 'Admin WhatsApp number updated', duration: 2000 });
      refetchAdminPhone();
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update admin phone', variant: 'destructive' });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/email/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to: testEmailTo, subject: testEmailSubject, text: testEmailBody })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to send test email');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Email sent', description: `Test email sent to ${testEmailTo}`, duration: 2000 });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to send test email', variant: 'destructive' });
    }
  });

  const handlePackageImageUpload = async (index: number, file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/upload-image'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Upload failed');
      
      const next = [...packagesDraft];
      next[index] = { ...next[index], image: data.url };
      setPackagesDraft(next);
      
      toast({ title: 'Uploaded', description: 'Image attached to package', duration: 1500 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Upload failed', variant: 'destructive' });
    }
  };

  // Filter games based on search
  const games = allGames.filter((game: Game) => 
    !searchGameTerm || 
    game.name.toLowerCase().includes(searchGameTerm.toLowerCase()) ||
    game.slug?.toLowerCase().includes(searchGameTerm.toLowerCase())
  );

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  // Fetch alerts
  const { data: alerts = [] } = useQuery<Alert[]>({
    queryKey: ['/api/admin/alerts', alertStatus, alertType, alertSearch],
    enabled: true,
    refetchInterval: 5000, // Real-time updates
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const params = new URLSearchParams();
      if (alertStatus !== 'all') params.append('status', alertStatus);
      if (alertType !== 'all') params.append('type', alertType);
      if (alertSearch) params.append('q', alertSearch);
      
      const res = await fetch(`${API_BASE_URL}/api/admin/alerts?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return await res.json();
    }
  });

  // Mark alert as read mutation
  const markAlertReadMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`${API_BASE_URL}/api/admin/alerts/${id}/read`, {
        method: 'PUT',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
    }
  });

  const aiPlanMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(apiPath('/api/admin/ai/plan'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to plan');
      return data as { ok: boolean; source: string; actions: AiPlannedAction[]; rejected: Array<{ action: any; message: string }> };
    },
    onSuccess: (data) => {
      setAiPlanSource(data?.source || '');
      setAiPlannedActions(Array.isArray(data?.actions) ? data.actions : []);
      setAiRejected(Array.isArray(data?.rejected) ? data.rejected.map((r) => ({ message: r.message, action: r.action })) : []);
      toast({ title: 'AI plan ready', description: `Planned ${data?.actions?.length || 0} action(s)`, duration: 1500 });
    },
    onError: (err: any) => {
      toast({ title: 'AI plan failed', description: err?.message || 'Failed to plan', variant: 'destructive' });
    }
  });

  const aiExecuteMutation = useMutation({
    mutationFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(apiPath('/api/admin/ai/execute'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ actions: aiPlannedActions })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to execute');
      return data as { ok: boolean; results: Array<{ action: AiPlannedAction; ok: boolean; message?: string; created?: number; skipped?: number }> };
    },
    onSuccess: (data) => {
      const results = Array.isArray(data?.results) ? data.results : [];
      const okCount = results.filter((r) => r.ok).length;
      const failCount = results.filter((r) => !r.ok).length;
      toast({ title: 'AI actions applied', description: `Success ${okCount}, Failed ${failCount}`, duration: 2000 });

      // Refresh affected admin data
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      if (packagesGameId) queryClient.invalidateQueries({ queryKey: [`/api/games/${packagesGameId}/packages`] });

      setAiPlanSource('');
      setAiPlannedActions([]);
      setAiRejected([]);
      setAiPrompt('');
    },
    onError: (err: any) => {
      toast({ title: 'AI apply failed', description: err?.message || 'Failed to apply', variant: 'destructive' });
    }
  });

  // Fetch game cards (admin)
  const { data: cardsResponse } = useQuery<{ items: Array<{ id: string; game_id: string; card_code: string; is_used: boolean; created_at: string }>; page: number; limit: number; total: number }>({
    queryKey: ['/api/admin/game-cards', `?page=${cardsPage}&limit=${cardsLimit}`],
    enabled: true,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`${API_BASE_URL}/api/admin/game-cards?page=${cardsPage}&limit=${cardsLimit}`,
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
    enabled: true,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/chat/all`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch chats');
      return res.json();
    }
  });

  const { data: confirmations = [] } = useQuery<Array<{ id: string; transactionId: string; message: string; receiptUrl: string; createdAt: number }>>({
    queryKey: ['/api/admin/confirmations'],
    enabled: true,
    queryFn: async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
      const res = await fetch(`${API_BASE_URL}/api/admin/confirmations`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined
      });
      if (!res.ok) throw new Error('Failed to fetch confirmations');
      return await res.json();
    }
  });

  function OrdersPanel() {
    const { data: orders = [] } = useQuery<Array<{ id: string; paymentMethod: string; total: number; status: string; timestamp: number; customerName: string; customerPhone: string; items: Array<{ gameId: string; quantity: number; price: number }> }>>({
      queryKey: ['/api/admin/transactions'],
      enabled: true,
      refetchInterval: 3000,
      queryFn: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const res = await fetch(`${API_BASE_URL}/api/admin/transactions`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return await res.json();
      }
    });
    return (
      <Card className="bg-card/50 border-gold-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Recent Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Order</th>
                  <th className="p-2">Customer</th>
                  <th className="p-2">Contact</th>
                  <th className="p-2">Timestamp</th>
                  <th className="p-2">Payment</th>
                  <th className="p-2">Total</th>
                  <th className="p-2">Items</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id} className="border-t">
                    <td className="p-2 font-mono">{o.id}</td>
                    <td className="p-2">{o.customerName || '-'}</td>
                    <td className="p-2">{o.customerPhone || '-'}</td>
                    <td className="p-2">{new Date(o.timestamp).toLocaleString()}</td>
                    <td className="p-2">{o.paymentMethod}</td>
                    <td className="p-2">{o.total} EGP</td>
                    <td className="p-2">
                      {o.items.length ? o.items.map(it => `${it.gameId} x${it.quantity}`).join(', ') : '-'}
                    </td>
                  </tr>
                ))}
                {orders.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-muted-foreground">No orders</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (gameId: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${gameId}`), { 
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to delete game');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/game-cards'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async (game: Partial<Game> & { id: string }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${game.id}`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(game)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update game');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      if (editingGame?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/id/${editingGame.id}`] });
      }
      if (editingGame?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${editingGame.slug}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/slug/${editingGame.slug}`] });
      }
      setEditingGame(null);
      toast({ title: 'Success', description: 'Game updated successfully' });
    },
    onError: (error: any) => {
      toast({ title: 'Error', description: error.message || 'Failed to update game', variant: 'destructive' });
    }
  });

  const updateGameImageUrlMutation = useMutation({
    mutationFn: async (payload: { id: string; image_url: string }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${payload.id}/image-url`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ image_url: payload.image_url })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update large image');
      return data;
    },
    onSuccess: (resp) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      if (resp?.id) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/id/${resp.id}`] });
      }
      if (editingGame?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${editingGame.slug}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/slug/${editingGame.slug}`] });
      }
      if (resp?.id) {
        setEditingGame((prev) => (prev ? ({ ...prev, image_url: resp.image_url } as any) : prev));
      }
    }
  });

  const applyLogoToPackagesMutation = useMutation({
    mutationFn: async (payload: { gameId: string; logoUrl: string }) => {
      const token = localStorage.getItem('adminToken');
      const headers: HeadersInit = {};
      if (token) (headers as Record<string, string>).Authorization = `Bearer ${token}`;

      const getRes = await fetch(apiPath(`/api/games/${payload.gameId}/packages`), { headers });
      const current = await getRes.json().catch(() => []);
      if (!getRes.ok) throw new Error((current as any)?.message || 'Failed to load packages');

      const packages = (Array.isArray(current) ? current : []).map((p: any) => ({
        amount: String(p?.amount || '').trim(),
        price: Number(p?.price || 0),
        discountPrice: p?.discountPrice != null ? Number(p.discountPrice) : null,
        image: payload.logoUrl
      }));

      const putRes = await fetch(apiPath(`/api/games/${payload.gameId}/packages`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ packages })
      });
      const data = await putRes.json().catch(() => ({}));
      if (!putRes.ok) throw new Error((data as any)?.message || 'Failed to apply logo to packages');
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/${variables.gameId}/packages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${variables.gameId}`] });
      if (editingGame?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${editingGame.slug}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/slug/${editingGame.slug}`] });
      }
    }
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameData: Omit<Game, 'id'>) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/games'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(gameData)
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to create game');
      return data;
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
      const res = await fetch(apiPath('/api/admin/game-cards'), {
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
      const res = await fetch(apiPath(`/api/admin/game-cards/${payload.id}`), {
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
      const res = await fetch(apiPath(`/api/admin/game-cards/${id}`), {
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
      const res = await fetch(apiPath('/api/chat/message'), {
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
      queryClient.invalidateQueries({ queryKey: [`/api/chat/${selectedSession}`] });
    }
  });

  // Delete category mutation
  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/categories/${categoryId}`), {
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
      
      const res = await fetch(apiPath(`/api/admin/categories/${data.id}`), {
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

  const handleSelectGame = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedGames(prev => [...prev, id]);
    } else {
      setSelectedGames(prev => prev.filter(g => g !== id));
    }
  };

  const handleSelectAllGames = (checked: boolean) => {
    if (checked) {
      setSelectedGames(games.map(g => g.id));
    } else {
      setSelectedGames([]);
    }
  };

  const handleBulkDeleteGames = async () => {
    if (!selectedGames.length) return;
    if (!confirm(`Are you sure you want to delete ${selectedGames.length} games?`)) return;
    
    try {
      await Promise.all(selectedGames.map(id => deleteGameMutation.mutateAsync(id)));
      setSelectedGames([]);
      toast({ title: 'Batch Delete', description: `Deleted ${selectedGames.length} games successfully.` });
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to delete some games', variant: 'destructive' });
    }
  };

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
    queryKey: [`/api/chat/${selectedSession}`],
    enabled: !!selectedSession,
    refetchInterval: 2000,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/chat/${selectedSession}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch messages');
      return res.json();
    }
  });

  const sessionChats = sessionMessages;

  function DiscountsPanelLocal({ games, onSaved }: { games: Game[]; onSaved: () => void }) {
    const { toast } = useToast();
    const [gameId, setGameId] = useState<string>(games[0]?.id || '');
    const [mode, setMode] = useState<'percentage' | 'amount'>('percentage');
    const [percentage, setPercentage] = useState<string>('10');
    const [amount, setAmount] = useState<string>('0');
    const [saving, setSaving] = useState(false);
    const selectedGame = games.find(g => g.id === gameId);
    const basePrice = selectedGame ? Number(selectedGame.price) || 0 : 0;
    const pct = Number(percentage);
    const amt = Number(amount);
    const isPctValid = mode === 'percentage' ? pct >= 0 && pct <= 100 : true;
    const isAmtValid = mode === 'amount' ? amt >= 0 && amt <= basePrice : true;
    const effectiveDiscount = mode === 'percentage' ? (basePrice * (pct / 100)) : amt;
    const finalPrice = Math.max(0, basePrice - effectiveDiscount);
    const saveMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: gameId, discountPrice: finalPrice })
        });
        return await res.json();
      },
      onSuccess: (resp) => {
        setSaving(false);
        if (resp?.id) {
          toast({ title: 'Saved', description: 'Discount updated', duration: 1200 });
          onSaved();
        } else {
          toast({ title: 'Error', description: resp?.message || 'Failed to save', duration: 1800 });
        }
      },
      onError: (err: any) => {
        setSaving(false);
        toast({ title: 'Error', description: err?.message || 'Failed to save', duration: 1800 });
      }
    });
    useEffect(() => {
      if (!gameId && games.length) setGameId(games[0]?.id);
    }, [games, gameId]);
    const reset = () => {
      setMode('percentage');
      setPercentage('10');
      setAmount('0');
    };
    const save = () => {
      if (!gameId || !selectedGame) {
        toast({ title: 'Error', description: 'Select a game', duration: 1500 });
        return;
      }
      if (!isPctValid || !isAmtValid) {
        toast({ title: 'Invalid values', description: 'Fix validation errors', duration: 1500 });
        return;
      }
      setSaving(true);
      saveMutation.mutate();
    };
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Game</Label>
            <Select value={gameId} onValueChange={setGameId}>
              <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
              <SelectContent>
                {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Mode</Label>
            <Select value={mode} onValueChange={(v) => setMode(v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="percentage">Percentage</SelectItem>
                <SelectItem value="amount">Amount</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Base Price</Label>
            <Input value={basePrice ? `${basePrice} EGP` : '-'} readOnly />
          </div>
        </div>
        {mode === 'percentage' ? (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Percentage</Label>
            <Input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="col-span-3"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {!isPctValid ? 'Percentage must be between 0 and 100. ' : ''}
          {!isAmtValid ? 'Amount must be ≤ base price. ' : ''}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Final Price</Label>
          <Input value={`${finalPrice.toFixed(2)} EGP`} readOnly className="col-span-3" />
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !isPctValid || !isAmtValid} className="bg-gold-primary">Save</Button>
          <Button variant="outline" onClick={reset}>Cancel</Button>
        </div>
      </div>
    );
  }
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, target: 'logo' | 'large') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/images/upload-cloudinary'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: formData
      });
      const data = await res.json();
      if (data.url && editingGame) {
        if (target === 'logo') {
          setEditingGame({ ...editingGame, image: data.url });
        } else {
          setEditingGame({ ...editingGame, image_url: data.url } as any);
        }
      } else if (data.url) {
        alert('Image uploaded: ' + data.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
  };

  function ContentEditorPanel() {
    const { toast } = useToast();
    const { data: content } = useQuery<{ ok: boolean; content: { title?: string; description?: string; link?: string } }>({
      queryKey: ['/api/content'],
    });
    const [title, setTitle] = useState(content?.content?.title || '');
    const [description, setDescription] = useState(content?.content?.description || '');
    const [link, setLink] = useState(content?.content?.link || '');
    useEffect(() => {
      setTitle(content?.content?.title || '');
      setDescription(content?.content?.description || '');
      setLink(content?.content?.link || '');
    }, [content?.content?.title, content?.content?.description, content?.content?.link]);
    const saveMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiPath('/api/admin/content'), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ title, description, link })
        });
        return await res.json();
      },
      onSuccess: (resp) => {
        if (resp?.ok) {
          toast({ title: 'Saved', description: 'Content updated', duration: 1500 });
          queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        } else {
          toast({ title: 'Error', description: resp?.message || 'Failed to save', duration: 2000 });
        }
      }
    });
    const isValidTitle = title.trim().length > 0 && title.trim().length <= 120;
    const isValidDesc = description.trim().length > 0 && description.trim().length <= 2000;
    const isValidLink = /^https?:\/\//i.test(link.trim());
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Title</Label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-start gap-4">
          <Label className="text-right">Description</Label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="col-span-3 h-32"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Link</Label>
          <Input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            placeholder="https://example.com"
            className="col-span-3"
          />
        </div>
        <div className="flex items-center gap-4">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={!isValidTitle || !isValidDesc || !isValidLink || saveMutation.isPending}
            className="bg-gold-primary hover:bg-gold-primary/80"
          >
            Save
          </Button>
          <div className="text-xs text-muted-foreground">
            {!isValidTitle ? 'Invalid title. ' : ''}
            {!isValidDesc ? 'Invalid description. ' : ''}
            {!isValidLink ? 'Invalid link.' : ''}
          </div>
        </div>
        <div className="mt-6">
          <h3 className="text-sm font-semibold mb-2">Live Preview</h3>
          <Card className="bg-card/40 border-gold-primary/20">
            <CardContent className="p-4">
              <div className="text-xl font-bold">{title || 'Title'}</div>
              <div className="text-sm text-muted-foreground mt-2 whitespace-pre-line">{description || 'Description'}</div>
              <div className="mt-2 text-xs">
                <a href={link || '#'} className="text-gold-primary underline">{link || 'Link'}</a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-gold-primary mb-8">Diaa Eldeen Admin Dashboard</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
        <TabsList className="flex w-full justify-start p-0 h-auto bg-transparent overflow-x-auto whitespace-nowrap">
          <TabsTrigger value="games" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Games & Products</TabsTrigger>
          <TabsTrigger value="discounts" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Discounts</TabsTrigger>
          <TabsTrigger value="users" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Users</TabsTrigger>
          <TabsTrigger value="packages" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Packages</TabsTrigger>
          <TabsTrigger value="categories" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Categories</TabsTrigger>
          <TabsTrigger value="cards" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Game Cards</TabsTrigger>
          <TabsTrigger value="orders" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Orders</TabsTrigger>
          <TabsTrigger value="chats" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Support Chat</TabsTrigger>
          <TabsTrigger value="checkout-confirmations" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Checkout Confirmations</TabsTrigger>
          <TabsTrigger value="interactions" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Interactions</TabsTrigger>
          <TabsTrigger value="chat-widget" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Chat Widget</TabsTrigger>
          <TabsTrigger value="logo" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Logo</TabsTrigger>
          <TabsTrigger value="whatsapp" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">WhatsApp</TabsTrigger>
          <TabsTrigger value="checkout-templates" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Checkout Templates</TabsTrigger>
          <TabsTrigger value="preview-home" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Home Preview</TabsTrigger>
          <TabsTrigger value="alerts" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">
            Alerts
            {alerts.some(a => !a.read) && (
              <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            )}
          </TabsTrigger>
          <TabsTrigger value="catbox-upload" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Catbox Image Upload</TabsTrigger>
          <TabsTrigger value="image-manager" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Image Manager</TabsTrigger>
          <TabsTrigger value="content" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Content</TabsTrigger>
          <TabsTrigger value="ai" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">AI Assistant</TabsTrigger>
        </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value="ai" className="space-y-6">
            <div className="flex items-center gap-2">
              <Wand2 className="w-5 h-5 text-gold-primary" />
              <h2 className="text-2xl font-bold text-foreground">AI Assistant</h2>
            </div>
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Describe what you want to change</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Quick Templates (click to edit)</Label>
                  <div className="flex flex-wrap gap-2">
                    {[
                      'Set game {game} price to {price}',
                      'Set game {game} discount to {price}',
                      'Set game {game} stock to {stock}',
                      'Set package {package} price to {price} for game {game}',
                      'Set package {package} discount to {price} for game {game}',
                      'Bulk add cards for game {game}: {cards}',
                    ].map((tpl) => (
                      <Button
                        key={tpl}
                        variant="outline"
                        size="sm"
                        onClick={() => setAiPrompt(tpl)}
                        className="text-xs"
                      >
                        {tpl}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Request</Label>
                  <Textarea
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Example: Set pubg-mobile price to 120 and discount to 99"
                    className="min-h-28"
                  />
                  <div className="text-xs text-muted-foreground">
                    The AI will only propose safe, whitelisted actions. You must confirm before applying.
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    onClick={() => aiPlanMutation.mutate()}
                    disabled={!aiPrompt.trim() || aiPlanMutation.isPending}
                    className="bg-gold-primary hover:bg-gold-primary/80"
                  >
                    {aiPlanMutation.isPending ? 'Planning...' : 'Generate Plan'}
                  </Button>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" disabled={aiPlannedActions.length === 0 || aiExecuteMutation.isPending}>
                        Apply Actions
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Confirm Apply</DialogTitle>
                        <DialogDescription>
                          This will execute {aiPlannedActions.length} action(s) on your live database.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-2 text-sm">
                        {aiPlannedActions.map((a, idx) => (
                          <div key={idx} className="border rounded p-2 bg-muted/30 font-mono text-xs overflow-x-auto">
                            {JSON.stringify(a)}
                          </div>
                        ))}
                      </div>
                      <DialogFooter>
                        <Button
                          onClick={() => aiExecuteMutation.mutate()}
                          disabled={aiExecuteMutation.isPending}
                          className="bg-gold-primary hover:bg-gold-primary/80"
                        >
                          {aiExecuteMutation.isPending ? 'Applying...' : 'Confirm & Apply'}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      setAiPlanSource('');
                      setAiPlannedActions([]);
                      setAiRejected([]);
                    }}
                  >
                    Clear
                  </Button>
                </div>

                {(aiPlanSource || aiPlannedActions.length || aiRejected.length) ? (
                  <div className="space-y-3">
                    <div className="text-sm text-muted-foreground">
                      Source: <span className="font-mono">{aiPlanSource || '—'}</span>
                    </div>

                    <div>
                      <div className="text-sm font-semibold mb-2">Planned actions ({aiPlannedActions.length})</div>
                      <div className="grid gap-2">
                        {aiPlannedActions.length === 0 ? (
                          <div className="text-sm text-muted-foreground">No actions planned.</div>
                        ) : (
                          aiPlannedActions.map((a, idx) => (
                            <div key={idx} className="border rounded p-2 bg-muted/30 font-mono text-xs overflow-x-auto">
                              {JSON.stringify(a)}
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    {aiRejected.length > 0 && (
                      <div>
                        <div className="text-sm font-semibold mb-2 text-yellow-500">Rejected ({aiRejected.length})</div>
                        <div className="grid gap-2">
                          {aiRejected.map((r, idx) => (
                            <div key={idx} className="border rounded p-2 bg-yellow-500/10">
                              <div className="text-xs font-semibold">{r.message}</div>
                              <div className="mt-1 font-mono text-xs overflow-x-auto">{JSON.stringify(r.action)}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          </TabsContent>

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
          
          {/* Discounts Tab */}
          <TabsContent value="discounts" className="space-y-6">
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Discount Management</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <DiscountsPanelLocal games={allGames} onSaved={() => queryClient.invalidateQueries({ queryKey: ['/api/games'] })} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Users</h2>
            </div>
            <UsersPanel />
          </TabsContent>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Orders</h2>
            </div>
            <OrdersPanel />
          </TabsContent>

          <TabsContent value="checkout-confirmations" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground">Checkout Confirmations</h2>
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle className="text-lg">Recent Submissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {confirmations.map((c) => (
                    <Link href={`/admin/confirmation/${c.id}`}>
                      <div key={c.id} className="rounded-lg border p-3 flex flex-col gap-2 hover:bg-muted/40 cursor-pointer">
                        <div className="text-xs text-muted-foreground">#{c.id}</div>
                        <div className="text-sm">Order: <span className="font-mono">{c.transactionId}</span></div>
                        <div className="text-sm">Message: <span>{c.message || '—'}</span></div>
                        {c.receiptUrl ? (
                          <a href={c.receiptUrl} target="_blank" rel="noopener noreferrer" className="block">
                            <img src={c.receiptUrl} alt="" className="w-full h-32 object-contain rounded" />
                          </a>
                        ) : null}
                        <div className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</div>
                      </div>
                    </Link>
                  ))}
                  {confirmations.length === 0 && (
                    <div className="text-muted-foreground">No confirmations found.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* Interactions Tab */}
          <TabsContent value="interactions" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Checkout Interactions</h2>
            </div>
            <InteractionsPanel />
          </TabsContent>
          {/* Catbox Image Upload */}
          <TabsContent value="catbox-upload" className="space-y-6">
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Submit Catbox.moe Image URL</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <CatboxUploadPanel allGames={allGames} categories={categories} />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Image Manager */}
          <TabsContent value="image-manager" className="space-y-6">
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Upload & Scan</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ImageManagerPanel />
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Main Page Content</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ContentEditorPanel />
              </CardContent>
            </Card>
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

            {/* Search Games */}
            <div className="mb-4 flex gap-4 items-center justify-between">
              <Input
                placeholder="Search games by name or slug..."
                value={searchGameTerm}
                onChange={(e) => setSearchGameTerm(e.target.value)}
                className="max-w-md"
              />
              <div className="flex items-center gap-2">
                 <Checkbox 
                    checked={games.length > 0 && selectedGames.length === games.length}
                    onCheckedChange={(c) => handleSelectAllGames(!!c)}
                    id="select-all"
                 />
                 <Label htmlFor="select-all">Select All</Label>
              </div>
            </div>

            {selectedGames.length > 0 && (
              <div className="mb-4 p-2 bg-secondary rounded flex items-center gap-4">
                <span className="text-sm font-medium">{selectedGames.length} selected</span>
                <Button variant="destructive" size="sm" onClick={handleBulkDeleteGames}>
                  <Trash2 className="w-4 h-4 mr-2" /> Delete Selected
                </Button>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {games.map((game: Game) => (
                <Card key={game.id} className={`bg-card/50 border-gold-primary/30 ${selectedGames.includes(game.id) ? 'ring-2 ring-gold-primary' : ''}`}>
                  <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                    <CardTitle className="text-lg">{game.name}</CardTitle>
                    <Checkbox 
                      checked={selectedGames.includes(game.id)}
                      onCheckedChange={(c) => handleSelectGame(game.id, !!c)}
                    />
                  </CardHeader>
                  <CardContent className="space-y-4 pt-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Price</p>
                      {gameHasPackages(game) ? (
                        <p className="text-lg font-bold text-gold-primary">
                          From {getDerivedMinPackagePrice(game) ?? 0} EGP
                        </p>
                      ) : (
                        <p className="text-lg font-bold text-gold-primary">{game.price} EGP</p>
                      )}
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
                        setPackagesGameId(game.id);
                      }}
                    >
                      <Package className="w-4 h-4 mr-2" />
                      Manage Packages
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Dialog open={!!packagesGameId} onOpenChange={(open) => { if (!open) setPackagesGameId(null); }}>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Edit Packages</DialogTitle>
                  <DialogDescription>
                    Edit package price and discount price. Changes apply on the website after saving.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  {isFetchingAdminPackages ? (
                    <div className="text-sm text-muted-foreground">Loading packages…</div>
                  ) : packagesDraft.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No packages found for this game.</div>
                  ) : (
                    <div className="space-y-3">
                      {packagesDraft.map((p, idx) => (
                        <div key={idx} className="border-b pb-4 mb-4 last:border-0 last:mb-0 last:pb-0">
                          <div className="flex items-center gap-4 mb-3">
                            {p.image ? (
                              <img src={p.image} alt="Package" className="w-16 h-16 object-cover rounded border border-gold-primary/30" />
                            ) : (
                              <div className="w-16 h-16 bg-muted/50 rounded border border-dashed border-muted-foreground/30 flex items-center justify-center text-xs text-muted-foreground">
                                No Img
                              </div>
                            )}
                            <div>
                              <div className="flex gap-2">
                                <Label 
                                  htmlFor={`pkg-img-${idx}`} 
                                  className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 h-9 px-4 py-2"
                                >
                                  {p.image ? 'Change Image' : 'Upload Image'}
                                </Label>
                                {p.image && (
                                  <Button 
                                    variant="destructive" 
                                    size="sm"
                                    onClick={() => {
                                      const next = [...packagesDraft];
                                      next[idx] = { ...next[idx], image: null };
                                      setPackagesDraft(next);
                                    }}
                                  >
                                    Remove
                                  </Button>
                                )}
                              </div>
                              <Input
                                id={`pkg-img-${idx}`}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) handlePackageImageUpload(idx, file);
                                }}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-12 gap-2 items-end">
                            <div className="col-span-5">
                              <Label>Package</Label>
                              <Input value={p.amount} readOnly />
                            </div>
                            <div className="col-span-3">
                              <Label>Original Price (strikethrough)</Label>
                              <Input
                                type="number"
                                value={Number.isFinite(p.price) ? p.price : 0}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const next = [...packagesDraft];
                                  next[idx] = { ...next[idx], price: v === '' ? 0 : Number(v) };
                                  setPackagesDraft(next);
                                }}
                              />
                            </div>
                            <div className="col-span-4">
                              <Label>Final Price (shown big)</Label>
                              <Input
                                type="number"
                                value={p.discountPrice ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const next = [...packagesDraft];
                                  next[idx] = { ...next[idx], discountPrice: v === '' ? null : Number(v) };
                                  setPackagesDraft(next);
                                }}
                                placeholder="Leave empty to use original price"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <DialogFooter>
                  <Button variant="outline" onClick={() => setPackagesGameId(null)}>Close</Button>
                  <Button
                    onClick={() => {
                      if (!packagesGameId) return;
                      savePackagesMutation.mutate({ gameId: packagesGameId, packages: packagesDraft });
                    }}
                    disabled={!packagesGameId || savePackagesMutation.isPending || isFetchingAdminPackages}
                    className="bg-gold-primary"
                  >
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    {(cat as any).image && (
                      <div className="flex items-center gap-3">
                        <img src={String((cat as any).image)} alt={cat.name} className="w-12 h-12 rounded object-cover border border-gold-primary/20" />
                        <div className="text-xs text-muted-foreground break-all">{String((cat as any).image)}</div>
                      </div>
                    )}
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
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          const image = prompt('Category image URL:', String((cat as any).image || ''));
                          if (image && image.trim()) {
                            updateCategoryMutation.mutate({ id: cat.id, image: image.trim() });
                          }
                        }}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        Image
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
                          {sessionChats.map((msg: any) => (
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
                              <p className="text-[10px] mt-1 opacity-70">Status: {msg.status || (msg.read ? 'read' : 'delivered')}</p>
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

          <TabsContent value="checkout-templates" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Checkout Templates</h2>
            </div>
            <CheckoutTemplatesPanel />
          </TabsContent>

          {/* Logo Management Tab */}
          <TabsContent value="logo" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Logo Management</h2>
            </div>

            <LogoManagementPanel />
          </TabsContent>

          {/* Live Home Preview */}
          <TabsContent value="preview-home" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Live Preview: Home</h2>
              <Button variant="outline" onClick={() => window.dispatchEvent(new Event('logo-updated'))}>Refresh</Button>
            </div>
            <div className="rounded-lg border overflow-hidden">
              <iframe title="Home Preview" src="/" className="w-full h-[800px] bg-background" />
            </div>
          </TabsContent>

          {/* WhatsApp Tab */}
          <TabsContent value="whatsapp" className="space-y-6">
            <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Integration</h2>
            <p className="text-sm text-muted-foreground mb-4">Manage your connected WhatsApp number and send test messages.</p>

            {/* Admin Phone Number Editor */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Admin WhatsApp Number</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="adminPhone" className="text-right">Admin Phone</Label>
                  <Input
                    id="adminPhone"
                    value={adminPhone}
                    onChange={(e) => setAdminPhone(e.target.value)}
                    placeholder="+201234567890"
                    className="col-span-3"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => updateAdminPhoneMutation.mutate(adminPhone)} disabled={updateAdminPhoneMutation.isPending} className="bg-gold-primary">
                    {updateAdminPhoneMutation.isPending ? 'Saving...' : 'Save Number'}
                  </Button>
                  <Button variant="outline" onClick={() => refetchAdminPhone()} disabled={isLoadingAdminPhone}>
                    Refresh
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  This number receives order confirmations and admin alerts via WhatsApp.
                </div>
              </CardContent>
            </Card>

            {/* Connection Status */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Connection Status</CardTitle>
              </CardHeader>
              <CardContent>
                <WhatsAppConnectionPanel />
              </CardContent>
            </Card>

            {/* Test Email */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Test Email</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="testEmailTo" className="text-right">To</Label>
                  <Input
                    id="testEmailTo"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="admin@example.com"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="testEmailSubject" className="text-right">Subject</Label>
                  <Input
                    id="testEmailSubject"
                    value={testEmailSubject}
                    onChange={(e) => setTestEmailSubject(e.target.value)}
                    placeholder="Test from GameCart Admin"
                    className="col-span-3"
                  />
                </div>
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label htmlFor="testEmailBody" className="text-right">Message</Label>
                  <Textarea
                    id="testEmailBody"
                    value={testEmailBody}
                    onChange={(e) => setTestEmailBody(e.target.value)}
                    placeholder="This is a test email from the admin dashboard."
                    className="col-span-3 h-24"
                  />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => testEmailMutation.mutate()} disabled={testEmailMutation.isPending || !testEmailTo.trim()} className="bg-gold-primary">
                    {testEmailMutation.isPending ? 'Sending...' : 'Send Test Email'}
                  </Button>
                </div>
                <div className="text-xs text-muted-foreground">
                  Ensure BREVO_USER and BREVO_PASS are configured in backend .env for email delivery.
                </div>
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
                <div className="col-span-3">
                  <Input
                    id="price"
                    value={gameHasPackages(editingGame) ? String(getDerivedMinPackagePrice(editingGame) ?? '') : editingGame.price}
                    onChange={(e) => {
                      if (gameHasPackages(editingGame)) return;
                      setEditingGame({ ...editingGame, price: e.target.value });
                    }}
                    disabled={gameHasPackages(editingGame)}
                    placeholder={gameHasPackages(editingGame) ? 'Managed by packages' : undefined}
                  />
                  {!gameHasPackages(editingGame) && (
                    <p className="text-xs text-muted-foreground mt-1">Original price (shown as strikethrough if final price is set)</p>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="discountPrice" className="text-right">Final Price</Label>
                <div className="col-span-3">
                  <Input
                    id="discountPrice"
                    type="number"
                    value={(editingGame as any).discountPrice || ''}
                    onChange={(e) => setEditingGame({ ...editingGame, discountPrice: e.target.value || null } as any)}
                    placeholder="Optional - shown as the main price"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Final displayed price (big font)</p>
                </div>
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
                <Label className="text-right">Upload Logo</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(ev) => handleImageUpload(ev, 'logo')}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!editingGame?.id || !String(editingGame.image || '').trim() || applyLogoToPackagesMutation.isPending}
                    onClick={() => {
                      const logoUrl = String(editingGame.image || '').trim();
                      if (!editingGame?.id || !logoUrl) return;
                      applyLogoToPackagesMutation.mutate({ gameId: editingGame.id, logoUrl });
                    }}
                  >
                    Apply Logo To All Packages
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="image_url" className="text-right">Large Image URL</Label>
                <Input
                  id="image_url"
                  value={(editingGame as any).image_url || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, image_url: e.target.value } as any)}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!editingGame?.id || !(editingGame as any).image_url || updateGameImageUrlMutation.isPending}
                    onClick={() => {
                      const url = String((editingGame as any).image_url || '').trim();
                      if (!editingGame?.id || !url) return;
                      updateGameImageUrlMutation.mutate({ id: editingGame.id, image_url: url });
                    }}
                  >
                    Save Large Image Only
                  </Button>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label className="text-right">Upload Large Image</Label>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={(ev) => handleImageUpload(ev, 'large')}
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
              {(editingGame as any).image_url && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <img src={(editingGame as any).image_url} alt="Large Preview" className="h-32 object-contain rounded-md border" />
                  </div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingGame(null)}>Cancel</Button>
            <Button
              type="submit"
              onClick={() => {
                if (!editingGame) return;
                const payload: any = { ...editingGame };
                if (gameHasPackages(payload)) {
                  delete payload.price;
                }
                updateGameMutation.mutate(payload);
              }}
            >
              Save changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CatboxUploadPanel({ allGames, categories }: { allGames: Game[]; categories: Category[] }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'game' | 'category'>('game');
  const [targetId, setTargetId] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  useEffect(() => { setPreview(url); }, [url]);
  useEffect(() => {
    if (type === 'game' && allGames.length && !targetId) setTargetId(allGames[0]?.id || '');
    if (type === 'category' && categories.length && !targetId) setTargetId(categories[0]?.id || '');
  }, [type, allGames, categories]);
  const submit = async () => {
    setError(''); setResultUrl('');
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    try {
      const res = await fetch(apiPath('/api/admin/images/catbox-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url, type, id: targetId, filename: undefined })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data?.message || 'Submission failed');
        return;
      }
      setResultUrl(data?.url || '');
    } catch (err: any) {
      setError(err?.message || 'Network error');
    }
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Catbox URL</Label>
          <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://files.catbox.moe/xxxxxx.png" />
        </div>
        <div>
          <Label>Apply To</Label>
          <Select value={type} onValueChange={(v) => setType(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="game">Game</SelectItem>
              <SelectItem value="category">Category</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>{type === 'game' ? 'Game' : 'Category'}</Label>
          <Select value={targetId} onValueChange={setTargetId}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {type === 'game'
                ? allGames.map((g) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)
                : categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)
              }
            </SelectContent>
          </Select>
        </div>
      </div>
      {preview && (
        <div className="border rounded p-3">
          <img src={preview} alt="Preview" className="max-h-64 object-contain mx-auto" onError={(e) => ((e.target as HTMLImageElement).style.display = 'none')} />
        </div>
      )}
      <div className="flex gap-2">
        <Button onClick={submit} className="bg-gold-primary">Submit</Button>
        {resultUrl && <span className="text-sm text-muted-foreground">Applied URL: {resultUrl}</span>}
      </div>
      {error && <div className="text-red-500 text-sm">{error}</div>}
    </div>
  );
  }

  function UsersPanel() {
    const [q, setQ] = useState('');
    const [page, setPage] = useState(1);
    const { data } = useQuery<{ items: Array<{ id: string; name: string; phone: string; created_at: string }>; page: number; limit: number; total: number }>({
      queryKey: ['/api/admin/users', q, page],
      enabled: true,
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiPath(`/api/admin/users?q=${encodeURIComponent(q)}&page=${page}&limit=20`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!res.ok) throw new Error('Failed to fetch users');
        return res.json();
      }
    });
    const exportMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiPath('/api/admin/users/export'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const csv = await res.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
      }
    });
    const items = data?.items || [];
    return (
      <Card className="bg-card/50 border-gold-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">User Directory</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex gap-2">
            <Input placeholder="Search by name or phone" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
            <Button onClick={() => exportMutation.mutate()} variant="outline">Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">ID</th>
                  <th className="p-2">Name</th>
                  <th className="p-2">Phone</th>
                  <th className="p-2">Created</th>
                </tr>
              </thead>
              <tbody>
                {items.map(u => (
                  <tr key={u.id} className="border-t">
                    <td className="p-2 font-mono">{u.id}</td>
                    <td className="p-2">{u.name}</td>
                    <td className="p-2">{u.phone}</td>
                    <td className="p-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td className="p-2 text-muted-foreground" colSpan={4}>No users</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  function InteractionsPanel() {
    const [q, setQ] = useState('');
    const [eventType, setEventType] = useState<string>('all');
    const { data, refetch } = useQuery<{ items: Array<{ id: string; event_type: string; element?: string; page?: string; success: boolean; error?: string; ua?: string; ts: string }> }>({
      queryKey: ['/api/admin/interactions', q, eventType],
      enabled: true,
      queryFn: async () => {
        const token = localStorage.getItem('adminToken');
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (eventType && eventType !== 'all') params.set('event_type', eventType);
        const res = await fetch(apiPath(`/api/admin/interactions?${params.toString()}`), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        if (!res.ok) throw new Error('Failed to fetch interactions');
        return res.json();
      }
    });
    const exportMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiPath('/api/admin/interactions/export'), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
        const csv = await res.text();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url; a.download = `interactions-${Date.now()}.csv`; a.click();
        URL.revokeObjectURL(url);
      }
    });
    const items = data?.items || [];
    return (
      <Card className="bg-card/50 border-gold-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">User Interactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Input placeholder="Search text or page" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
            <Select value={eventType} onValueChange={(v) => setEventType(v || 'all')}>
              <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="click">click</SelectItem>
                <SelectItem value="submit">submit</SelectItem>
                <SelectItem value="view">view</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={() => exportMutation.mutate()}>Export CSV</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="p-2">Event</th>
                  <th className="p-2">Element</th>
                  <th className="p-2">Page</th>
                  <th className="p-2">Success</th>
                  <th className="p-2">Time</th>
                </tr>
              </thead>
              <tbody>
                {items.map(it => (
                  <tr key={it.id} className="border-t">
                    <td className="p-2">{it.event_type}</td>
                    <td className="p-2">{it.element || '-'}</td>
                    <td className="p-2">{it.page || '-'}</td>
                    <td className="p-2">{it.success ? 'Yes' : 'No'}</td>
                    <td className="p-2">{it.ts ? new Date(it.ts).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td className="p-2 text-muted-foreground" colSpan={5}>No interactions</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    );
  }

  function ImageManagerPanel() {
  const [files, setFiles] = useState<File[]>([]);
  const [urlsText, setUrlsText] = useState('');
  const [storage, setStorage] = useState<'cloudinary' | 'local' | 'catbox'>('local');
  const [progress, setProgress] = useState<number>(0);
  const [results, setResults] = useState<Array<{ name?: string; url?: string; error?: string; ok: boolean }>>([]);
  const [scanUrl, setScanUrl] = useState('');
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items || [];
      const newFiles: File[] = [];
      for (const it of items as any) {
        if (it.kind === 'file') {
          const f = it.getAsFile?.();
          if (f) newFiles.push(f);
        }
      }
      if (newFiles.length) setFiles(prev => [...prev, ...newFiles]);
    };
    window.addEventListener('paste', onPaste as any);
    return () => { window.removeEventListener('paste', onPaste as any); };
  }, []);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const dt = e.dataTransfer;
    const f = Array.from(dt.files || []);
    if (f.length) setFiles(prev => [...prev, ...f]);
  };
  const onDragOver = (e: React.DragEvent) => e.preventDefault();
  const chooseFiles = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*';
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const f = Array.from(target.files || []);
      if (f.length) setFiles(prev => [...prev, ...f]);
    };
    input.click();
  };
  const chooseFolder = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.setAttribute('webkitdirectory', 'true');
    input.onchange = (e) => {
      const target = e.target as HTMLInputElement;
      const f = Array.from(target.files || []);
      const imgs = f.filter(ff => /.(png|jpe?g|webp|gif|svg)$/i.test(ff.name));
      if (imgs.length) setFiles(prev => [...prev, ...imgs]);
    };
    input.click();
  };
  const uploadBatch = async () => {
    setResults([]); setProgress(0);
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (files.length) {
      const form = new FormData();
      files.forEach(f => form.append('files', f));
      form.append('storage', storage);
      const res = await fetch(apiPath('/api/admin/images/upload-batch'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        body: form
      });
      const data = await res.json();
      const items = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
      setProgress(100);
    } else {
      const urls = urlsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
      const res = await fetch(apiPath('/api/admin/images/upload-batch'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ storage, urls })
      });
      const data = await res.json();
      const items = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
      setProgress(100);
    }
  };
  const scanSite = async () => {
    setResults([]); setProgress(0);
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    const res = await fetch(apiPath('/api/admin/images/scan-site'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ url: scanUrl, storage })
    });
    const data = await res.json();
    const items = Array.isArray(data?.results) ? data.results : [];
    setResults(items);
    setProgress(100);
  };
  return (
    <div className="space-y-4">
      <div className="flex gap-3 items-center">
        <Label>Destination</Label>
        <Select value={storage} onValueChange={(v) => setStorage(v as any)}>
          <SelectTrigger className="w-[200px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="local">Local</SelectItem>
            <SelectItem value="cloudinary">Cloudinary</SelectItem>
            <SelectItem value="catbox">Catbox</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div
        className="border-dashed border-2 rounded-lg p-6 text-center bg-muted/40"
        onDrop={onDrop}
        onDragOver={onDragOver}
      >
        <div className="mb-2">Drag & drop images here</div>
        <div className="flex gap-2 justify-center">
          <Button variant="outline" onClick={chooseFiles}>Select Files</Button>
          <Button variant="outline" onClick={chooseFolder}>Upload Folder</Button>
        </div>
      </div>
      <div>
        <Label>Paste URLs (one per line)</Label>
        <Input value={urlsText} onChange={(e) => setUrlsText(e.target.value)} placeholder="https://example.com/a.jpg" />
      </div>
      <div className="flex gap-2">
        <Button onClick={uploadBatch} className="bg-blue-600">Upload</Button>
        <div className="text-sm text-muted-foreground">Progress {progress}%</div>
      </div>
      <div>
        <Label>Scan Website</Label>
        <div className="flex gap-2">
          <Input value={scanUrl} onChange={(e) => setScanUrl(e.target.value)} placeholder="https://example.com" />
          <Button onClick={scanSite} className="bg-gold-primary">Scan & Save</Button>
        </div>
      </div>
      <div className="space-y-2">
        {results.map((r, i) => (
          <div key={i} className={`flex items-center justify-between rounded border p-2 ${r.ok ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <div className="truncate">{r.name || r.url || r.error}</div>
            {r.url && <img src={r.url} alt="" className="w-10 h-10 object-contain rounded" />}
          </div>
        ))}
      </div>
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
      const res = await fetch(apiPath('/api/admin/chat-widget/config'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch config');
      return res.json();
    },
    select: (data: any) => data,
    refetchOnWindowFocus: false,
    gcTime: Infinity,
    staleTime: Infinity,
  });
  useEffect(() => {
    const data: any = config;
    if (data) {
      setEnabled(data.enabled !== false);
      setIconUrl(data.iconUrl || '/images/message-icon.svg');
      setWelcomeMessage(data.welcomeMessage || 'Hello! How can we help you?');
      setPosition(data.position || 'bottom-right');
    }
  }, [config]);

  // Update config mutation
  const updateConfigMutation = useMutation({
    mutationFn: async (configData: any) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/chat-widget/config'), {
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

function LogoManagementPanel() {
  const [smallLogoUrl, setSmallLogoUrl] = useState('');
  const [largeLogoUrl, setLargeLogoUrl] = useState('');
  const [faviconUrl, setFaviconUrl] = useState('/images/cropped-favicon1-32x32.png');
  const [previewInfo, setPreviewInfo] = useState("");

  // Fetch logo config
  const { data: logoConfig } = useQuery({
    queryKey: ['/api/admin/logo/config'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/logo/config'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch logo config');
      return res.json();
    },
    select: (data: any) => data,
    refetchOnWindowFocus: false,
    gcTime: Infinity,
    staleTime: Infinity,
  });
  useEffect(() => {
    const data: any = logoConfig;
    if (data) {
      setSmallLogoUrl(data.smallLogoUrl || data.small_logo_url || '/attached_assets/small-image-logo.png');
      setLargeLogoUrl(data.largeLogoUrl || data.large_logo_url || '/attached_assets/large-image-logo.png');
      setFaviconUrl(data.faviconUrl || data.favicon_url || '/images/cropped-favicon1-32x32.png');
    }
  }, [logoConfig]);

  // Update logo config mutation
  const updateLogoMutation = useMutation({
    mutationFn: async (logoData: any) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/logo/config'), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(logoData)
      });
      if (!res.ok) throw new Error('Failed to update logo config');
      return res.json();
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/logo/config'] });
      const ts = Date.now();
      if (data?.small_logo_url || data?.smallLogoUrl) setSmallLogoUrl(`${data.small_logo_url || data.smallLogoUrl}?v=${ts}`);
      if (data?.large_logo_url || data?.largeLogoUrl) setLargeLogoUrl(`${data.large_logo_url || data.largeLogoUrl}?v=${ts}`);
      if (data?.favicon_url || data?.faviconUrl) setFaviconUrl(`${data.favicon_url || data.faviconUrl}?v=${ts}`);
      window.dispatchEvent(new Event('logo-updated'));
      alert('Logo updated successfully!');
    }
  });

  const handleSave = () => {
    updateLogoMutation.mutate({
      smallLogoUrl,
      largeLogoUrl,
      faviconUrl
    });
  };

  const handleImageUpload = async (type: 'small' | 'large' | 'favicon') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/png, image/svg+xml';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      const isSvg = file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
      let uploadBlob: Blob = file;
      if (!isSvg) {
        const url = URL.createObjectURL(file);
        const img = new Image();
        img.onload = async () => {
          setPreviewInfo(`${img.naturalWidth}x${img.naturalHeight}px`);
          const recommendedW = 300, recommendedH = 100;
          if (img.naturalWidth !== recommendedW || img.naturalHeight !== recommendedH) {
            const shouldResize = window.confirm(`Recommended logo size is ${recommendedW}x${recommendedH}. Resize now?`);
            if (shouldResize) {
              const canvas = document.createElement('canvas');
              canvas.width = recommendedW; canvas.height = recommendedH;
              const ctx = canvas.getContext('2d');
              if (ctx) {
                ctx.clearRect(0,0,recommendedW,recommendedH);
                ctx.drawImage(img, 0, 0, recommendedW, recommendedH);
                const dataUrl = canvas.toDataURL('image/png');
                const res = await fetch(dataUrl);
                uploadBlob = await res.blob();
              }
            }
          }
          await doUpload(uploadBlob, type);
          URL.revokeObjectURL(url);
        };
        img.onerror = async () => { await doUpload(uploadBlob, type); };
        img.src = url;
        return;
      }
      await doUpload(uploadBlob, type);
    };
    input.click();
  };

  async function doUpload(blob: Blob, type: 'small'|'large'|'favicon') {
    const formData = new FormData();
    formData.append('file', blob, `logo-${type}.${blob.type === 'image/svg+xml' ? 'svg' : 'png'}`);
    try {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/upload'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (data.url) {
        if (type === 'small') setSmallLogoUrl(data.url);
        else if (type === 'large') setLargeLogoUrl(data.url);
        else if (type === 'favicon') setFaviconUrl(data.url);
      }
    } catch (err) {
      alert('Upload failed');
    }
  }

function DiscountsPanel({ games, onSaved }: { games: Game[]; onSaved: () => void }) {
  const { toast } = useToast();
  const [gameId, setGameId] = useState<string>(games[0]?.id || '');
  const [mode, setMode] = useState<'percentage' | 'amount'>('percentage');
  const [percentage, setPercentage] = useState<string>('10');
  const [amount, setAmount] = useState<string>('0');
  const [saving, setSaving] = useState(false);
  const selectedGame = games.find(g => g.id === gameId);
  const basePrice = selectedGame ? Number(selectedGame.price) || 0 : 0;
  const pct = Number(percentage);
  const amt = Number(amount);
  const isPctValid = mode === 'percentage' ? pct >= 0 && pct <= 100 : true;
  const isAmtValid = mode === 'amount' ? amt >= 0 && amt <= basePrice : true;
  const effectiveDiscount = mode === 'percentage' ? (basePrice * (pct / 100)) : amt;
  const finalPrice = Math.max(0, basePrice - effectiveDiscount);
  const updateGameMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/games/${gameId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ id: gameId, discountPrice: finalPrice })
      });
      return await res.json();
    },
    onSuccess: (resp) => {
      setSaving(false);
      if (resp?.id) {
        toast({ title: 'Saved', description: 'Discount updated', duration: 1200 });
        onSaved();
      } else {
        toast({ title: 'Error', description: resp?.message || 'Failed to save', duration: 1800 });
      }
    },
    onError: (err: any) => {
      setSaving(false);
      toast({ title: 'Error', description: err?.message || 'Failed to save', duration: 1800 });
    }
  });
  useEffect(() => {
    if (!gameId && games.length) setGameId(games[0]?.id);
  }, [games, gameId]);
  const reset = () => {
    setMode('percentage');
    setPercentage('10');
    setAmount('0');
  };
  const save = () => {
    if (!gameId || !selectedGame) {
      toast({ title: 'Error', description: 'Select a game', duration: 1500 });
      return;
    }
    if (!isPctValid || !isAmtValid) {
      toast({ title: 'Invalid values', description: 'Fix validation errors', duration: 1500 });
      return;
    }
    setSaving(true);
    updateGameMutation.mutate();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Game</Label>
          <Select value={gameId} onValueChange={setGameId}>
            <SelectTrigger><SelectValue placeholder="Select game" /></SelectTrigger>
            <SelectContent>
              {games.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Mode</Label>
          <Select value={mode} onValueChange={(v) => setMode(v as any)}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="percentage">Percentage</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Base Price</Label>
          <Input value={basePrice ? `${basePrice} EGP` : '-'} readOnly />
        </div>
      </div>
      {mode === 'percentage' ? (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Percentage</Label>
          <Input
            type="number"
            value={percentage}
            onChange={(e) => setPercentage(e.target.value)}
            className="col-span-3"
          />
        </div>
      ) : (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Amount</Label>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="col-span-3"
          />
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        {!isPctValid ? 'Percentage must be between 0 and 100. ' : ''}
        {!isAmtValid ? 'Amount must be ≤ base price. ' : ''}
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label className="text-right">Final Price</Label>
        <Input value={`${finalPrice.toFixed(2)} EGP`} readOnly className="col-span-3" />
      </div>
      <div className="flex gap-2">
        <Button onClick={save} disabled={saving || !isPctValid || !isAmtValid} className="bg-gold-primary">Save</Button>
        <Button variant="outline" onClick={reset}>Cancel</Button>
      </div>
    </div>
  );
}
  // (moved) CheckoutTemplatesPanel is defined below LogoManagementPanel

  return (
    <Card className="bg-card/50 border-gold-primary/30">
      <CardHeader>
        <CardTitle>Logo Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-xs text-muted-foreground">Recommended size: 300x100px (PNG). SVG supported. {previewInfo && `(Selected: ${previewInfo})`}</div>
        <div>
          <Label>Small Logo (Header)</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={smallLogoUrl}
              onChange={(e) => setSmallLogoUrl(e.target.value)}
              placeholder="/attached_assets/small-image-logo.png"
            />
            <Button onClick={() => handleImageUpload('small')} variant="outline">
              Upload
            </Button>
          </div>
          {smallLogoUrl && (
            <div className="mt-2 border rounded p-2">
              <img src={smallLogoUrl} alt="Small logo preview" className="h-16 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
          )}
        </div>
        <div>
          <Label>Large Logo</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={largeLogoUrl}
              onChange={(e) => setLargeLogoUrl(e.target.value)}
              placeholder="Large Logo URL"
            />
            <Button onClick={() => handleImageUpload('large')} variant="outline">
              Upload
            </Button>
          </div>
          {largeLogoUrl && (
            <div className="mt-2 border rounded p-2">
              <img src={largeLogoUrl} alt="Large logo preview" className="h-32 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
          )}
        </div>
        <div>
          <Label>Favicon</Label>
          <div className="flex gap-2 mt-2">
            <Input
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="/images/cropped-favicon1-32x32.png"
            />
            <Button onClick={() => handleImageUpload('favicon')} variant="outline">
              Upload
            </Button>
          </div>
          {faviconUrl && (
            <div className="mt-2 border rounded p-2">
              <img src={faviconUrl} alt="Favicon preview" className="h-8 w-8 object-contain" onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }} />
            </div>
          )}
        </div>
        <Button onClick={handleSave} disabled={updateLogoMutation.isPending} className="bg-gold-primary">
          Save Logo Configuration
        </Button>
      </CardContent>
    </Card>
  );
}

function CheckoutTemplatesPanel() {
  const { toast } = useToast();
  const { data: templates } = useQuery<{ customerMessage: string; adminMessage: string }>({
    queryKey: ['/api/admin/checkout/templates'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/checkout/templates'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch templates');
      return res.json();
    },
    refetchOnWindowFocus: false,
    gcTime: Infinity,
    staleTime: Infinity
  });
  const [customerMessage, setCustomerMessage] = useState(templates?.customerMessage || '');
  const [adminMessage, setAdminMessage] = useState(templates?.adminMessage || '');
  useEffect(() => {
    setCustomerMessage(templates?.customerMessage || '');
    setAdminMessage(templates?.adminMessage || '');
  }, [templates?.customerMessage, templates?.adminMessage]);
  const saveMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/checkout/templates'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ customerMessage, adminMessage })
      });
      if (!res.ok) throw new Error('Failed to save templates');
      return res.json();
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Checkout templates updated', duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/checkout/templates'] });
    }
  });
  return (
    <Card className="bg-card/50 border-gold-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">Edit Templates</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="rounded border p-3 bg-muted/30">
          <p className="text-xs text-muted-foreground">
            Placeholders supported: {'{id}'}, {'{total}'}, {'{name}'}, {'{phone}'}, {'{items}'}
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label>Customer Message</Label>
            <Textarea
              value={customerMessage}
              onChange={(e) => setCustomerMessage(e.target.value)}
              className="h-40"
              placeholder="Thank you for your order #{id}! We are processing it."
            />
            <div className="text-xs text-muted-foreground">
              Preview:
              <div className="mt-1 border rounded p-2 bg-muted/20 font-mono whitespace-pre-wrap">
                {(customerMessage || '').replace('{id}', 'TX123').replace('{total}', '999').replace('{name}', 'Alice').replace('{phone}', '+201234567890').replace('{items}', 'Game A x1, Game B x2')}
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Admin Message</Label>
            <Textarea
              value={adminMessage}
              onChange={(e) => setAdminMessage(e.target.value)}
              className="h-40"
              placeholder="New Order #{id}\nTotal: {total} EGP\nCustomer: {name} ({phone})\nItems:\n{items}"
            />
            <div className="text-xs text-muted-foreground">
              Preview:
              <div className="mt-1 border rounded p-2 bg-muted/20 font-mono whitespace-pre-wrap">
                {(adminMessage || '').replace('{id}', 'TX123').replace('{total}', '999').replace('{name}', 'Alice').replace('{phone}', '+201234567890').replace('{items}', 'Game A x1, Game B x2')}
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending || !customerMessage.trim() || !adminMessage.trim()}
            className="bg-gold-primary"
          >
            Save
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function WhatsAppConnectionPanel() {
  const { data: status, refetch } = useQuery<{ qr: string | null; connected: boolean; status: string }>({
    queryKey: ['/api/admin/whatsapp/qr'],
    refetchInterval: 3000,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/whatsapp/qr'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch WhatsApp status');
      return res.json();
    }
  });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (status?.qr) {
      QRCode.toDataURL(status.qr)
        .then((url: string) => setQrDataUrl(url))
        .catch((err: unknown) => console.error(err));
    } else {
      setQrDataUrl(null);
    }
  }, [status?.qr]);

  const [to, setTo] = useState('');
  const [text, setText] = useState('Hello from GameCart!');
  
  const sendMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/whatsapp/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ to, text })
      });
      return res.json();
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-8 items-start">
        <div className="space-y-4 flex-1">
          <div>
            <h3 className="text-lg font-medium mb-2">Status</h3>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${status?.connected ? 'bg-green-500' : 'bg-red-500'}`} />
              <span className="font-semibold">{status?.connected ? 'Connected' : 'Disconnected'}</span>
              <span className="text-sm text-muted-foreground">({status?.status || 'unknown'})</span>
            </div>
          </div>
          
          {!status?.connected && status?.qr && (
            <div className="bg-white p-4 rounded-lg inline-block">
              {qrDataUrl ? (
                <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-64 h-64" />
              ) : (
                <div className="w-64 h-64 flex items-center justify-center text-black">Generating QR...</div>
              )}
              <p className="text-center text-black mt-2 text-sm">Scan with WhatsApp</p>
            </div>
          )}
          
          {!status?.connected && !status?.qr && (
             <div className="text-sm text-muted-foreground">Waiting for QR code... (Check backend logs if stuck)</div>
          )}
        </div>

        <div className="flex-1 space-y-4 w-full max-w-md">
           <h3 className="text-lg font-medium">Test Message</h3>
           <div className="space-y-2">
            <Label>Recipient Phone</Label>
            <Input placeholder="e.g. 201xxxxxxxxx" value={to} onChange={(e) => setTo(e.target.value)} />
           </div>
           <div className="space-y-2">
            <Label>Message</Label>
            <Input placeholder="Message" value={text} onChange={(e) => setText(e.target.value)} />
           </div>
           <Button onClick={() => sendMutation.mutate()} disabled={!to || !text || !status?.connected} className="bg-gold-primary w-full">
             Send Test Message
           </Button>
        </div>
      </div>
    </div>
  );
}

function SellerAlertsPanel() {
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const { data: alerts = [], refetch } = useQuery<Array<{ id: string; type: string; summary: string; created_at: string; read: boolean; flagged: boolean }>>({
    queryKey: ['/api/admin/alerts'],
    refetchInterval: 5000,
    queryFn: async () => {
      const res = await fetch(apiPath('/api/admin/alerts'), { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      return res.json();
    }
  });

  const markRead = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiPath(`/api/admin/alerts/${id}/read`), { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
      return res.json();
    },
    onSuccess: () => refetch()
  });

  const flagAlert = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(apiPath(`/api/admin/alerts/${id}/flag`), { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : undefined });
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
