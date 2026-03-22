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

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

  const { data: activeHeaders } = useQuery<HeaderSlide[]>({
    queryKey: ['/api/header-images/active'],
    queryFn: async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/header-images/active`);
        if (!res.ok) return [];
        const data = await res.json();
        return Array.isArray(data) ? data : (data ? [data] : []);
      } catch {
        return [];
      }
    },
    staleTime: 5 * 60 * 1000,
  });

  const slides = (activeHeaders && activeHeaders.length > 0) ? activeHeaders : [];

  return (
    <div className="relative w-full overflow-hidden rounded-2xl h-[220px] md:h-[360px] lg:h-[440px] bg-gradient-to-br from-[#0a1220] via-[#101c30] to-[#080f1c] border border-white/5 shadow-2xl group">

      {/* Decorative glowing orbs — always visible as ambient lighting */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-15%] right-[5%] w-80 h-80 bg-cyan-500/8 rounded-full blur-[80px]" />
        <div className="absolute bottom-[-10%] left-[5%] w-64 h-64 bg-purple-500/8 rounded-full blur-[70px]" />
        <div className="absolute top-[20%] left-[35%] w-48 h-48 bg-blue-500/6 rounded-full blur-[60px]" />
      </div>

      {slides.length === 0 ? (
        /* Empty state — show branded gradient placeholder, no old default image */
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center opacity-30">
            <Gamepad2 className="w-16 h-16 text-cyan-400 mx-auto mb-3" />
            <p className="text-cyan-300/60 text-sm font-medium tracking-widest uppercase">Diaa Gaming Store</p>
          </div>
        </div>
      ) : (
        /* Carousel Viewport */
        <div className="h-full w-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {slides.map((slide) => (
              <div className="relative flex-[0_0_100%] min-w-0 h-full" key={slide.id}>

                {/* Full-bleed game banner image — no price, no overlaid UI clutter */}
                <img
                  src={slide.image_url}
                  alt={slide.heading_text}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />

                {/* Subtle bottom fade so text stays readable without hiding the art */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/5 to-transparent z-20" />

                {/* Content — title + CTA button only, no prices */}
                <div className="absolute bottom-0 left-0 w-full p-4 md:p-6 z-30">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="max-w-sm md:max-w-lg"
                  >
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-400/15 text-cyan-300 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mb-2 border border-cyan-400/25">
                      <Gamepad2 className="w-2.5 h-2.5" />
                      Premium Gaming
                    </span>
                    <h2 className="text-lg sm:text-xl md:text-2xl font-black text-white mb-3 tracking-tight leading-tight drop-shadow-lg">
                      {slide.heading_text}
                    </h2>

                    <Link href={slide.button_url}>
                      <Button
                        size="sm"
                        className="rounded-lg px-4 py-1.5 h-8 md:h-9 md:px-5 font-bold text-xs md:text-sm btn-gaming group shadow-[0_0_20px_rgba(100,255,218,0.25)] hover:scale-105 transition-all"
                      >
                        {slide.button_text}
                        <ArrowRight className="ml-1.5 w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </motion.div>
                </div>

              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
