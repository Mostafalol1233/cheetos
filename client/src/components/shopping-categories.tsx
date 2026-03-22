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
  "hot-deals":    "from-red-600/80 via-orange-600/60 to-transparent",
  "mobile-games": "from-purple-700/80 via-pink-600/60 to-transparent",
  "gift-cards":   "from-emerald-700/80 via-teal-600/60 to-transparent",
  "online-games": "from-blue-700/80 via-indigo-600/60 to-transparent",
};

const BORDER_MAP: Record<string, string> = {
  "hot-deals":    "hover:border-orange-500/60 hover:shadow-orange-500/10",
  "mobile-games": "hover:border-purple-500/60 hover:shadow-purple-500/10",
  "gift-cards":   "hover:border-emerald-500/60 hover:shadow-emerald-500/10",
  "online-games": "hover:border-blue-500/60 hover:shadow-blue-500/10",
};

const ICON_COLOR_MAP: Record<string, string> = {
  "hot-deals":    "bg-orange-500/20 text-orange-400 border-orange-500/30",
  "mobile-games": "bg-purple-500/20 text-purple-400 border-purple-500/30",
  "gift-cards":   "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
  "online-games": "bg-blue-500/20 text-blue-400 border-blue-500/30",
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
            <div key={i} className="h-52 bg-white/5 rounded-2xl animate-pulse" />
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
        <div className="w-1 h-7 rounded-full bg-gradient-to-b from-cyan-400 to-blue-500" />
        <h2 className="text-2xl font-bold text-foreground tracking-tight">{t('shopping_categories')}</h2>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {categories.map((category) => {
          const IconComponent = ICON_MAP[category.icon] || Gift;
          const accent = ACCENT_MAP[category.slug] || "from-gray-800/80 to-transparent";
          const border = BORDER_MAP[category.slug] || "hover:border-white/20";
          const iconStyle = ICON_COLOR_MAP[category.slug] || "bg-white/10 text-white/60 border-white/20";

          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="block group"
            >
              <div
                className={`
                  relative overflow-hidden rounded-2xl h-52 
                  border border-white/8 ${border}
                  shadow-lg hover:shadow-xl
                  transition-all duration-400 cursor-pointer
                `}
              >
                {/* Full-bleed image */}
                <ImageWithFallback
                  src={category.image}
                  alt={category.name}
                  className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />

                {/* Dark overlay — always */}
                <div className="absolute inset-0 bg-black/40 group-hover:bg-black/25 transition-all duration-400" />

                {/* Gradient overlay from bottom */}
                <div className={`absolute inset-0 bg-gradient-to-t ${accent}`} />

                {/* Top-right icon badge */}
                <div className={`absolute top-3 right-3 w-8 h-8 rounded-xl border flex items-center justify-center backdrop-blur-sm ${iconStyle} transition-all duration-300 group-hover:scale-110`}>
                  <IconComponent className="w-4 h-4" />
                </div>

                {/* Bottom content */}
                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <h3 className="text-white font-bold text-base leading-tight mb-0.5 drop-shadow-lg">
                    {getDisplayName(category.name, category.slug)}
                  </h3>
                  <p className="text-white/70 text-xs leading-snug line-clamp-2 mb-2 drop-shadow">
                    {category.description}
                  </p>
                  <div className="flex items-center gap-1 text-white/80 text-xs font-medium">
                    <span>Explore</span>
                    <ArrowRight className="w-3 h-3 group-hover:translate-x-1 transition-transform duration-300" />
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
