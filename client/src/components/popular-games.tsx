import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ShoppingBag, Star, Flame, Share2, Play, Check } from "lucide-react";
import { InteractiveGamePreview } from "./interactive-game-preview";
import ImageWithFallback from "./image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { cn } from "@/lib/utils";

const GAME_SLUG_IMAGES: Record<string, string> = {
  'free-fire': '/images/free-fire-game.png',
  'freefire': '/images/free-fire-game.png',
  'pubg': '/images/pubg-game.png',
  'pubg-mobile': '/images/pubg-game.png',
  'crossfire': '/images/crossfire-game.png',
  'minecraft': '/images/minecraft.webp',
  'honor-of-kings': '/images/hok-main.webp',
  'hok': '/images/hok-main.webp',
  'valorant': '/images/VALORANT.jpg',
  'valornt': '/images/VALORANT.jpg',
  'roblox': '/images/roblox.webp',
  'steam': '/images/Steam-Logo-White_4.webp',
  'xbox': '/images/xbox-live.webp',
  'xbox-live': '/images/xbox-live.webp',
  'playstation': '/images/ps-store.webp',
  'ps-store': '/images/ps-store.webp',
  'discord': '/images/dis-co.webp',
  'discord-nitro': '/images/dis-co.webp',
  'netflix': '/images/netflix_-_Home_1.webp',
  'google-play': '/images/gplay1-64c83ac2e830f.webp',
  'ea-play': '/images/ea-play-icon-1.webp',
  'yalla-ludo': '/images/yalla-ludo-2-67563efa1ab95.webp',
};

function getGameImage(game: Game): string {
  if (GAME_SLUG_IMAGES[game.slug]) return GAME_SLUG_IMAGES[game.slug];
  if (game.image) return game.image;
  return '';
}

export function PopularGames() {
  const { t } = useTranslation();
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
  });

  const [addingItems] = useState<string[]>([]);

  if (isLoading) {
    return null;
  }

  if (isError || !Array.isArray(games) || games.length === 0) {
    return null;
  }

  return (
    <section className="py-12 relative overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-white to-muted/30 dark:from-background dark:to-muted/20 z-0"></div>
      <div className="absolute inset-0 opacity-40 dark:opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold-primary/18 via-transparent to-transparent"></div>

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-gold-primary/30 animate-pulse-slow">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">{t('popular_games')}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6 lg:gap-8">
          {Array.isArray(games) && games.map((game) => {
            const isAdding = addingItems.includes(game.id);
            const isOutOfStock = false;

            return (
              <div key={game.id} className="relative group perspective h-full">
                <Link href={`/game/${game.slug}`} className="block h-full">
                  <div className="relative h-full flex flex-col rounded-2xl bg-gray-900 border border-white/10 hover:border-gold-primary/60 transition-all duration-300 overflow-hidden">
                    {/* High-tech Border Effect */}
                    <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[0_12px_30px_rgba(0,0,0,0.25)]" />

                    {/* Game Image */}
                    <div className="relative mb-3 w-full overflow-hidden rounded-t-2xl bg-[#0e1a2b] aspect-[4/3] sm:aspect-[16/9]">
                      <ImageWithFallback
                        src={getGameImage(game)}
                        alt={game.name}
                        className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105"
                      />
                    </div>

                    {/* Game Info */}
                    <div className="relative z-10 flex-1 flex flex-col px-3 pb-3 sm:px-4 sm:pb-4">
                      <h3 className="font-bold text-foreground mb-3 text-base sm:text-lg line-clamp-1 group-hover:text-gold-primary transition-colors">
                        {game.name}
                      </h3>

                      <div className="mt-auto flex items-center justify-between">
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
