import React, { useState, useEffect, useRef, Suspense } from 'react';
import { Link } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Trash2, Edit, Plus, MessageSquare, Bell, Check, AlertCircle, Info, Search, Package, Shield, ShoppingCart, User, Bot, Paperclip, Phone, Image } from 'lucide-react';
import { API_BASE_URL, queryClient } from '@/lib/queryClient';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import QRCode from 'qrcode';
import { normalizeNumericString } from '@/lib/quantity';
import { AdminThemePanel } from '@/components/admin-theme-panel';
import { ResponseTemplatesPanel } from '@/components/response-templates-panel';
import { PromoCodesPanel } from '@/components/admin-promo-codes-panel';
import { ReviewsPanel } from '@/components/admin-reviews-panel';
import { AbandonedCartsPanel } from '@/components/admin-abandoned-carts-panel';
const RichTextEditor = React.lazy(() => import('@/components/rich-text-editor'));
import { io, Socket } from 'socket.io-client';
import { HeaderManager } from '@/components/header-manager';

class ErrorBoundary extends React.Component<{ fallback?: React.ReactNode; children?: React.ReactNode }, { hasError: boolean }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidCatch() { }
  render() {
    if (this.state.hasError) {
      return this.props.fallback || <div className="p-4 text-center border rounded">Editor failed to load</div>;
    }
    return this.props.children as any;
  }
}

