import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, API_BASE_URL } from "@/lib/queryClient";
import { useUserAuth } from "@/lib/user-auth-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";
import { SEO } from "@/components/SEO";
import { CircleFlag } from "react-circle-flags";

/* ─── Flag Mapping ─── */
const FLAG_MAP: Record<string, string> = {
  "Argentina": "🇦🇷",
  "Australia": "🇦🇺",
  "Austria": "🇦🇹",
  "Belgium": "🇧🇪",
  "BE": "🇧🇪",
  "Brazil": "🇧🇷",
  "Cameroon": "🇨🇲",
  "Canada": "🇨🇦",
  "Chile": "🇨🇱",
  "Colombia": "🇨🇴",
  "Costa Rica": "🇨🇷",
  "Croatia": "🇭🇷",
  "Denmark": "🇩🇰",
  "Ecuador": "🇪🇨",
  "Egypt": "🇪🇬",
  "EG": "🇪🇬",
  "England": "🏴",
  "France": "🇫🇷",
  "Germany": "🇩🇪",
  "Ghana": "🇬🇭",
  "Greece": "🇬🇷",
  "Iran": "🇮🇷",
  "Italy": "🇮🇹",
  "Japan": "🇯🇵",
  "Mexico": "🇲🇽",
  "Morocco": "🇲🇦",
  "Netherlands": "🇳🇱",
  "Nigeria": "🇳🇬",
  "Norway": "🇳🇴",
  "Paraguay": "🇵🇾",
  "Peru": "🇵🇪",
  "Poland": "🇵🇱",
  "Portugal": "🇵🇹",
  "Qatar": "🇶🇦",
  "Russia": "🇷🇺",
  "Saudi Arabia": "🇸🇦",
  "Scotland": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Senegal": "🇸🇳",
  "Serbia": "🇷🇸",
  "South Korea": "🇰🇷",
  "Spain": "🇪🇸",
  "Sweden": "🇸🇪",
  "Switzerland": "🇨🇭",
  "Tunisia": "🇹🇳",
  "Turkey": "🇹🇷",
  "Ukraine": "🇺🇦",
  "Uruguay": "🇺🇾",
  "USA": "🇺🇸",
  "United States": "🇺🇸",
  "Venezuela": "🇻🇪",
  "Wales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
};

function getFlag(teamName: string, existingFlag?: string): string {
  if (existingFlag) return existingFlag;
  const normalized = teamName.trim();
  // Check exact match first
  if (FLAG_MAP[normalized]) return FLAG_MAP[normalized];
  // Check case-insensitive exact match
  const lowerName = normalized.toLowerCase();
  for (const [name, flag] of Object.entries(FLAG_MAP)) {
    if (name.toLowerCase() === lowerName) return flag;
  }
  // Check partial match (case insensitive)
  for (const [name, flag] of Object.entries(FLAG_MAP)) {
    const lowerTeam = lowerName;
    const lowerFlagName = name.toLowerCase();
    if (lowerTeam.includes(lowerFlagName) || lowerFlagName.includes(lowerTeam)) {
      return flag;
    }
  }
  // Special cases for short codes (like BE, EG)
  const codeMap: Record<string, string> = {
    'BE': '🇧🇪', 'be': '🇧🇪',
    'EG': '🇪🇬', 'eg': '🇪🇬',
    'BR': '🇧🇷', 'br': '🇧🇷',
    'FR': '🇫🇷', 'fr': '🇫🇷',
    'DE': '🇩🇪', 'de': '🇩🇪',
    'ES': '🇪🇸', 'es': '🇪🇸',
    'IT': '🇮🇹', 'it': '🇮🇹',
    'PT': '🇵🇹', 'pt': '🇵🇹',
    'AR': '🇦🇷', 'ar': '🇦🇷',
    'GB': '🏴', 'gb': '🏴',
    'US': '🇺🇸', 'us': '🇺🇸',
    'MX': '🇲🇽', 'mx': '🇲🇽',
  };
  if (codeMap[normalized]) return codeMap[normalized];
  // Fallback to generic flag emoji
  return "🏳️";
}

