import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { API_BASE_URL } from "@/lib/queryClient";

interface HeaderSlide {
  id: string;
  image_url: string;
  heading_text: string;
  button_text: string;
  button_url: string;
}

const defaultSlide: HeaderSlide = {
  id: "default",
  image_url: "https://files.catbox.moe/ciy961.webp",
  heading_text: "Level Up Your Game",
  button_text: "Explore Now",
  button_url: "/games"
};

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  // Fetch active header from API
  const { data: activeHeaders } = useQuery<HeaderSlide[]>({
    queryKey: ['/api/header-images/active'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/header-images/active`);
        if (!res.ok) return [defaultSlide];
        const data = await res.json();
        return Array.isArray(data) ? data : [data];
      } catch {
        return [defaultSlide];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = (activeHeaders && activeHeaders.length > 0) ? activeHeaders : [defaultSlide];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[260px] md:h-[400px] lg:h-[480px] bg-transparent border border-border/50 shadow-2xl group">

      {/* Carousel Viewport */}
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide) => (
            <div className="relative flex-[0_0_100%] min-w-0 h-full" key={slide.id}>

              {/* Main Image - Stretch coverage */}
              <img
                src={slide.image_url}
                alt={slide.heading_text}
                className="absolute inset-0 w-full h-full object-fill z-10"
              />

              {/* Gradient Overlay Removed per user request */}
              {/* <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent z-20" /> */}

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 z-30 flex flex-col items-start gap-2">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="p-2 max-w-sm md:max-w-md"
                >
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue text-[8px] sm:text-[9px] font-bold uppercase tracking-wider mb-1 border border-cyber-blue/30">
                    <Gamepad2 className="w-2.5 h-2.5" />
                    Premium Gaming
                  </span>
                  <h2 className="text-base sm:text-lg md:text-xl font-black text-white mb-1 tracking-tight leading-tight">
                    {slide.heading_text}
                  </h2>
                  <p className="text-gray-300 text-[10px] sm:text-xs max-w-xs mb-2 line-clamp-2">
                    Get the best deals on game currencies and gift cards.
                  </p>

                  <Link href={slide.button_url}>
                    <Button size="sm" className="rounded-md px-3 py-1 h-6 md:h-8 md:px-4 font-bold text-[10px] md:text-xs btn-gaming group shadow-glow-blue hover:scale-105 transition-all">
                      {slide.button_text}
                      <ArrowRight className="ml-1.5 w-3 h-3 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </div>
  );
}
