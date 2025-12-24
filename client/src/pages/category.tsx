import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Package, Search, Star, ShoppingCart } from "lucide-react";
import { Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect } from "react";
import type { Game, Category } from "@shared/schema";

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();

  const { data: category } = useQuery<Category[], Error, Category | undefined>({
    queryKey: ["/api/categories"],
    select: (categories) => categories?.find(cat => cat.slug === slug),
  });

  useEffect(() => {
    if (category) {
      document.title = `${category.name} Games | Diaa Eldeen`;
    }
    return () => {
      document.title = "Diaa Eldeen | Premium Game Store";
    };
  }, [category]);

  const { data: games = [], isLoading } = useQuery<Game[]>({
    queryKey: ["/api/games/category", slug],
    enabled: !!slug,
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="space-y-3">
                <Skeleton className="h-[200px] w-full rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-4 w-[250px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!category) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Category Not Found</h1>
            <p className="text-gray-600 dark:text-gray-300 mb-6">The category you're looking for doesn't exist.</p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>
          
          <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${category.gradient} p-8 mb-8`}>
            <div className="absolute inset-0 bg-black/20"></div>
            <img
              src={category.image}
              alt={`${category.name} category`}
              className="absolute inset-0 w-full h-full object-cover opacity-70"
            />
            <div className="relative z-10">
              <h1 className="text-4xl font-bold text-white mb-2">{category.name}</h1>
              <p className="text-white/90 text-lg">{category.description}</p>
            </div>
          </div>
        </div>

        {/* Games Grid */}
        {games.length > 0 ? (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                Available Games ({games.length})
              </h2>
              <div className="flex items-center text-gray-600 dark:text-gray-300">
                <Search className="w-4 h-4 mr-2" />
                <span>{games.length} games found</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {games.map((game) => {
                const packages = Array.isArray(game.packages) ? game.packages : [];
                const packagePrices = Array.isArray(game.packagePrices) ? game.packagePrices : [];
                const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices) ? (game as any).packageDiscountPrices : [];
                const hasDiscount = game.discountPrice && parseFloat(game.discountPrice.toString()) > 0;
                const mainPrice = parseFloat(game.price.toString());
                const discountPrice = hasDiscount ? parseFloat(game.discountPrice.toString()) : null;
                
                return (
                  <Card key={game.id} className="overflow-hidden hover:shadow-lg hover:scale-105 transition-all duration-300">
                    <div className="aspect-[4/3] relative overflow-hidden">
                      <img
                        src={game.image}
                        alt={game.name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-500"
                      />
                      {game.isPopular && (
                        <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-2 py-1 rounded-full text-xs font-bold flex items-center shadow-lg">
                          <Star className="w-3 h-3 mr-1" />
                          Popular
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-bold text-lg mb-2 text-gray-900 dark:text-white">{game.name}</h3>
                      
                      {/* Card Amounts/Packages */}
                      {packages.length > 0 ? (
                        <div className="mb-3 space-y-1">
                          {packages.slice(0, 2).map((pkg: string, idx: number) => {
                            const pkgPrice = packagePrices[idx] || game.price;
                            const pkgDiscountPrice = packageDiscountPrices[idx] || null;
                            const hasPkgDiscount = pkgDiscountPrice && parseFloat(pkgDiscountPrice) > 0;
                            
                            return (
                              <div key={idx} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 dark:text-gray-300">{pkg}</span>
                                <div className="flex items-center gap-1">
                                  {hasPkgDiscount && (
                                    <span className="text-red-500 line-through text-[10px]">{pkgPrice} {game.currency}</span>
                                  )}
                                  <span className="text-blue-600 dark:text-blue-400 font-bold">{hasPkgDiscount ? pkgDiscountPrice : pkgPrice} {game.currency}</span>
                                </div>
                              </div>
                            );
                          })}
                          {packages.length > 2 && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">+{packages.length - 2} more</div>
                          )}
                        </div>
                      ) : (
                        <div className="mb-3">
                          {hasDiscount ? (
                            <div className="flex items-center gap-2">
                              <span className="text-red-500 line-through text-sm">{mainPrice} {game.currency}</span>
                              <span className="text-xl font-bold text-blue-600 dark:text-blue-400">{discountPrice} {game.currency}</span>
                            </div>
                          ) : (
                            <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
                              {game.category === 'mobile-games' ? `Starting from ${game.price} ${game.currency}` : `${game.price} ${game.currency}`}
                            </span>
                          )}
                        </div>
                      )}
                      
                      <div className="flex gap-2">
                        <Link href={`/game/${game.slug}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full">
                            View
                          </Button>
                        </Link>
                        <Button size="sm" className="flex items-center bg-blue-600 hover:bg-blue-700 flex-1">
                          <ShoppingCart className="w-4 h-4 mr-1" />
                          Buy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Package className="w-16 h-16 mx-auto text-gray-400 mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
              No Games Available
            </h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              There are currently no games available in this category.
            </p>
            <Link
              href="/"
              className="inline-flex items-center px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Browse Other Categories
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
