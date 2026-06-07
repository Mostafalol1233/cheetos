import { useState, useEffect, useRef, useCallback } from "react";

/* ─── Constants ─── */
const WHATSAPP = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";
const BLUE  = "#2563eb";
const BLUE2 = "#1d4ed8";
const BLUE3 = "#3b82f6";

const RAW = [
  "GW_Luffy","sky_CTM","WP*Ghost","Trillionaire","Millionaire.",".REVO_","BOOOM","rtBELAL",
  "N4S3R","Mostafa","{M}M!Do™","{NV}~T!GeR~?","5TR.","HM Sh1ro","Kemaro","-HB]MOS1BA.",
  "Xyilo","maddeR","2 Divysho",".Peter","-Aspect","Starco","N4S3R","BigoPew","BillyPew",
  "_ITS]*Judy*_","-Crispy 2","-SW]7amo0o","Azaro","-Francisco","Z3R0","1St_7oda","-K1",
  "JasonStatham","[G]iven]*","-NUL Martin","Ravager. Kda","Naxus","E-L-D-O-D-_-","Haredy",
  "-Ghost?","AlRose","Luxuriouse.","Hamdy.","Murr","drax.","-YourDaddy",".WaZeR.","Al3gamawy",
  "-HB]Shadow","-HB]Dark","Vladimir2011","Choklet mH",
];
const ALL_PARTICIPANTS = Array.from(new Set(RAW));

const PRIZES = [
  { rank: 1, en: "1ST PLACE", ar: "المركز الأول",  color: "#f59e0b",
    items: ["Team Goddess CF Pass", "HK417-P.B. Esports Star"],
    imgs: ["/images/cf-characters.png", "/images/cf-hk417.png"] },
  { rank: 2, en: "2ND PLACE", ar: "المركز الثاني", color: "#94a3b8",
    items: ["Colt 1911-Esports Star", "Kukri-Beast Esports Star"],
    imgs: ["/images/cf-colt1911.png", "/images/cf-kukri.png"] },
  { rank: 3, en: "3RD PLACE", ar: "المركز الثالث", color: "#cd7f32",
    items: ["CheyTac M200-Dominator", "Steyr TMP-E.D."],
    imgs: ["/images/cf-prizes-grid.png", "/images/cf-steyr.png"] },
];

/* ─── Time helpers ─── */
function getCairoTime() {
  const n = new Date(); return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 3 * 3600000);
}
function getTargetDates() {
  return { gathering: new Date("2025-10-10T21:30:00+03:00"), live: new Date("2025-10-10T22:00:00+03:00") };
}
type S = 1 | 2 | 3 | 4;
function autoState(): S {
  const n = getCairoTime(), { gathering, live } = getTargetDates();
  if (n < gathering) return 1; if (n < live) return 2; return 3;
}
function forcedState(): S | null {
  const p = new URLSearchParams(window.location.search), s = p.get("state");
  return s === "1" ? 1 : s === "2" ? 2 : s === "3" ? 3 : s === "4" ? 4 : null;
}

function useCountdown(target: Date) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const t = () => setDiff(Math.max(0, target.getTime() - getCairoTime().getTime()));
    t(); const id = setInterval(t, 1000); return () => clearInterval(id);
  }, [target]);
  return { d: Math.floor(diff / 86400000), h: Math.floor((diff % 86400000) / 3600000),
           m: Math.floor((diff % 3600000) / 60000), s: Math.floor((diff % 60000) / 1000) };
}

/* ─── Audio ─── */
let _ctx: AudioContext | null = null;
function getCtx() {
  if (!_ctx) { try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {} }
  return _ctx;
}
function beep(freq = 800, dur = 0.08, vol = 0.15) {
  const ctx = getCtx(); if (!ctx) return;
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.connect(g); g.connect(ctx.destination);
  o.frequency.value = freq;
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  o.start(); o.stop(ctx.currentTime + dur);
}
function fanfare() {
  [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => beep(f, 0.6, 0.2), i * 130));
}
function eliminateSound() { beep(300, 0.25, 0.18); }

/* ─── SVG Lucky Wheel ─── */
const CX = 250, CY = 250, OR = 230, IR = 64;

