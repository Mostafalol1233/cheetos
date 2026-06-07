import { useState, useEffect, useRef, useCallback } from "react";

const WHATSAPP_CHANNEL = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";

const RAW_PARTICIPANTS = [
  "GW_Luffy","sky_CTM","WP*Ghost","Trillionaire","Millionaire.",".REVO_","BOOOM","rtBELAL",
  "N4S3R","Mostafa","{M}M!Do™","{NV}~T!GeR~?","5TR.","HM Sh1ro","Kemaro","-HB]MOS1BA.",
  "Xyilo","maddeR","2 Divysho",".Peter","-Aspect","Starco","N4S3R","BigoPew","BillyPew",
  "_ITS]*Judy*_","-Crispy 2","-SW]7amo0o","Azaro","-Francisco","Z3R0","1St_7oda","-K1",
  "JasonStatham","[G]iven]*","-NUL Martin","Ravager. Kda","Naxus","E-L-D-O-D-_-","Haredy",
  "-Ghost?","AlRose","Luxuriouse.","Hamdy.","Murr","drax.","-YourDaddy",".WaZeR.","Al3gamawy",
  "-HB]Shadow","-HB]Dark","Vladimir2011","Choklet mH"
];
const PARTICIPANTS = Array.from(new Set(RAW_PARTICIPANTS));

// Cairo = GMT+3
function getCairoTime() {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000;
  return new Date(utc + 3 * 3600000);
}

function getTargetDates() {
  const gathering = new Date("2025-10-10T21:30:00+03:00");
  const live = new Date("2025-10-10T22:00:00+03:00");
  return { gathering, live };
}

type AppState = 1 | 2 | 3 | 4;

function getAutoState(): AppState {
  const now = getCairoTime();
  const { gathering, live } = getTargetDates();
  if (now < gathering) return 1;
  if (now < live) return 2;
  return 3;
}

function getForceState(): AppState | null {
  const params = new URLSearchParams(window.location.search);
  const s = params.get("state");
  if (s === "1") return 1;
  if (s === "2") return 2;
  if (s === "3") return 3;
  if (s === "4") return 4;
  return null;
}

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, target.getTime() - getCairoTime().getTime()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor((diff % 86400000) / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  const secs = Math.floor((diff % 60000) / 1000);
  return { days, hours, mins, secs, done: diff === 0 };
}

/* ─── STANDBY ─── */
function CountdownBox({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <div
        className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center rounded-lg border border-red-500/40 overflow-hidden"
        style={{
          background: "linear-gradient(180deg, rgba(180,20,20,0.18) 0%, rgba(10,10,15,0.95) 100%)",
          boxShadow: "0 0 24px rgba(220,38,38,0.18)"
        }}
      >
        <div className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-red-500 to-transparent opacity-80" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-white/8" />
        <span className="font-gaming text-3xl sm:text-4xl font-black text-white tracking-widest"
          style={{ fontFamily: "'Orbitron', monospace" }}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="mt-2 text-xs text-red-400/80 uppercase tracking-widest font-medium">{label}</span>
    </div>
  );
}

