import { useQuery } from '@tanstack/react-query';
import { Game } from '@shared/schema';
import { InteractiveGamePreview } from './interactive-game-preview';
import { Shuffle } from 'lucide-react';
import { useState, useEffect } from 'react';

export function GameRecommendationEngine() {
  const [randomGames, setRandomGames] = useState<Game[]>([]);

  const { data: games, isLoading } = useQuery({
    queryKey: ['/api/games'],
    queryFn: () => fetch('/api/games').then(res => res.json()) as Promise<Game[]>
  });

  // Simple random game selection
  useEffect(() => {
    if (games && games.length > 0) {
      // Shuffle and take first 6 games
      const shuffled = [...games].sort(() => Math.random() - 0.5);
      setRandomGames(shuffled.slice(0, 6));
    }
  }, [games]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full flex items-center justify-center">
            <Shuffle className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gold-primary">Recommended Games</h2>
            <p className="text-muted-foreground">Loading games...</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-card/30 rounded-xl h-64"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full flex items-center justify-center">
          <Shuffle className="w-4 h-4 text-white" />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-gold-primary">Recommended Games</h2>
          <p className="text-muted-foreground">Discover exciting games just for you</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {randomGames.map((game) => (
          <div key={game.id} className="relative">
            <InteractiveGamePreview 
              game={game} 
              onGameSelect={(selectedGame) => {
                window.location.href = `/game/${selectedGame.slug}`;
              }}
            />
          </div>
        ))}
      </div>
    </div>
  );
}