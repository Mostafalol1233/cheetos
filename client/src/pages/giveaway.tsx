import { useState, useEffect, useRef, useCallback } from "react";
import { useUserAuth } from "@/lib/user-auth-context";
import { Link } from "wouter";

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
const DRAW_TIME    = new Date("2025-10-10T22:00:00+03:00");
const GATHER_TIME  = new Date("2025-10-10T21:30:00+03:00");
const WA_URL       = "https://www.whatsapp.com/channel/0029Vb6jrI44yltQQfvkg41o";
const YT_URL       = "https://www.youtube.com/@Bemora-site/videos";

/* ─── Colors ─── */
const RED    = "#9f1239";
const GOLD   = "#b45309";
const SILVER = "#475569";
const BRONZE = "#92400e";
const LINE   = "rgba(255,255,255,0.06)";

/* ─── Characters per rank ─── */
const CHARS = [
  { img: "/images/cfs-char-pink.png",   label: "Team Goddess · Pink" },
  { img: "/images/cfs-char-purple.png", label: "Team Goddess · Blue" },
  { img: "/images/cfs-char-blonde.png", label: "Team Goddess · Blonde" },
];
const WEAPONS = [
  "HK417-P.B. Esports Star",
  "Colt 1911-Esports Star",
  "CheyTac M200-Dominator Esports",
];

/* ─── Time ─── */
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
  return { d: Math.floor(ms/86400000), h: Math.floor((ms%86400000)/3600000),
           m: Math.floor((ms%3600000)/60000), s: Math.floor((ms%60000)/1000) };
}