/* ─── Bilingual text ─── */
type Lang = "ar" | "en";

const TX = {
  ar: {
    pageTitle: "كأس العالم 2026 — توقع النتيجة | متجر ضياء",
    pageDesc: "شارك في مسابقة توقع نتائج كأس العالم 2026 واربح جوائز مجانية من متجر ضياء.",
    live: "مباشر",
    finished: "انتهت",
    group: "مجموعة",
    upcoming: "المباريات القادمة",
    finishedSection: "المباريات المنتهية",
    predict: "توقع",
    update: "تعديل",
    yourPrediction: "توقعك المسجل",
    predictScore: "توقع النتيجة",
    yourResults: "نتائجك",
    fromFinished: "من المباريات المنتهية",
    correct: "توقع صحيح من",
    hit: "· أصبت!",
    noMatches: "لم تُضَف مباريات بعد — تابع القسم قريباً",
    loginToPredict: "يجب تسجيل الدخول للمشاركة في التوقعات",
    login: "تسجيل الدخول",
    createAccount: "إنشاء حساب",
    step1t: "سجّل دخولك",
    step1s: "يجب أن يكون لديك حساب في المتجر",
    step2t: "توقع النتيجة",
    step2s: "اختر نتيجتك لكل مباراة قبل انطلاقها",
    step3t: "اربح كوداً",
    step3s: "الإدارة تراجع التوقعات الصحيحة وترسل الكود",
    termsTitle: "الشروط والأحكام",
    terms: [
      "يجب امتلاك حساب فعّال في المتجر للمشاركة",
      "يُسمح بتوقع واحد فقط لكل مباراة لكل مستخدم",
      "يمكن تعديل التوقع قبل انطلاق المباراة فقط",
      "الإدارة تراجع التوقعات الصحيحة بعد انتهاء كل مباراة وتختار الفائزين",
      "يتم التواصل مع الفائزين عبر الواتساب المسجل في الحساب",
      "قرار الإدارة في اختيار الفائزين نهائي وغير قابل للطعن",
    ],
    defaultTitle: "كأس العالم 2026",
    defaultSubtitle: "توقع النتيجة واربح كوداً مجاناً",
    saved: "تم الحفظ",
    savedDesc: "تم تسجيل توقعك بنجاح",
    error: "خطأ",
    langBtn: "English",
  },
  en: {
    pageTitle: "World Cup 2026 Prediction | Diaa Store",
    pageDesc: "Predict World Cup 2026 match results and win free prizes from Diaa Store.",
    live: "LIVE",
    finished: "Finished",
    group: "Group",
    upcoming: "Upcoming Matches",
    finishedSection: "Finished Matches",
    predict: "Predict",
    update: "Update",
    yourPrediction: "Your Prediction",
    predictScore: "Predict the Score",
    yourResults: "Your Results",
    fromFinished: "from finished matches",
    correct: "correct from",
    hit: "· Correct!",
    noMatches: "No matches added yet — check back soon",
    loginToPredict: "You must be logged in to participate",
    login: "Sign In",
    createAccount: "Create Account",
    step1t: "Sign In",
    step1s: "You need an active store account",
    step2t: "Predict the Score",
    step2s: "Choose your result for each match before kick-off",
    step3t: "Win a Code",
    step3s: "Admin reviews correct predictions and sends your prize",
    termsTitle: "Terms & Conditions",
    terms: [
      "An active store account is required to participate",
      "Only one prediction per match per user is allowed",
      "Predictions can be edited before the match starts only",
      "Admin reviews correct predictions after each match ends and selects winners",
      "Winners are contacted via the WhatsApp registered on their account",
      "Admin's decision on winners is final and binding",
    ],
    defaultTitle: "World Cup 2026",
    defaultSubtitle: "Predict the score and win a free code",
    saved: "Saved",
    savedDesc: "Your prediction was saved successfully",
    error: "Error",
    langBtn: "عربي",
  },
};

