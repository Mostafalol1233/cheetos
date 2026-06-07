import { useState, useEffect, useRef, useCallback } from "react";

const WHATSAPP_CHANNEL = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";
const BLUE = "#2563eb";
const BLUE_LIGHT = "#3b82f6";
const BLUE_GLOW = "rgba(37,99,235,0.35)";

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
  if (s === "1") return 1; if (s === "2") return 2;
  if (s === "3") return 3; if (s === "4") return 4;
  return null;
}

/* ─── Web Audio ─── */
function createAudioCtx() {
  try { return new (window.AudioContext || (window as any).webkitAudioContext)(); }
  catch { return null; }
}
function playTick(ctx: AudioContext, volume = 0.18) {
  try {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.setValueAtTime(900, ctx.currentTime);
    o.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.04);
    g.gain.setValueAtTime(volume, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.06);
    o.start(ctx.currentTime); o.stop(ctx.currentTime + 0.07);
  } catch {}
}
function playFanfare(ctx: AudioContext) {
  try {
    const freqs = [523, 659, 784, 1047];
    freqs.forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.type = "sine";
      const t = ctx.currentTime + i * 0.12;
      o.frequency.setValueAtTime(f, t);
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(0.22, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + 0.7);
      o.start(t); o.stop(t + 0.75);
    });
  } catch {}
}

/* ─── Countdown ─── */
function useCountdown(target: Date) {
  const [diff, setDiff] = useState(0);
  useEffect(() => {
    const tick = () => setDiff(Math.max(0, target.getTime() - getCairoTime().getTime()));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [target]);
  return {
    days: Math.floor(diff / 86400000),
    hours: Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000) / 60000),
    secs: Math.floor((diff % 60000) / 1000),
  };
}