/* ─── Audio ─── */
let _ctx: AudioContext | null = null;
function getCtx() {
  if (!_ctx) try { _ctx = new (window.AudioContext||(window as any).webkitAudioContext)(); } catch {}
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
function fanfare() { [[523,0],[659,130],[784,260],[1047,400]].forEach(([f,t])=>setTimeout(()=>beep(f,0.7,0.18),t)); }

/* ─── SVG Wheel ─── */
const CX=250,CY=250,OR=232,IR=58;
function pol(r:number,deg:number){const rad=((deg-90)*Math.PI)/180;return{x:CX+r*Math.cos(rad),y:CY+r*Math.sin(rad)};}
function arcPath(s:number,e:number){
  const a=pol(OR,s),b=pol(OR,e),c=pol(IR,e),d=pol(IR,s),lg=e-s>180?1:0;
  return `M${a.x} ${a.y} A${OR} ${OR} 0 ${lg} 1 ${b.x} ${b.y} L${c.x} ${c.y} A${IR} ${IR} 0 ${lg} 0 ${d.x} ${d.y}Z`;
}

function Wheel({parts,rot,trans,onEnd}:{parts:string[];rot:number;trans:boolean;onEnd:()=>void}){
  const ref=useRef<SVGGElement>(null);
  useEffect(()=>{
    const el=ref.current;if(!el)return;
    el.addEventListener("transitionend",onEnd);
    return()=>el.removeEventListener("transitionend",onEnd);
  },[onEnd]);
  const n=parts.length,seg=360/n;
  return(
    <div style={{position:"relative",width:320,height:320}}>
      <svg width="28" height="32" viewBox="0 0 28 32"
        style={{position:"absolute",top:-4,left:"50%",transform:"translateX(-50%)",zIndex:10}}>
        <polygon points="14,32 0,0 28,0" fill={RED}/>
        <polygon points="14,25 5,5 23,5" fill="#fff" opacity="0.9"/>
      </svg>
      <svg viewBox="0 0 500 500" width="320" height="320">
        <g ref={ref} style={{transform:`rotate(${rot}deg)`,transformOrigin:`${CX}px ${CY}px`,
          transition:trans?"transform 4.6s cubic-bezier(0.12,0.82,0.08,1.0)":"none"}}>
          {parts.map((name,i)=>{
            const s=i*seg,e=(i+1)*seg,mid=s+seg/2,lp=pol((OR+IR)/2+8,mid);
            return(
              <g key={name+i}>
                <path d={arcPath(s,e)} fill={["#0c1526","#111f3a"][i%2]} stroke="#1e3a5f" strokeWidth="0.8"/>
                <text x={lp.x} y={lp.y} fontSize={Math.max(5,Math.min(8,9-n*0.04))}
                  fontFamily="ui-monospace,monospace" fontWeight="700" fill="rgba(255,255,255,0.85)"
                  textAnchor="middle" dominantBaseline="middle"
                  transform={`rotate(${mid-90},${lp.x},${lp.y})`}>
                  {name.length>6?name.slice(0,6):name}
                </text>
              </g>
            );
          })}
        </g>
        <circle cx={CX} cy={CY} r={IR} fill="#060608" stroke={RED} strokeWidth="2"/>
        <text x={CX} y={CY-5} textAnchor="middle" fontSize="12" fontWeight="900"
          fontFamily="ui-monospace,monospace" fill="#fff">CFS</text>
        <text x={CX} y={CY+10} textAnchor="middle" fontSize="9"
          fontFamily="ui-monospace,monospace" fill="rgba(255,255,255,0.4)">DRAW</text>
      </svg>
    </div>
  );
}

/* ─── Countdown box ─── */
function Tick({v,label}:{v:number;label:string}){
  return(
    <div className="flex flex-col items-center gap-2">
      <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center rounded-lg"
        style={{background:"rgba(0,0,0,0.55)",border:`1px solid ${LINE}`,backdropFilter:"blur(4px)"}}>
        <span className="text-3xl sm:text-4xl font-black text-white tabular-nums"
          style={{fontFamily:"ui-monospace,monospace"}}>{String(v).padStart(2,"0")}</span>
      </div>
      <span className="text-xs uppercase tracking-widest" style={{color:"rgba(255,255,255,0.3)"}}>{label}</span>
    </div>
  );
}

/* ─── Inline auth ─── */
function InlineAuth(){
  const {isAuthenticated,user,login,register,logout}=useUserAuth();
  const [tab,setTab]=useState<"login"|"reg">("login");
  const [name,setName]=useState(""),  [email,setEmail]=useState(""), [pw,setPw]=useState("");
  const [loading,setLoading]=useState(false), [err,setErr]=useState("");
  const inp="w-full px-4 py-3 rounded-lg text-white text-sm outline-none placeholder-white/25 transition-colors";
  const inpS={background:"rgba(0,0,0,0.4)",border:`1px solid ${LINE}`};

  if(isAuthenticated&&user){
    return(
      <div className="rounded-xl p-5" style={{background:"rgba(0,0,0,0.4)",border:`1px solid ${LINE}`}}>
        <p className="text-white/40 text-xs uppercase tracking-widest mb-1">Signed in as</p>
        <p className="text-white font-bold text-lg">{user.name}</p>
        <button onClick={logout} className="mt-3 text-xs text-white/25 hover:text-white/50 transition-colors underline underline-offset-4">Sign out</button>
      </div>
    );
  }

  async function submit(e:React.FormEvent){
    e.preventDefault();setLoading(true);setErr("");
    try{ tab==="login"?await login(email,pw):await register({name,email,password:pw}); }
    catch(ex:any){setErr(ex?.message||"حدث خطأ");}
    finally{setLoading(false);}
  }

  return(
    <div className="rounded-xl p-5" style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${LINE}`}}>
      <p className="text-white font-semibold mb-4 text-sm">
        {tab==="login"?"سجل دخولك عشان تتابع السحب":"إنشاء حساب جديد"}
      </p>
      <div className="flex gap-4 mb-4">
        {(["login","reg"] as const).map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className="text-xs font-semibold pb-1 border-b-2 transition-colors"
            style={{borderColor:tab===t?RED:"transparent",color:tab===t?"#fff":"rgba(255,255,255,0.3)"}}>
            {t==="login"?"تسجيل الدخول":"إنشاء حساب"}
          </button>
        ))}
      </div>
      <form onSubmit={submit} className="flex flex-col gap-3">
        {tab==="reg"&&<input value={name} onChange={e=>setName(e.target.value)} placeholder="الاسم" className={inp} style={inpS} required/>}
        <input value={email} onChange={e=>setEmail(e.target.value)} type="email" placeholder="البريد الإلكتروني" className={inp} style={inpS} required/>
        <input value={pw} onChange={e=>setPw(e.target.value)} type="password" placeholder="كلمة المرور" className={inp} style={inpS} required/>
        {err&&<p className="text-red-400 text-xs">{err}</p>}
        <button type="submit" disabled={loading}
          className="w-full py-3 rounded-lg text-white text-sm font-bold transition-all disabled:opacity-50"
          style={{background:RED}}>
          {loading?"...":tab==="login"?"دخول":"إنشاء حساب"}
        </button>
      </form>
    </div>
  );
}

/* ═══════════════ STATE 1 — STANDBY ═══════════════ */
function StateStandby(){
  const {d,h,m,s}=useCountdown(DRAW_TIME);
  const videoRef=useRef<HTMLVideoElement>(null);
  useEffect(()=>{videoRef.current?.play().catch(()=>{});},[]);

  return(
    <div dir="rtl">
      {/* ── Header banner ── */}
      <img src="/images/cfs-header.png" alt="CFS Esports" className="w-full block object-cover"
        style={{maxHeight:90,objectPosition:"center"}}/>

      {/* ── Hero title ── */}
      <div className="max-w-2xl mx-auto px-5 pt-12 pb-4">
        <p className="text-xs uppercase tracking-[0.4em] mb-3" style={{color:"rgba(255,255,255,0.35)",fontFamily:"ui-monospace,monospace"}}>
          CFS 10TH ANNIVERSARY · GRAND GIVEAWAY
        </p>
        <h1 className="font-black text-white leading-none mb-1" style={{fontSize:"clamp(3rem,10vw,6rem)"}}>
          الذكرى<br/>العاشرة
        </h1>
        <p className="text-white/35 text-lg font-medium mb-10">السحب الكبير — Lucky Draw</p>

        {/* ── Video ── */}
        <div className="rounded-xl overflow-hidden mb-10" style={{border:`1px solid ${LINE}`}}>
          <video ref={videoRef} src="/media/cfs-event.mp4" loop muted playsInline
            className="w-full block" style={{maxHeight:240,objectFit:"cover",background:"#000"}}/>
        </div>

        {/* ── Countdown ── */}
        <p className="text-xs uppercase tracking-widest mb-4" style={{color:"rgba(255,255,255,0.25)"}}>
          السحب يبدأ تلقائياً يوم 10 أكتوبر الساعة 10 مساءً
        </p>
        <div className="flex gap-4 mb-14">
          <Tick v={d} label="Days"/>
          <Tick v={h} label="Hours"/>
          <Tick v={m} label="Min"/>
          <Tick v={s} label="Sec"/>
        </div>

        {/* ── Conditions ── */}
        <div className="mb-14" style={{borderTop:`1px solid ${LINE}`,paddingTop:32}}>
          <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{color:"rgba(255,255,255,0.3)",fontFamily:"ui-monospace,monospace"}}>
            شروط المسابقة
          </p>
          <div className="flex flex-col gap-4">
            {/* Step 1 */}
            <div className="flex gap-4 items-start rounded-xl p-4"
              style={{background:"rgba(0,0,0,0.45)",border:`1px solid ${LINE}`}}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{background:RED,color:"#fff"}}>1</span>
              <div>
                <p className="text-white font-bold text-sm">سجل بريدك الإلكتروني في الموقع</p>
                <p className="text-white/40 text-xs mt-1">إنشاء حساب مجاني في متجر ضياء</p>
                <Link href="/register">
                  <span className="inline-block mt-2 text-xs font-semibold underline underline-offset-4"
                    style={{color:RED}}>إنشاء حساب الآن</span>
                </Link>
              </div>
            </div>
            {/* Step 2 */}
            <div className="flex gap-4 items-start rounded-xl p-4"
              style={{background:"rgba(0,0,0,0.45)",border:`1px solid ${LINE}`}}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{background:RED,color:"#fff"}}>2</span>
              <div>
                <p className="text-white font-bold text-sm">اكتب اسمك في قناة الواتساب عشان نسجلك</p>
                <p className="text-white/40 text-xs mt-1">الاشتراك في القناة شرط أساسي للمشاركة</p>
                <a href={WA_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs font-semibold underline underline-offset-4"
                  style={{color:RED}}>فتح قناة الواتساب</a>
              </div>
            </div>
            {/* Step 3 */}
            <div className="flex gap-4 items-start rounded-xl p-4"
              style={{background:"rgba(0,0,0,0.3)",border:`1px solid rgba(255,255,255,0.04)`}}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)"}}>3</span>
              <div>
                <p className="text-white/60 font-bold text-sm">
                  اشحن واشتري من CrossFire
                  <span className="mr-2 text-xs font-normal px-1.5 py-0.5 rounded"
                    style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)"}}>اختياري</span>
                </p>
                <p className="text-white/30 text-xs mt-1">كل شراء يزيد نسبة حظك في الفوز</p>
                <Link href="/game/crossfire">
                  <span className="inline-block mt-2 text-xs text-white/25 underline underline-offset-4">
                    صفحة CrossFire
                  </span>
                </Link>
              </div>
            </div>
            {/* Step 4 */}
            <div className="flex gap-4 items-start rounded-xl p-4"
              style={{background:"rgba(0,0,0,0.3)",border:`1px solid rgba(255,255,255,0.04)`}}>
              <span className="shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black"
                style={{background:"rgba(255,255,255,0.08)",color:"rgba(255,255,255,0.4)"}}>4</span>
              <div>
                <p className="text-white/60 font-bold text-sm">
                  دعم عبر يوتيوب
                  <span className="mr-2 text-xs font-normal px-1.5 py-0.5 rounded"
                    style={{background:"rgba(255,255,255,0.06)",color:"rgba(255,255,255,0.35)"}}>اختياري</span>
                </p>
                <p className="text-white/30 text-xs mt-1">مش هتتقل عليك، سواء اشتراك أو أي دعم</p>
                <a href={YT_URL} target="_blank" rel="noopener noreferrer"
                  className="inline-block mt-2 text-xs text-white/25 underline underline-offset-4">
                  قناة يوتيوب
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ── Prizes ── */}
        <div className="mb-14" style={{borderTop:`1px solid ${LINE}`,paddingTop:32}}>
          <p className="text-xs uppercase tracking-[0.3em] mb-6" style={{color:"rgba(255,255,255,0.3)",fontFamily:"ui-monospace,monospace"}}>
            الجوائز · Prizes
          </p>
          <p className="text-white font-black text-2xl mb-2">Battle Pass E-Sports الكامل</p>
          <p className="text-white/35 text-sm mb-8">حزمة البطولة الكاملة بكل ما تحتويه</p>

          <div className="grid grid-cols-3 gap-3">
            {CHARS.map((c,i)=>{
              const rankColor=[GOLD,SILVER,BRONZE][i];
              const rankLabel=["المركز الأول","المركز الثاني","المركز الثالث"][i];
              return(
                <div key={i} className="rounded-xl overflow-hidden flex flex-col items-center"
                  style={{background:"rgba(0,0,0,0.45)",border:`1px solid ${rankColor}22`}}>
                  <div className="h-0.5 w-full" style={{background:`linear-gradient(90deg,transparent,${rankColor},transparent)`}}/>
                  <p className="text-xs font-bold pt-3 pb-2 text-center tracking-wider"
                    style={{color:rankColor,fontFamily:"ui-monospace,monospace"}}>
                    {["1ST","2ND","3RD"][i]}
                  </p>
                  <img src={c.img} alt={rankLabel}
                    className="w-full object-cover" style={{aspectRatio:"3/4",objectPosition:"top"}}/>
                  <div className="px-2 pb-3 pt-2 text-center">
                    <p className="text-white/60 text-xs leading-snug">{WEAPONS[i]}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Auth ── */}
        <div className="mb-14" style={{borderTop:`1px solid ${LINE}`,paddingTop:32}}>
          <p className="text-xs uppercase tracking-[0.3em] mb-5" style={{color:"rgba(255,255,255,0.3)",fontFamily:"ui-monospace,monospace"}}>
            حسابك
          </p>
          <InlineAuth/>
        </div>

        {/* ── Participants count ── */}
        <div className="mb-10 text-center">
          <p className="text-xs text-white/20">{ALL.length} participants registered</p>
        </div>

        {/* ── WhatsApp subtle ── */}
        <div className="text-center pb-4">
          <a href={WA_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs underline underline-offset-4 transition-colors"
            style={{color:"rgba(255,255,255,0.15)"}}>
            القناة الرسمية على واتساب
          </a>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 2 — GATHERING ═══════════════ */
function StateGathering(){
  const {h,m,s}=useCountdown(DRAW_TIME);
  const [q,setQ]=useState("");
  return(
    <div dir="rtl">
      <img src="/images/cfs-header.png" alt="CFS Esports" className="w-full block object-cover"
        style={{maxHeight:90,filter:"brightness(0.75)"}}/>
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <p className="text-xs uppercase tracking-widest mb-3" style={{color:"rgba(255,255,255,0.25)"}}>السحب يبدأ خلال</p>
        <div className="flex gap-3 mb-10"><Tick v={h} label="Hours"/><Tick v={m} label="Min"/><Tick v={s} label="Sec"/></div>
        <div style={{borderTop:`1px solid ${LINE}`,paddingTop:28}} className="mb-8">
          <p className="text-xs uppercase tracking-widest mb-4" style={{color:"rgba(255,255,255,0.25)"}}>
            {ALL.length} Participants
          </p>
          <input value={q} onChange={e=>setQ(e.target.value)} placeholder="ابحث عن اسمك..."
            className="w-full px-4 py-3 rounded-lg text-white text-sm outline-none placeholder-white/20 mb-4"
            style={{background:"rgba(0,0,0,0.5)",border:`1px solid ${LINE}`}}/>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-1.5 max-h-60 overflow-y-auto"
            style={{scrollbarWidth:"thin",scrollbarColor:`${RED}33 transparent`}}>
            {ALL.filter(p=>!q||p.toLowerCase().includes(q.toLowerCase())).map(p=>{
              const hit=q&&p.toLowerCase().includes(q.toLowerCase());
              return(
                <div key={p} className="px-2 py-1.5 rounded text-xs text-center truncate transition-all"
                  style={{background:hit?`${RED}15`:"rgba(0,0,0,0.4)",border:`1px solid ${hit?RED+"44":LINE}`,
                    color:hit?"#fff":"rgba(255,255,255,0.35)",fontWeight:hit?700:400}}>
                  {p}
                </div>
              );
            })}
          </div>
        </div>
        <InlineAuth/>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 3 — LIVE DRAW ═══════════════ */
interface Winner{username:string;rank:1|2|3}

function useTypewriter(text:string,go:boolean){
  const [shown,setShown]=useState("");
  useEffect(()=>{
    if(!go||!text){setShown("");return;}
    setShown("");let i=0;
    const id=setInterval(()=>{i++;setShown(text.slice(0,i));if(i>=text.length)clearInterval(id);},60);
    return()=>clearInterval(id);
  },[text,go]);
  return shown;
}

function StateLiveDraw({onComplete}:{onComplete:(w:Winner[])=>void}){
  const [remaining,setRemaining]=useState<string[]>(ALL);
  const [rot,setRot]=useState(0);
  const [trans,setTrans]=useState(false);
  const [lastElim,setLastElim]=useState("");
  const [showElim,setShowElim]=useState(false);
  const [started,setStarted]=useState(false);
  const busyRef=useRef(false);
  const rotRef=useRef(0);
  const remRef=useRef(ALL);
  const victimRef=useRef("");

  const typed=useTypewriter(lastElim,showElim);

  useEffect(()=>{
    const id=setInterval(()=>{if(cairo()>=DRAW_TIME){setStarted(true);clearInterval(id);}},1000);
    if(forced()===3)setStarted(true);
    return()=>clearInterval(id);
  },[]);

  const spin=useCallback(()=>{
    if(busyRef.current)return;
    const pool=remRef.current;
    if(pool.length<=3)return;
    busyRef.current=true;
    const vi=Math.floor(Math.random()*pool.length);
    victimRef.current=pool[vi];
    const n=pool.length,seg=360/n;
    const center=(vi+0.5)*seg;
    const curMod=rotRef.current%360;
    const add=(center-curMod+360)%360;
    const spins=5+Math.floor(Math.random()*2);
    const newRot=rotRef.current+360*spins+add;
    rotRef.current=newRot;
    setRot(newRot);
    setTrans(true);
    beep(350+Math.random()*150,0.05,0.08);
  },[]);

  const onEnd=useCallback(()=>{
    setTrans(false);
    const v=victimRef.current;
    const nr=remRef.current.filter(p=>p!==v);
    remRef.current=nr;
    setRemaining(nr);
    setLastElim(v);
    setShowElim(false);
    setTimeout(()=>setShowElim(true),80);
    beep(280,0.3,0.15);
    if(nr.length<=3){
      fanfare();
      setTimeout(()=>onComplete(nr.map((u,i)=>({username:u,rank:(i+1)as 1|2|3}))),2200);
      busyRef.current=false;
    }else{
      setTimeout(()=>{busyRef.current=false;spin();},4200);
    }
  },[spin,onComplete]);

  useEffect(()=>{
    if(!started||trans||busyRef.current)return;
    const t=setTimeout(spin,1800);
    return()=>clearTimeout(t);
  },[started,spin,trans]);

  const {h,m,s}=useCountdown(DRAW_TIME);
  const pct=Math.min(100,((ALL.length-remaining.length)/(ALL.length-3))*100);

  return(
    <div dir="rtl">
      <img src="/images/cfs-header.png" alt="CFS Esports" className="w-full block object-cover"
        style={{maxHeight:80,filter:"brightness(0.6)"}}/>
      <div className="max-w-xl mx-auto px-5 pt-8 pb-16 flex flex-col items-center">
        <p className="text-xs uppercase tracking-widest mb-2" style={{color:"rgba(255,255,255,0.25)",fontFamily:"ui-monospace,monospace"}}>Live Draw · العجلة الحية</p>
        <h2 className="text-3xl font-black text-white mb-8">الذكرى العاشرة</h2>

        {!started&&(
          <div className="text-center mb-8">
            <p className="text-white/35 text-sm mb-4">العجلة تبدأ تلقائياً الساعة ١٠ مساءً</p>
            <div className="flex gap-3 justify-center"><Tick v={h} label="Hours"/><Tick v={m} label="Min"/><Tick v={s} label="Sec"/></div>
          </div>
        )}

        <Wheel parts={remaining} rot={rot} trans={trans} onEnd={onEnd}/>

        <div className="flex gap-8 mt-6 text-center">
          <div>
            <p className="text-3xl font-black text-white tabular-nums" style={{fontFamily:"ui-monospace,monospace"}}>{remaining.length}</p>
            <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.25)"}}>Remaining</p>
          </div>
          <div style={{width:1,background:LINE}}/>
          <div>
            <p className="text-3xl font-black text-white tabular-nums" style={{fontFamily:"ui-monospace,monospace"}}>{ALL.length-remaining.length}</p>
            <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.25)"}}>Eliminated</p>
          </div>
        </div>

        <div className="h-14 flex items-center justify-center w-full mt-4">
          {showElim&&lastElim&&(
            <div className="text-center">
              <p className="text-xs uppercase tracking-widest mb-1" style={{color:"rgba(255,255,255,0.2)",fontFamily:"ui-monospace,monospace"}}>Eliminated</p>
              <p className="text-2xl font-black" style={{color:"rgba(255,255,255,0.65)",fontFamily:"ui-monospace,monospace"}}>
                {typed}<span style={{opacity:typed.length<lastElim.length?0.4:0}}>_</span>
              </p>
            </div>
          )}
        </div>

        <div className="w-full mt-4">
          <div className="w-full h-px rounded-full overflow-hidden" style={{background:"rgba(255,255,255,0.06)"}}>
            <div className="h-full rounded-full transition-all duration-500" style={{width:`${pct}%`,background:RED}}/>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════ STATE 4 — RESULTS ═══════════════ */
function StateResults({winners}:{winners:Winner[]}){
  return(
    <div dir="rtl">
      <img src="/images/cfs-header.png" alt="CFS Esports" className="w-full block object-cover"
        style={{maxHeight:90,filter:"brightness(0.55)"}}/>
      <div className="max-w-2xl mx-auto px-5 pt-10 pb-20">
        <p className="text-xs uppercase tracking-[0.35em] mb-2" style={{color:"rgba(255,255,255,0.25)"}}>CFS 10TH ANNIVERSARY · RESULTS</p>
        <h1 className="font-black text-white mb-10" style={{fontSize:"clamp(3rem,10vw,5rem)"}}>الفائزون</h1>

        {/* 1st — full width */}
        {winners.filter(w=>w.rank===1).map(w=>{
          const c=CHARS[0];
          return(
            <WCard key={w.username} w={w} char={c} color={GOLD} rankEn="1ST PLACE" rankAr="المركز الأول" weapon={WEAPONS[0]} delay={200} wide/>
          );
        })}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
          {winners.filter(w=>w.rank!==1).map((w,i)=>{
            const c=CHARS[w.rank-1];
            const col=[SILVER,BRONZE][i];
            const rE=["2ND PLACE","3RD PLACE"][i];
            const rA=["المركز الثاني","المركز الثالث"][i];
            return <WCard key={w.username} w={w} char={c} color={col} rankEn={rE} rankAr={rA} weapon={WEAPONS[w.rank-1]} delay={500+i*300}/>;
          })}
        </div>

        <div className="mt-14 pt-8 text-center" style={{borderTop:`1px solid ${LINE}`}}>
          <a href={WA_URL} target="_blank" rel="noopener noreferrer"
            className="text-xs underline underline-offset-4 transition-colors"
            style={{color:"rgba(255,255,255,0.2)"}}>
            القناة الرسمية على واتساب للتفاصيل
          </a>
        </div>
      </div>
    </div>
  );
}

function WCard({w,char,color,rankEn,rankAr,weapon,delay,wide=false}:{
  w:Winner;char:{img:string;label:string};color:string;rankEn:string;rankAr:string;weapon:string;delay:number;wide?:boolean;
}){
  const [vis,setVis]=useState(false);
  useEffect(()=>{const t=setTimeout(()=>setVis(true),delay);return()=>clearTimeout(t);},[delay]);
  return(
    <div style={{opacity:vis?1:0,transform:vis?"translateY(0)":"translateY(28px)",
      transition:"opacity 0.7s ease,transform 0.7s ease",
      border:`1px solid ${color}33`,background:"rgba(0,0,0,0.55)",borderRadius:16,overflow:"hidden"}}>
      <div style={{height:2,background:`linear-gradient(90deg,transparent,${color},transparent)`}}/>
      {wide?(
        <div className="flex gap-5 items-center p-5">
          <img src={char.img} alt={rankAr} className="rounded-xl object-cover flex-shrink-0"
            style={{width:120,height:160,objectPosition:"top",background:"rgba(0,0,0,0.3)"}}/>
          <div>
            <p className="text-xs font-bold tracking-[0.25em] mb-3" style={{color,fontFamily:"ui-monospace,monospace"}}>{rankEn} · {rankAr}</p>
            <p className="text-white font-black text-3xl sm:text-4xl mb-2 break-all">{w.username}</p>
            <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{weapon}</p>
            <p className="text-xs mt-1" style={{color:"rgba(255,255,255,0.2)"}}>Battle Pass E-Sports الكامل</p>
          </div>
        </div>
      ):(
        <div className="p-5 text-center">
          <p className="text-xs font-bold tracking-[0.25em] mb-4" style={{color,fontFamily:"ui-monospace,monospace"}}>{rankEn} · {rankAr}</p>
          <img src={char.img} alt={rankAr} className="mx-auto rounded-xl object-cover mb-4"
            style={{width:90,height:120,objectPosition:"top",background:"rgba(0,0,0,0.3)"}}/>
          <p className="text-white font-black text-xl break-all mb-1">{w.username}</p>
          <p className="text-xs" style={{color:"rgba(255,255,255,0.3)"}}>{weapon}</p>
        </div>
      )}
    </div>
  );
}

/* ═══════════════ ROOT ═══════════════ */
export default function GiveawayPage(){
  const f=forced();
  const [state,setState]=useState<S>(f??auto());
  const [winners,setWinners]=useState<Winner[]>([]);

  useEffect(()=>{
    if(f)return;
    const id=setInterval(()=>setState(s=>s>=3?s:auto()),5000);
    return()=>clearInterval(id);
  },[f]);

  const handleComplete=(w:Winner[])=>{setWinners(w);setState(4);};
  const cur=f??state;

  return(
    <div className="min-h-screen relative"
      style={{
        background:"#060608",
        fontFamily:"'Inter',system-ui,sans-serif",
        color:"#fff",
      }}>
      {/* Full page background */}
      <div className="fixed inset-0 z-0 pointer-events-none" aria-hidden>
        <img src="/images/cfs-bg-map.png" alt="" className="w-full h-full object-cover opacity-10"
          style={{objectPosition:"center top"}}/>
        <div className="absolute inset-0" style={{background:"linear-gradient(to bottom,rgba(6,6,8,0.6) 0%,rgba(6,6,8,0.85) 50%,#060608 100%)"}}/>
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Dev nav */}
        {f!==null&&(
          <div className="fixed top-3 right-3 z-50 flex gap-1">
            {([1,2,3,4] as S[]).map(n=>(
              <a key={n} href={`?state=${n}`}
                className="px-2.5 py-1 rounded text-xs font-bold"
                style={{background:cur===n?RED:"rgba(0,0,0,0.6)",border:`1px solid ${cur===n?RED:"rgba(255,255,255,0.08)"}`,
                  color:cur===n?"#fff":"rgba(255,255,255,0.3)"}}>
                S{n}
              </a>
            ))}
          </div>
        )}

        {cur===1&&<StateStandby/>}
        {cur===2&&<StateGathering/>}
        {cur===3&&<StateLiveDraw onComplete={handleComplete}/>}
        {cur===4&&<StateResults winners={winners.length>0?winners:[
          {username:"Winner 1",rank:1},
          {username:"Winner 2",rank:2},
          {username:"Winner 3",rank:3},
        ]}/>}
      </div>
    </div>
  );
}
