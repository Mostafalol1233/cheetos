import { Link } from "wouter";
import { Facebook, Youtube, Mail, Phone, MapPin, Heart, ExternalLink } from "lucide-react";
import { SiTelegram, SiTiktok, SiWhatsapp, SiVodafone } from "react-icons/si";
import { FaPaypal, FaCcVisa, FaCcMastercard, FaGooglePay } from "react-icons/fa";
import { motion } from "framer-motion";

export function Footer() {
  const currentYear = new Date().getFullYear();

  const quickLinks = [
    { href: "/", label: "Home" },
    { href: "/games", label: "Browse Games" },
    { href: "/support", label: "Support Center" },
    { href: "/track-order", label: "Track Order" },
  ];

  const supportLinks = [
    { href: "/faq", label: "FAQ" },
    { href: "/terms", label: "Terms of Service" },
    { href: "/privacy", label: "Privacy Policy" },
    { href: "/refunds", label: "Refund Policy" },
  ];

  const socialLinks = [
    { href: "https://www.facebook.com/diaaaeldeen", icon: Facebook, label: "Facebook", hoverColor: "hover:text-[#1877F2] hover:shadow-[0_0_20px_rgba(24,119,242,0.5)]" },
    { href: "https://t.me/diaaeldeen1", icon: SiTelegram, label: "Telegram", hoverColor: "hover:text-[#0088cc] hover:shadow-[0_0_20px_rgba(0,136,204,0.5)]" },
    { href: "https://wa.me/201011696196", icon: SiWhatsapp, label: "WhatsApp", hoverColor: "hover:text-[#25D366] hover:shadow-[0_0_20px_rgba(37,211,102,0.5)]" },
    { href: "https://tiktok.com/@diaa_eldeen", icon: SiTiktok, label: "TikTok", hoverColor: "hover:text-foreground hover:shadow-[0_0_20px_rgba(255,255,255,0.3)]" },
    { href: "https://www.youtube.com/@bemora-site", icon: Youtube, label: "YouTube", hoverColor: "hover:text-[#FF0000] hover:shadow-[0_0_20px_rgba(255,0,0,0.5)]" },
  ];

  return (
    <footer className="relative mt-auto overflow-hidden">
      {/* Gradient Top Border */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-cyber-blue via-neon-purple to-neon-pink" />

      {/* Background Glow Effects */}
      <div className="absolute -top-40 -left-40 w-80 h-80 bg-cyber-blue/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-40 -right-40 w-80 h-80 bg-neon-purple/10 rounded-full blur-3xl" />

      {/* Back to Top */}
      <motion.button
        className="absolute bottom-8 right-8 p-3 rounded-full bg-cyber-blue/10 text-cyber-blue border border-cyber-blue/20 hover:bg-cyber-blue/20 transition-all z-10"
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        aria-label="Back to top"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6" /></svg>
      </motion.button>

      <div className="relative glass border-t border-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16">

            {/* Brand Column */}
            <motion.div
              className="space-y-6"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
            >
              <Link href="/">
                <div className="flex items-center gap-3 cursor-pointer group">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyber-blue to-neon-purple flex items-center justify-center shadow-glow-blue transition-transform group-hover:scale-110">
                      <span className="text-xl font-bold text-white font-gaming">D</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-xl font-bold font-gaming">
                      <span className="bg-gradient-to-r from-cyber-blue to-neon-purple bg-clip-text text-transparent">Diaa</span>
                      <span className="text-foreground ml-1">Store</span>
                    </span>
                    <p className="text-xs text-muted-foreground">Premium Gaming Store</p>
                  </div>
                </div>
              </Link>

              <p className="text-muted-foreground text-sm leading-relaxed">
                Your premium destination for gaming currencies, gift cards, and instant digital delivery. Level up your gaming experience today.
              </p>

              {/* Social Links */}
              <div className="flex items-center gap-3">
                {socialLinks.map((social) => (
                  <motion.a
                    key={social.label}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center text-muted-foreground transition-all duration-300 ${social.hoverColor}`}
                    whileHover={{ scale: 1.1, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label={social.label}
                  >
                    <social.icon className="w-5 h-5" />
                  </motion.a>
                ))}
              </div>
            </motion.div>

            {/* Quick Links */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                Quick Links
                <span className="flex-1 h-px bg-gradient-to-r from-cyber-blue/50 to-transparent" />
              </h3>
              <ul className="space-y-3">
                {quickLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span className="text-muted-foreground hover:text-cyber-blue transition-colors duration-300 flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-cyber-blue/50 group-hover:bg-cyber-blue group-hover:shadow-glow-blue transition-all" />
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Support */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                Support
                <span className="flex-1 h-px bg-gradient-to-r from-neon-purple/50 to-transparent" />
              </h3>
              <ul className="space-y-3">
                {supportLinks.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href}>
                      <span className="text-muted-foreground hover:text-neon-purple transition-colors duration-300 flex items-center gap-2 group">
                        <span className="w-1.5 h-1.5 rounded-full bg-neon-purple/50 group-hover:bg-neon-purple group-hover:shadow-glow-purple transition-all" />
                        {link.label}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>

            {/* Contact */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              viewport={{ once: true }}
            >
              <h3 className="text-lg font-bold text-foreground mb-6 flex items-center gap-2">
                Contact Us
                <span className="flex-1 h-px bg-gradient-to-r from-cyber-gold/50 to-transparent" />
              </h3>
              <ul className="space-y-4">
                <li className="flex items-start gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-cyber-blue/10 flex items-center justify-center shrink-0 group-hover:bg-cyber-blue/20 transition-colors">
                    <MapPin className="w-4 h-4 text-cyber-blue" />
                  </div>
                  <span className="text-sm">Cairo, Egypt</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-neon-purple/10 flex items-center justify-center shrink-0 group-hover:bg-neon-purple/20 transition-colors">
                    <Phone className="w-4 h-4 text-neon-purple" />
                  </div>
                  <span className="text-sm">+20 106 858 6636</span>
                </li>
                <li className="flex items-start gap-3 text-muted-foreground group">
                  <div className="w-8 h-8 rounded-lg bg-cyber-gold/10 flex items-center justify-center shrink-0 group-hover:bg-cyber-gold/20 transition-colors">
                    <Mail className="w-4 h-4 text-cyber-gold" />
                  </div>
                  <span className="text-sm">support@diaaeldeen.com</span>
                </li>
              </ul>
            </motion.div>
          </div>

          {/* Bottom Section */}
          <motion.div
            className="border-t border-white/5 mt-12 pt-8"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            viewport={{ once: true }}
          >
            <div className="flex flex-col md:flex-row justify-between items-center gap-6">
              {/* Copyright */}
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                © 2015–{currentYear} Diaa Eldeen. Made with
                <Heart className="w-4 h-4 text-neon-pink inline animate-pulse" />
                in Egypt
              </p>

              {/* Payment Methods */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground mr-2">Payment Methods:</span>
                <div className="flex items-center gap-3 text-2xl text-muted-foreground">
                  <FaCcVisa className="hover:text-[#1A1F71] transition-colors cursor-pointer" title="Visa" />
                  <FaCcMastercard className="hover:text-[#EB001B] transition-colors cursor-pointer" title="Mastercard" />
                  <FaPaypal className="hover:text-[#003087] transition-colors cursor-pointer" title="PayPal" />
                  <SiVodafone className="hover:text-[#E60000] transition-colors cursor-pointer" title="Vodafone Cash" />
                  <FaGooglePay className="hover:text-foreground transition-colors cursor-pointer" title="Google Pay" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </footer>
  );
}
