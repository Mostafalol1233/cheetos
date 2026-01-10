import { useState, useEffect } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Save, Eye } from 'lucide-react';
import { API_BASE_URL, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import RichTextEditor from '@/components/rich-text-editor';
import { Link } from 'wouter';

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
}

const apiPath = (path: string) => (path.startsWith('http') ? path : `${API_BASE_URL}${path}`);

export default function GameDescriptionEditor() {
  const [match, params] = useRoute('/admin/games/:id/description');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [description, setDescription] = useState('');
  const [previewMode, setPreviewMode] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);

  const gameId = params?.id;

  // Fetch game data
  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/id/${gameId}`],
    enabled: !!gameId,
  });

  // Update description mutation
  const updateDescriptionMutation = useMutation({
    mutationFn: async (data: { description: string }) => {
      const token = localStorage.getItem('adminToken');
      const res = await fetch(apiPath(`/api/games/${gameId}`), {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ description: data.description })
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || 'Failed to update description');
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/games/id/${gameId}`] });
      queryClient.invalidateQueries({ queryKey: ['/api/games'] });
      queryClient.invalidateQueries({ queryKey: ['/api/games/popular'] });
      toast({
        title: 'Success!',
        description: 'Game description updated successfully',
        duration: 2000,
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update description',
        variant: 'destructive',
      });
    }
  });

  // Image upload handler
  const handleImageUpload = async (file: File): Promise<string> => {
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

  // Initialize description when game data loads (only once)
  useEffect(() => {
    if (game?.description && !hasLoaded) {
      setDescription(game.description);
      setHasLoaded(true);
    }
  }, [game?.description, hasLoaded]);

  const handleSave = () => {
    if (!gameId) return;
    updateDescriptionMutation.mutate({ description });
  };

  const handlePreview = () => {
    setPreviewMode(!previewMode);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-muted-foreground">Loading game...</div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="text-red-500">Game not found</div>
            <Button
              onClick={() => setLocation('/admin')}
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              onClick={() => setLocation('/admin')}
              variant="outline"
              size="sm"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Edit Game Description</h1>
              <p className="text-muted-foreground">{game.name}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handlePreview}
              variant="outline"
              size="sm"
            >
              <Eye className="w-4 h-4 mr-2" />
              {previewMode ? 'Edit' : 'Preview'}
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateDescriptionMutation.isPending}
              className="bg-gold-primary hover:bg-gold-primary/90"
              size="sm"
            >
              <Save className="w-4 h-4 mr-2" />
              {updateDescriptionMutation.isPending ? 'Saving...' : 'Save Description'}
            </Button>
          </div>
        </div>

        {/* Game Info Card */}
        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Game Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="font-medium">{game.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium capitalize">{game.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Price</p>
                <p className="font-medium">{game.price} EGP</p>
              </div>
            </div>
            {game.image && (
              <div>
                <p className="text-sm text-muted-foreground mb-2">Game Image</p>
                <img
                  src={game.image}
                  alt={game.name}
                  className="w-32 h-32 object-cover rounded-lg border border-gold-primary/30"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Description Editor */}
        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader>
            <CardTitle className="text-lg flex items-center justify-between">
              <span>Description Editor</span>
              <div className="text-sm text-muted-foreground">
                Supports rich text, images, and RTL/LTR languages
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {previewMode ? (
              <div className="space-y-4">
                <div className="text-sm text-muted-foreground mb-2">Preview:</div>
                <div
                  className="prose prose-invert prose-lg max-w-none border rounded-lg p-4 bg-muted/50 [&_img]:max-w-full [&_img]:h-auto [&_img]:rounded-lg [&_img]:shadow-md"
                  dangerouslySetInnerHTML={{ __html: description || '<p class="text-muted-foreground italic">No description yet...</p>' }}
                />
              </div>
            ) : (
              <div className="space-y-4">
                <RichTextEditor
                  key={gameId}
                  value={description}
                  onChange={setDescription}
                  onImageUpload={handleImageUpload}
                  placeholder="Write a detailed description for this game. You can include formatting, images, and support for multiple languages..."
                  className="min-h-[400px]"
                />
                <div className="text-sm text-muted-foreground">
                  💡 Tip: Use the image button to upload and insert images. The editor supports both English (LTR) and Arabic (RTL) text.
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="bg-card/50 border-gold-primary/30">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href={`/game/${game.slug}`}>
                <Button variant="outline" size="sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Game Page
                </Button>
              </Link>
              <Button
                onClick={() => setLocation(`/admin`)}
                variant="outline"
                size="sm"
              >
                Edit Other Game Details
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}