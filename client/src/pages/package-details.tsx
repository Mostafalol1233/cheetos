
import { useRoute, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SEO } from "@/components/SEO";
import { ArrowLeft, Check, ShieldCheck, Zap, ShoppingBag, X } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { useState } from "react";
import { CheckoutContent } from "@/pages/Checkout";
import { useCheckout } from "@/state/checkout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

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
  const [checkoutOpen, setCheckoutOpen] = useState(false);

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
    setCheckoutCart([item]);
    setStep('details');
    setCheckoutOpen(true);
  };

  const seoImage = pkg.image || pkg.gameImage || '/logo.png';
  const discountPercent = pkg.discountPrice && pkg.price
    ? Math.round(((Number(pkg.price) - Number(pkg.discountPrice)) / Number(pkg.price)) * 100)
    : 0;

  return (
    <div className="container mx-auto py-10 px-4 max-w-6xl">
      <SEO
        title={`${pkg.name} - ${pkg.gameName || 'GameCart'} | Diaa Store`}
        description={pkg.description || `Buy ${pkg.name} for ${pkg.gameName} securely on Diaa Store.`}
        image={seoImage}
        keywords={[pkg.name, pkg.gameName, 'top up', 'game cards', 'Diaa Store']}
        url={window.location.href}
      />

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

      <div className="grid md:grid-cols-2 gap-8">
        {/* Image */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-gold-primary to-neon-pink rounded-2xl blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
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

          {/* Discount badge on image */}
          {discountPercent > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white text-sm font-bold px-3 py-1 rounded-full shadow-lg">
              {discountPercent}% OFF
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-6">
          <div>
            <h1 className="text-4xl font-black tracking-tight mb-2 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
              {pkg.name}
            </h1>
            {pkg.gameName && (
              <p className="text-xl text-gold-primary font-medium">{pkg.gameName}</p>
            )}
          </div>

          <p className="text-base text-muted-foreground whitespace-pre-wrap leading-relaxed">
            {pkg.description || "Experience the best gaming content with instant delivery."}
          </p>

          {/* Trust badges */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
              <Zap className="w-7 h-7 text-gold-primary shrink-0" />
              <div>
                <p className="font-bold text-sm">Instant Delivery</p>
                <p className="text-xs text-muted-foreground">Automated processing</p>
              </div>
            </div>
            <div className="bg-card/50 p-3 rounded-xl border border-white/5 flex items-center gap-3">
              <ShieldCheck className="w-7 h-7 text-green-500 shrink-0" />
              <div>
                <p className="font-bold text-sm">Secure Payment</p>
                <p className="text-xs text-muted-foreground">Encrypted transactions</p>
              </div>
            </div>
          </div>

          {/* Bonus */}
          {pkg.bonus && (
            <div className="bg-gradient-to-r from-gold-primary/20 to-transparent p-4 rounded-xl border-l-4 border-gold-primary">
              <p className="font-bold text-gold-primary flex items-center text-base">
                <Check className="mr-2 h-5 w-5" />
                Bonus Included: {pkg.bonus}
              </p>
            </div>
          )}

          {/* Price + Buy */}
          <Card className="border-0 bg-white/5 backdrop-blur-sm ring-1 ring-white/10">
            <CardContent className="p-5">
              <div className="flex items-end justify-between mb-5">
                <div>
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1">Total Price</p>
                  <div className="flex items-baseline gap-3">
                    <span className="text-4xl font-black text-white">
                      {pkg.discountPrice ?? pkg.price}
                      <span className="text-base font-medium text-muted-foreground ml-1">EGP</span>
                    </span>
                    {pkg.discountPrice && (
                      <span className="text-lg text-muted-foreground line-through decoration-red-500/50">
                        {pkg.price} EGP
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <Button
                size="lg"
                className="w-full text-lg py-7 font-bold bg-gradient-to-r from-gold-primary to-neon-pink hover:from-gold-secondary hover:to-neon-pink shadow-lg hover:shadow-gold-primary/25 transition-all duration-300 hover:scale-[1.02] gap-2"
                onClick={handleBuyNow}
              >
                <ShoppingBag className="w-5 h-5" />
                Buy Now — Complete in 3 Steps
              </Button>

              <p className="text-center text-xs text-muted-foreground mt-3">
                Fast · Secure · Instant delivery after payment
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Checkout Modal */}
      <Dialog open={checkoutOpen} onOpenChange={setCheckoutOpen}>
        <DialogContent className="max-w-2xl w-full max-h-[90vh] overflow-y-auto bg-background border border-white/10 p-0">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-white/10 sticky top-0 bg-background z-10">
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle className="text-xl font-bold">Complete Your Order</DialogTitle>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {pkg.name}
                  {pkg.discountPrice
                    ? ` — ${pkg.discountPrice} EGP`
                    : ` — ${pkg.price} EGP`
                  }
                </p>
              </div>
            </div>
          </DialogHeader>

          <div className="p-4 md:p-6">
            <CheckoutContent isEmbedded={true} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
