import { createCanvas, loadImage } from 'canvas';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/* ─── Resolution & FPS ─── */
const W = 1280, H = 720, FPS = 24;

/* ─── Colours (clean, professional, no neon) ─── */
const C = {
  bg:        '#08101E',
  bgPanel:   '#111F33',
  seg1:      '#1A3154',
  seg2:      '#102340',
  segBorder: '#243D5A',
  gold:      '#C8A030',
  goldDark:  '#7A6018',
  white:     '#F0F0F0',
  silver:    '#A8B4C0',
  red:       '#8B1A1A',
  redBright: '#C0392B',
  pointer:   '#C8A030',
  rankGold:  '#FFD700',
  rankSilver:'#C0C0C0',
  rankBronze:'#CD7F32',
};

/* ─── Participants ─── */
const ALL_PARTICIPANTS = [
  'GW_Luffy','sky_CTM','WP*Ghost','Trillionaire','Millionaire.','.REVO_','BOOOM',
  'rtBELAL','N4S3R','Mostafa','{M}M!Do','{NV}~T!GeR~?','5TR.','HM Sh1ro','Kemaro',
  '-HB]MOS1BA.','Xyilo','maddeR','2 Divysho','.Peter','-Aspect','Starco','BigoPew',
  'BillyPew','_ITS]*Judy*_','-Crispy 2','-SW]7amo0o','Azaro','-Francisco','Z3R0',
  '1St_7oda','-K1','JasonStatham','[G]iven]*','-NUL Martin','Ravager. Kda','Naxus',
  'E-L-D-O-D-_-','Haredy','-Ghost?','AlRose','Luxuriouse.','Hamdy.','Murr','drax.',
  '-YourDaddy','.WaZeR.','Al3gamawy','-HB]Shadow','-HB]Dark','Vladimir2011',
  'Choklet mH','DarkVenom',
];

const FINAL_THREE = ['Trillionaire','Choklet mH','DarkVenom'];
const PRIZES = [
  { place:'1ST', name:'HK417 P.B. Esports Star',  color: C.rankGold   },
  { place:'2ND', name:'Colt 1911 Esports Star',   color: C.rankSilver },
  { place:'3RD', name:'Kukri Kikari Edition',      color: C.rankBronze },
];

