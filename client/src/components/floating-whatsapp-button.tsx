import { useMemo } from "react";
import { SiWhatsapp } from "react-icons/si";
import { useSettings } from "@/lib/settings-context";

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
      ? "right-4 bottom-4"
      : position === "bottom-left"
      ? "left-4 bottom-4"
      : position === "top-right"
      ? "right-4 top-4"
      : "left-4 top-4";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat on WhatsApp"
      className={`fixed z-50 ${positionClasses} group`}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/40 blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
        <button
          type="button"
          className="relative flex items-center justify-center w-14 h-14 rounded-full bg-green-500 text-white shadow-xl shadow-green-500/40 hover:bg-green-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-green-400 focus-visible:ring-offset-background transform transition-transform duration-200 group-hover:scale-110"
        >
          <SiWhatsapp className="w-7 h-7" />
        </button>
      </div>
    </a>
  );
}

