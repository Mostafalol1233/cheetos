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
  const { lang } = useTranslation();

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

  if (!slides.length) return null;

  const current = slides[active];
  const title = lang === "ar" ? current.titleAr || current.titleEn : current.titleEn || current.titleAr;
  const promo = lang === "ar" ? current.promoTextAr || current.promoTextEn : current.promoTextEn || current.promoTextAr;

  return (
    <div
      className="relative w-full overflow-hidden rounded-2xl h-[260px] md:h-[360px] lg:h-[420px] bg-gradient-to-r from-slate-900 to-slate-800"
      onMouseEnter={() => setIsHovering(true)}
      onMouseLeave={() => setIsHovering(false)}
    >
      <div
        className="absolute inset-0 bg-cover bg-center transition-transform duration-700"
        style={current.backgroundImageUrl ? { backgroundImage: `url(${current.backgroundImageUrl})` } : undefined}
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/60 to-black/30" />

      <div className="relative z-10 h-full flex flex-col md:flex-row items-center md:items-center justify-between px-6 md:px-10 lg:px-16 gap-6">
        <div className="max-w-xl text-white">
          <p className="text-xs uppercase tracking-[0.3em] text-emerald-300 mb-3">
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
              className="inline-flex items-center px-5 py-2.5 rounded-full bg-gradient-to-r from-emerald-400 to-cyan-500 text-black font-semibold text-sm shadow-lg shadow-emerald-500/30 hover:from-emerald-300 hover:to-cyan-400 transition-transform duration-200 hover:-translate-y-0.5"
            >
              {current.buttonText}
            </a>
          )}
        </div>

        <div className="hidden md:flex items-center justify-center flex-1">
          <div className="relative w-60 h-60 lg:w-72 lg:h-72">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-emerald-500/30 via-cyan-400/20 to-transparent blur-2xl" />
            <div className="relative w-full h-full rounded-3xl border border-white/10 bg-black/40 backdrop-blur-xl flex items-center justify-center">
              <span className="text-xs uppercase tracking-[0.35em] text-gray-300/80">
                Premium Digital Top-Ups
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-20">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setActive(index)}
            className={`h-1.5 rounded-full transition-all duration-300 ${index === active ? "w-6 bg-white" : "w-2 bg-white/50"}`}
          />
        ))}
      </div>
    </div>
  );
}
