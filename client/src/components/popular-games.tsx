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
          const isOutOfStock = false;
          
          return (
            <div key={game.id} className="relative group perspective">
              <Link href={`/game/${game.slug}`} className="block">
              <div className="relative rounded-2xl overflow-hidden border-2 border-cyan-400/30 bg-gradient-to-b from-gray-900 to-black p-4 h-[360px] flex flex-col justify-between shadow-lg hover:shadow-2xl hover:shadow-cyan-500/50 transition-all duration-300 hover:border-cyan-400/60 group-hover:glow-cyan cursor-pointer">
                {/* Card glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:from-cyan-500/10 group-hover:via-cyan-500/5 group-hover:to-cyan-500/10 transition-all duration-300 pointer-events-none"></div>
                
                {/* Game Image */}
                <div className="relative h-56 mb-3">
                  <div className="relative rounded-lg overflow-hidden border border-cyan-400/20 bg-gray-800 w-full h-full flex items-center justify-center">
                    <ImageWithFallback
                      src={game.image || ''}
                      alt={game.name}
                      className="w-full h-full object-contain group-hover:scale-110 transition-transform duration-500"
                    />
                    {game.isPopular && (
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-cyan-400 to-blue-500 text-black px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                        <Star className="w-3 h-3 mr-1" />
                        {t('popular')}
                      </div>
                    )}
                  </div>
                </div>

                {/* Game Info */}
                <div className="relative z-10">
                  <h3 className="font-bold text-white mb-2 text-lg line-clamp-1">{game.name}</h3>

                  <div className="flex items-center justify-between">
                    <span className="text-xs px-2 py-1 rounded text-cyan-300/70 bg-cyan-400/10">
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
    </section>
  );
}
