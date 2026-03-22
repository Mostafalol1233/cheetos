import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rotation: number;
  rotationSpeed: number;
  color: string;
  width: number;
  height: number;
  opacity: number;
  shape: "rect" | "circle" | "star";
}

const COLORS = [
  "#D4AF37", "#FFD700", "#FF6B6B", "#4ECDC4",
  "#FFE66D", "#FF8E53", "#A8E6CF", "#FF77FF",
  "#77BBFF", "#C4FF77", "#FF9ECC", "#7BFFF8",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 3,
    vy: 2 + Math.random() * 4,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    width: 6 + Math.random() * 12,
    height: 4 + Math.random() * 8,
    opacity: 0.8 + Math.random() * 0.2,
    shape: (["rect", "rect", "circle", "star"] as const)[Math.floor(Math.random() * 4)],
  }));
}

function drawStar(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  const spikes = 5;
  const outerRadius = size;
  const innerRadius = size * 0.4;
  ctx.beginPath();
  for (let i = 0; i < spikes * 2; i++) {
    const radius = i % 2 === 0 ? outerRadius : innerRadius;
    const angle = (i * Math.PI) / spikes - Math.PI / 2;
    if (i === 0) ctx.moveTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
    else ctx.lineTo(x + radius * Math.cos(angle), y + radius * Math.sin(angle));
  }
  ctx.closePath();
}

interface ConfettiCelebrationProps {
  active: boolean;
  onComplete?: () => void;
  count?: number;
}

export function ConfettiCelebration({ active, onComplete, count = 160 }: ConfettiCelebrationProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    particlesRef.current = generateParticles(count);
    startTimeRef.current = Date.now();

    const animate = () => {
      if (!canvas || !ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      let allGone = true;

      particlesRef.current = particlesRef.current.map((p) => {
        const newP = {
          ...p,
          x: p.x + p.vx + Math.sin(elapsed * 2 + p.id) * 0.5,
          y: p.y + p.vy,
          rotation: p.rotation + p.rotationSpeed,
          vy: p.vy + 0.05,
          opacity: p.y > window.innerHeight * 0.7
            ? Math.max(0, p.opacity - 0.02)
            : p.opacity,
        };

        if (newP.y < window.innerHeight + 50 && newP.opacity > 0) {
          allGone = false;
          ctx.save();
          ctx.globalAlpha = newP.opacity;
          ctx.fillStyle = newP.color;
          ctx.translate(newP.x, newP.y);
          ctx.rotate((newP.rotation * Math.PI) / 180);

          if (newP.shape === "circle") {
            ctx.beginPath();
            ctx.arc(0, 0, newP.width / 2, 0, Math.PI * 2);
            ctx.fill();
          } else if (newP.shape === "star") {
            drawStar(ctx, 0, 0, newP.width / 2);
            ctx.fill();
          } else {
            ctx.fillRect(-newP.width / 2, -newP.height / 2, newP.width, newP.height);
          }
          ctx.restore();
        }
        return newP;
      });

      if (allGone || elapsed > 6) {
        onComplete?.();
        return;
      }
      animFrameRef.current = requestAnimationFrame(animate);
    };

    animFrameRef.current = requestAnimationFrame(animate);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    return () => {
      cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener("resize", handleResize);
    };
  }, [active, count, onComplete]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-[200]"
      style={{ width: "100vw", height: "100vh" }}
    />
  );
}

export function WelcomeConfetti() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("welcome-confetti-shown");
    if (!seen) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem("welcome-confetti-shown", "true");
      }, 600);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <ConfettiCelebration
        active={show}
        count={180}
        onComplete={() => setShow(false)}
      />
      <AnimatePresence>
        {show && (
          <motion.div
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[201] pointer-events-none"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.3 }}
            transition={{ duration: 0.5, ease: "backOut" }}
          >
            <div className="bg-black/80 backdrop-blur-sm border border-gold-primary/60 rounded-3xl px-10 py-6 text-center shadow-2xl shadow-gold-primary/30">
              <motion.p
                className="text-5xl mb-3"
                animate={{ rotate: [0, -15, 15, -10, 10, 0], scale: [1, 1.3, 1] }}
                transition={{ duration: 0.8, repeat: 2, repeatDelay: 0.5 }}
              >
                🎮
              </motion.p>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-gold-primary to-yellow-300 bg-clip-text text-transparent">
                مرحباً بك في متجر ضياء!
              </h2>
              <p className="text-sm text-gray-300 mt-1">أفضل متجر ألعاب في مصر 🔥</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
