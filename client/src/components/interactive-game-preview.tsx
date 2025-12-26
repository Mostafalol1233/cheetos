import { useState } from 'react';
import { Game } from '@shared/schema';
import { Play, Star, ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/lib/cart-context';
import ImageWithFallback from '@/components/image-with-fallback';
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "@/lib/translation";

interface InteractiveGamePreviewProps {
  game: Game;
  onGameSelect?: (game: Game) => void;
}

export function InteractiveGamePreview({ game, onGameSelect }: InteractiveGamePreviewProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();
  const isOutOfStock = Number(game.stock) <= 0;

  const handlePlayPreview = () => {
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 3000);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (isOutOfStock) {
      toast({ title: t('out_of_stock'), description: t('item_unavailable'), duration: 2500 });
      return;
    }

    addToCart({
      id: game.id,
      name: game.name,
      price: parseFloat(game.price.toString()),
      image: game.image
    });

    toast({ title: t('success'), description: `${game.name} ${t('added_to_cart')}`, duration: 2000 });
  };

  return (
    <div
      className={`relative group cursor-pointer transform transition-all duration-500 ${
        isHovered ? 'scale-105 z-10' : 'hover:scale-102'
      }`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onGameSelect?.(game)}
    >
      {/* Animated Border */}
      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r from-gold-primary via-neon-pink to-gold-primary transition-opacity duration-300 ${
        isHovered ? 'opacity-100 animate-pulse' : 'opacity-0'
      }`} style={{ padding: '2px' }}>
        <div className="w-full h-full bg-card rounded-2xl"></div>
      </div>

      <div className="relative bg-card rounded-2xl overflow-hidden shadow-lg">
        {/* Game Image with Overlay */}
        <div className="relative aspect-video overflow-hidden">
          <ImageWithFallback
            src={game.image}
            alt={game.name}
            className={`w-full h-full object-contain transition-transform duration-700 ${
              isHovered ? 'scale-110' : 'scale-100'
            }`}
          />
          
          {/* Hover Overlay with Animation */}
          <div className={`absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent transition-opacity duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}>
            {/* Floating Particles */}
            {isHovered && (
              <div className="absolute inset-0">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-2 h-2 bg-gold-primary rounded-full animate-bounce"
                    style={{
                      left: `${20 + i * 15}%`,
                      top: `${30 + (i % 3) * 20}%`,
                      animationDelay: `${i * 0.2}s`,
                      animationDuration: '2s'
                    }}
                  />
                ))}
              </div>
            )}



            {/* Quick Actions */}
            <div className={`absolute top-4 right-4 flex gap-2 transform transition-all duration-300 ${
              isHovered ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
            }`}>
              <Button
                size="sm"
                onClick={handleAddToCart}
                disabled={isOutOfStock}
                className="bg-neon-pink/90 hover:bg-neon-pink disabled:bg-gray-500 disabled:hover:bg-gray-500 text-white rounded-full p-2"
              >
                <ShoppingCart className="w-4 h-4" />
              </Button>
              {game.isPopular && (
                <div className="bg-gold-primary text-black rounded-full px-3 py-1 text-xs font-bold flex items-center gap-1">
                  <Star className="w-3 h-3" />
                  {t('hot')}
                </div>
              )}
            </div>
          </div>

          {/* Playing Animation Overlay */}
          {isPlaying && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
              <div className="text-white text-center">
                <div className="animate-spin w-8 h-8 border-4 border-gold-primary border-t-transparent rounded-full mx-auto mb-2"></div>
                <p className="text-sm">{t('loading_preview')}</p>
              </div>
            </div>
          )}
        </div>

        {/* Game Info */}
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-lg text-gold-primary truncate">{game.name}</h3>
            <span className="text-neon-pink font-bold">{game.price} {(game as any).currency || t('egp')}</span>
          </div>
          
          <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
            {game.description}
          </p>

          {/* Interactive Stats */}
          <div className={`flex items-center gap-4 text-xs transition-all duration-300 ${
            isHovered ? 'transform translate-y-0 opacity-100' : 'transform translate-y-2 opacity-70'
          }`}>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span>{t('stock_label')}: {game.stock}</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-3 h-3 text-yellow-500" />
              <span>4.8</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{t('fast_delivery')}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar Animation */}
        {isHovered && (
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gray-700">
            <div className="h-full bg-gradient-to-r from-gold-primary to-neon-pink animate-pulse"></div>
          </div>
        )}
      </div>
    </div>
  );
}
