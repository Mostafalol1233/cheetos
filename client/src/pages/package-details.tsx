
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Check, ShieldCheck, Zap } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState, useRef } from "react";
import { CheckoutContent } from "@/pages/Checkout";
import { useCheckout } from "@/state/checkout";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export default function PackageDetailsPage() {
  const [, params] = useRoute("/packages/:slug");
  const slug = params?.slug;
  const [, setLocation] = useLocation();
  const { addToCart, clearCart } = useCart();
  const { setCart: setCheckoutCart, setStep } = useCheckout();
  const [showCheckout, setShowCheckout] = useState(false);
  const checkoutRef = useRef<HTMLDivElement>(null);

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
    // Clear global cart and add this item
    clearCart();
    const item = {
        id: pkg.id,
        name: pkg.name,
        price: Number(pkg.discountPrice || pkg.price),
        image: pkg.image,
        gameId: pkg.gameId,
        quantity: 1
    };
    addToCart(item);
    
    // Setup checkout state
    setCheckoutCart([item]);
    setStep('details');
    setShowCheckout(true);

    // Scroll to checkout
    setTimeout(() => {
        checkoutRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <div className="mb-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="/">Home</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href="/games">Games</BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{pkg.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Button variant="ghost" onClick={() => window.history.back()} className="mb-6 hover:bg-white/10">
        <ArrowLeft className="mr-2 h-4 w-4" /> Back
      </Button>

      <div className="grid md:grid-cols-2 gap-8 mb-16">
        <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-gold-primary to-neon-pink rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200"></div>
            {pkg.image ? (
                <img 
                    src={pkg.image} 
                    alt={pkg.name} 
                    className="relative w-full h-auto rounded-xl shadow-2xl object-cover aspect-video ring-1 ring-white/10"
                />
            ) : (
                <div className="relative w-full h-64 bg-muted rounded-xl flex items-center justify-center ring-1 ring-white/10">
                    No Image
                </div>
            )}
        </div>
        
        <div className="space-y-8">
            <div>
                <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">{pkg.name}</h1>
                {pkg.gameName && (
                    <p className="text-xl text-gold-primary font-medium">{pkg.gameName}</p>
                )}
            </div>

            <div className="prose prose-invert max-w-none">
                <p className="text-lg text-muted-foreground whitespace-pre-wrap leading-relaxed">{pkg.description || "Experience the best gaming content with instant delivery."}</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="bg-card/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <Zap className="w-8 h-8 text-gold-primary" />
                    <div>
                        <p className="font-bold">Instant Delivery</p>
                        <p className="text-xs text-muted-foreground">Automated processing</p>
                    </div>
                </div>
                <div className="bg-card/50 p-4 rounded-xl border border-white/5 flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-green-500" />
                    <div>
                        <p className="font-bold">Secure Payment</p>
                        <p className="text-xs text-muted-foreground">Encrypted transactions</p>
                    </div>
                </div>
            </div>

            {pkg.bonus && (
                <div className="bg-gradient-to-r from-gold-primary/20 to-transparent p-4 rounded-xl border-l-4 border-gold-primary">
                    <p className="font-bold text-gold-primary flex items-center text-lg">
                        <Check className="mr-2 h-6 w-6" />
                        Bonus Included: {pkg.bonus}
                    </p>
                </div>
            )}

            <Card className="border-0 bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
                <CardContent className="p-6">
                    <div className="flex items-end justify-between mb-6">
                        <div>
                            <p className="text-sm text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Price</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-4xl font-black text-white">
                                    {pkg.discountPrice ? `${pkg.discountPrice}` : `${pkg.price}`}
                                    <span className="text-lg font-medium text-muted-foreground ml-1">EGP</span>
                                </span>
                                {pkg.discountPrice && (
                                    <span className="text-xl text-muted-foreground line-through decoration-red-500/50">
                                        {pkg.price}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <Button 
                        size="lg" 
                        className="w-full text-xl py-8 font-bold bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink shadow-lg hover:shadow-gold-primary/25 transition-all duration-300 hover:scale-[1.02]" 
                        onClick={handleBuyNow}
                    >
                        {showCheckout ? "Scroll to Checkout ↓" : "Buy Now"}
                    </Button>
                </CardContent>
            </Card>
        </div>
      </div>

      {/* Embedded Checkout Section */}
      <div ref={checkoutRef} className={`transition-all duration-1000 ease-in-out ${showCheckout ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 hidden'}`}>
        <div className="border-t border-white/10 pt-10">
            <h2 className="text-3xl font-bold mb-8 text-center">Complete Your Order</h2>
            <div className="bg-card/30 backdrop-blur-md rounded-3xl border border-white/10 p-4 md:p-8">
                <CheckoutContent isEmbedded={true} />
            </div>
        </div>
      </div>
    </div>
  );
}