/* ─── Mulberry32 RNG (identical to live draw) ─── */
function mulberry32(seed) {
  let s = seed | 0;
  return () => {
    s = (s + 0x6D2B79F5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ─── Elimination order ─── */
function buildElimOrder() {
  const drawTime = new Date('2026-06-10T22:00:00+03:00');
  const rng = mulberry32(Math.floor(drawTime.getTime() / 1000));
  const pool = ALL_PARTICIPANTS.filter(
    p => !FINAL_THREE.some(f => f.toLowerCase() === p.toLowerCase())
  );
  const order = [];
  while (pool.length > 0) {
    const idx = Math.floor(rng() * pool.length);
    order.push(pool[idx]); pool.splice(idx, 1);
  }
  return order;
}

/* ─── Easing ─── */
const easeOutQuart = x => 1 - Math.pow(1 - Math.min(1, x), 4);
const easeInOut = x => {
  x = Math.min(1, Math.max(0, x));
  return x < 0.5 ? 2*x*x : 1 - Math.pow(-2*x+2, 2)/2;
};
const lerp = (a, b, t) => a + (b-a) * Math.min(1, Math.max(0, t));

/* ─── Draw background ─── */
function drawBg(ctx) {
  ctx.fillStyle = C.bg; ctx.fillRect(0,0,W,H);
  ctx.strokeStyle = '#151E2D'; ctx.lineWidth = 0.5;
  const gs = 64;
  for (let x=0; x<=W; x+=gs){ ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }
  for (let y=0; y<=H; y+=gs){ ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }
}

/* ─── Draw wheel ─── */
function drawWheel(ctx, parts, rot, hiIdx=-1, hiA=0) {
  const cx=W/2, cy=H*0.55, R=Math.min(W,H)*0.38;
  const n=parts.length; if(n===0) return;
  const seg=(2*Math.PI)/n;

  ctx.beginPath(); ctx.arc(cx,cy,R+6,0,2*Math.PI);
  ctx.strokeStyle=C.goldDark; ctx.lineWidth=4; ctx.stroke();

  for (let i=0; i<n; i++) {
    const a0=rot+i*seg-Math.PI/2, a1=a0+seg;
    ctx.beginPath(); ctx.moveTo(cx,cy); ctx.arc(cx,cy,R,a0,a1); ctx.closePath();
    if (i===hiIdx && hiA>0) {
      ctx.fillStyle=`rgba(140,26,26,${hiA})`;
    } else {
      ctx.fillStyle=i%2===0 ? C.seg1 : C.seg2;
    }
    ctx.fill();
    ctx.strokeStyle=C.segBorder; ctx.lineWidth=0.7; ctx.stroke();
  }

  /* Text */
  for (let i=0; i<n; i++) {
    const midA=rot+(i+0.5)*seg-Math.PI/2;
    const tr=R*0.65;
    const tx=cx+Math.cos(midA)*tr, ty=cy+Math.sin(midA)*tr;
    ctx.save(); ctx.translate(tx,ty); ctx.rotate(midA+Math.PI/2);
    const mc=Math.max(6, Math.floor(18-n*0.2));
    let lbl=parts[i]; if(lbl.length>mc) lbl=lbl.substring(0,mc-1)+'.';
    const fs=Math.max(6, Math.min(17, Math.floor(R*0.56/(Math.max(1,n)*0.45))));
    ctx.font=`600 ${fs}px Arial`;
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillStyle=(i===hiIdx && hiA>0) ? `rgba(255,200,200,${0.4+hiA*0.6})` : C.white;
    ctx.fillText(lbl, 0, 0);
    ctx.restore();
  }

  /* Center hub */
  ctx.beginPath(); ctx.arc(cx,cy,R*0.072,0,2*Math.PI);
  ctx.fillStyle=C.gold; ctx.fill();
  ctx.beginPath(); ctx.arc(cx,cy,R*0.038,0,2*Math.PI);
  ctx.fillStyle='#FFF'; ctx.fill();

  /* Pointer triangle */
  const py=cy-R;
  ctx.beginPath(); ctx.moveTo(cx,py+5); ctx.lineTo(cx-12,py-22); ctx.lineTo(cx+12,py-22); ctx.closePath();
  ctx.fillStyle=C.gold; ctx.fill();
  ctx.strokeStyle='#FFF6'; ctx.lineWidth=1; ctx.stroke();
}

/* ─── Sidebar: remaining count + last eliminations ─── */
function drawSidebar(ctx, remaining, lastElims) {
  const sx=W*0.83, sw=W*0.155, sy=50;
  ctx.fillStyle=C.bgPanel; ctx.fillRect(sx-6,sy,sw+6,H-sy-16);
  ctx.strokeStyle=C.goldDark; ctx.lineWidth=1; ctx.strokeRect(sx-6,sy,sw+6,H-sy-16);

  ctx.font='bold 12px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='center';
  ctx.fillText('REMAINING', sx+sw/2, sy+17);
  ctx.font='bold 38px Arial'; ctx.fillStyle=C.white;
  ctx.fillText(String(remaining), sx+sw/2, sy+56);
  ctx.font='11px Arial'; ctx.fillStyle=C.silver;
  ctx.fillText('in draw', sx+sw/2, sy+72);

  ctx.fillStyle=C.goldDark; ctx.fillRect(sx-6,sy+88,sw+6,1);
  ctx.font='bold 11px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='left';
  ctx.fillText('ELIMINATED', sx+2, sy+105);

  const show=lastElims.slice(-9).reverse();
  show.forEach((name,idx)=>{
    const lbl=name.length>15?name.substring(0,14)+'.':name;
    ctx.font=`${idx===0?'bold ':''} 10px Arial`;
    ctx.fillStyle=idx===0 ? C.redBright : `rgba(175,180,190,${1-idx*0.1})`;
    ctx.textAlign='left';
    ctx.fillText(lbl, sx+2, sy+123+idx*16);
  });
}

/* ─── Elimination reveal banner ─── */
function drawElimBanner(ctx, name, prog) {
  const p=easeInOut(prog);
  const bw=580, bh=130;
  const bx=(W-bw)/2, by=H*0.12;
  const slide=lerp(-80,0,p);
  ctx.save(); ctx.translate(0,slide);
  ctx.fillStyle=C.red; ctx.fillRect(bx,by,bw,bh);
  ctx.strokeStyle='#C03030'; ctx.lineWidth=2; ctx.strokeRect(bx,by,bw,bh);
  ctx.fillStyle=C.goldDark; ctx.fillRect(bx,by,bw,4);
  ctx.font='bold 15px Arial'; ctx.fillStyle='#FF9999'; ctx.textAlign='center';
  ctx.fillText('ELIMINATED', W/2, by+30);
  const fs=name.length>18?32:40;
  ctx.font=`bold ${fs}px Arial`; ctx.fillStyle='#FFF';
  ctx.fillText(name, W/2, by+82);
  ctx.restore();
}

/* ─── Countdown ─── */
const COUNT_BEAT = 8.33/10; // 0.833s per digit

function drawCountdown(ctx, relT, logo) {
  drawBg(ctx);
  if (logo) {
    const lw=200, lh=Math.floor(lw*logo.height/logo.width);
    ctx.drawImage(logo,(W-lw)/2,24,lw,lh);
  }
  const digit=Math.max(1,10-Math.floor(relT/COUNT_BEAT));
  const phase=(relT%COUNT_BEAT)/COUNT_BEAT;
  const scale=lerp(1.25,0.96,easeOutQuart(phase));
  const cx=W/2, cy=H/2+40, R=108;

  ctx.strokeStyle=C.bgPanel; ctx.lineWidth=9;
  ctx.beginPath(); ctx.arc(cx,cy,R,0,2*Math.PI); ctx.stroke();
  ctx.strokeStyle=C.gold; ctx.lineWidth=9;
  ctx.beginPath(); ctx.arc(cx,cy,R,-Math.PI/2,-Math.PI/2+(1-(relT%COUNT_BEAT)/COUNT_BEAT)*2*Math.PI);
  ctx.stroke();

  ctx.save(); ctx.translate(cx,cy); ctx.scale(scale,scale);
  ctx.font='bold 96px Arial'; ctx.fillStyle=C.white;
  ctx.textAlign='center'; ctx.textBaseline='middle';
  ctx.fillText(String(digit),0,0);
  ctx.restore();

  ctx.font='bold 20px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='center';
  ctx.fillText('THE GRAND DRAW', cx, cy+R+36);
}

/* ─── Intro ─── */
function drawIntro(ctx, t, logo) {
  drawBg(ctx);
  const fade=Math.min(1,t*0.7);
  ctx.globalAlpha=fade;
  if (logo) {
    const lw=260, lh=Math.floor(lw*logo.height/logo.width);
    ctx.drawImage(logo,(W-lw)/2,80,lw,lh);
  }
  ctx.font='bold 50px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='center';
  ctx.fillText('CFS 10TH ANNIVERSARY',W/2,H/2+8);
  ctx.font='bold 26px Arial'; ctx.fillStyle=C.silver;
  ctx.fillText('Grand Giveaway Draw',W/2,H/2+50);
  ctx.font='18px Arial'; ctx.fillStyle=C.silver;
  ctx.fillText(`${ALL_PARTICIPANTS.length} Participants  •  3 Winners`,W/2,H/2+88);
  ctx.globalAlpha=1;
}

/* ─── Winner reveal ─── */
function drawWinners(ctx, t, chars, logo) {
  drawBg(ctx);
  if (logo) {
    const lw=170, lh=Math.floor(lw*logo.height/logo.width);
    ctx.drawImage(logo,(W-lw)/2,12,lw,lh);
  }
  const ta=Math.min(1,t/0.8);
  ctx.globalAlpha=ta;
  ctx.font='bold 40px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='center';
  ctx.fillText('CONGRATULATIONS',W/2,86);
  ctx.font='17px Arial'; ctx.fillStyle=C.silver;
  ctx.fillText('CFS 10th Anniversary Giveaway Winners',W/2,112);
  ctx.globalAlpha=1;

  /* layout: [2nd | 1st | 3rd] */
  const cards=[
    { wi:1, pi:1, cx:W*0.165, cw:285, ch:430, baseY:H-442, delay:0.4 },
    { wi:0, pi:0, cx:W*0.375, cw:335, ch:490, baseY:H-502, delay:0.08 },
    { wi:2, pi:2, cx:W*0.645, cw:285, ch:430, baseY:H-442, delay:0.65 },
  ];

  for (const c of cards) {
    const el=Math.max(0,t-c.delay);
    const prog=easeOutQuart(el/1.4);
    const cy=lerp(H+60,c.baseY,prog);
    const alpha=Math.min(1,el/0.5);
    ctx.globalAlpha=alpha;

    const winner=FINAL_THREE[c.wi];
    const prize=PRIZES[c.pi];
    const char=chars[c.wi];

    ctx.fillStyle=C.bgPanel; ctx.fillRect(c.cx,cy,c.cw,c.ch);
    ctx.strokeStyle=prize.color; ctx.lineWidth=2.5; ctx.strokeRect(c.cx,cy,c.cw,c.ch);

    /* Rank header */
    ctx.fillStyle=prize.color; ctx.fillRect(c.cx,cy,c.cw,34);
    ctx.font='bold 18px Arial'; ctx.fillStyle='#111'; ctx.textAlign='center';
    ctx.fillText(`${prize.place} PLACE`,c.cx+c.cw/2,cy+23);

    /* Character image */
    if (char) {
      const ih=c.ch-34-90;
      const iw=Math.floor(ih*char.width/char.height);
      const ix=c.cx+(c.cw-iw)/2;
      ctx.drawImage(char,ix,cy+34,iw,ih);
    }

    /* Name + prize */
    const ny=cy+c.ch-88;
    ctx.fillStyle=C.bgPanel; ctx.fillRect(c.cx,ny,c.cw,88);
    ctx.strokeStyle=prize.color; ctx.lineWidth=1; ctx.strokeRect(c.cx,ny,c.cw,88);
    ctx.font='bold 20px Arial'; ctx.fillStyle=C.white; ctx.textAlign='center';
    ctx.fillText(winner,c.cx+c.cw/2,ny+26);
    ctx.font='12px Arial'; ctx.fillStyle=prize.color;
    const pl=prize.name.length>28?prize.name.substring(0,27)+'.':prize.name;
    ctx.fillText(pl,c.cx+c.cw/2,ny+50);
    ctx.font='11px Arial'; ctx.fillStyle=C.silver;
    ctx.fillText('Prize',c.cx+c.cw/2,ny+70);
    ctx.globalAlpha=1;
  }
}

/* ════════════════════════════ MAIN ════════════════════════════ */
async function main() {
  /* CLI args: node script.js [startFrame] [endFrame] [outputFile] */
  const args = process.argv.slice(2);
  const START_FRAME = args[0] !== undefined ? parseInt(args[0]) : 0;
  const END_FRAME_ARG = args[1] !== undefined ? parseInt(args[1]) : -1;
  const outputFile = args[2] || path.join(__dirname, 'giveaway-draw.mp4');

  const ELIM_ORDER = buildElimOrder();

  /* Load assets */
  let chars=[null,null,null], logo=null;
  try { chars=await Promise.all([
    loadImage('/tmp/vid-assets/char1.png'),
    loadImage('/tmp/vid-assets/char2.png'),
    loadImage('/tmp/vid-assets/char3.png'),
  ]); console.log('Characters loaded'); } catch(e) { console.warn('Char images missing'); }
  try { logo=await loadImage('/tmp/vid-assets/logo.png'); console.log('Logo loaded'); } catch(e) {}

  /* ─── Timeline ─── */
  const T_INTRO_END   = 5;
  const T_COUNT_START = 5;
  const T_COUNT_END   = T_COUNT_START + 8.33 + 0.6;
  const T_DRAW_START  = T_COUNT_END + 0.5;

  /* Pre-compute all elimination timings + wheel rotations */
  let currentRot=0;
  const wheelParts=[...ALL_PARTICIPANTS];
  const elimData=[];
  let tNow=T_DRAW_START;

  for (let i=0; i<ELIM_ORDER.length; i++) {
    const name=ELIM_ORDER[i];
    const parts=[...wheelParts];
    const targetIdx=parts.indexOf(name);
    const n=parts.length, sg=(2*Math.PI)/n;

    let delta=(-( (targetIdx+0.5)*sg )-currentRot) % (2*Math.PI);
    if (delta<0) delta+=2*Math.PI;
    const endRot=currentRot+5*2*Math.PI+delta;

    const spinDur  =i<35?1.6 : i<45?2.2 : 3.0;
    const revealDur=i<35?1.4 : i<45?1.8 : 2.5;

    elimData.push({
      name, targetIdx, parts,
      startRot:currentRot, endRot,
      spinStart:tNow, revealStart:tNow+spinDur,
      end:tNow+spinDur+revealDur, spinDur, revealDur,
    });

    currentRot=endRot;
    wheelParts.splice(wheelParts.indexOf(name),1);
    tNow+=spinDur+revealDur;
  }

  const T_WINNER_START=tNow;
  const T_TOTAL=T_WINNER_START+22;
  const TOTAL_FRAMES=Math.ceil(T_TOTAL*FPS);
  const END_FRAME=END_FRAME_ARG>=0 ? Math.min(END_FRAME_ARG,TOTAL_FRAMES-1) : TOTAL_FRAMES-1;

  console.log(`Frames ${START_FRAME}–${END_FRAME} of ${TOTAL_FRAMES}  (total video: ${T_TOTAL.toFixed(0)}s / ${(T_TOTAL/60).toFixed(1)}min)`);
  console.log(`Output: ${outputFile}`);

  /* ─── Spawn FFmpeg (video only, audio added in final concat step) ─── */
  const ffmpegBin='/nix/store/2crh7152ri5v6aarmnw20y73iq5hgj3n-replit-runtime-path/bin/ffmpeg';
  const audioFile=path.join(__dirname,'client/public/sounds/countdown.mp3');

  let ffArgs;
  if (START_FRAME===0 && END_FRAME===TOTAL_FRAMES-1) {
    /* Single-pass full video with audio */
    ffArgs=[
      '-y',
      '-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0',
      '-itsoffset',String(T_COUNT_START),'-stream_loop','-1','-i',audioFile,
      '-filter_complex',`[1:a]atrim=start=0:end=${(8.33+0.6).toFixed(2)},apad=whole_dur=${T_TOTAL.toFixed(2)}[a]`,
      '-map','0:v','-map','[a]',
      '-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',
      '-c:a','aac','-b:a','192k','-t',T_TOTAL.toFixed(2),
      outputFile,
    ];
  } else {
    /* Chunk: video only, no audio */
    ffArgs=[
      '-y',
      '-f','rawvideo','-pix_fmt','rgba','-s',`${W}x${H}`,'-r',String(FPS),'-i','pipe:0',
      '-c:v','libx264','-preset','fast','-crf','20','-pix_fmt','yuv420p',
      outputFile,
    ];
  }

  const ffmpeg=spawn(ffmpegBin,ffArgs);
  ffmpeg.stderr.on('data',()=>{});
  ffmpeg.stdin.on('error',()=>{});

  let done=false;
  ffmpeg.on('close',code=>{
    done=true;
    if (code===0) console.log(`\nDone: ${outputFile}`);
    else console.error(`\nFFmpeg error code ${code}`);
  });

  /* ─── Render loop ─── */
  const canvas=createCanvas(W,H);
  const ctx=canvas.getContext('2d');
  const REPORT=Math.max(1,Math.floor((END_FRAME-START_FRAME+1)/20));

  for (let frame=START_FRAME; frame<=END_FRAME; frame++) {
    const t=frame/FPS;
    ctx.clearRect(0,0,W,H);

    /* Find current elimination index and lastElims (pure derivation) */
    let elimIdx=0;
    while (elimIdx<elimData.length-1 && t>=elimData[elimIdx].end) elimIdx++;
    const lastElims=ELIM_ORDER.slice(0,elimIdx);

    /* ── INTRO ── */
    if (t<T_INTRO_END) {
      drawIntro(ctx,t,logo);

    /* ── COUNTDOWN ── */
    } else if (t<T_COUNT_END) {
      drawCountdown(ctx,t-T_COUNT_START,logo);

    /* ── DRAW ROUNDS ── */
    } else if (t<T_WINNER_START) {
      const ed=elimData[elimIdx];
      const remaining=ELIM_ORDER.length-elimIdx; // people still to be eliminated (not counting final 3)
      const totalRemaining=remaining+FINAL_THREE.length;

      drawBg(ctx);

      if (t<ed.revealStart) {
        /* Spinning */
        const sp=(t-ed.spinStart)/ed.spinDur;
        const rot=lerp(ed.startRot,ed.endRot,easeOutQuart(sp));
        const hiA=sp>0.7?(sp-0.7)/0.3:0;
        drawWheel(ctx,ed.parts,rot,ed.targetIdx,hiA);
      } else {
        /* Reveal: wheel frozen, banner shown */
        const rp=(t-ed.revealStart)/ed.revealDur;
        drawWheel(ctx,ed.parts,ed.endRot,ed.targetIdx,1);
        drawElimBanner(ctx,ed.name,rp);
      }

      /* Top bar */
      ctx.fillStyle=C.bgPanel; ctx.fillRect(0,0,W*0.8,46);
      ctx.font='bold 14px Arial'; ctx.fillStyle=C.gold; ctx.textAlign='left';
      ctx.fillText(`ELIMINATION  ${elimIdx+1} of ${ELIM_ORDER.length}`,16,28);

      drawSidebar(ctx,totalRemaining,lastElims);

    /* ── WINNERS ── */
    } else {
      drawWinners(ctx,t-T_WINNER_START,chars,logo);
    }

    /* Send to ffmpeg */
    const buf=canvas.toBuffer('raw');
    const ok=ffmpeg.stdin.write(buf);
    if(!ok) await new Promise(r=>ffmpeg.stdin.once('drain',r));

    if((frame-START_FRAME)%REPORT===0){
      const pct=(((frame-START_FRAME)/(END_FRAME-START_FRAME+1))*100).toFixed(0);
      process.stdout.write(`\r  ${pct}%  frame=${frame}  t=${t.toFixed(1)}s`);
    }
  }

  process.stdout.write(`\n  Frames written. Finalising...\n`);
  ffmpeg.stdin.end();
  await new Promise(r=>ffmpeg.on('close',r));
}

main().catch(e=>{console.error(e);process.exit(1);});
