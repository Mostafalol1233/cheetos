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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black dark">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-300 hover:text-white transition-colors mb-4"
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
              const hasDiscount = game.discountPrice && parseFloat(game.discountPrice.toString()) > 0;
              const mainPrice = parseFloat(game.price.toString());
              const discountPrice = hasDiscount && game.discountPrice !== null ? parseFloat(String(game.discountPrice)) : null;
              
              return (
                <Link key={game.id} href={`/game/${game.slug}`} className="group block h-full">
                  <div className="relative h-full flex flex-col rounded-xl overflow-hidden border border-gray-800 bg-gray-900/50 hover:bg-gray-800/80 hover:border-cyan-500/50 transition-all duration-300 shadow-lg hover:shadow-cyan-500/20">
                    <div className="relative aspect-[4/3] overflow-hidden bg-black/20">
                      <ImageWithFallback
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-contain p-4 transition-transform duration-500 group-hover:scale-110"
                      />
                      {game.isPopular && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg z-10">
                          <Star className="w-3 h-3 mr-1" />
                          {t('hot')}
                        </div>
                      )}
                      {isOutOfStock && (
                         <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-20">
                            <span className="text-white font-bold px-3 py-1 bg-red-600 rounded-full">{t('out_of_stock')}</span>
                         </div>
                      )}
                    </div>

                    <div className="p-4 flex flex-col flex-1 gap-2">
                      <h3 className="text-lg font-bold text-white group-hover:text-cyan-400 transition-colors line-clamp-1" title={game.name}>
                        {game.name}
                      </h3>
                      
                      <div className="mt-auto flex items-center justify-between pt-2">
                        <div className="flex flex-col">
                           {discountPrice && discountPrice > 0 && discountPrice < mainPrice ? (
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-400 line-through">${mainPrice.toFixed(2)}</span>
                                <span className="text-cyan-400 font-bold text-lg">${discountPrice.toFixed(2)}</span>
                             </div>
                           ) : discountPrice && discountPrice > 0 && discountPrice > mainPrice ? (
                             <div className="flex flex-col">
                                <span className="text-xs text-gray-400 line-through">${discountPrice.toFixed(2)}</span>
                                <span className="text-cyan-400 font-bold text-lg">${mainPrice.toFixed(2)}</span>
                             </div>
                           ) : (
                              <span className="text-cyan-400 font-bold text-lg">${mainPrice.toFixed(2)}</span>
                           )}
                        </div>

                        <Button
                          size="sm"
                          variant={isAdding ? "secondary" : "default"}
                          className={`
                            ${isAdding 
                              ? "bg-green-600 hover:bg-green-700 text-white" 
                              : "bg-cyan-600 hover:bg-cyan-500 text-white"} 
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
