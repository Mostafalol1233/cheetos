
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";

export default function PackageDetailsPage() {
  const [, params] = useRoute("/packages/:slug");
  const slug = params?.slug;
  const [, setLocation] = useLocation();
  const { addToCart, clearCart } = useCart();

  const { data: pkg, isLoading, error } = useQuery({
    queryKey: ["package", slug],
    queryFn: async () => {
      const res = await fetch(`/api/packages/${slug}`);
      if (!res.ok) throw new Error("Package not found");
      return res.json();
    },
    enabled: !!slug
  });

  if (isLoading) {
    return (
        <div className="container mx-auto py-10 px-4">
            <Skeleton className="h-10 w-1/3 mb-4" />
            <Skeleton className="h-64 w-full mb-8" />
            <Skeleton className="h-20 w-full" />
        </div>
    );
  }

  if (error || !pkg) {
    return (
        <div className="container mx-auto py-10 px-4 text-center">
            <h1 className="text-2xl font-bold mb-4">Package Not Found</h1>
            <Button onClick={() => setLocation("/")}>Return Home</Button>
        </div>
    );
  }

  const handleBuyNow = () => {
    // "Buy Now" replaces cart functionality -> clear cart and add this item?
    // User requested "Buy Now button (replaces cart functionality)"
    // So we clear cart and add this single item, then go to checkout.
    
    clearCart();
    addToCart({
        id: pkg.id, // Ensure this ID is unique enough or handle it
        name: pkg.name,
        price: Number(pkg.discountPrice || pkg.price),
        image: pkg.image,
        gameId: pkg.gameId,
        // Add other necessary fields if CartItem requires them
    });
    
    setLocation("/checkout");
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-4xl">
      <Button variant="ghost" onClick={() => window.history.back()} className="mb-6">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8">
        <div>
            {pkg.image ? (
                <img 
                    src={pkg.image} 
                    alt={pkg.name} 
                    className="w-full h-auto rounded-lg shadow-lg object-cover aspect-video"
                />
            ) : (
                <div className="w-full h-64 bg-muted rounded-lg flex items-center justify-center">
                    No Image
                </div>
            )}
        </div>
        
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold">{pkg.name}</h1>
                {pkg.gameName && (
                    <p className="text-muted-foreground mt-1">for {pkg.gameName}</p>
                )}
            </div>

            <div className="prose dark:prose-invert">
                <p className="text-lg whitespace-pre-wrap">{pkg.description || "No description available."}</p>
            </div>

            {pkg.bonus && (
                <div className="bg-primary/10 p-4 rounded-lg border border-primary/20">
                    <p className="font-semibold text-primary flex items-center">
                        <Check className="mr-2 h-5 w-5" />
                        Bonus: {pkg.bonus}
                    </p>
                </div>
            )}

            <Card>
                <CardContent className="p-6">
                    <div className="flex items-end justify-between mb-4">
                        <div>
                            <p className="text-sm text-muted-foreground">Price</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-3xl font-bold">
                                    {pkg.discountPrice ? `$${pkg.discountPrice}` : `$${pkg.price}`}
                                </span>
                                {pkg.discountPrice && (
                                    <span className="text-lg text-muted-foreground line-through">
                                        ${pkg.price}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Button size="lg" className="w-full text-lg" onClick={handleBuyNow}>
                        Buy Now
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}
