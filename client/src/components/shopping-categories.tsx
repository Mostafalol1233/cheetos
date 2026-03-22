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
  name && name.length > 3 ? name : (SLUG_DISPLAY_NAMES[slug] || name);

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
  "gift-cards":   "from-emerald-900/70 via-teal-900/40 to-transparent",
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
  "gift-cards":   "https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?w=600&q=80",
  "online-games": "https://images.unsplash.com/photo-1593305841991-05c297ba4575?w=600&q=80",
};

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
      {/* Section header */}
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
                {/* Full-bleed image */}
                <ImageWithFallback
                  src={imageToUse}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />

                {/* Subtle dark overlay — toned down */}
                <div className="absolute inset-0 bg-black/35 group-hover:bg-black/20 transition-all duration-300" />

                {/* Gradient from bottom — stronger at bottom for text readability */}
                <div className={`absolute inset-0 bg-gradient-to-t ${accent}`} />

                {/* Top-right icon badge — no blur */}
                <div className={`absolute top-3 right-3 w-8 h-8 rounded-xl border flex items-center justify-center ${iconStyle} transition-all duration-300 group-hover:scale-110`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Bottom content */}
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
