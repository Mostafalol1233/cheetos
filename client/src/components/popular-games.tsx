import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame, Share2, Play, Check } from "lucide-react";
import { InteractiveGamePreview } from "./interactive-game-preview";
import ImageWithFallback from "./image-with-fallback";
import { useToast } from "@/hooks/use-toast";
import { DynamicLoadingProgress } from "./dynamic-loading-progress";
import { useTranslation } from "@/lib/translation";

export function PopularGames() {
  const { t } = useTranslation();
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
  });

  const { addToCart } = useCart();
  const { toast } = useToast();
  const [addingItems, setAddingItems] = useState<string[]>([]);

  const handleAddToCart = async (game: Game) => {
    if (Number(game.stock) <= 0) {
      toast({
        title: t('out_of_stock'),
        description: 'This item is currently unavailable.',
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

  if (isLoading) {
    return <DynamicLoadingProgress isLoading={true} loadingText={t('loading_popular_games')} />;
  }

  if (isError || !Array.isArray(games) || games.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center mb-8">
        <div className="w-6 h-6 bg-gold-primary rounded-full flex items-center justify-center mr-3 shadow-[0_0_10px_rgba(255,204,51,0.5)]">
          <Flame className="w-3 h-3 text-black" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">{t('popular_games')}</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.isArray(games) && games.map((game) => {
          const isAdding = addingItems.includes(game.id);
          const isOutOfStock = Number(game.stock) <= 0;
          
          return (
            <div key={game.id} className="relative group perspective">
              <Link href={`/game/${game.slug}`} className="block">
              <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/30 bg-gradient-to-b from-gray-900 to-black p-4 h-full flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:border-cyan-400/60 group-hover:glow-cyan cursor-pointer">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300 pointer-events-none"></div>
                
                {/* Game Image */}
                <div className="relative flex-1 h-56 mb-3 flip-card">
                  <div className="relative rounded-lg overflow-hidden border border-cyan-400/20 bg-gray-800 w-full h-full flex items-center justify-center flip-card-face">
                    <ImageWithFallback
                      src={game.image}
                      alt={game.name}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    {game.isPopular && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        Popular
                      </div>
                    )}
                  </div>
                  {/* Back face with extra details */}
                  <div className="absolute inset-0 rounded-lg overflow-hidden p-4 bg-gradient-to-b from-black via-gray-900 to-black border border-cyan-500/30 text-cyan-100 flex flex-col justify-center items-center gap-3 flip-card-back shadow-[inset_0_0_20px_rgba(0,255,255,0.1)]">
                    <div className="text-center">
                      <p className="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-1">{t('categories')}</p>
                      <p className="text-sm font-medium text-white capitalize">{game.category}</p>
                    </div>
                    
                    <div className="w-full h-px bg-cyan-500/30 my-1"></div>
                    
                    <div className="text-center w-full">
                      <p className="text-xs text-cyan-400 uppercase tracking-wider font-bold mb-1">{t('available_packages')}</p>
                      <p className="text-xs text-gray-300 line-clamp-3 leading-relaxed px-2">
                        {Array.isArray(game.packages) && game.packages.length > 0 
                          ? game.packages.join(' • ') 
                          : t('standard_package_available')}
                      </p>
                    </div>
                    
                    <div className={`mt-auto pt-2 flex items-center gap-2 text-xs font-mono px-3 py-1 rounded-full border ${isOutOfStock ? 'text-red-300 bg-red-950/30 border-red-500/20' : 'text-green-400 bg-green-950/30 border-green-500/20'}`}>
                      <Check className="w-3 h-3" />
                      <span>{isOutOfStock ? t('out_of_stock') : `${t('in_stock_prefix')}: ${game.stock}`}</span>
                    </div>
                  </div>
                </div>

                {/* Game Info */}
                <div className="relative z-10">
                  <h3 className="font-bold text-white mb-2 text-lg line-clamp-1">{game.name}</h3>
                  
                  {/* Card Amounts/Packages */}
                  {Array.isArray(game.packages) && game.packages.length > 0 ? (
                    <div className="mb-2 space-y-1">
                      {game.packages.slice(0, 2).map((pkg: string, idx: number) => {
                        const pkgPrice = game.packagePrices?.[idx] || game.price;
                        const pkgDiscountPrice = (game as any).packageDiscountPrices?.[idx] || null;
                        const hasPkgDiscount = pkgDiscountPrice && parseFloat(pkgDiscountPrice) > 0;
                        
                        return (
                          <div key={idx} className="flex items-center justify-between text-xs">
                            <span className="text-cyan-300/80">{pkg}</span>
                            <div className="flex items-center gap-1">
                              {hasPkgDiscount && (
                                <span className="text-red-400 line-through text-[10px]">{pkgPrice} {game.currency}</span>
                              )}
                              <span className="text-cyan-400 font-bold">{hasPkgDiscount ? pkgDiscountPrice : pkgPrice} {game.currency}</span>
                            </div>
                          </div>
                        );
                      })}
                      {game.packages.length > 2 && (
                        <div className="text-xs text-cyan-300/60">+{game.packages.length - 2} more packages</div>
                      )}
                    </div>
                  ) : (
                    <div className="mb-2">
                      {game.discountPrice && parseFloat(game.discountPrice.toString()) > 0 ? (
                        <div className="flex items-center gap-2">
                          <span className="text-red-400 line-through text-sm">{game.price} {game.currency}</span>
                          <span className="text-cyan-400 font-bold text-lg">{game.discountPrice} {game.currency}</span>
                        </div>
                      ) : (
                        <span className="text-cyan-400 font-bold text-lg">{game.price} {game.currency}</span>
                      )}
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <span className={`text-xs px-2 py-1 rounded ${isOutOfStock ? 'text-red-200 bg-red-500/10' : 'text-cyan-300/70 bg-cyan-400/10'}`}>
                      {isOutOfStock ? t('out_of_stock') : `${t('in_stock_prefix')}: ${game.stock}`}
                    </span>
                  </div>
                </div>

                
              </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
