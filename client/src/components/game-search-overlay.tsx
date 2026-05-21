import { useState, useEffect, useRef } from "react";
import { Search, X, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Link } from "wouter";
import type { Game } from "@shared/schema";
import { useLocation } from "wouter";

const POPULAR_SEARCHES = [
  "apple", "playstation", "pubg", "roblox",
  "steam", "free fire", "valorant", "crossfire",
  "xbox", "google play", "netflix", "discord",
];

interface GameSearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export function GameSearchOverlay({ isOpen, onClose }: GameSearchOverlayProps) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const [, navigate] = useLocation();

  const { data: popularGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/games/popular"],
    staleTime: 5 * 60 * 1000,
  });

  const { data: allGames = [] } = useQuery<Game[]>({
    queryKey: ["/api/games?limit=500"],
    staleTime: 5 * 60 * 1000,
  });

  const filteredGames = query.trim().length > 0
    ? allGames.filter(g =>
        g.name.toLowerCase().includes(query.toLowerCase()) ||
        g.description?.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 8)
    : popularGames.slice(0, 8);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
      setQuery("");
    }
    return () => { document.body.style.overflow = ""; };
  }, [isOpen]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleSearch = (term: string) => {
    onClose();
    navigate(`/games?q=${encodeURIComponent(term)}`);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) handleSearch(query.trim());
  };

  function getGameThumb(game: Game): string {
    const g = game as any;
    if (g.banner_image) return g.banner_image;
    if (game.image && (game.image as string).startsWith("https://res.cloudinary.com")) return game.image;
    return game.image || "";
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm z-[200]"
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            key="panel"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="fixed top-0 left-0 right-0 z-[201] bg-[#111111] border-b border-white/10 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Search bar */}
            <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 sm:px-8 py-4 border-b border-white/8">
              <Search className="w-5 h-5 text-muted-foreground shrink-0" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for digital products..."
                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground text-base outline-none"
              />
              <div className="flex items-center gap-2">
                {query && (
                  <button type="button" onClick={() => setQuery("")}>
                    <X className="w-4 h-4 text-muted-foreground hover:text-foreground" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={onClose}
                  className="hidden sm:flex items-center gap-1 px-2.5 py-1 rounded border border-white/15 text-muted-foreground text-xs font-mono hover:text-foreground hover:border-white/30 transition"
                >
                  ESC
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="sm:hidden"
                >
                  <X className="w-5 h-5 text-muted-foreground" />
                </button>
              </div>
            </form>

            {/* Content */}
            <div className="flex flex-col sm:flex-row max-h-[70vh] overflow-hidden">
              {/* Left: Popular searches */}
              <div className="sm:w-44 border-b sm:border-b-0 sm:border-r border-white/8 p-4 shrink-0">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                  {query.trim() ? "Suggestions" : "Popular Searches"}
                </p>
                <div className="flex flex-row flex-wrap sm:flex-col gap-1">
                  {POPULAR_SEARCHES.map((term) => (
                    <button
                      key={term}
                      onClick={() => handleSearch(term)}
                      className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors py-1.5 text-left group"
                    >
                      <Search className="w-3.5 h-3.5 shrink-0 opacity-50 group-hover:opacity-100" />
                      <span>{term}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Right: Game grid */}
              <div className="flex-1 p-4 overflow-y-auto">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em] mb-3">
                  {query.trim() ? "Results" : "Top Selling"}
                </p>
                {filteredGames.length === 0 && query.trim() ? (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground py-8 justify-center">
                    <Search className="w-4 h-4" />
                    No results for "{query}"
                  </div>
                ) : (
                  <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 gap-2.5">
                    {filteredGames.map((game) => {
                      const thumb = getGameThumb(game);
                      return (
                        <Link key={game.id} href={`/game/${game.slug}`} onClick={onClose}>
                          <div className="group cursor-pointer">
                            <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/8 hover:border-gold-primary/40 transition-all">
                              {thumb ? (
                                <img
                                  src={thumb}
                                  alt={game.name}
                                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                />
                              ) : (
                                <div className="w-full h-full bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center">
                                  <TrendingUp className="w-6 h-6 text-muted-foreground" />
                                </div>
                              )}
                              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                              <div className="absolute bottom-0 left-0 right-0 p-2">
                                <p className="text-white text-[10px] font-bold leading-tight line-clamp-2 drop-shadow">{game.name}</p>
                              </div>
                            </div>
                          </div>
                        </Link>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
