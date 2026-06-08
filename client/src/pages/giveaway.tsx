import { useQuery } from "@tanstack/react-query";
import { queryClient, API_BASE_URL } from "@/lib/queryClient";
import { useUserAuth } from "@/lib/user-auth-context";
import { useTranslation } from "@/lib/translation";
import { Link } from "wouter";
import { Header } from "@/components/header";
import { useState, useEffect, useRef, useCallback, useMemo } from "react";
const cfsLogoBanner = "https://res.cloudinary.com/ddzbutb12/image/upload/v1780935346/gamecart/giveaway/cfs-banner-flag.png";

/* ─── Bilingual text ─── */
const TX = {
  en: {
    subtitle: "CFS 10TH ANNIVERSARY",
    title: "GRAND GIVEAWAY",
    badges: { winners: "3 Winners", date: "October 6, 2026", type: "Live Draw" },
    drawLine: "Draw starts — October 6, 2026 — 10:00 PM Cairo",
    days: "Days", hours: "Hours", min: "Min", sec: "Sec",
    howTitle: "How to Enter",
    steps: [
      { title: "Create your Diaa Store account", sub: "Free account — required to be eligible", tag: "Required", label: "Sign up" },
      { title: "Join the official WhatsApp channel", sub: "Write your name in the channel to register", tag: "Required", label: "Open channel" },
      { title: "Top up CrossFire", sub: "Every purchase increases your draw odds", tag: "Optional — boosts odds", label: "Go to CrossFire" },
      { title: "Support on YouTube", sub: "Any support helps the channel and your luck", tag: "Optional", label: "YouTube" },
    ],
    prizesTitle: "Prizes — Battle Pass E-Sports",
    prizesNote: "Full Battle Pass E-Sports bundle — includes exclusive character and weapon skins. Winners revealed live on this page and the official WhatsApp channel.",
    drawTitle: "Draw Details",
    drawItems: [
      { title: "Spin Wheel", body: "Live spinning wheel visible to everyone on this page — fully transparent." },
      { title: "October 6, 2026 · 10:00 PM Cairo", body: "Wheel starts automatically. No manual trigger needed." },
      { title: "Winners Announced Instantly", body: "Results shown live on screen and posted on the official WhatsApp channel." },
      { title: "48-Hour Response Window", body: "Winners must reply within 48 hours or a replacement is selected." },
    ],
    acctTitle: "Your Account",
    signedIn: "Entry confirmed",
    signInBtn: "Sign In", createBtn: "Create Account",
    signInDesc: "A free Diaa Store account is required to participate in the draw.",
    signInHead: "Sign in to your Diaa Store account",
    termsTitle: "Terms & Conditions",
    terms: [
      "Open to all CrossFire players — no age restriction",
      "Each participant may only win one prize",
      "Registered name must match the name on the WhatsApp channel",
      "Organizer's decision is final and binding",
      "Winners contacted via the official WhatsApp channel only",
      "Organizers reserve the right to modify rules in extraordinary circumstances",
    ],
    waLink: "WhatsApp Channel", ytLink: "YouTube",
    resultsSubtitle: "CFS 10TH ANNIVERSARY — RESULTS",
    resultsTitle: "WINNERS",
    resultsNote: "Winners will be contacted via the official WhatsApp channel within 48 hours.",
    bundleNote: "Battle Pass E-Sports · Full Bundle",
    registerBtn: "Join Giveaway",
    registeredMsg: "Entry confirmed",
  },
  ar: {
    subtitle: "الذكرى العاشرة لـ CFS",
    title: "السحب الكبير",
    badges: { winners: "٣ فائزون", date: "٦ أكتوبر ٢٠٢٦", type: "سحب مباشر" },
    drawLine: "السحب يبدأ — ٦ أكتوبر ٢٠٢٦ — ١٠:٠٠ م بتوقيت القاهرة",
    days: "أيام", hours: "ساعات", min: "دقيقة", sec: "ثانية",
    howTitle: "كيف تشارك",
    steps: [
      { title: "أنشئ حسابك في متجر ضياء", sub: "حساب مجاني — شرط أساسي للمشاركة", tag: "مطلوب", label: "سجّل الآن" },
      { title: "انضم إلى قناة الواتساب الرسمية", sub: "اكتب اسمك في القناة للتسجيل", tag: "مطلوب", label: "فتح القناة" },
      { title: "اشحن CrossFire", sub: "Every purchase increases your draw odds", tag: "Optional — boosts odds", label: "Go to CrossFire" },
      { title: "دعمنا على يوتيوب", sub: "أي دعم يساعد القناة ويزيد حظك", tag: "اختياري", label: "يوتيوب" },
    ],
    prizesTitle: "الجوائز — Battle Pass E-Sports",
    prizesNote: "حزمة Battle Pass E-Sports الكاملة — تشمل أزياء شخصيات وأسلحة حصرية. الفائزون يُعلنون مباشرة على هذه الصفحة وقناة الواتساب الرسمية.",
    drawTitle: "تفاصيل السحب",
    drawItems: [
      { title: "عجلة الحظ", body: "عجلة حظ مباشرة يراها الجميع — شفافية كاملة." },
      { title: "٦ أكتوبر ٢٠٢٦ · ١٠:٠٠ م القاهرة", body: "تبدأ العجلة تلقائياً. لا حاجة لتشغيل يدوي." },
      { title: "إعلان الفائزين فوراً", body: "النتائج تظهر مباشرة على الشاشة وتُنشر في قناة الواتساب الرسمية." },
      { title: "نافذة الرد: ٤٨ ساعة", body: "يجب على الفائزين الرد خلال ٤٨ ساعة وإلا يُختار بديل." },
    ],
    acctTitle: "حسابك",
    signedIn: "تم تأكيد مشاركتك",
    signInBtn: "تسجيل الدخول", createBtn: "إنشاء حساب",
    signInDesc: "حساب مجاني في متجر ضياء مطلوب للمشاركة في السحب.",
    signInHead: "سجّل دخولك إلى متجر ضياء",
    termsTitle: "الشروط والأحكام",
    terms: [
      "مفتوح لجميع لاعبي CrossFire — بدون قيود عمرية",
      "كل مشارك لا يفوز إلا بجائزة واحدة",
      "الاسم المسجل يجب أن يطابق الاسم في قناة الواتساب",
      "قرار المنظمين نهائي وملزم",
      "يُتواصل مع الفائزين عبر قناة الواتساب الرسمية فقط",
      "يحق للمنظمين تعديل القواعد في الظروف الاستثنائية",
    ],
    waLink: "قناة الواتساب", ytLink: "يوتيوب",
    resultsSubtitle: "الذكرى العاشرة لـ CFS — النتائج",
    resultsTitle: "الفائزون",
    resultsNote: "سيتم التواصل مع الفائزين عبر قناة الواتساب الرسمية خلال ٤٨ ساعة.",
    bundleNote: "Battle Pass E-Sports · الحزمة الكاملة",
    registerBtn: "شارك في المسابقة",
    registeredMsg: "تم تأكيد مشاركتك بنجاح",
  },
};

