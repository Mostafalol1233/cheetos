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
  shape: "crescent" | "star" | "circle" | "diamond";
}

const EID_COLORS = [
  "#D4AF37", "#FFD700", "#C8A400",
  "#2ECC71", "#27AE60", "#1ABC9C",
  "#FFFFFF", "#F0E6C8", "#E8D5A3",
  "#FF9F43", "#FFC107",
];

function generateParticles(count: number): Particle[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    x: Math.random() * window.innerWidth,
    y: -20 - Math.random() * 200,
    vx: (Math.random() - 0.5) * 2.5,
    vy: 1.5 + Math.random() * 3,
    rotation: Math.random() * 360,
    rotationSpeed: (Math.random() - 0.5) * 5,
    color: EID_COLORS[Math.floor(Math.random() * EID_COLORS.length)],
    width: 8 + Math.random() * 14,
    height: 6 + Math.random() * 10,
    opacity: 0.8 + Math.random() * 0.2,
    shape: (["crescent", "crescent", "star", "star", "circle", "diamond"] as const)[
      Math.floor(Math.random() * 6)
    ],
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

function drawCrescent(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "destination-out";
  ctx.beginPath();
  ctx.arc(x + size * 0.45, y - size * 0.1, size * 0.75, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  ctx.globalCompositeOperation = "source-over";
}

function drawDiamond(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.moveTo(x, y - size);
  ctx.lineTo(x + size * 0.6, y);
  ctx.lineTo(x, y + size);
  ctx.lineTo(x - size * 0.6, y);
  ctx.closePath();
  ctx.fill();
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
          x: p.x + p.vx + Math.sin(elapsed * 1.5 + p.id * 0.3) * 0.7,
          y: p.y + p.vy,
          rotation: p.rotation + p.rotationSpeed,
          vy: p.vy + 0.04,
          opacity: p.y > window.innerHeight * 0.75
            ? Math.max(0, p.opacity - 0.018)
            : p.opacity,
        };

        if (newP.y < window.innerHeight + 50 && newP.opacity > 0) {
          allGone = false;
          ctx.save();
          ctx.globalAlpha = newP.opacity;
          ctx.fillStyle = newP.color;
          ctx.translate(newP.x, newP.y);
          ctx.rotate((newP.rotation * Math.PI) / 180);

          if (newP.shape === "star") {
            drawStar(ctx, 0, 0, newP.width / 2);
            ctx.fill();
          } else if (newP.shape === "crescent") {
            drawCrescent(ctx, 0, 0, newP.width / 2);
          } else if (newP.shape === "diamond") {
            drawDiamond(ctx, 0, 0, newP.width / 2);
          } else {
            ctx.beginPath();
            ctx.arc(0, 0, newP.width / 2.5, 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.restore();
        }
        return newP;
      });

      if (allGone || elapsed > 7) {
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

const floatingItems = [
  { emoji: "🌙", size: "text-5xl", x: "15%", delay: 0, duration: 3.5 },
  { emoji: "⭐", size: "text-3xl", x: "30%", delay: 0.3, duration: 2.8 },
  { emoji: "🏮", size: "text-4xl", x: "50%", delay: 0.6, duration: 3.2 },
  { emoji: "⭐", size: "text-2xl", x: "70%", delay: 0.2, duration: 2.5 },
  { emoji: "🌙", size: "text-3xl", x: "85%", delay: 0.8, duration: 3.8 },
  { emoji: "✨", size: "text-2xl", x: "22%", delay: 1.0, duration: 2.2 },
  { emoji: "🏮", size: "text-3xl", x: "75%", delay: 0.5, duration: 3.0 },
  { emoji: "⭐", size: "text-4xl", x: "60%", delay: 1.2, duration: 2.9 },
];

export function WelcomeConfetti() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("welcome-confetti-shown");
    if (!seen) {
      const timer = setTimeout(() => {
        setShow(true);
        sessionStorage.setItem("welcome-confetti-shown", "true");
      }, 400);
      return () => clearTimeout(timer);
    }
  }, []);

  return (
    <>
      <ConfettiCelebration
        active={show}
        count={200}
        onComplete={() => setShow(false)}
      />
      <AnimatePresence>
        {show && (
          <>
            {floatingItems.map((item, index) => (
              <motion.div
                key={index}
                className={`fixed pointer-events-none z-[201] select-none ${item.size}`}
                style={{ left: item.x, top: "-10%" }}
                initial={{ y: "-10vh", opacity: 0, scale: 0 }}
                animate={{
                  y: ["0vh", "30vh", "20vh", "50vh", "40vh", "80vh", "110vh"],
                  opacity: [0, 1, 1, 1, 1, 0.8, 0],
                  scale: [0, 1.2, 1, 1.1, 1, 0.9, 0.5],
                  rotate: [0, 15, -10, 20, -15, 10, 0],
                }}
                transition={{
                  duration: item.duration + 3,
                  delay: item.delay,
                  ease: "easeInOut",
                  times: [0, 0.1, 0.3, 0.5, 0.7, 0.85, 1],
                }}
                exit={{ opacity: 0, scale: 0 }}
              >
                {item.emoji}
              </motion.div>
            ))}

            <motion.div
              className="fixed top-16 left-1/2 -translate-x-1/2 z-[202] pointer-events-none flex gap-3 items-center"
              initial={{ opacity: 0, y: -30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.6, ease: "backOut" }}
            >
              {["🌙", "⭐", "🏮", "⭐", "🌙"].map((e, i) => (
                <motion.span
                  key={i}
                  className="text-3xl md:text-4xl"
                  animate={{
                    y: [0, -8, 0, -5, 0],
                    rotate: i % 2 === 0 ? [0, -10, 10, -5, 0] : [0, 10, -10, 5, 0],
                    scale: [1, 1.15, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 2,
                    repeat: 3,
                    delay: i * 0.15,
                    ease: "easeInOut",
                  }}
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>

            <motion.div
              className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[202] pointer-events-none flex gap-2 items-center"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3, ease: "backOut" }}
            >
              {["✨", "🌙", "🏮", "🌙", "✨"].map((e, i) => (
                <motion.span
                  key={i}
                  className="text-2xl md:text-3xl"
                  animate={{
                    y: [0, 6, 0, 4, 0],
                    rotate: [0, 8, -8, 4, 0],
                    scale: [1, 1.2, 1, 1.1, 1],
                  }}
                  transition={{
                    duration: 1.8,
                    repeat: 3,
                    delay: 0.5 + i * 0.12,
                    ease: "easeInOut",
                  }}
                >
                  {e}
                </motion.span>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