function polarXY(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function arcPath(startDeg: number, endDeg: number) {
  const s1 = polarXY(OR, startDeg), s2 = polarXY(OR, endDeg);
  const i1 = polarXY(IR, endDeg), i2 = polarXY(IR, startDeg);
  const large = endDeg - startDeg > 180 ? 1 : 0;
  return [
    `M ${s1.x} ${s1.y}`,
    `A ${OR} ${OR} 0 ${large} 1 ${s2.x} ${s2.y}`,
    `L ${i1.x} ${i1.y}`,
    `A ${IR} ${IR} 0 ${large} 0 ${i2.x} ${i2.y}`,
    `Z`,
  ].join(" ");
}

const SEG_COLORS = [["#0f172a","#1e3a8a"],["#1e293b","#1e40af"]];

interface WheelProps {
  remaining: string[];
  eliminated: Set<string>;
  rotation: number;
  spinning: boolean;
  onTransitionEnd: () => void;
}

function LuckyWheel({ remaining, eliminated, rotation, spinning, onTransitionEnd }: WheelProps) {
  const allNames = ALL_PARTICIPANTS;
  const n = allNames.length;
  const segDeg = 360 / n;
  const svgRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const el = svgRef.current;
    if (!el) return;
    const handler = () => onTransitionEnd();
    el.addEventListener("transitionend", handler);
    return () => el.removeEventListener("transitionend", handler);
  }, [onTransitionEnd]);

  return (
    <div className="relative flex items-center justify-center" style={{ width: 320, height: 320 }}>
      {/* Pointer arrow */}
      <div className="absolute z-20" style={{ top: -4, left: "50%", transform: "translateX(-50%)" }}>
        <svg width="24" height="28" viewBox="0 0 24 28">
          <polygon points="12,28 0,0 24,0" fill={BLUE} />
          <polygon points="12,22 4,4 20,4" fill="#fff" opacity="0.9" />
        </svg>
      </div>

      <svg viewBox="0 0 500 500" width="320" height="320">
        <g ref={svgRef}
          style={{
            transform: `rotate(${rotation}deg)`,
            transformOrigin: `${CX}px ${CY}px`,
            transition: spinning ? "transform 4.5s cubic-bezier(0.15,0.82,0.10,1.00)" : "none",
          }}>
          {allNames.map((name, i) => {
            const startDeg = i * segDeg;
            const endDeg = (i + 1) * segDeg;
            const midDeg = startDeg + segDeg / 2;
            const isElim = eliminated.has(name);
            const colPair = SEG_COLORS[i % 2];
            const fillColor = isElim ? "#111827" : colPair[0];
            const strokeColor = isElim ? "#1f2937" : colPair[1];
            const labelPos = polarXY((OR + IR) / 2 + 10, midDeg);
            const textRot = midDeg - 90;
            const label = name.length > 5 ? name.slice(0, 5) : name;

            return (
              <g key={name}>
                <path
                  d={arcPath(startDeg, endDeg)}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth="1"
                  opacity={isElim ? 0.35 : 1}
                />
                {!isElim && (
                  <text
                    x={labelPos.x} y={labelPos.y}
                    fontSize="7"
                    fontFamily="Orbitron,monospace"
                    fontWeight="600"
                    fill={BLUE3}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    transform={`rotate(${textRot}, ${labelPos.x}, ${labelPos.y})`}
                  >
                    {label}
                  </text>
                )}
              </g>
            );
          })}
        </g>

        {/* Center hub */}
        <circle cx={CX} cy={CY} r={IR} fill="#070810" stroke={BLUE} strokeWidth="2" />
        <circle cx={CX} cy={CY} r={IR - 6} fill={BLUE} fillOpacity="0.12" />
        <text x={CX} y={CY - 7} textAnchor="middle" fontSize="11" fontWeight="900"
          fontFamily="Orbitron,monospace" fill="#fff">CFS</text>
        <text x={CX} y={CY + 9} textAnchor="middle" fontSize="9"
          fontFamily="Orbitron,monospace" fill={BLUE3}>10TH</text>
      </svg>
    </div>
  );
}