/* ─── STATE 1: STANDBY ─── */
function CountdownBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-20 h-20 sm:w-24 sm:h-24 flex items-center justify-center rounded-xl overflow-hidden"
        style={{ background: "rgba(255,255,255,0.04)", border: `1px solid rgba(37,99,235,0.3)`, boxShadow: `0 0 20px rgba(37,99,235,0.12)` }}>
        <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${BLUE_LIGHT},transparent)` }} />
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums" style={{ fontFamily: "Orbitron,monospace" }}>
          {String(value).padStart(2, "0")}
        </span>
      </div>
      <span className="text-xs uppercase tracking-widest font-medium" style={{ color: BLUE_LIGHT }}>{label}</span>
    </div>
  );
}

function StateStandby() {
  const { gathering } = getTargetDates();
  const { days, hours, mins, secs } = useCountdown(gathering);
  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" dir="rtl">
      <div className="mb-4">
        <img src="/images/cfs-emblem.png" alt="CFS Emblem" className="w-20 h-20 mx-auto mb-6 rounded-full object-cover opacity-90" />
        <p className="text-xs tracking-[0.4em] uppercase font-semibold mb-3" style={{ color: BLUE_LIGHT, fontFamily: "Orbitron,monospace" }}>
          CFS 10TH ANNIVERSARY — GRAND GIVEAWAY
        </p>
        <h1 className="text-4xl sm:text-6xl font-black text-white leading-tight mb-2">الذكرى العاشرة</h1>
        <h2 className="text-xl sm:text-2xl font-bold" style={{ color: BLUE_LIGHT }}>السحب الكبير</h2>
      </div>

      <div className="flex gap-4 sm:gap-6 my-10">
        <CountdownBlock value={days} label="Days" />
        <CountdownBlock value={hours} label="Hours" />
        <CountdownBlock value={mins} label="Min" />
        <CountdownBlock value={secs} label="Sec" />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-xl mb-10">
        {[
          { en: "DATE", ar: "١٠ أكتوبر" },
          { en: "PLATFORM", ar: "Crossfire" },
          { en: "WINNERS", ar: "3 Players" },
          { en: "METHOD", ar: "Live Draw" },
        ].map(item => (
          <div key={item.en} className="rounded-xl p-4 text-center" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
            <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: BLUE_LIGHT }}>{item.en}</p>
            <p className="text-white font-bold text-sm">{item.ar}</p>
          </div>
        ))}
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-8 py-3 rounded-full font-bold text-white text-sm transition-all hover:scale-105"
        style={{ background: "#25D366", boxShadow: "0 4px 20px rgba(37,211,102,0.35)" }}>
        <span className="text-lg">📢</span> Join WhatsApp Channel
      </a>
    </div>
  );
}

/* ─── STATE 2: GATHERING ─── */
function StateGathering() {
  const [query, setQuery] = useState("");
  const matches = query.trim() ? PARTICIPANTS.filter(p => p.toLowerCase().includes(query.toLowerCase())) : [];
  const notFound = query.trim().length > 0 && matches.length === 0;

  return (
    <div className="min-h-screen px-4 pt-10 pb-16 max-w-4xl mx-auto" dir="rtl">
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold tracking-widest uppercase mb-6"
          style={{ background: "rgba(37,99,235,0.12)", border: `1px solid ${BLUE}40`, color: BLUE_LIGHT }}>
          <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: BLUE_LIGHT }} />
          GATHERING — يتجمع المتسابقون
        </div>
        <h1 className="text-3xl sm:text-5xl font-black text-white mb-2">الذكرى العاشرة</h1>
        <p className="font-medium" style={{ color: BLUE_LIGHT }}>CFS Grand Giveaway · 52 Players</p>
      </div>

      <div className="mb-5">
        <input value={query} onChange={e => setQuery(e.target.value)}
          placeholder="Search your name..."
          className="w-full px-5 py-4 rounded-2xl text-white text-base placeholder-white/30 outline-none transition-all"
          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${notFound ? "rgba(239,68,68,0.5)" : "rgba(37,99,235,0.25)"}`, fontFamily: "inherit" }}
        />
        {notFound && (
          <div className="mt-3 px-5 py-4 rounded-xl" style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <p className="text-red-400 font-semibold text-sm mb-1">Your name is not on the list</p>
            <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer" className="text-green-400 text-sm underline underline-offset-4 hover:text-green-300 transition-colors">
              Register via WhatsApp channel →
            </a>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 mb-10 max-h-72 overflow-y-auto pr-1"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${BLUE}55 transparent` }}>
        {PARTICIPANTS.map(p => {
          const hit = query.trim() && p.toLowerCase().includes(query.toLowerCase());
          return (
            <div key={p} className="px-3 py-2 rounded-lg text-sm text-center truncate transition-all duration-300"
              style={{
                background: hit ? `${BLUE}20` : "rgba(255,255,255,0.03)",
                border: `1px solid ${hit ? BLUE_LIGHT : "rgba(255,255,255,0.07)"}`,
                color: hit ? "#fff" : "rgba(255,255,255,0.55)",
                transform: hit ? "scale(1.05)" : "scale(1)",
                fontWeight: hit ? 700 : 400,
              }}>
              {p}
            </div>
          );
        })}
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="flex items-center justify-center gap-3 w-full py-4 rounded-2xl font-bold text-white text-base transition-all hover:scale-[1.02]"
        style={{ background: "linear-gradient(135deg,#128C7E,#25D366)", boxShadow: "0 4px 24px rgba(37,211,102,0.3)" }}>
        <span className="text-xl">📢</span> Join the Official WhatsApp Channel
      </a>
    </div>
  );
}

/* ─── STATE 3: LIVE DRAW ─── */
interface Winner { username: string; rank: 1 | 2 | 3 }

/* Cipher Wheel */
const RINGS = [
  { size: 230, dur: 5.5, rev: false, dash: "8 6" },
  { size: 178, dur: 3.8, rev: true,  dash: "4 10" },
  { size: 126, dur: 7.2, rev: false, dash: "2 8" },
  { size: 74,  dur: 2.9, rev: true,  dash: "6 4" },
];

