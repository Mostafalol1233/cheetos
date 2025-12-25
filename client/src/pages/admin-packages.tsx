import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useRoute } from 'wouter';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Plus, Trash2, Save } from 'lucide-react';
import { queryClient } from '@/lib/queryClient';
import { Link } from 'wouter';

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
      const res = await fetch(`/api/games/id/${gameId}`);
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
      const res = await fetch(`/api/admin/games/${gameId}/packages`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      if (!res.ok) throw new Error('Failed to fetch packages');
      return res.json();
    },
    onSuccess: (data) => {
      setPackages(data);
    }
  });

  // Update packages mutation
  const updatePackagesMutation = useMutation({
    mutationFn: async (packages: Package[]) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(`/api/admin/games/${gameId}/packages`, {
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