function StateStandby() {
  const { gathering } = getTargetDates();
  const { days, hours, mins, secs } = useCountdown(gathering);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 text-center" dir="rtl">
      <div className="mb-8">
        <p className="text-red-400 text-sm tracking-[0.3em] uppercase mb-3 font-medium" style={{ fontFamily: "Orbitron,monospace" }}>
          CFS 10TH ANNIVERSARY
        </p>
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-white leading-tight mb-2"
          style={{ textShadow: "0 0 40px rgba(220,38,38,0.5)" }}>
          الذكرى العاشرة
        </h1>
        <h2 className="text-2xl sm:text-4xl font-bold text-red-400">مسابقة السحب الكبير</h2>
      </div>

      <div className="flex gap-4 sm:gap-6 mb-12">
        <CountdownBox value={days} label="أيام" />
        <CountdownBox value={hours} label="ساعة" />
        <CountdownBox value={mins} label="دقيقة" />
        <CountdownBox value={secs} label="ثانية" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-2xl text-center mb-10">
        {[
          { label: "التاريخ", value: "١٠ أكتوبر ٢٠٢٥" },
          { label: "المنصة", value: "Crossfire" },
          { label: "عدد الفائزين", value: "٣ فائزين" },
          { label: "الميكانيزم", value: "Cipher Wheel" },
        ].map(item => (
          <div key={item.label}
            className="rounded-xl border border-white/10 p-4"
            style={{ background: "rgba(255,255,255,0.04)" }}>
            <p className="text-red-400 text-xs uppercase tracking-widest mb-1">{item.label}</p>
            <p className="text-white font-bold text-sm">{item.value}</p>
          </div>
        ))}
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-2 px-8 py-3 rounded-full font-bold text-white text-sm transition-all"
        style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.4)" }}>
        <span>📢</span> انضم لقناة واتساب
      </a>
    </div>
  );
}