function CipherWheel({ phase }: { phase: "idle" | "spinning" | "slowing" | "done" }) {
  const active = phase !== "idle";
  const speedMult = phase === "slowing" ? 0.25 : phase === "done" ? 0 : 1;
  return (
    <div className="relative flex items-center justify-center" style={{ width: 250, height: 250 }}>
      {RINGS.map((ring, i) => (
        <div key={i} className="absolute rounded-full"
          style={{
            width: ring.size, height: ring.size,
            border: `1.5px solid ${active ? BLUE_LIGHT : "rgba(59,130,246,0.2)"}`,
            boxShadow: active ? `0 0 12px ${BLUE_GLOW}` : "none",
            opacity: active ? 1 : 0.3,
            animation: active && phase !== "done"
              ? `${ring.rev ? "spin-ccw" : "spin-cw"} ${ring.dur / (speedMult || 0.01)}s linear infinite`
              : "none",
            transition: "opacity 0.6s, box-shadow 0.6s",
          }}>
          {[0, 60, 120, 180, 240, 300].map(deg => (
            <div key={deg} className="absolute rounded-full"
              style={{
                width: 5, height: 5,
                background: active ? BLUE_LIGHT : "rgba(59,130,246,0.3)",
                top: "50%", left: "50%",
                transformOrigin: "0 0",
                transform: `rotate(${deg}deg) translate(${ring.size / 2 - 3}px,-2.5px)`,
                boxShadow: active ? `0 0 6px ${BLUE_LIGHT}` : "none",
                transition: "box-shadow 0.6s",
              }} />
          ))}
        </div>
      ))}
      <div className="relative z-10 w-16 h-16 rounded-full flex flex-col items-center justify-center"
        style={{
          background: phase === "done" ? `linear-gradient(135deg,${BLUE},#1d4ed8)` : "rgba(10,10,20,0.95)",
          border: `2px solid ${BLUE_LIGHT}`,
          boxShadow: active ? `0 0 24px ${BLUE_GLOW}, inset 0 0 12px rgba(37,99,235,0.2)` : "none",
          transition: "all 0.6s",
        }}>
        <span className="text-white font-black text-xs tracking-widest leading-none" style={{ fontFamily: "Orbitron,monospace" }}>CFS</span>
        <span className="text-xs font-bold mt-0.5" style={{ color: BLUE_LIGHT, fontFamily: "Orbitron,monospace" }}>X</span>
      </div>
    </div>
  );
}

/* Typewriter reveal */
function useTypewriter(target: string, active: boolean) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!active || !target) { setShown(""); return; }
    setShown("");
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setShown(target.slice(0, i));
      if (i >= target.length) clearInterval(interval);
    }, 60);
    return () => clearInterval(interval);
  }, [target, active]);
  return shown;
}

const RANK_META = {
  1: { label: "1ST PLACE", ar: "المركز الأول",  color: "#f59e0b", img: "/images/cfs-char-pink.png"   },
  2: { label: "2ND PLACE", ar: "المركز الثاني", color: "#94a3b8", img: "/images/cfs-char-blonde.png" },
  3: { label: "3RD PLACE", ar: "المركز الثالث", color: "#cd7f32", img: "/images/cfs-char-blue.png"   },
};

