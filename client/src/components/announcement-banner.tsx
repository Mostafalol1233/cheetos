import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { X, Megaphone } from "lucide-react";

interface Announcement {
  id: number;
  title: string;
  message: string;
  html_content: string | null;
  bg_color: string;
  text_color: string;
  icon: string;
  dismissible: boolean;
}

export function AnnouncementBanner() {
  const [dismissed, setDismissed] = useState<number | null>(null);

  const { data: announcement } = useQuery<Announcement | null>({
    queryKey: ["announcement-active"],
    queryFn: async () => {
      const res = await fetch("/api/announcements/active");
      if (!res.ok) return null;
      return res.json();
    },
    refetchInterval: 60000,
    staleTime: 30000,
  });

  useEffect(() => {
    if (!announcement) return;
    const key = `ann_dismissed_${announcement.id}`;
    if (localStorage.getItem(key)) {
      setDismissed(announcement.id);
    } else {
      setDismissed(null);
    }
  }, [announcement?.id]);

  const handleDismiss = () => {
    if (!announcement) return;
    localStorage.setItem(`ann_dismissed_${announcement.id}`, "1");
    setDismissed(announcement.id);
  };

  const show = announcement && dismissed !== announcement.id;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeInOut" }}
          style={{ backgroundColor: announcement.bg_color, color: announcement.text_color }}
          className="relative w-full z-[60] overflow-hidden"
        >
          {/* Shimmer overlay */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.08) 50%, transparent 60%)`,
            }}
          />

          <div className="relative max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-3 min-h-[44px]">
            {/* Icon */}
            <span className="text-xl shrink-0 drop-shadow-sm select-none">
              {announcement.icon || "📢"}
            </span>

            {/* Content */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-3 min-w-0">
              {announcement.title && (
                <span
                  className="font-black text-sm shrink-0 uppercase tracking-wide"
                  style={{ color: announcement.text_color }}
                >
                  {announcement.title}
                </span>
              )}
              {announcement.title && (
                <span className="hidden sm:block w-px h-4 shrink-0 opacity-40" style={{ backgroundColor: announcement.text_color }} />
              )}

              {announcement.html_content ? (
                <div
                  className="text-sm font-medium leading-snug min-w-0 [&_a]:underline [&_a]:font-bold [&_strong]:font-black [&_em]:italic"
                  style={{ color: announcement.text_color }}
                  dangerouslySetInnerHTML={{ __html: announcement.html_content }}
                />
              ) : (
                <p
                  className="text-sm font-medium leading-snug min-w-0 truncate"
                  style={{ color: announcement.text_color }}
                >
                  {announcement.message}
                </p>
              )}
            </div>

            {/* Dismiss */}
            {announcement.dismissible && (
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 transition-all duration-200 hover:scale-110 active:scale-95"
                style={{ backgroundColor: "rgba(0,0,0,0.2)" }}
                aria-label="Dismiss"
              >
                <X className="w-3.5 h-3.5" style={{ color: announcement.text_color }} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
