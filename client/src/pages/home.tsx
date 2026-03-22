import { useState, useEffect } from "react";
import { Zap, Headphones, Shield, Tag, ArrowRight, Sparkles, Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

import { ShoppingCategories } from "@/components/shopping-categories";
import { PopularGames } from "@/components/popular-games";
import PaymentMethods from "@/components/payment-methods";
import { HeroCarousel } from "@/components/hero-carousel";
import { Footer } from "@/components/footer";
import { useTranslation } from "@/lib/translation";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";

const features = [
  {
    icon: Zap,
    title: "Fast Delivery",
    description: "Instant delivery within minutes",
    gradient: "from-cyber-blue to-neon-purple",
    delay: 0,
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    description: "Always here to help you",
    gradient: "from-neon-purple to-neon-pink",
    delay: 0.1,
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "100% safe transactions",
    gradient: "from-electric-green to-cyber-blue",
    delay: 0.2,
  },
  {
    icon: Tag,
    title: "Best Prices",
    description: "Competitive rates guaranteed",
    gradient: "from-cyber-gold to-plasma-orange",
    delay: 0.3,
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers", icon: Trophy },
  { value: "50K+", label: "Orders Completed", icon: Sparkles },
  { value: "24/7", label: "Customer Support", icon: Clock },
];

const reviews = [
  { name: "Ahmed Hassan", initial: "A", text: "Fast delivery and great prices! Best gaming store in Egypt.", rating: 5 },
  { name: "Mohamed Ali", initial: "M", text: "Best gaming store 10/10. Highly recommended!", rating: 5 },
  { name: "Karim Mohamed", initial: "K", text: "Competitive prices and instant delivery. My go-to store!", rating: 5 },
];

export default function Home() {
  const { t } = useTranslation();

  return (
    <>
      <SEO
        title="متجر ضياء - شحن ألعاب إلكترونية في مصر | Diaa Gaming Store - أفضل متجر ألعاب"
        description="متجر ضياء أفضل متجر شحن ألعاب إلكترونية في مصر. اشحن عملات Free Fire, PUBG, وجميع الألعاب بأمان وسرعة مع Diaa Sadek. خدمة موثوقة وأسعار تنافسية."
        keywords={[
          "متجر ألعاب", "شحن ألعاب", "Diaa", "ضياء", "top up games Egypt",
          "شحن ألعاب إلكترونية", "gaming store Egypt", "Diaa Sadek", "متجر ضياء",
          "شحن عملات ألعاب", "ألعاب إلكترونية مصر", "top up Egypt", "gaming top up",
          "ضياء ألعاب", "Diaa gaming", "شحن ألعاب اونلاين", "متجر ألعاب مصر",
          "gaming store", "شحن ألعاب سريع", "Free Fire", "PUBG", "ألعاب موبايل"
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "متجر ضياء - الصفحة الرئيسية",
          "description": "اكتشف متجر ضياء لشحن ألعاب إلكترونية في مصر. شحن آمن وسريع لجميع الألعاب مع Diaa Sadek.",
          "url": window.location.origin,
          "isPartOf": {
            "@type": "WebSite",
            "name": "متجر ضياء",
            "url": window.location.origin
          }
        }}
      />

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-cyber-blue/20 rounded-full blur-[100px]" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-neon-purple/15 rounded-full blur-[120px]" />
            <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-neon-pink/10 rounded-full blur-[100px]" />
          </div>

          <div className="container mx-auto px-4 pt-8 relative z-10">
            <HeroCarousel />
          </div>
        </section>

        {/* Shopping Categories */}
        <div id="categories">
          <ShoppingCategories />
        </div>

        {/* Most Popular Games */}
        <PopularGames />

        {/* Features Section - Moved Here */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Choose <span className="text-cyber-blue">Diaa</span> Store?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the best gaming top-up service with unmatched speed, security, and support.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: feature.delay }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <div className="relative p-6 rounded-2xl glass border border-white/5 hover:border-cyber-blue/30 transition-all duration-300">
                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>

                  {/* Hover Glow */}
                  <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-cyber-blue/5 to-neon-purple/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10" />
                </div>
              </motion.div>
            ))}
          </div>
        </section>



        {/* About Section with Stats */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/10 via-amber-100/60 to-gold-secondary/20 dark:from-card dark:via-card dark:to-muted/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyber-blue/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl" />

            <div className="relative p-8 md:p-12 lg:p-16">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
                {/* Content */}
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                >
                  <h2 className="text-3xl md:text-4xl font-bold mb-6">
                    Welcome to <span className="bg-gradient-to-r from-cyber-blue via-neon-purple to-neon-pink bg-clip-text text-transparent">Diaa Store</span>
                  </h2>
                  <p className="text-muted-foreground text-lg mb-4">
                    {t('about_p1') || "Your trusted partner for gaming top-ups in Egypt. We offer fast, secure, and affordable services for all your favorite games."}
                  </p>
                  <p className="text-muted-foreground text-lg mb-8">
                    {t('about_p2') || "Join thousands of happy gamers who trust Diaa Store for their gaming currency needs."}
                  </p>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4">
                    {stats.map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: index * 0.1 }}
                        viewport={{ once: true }}
                        className="text-center p-4 rounded-xl glass border border-white/5"
                      >
                        <stat.icon className="w-6 h-6 text-cyber-blue mx-auto mb-2" />
                        <p className="text-2xl md:text-3xl font-bold bg-gradient-to-r from-cyber-blue to-neon-purple bg-clip-text text-transparent">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href="/games">
                    <Button className="mt-8 btn-gaming group">
                      Browse All Games
                      <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                </motion.div>

                {/* Logo/Image */}
                <motion.div
                  initial={{ opacity: 0, x: 30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.6 }}
                  viewport={{ once: true }}
                  className="relative"
                >
                  <div className="relative rounded-2xl overflow-hidden glass border border-white/10 p-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-cyber-blue/10 via-neon-purple/10 to-neon-pink/10 animate-gradient" style={{ backgroundSize: "200% 200%" }} />
                    <img
                      src="https://i.postimg.cc/zG8jHjqS/large-image-logo.png"
                      alt="Diaa Store Logo"
                      className="w-full max-w-md mx-auto h-auto object-contain relative z-10"
                    />
                  </div>
                </motion.div>
              </div>
            </div>
          </div>
        </section>

        {/* Customer Reviews */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              What Our <span className="text-neon-purple">Customers</span> Say
            </h2>
            <p className="text-muted-foreground">Trusted by thousands of gamers across Egypt</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="p-6 rounded-2xl glass border border-white/5 hover:border-neon-purple/30 transition-all duration-300"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center text-white font-bold text-lg">
                    {review.initial}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{review.name}</p>
                    <div className="flex text-cyber-gold">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <span key={i}>⭐</span>
                      ))}
                    </div>
                  </div>
                </div>
                <p className="text-muted-foreground">{review.text}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Payment Methods */}
        <section className="container mx-auto px-4 py-8">
          <PaymentMethods />
        </section>

        {/* Footer */}
        <Footer />
      </div>
    </>
  );
}
