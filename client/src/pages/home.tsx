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
import { ReviewsMarquee } from "@/components/reviews-marquee";

const features = [
  {
    icon: Zap,
    title: "Fast Delivery",
    titleAr: "تسليم سريع",
    description: "Instant delivery within minutes",
    descAr: "تسليم فوري خلال دقائق",
    gradient: "from-cyber-blue to-neon-purple",
    color: "text-yellow-400",
    bg: "bg-yellow-500/15 border-yellow-500/25",
    delay: 0,
    animType: "bounce",
  },
  {
    icon: Headphones,
    title: "24/7 Support",
    titleAr: "دعم على مدار الساعة",
    description: "Always here to help you",
    descAr: "دائماً هنا لمساعدتك",
    gradient: "from-neon-purple to-neon-pink",
    color: "text-purple-400",
    bg: "bg-purple-500/15 border-purple-500/25",
    delay: 0.1,
    animType: "spin",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    titleAr: "دفع آمن",
    description: "100% safe transactions",
    descAr: "معاملات آمنة 100%",
    gradient: "from-electric-green to-cyber-blue",
    color: "text-emerald-400",
    bg: "bg-emerald-500/15 border-emerald-500/25",
    delay: 0.2,
    animType: "pulse",
  },
  {
    icon: Tag,
    title: "Best Prices",
    titleAr: "أفضل الأسعار",
    description: "Competitive rates guaranteed",
    descAr: "أسعار تنافسية مضمونة",
    gradient: "from-cyber-gold to-plasma-orange",
    color: "text-gold-primary",
    bg: "bg-gold-primary/15 border-gold-primary/25",
    delay: 0.3,
    animType: "shake",
  },
];

const stats = [
  { value: "10K+", label: "Happy Customers", labelAr: "عميل سعيد", icon: Trophy },
  { value: "50K+", label: "Orders Completed", labelAr: "طلب مكتمل", icon: Sparkles },
  { value: "24/7", label: "Customer Support", labelAr: "دعم العملاء", icon: Clock },
];

const reviews = [
  { name: "Ahmed Hassan", initial: "A", text: "Fast delivery and great prices! Best gaming store in Egypt.", textAr: "تسليم سريع وأسعار رائعة! أفضل متجر ألعاب في مصر.", rating: 5 },
  { name: "Mohamed Ali", initial: "M", text: "Best gaming store 10/10. Highly recommended!", textAr: "أفضل متجر ألعاب 10/10. أنصح بشدة!", rating: 5 },
  { name: "Karim Mohamed", initial: "K", text: "Competitive prices and instant delivery. My go-to store!", textAr: "أسعار تنافسية وتسليم فوري. متجري المفضل!", rating: 5 },
];

