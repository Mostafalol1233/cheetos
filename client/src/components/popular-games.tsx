import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";

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
          <div className="w-6 h-6 bg-gold-primary rounded mr-3 animate-pulse"></div>
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-7xl mx-auto auto-rows-max">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="bg-card rounded-xl overflow-hidden animate-pulse">
              <div className="w-full h-24 sm:h-32 bg-muted"></div>
              <div className="p-2 sm:p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
                <div className="h-6 bg-muted rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <div className="w-6 h-6 bg-gold-primary rounded-full flex items-center justify-center mr-3">
          <div className="w-3 h-3 bg-darker-bg rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold text-foreground">Most Popular Games</h2>
      </div>
      
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-w-7xl mx-auto auto-rows-max">
        {games.map((game, index) => {
          const isAdding = addingItems.includes(game.id);
          
          // Different sizes for variety like in the image
          const getCardClasses = (index: number) => {
            const baseClasses = "bg-card-bg dark:bg-card-bg rounded-xl overflow-hidden game-card transition-all duration-300 cursor-pointer hover:scale-[1.02] hover:shadow-lg";
            
            // Create varied layouts: some take 2 columns, some are taller
            if (index % 5 === 0) return `${baseClasses} col-span-2 row-span-2`; // Large square
            if (index % 7 === 0) return `${baseClasses} col-span-2`; // Wide rectangle
            if (index % 11 === 0) return `${baseClasses} row-span-2`; // Tall rectangle
            return baseClasses; // Regular size
          };
          
          const isLarge = (index % 5 === 0);
          const imageHeight = isLarge ? "h-32 sm:h-40" : "h-24 sm:h-32";
          
          return (
            <div key={game.id} className={getCardClasses(index)}>
              <Link href={`/game/${game.slug}`} className="block group">
                <div className="relative overflow-hidden rounded-t-xl">
                  <img
                    src={game.image}
                    alt={`${game.name} game`}
                    className={`w-full ${imageHeight} object-contain bg-white dark:bg-gray-900 group-hover:scale-110 transition-transform duration-300`}
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                </div>
                <div className="p-2 sm:p-3">
                  <h3 className="text-sm sm:text-base font-semibold mb-1 text-foreground line-clamp-1 group-hover:text-gold-primary transition-colors">
                    {game.name}
                  </h3>
                  <p className="text-muted-foreground text-xs mb-2 line-clamp-1">
                    {game.description}
                  </p>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gold-primary font-bold text-xs sm:text-sm">
                      من {game.price} جنيه
                    </span>
                    <span className="bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full text-xs font-medium">
                      ✓ متوفر
                    </span>
                  </div>
                </div>
              </Link>
              <div className="p-2 pt-0 space-y-1">
                <Link href={`/game/${game.slug}`}>
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs h-6 hover:scale-105 transition-all border-gold-primary/30 text-gold-primary hover:bg-gold-primary hover:text-background"
                  >
                    View All Packages
                  </Button>
                </Link>
                <Button
                  onClick={() => handleAddToCart(game)}
                  disabled={isAdding}
                  size="sm"
                  className={`w-full text-xs h-7 hover:scale-105 transition-transform ${
                    isAdding 
                      ? "bg-green-600 hover:bg-green-600" 
                      : "bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink"
                  } text-white font-medium`}
                >
                  {isAdding ? "Added!" : "Quick Add"}
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
