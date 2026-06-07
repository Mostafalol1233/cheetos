import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";
import { Link } from "wouter";

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
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="relative w-full z-[60] overflow-hidden"
          style={{ background: announcement.bg_color }}
        >
          {/* Left accent bar */}
          <div className="absolute left-0 top-0 bottom-0 w-[3px]"
            style={{ background: `${announcement.text_color}50` }} />

          {/* Subtle inner shimmer */}
          <div className="absolute inset-0 pointer-events-none"
            style={{ background: "linear-gradient(105deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%)" }} />

          <div className="relative max-w-7xl mx-auto px-5 py-2.5 flex items-center gap-3 min-h-[44px]">

            {/* Icon */}
            <span className="text-base shrink-0 select-none leading-none">
              {announcement.icon || "📢"}
            </span>

            {/* Divider */}
            <div className="shrink-0 w-px h-4 rounded-full opacity-30"
              style={{ background: announcement.text_color }} />

            {/* Content */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline gap-0 sm:gap-2.5 min-w-0">
              {announcement.title && (
                <span className="text-[11px] font-black uppercase tracking-[0.18em] shrink-0"
                  style={{ color: announcement.text_color, fontFamily: "ui-monospace,monospace", opacity: 0.7 }}>
                  {announcement.title}
                </span>
              )}

              {announcement.html_content ? (
                <div
                  className="text-[13px] font-semibold leading-snug min-w-0 [&_a]:underline [&_a]:font-bold [&_a]:underline-offset-2 [&_strong]:font-black [&_em]:italic truncate"
                  style={{ color: announcement.text_color }}
                  dangerouslySetInnerHTML={{ __html: announcement.html_content }}
                />
              ) : (
                <p className="text-[13px] font-semibold leading-snug min-w-0 truncate"
                  style={{ color: announcement.text_color }}>
                  {announcement.message}
                </p>
              )}
            </div>

            {/* View giveaway link — shown if announcement mentions giveaway */}
            {(announcement.message?.toLowerCase().includes("giveaway") ||
              announcement.title?.toLowerCase().includes("giveaway") ||
              announcement.html_content?.toLowerCase().includes("giveaway")) && (
              <Link href="/giveaway">
                <span className="shrink-0 hidden sm:inline-flex text-[11px] font-black uppercase tracking-widest px-3 py-1 rounded-md transition-all cursor-pointer"
                  style={{
                    background: `${announcement.text_color}15`,
                    border: `1px solid ${announcement.text_color}30`,
                    color: announcement.text_color,
                    fontFamily: "ui-monospace,monospace",
                  }}>
                  عرض السحب →
                </span>
              </Link>
            )}

            {/* Dismiss */}
            {announcement.dismissible && (
              <button
                onClick={handleDismiss}
                className="shrink-0 rounded-full p-1 transition-all duration-150 hover:scale-110 active:scale-95"
                style={{ background: "rgba(0,0,0,0.15)" }}
                aria-label="Dismiss"
              >
                <X className="w-3 h-3" style={{ color: announcement.text_color, opacity: 0.7 }} />
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
