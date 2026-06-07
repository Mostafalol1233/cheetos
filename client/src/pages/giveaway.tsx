import { useState, useEffect, useRef, useCallback } from "react";
import { useUserAuth } from "@/lib/user-auth-context";
import { API_BASE_URL } from "@/lib/queryClient";

/* ─── Participants ─── */
const RAW = [
  "GW_Luffy","sky_CTM","WP*Ghost","Trillionaire","Millionaire.",".REVO_","BOOOM","rtBELAL",
  "N4S3R","Mostafa","{M}M!Do™","{NV}~T!GeR~?","5TR.","HM Sh1ro","Kemaro","-HB]MOS1BA.",
  "Xyilo","maddeR","2 Divysho",".Peter","-Aspect","Starco","BigoPew","BillyPew",
  "_ITS]*Judy*_","-Crispy 2","-SW]7amo0o","Azaro","-Francisco","Z3R0","1St_7oda","-K1",
  "JasonStatham","[G]iven]*","-NUL Martin","Ravager. Kda","Naxus","E-L-D-O-D-_-","Haredy",
  "-Ghost?","AlRose","Luxuriouse.","Hamdy.","Murr","drax.","-YourDaddy",".WaZeR.","Al3gamawy",
  "-HB]Shadow","-HB]Dark","Vladimir2011","Choklet mH",
];
const ALL_PARTICIPANTS = Array.from(new Set(RAW));

/* ─── Config ─── */
const DRAW_TIME = new Date("2025-10-10T22:00:00+03:00");
const GATHER_TIME = new Date("2025-10-10T21:30:00+03:00");
const WHATSAPP_URL = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";

/* ─── Colors (no neon) ─── */
const BG     = "#060608";
const RED    = "#9f1239";
const GOLD   = "#b45309";
const SILVER = "#64748b";
const BRONZE = "#92400e";
const LINE   = "rgba(255,255,255,0.07)";

/* ─── Time helpers ─── */
function getCairo() {
  const n = new Date();
  return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 3 * 3600000);
}
type State = 1 | 2 | 3 | 4;
function forcedState(): State | null {
  const p = new URLSearchParams(window.location.search), s = p.get("state");
  return s === "1" ? 1 : s === "2" ? 2 : s === "3" ? 3 : s === "4" ? 4 : null;
}
function autoState(): State {
  const n = getCairo();
  if (n < GATHER_TIME) return 1;
  if (n < DRAW_TIME)   return 2;
  return 3;
}
function useCountdown(target: Date) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const tick = () => setMs(Math.max(0, target.getTime() - getCairo().getTime()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [target]);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
    done: ms === 0,
  };
}

/* ─── Audio ─── */
let _ctx: AudioContext | null = null;
function ctx() {
  if (!_ctx) try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
  return _ctx;
}
function tone(freq: number, dur: number, vol = 0.12) {
  const c = ctx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.connect(g); g.connect(c.destination);
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  o.start(); o.stop(c.currentTime + dur);
}
function playElim() { tone(280, 0.3); }
function playFanfare() {
  [[523,0],[659,130],[784,260],[1047,400]].forEach(([f,t]) =>
    setTimeout(() => tone(f, 0.7, 0.18), t));
}

/* ─── SVG Wheel ─── */
const CX = 250, CY = 250, OR = 232, IR = 58;
function polar(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}
function arc(s: number, e: number) {
  const a = polar(OR, s), b = polar(OR, e), c_ = polar(IR, e), d = polar(IR, s);
  const lg = e - s > 180 ? 1 : 0;
  return `M${a.x} ${a.y} A${OR} ${OR} 0 ${lg} 1 ${b.x} ${b.y} L${c_.x} ${c_.y} A${IR} ${IR} 0 ${lg} 0 ${d.x} ${d.y}Z`;
}
const FILLS = ["#0c1526", "#111f3a"];