/* ─── STATE 1: STANDBY ─── */
function TickBox({ val, label }: { val: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl relative overflow-hidden"
        style={{ background: "rgba(37,99,235,0.1)", border: `1px solid rgba(37,99,235,0.3)` }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${BLUE3},transparent)` }} />
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums" style={{ fontFamily: "Orbitron,monospace" }}>
          {String(val).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs uppercase tracking-widest font-semibold" style={{ color: BLUE3 }}>{label}</span>
    </div>
  );
}

function StateStandby() {
  const { gathering } = getTargetDates();
  const { d, h, m, s } = useCountdown(gathering);

  return (
    <div className="min-h-screen flex flex-col" dir="rtl">
      {/* Hero */}
      <div className="relative w-full overflow-hidden" style={{ maxHeight: 260 }}>
        <img src="/images/cf-esports-banner.jpg" alt="Crossfire Esports"
          className="w-full object-cover object-center" style={{ height: 260, filter: "brightness(0.55)" }} />
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4"
          style={{ background: "linear-gradient(to top, #070810 0%, transparent 60%)" }}>
          <p className="text-xs font-semibold tracking-[0.4em] uppercase mb-2" style={{ color: BLUE3, fontFamily: "Orbitron,monospace" }}>
            CFS 10TH ANNIVERSARY — GRAND GIVEAWAY
          </p>
          <h1 className="text-4xl sm:text-6xl font-black text-white" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.8)" }}>
            الذكرى العاشرة
          </h1>
          <p className="text-lg font-bold mt-1" style={{ color: BLUE3 }}>السحب الكبير · Lucky Draw</p>
        </div>
      </div>

      <div className="flex-1 px-4 pb-12 max-w-3xl mx-auto w-full">
        {/* Countdown */}
        <div className="flex justify-center gap-4 sm:gap-6 my-8">
          <TickBox val={d} label="Days" />
          <TickBox val={h} label="Hours" />
          <TickBox val={m} label="Min" />
          <TickBox val={s} label="Sec" />
        </div>

        {/* Subscribe CTA */}
        <div className="rounded-2xl mb-8 overflow-hidden" style={{ border: `1px solid rgba(37,99,235,0.3)`, background: "rgba(37,99,235,0.06)" }}>
          <div className="px-6 py-5 text-center">
            <p className="text-white font-black text-lg mb-1">اشترك في قناة واتساب</p>
            <p className="text-white/50 text-sm mb-4">اشترك الآن عشان تعرف أول ما يبدأ السحب وتعرف لو انت الفايز</p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
              style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.35)" }}>
              <span className="text-lg">📢</span> Subscribe Now — اشترك دلوقتي
            </a>
          </div>
        </div>

        {/* Prizes */}
        <p className="text-xs font-black tracking-[0.3em] uppercase text-center mb-5" style={{ color: BLUE3, fontFamily: "Orbitron,monospace" }}>
          PRIZES · الجوائز
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          {PRIZES.map(p => (
            <div key={p.rank} className="rounded-2xl overflow-hidden" style={{ border: `1px solid ${p.color}25`, background: "rgba(255,255,255,0.025)" }}>
              <div className="h-1 w-full" style={{ background: `linear-gradient(90deg,transparent,${p.color},transparent)` }} />
              <div className="p-4 text-center">
                <p className="text-xs font-black tracking-widest mb-3" style={{ color: p.color, fontFamily: "Orbitron,monospace" }}>{p.en}</p>
                <div className="flex justify-center gap-2 mb-3">
                  {p.imgs.map((img, i) => (
                    <img key={i} src={img} alt={p.items[i]} className="h-16 object-contain rounded-lg"
                      style={{ background: "rgba(0,0,0,0.4)", padding: 4 }} />
                  ))}
                </div>
                {p.items.map(it => (
                  <p key={it} className="text-white text-xs font-semibold leading-snug">{it}</p>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Battle Pass ref image */}
        <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)" }}>
          <img src="/images/cf-battlepass.png" alt="Battle Pass E-Sports" className="w-full object-cover" style={{ maxHeight: 180 }} />
        </div>
      </div>
    </div>
  );
}

/* ─── STATE 2: GATHERING ─── */
function StateGathering() {
  const [query, setQuery] = useState("");
  const filtered = query ? ALL_PARTICIPANTS.filter(p => p.toLowerCase().includes(query.toLowerCase())) : [];
  const notFound = !!query && filtered.length === 0;

  return (
    <div className="min-h-screen px-4 pt-10 pb-16 max-w-4xl mx-auto" dir="rtl">
      {/* Subscribe banner */}
      <div className="rounded-2xl mb-8 flex flex-col sm:flex-row items-center gap-4 px-6 py-5"
        style={{ background: "rgba(37,211,102,0.06)", border: "1px solid rgba(37,211,102,0.2)" }}>
        <div className="flex-1 text-center sm:text-right">
          <p className="text-white font-black text-base mb-0.5">لسه متاشتركتش؟</p>
          <p className="text-white/50 text-sm">اشترك في القناه عشان تعرف أول ما السحب يبدأ</p>
        </div>
        <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
          className="shrink-0 flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white text-sm hover:scale-105 transition-all"
          style={{ background: "#25D366" }}>
          <span>📢</span> Subscribe
        </a>
      </div>

      <div className="flex items-center justify-center gap-3 mb-6">
        <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: BLUE3 }} />
        <span className="text-sm font-black tracking-widest uppercase" style={{ color: BLUE3, fontFamily: "Orbitron,monospace" }}>
          GATHERING · يتجمع المتسابقون
        </span>
      </div>
      <h1 className="text-3xl sm:text-5xl font-black text-white text-center mb-2">الذكرى العاشرة</h1>
      <p className="text-center mb-8 font-medium" style={{ color: BLUE3 }}>CFS Grand Giveaway · {ALL_PARTICIPANTS.length} Players</p>

      <input value={query} onChange={e => setQuery(e.target.value)}
        placeholder="Search your name…"
        className="w-full px-5 py-4 rounded-2xl text-white text-base placeholder-white/30 outline-none mb-3 transition-all"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${notFound ? "#ef444450" : "rgba(37,99,235,0.25)"}` }}
      />
      {notFound && (
        <div className="px-5 py-3 rounded-xl mb-3" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
          <p className="text-red-400 text-sm font-semibold">Your name is not on the list —{" "}
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer" className="text-green-400 underline underline-offset-4">Subscribe to join →</a>
          </p>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-8 max-h-64 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${BLUE}55 transparent` }}>
        {ALL_PARTICIPANTS.map(p => {
          const hit = !!query && p.toLowerCase().includes(query.toLowerCase());
          return (
            <div key={p} className="px-3 py-2 rounded-lg text-sm text-center truncate transition-all"
              style={{
                background: hit ? `${BLUE}22` : "rgba(255,255,255,0.03)",
                border: `1px solid ${hit ? BLUE3 : "rgba(255,255,255,0.07)"}`,
                color: hit ? "#fff" : "rgba(255,255,255,0.55)",
                fontWeight: hit ? 700 : 400,
                transform: hit ? "scale(1.04)" : undefined,
              }}>
              {p}
            </div>
          );
        })}
      </div>

      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg,#128C7E,#25D366)", boxShadow: "0 4px 20px rgba(37,211,102,0.25)" }}>
        <span className="text-xl">📢</span> Join Official WhatsApp Channel
      </a>
    </div>
  );
}

/* ─── STATE 3: LUCKY WHEEL ─── */
interface Winner { username: string; rank: 1 | 2 | 3 }

function useTypewriter(text: string, go: boolean) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!go) { setShown(""); return; }
    setShown(""); let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, 55);
    return () => clearInterval(id);
  }, [text, go]);
  return shown;
}

function StateLiveDraw({ onComplete }: { onComplete: (w: Winner[]) => void }) {
  const [remaining, setRemaining] = useState<string[]>(ALL_PARTICIPANTS);
  const [eliminated, setEliminated] = useState<Set<string>>(new Set());
  const [rotation, setRotation] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [lastElim, setLastElim] = useState("");
  const [showElim, setShowElim] = useState(false);
  const [subscribeGate, setSubscribeGate] = useState(true);
  const [confirmedSub, setConfirmedSub] = useState(false);
  const spinQueueRef = useRef<string[]>([]);
  const isProcessingRef = useRef(false);

  const elimTyped = useTypewriter(lastElim, showElim);

  const doOneSpin = useCallback((pool: string[], currentRot: number, fast = false): Promise<{ newPool: string[]; newRot: number }> => {
    return new Promise(resolve => {
      const idx = Math.floor(Math.random() * pool.length);
      const victim = pool[idx];
      const n = ALL_PARTICIPANTS.length;
      const segDeg = 360 / n;
      const victimOrigIdx = ALL_PARTICIPANTS.indexOf(victim);
      const targetCenter = (victimOrigIdx + 0.5) * segDeg;
      const currentMod = currentRot % 360;
      const addAngle = (targetCenter - currentMod + 360) % 360;
      const spins = fast ? 2 : 5 + Math.floor(Math.random() * 2);
      const newRot = currentRot + 360 * spins + addAngle;

      setRotation(newRot);
      setSpinning(true);
      if (!fast) beep(400 + Math.random() * 200, 0.05, 0.1);

      const spinDur = fast ? 1300 : 4700;
      setTimeout(() => {
        setSpinning(false);
        eliminateSound();
        const newPool = pool.filter(p => p !== victim);
        setRemaining(newPool);
        setEliminated(prev => new Set([...prev, victim]));
        setLastElim(victim);
        setShowElim(false);
        setTimeout(() => setShowElim(true), 80);
        resolve({ newPool, newRot });
      }, spinDur + 100);
    });
  }, []);

  const runSingle = useCallback(async () => {
    if (spinning || isProcessingRef.current || remaining.length <= 3) return;
    isProcessingRef.current = true;
    const { newPool, newRot } = await doOneSpin(remaining, rotation);
    if (newPool.length === 3) {
      fanfare();
      setTimeout(() => {
        onComplete(newPool.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 })));
      }, 1800);
    }
    isProcessingRef.current = false;
  }, [spinning, remaining, rotation, doOneSpin, onComplete]);

  const runFast = useCallback(async () => {
    if (spinning || isProcessingRef.current || remaining.length <= 3) return;
    isProcessingRef.current = true;
    const batch = Math.min(5, remaining.length - 3);
    let pool = [...remaining];
    let rot = rotation;
    for (let i = 0; i < batch; i++) {
      const res = await doOneSpin(pool, rot, true);
      pool = res.newPool; rot = res.newRot;
      if (pool.length <= 3) { fanfare(); break; }
      await new Promise(r => setTimeout(r, 200));
    }
    if (pool.length === 3) {
      setTimeout(() => {
        onComplete(pool.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 })));
      }, 1800);
    }
    isProcessingRef.current = false;
  }, [spinning, remaining, rotation, doOneSpin, onComplete]);

  if (subscribeGate && !confirmedSub) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4" dir="rtl">
        <div className="w-full max-w-md rounded-3xl overflow-hidden" style={{ border: "1px solid rgba(37,211,102,0.3)", background: "rgba(0,0,0,0.7)" }}>
          <div className="h-1" style={{ background: "linear-gradient(90deg,#128C7E,#25D366)" }} />
          <div className="p-8 text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
              style={{ background: "rgba(37,211,102,0.12)", border: "2px solid rgba(37,211,102,0.3)" }}>
              <span className="text-3xl">📢</span>
            </div>
            <h2 className="text-2xl font-black text-white mb-2">اشترك أولاً</h2>
            <p className="text-white/60 text-sm mb-6 leading-relaxed">
              عشان تعرف لو انت الفايز، لازم تكون مشترك في قناة واتساب الرسمية.
              اشترك دلوقتي وبعدين ابدأ السحب!
            </p>
            <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3.5 rounded-2xl font-bold text-white mb-4 transition-all hover:scale-[1.02]"
              style={{ background: "#25D366" }}>
              <span>📢</span> Subscribe to WhatsApp Channel
            </a>
            <button onClick={() => { setConfirmedSub(true); setSubscribeGate(false); }}
              className="w-full py-3 rounded-2xl font-bold text-white/70 text-sm border border-white/10 hover:bg-white/5 transition-all">
              ✅ اشتركت — ابدأ السحب
            </button>
          </div>
        </div>
      </div>
    );
  }

  const remainCount = remaining.length;
  const isDone = remainCount <= 3;

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-6 pb-12" dir="rtl">
      <div className="flex items-center gap-3 mb-3">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: BLUE3 }} />
        <span className="text-sm font-black tracking-widest uppercase" style={{ color: BLUE3, fontFamily: "Orbitron,monospace" }}>
          LIVE DRAW · عجلة الحظ
        </span>
      </div>

      {/* Counter */}
      <div className="flex gap-6 mb-5 text-center">
        <div>
          <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "Orbitron,monospace" }}>{remainCount}</p>
          <p className="text-xs" style={{ color: BLUE3 }}>Remaining</p>
        </div>
        <div className="w-px bg-white/10" />
        <div>
          <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "Orbitron,monospace" }}>{ALL_PARTICIPANTS.length - remainCount}</p>
          <p className="text-xs" style={{ color: BLUE3 }}>Eliminated</p>
        </div>
      </div>

      <LuckyWheel
        remaining={remaining}
        eliminated={eliminated}
        rotation={rotation}
        spinning={spinning}
        onTransitionEnd={() => {}}
      />

      {/* Eliminated name reveal */}
      <div className="mt-5 mb-4 h-14 flex items-center justify-center w-full max-w-sm">
        {showElim && lastElim && (
          <div className="px-6 py-3 rounded-xl text-center w-full"
            style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)" }}>
            <p className="text-xs uppercase tracking-widest text-red-400/70 mb-0.5" style={{ fontFamily: "Orbitron,monospace" }}>ELIMINATED</p>
            <p className="text-red-400 font-black text-xl" style={{ fontFamily: "Orbitron,monospace" }}>
              {elimTyped}<span className="animate-pulse">{elimTyped.length < lastElim.length ? "_" : ""}</span>
            </p>
          </div>
        )}
      </div>

      {!isDone ? (
        <div className="flex gap-3">
          <button onClick={runSingle} disabled={spinning || isProcessingRef.current}
            className="px-7 py-3 rounded-2xl font-black text-white text-sm transition-all disabled:opacity-40"
            style={{ background: `linear-gradient(135deg,${BLUE},${BLUE2})`, boxShadow: `0 4px 20px rgba(37,99,235,0.4)`, fontFamily: "Orbitron,monospace" }}>
            {spinning ? "SPINNING…" : "SPIN"}
          </button>
          <button onClick={runFast} disabled={spinning || isProcessingRef.current || remainCount <= 8}
            className="px-7 py-3 rounded-2xl font-black text-white/80 text-sm transition-all disabled:opacity-30"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", fontFamily: "Orbitron,monospace" }}>
            FAST ×5
          </button>
        </div>
      ) : (
        <div className="text-center">
          <p className="text-white font-black text-xl mb-1">🎉 FINAL 3 REMAIN!</p>
          <p className="text-white/50 text-sm mb-4">الفائزون الثلاثة هم…</p>
          <div className="flex flex-col gap-2 mb-5">
            {remaining.map((name, i) => {
              const m = [PRIZES[0], PRIZES[1], PRIZES[2]][i];
              return (
                <div key={name} className="flex items-center gap-3 px-4 py-2.5 rounded-xl"
                  style={{ background: `${m.color}10`, border: `1px solid ${m.color}30` }}>
                  <span className="font-black text-sm shrink-0" style={{ color: m.color, fontFamily: "Orbitron,monospace" }}>{m.en}</span>
                  <span className="text-white font-black">{name}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Progress bar */}
      <div className="w-full max-w-sm mt-5">
        <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.08)" }}>
          <div className="h-full rounded-full transition-all duration-500"
            style={{ width: `${((ALL_PARTICIPANTS.length - remainCount) / (ALL_PARTICIPANTS.length - 3)) * 100}%`, background: `linear-gradient(90deg,${BLUE},${BLUE3})` }} />
        </div>
        <div className="flex justify-between mt-1">
          <span className="text-xs text-white/30">0</span>
          <span className="text-xs font-semibold" style={{ color: BLUE3 }}>{ALL_PARTICIPANTS.length - remainCount} / {ALL_PARTICIPANTS.length - 3} eliminated</span>
          <span className="text-xs text-white/30">{ALL_PARTICIPANTS.length - 3}</span>
        </div>
      </div>
    </div>
  );
}

/* ─── STATE 4: RESULTS ─── */
function WinnerCard({ winner, prize, delay }: { winner: Winner; prize: typeof PRIZES[0]; delay: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const isFirst = winner.rank === 1;

  return (
    <div className="rounded-2xl overflow-hidden transition-all duration-700"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(40px) scale(0.92)",
        border: `1.5px solid ${isFirst ? prize.color : "rgba(255,255,255,0.08)"}`,
        background: isFirst ? `${prize.color}08` : "rgba(255,255,255,0.025)",
        boxShadow: isFirst ? `0 16px 60px ${prize.color}20` : "none",
      }}>
      {isFirst && <div className="h-0.5 w-full" style={{ background: `linear-gradient(90deg,transparent,${prize.color},transparent)` }} />}

      <div className="p-5 text-center">
        <p className="text-xs font-black tracking-[0.25em] uppercase mb-3" style={{ color: prize.color, fontFamily: "Orbitron,monospace" }}>
          {prize.en} · {prize.ar}
        </p>

        {/* Winner name BIG */}
        <p className="font-black text-white text-2xl sm:text-3xl mb-4 break-all">{winner.username}</p>

        {/* Prizes */}
        <div className="flex justify-center gap-2 mb-3">
          {prize.imgs.map((img, i) => (
            <img key={i} src={img} alt={prize.items[i]} className="h-20 sm:h-24 w-auto object-contain rounded-xl"
              style={{ background: "rgba(0,0,0,0.5)", padding: 6 }} />
          ))}
        </div>
        <div className="space-y-1">
          {prize.items.map(it => (
            <p key={it} className="text-xs font-semibold text-white/60">{it}</p>
          ))}
        </div>
      </div>
    </div>
  );
}

function StateResults({ winners }: { winners: Winner[] }) {
  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-16" dir="rtl">
      {/* Header */}
      <div className="w-full max-w-3xl rounded-2xl overflow-hidden mb-8">
        <img src="/images/cf-esports-banner.jpg" alt="Crossfire Esports"
          className="w-full object-cover" style={{ height: 160, filter: "brightness(0.5)" }} />
        <div className="relative -mt-20 flex flex-col items-center pb-6">
          <p className="text-xs font-black tracking-[0.4em] uppercase mb-1" style={{ color: BLUE3, fontFamily: "Orbitron,monospace" }}>
            CFS 10TH ANNIVERSARY
          </p>
          <h1 className="text-4xl sm:text-6xl font-black text-white">الفائزون</h1>
          <p className="font-semibold mt-1" style={{ color: BLUE3 }}>GRAND GIVEAWAY · FINAL RESULTS</p>
        </div>
      </div>

      {/* Winner cards — 1st on top */}
      <div className="w-full max-w-3xl">
        {/* 1st place — wide on top */}
        {winners.filter(w => w.rank === 1).map(w => (
          <div key={w.username} className="mb-4">
            <WinnerCard winner={w} prize={PRIZES[0]} delay={200} />
          </div>
        ))}
        {/* 2nd and 3rd side by side */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {winners.filter(w => w.rank !== 1).map((w, i) => (
            <WinnerCard key={w.username} winner={w} prize={PRIZES[w.rank - 1]} delay={500 + i * 300} />
          ))}
        </div>
      </div>

      <a href={WHATSAPP} target="_blank" rel="noopener noreferrer"
        className="mt-10 inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105"
        style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.35)" }}>
        <span className="text-xl">📢</span> Follow on WhatsApp for Updates
      </a>
    </div>
  );
}

/* ─── MAIN ─── */
export default function GiveawayPage() {
  const forced = forcedState();
  const [state, setState] = useState<S>(forced ?? autoState());
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (forced) return;
    const id = setInterval(() => setState(prev => prev >= 3 ? prev : autoState()), 5000);
    return () => clearInterval(id);
  }, [forced]);

  const handleComplete = (w: Winner[]) => { setWinners(w); setState(4); };
  const cur = forced ?? state;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#070810", fontFamily: "'Inter',system-ui,sans-serif" }}>
      {/* Subtle ambient top glow */}
      <div className="pointer-events-none fixed top-0 left-0 right-0 h-48 opacity-8" aria-hidden
        style={{ background: `radial-gradient(ellipse at 50% 0%,${BLUE} 0%,transparent 70%)` }} />

      {/* Debug nav */}
      {forced !== null && (
        <div className="fixed top-3 right-3 z-50 flex gap-1.5">
          {([1, 2, 3, 4] as S[]).map(s => (
            <a key={s} href={`?state=${s}`} className="px-2.5 py-1 rounded-lg text-xs font-bold border transition-all"
              style={{ background: cur === s ? BLUE : "rgba(255,255,255,0.04)", borderColor: cur === s ? BLUE : "rgba(255,255,255,0.1)", color: cur === s ? "#fff" : "rgba(255,255,255,0.4)" }}>
              S{s}
            </a>
          ))}
        </div>
      )}

      {cur === 1 && <StateStandby />}
      {cur === 2 && <StateGathering />}
      {cur === 3 && <StateLiveDraw onComplete={handleComplete} />}
      {cur === 4 && <StateResults winners={winners.length > 0 ? winners : [
        { username: "WINNER ONE", rank: 1 },
        { username: "WINNER TWO", rank: 2 },
        { username: "WINNER THREE", rank: 3 },
      ]} />}
    </div>
  );
}
