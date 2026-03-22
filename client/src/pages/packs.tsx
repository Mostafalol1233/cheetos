import React from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ProductPackGrid } from "@/components/product-pack-card";
import { useCart } from "@/lib/cart-context";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";
import { Gift, Package, ArrowLeft, ShoppingBag } from "lucide-react";
import { motion } from "framer-motion";

export default function PacksPage() {
  const { data: gamesRaw = [], isLoading } = useQuery<any>({ queryKey: ["/api/games"] });
  const games: any[] = Array.isArray(gamesRaw) ? gamesRaw : (gamesRaw?.items || []);
  const { addToCart } = useCart();
  const { language } = useTranslation();

  const packs = React.useMemo(() => {
    const out: any[] = [];
    (games || []).forEach((g: any) => {
      const packages = Array.isArray(g.packages) ? g.packages : [];
      const packagesList = Array.isArray(g.packagesList) ? g.packagesList : [];

      if (packages.length > 0 || packagesList.length > 0) {
        const items =
          packagesList.length > 0
            ? packagesList
            : packages.map((pkg: string, idx: number) => ({
                name: pkg,
                price: Number((g.packagePrices && g.packagePrices[idx]) || g.price || 0),
                discountPrice: Array.isArray(g.packageDiscountPrices) ? g.packageDiscountPrices[idx] : null,
                image: (g.packageThumbnails && g.packageThumbnails[idx]) || g.image,
                bonus: null,
              }));

        items.forEach((pkg: any, idx: number) => {
          const base = Number(pkg.price || 0);
          const discount = pkg.discountPrice != null ? Number(pkg.discountPrice) : null;
          const final =
            discount != null && Number.isFinite(discount) && discount > 0 && discount < base ? discount : base;
          const hasDiscount = final !== base;
          out.push({
            id: `${g.id}-pkg-${idx}`,
            name: pkg.name || pkg,
            gameName: g.name,
            originalPrice: hasDiscount ? base : null,
            finalPrice: final,
            currency: "EGP",
            image: pkg.image || g.image,
            bonus: pkg.bonus || null,
            href: `/package/${g.slug}/${idx}`,
          });
        });
      }
    });
    return out;
  }, [games]);

  const handleSelect = (id: string) => {
    const p = packs.find((x) => x.id === id);
    if (!p) return;
    addToCart({ id: p.id, name: `${p.gameName} - ${p.name}`, price: Number(p.finalPrice), image: p.image });
  };

  return (
    <>
      <SEO
        title={language === 'ar' ? "الباقات وبطاقات الهدايا - متجر ضياء" : "Packages & Gift Cards - Diaa Store"}
        description={language === 'ar'
          ? "تصفح جميع باقات الشحن وبطاقات الهدايا لأشهر الألعاب بأفضل الأسعار في مصر"
          : "Browse all top-up packages and gift cards for the most popular games at the best prices in Egypt"}
      />

      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-8">

          <div className="mb-2">
            <Link href="/">
              <button className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm">
                <ArrowLeft className="w-4 h-4" />
                {language === 'ar' ? 'العودة للرئيسية' : 'Back to Home'}
              </button>
            </Link>
          </div>

          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-gold-primary/15 border border-gold-primary/25 flex items-center justify-center">
                <Gift className="w-5 h-5 text-gold-primary" />
              </div>
              <h1 className="text-3xl font-bold text-foreground">
                {language === 'ar' ? 'الباقات وبطاقات الهدايا' : 'Packages & Gift Cards'}
              </h1>
            </div>
            <p className="text-muted-foreground text-sm mr-13">
              {language === 'ar'
                ? `${packs.length} باقة متاحة من جميع الألعاب`
                : `${packs.length} packages available across all games`}
            </p>
          </motion.div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="space-y-3">
                  <Skeleton className="h-[160px] w-full rounded-xl" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ))}
            </div>
          ) : packs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <Package className="w-16 h-16 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground">
                {language === 'ar' ? 'لا توجد باقات متاحة حالياً' : 'No packages available at the moment'}
              </p>
            </div>
          ) : (
            <section>
              <ProductPackGrid packs={packs} onSelectPack={handleSelect} />
            </section>
          )}
        </div>

        <Footer />
      </div>
    </>
  );
}
