import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame, Share2, Play, Check } from "lucide-react";
import { InteractiveGamePreview } from "./interactive-game-preview";
import ImageWithFallback from "./image-with-fallback";
import { DynamicLoadingProgress } from "./dynamic-loading-progress";
import { useTranslation } from "@/lib/translation";
import { cn } from "@/lib/utils";

export function PopularGames() {
  const { t } = useTranslation();
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
  });

  const [addingItems] = useState<string[]>([]);

  if (isLoading) {
    return <DynamicLoadingProgress isLoading={true} loadingText={t('loading_popular_games')} />;
  }

  if (isError || !Array.isArray(games) || games.length === 0) {
    return null;
  }

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-background to-muted/20 z-0"></div>
      <div className="absolute inset-0 opacity-30 dark:opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-primary/10 via-transparent to-transparent"></div>
      
      <div className="container relative z-10 mx-auto px-4">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-gold-primary/30 animate-pulse-slow">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">{t('popular_games')}</h2>
        </div>
      
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {Array.isArray(games) && games.map((game) => {
            const isAdding = addingItems.includes(game.id);
            const isOutOfStock = false;
            
            return (
              <div key={game.id} className="relative group perspective">
                <Link href={`/game/${game.slug}`} className="block h-full">
                <div className="relative rounded-2xl overflow-hidden border border-border/50 bg-card/50 backdrop-blur-sm p-3 sm:p-4 h-full flex flex-col justify-between shadow-lg transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-gold-primary/20 hover:border-gold-primary/50 group-hover:bg-card/80">
                  {/* Card glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/0 via-transparent to-neon-pink/0 group-hover:from-gold-primary/5 group-hover:to-neon-pink/5 transition-all duration-500 pointer-events-none"></div>
                  
                  {/* Game Image */}
                  <div className="relative mb-3 aspect-[4/3] sm:aspect-[16/10] overflow-hidden rounded-xl bg-muted/20">
                    <ImageWithFallback
                      src={game.image || ''}
                      alt={game.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    
                    {/* Overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px]">
                        <span className="bg-white/20 text-white px-4 py-2 rounded-full backdrop-blur-md font-bold text-sm border border-white/30 flex items-center gap-2 transform scale-90 group-hover:scale-100 transition-transform duration-300">
                            <Play className="w-4 h-4 fill-current" /> Play Now
                        </span>
                    </div>
                  </div>

                  {/* Game Info */}
                  <div className="relative z-10 mt-auto">
                    <h3 className="font-bold text-foreground mb-1 text-lg line-clamp-1 group-hover:text-gold-primary transition-colors">{game.name}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 mb-3 opacity-80">{game.category || 'Action RPG'}</p>

                    <div className="flex items-center justify-between mt-2">
                      <div className="text-sm font-bold bg-muted/50 px-2 py-1 rounded text-foreground">
                        {game.price ? `${game.price} ${game.currency || 'EGP'}` : 'Free'}
                      </div>
                      <span className="text-xs px-2 py-1 rounded-full text-gold-primary bg-gold-primary/10 group-hover:bg-gold-primary group-hover:text-black transition-colors font-medium">
                        {t('view_details')}
                      </span>
                    </div>
                  </div>
                </div>
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
