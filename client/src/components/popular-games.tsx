import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame } from "lucide-react";

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
      price: game.price,
      image: game.image
    });

    // Show success feedback
    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <div className="w-6 h-6 bg-gold-primary rounded-full animate-pulse mr-3"></div>
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="bg-card-bg rounded-xl h-64 animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
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
            <div
              key={game.id}
              className="bg-card-bg rounded-xl overflow-hidden transition-all duration-300 hover:shadow-lg hover:scale-105"
            >
              {/* Popular badge */}
              <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-gold-primary to-neon-pink text-background px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                <Star className="w-3 h-3" />
                Popular
              </div>

              <Link href={`/game/${game.slug}`} className="block">
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={game.image}
                    alt={`${game.name} game`}
                    className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                  />
                </div>
                
                <div className="p-3">
                  <h3 className="text-base font-semibold mb-1 text-foreground hover:text-gold-primary transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg font-bold text-gold-primary">
                      ${game.price.toFixed(2)}
                    </span>
                    <span className="text-sm text-muted-foreground">
                      {game.currency}
                    </span>
                  </div>
                  
                  <Button
                    onClick={(e) => {
                      e.preventDefault();
                      handleAddToCart(game);
                    }}
                    disabled={isAdding}
                    className="w-full bg-gradient-to-r from-gold-primary to-gold-secondary hover:from-gold-secondary hover:to-gold-primary text-background"
                  >
                    {isAdding ? (
                      <span className="animate-pulse">Added!</span>
                    ) : (
                      <>
                        <ShoppingBag className="mr-2 h-4 w-4" />
                        Add to Cart
                      </>
                    )}
                  </Button>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}