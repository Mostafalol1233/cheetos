import { createCanvas } from 'canvas';
import { spawn } from 'child_process';
import { createReadStream } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const W = 1280, H = 720, FPS = 30;

/* ── Colours ── */
const BG       = '#020A1A';
const BLUE     = '#2196F3';
const YELLOW   = '#F9A825';
const SILVER   = '#78909C';
const BRONZE   = '#8D6E63';
const RED_ELIM = '#E53935';
const WHITE    = '#FFFFFF';
const DIM      = 'rgba(255,255,255,0.18)';

/* ── Winners ── */
const WINNERS = [
  { name: 'Trillionaire', place: '1ST PLACE', color: YELLOW,  prize: 'HK417 — P.B. Esports Star'     },
  { name: 'Choklet mH',   place: '2ND PLACE', color: SILVER,  prize: 'Colt 1911 — Esports Star'      },
  { name: 'DarkVenom',    place: '3RD PLACE', color: BRONZE,  prize: 'Kukri — Kikari Edition'         },
];

/* ── Participants ── */
const ALL_NAMES = [
  'GW_Luffy','sky_CTM','WP*Ghost','Trillionaire','Millionaire.','.REVO_','BOOOM','rtBELAL',
  'N4S3R','Mostafa','{M}M!Do™','{NV}~T!GeR~?','5TR.','HM Sh1ro','Kemaro','-HB]MOS1BA.',
  'Xyilo','maddeR','2 Divysho','.Peter','-Aspect','Starco','BigoPew','BillyPew',
  '_ITS]*Judy*_','-Crispy 2','-SW]7amo0o','Azaro','-Francisco','Z3R0','1St_7oda','-K1',
  'JasonStatham','[G]iven]*','-NUL Martin','Ravager. Kda','Naxus','E-L-D-O-D-_-','Haredy',
  '-Ghost?','AlRose','Luxuriouse.','Hamdy.','Murr','drax.','-YourDaddy','.WaZeR.','Al3gamawy',
  '-HB]Shadow','-HB]Dark','Vladimir2011','Choklet mH','DarkVenom',
];

/* ── Timeline (seconds) ── */
const T_INTRO_END    = 4;
const T_COUNT_START  = 4;
const T_COUNT_END    = 14;   // 10 s countdown
const T_R1_START     = 14;
const T_R1_END       = 33;
const T_R2_START     = 33;
const T_R2_END       = 52;
const T_R3_START     = 52;
const T_R3_END       = 71;
const T_FINAL_START  = 71;
const T_TOTAL        = 86;   // total video length

const TOTAL_FRAMES = T_TOTAL * FPS;

/* ── helpers ── */
function lerp(a, b, t) { return a + (b - a) * Math.max(0, Math.min(1, t)); }
function easeOut(t) { return 1 - Math.pow(1 - t, 3); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── draw background ── */
function drawBG(ctx) {
  ctx.fillStyle = BG;
  ctx.fillRect(0, 0, W, H);
  // subtle radial glow centre
  const grad = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, W*0.7);
  grad.addColorStop(0, 'rgba(33,150,243,0.06)');
  grad.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, W, H);
}

/* ── draw grid lines ── */
function drawGrid(ctx) {
  ctx.strokeStyle = 'rgba(33,150,243,0.04)';
  ctx.lineWidth = 1;
  for (let x = 0; x < W; x += 80) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y = 0; y < H; y += 80) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
}

/* ── horizontal rule ── */
function hLine(ctx, y, alpha=0.12) {
  ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(60,y); ctx.lineTo(W-60,y); ctx.stroke();
}

/* ── centered text ── */
function cText(ctx, txt, y, size, color, weight='900', family='monospace') {
  ctx.font = `${weight} ${size}px ${family}`;
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, W/2, y);
}

