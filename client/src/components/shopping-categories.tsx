import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Flame, Globe, Smartphone, Gift, Clock } from "lucide-react";
import { Link } from "wouter";
import ImageWithFallback from "./image-with-fallback";

const iconMap = {
  fire: Flame,
  globe: Globe,
  smartphone: Smartphone,
  gift: Gift,
  clock: Clock
};

export function ShoppingCategories() {
  const { data: categories = [], isLoading, isError } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => fetch("/api/categories").then(res => res.json()) as Promise<Category[]>
  });

  if (isLoading) {
    return (
      <section className="container mx-auto px-4 py-12">
        <div className="flex items-center mb-8">
          <div className="w-6 h-6 bg-gold-primary rounded mr-3 animate-pulse"></div>
          <div className="h-6 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-64 bg-card-bg rounded-3xl animate-pulse"></div>
          ))}
        </div>
      </section>
    );
  }

  if (isError || !Array.isArray(categories) || categories.length === 0) {
    return null;
  }

  return (
    <section className="container mx-auto px-4 py-12">
      <div className="flex items-center mb-8">
        <div className="w-6 h-6 bg-gold-primary rounded-full flex items-center justify-center mr-3">
          <div className="w-3 h-3 bg-darker-bg rounded-full"></div>
        </div>
        <h2 className="text-2xl font-bold text-white">Shopping Categories</h2>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
        {Array.isArray(categories) && categories.map((category) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Gift;
          
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="block"
            >
              <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${category.gradient} p-6 h-64 card-hover transition-all duration-500 cursor-pointer group`}>
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-all"></div>
                <ImageWithFallback
                  src={category.image}
                  alt={`${category.name} category`}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="relative z-10 h-full flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg">{category.name}</h3>
                    <IconComponent className="w-6 h-6 text-white animate-pulse drop-shadow" />
                  </div>
                  <div>
                    <p className="text-white/90 mb-3 text-sm drop-shadow">{category.description}</p>
                    <div className="flex items-center text-white/90 group-hover:text-white transition-colors">
                      <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                      <span className="text-sm">Explore Now</span>
                    </div>
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
