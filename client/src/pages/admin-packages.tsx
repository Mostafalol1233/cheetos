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

export default function AdminPackagesPage() {
  const [, params] = useRoute('/admin/packages/:gameId');
  const gameId = params?.gameId || '';
  
  const [packages, setPackages] = useState<Package[]>([]);
  const [isEditing, setIsEditing] = useState(false);

  // Fetch game
  const { data: game } = useQuery({
    queryKey: [`/api/games/id/${gameId}`],
    enabled: !!gameId,
    queryFn: async () => {
      const res = await fetch(apiPath(`/api/games/id/${gameId}`));
      if (!res.ok) throw new Error('Failed to fetch game');
      return res.json();
    }
  });

  // Fetch packages
  const { data: gamePackages = [] } = useQuery<Package[]>({
    queryKey: [`/api/admin/games/${gameId}/packages`],
    enabled: !!gameId,
    queryFn: async () => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/games/${gameId}/packages`), {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch packages');
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  // Update packages when data loads
  useEffect(() => {
    if (gamePackages && gamePackages.length > 0) {
      setPackages(gamePackages);
    } else if (game && packages.length === 0 && gamePackages.length === 0) {
      // Try to get packages from game data if API returns empty
      const gamePackagesArray = Array.isArray(game.packages) ? game.packages : [];
      const gamePrices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
      const gameDiscountPrices = Array.isArray((game as any).packageDiscountPrices) ? (game as any).packageDiscountPrices : [];
      
      if (gamePackagesArray.length > 0) {
        const initialPackages = gamePackagesArray.map((pkg: any, index: number) => ({
          amount: typeof pkg === 'string' ? pkg : (pkg?.amount || ''),
          price: Number(gamePrices[index] || 0),
          discountPrice: gameDiscountPrices[index] ? Number(gameDiscountPrices[index]) : null,
          image: null
        }));
        setPackages(initialPackages);
      }
    }
  }, [gamePackages, game]);

  // Update packages mutation
  const updatePackagesMutation = useMutation({
    mutationFn: async (packages: Package[]) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/admin/games/${gameId}/packages`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ packages })
      });
      if (!res.ok) throw new Error('Failed to update packages');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/games/${gameId}/packages`] });
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      setIsEditing(false);
    }
  });

  const handleAddPackage = () => {
    setPackages([...packages, { amount: '', price: 0, discountPrice: null, image: null }]);
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

  const handleSave = () => {
    updatePackagesMutation.mutate(packages);
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
              <CardContent className="space-y-4">
                {/* Package Image Preview */}
                {pkg.image && (
                  <div className="mb-4">
                    <Label>Package Image Preview</Label>
                    <div className="mt-2 border rounded-lg p-2 bg-muted/20">
                      <ImageWithFallback
                        src={pkg.image}
                        alt={`Package ${index + 1}`}
                        className="w-full h-32 object-contain rounded"
                      />
                    </div>
                  </div>
                )}
                
                <div>
                  <Label>Amount (e.g., "10000 ZP")</Label>
                  <Input
                    value={pkg.amount}
                    onChange={(e) => handleUpdatePackage(index, 'amount', e.target.value)}
                    placeholder="10000 ZP"
                  />
                </div>
                <div>
                  <Label>Price</Label>
                  <Input
                    type="number"
                    value={pkg.price}
                    onChange={(e) => handleUpdatePackage(index, 'price', parseFloat(e.target.value) || 0)}
                    placeholder="200"
                  />
                </div>
                <div>
                  <Label>Discount Price (optional)</Label>
                  <Input
                    type="number"
                    value={pkg.discountPrice || ''}
                    onChange={(e) => handleUpdatePackage(index, 'discountPrice', e.target.value ? parseFloat(e.target.value) : null)}
                    placeholder="250"
                  />
                </div>
                <div>
                  <Label>Image URL (optional)</Label>
                  <Input
                    value={pkg.image || ''}
                    onChange={(e) => handleUpdatePackage(index, 'image', e.target.value)}
                    placeholder="https://example.com/image.jpg or /images/image.jpg"
                  />
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
              <Button onClick={handleSave} disabled={updatePackagesMutation.isPending}>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

