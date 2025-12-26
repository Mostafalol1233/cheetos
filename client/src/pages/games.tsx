import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, Star, ShoppingCart, Check } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addingItems, setAddingItems] = useState<string[]>([]);
  const [previewGame, setPreviewGame] = useState<Game | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewMode, setPreviewMode] = useState<'image' | 'packages'>('image');
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allGames = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const handleAddToCart = (game: Game) => {
    if (Number(game.stock) <= 0) {
      toast({
        title: t('out_of_stock'),
        description: t('item_unavailable'),
        duration: 2500,
      });
      return;
    }

    setAddingItems(prev => [...prev, game.id]);
    addToCart({
      id: game.id,
      name: game.name,
      price: parseFloat(game.price.toString()),
      image: game.image
    });
    toast({
      title: t('success'),
      description: `${game.name} ${t('added_to_cart')}`,
      duration: 2000,
    });
    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  const openPreview = (game: Game) => {
    setPreviewGame(game);
    setPreviewMode('image');
    setIsPreviewOpen(true);
  };

  // Filter games based on search and category
  const filteredGames = allGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl bg-gray-800" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px] bg-gray-800" />
                  <Skeleton className="h-4 w-[200px] bg-gray-800" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back_to_home')}
          </Link>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-2">{t('games')}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">{t('browse_games_desc')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder={`${t('search')}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[200px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder={t('all_categories')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('all_categories')}</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.slug}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {filteredGames.length} {t('games_found')}
            </h2>
          </div>
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const isAdding = addingItems.includes(game.id);
              const isOutOfStock = Number(game.stock) <= 0;
              const packages = Array.isArray(game.packages) ? game.packages : [];
              const packagePrices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
              const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices) ? (game as any).packageDiscountPrices : [];
              const hasDiscount = game.discountPrice && parseFloat(game.discountPrice.toString()) > 0;
              const mainPrice = parseFloat(game.price.toString());
              const discountPrice = hasDiscount ? parseFloat(game.discountPrice.toString()) : null;
              
              return (
                <Link key={game.id} href={`/game/${game.slug}`} className="relative group cursor-pointer">
                  <div className="relative aspect-square overflow-hidden rounded-lg transition-transform duration-300 hover:scale-105">
                    <ImageWithFallback
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-contain"
                    />
                    {game.isPopular && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg z-10">
                        <Star className="w-3 h-3 mr-1" />
                        {t('hot')}
                      </div>
                    )}

                    <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    <div className="absolute inset-0 flex items-end justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full">
                          {isOutOfStock ? t('out_of_stock') : t('in_stock')}
                        </span>
                        {packages.length > 0 && (
                          <span className="text-xs bg-black/60 text-white px-2 py-1 rounded-full">
                            {t('more_packages')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          size="sm"
                          className="bg-neon-pink hover:bg-neon-pink/90"
                          onClick={(e) => { e.preventDefault(); openPreview(game); }}
                        >
                          {t('view')}
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          disabled={isOutOfStock || isAdding}
                          onClick={(e) => { e.preventDefault(); handleAddToCart(game); }}
                        >
                          {isAdding ? (
                            <span className="inline-flex items-center gap-1"><Check className="w-4 h-4" />{t('added')}</span>
                          ) : (
                            <span className="inline-flex items-center gap-1"><ShoppingCart className="w-4 h-4" />{t('add')}</span>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <Search className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              {t('no_games_found')}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              {t('try_adjust_search')}
            </p>
            <Button
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("all");
              }}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {t('clear_filters')}
            </Button>
          </div>
        )}
      </div>
      <GamePreviewDialog
        open={isPreviewOpen}
        onOpenChange={(open) => { setIsPreviewOpen(open); if (!open) setPreviewGame(null); }}
        game={previewGame}
        onAdd={handleAddToCart}
        mode={previewMode}
        onModeChange={setPreviewMode}
      />
    </div>
  );
}

function GamePreviewDialog({ open, onOpenChange, game, onAdd, mode, onModeChange }: { open: boolean; onOpenChange: (open: boolean) => void; game: Game | null; onAdd: (g: Game) => void; mode: 'image' | 'packages'; onModeChange: (m: 'image' | 'packages') => void }) {
  if (!game) return null;
  const { t } = useTranslation();
  const packages = Array.isArray(game.packages) ? game.packages : [];
  const packagePrices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
  const hasDiscount = game.discountPrice && parseFloat(game.discountPrice.toString()) > 0;
  const mainPrice = parseFloat(game.price.toString());
  const discountPrice = hasDiscount ? parseFloat(game.discountPrice.toString()) : null;
  const isOutOfStock = Number(game.stock) <= 0;

  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastPos, setLastPos] = useState<{ x: number; y: number } | null>(null);

  const clampScale = (s: number) => Math.min(4, Math.max(1, s));
  const handleZoomIn = () => setScale(prev => clampScale(prev + 0.25));
  const handleZoomOut = () => setScale(prev => clampScale(prev - 0.25));
  const handleReset = () => { setScale(1); setOffset({ x: 0, y: 0 }); };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(true);
    setLastPos({ x: e.clientX, y: e.clientY });
    (e.currentTarget as HTMLDivElement).setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !lastPos) return;
    const dx = e.clientX - lastPos.x;
    const dy = e.clientY - lastPos.y;
    setOffset(prev => ({ x: prev.x + dx, y: prev.y + dy }));
    setLastPos({ x: e.clientX, y: e.clientY });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDragging(false);
    setLastPos(null);
    (e.currentTarget as HTMLDivElement).releasePointerCapture(e.pointerId);
  };

  const onWheel: React.WheelEventHandler<HTMLDivElement> = (e) => {
    e.preventDefault();
    const delta = -e.deltaY; // up to zoom in
    const factor = delta > 0 ? 0.1 : -0.1;
    setScale(prev => clampScale(prev + factor));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span className="truncate">{game.name}</span>
            <span className="text-neon-pink font-bold">
              {discountPrice ? (
                <span className="inline-flex items-center gap-2">
                  <span className="line-through opacity-70">{mainPrice}</span>
                  <span>{discountPrice}</span>
                </span>
              ) : (
                <span>{mainPrice}</span>
              )}
            </span>
          </DialogTitle>
          <DialogDescription className="line-clamp-2">{game.description}</DialogDescription>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button size="sm" variant={mode === 'image' ? 'default' : 'secondary'} onClick={() => onModeChange('image')}>Image</Button>
              <Button size="sm" variant={mode === 'packages' ? 'default' : 'secondary'} onClick={() => onModeChange('packages')}>{t('more_packages')}</Button>
            </div>

            {mode === 'image' ? (
              <div
                className="relative aspect-square rounded-lg border bg-muted/30 overflow-hidden touch-none"
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onWheel={onWheel}
              >
                <div
                  className={`absolute inset-0 transition-transform ${isDragging ? '' : 'duration-200'}`}
                  style={{ transform: `translate(${offset.x}px, ${offset.y}px) scale(${scale})` }}
                >
                  <ImageWithFallback src={game.image} alt={game.name} className="w-full h-full object-contain select-none" />
                </div>
                <div className="absolute bottom-3 right-3 flex items-center gap-2 bg-background/70 backdrop-blur rounded-md p-2 border">
                  <Button size="icon" variant="outline" onClick={handleZoomOut} aria-label="Zoom Out">-</Button>
                  <span className="text-xs w-10 text-center">{Math.round(scale * 100)}%</span>
                  <Button size="icon" variant="outline" onClick={handleZoomIn} aria-label="Zoom In">+</Button>
                  <Button size="sm" variant="ghost" onClick={handleReset} aria-label="Reset">Reset</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {packages.slice(0, 6).map((pkg, i) => (
                  <div key={i} className="relative rounded-lg border bg-background/50 p-3 flex items-center gap-3">
                    <div className="shrink-0 w-12 h-12 rounded bg-muted/40 overflow-hidden">
                      <ImageWithFallback src={(game as any).packageThumbnails?.[i] || game.image} alt={pkg} className="w-full h-full object-contain" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{pkg}</div>
                      {packagePrices[i] && (
                        <div className="text-xs text-muted-foreground truncate">{packagePrices[i]}</div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className={`text-xs px-2 py-1 rounded-full ${isOutOfStock ? 'bg-red-600/20 text-red-500' : 'bg-green-600/20 text-green-400'}`}>
                {isOutOfStock ? t('out_of_stock') : t('in_stock')}
              </span>
              {game.isPopular && (
                <span className="text-xs bg-gold-primary text-black px-2 py-1 rounded-full inline-flex items-center gap-1">
                  <Star className="w-3 h-3" /> {t('hot')}
                </span>
              )}
            </div>

            {packages.length > 0 && (
              <div className="space-y-2">
                <div className="text-sm font-semibold">{t('more_packages')}</div>
                <div className="grid grid-cols-2 gap-2">
                  {packages.slice(0, 4).map((pkg, i) => (
                    <div key={i} className="p-3 rounded-lg border bg-background/50">
                      <div className="font-medium truncate">{pkg}</div>
                      {packagePrices[i] && (
                        <div className="text-xs text-muted-foreground">{packagePrices[i]}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center gap-3">
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                disabled={isOutOfStock}
                onClick={() => onAdd(game)}
              >
                <ShoppingCart className="w-4 h-4 mr-2" /> {t('add')}
              </Button>
              <Link href={`/game/${game.slug}`} className="inline-flex">
                <Button variant="secondary">{t('view_details') ?? 'View Details'}</Button>
              </Link>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
