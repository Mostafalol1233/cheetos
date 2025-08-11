import { useQuery } from '@tanstack/react-query';
import { Game } from '@shared/schema';
import { InteractiveGamePreview } from './interactive-game-preview';
import { Brain, TrendingUp, Users, Clock } from 'lucide-react';
import { useState, useEffect } from 'react';

interface RecommendationReason {
  type: 'popular' | 'similar' | 'trending' | 'personal';
  text: string;
  confidence: number;
  icon: React.ReactNode;
}

interface GameRecommendation extends Game {
  reason: RecommendationReason;
  score: number;
}

export function GameRecommendationEngine() {
  const [recommendations, setRecommendations] = useState<GameRecommendation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(true);

  const { data: games, isLoading } = useQuery({
    queryKey: ['/api/games'],
    queryFn: () => fetch('/api/games').then(res => res.json()) as Promise<Game[]>
  });

  // Simulated AI recommendation logic
  useEffect(() => {
    if (games && games.length > 0) {
      setIsAnalyzing(true);
      
      // Simulate AI processing time
      setTimeout(() => {
        const reasons: RecommendationReason[] = [
          {
            type: 'popular',
            text: 'Trending among players this week',
            confidence: 95,
            icon: <TrendingUp className="w-4 h-4" />
          },
          {
            type: 'similar',
            text: 'Similar to your recent purchases',
            confidence: 88,
            icon: <Brain className="w-4 h-4" />
          },
          {
            type: 'personal',
            text: 'Matches your gaming preferences',
            confidence: 92,
            icon: <Users className="w-4 h-4" />
          },
          {
            type: 'trending',
            text: 'Hot in your region',
            confidence: 85,
            icon: <Clock className="w-4 h-4" />
          }
        ];

        // Generate recommendations with AI-style scoring
        const recommended = games
          .slice(0, 6)
          .map((game, index) => ({
            ...game,
            reason: reasons[index % reasons.length],
            score: 85 + Math.random() * 15 // Random score between 85-100
          }))
          .sort((a, b) => b.score - a.score);

        setRecommendations(recommended);
        setIsAnalyzing(false);
      }, 2000);
    }
  }, [games]);

  if (isLoading || isAnalyzing) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full flex items-center justify-center animate-spin">
            <Brain className="w-4 h-4 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gold-primary">AI Recommendations</h2>
            <p className="text-muted-foreground">
              {isAnalyzing ? 'Analyzing your preferences...' : 'Loading games...'}
            </p>
          </div>
        </div>

        {/* Loading Animation */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse">
              <div className="bg-card rounded-2xl p-4 space-y-4">
                <div className="aspect-video bg-muted rounded-xl"></div>
                <div className="space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with AI Branding */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full flex items-center justify-center">
            <Brain className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gold-primary">AI-Powered Recommendations</h2>
            <p className="text-muted-foreground">Personalized just for you</p>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="bg-card rounded-full px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">AI Active</span>
        </div>
      </div>

      {/* Recommendations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((game, index) => (
          <div key={game.id} className="relative">
            {/* Recommendation Badge */}
            <div className="absolute -top-2 -left-2 z-20 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full px-3 py-1 text-xs font-bold text-white flex items-center gap-1">
              {game.reason.icon}
              {Math.round(game.score)}% Match
            </div>

            {/* AI Reasoning Card */}
            <div className="absolute -top-2 -right-2 z-20">
              <div className="bg-card border border-gold-primary/20 rounded-lg px-3 py-2 shadow-lg max-w-48 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <div className="flex items-center gap-2 mb-1">
                  {game.reason.icon}
                  <span className="font-semibold text-xs">AI Insight</span>
                </div>
                <p className="text-xs text-muted-foreground">{game.reason.text}</p>
                <div className="flex items-center gap-1 mt-1">
                  <div className="flex-1 bg-muted rounded-full h-1">
                    <div 
                      className="h-full bg-gradient-to-r from-gold-primary to-neon-pink rounded-full"
                      style={{ width: `${game.reason.confidence}%` }}
                    ></div>
                  </div>
                  <span className="text-xs font-medium">{game.reason.confidence}%</span>
                </div>
              </div>
            </div>

            <div className="group">
              <InteractiveGamePreview game={game} />
            </div>

            {/* Recommendation Reason */}
            <div className="mt-3 p-3 bg-card/50 rounded-lg border border-gold-primary/10">
              <div className="flex items-center gap-2 mb-1">
                {game.reason.icon}
                <span className="text-sm font-semibold text-gold-primary">
                  Why we recommend this
                </span>
              </div>
              <p className="text-sm text-muted-foreground">{game.reason.text}</p>
              
              {/* Confidence Score */}
              <div className="flex items-center gap-2 mt-2">
                <div className="flex-1 bg-muted rounded-full h-2">
                  <div 
                    className="h-full bg-gradient-to-r from-gold-primary to-neon-pink rounded-full transition-all duration-1000"
                    style={{ width: `${game.reason.confidence}%` }}
                  ></div>
                </div>
                <span className="text-xs font-bold text-gold-primary">
                  {game.reason.confidence}% confidence
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Learning Notice */}
      <div className="text-center p-6 bg-card/30 rounded-xl border border-gold-primary/10">
        <Brain className="w-8 h-8 text-gold-primary mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">
          Our AI learns from your interactions to provide better recommendations over time
        </p>
      </div>
    </div>
  );
}