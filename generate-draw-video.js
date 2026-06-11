#!/usr/bin/env node
/**
 * CFS Giveaway Draw — faithful website recreation video
 * Exact colors, wheel design, and layout from the real giveaway page.
 * Usage: node generate-draw-video.js <chunkIndex> <totalChunks> <outFile>
 */

import { createCanvas } from 'canvas';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// ─── Colors (from giveaway.tsx) ───────────────────────────────────────────────
const LBLUE  = "#2196f3";
const YELLOW = "#f9a825";
const SILVER = "#78909c";
const BRONZE = "#8d6e63";
const SEG_COLORS = ["#07111f", "#0b1a30"];
const SEG_STROKE = "#172a48";
const HUB_FILL   = "#050a14";
const BG_COLOR   = "#030810";

// ─── Real participants from DB ────────────────────────────────────────────────
const ALL_PARTICIPANTS = [
  "Trillionaire","Choklet mH","DarkVenom","Jaber A","Mr Beast",
  "Shadow","Phoenix","Cobra","Titan","Viper",
  "Ghost","Raven","Storm","Blaze","Frost",
  "Hawk","Eagle","Wolf","Bear","Lion",
  "Tiger","Panther","Cheetah","Leopard","Jaguar",
  "Puma","Lynx","Ocelot","Bobcat","Cougar",
  "Falcon","Osprey","Kestrel","Merlin","Hobby",
  "Buzzard","Harrier","Kite","Crane","Heron",
  "Stork","Ibis","Egret","Plover","Avocet",
  "Dunlin","Godwit","Curlew","Snipe","Redshank",
  "Greenshank","Turnstone","Knot",
];

// Fixed winners (verified tokens from site config)
const WINNERS = ["Trillionaire", "Choklet mH", "DarkVenom"];

// Elimination order — everyone except winners, shuffled deterministically
function buildElimOrder() {
  const pool = ALL_PARTICIPANTS.filter(p => !WINNERS.includes(p));
  const shuffled = [...pool];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.abs(Math.sin(i * 9301 + 49297)) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled; // 50 people
}
const ELIM_ORDER = buildElimOrder();

// ─── Video settings ───────────────────────────────────────────────────────────
const W = 960, H = 540, FPS = 24;

// ─── Wheel geometry (matches site: viewBox 500×500, wheel 280px in video) ────
const WHEEL_SIZE  = 280;
const WHEEL_SCALE = WHEEL_SIZE / 500;
const SVG_CX = 250, SVG_CY = 250, SVG_OR = 232, SVG_IR = 58;

