import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, API_BASE_URL } from "@/lib/queryClient";
import { useUserAuth } from "@/lib/user-auth-context";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/header";

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

function formatMatchDate(dateStr: string): string {
  if (!dateStr) return "";
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString("ar-EG", {
      weekday: "long", day: "numeric", month: "long",
      hour: "2-digit", minute: "2-digit"
    });
  } catch { return dateStr; }
}

function MatchCard({
  match,
  prediction,
  onPredict,
  isSubmitting,
}: {
  match: Match;
  prediction?: Prediction;
  onPredict: (matchId: string, home: number, away: number) => void;
  isSubmitting: boolean;
}) {
  const [homeInput, setHomeInput] = useState<string>(
    prediction ? String(prediction.home_score_pred) : ""
  );
  const [awayInput, setAwayInput] = useState<string>(
    prediction ? String(prediction.away_score_pred) : ""
  );

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
      className={`relative bg-[#111111] border rounded-xl p-6 transition-all duration-300 ${
        isLive ? "border-[#c9a84c]/80 shadow-[0_0_20px_rgba(201,168,76,0.15)]" : "border-white/8"
      } ${isFinished && hasPrediction && prediction!.is_correct ? "border-emerald-500/40" : ""}`}
      data-testid={`match-card-${match.id}`}
    >
      {isLive && (
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-xs text-red-400 font-medium tracking-wide uppercase">مباشر</span>
        </div>
      )}
      {isFinished && (
        <div className="absolute top-3 right-3">
          <span className="text-xs text-white/40 font-medium tracking-wide uppercase">انتهت</span>
        </div>
      )}

      <div className="text-center mb-1">
        <span className="text-xs text-[#c9a84c]/60 font-medium tracking-widest uppercase">
          {match.round || "مجموعة"}
        </span>
      </div>

      <div className="flex items-center justify-between gap-4 my-4">
        <div className="flex-1 text-center">
          {match.home_flag && (
            <div className="text-4xl mb-2">{match.home_flag}</div>
          )}
          <div className="text-white font-semibold text-sm leading-tight">{match.home_team}</div>
        </div>

        <div className="flex flex-col items-center gap-1 min-w-[80px]">
          {isFinished && match.home_score !== null ? (
            <div className="text-2xl font-bold text-white tabular-nums">
              {match.home_score} – {match.away_score}
            </div>
          ) : (
            <div className="text-sm text-white/30 font-light tracking-widest">VS</div>
          )}
          <div className="text-xs text-white/30 text-center mt-1">
            {formatMatchDate(match.match_date)}
          </div>
        </div>

        <div className="flex-1 text-center">
          {match.away_flag && (
            <div className="text-4xl mb-2">{match.away_flag}</div>
          )}
          <div className="text-white font-semibold text-sm leading-tight">{match.away_team}</div>
        </div>
      </div>

      {isFinished && hasPrediction && (
        <div className={`text-center text-xs mt-3 py-1.5 px-3 rounded-lg ${
          prediction!.is_correct
            ? "bg-emerald-500/10 text-emerald-400"
            : "bg-white/5 text-white/40"
        }`}>
          توقعك: {prediction!.home_score_pred} – {prediction!.away_score_pred}
          {prediction!.is_correct && " · اصبت!"}
        </div>
      )}

      {!isFinished && (
        <div className="mt-4 pt-4 border-t border-white/6">
          {hasPrediction ? (
            <div className="space-y-3">
              <div className="text-center text-xs text-white/40">توقعك المسجل</div>
              <div className="flex items-center justify-center gap-3">
                <div className="w-16 text-center">
                  <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-lg py-2 px-3 text-[#c9a84c] font-bold text-lg tabular-nums">
                    {prediction!.home_score_pred}
                  </div>
                </div>
                <span className="text-white/20 text-sm">–</span>
                <div className="w-16 text-center">
                  <div className="bg-[#1a1a1a] border border-[#c9a84c]/30 rounded-lg py-2 px-3 text-[#c9a84c] font-bold text-lg tabular-nums">
                    {prediction!.away_score_pred}
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-2 mt-2">
                <Input
                  type="number" min="0" max="20"
                  value={homeInput}
                  onChange={e => setHomeInput(e.target.value)}
                  className="w-16 text-center bg-[#1a1a1a] border-white/10 text-white text-sm h-9"
                  data-testid={`input-home-${match.id}`}
                />
                <span className="text-white/20">–</span>
                <Input
                  type="number" min="0" max="20"
                  value={awayInput}
                  onChange={e => setAwayInput(e.target.value)}
                  className="w-16 text-center bg-[#1a1a1a] border-white/10 text-white text-sm h-9"
                  data-testid={`input-away-${match.id}`}
                />
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={isSubmitting || homeInput === "" || awayInput === ""}
                  className="bg-[#c9a84c]/20 hover:bg-[#c9a84c]/30 text-[#c9a84c] border border-[#c9a84c]/30 text-xs h-9"
                  data-testid={`btn-update-${match.id}`}
                >
                  تعديل
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 justify-center">
              <div className="text-center">
                <div className="text-xs text-white/30 mb-2">توقع النتيجة</div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number" min="0" max="20"
                    value={homeInput}
                    onChange={e => setHomeInput(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center bg-[#0d0d0d] border-white/10 text-white text-base h-10 tabular-nums"
                    data-testid={`input-home-${match.id}`}
                  />
                  <span className="text-white/20 text-sm">–</span>
                  <Input
                    type="number" min="0" max="20"
                    value={awayInput}
                    onChange={e => setAwayInput(e.target.value)}
                    placeholder="0"
                    className="w-16 text-center bg-[#0d0d0d] border-white/10 text-white text-base h-10 tabular-nums"
                    data-testid={`input-away-${match.id}`}
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting || homeInput === "" || awayInput === ""}
                    className="bg-[#c9a84c] hover:bg-[#b8973e] text-black text-sm font-semibold h-10 px-5"
                    data-testid={`btn-predict-${match.id}`}
                  >
                    توقع
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function WorldCupPage() {
  const { isAuthenticated, isLoading: authLoading, user } = useUserAuth();
  const { toast } = useToast();
  const [submittingMatchId, setSubmittingMatchId] = useState<string | null>(null);

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
    enabled: isAuthenticated,
  });

  const predictMutation = useMutation({
    mutationFn: async ({ matchId, home, away }: { matchId: string; home: number; away: number }) => {
      const token = localStorage.getItem("userToken");
      const res = await fetch(`${API_BASE_URL}/api/worldcup/predict`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ match_id: matchId, home_score_pred: home, away_score_pred: away }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || "فشل الحفظ");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/worldcup/my-predictions"] });
      toast({ title: "تم الحفظ", description: "تم تسجيل توقعك بنجاح" });
      setSubmittingMatchId(null);
    },
    onError: (err: any) => {
      toast({ title: "خطأ", description: err.message, variant: "destructive" });
      setSubmittingMatchId(null);
    },
  });

  const handlePredict = (matchId: string, home: number, away: number) => {
    setSubmittingMatchId(matchId);
    predictMutation.mutate({ matchId, home, away });
  };

  const predictionMap = Object.fromEntries(
    myPredictions.map((p) => [p.match_id, p])
  );

  const upcomingMatches = matches.filter(m => m.status !== "finished");
  const finishedMatches = matches.filter(m => m.status === "finished");
  const embedUrl = settings?.video_url ? getYoutubeEmbedUrl(settings.video_url) : "";

  const correctCount = myPredictions.filter(p => p.is_correct).length;

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white"
      dir="rtl"
      style={{
        backgroundImage: "url(/images/worldcup-hero-bg.png)",
        backgroundSize: "cover",
        backgroundPosition: "center top",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="min-h-screen" style={{ background: "linear-gradient(to bottom, rgba(10,10,10,0.55) 0%, rgba(10,10,10,0.85) 40%, rgba(10,10,10,0.97) 70%, #0a0a0a 100%)" }}>
        <Header />
        <div className="pt-28 pb-20 px-4 max-w-3xl mx-auto">

          {/* ── HERO ── */}
          <div className="text-center mb-16">
            <img
              src="/images/worldcup-trophy.png"
              alt="كأس العالم"
              className="w-40 h-auto mx-auto mb-8 drop-shadow-2xl"
            />
            <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
              {settings?.title || "كأس العالم 2026"}
            </h1>
            <div className="w-16 h-px bg-[#c9a84c] mx-auto mb-4" />
            <p className="text-white/50 text-lg font-light">
              {settings?.subtitle || "توقع النتيجة واربح كوداً مجاناً"}
            </p>
            {settings?.prize_description && (
              <div className="mt-5 inline-block px-5 py-2 border border-[#c9a84c]/25 rounded-full text-[#c9a84c]/80 text-sm font-medium">
                {settings.prize_description}
              </div>
            )}
          </div>

          {/* ── VIDEO ── */}
          {embedUrl && (
            <div className="mb-14">
              <div className="relative w-full rounded-xl overflow-hidden border border-white/8" style={{ paddingTop: "56.25%" }}>
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
            {[
              { n: "01", t: "سجّل دخولك", s: "يجب أن يكون لديك حساب في المتجر" },
              { n: "02", t: "توقع النتيجة", s: "اختر نتيجتك لكل مباراة قبل انطلاقها" },
              { n: "03", t: "اربح كوداً", s: "الإدارة تراجع التوقعات الصحيحة وترسل الكود" },
            ].map(item => (
              <div key={item.n} className="bg-[#111111] border border-white/8 rounded-xl p-5 text-center">
                <div className="text-[#c9a84c] text-xs font-semibold tracking-widest mb-2">{item.n}</div>
                <div className="text-white font-semibold mb-1">{item.t}</div>
                <div className="text-white/40 text-xs leading-relaxed">{item.s}</div>
              </div>
            ))}
          </div>

          {/* ── AUTH GATE ── */}
          {!authLoading && !isAuthenticated && (
            <div className="mb-10 bg-[#111111] border border-[#c9a84c]/20 rounded-xl p-8 text-center">
              <div className="text-white/60 text-sm mb-4">يجب تسجيل الدخول للمشاركة في التوقعات</div>
              <div className="flex gap-3 justify-center flex-wrap">
                <Link href="/login">
                  <Button className="bg-[#c9a84c] hover:bg-[#b8973e] text-black font-semibold px-6" data-testid="btn-login-worldcup">
                    تسجيل الدخول
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" className="border-white/20 text-white hover:bg-white/5 px-6" data-testid="btn-register-worldcup">
                    إنشاء حساب
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* ── SCORE SUMMARY ── */}
          {isAuthenticated && myPredictions.length > 0 && finishedMatches.length > 0 && (
            <div className="mb-8 bg-[#111111] border border-white/8 rounded-xl p-5 flex items-center justify-between">
              <div>
                <div className="text-white font-semibold">نتائجك</div>
                <div className="text-white/40 text-xs mt-0.5">من المباريات المنتهية</div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-[#c9a84c]">{correctCount}</div>
                <div className="text-white/30 text-xs">توقع صحيح من {finishedMatches.filter(m => predictionMap[m.id]).length}</div>
              </div>
            </div>
          )}

          {/* ── UPCOMING MATCHES ── */}
          {upcomingMatches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold text-white mb-5 flex items-center gap-3">
                <span className="w-px h-5 bg-[#c9a84c]" />
                المباريات القادمة
              </h2>
              <div className="space-y-4">
                {upcomingMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictionMap[match.id]}
                    onPredict={handlePredict}
                    isSubmitting={submittingMatchId === match.id}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ── FINISHED MATCHES ── */}
          {finishedMatches.length > 0 && (
            <div className="mb-12">
              <h2 className="text-lg font-semibold text-white/60 mb-5 flex items-center gap-3">
                <span className="w-px h-5 bg-white/20" />
                المباريات المنتهية
              </h2>
              <div className="space-y-4">
                {finishedMatches.map(match => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={predictionMap[match.id]}
                    onPredict={handlePredict}
                    isSubmitting={false}
                  />
                ))}
              </div>
            </div>
          )}

          {matches.length === 0 && (
            <div className="text-center py-20 text-white/20 text-sm">
              لم تُضَف مباريات بعد — تابع القسم قريباً
            </div>
          )}

          {/* ── TERMS ── */}
          <div className="mt-16 border-t border-white/8 pt-10">
            <h3 className="text-sm font-semibold text-white/50 mb-4 tracking-wide uppercase">الشروط والأحكام</h3>
            <ul className="space-y-2 text-white/30 text-xs leading-relaxed">
              {[
                "يجب امتلاك حساب فعّال في المتجر للمشاركة",
                "يُسمح بتوقع واحد فقط لكل مباراة لكل مستخدم",
                "يمكن تعديل التوقع قبل انطلاق المباراة فقط",
                "الإدارة تراجع التوقعات الصحيحة بعد انتهاء كل مباراة وتختار الفائزين",
                "يتم التواصل مع الفائزين عبر الواتساب المسجل في الحساب",
                "قرار الإدارة في اختيار الفائزين نهائي وغير قابل للطعن",
              ].map((t, i) => (
                <li key={i} className="flex gap-2">
                  <span className="text-[#c9a84c]/30 mt-0.5">—</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
