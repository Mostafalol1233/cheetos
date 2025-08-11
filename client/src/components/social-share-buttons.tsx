import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Share2, MessageCircle, Send, Facebook, Twitter } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useUserTracking } from '@/hooks/useUserTracking';
import { Game } from '@shared/schema';

interface SocialShareButtonsProps {
  game: Game;
  className?: string;
}

export function SocialShareButtons({ game, className = "" }: SocialShareButtonsProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);
  const { trackSocialShare } = useUserTracking();

  const shareText = `Check out ${game.name} - ${game.description} starting from ${game.price} EGP! 🎮`;
  const shareUrl = `${window.location.origin}/game/${game.slug}`;

  const shareOptions = [
    {
      platform: 'whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      color: 'bg-green-600 hover:bg-green-700',
      url: `https://wa.me/?text=${encodeURIComponent(shareText + ' ' + shareUrl)}`
    },
    {
      platform: 'telegram',
      label: 'Telegram',
      icon: Send,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareText)}`
    },
    {
      platform: 'facebook',
      label: 'Facebook',
      icon: Facebook,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`
    },
    {
      platform: 'twitter',
      label: 'Twitter',
      icon: Twitter,
      color: 'bg-black hover:bg-gray-800',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`
    }
  ];

  const handleShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    trackSocialShare(game.id, platform);
    setSharedPlatforms(prev => [...prev, platform]);
    
    // Close after sharing
    setTimeout(() => setIsOpen(false), 500);
  };

  return (
    <div className={`relative ${className}`}>
      <Button
        onClick={() => setIsOpen(!isOpen)}
        size="sm"
        variant="outline"
        className="border-gold-primary/30 text-gold-primary hover:bg-gold-primary hover:text-background transition-all"
      >
        <Share2 className="w-4 h-4 mr-2" />
        Share
      </Button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -10 }}
            className="absolute bottom-full mb-2 left-0 bg-card-bg border border-gold-primary/20 rounded-xl p-3 shadow-xl z-20 min-w-48"
          >
            <div className="text-sm font-medium text-foreground mb-3">Share this game</div>
            <div className="grid grid-cols-2 gap-2">
              {shareOptions.map(({ platform, label, icon: Icon, color, url }) => (
                <motion.button
                  key={platform}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleShare(platform, url)}
                  className={`${color} text-white p-2 rounded-lg flex items-center gap-2 text-sm transition-all relative overflow-hidden group`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                  
                  {sharedPlatforms.includes(platform) && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute top-0 right-0 w-2 h-2 bg-green-400 rounded-full"
                    />
                  )}

                  <div className="absolute inset-0 bg-white/20 translate-x-full group-hover:translate-x-0 transition-transform duration-300" />
                </motion.button>
              ))}
            </div>
            
            {sharedPlatforms.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-green-400 text-center"
              >
                🎉 Thanks for sharing! Achievement progress updated
              </motion.div>
            )}

            {/* Arrow pointing down */}
            <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-card-bg" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}