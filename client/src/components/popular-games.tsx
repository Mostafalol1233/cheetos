import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame, Share2, Play, Check } from "lucide-react";
import { InteractiveGamePreview } from "./interactive-game-preview";
import { useToast } from "@/hooks/use-toast";
import { DynamicLoadingProgress } from "./dynamic-loading-progress";

export function PopularGames() {
  const { data: games = [], isLoading, isError } = useQuery({
    queryKey: ["/api/games/popular"],
    queryFn: () => fetch("/api/games/popular").then(res => res.json()) as Promise<Game[]>
  });

  const { addToCart } = useCart();
  const { toast } = useToast();
  const [addingItems, setAddingItems] = useState<string[]>([]);

  const handleAddToCart = async (game: Game) => {
    setAddingItems(prev => [...prev, game.id]);
    
    addToCart({
      id: game.id,
      name: game.name,
      price: parseFloat(game.price.toString()),
      image: game.image
    });

    toast({
      title: "Success! ✅",
      description: `${game.name} added to cart`,
      duration: 2000,
    });

    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  if (isLoading) {
    return <DynamicLoadingProgress isLoading={true} loadingText="Loading popular games..." />;
  }

  if (isError || !Array.isArray(games) || games.length === 0) {
    return null;
  }

  return (
    <section className="py-12">
      <div className="flex items-center mb-8">
        <div className="w-6 h-6 bg-gold-primary rounded-full flex items-center justify-center mr-3">
          <Flame className="w-3 h-3 text-background" />
        </div>
        <h2 className="text-2xl font-bold text-foreground">Most Popular Games</h2>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {Array.isArray(games) && games.map((game) => {
          const isAdding = addingItems.includes(game.id);
          
          return (
            <div key={game.id} className="relative group">
              <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/30 bg-gradient-to-b from-gray-900 to-black p-4 h-80 flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:border-cyan-400/60 group-hover:glow-cyan">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300 pointer-events-none"></div>
                
                {/* Game Image */}
                <div className="relative rounded-lg overflow-hidden border border-cyan-400/20 bg-gray-800 flex-1 mb-3 flex items-center justify-center">
                  <img
                    src={game.image}
                    alt={game.name}
                    className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                  />
                  {game.isPopular && (
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                      <Star className="w-3 h-3 mr-1" />
                      Popular
                    </div>
                  )}
                </div>

                {/* Game Info */}
                <div className="relative z-10">
                  <h3 className="font-bold text-white mb-1 text-lg line-clamp-1">{game.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyan-400 font-bold text-lg">{game.price} EGP</span>
                    <span className="text-xs text-cyan-300/70 bg-cyan-400/10 px-2 py-1 rounded">Stock: {game.stock}</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="relative z-10 flex gap-2">
                  <Link href={`/game/${game.slug}`} className="flex-1">
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-cyan-400/50 text-cyan-400 hover:bg-cyan-400/10 hover:text-cyan-300"
                    >
                      View
                    </Button>
                  </Link>
                  <Button
                    onClick={() => handleAddToCart(game)}
                    disabled={isAdding}
                    size="sm"
                    className="flex-1 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-semibold gap-1"
                  >
                    {isAdding ? (
                      <>
                        <Check className="w-4 h-4" />
                        Added!
                      </>
                    ) : (
                      <>
                        <ShoppingBag className="w-4 h-4" />
                        Add
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
