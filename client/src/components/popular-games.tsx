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

export function PopularGames() {
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
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
                  <div className="absolute inset-0 rounded-lg overflow-hidden p-4 bg-gradient-to-b from-black to-gray-900 text-cyan-200 flex flex-col justify-center items-center gap-2 flip-card-back">
                    <p className="text-sm">Category: {game.category}</p>
                    <p className="text-sm">Packages: {Array.isArray(game.packages) ? game.packages.join(', ') : '—'}</p>
                    <p className="text-xs opacity-70">Stock: {game.stock}</p>
                  </div>
                </div>

                {/* Game Info */}
                <div className="relative z-10">
                  <h3 className="font-bold text-white mb-1 text-lg line-clamp-1">{game.name}</h3>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-cyan-400 font-bold text-lg">{game.price} EGP</span>
                    <span className="text-xs text-cyan-300/70 bg-cyan-400/10 px-2 py-1 rounded">Stock: {game.stock}</span>
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