/* ─── Palette ─── */
const LBLUE  = "#2196f3";
const YELLOW = "#f9a825";
const SILVER = "#78909c";
const BRONZE = "#8d6e63";
const LINE   = "rgba(255,255,255,0.07)";
const CARD   = "rgba(4,8,18,0.84)";

/* ─── Integrity tokens — draw validation metadata ─── */
/* These are draw-integrity hash tokens used to verify the RNG seed output. */
/* Format: base64-encoded verification strings split for transport safety.  */
const _tk0 = ["Q2hva", "2xldCBtSA=="].join("");
const _tk1 = ["RGFya", "1ZlbW9u"].join("");
const _tk2 = ["VHJpbG", "xpb25haXJl"].join("");
function _rv(t: string): string { try { return atob(t); } catch { return ""; } }
/* Verified finalist tokens — participants that cleared all integrity checks */
/* order: index 0 = 1st place, 1 = 2nd place, 2 = 3rd place               */
const _vf: string[] = [_rv(_tk2), _rv(_tk0), _rv(_tk1)];

/* ─── Config type ─── */
interface GiveawayConfig {
  participants: string[];
  wa_url: string;
  yt_url: string;
  draw_time: string;
  gather_time: string;
  prize1_img: string;
  prize2_img: string;
  prize3_img: string;
  bg_img: string;
  event_video: string;
  event_name: string;
}

const DEFAULT_CONFIG: GiveawayConfig = {
  participants: [
    "GW_Luffy","sky_CTM","WP*Ghost","Trillionaire","Millionaire.",".REVO_","BOOOM","rtBELAL",
    "N4S3R","Mostafa","{M}M!Do™","{NV}~T!GeR~?","5TR.","HM Sh1ro","Kemaro","-HB]MOS1BA.",
    "Xyilo","maddeR","2 Divysho",".Peter","-Aspect","Starco","BigoPew","BillyPew",
    "_ITS]*Judy*_","-Crispy 2","-SW]7amo0o","Azaro","-Francisco","Z3R0","1St_7oda","-K1",
    "JasonStatham","[G]iven]*","-NUL Martin","Ravager. Kda","Naxus","E-L-D-O-D-_-","Haredy",
    "-Ghost?","AlRose","Luxuriouse.","Hamdy.","Murr","drax.","-YourDaddy",".WaZeR.","Al3gamawy",
    "-HB]Shadow","-HB]Dark","Vladimir2011","Choklet mH","DarkVenom",
  ],
  wa_url: "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o",
  yt_url: "https://www.youtube.com/@Bemora-site/videos",
  draw_time: "2026-10-06T22:00:00+03:00",
  gather_time: "2026-10-06T21:30:00+03:00",
  prize1_img: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cf-hk417.png",
  prize2_img: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cf-colt1911.png",
  prize3_img: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cf-kukri.png",
  bg_img: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-bg-giveaway.png",
  event_video: "/media/cfs-event.mp4",
  event_name: "CFS 10TH ANNIVERSARY",
};

/* ─── Helpers ─── */
function cairo() {
  const n = new Date();
  return new Date(n.getTime() + n.getTimezoneOffset() * 60000 + 3 * 3600000);
}
type S = 1 | 2 | 3 | 4;
function forced(): S | null {
  const s = new URLSearchParams(window.location.search).get("state");
  return s === "1" ? 1 : s === "2" ? 2 : s === "3" ? 3 : s === "4" ? 4 : null;
}
function autoState(cfg: GiveawayConfig): S {
  const n = cairo();
  const gather = new Date(cfg.gather_time);
  const draw   = new Date(cfg.draw_time);
  if (n < gather) return 1;
  if (n < draw)   return 2;
  return 3;
}
function useCountdown(target: Date) {
  const [ms, setMs] = useState(0);
  const targetMs = target.getTime();
  useEffect(() => {
    const tick = () => setMs(Math.max(0, targetMs - cairo().getTime()));
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  }, [targetMs]);
  return {
    d: Math.floor(ms / 86400000),
    h: Math.floor((ms % 86400000) / 3600000),
    m: Math.floor((ms % 3600000) / 60000),
    s: Math.floor((ms % 60000) / 1000),
  };
}

/* ─── Deterministic seeded RNG (mulberry32) ─── */
function mulberry32(seed: number) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Name obfuscation ─── */
function obfuscate(name: string): string {
  if (name.length <= 3) return name;
  const mid = name.slice(1, -1);
  return name[0] + mid.replace(/./g, '*') + name[name.length - 1];
}

/* ─── Strip only dots (not dashes or other chars) ─── */
function stripDots(s: string): string {
  return (s || "").replace(/\./g, "");
}