/* ─── GATHERING ─── */
function StateGathering() {
  const [query, setQuery] = useState("");
  const [pulsed, setPulsed] = useState(false);
  const [showRegistration, setShowRegistration] = useState(false);
  const [email, setEmail] = useState("");
  const gridRef = useRef<HTMLDivElement>(null);

  const matches = query.trim()
    ? PARTICIPANTS.filter(p => p.toLowerCase().includes(query.toLowerCase()))
    : [];

  useEffect(() => {
    if (matches.length > 0 && gridRef.current) {
      const first = gridRef.current.querySelector("[data-match='true']");
      first?.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [query]);

  return (
    <div className="min-h-screen px-4 pt-8 pb-16 max-w-4xl mx-auto" dir="rtl">
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="w-2.5 h-2.5 rounded-full bg-yellow-400 animate-pulse" />
        <span className="text-yellow-400 font-bold tracking-widest uppercase text-sm" style={{ fontFamily: "Orbitron,monospace" }}>
          GATHERING — يتجمع المتسابقون
        </span>
      </div>

      <h1 className="text-2xl sm:text-4xl font-black text-white text-center mb-8">
        الذكرى العاشرة — السحب الكبير 🎯
      </h1>

      {/* Search */}
      <div className="mb-6 relative">
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="🔍  ابحث عن اسمك في القائمة..."
          className="w-full px-5 py-4 rounded-2xl text-white text-lg placeholder-white/40 outline-none border border-white/10 transition-all focus:border-yellow-400/60"
          style={{ background: "rgba(255,255,255,0.06)", fontFamily: "inherit" }}
        />
        {query && matches.length === 0 && (
          <div className="mt-3 rounded-xl border border-red-500/30 p-4 text-center"
            style={{ background: "rgba(220,38,38,0.08)" }}>
            <p className="text-red-400 font-bold mb-2">⚠️ اسمك مش موجود في القائمة!</p>
            <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
              className="text-green-400 underline underline-offset-4 text-sm hover:text-green-300 transition-colors">
              اشترك الآن عبر قناة واتساب ←
            </a>
          </div>
        )}
      </div>

      {/* Participant Grid */}
      <div ref={gridRef} className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-10 max-h-72 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: "rgba(220,38,38,0.4) transparent" }}>
        {PARTICIPANTS.map((p) => {
          const isMatch = query.trim() && p.toLowerCase().includes(query.toLowerCase());
          return (
            <div key={p} data-match={isMatch ? "true" : "false"}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-300 text-center truncate
                ${isMatch
                  ? "bg-cyan-500/20 border border-cyan-400/70 text-cyan-300 scale-105 shadow-lg shadow-cyan-500/20"
                  : "border border-white/8 text-white/60"
                }`}
              style={{ background: isMatch ? undefined : "rgba(255,255,255,0.03)" }}>
              {p}
            </div>
          );
        })}
      </div>

      {/* CTAs */}
      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <button
          onClick={() => { setPulsed(true); setTimeout(() => setPulsed(false), 600); }}
          className={`flex-1 py-3 rounded-xl font-bold text-white transition-all duration-200 border border-yellow-400/30 ${pulsed ? "scale-95 bg-yellow-500/30" : "bg-yellow-500/10 hover:bg-yellow-500/20"}`}>
          هل أنت متحمس؟ ⚡
        </button>
        <button
          onClick={() => setShowRegistration(true)}
          className="flex-1 py-3 rounded-xl font-bold text-white transition-all hover:scale-105 border border-red-400/30 bg-red-500/10 hover:bg-red-500/20">
          دخول فيديو المسابقة 🎬
        </button>
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg,#128C7E,#25D366)", boxShadow: "0 4px 24px rgba(37,211,102,0.35)" }}>
        <span className="text-2xl">📢</span>
        انضم لقناة واتساب الرسمية
      </a>

      {/* Registration Modal */}
      {showRegistration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
          onClick={e => { if (e.target === e.currentTarget) setShowRegistration(false); }}>
          <div className="w-full max-w-md rounded-2xl border border-white/15 p-8 relative"
            style={{ background: "rgba(15,15,25,0.95)", boxShadow: "0 0 60px rgba(220,38,38,0.25)" }}>
            <button onClick={() => setShowRegistration(false)}
              className="absolute top-4 left-4 text-white/40 hover:text-white text-xl transition-colors">✕</button>
            <h3 className="text-xl font-black text-white mb-2 text-center">الحساب موثق ✅</h3>
            <p className="text-white/60 text-center mb-6 text-sm">أنت جاهز للسحب. تابع البث المباشر في الموعد المحدد.</p>
            <div className="relative mb-4">
              <input
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="أدخل بريدك الإلكتروني"
                className="w-full px-4 py-3 rounded-xl text-white placeholder-white/30 outline-none border border-white/10 focus:border-red-400/60"
                style={{ background: "rgba(255,255,255,0.06)" }}
                dir="ltr"
              />
            </div>
            <button className="w-full py-3 rounded-xl font-bold text-white transition-all hover:scale-[1.02]"
              style={{ background: "linear-gradient(135deg,#dc2626,#b91c1c)", boxShadow: "0 4px 20px rgba(220,38,38,0.4)" }}>
              توثيق واشتراك 🔐
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ─── LIVE DRAW ─── */
interface Winner { username: string; rank: 1 | 2 | 3 }

function CipherWheel({ spinning }: { spinning: boolean }) {
  const rings = [
    { size: 220, duration: 3.2, reverse: false, color: "#dc2626" },
    { size: 170, duration: 2.1, reverse: true, color: "#f59e0b" },
    { size: 120, duration: 1.5, reverse: false, color: "#dc2626" },
    { size: 70,  duration: 2.8, reverse: true, color: "#f59e0b" },
  ];

  return (
    <div className="relative flex items-center justify-center" style={{ width: 240, height: 240 }}>
      {rings.map((ring, i) => (
        <div key={i}
          className="absolute rounded-full border-2"
          style={{
            width: ring.size,
            height: ring.size,
            borderColor: ring.color,
            boxShadow: `0 0 ${12 + i * 4}px ${ring.color}55`,
            opacity: spinning ? 1 : 0.45,
            animation: spinning
              ? `${ring.reverse ? "spin-ccw" : "spin-cw"} ${ring.duration}s linear infinite`
              : "none",
            transition: "opacity 0.5s"
          }}>
          {[0, 90, 180, 270].map(deg => (
            <div key={deg}
              className="absolute w-1.5 h-1.5 rounded-full"
              style={{
                background: ring.color,
                top: "50%",
                left: "50%",
                transformOrigin: "0 0",
                transform: `rotate(${deg}deg) translate(${ring.size / 2 - 4}px, -3px)`,
                boxShadow: `0 0 6px ${ring.color}`
              }} />
          ))}
        </div>
      ))}
      <div className="relative z-10 flex flex-col items-center justify-center w-14 h-14 rounded-full border-2 border-yellow-400"
        style={{
          background: "linear-gradient(135deg,#1a0a00,#2a1000)",
          boxShadow: "0 0 20px rgba(245,158,11,0.6)"
        }}>
        <span className="text-yellow-400 font-black text-sm tracking-widest leading-none"
          style={{ fontFamily: "Orbitron,monospace" }}>CFS</span>
      </div>
    </div>
  );
}

const RANK_LABELS: Record<number, string> = { 1: "المركز الأول 🥇", 2: "المركز الثاني 🥈", 3: "المركز الثالث 🥉" };
const RANK_COLORS: Record<number, string> = { 1: "#f59e0b", 2: "#94a3b8", 3: "#cd7f32" };

function StateLiveDraw({ onComplete }: { onComplete: (winners: Winner[]) => void }) {
  const [spinning, setSpinning] = useState(false);
  const [currentName, setCurrentName] = useState("???");
  const [winners, setWinners] = useState<Winner[]>([]);
  const [drawing, setDrawing] = useState(false);
  const [pool, setPool] = useState(PARTICIPANTS);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const nextRank = (winners.length + 1) as 1 | 2 | 3;
  const done = winners.length === 3;

  const runDraw = useCallback(() => {
    if (drawing || done) return;
    setDrawing(true);
    setSpinning(true);

    let speed = 50;
    let elapsed = 0;
    const totalTime = 4000;
    let idx = 0;
    const currentPool = pool.filter(p => !winners.find(w => w.username === p));

    const tick = () => {
      idx = Math.floor(Math.random() * currentPool.length);
      setCurrentName(currentPool[idx]);
      elapsed += speed;

      if (elapsed > totalTime * 0.6) speed = Math.min(speed + 30, 400);

      if (elapsed >= totalTime) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        const winner = currentPool[idx];
        setCurrentName(winner);
        setSpinning(false);
        const rank = nextRank;
        setWinners(prev => [...prev, { username: winner, rank }]);
        setPool(prev => prev.filter(p => p !== winner));
        setDrawing(false);
      }
    };

    intervalRef.current = setInterval(tick, speed);

    setTimeout(() => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }, totalTime + 500);
  }, [drawing, done, pool, winners, nextRank]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-16" dir="rtl">
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="w-3 h-3 rounded-full bg-red-500 animate-pulse" style={{ boxShadow: "0 0 10px #dc2626" }} />
        <span className="text-red-400 font-black tracking-widest uppercase" style={{ fontFamily: "Orbitron,monospace" }}>
          LIVE DRAWING — السحب الآن
        </span>
      </div>

      <CipherWheel spinning={spinning} />

      <div className="mt-8 mb-6 relative">
        <div className="px-10 py-4 rounded-2xl border-2 min-w-64 text-center"
          style={{
            borderColor: spinning ? "#dc2626" : "#374151",
            background: spinning ? "rgba(220,38,38,0.08)" : "rgba(255,255,255,0.04)",
            boxShadow: spinning ? "0 0 30px rgba(220,38,38,0.3)" : "none",
            transition: "all 0.3s"
          }}>
          <span className={`font-black text-2xl sm:text-3xl ${spinning ? "text-red-400" : "text-white"}`}
            style={{ fontFamily: "Orbitron,monospace", textShadow: spinning ? "0 0 20px #dc2626" : "none" }}>
            {currentName}
          </span>
        </div>
      </div>

      {!done ? (
        <button
          onClick={runDraw}
          disabled={drawing}
          className="px-10 py-3 rounded-2xl font-black text-white text-lg transition-all mb-8 disabled:opacity-40"
          style={{
            background: drawing ? "rgba(220,38,38,0.2)" : "linear-gradient(135deg,#dc2626,#991b1b)",
            boxShadow: drawing ? "none" : "0 4px 24px rgba(220,38,38,0.5)",
            fontFamily: "Orbitron,monospace"
          }}>
          {drawing ? "جاري السحب..." : winners.length === 0 ? "🎰 ابدأ السحب" : `🎰 سحب الفائز ${nextRank}`}
        </button>
      ) : (
        <button
          onClick={() => onComplete(winners)}
          className="px-10 py-3 rounded-2xl font-black text-black text-lg transition-all hover:scale-105 mb-8"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 24px rgba(245,158,11,0.5)", fontFamily: "Orbitron,monospace" }}>
          🏆 عرض الفائزين
        </button>
      )}

      {winners.length > 0 && (
        <div className="w-full max-w-md space-y-3">
          {winners.map((w) => (
            <div key={w.rank}
              className="flex items-center gap-4 px-5 py-3 rounded-xl border animate-fade-in"
              style={{
                borderColor: `${RANK_COLORS[w.rank]}50`,
                background: `${RANK_COLORS[w.rank]}10`,
                boxShadow: `0 2px 12px ${RANK_COLORS[w.rank]}20`
              }}>
              <span className="w-10 h-10 rounded-full flex items-center justify-center font-black text-lg border-2"
                style={{ borderColor: RANK_COLORS[w.rank], color: RANK_COLORS[w.rank], flexShrink: 0 }}>
                {w.rank}
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-black text-white truncate">{w.username}</p>
                <p className="text-xs opacity-70" style={{ color: RANK_COLORS[w.rank] }}>{RANK_LABELS[w.rank]}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ─── RESULTS ─── */
const CHAR_IMAGES: Record<1 | 2 | 3, string> = {
  1: "/images/cfs-char-pink.png",
  2: "/images/cfs-char-blonde.png",
  3: "/images/cfs-char-blue.png",
};

const PLACE_LABELS: Record<1 | 2 | 3, { ar: string; badge: string; glow: string; bg: string; border: string }> = {
  1: { ar: "المركز الأول", badge: "🥇", glow: "rgba(245,158,11,0.5)", bg: "rgba(245,158,11,0.08)", border: "#f59e0b" },
  2: { ar: "المركز الثاني", badge: "🥈", glow: "rgba(148,163,184,0.4)", bg: "rgba(148,163,184,0.06)", border: "#94a3b8" },
  3: { ar: "المركز الثالث", badge: "🥉", glow: "rgba(205,127,50,0.35)", bg: "rgba(205,127,50,0.06)", border: "#cd7f32" },
};

function WinnerCard({ winner, delay }: { winner: Winner; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => { setTimeout(() => setVisible(true), delay); }, [delay]);
  const info = PLACE_LABELS[winner.rank];

  return (
    <div
      className="flex flex-col items-center rounded-2xl border-2 overflow-hidden transition-all duration-700"
      style={{
        borderColor: info.border,
        background: info.bg,
        boxShadow: `0 8px 40px ${info.glow}`,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0) scale(1)" : "translateY(30px) scale(0.95)",
        maxWidth: 280,
        width: "100%"
      }}>
      {winner.rank === 1 && (
        <div className="w-full h-1" style={{ background: `linear-gradient(90deg,transparent,${info.border},transparent)` }} />
      )}

      <div className="relative w-full flex justify-center pt-6 pb-2">
        <div className="relative w-40 h-40">
          <div className="absolute inset-0 rounded-full border-4 animate-spin-slow"
            style={{ borderColor: info.border, borderTopColor: "transparent", boxShadow: `0 0 20px ${info.glow}` }} />
          <div className="absolute inset-2 rounded-full overflow-hidden bg-black/50">
            <img
              src={CHAR_IMAGES[winner.rank]}
              alt={`Rank ${winner.rank}`}
              className="w-full h-full object-cover object-top"
            />
          </div>
        </div>
      </div>

      <div className="px-6 pb-6 text-center w-full">
        <span className="text-3xl mb-1 block">{info.badge}</span>
        <p className="text-white font-black text-xl mb-1 truncate">{winner.username}</p>
        <p className="text-sm font-bold mb-1" style={{ color: info.border }}>{info.ar}</p>
        <p className="text-xs text-white/35">CFS ID — #{winner.rank}000</p>
      </div>
    </div>
  );
}

function StateResults({ winners }: { winners: Winner[] }) {
  const podium: Array<Winner | null> = [
    winners.find(w => w.rank === 2) ?? null,
    winners.find(w => w.rank === 1) ?? null,
    winners.find(w => w.rank === 3) ?? null,
  ];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-10 pb-16" dir="rtl">
      <div className="text-center mb-12">
        <p className="text-yellow-400 text-sm tracking-[0.3em] uppercase mb-3" style={{ fontFamily: "Orbitron,monospace" }}>
          CFS 10TH ANNIVERSARY
        </p>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-2"
          style={{ textShadow: "0 0 40px rgba(245,158,11,0.5)" }}>
          🏆 الفائزون الكبار 🏆
        </h1>
        <p className="text-white/50">مبروك لجميع الفائزين!</p>
      </div>

      {/* Desktop podium: 2nd | 1st | 3rd */}
      <div className="hidden sm:flex items-end justify-center gap-6 w-full max-w-3xl">
        {podium.map((w, i) => {
          if (!w) return <div key={i} className="flex-1" />;
          return (
            <div key={w.rank} className={`flex-1 flex flex-col items-center ${w.rank === 1 ? "mb-0 -translate-y-6" : "translate-y-0"}`}>
              <WinnerCard winner={w} delay={i * 300 + 200} />
            </div>
          );
        })}
      </div>

      {/* Mobile: vertical, 1st on top */}
      <div className="flex sm:hidden flex-col items-center gap-6 w-full max-w-xs">
        {[1, 2, 3].map((rank, i) => {
          const w = winners.find(w => w.rank === rank);
          if (!w) return null;
          return <WinnerCard key={rank} winner={w} delay={i * 300 + 200} />;
        })}
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="mt-12 inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
        style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.4)" }}>
        📢 تابعنا على واتساب
      </a>
    </div>
  );
}

/* ─── MAIN PAGE ─── */
export default function GiveawayPage() {
  const forced = getForceState();
  const [appState, setAppState] = useState<AppState>(forced ?? getAutoState());
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (forced) return;
    const id = setInterval(() => {
      const next = getAutoState();
      setAppState(prev => (prev === 3 || prev === 4 ? prev : next));
    }, 5000);
    return () => clearInterval(id);
  }, [forced]);

  const handleDrawComplete = (w: Winner[]) => {
    setWinners(w);
    setAppState(4);
  };

  const stateToUse = forced ?? appState;

  return (
    <div
      className="min-h-screen relative overflow-x-hidden"
      style={{
        background: "linear-gradient(180deg,#08090f 0%,#0f0a0a 40%,#0a0a12 100%)",
        fontFamily: "'Poppins','Inter',system-ui,sans-serif"
      }}>
      {/* Ambient glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[300px] opacity-15 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse,#dc2626 0%,transparent 70%)" }} />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 opacity-8 rounded-full blur-3xl"
          style={{ background: "radial-gradient(ellipse,#f59e0b 0%,transparent 70%)" }} />
      </div>

      {/* Debug nav (only when ?state= is set) */}
      {forced && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          {([1, 2, 3, 4] as AppState[]).map(s => (
            <a key={s} href={`?state=${s}`}
              className={`px-3 py-1 rounded-lg text-xs font-bold border transition-all ${stateToUse === s ? "bg-red-600 border-red-500 text-white" : "border-white/20 text-white/40 hover:text-white"}`}>
              S{s}
            </a>
          ))}
        </div>
      )}

      {stateToUse === 1 && <StateStandby />}
      {stateToUse === 2 && <StateGathering />}
      {stateToUse === 3 && <StateLiveDraw onComplete={handleDrawComplete} />}
      {stateToUse === 4 && <StateResults winners={winners.length > 0 ? winners : [
        { username: "???", rank: 1 },
        { username: "???", rank: 2 },
        { username: "???", rank: 3 },
      ]} />}
    </div>
  );
}
