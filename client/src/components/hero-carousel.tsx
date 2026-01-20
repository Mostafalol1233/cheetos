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
    <div className="relative w-full overflow-hidden rounded-2xl h-[260px] md:h-[400px] lg:h-[480px] bg-black border border-border/50 shadow-2xl group">

      {/* Carousel Viewport */}
      <div className="h-full w-full" ref={emblaRef}>
        <div className="flex h-full touch-pan-y">
          {slides.map((slide) => (
            <div className="relative flex-[0_0_100%] min-w-0 h-full" key={slide.id}>

              {/* Blurred Background for Fill Effect */}
              <div
                className="absolute inset-0 bg-cover bg-center blur-xl opacity-50"
                style={{ backgroundImage: `url(${slide.image_url})` }}
              />

              {/* Main Image - Object Contain to prevent cropping */}
              <img
                src={slide.image_url}
                alt={slide.heading_text}
                className="absolute inset-0 w-full h-full object-contain z-10"
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-30 flex flex-col items-start gap-3">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-black/40 backdrop-blur-sm p-4 rounded-xl border border-white/10 shadow-2xl max-w-2xl"
                >
                  <span className="inline-flex items-center gap-2 px-2 py-0.5 rounded-full bg-cyber-blue/20 text-cyber-blue text-[10px] md:text-xs font-bold uppercase tracking-wider mb-2 border border-cyber-blue/30">
                    <Gamepad2 className="w-3 h-3" />
                    Premium Gaming
                  </span>
                  <h2 className="text-xl sm:text-2xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight leading-tight">
                    {slide.heading_text}
                  </h2>
                  <p className="text-gray-200 text-xs md:text-lg max-w-lg mb-4 drop-shadow-md line-clamp-2">
                    Get the best deals on game currencies and gift cards.
                  </p>

                  <Link href={slide.button_url}>
                    <Button size="sm" className="rounded-lg px-4 py-2 h-9 md:h-11 md:px-8 font-bold text-xs md:text-base btn-gaming group shadow-glow-blue hover:scale-105 transition-all">
                      {slide.button_text}
                      <ArrowRight className="ml-2 w-3 h-3 md:w-5 md:h-5 group-hover:translate-x-1 transition-transform" />
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