interface WheelProps {
  participants: string[];
  eliminated: Set<string>;
  rotation: number;
  transitioning: boolean;
  onEnd: () => void;
}
function Wheel({ participants, eliminated, rotation, transitioning, onEnd }: WheelProps) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [onEnd]);

  const n = participants.length;
  const seg = 360 / n;

  return (
    <div style={{ position: "relative", width: 320, height: 320 }}>
      {/* pointer */}
      <svg width="28" height="32" viewBox="0 0 28 32"
        style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <polygon points="14,32 0,0 28,0" fill={RED} />
        <polygon points="14,25 5,5 23,5" fill="#fff" opacity="0.9" />
      </svg>

      <svg viewBox="0 0 500 500" width="320" height="320">
        <g ref={ref} style={{
          transform: `rotate(${rotation}deg)`,
          transformOrigin: `${CX}px ${CY}px`,
          transition: transitioning ? "transform 4.6s cubic-bezier(0.12,0.82,0.08,1.0)" : "none",
        }}>
          {participants.map((name, i) => {
            const s = i * seg, e = (i + 1) * seg, mid = s + seg / 2;
            const lp = polar((OR + IR) / 2 + 8, mid);
            const elim = eliminated.has(name);
            return (
              <g key={name + i}>
                <path d={arc(s, e)}
                  fill={elim ? "#0a0a10" : FILLS[i % 2]}
                  stroke={elim ? "#1a1a22" : "#1e3a5f"}
                  strokeWidth="0.8"
                  opacity={elim ? 0.3 : 1}
                />
                {!elim && (
                  <text
                    x={lp.x} y={lp.y}
                    fontSize={Math.max(5, Math.min(8, 9 - n * 0.04))}
                    fontFamily="ui-monospace,monospace"
                    fontWeight="700"
                    fill="rgba(255,255,255,0.85)"
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${mid - 90},${lp.x},${lp.y})`}
                  >
                    {name.length > 6 ? name.slice(0, 6) : name}
                  </text>
                )}
              </g>
            );
          })}
        </g>
        {/* hub */}
        <circle cx={CX} cy={CY} r={IR} fill={BG} stroke={RED} strokeWidth="2" />
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="12" fontWeight="900"
          fontFamily="ui-monospace,monospace" fill="#fff">CFS</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9"
          fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.4)">DRAW</text>
      </svg>
    </div>
  );
}

/* ─── Inline Login ─── */
function InlineLogin() {
  const { login, register, isAuthenticated, user, logout } = useUserAuth();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const inp = "w-full px-4 py-3 rounded-lg text-white text-sm outline-none placeholder-white/30 bg-white/[0.04] border border-white/10 focus:border-white/25 transition-colors";
  const isParticipant = user && ALL_PARTICIPANTS.some(p => p.toLowerCase().includes(user.name?.toLowerCase() || "") || (user.name || "").toLowerCase().includes(p.toLowerCase()));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true); setErr("");
    try {
      if (tab === "login") {
        await login(email, password);
      } else {
        await register({ name, email, password });
      }
    } catch (ex: any) {
      setErr(ex?.message || "حدث خطأ");
    } finally {
      setLoading(false);
    }
  }

  if (isAuthenticated && user) {
    return (
      <div className="p-5 rounded-xl" style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${LINE}` }}>
        <p className="text-white/50 text-xs uppercase tracking-widest mb-1">Signed in as</p>
        <p className="text-white font-bold text-lg">{user.name}</p>
        {isParticipant && (
          <p className="text-xs mt-2 font-semibold" style={{ color: GOLD }}>
            Your name is in the draw — good luck
          </p>
        )}
        <button onClick={logout}
          className="mt-4 text-xs text-white/30 hover:text-white/60 transition-colors underline underline-offset-4">
          Sign out
        </button>
      </div>
    );
  }

  return (
    <div style={{ background: "rgba(255,255,255,0.02)", border: `1px solid ${LINE}` }} className="rounded-xl p-5">
      <p className="text-white font-semibold mb-4 text-sm">سجل دخول لمتابعة السحب</p>
      <div className="flex gap-3 mb-4">
        {(["login","register"] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            className="text-xs font-semibold pb-1 border-b-2 transition-colors"
            style={{ borderColor: tab === t ? RED : "transparent", color: tab === t ? "#fff" : "rgba(255,255,255,0.35)" }}>
            {t === "login" ? "تسجيل الدخول" : "إنشاء حساب"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {tab === "register" && (
          <input value={name} onChange={e => setName(e.target.value)} placeholder="الاسم" className={inp} required />
        )}
        <input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="البريد الإلكتروني" className={inp} required />
        <input value={password} onChange={e => setPassword(e.target.value)} type="password" placeholder="كلمة المرور" className={inp} required />
        {err && <p className="text-red-400 text-xs">{err}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50"
          style={{ background: RED }}>
          {loading ? "..." : tab === "login" ? "دخول" : "إنشاء حساب"}
        </button>
      </form>
    </div>
  );
}

/* ─── Countdown block ─── */
function CountBox({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-lg"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}` }}>
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums" style={{ fontFamily: "ui-monospace,monospace" }}>
          {String(v).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs uppercase tracking-widest text-white/30">{label}</span>
    </div>
  );
}

/* ─── State 1: Standby ─── */
function StateStandby() {
  const { d, h, m, s } = useCountdown(GATHER_TIME);
  return (
    <div className="min-h-screen" dir="rtl">
      {/* Hero image — NO text on it */}
      <img
        src="/images/cf-esports-banner.jpg"
        alt="CrossFire Esports"
        className="w-full object-cover block"
        style={{ height: 260, objectPosition: "center 30%" }}
      />

      <div className="max-w-2xl mx-auto px-5 pb-20 pt-10">
        {/* Title */}
        <p className="text-xs uppercase tracking-[0.35em] text-white/40 mb-3">
          CFS 10TH ANNIVERSARY — GRAND GIVEAWAY
        </p>
        <h1 className="text-5xl sm:text-7xl font-black text-white leading-none mb-2">
          الذكرى<br/>العاشرة
        </h1>
        <p className="text-white/40 text-base mb-10">السحب الكبير — Lucky Draw</p>

        {/* Countdown */}
        <p className="text-xs uppercase tracking-widest text-white/30 mb-4">Draw starts in</p>
        <div className="flex gap-4 mb-14">
          <CountBox v={d} label="Days" />
          <CountBox v={h} label="Hours" />
          <CountBox v={m} label="Min" />
          <CountBox v={s} label="Sec" />
        </div>

        {/* Prize */}
        <div className="mb-10" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 32 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-6">Grand Prize</p>
          <div className="flex gap-5 items-center">
            <img src="/images/cf-characters.png" alt="Team Goddess"
              className="rounded-xl object-contain"
              style={{ width: 140, height: 140, background: "rgba(255,255,255,0.03)", padding: 8 }} />
            <div>
              <p className="text-white font-black text-xl leading-tight mb-1">
                Battle Pass E-Sports
              </p>
              <p className="text-white/50 text-sm leading-relaxed">
                حزمة البطولة الكاملة<br/>
                Team Goddess CF Pass
              </p>
            </div>
          </div>
        </div>

        {/* Auth */}
        <div className="mb-10" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 32 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-5">Your Account</p>
          <InlineLogin />
        </div>

        {/* Participants preview */}
        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 32 }}>
          <p className="text-xs uppercase tracking-[0.3em] text-white/30 mb-4">
            {ALL_PARTICIPANTS.length} Participants
          </p>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5">
            {ALL_PARTICIPANTS.map(p => (
              <div key={p} className="px-2 py-1.5 rounded text-xs text-white/40 truncate text-center"
                style={{ background: "rgba(255,255,255,0.025)", border: `1px solid ${LINE}` }}>
                {p}
              </div>
            ))}
          </div>
        </div>

        {/* Subtle WhatsApp */}
        <div className="mt-12 text-center">
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-4">
            القناة الرسمية على واتساب
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── State 2: Gathering ─── */
function StateGathering() {
  const { h, m, s } = useCountdown(DRAW_TIME);
  const [q, setQ] = useState("");
  return (
    <div className="min-h-screen" dir="rtl">
      <img src="/images/cf-esports-banner.jpg" alt="CrossFire Esports"
        className="w-full object-cover block"
        style={{ height: 200, objectPosition: "center 30%", filter: "brightness(0.7)" }} />

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <p className="text-xs uppercase tracking-widest text-white/30 mb-2">السحب يبدأ خلال</p>
        <div className="flex gap-3 mb-10">
          <CountBox v={h} label="Hours" />
          <CountBox v={m} label="Min" />
          <CountBox v={s} label="Sec" />
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }} className="mb-8">
          <p className="text-xs uppercase tracking-widest text-white/30 mb-5">
            {ALL_PARTICIPANTS.length} Participants Registered
          </p>
          <input value={q} onChange={e => setQ(e.target.value)}
            placeholder="Search your name..."
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none placeholder-white/25 mb-4"
            style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}` }} />

          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-56 overflow-y-auto"
            style={{ scrollbarWidth: "thin", scrollbarColor: `${RED}44 transparent` }}>
            {ALL_PARTICIPANTS.filter(p => !q || p.toLowerCase().includes(q.toLowerCase())).map(p => {
              const hit = q && p.toLowerCase().includes(q.toLowerCase());
              return (
                <div key={p} className="px-2 py-1.5 rounded text-xs text-center truncate transition-all"
                  style={{
                    background: hit ? `${RED}18` : "rgba(255,255,255,0.025)",
                    border: `1px solid ${hit ? RED + "55" : LINE}`,
                    color: hit ? "#fff" : "rgba(255,255,255,0.4)",
                    fontWeight: hit ? 700 : 400,
                  }}>
                  {p}
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }}>
          <InlineLogin />
        </div>
      </div>
    </div>
  );
}

/* ─── State 3: Live Draw ─── */
interface Winner { username: string; rank: 1 | 2 | 3 }

function useTypewriter(text: string, active: boolean) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!active || !text) { setShown(""); return; }
    setShown("");
    let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, 60);
    return () => clearInterval(id);
  }, [text, active]);
  return shown;
}

function StateLiveDraw({ onComplete }: { onComplete: (w: Winner[]) => void }) {
  /* 
   * Wheel now uses the REMAINING participants as segments — as people are eliminated
   * the remaining segments each become wider (self-shrinking wheel effect).
   */
  const [remaining, setRemaining] = useState<string[]>(ALL_PARTICIPANTS);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [rotation, setRotation] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [lastElim, setLastElim] = useState("");
  const [showElim, setShowElim] = useState(false);
  const [drawStarted, setDrawStarted] = useState(false);
  const busyRef = useRef(false);
  const rotRef = useRef(0);
  const remainRef = useRef(ALL_PARTICIPANTS);
  const victimRef = useRef("");

  const typed = useTypewriter(lastElim, showElim);

  /* Auto-start check */
  useEffect(() => {
    const id = setInterval(() => {
      if (getCairo() >= DRAW_TIME) { setDrawStarted(true); clearInterval(id); }
    }, 1000);
    // Also check immediately (useful when state forced via ?state=3)
    if (forcedState() === 3) setDrawStarted(true);
    return () => clearInterval(id);
  }, []);

  /* Spin one participant off the wheel */
  const spinOnce = useCallback(() => {
    if (busyRef.current) return;
    const pool = remainRef.current;
    if (pool.length <= 3) return;
    busyRef.current = true;

    /* Pick victim at random */
    const victimIdx = Math.floor(Math.random() * pool.length);
    const victim = pool[victimIdx];

    /* Calculate rotation to land pointer on victim segment */
    const n = pool.length;
    const segDeg = 360 / n;
    const centerOfVictim = (victimIdx + 0.5) * segDeg;
    const curMod = rotRef.current % 360;
    const addAngle = (centerOfVictim - curMod + 360) % 360;
    const spins = 5 + Math.floor(Math.random() * 2);
    const newRot = rotRef.current + 360 * spins + addAngle;

    victimRef.current = victim;
    rotRef.current = newRot;
    setRotation(newRot);
    setTransitioning(true);
    tone(350 + Math.random() * 150, 0.05, 0.08);
  }, []);

  /* Called when CSS transition ends */
  const handleTransitionEnd = useCallback(() => {
    setTransitioning(false);
    const victim = victimRef.current;

    const newRemaining = remainRef.current.filter(p => p !== victim);
    remainRef.current = newRemaining;

    setEliminated(prev => new Set([...prev, victim]));
    setLastElim(victim);
    setShowElim(false);
    setTimeout(() => setShowElim(true), 80);
    setRemaining(newRemaining);

    playElim();

    if (newRemaining.length <= 3) {
      playFanfare();
      setTimeout(() => {
        onComplete(newRemaining.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 })));
      }, 2000);
      busyRef.current = false;
    } else {
      /* Wait then spin again */
      setTimeout(() => {
        busyRef.current = false;
        spinOnce();
      }, 4200);
    }
  }, [spinOnce, onComplete]);

  /* Kick off when draw starts */
  useEffect(() => {
    if (!drawStarted || transitioning || busyRef.current) return;
    const t = setTimeout(spinOnce, 1500);
    return () => clearTimeout(t);
  }, [drawStarted, spinOnce, transitioning]);

  const { h, m, s, done } = useCountdown(DRAW_TIME);
  const pct = ((ALL_PARTICIPANTS.length - remaining.length) / (ALL_PARTICIPANTS.length - 3)) * 100;

  return (
    <div className="min-h-screen flex flex-col items-center" dir="rtl">
      {/* Banner (clean, no text) */}
      <img src="/images/cf-esports-banner.jpg" alt="CrossFire Esports"
        className="w-full object-cover block"
        style={{ height: 160, objectPosition: "center 30%", filter: "brightness(0.5)" }} />

      <div className="w-full max-w-xl px-5 pt-8 pb-16 flex flex-col items-center">
        {/* Title row */}
        <p className="text-xs uppercase tracking-widest text-white/30 mb-2">Live Draw — العجلة الحية</p>
        <h2 className="text-3xl font-black text-white mb-8">الذكرى العاشرة</h2>

        {!drawStarted ? (
          <div className="text-center mb-10">
            <p className="text-white/40 text-sm mb-4">السحب يبدأ تلقائيا في الساعة 10 مساء</p>
            <div className="flex gap-4 justify-center">
              <CountBox v={h} label="Hours" />
              <CountBox v={m} label="Min" />
              <CountBox v={s} label="Sec" />
            </div>
          </div>
        ) : null}

        {/* Wheel */}
        <Wheel
          participants={remaining}
          eliminated={eliminated}
          rotation={rotation}
          transitioning={transitioning}
          onEnd={handleTransitionEnd}
        />

        {/* Counters */}
        <div className="flex gap-8 mt-6 text-center">
          <div>
            <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "ui-monospace,monospace" }}>
              {remaining.length}
            </p>
            <p className="text-xs text-white/30 mt-1">Remaining</p>
          </div>
          <div style={{ width: 1, background: LINE }} />
          <div>
            <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "ui-monospace,monospace" }}>
              {ALL_PARTICIPANTS.length - remaining.length}
            </p>
            <p className="text-xs text-white/30 mt-1">Eliminated</p>
          </div>
        </div>

        {/* Eliminated name */}
        <div className="h-16 flex items-center justify-center w-full mt-4">
          {showElim && lastElim && (
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest text-white/25 mb-1">Eliminated</p>
              <p className="text-2xl font-black text-white/70" style={{ fontFamily: "ui-monospace,monospace" }}>
                {typed}<span style={{ opacity: typed.length < lastElim.length ? 0.5 : 0 }}>_</span>
              </p>
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="w-full mt-6">
          <div className="w-full h-0.5 rounded-full overflow-hidden" style={{ background: LINE }}>
            <div className="h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(100, pct)}%`, background: RED }} />
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── State 4: Results ─── */
const RANK_META = [
  { label: "1ST PLACE", ar: "المركز الأول",   color: GOLD,   prize: "Battle Pass E-Sports + Team Goddess CF Pass" },
  { label: "2ND PLACE", ar: "المركز الثاني",  color: SILVER, prize: "Battle Pass E-Sports" },
  { label: "3RD PLACE", ar: "المركز الثالث",  color: BRONZE, prize: "Battle Pass E-Sports" },
];

function WinnerCard({ username, rank, delay }: { username: string; rank: 1 | 2 | 3; delay: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const meta = RANK_META[rank - 1];
  const isFirst = rank === 1;

  return (
    <div style={{
      opacity: vis ? 1 : 0,
      transform: vis ? "translateY(0)" : "translateY(32px)",
      transition: "opacity 0.7s ease, transform 0.7s ease",
      border: `1px solid ${isFirst ? meta.color + "44" : LINE}`,
      background: isFirst ? `${meta.color}06` : "rgba(255,255,255,0.02)",
    }} className="rounded-xl overflow-hidden">
      {isFirst && (
        <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${meta.color},transparent)` }} />
      )}
      <div className="p-6 text-center">
        <p className="text-xs uppercase tracking-[0.3em] mb-4 font-semibold"
          style={{ color: meta.color, fontFamily: "ui-monospace,monospace" }}>
          {meta.label} — {meta.ar}
        </p>
        <img src="/images/cf-characters.png" alt="Team Goddess"
          className="mx-auto mb-4 rounded-lg object-contain"
          style={{ height: isFirst ? 120 : 80, background: "rgba(0,0,0,0.4)", padding: 8 }} />
        <p className="text-white font-black text-2xl sm:text-3xl mb-2 break-all">{username}</p>
        <p className="text-white/30 text-xs">{meta.prize}</p>
      </div>
    </div>
  );
}

function StateResults({ winners }: { winners: { username: string; rank: 1 | 2 | 3 }[] }) {
  return (
    <div className="min-h-screen" dir="rtl">
      <img src="/images/cf-esports-banner.jpg" alt="CrossFire Esports"
        className="w-full object-cover block"
        style={{ height: 220, objectPosition: "center 30%", filter: "brightness(0.45)" }} />

      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <p className="text-xs uppercase tracking-[0.35em] text-white/30 mb-2">
          CFS 10TH ANNIVERSARY — RESULTS
        </p>
        <h1 className="text-5xl sm:text-7xl font-black text-white mb-10">الفائزون</h1>

        {/* 1st place — wide */}
        {winners.filter(w => w.rank === 1).map(w => (
          <div key={w.username} className="mb-5">
            <WinnerCard {...w} delay={200} />
          </div>
        ))}

        {/* 2nd and 3rd side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {winners.filter(w => w.rank !== 1).map((w, i) => (
            <WinnerCard key={w.username} {...w} delay={600 + i * 350} />
          ))}
        </div>

        <div className="mt-14 pt-8" style={{ borderTop: `1px solid ${LINE}` }}>
          <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-4">
            القناة الرسمية على واتساب للمزيد من التفاصيل
          </a>
        </div>
      </div>
    </div>
  );
}

/* ─── Root ─── */
export default function GiveawayPage() {
  const forced = forcedState();
  const [state, setState] = useState<State>(forced ?? autoState());
  const [winners, setWinners] = useState<{ username: string; rank: 1 | 2 | 3 }[]>([]);

  useEffect(() => {
    if (forced) return;
    const id = setInterval(() => setState(s => s >= 3 ? s : autoState()), 5000);
    return () => clearInterval(id);
  }, [forced]);

  const handleComplete = (w: { username: string; rank: 1 | 2 | 3 }[]) => {
    setWinners(w);
    setState(4);
  };

  const cur = forced ?? state;

  return (
    <div className="min-h-screen" style={{ background: BG, color: "#fff", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Dev state nav */}
      {forced !== null && (
        <div className="fixed top-3 right-3 z-50 flex gap-1">
          {([1,2,3,4] as State[]).map(n => (
            <a key={n} href={`?state=${n}`}
              className="px-2.5 py-1 rounded text-xs font-bold"
              style={{
                background: cur === n ? RED : "rgba(255,255,255,0.05)",
                border: `1px solid ${cur === n ? RED : LINE}`,
                color: cur === n ? "#fff" : "rgba(255,255,255,0.3)",
              }}>
              S{n}
            </a>
          ))}
        </div>
      )}

      {cur === 1 && <StateStandby />}
      {cur === 2 && <StateGathering />}
      {cur === 3 && <StateLiveDraw onComplete={handleComplete} />}
      {cur === 4 && <StateResults winners={winners.length > 0 ? winners : [
        { username: "Winner 1", rank: 1 },
        { username: "Winner 2", rank: 2 },
        { username: "Winner 3", rank: 3 },
      ]} />}
    </div>
  );
}