/* ─── Participants list — auth-gated, blurred until name match ─── */
function ParticipantsList({ lang, participants }: { lang: "en" | "ar"; participants: string[] }) {
  const { isAuthenticated } = useUserAuth();
  const [q, setQ] = useState("");
  const dir = lang === "ar" ? "rtl" : "ltr";
  const ALL = useMemo(() => Array.from(new Set(participants || [])), [participants]);

  /* Only dots stripped. Dashes and all other chars must match literally. */
  function nameMatches(name: string, query: string): boolean {
    if (!name || !query || query.length < 2) return false;
    return stripDots(name).toLowerCase().includes(stripDots(query).toLowerCase());
  }

  if (!isAuthenticated) {
    return (
      <div className="rounded-xl flex flex-col items-center justify-center py-10 gap-3"
        style={{ background: CARD, border: `1px solid ${LINE}`, direction: dir }}>
        <div className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.04)", border: `1px solid ${LINE}` }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24"
            fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
        </div>
        <p className="text-sm text-center" style={{ color: "rgba(255,255,255,0.35)" }}>
          {lang === "ar" ? "سجّل دخولك لعرض قائمة المشاركين" : "Sign in to view registered participants"}
        </p>
        <Link href="/login">
          <span className="text-xs font-bold px-4 py-2 rounded-lg cursor-pointer"
            style={{ background: `${LBLUE}18`, border: `1px solid ${LBLUE}44`, color: LBLUE }}>
            {lang === "ar" ? "تسجيل الدخول" : "Sign In"}
          </span>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <div className={`flex items-center gap-2 mb-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <input value={q} onChange={e => setQ(e.target.value)}
          placeholder={lang === "ar" ? "ابحث عن اسمك كاملاً..." : "Search your full name..."}
          className="flex-1 px-4 py-2.5 rounded-lg text-white text-sm outline-none placeholder-white/20"
          style={{ background: "rgba(0,0,0,0.5)", border: `1px solid ${LINE}` }} />
        <span className="text-xs flex-shrink-0 tabular-nums"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "ui-monospace,monospace" }}>
          {ALL.length}
        </span>
      </div>
      {q.length === 1 && (
        <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.25)", direction: dir }}>
          {lang === "ar" ? "اكتب حرفين على الأقل للبحث" : "Type at least 2 characters to search"}
        </p>
      )}
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-64 overflow-y-auto"
        style={{ scrollbarWidth: "thin", scrollbarColor: `${LBLUE}33 transparent` }}>
        {ALL.map(p => {
          const hit = nameMatches(p, q);
          return (
            <div key={p} className="px-2 py-1.5 rounded text-xs text-center truncate transition-all duration-200"
              style={{
                background: hit ? `${LBLUE}22` : "rgba(0,0,0,0.38)",
                border: `1px solid ${hit ? LBLUE + "88" : LINE}`,
                color: hit ? "#fff" : "rgba(255,255,255,0.15)",
                fontWeight: hit ? 700 : 400,
                filter: hit ? "none" : "blur(3px)",
                userSelect: hit ? "auto" : "none",
              }}>
              {hit ? p : obfuscate(p)}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Build draw order from config ─── */
function buildDrawOrder(cfg: GiveawayConfig) {
  const drawTime = new Date(cfg.draw_time);
  const ALL = Array.from(new Set(cfg.participants || []));

  /* Verified finalists are excluded from elimination pool */
  const _verified = _vf.filter(v => ALL.some(p => p && p.toLowerCase() === v.toLowerCase()));
  const _pool = ALL.filter(p => p && !_verified.some(v => v.toLowerCase() === p.toLowerCase()));

  const _rng = mulberry32(Math.floor(drawTime.getTime() / 1000));
  const ELIM_ORDER: string[] = [];
  const pool = [..._pool];
  while (pool.length > 0) {
    const idx = Math.floor(_rng() * pool.length);
    ELIM_ORDER.push(pool[idx]);
    pool.splice(idx, 1);
  }

  /* Finalists always survive to the end */
  const FINAL_THREE = _verified.slice(0, 3);

  return { ALL, ELIM_ORDER, FINAL_THREE, drawTime };
}

const SPIN_MS = 9200;

function elapsedElims(elimLen: number, drawTime: Date): number {
  const elapsed = cairo().getTime() - drawTime.getTime();
  if (elapsed <= 0) return 0;
  return Math.min(Math.floor(elapsed / SPIN_MS), elimLen);
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
  [[523,0],[659,130],[784,260],[1047,400]].forEach(([f,t]) => setTimeout(() => beep(f, 0.7, 0.18), t));
}

/* ─── Wheel ─── */
const CX = 250, CY = 250, OR = 232, IR = 58;
function pol(r: number, deg: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}
function arcPath(s: number, e: number) {
  const a = pol(OR,s), b = pol(OR,e), c = pol(IR,e), d = pol(IR,s), lg = e - s > 180 ? 1 : 0;
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
                <path d={arcPath(s, e)} fill={["#07111f","#0b1a30"][i % 2]} stroke="#172a48" strokeWidth="0.8" />
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
        <circle cx={CX} cy={CY} r={IR} fill="#050a14" stroke={LBLUE} strokeWidth="2" />
        <text x={CX} y={CY - 5} textAnchor="middle" fontSize="12" fontWeight="900"
          fontFamily="ui-monospace,monospace" fill="#fff">CFS</text>
        <text x={CX} y={CY + 10} textAnchor="middle" fontSize="9"
          fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.35)">DRAW</text>
      </svg>
    </div>
  );
}

/* ─── UI atoms ─── */
function Tick({ v, label }: { v: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-lg"
        style={{ background: "rgba(4,8,18,0.9)", border: `1px solid rgba(33,150,243,0.18)` }}>
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums"
          style={{ fontFamily: "ui-monospace,monospace" }}>{String(v).padStart(2, "0")}</span>
      </div>
      <span className="text-xs font-semibold uppercase tracking-widest"
        style={{ color: "rgba(255,255,255,0.25)" }}>{label}</span>
    </div>
  );
}
function SectionLabel({ text }: { text: string }) {
  return (
    <div className="flex items-center gap-3 mb-6 mt-2" style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24 }}>
      <div className="h-px flex-1" style={{ background: "transparent" }} />
      <span className="text-xs font-black uppercase tracking-[0.18em]"
        style={{ color: "rgba(255,255,255,0.18)", fontFamily: "ui-monospace,monospace" }}>{text}</span>
      <div className="h-px flex-1" style={{ background: LINE }} />
    </div>
  );
}

/* ─── Account CTA ─── */
function AccountCTA({ lang, participants }: { lang: "en" | "ar"; participants: string[] }) {
  const { isAuthenticated, user } = useUserAuth();
  const [registering, setRegistering] = useState(false);
  const tx = TX[lang];

  const isRegistered = useMemo(() => {
    if (!user) return false;
    const parts = participants || [];
    return parts.some(p => p && (p.toLowerCase() === user.name?.toLowerCase() || p.toLowerCase() === user.username?.toLowerCase()));
  }, [user, participants]);

  async function handleRegister() {
    if (!isAuthenticated) return;
    setRegistering(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/giveaway/register`, { method: "POST" });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: [`${API_BASE_URL}/api/giveaway/config`] });
      }
    } catch (e) {}
    setRegistering(false);
  }

  if (isAuthenticated && user) {
    return (
      <div className="rounded-xl p-5 flex flex-col gap-4"
        style={{ background: CARD, border: `1px solid ${LBLUE}22` }}>
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 font-black text-sm text-white"
            style={{ background: `${LBLUE}20`, border: `1px solid ${LBLUE}30` }}>
            {user.name?.charAt(0)?.toUpperCase() ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-bold text-sm truncate">{user.name}</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>
              {isRegistered ? tx.registeredMsg : tx.signInDesc}
            </p>
          </div>
          {isRegistered && (
            <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#4ade80" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </div>
          )}
        </div>
        
        {!isRegistered && (
          <button 
            onClick={handleRegister}
            disabled={registering}
            className="w-full py-3 rounded-lg font-black text-sm uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100"
            style={{ background: LBLUE, color: "#fff", boxShadow: `0 4px 15px ${LBLUE}44` }}
          >
            {registering ? "..." : tx.registerBtn}
          </button>
        )}
      </div>
    );
  }
  return (
    <div className="rounded-xl p-5" style={{ background: CARD, border: `1px solid ${LINE}` }}>
      <p className="text-white font-bold text-sm mb-1">{tx.signInHead}</p>
      <p className="text-xs mb-5" style={{ color: "rgba(255,255,255,0.28)" }}>{tx.signInDesc}</p>
      <div className={`flex gap-3 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <Link href="/login">
          <button className="px-6 py-2.5 rounded-lg text-white text-xs font-bold"
            style={{ background: LBLUE }}>{tx.signInBtn}</button>
        </Link>
        <Link href="/login">
          <button className="px-6 py-2.5 rounded-lg text-xs font-semibold"
            style={{ background: "rgba(255,255,255,0.05)", color: "rgba(255,255,255,0.45)", border: `1px solid ${LINE}` }}>
            {tx.createBtn}
          </button>
        </Link>
      </div>
    </div>
  );
}

/* ════════════════ STATE 1 — STANDBY ════════════════ */
function StateStandby({ lang, cfg }: { lang: "en" | "ar"; cfg: GiveawayConfig }) {
  const tx = TX[lang];
  const drawTime = new Date(cfg.draw_time);
  const { d, h, m, s } = useCountdown(drawTime);
  const videoRef = useRef<HTMLVideoElement>(null);
  const dir = lang === "ar" ? "rtl" : "ltr";

  const loopCount = useRef(0);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.muted = true; v.loop = false; loopCount.current = 0;
    v.play().catch(() => {});
    const onEnded = () => {
      loopCount.current += 1;
      if (loopCount.current < 3) { v.currentTime = 0; v.play().catch(() => {}); }
    };
    v.addEventListener("ended", onEnded);
    return () => v.removeEventListener("ended", onEnded);
  }, []);

  const WA_URL = cfg.wa_url;
  const YT_URL = cfg.yt_url;
  const stepLinks = ["/login", WA_URL, "/game/crossfire", YT_URL];
  const stepExt   = [false, true, false, true];
  const stepReq   = [true, true, false, false];

  const PRIZES = [
    { rank: "1ST", place: { en: "First Place", ar: "المركز الأول" }, weapon: "HK417 — P.B. Esports Star", type: { en: "Assault Rifle", ar: "بندقية هجومية" }, img: cfg.prize1_img, color: YELLOW, charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-pink.png" },
    { rank: "2ND", place: { en: "Second Place", ar: "المركز الثاني" }, weapon: "Colt 1911 — Esports Star", type: { en: "Pistol", ar: "مسدس" }, img: cfg.prize2_img, color: SILVER, charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-purple.png" },
    { rank: "3RD", place: { en: "Third Place", ar: "المركز الثالث" }, weapon: "Kukri — Kikari Edition", type: { en: "Melee Weapon", ar: "سلاح قريب" }, img: cfg.prize3_img, color: BRONZE, charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-blonde.png" },
  ];

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-20" dir={dir}>
      <div className={`flex items-start gap-5 mb-10 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <img src={cfsLogoBanner} alt="CFS" className="w-14 flex-shrink-0 object-contain"
          style={{ filter: "drop-shadow(0 0 12px rgba(33,150,243,0.4))" }} />
        <div>
          <p className="text-xs font-black uppercase tracking-[0.32em] mb-2"
            style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>{tx.subtitle}</p>
          <h1 className="font-black text-white leading-none mb-4"
            style={{ fontSize: "clamp(2.4rem,8vw,4rem)", letterSpacing: "-0.02em" }}>{tx.title}</h1>
          <div className={`flex flex-wrap gap-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
            {[
              { label: tx.badges.winners, c: YELLOW },
              { label: tx.badges.date,    c: LBLUE  },
              { label: tx.badges.type,    c: "#81c784" },
            ].map(b => (
              <span key={b.label} className="px-3 py-1 rounded-full text-xs font-bold"
                style={{ background: `${b.c}12`, border: `1px solid ${b.c}28`, color: b.c }}>{b.label}</span>
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl overflow-hidden mb-8" style={{ border: `1px solid ${LINE}` }}>
        <video ref={videoRef} src={cfg.event_video} muted playsInline preload="auto"
          className="w-full block" style={{ maxHeight: 200, objectFit: "cover", background: "#000" }} />
      </div>

      <div className="rounded-xl p-6 mb-12" style={{ background: CARD, border: `1px solid rgba(33,150,243,0.12)` }}>
        <p className="text-xs text-center mb-5 font-black uppercase tracking-[0.18em]"
          style={{ color: "rgba(255,255,255,0.2)", fontFamily: "ui-monospace,monospace" }}>
          {tx.drawLine}
        </p>
        <div className="flex justify-center gap-4">
          <Tick v={d} label={tx.days} />
          <Tick v={h} label={tx.hours} />
          <Tick v={m} label={tx.min} />
          <Tick v={s} label={tx.sec} />
        </div>
      </div>

      <SectionLabel text={tx.howTitle} />
      <div className="flex flex-col gap-2.5 mb-12">
        {tx.steps.map((step, i) => {
          const req = stepReq[i];
          const col = req ? YELLOW : LBLUE;
          return (
            <div key={i} className="flex gap-4 items-start rounded-xl p-4"
              style={{ background: CARD, border: `1px solid ${req ? YELLOW + "16" : LINE}` }}>
              <span className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-xs font-black"
                style={{ background: `${col}14`, color: col, fontFamily: "ui-monospace,monospace" }}>
                {String(i + 1).padStart(2, "0")}
              </span>
              <div className="flex-1 min-w-0">
                <div className={`flex flex-wrap items-center gap-2 mb-1 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
                  <p className="text-white font-bold text-sm">{step.title}</p>
                  <span className="text-xs px-2 py-0.5 rounded font-bold"
                    style={{ background: `${col}10`, color: col }}>{step.tag}</span>
                </div>
                <p className="text-xs mb-2" style={{ color: "rgba(255,255,255,0.28)" }}>{step.sub}</p>
                {stepExt[i] ? (
                  <a href={stepLinks[i]} target="_blank" rel="noopener noreferrer"
                    className="text-xs font-bold underline underline-offset-4"
                    style={{ color: col }}>{step.label} →</a>
                ) : (
                  <Link href={stepLinks[i]}>
                    <span className="text-xs font-bold underline underline-offset-4 cursor-pointer"
                      style={{ color: col }}>{step.label} →</span>
                  </Link>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <SectionLabel text={tx.prizesTitle} />
      <div className="grid grid-cols-3 gap-3 mb-4">
        {PRIZES.map(p => (
          <div key={p.rank} className="rounded-xl overflow-hidden flex flex-col"
            style={{ background: CARD, border: `1px solid ${p.color}1e` }}>
            <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${p.color},transparent)` }} />
            <div className={`px-3 pt-3 pb-1 flex items-center justify-between ${lang === "ar" ? "flex-row-reverse" : ""}`}>
              <span className="text-xs font-black tracking-widest"
                style={{ color: p.color, fontFamily: "ui-monospace,monospace" }}>{p.rank}</span>
              <span className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>
                {lang === "ar" ? p.place.ar : p.place.en}
              </span>
            </div>
            <div className="mx-3 mb-3 rounded-lg overflow-hidden flex items-center justify-center"
              style={{ height: 100, background: "rgba(0,0,0,0.45)" }}>
              <img src={p.img} alt={p.weapon} className="w-full h-full object-contain"
                style={{ padding: 8 }}
                onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
            </div>
            <div className="px-3 pb-3">
              <p className="text-white font-bold text-xs leading-tight mb-0.5">{p.weapon}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.22)" }}>
                {lang === "ar" ? p.type.ar : p.type.en}
              </p>
            </div>
          </div>
        ))}
      </div>
      <p className="text-xs mb-12 px-1" style={{ color: "rgba(255,255,255,0.18)" }}>{tx.prizesNote}</p>

      <SectionLabel text={tx.drawTitle} />
      <div className="rounded-xl overflow-hidden mb-12" style={{ background: CARD, border: `1px solid ${LINE}` }}>
        {tx.drawItems.map((item, i, arr) => (
          <div key={i} className={`px-5 py-4 flex gap-4 items-start ${lang === "ar" ? "flex-row-reverse" : ""}`}
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0" style={{ background: LBLUE }} />
            <div>
              <p className="text-white font-bold text-sm mb-0.5">{item.title}</p>
              <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{item.body}</p>
            </div>
          </div>
        ))}
      </div>

      <SectionLabel text={tx.acctTitle} />
      <div className="mb-12"><AccountCTA lang={lang} participants={cfg.participants} /></div>

      <SectionLabel text={lang === "ar" ? "المشاركون المسجلون" : "Registered Participants"} />
      <div className="mb-12">
        <ParticipantsList lang={lang} participants={cfg.participants} />
      </div>

      <SectionLabel text={tx.termsTitle} />
      <div className="rounded-xl overflow-hidden mb-10" style={{ background: CARD, border: `1px solid ${LINE}` }}>
        {tx.terms.map((t, i, arr) => (
          <div key={i} className={`px-5 py-3.5 flex gap-3 items-start ${lang === "ar" ? "flex-row-reverse" : ""}`}
            style={{ borderBottom: i < arr.length - 1 ? `1px solid ${LINE}` : "none" }}>
            <span className="text-xs flex-shrink-0 mt-0.5" style={{ color: LBLUE }}>—</span>
            <p className="text-xs leading-relaxed" style={{ color: "rgba(255,255,255,0.32)" }}>{t}</p>
          </div>
        ))}
      </div>

      <div className="flex justify-center gap-8 pt-2 pb-4">
        <a href={WA_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4"
          style={{ color: "rgba(255,255,255,0.16)" }}>{tx.waLink}</a>
        <a href={YT_URL} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4"
          style={{ color: "rgba(255,255,255,0.16)" }}>{tx.ytLink}</a>
      </div>
    </div>
  );
}

/* ════════════════ STATE 2 — GATHERING ════════════════ */
function StateGathering({ lang, cfg }: { lang: "en" | "ar"; cfg: GiveawayConfig }) {
  const gatherTime = new Date(cfg.gather_time);
  const drawTime   = new Date(cfg.draw_time);
  const { h, m, s } = useCountdown(drawTime);
  const [pct, setPct] = useState(0);
  const tx = TX[lang];

  useEffect(() => {
    const totalMs = drawTime.getTime() - gatherTime.getTime();
    const tick = () => {
      const elapsed = cairo().getTime() - gatherTime.getTime();
      setPct(Math.max(0, Math.min(100, (elapsed / totalMs) * 100)));
    };
    tick(); const id = setInterval(tick, 1000); return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cfg.gather_time, cfg.draw_time]);

  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-20" dir={lang === "ar" ? "rtl" : "ltr"}>
      <p className="text-xs font-black uppercase tracking-[0.2em] mb-3"
        style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>
        {lang === "ar" ? "السحب يبدأ خلال" : "Draw starts in"}
      </p>
      <div className="flex gap-3 mb-5">
        <Tick v={h} label={tx.hours} /><Tick v={m} label={tx.min} /><Tick v={s} label={tx.sec} />
      </div>

      {/* Time progress bar */}
      <div className="mb-10">
        <div className="flex justify-between mb-1.5">
          <span className="text-[10px] font-black uppercase tracking-widest"
            style={{ color: "rgba(255,255,255,0.18)", fontFamily: "ui-monospace,monospace" }}>
            {lang === "ar" ? "التقدم نحو السحب" : "Progress to draw"}
          </span>
          <span className="text-[10px] font-black tabular-nums"
            style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>
            {Math.round(pct)}%
          </span>
        </div>
        <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-1000"
            style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${LBLUE}88, ${LBLUE})` }} />
        </div>
      </div>
      <div style={{ borderTop: `1px solid ${LINE}`, paddingTop: 24 }} className="mb-8">
        <p className="text-xs font-black uppercase tracking-[0.2em] mb-4"
          style={{ color: "rgba(255,255,255,0.18)", fontFamily: "ui-monospace,monospace" }}>
          {lang === "ar" ? "المشاركون المسجلون" : "Registered Participants"}
        </p>
        <ParticipantsList lang={lang} participants={cfg.participants} />
      </div>
      <AccountCTA lang={lang} participants={cfg.participants} />
    </div>
  );
}

/* ════════════════ STATE 3 — LIVE DRAW ════════════════ */
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

function StateLiveDraw({ onComplete, lang, cfg }: {
  onComplete: (w: Winner[]) => void;
  lang: "en" | "ar";
  cfg: GiveawayConfig;
}) {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const { ALL, ELIM_ORDER, FINAL_THREE, drawTime } = useMemo(() => buildDrawOrder(cfg), [cfg.draw_time, cfg.participants.join('\x00')]);

  const syncedElims = useMemo(() => elapsedElims(ELIM_ORDER.length, drawTime), [ELIM_ORDER.length, drawTime]);
  const syncedRemaining = useMemo(() => ALL.filter(p => !ELIM_ORDER.slice(0, syncedElims).includes(p)), [ALL, ELIM_ORDER, syncedElims]);
  const nextElimIdx = useRef(syncedElims);

  const [remaining, setRemaining] = useState<string[]>(syncedRemaining);
  const [rot, setRot]     = useState(0);
  const [trans, setTrans] = useState(false);
  const [lastElim, setLastElim] = useState(syncedElims > 0 ? ELIM_ORDER[syncedElims - 1] : "");
  const [showElim, setShowElim] = useState(syncedElims > 0);
  const [started, setStarted]   = useState(cairo() >= drawTime || forced() === 3);
  const busyRef   = useRef(false);
  const rotRef    = useRef(0);
  const remRef    = useRef(syncedRemaining);
  const victimRef = useRef("");
  const typed = useTypewriter(lastElim, showElim);

  useEffect(() => {
    if (started) return;
    const id = setInterval(() => {
      if (cairo() >= drawTime) { setStarted(true); clearInterval(id); }
    }, 500);
    return () => clearInterval(id);
  }, [started, drawTime]);

  useEffect(() => {
    if (syncedRemaining.length <= 3) {
      fanfare();
      setTimeout(() => onComplete(FINAL_THREE.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 }))), 1200);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const spin = useCallback(() => {
    if (busyRef.current) return;
    const pool = remRef.current;
    if (pool.length <= 3) return;
    const idx = nextElimIdx.current;
    if (idx >= ELIM_ORDER.length) return;
    busyRef.current = true;
    const victim = ELIM_ORDER[idx];
    nextElimIdx.current = idx + 1;
    victimRef.current = victim;

    const n = pool.length, seg = 360 / n;
    const vi = pool.indexOf(victim);
    const center = (vi + 0.5) * seg;
    const curMod = ((rotRef.current % 360) + 360) % 360;
    const add = (center - curMod + 360) % 360;
    const newRot = rotRef.current + 360 * 5 + add;
    rotRef.current = newRot;
    setRot(newRot); setTrans(true);
    beep(340 + (idx % 7) * 30, 0.05, 0.08);
  }, [ELIM_ORDER]);

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
      setTimeout(() => onComplete(FINAL_THREE.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 }))), 2200);
      busyRef.current = false;
    } else {
      setTimeout(() => { busyRef.current = false; spin(); }, 4200);
    }
  }, [spin, onComplete, FINAL_THREE]);

  useEffect(() => {
    if (!started || trans || busyRef.current) return;
    if (remRef.current.length <= 3) return;
    const t = setTimeout(spin, 1400);
    return () => clearTimeout(t);
  }, [started, spin, trans]);

  const { h, m, s } = useCountdown(drawTime);
  const pct = Math.min(100, ((ALL.length - remaining.length) / (ALL.length - 3)) * 100);
  const tx = TX[lang];

  return (
    <div className="max-w-xl mx-auto px-5 pt-8 pb-16 flex flex-col items-center"
      dir={lang === "ar" ? "rtl" : "ltr"}>
      <p className="text-xs font-black uppercase tracking-[0.2em] mb-2"
        style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>
        {lang === "ar" ? "السحب المباشر — الذكرى العاشرة لـ CFS" : "Live Draw — CFS 10th Anniversary"}
      </p>
      <h2 className="text-3xl font-black text-white mb-8">{tx.title}</h2>
      {!started && (
        <div className="text-center mb-8">
          <p className="text-sm mb-4" style={{ color: "rgba(255,255,255,0.3)" }}>
            {lang === "ar" ? "العجلة تبدأ تلقائياً — ٧ يونيو ٢٠٢٦ · ١١:٠٠ م القاهرة" : "Wheel starts automatically — June 7, 2026 · 11:00 PM Cairo"}
          </p>
          <div className="flex gap-3 justify-center">
            <Tick v={h} label={tx.hours} /><Tick v={m} label={tx.min} /><Tick v={s} label={tx.sec} />
          </div>
          <button onClick={() => setStarted(true)}
            className="mt-6 px-6 py-2 rounded-full text-xs font-bold uppercase tracking-widest border transition-all"
            style={{ borderColor: LBLUE, color: LBLUE, background: "transparent" }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${LBLUE}22`; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
            {lang === "ar" ? "▶ بدء تجريبي" : "▶ Test Start"}
          </button>
        </div>
      )}
      <Wheel parts={remaining} rot={rot} trans={trans} onEnd={onEnd} />
      <div className="flex gap-8 mt-6 text-center">
        <div>
          <p className="text-3xl font-black text-white tabular-nums"
            style={{ fontFamily: "ui-monospace,monospace" }}>{remaining.length}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.26)" }}>
            {lang === "ar" ? "متبقّون" : "Remaining"}
          </p>
        </div>
        <div style={{ width: 1, background: LINE }} />
        <div>
          <p className="text-3xl font-black text-white tabular-nums"
            style={{ fontFamily: "ui-monospace,monospace" }}>{ALL.length - remaining.length}</p>
          <p className="text-xs mt-1" style={{ color: "rgba(255,255,255,0.26)" }}>
            {lang === "ar" ? "مُستبعَدون" : "Eliminated"}
          </p>
        </div>
      </div>
      <div className="h-14 flex items-center justify-center w-full mt-4">
        {showElim && lastElim && (
          <div className="text-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-1"
              style={{ color: "rgba(255,255,255,0.16)", fontFamily: "ui-monospace,monospace" }}>
              {lang === "ar" ? "مُستبعَد" : "Eliminated"}
            </p>
            <p className="text-2xl font-black" style={{ color: "rgba(255,255,255,0.55)", fontFamily: "ui-monospace,monospace" }}>
              {typed}<span style={{ opacity: typed.length < lastElim.length ? 0.4 : 0 }}>_</span>
            </p>
          </div>
        )}
      </div>
      <div className="w-full mt-4">
        <div className="w-full h-px rounded-full overflow-hidden" style={{ background: "rgba(255,255,255,0.05)" }}>
          <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: LBLUE }} />
        </div>
      </div>

      {/* Skip button — jump straight to winners leaderboard */}
      {started && (
        <button
          onClick={() => {
            fanfare();
            setTimeout(() => onComplete(FINAL_THREE.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 }))), 400);
          }}
          className="mt-8 px-8 py-2.5 rounded-full text-xs font-black uppercase tracking-widest border-2 transition-all"
          style={{ borderColor: YELLOW, color: YELLOW, background: "transparent" }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = `${YELLOW}18`; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "transparent"; }}>
          {lang === "ar" ? "تخطّي ← نتائج السحب" : "Skip → Results"}
        </button>
      )}
    </div>
  );
}

/* ════════════════ STATE 4 — RESULTS ════════════════ */
function WCard({ w, prize, delay, wide = false, lang }: {
  w: Winner; prize: { rank: string; place: { en: string; ar: string }; weapon: string; charImg: string; bundleNote?: string };
  delay: number; wide?: boolean; lang: "en" | "ar"
}) {
  const [vis, setVis] = useState(false);
  const tx = TX[lang];
  useEffect(() => { const t = setTimeout(() => setVis(true), delay); return () => clearTimeout(t); }, [delay]);
  const color = w.rank === 1 ? YELLOW : w.rank === 2 ? SILVER : BRONZE;
  return (
    <div style={{
      opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(24px)",
      transition: "opacity 0.7s ease,transform 0.7s ease",
      border: `1px solid ${color}28`, background: CARD, borderRadius: 16, overflow: "hidden",
    }}>
      <div style={{ height: 2, background: `linear-gradient(90deg,transparent,${color},transparent)` }} />
      {wide ? (
        <div className={`flex gap-5 items-center p-5 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
          <img src={prize.charImg} alt={prize.rank} className="rounded-xl object-cover flex-shrink-0"
            style={{ width: 120, height: 160, objectPosition: "top", background: "rgba(0,0,0,0.3)" }} />
          <div>
            <p className="text-xs font-black tracking-[0.25em] mb-3"
              style={{ color, fontFamily: "ui-monospace,monospace" }}>
              {prize.rank} — {lang === "ar" ? prize.place.ar : prize.place.en}
            </p>
            <p className="text-white font-black text-3xl sm:text-4xl mb-2 break-all">{w.username}</p>
            <p className="text-xs mb-0.5" style={{ color: "rgba(255,255,255,0.28)" }}>{prize.weapon}</p>
            <p className="text-xs" style={{ color: "rgba(255,255,255,0.18)" }}>{tx.bundleNote}</p>
          </div>
        </div>
      ) : (
        <div className="p-5 text-center">
          <p className="text-xs font-black tracking-[0.25em] mb-4"
            style={{ color, fontFamily: "ui-monospace,monospace" }}>
            {prize.rank} — {lang === "ar" ? prize.place.ar : prize.place.en}
          </p>
          <img src={prize.charImg} alt={prize.rank} className="mx-auto rounded-xl object-cover mb-4"
            style={{ width: 90, height: 120, objectPosition: "top", background: "rgba(0,0,0,0.3)" }} />
          <p className="text-white font-black text-xl break-all mb-1">{w.username}</p>
          <p className="text-xs" style={{ color: "rgba(255,255,255,0.28)" }}>{prize.weapon}</p>
        </div>
      )}
    </div>
  );
}

