import { useQuery } from "@tanstack/react-query";
import { Category } from "@shared/schema";
import { Flame, Globe, Smartphone, Gift, Clock } from "lucide-react";
import { Link } from "wouter";

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
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {Array.isArray(categories) && categories.map((category) => {
          const IconComponent = iconMap[category.icon as keyof typeof iconMap] || Gift;
          
          return (
            <Link
              key={category.id}
              href={`/category/${category.slug}`}
              className="block"
            >
              <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${category.gradient} p-8 card-hover transition-all duration-500 cursor-pointer group`}>
                <div className="absolute inset-0 bg-black/20"></div>
                <img
                  src={category.image}
                  alt={`${category.name} category`}
                  className="absolute inset-0 w-full h-full object-cover opacity-70"
                />
                <div className="relative z-10">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-2xl font-bold text-white">{category.name}</h3>
                    <IconComponent className="w-8 h-8 text-white animate-pulse" />
                  </div>
                  <p className="text-white/90 mb-6">{category.description}</p>
                  <div className="flex items-center text-white/80">
                    <div className="w-2 h-2 bg-white rounded-full mr-2"></div>
                    <span>Explore Now</span>
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
