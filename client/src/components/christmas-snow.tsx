import { useEffect, useRef } from 'react';

export function ChristmasSnow() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const setCanvasSize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    setCanvasSize();
    window.addEventListener('resize', setCanvasSize);

    const particles: Array<{
      x: number;
      y: number;
      radius: number;
      speed: number;
      opacity: number;
      sway: number;
      swaySpeed: number;
    }> = [];

    // Create snow particles
    for (let i = 0; i < 100; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 3 + 1,
        speed: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.3,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.02 + 0.01,
      });
    }

    // Create ice particles (smaller, faster)
    for (let i = 0; i < 50; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 1.5 + 0.5,
        speed: Math.random() * 3 + 1.5,
        opacity: Math.random() * 0.4 + 0.2,
        sway: Math.random() * Math.PI * 2,
        swaySpeed: Math.random() * 0.03 + 0.02,
      });
    }

    let animationId: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        // Update position
        particle.y += particle.speed;
        particle.sway += particle.swaySpeed;
        particle.x += Math.sin(particle.sway) * 0.5;

        // Reset if off screen
        if (particle.y > canvas.height) {
          particle.y = -particle.radius;
          particle.x = Math.random() * canvas.width;
        }
        if (particle.x < -particle.radius) {
          particle.x = canvas.width + particle.radius;
        }
        if (particle.x > canvas.width + particle.radius) {
          particle.x = -particle.radius;
        }

        // Draw particle
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255, 255, 255, ${particle.opacity})`;
        ctx.fill();
      });

      animationId = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', setCanvasSize);
      cancelAnimationFrame(animationId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-50"
      style={{ mixBlendMode: 'screen' }}
    />
  );
}

