import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Save, Upload } from 'lucide-react';
import { API_BASE_URL, queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';
import { useToast } from '@/hooks/use-toast';
import ImageWithFallback from '@/components/image-with-fallback';

const apiPath = (path: string) => {
  const base = (API_BASE_URL || '').replace(/\/+$/, '');
  const p = String(path || '');
  if (!base) return p;
  if (/^https?:\/\//i.test(p)) return p;
  if (p.startsWith('/')) return `${base}${p}`;
  return `${base}/${p}`;
};

interface Package {
  amount: string;
  price: number;
  discountPrice: number | null;
  image: string | null;
}

interface MultiCurrencyPrices {
  EGP: number;
  USD: number;
  TRY: number;
}

interface PackageWithMultiCurrency extends Package {
  multiCurrencyPrices?: MultiCurrencyPrices;
}

export default function AdminPackagesPage() {
  const [, params] = useRoute('/admin/packages/:gameId');
  const gameId = params?.gameId || '';
  
  const [packages, setPackages] = useState<PackageWithMultiCurrency[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  const { toast } = useToast();

  // Fetch game
  const { data: game } = useQuery({
    queryKey: [`/api/games/id/${gameId}`],
    enabled: !!gameId,
    queryFn: async () => {
      const res = await fetch(apiPath(`/api/games/id/${gameId}`));
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch game');
      return data;
    }
  });

  // Fetch packages
  const { data: gamePackages = [], refetch: refetchPackages } = useQuery<Package[]>({
    queryKey: [`/api/games/${gameId}/packages`],
    enabled: !!gameId,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${gameId}/packages`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ([]));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch packages');
      return Array.isArray(data) ? data : [];
    }
  });

  // Fetch multi-currency prices
  const { data: multiCurrencyPrices = {}, refetch: refetchMultiCurrencyPrices } = useQuery<Record<string, Record<number, Record<string, number>>>>({
    queryKey: [`/api/admin/games/${gameId}/multi-currency-prices`],
    enabled: !!gameId,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/games/${gameId}/multi-currency-prices`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((data as any)?.message || 'Failed to fetch multi-currency prices');
      return data;
    }
  });

  // Update packages when data loads
  useEffect(() => {
    if (gamePackages && gamePackages.length > 0) {
      const packagesWithMultiCurrency = gamePackages.map((pkg, index) => {
        const gameMultiPrices = multiCurrencyPrices[gameId] || {};
        const packageMultiPrices = gameMultiPrices[index] || {};
        
        return {
          ...pkg,
          multiCurrencyPrices: {
            EGP: packageMultiPrices.EGP || pkg.price || 0,
            USD: packageMultiPrices.USD || Math.round((pkg.price || 0) / 50 * 100) / 100 || 0,
            TRY: packageMultiPrices.TRY || Math.round((pkg.price || 0) / 35 * 100) / 100 || 0
          }
        };
      });
      setPackages(packagesWithMultiCurrency);
    } else if (game && gamePackages.length === 0) {
      // Try to get packages from game data if API returns empty
      const gamePackagesArray = Array.isArray(game.packages) ? game.packages : [];
      const gamePrices = Array.isArray((game as any).packagePrices)
        ? (game as any).packagePrices
        : (Array.isArray((game as any).package_prices) ? (game as any).package_prices : []);
      const gameDiscountPrices = Array.isArray((game as any).packageDiscountPrices)
        ? (game as any).packageDiscountPrices
        : (Array.isArray((game as any).package_discount_prices) ? (game as any).package_discount_prices : []);
      const gameThumbnails = Array.isArray((game as any).packageThumbnails)
        ? (game as any).packageThumbnails
        : (Array.isArray((game as any).package_thumbnails) ? (game as any).package_thumbnails : []);
      
      if (gamePackagesArray.length > 0) {
        const initialPackages = gamePackagesArray.map((pkg: any, index: number) => {
          const basePrice = Number(gamePrices[index] || 0);
          const gameMultiPrices = multiCurrencyPrices[gameId] || {};
          const packageMultiPrices = gameMultiPrices[index] || {};
          
          return {
            amount: typeof pkg === 'string' ? pkg : (pkg?.amount || ''),
            price: basePrice,
            discountPrice: (gameDiscountPrices[index] !== undefined && gameDiscountPrices[index] !== null && gameDiscountPrices[index] !== '')
              ? Number(gameDiscountPrices[index])
              : null,
            image: gameThumbnails[index] ? String(gameThumbnails[index]) : null,
            multiCurrencyPrices: {
              EGP: packageMultiPrices.EGP || basePrice || 0,
              USD: packageMultiPrices.USD || Math.round((basePrice || 0) / 50 * 100) / 100 || 0,
              TRY: packageMultiPrices.TRY || Math.round((basePrice || 0) / 35 * 100) / 100 || 0
            }
          };
        });
        setPackages(initialPackages);
      } else if (packages.length === 0) {
        setPackages([]);
      }
    }
  }, [gamePackages, game, packages.length, multiCurrencyPrices, gameId]);

  // Update packages mutation
  const updatePackagesMutation = useMutation({
    mutationFn: async (packages: PackageWithMultiCurrency[]) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${gameId}/packages`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ packages })
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to update packages');
      }
      return res.json();
    },
    onSuccess: async (resp: any) => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/${gameId}/packages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });

      if (Array.isArray(resp)) {
        setPackages(resp);
      }

      try {
        await refetchPackages();
      } catch {}

      setIsEditing(false);
      toast({ title: 'Success', description: 'Packages saved successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: `Failed to save packages: ${error?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  // Update multi-currency prices mutation
  const updateMultiCurrencyPricesMutation = useMutation({
    mutationFn: async (multiCurrencyData: Record<string, Record<number, Record<string, number>>>) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/games/${gameId}/multi-currency-prices`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify(multiCurrencyData)
      });
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData?.message || 'Failed to update multi-currency prices');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/games/${gameId}/multi-currency-prices`] });
      toast({ title: 'Success', description: 'Multi-currency prices saved successfully!' });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: `Failed to save multi-currency prices: ${error?.message || 'Unknown error'}`,
        variant: 'destructive'
      });
    }
  });

  const handleAddPackage = () => {
    setPackages([...packages, { 
      amount: '', 
      price: 0, 
      discountPrice: null, 
      image: null,
      multiCurrencyPrices: { EGP: 0, USD: 0, TRY: 0 }
    }]);
    setIsEditing(true);
  };

  const handleRemovePackage = (index: number) => {
    setPackages(packages.filter((_, i) => i !== index));
    setIsEditing(true);
  };

  const handleUpdatePackage = (index: number, field: keyof Package, value: any) => {
    const updated = [...packages];
    updated[index] = { ...updated[index], [field]: value };
    setPackages(updated);
    setIsEditing(true);
  };

  const handleUpdateMultiCurrencyPrice = (index: number, currency: string, value: number) => {
    const updated = [...packages];
    if (!updated[index].multiCurrencyPrices) {
      updated[index].multiCurrencyPrices = { EGP: 0, USD: 0, TRY: 0 };
    }
    updated[index].multiCurrencyPrices![currency as keyof MultiCurrencyPrices] = value;
    setPackages(updated);
    setIsEditing(true);
  };

  const handleSave = async () => {
    try {
      // Save regular packages first
      const regularPackages = packages.map(pkg => ({
        amount: pkg.amount,
        price: pkg.price,
        discountPrice: pkg.discountPrice,
        image: pkg.image
      }));
      
      await updatePackagesMutation.mutateAsync(regularPackages);
      
      // Then save multi-currency prices
      const multiCurrencyData: Record<string, Record<number, Record<string, number>>> = {
        [gameId]: {}
      };
      
      packages.forEach((pkg, index) => {
        if (pkg.multiCurrencyPrices) {
          multiCurrencyData[gameId][index] = pkg.multiCurrencyPrices;
        }
      });
      
      await updateMultiCurrencyPricesMutation.mutateAsync(multiCurrencyData);
    } catch (error) {
      // Error handling is done in the mutations
    }
  };

  if (!game) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <Link href="/admin">
          <Button variant="ghost" className="mb-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        <h1 className="text-3xl font-bold text-gold-primary mb-2">Manage Packages: {game.name}</h1>
        <p className="text-muted-foreground mb-6">Edit package amounts, prices, and discount prices</p>

        <div className="space-y-4">
          {packages.map((pkg, index) => (
            <Card key={index} className="bg-card/50 border-gold-primary/30">
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  Package {index + 1}
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePackage(index)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Amount (e.g., "10000 ZP")</Label>
                      <Input
                        value={pkg.amount}
                        onChange={(e) => handleUpdatePackage(index, 'amount', e.target.value)}
                        placeholder="10000 ZP"
                      />
                    </div>
                    <div>
                      <Label>Price (EGP)</Label>
                      <Input
                        type="number"
                        value={pkg.multiCurrencyPrices?.EGP || 0}
                        onChange={(e) => handleUpdateMultiCurrencyPrice(index, 'EGP', parseFloat(e.target.value) || 0)}
                        placeholder="200"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Price in Egyptian Pounds</p>
                    </div>
                    <div>
                      <Label>Price (USD)</Label>
                      <Input
                        type="number"
                        value={pkg.multiCurrencyPrices?.USD || 0}
                        onChange={(e) => handleUpdateMultiCurrencyPrice(index, 'USD', parseFloat(e.target.value) || 0)}
                        placeholder="10.50"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Price in US Dollars</p>
                    </div>
                    <div>
                      <Label>Price (TRY)</Label>
                      <Input
                        type="number"
                        value={pkg.multiCurrencyPrices?.TRY || 0}
                        onChange={(e) => handleUpdateMultiCurrencyPrice(index, 'TRY', parseFloat(e.target.value) || 0)}
                        placeholder="350"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Price in Turkish Lira</p>
                    </div>
                    <div>
                      <Label>Final Price (optional)</Label>
                      <Input
                        type="number"
                        value={pkg.discountPrice || ''}
                        onChange={(e) => handleUpdatePackage(index, 'discountPrice', e.target.value ? parseFloat(e.target.value) : null)}
                        placeholder="250"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Final displayed price (big font)</p>
                    </div>
                    <div>
                      <Label>Image URL (optional)</Label>
                      <Input
                        value={pkg.image || ''}
                        onChange={(e) => handleUpdatePackage(index, 'image', e.target.value)}
                        placeholder="https://example.com/image.jpg or /images/image.jpg"
                      />
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleRemovePackage(index)}
                    className="ml-4"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="flex gap-2">
            <Button onClick={handleAddPackage} className="bg-gold-primary hover:bg-gold-primary/80">
              <Plus className="w-4 h-4 mr-2" />
              Add Package
            </Button>
            {isEditing && (
              <Button 
                onClick={handleSave} 
                disabled={updatePackagesMutation.isPending || updateMultiCurrencyPricesMutation.isPending}
              >
                {(updatePackagesMutation.isPending || updateMultiCurrencyPricesMutation.isPending) ? 'Saving...' : 'Save Changes'}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
