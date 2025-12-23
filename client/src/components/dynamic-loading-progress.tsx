import { useState, useEffect } from 'react';
import { Gamepad2, Zap, Trophy, Target, Star } from 'lucide-react';

interface DynamicLoadingProgressProps {
  isLoading: boolean;
  loadingText?: string;
  onComplete?: () => void;
}

export function DynamicLoadingProgress({ 
  isLoading, 
  loadingText = "Loading games...",
  onComplete 
}: DynamicLoadingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentPhase, setCurrentPhase] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);

  const loadingPhases = [
    { text: "Initializing gaming engine...", icon: <Gamepad2 className="w-6 h-6" />, color: "text-blue-500" },
    { text: "Loading game assets...", icon: <Zap className="w-6 h-6" />, color: "text-yellow-500" },
    { text: "Connecting to game servers...", icon: <Target className="w-6 h-6" />, color: "text-green-500" },
    { text: "Preparing your experience...", icon: <Trophy className="w-6 h-6" />, color: "text-purple-500" },
    { text: "Almost ready!", icon: <Star className="w-6 h-6" />, color: "text-gold-primary" }
  ];

  useEffect(() => {
    if (!isLoading) {
      setProgress(0);
      setCurrentPhase(0);
      setParticles([]);
      return;
    }

    // Generate random particles
    const newParticles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2
    }));
    setParticles(newParticles);

    let progressTimer: NodeJS.Timeout;
    let phaseTimer: NodeJS.Timeout;

    const updateProgress = () => {
      setProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 8 + 2, 100);
        
        // Update phase based on progress
        const newPhase = Math.floor((newProgress / 100) * loadingPhases.length);
        if (newPhase !== currentPhase && newPhase < loadingPhases.length) {
          setCurrentPhase(newPhase);
        }

        if (newProgress >= 100) {
          setTimeout(() => onComplete?.(), 500);
          return 100;
        }
        
        return newProgress;
      });
    };

    // Start progress animation
    progressTimer = setInterval(updateProgress, 200 + Math.random() * 300);

    return () => {
      clearInterval(progressTimer);
      clearTimeout(phaseTimer);
    };
  }, [isLoading, currentPhase, onComplete]);

  if (!isLoading) return null;

  const currentPhaseData = loadingPhases[currentPhase] || loadingPhases[0];

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="relative max-w-md w-full mx-4">
        {/* Animated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/10 via-neon-pink/10 to-blue-500/10 rounded-2xl blur-xl"></div>
        
        {/* Floating Particles */}
        {particles.map((particle) => (
          <div
            key={particle.id}
            className="absolute w-1 h-1 bg-gold-primary rounded-full animate-pulse"
            style={{
              left: `${particle.x}%`,
              top: `${particle.y}%`,
              animationDelay: `${particle.delay}s`,
              animationDuration: '3s'
            }}
          />
        ))}

        {/* Main Loading Card */}
        <div className="relative bg-card border border-gold-primary/20 rounded-2xl p-8 shadow-2xl">
          {/* Gaming-themed Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full flex items-center justify-center mx-auto mb-4 animate-spin">
              <Gamepad2 className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gold-primary mb-2">Diaa Eldeen</h2>
            <p className="text-muted-foreground">Loading your gaming experience</p>
          </div>

          {/* Current Phase */}
          <div className="flex items-center gap-3 mb-6">
            <div className={`${currentPhaseData.color} animate-bounce`}>
              {currentPhaseData.icon}
            </div>
            <div className="flex-1">
              <p className="font-medium">{currentPhaseData.text}</p>
              <p className="text-sm text-muted-foreground">{Math.round(progress)}% complete</p>
            </div>
          </div>

          {/* Animated Progress Bar */}
          <div className="space-y-4">
            <div className="relative">
              <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold-primary via-neon-pink to-gold-primary transition-all duration-300 ease-out relative"
                  style={{ width: `${progress}%` }}
                >
                  {/* Shimmer Effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse"></div>
                </div>
              </div>
              
              {/* Progress Milestones */}
              <div className="flex justify-between text-xs text-muted-foreground mt-2">
                {loadingPhases.map((_, index) => (
                  <span 
                    key={index}
                    className={`transition-colors duration-300 ${
                      index <= currentPhase ? 'text-gold-primary' : ''
                    }`}
                  >
                    {((index + 1) / loadingPhases.length * 100).toFixed(0)}%
                  </span>
                ))}
              </div>
            </div>

            {/* Gaming Tips */}
            <div className="bg-muted/50 rounded-lg p-4 border-l-4 border-gold-primary">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-gold-primary">Pro Tip:</span> 
                {" "}
                {currentPhase === 0 && "Check out our popular games section for the latest deals!"}
                {currentPhase === 1 && "Join our community for exclusive discounts and early access!"}
                {currentPhase === 2 && "Don't forget to add multiple games to your cart for bulk savings!"}
                {currentPhase === 3 && "Fast delivery guaranteed - your games will be ready instantly!"}
                {currentPhase === 4 && "Welcome to the ultimate gaming experience!"}
              </p>
            </div>
          </div>

          {/* Loading Dots Animation */}
          <div className="flex justify-center items-center mt-6 gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="w-2 h-2 bg-gold-primary rounded-full animate-bounce"
                style={{ animationDelay: `${i * 0.2}s` }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}