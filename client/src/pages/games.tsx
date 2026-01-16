import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, Filter, Star, ShoppingCart, Check } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCart } from "@/lib/cart-context";
import { useToast } from "@/hooks/use-toast";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [addingItems, setAddingItems] = useState<string[]>([]);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allGames = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const handleAddToCart = (e: React.MouseEvent, game: Game) => {
    e.preventDefault();
    e.stopPropagation();

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

  // Filter games based on search and category
  const filteredGames = allGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl bg-muted" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px] bg-muted" />
                  <Skeleton className="h-4 w-[200px] bg-muted" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-muted-foreground hover:text-primary transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t('back_to_home')}
          </Link>
          
          <div className="mb-6">
            <h1 className="text-4xl font-bold mb-2">{t('games')}</h1>
            <p className="text-muted-foreground text-lg">{t('browse_games_desc')}</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
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
            <h2 className="text-2xl font-bold">
              {filteredGames.length} {t('games_found')}
            </h2>
          </div>
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredGames.map((game) => {
              const isAdding = addingItems.includes(game.id);
              const isOutOfStock = Number(game.stock) <= 0;
              
              return (
                <Link key={game.id} href={`/game/${game.slug}`} className="group block h-full">
                  <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-border bg-card hover:bg-accent/50 hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-md">
                    <div className="relative aspect-[4/3] overflow-hidden bg-muted/20">
                      <ImageWithFallback
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                      />
                      {game.isPopular && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-gold-primary to-neon-pink text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg z-10">
                          <Star className="w-3 h-3 mr-1" />
                          {t('hot')}
                        </div>
                      )}
                      {isOutOfStock && (
                         <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-20">
                            <span className="text-destructive-foreground font-bold px-3 py-1 bg-destructive rounded-full">{t('out_of_stock')}</span>
                         </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors line-clamp-1" title={game.name}>
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <Button
                          size="sm"
                          variant={isAdding ? "secondary" : "default"}
                          className={`
                            ${isAdding 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : ""} 
                            transition-colors z-30
                          `}
                          disabled={isOutOfStock || isAdding}
                          onClick={(e) => handleAddToCart(e, game)}
                        >
                          {isAdding ? (
                            <Check className="w-4 h-4" />
                          ) : (
                            <ShoppingCart className="w-4 h-4" />
                          )}
                          <span className="sr-only">{isAdding ? t('added') : t('add')}</span>
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
    </div>
  );
}
