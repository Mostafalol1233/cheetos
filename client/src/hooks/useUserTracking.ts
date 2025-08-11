import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useUserSession } from './useUserSession';

export function useUserTracking() {
  const sessionId = useUserSession();

  const trackActionMutation = useMutation({
    mutationFn: async ({ gameId, action, metadata }: { gameId: string; action: string; metadata?: any }) => {
      return fetch('/api/user/track', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, gameId, action, metadata })
      }).then(res => res.json());
    }
  });

  const trackSocialShareMutation = useMutation({
    mutationFn: async ({ gameId, platform }: { gameId: string; platform: string }) => {
      return fetch('/api/user/share', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sessionId, gameId, platform })
      }).then(res => res.json());
    }
  });

  const trackGameView = (gameId: string, metadata?: any) => {
    if (sessionId) {
      trackActionMutation.mutate({ gameId, action: 'viewed', metadata });
    }
  };

  const trackAddToCart = (gameId: string, metadata?: any) => {
    if (sessionId) {
      trackActionMutation.mutate({ gameId, action: 'added_to_cart', metadata });
    }
  };

  const trackSocialShare = (gameId: string, platform: string) => {
    if (sessionId) {
      trackSocialShareMutation.mutate({ gameId, platform });
    }
  };

  return {
    sessionId,
    trackGameView,
    trackAddToCart,
    trackSocialShare
  };
}