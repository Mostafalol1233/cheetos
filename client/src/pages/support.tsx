import { ArrowLeft, MessageCircle, Mail, Clock, HelpCircle, Headphones, Zap, Shield } from "lucide-react";
import { SiWhatsapp, SiTelegram, SiFacebook } from "react-icons/si";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useEffect, useState } from "react";

export default function SupportPage() {
  const [contactInfo, setContactInfo] = useState<{ instapay: string | null; cash_numbers: string[]; paypal: string | null; etisalat_cash: string | null } | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/contact-info");
        if (!res.ok) return;
        const data = await res.json();
        setContactInfo({
          instapay: data?.instapay ?? null,
          cash_numbers: Array.isArray(data?.cash_numbers) ? data.cash_numbers : [],
          paypal: data?.paypal ?? null,
          etisalat_cash: data?.etisalat_cash ?? null,
        });
      } catch { }
    })();
  }, []);

  const formatWhatsAppLink = (): string | null => {
    const pick = contactInfo?.etisalat_cash || contactInfo?.instapay || contactInfo?.cash_numbers?.[0] || null;
    if (!pick) return null;
    const digits = String(pick).replace(/[^\d]/g, "");
    if (!digits) return null;
    return `https://wa.me/${digits}`;
  };

  const whatsappHref = formatWhatsAppLink();
  const telegramHref = "https://t.me/diaaeldeen1";
  const facebookHref = "https://www.facebook.com/diaaaeldeen";
  const etisalatCash = contactInfo?.etisalat_cash || null;

  return (
    <div className="min-h-screen bg-background text-foreground">

      {/* Hero Section */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#0d1b2a] via-[#1a2a4a] to-[#0a1628] py-16 px-4">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(6,182,212,0.15)_0%,_transparent_70%)]" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-purple-500/5 rounded-full blur-3xl" />

        <div className="container mx-auto relative z-10">
          <Link href="/" className="inline-flex items-center text-cyan-400/70 hover:text-cyan-400 transition-colors mb-8 text-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Home
          </Link>

          <div className="text-center">
            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-cyan-500/30">
              <Headphones className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white mb-3">
              Customer <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">Support</span>
            </h1>
            <p className="text-gray-400 text-lg max-w-md mx-auto">We're here to help you 24/7 — reach us on any platform</p>

            <div className="flex flex-wrap justify-center gap-6 mt-8">
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Online Now
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Zap className="w-4 h-4 text-yellow-400" />
                Instant Replies
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-400">
                <Shield className="w-4 h-4 text-cyan-400" />
                Secure & Trusted
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">

          {/* WhatsApp */}
          <div className="relative group rounded-2xl border border-green-500/20 bg-gradient-to-br from-green-950/30 to-card overflow-hidden hover:border-green-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-green-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-green-500/30 group-hover:scale-110 transition-transform duration-300">
                <SiWhatsapp className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">WhatsApp</h3>
              <p className="text-gray-400 text-sm mb-2">Chat with us instantly</p>
              <span className="inline-block text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full mb-4">Fastest Response</span>
              {etisalatCash && (
                <p className="text-xs text-gray-500 mb-4">{etisalatCash}</p>
              )}
              <a href={whatsappHref ?? "#"} target="_blank" rel="noopener noreferrer" className="block">
                <Button className="w-full bg-green-600 hover:bg-green-500 text-white font-bold shadow-md shadow-green-500/20 transition-all" disabled={!whatsappHref}>
                  <SiWhatsapp className="w-4 h-4 mr-2" />
                  Start Chat
                </Button>
              </a>
            </div>
          </div>

          {/* Telegram */}
          <div className="relative group rounded-2xl border border-sky-500/20 bg-gradient-to-br from-sky-950/30 to-card overflow-hidden hover:border-sky-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-sky-500/10">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-sky-400 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-sky-500/30 group-hover:scale-110 transition-transform duration-300">
                <SiTelegram className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Telegram</h3>
              <p className="text-gray-400 text-sm mb-2">Join our support channel</p>
              <span className="inline-block text-xs bg-sky-500/20 text-sky-400 px-2 py-1 rounded-full mb-4">Community Updates</span>
              <a href={telegramHref} target="_blank" rel="noopener noreferrer" className="block mt-6">
                <Button className="w-full bg-sky-500 hover:bg-sky-400 text-white font-bold shadow-md shadow-sky-500/20 transition-all">
                  <SiTelegram className="w-4 h-4 mr-2" />
                  Join Channel
                </Button>
              </a>
            </div>
          </div>

          {/* Facebook */}
          <div className="relative group rounded-2xl border border-blue-600/20 bg-gradient-to-br from-blue-950/30 to-card overflow-hidden hover:border-blue-600/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/10">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="relative p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform duration-300">
                <SiFacebook className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Facebook</h3>
              <p className="text-gray-400 text-sm mb-2">Follow us for updates</p>
              <span className="inline-block text-xs bg-blue-500/20 text-blue-400 px-2 py-1 rounded-full mb-4">News & Offers</span>
              <a href={facebookHref} target="_blank" rel="noopener noreferrer" className="block mt-6">
                <Button className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold shadow-md shadow-blue-500/20 transition-all">
                  <SiFacebook className="w-4 h-4 mr-2" />
                  Follow Us
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Support Hours + FAQ in 2 cols */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">

          {/* Support Hours */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl flex items-center justify-center">
                <Clock className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Support Hours</h2>
            </div>
            <div className="space-y-4">
              <div className="flex items-start justify-between py-3 border-b border-border/50">
                <div>
                  <p className="font-semibold text-foreground text-sm">Live Chat</p>
                  <p className="text-xs text-muted-foreground">WhatsApp & Telegram</p>
                </div>
                <span className="text-xs bg-green-500/20 text-green-400 px-2 py-1 rounded-full font-medium">24/7 Available</span>
              </div>
              <div className="flex items-start justify-between py-3">
                <div>
                  <p className="font-semibold text-foreground text-sm">Phone Support</p>
                  <p className="text-xs text-muted-foreground">Sat – Thu</p>
                </div>
                <span className="text-xs bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full font-medium">9 AM – 11 PM</span>
              </div>
            </div>
          </div>

          {/* FAQ Quick */}
          <div className="rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-white" />
              </div>
              <h2 className="text-lg font-bold text-foreground">Quick FAQ</h2>
            </div>
            <div className="space-y-3">
              {[
                { q: "How do I get my game codes?", a: "Instantly via email & SMS after payment." },
                { q: "What payment methods?", a: "Cards, mobile wallet, bank transfer, crypto." },
                { q: "Can I get a refund?", a: "Within 24 hours if codes are unused." },
                { q: "How long does delivery take?", a: "Instant — up to 5 min during peak hours." },
              ].map((item, i) => (
                <div key={i} className="py-2 border-b border-border/40 last:border-0">
                  <p className="text-sm font-semibold text-foreground mb-1">{item.q}</p>
                  <p className="text-xs text-muted-foreground">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="rounded-2xl border border-border bg-card p-8">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-foreground">Send us a Message</h2>
              <p className="text-xs text-muted-foreground">We'll get back to you within a few hours</p>
            </div>
          </div>

          <form className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name" className="text-sm font-medium mb-1.5 block">Name</Label>
                <Input id="name" placeholder="Your full name" className="bg-muted/50 border-border/60 focus:border-cyan-500/50" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm font-medium mb-1.5 block">Email</Label>
                <Input id="email" type="email" placeholder="your@email.com" className="bg-muted/50 border-border/60 focus:border-cyan-500/50" />
              </div>
            </div>
            <div>
              <Label htmlFor="subject" className="text-sm font-medium mb-1.5 block">Subject</Label>
              <Input id="subject" placeholder="How can we help you?" className="bg-muted/50 border-border/60 focus:border-cyan-500/50" />
            </div>
            <div>
              <Label htmlFor="message" className="text-sm font-medium mb-1.5 block">Message</Label>
              <Textarea id="message" placeholder="Describe your issue in detail..." rows={5} className="bg-muted/50 border-border/60 focus:border-cyan-500/50 resize-none" />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition-all">
              <Mail className="w-4 h-4 mr-2" />
              Send Message
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
}
