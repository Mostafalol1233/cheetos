import { Link } from "wouter";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { useTranslation } from "@/lib/translation";
import { motion } from "framer-motion";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const { language } = useTranslation();

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-24">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center max-w-md w-full"
        >
          <div className="text-[120px] font-black leading-none text-foreground/5 select-none mb-2">
            404
          </div>
          <div className="-mt-8 mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-primary/10 border border-gold-primary/20 mb-4">
              <Search className="w-7 h-7 text-gold-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground mb-2">
              {language === 'ar' ? 'الصفحة غير موجودة' : 'Page Not Found'}
            </h1>
            <p className="text-muted-foreground text-sm">
              {language === 'ar'
                ? 'الصفحة التي تبحث عنها غير موجودة أو تم نقلها.'
                : 'The page you\'re looking for doesn\'t exist or has been moved.'}
            </p>
          </div>

          <Link href="/">
            <button className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-gold-primary text-black font-semibold text-sm hover:bg-gold-primary/90 transition-colors">
              <Home className="w-4 h-4" />
              {language === 'ar' ? 'العودة للرئيسية' : 'Go Home'}
            </button>
          </Link>
        </motion.div>
      </div>
      <Footer />
    </div>
  );
}
