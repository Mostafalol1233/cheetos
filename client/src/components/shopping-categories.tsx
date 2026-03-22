import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Link } from "wouter";
import ImageWithFallback from "./image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { ArrowRight, Flame, Smartphone, Gift, Monitor, Zap } from "lucide-react";

const SLUG_DISPLAY_NAMES: Record<string, string> = {
  "hot-deals":    "Hot Deals",
  "mobile-games": "Mobile Games",
  "gift-cards":   "Gift Cards",
  "online-games": "Online Games",
};

const getDisplayName = (name: string, slug: string) =>
  SLUG_DISPLAY_NAMES[slug] || name;

const ICON_MAP: Record<string, React.ElementType> = {
  fire: Flame,
  Zap: Zap,
  smartphone: Smartphone,
  Smartphone: Smartphone,
  gift: Gift,
  Gift: Gift,
  Monitor: Monitor,
  globe: Monitor,
};

const ACCENT_MAP: Record<string, string> = {
  "hot-deals":    "from-red-900/70 via-orange-900/40 to-transparent",
  "mobile-games": "from-purple-900/70 via-pink-900/40 to-transparent",
  "gift-cards":   "from-emerald-900/80 via-teal-900/50 to-transparent",
  "online-games": "from-blue-900/70 via-indigo-900/40 to-transparent",
};

const BORDER_MAP: Record<string, string> = {
  "hot-deals":    "hover:border-orange-500/50 hover:shadow-orange-500/15",
  "mobile-games": "hover:border-purple-500/50 hover:shadow-purple-500/15",
  "gift-cards":   "hover:border-emerald-500/50 hover:shadow-emerald-500/15",
  "online-games": "hover:border-blue-500/50 hover:shadow-blue-500/15",
};

const ICON_COLOR_MAP: Record<string, string> = {
  "hot-deals":    "bg-orange-500/25 text-orange-300 border-orange-500/40",
  "mobile-games": "bg-purple-500/25 text-purple-300 border-purple-500/40",
  "gift-cards":   "bg-emerald-500/25 text-emerald-300 border-emerald-500/40",
  "online-games": "bg-blue-500/25 text-blue-300 border-blue-500/40",
};

const TAG_MAP: Record<string, string> = {
  "hot-deals":    "bg-orange-500/20 text-orange-300 border-orange-500/30",
  "mobile-games": "bg-purple-500/20 text-purple-300 border-purple-500/30",
  "gift-cards":   "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  "online-games": "bg-blue-500/20 text-blue-300 border-blue-500/30",
};

const FALLBACK_IMAGES: Record<string, string> = {
  "hot-deals":    "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&q=80",
  "mobile-games": "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=600&q=80",
  "gift-cards":   "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=600&q=80",
  "online-games": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
};

const GIFT_CARD_LOGOS = [
  { src: "/images/giftcard-steam.svg", alt: "Steam" },
  { src: "/images/giftcard-amazon.svg", alt: "Amazon" },
  { src: "/images/giftcard-google-play.svg", alt: "Google Play" },
  { src: "/images/giftcard-psn.svg", alt: "PlayStation" },
  { src: "/images/giftcard-xbox.svg", alt: "Xbox" },
  { src: "/images/giftcard-netflix.svg", alt: "Netflix" },
  { src: "/images/giftcard-itunes.svg", alt: "iTunes" },
  { src: "/images/giftcard-spotify.svg", alt: "Spotify" },
];

function GiftCardMosaic() {
  return (
    <div className="absolute inset-0 bg-gradient-to-br from-[#0a1f14] via-[#0d2b1e] to-[#071a10]">
      <div className="absolute inset-0 grid grid-cols-4 grid-rows-2 gap-0">
        {GIFT_CARD_LOGOS.map((logo, i) => (
          <div
            key={i}
            className="relative flex items-center justify-center overflow-hidden"
            style={{ background: i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.15)' }}
          >
            <img
              src={logo.src}
              alt={logo.alt}
              className="w-12 h-12 object-contain opacity-60 drop-shadow-lg"
              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-teal-900/20" />
    </div>
  );
}

export function ShoppingCategories() {
  const { t } = useTranslation();
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(res => res.json()) as Promise<Category[]>
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="h-8 bg-white/5 rounded w-52 animate-pulse mb-10" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-56 bg-white/5 rounded-2xl animate-pulse" />
          ))}
        </div>
      </section>
    );
  }

  if (isError || !Array.isArray(categories) || categories.length === 0) return null;

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-1 h-7 rounded-full bg-gold-primary" />
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('shopping_categories')}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Gift;
          const accent = ACCENT_MAP[category.slug] || "from-gray-900/70 to-transparent";
          const border = BORDER_MAP[category.slug] || "hover:border-white/20";
          const iconStyle = ICON_COLOR_MAP[category.slug] || "bg-white/10 text-white/60 border-white/20";
          const tagStyle = TAG_MAP[category.slug] || "bg-white/10 text-white/60 border-white/20";
          const fallbackImage = FALLBACK_IMAGES[category.slug];
          const imageToUse = category.image || fallbackImage;
          const isGiftCards = category.slug === "gift-cards";

          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="block group"
            >
              <div
                className={`
                  relative overflow-hidden rounded-2xl h-56
                  border border-white/10 ${border}
                  shadow-md hover:shadow-xl
                  transition-all duration-300 cursor-pointer
                `}
              >
                {isGiftCards ? (
                  <GiftCardMosaic />
                ) : (
                  <ImageWithFallback
                    src={imageToUse}
                    alt={category.name}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}

                {!isGiftCards && (
                  <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-all duration-300" />
                )}

                <div className={`absolute inset-0 bg-gradient-to-t ${accent}`} />

                <div className={`absolute top-3 right-3 w-8 h-8 rounded-xl border flex items-center justify-center ${iconStyle} transition-all duration-300 group-hover:scale-110`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {isGiftCards && (
                  <div className="absolute top-3 left-3 flex gap-1 flex-wrap max-w-[55%]">
                    {GIFT_CARD_LOGOS.slice(0, 4).map((logo, i) => (
                      <div key={i} className="w-6 h-6 rounded bg-white/10 border border-white/20 flex items-center justify-center">
                        <img src={logo.src} alt={logo.alt} className="w-4 h-4 object-contain" onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      </div>
                    ))}
                  </div>
                )}

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-base leading-tight mb-1 drop-shadow-lg tracking-wide">
                    {getDisplayName(category.name, category.slug)}
                  </h3>
                  <p className="text-white/75 text-xs leading-snug line-clamp-1 mb-2.5 drop-shadow">
                    {category.description}
                  </p>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${tagStyle} transition-all duration-300 group-hover:gap-2`}>
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </div>
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