/* ── glow text ── */
function glowText(ctx, txt, y, size, color, glowRadius=40) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur  = glowRadius;
  cText(ctx, txt, y, size, color);
  ctx.shadowBlur = glowRadius * 0.5;
  cText(ctx, txt, y, size, color);
  ctx.restore();
}

/* ── badge ── */
function badge(ctx, txt, cx, cy, color) {
  ctx.save();
  const pad = 18, h = 36;
  ctx.font = '700 14px monospace';
  const tw = ctx.measureText(txt).width;
  const bw = tw + pad * 2;
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.5;
  ctx.fillStyle = hexA(color, 0.12);
  roundRect(ctx, cx - bw/2, cy - h/2, bw, h, 6);
  ctx.fill(); ctx.stroke();
  ctx.fillStyle = color;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(txt, cx, cy);
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x+r, y);
  ctx.lineTo(x+w-r, y); ctx.arcTo(x+w,y, x+w,y+r, r);
  ctx.lineTo(x+w, y+h-r); ctx.arcTo(x+w,y+h, x+w-r,y+h, r);
  ctx.lineTo(x+r, y+h); ctx.arcTo(x,y+h, x,y+h-r, r);
  ctx.lineTo(x, y+r); ctx.arcTo(x,y, x+r,y, r);
  ctx.closePath();
}

/* ── top bar ── */
function topBar(ctx) {
  ctx.fillStyle = 'rgba(2,10,26,0.92)';
  ctx.fillRect(0, 0, W, 64);
  hLine(ctx, 64, 0.07);
  ctx.font = '700 13px monospace';
  ctx.fillStyle = hexA(BLUE, 0.7);
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('CFS 10TH ANNIVERSARY  ·  GRAND GIVEAWAY  ·  LIVE DRAW', 60, 32);
  ctx.textAlign = 'right';
  ctx.fillStyle = hexA(WHITE, 0.22);
  ctx.fillText('DIAA STORE', W - 60, 32);
}

/* ── bottom bar ── */
function bottomBar(ctx) {
  hLine(ctx, H - 56, 0.07);
  ctx.fillStyle = 'rgba(2,10,26,0.92)';
  ctx.fillRect(0, H - 56, W, 56);
  ctx.font = '700 12px monospace';
  ctx.fillStyle = hexA(WHITE, 0.18);
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Winners contacted via official WhatsApp channel  ·  Results are final', W/2, H - 28);
}

/* ════════════════════════════════════════
   SEGMENT 1 — INTRO
════════════════════════════════════════ */
function renderIntro(ctx, t) {
  // t = 0..4
  const fadeIn  = clamp(t / 1.2, 0, 1);
  const fadeOut = t > 3.0 ? clamp((t - 3.0) / 1.0, 0, 1) : 0;
  const alpha   = easeOut(fadeIn) * (1 - fadeOut);

  ctx.globalAlpha = alpha;
  glowText(ctx, 'CFS 10TH ANNIVERSARY', H/2 - 90, 52, hexA(BLUE, 0.9), 30);
  hLine(ctx, H/2 - 40, 0.15);
  glowText(ctx, 'GRAND GIVEAWAY', H/2 + 10, 110, YELLOW, 60);
  hLine(ctx, H/2 + 70, 0.15);
  cText(ctx, 'LIVE DRAW  ·  JUNE 10, 2026  ·  10 PM CAIRO', H/2 + 110, 22, hexA(WHITE, 0.4), '400');
  ctx.globalAlpha = 1;
}