interface Match {
  id: string;
  home_team: string;
  away_team: string;
  home_flag: string;
  away_flag: string;
  match_date: string;
  home_score: number | null;
  away_score: number | null;
  status: "upcoming" | "live" | "finished";
  round: string;
}

interface Prediction {
  match_id: string;
  home_score_pred: number;
  away_score_pred: number;
  is_correct: boolean;
  home_team: string;
  away_team: string;
  home_score: number | null;
  away_score: number | null;
  status: string;
}

interface Settings {
  title: string;
  subtitle: string;
  video_url: string;
  prize_description: string;
  is_active: boolean;
}

function getYoutubeEmbedUrl(url: string): string {
  if (!url) return "";
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
  if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=0&rel=0&modestbranding=1`;
  if (url.includes("youtube.com/embed")) return url;
  return url;
}

function formatMatchDate(dateStr: string, lang: Lang): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString(lang === "ar" ? "ar-EG" : "en-US", {
      weekday: "short", day: "numeric", month: "short",
      hour: "2-digit", minute: "2-digit",
    });
  } catch { return dateStr; }
}

/* ─── Country Code Mapping ─── */
const COUNTRY_CODE_MAP: Record<string, string> = {
  "Argentina": "ar",
  "Australia": "au",
  "Austria": "at",
  "Belgium": "be",
  "BE": "be",
  "Brazil": "br",
  "Cameroon": "cm",
  "Canada": "ca",
  "Chile": "cl",
  "Colombia": "co",
  "Costa Rica": "cr",
  "Croatia": "hr",
  "Denmark": "dk",
  "Ecuador": "ec",
  "Egypt": "eg",
  "EG": "eg",
  "England": "gb-eng",
  "France": "fr",
  "Germany": "de",
  "Ghana": "gh",
  "Greece": "gr",
  "Iran": "ir",
  "Italy": "it",
  "Japan": "jp",
  "Mexico": "mx",
  "Morocco": "ma",
  "Netherlands": "nl",
  "Nigeria": "ng",
  "Norway": "no",
  "Paraguay": "py",
  "Peru": "pe",
  "Poland": "pl",
  "Portugal": "pt",
  "Qatar": "qa",
  "Russia": "ru",
  "Saudi Arabia": "sa",
  "Scotland": "gb-sct",
  "Senegal": "sn",
  "Serbia": "rs",
  "South Korea": "kr",
  "Spain": "es",
  "Sweden": "se",
  "Switzerland": "ch",
  "Tunisia": "tn",
  "Turkey": "tr",
  "Ukraine": "ua",
  "Uruguay": "uy",
  "USA": "us",
  "United States": "us",
  "Venezuela": "ve",
  "Wales": "gb-wls",
};

function getCountryCode(teamName: string): string {
  const normalized = teamName.trim();
  if (COUNTRY_CODE_MAP[normalized]) return COUNTRY_CODE_MAP[normalized];
  const lowerName = normalized.toLowerCase();
  for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (name.toLowerCase() === lowerName) return code;
  }
  for (const [name, code] of Object.entries(COUNTRY_CODE_MAP)) {
    if (lowerName.includes(name.toLowerCase()) || name.toLowerCase().includes(lowerName)) {
      return code;
    }
  }
  const shortCodeMap: Record<string, string> = {
    'BE': 'be', 'be': 'be',
    'EG': 'eg', 'eg': 'eg',
    'BR': 'br', 'br': 'br',
    'FR': 'fr', 'fr': 'fr',
    'DE': 'de', 'de': 'de',
    'ES': 'es', 'es': 'es',
    'IT': 'it', 'it': 'it',
    'PT': 'pt', 'pt': 'pt',
    'AR': 'ar', 'ar': 'ar',
    'GB': 'gb-eng', 'gb': 'gb-eng',
    'US': 'us', 'us': 'us',
    'MX': 'mx', 'mx': 'mx',
  };
  if (shortCodeMap[normalized]) return shortCodeMap[normalized];
  return "us";
}

function MatchCard({
  match, prediction, onPredict, isSubmitting, lang,
}: {
  match: Match;
  prediction?: Prediction;
  onPredict: (matchId: string, home: number, away: number) => void;
  isSubmitting: boolean;
  lang: Lang;
}) {
  const T = TX[lang];
  const [homeInput, setHomeInput] = useState<string>(
    prediction ? String(prediction.home_score_pred) : ""
  );
  const [awayInput, setAwayInput] = useState<string>(
    prediction ? String(prediction.away_score_pred) : ""
  );

  useEffect(() => {
    if (prediction) {
      setHomeInput(String(prediction.home_score_pred));
      setAwayInput(String(prediction.away_score_pred));
    }
  }, [prediction]);

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const hasPrediction = !!prediction;

  const handleSubmit = () => {
    const h = parseInt(homeInput);
    const a = parseInt(awayInput);
    if (isNaN(h) || isNaN(a) || h < 0 || a < 0) return;
    onPredict(match.id, h, a);
  };

  return (
    <div
      className={`relative rounded-2xl p-5 transition-all duration-300 overflow-hidden ${
        isLive
          ? "bg-gradient-to-br from-[#1a1200] to-[#111] border border-[#c9a84c]/60 shadow-[0_0_30px_rgba(201,168,76,0.12)]"
          : isFinished && hasPrediction && prediction!.is_correct
          ? "bg-gradient-to-br from-[#001a0a] to-[#111] border border-emerald-500/40"
          : "bg-[#111111] border border-white/8 hover:border-white/15"
      }`}
    >
      {/* Status badge */}
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5 bg-red-500/15 border border-red-500/30 rounded-full px-2.5 py-1">
          <span className="w-1.5 h-1.5 rounded-full bg-red-400 animate-pulse" />
          <span className="text-xs text-red-400 font-semibold tracking-wider uppercase">{T.live}</span>
        </div>
      )}
      {isFinished && (
        <div className="absolute top-3 right-3">
          <span className="text-[10px] text-white/30 font-medium tracking-widest uppercase bg-white/5 px-2 py-0.5 rounded-full">{T.finished}</span>
        </div>
      )}

      {/* Round */}
      <div className="text-center mb-3">
        <span className="text-[10px] text-[#c9a84c]/50 font-semibold tracking-widest uppercase">
          {match.round || T.group}
        </span>
      </div>

      {/* Teams */}
      <div className="flex items-center justify-between gap-4 my-3">
        <div className="flex-1 text-center">
          <div className="flex justify-center mb-2">
            <CircleFlag countryCode={getCountryCode(match.home_team)} height={64} width={64} className="rounded-full drop-shadow-lg" />
          </div>
          <div className="text-white font-bold text-sm leading-tight">{match.home_team}</div>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[90px]">
          {isFinished && match.home_score !== null ? (
            <div className="text-3xl font-black text-white tabular-nums tracking-tight">
              {match.home_score} <span className="text-white/30">–</span> {match.away_score}
            </div>
          ) : isLive && match.home_score !== null ? (
            <div className="text-3xl font-black text-[#c9a84c] tabular-nums tracking-tight animate-pulse">
              {match.home_score} <span className="text-[#c9a84c]/50">–</span> {match.away_score}
            </div>
          ) : (
            <div className="text-sm text-white/20 font-light tracking-[0.3em]">VS</div>
          )}
          <div className="text-[10px] text-white/25 text-center mt-1 leading-relaxed px-1">
            {formatMatchDate(match.match_date, lang)}
          </div>
        </div>

        <div className="flex-1 text-center">
          <div className="flex justify-center mb-2">
            <CircleFlag countryCode={getCountryCode(match.away_team)} height={64} width={64} className="rounded-full drop-shadow-lg" />
          </div>
          <div className="text-white font-bold text-sm leading-tight">{match.away_team}</div>
        </div>
      </div>

      {/* Finished — show prediction result */}
      {isFinished && hasPrediction && (
        <div className={`text-center text-xs mt-4 py-2 px-4 rounded-xl ${
          prediction!.is_correct
            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
            : "bg-white/4 text-white/35 border border-white/8"
        }`}>
          {lang === "ar" ? "توقعك:" : "Your pick:"}{" "}
          {prediction!.home_score_pred} – {prediction!.away_score_pred}
          {prediction!.is_correct && <span className="text-emerald-400 font-semibold"> {T.hit}</span>}
        </div>
      )}

      {/* Predict / Edit section */}
      {!isFinished && (
        <div className="mt-4 pt-4 border-t border-white/6">
          {hasPrediction ? (
            <div className="space-y-3">
              <div className="text-center text-xs text-white/35 font-medium">{T.yourPrediction}</div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-14 text-center bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl py-2 px-2 text-[#c9a84c] font-black text-xl tabular-nums">
                  {prediction!.home_score_pred}
                </div>
                <span className="text-white/20 text-sm font-light">–</span>
                <div className="w-14 text-center bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-xl py-2 px-2 text-[#c9a84c] font-black text-xl tabular-nums">
                  {prediction!.away_score_pred}
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Input
                  type="number" min="0" max="20"
                  value={homeInput}
                  onChange={e => setHomeInput(e.target.value)}
                  className="w-14 text-center bg-[#0d0d0d] border-white/10 text-white text-sm h-9 rounded-xl"
                />
                <span className="text-white/20">–</span>
                <Input
                  type="number" min="0" max="20"
                  value={awayInput}
                  onChange={e => setAwayInput(e.target.value)}
                  className="w-14 text-center bg-[#0d0d0d] border-white/10 text-white text-sm h-9 rounded-xl"
                />
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || homeInput === "" || awayInput === ""}
                  className="bg-[#c9a84c]/15 hover:bg-[#c9a84c]/25 text-[#c9a84c] border border-[#c9a84c]/30 text-xs h-9 rounded-xl font-semibold"
                >
                  {isSubmitting ? "..." : T.update}
                </Button>
              </div>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <div className="text-xs text-white/25 font-medium">{T.predictScore}</div>
              <div className="flex items-center gap-2 justify-center">
                <Input
                  type="number" min="0" max="20"
                  value={homeInput}
                  onChange={e => setHomeInput(e.target.value)}
                  placeholder="0"
                  className="w-14 text-center bg-[#0d0d0d] border-white/10 text-white text-base h-11 rounded-xl tabular-nums"
                />
                <span className="text-white/20 text-base font-light">–</span>
                <Input
                  type="number" min="0" max="20"
                  value={awayInput}
                  onChange={e => setAwayInput(e.target.value)}
                  placeholder="0"
                  className="w-14 text-center bg-[#0d0d0d] border-white/10 text-white text-base h-11 rounded-xl tabular-nums"
                />
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || homeInput === "" || awayInput === ""}
                  className="bg-[#c9a84c] hover:bg-[#b8973e] text-black text-sm font-black h-11 px-5 rounded-xl"
                >
                  {isSubmitting ? "..." : T.predict}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorldCupPage() {
  const { isAuthenticated, isLoading: authLoading } = useUserAuth();
  const { toast } = useToast();
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);
  const [showHeroVideo, setShowHeroVideo] = useState(true);
  const [showAnthemVideo, setShowAnthemVideo] = useState(true);

  // Language: default Arabic, remember preference
  const [lang, setLang] = useState<Lang>(() => {
    try { return (localStorage.getItem("wc_lang") as Lang) || "ar"; } catch { return "ar"; }
  });
  const toggleLang = () => {
    const next: Lang = lang === "ar" ? "en" : "ar";
    setLang(next);
    try { localStorage.setItem("wc_lang", next); } catch {}
  };
  const T = TX[lang];
  const dir = lang === "ar" ? "rtl" : "ltr";

  const { data: settings } = useQuery<Settings>({
    queryKey: ["/api/worldcup/settings"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/worldcup/settings`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
  });

  const { data: matches = [] } = useQuery<Match[]>({
    queryKey: ["/api/worldcup/matches"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE_URL}/api/worldcup/matches`);
      if (!res.ok) throw new Error("Failed");
      return res.json();
    },
    refetchInterval: 60000,
  });

  const { data: myPredictions = [] } = useQuery<Prediction[]>({
    queryKey: ["/api/worldcup/my-predictions"],
    queryFn: async () => {
      const token = localStorage.getItem("userToken");
      if (!token) return [];
      const res = await fetch(`${API_BASE_URL}/api/worldcup/my-predictions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isAuthenticated && !authLoading,
    retry: 1,
  });

  const predictMutation = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: string; home: number; away: number }) => {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE_URL}/api/worldcup/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ match_id: matchId, home_score_pred: home, away_score_pred: away }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || (lang === "ar" ? "فشل الحفظ" : "Save failed"));
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/my-predictions"] });
      toast({ title: T.saved, description: T.savedDesc });
      setSubmittingMatchId(null);
    },
    onError: (err: any) => {
      toast({ title: T.error, description: err.message, variant: "destructive" });
      setSubmittingMatchId(null);
    },
  });

  const handlePredict = (matchId: string, home: number, away: number) => {
    setSubmittingMatchId(matchId);
    predictMutation.mutate({ matchId, home, away });
  };

  const predictionMap = Object.fromEntries(myPredictions.map(p => [p.match_id, p]));
  const upcomingMatches = matches.filter(m => m.status !== "finished");
  const finishedMatches = matches.filter(m => m.status === "finished");
  const embedUrl = settings?.video_url ? getYoutubeEmbedUrl(settings.video_url) : "";
  const correctCount = myPredictions.filter(p => p.is_correct).length;

  const steps = [
    { n: "01", t: T.step1t, s: T.step1s },
    { n: "02", t: T.step2t, s: T.step2s },
    { n: "03", t: T.step3t, s: T.step3s },
  ];

  return (
    <>
      <SEO
        title={T.pageTitle}
        description={T.pageDesc}
        keywords={["world cup 2026", "كأس العالم 2026", "توقع المباريات", "diaa store", "متجر ضياء", "world cup prediction"]}
        url={typeof window !== "undefined" ? window.location.href : "https://diaasadek.com/world-cup"}
      />
      {/* ─── CINEMATIC VIDEO HERO ── */}
      <div className="relative overflow-hidden bg-black" style={{ minHeight: "600px" }}>
        {/* Background video — muted autoplay loop (fallback to image if video missing) */}
        {showHeroVideo && (
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            className="absolute inset-0 w-full h-full object-cover opacity-35"
            style={{ objectPosition: "center 20%" }}
            onError={() => setShowHeroVideo(false)}
          >
            <source src="https://res.cloudinary.com/ddzbutb12/video/upload/v1781447401/gamecart/worldcup/worldcup-anthem.mp4" type="video/mp4" />
          </video>
        )}

        {/* Dark cinematic gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, rgba(8,8,8,0.65) 50%, rgba(8,8,8,0.96) 90%, #080808 100%)",
          }}
        />

        {/* Gold vignette on sides */}
        <div className="absolute inset-0 pointer-events-none" style={{
          background: "radial-gradient(ellipse at 50% 80%, rgba(201,168,76,0.07) 0%, transparent 70%)"
        }} />

        <div className="relative z-10">
          <Header />

          {/* Language toggle */}
          <div className={`fixed top-20 z-40 ${lang === "ar" ? "left-4" : "right-4"}`}>
            <button
              onClick={toggleLang}
              className="text-xs font-semibold bg-white/8 hover:bg-white/15 border border-white/10 text-white/60 hover:text-white px-3 py-1.5 rounded-full transition-all"
            >
              {T.langBtn}
            </button>
          </div>

          {/* Hero content */}
          <div className="pt-28 pb-20 px-4 text-center">
            <div className="relative inline-block mb-7">
              <img
                src={settings?.trophy_image || "https://res.cloudinary.com/ddzbutb12/image/upload/v1781368111/gamecart/worldcup/worldcup-trophy.png"}
                alt="World Cup Trophy"
                className="w-32 h-auto mx-auto drop-shadow-2xl"
                style={{ filter: "drop-shadow(0 0 24px rgba(201,168,76,0.5))" }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-white tracking-tight mb-3 leading-tight">
              {settings?.title || T.defaultTitle}
            </h1>
            <div className="w-24 h-px bg-gradient-to-r from-transparent via-[#c9a84c] to-transparent mx-auto mb-5" />
            <p className="text-white/50 text-lg font-light max-w-md mx-auto">
              {settings?.subtitle || T.defaultSubtitle}
            </p>

            {settings?.prize_description && (
              <div className="mt-6 inline-flex items-center gap-2.5 px-5 py-2.5 bg-[#c9a84c]/10 border border-[#c9a84c]/30 rounded-full text-[#c9a84c] text-sm font-bold shadow-lg">
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
                <span>{settings.prize_description}</span>
              </div>
            )}

            {/* Stats bar */}
            {matches.length > 0 && (
              <div className="mt-8 inline-flex items-center gap-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-2xl px-6 py-3">
                <div className="text-center">
                  <div className="text-2xl font-black text-white">{matches.length}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest">{lang === "ar" ? "مباراة" : "Matches"}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-[#c9a84c]">{upcomingMatches.length}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest">{lang === "ar" ? "قادمة" : "Upcoming"}</div>
                </div>
                <div className="w-px h-8 bg-white/10" />
                <div className="text-center">
                  <div className="text-2xl font-black text-emerald-400">{finishedMatches.length}</div>
                  <div className="text-[10px] text-white/35 uppercase tracking-widest">{lang === "ar" ? "منتهية" : "Finished"}</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div
        className="min-h-screen bg-[#080808] text-white"
        dir={dir}
      >
          <div className="pb-24 px-4 max-w-3xl mx-auto">

            {/* ── OFFICIAL ANTHEM VIDEO PLAYER ── */}
            {showAnthemVideo && (
              <div className="mt-10 mb-14">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-0.5 h-5 bg-[#c9a84c] rounded-full" />
                  <span className="text-sm font-bold text-white/70 tracking-wide uppercase">
                    {lang === "ar" ? "النشيد الرسمي" : "Official Anthem"}
                  </span>
                </div>
                <div className="relative rounded-2xl overflow-hidden border border-[#c9a84c]/15 shadow-2xl bg-black">
                  <video
                    controls
                    preload="auto"
                    className="w-full"
                    style={{ maxHeight: "420px" }}
                    onError={() => setShowAnthemVideo(false)}
                  >
                    <source src="https://res.cloudinary.com/ddzbutb12/video/upload/v1781447401/gamecart/worldcup/worldcup-anthem.mp4" type="video/mp4" />
                  </video>
                  <div className="absolute top-3 right-3 bg-black/60 border border-[#c9a84c]/30 backdrop-blur-sm rounded-full px-3 py-1">
                    <span className="text-[10px] text-[#c9a84c] font-bold uppercase tracking-widest">
                      {lang === "ar" ? "النشيد الرسمي" : "FIFA WC 2026"}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── YouTube embed (from admin settings) ── */}
            {embedUrl && (
              <div className="mb-14">
                <div
                  className="relative w-full rounded-2xl overflow-hidden border border-white/8 shadow-2xl"
                  style={{ paddingTop: "56.25%" }}
                >
                  <iframe
                    src={embedUrl}
                    title="World Cup video"
                    className="absolute inset-0 w-full h-full"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              </div>
            )}

            {/* ── HOW IT WORKS ── */}
            <div className="mb-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {steps.map(item => (
                <div
                  key={item.n}
                  className="relative bg-[#111] border border-white/8 rounded-2xl p-5 text-center overflow-hidden group hover:border-[#c9a84c]/25 transition-all"
                >
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-[#c9a84c]/20 to-transparent" />
                  <div className="text-[#c9a84c] text-xs font-black tracking-widest mb-3">{item.n}</div>
                  <div className="text-white font-bold mb-1.5 text-sm">{item.t}</div>
                  <div className="text-white/35 text-xs leading-relaxed">{item.s}</div>
                </div>
              ))}
            </div>

            {/* ── AUTH GATE ── */}
            {!authLoading && !isAuthenticated && (
              <div className="mb-10 bg-[#111] border border-[#c9a84c]/20 rounded-2xl p-8 text-center">
                <div className="w-12 h-12 rounded-2xl bg-[#c9a84c]/10 border border-[#c9a84c]/20 flex items-center justify-center mx-auto mb-4">
                  <svg className="w-5 h-5 text-[#c9a84c]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div className="text-white/70 text-sm mb-6 font-medium">{T.loginToPredict}</div>
                <div className="flex gap-3 justify-center flex-wrap">
                  <Link href="/login">
                    <Button className="bg-[#c9a84c] hover:bg-[#b8973e] text-black font-black px-7 rounded-xl h-11">
                      {T.login}
                    </Button>
                  </Link>
                  <Link href="/login?tab=register">
                    <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-7 rounded-xl h-11">
                      {T.createAccount}
                    </Button>
                  </Link>
                </div>
              </div>
            )}

            {/* ── SCORE SUMMARY ── */}
            {isAuthenticated && myPredictions.length > 0 && finishedMatches.length > 0 && (
              <div className="mb-8 bg-gradient-to-r from-[#c9a84c]/8 to-transparent border border-[#c9a84c]/20 rounded-2xl p-5 flex items-center justify-between">
                <div>
                  <div className="text-white font-bold">{T.yourResults}</div>
                  <div className="text-white/35 text-xs mt-0.5">{T.fromFinished}</div>
                </div>
                <div className={lang === "ar" ? "text-left" : "text-right"}>
                  <div className="text-3xl font-black text-[#c9a84c]">{correctCount}</div>
                  <div className="text-white/30 text-xs">
                    {T.correct} {finishedMatches.filter(m => predictionMap[m.id]).length}
                  </div>
                </div>
              </div>
            )}

            {/* ── UPCOMING MATCHES ── */}
            {upcomingMatches.length > 0 && (
              <div className="mb-12">
                <h2 className="text-base font-bold text-white mb-5 flex items-center gap-3">
                  <span className="w-0.5 h-5 bg-[#c9a84c] rounded-full" />
                  {T.upcoming}
                  <span className="text-xs text-white/30 font-normal">({upcomingMatches.length})</span>
                </h2>
                <div className="space-y-4">
                  {upcomingMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictionMap[match.id]}
                      onPredict={handlePredict}
                      isSubmitting={submittingMatchId === match.id}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ── FINISHED MATCHES ── */}
            {finishedMatches.length > 0 && (
              <div className="mb-12">
                <h2 className="text-base font-bold text-white/50 mb-5 flex items-center gap-3">
                  <span className="w-0.5 h-5 bg-white/15 rounded-full" />
                  {T.finishedSection}
                  <span className="text-xs text-white/20 font-normal">({finishedMatches.length})</span>
                </h2>
                <div className="space-y-4">
                  {finishedMatches.map(match => (
                    <MatchCard
                      key={match.id}
                      match={match}
                      prediction={predictionMap[match.id]}
                      onPredict={handlePredict}
                      isSubmitting={false}
                      lang={lang}
                    />
                  ))}
                </div>
              </div>
            )}

            {matches.length === 0 && (
              <div className="text-center py-24">
                <div className="w-14 h-14 rounded-2xl bg-white/4 border border-white/8 flex items-center justify-center mx-auto mb-5">
                  <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div className="text-white/20 text-sm">{T.noMatches}</div>
              </div>
            )}

            {/* ── TERMS ── */}
            <div className="mt-16 border-t border-white/6 pt-10">
              <h3 className="text-xs font-bold text-white/40 mb-5 tracking-widest uppercase">{T.termsTitle}</h3>
              <ul className="space-y-2.5 text-white/25 text-xs leading-relaxed">
                {T.terms.map((t, i) => (
                  <li key={i} className="flex gap-2.5">
                    <span className="text-[#c9a84c]/25 mt-0.5 shrink-0">—</span>
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
    </>
  );
}
