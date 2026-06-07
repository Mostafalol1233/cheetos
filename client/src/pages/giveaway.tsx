import { useState, useEffect, useRef, useCallback } from "react";
import { useUserAuth } from "@/lib/user-auth-context";
import { Link } from "wouter";
import cfsLogoBanner from "@assets/download_1780850227541.png";
import cfsBgMap from "@assets/image_1780850228772.png";

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
const ALL = Array.from(new Set(RAW));

/* ─── Config ─── */
const DRAW_TIME   = new Date("2026-10-06T22:00:00+03:00");
const GATHER_TIME = new Date("2026-10-06T21:30:00+03:00");
const WA_URL      = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";
const YT_URL      = "https://www.youtube.com/@Bemora-site/videos";

/* ─── CFS Palette ─── */
const BLUE   = "#1565c0";
const LBLUE  = "#2196f3";
const YELLOW = "#f9a825";
const GOLD   = "#b8860b";
const SILVER = "#607d8b";
const BRONZE = "#8d5524";
const LINE   = "rgba(255,255,255,0.06)";
const CARD   = "rgba(8,14,28,0.75)";

/* ─── Prizes ─── */
const PRIZES = [
  {
    rank: "1ST", rankAr: "First Place",
    weapon: "HK417 — P.B. Esports Star",
    desc: "Assault Rifle · Legendary Esports Skin",
    color: YELLOW,
    charImg: "/images/cfs-char-pink.png",
  },
  {
    rank: "2ND", rankAr: "Second Place",
    weapon: "Colt 1911 — Esports Star",
    desc: "Pistol · Esports Edition Skin",
    color: "#90a4ae",
    charImg: "/images/cfs-char-purple.png",
  },
  {
    rank: "3RD", rankAr: "Third Place",
    weapon: "CheyTac M200 — Dominator Esports",
    desc: "Sniper Rifle · Dominator Skin",
    color: "#a1887f",
    charImg: "/images/cfs-char-blonde.png",
  },
];

