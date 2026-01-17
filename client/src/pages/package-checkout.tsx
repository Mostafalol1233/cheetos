import { useParams, useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Package, Gift, Zap, MessageCircle, Globe, CheckCircle, Shield, Clock } from "lucide-react";
import { SiWhatsapp } from "react-icons/si";
import { motion, AnimatePresence } from "framer-motion";
import type { Game } from "@shared/schema";
import ImageWithFallback from "@/components/image-with-fallback";
import { useTranslation } from "@/lib/translation";
import { useLocalization } from "@/lib/localization";
import { useLocalizedPrices } from "@/hooks/use-localized-prices";
import { SEO } from "@/components/SEO";
import { Footer } from "@/components/footer";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Link } from "wouter";

export default function PackageCheckoutPage() {
    const { gameSlug, packageIndex } = useParams();
    const pkgIndex = parseInt(packageIndex || "0", 10);
    const { t } = useTranslation();
    const [, setLocation] = useLocation();
    const [showChoiceModal, setShowChoiceModal] = useState(false);

    const { data: game, isLoading } = useQuery<Game>({
        queryKey: [`/api/games/${gameSlug}`],
    });

    const { currency } = useLocalization();
    const { prices: localizedPrices } = useLocalizedPrices(game?.id || game?.slug || '');

    if (isLoading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 border-4 border-cyber-blue border-t-transparent rounded-full animate-spin" />
                    <p className="text-muted-foreground">Loading package...</p>
                </div>
            </div>
        );
    }

    if (!game) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-3xl font-bold text-foreground mb-4">Package not found</h1>
                    <Link href="/">
                        <Button className="btn-gaming">Go Home</Button>
                    </Link>
                </div>
            </div>
        );
    }

    const packagesList = Array.isArray((game as any).packagesList) ? (game as any).packagesList : [];
    const packages = Array.isArray((game as any).packages) && (game as any).packages.length > 0
        ? (game as any).packages
        : packagesList.map((p: any) => p?.name || p?.amount || '').filter(Boolean);

    const packagePrices = Array.isArray((game as any).packagePrices) && (game as any).packagePrices.length > 0
        ? (game as any).packagePrices
        : packagesList.map((p: any) => p?.price ?? 0);

    const packageDiscountPrices = Array.isArray((game as any).packageDiscountPrices) && (game as any).packageDiscountPrices.length > 0
        ? (game as any).packageDiscountPrices
        : packagesList.map((p: any) => (p?.discountPrice ?? null));

    const packageBonuses = packagesList.map((p: any) => p?.bonus || null);

    const selectedPackage = packages[pkgIndex];
    const bonus = packageBonuses[pkgIndex];

    const getPackagePricing = () => {
        if (localizedPrices && localizedPrices[pkgIndex]) {
            const localized = localizedPrices[pkgIndex];
            return {
                base: localized.price,
                final: localized.price,
                original: null,
                currency: currency,
            };
        }

        const basePrice = Number(packagePrices[pkgIndex] ?? game.price ?? 0);
        const discountPrice = packageDiscountPrices[pkgIndex];
        const hasDiscount = discountPrice && discountPrice > 0 && discountPrice < basePrice;

        return {
            base: basePrice,
            final: hasDiscount ? discountPrice : basePrice,
            original: hasDiscount ? basePrice : null,
            currency: 'EGP',
        };
    };

    const pricing = getPackagePricing();
    const hasDiscount = pricing.original !== null;
    const discountPercent = hasDiscount
        ? Math.round((1 - pricing.final / pricing.original!) * 100)
        : 0;

    const formatPrice = (price: number, curr: string) => {
        return new Intl.NumberFormat('en-EG', {
            style: 'currency',
            currency: 'EGP',
            minimumFractionDigits: 0,
        }).format(price);
    };

    const handleBuyNow = () => {
        setShowChoiceModal(true);
    };

    const handleWhatsAppCheckout = () => {
        const orderSummary = `🎮 *New Order from Diaa Store*

📦 *Game:* ${game.name}
💎 *Package:* ${selectedPackage}
${bonus ? `🎁 *Bonus:* +${bonus}` : ''}
💰 *Price:* ${formatPrice(pricing.final, pricing.currency)}
${hasDiscount ? `~~${formatPrice(pricing.original!, pricing.currency)}~~ (-${discountPercent}%)` : ''}

I would like to purchase this package. Please let me know how to proceed.`;

        const whatsappNumber = "201011696196";
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(orderSummary)}`;
        window.open(whatsappUrl, '_blank');
        setShowChoiceModal(false);
    };

    const handleWebsiteCheckout = () => {
        // Store the selected package info in localStorage for checkout
        localStorage.setItem('checkout_package', JSON.stringify({
            gameId: game.id,
            gameSlug: gameSlug,
            gameName: game.name,
            gameImage: (game as any).image_url || game.image,
            packageIndex: pkgIndex,
            packageName: selectedPackage,
            bonus: bonus,
            price: pricing.final,
            originalPrice: pricing.original,
            currency: pricing.currency,
        }));
        setShowChoiceModal(false);
        setLocation('/checkout');
    };

    const features = [
        { icon: Shield, text: "Secure Payment" },
        { icon: Zap, text: "Instant Delivery" },
        { icon: Clock, text: "24/7 Support" },
    ];

    return (
        <>
            <SEO
                title={`شراء ${selectedPackage} - ${game.name} | متجر ضياء`}
                description={`اشتري ${selectedPackage} في ${game.name}. توصيل فوري وآمن.`}
                keywords={[game.name, selectedPackage, 'شحن', 'شراء']}
            />

            <div className="min-h-screen bg-background">
                {/* Background Effects */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-blue/10 rounded-full blur-[100px]" />
                    <div className="absolute bottom-20 right-20 w-96 h-96 bg-neon-purple/10 rounded-full blur-[120px]" />
                </div>

                <div className="container mx-auto px-4 pt-8 pb-12 relative z-10">
                    {/* Back Button */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        <Button
                            onClick={() => setLocation(`/game/${gameSlug}`)}
                            variant="ghost"
                            className="mb-6 hover:bg-cyber-blue/10 hover:text-cyber-blue rounded-xl"
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to {game.name}
                        </Button>
                    </motion.div>

                    <div className="max-w-4xl mx-auto">
                        <div className="grid md:grid-cols-2 gap-8 items-start">
                            {/* Package Card */}
                            <motion.div
                                initial={{ opacity: 0, x: -30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5 }}
                            >
                                <div className="relative rounded-3xl overflow-hidden glass border border-white/10 p-6">
                                    {/* Game Image Header */}
                                    <div className="relative rounded-2xl overflow-hidden mb-6">
                                        <ImageWithFallback
                                            src={(game as any).image_url || game.image}
                                            alt={game.name}
                                            className="w-full h-48 object-cover"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                        <div className="absolute bottom-4 left-4">
                                            <p className="text-white/70 text-sm">Game</p>
                                            <p className="text-white font-bold text-xl">{game.name}</p>
                                        </div>
                                    </div>

                                    {/* Package Info */}
                                    <div className="text-center">
                                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center mx-auto mb-4 shadow-glow-blue">
                                            <Package className="w-10 h-10 text-white" />
                                        </div>

                                        <h1 className="text-3xl font-bold text-foreground mb-2">
                                            {selectedPackage}
                                        </h1>

                                        {bonus && (
                                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-cyber-gold/20 text-cyber-gold font-bold mb-4">
                                                <Gift className="w-5 h-5" />
                                                +{bonus} Bonus
                                            </div>
                                        )}

                                        {/* Price */}
                                        <div className="mt-6 p-4 rounded-xl bg-muted/50">
                                            {hasDiscount && (
                                                <p className="text-muted-foreground line-through text-lg">
                                                    {formatPrice(pricing.original!, pricing.currency)}
                                                </p>
                                            )}
                                            <p className="text-4xl font-bold text-cyber-blue">
                                                {formatPrice(pricing.final, pricing.currency)}
                                            </p>
                                            {hasDiscount && (
                                                <span className="inline-block mt-2 px-3 py-1 rounded-full bg-neon-pink/20 text-neon-pink text-sm font-bold">
                                                    Save {discountPercent}%
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Checkout Options */}
                            <motion.div
                                initial={{ opacity: 0, x: 30 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ duration: 0.5, delay: 0.2 }}
                                className="space-y-6"
                            >
                                <div className="glass rounded-3xl border border-white/10 p-6">
                                    <h2 className="text-2xl font-bold text-foreground mb-6">Order Summary</h2>

                                    <div className="space-y-4 mb-6">
                                        <div className="flex justify-between items-center py-3 border-b border-white/10">
                                            <span className="text-muted-foreground">Package</span>
                                            <span className="font-bold text-foreground">{selectedPackage}</span>
                                        </div>
                                        {bonus && (
                                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                                <span className="text-muted-foreground">Bonus</span>
                                                <span className="font-bold text-cyber-gold">+{bonus}</span>
                                            </div>
                                        )}
                                        {hasDiscount && (
                                            <div className="flex justify-between items-center py-3 border-b border-white/10">
                                                <span className="text-muted-foreground">Discount</span>
                                                <span className="font-bold text-neon-pink">-{discountPercent}%</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center py-3">
                                            <span className="text-lg font-bold text-foreground">Total</span>
                                            <span className="text-2xl font-bold text-cyber-blue">
                                                {formatPrice(pricing.final, pricing.currency)}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Buy Button */}
                                    <Button
                                        onClick={handleBuyNow}
                                        className="w-full btn-gaming py-6 text-lg group"
                                    >
                                        <Zap className="w-5 h-5 mr-2 group-hover:animate-pulse" />
                                        Buy Now
                                    </Button>

                                    {/* Features */}
                                    <div className="flex justify-center gap-6 mt-6">
                                        {features.map((feature) => (
                                            <div key={feature.text} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <feature.icon className="w-4 h-4 text-cyber-blue" />
                                                {feature.text}
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Trust Badges */}
                                <div className="flex items-center justify-center gap-4 text-muted-foreground text-sm">
                                    <CheckCircle className="w-5 h-5 text-electric-green" />
                                    <span>Trusted by 10,000+ gamers</span>
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </div>

                {/* Checkout Choice Modal */}
                <Dialog open={showChoiceModal} onOpenChange={setShowChoiceModal}>
                    <DialogContent className="glass border-white/10 max-w-md">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-bold text-center">
                                How would you like to complete your order?
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 mt-6">
                            {/* WhatsApp Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleWhatsAppCheckout}
                                className="w-full p-6 rounded-2xl bg-[#25D366]/10 border border-[#25D366]/30 hover:border-[#25D366] transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-[#25D366] flex items-center justify-center shadow-lg group-hover:shadow-[0_0_20px_rgba(37,211,102,0.5)] transition-shadow">
                                        <SiWhatsapp className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-bold text-foreground text-lg">WhatsApp</p>
                                        <p className="text-sm text-muted-foreground">Chat directly with seller</p>
                                    </div>
                                    <MessageCircle className="w-5 h-5 text-muted-foreground group-hover:text-[#25D366] transition-colors" />
                                </div>
                            </motion.button>

                            {/* Website Option */}
                            <motion.button
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.98 }}
                                onClick={handleWebsiteCheckout}
                                className="w-full p-6 rounded-2xl bg-cyber-blue/10 border border-cyber-blue/30 hover:border-cyber-blue transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center shadow-lg group-hover:shadow-glow-blue transition-shadow">
                                        <Globe className="w-8 h-8 text-white" />
                                    </div>
                                    <div className="text-left flex-1">
                                        <p className="font-bold text-foreground text-lg">Website</p>
                                        <p className="text-sm text-muted-foreground">Complete order here</p>
                                    </div>
                                    <Zap className="w-5 h-5 text-muted-foreground group-hover:text-cyber-blue transition-colors" />
                                </div>
                            </motion.button>
                        </div>

                        <p className="text-center text-sm text-muted-foreground mt-4">
                            Choose your preferred checkout method
                        </p>
                    </DialogContent>
                </Dialog>

                <Footer />
            </div>
        </>
    );
}
