import { Link } from "wouter";
import { Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { SiTelegram, SiTiktok } from "react-icons/si";

export function Footer() {
  return (
    <footer className="bg-card border-t border-gold-primary/15 mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-gold-primary/20 group-hover:border-gold-primary/50 transition-colors">
                  <img 
                    src="https://res.cloudinary.com/dznqaewj4/image/upload/v1/gaming-store/logo/small-logo.png" 
                    alt="Logo" 
                    className="w-8 h-8 object-contain"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                  Diaa Eldeen
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your premium destination for gaming currencies, gift cards, and instant digital delivery. Level up your gaming experience today.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/DiaElDeenSadek" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@diaa_eldeen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <SiTiktok className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@bemora-site" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <Youtube className="w-5 h-5" />
              </a>
              <a href="https://t.me/diaaeldeen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <SiTelegram className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-6 relative inline-block">
              Quick Links
              <span className="absolute -bottom-2 left-0 w-16 h-1.5 bg-gradient-to-r from-gold-primary to-neon-pink rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/" className="text-muted-foreground hover:text-gold-primary transition-colors flex items-center">
                  <span className="mr-2">›</span> Home
                </Link>
              </li>
              <li>
                <Link href="/games" className="text-muted-foreground hover:text-gold-primary transition-colors flex items-center">
                  <span className="mr-2">›</span> Browse Games
                </Link>
              </li>
              <li>
                <Link href="/support" className="text-muted-foreground hover:text-gold-primary transition-colors flex items-center">
                  <span className="mr-2">›</span> Support Center
                </Link>
              </li>
              <li>
                <Link href="/track-order" className="text-muted-foreground hover:text-gold-primary transition-colors flex items-center">
                  <span className="mr-2">›</span> Track Order
                </Link>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-6 relative inline-block">
              Support
              <span className="absolute -bottom-2 left-0 w-16 h-1.5 bg-gradient-to-r from-neon-pink to-gold-primary rounded-full"></span>
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/faq" className="text-muted-foreground hover:text-neon-pink transition-colors flex items-center">
                  <span className="mr-2">›</span> FAQ
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-neon-pink transition-colors flex items-center">
                  <span className="mr-2">›</span> Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-neon-pink transition-colors flex items-center">
                  <span className="mr-2">›</span> Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refunds" className="text-muted-foreground hover:text-neon-pink transition-colors flex items-center">
                  <span className="mr-2">›</span> Refund Policy
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-lg font-bold text-foreground mb-6 relative inline-block">
              Contact Us
              <span className="absolute -bottom-2 left-0 w-12 h-1 bg-gold-secondary rounded-full"></span>
            </h3>
            <ul className="space-y-4">
              <li className="flex items-start text-muted-foreground">
                <MapPin className="w-5 h-5 mr-3 text-gold-primary shrink-0" />
                <span>123 Gaming Street, Digital City, EG</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Phone className="w-5 h-5 mr-3 text-gold-primary shrink-0" />
                <span>+20 123 456 7890</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Mail className="w-5 h-5 mr-3 text-gold-primary shrink-0" />
                <span>support@diaaeldeen.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Diaa Eldeen. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <img src="https://upload.wikimedia.org/wikipedia/commons/b/b5/PayPal.svg" alt="PayPal" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" alt="Mastercard" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" alt="Visa" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all" />
            <img src="https://upload.wikimedia.org/wikipedia/commons/f/fa/Vodafone_2017_logo.svg" alt="Vodafone Cash" className="h-6 opacity-70 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </div>
    </footer>
  );
}
