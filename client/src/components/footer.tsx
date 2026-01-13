import { Link } from "wouter";
import { Facebook, Youtube, Mail, Phone, MapPin } from "lucide-react";
import { SiTelegram, SiTiktok, SiWhatsapp } from "react-icons/si";

const logo = "https://files.catbox.moe/brmkrj.png";

export function Footer() {
  return (
    <footer className="bg-card border-t border-gold-primary/15 mt-auto">
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="space-y-4">
            <Link href="/">
              <div className="flex items-center space-x-2 cursor-pointer group">
                <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center border border-gold-primary/20 group-hover:border-gold-primary/50 transition-colors overflow-hidden">
                  <img 
                    src={logo}
                    alt="Diaa Sadek Logo" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className="text-xl font-bold bg-gradient-to-r from-gold-primary to-neon-pink bg-clip-text text-transparent">
                  Diaa Sadek
                </span>
              </div>
            </Link>
            <p className="text-muted-foreground text-sm leading-relaxed">
              Your premium destination for gaming currencies, gift cards, and instant digital delivery. Level up your gaming experience today.
            </p>
            <div className="flex space-x-4">
              <a href="https://www.facebook.com/diaaaeldeen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <Facebook className="w-5 h-5" />
              </a>
              <a href="https://t.me/diaaeldeen1" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <SiTelegram className="w-5 h-5" />
              </a>
              <a href="https://wa.me/201029870810" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-green-500 transition-colors hover:scale-110 transform duration-200">
                <SiWhatsapp className="w-5 h-5" />
              </a>
              <a href="https://tiktok.com/@diaa_eldeen" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <SiTiktok className="w-5 h-5" />
              </a>
              <a href="https://www.youtube.com/@bemora-site" target="_blank" rel="noopener noreferrer" className="text-muted-foreground hover:text-gold-primary transition-colors hover:scale-110 transform duration-200">
                <Youtube className="w-5 h-5" />
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
                <span>Cairo, Egypt</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Phone className="w-5 h-5 mr-3 text-gold-primary shrink-0" />
                <span>+20 102 987 0810</span>
              </li>
              <li className="flex items-center text-muted-foreground">
                <Mail className="w-5 h-5 mr-3 text-gold-primary shrink-0" />
                <span>diaaeldeen@gmail.com</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 flex flex-col md:flex-row justify-between items-center text-sm text-muted-foreground">
          <p>© 2015–{new Date().getFullYear()} Diaa Eldeen. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            {/* PayPal */}
            <img 
              src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 32'%3E%3Cpath fill='%23003087' d='M11.6 11.6h-3.4l-.8 5.2h3.4c2.8 0 4.2-1.4 4.2-3.8 0-2.4-1.6-1.4-3.4-1.4z'/%3E%3Cpath fill='%23003087' d='M4.4 25.8h4.6l.6-3.8h2.6c3.8 0 6.6-1.8 6.6-6.4 0-4.4-3-6.4-7.4-6.4H4.4l-3.2 20.6h3.2z'/%3E%3Cpath fill='%23009cde' d='M43.2 11.6h-3.4l-.8 5.2h3.4c2.8 0 4.2-1.4 4.2-3.8 0-2.4-1.6-1.4-3.4-1.4z'/%3E%3Cpath fill='%23009cde' d='M36 25.8h4.6l.6-3.8h2.6c3.8 0 6.6-1.8 6.6-6.4 0-4.4-3-6.4-7.4-6.4H36l-3.2 20.6h3.2z'/%3E%3Cpath fill='%23003087' d='M22.8 11.6h-3.4l-.8 5.2h3.4c2.8 0 4.2-1.4 4.2-3.8 0-2.4-1.6-1.4-3.4-1.4z'/%3E%3Cpath fill='%23003087' d='M15.6 25.8h4.6l.6-3.8h2.6c3.8 0 6.6-1.8 6.6-6.4 0-4.4-3-6.4-7.4-6.4h-6.8l-3.2 20.6h3.2z'/%3E%3C/svg%3E"
              alt="PayPal" 
              className="h-8 w-auto hover:scale-110 transition-all bg-white rounded px-1" 
            />
            {/* Mastercard */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/2/2a/Mastercard-logo.svg" 
              alt="Mastercard" 
              className="h-8 w-auto hover:scale-110 transition-all shadow-sm rounded" 
            />
            {/* Visa */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/5/5e/Visa_Inc._logo.svg" 
              alt="Visa" 
              className="h-8 w-auto hover:scale-110 transition-all shadow-sm rounded" 
            />
            {/* Vodafone */}
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/1/1f/Vodafone_icon.svg" 
              alt="Vodafone Cash" 
              className="h-8 w-auto hover:scale-110 transition-all shadow-sm rounded" 
            />
          </div>
        </div>
      </div>
    </footer>
  );
}
