import { useQuery } from '@tanstack/react-query';
import { useUserSession } from '@/hooks/useUserSession';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Star, Eye, ShoppingBag, Share2, Users, Target, Award } from 'lucide-react';

interface UserAchievementDetails {
  id: string;
  userId: string;
  achievementId: string;
  progress: number;
  completed: boolean;
  completedAt: Date | null;
  achievement: {
    id: string;
    name: string;
    description: string;
    icon: string;
    category: string;
    threshold: number;
    points: number;
  };
}

export function AchievementsDashboard() {
  const sessionId = useUserSession();

  const { data: userAchievements = [], isLoading } = useQuery({
    queryKey: ['/api/user/achievements', sessionId],
    enabled: !!sessionId,
    queryFn: () => fetch(`/api/user/${sessionId}/achievements`).then(res => res.json()) as Promise<UserAchievementDetails[]>
  });

  const getIconComponent = (iconName: string) => {
    const iconMap: Record<string, any> = {
      'eye': Eye,
      'binoculars': Target,
      'shopping-cart': ShoppingBag,
      'shopping-bag': ShoppingBag,
      'share-2': Share2,
      'users': Users,
    };
    return iconMap[iconName] || Trophy;
  };

  const getCategoryColor = (category: string) => {
    const colorMap: Record<string, string> = {
      'explorer': 'from-blue-500 to-cyan-500',
      'collector': 'from-green-500 to-emerald-500',
      'social': 'from-purple-500 to-pink-500',
      'spender': 'from-yellow-500 to-orange-500',
    };
    return colorMap[category] || 'from-gray-500 to-gray-600';
  };

  const totalPoints = userAchievements
    .filter(ua => ua.completed)
    .reduce((sum, ua) => sum + ua.achievement.points, 0);

  const completedCount = userAchievements.filter(ua => ua.completed).length;

  if (isLoading) {
    return (
      <div className="bg-card-bg rounded-2xl p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-muted rounded w-48 mb-4"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Trophy className="w-7 h-7 text-gold-primary" />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-1 border-2 border-gold-primary/30 rounded-full"
            />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Achievements</h2>
            <p className="text-sm text-muted-foreground">Track your gaming milestones</p>
          </div>
        </div>

        <div className="text-right">
          <div className="text-2xl font-bold text-gold-primary">{totalPoints}</div>
          <div className="text-sm text-muted-foreground">Total Points</div>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-background/50 rounded-xl">
        <div className="text-center">
          <div className="text-lg font-bold text-green-400">{completedCount}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-blue-400">
            {userAchievements.length - completedCount}
          </div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gold-primary">{userAchievements.length}</div>
          <div className="text-xs text-muted-foreground">Total</div>
        </div>
      </div>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <AnimatePresence>
          {userAchievements.map((userAchievement, index) => {
            const IconComponent = getIconComponent(userAchievement.achievement.icon);
            const progressPercentage = (userAchievement.progress / userAchievement.achievement.threshold) * 100;
            const categoryColor = getCategoryColor(userAchievement.achievement.category);

            return (
              <motion.div
                key={userAchievement.achievement.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.1 }}
                className={`relative p-4 rounded-xl border-2 transition-all duration-300 ${
                  userAchievement.completed
                    ? 'border-gold-primary/50 bg-gradient-to-br from-gold-primary/10 to-transparent'
                    : 'border-muted hover:border-gold-primary/30 bg-background/30'
                }`}
              >
                {/* Completion Badge */}
                {userAchievement.completed && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-br from-gold-primary to-yellow-500 rounded-full flex items-center justify-center"
                  >
                    <Award className="w-3 h-3 text-white" />
                  </motion.div>
                )}

                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${categoryColor} flex items-center justify-center mb-3`}>
                  <IconComponent className="w-6 h-6 text-white" />
                </div>

                {/* Achievement Info */}
                <h3 className="font-semibold text-foreground mb-1">
                  {userAchievement.achievement.name}
                </h3>
                <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                  {userAchievement.achievement.description}
                </p>

                {/* Progress */}
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      Progress: {userAchievement.progress}/{userAchievement.achievement.threshold}
                    </span>
                    <span className={`font-medium ${userAchievement.completed ? 'text-green-400' : 'text-gold-primary'}`}>
                      {userAchievement.completed ? 'Complete!' : `${Math.round(progressPercentage)}%`}
                    </span>
                  </div>
                  
                  <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(progressPercentage, 100)}%` }}
                      transition={{ duration: 1, delay: index * 0.1 }}
                      className={`h-full rounded-full bg-gradient-to-r ${
                        userAchievement.completed 
                          ? 'from-green-400 to-emerald-500' 
                          : 'from-gold-primary to-neon-pink'
                      }`}
                    />
                  </div>
                </div>

                {/* Points */}
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-muted-foreground capitalize">
                    {userAchievement.achievement.category}
                  </span>
                  <span className="text-sm font-bold text-gold-primary">
                    {userAchievement.achievement.points} pts
                  </span>
                </div>

                {/* Completion Date */}
                {userAchievement.completed && userAchievement.completedAt && (
                  <div className="mt-2 text-xs text-green-400">
                    Completed: {new Date(userAchievement.completedAt).toLocaleDateString()}
                  </div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {userAchievements.length === 0 && (
        <div className="text-center py-8">
          <Trophy className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Achievements Yet</h3>
          <p className="text-muted-foreground">Start exploring games to unlock achievements!</p>
        </div>
      )}
    </div>
  );
}