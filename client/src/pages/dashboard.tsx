import { motion } from 'framer-motion';
import { useUserSession } from '@/hooks/useUserSession';
import { GameRecommendations } from '@/components/game-recommendations';
import { AchievementsDashboard } from '@/components/achievements-dashboard';
import { User, TrendingUp, Award, Target } from 'lucide-react';

export default function Dashboard() {
  const sessionId = useUserSession();

  if (!sessionId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gold-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your personalized dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-background via-purple-900/10 to-blue-900/10 py-16">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmYmJmMjQiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-30"></div>
        
        <div className="relative container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <div className="flex items-center justify-center mb-4">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="w-16 h-16 bg-gradient-to-br from-gold-primary to-neon-pink rounded-2xl flex items-center justify-center mr-4"
              >
                <User className="w-8 h-8 text-white" />
              </motion.div>
              <div className="text-left">
                <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
                  Your Gaming Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Personalized recommendations and achievements tracking
                </p>
              </div>
            </div>

            {/* Dashboard Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12 max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 }}
                className="bg-card-bg p-6 rounded-2xl border border-gold-primary/20"
              >
                <TrendingUp className="w-10 h-10 text-blue-400 mb-3 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Smart Recommendations</h3>
                <p className="text-sm text-muted-foreground">
                  AI-powered game suggestions based on your preferences
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2 }}
                className="bg-card-bg p-6 rounded-2xl border border-gold-primary/20"
              >
                <Award className="w-10 h-10 text-gold-primary mb-3 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Achievement System</h3>
                <p className="text-sm text-muted-foreground">
                  Track your gaming milestones and earn rewards
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-card-bg p-6 rounded-2xl border border-gold-primary/20"
              >
                <Target className="w-10 h-10 text-green-400 mb-3 mx-auto" />
                <h3 className="text-lg font-semibold text-foreground mb-2">Personalized Experience</h3>
                <p className="text-sm text-muted-foreground">
                  Your gaming behavior shapes your unique experience
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Recommendations Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <GameRecommendations />
      </motion.section>

      {/* Achievements Section */}
      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="container mx-auto px-4 py-8"
      >
        <AchievementsDashboard />
      </motion.section>

      {/* Tips Section */}
      <section className="container mx-auto px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-gradient-to-br from-purple-900/20 to-blue-900/20 p-8 rounded-2xl border border-gold-primary/20"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">
            Tips to Unlock More Features
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <TrendingUp className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Explore More Games</h3>
              <p className="text-sm text-muted-foreground">
                Browse different game categories to improve your recommendations
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                <Award className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">Share Your Discoveries</h3>
              <p className="text-sm text-muted-foreground">
                Share games with friends to unlock social achievements
              </p>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  );
}