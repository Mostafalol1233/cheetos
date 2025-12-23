import { useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Game } from "@shared/schema";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShoppingCart, Check } from "lucide-react";
import { Link } from "wouter";
import { useToast } from "@/hooks/use-toast";

export default function GameDetails() {
  const [match, params] = useRoute("/game/:slug");
  const { addToCart } = useCart();
  const { toast } = useToast();
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedPrice, setSelectedPrice] = useState<number>(0);
  const [addingToCart, setAddingToCart] = useState(false);

  const { data: game, isLoading } = useQuery({
    queryKey: ["/api/games", params?.slug],
    queryFn: () => 
      fetch(`/api/games/${params?.slug}`).then(res => {
        if (!res.ok) throw new Error('Game not found');
        return res.json();
      }) as Promise<Game>,
    enabled: !!params?.slug
  });

  const handleAddToCart = async () => {
    if (!game || !selectedPackage) return;
    
    setAddingToCart(true);
    
    addToCart({
      id: `${game.id}-${selectedPackage}`,
      name: `${game.name} - ${selectedPackage}`,
      price: selectedPrice,
      image: game.image
    });

    toast({
      title: "Success! ✅",
      description: `${game.name} - ${selectedPackage} added to cart`,
      duration: 2000,
    });

    setTimeout(() => {
      setAddingToCart(false);
    }, 1000);
  };

  const handlePackageChange = (packageName: string) => {
    if (!game) return;
    
    setSelectedPackage(packageName);
    setSelectedPrice(parseFloat(game.price));
  };

  if (!match) return null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground p-4">
        <div className="container mx-auto max-w-4xl">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-6"></div>
            <div className="grid md:grid-cols-2 gap-8">
              <div className="h-64 bg-muted rounded-2xl"></div>
              <div className="space-y-4">
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-32 bg-muted rounded"></div>
                <div className="h-10 bg-muted rounded"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!game) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Game Not Found</h1>
          <Link href="/">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const structuredData = game ? {
    "@context": "https://schema.org",
    "@type": "Product",
    name: game.name,
    image: game.image,
    description: game.description,
    sku: game.id,
    offers: {
      "@type": "Offer",
      priceCurrency: game.currency,
      price: game.price,
      availability: "https://schema.org/InStock"
    }
  } : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/">
          <Button variant="outline" className="mb-6">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Games
          </Button>
        </Link>

        {structuredData && (
          <script type="application/ld+json">
            {JSON.stringify(structuredData)}
          </script>
        )}

        <div className="grid md:grid-cols-2 gap-8">
          {/* Game Image */}
          <div className="relative">
            <img
              src={game.image}
              alt={`${game.name} | Diaa Eldeen`}
              className="w-full h-64 md:h-80 object-contain bg-white dark:bg-gray-900 rounded-2xl shadow-lg p-4"
            />
            <div className="absolute top-4 right-4 bg-gold-primary text-background px-3 py-1 rounded-full text-sm font-bold">
              Popular ⭐
            </div>
          </div>

          {/* Game Details */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold text-gold-primary mb-2">
                {game.name}
              </h1>
              <p className="text-muted-foreground text-lg">
                {game.description}
              </p>
            </div>

            {/* Package Selection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">All Available Packages</h3>
                <span className="bg-green-500/20 text-green-400 px-2 py-1 rounded-full text-xs font-medium">
                  ✓ In Stock
                </span>
              </div>
              
              <div className="space-y-3">
                <button
                  onClick={() => handlePackageChange("Standard Package")}
                  className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left group hover:scale-[1.02] ${
                    selectedPackage 
                      ? 'border-gold-primary bg-gold-primary/10 shadow-lg' 
                      : 'border-border hover:border-gold-primary/50 hover:bg-card/50'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full border-2 transition-all ${
                          selectedPackage 
                            ? 'border-gold-primary bg-gold-primary' 
                            : 'border-gray-400 group-hover:border-gold-primary'
                        }`}>
                          {selectedPackage && <div className="w-full h-full rounded-full bg-white transform scale-50"></div>}
                        </div>
                        <div>
                          <h4 className="font-semibold text-lg">Standard Package</h4>
                          <p className="text-muted-foreground text-sm">
                            Instant delivery • No fees • Safe & Secure
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      {game.oldPrice ? (
                        <div className="text-xs text-red-500 line-through">${game.oldPrice}</div>
                      ) : null}
                      <div className="text-2xl font-bold text-gold-primary">
                        ${game.price}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {game.currency}
                      </div>
                    </div>
                  </div>
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!selectedPackage || addingToCart}
                className="w-full bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink text-white font-semibold py-3 rounded-xl hover:scale-105 transition-all duration-200"
                size="lg"
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                {addingToCart ? "Added to Cart!" : `Add to Cart - $${game.price}`}
              </Button>
            </div>

            {/* Game Info */}
            <div className="bg-card p-6 rounded-xl space-y-3">
              <h3 className="text-lg font-semibold">Game Information</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Category:</span>
                  <div className="font-medium capitalize">
                    {game.category.replace('-', ' ')}
                  </div>
                </div>
                <div>
                  <span className="text-muted-foreground">Delivery:</span>
                  <div className="font-medium text-green-500">Instant</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Stock:</span>
                  <div className="font-medium">In Stock</div>
                </div>
                <div>
                  <span className="text-muted-foreground">Support:</span>
                  <div className="font-medium">24/7 Available</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