/* ════════════════════════════════════════
   SEGMENT 2 — COUNTDOWN
════════════════════════════════════════ */
function renderCountdown(ctx, t) {
  // t = 0..10
  const digit  = Math.max(0, 10 - Math.floor(t));
  const frac   = t - Math.floor(t);       // 0..1 within current second
  const pulse  = 1 - frac * 0.25;          // shrinks slightly each tick

  // fade in on first second, fade out on last 0.5s
  const fadeIn  = clamp(t / 0.5, 0, 1);
  const fadeOut = t > 9.5 ? clamp((t - 9.5) / 0.5, 0, 1) : 0;
  const alpha   = easeOut(fadeIn) * (1 - fadeOut);

  ctx.globalAlpha = alpha;

  // ring
  const ringR   = 220 * pulse;
  const ringAlpha = 0.18 + (1-frac)*0.25;
  ctx.save();
  ctx.strokeStyle = hexA(BLUE, ringAlpha);
  ctx.lineWidth   = 3;
  ctx.beginPath();
  ctx.arc(W/2, H/2, ringR, 0, Math.PI*2);
  ctx.stroke();
  // progress arc
  const prog = (10 - digit) / 10;
  ctx.strokeStyle = hexA(BLUE, 0.7);
  ctx.lineWidth   = 6;
  ctx.beginPath();
  ctx.arc(W/2, H/2, ringR, -Math.PI/2, -Math.PI/2 + Math.PI*2*prog);
  ctx.stroke();
  ctx.restore();

  cText(ctx, 'DRAW BEGINS IN', H/2 - 140, 28, hexA(WHITE, 0.4), '700');

  if (digit > 0) {
    glowText(ctx, String(digit), H/2 + 24, 240 * pulse, YELLOW, 80);
  } else {
    glowText(ctx, 'GO!', H/2 + 24, 180, '#4CAF50', 80);
  }

  ctx.globalAlpha = 1;
}

