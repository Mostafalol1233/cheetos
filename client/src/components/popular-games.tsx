import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { useUserTracking } from "@/hooks/useUserTracking";
import { SocialShareButtons } from "./social-share-buttons";
import { Eye, ShoppingBag, Star, Flame } from "lucide-react";
import { LoadingMiniGame } from "./loading-mini-game";

export function PopularGames() {
  const { data: games = [], isLoading } = useQuery({
    queryKey: ["/api/games/popular"],
    queryFn: () => fetch("/api/games/popular").then(res => res.json()) as Promise<Game[]>
  });

  const { addToCart } = useCart();
  const [addingItems, setAddingItems] = useState<string[]>([]);
  const [hoveredGame, setHoveredGame] = useState<string | null>(null);
  const { trackGameView, trackAddToCart } = useUserTracking();

  const handleAddToCart = async (game: Game) => {
    setAddingItems(prev => [...prev, game.id]);
    
    addToCart({
      id: game.id,
      name: game.name,
      price: game.price,
      image: game.image
    });

    // Track the action
    trackAddToCart(game.id, { source: 'popular_games' });

    // Show success feedback
    setTimeout(() => {
      setAddingItems(prev => prev.filter(id => id !== game.id));
    }, 1000);
  };

  const handleGameView = (gameId: string) => {
    trackGameView(gameId, { source: 'popular_games' });
  };

  return (
    <>
      <LoadingMiniGame isLoading={isLoading} loadingText="Loading popular games..." />
      
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <div className="w-6 h-6 bg-gold-primary rounded-full flex items-center justify-center mr-3">
            <Flame className="w-3 h-3 text-background" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Most Popular Games</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto auto-rows-max">
          {games.map((game, index) => {
            const isAdding = addingItems.includes(game.id);
            const isHovered = hoveredGame === game.id;
            
            // Consistent card layout for better image display
            const getCardClasses = (index: number) => {
              return "bg-card-bg dark:bg-card-bg rounded-xl overflow-hidden game-card transition-all duration-300 cursor-pointer relative group hover:shadow-lg hover:scale-105";
            };

            // Fixed aspect ratio for all images
            const imageHeight = "h-40 sm:h-48";

            return (
              <motion.div
                key={game.id}
                className={getCardClasses(index)}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                whileHover={{ 
                  scale: 1.02,
                  boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
                }}
                onMouseEnter={() => setHoveredGame(game.id)}
                onMouseLeave={() => setHoveredGame(null)}
              >
                {/* Animated border */}
                <div className="absolute inset-0 rounded-xl border-2 border-transparent group-hover:border-gold-primary/30 transition-colors pointer-events-none" />
                
                {/* Popular badge */}
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-gold-primary to-neon-pink text-background px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  Popular
                </div>

                <Link href={`/game/${game.slug}`} onClick={() => handleGameView(game.id)} className="block group">
                  <div className="relative aspect-[4/3] overflow-hidden rounded-t-xl">
                    <img
                      src={game.image}
                      alt={`${game.name} game`}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    />
                    
                    {/* Overlay effects */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                    
                    {/* Hover stats */}
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 10 }}
                      className="absolute bottom-2 left-2 right-2 flex justify-between items-center text-white text-xs"
                    >
                      <div className="flex items-center gap-1 bg-black/50 px-2 py-1 rounded-full">
                        <Eye className="w-3 h-3" />
                        View
                      </div>
                      <div className="bg-black/50 px-2 py-1 rounded-full">
                        In Stock: {game.stock}
                      </div>
                    </motion.div>
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
                
                <div className="p-2 pt-0 space-y-2">
                  <div className="flex gap-2">
                    <Link href={`/game/${game.slug}`} className="flex-1">
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full text-xs h-7 hover:scale-105 transition-all border-gold-primary/30 text-gold-primary hover:bg-gold-primary hover:text-background"
                      >
                        View Details
                      </Button>
                    </Link>
                    
                    <SocialShareButtons game={game} />
                  </div>
                  
                  <motion.div
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Button
                      onClick={() => handleAddToCart(game)}
                      disabled={isAdding}
                      size="sm"
                      className={`w-full text-xs h-8 transition-all ${
                        isAdding 
                          ? "bg-green-600 hover:bg-green-600" 
                          : "bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink"
                      } text-white font-medium relative overflow-hidden group`}
                    >
                      <div className="flex items-center justify-center gap-2">
                        <ShoppingBag className="w-3 h-3" />
                        {isAdding ? "Added!" : "Quick Add"}
                      </div>
                      
                      {/* Animated background */}
                      <div className="absolute inset-0 bg-white/20 scale-x-0 group-hover:scale-x-100 transition-transform origin-left duration-300" />
                    </Button>
                  </motion.div>
                </div>

                {/* Particle effects on hover */}
                {isHovered && (
                  <div className="absolute inset-0 pointer-events-none">
                    {[...Array(3)].map((_, i) => (
                      <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-gold-primary rounded-full"
                        initial={{ 
                          x: Math.random() * 100 + "%",
                          y: "100%",
                          opacity: 0 
                        }}
                        animate={{ 
                          y: "0%",
                          opacity: [0, 1, 0]
                        }}
                        transition={{ 
                          duration: 2,
                          delay: i * 0.3,
                          repeat: Infinity
                        }}
                      />
                    ))}
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      </section>
    </>
  );

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
                    className={`w-full ${imageHeight} object-cover group-hover:scale-110 transition-transform duration-300`}
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
