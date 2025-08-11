import { useQuery } from '@tanstack/react-query';
import { GameRecommendation } from '@shared/schema';
import { useUserSession } from '@/hooks/useUserSession';
import { useUserTracking } from '@/hooks/useUserTracking';
import { Button } from '@/components/ui/button';
import { Link } from 'wouter';
import { useCart } from '@/lib/cart-context';
import { motion } from 'framer-motion';
import { Sparkles, TrendingUp, Heart, Zap } from 'lucide-react';

export function GameRecommendations() {
  const sessionId = useUserSession();
  const { trackGameView, trackAddToCart } = useUserTracking();
  const { addToCart } = useCart();

  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ['/api/user/recommendations', sessionId],
    enabled: !!sessionId,
    queryFn: () => fetch(`/api/user/${sessionId}/recommendations`).then(res => res.json()) as Promise<GameRecommendation[]>
  });

  const handleGameView = (gameId: string) => {
    trackGameView(gameId, { source: 'recommendations' });
  };

  const handleAddToCart = (recommendation: GameRecommendation) => {
    addToCart({
      id: recommendation.game.id,
      name: recommendation.game.name,
      price: recommendation.game.price,
      image: recommendation.game.image
    });
    
    trackAddToCart(recommendation.game.id, { 
      source: 'recommendations',
      reason: recommendation.reason,
      score: recommendation.score
    });
  };

  const getReasonIcon = (reason: string) => {
    if (reason.includes('Popular')) return <TrendingUp className="w-4 h-4" />;
    if (reason.includes('Similar')) return <Heart className="w-4 h-4" />;
    if (reason.includes('interests')) return <Zap className="w-4 h-4" />;
    return <Sparkles className="w-4 h-4" />;
  };

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <motion.div 
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-6 h-6 bg-gold-primary rounded-full opacity-80"
          />
          <h2 className="text-xl font-bold text-foreground">Getting personalized recommendations...</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card-bg rounded-xl animate-pulse">
              <div className="w-full h-32 bg-muted rounded-t-xl"></div>
              <div className="p-3 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (recommendations.length === 0) {
    return (
      <section className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gold-primary mx-auto mb-4 opacity-50" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Building Your Profile</h2>
          <p className="text-muted-foreground">
            Browse some games to get personalized recommendations!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex items-center gap-3 mb-6">
        <div className="relative">
          <Sparkles className="w-6 h-6 text-gold-primary" />
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute inset-0 w-6 h-6 bg-gold-primary rounded-full opacity-20"
          />
        </div>
        <h2 className="text-xl font-bold text-foreground">Recommended For You</h2>
        <div className="text-sm text-muted-foreground">
          Based on your gaming preferences
        </div>
      </div>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {recommendations.map((recommendation, index) => (
          <motion.div
            key={recommendation.game.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-card-bg rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 group relative"
          >
            {/* Recommendation badge */}
            <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-gold-primary to-neon-pink text-background px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
              {getReasonIcon(recommendation.reason)}
              {Math.round(recommendation.score * 100)}%
            </div>

            <Link href={`/game/${recommendation.game.slug}`} onClick={() => handleGameView(recommendation.game.id)}>
              <div className="relative overflow-hidden">
                <img
                  src={recommendation.game.image}
                  alt={recommendation.game.name}
                  className="w-full h-32 object-cover group-hover:scale-110 transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </Link>

            <div className="p-3">
              <h3 className="font-semibold text-sm mb-1 text-foreground line-clamp-1 group-hover:text-gold-primary transition-colors">
                {recommendation.game.name}
              </h3>
              
              <div className="flex items-center gap-1 mb-2 text-xs text-muted-foreground">
                {getReasonIcon(recommendation.reason)}
                <span className="line-clamp-1">{recommendation.reason}</span>
              </div>

              <div className="flex items-center justify-between mb-2">
                <span className="text-gold-primary font-bold text-sm">
                  من {recommendation.game.price} جنيه
                </span>
              </div>

              <Button
                onClick={() => handleAddToCart(recommendation)}
                size="sm"
                className="w-full text-xs bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-white"
              >
                Quick Add
              </Button>
            </div>

            {/* Animated border on hover */}
            <div className="absolute inset-0 border-2 border-transparent group-hover:border-gold-primary/30 rounded-xl transition-colors pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}