/* ════════════════════════════════════════
   SEGMENT 3 — SPIN ROUND
   t = 0..19  (19 seconds per round)
════════════════════════════════════════ */
function renderSpin(ctx, t, roundIdx) {
  const winner  = WINNERS[roundIdx];
  const round   = roundIdx + 1;

  // Phase 0-1s:  "ROUND N" intro
  // Phase 1-10s: fast spin of names
  // Phase 10-14s: slow down + stop on winner
  // Phase 14-19s: winner reveal

  const SPIN_START = 1, SPIN_FAST_END = 10, SPIN_SLOW_END = 14, REVEAL_END = 19;

  // ── "ROUND N" flash ──
  if (t < SPIN_START) {
    const a = easeOut(clamp(t / 0.5, 0, 1)) * (1 - clamp((t - 0.7) / 0.3, 0, 1));
    ctx.globalAlpha = a;
    cText(ctx, `ROUND  ${round}`, H/2, 88, hexA(WHITE, 0.9), '900');
    ctx.globalAlpha = 1;
    return;
  }

  // ── SPINNING NAMES ──
  if (t < SPIN_SLOW_END) {
    const spinT = t - SPIN_START;
    const spinDur = SPIN_SLOW_END - SPIN_START;

    // speed: fast → slow
    let speed;
    if (t < SPIN_FAST_END) {
      speed = 18; // names per second
    } else {
      const prog = (t - SPIN_FAST_END) / (SPIN_SLOW_END - SPIN_FAST_END);
      speed = lerp(18, 0.5, easeOut(prog));
    }

    // current name index (floats through list)
    const spinPos   = spinT * speed;
    const nameIdx   = Math.floor(spinPos) % ALL_NAMES.length;
    const prevIdx   = (nameIdx - 1 + ALL_NAMES.length) % ALL_NAMES.length;
    const nextIdx   = (nameIdx + 1) % ALL_NAMES.length;
    const fraction  = spinPos % 1;

    // at the very end of spin, lock to winner
    const winnerName = winner.name;
    let displayName, prevName, nextName;
    if (t > SPIN_SLOW_END - 0.8) {
      displayName = winnerName;
      prevName    = ALL_NAMES[(ALL_NAMES.indexOf(winnerName) - 1 + ALL_NAMES.length) % ALL_NAMES.length];
      nextName    = ALL_NAMES[(ALL_NAMES.indexOf(winnerName) + 1) % ALL_NAMES.length];
    } else {
      displayName = ALL_NAMES[nameIdx];
      prevName    = ALL_NAMES[prevIdx];
      nextName    = ALL_NAMES[nextIdx];
    }

    const alpha = clamp((t - SPIN_START) / 0.4, 0, 1);
    ctx.globalAlpha = alpha;

    // pill background
    ctx.save();
    ctx.fillStyle = 'rgba(33,150,243,0.06)';
    ctx.strokeStyle = hexA(BLUE, 0.15);
    ctx.lineWidth = 1;
    roundRect(ctx, W/2 - 500, H/2 - 60, 1000, 120, 12);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    // prev / next names (dim, above/below)
    const scrollY = fraction * 80;
    cText(ctx, prevName, H/2 - 50 - scrollY, 32, hexA(WHITE, 0.18), '700');
    cText(ctx, nextName, H/2 + 50 - scrollY + 80, 32, hexA(WHITE, 0.18), '700');

    // main name
    const mainAlpha = t > SPIN_FAST_END ? lerp(0.7, 1, easeOut((t-SPIN_FAST_END)/(SPIN_SLOW_END-SPIN_FAST_END))) : 0.7;
    cText(ctx, displayName, H/2 + 4 - scrollY, 72, hexA(WHITE, mainAlpha), '900');

    // round label
    cText(ctx, `ROUND ${round}  —  ${ALL_NAMES.length} PARTICIPANTS`, H/2 - 180, 18, hexA(BLUE, 0.55), '700');

    // speed indicator bar
    const barW = 600 * (speed / 18);
    ctx.fillStyle = hexA(BLUE, 0.3);
    ctx.fillRect(W/2 - 300, H/2 + 110, 600, 4);
    ctx.fillStyle = BLUE;
    ctx.fillRect(W/2 - 300, H/2 + 110, barW, 4);

    ctx.globalAlpha = 1;
    return;
  }

  // ── WINNER REVEAL ──
  const revT  = t - SPIN_SLOW_END;
  const revDur = REVEAL_END - SPIN_SLOW_END;

  // flash on reveal
  if (revT < 0.3) {
    ctx.fillStyle = hexA(winner.color, 0.18 * (1 - revT/0.3));
    ctx.fillRect(0, 0, W, H);
  }

  const fadeIn = easeOut(clamp(revT / 0.8, 0, 1));

  ctx.globalAlpha = fadeIn;

  // glow backdrop
  const glow = ctx.createRadialGradient(W/2, H/2, 0, W/2, H/2, 500);
  glow.addColorStop(0, hexA(winner.color, 0.12));
  glow.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // place badge
  badge(ctx, winner.place, W/2, H/2 - 175, winner.color);

  // winner name — big
  ctx.save();
  ctx.shadowColor = winner.color;
  ctx.shadowBlur  = 60;
  cText(ctx, winner.name, H/2 - 60, 128, WHITE, '900');
  ctx.shadowBlur = 30;
  cText(ctx, winner.name, H/2 - 60, 128, WHITE, '900');
  ctx.restore();

  // prize
  hLine(ctx, H/2 + 30, 0.08);
  cText(ctx, winner.prize, H/2 + 68, 28, hexA(winner.color, 0.8), '700');
  cText(ctx, 'Battle Pass E-Sports · Full Bundle', H/2 + 108, 18, hexA(WHITE, 0.28), '400');

  // round label
  cText(ctx, `ROUND ${round} WINNER`, H/2 - 232, 15, hexA(winner.color, 0.6), '700');

  // animated horizontal glow line below name
  const lineAlpha = 0.4 + Math.sin(revT * 3) * 0.15;
  ctx.strokeStyle = hexA(winner.color, lineAlpha);
  ctx.lineWidth = 2;
  ctx.shadowColor = winner.color;
  ctx.shadowBlur  = 16;
  ctx.beginPath();
  ctx.moveTo(W/2 - 320, H/2 + 30);
  ctx.lineTo(W/2 + 320, H/2 + 30);
  ctx.stroke();
  ctx.shadowBlur = 0;

  ctx.globalAlpha = 1;
}