export default function Home() {
  const { t, language } = useTranslation();

  return (
    <>
      <SEO
        title="متجر ضياء - شحن ألعاب اونلاين في مصر | أرخص أسعار فري فاير PUBG"
        description="متجر ضياء أفضل وأرخص متجر شحن ألعاب إلكترونية في مصر. شحن فري فاير دايموندز، PUBG UC، روبلوكس، فورتنايت وكل الألعاب. دفع عبر فودافون كاش وإنستاباي. تسليم فوري."
        keywords={[
          "شحن ألعاب اونلاين مصر", "متجر شحن ألعاب مصر", "شحن فري فاير مصر",
          "شحن PUBG مصر", "شحن ببجي مصر", "دايموندز فري فاير",
          "PUBG UC Egypt", "Free Fire diamonds Egypt", "شحن روبلوكس مصر",
          "شحن فورتنايت مصر", "شحن ألعاب فودافون كاش", "شحن ألعاب انستاباي",
          "متجر ضياء", "Diaa Sadek", "ضياء ألعاب", "Diaa gaming store",
          "top up games Egypt cheap", "gaming top up Egypt", "أرخص شحن ألعاب مصر",
          "كروس فاير", "هونر أوف كينجز", "كارت ستيم", "بلايستيشن ستور",
          "شحن عملات ألعاب", "gaming store egypt"
        ]}
        structuredData={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          "name": "متجر ضياء",
          "alternateName": "Diaa Gaming Store",
          "description": "أرخص وأفضل متجر شحن ألعاب إلكترونية في مصر",
          "url": window.location.origin,
          "potentialAction": {
            "@type": "SearchAction",
            "target": {
              "@type": "EntryPoint",
              "urlTemplate": `${window.location.origin}/games?q={search_term_string}`
            },
            "query-input": "required name=search_term_string"
          }
        }}
      />

      <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
        {/* Hero Section */}
        <section className="relative">
          {/* Background Effects */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-20 left-10 w-72 h-72 bg-gold-primary/8 rounded-full blur-[100px]" />
            <div className="absolute top-40 right-20 w-96 h-96 bg-gold-primary/5 rounded-full blur-[120px]" />
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

        {/* Features Section - Why Choose Diaa Store */}
        <section className="container mx-auto px-4 py-20">
          <motion.div
            className="text-center mb-12"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              {language === 'ar' ? (
                <>لماذا تختار متجر <span className="text-gold-primary">ضياء</span>؟</>
              ) : (
                <>Why Choose <span className="text-gold-primary">Diaa</span> Store?</>
              )}
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {language === 'ar'
                ? 'استمتع بأفضل خدمة شحن ألعاب بسرعة وأمان ودعم لا مثيل له.'
                : 'Experience the best gaming top-up service with unmatched speed, security, and support.'
              }
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
                whileHover={{ y: -10, scale: 1.03 }}
                className="group"
              >
                <div className="relative p-6 rounded-2xl glass border border-white/5 hover:border-gold-primary/30 transition-all duration-300 overflow-hidden">
                  {/* Advanced Icon Animations */}
                  <div className={`relative w-16 h-16 rounded-2xl ${feature.bg} border flex items-center justify-center mb-5 shadow-lg overflow-visible`}>

                    {/* LIGHTNING (Zap) */}
                    {feature.animType === 'bounce' && (
                      <div className="relative flex items-center justify-center w-full h-full">
                        {/* Electric arc rings */}
                        {[1, 2].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full border border-yellow-400/60"
                            style={{ width: 52 + i * 14, height: 52 + i * 14 }}
                            animate={{ opacity: [0, 0.8, 0], scale: [0.6, 1.3, 1.6] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15, repeatDelay: 2.8, ease: "easeOut" }}
                          />
                        ))}
                        {/* The actual flash overlay */}
                        <motion.div
                          className="absolute inset-0 rounded-xl bg-yellow-300/80"
                          animate={{ opacity: [0, 0, 0.9, 0.3, 0.8, 0, 0] }}
                          transition={{ duration: 0.5, repeat: Infinity, repeatDelay: 3, times: [0, 0.3, 0.4, 0.5, 0.6, 0.7, 1] }}
                        />
                        <motion.div
                          animate={{
                            scale: [1, 1, 1.6, 0.8, 1.4, 1, 1],
                            rotate: [0, 0, -12, 12, -6, 0, 0],
                            filter: [
                              "drop-shadow(0 0 4px #fbbf24)",
                              "drop-shadow(0 0 4px #fbbf24)",
                              "drop-shadow(0 0 30px #fff) brightness(3)",
                              "drop-shadow(0 0 15px #fbbf24)",
                              "drop-shadow(0 0 25px #fff) brightness(2)",
                              "drop-shadow(0 0 8px #fbbf24)",
                              "drop-shadow(0 0 4px #fbbf24)",
                            ],
                          }}
                          transition={{ duration: 0.6, repeat: Infinity, repeatDelay: 3, times: [0, 0.3, 0.4, 0.5, 0.6, 0.8, 1] }}
                        >
                          <Zap className="w-8 h-8 text-yellow-400 relative z-10 fill-yellow-400/30" />
                        </motion.div>
                      </div>
                    )}

                    {/* HEADPHONES (Sound Waves) */}
                    {feature.animType === 'spin' && (
                      <div className="relative flex items-center justify-center w-full h-full">
                        {[1, 2, 3].map((i) => (
                          <motion.div
                            key={i}
                            className="absolute rounded-full border border-purple-400/50"
                            style={{ width: 40 + i * 18, height: 40 + i * 18 }}
                            animate={{ opacity: [0.7, 0], scale: [0.7, 1.6] }}
                            transition={{ duration: 1.6, repeat: Infinity, delay: i * 0.45, ease: "easeOut" }}
                          />
                        ))}
                        <motion.div
                          animate={{ rotate: [0, -8, 8, -5, 0], scale: [1, 1.05, 1] }}
                          transition={{ duration: 2, repeat: Infinity, repeatDelay: 0.5, ease: "easeInOut" }}
                        >
                          <Headphones className="w-8 h-8 text-purple-400 relative z-10" />
                        </motion.div>
                      </div>
                    )}

                    {/* SHIELD (Shield + Swords Morph) */}
                    {feature.animType === 'pulse' && (
                      <div className="relative flex items-center justify-center w-full h-full">
                        {/* Rotating aura */}
                        <motion.div
                          className="absolute inset-0 rounded-xl border border-emerald-400/40"
                          animate={{ scale: [1, 1.4, 1], opacity: [0.8, 0, 0.6], rotate: [0, 90, 180] }}
                          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                        {/* Crossed swords SVG overlay */}
                        <motion.svg
                          viewBox="0 0 64 64"
                          className="absolute inset-0 w-full h-full"
                          animate={{ opacity: [0, 0, 1, 1, 0], scale: [0.5, 0.5, 1, 1, 1.2] }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5, times: [0, 0.3, 0.5, 0.8, 1] }}
                        >
                          <line x1="14" y1="50" x2="50" y2="14" stroke="#34d399" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                          <line x1="50" y1="50" x2="14" y2="14" stroke="#34d399" strokeWidth="3" strokeLinecap="round" opacity="0.9" />
                          <circle cx="14" cy="50" r="3" fill="#34d399" opacity="0.8" />
                          <circle cx="50" cy="50" r="3" fill="#34d399" opacity="0.8" />
                          <circle cx="14" cy="14" r="2" fill="#34d399" opacity="0.6" />
                          <circle cx="50" cy="14" r="2" fill="#34d399" opacity="0.6" />
                        </motion.svg>
                        <motion.div
                          animate={{
                            scale: [1, 1.2, 1, 1.15, 1],
                            filter: [
                              "drop-shadow(0 0 0px transparent)",
                              "drop-shadow(0 0 20px #34d399)",
                              "drop-shadow(0 0 5px #34d399)",
                              "drop-shadow(0 0 18px #34d399)",
                              "drop-shadow(0 0 2px transparent)",
                            ],
                          }}
                          transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 0.5 }}
                        >
                          <Shield className="w-8 h-8 text-emerald-400 relative z-10" />
                        </motion.div>
                      </div>
                    )}

                    {/* TAG (Swing + Sparkles) */}
                    {feature.animType === 'shake' && (
                      <div className="relative flex items-center justify-center w-full h-full overflow-visible">
                        {/* Sparkle dots */}
                        {[
                          { top: "-8px", left: "-8px", delay: 0 },
                          { top: "-8px", right: "-8px", delay: 0.3 },
                          { bottom: "-8px", left: "-8px", delay: 0.6 },
                          { bottom: "-8px", right: "-8px", delay: 0.9 },
                          { top: "50%", left: "-12px", delay: 0.45 },
                          { top: "50%", right: "-12px", delay: 0.75 },
                        ].map((pos, i) => (
                          <motion.div
                            key={i}
                            className="absolute w-2 h-2 rounded-full bg-gold-primary"
                            style={pos as any}
                            animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0] }}
                            transition={{ duration: 0.8, repeat: Infinity, delay: pos.delay, repeatDelay: 1.5 }}
                          />
                        ))}
                        <motion.div
                          animate={{
                            rotate: [0, -15, 15, -10, 10, -5, 5, 0],
                            y: [0, -2, 2, -1, 1, 0],
                          }}
                          transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                          style={{ transformOrigin: "top center" }}
                        >
                          <Tag className="w-8 h-8 text-gold-primary relative z-10" />
                        </motion.div>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <h3 className="text-lg font-bold text-foreground mb-2 group-hover:text-gold-primary transition-colors">
                    {language === 'ar' ? feature.titleAr : feature.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {language === 'ar' ? feature.descAr : feature.description}
                  </p>

                  {/* Hover Glow */}
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-gold-primary/5 to-transparent -z-10"
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                    transition={{ duration: 0.3 }}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </section>



        {/* About Section with Stats */}
        <section className="container mx-auto px-4 py-20">
          <div className="relative rounded-3xl overflow-hidden">
            {/* Background */}
            <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-transparent dark:from-card dark:via-card dark:to-muted/20" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gold-primary/5 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-80 h-80 bg-gold-primary/3 rounded-full blur-3xl" />

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
                    {language === 'ar' ? (
                      <>مرحباً بك في <span className="text-gold-primary">متجر ضياء</span></>
                    ) : (
                      <>Welcome to <span className="text-gold-primary">Diaa Store</span></>
                    )}
                  </h2>
                  <p className="text-muted-foreground text-lg mb-4">
                    {t('about_p1')}
                  </p>
                  <p className="text-muted-foreground text-lg mb-8">
                    {t('about_p2')}
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
                        <stat.icon className="w-6 h-6 text-gold-primary mx-auto mb-2" />
                        <p className="text-2xl md:text-3xl font-bold text-gold-primary">
                          {stat.value}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {language === 'ar' ? stat.labelAr : stat.label}
                        </p>
                      </motion.div>
                    ))}
                  </div>

                  {/* CTA */}
                  <Link href="/games">
                    <Button className="mt-8 btn-gaming group">
                      {language === 'ar' ? 'تصفح كل الألعاب' : 'Browse All Games'}
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
                    <div className="absolute inset-0 bg-gradient-to-br from-gold-primary/5 to-transparent" />
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

        {/* Customer Reviews - Scrolling Marquee */}
        <section className="py-16 overflow-hidden">
          <div className="container mx-auto px-4 mb-8">
            <motion.div
              className="text-center"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <h2 className="text-3xl md:text-4xl font-bold mb-3">
                {language === 'ar' ? (
                  <>ماذا يقول <span className="text-gold-primary">عملاؤنا</span></>
                ) : (
                  <>What Our <span className="text-gold-primary">Customers</span> Say</>
                )}
              </h2>
              <p className="text-muted-foreground">
                {language === 'ar' ? 'موثوق من آلاف اللاعبين في مصر والعالم العربي' : 'Trusted by thousands of gamers across Egypt'}
              </p>
            </motion.div>
          </div>
          <ReviewsMarquee />
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
