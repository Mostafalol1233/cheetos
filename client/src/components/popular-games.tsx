import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame, Share2, Play } from "lucide-react";
import { InteractiveGamePreview } from "./interactive-game-preview";
import { SocialSharing } from "./social-sharing";
import { DynamicLoadingProgress } from "./dynamic-loading-progress";

export function PopularGames() {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games/popular"],
    queryFn: () => fetch("/api/games/popular").then(res => res.json()) as Promise<Game[]>
  });

  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState<string[]>([]);

  const handleAddToCart = async (game: Game) => {
    setAddingItems(prev => [...prev, game.id]);
    
    addToCart({
      id: game.id,
      name: game.name,
      price: parseFloat(game.price.toString()),
      image: game.image
    });

    // Show success feedback
    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  if (isLoading) {
    return <DynamicLoadingProgress isLoading={true} loadingText="Loading popular games..." />;
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
        {games.map((game) => {
          const isAdding = addingItems.includes(game.id);
          
          return (
            <div key={game.id} className="relative">
              <InteractiveGamePreview 
                game={game} 
                onGameSelect={(selectedGame) => {
                  window.location.href = `/game/${selectedGame.slug}`;
                }}
              />
              
              <div className="mt-3 flex justify-between items-center">
                <SocialSharing game={game} />
                <Button
                  onClick={() => handleAddToCart(game)}
                  disabled={isAdding}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  {isAdding ? (
                    <span className="animate-pulse">Added!</span>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      Quick Add
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}