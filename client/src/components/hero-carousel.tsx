import { useEffect, useState } from "react";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "@/lib/translation";

type HeroSlide = {
  id: number;
  backgroundImageUrl: string | null;
  titleAr: string | null;
  titleEn: string | null;
  promoTextAr: string | null;
  promoTextEn: string | null;
  buttonText: string | null;
  buttonLink: string | null;
};

export function HeroCarousel() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [active, setActive] = useState(0);
  const [isHovering, setIsHovering] = useState(false);
  const { language } = useTranslation();

  useEffect(() => {
    (async () => {
      try {
        const res = await apiRequest("GET", "/api/hero-slides");
        const data = await res.json();
        setSlides(Array.isArray(data) ? data : []);
      } catch {
        setSlides([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!slides.length) return;
    if (isHovering) return;
    const timer = setInterval(() => {
      setActive((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides, isHovering]);

  const nextSlide = () => setActive((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setActive((prev) => (prev - 1 + slides.length) % slides.length);

  // Fallback slide if none exist, with test image
  const displaySlides = slides.length > 0 ? slides : [{
    id: 999,
    backgroundImageUrl: "https://files.catbox.moe/ciy961.webp",
    titleEn: "Welcome to GameCart",
    titleAr: "مرحباً بكم في GameCart",
    promoTextEn: "Premium Gaming Experience",
    promoTextAr: "تجربة ألعاب متميزة",
    buttonText: "Shop Now",
    buttonLink: "/games"
  }];

  const current = displaySlides[active];
  const title = language === "ar" ? current.titleAr || current.titleEn : current.titleEn || current.titleAr;
  const promo = language === "ar" ? current.promoTextAr || current.promoTextEn : current.promoTextEn || current.promoTextAr;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl h-[260px] md:h-[360px] lg:h-[420px] bg-gradient-to-r from-slate-900 to-slate-800 group"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      {/* Background Image with Link */}
      <a
        href={current.buttonLink || '#'}
        className="absolute inset-0 block cursor-pointer"
        onClick={(e) => !current.buttonLink && e.preventDefault()}
      >
        <div
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 hover:scale-105"
          style={current.backgroundImageUrl ? { backgroundImage: `url(${current.backgroundImageUrl})` } : undefined}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30 pointer-events-none" />
      </a>

      {/* Content Layer (pointer-events-none wrapper for layout, pointer-events-auto for interactive elements) */}
      <div className="relative z-10 h-full flex flex-col md:flex-row items-center md:items-center justify-between px-6 md:px-10 lg:px-16 gap-6 pointer-events-none">
        <div className="max-w-xl text-white pointer-events-auto">
          <p className="text-xs uppercase tracking-[0.3em] text-gold-primary mb-3">
            Diaa Sadek Premium Game Store
          </p>
          <h1 className="text-2xl md:text-3xl lg:text-4xl font-black mb-3 leading-tight">
            {title}
          </h1>
          {promo && (
            <p className="text-sm md:text-base text-gray-200/90 mb-4 md:mb-6">
              {promo}
            </p>
          )}
          {current.buttonLink && current.buttonText && (
            <a
              href={current.buttonLink}
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-gold-primary to-neon-pink text-black font-semibold text-sm shadow-lg shadow-gold-primary/30 hover:from-gold-secondary hover:to-neon-pink transition-transform duration-200 hover:-translate-y-0.5"
            >
              {current.buttonText}
            </a>
          )}
        </div>

        <div className="hidden md:flex items-center justify-center flex-1 pointer-events-auto">
          <div className="relative w-60 h-60 lg:w-72 lg:h-72">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-gold-primary/30 via-neon-pink/20 to-transparent blur-2xl" />
            <div className="relative w-full h-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center">
              <span className="text-xs uppercase tracking-[0.35em] text-gray-300/80">
                Premium Digital Top-Ups
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={(e) => { e.stopPropagation(); prevSlide(); }}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-gold-primary hover:text-black text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 border border-white/10"
      >
        &#8592;
      </button>
      <button
        onClick={(e) => { e.stopPropagation(); nextSlide(); }}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/50 hover:bg-gold-primary hover:text-black text-white flex items-center justify-center backdrop-blur-sm transition-all opacity-0 group-hover:opacity-100 z-20 border border-white/10"
      >
        &#8594;
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {displaySlides.map((_, index) => (
          <button
            key={index}
            type="button"
            onClick={(e) => { e.stopPropagation(); setActive(index); }}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-6 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