interface Game {
  id: string;
  name: string;
  slug?: string;
  description?: string;
  price: string;
  discountPrice?: string | number | null;
  stock: number;
  category: string;
  image: string;
  image_url?: string;
  showOnMainPage?: boolean;
  displayOrder?: number;
  deleted?: boolean;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface UserMessage {
  id: string;
  text: string;
  sender: 'user' | 'admin';
  timestamp: string;
  userId: string;
  userName: string;
  userEmail: string;
  userPhone: string;
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

const apiPath = (path: string) => (path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

function ConsistencyCheck() {
  const { toast } = useToast();

  useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 60000, // Check every minute
    queryFn: async () => {
      try {
        const res = await fetch('/api/health');
        if (!res.ok) throw new Error('Health check failed');
        const data = await res.json();
        return data;
      } catch (err) {
        toast({
          title: "Connection Issue",
          description: "Cannot reach backend. Please check your connection.",
          variant: "destructive"
        });
        throw err;
      }
    },
    retry: 3
  });

  return null;
}

// const parseNumberSafe = (v: string | number | null | undefined) => {
//   const s = normalizeNumericString(v);
//   if (!s) return 0;
//   const n = Number(s);
//   return Number.isFinite(n) ? n : 0;
// };


function CategoriesPanel() {
  const { toast } = useToast();

  const { data: categories = [], isLoading, isError, refetch } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    refetchInterval: 30000, // Consistency check
    queryFn: async () => {
      const res = await fetch(apiPath('/api/categories'));
      if (!res.ok) throw new Error('Failed to fetch categories');
      return res.json();
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (name: string) => {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('name', name);
      // Generate slug from name
      const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      formData.append('slug', slug);

      const res = await fetch(apiPath('/api/admin/categories'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      if (!res.ok) throw new Error('Failed to create category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: 'Success', description: 'Category created' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (categoryId: string) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/categories/${categoryId}`), {
        method: 'DELETE',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) throw new Error('Failed to delete category');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: 'Success', description: 'Category deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: { id: string; name?: string; slug?: string; image?: string }) => {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      if (data.name) formData.append('name', data.name);
      if (data.slug) formData.append('slug', data.slug);
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
      toast({ title: 'Success', description: 'Category updated' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">Loading categories...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <p>Failed to load categories.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">Retry Connection</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Manage Categories</h2>
        <Button
          className="bg-gold-primary hover:bg-gold-primary/80"
          onClick={() => {
            const name = prompt('New category name:');
            if (name) createCategoryMutation.mutate(name);
          }}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {categories.map((cat) => (
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
                    if (name) updateCategoryMutation.mutate({ id: cat.id, name });
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
                    if (image && image.trim()) updateCategoryMutation.mutate({ id: cat.id, image: image.trim() });
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
        {categories.length === 0 && <div className="col-span-2 text-center text-muted-foreground">No categories found.</div>}
      </div>
    </div>
  );
}

function OgImagesPanel({ allGames }: { allGames: Game[] }) {
  const { toast } = useToast();

  const { data, isLoading, isError, refetch } = useQuery<any>({
    queryKey: ['/api/admin/og-images'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/og-images'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.message || 'Failed to load OG images');
      return json;
    }
  });

  const [draft, setDraft] = useState<any>(null);

  useEffect(() => {
    if (!data) return;
    const normalized = {
      global: data?.overrides?.global || {},
      share: data?.overrides?.share || {},
      game: data?.overrides?.game || {},
      packageDetails: data?.overrides?.packageDetails || {},
      packageCheckout: data?.overrides?.packageCheckout || {},
    };
    setDraft(normalized);
  }, [data]);

  const saveMutation = useMutation({
    mutationFn: async (nextOverrides: any) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/og-images'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ overrides: nextOverrides })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any)?.message || 'Failed to save');
      return json;
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'OG image settings updated', duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/og-images'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err?.message || 'Failed', variant: 'destructive' });
    }
  });

  const siteLogoUrl = String(data?.siteLogoUrl || '');

  const [selectedGameSlug, setSelectedGameSlug] = useState<string>('');
  const [selectedGameImage, setSelectedGameImage] = useState<string>('');

  const [packageSlug, setPackageSlug] = useState<string>('');
  const [packageSlugImage, setPackageSlugImage] = useState<string>('');

  const [checkoutGameSlug, setCheckoutGameSlug] = useState<string>('');
  const [checkoutIndex, setCheckoutIndex] = useState<number>(0);
  const [checkoutImage, setCheckoutImage] = useState<string>('');

  const setGlobal = (key: string, value: string) => {
    setDraft((prev: any) => ({
      ...(prev || {}),
      global: { ...(prev?.global || {}), [key]: value }
    }));
  };

  const upsertMap = (type: string, key: string, value: string) => {
    setDraft((prev: any) => ({
      ...(prev || {}),
      [type]: { ...(prev?.[type] || {}), [key]: value }
    }));
  };

  const removeMap = (type: string, key: string) => {
    setDraft((prev: any) => {
      const next = { ...(prev || {}) };
      const bag = { ...(next?.[type] || {}) };
      delete (bag as any)[key];
      next[type] = bag;
      return next;
    });
  };

  if (isLoading || !draft) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">Loading OG images...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <p>Failed to load OG image settings.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="bg-card/50 border-gold-primary/30">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2"><Image className="w-5 h-5" /> OG Images</CardTitle>
          <CardDescription>
            Default is the main logo until you change it. You can also clear a field to go back to auto images.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Global default for Home Share (/share)</Label>
              <Input value={String(draft.global?.share ?? '')} onChange={(e) => setGlobal('share', e.target.value)} placeholder={siteLogoUrl || 'Main logo URL'} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('share', siteLogoUrl)}>Use Main Logo</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('share', '')}>Auto</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Global default for Game Share (/share/game/:slug)</Label>
              <Input value={String(draft.global?.game ?? '')} onChange={(e) => setGlobal('game', e.target.value)} placeholder={siteLogoUrl || 'Main logo URL'} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('game', siteLogoUrl)}>Use Main Logo</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('game', '')}>Auto</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Global default for Package Details (/share/packages/:slug)</Label>
              <Input value={String(draft.global?.packageDetails ?? '')} onChange={(e) => setGlobal('packageDetails', e.target.value)} placeholder={siteLogoUrl || 'Main logo URL'} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('packageDetails', siteLogoUrl)}>Use Main Logo</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('packageDetails', '')}>Auto</Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Global default for Package Checkout (/share/package/:gameSlug/:index)</Label>
              <Input value={String(draft.global?.packageCheckout ?? '')} onChange={(e) => setGlobal('packageCheckout', e.target.value)} placeholder={siteLogoUrl || 'Main logo URL'} />
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('packageCheckout', siteLogoUrl)}>Use Main Logo</Button>
                <Button type="button" variant="outline" size="sm" onClick={() => setGlobal('packageCheckout', '')}>Auto</Button>
              </div>
            </div>
          </div>

          <div className="border-t pt-5 space-y-4">
            <div className="text-sm font-semibold">Per Game Override</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <Label>Game</Label>
                <Select value={selectedGameSlug} onValueChange={(v) => setSelectedGameSlug(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allGames) ? allGames : []).map((g) => (
                      <SelectItem key={g.id} value={String(g.slug || g.id)}>{g.name} ({String(g.slug || g.id)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={selectedGameImage} onChange={(e) => setSelectedGameImage(e.target.value)} placeholder="https://..." />
              </div>
              <Button
                type="button"
                className="bg-gold-primary hover:bg-gold-primary/80"
                onClick={() => {
                  if (!selectedGameSlug) return;
                  upsertMap('game', selectedGameSlug, selectedGameImage.trim());
                  setSelectedGameImage('');
                }}
              >
                Save Game Override
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(draft.game || {}).length === 0 ? (
                <div className="text-xs text-muted-foreground">No per-game overrides yet.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(draft.game || {}).map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-2">
                      <div className="text-xs w-[220px] truncate">{k}</div>
                      <div className="text-xs flex-1 truncate">{String(v || '')}</div>
                      <Button type="button" size="sm" variant="outline" onClick={() => window.open(`/share/game/${encodeURIComponent(String(k))}`, '_blank')}>Preview</Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeMap('game', k)}>Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-5 space-y-4">
            <div className="text-sm font-semibold">Per Package Details Override (by package slug)</div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-end">
              <div className="space-y-2">
                <Label>Package slug</Label>
                <Input value={packageSlug} onChange={(e) => setPackageSlug(e.target.value)} placeholder="example-package-slug" />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={packageSlugImage} onChange={(e) => setPackageSlugImage(e.target.value)} placeholder="https://..." />
              </div>
              <Button
                type="button"
                className="bg-gold-primary hover:bg-gold-primary/80"
                onClick={() => {
                  const key = packageSlug.trim();
                  if (!key) return;
                  upsertMap('packageDetails', key, packageSlugImage.trim());
                  setPackageSlugImage('');
                }}
              >
                Save Package Override
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(draft.packageDetails || {}).length === 0 ? (
                <div className="text-xs text-muted-foreground">No package details overrides yet.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(draft.packageDetails || {}).map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-2">
                      <div className="text-xs w-[220px] truncate">{k}</div>
                      <div className="text-xs flex-1 truncate">{String(v || '')}</div>
                      <Button type="button" size="sm" variant="outline" onClick={() => window.open(`/share/packages/${encodeURIComponent(String(k))}`, '_blank')}>Preview</Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeMap('packageDetails', k)}>Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="border-t pt-5 space-y-4">
            <div className="text-sm font-semibold">Per Package Checkout Override</div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 items-end">
              <div className="space-y-2">
                <Label>Game slug</Label>
                <Select value={checkoutGameSlug} onValueChange={(v) => setCheckoutGameSlug(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select game" />
                  </SelectTrigger>
                  <SelectContent>
                    {(Array.isArray(allGames) ? allGames : []).map((g) => (
                      <SelectItem key={g.id} value={String(g.slug || g.id)}>{g.name} ({String(g.slug || g.id)})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Package index</Label>
                <Input type="number" value={String(checkoutIndex)} onChange={(e) => setCheckoutIndex(Number(e.target.value || 0))} />
              </div>
              <div className="space-y-2">
                <Label>OG Image URL</Label>
                <Input value={checkoutImage} onChange={(e) => setCheckoutImage(e.target.value)} placeholder="https://..." />
              </div>
              <Button
                type="button"
                className="bg-gold-primary hover:bg-gold-primary/80"
                onClick={() => {
                  const g = checkoutGameSlug.trim();
                  if (!g) return;
                  const key = `${String(g).toLowerCase().replace(/_/g, '-').replace(/\s+/g, '-')}:${Number.isFinite(checkoutIndex) ? checkoutIndex : 0}`;
                  upsertMap('packageCheckout', key, checkoutImage.trim());
                  setCheckoutImage('');
                }}
              >
                Save Checkout Override
              </Button>
            </div>

            <div className="space-y-2">
              {Object.entries(draft.packageCheckout || {}).length === 0 ? (
                <div className="text-xs text-muted-foreground">No checkout overrides yet.</div>
              ) : (
                <div className="space-y-2">
                  {Object.entries(draft.packageCheckout || {}).map(([k, v]: any) => (
                    <div key={k} className="flex items-center gap-2">
                      <div className="text-xs w-[220px] truncate">{k}</div>
                      <div className="text-xs flex-1 truncate">{String(v || '')}</div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          const parts = String(k).split(':');
                          const g = parts[0] || '';
                          const idx = parts[1] || '0';
                          window.open(`/share/package/${encodeURIComponent(g)}/${encodeURIComponent(idx)}`, '_blank');
                        }}
                      >
                        Preview
                      </Button>
                      <Button type="button" size="sm" variant="destructive" onClick={() => removeMap('packageCheckout', k)}>Remove</Button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="pt-2">
            <Button
              type="button"
              className="bg-cyan-600 hover:bg-cyan-500 text-white"
              disabled={saveMutation.isPending}
              onClick={() => saveMutation.mutate(draft)}
            >
              Apply Changes
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ArrangementPanel() {
  const { toast } = useToast();
  const [arrangementFilter, setArrangementFilter] = useState<'active' | 'deleted' | 'all'>('active');
  const { data: arrangementGames = [], isFetching: isFetchingArrangement, isLoading, isError, refetch } = useQuery<any[]>({
    queryKey: ['/api/games/admin/arrangement', arrangementFilter],
    refetchInterval: 30000, // Consistency check
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/admin/arrangement?filter=${arrangementFilter}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch arrangement');
      return data;
    }
  });
  const [arrangementDraft, setArrangementDraft] = useState<Record<string, { showOnMainPage?: boolean; displayOrder?: number }>>({});

  useEffect(() => {
    const next: Record<string, { showOnMainPage?: boolean; displayOrder?: number }> = {};
    (Array.isArray(arrangementGames) ? arrangementGames : []).forEach((g: any) => {
      next[g.id] = {
        showOnMainPage: !!g.show_on_main_page,
        displayOrder: Number(g.display_order ?? 999)
      };
    });
    setArrangementDraft(next);
  }, [arrangementGames]);

  const bulkArrangementMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const updates = Object.entries(arrangementDraft).map(([id, v]) => ({
        id,
        showOnMainPage: v.showOnMainPage,
        displayOrder: v.displayOrder
      }));
      const res = await fetch(apiPath('/api/games/admin/arrangement/bulk'), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ updates })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update arrangement');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games/admin/arrangement'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      toast({ title: 'Success', description: 'Arrangement updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
        <p className="text-muted-foreground">Loading arrangement...</p>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="p-8 text-center text-red-500 space-y-2">
        <AlertCircle className="h-8 w-8 mx-auto" />
        <p>Failed to load arrangement.</p>
        <Button onClick={() => refetch()} variant="outline" size="sm">Retry Connection</Button>
      </div>
    );
  }

  return (
    <Card className="bg-card/50 border-gold-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">Game Arrangement</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-3 mb-3">
          <Select value={arrangementFilter} onValueChange={(v: any) => setArrangementFilter(v)}>
            <SelectTrigger className="w-[220px]">
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="deleted">Deleted</SelectItem>
              <SelectItem value="all">All</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="default"
            disabled={bulkArrangementMutation.isPending}
            onClick={() => bulkArrangementMutation.mutate()}
            className="bg-cyan-600 hover:bg-cyan-500 text-white"
          >
            Apply Changes
          </Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left">
                <th className="p-2">Name</th>
                <th className="p-2">Slug</th>
                <th className="p-2">Visible on Main</th>
                <th className="p-2">Display Order</th>
                <th className="p-2">Deleted</th>
              </tr>
            </thead>
            <tbody>
              {(Array.isArray(arrangementGames) ? arrangementGames : []).map((g: any) => {
                const draft = arrangementDraft[g.id] || {};
                return (
                  <tr key={g.id} className="border-t">
                    <td className="p-2">{g.name}</td>
                    <td className="p-2">{g.slug}</td>
                    <td className="p-2">
                      <Checkbox
                        checked={!!draft.showOnMainPage}
                        onCheckedChange={(val: any) => {
                          setArrangementDraft(prev => ({ ...prev, [g.id]: { ...prev[g.id], showOnMainPage: !!val } }));
                        }}
                      />
                    </td>
                    <td className="p-2">
                      <Input
                        type="number"
                        min={0}
                        value={Number(draft.displayOrder ?? 999)}
                        onChange={(e) => {
                          const n = Number(e.target.value);
                          setArrangementDraft(prev => ({ ...prev, [g.id]: { ...prev[g.id], displayOrder: Number.isFinite(n) ? n : 999 } }));
                        }}
                        className="w-24"
                      />
                    </td>
                    <td className="p-2">{g.deleted ? 'Yes' : 'No'}</td>
                  </tr>
                );
              })}
              {(!isFetchingArrangement && (!arrangementGames || arrangementGames.length === 0)) && (
                <tr>
                  <td colSpan={5} className="p-4 text-center text-muted-foreground">No games</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}



export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('games');
  const [searchGameTerm, setSearchGameTerm] = useState('');
  const [editingGame, setEditingGame] = useState<Game | null>(null);
  const [packagesGameId, setPackagesGameId] = useState<string | null>(null);
  const [packagesDraft, setPackagesDraft] = useState<Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null; bonus?: string | null }>>([]);
  const { toast } = useToast();
  const [originalPackages, setOriginalPackages] = useState<Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null; bonus?: string | null }>>([]);
  const [addedIndices, setAddedIndices] = useState<Set<number>>(new Set());
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [replyMessage, setReplyMessage] = useState('');
  const [cardsPage, setCardsPage] = useState(1);
  const [cardsLimit, setCardsLimit] = useState(20);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [newCardGameId, setNewCardGameId] = useState<string>('');
  const [newCardCode, setNewCardCode] = useState('');
  const [alertStatus, setAlertStatus] = useState<string>('all');
  const [alertType, setAlertType] = useState<string>('all');
  const [alertSearch, setAlertSearch] = useState('');
  const [selectedGames, setSelectedGames] = useState<string[]>([]);
  const chatSocketRef = useRef<Socket | null>(null);

  // Global socket listeners for real-time data sync
  useEffect(() => {
    const socket = io(API_BASE_URL, {
      transports: ['polling'],
      upgrade: false,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      path: '/socket.io'
    });

    const handleOrdersUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      toast({ title: 'Orders Updated', description: 'New order data received.' });
    };

    const handleGamesUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/admin/arrangement'] });
    };

    const handleCategoriesUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
    };

    const handleUsersUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
    };

    const handleInteractionsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/interactions'] });
    };

    const handleConfirmationsUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/confirmations'] });
    };

    const handleAdminNotification = (data: any) => {
      if (data && data.message) {
        toast({
          title: data.type === 'new_order' ? "New Order" : "Notification",
          description: data.message,
        });

        if (data.type === 'new_order') {
          queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/users'] });
          queryClient.invalidateQueries({ queryKey: ['/api/admin/alerts'] });
        }
      }
    };

    socket.on('orders_updated', handleOrdersUpdate);
    socket.on('games_updated', handleGamesUpdate);
    socket.on('categories_updated', handleCategoriesUpdate);
    socket.on('users_updated', handleUsersUpdate);
    socket.on('interactions_updated', handleInteractionsUpdate);
    socket.on('confirmations_updated', handleConfirmationsUpdate);
    socket.on('admin_notification', handleAdminNotification);

    return () => {
      socket.off('orders_updated', handleOrdersUpdate);
      socket.off('games_updated', handleGamesUpdate);
      socket.off('categories_updated', handleCategoriesUpdate);
      socket.off('users_updated', handleUsersUpdate);
      socket.off('interactions_updated', handleInteractionsUpdate);
      socket.off('confirmations_updated', handleConfirmationsUpdate);
      socket.off('admin_notification', handleAdminNotification);
      socket.disconnect();
    };
  }, []);

  // Fetch games
  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ['/api/games'],
  });

  // Fetch categories
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
  });

  const { data: adminPackagesData = [], isFetching: isFetchingAdminPackages } = useQuery<Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null; bonus?: string | null }>>({
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
      image: p?.image || null,
      bonus: p?.bonus != null ? String(p.bonus) : ''
    }));
    setPackagesDraft(normalized);
    setOriginalPackages(normalized);
    setAddedIndices(new Set());
  }, [packagesGameId, adminPackagesData]);

  const savePackagesMutation = useMutation({
    mutationFn: async (payload: { gameId: string; packages: Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }> }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${payload.gameId}/packages`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ packages: payload.packages })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update packages');
      return data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${variables.gameId}/packages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${variables.gameId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      const g = allGames.find((gg) => gg.id === variables.gameId);
      if (g?.slug) {
        queryClient.invalidateQueries({ queryKey: [`/api/games/${g.slug}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/slug/${g.slug}`] });
      }
      toast({ title: 'Saved', description: 'Packages updated', duration: 1500 });
      setPackagesGameId(null);
    },
    onError: (error: any) => {
      const msg = (error?.message && String(error.message)) || 'Failed to update packages';
      toast({ title: 'Error', description: msg, variant: 'destructive' });
    }
  });
  const savePackagesMutationAsync = useMutation({
    mutationFn: async (payload: { gameId: string; packages: Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }> }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${payload.gameId}/packages`), {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ packages: payload.packages })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to update packages');
      return data;
    }
  });
  const validatePackage = (p: { amount: string; price: number; discountPrice: number | null; duration?: string; description?: string }) => {
    const amt = String(p.amount || '').trim();
    if (!amt) return 'Amount is required';
    const priceNum = Number(normalizeNumericString(p.price));
    if (!Number.isFinite(priceNum) || priceNum < 0) return 'Price must be a non-negative number';
    if (p.discountPrice != null) {
      const d = Number(normalizeNumericString(p.discountPrice));
      if (!Number.isFinite(d) || d < 0) return 'Discount price must be non-negative';
    }
    if (p.duration && String(p.duration).length > 50) return 'Duration too long';
    if (p.description && String(p.description).length > 500) return 'Description too long';
    return null;
  };
  const prepareNormalizedPackages = (list: Array<{ amount: string; price: number; discountPrice: number | null; image?: string | null }>) => {
    return list.map(p => {
      return {
        ...p,
        price: Number(normalizeNumericString(p.price)),
        discountPrice: p.discountPrice == null ? null : Number(normalizeNumericString(p.discountPrice))
      };
    });
  };

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

  const [packagesFilter, setPackagesFilter] = useState('');

  // Filter games based on search
  const games = allGames.filter((game: Game) =>
    !searchGameTerm ||
    game.name.toLowerCase().includes(searchGameTerm.toLowerCase()) ||
    game.slug?.toLowerCase().includes(searchGameTerm.toLowerCase())
  );



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
      if (!res.ok) {
        if (res.status === 403) {
          throw new Error('Unauthorized - Invalid or missing admin token');
        }
        throw new Error('Failed to fetch alerts');
      }
      const data = await res.json();
      return Array.isArray(data) ? data : [];
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

  // Fetch all live chat sessions
  const { data: chatSessions = [] } = useQuery<Array<{ id: string; name?: string | null; email?: string | null; phone?: string | null; lastActivity?: any; unreadCount?: number; lastMessage?: string | null }>>({
    queryKey: ['/api/admin/chat/sessions'],
    enabled: true,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/chat/sessions`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({ sessions: [] }));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch chat sessions');
      return Array.isArray(data) ? data : [];
    }
  });

  const selectedSessionInfo = selectedUser ? (chatSessions as any[]).find((s) => s && s.id === selectedUser) : null;

  // Fetch messages for selected session
  const { data: sessionMessages = [] } = useQuery<Array<{ id: string; sender: string; message: string; timestamp: number; read: boolean; attachmentUrl?: string | null; attachmentType?: string | null }>>({
    queryKey: [`/api/admin/chat/${selectedUser}`],
    enabled: !!selectedUser,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`${API_BASE_URL}/api/admin/chat/${selectedUser}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch session messages');
      return Array.isArray(data) ? data : [];
    }
  });

  const [replyAttachment, setReplyAttachment] = useState<{ url: string; type: string } | null>(null);

  const uploadChatAttachment = useMutation({
    mutationFn: async (file: File) => {
      const token = localStorage.getItem('adminToken');
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch(apiPath('/api/admin/upload'), {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error((data as any)?.message || 'Failed to upload attachment');
      }
      return data;
    },
    onSuccess: (data: any) => {
      const url: string = data?.absoluteUrl || data?.url;
      if (!url) return;
      const mime = (data?.mimeType as string | undefined) || '';
      const lowerUrl = url.toLowerCase();
      const isImage = mime.startsWith('image/') || /\.(png|jpe?g|gif|webp|svg)$/.test(lowerUrl);
      setReplyAttachment({ url, type: isImage ? 'image' : 'file' });
    }
  });

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
    if (!token) return;

    const socket = io(API_BASE_URL, {
      transports: ['polling'],
      upgrade: false,
      path: '/socket.io',
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    chatSocketRef.current = socket;

    socket.on('connect', () => {
      socket.emit('admin_join', token);
      if (selectedUser) {
        socket.emit('join_session', { sessionId: selectedUser });
      }
    });

    socket.on('session_updated', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
    });

    socket.on('session_read', () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
    });

    socket.on('new_message', (msg: any) => {
      if (!msg || !msg.sessionId) return;
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/chat/${msg.sessionId}`] });
    });

    return () => {
      socket.off('session_updated');
      socket.off('session_read');
      socket.off('new_message');
      socket.disconnect();
      chatSocketRef.current = null;
    };
  }, [selectedUser]);

  useEffect(() => {
    if (!selectedUser || !chatSocketRef.current) return;
    chatSocketRef.current.emit('join_session', { sessionId: selectedUser });

    const token = localStorage.getItem('adminToken');
    if (!token) return;

    fetch(`${API_BASE_URL}/api/admin/chat/${selectedUser}/read`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`
      }
    }).catch(() => { });
  }, [selectedUser]);

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
    const [selectedOrder, setSelectedOrder] = useState<any>(null);
    const [responseMessage, setResponseMessage] = useState('');
    const [showResponseModal, setShowResponseModal] = useState(false);

    const { data: orders = [], isLoading, isError, refetch } = useQuery<Array<{ 
      id: string; 
      paymentMethod: string; 
      total: number; 
      status: string; 
      timestamp: number; 
      customerName: string; 
      customerPhone: string; 
      items: Array<{ gameId: string; gameName?: string; quantity: number; price: number }>;
      player_id?: string;
      notes?: string;
      // Add support for potential camelCase from backend or other sources
      playerId?: string;
      // Legacy or alternative field names
      customer_name?: string;
      customer_email?: string;
      customer_phone?: string;
      payment_method?: string;
      total_amount?: number;
      delivery_method?: string;
      receipt_url?: string;
      user_id?: string;
      created_at?: string;
    }>>({
      queryKey: ['/api/orders'],
      enabled: true,
      refetchInterval: 30000, // Consistency check
      queryFn: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const res = await fetch(`${API_BASE_URL}/api/orders`, { headers: token ? { Authorization: `Bearer ${token}` } : undefined });
        if (!res.ok) throw new Error('Failed to fetch transactions');
        return await res.json();
      }
    });

    const respondToOrderMutation = useMutation({
      mutationFn: async ({ orderId, message, status }: { orderId: string; message: string; status: 'confirmed' | 'rejected' }) => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(`${API_BASE_URL}/api/orders/${orderId}/respond`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          body: JSON.stringify({ message, status })
        });
        if (!res.ok) throw new Error('Failed to respond to order');
        return res.json();
      },
      onSuccess: () => {
        toast({ title: 'Response sent', description: 'Order status updated and customer notified.' });
        setShowResponseModal(false);
        setResponseMessage('');
        setSelectedOrder(null);
        queryClient.invalidateQueries({ queryKey: ['/api/orders'] });
      },
      onError: (error: any) => {
        toast({ title: 'Failed to respond', description: error.message, variant: 'destructive' });
      }
    });

    const [actionType, setActionType] = useState<'confirmed' | 'rejected'>('confirmed');

    const { data: responseTemplates = [] } = useQuery<Array<{ id: string; title: string; message: string; type: string }>>({
      queryKey: ['/api/admin/response-templates'],
      enabled: showResponseModal,
      queryFn: async () => {
        const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
        const res = await fetch(`${API_BASE_URL}/api/admin/response-templates`, {
          headers: token ? { Authorization: `Bearer ${token}` } : undefined
        });
        if (!res.ok) throw new Error('Failed to fetch templates');
        return await res.json();
      }
    });

    const handleTemplateSelect = (templateId: string) => {
      const template = responseTemplates.find(t => t.id === templateId);
      if (template) {
        setResponseMessage(template.message);
      }
    };

    const handleRespondToOrder = (order: any, type: 'confirmed' | 'rejected') => {
      setSelectedOrder(order);
      setActionType(type);
      if (type === 'confirmed') {
        setResponseMessage(`Your order ${order.id} has been confirmed! Your digital codes will be delivered shortly.`);
      } else {
        setResponseMessage(`We regret to inform you that your order ${order.id} could not be processed at this time. Please contact support for assistance.`);
      }
      setShowResponseModal(true);
    };

    const getStatusColor = (status: string) => {
      switch (status?.toLowerCase()) {
        case 'confirmed': return 'text-green-400';
        case 'pending': return 'text-yellow-400';
        case 'cancelled': return 'text-red-400';
        default: return 'text-gray-400';
      }
    };

    if (isLoading) {
      return (
        <div className="p-8 text-center space-y-4">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
          <p className="text-muted-foreground">Loading orders...</p>
        </div>
      );
    }

    if (isError) {
      return (
        <div className="p-8 text-center text-red-500 space-y-2">
          <AlertCircle className="h-8 w-8 mx-auto" />
          <p>Failed to load orders.</p>
          <Button onClick={() => refetch()} variant="outline" size="sm">Retry Connection</Button>
        </div>
      );
    }

    return (
      <>
        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Recent Orders</CardTitle>
            <p className="text-sm text-muted-foreground">Manage customer orders and communicate with users</p>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">Order</th>
                    <th className="p-2">Customer</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Contact</th>
                    <th className="p-2">Status</th>
                    <th className="p-2">Timestamp</th>
                    <th className="p-2">Payment</th>
                    <th className="p-2">Total</th>
                    <th className="p-2">Items</th>
                    <th className="p-2">Delivery</th>
                    <th className="p-2">Receipt</th>
                    <th className="p-2">Player ID</th>
                    <th className="p-2">Notes</th>
                    <th className="p-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t">
                      <td className="p-2 font-mono">{o.id}</td>
                      <td className="p-2">{(o as any).customer_name || o.customerName || '-'}</td>
                      <td className="p-2">{(o as any).customer_email || (o as any).customerEmail || '-'}</td>
                      <td className="p-2">{(o as any).customer_phone || o.customerPhone || '-'}</td>
                      <td className="p-2">
                        <span className={`font-medium ${getStatusColor(o.status)}`}>
                          {o.status || 'pending'}
                        </span>
                      </td>
                      <td className="p-2" dir="ltr">
                        {(() => {
                          try {
                            const d = new Date((o as any).created_at || (o as any).timestamp);
                            if (isNaN(d.getTime())) return '-';
                            return d.toLocaleDateString('en-GB').replace(/\//g, '-') + ' ' + d.toLocaleTimeString();
                          } catch { return '-'; }
                        })()}
                      </td>
                      <td className="p-2">{(o as any).payment_method || o.paymentMethod}</td>
                      <td className="p-2">{(o as any).total_amount || o.total} EGP</td>
                      <td className="p-2">
                        {o.items && o.items.length
                          ? o.items
                            .map((it: any) => `${it.title || it.name || it.gameName || it.gameId} x${it.quantity}`)
                            .join(', ')
                          : '-'}
                      </td>
                      <td className="p-2 capitalize">{(o as any).delivery_method || (o as any).deliveryMethod || 'whatsapp'}</td>
                      <td className="p-2">
                        {((o as any).receipt_url || (o as any).receiptUrl) ? (
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm" className="h-7 text-xs">
                                View Receipt
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                              <DialogHeader>
                                <DialogTitle>Payment Receipt</DialogTitle>
                                <DialogDescription>Order #{o.id}</DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-center">
                                <img
                                  src={(o as any).receipt_url || (o as any).receiptUrl}
                                  alt="Receipt"
                                  className="max-w-full h-auto rounded-lg border"
                                />
                              </div>
                            </DialogContent>
                          </Dialog>
                        ) : (
                          <span className="text-muted-foreground text-xs">-</span>
                        )}
                      </td>
                      <td className="p-2 font-mono text-xs">
                        {o.player_id || o.playerId || '-'}
                      </td>
                      <td className="p-2 text-xs max-w-[200px] truncate" title={o.notes || ''}>
                        {o.notes || '-'}
                      </td>
                      <td className="p-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Open Chat"
                          onClick={() => {
                            // This is a quick hack to switch tabs if they are controlled by URL or parent state
                            // Assuming we can just switch the tab state if we had access, but we are in a sub-component? 
                            // No, OrdersPanel is defined INSIDE AdminPage in the file `admin.tsx`.
                            // So it has access to `setActiveTab` and `setSelectedUser`.
                            // I will verify this scope access.
                            if ((o as any).user_id) {
                              setSelectedUser((o as any).user_id);
                              setActiveTab('chats');
                            } else {
                              toast({ title: 'No user linked', description: 'This order has no registered user account.', variant: 'destructive' });
                            }
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </td>
                      <td className="p-2">
                        {(!o.status || ['pending', 'pending_approval'].includes(o.status)) && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleRespondToOrder(o, 'confirmed')}
                              className="bg-green-600 hover:bg-green-700 text-white"
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleRespondToOrder(o, 'rejected')}
                              variant="destructive"
                            >
                              Reject
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && (
                    <tr>
                      <td colSpan={14} className="p-4 text-center text-muted-foreground">No orders</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent >
        </Card >

        {/* Response Modal */}
        < Dialog open={showResponseModal} onOpenChange={setShowResponseModal} >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Confirm Order & Send Message</DialogTitle>
              <DialogDescription>
                Confirm order {selectedOrder?.id} and send a message to the customer.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Use Template</Label>
                <Select onValueChange={handleTemplateSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a response template..." />
                  </SelectTrigger>
                  <SelectContent>
                    {responseTemplates
                      .filter(t => t.type === 'other' || (actionType === 'confirmed' && t.type === 'approve') || (actionType === 'rejected' && t.type === 'reject'))
                      .map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {t.title}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="response-message">Message to Customer</Label>
                <Textarea
                  id="response-message"
                  value={responseMessage}
                  onChange={(e) => setResponseMessage(e.target.value)}
                  placeholder="Enter your message to the customer..."
                  rows={4}
                />
              </div>
              {selectedOrder && (
                <div className="bg-muted/50 p-3 rounded-lg">
                  <p className="text-sm font-medium">Order Details:</p>
                  <p className="text-sm">Customer: {selectedOrder.customerName}</p>
                  <p className="text-sm">Phone: {selectedOrder.customerPhone}</p>
                  <p className="text-sm">Total: {selectedOrder.total} EGP</p>
                  <p className="text-sm">
                    Items:{' '}
                    {selectedOrder.items
                      .map((it: any) => `${it.gameName || it.gameId} x${it.quantity}`)
                      .join(', ')}
                  </p>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowResponseModal(false)}>
                Cancel
              </Button>
              <Button
                onClick={() => {
                  if (!selectedOrder) return;
                  respondToOrderMutation.mutate({
                    orderId: selectedOrder.id,
                    message: responseMessage,
                    status: actionType
                  });
                }}
                disabled={respondToOrderMutation.isPending || !responseMessage.trim() || !selectedOrder}
                className="bg-green-600 hover:bg-green-700"
              >
                {respondToOrderMutation.isPending ? 'Sending...' : 'Confirm & Send'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog >
      </>
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
        setEditingGame((prev) => (prev ? ({ ...prev, image_url: resp.image_url }) : prev));
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
        body: JSON.stringify({ ...gameData, showOnMainPage: false, displayOrder: 999 })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to create game');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
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

  // Send reply mutation for live chat
  const replyMutation = useMutation({
    mutationFn: async () => {
      if (!selectedUser || (!replyMessage.trim() && !replyAttachment)) throw new Error('No session selected or message/attachment empty');

      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/chat/${selectedUser}`), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          message: replyMessage.trim(),
          attachmentUrl: replyAttachment?.url,
          attachmentType: replyAttachment?.type
        })
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to send reply');
      return data;
    },
    onSuccess: () => {
      setReplyMessage('');
      setReplyAttachment(null);
      queryClient.invalidateQueries({ queryKey: [`/api/admin/chat/${selectedUser}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
      toast({ title: 'Reply sent', description: 'Your message has been sent.' });
    },
    onError: (error) => {
      toast({
        title: 'Failed to send reply',
        description: error.message,
        variant: 'destructive'
      });
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
    const isPctValid = mode === 'percentage' ? pct >= 0 : true;
    const isAmtValid = mode === 'amount' ? true : true;
    const finalPrice = mode === 'percentage' ? basePrice * (pct / 100) : basePrice - amt;
    const saveMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        // First fetch current packages
        const fetchRes = await fetch(apiPath(`/api/games/${gameId}/packages`), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (!fetchRes.ok) throw new Error('Failed to fetch packages');
        const packages = await fetchRes.json();

        // Apply discount to each package (skip packages with manually set discount prices)
        const updatedPackages = packages.map((pkg: any) => {
          // If package already has a manually set discount price, preserve it
          if (pkg.discountPrice != null && pkg.discountPrice !== '') {
            return pkg;
          }
          // Otherwise apply the bulk discount
          return {
            ...pkg,
            discountPrice: mode === 'percentage'
              ? Number(pkg.price) * (pct / 100)
              : Number(pkg.price) - amt
          };
        });

        // Update packages
        const res = await fetch(apiPath(`/api/games/${gameId}/packages`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ packages: updatedPackages })
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data as any)?.message || 'Failed to update package discounts');
        return data;
      },
      onSuccess: (resp) => {
        setSaving(false);
        toast({ title: 'Saved', description: 'Package discounts updated (manual discounts preserved)', duration: 1200 });
        queryClient.invalidateQueries({ queryKey: ['/api/games'] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/id/${gameId}`] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/packages`] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
        onSaved();
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
      if (!isPctValid) {
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
            <Label className="text-right">Percentage (100+ for increase)</Label>
            <Input
              type="number"
              value={percentage}
              onChange={(e) => setPercentage(e.target.value)}
              className="col-span-3"
            />
          </div>
        ) : (
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount (+ for discount, - for increase)</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="col-span-3"
            />
          </div>
        )}
        <div className="text-xs text-muted-foreground">
          {!isPctValid ? 'Percentage must be 0 or greater. ' : ''}
        </div>
        <div className="grid grid-cols-4 items-center gap-4">
          <Label className="text-right">Final Price</Label>
          <Input value={`${finalPrice.toFixed(2)} EGP`} readOnly className="col-span-3" />
        </div>
        <div className="text-xs text-muted-foreground">
          Note: Packages with manually set discount prices will keep their custom discounts.
        </div>
        <div className="flex gap-2">
          <Button onClick={save} disabled={saving || !isPctValid} className="bg-gold-primary">Save</Button>
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
          setEditingGame({ ...editingGame, image_url: data.url });
        }
      } else if (data.url) {
        alert('Image uploaded: ' + data.url);
      }
    } catch (err) {
      console.error('Upload failed', err);
      alert('Upload failed');
    }
  };

  const handleRichTextImageUpload = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);

    const token = localStorage.getItem('adminToken');
    const res = await fetch(apiPath('/api/admin/images/upload-cloudinary'), {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      body: formData
    });
    const data = await res.json();
    if (!data.url) {
      throw new Error('Upload failed');
    }
    return data.url;
  };

  function AdvancedEditorPanel() {
    const { toast } = useToast();
    const [selectedId, setSelectedId] = useState<string>(allGames[0]?.id || '');
    const [description, setDescription] = useState<string>('');
    const [preview, setPreview] = useState<boolean>(false);

    useEffect(() => {
      if (!selectedId && allGames.length) setSelectedId(allGames[0].id);
    }, [allGames, selectedId]);

    const { data: selectedGame, isFetching: isFetchingGame } = useQuery<Game>({
      queryKey: [`/api/games/id/${selectedId}`],
      enabled: !!selectedId,
    });

    useEffect(() => {
      setDescription(selectedGame?.description || '');
    }, [selectedGame?.description]);

    const saveMutation = useMutation({
      mutationFn: async () => {
        const token = localStorage.getItem('adminToken');
        const res = await fetch(apiPath(`/api/games/${selectedId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ description })
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any)?.message || 'Failed to update description');
        return data;
      },
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ['/api/games'] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/id/${selectedId}`] });
        toast({ title: 'Saved', description: 'Description updated', duration: 1500 });
      },
      onError: (err: any) => {
        toast({ title: 'Error', description: err?.message || 'Failed to save', variant: 'destructive' });
      }
    });

    return (
      <Card className="bg-card/50 border-gold-primary/30">
        <CardHeader>
          <CardTitle className="text-lg">Advanced Game Description Editor</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Game</Label>
              <Select value={selectedId} onValueChange={setSelectedId}>
                <SelectTrigger><SelectValue placeholder="Select a game" /></SelectTrigger>
                <SelectContent>
                  {allGames.map(g => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="md:col-span-2">
              {selectedGame ? (
                <div className="flex items-center gap-3">
                  {selectedGame.image ? <img src={selectedGame.image} alt="" className="w-12 h-12 rounded border border-gold-primary/30 object-cover" /> : null}
                  <div>
                    <div className="font-medium">{selectedGame.name}</div>
                    <div className="text-xs text-muted-foreground">Category: {selectedGame.category} • Price: {selectedGame.price} EGP</div>
                  </div>
                </div>
              ) : isFetchingGame ? <div className="text-sm text-muted-foreground">Loading game…</div> : <div className="text-sm text-muted-foreground">Select a game</div>}
            </div>
          </div>

          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => setPreview(!preview)}>
              {preview ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!selectedId || saveMutation.isPending}
              className="bg-gold-primary hover:bg-gold-primary/90"
              size="sm"
            >
              {saveMutation.isPending ? 'Saving…' : 'Save Description'}
            </Button>
          </div>

          {preview ? (
            <div className="prose prose-invert max-w-none border rounded-lg p-4 bg-muted/50 [&_img]:max-w-full [&_img]:h-auto">
              <div dangerouslySetInnerHTML={{ __html: description || '<p class="text-muted-foreground italic">No description yet...</p>' }} />
            </div>
          ) : (
            <ErrorBoundary>
              <Suspense fallback={<div className="p-4 text-center border rounded">Loading editor...</div>}>
                <RichTextEditor
                  value={description}
                  onChange={setDescription}
                  onImageUpload={handleRichTextImageUpload}
                  placeholder="Write a detailed description for this game..."
                  className="min-h-[400px]"
                />
              </Suspense>
            </ErrorBoundary>
          )}
        </CardContent>
      </Card>
    );
  }

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
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error((data as any)?.message || 'Failed to save content');
        return data;
      },
      onSuccess: (resp) => {
        if (resp?.ok) {
          toast({ title: 'Saved', description: 'Content updated', duration: 1500 });
          queryClient.invalidateQueries({ queryKey: ['/api/content'] });
        } else {
          toast({ title: 'Error', description: resp?.message || 'Failed to save', duration: 2000 });
        }
      },
      onError: (err: any) => {
        toast({ title: 'Error', description: String(err?.message || err || 'Failed to save'), duration: 2500, variant: 'destructive' });
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
        <ConsistencyCheck />

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <ScrollArea className="w-full whitespace-nowrap rounded-md border">
            <TabsList className="flex w-full justify-start p-0 h-auto bg-transparent overflow-x-auto whitespace-nowrap">
              <TabsTrigger value="templates" data-testid="tab-templates" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Response Templates</TabsTrigger>
              <TabsTrigger value="games" data-testid="tab-games" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Games & Products</TabsTrigger>
              <TabsTrigger value="discounts" data-testid="tab-discounts" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Discounts</TabsTrigger>
              <TabsTrigger value="users" data-testid="tab-users" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Users</TabsTrigger>
              <TabsTrigger value="packages" data-testid="tab-packages" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Packages</TabsTrigger>
              <TabsTrigger value="categories" data-testid="tab-categories" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Categories</TabsTrigger>
              <TabsTrigger value="cards" data-testid="tab-cards" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Game Cards</TabsTrigger>
              <TabsTrigger value="orders" data-testid="tab-orders" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Orders</TabsTrigger>
              <TabsTrigger value="arrangement" data-testid="tab-arrangement" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Arrangement</TabsTrigger>
              <TabsTrigger value="chats" data-testid="tab-chats" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Support Chat</TabsTrigger>

              <TabsTrigger value="interactions" data-testid="tab-interactions" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Interactions</TabsTrigger>
              <TabsTrigger value="chat-widget" data-testid="tab-chat-widget" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Chat Widget</TabsTrigger>
              <TabsTrigger value="logo" data-testid="tab-logo" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Logo</TabsTrigger>
              <TabsTrigger value="whatsapp" data-testid="tab-whatsapp" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">WhatsApp</TabsTrigger>

              <TabsTrigger value="preview-home" data-testid="tab-preview-home" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Home Preview</TabsTrigger>
              <TabsTrigger value="main-content" data-testid="tab-main-content" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Main Page Content</TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-alerts" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">
                Alerts
                {alerts.some(a => !a.read) && (
                  <span className="ml-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
              </TabsTrigger>
              <TabsTrigger value="catbox-upload" data-testid="tab-catbox-upload" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Catbox Image Upload</TabsTrigger>
              <TabsTrigger value="header-images" data-testid="tab-header-images" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Header Images</TabsTrigger>
              <TabsTrigger value="image-manager" data-testid="tab-image-manager" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Image Manager</TabsTrigger>
              <TabsTrigger value="og-images" data-testid="tab-og-images" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">OG Images</TabsTrigger>
              <TabsTrigger value="advanced-editor" data-testid="tab-advanced-editor" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Advanced Editor</TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Content</TabsTrigger>
              <TabsTrigger value="theme" data-testid="tab-theme" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">Theme</TabsTrigger>
              <TabsTrigger value="approvals" data-testid="tab-approvals" className="data-[state=active]:bg-green-600 data-[state=active]:text-white px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-green-800 font-semibold">
                ✅ نموذج الموافقة
              </TabsTrigger>
              <TabsTrigger value="promo-codes" data-testid="tab-promo-codes" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">🏷️ Promo Codes</TabsTrigger>
              <TabsTrigger value="reviews" data-testid="tab-reviews" className="data-[state=active]:bg-gold-primary data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-black">⭐ Reviews</TabsTrigger>
              <TabsTrigger value="abandoned-carts" data-testid="tab-abandoned-carts" className="data-[state=active]:bg-yellow-500 data-[state=active]:text-black px-4 py-2 rounded-none border-b-2 border-transparent data-[state=active]:border-yellow-700">🛒 Abandoned Carts</TabsTrigger>
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

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
                          <div className={`p-2 rounded-full ${alert.priority === 'high' ? 'bg-red-500/20 text-red-500' :
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
                              {new Date(alert.timestamp).toLocaleString('en-US')} • {String(alert.type || '').toUpperCase()}
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

          <TabsContent value="arrangement" className="space-y-6">
            <ArrangementPanel />
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

          <TabsContent value="header-images" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Header Images</h2>
            </div>
            <HeaderManager />
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

          <TabsContent value="og-images" className="space-y-6">
            <OgImagesPanel allGames={allGames} />
          </TabsContent>

          {/* Advanced Editor Tab */}
          <TabsContent value="advanced-editor" className="space-y-6">
            <AdvancedEditorPanel />
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

          <TabsContent value="theme" className="space-y-6">
            <AdminThemePanel />
          </TabsContent>

          {/* Approvals Tab - نموذج الموافقة */}
          <TabsContent value="approvals" className="space-y-6">
            <ApprovalsPanel />
          </TabsContent>

          <TabsContent value="templates" className="space-y-6">
            <ResponseTemplatesPanel />
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
                  <div className="mt-2 flex items-center gap-2">
                    <Input
                      placeholder="Search packages…"
                      value={packagesFilter}
                      onChange={(e) => setPackagesFilter(e.target.value)}
                      className="flex-1"
                    />
                    <Button
                      className="bg-gold-primary"
                      onClick={() => {
                        const next = [...packagesDraft, { amount: '', price: 0, discountPrice: null, image: null }];
                        setPackagesDraft(next);
                        setAddedIndices(prev => new Set([...Array.from(prev), next.length - 1]));
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Add New Package
                    </Button>
                  </div>
                </DialogHeader>

                <div className="space-y-4">
                  {isFetchingAdminPackages ? (
                    <div className="text-sm text-muted-foreground">Loading packages…</div>
                  ) : packagesDraft.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No packages found for this game.</div>
                  ) : (
                    <div className="space-y-3">
                      {(packagesFilter ? packagesDraft.filter(p => String(p.amount || '').toLowerCase().includes(packagesFilter.toLowerCase())) : packagesDraft).map((p, idx) => (
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
                              <Label htmlFor={`pkg-amount-${idx}`}>Amount</Label>
                              <Input
                                id={`pkg-amount-${idx}`}
                                name={`pkg-amount-${idx}`}
                                autoComplete="off"
                                value={p.amount}
                                placeholder="e.g. 5000 ZP"
                                onChange={(e) => {
                                  const next = [...packagesDraft];
                                  const amt = e.target.value;
                                  next[idx] = { ...next[idx], amount: amt };
                                  setPackagesDraft(next);
                                }}
                              />
                              <div className="text-xs mt-1">
                                {(() => {
                                  const digitsOnly = normalizeNumericString(p.amount).replace(/[^0-9]/g, '');
                                  const qty = digitsOnly ? Number(digitsOnly) : 0;
                                  const valid = Number.isInteger(qty) && qty > 0;
                                  return valid ? (
                                    <span className="text-green-500">Quantity parsed: {qty}</span>
                                  ) : (
                                    <span className="text-red-500">Enter a positive quantity</span>
                                  );
                                })()}
                              </div>
                            </div>
                            <div className="col-span-3">
                              <Label htmlFor={`pkg-price-${idx}`}>Price</Label>
                              <Input
                                id={`pkg-price-${idx}`}
                                name={`pkg-price-${idx}`}
                                autoComplete="off"
                                type="number"
                                value={Number.isFinite(p.price) ? p.price : 0}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const next = [...packagesDraft];
                                  next[idx] = { ...next[idx], price: v === '' ? 0 : (Number(normalizeNumericString(v)) || 0) };
                                  setPackagesDraft(next);
                                }}
                              />
                            </div>
                            <div className="col-span-4">
                              <Label htmlFor={`pkg-discount-${idx}`}>Discount Price</Label>
                              <Input
                                id={`pkg-discount-${idx}`}
                                name={`pkg-discount-${idx}`}
                                autoComplete="off"
                                type="number"
                                value={p.discountPrice ?? ''}
                                onChange={(e) => {
                                  const v = e.target.value;
                                  const next = [...packagesDraft];
                                  next[idx] = { ...next[idx], discountPrice: v === '' ? null : Number(normalizeNumericString(v)) };
                                  setPackagesDraft(next);
                                }}
                              />
                            </div>
                            <div className="col-span-12 mt-2">
                              <Label htmlFor={`pkg-bonus-${idx}`}>Bonus (optional)</Label>
                              <Input
                                id={`pkg-bonus-${idx}`}
                                name={`pkg-bonus-${idx}`}
                                autoComplete="off"
                                value={p.bonus ?? ''}
                                placeholder="+ 500 ZP Bonus"
                                onChange={(e) => {
                                  const next = [...packagesDraft];
                                  next[idx] = { ...next[idx], bonus: e.target.value };
                                  setPackagesDraft(next);
                                }}
                              />
                            </div>
                          </div>
                          <div className="mt-3 flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                if (addedIndices.has(idx)) {
                                  const next = packagesDraft.filter((_, i) => i !== idx);
                                  setPackagesDraft(next);
                                  const nextSet = new Set(Array.from(addedIndices).filter(i => i !== idx));
                                  setAddedIndices(nextSet);
                                } else {
                                  const orig = originalPackages[idx];
                                  if (orig) {
                                    const next = [...packagesDraft];
                                    next[idx] = { ...orig };
                                    setPackagesDraft(next);
                                  }
                                }
                              }}
                            >
                              Cancel
                            </Button>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => {
                                if (window.confirm('Delete this package?')) {
                                  const next = packagesDraft.filter((_, i) => i !== idx);
                                  setPackagesDraft(next);
                                }
                              }}
                            >
                              Delete Package
                            </Button>
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
                      const errors = packagesDraft.map(validatePackage).filter(Boolean);
                      if (errors.length) {
                        toast({ title: 'Invalid values', description: String(errors[0]), variant: 'destructive' });
                        return;
                      }
                      const normalized = prepareNormalizedPackages(packagesDraft);
                      savePackagesMutation.mutate({ gameId: packagesGameId, packages: normalized });
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
            <CategoriesPanel />
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
            <h2 className="text-2xl font-bold text-foreground">Live Chat Support</h2>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chat Sessions List */}
              <div className="lg:col-span-1">
                <Card className="bg-card/50 border-gold-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Active Conversations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      <div className="space-y-2">
                        {chatSessions.length === 0 ? (
                          <div className="text-sm text-muted-foreground p-3 border rounded">
                            No active conversations. Live chat messages will appear here.
                          </div>
                        ) : (
                          chatSessions.map((session) => {
                            const displayName = (session as any).name || (session as any).email || 'Visitor';
                            const displayEmail = (session as any).email || '';
                            const lastMessageText = (session as any).lastMessage || '';

                            return (
                              <Button
                                key={session.id}
                                variant={selectedUser === session.id ? 'default' : 'outline'}
                                onClick={() => setSelectedUser(session.id)}
                                className="w-full justify-start text-xs p-3 h-auto"
                              >
                                <div className="flex flex-col items-start w-full">
                                  <div className="flex items-center gap-2 w-full">
                                    <MessageSquare className="w-4 h-4 flex-shrink-0" />
                                    <span className="font-medium truncate">{String(displayName)}</span>
                                    {!!displayEmail && (
                                      <span className="text-muted-foreground truncate">({String(displayEmail)})</span>
                                    )}
                                    {Number((session as any).unreadCount || 0) > 0 && (
                                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                                        {Number((session as any).unreadCount || 0)}
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-muted-foreground mt-1 truncate w-full">
                                    {String(lastMessageText || 'No messages')}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {(() => {
                                      try {
                                        return new Date((session as any).lastActivity).toLocaleDateString();
                                      } catch {
                                        return '';
                                      }
                                    })()}
                                  </p>
                                </div>
                              </Button>
                            );
                          })
                        )}
                      </div>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </div>

              {/* Chat Messages */}
              <div className="lg:col-span-2">
                {selectedUser ? (
                  <Card className="bg-card/50 border-gold-primary/30 h-full flex flex-col">
                    <CardHeader>
                      <CardTitle className="text-lg">
                        {selectedSessionInfo?.name || selectedSessionInfo?.email ? `Chat: ${selectedSessionInfo?.name || selectedSessionInfo?.email}` : `Chat Session ${selectedUser.slice(-8)}`}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground">
                        Live chat conversation
                      </p>
                    </CardHeader>
                    <CardContent className="flex-1 flex flex-col">
                      <ScrollArea className="flex-1 mb-4 p-4 border rounded-lg border-gold-primary/20">
                        <div className="space-y-3">
                          {sessionMessages
                            .sort((a, b) => a.timestamp - b.timestamp)
                            .map((msg) => (
                              <div
                                key={msg.id}
                                className={`flex ${msg.sender === 'user' ? 'justify-start' : 'justify-end'} group relative`}
                              >
                                {msg.sender === 'admin' && (
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 absolute top-0 -left-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive"
                                    onClick={async () => {
                                      if (!confirm('Delete this message?')) return;
                                      try {
                                        const token = localStorage.getItem('adminToken');
                                        await fetch(`${API_BASE_URL}/api/admin/chat/${selectedUser}/messages/${msg.id}`, {
                                          method: 'DELETE',
                                          headers: token ? { Authorization: `Bearer ${token}` } : {}
                                        });
                                        queryClient.invalidateQueries({ queryKey: [`/api/admin/chat/${selectedUser}`] });
                                        queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
                                      } catch (e) { console.error(e); }
                                    }}
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                )}
                                <div
                                  className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.sender === 'user'
                                    ? 'bg-gray-700 text-white'
                                    : 'bg-gradient-to-r from-gold-primary to-neon-pink text-black'
                                    }`}
                                >
                                  <div className="flex items-center gap-2 mb-1">
                                    {msg.sender === 'user' ? (
                                      <User className="w-3 h-3" />
                                    ) : (
                                      <Bot className="w-3 h-3" />
                                    )}
                                    <span className="text-xs opacity-70">
                                      {msg.sender === 'user' ? String(selectedSessionInfo?.name || selectedSessionInfo?.email || 'Visitor') : 'Support'}
                                    </span>
                                  </div>
                                  {msg.message && (
                                    <p className="break-words">{msg.message}</p>
                                  )}
                                  {msg.attachmentUrl && (
                                    <div className="mt-1">
                                      {msg.attachmentType === 'image' ? (
                                        <div className="relative group/img">
                                          <img
                                            src={msg.attachmentUrl}
                                            alt="Attachment"
                                            className="max-w-full max-h-64 rounded border border-black/10 cursor-pointer"
                                            onClick={() => window.open(msg.attachmentUrl || undefined, '_blank')}
                                          />
                                        </div>
                                      ) : (
                                        <a
                                          href={msg.attachmentUrl}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-xs underline break-all"
                                        >
                                          Open attachment
                                        </a>
                                      )}
                                    </div>
                                  )}
                                  <p className="text-xs opacity-50 mt-1">
                                    {new Date(msg.timestamp).toLocaleTimeString([], {
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className={`h-6 w-6 absolute top-0 opacity-0 group-hover:opacity-100 transition-opacity text-destructive ${msg.sender === 'admin' ? '-left-8' : '-right-8'}`}
                                  onClick={async () => {
                                    if (!confirm('Delete this message?')) return;
                                    try {
                                      const token = localStorage.getItem('adminToken');
                                      await fetch(`${API_BASE_URL}/api/admin/chat/${selectedUser}/messages/${msg.id}`, {
                                        method: 'DELETE',
                                        headers: token ? { Authorization: `Bearer ${token}` } : {}
                                      });
                                      queryClient.invalidateQueries({ queryKey: [`/api/admin/chat/${selectedUser}`] });
                                      queryClient.invalidateQueries({ queryKey: ['/api/admin/chat/sessions'] });
                                    } catch (e) { console.error(e); }
                                  }}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            ))}
                          <div ref={messagesEndRef} />
                        </div>
                      </ScrollArea>

                      {/* Reply Input */}
                      <div className="flex flex-col gap-2">
                        {replyAttachment && (
                          <div className="flex items-center justify-between text-xs bg-muted/40 px-2 py-1 rounded">
                            <span className="truncate max-w-[70%]">{replyAttachment.url}</span>
                            <Button
                              variant="ghost"
                              onClick={() => setReplyAttachment(null)}
                            >
                              Remove
                            </Button>
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={uploadChatAttachment.isPending}
                          >
                            <Paperclip className="w-4 h-4" />
                          </Button>
                          <Input
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && replyMutation.mutate()}
                            placeholder="Type your reply..."
                            className="flex-1"
                          />
                          <Button
                            onClick={() => replyMutation.mutate()}
                            disabled={(!replyMessage.trim() && !replyAttachment) || replyMutation.isPending}
                            className="bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-black"
                          >
                            {replyMutation.isPending ? 'Sending...' : 'Send'}
                          </Button>
                          <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              if (file.size > 5 * 1024 * 1024) {
                                alert('File too large. Maximum size is 5MB.');
                                e.target.value = '';
                                return;
                              }
                              uploadChatAttachment.mutate(file);
                              e.target.value = '';
                            }}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-card/50 border-gold-primary/30 h-full flex items-center justify-center">
                    <div className="text-center text-muted-foreground">
                      <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p>Select a conversation to view messages</p>
                    </div>
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

          {/* Main Page Content Tab */}
          <TabsContent value="main-content" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold text-foreground">Main Page Content Management</h2>
              <p className="text-sm text-muted-foreground">Edit homepage text content</p>
            </div>

            {/* Hero Section */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
                <CardDescription>Edit the main hero title and subtitle</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="hero-title">Hero Title</Label>
                  <Input
                    id="hero-title"
                    placeholder="Enter hero title"
                    defaultValue="Welcome to Diaa Eldeen"
                  />
                </div>
                <div>
                  <Label htmlFor="hero-subtitle">Hero Subtitle</Label>
                  <Textarea
                    id="hero-subtitle"
                    placeholder="Enter hero subtitle"
                    defaultValue="Your ultimate destination for premium gaming products"
                    rows={3}
                  />
                </div>
                <Button className="bg-gold-primary hover:bg-gold-secondary">
                  Update Hero Content
                </Button>
              </CardContent>
            </Card>

            {/* About Section */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>About Section</CardTitle>
                <CardDescription>Edit the about Diaa section content</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about-title">About Title</Label>
                  <Input
                    id="about-title"
                    placeholder="Enter about title"
                    defaultValue="About Diaa"
                  />
                </div>
                <div>
                  <Label htmlFor="about-p1">About Paragraph 1</Label>
                  <Textarea
                    id="about-p1"
                    placeholder="Enter first paragraph"
                    defaultValue="Diaa Eldeen is your trusted gaming store offering the best digital products at competitive prices."
                    rows={3}
                  />
                </div>
                <div>
                  <Label htmlFor="about-p2">About Paragraph 2</Label>
                  <Textarea
                    id="about-p2"
                    placeholder="Enter second paragraph"
                    defaultValue="We provide instant delivery, secure payments, and 24/7 customer support for all your gaming needs."
                    rows={3}
                  />
                </div>
                <Button className="bg-gold-primary hover:bg-gold-secondary">
                  Update About Content
                </Button>
              </CardContent>
            </Card>

            {/* Features Section */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Features Section</CardTitle>
                <CardDescription>Edit the features descriptions</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="fast-delivery-desc">Fast Delivery Description</Label>
                  <Textarea
                    id="fast-delivery-desc"
                    placeholder="Enter fast delivery description"
                    defaultValue="Get your digital products instantly after payment confirmation"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="online-support-desc">Online Support Description</Label>
                  <Textarea
                    id="online-support-desc"
                    placeholder="Enter online support description"
                    defaultValue="24/7 customer support available via WhatsApp and live chat"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="secure-payment-desc">Secure Payment Description</Label>
                  <Textarea
                    id="secure-payment-desc"
                    placeholder="Enter secure payment description"
                    defaultValue="Multiple secure payment methods with encrypted transactions"
                    rows={2}
                  />
                </div>
                <div>
                  <Label htmlFor="best-prices-desc">Best Prices Description</Label>
                  <Textarea
                    id="best-prices-desc"
                    placeholder="Enter best prices description"
                    defaultValue="Competitive pricing with regular discounts and special offers"
                    rows={2}
                  />
                </div>
                <Button className="bg-gold-primary hover:bg-gold-secondary">
                  Update Features Content
                </Button>
              </CardContent>
            </Card>

            {/* Reviews Section */}
            <Card className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle>Reviews Section</CardTitle>
                <CardDescription>Edit customer reviews and testimonials</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="reviews-title">Reviews Title</Label>
                  <Input
                    id="reviews-title"
                    placeholder="Enter reviews title"
                    defaultValue="What Our Customers Say"
                  />
                </div>
                <div>
                  <Label htmlFor="reviews-subtitle">Reviews Subtitle</Label>
                  <Input
                    id="reviews-subtitle"
                    placeholder="Enter reviews subtitle"
                    defaultValue="Don't just take our word for it"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <Label>Review 1</Label>
                    <Textarea
                      placeholder="Enter review 1 content"
                      defaultValue="Fast delivery and great prices"
                      rows={2}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <Label>Review 2</Label>
                    <Textarea
                      placeholder="Enter review 2 content"
                      defaultValue="Best gaming store 10/10"
                      rows={2}
                    />
                  </div>
                  <div className="border rounded-lg p-4">
                    <Label>Review 3</Label>
                    <Textarea
                      placeholder="Enter review 3 content"
                      defaultValue="Competitive prices and instant delivery. This is my go-to store for all gaming needs"
                      rows={2}
                    />
                  </div>
                </div>
                <Button className="bg-gold-primary hover:bg-gold-secondary">
                  Update Reviews Content
                </Button>
              </CardContent>
            </Card>

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

          <TabsContent value="promo-codes" className="space-y-6">
            <PromoCodesPanel />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-6">
            <ReviewsPanel />
          </TabsContent>

          <TabsContent value="abandoned-carts" className="space-y-6">
            <AbandonedCartsPanel />
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
              <div className="grid grid-cols-4 items-start gap-4">
                <Label htmlFor="description" className="text-right pt-2">Description</Label>
                <div className="col-span-3">
                  <ErrorBoundary>
                    <Suspense fallback={<div className="p-4 text-center border rounded">Loading editor...</div>}>
                      <RichTextEditor
                        value={(editingGame as any).description || ''}
                        onChange={(value) => setEditingGame({ ...editingGame, description: value } as any)}
                        onImageUpload={handleRichTextImageUpload}
                        placeholder="Enter game description..."
                      />
                    </Suspense>
                  </ErrorBoundary>
                </div>
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
                  value={editingGame.image_url || ''}
                  onChange={(e) => setEditingGame({ ...editingGame, image_url: e.target.value })}
                  className="col-span-3"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <div className="col-start-2 col-span-3 flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={!editingGame?.id || !editingGame.image_url || updateGameImageUrlMutation.isPending}
                    onClick={() => {
                      const url = String(editingGame.image_url || '').trim();
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
              {editingGame.image_url && (
                <div className="grid grid-cols-4 items-center gap-4">
                  <div className="col-start-2 col-span-3">
                    <img src={editingGame.image_url} alt="Large Preview" className="h-32 object-contain rounded-md border" />
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

function CatboxUploadPanel({ allGames, categories }: { allGames: Game[]; categories: Category[] }) {
  const [url, setUrl] = useState('');
  const [type, setType] = useState<'game' | 'category'>('game');
  const [targetId, setTargetId] = useState<string>('');
  const [resultUrl, setResultUrl] = useState<string>('');
  const [preview, setPreview] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => { setPreview(url); }, [url]);
  useEffect(() => {
    if (type === 'game' && allGames.length && !targetId) setTargetId(allGames[0]?.id || '');
    if (type === 'category' && categories.length && !targetId) setTargetId(categories[0]?.id || '');
  }, [type, allGames, categories]);

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/images/catbox-url'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url, type, id: targetId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.message || 'Submission failed');
      return data;
    },
    onSuccess: (data) => {
      setResultUrl(data?.url || '');
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/categories'] });
      toast({ title: 'Success', description: 'Image uploaded and applied successfully.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

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
        <Button
          onClick={() => uploadMutation.mutate()}
          className="bg-gold-primary"
          disabled={uploadMutation.isPending || !url || !targetId}
        >
          {uploadMutation.isPending ? 'Uploading...' : 'Submit'}
        </Button>
        {resultUrl && <span className="text-sm text-muted-foreground flex items-center">Applied URL: {resultUrl}</span>}
      </div>
      {uploadMutation.isError && <div className="text-red-500 text-sm">{uploadMutation.error.message}</div>}
    </div>
  );
}

function UsersPanel() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useQuery<{ items: Array<{ id: string; name: string; phone: string; email?: string | null; email_verified?: boolean | null; created_at: string }>; page: number; limit: number; total: number }>({
    queryKey: ['/api/admin/users', q, page],
    enabled: true,
    refetchInterval: 30000, // Consistency check
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
      const res = await fetch(apiPath(`/api/admin/users/export?q=${encodeURIComponent(q)}`), { headers: token ? { Authorization: `Bearer ${token}` } : {} });
      const csv = await res.text();
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `users-${Date.now()}.csv`; a.click();
      URL.revokeObjectURL(url);
    }
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const limit = data?.limit || 20;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = total === 0 ? 0 : (page - 1) * limit + 1;
  const end = Math.min(total, page * limit);

  return (
    <Card className="bg-card/50 border-gold-primary/30">
      <CardHeader>
        <CardTitle className="text-lg">User Directory</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex gap-2">
          <Input placeholder="Search by name, phone, or email" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-md" />
          <Button onClick={() => exportMutation.mutate()} variant="outline">Export CSV</Button>
        </div>

        {isLoading ? (
          <div className="p-8 text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p>Failed to load users.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">Retry Connection</Button>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left">
                    <th className="p-2">ID</th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Phone</th>
                    <th className="p-2">Email</th>
                    <th className="p-2">Verified</th>
                    <th className="p-2">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map(u => (
                    <tr key={u.id} className="border-t hover:bg-muted/50 transition-colors">
                      <td className="p-2 font-mono text-xs">{u.id}</td>
                      <td className="p-2">{u.name}</td>
                      <td className="p-2">{u.phone}</td>
                      <td className="p-2">{u.email || '-'}</td>
                      <td className="p-2">{u.email ? (u.email_verified ? <span className="text-green-500 flex items-center gap-1"><Check className="w-3 h-3" /> Verified</span> : <span className="text-yellow-500">Unverified</span>) : '-'}</td>
                      <td className="p-2">{u.created_at ? new Date(u.created_at).toLocaleString() : '-'}</td>
                    </tr>
                  ))}
                  {items.length === 0 && (
                    <tr><td className="p-8 text-center text-muted-foreground" colSpan={6}>No users found matching your search.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground pt-4 border-t">
              <div>
                {total > 0 ? `Showing ${start}-${end} of ${total} users` : 'No users to display'}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                >
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

function InteractionsPanel() {
  const [q, setQ] = useState('');
  const [eventType, setEventType] = useState<string>('all');

  const { data, refetch, isLoading, isError } = useQuery<{ items: Array<{ id: string; event_type: string; element?: string; page?: string; success: boolean; error?: string; ua?: string; ts: string }> }>({
    queryKey: ['/api/admin/interactions', q, eventType],
    enabled: true,
    refetchInterval: 30000, // Consistency check
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

        {isLoading ? (
          <div className="p-8 text-center space-y-4">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full mx-auto"></div>
            <p className="text-muted-foreground">Loading interactions...</p>
          </div>
        ) : isError ? (
          <div className="p-8 text-center text-red-500 space-y-2">
            <AlertCircle className="h-8 w-8 mx-auto" />
            <p>Failed to load interactions.</p>
            <Button onClick={() => refetch()} variant="outline" size="sm">Retry Connection</Button>
          </div>
        ) : (
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
                  <tr key={it.id} className="border-t hover:bg-muted/50 transition-colors">
                    <td className="p-2">{it.event_type}</td>
                    <td className="p-2">{it.element || '-'}</td>
                    <td className="p-2">{it.page || '-'}</td>
                    <td className="p-2">{it.success ? <Check className="w-4 h-4 text-green-500" /> : <AlertCircle className="w-4 h-4 text-red-500" />}</td>
                    <td className="p-2 whitespace-nowrap">{it.ts ? new Date(it.ts).toLocaleString() : '-'}</td>
                  </tr>
                ))}
                {items.length === 0 && (
                  <tr><td className="p-8 text-center text-muted-foreground" colSpan={5}>No interactions found.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ImageManagerPanel() {
  const [files, setFiles] = useState<File[]>([]);
  const [urlsText, setUrlsText] = useState('');
  const [storage, setStorage] = useState<'cloudinary' | 'local' | 'catbox'>('local');
  const [results, setResults] = useState<Array<{ name?: string; url?: string; error?: string; ok: boolean }>>([]);
  const [scanUrl, setScanUrl] = useState('');
  const { toast } = useToast();

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

  const uploadBatchMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
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
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return data;
      } else {
        const urls = urlsText.split(/\r?\n/).map(s => s.trim()).filter(Boolean);
        const res = await fetch(apiPath('/api/admin/images/upload-batch'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ storage, urls })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Upload failed');
        return data;
      }
    },
    onSuccess: (data) => {
      const items = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
      setFiles([]);
      setUrlsText('');
      toast({ title: 'Success', description: 'Batch upload completed.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

  const scanSiteMutation = useMutation({
    mutationFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/images/scan-site'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ url: scanUrl, storage })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Scan failed');
      return data;
    },
    onSuccess: (data) => {
      const items = Array.isArray(data?.results) ? data.results : [];
      setResults(items);
      toast({ title: 'Success', description: 'Site scan completed.' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    }
  });

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
        {files.length > 0 && <div className="mt-2 text-sm text-muted-foreground">{files.length} files selected</div>}
      </div>
      <div>
        <Label>Paste URLs (one per line)</Label>
        <Input value={urlsText} onChange={(e) => setUrlsText(e.target.value)} placeholder="https://example.com/a.jpg" />
      </div>
      <div className="flex gap-2">
        <Button
          onClick={() => uploadBatchMutation.mutate()}
          className="bg-blue-600"
          disabled={uploadBatchMutation.isPending || (!files.length && !urlsText)}
        >
          {uploadBatchMutation.isPending ? 'Uploading...' : 'Upload'}
        </Button>
      </div>
      <div>
        <Label>Scan Website</Label>
        <div className="flex gap-2">
          <Input value={scanUrl} onChange={(e) => setScanUrl(e.target.value)} placeholder="https://example.com" />
          <Button
            onClick={() => scanSiteMutation.mutate()}
            className="bg-gold-primary"
            disabled={scanSiteMutation.isPending || !scanUrl}
          >
            {scanSiteMutation.isPending ? 'Scanning...' : 'Scan & Save'}
          </Button>
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
  const { data: health } = useQuery<{ status?: string }>({
    queryKey: ['/api/health'],
    queryFn: async () => {
      const res = await fetch(apiPath('/api/health'));
      return await res.json().catch(() => ({}));
    },
    refetchInterval: 5000
  });
  const { data: selftest } = useQuery<{ ok?: boolean; checks?: any[] }>({
    queryKey: ['/api/admin/selftest'],
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath('/api/admin/selftest'), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      return await res.json().catch(() => ({}));
    },
    refetchInterval: 5000
  });

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
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className={`rounded border p-3 ${health && (health as any).status === 'OK' ? 'border-green-500/30' : 'border-red-500/30'}`}>
            <div className="text-sm">Backend Health</div>
            <div className="text-xs text-muted-foreground">{(health as any)?.status || 'Unknown'}</div>
          </div>
          <div className={`rounded border p-3 ${selftest && (selftest as any).ok ? 'border-green-500/30' : 'border-yellow-500/30'}`}>
            <div className="text-sm">Admin Selftest</div>
            <div className="text-xs text-muted-foreground">{(selftest as any)?.ok ? 'OK' : 'Degraded'}</div>
          </div>
          <div className={`rounded border p-3 ${enabled ? 'border-blue-500/30' : 'border-gray-500/30'}`}>
            <div className="text-sm">Widget Status</div>
            <div className="text-xs text-muted-foreground">{enabled ? 'Enabled' : 'Disabled'}</div>
          </div>
        </div>
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
        const img = new window.Image();
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
                ctx.clearRect(0, 0, recommendedW, recommendedH);
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

  async function doUpload(blob: Blob, type: 'small' | 'large' | 'favicon') {
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
        const res = await fetch(apiPath(`/api/games/${gameId}`), {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
          body: JSON.stringify({ id: gameId, discountPrice: finalPrice })
        });
        const data = await res.json();
        if (!res.ok) throw new Error((data as any)?.message || 'Failed to update discount');
        return data;
      },
      onSuccess: (_resp) => {
        setSaving(false);
        toast({ title: 'Saved', description: 'Discount updated', duration: 1200 });
        queryClient.invalidateQueries({ queryKey: ['/api/games'] });
        queryClient.invalidateQueries({ queryKey: [`/api/games/id/${gameId}`] });
        queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
        onSaved();
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch templates');
      return data;
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
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to save templates');
      return data;
    },
    onSuccess: () => {
      toast({ title: 'Saved', description: 'Checkout templates updated', duration: 1500 });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/checkout/templates'] });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: String(err?.message || err || 'Failed to save'), duration: 2500, variant: 'destructive' });
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
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  const { data: status, refetch, isError, isFetching } = useQuery<{ qr: string | null; connected: boolean; status: string }>({
    queryKey: ['/api/admin/whatsapp/qr'],
    refetchInterval: (data) => {
      if ((data as any)?.connected) return 10000;
      return 3000;
    },
    retry: 2,
    queryFn: async () => {
      const res = await fetch(apiPath('/api/admin/whatsapp/qr'), { headers: authHeaders });
      if (!res.ok) throw new Error('فشل الاتصال بالسيرفر');
      return res.json();
    }
  });

  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMsg, setResetMsg] = useState<string | null>(null);
  const [sendResult, setSendResult] = useState<{ ok: boolean; msg: string } | null>(null);

  useEffect(() => {
    if (status?.qr) {
      QRCode.toDataURL(status.qr, { width: 280, margin: 2 })
        .then((url: string) => setQrDataUrl(url))
        .catch(() => setQrDataUrl(null));
    } else {
      setQrDataUrl(null);
    }
  }, [status?.qr]);

  const [to, setTo] = useState('');
  const [text, setText] = useState('مرحباً من متجر ضياء! 👋');

  const sendMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(apiPath('/api/admin/whatsapp/send'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify({ to, text })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'فشل الإرسال');
      return data;
    },
    onSuccess: () => setSendResult({ ok: true, msg: '✅ تم الإرسال بنجاح!' }),
    onError: (err: Error) => setSendResult({ ok: false, msg: `❌ ${err.message}` }),
  });

  const handleReset = async () => {
    if (!confirm('هتقطع الاتصال وتبدأ من أول. هتضطر تعمل Scan للـ QR كمان مرة. متأكد؟')) return;
    setResetLoading(true);
    setResetMsg(null);
    try {
      const res = await fetch(apiPath('/api/admin/whatsapp/reset-auth'), {
        method: 'POST',
        headers: authHeaders,
      });
      const data = await res.json();
      if (res.ok) {
        setResetMsg('✅ تم إعادة الضبط. انتظر ظهور QR جديد...');
        setTimeout(() => refetch(), 2000);
      } else {
        setResetMsg(`❌ ${data.message || 'فشلت إعادة الضبط'}`);
      }
    } catch {
      setResetMsg('❌ حدث خطأ في الاتصال بالسيرفر');
    } finally {
      setResetLoading(false);
    }
  };

  const isConnected = status?.connected;

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <div className={`rounded-2xl border p-5 ${isConnected ? 'bg-green-500/10 border-green-500/30' : 'bg-orange-500/10 border-orange-500/30'}`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className={`relative w-4 h-4 rounded-full ${isConnected ? 'bg-green-500' : 'bg-orange-400'}`}>
              {!isConnected && <span className="absolute inset-0 rounded-full bg-orange-400 animate-ping opacity-60" />}
            </div>
            <div>
              <p className="font-bold text-foreground text-base">
                {isConnected ? '✅ متصل بواتساب' : '⏳ غير متصل'}
              </p>
              <p className="text-xs text-muted-foreground capitalize mt-0.5">
                {status?.status || 'جاري التحقق...'} {isFetching && '· يتحقق...'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="text-xs gap-1.5"
            >
              🔄 تحديث
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              disabled={resetLoading}
              className="text-xs gap-1.5 border-red-500/30 text-red-400 hover:bg-red-500/10"
            >
              {resetLoading ? '⏳ جاري...' : '🔁 إعادة ربط الواتساب'}
            </Button>
          </div>
        </div>
        {resetMsg && (
          <p className={`mt-3 text-sm px-3 py-2 rounded-xl ${resetMsg.startsWith('✅') ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
            {resetMsg}
          </p>
        )}
        {isError && (
          <p className="mt-3 text-sm text-red-400 bg-red-500/10 px-3 py-2 rounded-xl">
            ❌ تعذّر الاتصال بالسيرفر. تأكد من تشغيل الـ Backend.
          </p>
        )}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* QR Code Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            📱 ربط الواتساب بالـ QR Code
          </h3>
          {isConnected ? (
            <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-6 text-center">
              <div className="text-5xl mb-3">✅</div>
              <p className="font-bold text-green-400">واتساب متصل ويعمل!</p>
              <p className="text-sm text-muted-foreground mt-1">الإرسال التلقائي شغّال 🚀</p>
            </div>
          ) : status?.qr ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                افتح واتساب على موبايلك ← المزيد ← الأجهزة المرتبطة ← ربط جهاز ← امسح الـ QR
              </p>
              <div className="bg-white rounded-2xl p-4 inline-block shadow-xl">
                {qrDataUrl ? (
                  <img src={qrDataUrl} alt="WhatsApp QR Code" className="w-64 h-64 block" />
                ) : (
                  <div className="w-64 h-64 flex items-center justify-center text-black text-sm">جاري توليد QR...</div>
                )}
              </div>
              <p className="text-xs text-muted-foreground">⏳ الـ QR بيتجدد تلقائياً كل 30 ثانية</p>
            </div>
          ) : (
            <div className="bg-card border border-border/40 rounded-2xl p-6 text-center space-y-3">
              <div className="text-4xl animate-pulse">⏳</div>
              <p className="text-muted-foreground text-sm">في انتظار الـ QR Code من السيرفر...</p>
              <Button variant="outline" size="sm" onClick={() => refetch()}>
                🔄 تحديث
              </Button>
            </div>
          )}
        </div>

        {/* Test Message Section */}
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            💬 إرسال رسالة اختبار
          </h3>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-sm">رقم الواتساب (مع كود الدولة)</Label>
              <Input
                placeholder="مثال: 201012345678"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                dir="ltr"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-sm">نص الرسالة</Label>
              <textarea
                className="w-full bg-background border border-border rounded-xl px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-gold-primary/60 resize-none"
                rows={3}
                placeholder="اكتب الرسالة هنا..."
                value={text}
                onChange={(e) => setText(e.target.value)}
              />
            </div>
            <Button
              onClick={() => { setSendResult(null); sendMutation.mutate(); }}
              disabled={!to || !text || !isConnected || sendMutation.isPending}
              className="bg-green-600 hover:bg-green-700 text-white w-full gap-2"
            >
              {sendMutation.isPending ? '⏳ جاري الإرسال...' : '📤 إرسال رسالة تجريبية'}
            </Button>
            {!isConnected && (
              <p className="text-xs text-orange-400 text-center">⚠️ يجب ربط الواتساب أولاً</p>
            )}
            {sendResult && (
              <div className={`text-sm text-center py-2 px-3 rounded-xl ${sendResult.ok ? 'bg-green-500/15 text-green-400' : 'bg-red-500/15 text-red-400'}`}>
                {sendResult.msg}
              </div>
            )}
          </div>
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

function ApprovalsPanel() {
  const { toast } = useToast();
  const token = typeof window !== 'undefined' ? localStorage.getItem('adminToken') : null;

  const [filterStatus, setFilterStatus] = useState<string>('pending');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [approvalNote, setApprovalNote] = useState('');
  const [deliveryCode, setDeliveryCode] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [formAction, setFormAction] = useState<'approve' | 'reject'>('approve');

  const { data: ordersData, refetch, isLoading } = useQuery<{ orders: any[] }>({
    queryKey: ['/api/admin/orders', filterStatus],
    refetchInterval: 15000,
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus && filterStatus !== 'all') params.set('status', filterStatus);
      const res = await fetch(apiPath(`/api/admin/orders?${params.toString()}`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch orders');
      return res.json();
    }
  });

  const orders = (ordersData?.orders || []).filter((o: any) => {
    if (!searchTerm) return true;
    const s = searchTerm.toLowerCase();
    return (
      String(o.id || '').toLowerCase().includes(s) ||
      String(o.customer_name || o.name || '').toLowerCase().includes(s) ||
      String(o.phone || '').toLowerCase().includes(s) ||
      String(o.game_name || '').toLowerCase().includes(s)
    );
  });

  const updateOrderMutation = useMutation({
    mutationFn: async ({ id, status, note, delivery_message }: { id: string; status: string; note?: string; delivery_message?: string }) => {
      const res = await fetch(apiPath(`/api/admin/orders/${id}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ status, adminNote: note, delivery_message })
      });
      if (!res.ok) throw new Error('Failed to update order');
      return res.json();
    },
    onSuccess: (_, vars) => {
      toast({
        title: vars.status === 'approved' ? 'تمت الموافقة ✅' : 'تم الرفض ❌',
        description: vars.status === 'approved' ? 'تمت الموافقة على الطلب بنجاح' : 'تم رفض الطلب',
        duration: 2500
      });
      setShowForm(false);
      setSelectedOrder(null);
      setApprovalNote('');
      setRejectionReason('');
      refetch();
    },
    onError: (err: any) => {
      toast({ title: 'خطأ', description: err?.message || 'فشل التحديث', variant: 'destructive' });
    }
  });

  const openApprove = (order: any) => {
    setSelectedOrder(order);
    setFormAction('approve');
    setApprovalNote('');
    setDeliveryCode('');
    setRejectionReason('');
    setShowForm(true);
  };

  const openReject = (order: any) => {
    setSelectedOrder(order);
    setFormAction('reject');
    setApprovalNote('');
    setRejectionReason('');
    setShowForm(true);
  };

  const handleSubmitForm = () => {
    if (!selectedOrder) return;
    if (formAction === 'reject' && !rejectionReason.trim()) {
      toast({ title: 'مطلوب', description: 'الرجاء إدخال سبب الرفض', variant: 'destructive' });
      return;
    }
    updateOrderMutation.mutate({
      id: selectedOrder.id,
      status: formAction === 'approve' ? 'approved' : 'rejected',
      note: formAction === 'approve' ? approvalNote : rejectionReason,
      delivery_message: formAction === 'approve' && deliveryCode.trim() ? deliveryCode.trim() : undefined
    });
  };

  const statusColor: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40',
    approved: 'bg-green-500/20 text-green-400 border-green-500/40',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/40',
    completed: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
    cancelled: 'bg-gray-500/20 text-gray-400 border-gray-500/40'
  };
  const statusLabel: Record<string, string> = {
    pending: 'قيد الانتظار',
    approved: 'موافق عليه',
    rejected: 'مرفوض',
    completed: 'مكتمل',
    cancelled: 'ملغي'
  };

  const pendingCount = (ordersData?.orders || []).filter((o: any) => o.status === 'pending').length;

  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">نموذج الموافقة على الطلبات</h2>
          <p className="text-muted-foreground text-sm mt-1">مراجعة وإدارة طلبات العملاء والموافقة عليها أو رفضها</p>
        </div>
        {pendingCount > 0 && (
          <div className="bg-yellow-500/20 border border-yellow-500/40 rounded-lg px-4 py-2 text-yellow-400 font-semibold text-sm">
            ⚠️ {pendingCount} طلب بانتظار المراجعة
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => {
          const count = s === 'all'
            ? (ordersData?.orders || []).length
            : (ordersData?.orders || []).filter((o: any) => o.status === s).length;
          const isActive = filterStatus === s;
          return (
            <button
              key={s}
              onClick={() => setFilterStatus(s)}
              className={`rounded-lg border p-3 text-center transition-all ${isActive ? 'border-gold-primary bg-gold-primary/20 text-gold-primary' : 'border-border bg-card/40 text-muted-foreground hover:border-gold-primary/50'}`}
            >
              <div className="text-xl font-bold">{count}</div>
              <div className="text-xs mt-1">
                {s === 'all' ? 'الكل' : statusLabel[s] || s}
              </div>
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 flex-wrap items-center">
        <Input
          placeholder="بحث بالاسم أو رقم الطلب أو الهاتف..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm text-right"
          dir="rtl"
        />
        <Button variant="outline" size="sm" onClick={() => refetch()}>تحديث</Button>
      </div>

      {isLoading ? (
        <div className="p-12 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-gold-primary border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-muted-foreground">جارٍ تحميل الطلبات...</p>
        </div>
      ) : orders.length === 0 ? (
        <Card className="bg-card/50 border-gold-primary/30 p-12 text-center">
          <div className="text-5xl mb-4">📋</div>
          <p className="text-muted-foreground">لا توجد طلبات تطابق الفلتر المحدد</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order: any) => (
            <Card key={order.id} className="bg-card/50 border-gold-primary/20 hover:border-gold-primary/40 transition-colors">
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="font-mono text-sm text-muted-foreground">#{String(order.id).slice(-8)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${statusColor[order.status] || 'bg-gray-500/20 text-gray-400'}`}>
                        {statusLabel[order.status] || order.status}
                      </span>
                      {order.total && (
                        <span className="text-sm font-bold text-gold-primary">{Number(order.total).toFixed(2)} ج.م</span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-1 text-sm">
                      {(order.customer_name || order.name) && (
                        <div><span className="text-muted-foreground">العميل: </span><span className="font-medium">{order.customer_name || order.name}</span></div>
                      )}
                      {order.phone && (
                        <div><span className="text-muted-foreground">الهاتف: </span><span className="font-medium">{order.phone}</span></div>
                      )}
                      {order.game_name && (
                        <div><span className="text-muted-foreground">اللعبة: </span><span className="font-medium">{order.game_name}</span></div>
                      )}
                      {order.player_id && (
                        <div><span className="text-muted-foreground">معرف اللاعب: </span><span className="font-mono text-xs">{order.player_id}</span></div>
                      )}
                      {order.created_at && (
                        <div className="text-muted-foreground text-xs">{new Date(order.created_at).toLocaleString('ar-EG')}</div>
                      )}
                    </div>
                    {order.admin_note && (
                      <div className="text-xs bg-muted/40 border rounded px-2 py-1">
                        <span className="text-muted-foreground">ملاحظة الإدارة: </span>{order.admin_note}
                      </div>
                    )}
                  </div>
                  {order.status === 'pending' && (
                    <div className="flex flex-row sm:flex-col gap-2 justify-end shrink-0">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white"
                        onClick={() => openApprove(order)}
                      >
                        ✅ موافقة
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => openReject(order)}
                      >
                        ❌ رفض
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showForm && selectedOrder && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="bg-card border-gold-primary/30 w-full max-w-lg shadow-2xl" dir="rtl">
            <CardHeader className="border-b border-border pb-4">
              <CardTitle className={`text-xl ${formAction === 'approve' ? 'text-green-400' : 'text-red-400'}`}>
                {formAction === 'approve' ? '✅ نموذج الموافقة' : '❌ نموذج الرفض'}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-5">
              <div className="bg-muted/30 rounded-lg p-4 space-y-2 text-sm border border-border">
                <div className="font-semibold text-base mb-2">تفاصيل الطلب</div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  <div><span className="text-muted-foreground">رقم الطلب: </span><span className="font-mono">#{String(selectedOrder.id).slice(-8)}</span></div>
                  <div><span className="text-muted-foreground">الإجمالي: </span><span className="font-bold text-gold-primary">{Number(selectedOrder.total || 0).toFixed(2)} ج.م</span></div>
                  {(selectedOrder.customer_name || selectedOrder.name) && (
                    <div><span className="text-muted-foreground">العميل: </span><span>{selectedOrder.customer_name || selectedOrder.name}</span></div>
                  )}
                  {selectedOrder.phone && (
                    <div><span className="text-muted-foreground">الهاتف: </span><span>{selectedOrder.phone}</span></div>
                  )}
                  {selectedOrder.game_name && (
                    <div className="col-span-2"><span className="text-muted-foreground">اللعبة: </span><span>{selectedOrder.game_name}</span></div>
                  )}
                  {selectedOrder.player_id && (
                    <div className="col-span-2"><span className="text-muted-foreground">معرف اللاعب: </span><span className="font-mono">{selectedOrder.player_id}</span></div>
                  )}
                </div>
              </div>

              {formAction === 'approve' ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label className="text-sm font-medium flex items-center gap-2">
                      🎮 كود اللعبة / رسالة التسليم <span className="text-xs text-muted-foreground">(للألعاب التي تحتاج شحن يدوي)</span>
                    </Label>
                    <Textarea
                      value={deliveryCode}
                      onChange={(e) => setDeliveryCode(e.target.value)}
                      placeholder="ضع هنا الكود أو رسالة الشحن اليدوي — مثال: كود بطاقة Amazon: XXXX-XXXX-XXXX أو تم شحن 100 داياموند في حسابك"
                      className="h-28 text-right resize-none border-gold-primary/40 focus:border-gold-primary font-mono"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground">لو في كود أو رسالة تسليم، ستُرسَل مباشرة للعميل على الإيميل ✅</p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">ملاحظة إضافية (اختياري)</Label>
                    <Textarea
                      value={approvalNote}
                      onChange={(e) => setApprovalNote(e.target.value)}
                      placeholder="مثال: تمت المعالجة بنجاح، سيتم شحن العملة خلال 24 ساعة..."
                      className="h-20 text-right resize-none"
                      dir="rtl"
                    />
                    <p className="text-xs text-muted-foreground">سيتم إرسال هذه الملاحظة للعميل مع تأكيد الموافقة</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">سبب الرفض <span className="text-red-500">*</span></Label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="مثال: معرف اللاعب غير صحيح / الرصيد غير كافٍ / طلب مكرر..."
                    className="h-28 text-right resize-none border-red-500/40 focus:border-red-500"
                    dir="rtl"
                  />
                  <p className="text-xs text-muted-foreground">سيتم إرسال سبب الرفض للعميل — يرجى التوضيح الدقيق</p>
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  onClick={handleSubmitForm}
                  disabled={updateOrderMutation.isPending}
                  className={`flex-1 ${formAction === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'} text-white`}
                >
                  {updateOrderMutation.isPending
                    ? 'جارٍ التحديث...'
                    : formAction === 'approve'
                      ? '✅ تأكيد الموافقة'
                      : '❌ تأكيد الرفض'}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => { setShowForm(false); setSelectedOrder(null); }}
                  disabled={updateOrderMutation.isPending}
                  className="flex-1"
                >
                  إلغاء
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