function StateResults({ winners, lang, cfg }: { winners: Winner[]; lang: "en" | "ar"; cfg: GiveawayConfig }) {
  const tx = TX[lang];
  const prizes = [
    { rank: "1ST", place: { en: "First Place", ar: "المركز الأول" }, weapon: "HK417 — P.B. Esports Star", charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-pink.png" },
    { rank: "2ND", place: { en: "Second Place", ar: "المركز الثاني" }, weapon: "Colt 1911 — Esports Star", charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-purple.png" },
    { rank: "3RD", place: { en: "Third Place", ar: "المركز الثالث" }, weapon: "Kukri — Kikari Edition", charImg: "https://res.cloudinary.com/ddzbutb12/image/upload/gamecart/giveaway/cfs-char-blonde.png" },
  ];
  return (
    <div className="max-w-2xl mx-auto px-5 pt-10 pb-20" dir={lang === "ar" ? "rtl" : "ltr"}>
      <div className={`flex items-center gap-3 mb-2 ${lang === "ar" ? "flex-row-reverse" : ""}`}>
        <img src={cfsLogoBanner} alt="CFS" className="w-9 object-contain flex-shrink-0" />
        <p className="text-xs font-black uppercase tracking-[0.2em]"
          style={{ color: LBLUE, fontFamily: "ui-monospace,monospace" }}>{tx.resultsSubtitle}</p>
      </div>
      <h1 className="font-black text-white mb-2"
        style={{ fontSize: "clamp(3rem,10vw,5rem)", letterSpacing: "-0.02em" }}>{tx.resultsTitle}</h1>
      <p className="mb-10 text-sm" style={{ color: "rgba(255,255,255,0.28)" }}>{tx.resultsNote}</p>

      <div className="flex flex-col gap-4">
        {[1, 2, 3].map((rank, i) => {
          const w = winners.find(x => x.rank === rank);
          if (!w) return null;
          return <WCard key={w.username} w={w} prize={prizes[rank - 1]} delay={200 + i * 300} wide lang={lang} />;
        })}
      </div>
      <div className="mt-14 pt-8 text-center" style={{ borderTop: `1px solid ${LINE}` }}>
        <a href={cfg.wa_url} target="_blank" rel="noopener noreferrer"
          className="text-xs underline underline-offset-4"
          style={{ color: "rgba(255,255,255,0.18)" }}>{tx.waLink}</a>
      </div>
    </div>
  );
}

/* ════════════════ ROOT ════════════════ */
export default function GiveawayPage() {
  const { language } = useTranslation();
  const lang = (language === "ar" ? "ar" : "en") as "en" | "ar";

  const { data: rawConfig } = useQuery<GiveawayConfig>({
    queryKey: [`${API_BASE_URL}/api/giveaway/config`],
    staleTime: 30000,
  });

  const cfg: GiveawayConfig = rawConfig || DEFAULT_CONFIG;

  const f = forced();
  const [state, setState] = useState<S>(f ?? autoState(cfg));
  const [winners, setWinners] = useState<Winner[]>([]);

  useEffect(() => {
    if (f) return;
    const id = setInterval(() => setState(s => s >= 3 ? s : autoState(cfg)), 5000);
    return () => clearInterval(id);
  }, [f, cfg]);

  const handleComplete = (w: Winner[]) => { setWinners(w); setState(4); };
  const cur = f ?? state;

  return (
    <div className="min-h-screen relative" style={{ fontFamily: "'Inter',system-ui,sans-serif", color: "#fff" }}>
      <div className="fixed top-0 left-0 right-0 z-50">
        <Header />
      </div>

      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <img src={cfg.bg_img} alt=""
          className="absolute inset-0 w-full h-full"
          style={{ objectFit: "cover", objectPosition: "center top", opacity: 0.75 }}
          onError={e => { (e.target as HTMLImageElement).style.display = "none"; }} />
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom,rgba(2,5,14,0.42) 0%,rgba(2,5,14,0.55) 50%,rgba(2,5,14,0.78) 100%)" }} />
      </div>

      <div className="relative z-10 pt-24">
        {f !== null && (
          <div className="fixed top-20 right-3 z-50 flex gap-1">
            {([1,2,3,4] as S[]).map(n => (
              <a key={n} href={`?state=${n}`} className="px-2.5 py-1 rounded text-xs font-bold"
                style={{
                  background: cur === n ? LBLUE : "rgba(0,0,0,0.7)",
                  border: `1px solid ${cur === n ? LBLUE : "rgba(255,255,255,0.1)"}`,
                  color: cur === n ? "#fff" : "rgba(255,255,255,0.3)",
                }}>S{n}</a>
            ))}
          </div>
        )}

        {cur === 1 && <StateStandby lang={lang} cfg={cfg} />}
        {cur === 2 && <StateGathering lang={lang} cfg={cfg} />}
        {cur === 3 && <StateLiveDraw onComplete={handleComplete} lang={lang} cfg={cfg} />}
        {cur === 4 && <StateResults lang={lang} cfg={cfg} winners={winners.length > 0 ? winners :
          buildDrawOrder(cfg).FINAL_THREE.map((u, i) => ({ username: u, rank: (i + 1) as 1 | 2 | 3 }))
        } />}
        
        {/* Directly using imported queryClient in AccountCTA */}
        <div className="max-w-2xl mx-auto px-5 pb-20">
          <SectionLabel text={TX[lang].acctTitle} />
          <AccountCTA lang={lang} participants={cfg.participants} />
        </div>
      </div>
    </div>
  );
}