/* ════════════════════════════════════════
   SEGMENT 4 — FINAL WINNERS BOARD
════════════════════════════════════════ */
function renderFinal(ctx, t) {
  // t = 0..15
  const fadeIn = easeOut(clamp(t / 1.5, 0, 1));
  ctx.globalAlpha = fadeIn;

  // title
  glowText(ctx, 'CONGRATULATIONS', 120, 58, YELLOW, 40);
  cText(ctx, 'CFS 10TH ANNIVERSARY  ·  GRAND GIVEAWAY  ·  RESULTS', 168, 18, hexA(WHITE, 0.3), '400');

  hLine(ctx, 200, 0.1);

  // cards
  const cards = [
    { w: WINNERS[0], x: W/2, y: H/2 - 60,  delay: 0.2,  big: true  },
    { w: WINNERS[1], x: W/2 - 370, y: H/2 + 260, delay: 0.6,  big: false },
    { w: WINNERS[2], x: W/2 + 370, y: H/2 + 260, delay: 0.9,  big: false },
  ];

  for (const card of cards) {
    const ca = easeOut(clamp((t - card.delay) / 0.7, 0, 1));
    if (ca <= 0) continue;

    ctx.save();
    ctx.globalAlpha = fadeIn * ca;

    const cw = card.big ? 800 : 580;
    const ch = card.big ? 180 : 160;
    const cx = card.x - cw/2;
    const cy = card.y - ch/2;

    // card bg
    ctx.fillStyle = hexA(card.w.color, 0.07);
    ctx.strokeStyle = hexA(card.w.color, 0.35);
    ctx.lineWidth = 1.5;
    roundRect(ctx, cx, cy, cw, ch, 14);
    ctx.fill(); ctx.stroke();

    // top glow line
    ctx.fillStyle = card.w.color;
    ctx.fillRect(cx + 20, cy, cw - 40, 2);

    // place badge
    const rankNum = card.w === WINNERS[0] ? 'I' : card.w === WINNERS[1] ? 'II' : 'III';
    ctx.save();
    ctx.shadowColor = card.w.color;
    ctx.shadowBlur  = 16;
    ctx.strokeStyle = card.w.color;
    ctx.lineWidth = 2;
    ctx.fillStyle = hexA(card.w.color, 0.1);
    ctx.beginPath();
    ctx.arc(cx + 60, cy + ch/2, 28, 0, Math.PI*2);
    ctx.fill(); ctx.stroke();
    ctx.restore();

    ctx.font = '900 18px monospace';
    ctx.fillStyle = card.w.color;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(rankNum, cx + 60, cy + ch/2);

    // place label
    const fs = card.big ? 14 : 12;
    ctx.font = `700 ${fs}px monospace`;
    ctx.fillStyle = card.w.color;
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(card.w.place, cx + 104, cy + 28);

    // winner name
    const ns = card.big ? 56 : 42;
    ctx.save();
    ctx.shadowColor = card.w.color;
    ctx.shadowBlur  = 24;
    ctx.font        = `900 ${ns}px monospace`;
    ctx.fillStyle   = WHITE;
    ctx.textAlign   = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText(card.w.name, cx + 104, cy + 52);
    ctx.restore();

    // prize
    ctx.font = `400 14px monospace`;
    ctx.fillStyle = hexA(WHITE, 0.35);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'bottom';
    ctx.fillText(card.w.prize, cx + 104, cy + ch - 20);

    ctx.restore();
  }

  // footer note
  const noteA = clamp((t - 2.5) / 1.5, 0, 1) * fadeIn;
  ctx.globalAlpha = noteA;
  cText(ctx, 'Winners will be contacted via the official WhatsApp channel within 48 hours', H - 80, 16, hexA(WHITE, 0.22), '400');

  ctx.globalAlpha = 1;
}

