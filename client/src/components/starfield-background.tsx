import { useEffect, useRef } from "react";

export function StarfieldBackground() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    const starCount = 150; // Always show stars

    // Clear existing stars
    container.innerHTML = "";

    // Create stars
    for (let i = 0; i < starCount; i++) {
      const star = document.createElement("div");
      star.className = "star star-night";
      
      // Random position
      star.style.left = Math.random() * 100 + "%";
      star.style.top = Math.random() * 100 + "%";
      
      // Random size (1-4px)
      const size = Math.random() * 3 + 1;
      star.style.width = size + "px";
      star.style.height = size + "px";
      
      // Random animation delay
      star.style.animationDelay = Math.random() * 3 + "s";
      
      // Random colors for stars
      const colors = ['#ffffff', '#ffd700', '#ff69b4', '#00bfff', '#90EE90'];
      star.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
      
      container.appendChild(star);
    }

    // Add mouse interaction
    {
      const handleMouseMove = (e: MouseEvent) => {
        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Create temporary glow effect
        const glow = document.createElement("div");
        glow.className = "star-glow";
        glow.style.left = x + "px";
        glow.style.top = y + "px";
        container.appendChild(glow);
        
        setTimeout(() => {
          if (container.contains(glow)) {
            container.removeChild(glow);
          }
        }, 1000);
      };

      container.addEventListener('mousemove', handleMouseMove);
      
      return () => {
        container.removeEventListener('mousemove', handleMouseMove);
        container.innerHTML = "";
      };
    }

    return () => {
      container.innerHTML = "";
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="starfield fixed inset-0 w-full h-full pointer-events-none"
      style={{ zIndex: -1 }}
    />
  );
}
