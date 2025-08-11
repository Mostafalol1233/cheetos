import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingMiniGameProps {
  isLoading: boolean;
  loadingText?: string;
}

export function LoadingMiniGame({ isLoading, loadingText = "Loading your gaming experience..." }: LoadingMiniGameProps) {
  const [score, setScore] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number }>>([]);
  const [gameActive, setGameActive] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setGameActive(true);
      setScore(0);
    } else {
      setGameActive(false);
    }
  }, [isLoading]);

  useEffect(() => {
    if (!gameActive) return;

    const interval = setInterval(() => {
      const newParticle = {
        id: Date.now(),
        x: Math.random() * 400,
        y: Math.random() * 400
      };
      setParticles(prev => [...prev, newParticle]);

      // Remove old particles
      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== newParticle.id));
      }, 2000);
    }, 300);

    return () => clearInterval(interval);
  }, [gameActive]);

  const handleParticleClick = (particleId: number) => {
    setParticles(prev => prev.filter(p => p.id !== particleId));
    setScore(prev => prev + 10);
  };

  if (!isLoading) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center"
      >
        <div className="relative">
          <div className="text-center mb-8">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-gold-primary border-t-transparent rounded-full mx-auto mb-4"
            />
            <h2 className="text-2xl font-bold text-white mb-2">{loadingText}</h2>
            <p className="text-muted-foreground mb-4">Click the sparks to earn points while waiting!</p>
            <div className="text-lg font-semibold text-gold-primary">
              Score: {score}
            </div>
          </div>

          {/* Mini-game area */}
          <div className="relative w-96 h-96 border-2 border-gold-primary/30 rounded-xl overflow-hidden bg-gradient-to-br from-purple-900/20 to-blue-900/20">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                initial={{ scale: 0, opacity: 1 }}
                animate={{ scale: 1, opacity: 0.8 }}
                exit={{ scale: 0, opacity: 0 }}
                whileHover={{ scale: 1.2 }}
                style={{
                  position: 'absolute',
                  left: particle.x,
                  top: particle.y,
                }}
                className="w-6 h-6 bg-gradient-to-br from-gold-primary to-neon-pink rounded-full cursor-pointer shadow-lg"
                onClick={() => handleParticleClick(particle.id)}
              >
                <div className="absolute inset-0 rounded-full animate-ping bg-gold-primary/50" />
              </motion.div>
            ))}

            {/* Animated background elements */}
            <div className="absolute inset-0">
              {[...Array(5)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 bg-white/10 rounded-full"
                  animate={{
                    x: [0, 380],
                    y: [0, 380],
                  }}
                  transition={{
                    duration: 4 + i,
                    repeat: Infinity,
                    repeatType: "reverse",
                    delay: i * 0.5,
                  }}
                />
              ))}
            </div>
          </div>

          <div className="text-center mt-4 text-sm text-muted-foreground">
            {score > 50 && "🎮 Gaming reflexes detected!"}
            {score > 100 && "🔥 You're on fire!"}
            {score > 200 && "⭐ Achievement unlocked: Speed Demon!"}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}