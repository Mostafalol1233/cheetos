import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Gamepad2, Sparkles } from "lucide-react";
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
    <div className="relative w-full overflow-hidden rounded-2xl h-[220px] md:h-[360px] lg:h-[460px] bg-gradient-to-br from-background via-card to-background border border-border/30 shadow-2xl group">

      {/* Ambient glow layers */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-10%] right-[5%] w-96 h-96 bg-gold-primary/6 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[5%] w-72 h-72 bg-gold-primary/5 rounded-full blur-[80px]" />
      </div>

      {slides.length === 0 ? (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="text-center space-y-4 opacity-40">
            <div className="w-20 h-20 rounded-2xl bg-gold-primary/10 border border-gold-primary/20 flex items-center justify-center mx-auto">
              <Gamepad2 className="w-10 h-10 text-gold-primary" />
            </div>
            <p className="text-gold-primary/60 text-sm font-bold uppercase tracking-[0.3em]">Diaa Gaming Store</p>
          </div>
        </div>
      ) : (
        <div className="h-full w-full" ref={emblaRef}>
          <div className="flex h-full touch-pan-y">
            {slides.map((slide) => (
              <div className="relative flex-[0_0_100%] min-w-0 h-full" key={slide.id}>

                <img
                  src={slide.image_url}
                  alt={slide.heading_text}
                  className="absolute inset-0 w-full h-full object-cover z-10"
                />

                {/* Gradient fade - bottom heavy for readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent z-20" />
                <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent z-20" />

                {/* Content */}
                <div className="absolute bottom-0 left-0 w-full p-5 md:p-8 z-30">
                  <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.4 }}
                    className="max-w-sm md:max-w-lg"
                  >
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold-primary/20 text-gold-primary text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-3 border border-gold-primary/30 backdrop-blur-sm">
                      <Sparkles className="w-3 h-3" />
                      Premium Gaming
                    </span>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-black text-white mb-4 tracking-tight leading-tight drop-shadow-lg">
                      {slide.heading_text}
                    </h2>

                    <Link href={slide.button_url}>
                      <Button
                        size="sm"
                        className="rounded-xl px-5 py-2 h-9 md:h-10 md:px-6 font-bold text-sm bg-gold-primary text-background hover:bg-gold-primary/90 group shadow-lg shadow-gold-primary/20 hover:scale-105 transition-all duration-200"
                      >
                        {slide.button_text}
                        <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
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