function StateLiveDraw({ onComplete }: { onComplete: (w: Winner[]) => void }) {
  const [phase, setPhase] = useState<"idle" | "spinning" | "slowing" | "done">("idle");
  const [cyclingName, setCyclingName] = useState("???");
  const [winners, setWinners] = useState<Winner[]>([]);
  const [lastWinner, setLastWinner] = useState("");
  const [revealing, setRevealing] = useState(false);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const drawDone = winners.length === 3;
  const nextRank = (winners.length + 1) as 1 | 2 | 3;

  const revealedName = useTypewriter(lastWinner, revealing);

  const runDraw = useCallback(() => {
    if (phase !== "idle" || drawDone) return;
    if (!audioCtxRef.current) audioCtxRef.current = createAudioCtx();
    const ctx = audioCtxRef.current;

    const pool = PARTICIPANTS.filter(p => !winners.find(w => w.username === p));
    setPhase("spinning");
    setCyclingName("???");
    setLastWinner("");
    setRevealing(false);

    const SPIN_MS = 7000;
    const SLOW_MS = 4000;
    let lastTick = 0;
    let interval = 55;
    let elapsed = 0;
    let idx = 0;

    const tick = () => {
      const now = Date.now();
      if (now - lastTick < interval) { timerRef.current = setTimeout(tick, 10); return; }
      lastTick = now;
      elapsed += interval;

      idx = Math.floor(Math.random() * pool.length);
      setCyclingName(pool[idx]);
      if (ctx) playTick(ctx, 0.12 + Math.random() * 0.06);

      if (elapsed < SPIN_MS) {
        timerRef.current = setTimeout(tick, 10);
      } else if (elapsed < SPIN_MS + SLOW_MS) {
        const t = (elapsed - SPIN_MS) / SLOW_MS;
        interval = 55 + Math.pow(t, 2.2) * 700;
        setPhase("slowing");
        timerRef.current = setTimeout(tick, 10);
      } else {
        const winner = pool[idx];
        setCyclingName(winner);
        setPhase("done");
        setLastWinner(winner);
        setTimeout(() => {
          setRevealing(true);
          if (ctx) playFanfare(ctx);
          const updated = [...winners, { username: winner, rank: nextRank }];
          setWinners(updated);
          setTimeout(() => setPhase("idle"), 1800);
        }, 300);
      }
    };
    timerRef.current = setTimeout(tick, 0);
  }, [phase, drawDone, winners, nextRank]);

  useEffect(() => () => { if (timerRef.current) clearTimeout(timerRef.current); }, []);

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-8 pb-16" dir="rtl">
      <div className="flex items-center justify-center gap-3 mb-8">
        <span className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: BLUE_LIGHT, boxShadow: `0 0 10px ${BLUE_LIGHT}` }} />
        <span className="text-sm font-black tracking-widest uppercase" style={{ color: BLUE_LIGHT, fontFamily: "Orbitron,monospace" }}>
          LIVE DRAWING · السحب المباشر
        </span>
      </div>

      <CipherWheel phase={phase} />

      <div className="mt-8 mb-6 w-full max-w-sm">
        <div className="relative px-8 py-5 rounded-2xl text-center overflow-hidden transition-all duration-500"
          style={{
            background: phase === "done" ? `${BLUE}15` : "rgba(255,255,255,0.04)",
            border: `1.5px solid ${phase !== "idle" ? BLUE : "rgba(255,255,255,0.1)"}`,
            boxShadow: phase !== "idle" ? `0 0 30px ${BLUE_GLOW}` : "none",
          }}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{
            background: phase !== "idle" ? `linear-gradient(90deg,transparent,${BLUE_LIGHT},transparent)` : "transparent",
            opacity: 0.8
          }} />
          {revealing && lastWinner ? (
            <div>
              <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: BLUE_LIGHT, fontFamily: "Orbitron,monospace" }}>
                {RANK_META[nextRank > 3 ? 3 : (nextRank - 1 as 1|2|3) || 3]?.label}
              </p>
              <p className="font-black text-3xl text-white" style={{ fontFamily: "Orbitron,monospace", letterSpacing: "0.05em" }}>
                {revealedName}<span className="animate-pulse text-blue-400">{revealedName.length < lastWinner.length ? "_" : ""}</span>
              </p>
            </div>
          ) : (
            <p className="font-black text-3xl text-white/70 tabular-nums" style={{ fontFamily: "Orbitron,monospace" }}>
              {cyclingName}
            </p>
          )}
        </div>
      </div>

      {!drawDone ? (
        <button onClick={runDraw} disabled={phase !== "idle"}
          className="px-10 py-3.5 rounded-2xl font-black text-white text-base transition-all mb-8 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: phase === "idle" ? `linear-gradient(135deg,${BLUE},#1d4ed8)` : "rgba(37,99,235,0.15)",
            boxShadow: phase === "idle" ? `0 4px 24px ${BLUE_GLOW}` : "none",
            fontFamily: "Orbitron,monospace",
          }}>
          {phase !== "idle" ? "DRAWING..." : winners.length === 0 ? "START DRAW" : `DRAW WINNER ${nextRank}`}
        </button>
      ) : (
        <button onClick={() => onComplete(winners)}
          className="px-10 py-3.5 rounded-2xl font-black text-white text-base transition-all hover:scale-105 mb-8"
          style={{ background: "linear-gradient(135deg,#f59e0b,#d97706)", boxShadow: "0 4px 24px rgba(245,158,11,0.4)", fontFamily: "Orbitron,monospace" }}>
          VIEW WINNERS →
        </button>
      )}

      {winners.length > 0 && (
        <div className="w-full max-w-md space-y-2.5">
          <p className="text-xs uppercase tracking-widest text-center mb-4 font-semibold" style={{ color: BLUE_LIGHT }}>
            CONFIRMED WINNERS
          </p>
          {winners.map(w => {
            const m = RANK_META[w.rank];
            return (
              <div key={w.rank} className="flex items-center gap-4 px-5 py-3 rounded-xl"
                style={{ background: "rgba(255,255,255,0.03)", border: `1px solid ${m.color}30` }}>
                <span className="w-9 h-9 rounded-full flex items-center justify-center font-black text-sm shrink-0"
                  style={{ background: `${m.color}15`, border: `1.5px solid ${m.color}70`, color: m.color }}>
                  {w.rank}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="font-black text-white truncate">{w.username}</p>
                  <p className="text-xs font-semibold" style={{ color: m.color }}>{m.label} · {m.ar}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── STATE 4: RESULTS ─── */
function WinnerCard({ winner, delay }: { winner: Winner; delay: number }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const m = RANK_META[winner.rank];
  const isFirst = winner.rank === 1;

  return (
    <div className="flex flex-col items-center rounded-2xl overflow-hidden transition-all duration-700"
      style={{
        opacity: vis ? 1 : 0,
        transform: vis ? "translateY(0) scale(1)" : "translateY(40px) scale(0.93)",
        border: `1.5px solid ${isFirst ? m.color : "rgba(255,255,255,0.08)"}`,
        background: isFirst ? `rgba(245,158,11,0.06)` : "rgba(255,255,255,0.03)",
        boxShadow: isFirst ? `0 12px 60px rgba(245,158,11,0.18)` : "none",
        maxWidth: 280, width: "100%",
      }}>
      {isFirst && (
        <div className="w-full h-0.5" style={{ background: `linear-gradient(90deg,transparent,${m.color},transparent)` }} />
      )}

      <div className="pt-8 pb-3 flex flex-col items-center w-full px-4">
        <div className="relative mb-4">
          <div className="w-36 h-36 rounded-full overflow-hidden"
            style={{ border: `2px solid ${m.color}55`, background: "rgba(0,0,0,0.5)" }}>
            <img src={m.img} alt={m.label} className="w-full h-full object-cover object-top" />
          </div>
          {isFirst && (
            <div className="absolute -top-3 -right-3 w-10 h-10 rounded-full flex items-center justify-center"
              style={{ background: m.color, border: "2px solid #000" }}>
              <img src="/images/cfs-trophy.png" alt="Trophy" className="w-6 h-6 object-contain rounded-full" />
            </div>
          )}
        </div>

        <p className="text-xs font-black tracking-[0.25em] uppercase mb-1" style={{ color: m.color, fontFamily: "Orbitron,monospace" }}>
          {m.label}
        </p>
        <p className="font-black text-white text-xl text-center leading-tight mb-1">{winner.username}</p>
        <p className="text-xs text-white/30 mb-2">{m.ar}</p>
      </div>

      {isFirst && (
        <div className="w-full px-4 pb-5">
          <div className="w-full h-px mb-3" style={{ background: "rgba(255,255,255,0.06)" }} />
          <p className="text-center text-xs text-white/35 uppercase tracking-widest" style={{ fontFamily: "Orbitron,monospace" }}>
            CFS · 10TH ANNIVERSARY
          </p>
        </div>
      )}
    </div>
  );
}

function StateResults({ winners }: { winners: Winner[] }) {
  const first = winners.find(w => w.rank === 1);
  const second = winners.find(w => w.rank === 2);
  const third = winners.find(w => w.rank === 3);

  const placeholder = (rank: 1 | 2 | 3): Winner => ({ username: "???", rank });
  const podium = [second ?? placeholder(2), first ?? placeholder(1), third ?? placeholder(3)];

  return (
    <div className="min-h-screen flex flex-col items-center px-4 pt-10 pb-16" dir="rtl">
      <div className="text-center mb-12">
        <img src="/images/cfs-award-banner.png" alt="Award" className="w-full max-w-lg mx-auto rounded-2xl mb-8 opacity-90 object-cover" style={{ maxHeight: 220 }} />
        <p className="text-xs tracking-[0.4em] uppercase font-semibold mb-3" style={{ color: BLUE_LIGHT, fontFamily: "Orbitron,monospace" }}>
          CFS 10TH ANNIVERSARY
        </p>
        <h1 className="text-4xl sm:text-6xl font-black text-white mb-2">الفائزون</h1>
        <p className="text-base font-medium" style={{ color: BLUE_LIGHT }}>GRAND GIVEAWAY · FINAL RESULTS</p>
      </div>

      {/* Desktop podium */}
      <div className="hidden sm:flex items-end justify-center gap-5 w-full max-w-3xl mb-10">
        {podium.map((w, i) => (
          <div key={w.rank} className={`flex-1 flex flex-col items-center ${w.rank === 1 ? "-translate-y-8" : ""}`}>
            <WinnerCard winner={w} delay={i * 350 + 300} />
          </div>
        ))}
      </div>

      {/* Mobile */}
      <div className="flex sm:hidden flex-col items-center gap-5 w-full max-w-xs mb-10">
        {([1, 2, 3] as const).map((r, i) => {
          const w = winners.find(w => w.rank === r) ?? placeholder(r);
          return <WinnerCard key={r} winner={w} delay={i * 350 + 300} />;
        })}
      </div>

      <a href={WHATSAPP_CHANNEL} target="_blank" rel="noopener noreferrer"
        className="inline-flex items-center gap-3 px-8 py-4 rounded-full font-bold text-white text-base transition-all hover:scale-105"
        style={{ background: "#25D366", boxShadow: "0 4px 24px rgba(37,211,102,0.35)" }}>
        <span className="text-xl">📢</span> Follow on WhatsApp
      </a>
    </div>
  );
}

/* ─── MAIN ─── */
export default function GiveawayPage() {
  const forced = getForceState();
  const [appState, setAppState] = useState<AppState>(forced ?? getAutoState());
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (forced) return;
    const id = setInterval(() => {
      const next = getAutoState();
      setAppState(prev => (prev >= 3 ? prev : next));
    }, 5000);
    return () => clearInterval(id);
  }, [forced]);

  const handleDrawComplete = (w: Winner[]) => { setWinners(w); setAppState(4); };
  const state = forced ?? appState;

  return (
    <div className="min-h-screen relative overflow-x-hidden" style={{ background: "#070810", fontFamily: "'Inter','Poppins',system-ui,sans-serif" }}>
      {/* Very subtle ambient */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-64 opacity-10 blur-3xl rounded-full"
          style={{ background: `radial-gradient(ellipse,${BLUE} 0%,transparent 70%)` }} />
      </div>

      {/* Debug state nav */}
      {forced !== null && (
        <div className="fixed top-4 right-4 z-50 flex gap-2">
          {([1, 2, 3, 4] as AppState[]).map(s => (
            <a key={s} href={`?state=${s}`}
              className="px-3 py-1.5 rounded-lg text-xs font-bold border transition-all"
              style={{
                background: state === s ? BLUE : "rgba(255,255,255,0.04)",
                borderColor: state === s ? BLUE : "rgba(255,255,255,0.1)",
                color: state === s ? "#fff" : "rgba(255,255,255,0.4)",
              }}>
              S{s}
            </a>
          ))}
        </div>
      )}

      {state === 1 && <StateStandby />}
      {state === 2 && <StateGathering />}
      {state === 3 && <StateLiveDraw onComplete={handleDrawComplete} />}
      {state === 4 && (
        <StateResults winners={winners.length > 0 ? winners : [
          { username: "WINNER ONE", rank: 1 },
          { username: "WINNER TWO", rank: 2 },
          { username: "WINNER THREE", rank: 3 },
        ]} />
      )}
    </div>
  );
}
