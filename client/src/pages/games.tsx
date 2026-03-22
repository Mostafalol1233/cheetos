import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Search, SlidersHorizontal, Gamepad2, ChevronRight, Flame, Package } from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import type { Game, Category } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { motion } from "framer-motion";

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
  if (game.image && game.image.startsWith('https://res.cloudinary.com')) return game.image;
  if (GAME_SLUG_IMAGES[game.slug]) return GAME_SLUG_IMAGES[game.slug];
  if (game.image) return game.image;
  return '';
}

export default function GamesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const { t } = useTranslation();

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
  });

  const { data: allGames = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games"],
  });

  const filteredGames = allGames.filter(game => {
    const matchesSearch = game.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         game.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === "all" || game.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 pt-32 pb-12">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {[...Array(15)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="aspect-[3/4] w-full rounded-2xl bg-muted" />
                <Skeleton className="h-4 w-3/4 bg-muted rounded" />
                <Skeleton className="h-3 w-1/2 bg-muted rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Page Header */}
      <div className="relative overflow-hidden bg-background border-b border-border/40 py-10 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(255,193,7,0.07)_0%,_transparent_60%)]" />
        <div className="absolute top-0 right-0 w-72 h-72 bg-gold-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="container mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-gold-primary transition-colors mb-6 text-sm font-medium">
            <ArrowLeft className="w-4 h-4" />
            {t('back_to_home')}
          </Link>
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gold-primary/20 to-red-900/10 border border-gold-primary/25 flex items-center justify-center shadow-lg shadow-gold-primary/10">
                <Gamepad2 className="w-7 h-7 text-gold-primary" />
              </div>
              <div>
                <h1 className="text-3xl md:text-4xl font-black text-foreground">{t('games')}</h1>
                <p className="text-muted-foreground text-sm mt-1">{t('browse_games_desc')}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm bg-card border border-border/60 px-4 py-2 rounded-full self-start sm:self-auto">
              <Package className="w-4 h-4 text-gold-primary" />
              <span className="font-semibold text-foreground">{filteredGames.length}</span>
              <span className="text-muted-foreground">{t('games_found')}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-6 pb-14">

        {/* Search + Filter Bar */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder={`${t('search')}...`}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-card border-border/60 focus:border-gold-primary/60 h-11 rounded-xl"
            />
          </div>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger className="w-full sm:w-[200px] bg-card border-border/60 h-11 rounded-xl">
              <SlidersHorizontal className="w-4 h-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder={t('all_categories')} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('all_categories')}</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.slug}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {filteredGames.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {filteredGames.map((game, index) => {
              const isOutOfStock = Number(game.stock) <= 0;

              return (
                <motion.div
                  key={game.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: Math.min(index * 0.03, 0.4) }}
                >
                  <Link href={`/game/${game.slug}`} className="group block h-full">
                    <div className="relative flex flex-col rounded-2xl overflow-hidden border border-border/50 bg-card hover:border-gold-primary/40 transition-all duration-300 shadow-sm hover:shadow-xl hover:shadow-gold-primary/8 hover:-translate-y-1 h-full shimmer-card">

                      {/* Image area */}
                      <div className="relative aspect-square overflow-hidden bg-gray-900 flex items-center justify-center">
                        <ImageWithFallback
                          src={getGameImage(game)}
                          alt={game.name}
                          className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                        />

                        {/* Gradient overlay bottom */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                        {/* Badges */}
                        {game.isPopular && !isOutOfStock && (
                          <div className="absolute top-2 left-2 flex items-center gap-1 bg-gradient-to-r from-red-600 to-red-500 text-white px-2 py-0.5 rounded-full text-[10px] font-bold shadow-lg z-10">
                            <Flame className="w-2.5 h-2.5" />
                            HOT
                          </div>
                        )}
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-background/75 flex items-center justify-center z-20 backdrop-blur-sm">
                            <span className="text-destructive font-bold px-3 py-1 bg-destructive/10 border border-destructive/30 rounded-full text-xs">
                              {t('out_of_stock')}
                            </span>
                          </div>
                        )}

                        {/* Hover CTA overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300 z-20">
                          <div className="flex items-center justify-center gap-1.5 bg-gold-primary text-background font-bold text-xs py-2 rounded-xl shadow-lg">
                            View Packages
                            <ChevronRight className="w-3.5 h-3.5" />
                          </div>
                        </div>
                      </div>

                      {/* Info */}
                      <div className="p-3 flex flex-col flex-1">
                        <h3 className="text-sm font-bold text-foreground group-hover:text-gold-primary transition-colors line-clamp-2 leading-snug" title={game.name}>
                          {game.name}
                        </h3>
                        <div className="mt-2 flex items-center gap-1 text-muted-foreground">
                          <Package className="w-3 h-3" />
                          <span className="text-[11px]">Multiple packages</span>
                        </div>
                      </div>

                    </div>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-24">
            <div className="w-20 h-20 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-5">
              <Search className="w-9 h-9 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">{t('no_games_found')}</h3>
            <p className="text-muted-foreground mb-6 text-sm">{t('try_adjust_search')}</p>
            <button
              onClick={() => { setSearchTerm(""); setSelectedCategory("all"); }}
              className="inline-flex items-center gap-2 bg-gold-primary hover:bg-gold-primary/90 text-background font-bold px-5 py-2.5 rounded-xl transition-colors text-sm"
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
