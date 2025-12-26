import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Star, Package, ArrowLeft } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useEffect } from "react";
import type { Game } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import type { Category } from "@shared/schema";
import { Link } from "wouter";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";

export default function GamePage() {
  const { slug } = useParams();
  const { addToCart } = useCart();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [, setLocation] = useLocation();
  const [selectedPackage, setSelectedPackage] = useState<number>(0);

  const { data: game, isLoading } = useQuery<Game>({
    queryKey: [`/api/games/${slug}`],
  });

  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
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
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('game_not_found')}</h1>
          <p className="text-gray-600 dark:text-gray-300">{t('game_not_found_desc')}</p>
        </div>
      </div>
    );
  }

  const packages = game.packages || [];
  const packagePrices = game.packagePrices || [];
  const categoryLabel = (game.category ? String(game.category) : "").replace('-', ' ').toUpperCase();
  const category = Array.isArray(categories)
    ? categories.find((c) => c.slug === game.category)
    : undefined;
  const isOutOfStock = Number(game.stock) <= 0;

  const handleAddToCart = () => {
    if (isOutOfStock) {
      toast({
        title: t('out_of_stock'),
        description: t('item_unavailable'),
        duration: 2500,
      });
      return;
    }

    const packageName = packages[selectedPackage] || t('default_package');
    const packagePrice = packagePrices[selectedPackage] || game.price;
    
    addToCart({
      id: `${game.id}-${selectedPackage}`,
      name: `${game.name} - ${packageName}`,
      price: parseFloat(String(packagePrice)),
      image: game.image,
    });

    toast({
      title: t('success'),
      description: `${game.name} (${packageName}) ${t('added_to_cart')}`,
      duration: 2000,
    });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back Button */}
      <Button
        onClick={() => setLocation("/")}
        variant="ghost"
        className="mb-6 text-foreground hover:text-gold-primary"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        {t('back')}
      </Button>

      <div className="space-y-8">
        {/* Game Image - Large Square Box at Top */}
        <div className="relative w-full">
          <div className="aspect-square overflow-hidden rounded-3xl shadow-2xl border border-gold-primary/20">
            <ImageWithFallback src={game.image} alt={game.name} className="w-full h-full object-cover" />
            {game.isPopular && (
              <div className="absolute top-6 right-6 bg-gradient-to-r from-gold-primary to-neon-pink text-white px-4 py-2 rounded-full text-sm font-bold flex items-center shadow-lg">
                <Star className="w-5 h-5 mr-2" />
                {t('popular')}
              </div>
            )}
          </div>
        </div>

        {/* Game Details Below Image */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black text-foreground mb-3">{game.name}</h1>
            <p className="text-muted-foreground text-lg leading-relaxed">{game.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {isOutOfStock ? (
              <span className="text-sm text-red-700 dark:text-red-300 font-bold bg-red-100 dark:bg-red-900/30 px-4 py-2 rounded-full border border-red-200 dark:border-red-800">
                {t('out_of_stock')}
              </span>
            ) : (
              <span className="text-sm text-green-600 dark:text-green-400 font-bold bg-green-100 dark:bg-green-900/30 px-4 py-2 rounded-full border border-green-200 dark:border-green-800">
                ✓ {game.stock} {t('in_stock')}
              </span>
            )}

            {category ? (
              <Link href={`/category/${category.slug}`}>
                <span className="inline-flex items-center gap-2 text-sm text-gold-primary font-bold bg-gold-primary/10 px-4 py-2 rounded-full cursor-pointer hover:bg-gold-primary/20 transition-colors border border-gold-primary/20">
                  {category.image ? (
                    <ImageWithFallback src={category.image} alt={category.name} className="w-5 h-5 rounded object-cover" />
                  ) : null}
                  {category.name}
                </span>
              </Link>
            ) : (
              <span className="text-sm text-gold-primary font-bold bg-gold-primary/10 px-4 py-2 rounded-full border border-gold-primary/20">
                {categoryLabel || t('unknown')}
              </span>
            )}
          </div>
        </div>

        {/* Package Selection */}
        {packages.length > 0 && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-3xl font-bold text-foreground flex items-center">
                <Package className="w-7 h-7 mr-3 text-gold-primary" />
                {t('available_packages')}
              </h3>
              <span className="text-sm font-bold text-muted-foreground bg-card/50 px-4 py-2 rounded-full border border-gold-primary/10">
                {packages.length} {packages.length === 1 ? 'option' : 'options'}
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {packages.map((pkg, index) => (
                  <button
                    key={index}
                    type="button"
                    aria-selected={selectedPackage === index}
                    className={`group relative p-4 rounded-xl border-2 text-left transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-gold-primary overflow-hidden ${
                      selectedPackage === index
                        ? 'border-gold-primary bg-gradient-to-br from-gold-primary/10 to-neon-pink/10 dark:from-gold-primary/20 dark:to-neon-pink/20 shadow-lg'
                        : 'border-border hover:border-gold-primary/50 hover:shadow-md'
                    }`}
                    onClick={() => setSelectedPackage(index)}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="shrink-0 w-12 h-12 rounded-lg bg-muted/40 flex items-center justify-center ring-1 ring-border overflow-hidden">
                        <ImageWithFallback
                          src={game.image}
                          alt={game.name}
                          className="w-11 h-11 object-contain group-hover:scale-105 transition-transform"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-foreground truncate">{pkg}</div>
                        <div className="text-sm text-muted-foreground">{t('package')}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-bold text-gold-primary whitespace-nowrap">{packagePrices[index]} {game.currency}</div>
                        <div className="text-xs text-muted-foreground">{t('includes_taxes')}</div>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Purchase Section */}
        <Card className="border-gold-primary/30 shadow-xl bg-gradient-to-br from-card to-card/50">
          <CardContent className="p-8">
            <div className="mb-8">
              <h3 className="text-2xl font-bold text-foreground mb-3">
                {packages[selectedPackage] || t('default_package')}
              </h3>
              <div className="text-5xl font-black bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                {packagePrices[selectedPackage] || game.price} {game.currency}
              </div>
            </div>
            
            <Button 
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className="w-full bg-gradient-to-r from-gold-primary to-neon-pink text-white font-bold py-4 text-lg hover:shadow-xl hover:scale-105 transition-all disabled:bg-muted disabled:hover:bg-muted disabled:hover:scale-100 flex items-center justify-center"
            >
              <ShoppingCart className="w-6 h-6 mr-2" />
              {isOutOfStock ? t('out_of_stock') : t('add_to_cart')}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
