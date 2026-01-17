import { useState } from 'react';
import { Game } from '@shared/schema';
import { Share2, Facebook, Twitter, MessageCircle, Send, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';

interface SocialSharingProps {
  game: Game;
}

export function SocialSharing({ game }: SocialSharingProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [sharedPlatforms, setSharedPlatforms] = useState<string[]>([]);

  const gameUrl = `${window.location.origin}/game/${game.slug}`;
  const shareText = `Check out ${game.name} - ${game.description} from Diaa Eldeen`;
  const hashtags = '#Gaming #DiaElDeen #GameDeals';

  const socialPlatforms = [
    {
      name: 'Facebook',
      icon: <Facebook className="w-5 h-5" />,
      color: 'bg-blue-600 hover:bg-blue-700',
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(gameUrl)}&quote=${encodeURIComponent(shareText)}`,
      description: 'Share on Facebook'
    },
    {
      name: 'Twitter',
      icon: <Twitter className="w-5 h-5" />,
      color: 'bg-blue-400 hover:bg-blue-500',
      url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(gameUrl)}&hashtags=${encodeURIComponent(hashtags)}`,
      description: 'Tweet about this game'
    },
    {
      name: 'WhatsApp',
      icon: <MessageCircle className="w-5 h-5" />,
      color: 'bg-green-600 hover:bg-green-700',
      url: `https://wa.me/?text=${encodeURIComponent(`${shareText} ${gameUrl}`)}`,
      description: 'Share via WhatsApp'
    },
    {
      name: 'Telegram',
      icon: <Send className="w-5 h-5" />,
      color: 'bg-blue-500 hover:bg-blue-600',
      url: `https://t.me/share/url?url=${encodeURIComponent(gameUrl)}&text=${encodeURIComponent(shareText)}`,
      description: 'Share on Telegram'
    }
  ];

  const handleShare = (platform: string, url: string) => {
    window.open(url, '_blank', 'width=600,height=400');
    
    // Add platform to shared list with animation
    if (!sharedPlatforms.includes(platform)) {
      setSharedPlatforms(prev => [...prev, platform]);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(gameUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = gameUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Share2 className="w-4 h-4" />
          Share
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-gold-primary" />
            Share {game.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Game Preview */}
          <div className="flex items-center gap-4 p-4 bg-card rounded-xl border">
            <img
              src={game.image}
              alt={game.name}
              className="w-16 h-16 rounded-lg object-cover"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-gold-primary truncate">{game.name}</h3>
              <p className="text-sm text-muted-foreground line-clamp-2">
                {game.description}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-neon-pink font-bold">{game.price} EGP</span>
                <span className="text-xs text-muted-foreground">• EGP</span>
              </div>
            </div>
          </div>

          {/* Social Platforms */}
          <div className="space-y-3">
            <h4 className="font-medium text-sm">Share on social media</h4>
            <div className="grid grid-cols-2 gap-3">
              {socialPlatforms.map((platform) => (
                <button
                  key={platform.name}
                  onClick={() => handleShare(platform.name, platform.url)}
                  className={`${platform.color} text-white rounded-xl p-4 flex items-center gap-3 transition-all duration-200 hover:scale-105 group relative overflow-hidden`}
                >
                  {/* Background Animation */}
                  <div className="absolute inset-0 bg-white/10 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></div>
                  
                  <div className="relative flex items-center gap-3 w-full">
                    {platform.icon}
                    <div className="text-left flex-1">
                      <div className="font-semibold text-sm">{platform.name}</div>
                      <div className="text-xs opacity-90">{platform.description}</div>
                    </div>
                    
                    {/* Success Animation */}
                    {sharedPlatforms.includes(platform.name) && (
                      <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                        <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center animate-bounce">
                          <Check className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Copy Link */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Or copy link</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={gameUrl}
                readOnly
                className="flex-1 px-3 py-2 text-sm bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-gold-primary/50"
              />
              <Button
                onClick={handleCopyLink}
                variant="outline"
                size="sm"
                className={`transition-all duration-200 ${
                  copiedLink ? 'bg-green-500 text-white border-green-500' : ''
                }`}
              >
                {copiedLink ? (
                  <>
                    <Check className="w-4 h-4 mr-1" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-1" />
                    Copy
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Share Stats */}
          {sharedPlatforms.length > 0 && (
            <div className="text-center p-3 bg-gold-primary/10 rounded-lg">
              <p className="text-sm text-gold-primary">
                🎉 Shared on {sharedPlatforms.length} platform{sharedPlatforms.length > 1 ? 's' : ''}!
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Help others discover great games
              </p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