/* ════════════════════════════════════════
   MAIN RENDER LOOP
════════════════════════════════════════ */
function renderFrame(ctx, frame) {
  const t = frame / FPS;

  drawBG(ctx);
  drawGrid(ctx);

  if (t < T_INTRO_END) {
    renderIntro(ctx, t);
  } else if (t < T_COUNT_END) {
    renderCountdown(ctx, t - T_COUNT_START);
  } else if (t < T_R1_END) {
    renderSpin(ctx, t - T_R1_START, 0);
  } else if (t < T_R2_END) {
    renderSpin(ctx, t - T_R2_START, 1);
  } else if (t < T_R3_END) {
    renderSpin(ctx, t - T_R3_START, 2);
  } else {
    renderFinal(ctx, t - T_FINAL_START);
  }

  topBar(ctx);
  bottomBar(ctx);
}

/* ════════════════════════════════════════
   FFMPEG PIPELINE
════════════════════════════════════════ */
async function main() {
  const outPath = path.join(__dirname, 'giveaway-draw.mp4');

  const audioFile = path.join(__dirname, 'client', 'public', 'sounds', 'countdown.mp3');
  const audioDelay = T_COUNT_START * 1000; // ms delay before audio starts

  console.log(`🎬  Rendering ${TOTAL_FRAMES} frames at ${W}×${H} ${FPS}fps`);
  console.log(`⏱  Total duration: ${T_TOTAL}s`);
  console.log(`📁  Output: ${outPath}`);

  const ffmpeg = spawn('ffmpeg', [
    '-y',
    // raw video input from stdin
    '-f',    'rawvideo',
    '-pix_fmt', 'rgba',
    '-s',    `${W}x${H}`,
    '-r',    String(FPS),
    '-i',    'pipe:0',
    // audio with delay
    '-itsoffset', String(T_COUNT_START),
    '-stream_loop', '-1',
    '-i',    audioFile,
    '-filter_complex',
    `[1:a]atrim=start=0:end=${T_COUNT_END - T_COUNT_START + 0.5},apad=whole_dur=${T_TOTAL}[a]`,
    '-map', '0:v',
    '-map', '[a]',
    '-c:v',   'libx264',
    '-preset','fast',
    '-crf',   '20',
    '-pix_fmt','yuv420p',
    '-c:a',   'aac',
    '-b:a',   '192k',
    '-t',     String(T_TOTAL),
    outPath,
  ], { stdio: ['pipe', 'inherit', 'inherit'] });

  const canvas = createCanvas(W, H);
  const ctx    = canvas.getContext('2d');

  let framesDone = 0;

  function writeFrame() {
    while (framesDone < TOTAL_FRAMES) {
      renderFrame(ctx, framesDone);
      const buf = ctx.getImageData(0, 0, W, H).data;
      const ok  = ffmpeg.stdin.write(Buffer.from(buf.buffer));
      framesDone++;

      if (framesDone % (FPS * 5) === 0) {
        const pct = ((framesDone / TOTAL_FRAMES) * 100).toFixed(1);
        process.stdout.write(`  Progress: ${pct}% (${framesDone}/${TOTAL_FRAMES})\r`);
      }

      if (!ok) {
        // back-pressure — wait for drain
        ffmpeg.stdin.once('drain', writeFrame);
        return;
      }
    }
    console.log('\n✅  All frames written, finalising video...');
    ffmpeg.stdin.end();
  }

  ffmpeg.stdin.on('error', () => {});

  ffmpeg.on('close', code => {
    if (code === 0) {
      console.log(`\n🎉  Done! Video saved to: ${outPath}`);
    } else {
      console.error(`\n❌  ffmpeg exited with code ${code}`);
      process.exit(1);
    }
  });

  writeFrame();
}

main().catch(err => { console.error(err); process.exit(1); });