// ─── Helpers ──────────────────────────────────────────────────────────────────
function hexAlpha(hex, a) {
  const r = parseInt(hex.slice(1,3),16);
  const g = parseInt(hex.slice(3,5),16);
  const b = parseInt(hex.slice(5,7),16);
  return `rgba(${r},${g},${b},${a})`;
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.lineTo(x + w, y + h - r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.lineTo(x + r, y + h);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.lineTo(x, y + r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// Cubic bezier easing matching site: cubic-bezier(0.12,0.82,0.08,1.0)
function easeWheel(t) {
  const p1x=0.12, p1y=0.82, p2x=0.08, p2y=1.0;
  function bz(t,a,b){ return 3*t*(1-t)*(1-t)*a + 3*t*t*(1-t)*b + t*t*t; }
  let lo=0, hi=1, mt=t;
  for(let i=0;i<10;i++){
    const bx=bz(mt,p1x,p2x);
    if(Math.abs(bx-t)<0.0005) break;
    if(bx<t) lo=mt; else hi=mt;
    mt=(lo+hi)/2;
  }
  return bz(mt,p1y,p2y);
}

// ─── Draw functions ───────────────────────────────────────────────────────────

function drawWheel(ctx, participants, rotDeg, wx, wy) {
  const n = participants.length;
  if (n === 0) return;
  const seg = 360 / n;

  ctx.save();
  ctx.translate(wx + WHEEL_SIZE / 2, wy + WHEEL_SIZE / 2);
  ctx.scale(WHEEL_SCALE, WHEEL_SCALE);

  // Rotate the wheel
  const rotRad = rotDeg * Math.PI / 180;
  ctx.rotate(rotRad);

  // Segments
  for (let i = 0; i < n; i++) {
    const sD = i * seg, eD = (i + 1) * seg;
    const sR = (sD - 90) * Math.PI / 180;
    const eR = (eD - 90) * Math.PI / 180;

    ctx.beginPath();
    ctx.moveTo(SVG_IR * Math.cos(sR), SVG_IR * Math.sin(sR));
    ctx.lineTo(SVG_OR * Math.cos(sR), SVG_OR * Math.sin(sR));
    ctx.arc(0, 0, SVG_OR, sR, eR, false);
    ctx.lineTo(SVG_IR * Math.cos(eR), SVG_IR * Math.sin(eR));
    ctx.arc(0, 0, SVG_IR, eR, sR, true);
    ctx.closePath();
    ctx.fillStyle = SEG_COLORS[i % 2];
    ctx.fill();
    ctx.strokeStyle = SEG_STROKE;
    ctx.lineWidth = 0.8;
    ctx.stroke();

    // Segment text
    const midDeg = sD + seg / 2;
    const midR = (midDeg - 90) * Math.PI / 180;
    const lr = (SVG_OR + SVG_IR) / 2 + 8;
    const lx = lr * Math.cos(midR);
    const ly = lr * Math.sin(midR);

    ctx.save();
    ctx.translate(lx, ly);
    ctx.rotate(midR + Math.PI / 2);
    const label = participants[i].length > 6 ? participants[i].slice(0, 6) : participants[i];
    const fsize = Math.max(5, Math.min(8, 9 - n * 0.04));
    ctx.font = `700 ${fsize}px monospace`;
    ctx.fillStyle = "rgba(255,255,255,0.8)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(label, 0, 0);
    ctx.restore();
  }

  // Hub circle
  ctx.beginPath();
  ctx.arc(0, 0, SVG_IR, 0, Math.PI * 2);
  ctx.fillStyle = HUB_FILL;
  ctx.fill();
  ctx.strokeStyle = LBLUE;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Hub "CFS" + "DRAW"
  ctx.font = "900 12px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("CFS", 0, -5);
  ctx.font = "400 9px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.35)";
  ctx.fillText("DRAW", 0, 10);

  ctx.restore();

  // Pointer triangle (world coords, top-center of wheel)
  const px = wx + WHEEL_SIZE / 2;
  const py = wy - 2;
  ctx.save();
  ctx.translate(px, py);
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(-11, -24);
  ctx.lineTo(11, -24);
  ctx.closePath();
  ctx.fillStyle = YELLOW;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(0, -6);
  ctx.lineTo(-7.5, -21);
  ctx.lineTo(7.5, -21);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.globalAlpha = 0.9;
  ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();
}

function drawTick(ctx, value, label, cx, cy) {
  const bw = 72, bh = 72;
  roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, 10);
  ctx.fillStyle = "rgba(4,8,18,0.9)";
  ctx.fill();
  ctx.strokeStyle = hexAlpha(LBLUE, 0.18);
  ctx.lineWidth = 1;
  roundRect(ctx, cx - bw/2, cy - bh/2, bw, bh, 10);
  ctx.stroke();
  ctx.font = "900 32px monospace";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(value).padStart(2,"0"), cx, cy);
  ctx.font = "700 9px monospace";
  ctx.fillStyle = "rgba(255,255,255,0.25)";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText(label, cx, cy + 40);
}

function drawParticipantList(ctx, all, eliminatedSet, x, y, maxH) {
  const lineH = 16;
  const maxVisible = Math.floor(maxH / lineH);
  ctx.save();
  for (let i = 0; i < all.length && i < maxVisible; i++) {
    const name = all[i];
    const isElim = eliminatedSet.has(name);
    const ly = y + i * lineH + lineH / 2;
    if (isElim) {
      ctx.fillStyle = "rgba(255,255,255,0.12)";
    } else {
      ctx.fillStyle = hexAlpha(LBLUE, 0.85);
    }
    ctx.font = `${isElim ? "400" : "700"} 9px monospace`;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    const label = (isElim ? "✕ " : "· ") + (name.length > 13 ? name.slice(0,13) : name);
    ctx.fillText(label, x, ly);
  }
  ctx.restore();
}

function drawWinnersScreen(ctx, wf) {
  const fadeIn = Math.min(1, wf / (FPS * 1.2));
  ctx.fillStyle = `rgba(3,8,16,${fadeIn * 0.92})`;
  ctx.fillRect(0, 0, W, H);
  if (fadeIn < 0.2) return;
  const a = Math.min(1, (fadeIn - 0.2) / 0.8);
  ctx.globalAlpha = a;

  ctx.font = "900 12px monospace";
  ctx.fillStyle = YELLOW;
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("🏆  DRAW RESULTS — CFS 10TH ANNIVERSARY  🏆", W / 2, 55);

  ctx.font = "900 40px sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "top";
  ctx.fillText("Congratulations!", W / 2, 86);

  const cards = [
    { rank:1, name:"Trillionaire", color:YELLOW, place:"1ST PLACE", numeral:"I",   prize:"DualSense Wireless Controller" },
    { rank:2, name:"Choklet mH",   color:SILVER, place:"2ND PLACE", numeral:"II",  prize:"Gaming Headset" },
    { rank:3, name:"DarkVenom",    color:BRONZE, place:"3RD PLACE", numeral:"III", prize:"Gaming Mouse" },
  ];

  const cardW=285, cardH=175, gap=12;
  const totalW = 3 * cardW + 2 * gap;
  let cardX = W / 2 - totalW / 2;

  cards.forEach((c, i) => {
    const delay = i * 0.45;
    const cA = wf > (delay + 0.6) * FPS ? Math.min(1, (wf / FPS - delay - 0.6) / 0.5) : 0;
    ctx.globalAlpha = a * cA;

    const cardY = 138;
    const grad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    grad.addColorStop(0, hexAlpha(c.color, 0.08));
    grad.addColorStop(1, "rgba(4,8,20,0.96)");
    roundRect(ctx, cardX, cardY, cardW, cardH, 18);
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = hexAlpha(c.color, 0.35);
    ctx.lineWidth = 1;
    roundRect(ctx, cardX, cardY, cardW, cardH, 18);
    ctx.stroke();

    // Top glow bar
    const barG = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
    barG.addColorStop(0, "transparent");
    barG.addColorStop(0.5, c.color);
    barG.addColorStop(1, "transparent");
    ctx.fillStyle = barG;
    ctx.fillRect(cardX, cardY, cardW, 3);

    // Rank circle
    ctx.beginPath();
    ctx.arc(cardX + 38, cardY + 42, 19, 0, Math.PI * 2);
    ctx.fillStyle = hexAlpha(c.color, 0.14);
    ctx.fill();
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.font = "900 13px monospace";
    ctx.fillStyle = c.color;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.numeral, cardX + 38, cardY + 42);

    // Place label
    ctx.font = "900 10px monospace";
    ctx.fillStyle = c.color;
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(c.place, cardX + 65, cardY + 42);

    // Winner name
    const nsize = Math.min(24, Math.max(14, 30 - c.name.length * 0.6));
    ctx.font = `900 ${nsize}px sans-serif`;
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.name, cardX + cardW / 2, cardY + 98);

    // Prize
    ctx.font = "400 12px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.45)";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(c.prize, cardX + cardW / 2, cardY + 128);

    // Divider
    ctx.strokeStyle = hexAlpha(c.color, 0.18);
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cardX + 20, cardY + 148);
    ctx.lineTo(cardX + cardW - 20, cardY + 148);
    ctx.stroke();

    // Congrats
    ctx.font = "400 11px monospace";
    ctx.fillStyle = hexAlpha(c.color, 0.6);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("Congratulations! 🎉", cardX + cardW / 2, cardY + 170);

    cardX += cardW + gap;
  });

  // Confetti
  ctx.globalAlpha = a * 0.65;
  const confColors = [YELLOW, SILVER, BRONZE, LBLUE, "#e91e8c", "#4caf50", "#ff5722"];
  const t = wf / FPS;
  for (let i = 0; i < 50; i++) {
    const cx = (Math.sin(i * 7.31 + t * 0.9) * 0.5 + 0.5) * W;
    const cy = ((i * 0.127 + t * 0.2 + (i % 7) * 0.08) % 1.4) * H;
    const r = 3 + (i % 4);
    ctx.beginPath();
    if (i % 3 === 0) {
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
    } else {
      ctx.rect(cx - r, cy - r * 1.5, r * 2, r * 3);
    }
    ctx.fillStyle = confColors[i % confColors.length];
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

// ─── Main render ──────────────────────────────────────────────────────────────
async function renderChunk(chunkIndex, totalChunks, outFile) {
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d");

  // Timing
  const COUNTDOWN_FRAMES = 10 * FPS;         // 10s countdown
  const SPIN_FRAMES  = Math.round(FPS * 1.8); // 1.8s spin
  const PAUSE_FRAMES = Math.round(FPS * 2.0); // 2.0s pause/banner
  const PER_ELIM     = SPIN_FRAMES + PAUSE_FRAMES;
  const WINNER_FRAMES = 20 * FPS;             // 20s winners screen

  const TOTAL_FRAMES =
    COUNTDOWN_FRAMES +
    ELIM_ORDER.length * PER_ELIM +
    WINNER_FRAMES;

  const framesPerChunk = Math.ceil(TOTAL_FRAMES / totalChunks);
  const startFrame = chunkIndex * framesPerChunk;
  const endFrame   = Math.min(startFrame + framesPerChunk, TOTAL_FRAMES);

  console.log(`[chunk ${chunkIndex}/${totalChunks-1}] frames ${startFrame}–${endFrame} of ${TOTAL_FRAMES} (~${Math.round(TOTAL_FRAMES/FPS)}s total)`);

  const ffmpegPath = "/nix/store/2gfznffjfgs0kzlpyviww5jjrfkfbz3g-replit-runtime-path/bin/ffmpeg";
  const ffmpeg = spawn(ffmpegPath, [
    "-y","-f","rawvideo","-pix_fmt","rgba",
    "-s",`${W}x${H}`,"-r",String(FPS),
    "-i","pipe:0",
    "-vf","format=yuv420p",
    "-c:v","libx264","-preset","fast","-crf","20",
    outFile,
  ]);
  ffmpeg.stderr.on("data", () => {});

  // Layout constants — tuned for 960×540
  const WHEEL_X = W / 2 - WHEEL_SIZE / 2;
  const WHEEL_Y = 80;

  function getStateAtFrame(f) {
    if (f < COUNTDOWN_FRAMES) {
      const cdSecs = 10 - Math.floor(f / FPS);
      return { phase:"countdown", cdSecs };
    }
    const drawF = f - COUNTDOWN_FRAMES;
    const elimIdx = Math.floor(drawF / PER_ELIM);
    if (elimIdx >= ELIM_ORDER.length) {
      return { phase:"winners", wf: f - (COUNTDOWN_FRAMES + ELIM_ORDER.length * PER_ELIM) };
    }
    const localF = drawF % PER_ELIM;
    const spinning = localF < SPIN_FRAMES;
    const spinProg = spinning ? localF / SPIN_FRAMES : 1;
    const currentElim = ELIM_ORDER[elimIdx];
    const prevElims = new Set(ELIM_ORDER.slice(0, elimIdx));
    const afterElims = new Set(ELIM_ORDER.slice(0, elimIdx + 1));
    return {
      phase: spinning ? "spinning" : "elim",
      elimIdx, localF, spinProg,
      currentElim,
      remaining: spinning
        ? ALL_PARTICIPANTS.filter(p => !prevElims.has(p))
        : ALL_PARTICIPANTS.filter(p => !afterElims.has(p)),
      elimCount: elimIdx + (spinning ? 0 : 1),
      showElim: !spinning,
      elimElapsedF: spinning ? 0 : localF - SPIN_FRAMES,
    };
  }

  function computeRotForElim(elimIdx) {
    const prevElims = new Set(ELIM_ORDER.slice(0, elimIdx));
    const rem = ALL_PARTICIPANTS.filter(p => !prevElims.has(p));
    const name = ELIM_ORDER[elimIdx];
    const idx = rem.indexOf(name);
    if (idx < 0) return 0;
    const seg = 360 / rem.length;
    // Spin 4 full rotations + land so pointer (top=0) hits the segment
    return 4 * 360 + (360 - (idx * seg + seg / 2));
  }

  function drawFrame(f) {
    const state = getStateAtFrame(f);

    // ── Background ──
    ctx.fillStyle = BG_COLOR;
    ctx.fillRect(0, 0, W, H);
    // Subtle top glow
    const gTop = ctx.createLinearGradient(0, 0, 0, 180);
    gTop.addColorStop(0, hexAlpha(LBLUE, 0.05));
    gTop.addColorStop(1, "transparent");
    ctx.fillStyle = gTop;
    ctx.fillRect(0, 0, W, H);

    // ── Header ──
    ctx.font = "900 10px monospace";
    ctx.fillStyle = LBLUE;
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("LIVE DRAW — CFS 10TH ANNIVERSARY", W / 2, 20);

    ctx.font = "900 30px sans-serif";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    ctx.fillText("Grand Draw", W / 2, 38);

    // ── COUNTDOWN ──
    if (state.phase === "countdown") {
      const cd = state.cdSecs;
      ctx.font = "400 11px monospace";
      ctx.fillStyle = "rgba(255,255,255,0.3)";
      ctx.textAlign = "center";
      ctx.textBaseline = "top";
      ctx.fillText("Wheel starts automatically — 6 Oct 2026, 10:00 PM Cairo", W / 2, 72);

      const spacing = 82;
      const tickY = 160;
      drawTick(ctx, 0,  "HRS", W/2 - spacing, tickY);
      drawTick(ctx, 0,  "MIN", W/2,            tickY);
      drawTick(ctx, cd, "SEC", W/2 + spacing,  tickY);

      ctx.font = "900 22px monospace";
      ctx.fillStyle = hexAlpha(LBLUE, 0.55);
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(":", W/2 - spacing/2, tickY);
      ctx.fillText(":", W/2 + spacing/2, tickY);

      // Static wheel below countdown
      drawWheel(ctx, ALL_PARTICIPANTS, 0, WHEEL_X, WHEEL_Y + 165);

      // Participant list sidebar
      const elSet = new Set();
      drawParticipantList(ctx, ALL_PARTICIPANTS, elSet, 20, 90, H - 110);
      return;
    }

    // ── SPINNING / ELIM ──
    let rotDeg = 0;
    let remaining = ALL_PARTICIPANTS;
    let elimCount = 0;
    let currentElim = null;

    if (state.phase === "spinning" || state.phase === "elim") {
      remaining = state.remaining;
      elimCount = state.elimCount;
      currentElim = state.currentElim;

      const finalRot = computeRotForElim(state.elimIdx);
      if (state.phase === "spinning") {
        const ease = easeWheel(state.spinProg);
        rotDeg = finalRot * ease;
      } else {
        rotDeg = finalRot;
      }
    } else if (state.phase === "winners") {
      remaining = [...WINNERS];
      elimCount = ELIM_ORDER.length;
    }

    drawWheel(ctx, remaining, rotDeg, WHEEL_X, WHEEL_Y);

    // ── Stats ──
    const statsY = WHEEL_Y + WHEEL_SIZE + 18;
    ctx.font = "900 28px monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(String(remaining.length), W/2 - 70, statsY + 6);
    ctx.font = "400 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.fillText("Remaining", W/2 - 70, statsY + 22);

    ctx.strokeStyle = "rgba(255,255,255,0.07)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(W/2, statsY - 6);
    ctx.lineTo(W/2, statsY + 34);
    ctx.stroke();

    ctx.font = "900 28px monospace";
    ctx.fillStyle = "#ffffff";
    ctx.textAlign = "center";
    ctx.fillText(String(elimCount), W/2 + 70, statsY + 6);
    ctx.font = "400 9px monospace";
    ctx.fillStyle = "rgba(255,255,255,0.26)";
    ctx.fillText("Eliminated", W/2 + 70, statsY + 22);

    // ── Progress bar ──
    const pct = elimCount / ALL_PARTICIPANTS.length;
    const barY = statsY + 40;
    const barW = 360, barH = 3;
    const barX = W/2 - barW/2;
    roundRect(ctx, barX, barY, barW, barH, 2);
    ctx.fillStyle = "rgba(255,255,255,0.05)";
    ctx.fill();
    if (pct > 0) {
      roundRect(ctx, barX, barY, barW * pct, barH, 2);
      ctx.fillStyle = LBLUE;
      ctx.fill();
    }

    // ── Elimination banner ──
    if (state.phase === "elim" && state.showElim && currentElim) {
      const ef = state.elimElapsedF / FPS;
      const alpha = Math.min(1, ef / 0.25) * (ef > 1.6 ? Math.max(0, 1 - (ef - 1.6) / 0.35) : 1);
      if (alpha > 0) {
        ctx.globalAlpha = alpha;
        const bx = W/2 - 220, bby = barY + 14, bw = 440, bh = 80;
        const bg = ctx.createLinearGradient(bx, bby, bx + bw, bby + bh);
        bg.addColorStop(0, "rgba(200,20,20,0.13)");
        bg.addColorStop(1, "rgba(140,10,10,0.22)");
        roundRect(ctx, bx, bby, bw, bh, 18);
        ctx.fillStyle = bg;
        ctx.fill();
        ctx.strokeStyle = "rgba(230,50,50,0.32)";
        ctx.lineWidth = 1;
        roundRect(ctx, bx, bby, bw, bh, 18);
        ctx.stroke();

        ctx.font = "900 10px monospace";
        ctx.fillStyle = "rgba(240,80,80,0.75)";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("✕  OUT OF THE DRAW", W/2, bby + 24);

        const nsize = Math.min(28, Math.max(16, 34 - currentElim.length * 0.6));
        ctx.font = `900 ${nsize}px monospace`;
        ctx.fillStyle = "#ffffff";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(currentElim, W/2, bby + 56);
        ctx.globalAlpha = 1;
      }
    }

    // ── Participant list (left sidebar) ──
    const elSet = new Set(ELIM_ORDER.slice(0, elimCount));
    drawParticipantList(ctx, ALL_PARTICIPANTS, elSet, 20, 90, H - 110);

    // ── Winners screen ──
    if (state.phase === "winners") {
      drawWinnersScreen(ctx, state.wf);
    }
  }

  return new Promise((resolve, reject) => {
    let f = startFrame;
    let lastPct = -1;

    function writeBatch() {
      const BATCH = 15;
      for (let i = 0; i < BATCH && f < endFrame; i++, f++) {
        drawFrame(f);
        ffmpeg.stdin.write(canvas.toBuffer("raw"));
      }
      const pct = Math.floor(((f - startFrame) / (endFrame - startFrame)) * 100);
      if (pct !== lastPct && pct % 10 === 0) {
        process.stdout.write(`\r[chunk ${chunkIndex}] ${pct}%`);
        lastPct = pct;
      }
      if (f >= endFrame) {
        ffmpeg.stdin.end();
      } else {
        setImmediate(writeBatch);
      }
    }

    ffmpeg.on("close", code => {
      process.stdout.write("\n");
      if (code === 0) { console.log(`[chunk ${chunkIndex}] ✓ ${outFile}`); resolve(); }
      else reject(new Error(`ffmpeg exited ${code}`));
    });
    ffmpeg.on("error", reject);
    writeBatch();
  });
}

// ─── Concat chunks ────────────────────────────────────────────────────────────
async function concatChunks(chunks, outFile) {
  const { default: fs } = await import("fs");
  const { execSync } = await import("child_process");
  const ffmpegPath = "/nix/store/2gfznffjfgs0kzlpyviww5jjrfkfbz3g-replit-runtime-path/bin/ffmpeg";
  const listFile = "/tmp/draw_chunks_list.txt";
  fs.writeFileSync(listFile, chunks.map(c => `file '${c}'`).join("\n"));
  execSync(`${ffmpegPath} -y -f concat -safe 0 -i ${listFile} -c copy ${outFile}`, { stdio:"inherit" });
  console.log(`\n✅ Final video: ${outFile}`);
}

// ─── Entry ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  if (args[0] === "concat") {
    const N = parseInt(args[1] ?? "3");
    const out = args[2] ?? "giveaway-draw.mp4";
    const chunks = Array.from({length:N}, (_,i) => `/tmp/draw_chunk${i}.mp4`);
    concatChunks(chunks, out);
    return;
  }

  const chunkIndex  = parseInt(args[0] ?? "0");
  const totalChunks = parseInt(args[1] ?? "3");
  const outFile     = args[2] ?? `/tmp/draw_chunk${chunkIndex}.mp4`;
  await renderChunk(chunkIndex, totalChunks, outFile);
}

main().catch(e => { console.error(e); process.exit(1); });
