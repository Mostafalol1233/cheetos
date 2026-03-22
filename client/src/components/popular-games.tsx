import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { Link } from "wouter";
import { Flame, ArrowRight } from "lucide-react";
import ImageWithFallback from "./image-with-fallback";
import { useTranslation } from "@/lib/translation";

const GAME_SLUG_IMAGES: Record<string, string> = {
  'free-fire': '/images/banner-free-fire.png',
  'freefire': '/images/banner-free-fire.png',
  'pubg': '/images/banner-pubg.png',
  'pubg-mobile': '/images/banner-pubg.png',
  'crossfire': '/images/banner-crossfire.png',
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

const GAME_GRADIENT_MAP: Record<string, string> = {
  'free-fire': 'from-orange-900/80 via-red-900/50 to-transparent',
  'freefire': 'from-orange-900/80 via-red-900/50 to-transparent',
  'pubg': 'from-yellow-900/80 via-amber-900/50 to-transparent',
  'pubg-mobile': 'from-yellow-900/80 via-amber-900/50 to-transparent',
  'crossfire': 'from-gray-900/80 via-slate-900/50 to-transparent',
  'minecraft': 'from-green-900/80 via-emerald-900/50 to-transparent',
  'valorant': 'from-red-900/80 via-rose-900/50 to-transparent',
  'roblox': 'from-red-900/80 via-pink-900/50 to-transparent',
  'steam': 'from-blue-900/80 via-slate-900/50 to-transparent',
  'xbox': 'from-green-900/80 via-lime-900/50 to-transparent',
  'xbox-live': 'from-green-900/80 via-lime-900/50 to-transparent',
  'playstation': 'from-blue-900/80 via-indigo-900/50 to-transparent',
  'ps-store': 'from-blue-900/80 via-indigo-900/50 to-transparent',
  'discord': 'from-indigo-900/80 via-purple-900/50 to-transparent',
  'discord-nitro': 'from-indigo-900/80 via-purple-900/50 to-transparent',
  'netflix': 'from-red-900/80 via-black to-transparent',
  'google-play': 'from-teal-900/80 via-cyan-900/50 to-transparent',
  'honor-of-kings': 'from-purple-900/80 via-pink-900/50 to-transparent',
  'hok': 'from-purple-900/80 via-pink-900/50 to-transparent',
  'yalla-ludo': 'from-yellow-900/80 via-amber-900/50 to-transparent',
};

function getGameImage(game: Game): string {
  if (GAME_SLUG_IMAGES[game.slug]) return GAME_SLUG_IMAGES[game.slug];
  if (game.image) return game.image;
  return '';
}

function getGameGradient(slug: string): string {
  return GAME_GRADIENT_MAP[slug] || 'from-gray-900/80 via-gray-800/50 to-transparent';
}

export function PopularGames() {
  const { t } = useTranslation();
  const { data: games = [], isLoading, isError } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
  });

  if (isLoading) return null;
  if (isError || !Array.isArray(games) || games.length === 0) return null;

  return (
    <section className="py-12 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-muted/10 z-0" />

      <div className="container relative z-10 mx-auto px-4">
        <div className="flex items-center mb-8">
          <div className="w-8 h-8 bg-gradient-to-br from-gold-primary to-orange-500 rounded-full flex items-center justify-center mr-3 shadow-lg shadow-gold-primary/30 animate-pulse-slow">
            <Flame className="w-4 h-4 text-white" />
          </div>
          <h2 className="text-3xl font-black text-foreground tracking-tight">{t('popular_games')}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {games.map((game) => {
            const gradient = getGameGradient(game.slug);
            return (
              <Link key={game.id} href={`/game/${game.slug}`} className="block group">
                <div className="relative overflow-hidden rounded-2xl border border-white/10 hover:border-gold-primary/50 shadow-md hover:shadow-xl hover:shadow-gold-primary/10 transition-all duration-300 cursor-pointer bg-gray-900" style={{ aspectRatio: '4/3' }}>
                  <ImageWithFallback
                    src={getGameImage(game)}
                    alt={game.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />

                  <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-all duration-300" />
                  <div className={`absolute inset-0 bg-gradient-to-t ${gradient}`} />

                  <div className="absolute bottom-0 left-0 right-0 p-3">
                    <h3 className="text-white font-bold text-sm leading-tight drop-shadow-lg line-clamp-2 mb-1.5 tracking-wide">
                      {game.name}
                    </h3>
                    <div className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-gold-primary/20 border border-gold-primary/40 text-gold-primary transition-all duration-300 group-hover:bg-gold-primary group-hover:text-black group-hover:border-gold-primary">
                      <span>{t('view_details')}</span>
                      <ArrowRight className="w-2.5 h-2.5 transition-transform duration-300 group-hover:translate-x-0.5" />
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
