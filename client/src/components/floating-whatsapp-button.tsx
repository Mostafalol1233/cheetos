import { useMemo } from "react";
import { SiWhatsapp } from "react-icons/si";
import { useSettings } from "@/lib/settings-context";
import { motion } from "framer-motion";

type Position =
  | "bottom-right"
  | "bottom-left"
  | "top-right"
  | "top-left";

interface FloatingWhatsAppButtonProps {
  position?: Position;
  messageTemplate?: string;
}

export function FloatingWhatsAppButton({
  position = "bottom-right",
  messageTemplate = "Hello, I need help with my order on Diaa Sadek Premium Game Store."
}: FloatingWhatsAppButtonProps) {
  const { settings } = useSettings();

  const href = useMemo(() => {
    if (!settings?.whatsappNumber) return null;
    const digits = String(settings.whatsappNumber).replace(/[^\d]/g, "");
    if (!digits) return null;
    const text = encodeURIComponent(messageTemplate);
    return `https://wa.me/${digits}?text=${text}`;
  }, [settings?.whatsappNumber, messageTemplate]);

  if (!href) return null;

  const positionClasses =
    position === "bottom-right"
      ? "right-5 bottom-5"
      : position === "bottom-left"
      ? "left-5 bottom-5"
      : position === "top-right"
      ? "right-5 top-5"
      : "left-5 top-5";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed z-50 ${positionClasses}`}
    >
      <motion.div
        whileHover={{ scale: 1.15 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        {/* Outer glow pulse */}
        <motion.div
          animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.2, 0.6] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: '#25D366' }}
        />
        {/* Inner shine layer */}
        <motion.div
          animate={{ 
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.2, 1]
          }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ 
            background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, transparent 70%)',
          }}
        />
        <div
          className="relative flex items-center justify-center w-16 h-16 rounded-full"
          style={{
            backgroundColor: '#25D366',
            boxShadow: '0 6px 30px 0 rgba(37,211,102,0.7), 0 0 20px 0 rgba(37,211,102,0.4)',
          }}
        >
          <SiWhatsapp className="w-8 h-8 text-white" />
        </div>
      </motion.div>
    </a>
  );
}
