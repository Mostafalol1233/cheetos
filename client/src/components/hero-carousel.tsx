import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { ArrowRight, Gamepad2 } from "lucide-react";
import { motion } from "framer-motion";

const slides = [
  {
    id: 1,
    image: "https://files.catbox.moe/ciy961.webp",
    title: "Level Up Your Game",
    description: "Get the best deals on game currencies and gift cards.",
    cta: "Explore Now",
    link: "/games"
  },
  {
    id: 2,
    image: "https://i.postimg.cc/zG8jHjqS/large-image-logo.png", // Using the logo image as placeholder/secondary slide for now, can be replaced
    title: "Instant Delivery",
    description: "Secure and fast delivery for all your favorite games.",
    cta: "Shop Now",
    link: "/games"
  }
];

export function HeroCarousel() {
  const [emblaRef] = useEmblaCarousel({ loop: true }, [Autoplay({ delay: 5000 })]);

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
                style={{ backgroundImage: `url(${slide.image})` }}
              />

              {/* Main Image - Object Contain to prevent cropping */}
              <img
                src={slide.image}
                alt={slide.title}
                className="absolute inset-0 w-full h-full object-contain z-10"
              />

              {/* Gradient Overlay for Text Readability */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent z-20" />

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 w-full p-6 md:p-12 z-30 flex flex-col items-start gap-4">
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyber-blue/20 text-cyber-blue text-xs font-bold uppercase tracking-wider mb-2 border border-cyber-blue/30 backdrop-blur-md">
                    <Gamepad2 className="w-3 h-3" />
                    Premium Gaming
                  </span>
                  <h2 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-2 drop-shadow-lg tracking-tight">
                    {slide.title}
                  </h2>
                  <p className="text-gray-200 text-xs sm:text-sm md:text-lg max-w-lg mb-6 drop-shadow-md line-clamp-2">
                    {slide.description}
                  </p>

                  <Link href={slide.link}>
                    <Button size="lg" className="rounded-xl px-5 sm:px-7 md:px-8 py-2.5 sm:py-3 md:py-3.5 font-bold text-sm sm:text-base btn-gaming group shadow-glow-blue hover:scale-105 transition-all">
                      {slide.cta}
                      <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
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
