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
        whileHover={{ scale: 1.12 }}
        whileTap={{ scale: 0.95 }}
        className="relative"
      >
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0.2, 0.5] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute inset-0 rounded-full"
          style={{ backgroundColor: '#25D366' }}
        />
        <div
          className="relative flex items-center justify-center w-14 h-14 rounded-full shadow-2xl"
          style={{
            backgroundColor: '#25D366',
            boxShadow: '0 4px 24px 0 rgba(37,211,102,0.5)',
          }}
        >
          <SiWhatsapp className="w-7 h-7 text-white" />
        </div>
      </motion.div>
    </a>
  );
}