/* ─── Time helpers ─── */
function cairo() {
  const n = new Date();
  return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 3 * 3600000);
}
type S = 1 | 2 | 3 | 4;
function forced(): S | null {
  const s = new URLSearchParams(window.location.search).get("state");
  return s === "1" ? 1 : s === "2" ? 2 : s === "3" ? 3 : s === "4" ? 4 : null;
}
function auto(): S {
  const n = cairo();
  if (n < GATHER_TIME) return 1;
  if (n < DRAW_TIME)   return 2;
  return 3;
}
function useCountdown(target: Date) {
  const [ms, setMs] = useState(0);
  useEffect(() => {
    const t = () => setMs(Math.max(0, target.getTime() - cairo().getTime()));
    t(); const id = setInterval(t, 1000); return () => clearInterval(id);
  }, [target]);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

/* ─── Audio ─── */
let _ctx: AudioContext | null = null;
function getCtx() {
  if (!_ctx) try { _ctx = new (window.AudioContext || (window as any).webkitAudioContext)(); } catch {}
  return _ctx;
}
function beep(f: number, d: number, v = 0.1) {
  const c = getCtx(); if (!c) return;
  const o = c.createOscillator(), g = c.createGain();
  o.connect(g); g.connect(c.destination);
  o.frequency.value = f;
  g.gain.setValueAtTime(v, c.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + d);
  o.start(); o.stop(c.currentTime + d);
}
function fanfare() {
  [[523, 0], [659, 130], [784, 260], [1047, 400]].forEach(([f, t]) => setTimeout(() => beep(f, 0.7, 0.18), t));
}

/* ─── SVG Wheel ─── */
const CX = 250, CY = 250, OR = 232, IR = 58;
function pol(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}
function arcPath(s: number, e: number) {
  const a = pol(OR, s), b = pol(OR, e), c = pol(IR, e), d = pol(IR, s), lg = e - s > 180 ? 1 : 0;
  return `M${a.x} ${a.y} A${OR} ${OR} 0 ${lg} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${IR} ${IR} 0 ${lg} 0 ${d.x} ${d.y}Z`;
}
function Wheel({ parts, rot, trans, onEnd }: { parts: string[]; rot: number; trans: boolean; onEnd: () => void }) {
  const ref = useRef<SVGGElement>(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [onEnd]);
  const n = parts.length, seg = 360 / n;
  return (
    <div style={{ position: "relative", width: 320, height: 320 }}>
      <svg width="28" height="32" viewBox="0 0 28 32"
        style={{ position: "absolute", top: -4, left: "50%", transform: "translateX(-50%)", zIndex: 10 }}>
        <polygon points="14,32 0,0 28,0" fill={YELLOW} />
        <polygon points="14,25 5,5 23,5" fill="#fff" opacity="0.9" />
      </svg>
      <svg viewBox="0 0 500 500" width="320" height="320">
        <g ref={ref} style={{
          transform: `rotate(${rot}deg)`, transformOrigin: `${CX}px ${CY}px`,
          transition: trans ? "transform 4.6s cubic-bezier(0.12,0.82,0.08,1.0)" : "none",
        }}>
          {parts.map((name, i) => {
            const s = i * seg, e = (i + 1) * seg, mid = s + seg / 2, lp = pol((OR + IR) / 2 + 8, mid);
            return (
              <g key={name + i}>
                <path d={arcPath(s, e)} fill={["#0a1628", "#0d1e38"][i % 2]} stroke="#1a3a6a" strokeWidth="0.8" />
                <text x={lp.x} y={lp.y} fontSize={Math.max(5, Math.min(8, 9 - n * 0.04))}
                  fontFamily="ui-monospace,monospace" fontWeight="700" fill="rgba(255,255,255,0.8)"
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${mid - 90},${lp.x},${lp.y})`}>
                  {name.length > 6 ? name.slice(0, 6) : name}
                </text>
              </g>
            );
          })}
        </g>
        <circle cx={CX} cy={CY} r={IR} fill="#060a14" stroke={LBLUE} strokeWidth="2" />
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="12" fontWeight="900"
          fontFamily="ui-monospace,monospace" fill="#fff">CFS</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9"
          fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.35)">DRAW</text>
      </svg>
    </div>
  );
}

/* ─── Countdown box ─── */
function Tick({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-xl"
        style={{ background: "rgba(10,22,48,0.85)", border: `1px solid ${LBLUE}30`, backdropFilter: "blur(8px)" }}>
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums"
          style={{ fontFamily: "ui-monospace,monospace" }}>{String(v).padStart(2, "0")}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.3)", letterSpacing: "0.1em" }}>{label}</span>
    </div>
  );
}

/* ─── Section header ─── */
function SectionHead({ title, sub }: { title: string; sub?: string }) {
  return (
    <div className="mb-6" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }}>
      <div className="flex items-center gap-3 mb-1">
        <div className="w-1 h-5 rounded-full" style={{ background: LBLUE }} />
        <p className="text-white font-black text-sm uppercase tracking-widest"
          style={{ fontFamily: "ui-monospace,monospace", letterSpacing: "0.15em" }}>{title}</p>
      </div>
      {sub && <p className="text-xs mt-1 ml-4" style={{ color: "rgba(255,255,255,0.25)" }}>{sub}</p>}
    </div>
  );
}

/* ─── Weapon Prize Card (standby) ─── */
function WeaponCard({ prize, i }: { prize: typeof PRIZES[0]; i: number }) {
  return (
    <div className="rounded-xl overflow-hidden flex flex-col"
      style={{ background: CARD, border: `1px solid ${prize.color}25` }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${prize.color},transparent)` }} />

      {/* Rank badge */}
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <span className="text-xs font-black tracking-widest" style={{ color: prize.color, fontFamily: "ui-monospace,monospace" }}>
          {prize.rank}
        </span>
        <span className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>{prize.rankAr}</span>
      </div>

      {/* Weapon icon area */}
      <div className="mx-4 mb-3 rounded-lg flex items-center justify-center"
        style={{ height: 90, background: `linear-gradient(135deg, rgba(10,22,48,0.9), rgba(20,40,80,0.6))`, border: `1px solid ${prize.color}18` }}>
        {/* Crosshair icon */}
        <svg width="40" height="40" viewBox="0 0 40 40" fill="none" opacity="0.6">
          <circle cx="20" cy="20" r="14" stroke={prize.color} strokeWidth="1.5" />
          <circle cx="20" cy="20" r="4" fill={prize.color} />
          <line x1="20" y1="2" x2="20" y2="10" stroke={prize.color} strokeWidth="1.5" />
          <line x1="20" y1="30" x2="20" y2="38" stroke={prize.color} strokeWidth="1.5" />
          <line x1="2" y1="20" x2="10" y2="20" stroke={prize.color} strokeWidth="1.5" />
          <line x1="30" y1="20" x2="38" y2="20" stroke={prize.color} strokeWidth="1.5" />
        </svg>
      </div>

      {/* Weapon name */}
      <div className="px-4 pb-4">
        <p className="text-white font-bold text-xs leading-tight mb-1">{prize.weapon}</p>
        <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{prize.desc}</p>
      </div>
    </div>
  );
}

/* ─── Account CTA ─── */
function AccountCTA() {
  const { isAuthenticated, user } = useUserAuth();
  if (isAuthenticated && user) {
    return (
      <div className="rounded-xl p-5 flex items-center gap-4"
        style={{ background: CARD, border: `1px solid ${LBLUE}30` }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ background: `${LBLUE}20`, border: `1px solid ${LBLUE}40` }}>
          <span className="text-white font-black text-sm">{user.name?.charAt(0)?.toUpperCase() || "U"}</span>
        </div>
        <div>
          <p className="text-white font-bold text-sm">{user.name}</p>
          <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
            You're registered · Entry confirmed ✓
          </p>
        </div>
      </div>
    );
  }
  return (
    <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <p className="text-white font-bold text-sm mb-1">Sign in to your Diaa Store account</p>
      <p className="text-xs mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
        You need a Diaa Store account to participate. It's free and takes 30 seconds.
      </p>
      <div className="flex gap-3">
        <Link href="/login">
          <button className="px-5 py-2.5 rounded-lg text-white text-xs font-bold transition-all hover:opacity-90"
            style={{ background: LBLUE }}>
            Sign In
          </button>
        </Link>
        <Link href="/login">
          <button className="px-5 py-2.5 rounded-lg text-xs font-semibold transition-all hover:opacity-80"
            style={{ background: "rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.6)", border: `1px solid ${LINE}` }}>
            Create Account
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 1 — STANDBY ═══════════════ */
function StateStandby() {
  const { d, h, m, s } = useCountdown(DRAW_TIME);
  const videoRef = useRef<HTMLVideoElement>(null);
  useEffect(() => { videoRef.current?.play().catch(() => {}); }, []);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-10">

      {/* ── CFS Logo + title ── */}
      <div className="flex items-center gap-5 mb-8">
        <img src={cfsLogoBanner} alt="CFS" className="w-16 object-contain flex-shrink-0" style={{ filter: "drop-shadow(0 0 12px rgba(33,150,243,0.4))" }} />
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.35em] mb-1"
            style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>
            CFS 10TH ANNIVERSARY
          </p>
          <h1 className="font-black text-white leading-none" style={{ fontSize: "clamp(2rem,7vw,3.5rem)", letterSpacing: "-0.02em" }}>
            GRAND GIVEAWAY
          </h1>
          <p className="text-sm mt-1 font-semibold" style={{ color: YELLOW }}>Lucky Draw · October 6, 2026</p>
        </div>
      </div>

      {/* ── Accent tags ── */}
      <div className="flex flex-wrap gap-2 mb-8">
        {[
          { label: "3 Winners", col: YELLOW },
          { label: "Oct 6, 2026", col: LBLUE },
          { label: "Live Draw", col: "#4caf50" },
        ].map(t => (
          <span key={t.label} className="px-3 py-1 rounded-full text-xs font-bold"
            style={{ background: `${t.col}15`, border: `1px solid ${t.col}35`, color: t.col }}>
            {t.label}
          </span>
        ))}
      </div>

      {/* ── Video ── */}
      <div className="rounded-xl overflow-hidden mb-8" style={{ border: `1px solid ${LINE}` }}>
        <video ref={videoRef} src="/media/cfs-event.mp4" loop muted playsInline
          className="w-full block" style={{ maxHeight: 220, objectFit: "cover", background: "#000" }} />
      </div>

      {/* ── Countdown ── */}
      <div className="rounded-xl p-6 mb-10" style={{ background: CARD, border: `1px solid ${LBLUE}22` }}>
        <p className="text-xs text-center mb-5 font-semibold uppercase tracking-widest"
          style={{ color: "rgba(255,255,255,0.3)", fontFamily: "ui-monospace,monospace" }}>
          Draw starts — October 6, 2026 · 10:00 PM Cairo Time
        </p>
        <div className="flex justify-center gap-4">
          <Tick v={d} label="Days" />
          <Tick v={h} label="Hours" />
          <Tick v={m} label="Min" />
          <Tick v={s} label="Sec" />
        </div>
      </div>

      {/* ── How to enter ── */}
      <SectionHead title="How to Enter" sub="Complete required steps to be eligible" />
      <div className="flex flex-col gap-2.5 mb-10">
        {[
          {
            n: "01", title: "Create your Diaa Store account", sub: "Free account — required to participate",
            badge: "Required", badgeColor: YELLOW, link: "/login", linkLabel: "Sign up now →", required: true,
          },
          {
            n: "02", title: "Join our WhatsApp channel", sub: "Write your name in the channel to register yourself",
            badge: "Required", badgeColor: YELLOW, link: WA_URL, linkLabel: "Open channel →", ext: true, required: true,
          },
          {
            n: "03", title: "Top up CrossFire", sub: "Every purchase increases your winning odds",
            badge: "Optional · Boosts odds", badgeColor: LBLUE, link: "/game/crossfire", linkLabel: "Go to CrossFire →",
          },
          {
            n: "04", title: "Support on YouTube", sub: "Subscribe or like — helps the channel and boosts your luck",
            badge: "Optional", badgeColor: LBLUE, link: YT_URL, linkLabel: "YouTube →", ext: true,
          },
        ].map((step) => (
          <div key={step.n} className="flex gap-4 items-start rounded-xl p-4"
            style={{ background: step.required ? CARD : "rgba(8,14,28,0.5)", border: `1px solid ${step.required ? LBLUE + "25" : LINE}` }}>
            <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
              style={{ background: step.required ? `${LBLUE}20` : "rgba(255,255,255,0.05)", color: step.required ? LBLUE : "rgba(255,255,255,0.3)", fontFamily: "ui-monospace,monospace" }}>
              {step.n}
            </span>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <p className="text-white font-bold text-sm">{step.title}</p>
                <span className="text-xs px-2 py-0.5 rounded font-semibold"
                  style={{ background: `${step.badgeColor}15`, color: step.badgeColor }}>
                  {step.badge}
                </span>
              </div>
              <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.35)" }}>{step.sub}</p>
              {step.ext ? (
                <a href={step.link} target="_blank" rel="noopener noreferrer"
                  className="text-xs font-semibold underline underline-offset-4 transition-opacity hover:opacity-70"
                  style={{ color: step.badgeColor }}>{step.linkLabel}</a>
              ) : (
                <Link href={step.link}>
                  <span className="text-xs font-semibold underline underline-offset-4 transition-opacity hover:opacity-70 cursor-pointer"
                    style={{ color: step.badgeColor }}>{step.linkLabel}</span>
                </Link>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Prizes (weapons only) ── */}
      <SectionHead title="Prizes" sub="Battle Pass E-Sports — Full Bundle" />
      <div className="grid grid-cols-3 gap-3 mb-10">
        {PRIZES.map((p, i) => <WeaponCard key={i} prize={p} i={i} />)}
      </div>
      <p className="text-xs mb-10 px-1" style={{ color: "rgba(255,255,255,0.25)" }}>
        All prizes are part of the complete Battle Pass E-Sports bundle including exclusive characters and skins.
        Winners are announced live on this page and on the official WhatsApp channel.
      </p>

      {/* ── Draw Mechanism ── */}
      <SectionHead title="Draw Mechanism" sub="100% transparent live draw" />
      <div className="rounded-xl p-5 mb-10" style={{ background: CARD, border: `1px solid ${LINE}` }}>
        <div className="grid grid-cols-2 gap-4">
          {[
            { icon: "🎡", title: "Live Spin Wheel", body: "Real-time spinning wheel visible to everyone on this page" },
            { icon: "📅", title: "October 6, 2026 · 10 PM", body: "Wheel starts automatically at the set time, Cairo timezone" },
            { icon: "📢", title: "Instant Announcement", body: "Winners revealed live on-site and on WhatsApp immediately after" },
            { icon: "⚡", title: "48-Hour Response Window", body: "Winners must respond within 48 hrs or a replacement is drawn" },
          ].map((item) => (
            <div key={item.title} className="flex gap-3 items-start">
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              <div>
                <p className="text-white font-semibold text-xs mb-0.5">{item.title}</p>
                <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.3)" }}>{item.body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Account ── */}
      <SectionHead title="Your Account" sub="Sign in to confirm your entry" />
      <div className="mb-10">
        <AccountCTA />
      </div>

      {/* ── Terms ── */}
      <SectionHead title="Terms & Conditions" />
      <div className="rounded-xl p-5 mb-10" style={{ background: CARD, border: `1px solid ${LINE}` }}>
        <ul className="flex flex-col gap-2.5">
          {[
            "Open to all CrossFire players — no age restriction",
            "Each participant may only win one prize",
            "Your registered name must match the name on the WhatsApp channel",
            "Organizer's decision is final and binding",
            "Winners contacted exclusively via the official WhatsApp channel",
            "Organizers reserve the right to modify rules in extraordinary circumstances",
          ].map((t, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className="shrink-0 mt-0.5 text-xs" style={{ color: LBLUE }}>—</span>
              <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.4)" }}>{t}</p>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Footer links ── */}
      <div className="flex justify-center gap-6 pb-2">
        <a href={WA_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.2)" }}>Official WhatsApp Channel</a>
        <span style={{ color: "rgba(255,255,255,0.1)" }}>·</span>
        <a href={YT_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.2)" }}>YouTube</a>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 2 — GATHERING ═══════════════ */
function StateGathering() {
  const { h, m, s } = useCountdown(DRAW_TIME);
  const [q, setQ] = useState("");
  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
      <p className="text-xs uppercase tracking-widest mb-2 font-semibold" style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>
        Draw starts in
      </p>
      <div className="flex gap-3 mb-10">
        <Tick v={h} label="Hours" /><Tick v={m} label="Min" /><Tick v={s} label="Sec" />
      </div>

      <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 28 }} className="mb-8">
        <p className="text-xs uppercase tracking-widest mb-4 font-semibold" style={{ color: "rgba(255,255,255,0.3)", fontFamily: "ui-monospace,monospace" }}>
          Registered Participants
        </p>
        <input value={q} onChange={e => setQ(e.target.value)} placeholder="Search your name..."
          className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none placeholder-white/20 mb-4"
          style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${LINE}` }} />
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto"
          style={{ scrollbarWidth: "thin", scrollbarColor: `${LBLUE}33 transparent` }}>
          {ALL.filter(p => !q || p.toLowerCase().includes(q.toLowerCase())).map(p => {
            const hit = q && p.toLowerCase().includes(q.toLowerCase());
            return (
              <div key={p} className="px-2 py-1.5 rounded text-xs text-center truncate transition-all"
                style={{
                  background: hit ? `${LBLUE}15` : "rgba(0,0,0,0.4)",
                  border: `1px solid ${hit ? LBLUE + "44" : LINE}`,
                  color: hit ? "#fff" : "rgba(255,255,255,0.35)", fontWeight: hit ? 700 : 400,
                }}>
                {p}
              </div>
            );
          })}
        </div>
      </div>
      <AccountCTA />
    </div>
  );
}

/* ═══════════════ STATE 3 — LIVE DRAW ═══════════════ */
interface Winner { username: string; rank: 1 | 2 | 3 }

function useTypewriter(text: string, go: boolean) {
  const [shown, setShown] = useState("");
  useEffect(() => {
    if (!go || !text) { setShown(""); return; }
    setShown(""); let i = 0;
    const id = setInterval(() => { i++; setShown(text.slice(0, i)); if (i >= text.length) clearInterval(id); }, 60);
    return () => clearInterval(id);
  }, [text, go]);
  return shown;
}

function StateLiveDraw({ onComplete }: { onComplete: (w: Winner[]) => void }) {
  const [remaining, setRemaining] = useState<string[]>(ALL);
  const [rot, setRot] = useState(0);
  const [trans, setTrans] = useState(false);
  const [lastElim, setLastElim] = useState("");
  const [showElim, setShowElim] = useState(false);
  const [started, setStarted] = useState(false);
  const busyRef = useRef(false);
  const rotRef = useRef(0);
  const remRef = useRef(ALL);
  const victimRef = useRef("");
  const typed = useTypewriter(lastElim, showElim);

  useEffect(() => {
    const id = setInterval(() => { if (cairo() >= DRAW_TIME) { setStarted(true); clearInterval(id); } }, 1000);
    if (forced() === 3) setStarted(true);
    return () => clearInterval(id);
  }, []);

  const spin = useCallback(() => {
    if (busyRef.current) return;
    const pool = remRef.current; if (pool.length <= 3) return;
    busyRef.current = true;
    const vi = Math.floor(Math.random() * pool.length);
    victimRef.current = pool[vi];
    const n = pool.length, seg = 360 / n;
    const center = (vi + 0.5) * seg;
    const curMod = rotRef.current % 360;
    const add = (center - curMod + 360) % 360;
    const spins = 5 + Math.floor(Math.random() * 2);
    const newRot = rotRef.current + 360 * spins + add;
    rotRef.current = newRot;
    setRot(newRot); setTrans(true);
    beep(350 + Math.random() * 150, 0.05, 0.08);
  }, []);

  const onEnd = useCallback(() => {
    setTrans(false);
    const v = victimRef.current;
    const nr = remRef.current.filter(p => p !== v);
    remRef.current = nr; setRemaining(nr);
    setLastElim(v); setShowElim(false);
    setTimeout(() => setShowElim(true), 80);
    beep(280, 0.3, 0.15);
    if (nr.length <= 3) {
      fanfare();
      setTimeout(() => onComplete(nr.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 }))), 2200);
      busyRef.current = false;
    } else {
      setTimeout(() => { busyRef.current = false; spin(); }, 4200);
    }
  }, [spin, onComplete]);

  useEffect(() => {
    if (!started || trans || busyRef.current) return;
    const t = setTimeout(spin, 1800); return () => clearTimeout(t);
  }, [started, spin, trans]);

  const { h, m, s } = useCountdown(DRAW_TIME);
  const pct = Math.min(100, ((ALL.length - remaining.length) / (ALL.length - 3)) * 100);

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16 flex flex-col items-center">
      <p className="text-xs uppercase tracking-widest mb-2 font-semibold"
        style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>Live Draw · CFS 10th Anniversary</p>
      <h2 className="text-3xl font-black text-white mb-8">Grand Giveaway</h2>

      {!started && (
        <div className="text-center mb-8">
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.4)" }}>
            Wheel starts automatically at 10:00 PM · October 6, 2026
          </p>
          <div className="flex gap-3 justify-center">
            <Tick v={h} label="Hours" /><Tick v={m} label="Min" /><Tick v={s} label="Sec" />
          </div>
        </div>
      )}

      <Wheel parts={remaining} rot={rot} trans={trans} onEnd={onEnd} />

      <div className="flex gap-8 mt-6 text-center">
        <div>
          <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "ui-monospace,monospace" }}>{remaining.length}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Remaining</p>
        </div>
        <div style={{ width: 1, background: LINE }} />
        <div>
          <p className="text-3xl font-black text-white tabular-nums" style={{ fontFamily: "ui-monospace,monospace" }}>{ALL.length - remaining.length}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.3)" }}>Eliminated</p>
        </div>
      </div>

      <div className="h-14 flex items-center justify-center w-full mt-4">
        {showElim && lastElim && (
          <div className="text-center">
            <p className="text-xs uppercase tracking-widest mb-1 font-semibold" style={{ color: "rgba(255,255,255,0.2)", fontFamily: "ui-monospace,monospace" }}>Eliminated</p>
            <p className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.6)", fontFamily: "ui-monospace,monospace" }}>
              {typed}<span style={{ opacity: typed.length < lastElim.length ? 0.4 : 0 }}>_</span>
            </p>
          </div>
        )}
      </div>

      <div className="w-full mt-4">
        <div className="w-full h-px rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.06)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: LBLUE }} />
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 4 — RESULTS ═══════════════ */
function StateResults({ winners }: { winners: Winner[] }) {
  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
      <div className="flex items-center gap-3 mb-2">
        <img src={cfsLogoBanner} alt="CFS" className="w-10 object-contain flex-shrink-0" />
        <p className="text-xs uppercase tracking-[0.35em] font-semibold"
          style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>CFS 10TH ANNIVERSARY · RESULTS</p>
      </div>
      <h1 className="font-black text-white mb-2" style={{ fontSize: "clamp(3rem,10vw,5rem)", letterSpacing: "-0.02em" }}>
        WINNERS
      </h1>
      <p className="mb-10 text-sm" style={{ color: "rgba(255,255,255,0.3)" }}>
        Congratulations — winners will be contacted via the official WhatsApp channel within 48 hours.
      </p>

      {/* 1st — full width */}
      {winners.filter(w => w.rank === 1).map(w => (
        <WCard key={w.username} w={w} prize={PRIZES[0]} delay={200} wide />
      ))}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
        {winners.filter(w => w.rank !== 1).map((w, i) => (
          <WCard key={w.username} w={w} prize={PRIZES[w.rank - 1]} delay={500 + i * 300} />
        ))}
      </div>

      <div className="mt-14 pt-8 text-center" style={{ borderTop: `1px solid ${LINE}` }}>
        <p className="text-xs mb-3" style={{ color: "rgba(255,255,255,0.2)" }}>Questions? Contact us</p>
        <a href={WA_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4 transition-opacity hover:opacity-70"
          style={{ color: "rgba(255,255,255,0.25)" }}>
          Official WhatsApp Channel
        </a>
      </div>
    </div>
  );
}

function WCard({ w, prize, delay, wide = false }: { w: Winner; prize: typeof PRIZES[0]; delay: number; wide?: boolean }) {
  const [vis, setVis] = useState(false);
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);

  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(28px)",
      transition: "opacity 0.7s ease,transform 0.7s ease",
      border: `1px solid ${prize.color}33`, background: CARD, borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${prize.color},transparent)` }} />
      {wide ? (
        <div className="flex gap-5 items-center p-5">
          <img src={prize.charImg} alt={prize.rank} className="rounded-xl object-cover flex-shrink-0"
            style={{ width: 120, height: 160, objectPosition: "top", background: "rgba(0,0,0,0.3)" }} />
          <div>
            <p className="text-xs font-black tracking-[0.3em] mb-3"
              style={{ color: prize.color, fontFamily: "ui-monospace,monospace" }}>{prize.rank} PLACE · {prize.rankAr.toUpperCase()}</p>
            <p className="text-white font-black text-3xl sm:text-4xl mb-2 break-all">{w.username}</p>
            <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>{prize.weapon}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.2)" }}>Battle Pass E-Sports · Full Bundle</p>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center">
          <p className="text-xs font-black tracking-[0.25em] mb-4"
            style={{ color: prize.color, fontFamily: "ui-monospace,monospace" }}>{prize.rank} PLACE</p>
          <img src={prize.charImg} alt={prize.rank} className="mx-auto rounded-xl object-cover mb-4"
            style={{ width: 90, height: 120, objectPosition: "top", background: "rgba(0,0,0,0.3)" }} />
          <p className="text-white font-black text-xl break-all mb-1">{w.username}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.3)" }}>{prize.weapon}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ ROOT ═══════════════ */
export default function GiveawayPage() {
  const f = forced();
  const [state, setState] = useState<S>(f ?? auto());
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (f) return;
    const id = setInterval(() => setState(s => s >= 3 ? s : auto()), 5000);
    return () => clearInterval(id);
  }, [f]);

  const handleComplete = (w: Winner[]) => { setWinners(w); setState(4); };
  const cur = f ?? state;

  return (
    <div className="min-h-screen relative"
      style={{ background: "#060a14", fontFamily: "'Inter',system-ui,sans-serif", color: "#fff" }}>

      {/* ── Full-page background ── */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <img src={cfsBgMap} alt="" className="w-full h-full object-cover"
          style={{ objectPosition: "center top", opacity: 0.18 }} />
        {/* Blue gradient overlay to push CFS feel */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(160deg, rgba(10,20,50,0.7) 0%, rgba(6,10,20,0.9) 50%, #060a14 100%)" }} />
        {/* Subtle blue top-left glow */}
        <div className="absolute top-0 left-0 w-1/2 h-1/3 pointer-events-none"
          style={{ background: `radial-gradient(ellipse at 0% 0%, ${BLUE}20 0%, transparent 70%)` }} />
      </div>

      {/* ── Top banner strip ── */}
      <div className="relative z-10" style={{ borderBottom: `1px solid ${LBLUE}20` }}>
        <img src="/images/cfs-header.png" alt="CFS Esports" className="w-full block object-cover"
          style={{ maxHeight: 80, objectPosition: "center" }} />
      </div>

      {/* ── Content ── */}
      <div className="relative z-10">

        {/* Dev nav */}
        {f !== null && (
          <div className="fixed top-3 right-3 z-50 flex gap-1">
            {([1, 2, 3, 4] as S[]).map(n => (
              <a key={n} href={`?state=${n}`}
                className="px-2.5 py-1 rounded text-xs font-bold"
                style={{
                  background: cur === n ? LBLUE : "rgba(0,0,0,0.6)",
                  border: `1px solid ${cur === n ? LBLUE : "rgba(255,255,255,0.08)"}`,
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
    </div>
  );
}
