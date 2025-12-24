import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Package, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import type { Game } from "@shared/schema";

export default function GamePage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<number>(0);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  useEffect(() => {
    if (game) {
      document.title = `${game.name} | Diaa Eldeen`;
    }
    return () => {
      document.title = "Diaa Eldeen | Premium Game Store";
    };
  }, [game]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Game Not Found</h1>
          <p className="text-gray-600 dark:text-gray-300">The requested game could not be found.</p>
        </div>
      </div>
    );
  }

  const packages = game.packages || [];
  const packagePrices = game.packagePrices || [];
  const categoryLabel = (game.category ? String(game.category) : "").replace('-', ' ').toUpperCase();

  const handleAddToCart = () => {
    const packageName = packages[selectedPackage] || "Default Package";
    const packagePrice = packagePrices[selectedPackage] || game.price;
    
    addToCart({
      id: `${game.id}-${selectedPackage}`,
      name: `${game.name} - ${packageName}`,
      price: parseFloat(packagePrice),
      image: game.image,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Back Button */}
      <Button
        onClick={() => setLocation("/")}
        variant="ghost"
        className="mb-6 text-foreground hover:text-gold-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Game Image */}
        <div className="relative">
          <div className="aspect-square overflow-hidden rounded-2xl">
            <img
              src={game.image}
              alt={game.name}
              className="w-full h-full object-contain"
            />
            {game.isPopular && (
              <div className="absolute top-4 right-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center shadow-lg">
                <Star className="w-4 h-4 mr-1" />
                Popular
              </div>
            )}
          </div>
        </div>

        {/* Game Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{game.name}</h1>
            <p className="text-gray-600 dark:text-gray-300 text-lg">{game.description}</p>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-sm text-green-600 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900 px-3 py-1 rounded-full">
              ✓ {game.stock} In Stock
            </span>
            <span className="text-sm text-blue-600 dark:text-blue-400 font-medium bg-blue-100 dark:bg-blue-900 px-3 py-1 rounded-full">
              {categoryLabel || "UNKNOWN"}
            </span>
          </div>

          {/* Package Selection */}
          {packages.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Package className="w-5 h-5 mr-2" />
                  Available Packages
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {packages.map((pkg, index) => (
                    <button
                      key={index}
                      type="button"
                      aria-selected={selectedPackage === index}
                      className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                        selectedPackage === index
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 shadow-md'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow'
                      }`}
                      onClick={() => setSelectedPackage(index)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="shrink-0 w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center ring-1 ring-border overflow-hidden">
                          <img
                            src={game.image}
                            alt={game.name}
                            className="w-10 h-10 object-contain group-hover:scale-105 transition-transform"
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-semibold text-foreground">{pkg}</div>
                          <div className="text-sm text-muted-foreground">Package</div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-blue-600 dark:text-blue-400">{packagePrices[index]} L.E</div>
                          <div className="text-xs text-muted-foreground">Includes taxes</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Purchase Section */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {packages[selectedPackage] || "Default Package"}
                  </h3>
                  <span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {packagePrices[selectedPackage] || game.price} L.E
                  </span>
                </div>
              </div>
              
              <Button 
                onClick={handleAddToCart}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 text-lg flex items-center justify-center"
              >
                <ShoppingCart className="w-5 h-5 mr-2" />
                Add to Cart
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
