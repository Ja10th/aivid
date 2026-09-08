import { Composition, Palette, RNG } from "./core";
import { C2D, rrect, hexA, star, poly } from "./draw";

// ==========================================
// PARAMETRIC 3-LAYER DECODE SYSTEM
// themeVariant (0-799) decodes to:
//   sceneType   = v % 10        (10 distinct artworks)
//   colorIdx    = floor(v/10) % 20  (20 color palettes)
//   layoutMicro = floor(v/200) % 4  (4 micro-layout tweaks)
// Total: 10 × 20 × 4 = 800 unique variations per category
// ==========================================

interface ThemeColors {
  bg: string;
  bgSecondary?: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

// 20 COLOR PALETTES (Universal — each category remixes them)
const COLOR_PALETTES: ThemeColors[] = [
  // 0-4: Cool spectrum
  { bg: "#0a1628", primary: "#3fe0ff", secondary: "#ff2323", accent: "#ffd23f", text: "#ffffff" },
  { bg: "#1a0f2e", primary: "#a855f7", secondary: "#3fe0ff", accent: "#ffd23f", text: "#ffffff" },
  { bg: "#0c1821", primary: "#38bdf8", secondary: "#ec4899", accent: "#fbbf24", text: "#ffffff" },
  { bg: "#041c1e", primary: "#2dd4bf", secondary: "#f43f5e", accent: "#fde047", text: "#ffffff" },
  { bg: "#0f172a", primary: "#818cf8", secondary: "#fb923c", accent: "#4ade80", text: "#ffffff" },
  
  // 5-9: Warm spectrum  
  { bg: "#1a0e0a", primary: "#ff6b35", secondary: "#ffd23f", accent: "#3fe0ff", text: "#ffffff" },
  { bg: "#2d1b0e", primary: "#f97316", secondary: "#a3e635", accent: "#06b6d4", text: "#ffffff" },
  { bg: "#1f0a0f", primary: "#dc2626", secondary: "#fbbf24", accent: "#10b981", text: "#ffffff" },
  { bg: "#0d0703", primary: "#d4a373", secondary: "#dc2626", accent: "#ffd700", text: "#ffe9b0" },
  { bg: "#2f1c14", primary: "#ca8a04", secondary: "#dc2626", accent: "#3b82f6", text: "#fef3c7" },
  
  // 10-14: Neon/Electric
  { bg: "#000000", primary: "#10b981", secondary: "#6ee7b7", accent: "#ffffff", text: "#ffffff" },
  { bg: "#04050d", primary: "#e879f9", secondary: "#38bdf8", accent: "#ffd23f", text: "#ffffff" },
  { bg: "#0c0a09", primary: "#eab308", secondary: "#ef4444", accent: "#06b6d4", text: "#ffffff" },
  { bg: "#050b14", primary: "#3b82f6", secondary: "#f59e0b", accent: "#22c55e", text: "#fef08a" },
  { bg: "#020617", primary: "#f43f5e", secondary: "#38bdf8", accent: "#ffd23f", text: "#ffffff" },
  
  // 15-19: Mystic/Cosmic
  { bg: "#0b041c", bgSecondary: "#080214", primary: "#a855f7", secondary: "#3fe0ff", accent: "#ffd700", text: "#ffffff" },
  { bg: "#030712", bgSecondary: "#0a102b", primary: "#f43f5e", secondary: "#38bdf8", accent: "#fbbf24", text: "#ffffff" },
  { bg: "#111827", bgSecondary: "#030712", primary: "#38bdf8", secondary: "#ec4899", accent: "#facc15", text: "#ffffff" },
  { bg: "#05010d", bgSecondary: "#1e0b36", primary: "#67e8f9", secondary: "#c084fc", accent: "#fde047", text: "#ffffff" },
  { bg: "#020614", bgSecondary: "#0a1628", primary: "#34d399", secondary: "#f472b6", accent: "#fbbf24", text: "#ffffff" },
];

function decodeThemeVariant(variant: number): { sceneType: number; colorIdx: number; layoutMicro: number } {
  const v = Math.abs(variant) % 800;
  return {
    sceneType: v % 10,
    colorIdx: Math.floor(v / 10) % 20,
    layoutMicro: Math.floor(v / 200) % 4,
  };
}

function applyMicroLayout(ctx: C2D, W: number, H: number, micro: number): { badgeX: number; badgeY: number; flip: boolean } {
  let badgeX = W * 0.84, badgeY = H * 0.1, flip = false;
  
  switch (micro) {
    case 0: // Default centered
      break;
    case 1: // Left-heavy, badge top-left
      badgeX = W * 0.18;
      badgeY = H * 0.12;
      break;
    case 2: // Mirrored horizontally
      ctx.scale(-1, 1);
      ctx.translate(-W, 0);
      flip = true;
      break;
    case 3: // Zoomed + badge bottom-right
      ctx.translate(W * 0.05, H * 0.05);
      ctx.scale(1.08, 1.08);
      badgeX = W * 0.82;
      badgeY = H * 0.88;
      break;
  }
  
  return { badgeX, badgeY, flip };
}

export function outlinedText(ctx: C2D, text: string, x: number, y: number, size: number, fill: string, stroke = "#000", align: CanvasTextAlign = "center") {
  ctx.font = `900 ${Math.round(size)}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = Math.max(8, size * 0.075);
  ctx.strokeStyle = stroke;
  ctx.strokeText(text, x, y);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

export function fitOutlinedText(ctx: C2D, text: string, x: number, y: number, maxW: number, size: number, fill: string, stroke = "#000") {
  ctx.font = `900 ${Math.round(size)}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  let fitted = size;
  while (ctx.measureText(text).width > maxW && fitted > 30) {
    fitted -= Math.max(1, fitted * 0.05);
    ctx.font = `900 ${Math.round(fitted)}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  }
  outlinedText(ctx, text, x, y, fitted, fill, stroke);
}

export function drawBadge(ctx: C2D, text: string, cx: number, cy: number, bg: string, fg: string, fontSize: number, rotateDeg = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.font = `800 ${fontSize}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  const tw = Math.max(ctx.measureText(text).width, fontSize * 1.5);
  const ph = fontSize * 1.3;
  const pw = tw + fontSize * 1.2;
  ctx.shadowColor = "rgba(0,0,0,0.5)";
  ctx.shadowBlur = 18;
  ctx.shadowOffsetY = 6;
  rrect(ctx, -pw / 2, -ph / 2, pw, ph, ph / 2);
  ctx.fillStyle = bg;
  ctx.fill();
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.fillStyle = fg;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text, 0, 0);
  ctx.restore();
}

export function drawTimerRing(ctx: C2D, cx: number, cy: number, r: number, num: string, progress: number, ringColor: string, numColor: string) {
  ctx.strokeStyle = "rgba(255,255,255,0.18)";
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();

  ctx.strokeStyle = ringColor;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();

  outlinedText(ctx, num, cx, cy, r * 0.78, numColor, "#000");
}

function splitHeadline(text: string): string[] {
  if (text.includes("\n")) return text.split("\n");
  if (text.length > 14) {
    const words = text.split(" ");
    const mid = Math.ceil(words.length / 2);
    return [words.slice(0, mid).join(" "), words.slice(mid).join(" ")];
  }
  return [text];
}

// ==========================================
// PARAMETRIC 3-LAYER DECODE SYSTEM
// themeVariant (0-799) decodes to:
//   sceneType   = v % 10        (10 distinct artworks)
//   colorIdx    = floor(v/10) % 20  (20 color palettes)
//   layoutMicro = floor(v/200) % 4  (4 micro-layout tweaks)
// Total: 10 × 20 × 4 = 800 unique variations per category
// ==========================================

interface ThemeColors {
  bg: string;
  bgSecondary?: string;
  primary: string;
  secondary: string;
  accent: string;
  text: string;
}

// ==========================================
// 1. EYE TRAINING (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawEyeTrainingThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : "FOLLOW THE DOT";
  
  ctx.save();
  const { badgeX, badgeY, flip } = applyMicroLayout(ctx, W, H, layoutMicro);

  if (sceneType === 0) {
    // V0: Giant Realistic Eye + Ballistic Flight Arc + Target Dot

    const bg = ctx.createRadialGradient(W * 0.32, H * 0.48, 40, W * 0.32, H * 0.48, W * 0.85);
    bg.addColorStop(0, colors.bg); bg.addColorStop(1, colors.bgSecondary || colors.bg);
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const eyeCX = W * 0.34, eyeCY = H * 0.46, eyeW = W * 0.52, eyeH = H * 0.44;
    ctx.save();
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 48; ctx.shadowOffsetY = 18;
    ctx.fillStyle = "#f6ede0";
    ctx.beginPath();
    ctx.moveTo(eyeCX - eyeW / 2, eyeCY);
    ctx.bezierCurveTo(eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2, eyeCY);
    ctx.bezierCurveTo(eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY + eyeH / 2, eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY + eyeH / 2, eyeCX - eyeW / 2, eyeCY);
    ctx.fill(); ctx.restore();

    const irisR = eyeH * 0.46;
    ctx.fillStyle = "#04141c"; ctx.beginPath(); ctx.arc(eyeCX, eyeCY, irisR, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3fe0ff"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(eyeCX, eyeCY, irisR, 0, Math.PI * 2); ctx.stroke();

    ctx.fillStyle = "#01060a"; ctx.beginPath(); ctx.arc(eyeCX, eyeCY, irisR * 0.44, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.92)"; ctx.beginPath(); ctx.arc(eyeCX - irisR * 0.28, eyeCY - irisR * 0.28, irisR * 0.16, 0, Math.PI * 2); ctx.fill();

    // Arc trail to target dot
    ctx.save();
    ctx.strokeStyle = "#ff2323"; ctx.lineWidth = 7; ctx.setLineDash([6, 22]); ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(eyeCX + eyeW * 0.22, H * 0.53);
    ctx.bezierCurveTo(W * 0.62, H * 0.2, W * 0.8, H * 0.18, W * 0.88, H * 0.28);
    ctx.stroke(); ctx.restore();

    // Red dot
    const dotX = W * 0.88, dotY = H * 0.28;
    const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 55);
    dg.addColorStop(0, "rgba(255,35,35,0.65)"); dg.addColorStop(1, "transparent");
    ctx.fillStyle = dg; ctx.fillRect(dotX - 60, dotY - 60, 120, 120);
    ctx.fillStyle = "#ff2323"; ctx.beginPath(); ctx.arc(dotX, dotY, 26, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "TRACK IT →", W * 0.84, H * 0.1, "#3fe0ff", "#000", 28, -5);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.81 + (i - (lines.length - 1) / 2) * 104, W * 0.86, 100, i === 1 ? "#3fe0ff" : "#fff"));
  } else if (sceneType === 1) {
    // V1: Tactical Concentric Optical Radar / HUD Bullseye
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#010f17"); bg.addColorStop(1, "#04222f");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cx = W * 0.52, cy = H * 0.42;
    // Radar grid
    ctx.strokeStyle = "rgba(63,224,255,0.15)"; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(0, cy); ctx.lineTo(W, cy); ctx.moveTo(cx, 0); ctx.lineTo(cx, H); ctx.stroke();

    // Concentric target rings
    [60, 130, 205, 285].forEach((r, idx) => {
      ctx.strokeStyle = idx === 1 ? "#3fe0ff" : idx === 3 ? "rgba(63,224,255,0.5)" : "rgba(63,224,255,0.25)";
      ctx.lineWidth = idx === 1 ? 5 : 2;
      ctx.setLineDash(idx % 2 === 1 ? [12, 10] : []);
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });
    ctx.setLineDash([]);

    // Crosshair ticks
    ctx.strokeStyle = "#3fe0ff"; ctx.lineWidth = 4;
    [-285, 285].forEach((offset) => {
      ctx.beginPath(); ctx.moveTo(cx + offset - 20, cy); ctx.lineTo(cx + offset + 20, cy); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(cx, cy + offset - 20); ctx.lineTo(cx, cy + offset + 20); ctx.stroke();
    });

    // Bullseye pulsing dot
    const bullGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 70);
    bullGlow.addColorStop(0, "rgba(255,45,85,0.8)"); bullGlow.addColorStop(1, "transparent");
    ctx.fillStyle = bullGlow; ctx.fillRect(cx - 80, cy - 80, 160, 160);
    ctx.fillStyle = "#ff2d55"; ctx.beginPath(); ctx.arc(cx, cy, 28, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx, cy, 10, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "🎯 RETICLE LOCK", W * 0.8, H * 0.12, "#ff2d55", "#fff", 26, 4);
    drawBadge(ctx, "SYS: 20/20", W * 0.18, H * 0.12, "#3fe0ff", "#000", 24, -3);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.84 + (i - (lines.length - 1) / 2) * 94, W * 0.88, 92, "#ffffff", "#000"));
  } else if (sceneType === 2) {
    // V2: Cosmic Neon Infinity Lemniscate (Figure-8 Smooth Pursuit)
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#0b041c"); bg.addColorStop(0.5, "#1f093f"); bg.addColorStop(1, "#080214");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Speed particles
    ctx.fillStyle = "rgba(255,255,255,0.4)";
    for (let i = 0; i < 40; i++) {
      ctx.beginPath(); ctx.arc((i * 197) % W, (i * 131) % H, (i % 3) + 1, 0, Math.PI * 2); ctx.fill();
    }

    // Glowing Infinity Curve (x = cx + sin(t)*380, y = cy + sin(2t)*150)
    const cx = W * 0.5, cy = H * 0.42;
    ctx.save();
    ctx.strokeStyle = "rgba(168,85,247,0.4)"; ctx.lineWidth = 32; ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.05) {
      const x = cx + Math.sin(a) * 380, y = cy + Math.sin(a * 2) * 150;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    ctx.strokeStyle = "#3fe0ff"; ctx.lineWidth = 12; ctx.beginPath();
    for (let a = 0; a <= Math.PI * 2 + 0.1; a += 0.05) {
      const x = cx + Math.sin(a) * 380, y = cy + Math.sin(a * 2) * 150;
      if (a === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke(); ctx.restore();

    // Intersection tracking beacon orb
    const og = ctx.createRadialGradient(cx, cy, 0, cx, cy, 80);
    og.addColorStop(0, "rgba(255,215,0,0.9)"); og.addColorStop(1, "transparent");
    ctx.fillStyle = og; ctx.fillRect(cx - 90, cy - 90, 180, 180);
    ctx.fillStyle = "#ffd700"; ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(cx, cy, 12, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "SMOOTH PURSUIT · 60FPS", W * 0.5, H * 0.1, "#ffd700", "#000", 28, 0);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.83 + (i - (lines.length - 1) / 2) * 96, W * 0.86, 94, i === 1 ? "#ffd700" : "#ffffff", "#000"));
  } else if (sceneType === 3) {
    // V3: Dual Saccades Ballistic Speed Duel (Left vs Right with lightning snap)
    ctx.fillStyle = "#070712"; ctx.fillRect(0, 0, W, H);
    // Background speed lines
    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2;
    for (let y = 40; y < H; y += 60) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const yMid = H * 0.44;
    const lx = W * 0.18, rx = W * 0.82;

    // Left Target (Cyan)
    ctx.strokeStyle = "#3fe0ff"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(lx, yMid, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(63,224,255,0.25)"; ctx.beginPath(); ctx.arc(lx, yMid, 80, 0, Math.PI * 2); ctx.fill();
    outlinedText(ctx, "L", lx, yMid, 90, "#3fe0ff", "#000");

    // Right Target (Hot Pink)
    ctx.strokeStyle = "#ff2d95"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.arc(rx, yMid, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,45,149,0.25)"; ctx.beginPath(); ctx.arc(rx, yMid, 80, 0, Math.PI * 2); ctx.fill();
    outlinedText(ctx, "R", rx, yMid, 90, "#ff2d95", "#000");

    // High voltage lightning connecting Left & Right
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 9; ctx.lineJoin = "bevel";
    ctx.beginPath();
    ctx.moveTo(lx + 85, yMid);
    ctx.lineTo(W * 0.35, yMid - 40);
    ctx.lineTo(W * 0.44, yMid + 35);
    ctx.lineTo(W * 0.56, yMid - 30);
    ctx.lineTo(W * 0.68, yMid + 40);
    ctx.lineTo(rx - 85, yMid);
    ctx.stroke();

    // Reaction time HUD in center
    drawBadge(ctx, "0.15s SNAP", W * 0.5, yMid, "#ffd23f", "#000", 38, 0);
    drawBadge(ctx, "RAPID JUMPS ⚡", W * 0.5, H * 0.14, "#ff2d95", "#fff", 26, 0);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 92, W * 0.86, 90, "#ffffff", "#000"));
  } else {
    // V4: Hypnotic Focus Vortex / Depth Tunnel
    const cx = W * 0.5, cy = H * 0.42;
    ctx.fillStyle = "#000"; ctx.fillRect(0, 0, W, H);

    // Alternating spiral vortex rays
    ctx.save();
    for (let i = 0; i < 24; i++) {
      ctx.fillStyle = i % 2 === 0 ? "#10b981" : "#022c22";
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      const a1 = (i / 24) * Math.PI * 2, a2 = ((i + 1) / 24) * Math.PI * 2;
      ctx.arc(cx, cy, 600, a1, a2);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();

    // Depth rings
    [70, 140, 220, 320].forEach((r, idx) => {
      ctx.strokeStyle = "rgba(0,0,0,0.5)"; ctx.lineWidth = 14;
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
    });

    // Intense center white beacon
    const starG = ctx.createRadialGradient(cx, cy, 0, cx, cy, 60);
    starG.addColorStop(0, "#ffffff"); starG.addColorStop(0.5, "#6ee7b7"); starG.addColorStop(1, "transparent");
    ctx.fillStyle = starG; ctx.fillRect(cx - 70, cy - 70, 140, 140);
    ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(cx, cy, 24, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "STARE AT CENTER", cx, cy + 85, "#000000", "#6ee7b7", 24, 0);
    drawBadge(ctx, "PERIPHERAL VISION", W * 0.82, H * 0.1, "#10b981", "#000", 26, 4);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 92, W * 0.88, 92, "#6ee7b7", "#000"));
  }
}

// ==========================================
// 2. GAMEPLAY (5 DISTINCT COMPOSITIONS)
// ==========================================
export function drawGameplayThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  
  ctx.save();
  const { badgeX, badgeY, flip } = applyMicroLayout(ctx, W, H, layoutMicro);
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : "WATCH IT RUN";

  if (sceneType === 0) {
    // V0: Match-3 Candy Gem Blitz
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#ff3fb0"); bg.addColorStop(0.55, "#7b2ff7"); bg.addColorStop(1, "#1a1150");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // 5x5 board
    const bSize = 440, bX = 54, bY = H * 0.08, cell = (bSize - 16) / 5;
    ctx.fillStyle = "rgba(0,0,0,0.35)"; rrect(ctx, bX, bY, bSize, bSize, 20); ctx.fill();
    const gemColors = ["#ff5757", "#ffd23f", "#3fe0ff", "#3fff88", "#ff9f3f"];
    for (let r = 0; r < 5; r++) {
      for (let c = 0; c < 5; c++) {
        const clr = gemColors[(r * 2 + c * 3) % gemColors.length];
        const gx = bX + 8 + c * cell, gy = bY + 8 + r * cell;
        ctx.fillStyle = clr; rrect(ctx, gx + 4, gy + 4, cell - 8, cell - 8, 12); ctx.fill();
      }
    }

    // Yellow motion arrow pointing right
    const ax = W * 0.62, ay = H * 0.38;
    ctx.strokeStyle = "#fff700"; ctx.lineWidth = 18; ctx.lineCap = "round"; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(ax - 50, ay); ctx.lineTo(ax + 50, ay); ctx.moveTo(ax + 20, ay - 30); ctx.lineTo(ax + 50, ay); ctx.lineTo(ax + 20, ay + 30); ctx.stroke();

    outlinedText(ctx, "×8 COMBO", W * 0.8, H * 0.28, 48, "#fff700", "#000");
    outlinedText(ctx, "18,420", W * 0.8, H * 0.42, 66, "#ffffff", "#000");

    fitOutlinedText(ctx, hook, W / 2, H * 0.88, W * 0.86, 88, "#ffffff", "#000");
  } else if (sceneType === 1) {
    // V1: Neon Retro Arcade Space Shooter (Vector Asteroids / Galaga)
    ctx.fillStyle = "#04050d"; ctx.fillRect(0, 0, W, H);
    // CRT scanlines
    ctx.fillStyle = "rgba(0, 255, 200, 0.03)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);

    // Vector starship on left
    const sx = W * 0.28, sy = H * 0.45;
    ctx.save();
    ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 8; ctx.lineJoin = "round";
    ctx.beginPath(); ctx.moveTo(sx + 80, sy); ctx.lineTo(sx - 50, sy - 45); ctx.lineTo(sx - 30, sy); ctx.lineTo(sx - 50, sy + 45); ctx.closePath();
    ctx.fillStyle = "#1e1b4b"; ctx.fill(); ctx.stroke();
    // Thruster flame
    ctx.fillStyle = "#f97316"; ctx.beginPath(); ctx.moveTo(sx - 30, sy - 14); ctx.lineTo(sx - 75, sy); ctx.lineTo(sx - 30, sy + 14); ctx.fill();
    // Twin lasers
    ctx.strokeStyle = "#3fe0ff"; ctx.lineWidth = 6;
    ctx.beginPath(); ctx.moveTo(sx + 90, sy - 18); ctx.lineTo(sx + 260, sy - 18); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(sx + 90, sy + 18); ctx.lineTo(sx + 260, sy + 18); ctx.stroke();
    ctx.restore();

    // Tumbling glowing asteroids on right
    const rockX = W * 0.74, rockY = H * 0.42;
    ctx.save();
    ctx.strokeStyle = "#e879f9"; ctx.lineWidth = 7; ctx.fillStyle = "rgba(232,121,249,0.2)";
    poly(ctx, rockX, rockY, 110, 6, 0.4); ctx.fill(); ctx.stroke();
    poly(ctx, rockX + 110, rockY + 80, 50, 5, 0.9); ctx.fill(); ctx.stroke();
    poly(ctx, rockX - 60, rockY - 110, 45, 6, 0.2); ctx.fill(); ctx.stroke();
    ctx.restore();

    // Retro Arcade HUD
    outlinedText(ctx, "1UP 49,200", W * 0.2, H * 0.12, 38, "#38bdf8", "#000");
    outlinedText(ctx, "HIGH 99,990", W * 0.8, H * 0.12, 38, "#ffd23f", "#000");
    drawBadge(ctx, "INSERT COIN · 1P", W * 0.5, H * 0.12, "#ef4444", "#fff", 26, 0);

    fitOutlinedText(ctx, hook, W / 2, H * 0.88, W * 0.86, 88, "#ffd23f", "#000");
  } else if (sceneType === 2) {
    // V2: Tetris Matrix Block Cascade
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#08071a"); bg.addColorStop(1, "#180f33");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // Matrix well (center-left)
    const wx = W * 0.22, wy = H * 0.08, ww = 400, wh = 520;
    ctx.fillStyle = "rgba(0,0,0,0.55)"; rrect(ctx, wx, wy, ww, wh, 14); ctx.fill();
    ctx.strokeStyle = "#4c1d95"; ctx.lineWidth = 4; rrect(ctx, wx, wy, ww, wh, 14); ctx.stroke();

    // Stacked tetrominoes inside well
    const bs = 38;
    const drawBlock = (col: number, row: number, color: string) => {
      const bx = wx + 10 + col * bs, by = wy + wh - 10 - row * bs;
      ctx.fillStyle = color; rrect(ctx, bx, by, bs - 3, bs - 3, 6); ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 2; rrect(ctx, bx, by, bs - 3, bs - 3, 6); ctx.stroke();
    };

    // Floor blocks
    [[0,1,"#ef4444"],[1,1,"#ef4444"],[2,1,"#3b82f6"],[3,1,"#3b82f6"],[4,1,"#eab308"],[5,1,"#eab308"],[6,1,"#a855f7"],[7,1,"#a855f7"],[8,1,"#10b981"],[9,1,"#10b981"],
     [0,2,"#ef4444"],[1,2,"#ef4444"],[2,2,"#3b82f6"],[3,2,"#3b82f6"],[7,2,"#a855f7"],[8,2,"#10b981"],
     [4,3,"#eab308"],[5,3,"#eab308"],[6,3,"#a855f7"]].forEach(([c, r, clr]) => drawBlock(Number(c), Number(r), String(clr)));

    // Falling T-piece in middle of well
    [[4,8,"#a855f7"],[3,9,"#a855f7"],[4,9,"#a855f7"],[5,9,"#a855f7"]].forEach(([c, r, clr]) => drawBlock(Number(c), Number(r), String(clr)));

    // Right Sidebar: NEXT Box & Stats
    const nx = W * 0.72, ny = H * 0.16;
    ctx.fillStyle = "rgba(0,0,0,0.4)"; rrect(ctx, nx - 20, ny - 20, 200, 280, 16); ctx.fill();
    ctx.strokeStyle = "#6366f1"; ctx.lineWidth = 3; rrect(ctx, nx - 20, ny - 20, 200, 280, 16); ctx.stroke();
    outlinedText(ctx, "NEXT", nx + 80, ny + 15, 30, "#a5b4fc", "#000");

    // Orange L piece in preview
    [[1,2,"#f97316"],[1,3,"#f97316"],[1,4,"#f97316"],[2,2,"#f97316"]].forEach(([c, r, clr]) => {
      ctx.fillStyle = String(clr); rrect(ctx, nx + 30 + Number(c) * 28, ny + 40 + (4 - Number(r)) * 28, 26, 26, 5); ctx.fill();
    });

    outlinedText(ctx, "LINES 84", nx + 80, ny + 190, 36, "#38bdf8", "#000");
    outlinedText(ctx, "324K", nx + 80, ny + 235, 44, "#ffd23f", "#000");

    drawBadge(ctx, "MAX LINES 🏆", W * 0.38, H * 0.08, "#22c55e", "#000", 24, -3);
    fitOutlinedText(ctx, hook, W / 2, H * 0.88, W * 0.86, 88, "#ffffff", "#000");
  } else if (sceneType === 3) {
    // V3: Cyberpunk Pong / AI vs AI Battle Arena
    ctx.fillStyle = "#020617"; ctx.fillRect(0, 0, W, H);
    // Court borders
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; ctx.lineWidth = 6;
    ctx.strokeRect(40, 40, W - 80, H * 0.68);

    // Center dashed net
    ctx.strokeStyle = "rgba(255,255,255,0.3)"; ctx.lineWidth = 6; ctx.setLineDash([16, 16]);
    ctx.beginPath(); ctx.moveTo(W * 0.5, 40); ctx.lineTo(W * 0.5, H * 0.72); ctx.stroke();
    ctx.setLineDash([]);

    // Left Paddle: Blue AI
    ctx.fillStyle = "#38bdf8"; ctx.shadowColor = "#38bdf8"; ctx.shadowBlur = 24;
    rrect(ctx, 60, H * 0.28, 22, 140, 10); ctx.fill();
    ctx.shadowBlur = 0;
    outlinedText(ctx, "BOT A", 140, H * 0.35, 34, "#38bdf8", "#000");

    // Right Paddle: Pink AI
    ctx.fillStyle = "#f43f5e"; ctx.shadowColor = "#f43f5e"; ctx.shadowBlur = 24;
    rrect(ctx, W - 82, H * 0.22, 22, 140, 10); ctx.fill();
    ctx.shadowBlur = 0;
    outlinedText(ctx, "BOT B", W - 140, H * 0.29, 34, "#f43f5e", "#000");

    // Ball with motion blur trail
    const bx = W * 0.62, by = H * 0.34;
    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(W * 0.32, H * 0.56); ctx.lineTo(bx, by); ctx.stroke();
    ctx.fillStyle = "#fff"; ctx.shadowColor = "#fff"; ctx.shadowBlur = 20;
    ctx.beginPath(); ctx.arc(bx, by, 18, 0, Math.PI * 2); ctx.fill();
    ctx.shadowBlur = 0;

    // Scoreboard overhead
    drawBadge(ctx, "07  :  06", W * 0.5, H * 0.12, "#0f172a", "#f8fafc", 44, 0);
    drawBadge(ctx, "AI DUEL 🔥", W * 0.5, H * 0.22, "#f43f5e", "#fff", 24, 0);

    fitOutlinedText(ctx, hook, W / 2, H * 0.88, W * 0.86, 88, "#38bdf8", "#000");
  } else {
    // V4: Isometric 3D Chess Mastermind
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#18092b"); bg.addColorStop(0.6, "#0a0314"); bg.addColorStop(1, "#000000");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    // 3D Perspective Checkerboard
    ctx.save();
    const boardY = H * 0.25;
    for (let r = 0; r < 6; r++) {
      for (let c = 0; c < 8; c++) {
        const yTop = boardY + r * 45, yBot = boardY + (r + 1) * 45;
        const wTop = 460 + r * 80, wBot = 460 + (r + 1) * 80;
        const x1 = W / 2 - wTop / 2 + (c / 8) * wTop;
        const x2 = W / 2 - wTop / 2 + ((c + 1) / 8) * wTop;
        const x3 = W / 2 - wBot / 2 + ((c + 1) / 8) * wBot;
        const x4 = W / 2 - wBot / 2 + (c / 8) * wBot;

        ctx.fillStyle = (r + c) % 2 === 0 ? "rgba(168, 85, 247, 0.4)" : "rgba(15, 7, 30, 0.8)";
        ctx.beginPath(); ctx.moveTo(x1, yTop); ctx.lineTo(x2, yTop); ctx.lineTo(x3, yBot); ctx.lineTo(x4, yBot); ctx.closePath();
        ctx.fill();
        ctx.strokeStyle = "rgba(168, 85, 247, 0.3)"; ctx.lineWidth = 1.5; ctx.stroke();
      }
    }
    ctx.restore();

    // Stylized Glowing Chess Knight piece in foreground
    const kx = W * 0.52, ky = H * 0.38;
    ctx.save();
    ctx.shadowColor = "#38bdf8"; ctx.shadowBlur = 24;
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 9; ctx.fillStyle = "#0f172a";
    ctx.beginPath();
    ctx.moveTo(kx - 30, ky + 90); ctx.lineTo(kx + 30, ky + 90);
    ctx.lineTo(kx + 22, ky + 45); ctx.lineTo(kx + 50, ky + 10);
    ctx.lineTo(kx + 30, ky - 40); ctx.lineTo(kx, ky - 55);
    ctx.lineTo(kx - 35, ky - 30); ctx.lineTo(kx - 55, ky + 10);
    ctx.lineTo(kx - 20, ky + 45); ctx.closePath();
    ctx.fill(); ctx.stroke(); ctx.restore();

    // Knight eye
    ctx.fillStyle = "#fff"; ctx.beginPath(); ctx.arc(kx - 15, ky - 30, 6, 0, Math.PI * 2); ctx.fill();

    // Move arrow
    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 10; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(kx + 60, ky + 30); ctx.lineTo(kx + 140, ky - 30); ctx.lineTo(kx + 115, ky - 35); ctx.stroke();

    // Evaluation bar on left
    const evX = 60, evY = H * 0.12, evW = 28, evH = 340;
    ctx.fillStyle = "#ffffff"; rrect(ctx, evX, evY, evW, evH * 0.75, 8); ctx.fill();
    ctx.fillStyle = "#1e1b4b"; rrect(ctx, evX, evY + evH * 0.75, evW, evH * 0.25, 8); ctx.fill();
    outlinedText(ctx, "+3.4", evX + 14, evY - 24, 30, "#fff", "#000");

    drawBadge(ctx, "CHECKMATE IN 3 ♟️", W * 0.74, H * 0.12, "#ffd23f", "#000", 28, 4);
    fitOutlinedText(ctx, hook, W / 2, H * 0.88, W * 0.86, 88, "#ffffff", "#000");
  }
}

// ==========================================
// 3. MATH (5 DISTINCT COMPOSITIONS)
// ==========================================
export function drawMathThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, equation: string, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : "CAN YOU SOLVE IT?";
  
  ctx.save();
  const { badgeX, badgeY, flip } = applyMicroLayout(ctx, W, H, layoutMicro);

  if (sceneType === 0) {
    // V0: Chalkboard Classroom Storm
    const bg = ctx.createRadialGradient(W * 0.72, H * 0.24, 30, W * 0.72, H * 0.24, W * 0.9);
    bg.addColorStop(0, "#2a3170"); bg.addColorStop(1, "#0a0d24");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.strokeStyle = "rgba(255,255,255,0.06)"; ctx.lineWidth = 2;
    for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
    for (let y = 0; y < H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }

    const parts = equation.replace("=?", "").split(/([\+\-\×\÷\+\-×÷])/g).filter(Boolean);
    const positions = [{ x: W * 0.06, y: H * 0.38, rot: -4 }, { x: W * 0.26, y: H * 0.5, rot: 3 }, { x: W * 0.46, y: H * 0.35, rot: 2 }, { x: W * 0.66, y: H * 0.48, rot: -3 }, { x: W * 0.85, y: H * 0.36, rot: 6 }];
    parts.slice(0, 5).forEach((part, i) => {
      const pos = positions[i] || { x: W * 0.5, y: H * 0.4, rot: 0 };
      const isOp = /[\+\-\×\÷×÷\−]/.test(part.trim());
      const sz = isOp ? 140 : 190;
      ctx.save(); ctx.translate(pos.x + sz * 0.4, pos.y); ctx.rotate((pos.rot * Math.PI) / 180);
      outlinedText(ctx, part.trim(), 0, 0, sz, isOp ? "#fff" : "#ffd23f", "#000");
      ctx.restore();
    });

    outlinedText(ctx, "?", W * 0.92, H * 0.32, 220, "#ff3b3b", "#000");
    drawTimerRing(ctx, W * 0.84, H * 0.72, 70, "10", 0.72, "#ff3b3b", "#ffffff");

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.84 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 86, "#ffffff", "#ff3b3b"));
  } else if (sceneType === 1) {
    // V1: 4-Choice Multiple Choice Pressure Card
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#081028"); bg.addColorStop(1, "#020512");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const cw = W * 0.78, ch = 190, cx = W * 0.11, cy = H * 0.14;
    ctx.fillStyle = "rgba(15, 23, 42, 0.9)"; rrect(ctx, cx, cy, cw, ch, 24); ctx.fill();
    ctx.strokeStyle = "#38bdf8"; ctx.lineWidth = 6; rrect(ctx, cx, cy, cw, ch, 24); ctx.stroke();
    outlinedText(ctx, equation.length > 2 ? equation : "7 × 8 + 15 = ?", W * 0.5, cy + ch * 0.5, 96, "#ffd23f", "#000");

    const optY = H * 0.52, optW = (cw - 45) / 4, optH = 110;
    const opts = [
      { label: "A: 71", clr: "#38bdf8", pick: false },
      { label: "B: 63", clr: "#e879f9", pick: false },
      { label: "C: 79", clr: "#22c55e", pick: true },
      { label: "D: ??", clr: "#f97316", pick: false },
    ];
    opts.forEach((o, i) => {
      const ox = cx + i * (optW + 15);
      ctx.fillStyle = o.pick ? "rgba(34, 197, 94, 0.3)" : "rgba(0,0,0,0.5)";
      rrect(ctx, ox, optY, optW, optH, 16); ctx.fill();
      ctx.strokeStyle = o.clr; ctx.lineWidth = o.pick ? 7 : 3;
      rrect(ctx, ox, optY, optW, optH, 16); ctx.stroke();
      outlinedText(ctx, o.label, ox + optW * 0.5, optY + optH * 0.5, 42, o.clr, "#000");
    });

    drawBadge(ctx, "99% GET THIS WRONG", W * 0.5, H * 0.08, "#ef4444", "#fff", 26, 0);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.86 + (i - (lines.length - 1) / 2) * 88, W * 0.88, 86, "#ffffff", "#000"));
  } else if (sceneType === 2) {
    // V2: Digital Bomb Timer / Emergency Countdown
    ctx.fillStyle = "#0c0a09"; ctx.fillRect(0, 0, W, H);

    const drawHazard = (hy: number) => {
      ctx.save(); ctx.beginPath(); ctx.rect(0, hy, W, 32); ctx.clip();
      ctx.fillStyle = "#eab308"; ctx.fillRect(0, hy, W, 32);
      ctx.fillStyle = "#000"; ctx.lineWidth = 24;
      for (let x = -40; x < W + 40; x += 48) { ctx.beginPath(); ctx.moveTo(x, hy); ctx.lineTo(x + 30, hy + 32); ctx.stroke(); }
      ctx.restore();
    };
    drawHazard(0); drawHazard(H - 32);

    const tx = W * 0.5, ty = H * 0.28;
    ctx.fillStyle = "rgba(239, 68, 68, 0.15)"; rrect(ctx, tx - 220, ty - 65, 440, 130, 20); ctx.fill();
    ctx.strokeStyle = "#ef4444"; ctx.lineWidth = 5; rrect(ctx, tx - 220, ty - 65, 440, 130, 20); ctx.stroke();
    outlinedText(ctx, "00 : 04.8", tx, ty, 88, "#ef4444", "#000");

    outlinedText(ctx, equation.length > 2 ? equation : "12² - 45 = ?", tx, H * 0.55, 110, "#fbbf24", "#000");
    drawBadge(ctx, "FAST MATH BLITZ ⏱️", tx, H * 0.12, "#ef4444", "#fff", 28, 0);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.84 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 86, "#ffffff", "#ef4444"));
  } else if (sceneType === 3) {
    // V3: Geometric Shape / Symbol Algebra Riddle
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#1e1035"); bg.addColorStop(1, "#070212");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const rowY = [H * 0.16, H * 0.35, H * 0.54];
    // Row 1: ▲ + ▲ + ▲ = 30
    poly(ctx, W * 0.16, rowY[0], 35, 3); ctx.fillStyle = "#ef4444"; ctx.fill();
    outlinedText(ctx, "+", W * 0.26, rowY[0], 50, "#fff", "#000");
    poly(ctx, W * 0.36, rowY[0], 35, 3); ctx.fillStyle = "#ef4444"; ctx.fill();
    outlinedText(ctx, "+", W * 0.46, rowY[0], 50, "#fff", "#000");
    poly(ctx, W * 0.56, rowY[0], 35, 3); ctx.fillStyle = "#ef4444"; ctx.fill();
    outlinedText(ctx, "= 30", W * 0.72, rowY[0], 64, "#fde047", "#000");

    // Row 2: ▲ + ■ + ■ = 20
    poly(ctx, W * 0.16, rowY[1], 35, 3); ctx.fillStyle = "#ef4444"; ctx.fill();
    outlinedText(ctx, "+", W * 0.26, rowY[1], 50, "#fff", "#000");
    ctx.fillStyle = "#3b82f6"; rrect(ctx, W * 0.36 - 28, rowY[1] - 28, 56, 56, 8); ctx.fill();
    outlinedText(ctx, "+", W * 0.46, rowY[1], 50, "#fff", "#000");
    ctx.fillStyle = "#3b82f6"; rrect(ctx, W * 0.56 - 28, rowY[1] - 28, 56, 56, 8); ctx.fill();
    outlinedText(ctx, "= 20", W * 0.72, rowY[1], 64, "#fde047", "#000");

    // Row 3: ■ × ● = ?
    ctx.fillStyle = "#3b82f6"; rrect(ctx, W * 0.16 - 28, rowY[2] - 28, 56, 56, 8); ctx.fill();
    outlinedText(ctx, "×", W * 0.26, rowY[2], 50, "#fff", "#000");
    ctx.fillStyle = "#10b981"; ctx.beginPath(); ctx.arc(W * 0.36, rowY[2], 30, 0, Math.PI * 2); ctx.fill();
    outlinedText(ctx, "=", W * 0.46, rowY[2], 50, "#fff", "#000");
    outlinedText(ctx, "?", W * 0.6, rowY[2], 88, "#ec4899", "#000");

    drawBadge(ctx, "GENIUS TEST 🧠", W * 0.82, H * 0.12, "#ec4899", "#fff", 26, 4);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 88, "#ffffff", "#000"));
  } else {
    // V4: Split Brain Math Duel
    ctx.fillStyle = "#2e0854"; ctx.fillRect(0, 0, W / 2, H);
    ctx.fillStyle = "#022c22"; ctx.fillRect(W / 2, 0, W / 2, H);

    ctx.strokeStyle = "#ffd23f"; ctx.lineWidth = 14; ctx.lineJoin = "bevel";
    ctx.beginPath();
    ctx.moveTo(W * 0.54, 0); ctx.lineTo(W * 0.48, H * 0.35); ctx.lineTo(W * 0.56, H * 0.45); ctx.lineTo(W * 0.46, H);
    ctx.stroke();

    outlinedText(ctx, "SPEED", W * 0.25, H * 0.2, 48, "#a855f7", "#000");
    outlinedText(ctx, "15² = ?", W * 0.25, H * 0.42, 92, "#fde047", "#000");

    outlinedText(ctx, "LOGIC", W * 0.75, H * 0.2, 48, "#34d399", "#000");
    outlinedText(ctx, "√625 = ?", W * 0.75, H * 0.42, 92, "#67e8f9", "#000");

    drawBadge(ctx, "VS", W * 0.5, H * 0.4, "#ffd23f", "#000", 42, -6);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 88, "#ffffff", "#000"));
  }
}

// ==========================================
// 4. BRAIN TEASERS (5 DISTINCT COMPOSITIONS)
// ==========================================
export function drawBrainThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : "BEAT THE CLOCK";
  
  ctx.save();
  const { badgeX, badgeY, flip } = applyMicroLayout(ctx, W, H, layoutMicro);

  if (sceneType === 0) {
    // V0: Tactile Jigsaw Piece & Stopwatch Ring
    const bg = ctx.createRadialGradient(W * 0.76, H * 0.3, 30, W * 0.76, H * 0.3, W * 0.85);
    bg.addColorStop(0, "#123018"); bg.addColorStop(1, "#050c07");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const px = 60, py = 80, pw = 500, ph = 500, tx = pw / 6;
    ctx.save(); ctx.fillStyle = "#3fff6e";
    ctx.shadowColor = "rgba(0,0,0,0.6)"; ctx.shadowBlur = 34; ctx.shadowOffsetY = 20;
    ctx.beginPath();
    ctx.moveTo(px, py);
    ctx.lineTo(px + pw * 0.35, py); ctx.quadraticCurveTo(px + pw * 0.38, py - tx, px + pw * 0.5, py - tx * 1.6);
    ctx.quadraticCurveTo(px + pw * 0.62, py - tx, px + pw * 0.65, py); ctx.lineTo(px + pw, py);
    ctx.lineTo(px + pw, py + ph * 0.35); ctx.quadraticCurveTo(px + pw + tx, py + ph * 0.38, px + pw + tx * 1.6, py + ph * 0.5);
    ctx.quadraticCurveTo(px + pw + tx, py + ph * 0.62, px + pw, py + ph * 0.65); ctx.lineTo(px + pw, py + ph);
    ctx.lineTo(px + pw * 0.65, py + ph); ctx.quadraticCurveTo(px + pw * 0.62, py + ph + tx, px + pw * 0.5, py + ph + tx * 1.8);
    ctx.quadraticCurveTo(px + pw * 0.38, py + ph + tx, px + pw * 0.35, py + ph); ctx.lineTo(px, py + ph);
    ctx.closePath(); ctx.fill(); ctx.restore();

    outlinedText(ctx, "?", px + pw * 0.5, py + ph * 0.5, 260, "#0d1b0f", "#3fff6e");
    drawTimerRing(ctx, W * 0.84, H * 0.22, 88, "05", 0.3, "#ff3b3b", "#ffffff");
    drawBadge(ctx, "99% FAIL", W * 0.78, H * 0.54, "#3fff6e", "#0d1b0f", 30, 5);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.86 + (i - (lines.length - 1) / 2) * 92, W * 0.86, 92, "#3fff6e", "#000"));
  } else if (sceneType === 1) {
    // V1: Glowing Holographic Neural Brain
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#030712"); bg.addColorStop(1, "#0a102b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const bx = W * 0.5, by = H * 0.42;
    const nodes = [
      [-140, -60], [-80, -110], [0, -130], [80, -110], [140, -60],
      [-160, 10], [-90, 20], [0, 0], [90, 20], [160, 10],
      [-120, 90], [-40, 110], [40, 110], [120, 90], [0, 60]
    ];
    ctx.save();
    ctx.strokeStyle = "rgba(56, 189, 248, 0.4)"; ctx.lineWidth = 3;
    for (let i = 0; i < nodes.length; i++) {
      for (let j = i + 1; j < nodes.length; j++) {
        const d = Math.hypot(nodes[i][0] - nodes[j][0], nodes[i][1] - nodes[j][1]);
        if (d < 140) {
          ctx.beginPath(); ctx.moveTo(bx + nodes[i][0], by + nodes[i][1]); ctx.lineTo(bx + nodes[j][0], by + nodes[j][1]); ctx.stroke();
        }
      }
    }
    nodes.forEach(([nx, ny], idx) => {
      ctx.fillStyle = idx % 2 === 0 ? "#38bdf8" : "#f43f5e";
      ctx.shadowColor = ctx.fillStyle; ctx.shadowBlur = 18;
      ctx.beginPath(); ctx.arc(bx + nx, by + ny, 12, 0, Math.PI * 2); ctx.fill();
    });
    ctx.restore();

    drawBadge(ctx, "IQ LEVEL: 145+ ⚡", W * 0.5, H * 0.12, "#38bdf8", "#000", 30, 0);
    drawBadge(ctx, "GENIUS ONLY", W * 0.82, H * 0.22, "#f43f5e", "#fff", 24, 4);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 92, W * 0.86, 92, "#38bdf8", "#000"));
  } else if (sceneType === 2) {
    // V2: Impossible Optical Illusion (Penrose Triangle)
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#111827"); bg.addColorStop(1, "#030712");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const tx = W * 0.5, ty = H * 0.42;
    ctx.save();
    ctx.fillStyle = "#38bdf8"; ctx.beginPath();
    ctx.moveTo(tx, ty - 160); ctx.lineTo(tx + 140, ty + 90); ctx.lineTo(tx + 90, ty + 90);
    ctx.lineTo(tx, ty - 70); ctx.lineTo(tx - 90, ty + 90); ctx.lineTo(tx - 140, ty + 90); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#ec4899"; ctx.beginPath();
    ctx.moveTo(tx + 140, ty + 90); ctx.lineTo(tx - 140, ty + 90); ctx.lineTo(tx - 110, ty + 40);
    ctx.lineTo(tx + 70, ty + 40); ctx.lineTo(tx, ty - 90); ctx.lineTo(tx + 30, ty - 140); ctx.closePath(); ctx.fill();

    ctx.fillStyle = "#facc15"; ctx.beginPath();
    ctx.moveTo(tx - 140, ty + 90); ctx.lineTo(tx, ty - 160); ctx.lineTo(tx - 30, ty - 160);
    ctx.lineTo(tx - 120, ty); ctx.lineTo(tx + 30, ty); ctx.lineTo(tx + 10, ty + 40); ctx.closePath(); ctx.fill();
    ctx.restore();

    outlinedText(ctx, "?", tx, ty + 10, 160, "#ffffff", "#000");
    drawBadge(ctx, "OPTICAL ILLUSION 👁️", W * 0.5, H * 0.1, "#facc15", "#000", 28, 0);

    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.85 + (i - (lines.length - 1) / 2) * 92, W * 0.86, 92, "#ffffff", "#ec4899"));
  } else if (sceneType === 3) {
    // V3: Noir Detective Dossier / Mystery Clue
    const bg = ctx.createRadialGradient(W * 0.5, H * 0.45, 40, W * 0.5, H * 0.45, W * 0.8);
    bg.addColorStop(0, "#2c1c0f"); bg.addColorStop(1, "#0d0703");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const fx = W * 0.25, fy = H * 0.12, fw = W * 0.5, fh = 360;
    ctx.fillStyle = "#d4a373"; rrect(ctx, fx, fy, fw, fh, 16); ctx.fill();
    ctx.strokeStyle = "#8b5e34"; ctx.lineWidth = 4; rrect(ctx, fx, fy, fw, fh, 16); ctx.stroke();

    ctx.save(); ctx.translate(fx + fw * 0.5, fy + 80); ctx.rotate(-0.14);
    ctx.strokeStyle = "#dc2626"; ctx.lineWidth = 6; ctx.strokeRect(-160, -35, 320, 70);
    outlinedText(ctx, "CONFIDENTIAL", 0, 0, 44, "#dc2626", "transparent");
    ctx.restore();

    outlinedText(ctx, "EVIDENCE #809", fx + fw * 0.5, fy + 190, 48, "#432818", "#8b5e34");

    const mx = W * 0.74, my = H * 0.44;
    ctx.save();
    ctx.strokeStyle = "#ffd700"; ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.15)"; ctx.beginPath(); ctx.arc(mx, my, 80, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#78350f"; ctx.lineWidth = 22; ctx.lineCap = "round";
    ctx.beginPath(); ctx.moveTo(mx + 60, my + 60); ctx.lineTo(mx + 130, my + 130); ctx.stroke();
    ctx.restore();

    drawBadge(ctx, "CAN YOU SOLVE IT? 🔍", W * 0.5, H * 0.08, "#dc2626", "#fff", 28, 0);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.86 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 90, "#ffd700", "#000"));
  } else {
    // V4: 3x3 Memory Card Grid Challenge
    const bg = ctx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0, "#09090b"); bg.addColorStop(1, "#18181b");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const gw = 480, gh = 340, gx = (W - gw) / 2, gy = H * 0.15;
    const cw = (gw - 30) / 3, ch = (gh - 30) / 3;
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const x = gx + c * (cw + 15), y = gy + r * (ch + 15);
        const isFlipped = (r === 0 && c === 1) || (r === 2 && c === 1);
        ctx.fillStyle = isFlipped ? "rgba(59, 130, 246, 0.3)" : "rgba(39, 39, 42, 0.9)";
        rrect(ctx, x, y, cw, ch, 12); ctx.fill();
        ctx.strokeStyle = isFlipped ? "#60a5fa" : "#52525b"; ctx.lineWidth = isFlipped ? 4 : 2;
        rrect(ctx, x, y, cw, ch, 12); ctx.stroke();

        if (isFlipped) {
          outlinedText(ctx, "★", x + cw / 2, y + ch / 2, 48, "#fbbf24", "#000");
        } else {
          outlinedText(ctx, String(r * 3 + c + 1), x + cw / 2, y + ch / 2, 36, "#71717a", "#000");
        }
      }
    }

    drawBadge(ctx, "MEMORY TEST 🧠", W * 0.5, H * 0.08, "#60a5fa", "#000", 26, 0);
    const lines = splitHeadline(hook);
    lines.forEach((ln, i) => fitOutlinedText(ctx, ln, W / 2, H * 0.86 + (i - (lines.length - 1) / 2) * 90, W * 0.86, 90, "#ffffff", "#000"));
  }
}

// ==========================================
// 5. STORY (5 DISTINCT COMPOSITIONS)
// ==========================================
export function drawStoryThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, titleText: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);

  if (sceneType === 0) {
    // V0: Moonlit Cottage on Twilight Hill
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    ["#1a1030", "#4a1f45", "#a84a35", "#d97f3f"].forEach((c, i) => sky.addColorStop(i / 3, c));
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    const mx = W * 0.78, my = H * 0.22;
    const mg = ctx.createRadialGradient(mx, my, 0, mx, my, 120);
    mg.addColorStop(0, "rgba(255,233,176,0.6)"); mg.addColorStop(1, "transparent");
    ctx.fillStyle = mg; ctx.fillRect(mx - 130, my - 130, 260, 260);
    ctx.fillStyle = "#ffe9b0"; ctx.beginPath(); ctx.arc(mx, my, 54, 0, Math.PI * 2); ctx.fill();

    ctx.fillStyle = "#2f1638"; ctx.beginPath(); ctx.moveTo(0, H * 0.6);
    ctx.bezierCurveTo(W * 0.3, H * 0.52, W * 0.6, H * 0.68, W, H * 0.55); ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    ctx.fillStyle = "#160a1e";
    ctx.beginPath(); ctx.moveTo(W * 0.15, H * 0.6); ctx.lineTo(W * 0.25, H * 0.48); ctx.lineTo(W * 0.35, H * 0.6); ctx.closePath(); ctx.fill();
    ctx.fillRect(W * 0.17, H * 0.6, W * 0.16, 70);
    ctx.fillStyle = "#fbbf24"; ctx.fillRect(W * 0.22, H * 0.63, 24, 28);

    drawBadge(ctx, "BEDTIME STORY 🌙", W * 0.82, H * 0.6, "#fbbf24", "#000", 24, 0);
  } else if (sceneType === 1) {
    // V1: Misty Deep Forest & Solitary Lantern Traveler
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#031317"); sky.addColorStop(0.6, "#08333e"); sky.addColorStop(1, "#185868");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    const drawTree = (tx: number, ty: number, tw: number, th: number) => {
      ctx.fillStyle = "#020b0d"; ctx.beginPath();
      ctx.moveTo(tx, ty); ctx.lineTo(tx + tw / 2, ty + th * 0.35); ctx.lineTo(tx + tw * 0.3, ty + th * 0.35);
      ctx.lineTo(tx + tw * 0.45, ty + th * 0.7); ctx.lineTo(tx + tw * 0.25, ty + th * 0.7);
      ctx.lineTo(tx + tw * 0.5, ty + th); ctx.lineTo(tx - tw * 0.5, ty + th);
      ctx.lineTo(tx - tw * 0.25, ty + th * 0.7); ctx.lineTo(tx - tw * 0.45, ty + th * 0.7);
      ctx.lineTo(tx - tw * 0.3, ty + th * 0.35); ctx.lineTo(tx - tw / 2, ty + th * 0.35); ctx.closePath(); ctx.fill();
    };
    drawTree(120, 100, 180, 500); drawTree(240, 180, 150, 420);
    drawTree(W - 140, 120, 200, 480); drawTree(W - 260, 200, 140, 400);

    ctx.fillStyle = "rgba(255,255,255,0.12)";
    ctx.fillRect(0, H * 0.55, W, 80); ctx.fillRect(0, H * 0.65, W, 100);

    const lx = W * 0.42, ly = H * 0.62;
    ctx.fillStyle = "#020b0d";
    ctx.beginPath(); ctx.arc(lx, ly - 35, 14, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(lx - 12, ly - 20, 24, 55);

    const lg = ctx.createRadialGradient(lx + 25, ly - 5, 0, lx + 25, ly - 5, 80);
    lg.addColorStop(0, "rgba(251, 191, 36, 0.9)"); lg.addColorStop(1, "transparent");
    ctx.fillStyle = lg; ctx.fillRect(lx - 55, ly - 85, 160, 160);
    ctx.fillStyle = "#fef08a"; ctx.fillRect(lx + 20, ly - 12, 12, 16);

    drawBadge(ctx, "ORIGINAL FICTION 🌲", W * 0.82, H * 0.6, "#22d3ee", "#000", 24, 0);
  } else if (sceneType === 2) {
    // V2: Stormy Ocean & Lighthouse Lightbeam
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#050b14"); sky.addColorStop(0.5, "#0f172a"); sky.addColorStop(1, "#1e293b");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    const cx = W * 0.18, cy = H * 0.35;
    ctx.fillStyle = "#020617";
    ctx.beginPath(); ctx.moveTo(cx - 30, cy + 240); ctx.lineTo(cx + 30, cy + 240); ctx.lineTo(cx + 18, cy); ctx.lineTo(cx - 18, cy); ctx.closePath(); ctx.fill();
    ctx.fillRect(cx - 26, cy - 20, 52, 20);

    ctx.save();
    const beam = ctx.createRadialGradient(cx, cy - 10, 10, cx + 450, cy + 80, 550);
    beam.addColorStop(0, "rgba(254, 240, 138, 0.85)"); beam.addColorStop(1, "transparent");
    ctx.fillStyle = beam;
    ctx.beginPath(); ctx.moveTo(cx, cy - 10); ctx.lineTo(W, cy - 120); ctx.lineTo(W, cy + 220); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#091220";
    ctx.beginPath(); ctx.moveTo(0, H * 0.68);
    for (let x = 0; x <= W; x += 160) ctx.quadraticCurveTo(x + 80, H * 0.64, x + 160, H * 0.68);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    drawBadge(ctx, "TALES OF THE SEA 🌊", W * 0.82, H * 0.6, "#38bdf8", "#000", 24, 0);
  } else if (sceneType === 3) {
    // V3: Cosmic Voyage / Crescent Planet & Nebula
    const bg = ctx.createRadialGradient(W * 0.3, H * 0.4, 60, W * 0.3, H * 0.4, W * 0.9);
    bg.addColorStop(0, "#4a154b"); bg.addColorStop(0.5, "#1e0b36"); bg.addColorStop(1, "#05010d");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#fff";
    for (let i = 0; i < 50; i++) ctx.fillRect((i * 187) % W, (i * 123) % H, (i % 3) + 1, (i % 3) + 1);

    const px = W * 0.34, py = H * 0.42, pr = 150;
    const pg = ctx.createRadialGradient(px - 50, py - 50, 10, px, py, pr);
    pg.addColorStop(0, "#67e8f9"); pg.addColorStop(0.7, "#0891b2"); pg.addColorStop(1, "transparent");
    ctx.fillStyle = pg; ctx.beginPath(); ctx.arc(px, py, pr, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = "#05010d"; ctx.beginPath(); ctx.arc(px + 45, py + 20, pr * 0.95, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "SCI-FI AUDIOBOOK 🚀", W * 0.82, H * 0.6, "#c084fc", "#000", 24, 0);
  } else {
    // V4: Gothic Castle Spires at Blood Twilight
    const sky = ctx.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#270838"); sky.addColorStop(0.5, "#701a38"); sky.addColorStop(1, "#d9461e");
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "#0d0214";
    const drawSpire = (sx: number, sy: number, sw: number, sh: number) => {
      ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + sw / 2, sy + sh); ctx.lineTo(sx - sw / 2, sy + sh); ctx.closePath(); ctx.fill();
      ctx.fillRect(sx - sw / 3, sy + sh, (sw * 2) / 3, H - (sy + sh));
    };
    drawSpire(W * 0.22, H * 0.22, 60, 220);
    drawSpire(W * 0.32, H * 0.16, 80, 260);
    drawSpire(W * 0.42, H * 0.28, 50, 180);
    ctx.fillRect(W * 0.12, H * 0.48, W * 0.38, H * 0.52);

    drawBadge(ctx, "GOTHIC MYSTERY 🦇", W * 0.82, H * 0.6, "#f97316", "#000", 24, 0);
  }

  // Story Title (italic bold serif on bottom right)
  ctx.save();
  ctx.textAlign = "right"; ctx.textBaseline = "middle";
  let fontSize = 92;
  ctx.font = `italic 900 ${fontSize}px "Playfair Display", "Georgia", serif`;
  const lines = splitHeadline(titleText);
  while (ctx.measureText(lines[0]).width > W * 0.62 && fontSize > 40) {
    fontSize -= 4;
    ctx.font = `italic 900 ${fontSize}px "Playfair Display", "Georgia", serif`;
  }
  const titleBottom = H * 0.88;
  lines.reverse().forEach((line, i) => {
    const y = titleBottom - i * (fontSize * 1.08);
    ctx.shadowColor = "rgba(0,0,0,0.8)"; ctx.shadowBlur = 24;
    ctx.fillStyle = "#ffffff"; ctx.fillText(line, W * 0.94, y);
    ctx.shadowBlur = 0;
  });
  ctx.restore();
}

// ==========================================
// 6. CALM (5 DISTINCT COMPOSITIONS)
// ==========================================
export function drawCalmThumbnail(ctx: C2D, comp: Composition, p: Palette, W: number, H: number, variant: number, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(variant);
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["BREATHE", "SLOW DOWN", "RESET YOUR MIND", "QUIET MINUTES", "JUST BREATHE"][sceneType % 5];

  if (sceneType === 0) {
    // V0: Concentric Expanding Breathing Waves
    ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
    for (let r = 260; r > 40; r -= 36) {
      ctx.fillStyle = hexA(p.accent, 0.08); ctx.beginPath(); ctx.arc(W / 2, H * 0.42, r, 0, Math.PI * 2); ctx.fill();
    }
    ctx.strokeStyle = p.accent; ctx.lineWidth = 18;
    ctx.beginPath(); ctx.arc(W / 2, H * 0.42, 160, 0, Math.PI * 2); ctx.stroke();
    drawBadge(ctx, "MEDITATION", W * 0.5, H * 0.12, p.accent, p.bg, 26, 0);
  } else if (sceneType === 1) {
    // V1: Zen Balancing Stones (Cairn) on Reflecting Water
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#2d1b4e"); bg.addColorStop(0.55, "#e07a5f"); bg.addColorStop(1, "#1d3557");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = "rgba(255, 220, 160, 0.85)"; ctx.beginPath(); ctx.arc(W * 0.5, H * 0.55, 90, Math.PI, 0); ctx.fill();
    ctx.fillStyle = "rgba(10, 20, 40, 0.7)"; ctx.fillRect(0, H * 0.55, W, H * 0.45);

    const bx = W * 0.5, by = H * 0.55;
    ctx.fillStyle = "#0c0714";
    ctx.beginPath(); ctx.ellipse(bx, by - 12, 110, 28, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx, by - 55, 85, 24, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx, by - 95, 65, 20, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx, by - 130, 45, 16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(bx, by - 160, 28, 14, 0, 0, Math.PI * 2); ctx.fill();

    drawBadge(ctx, "DEEP RELAXATION", W * 0.5, H * 0.1, "#f4a261", "#000", 26, 0);
  } else if (sceneType === 2) {
    // V2: Sacred Lotus Mandala
    ctx.fillStyle = "#071318"; ctx.fillRect(0, 0, W, H);
    const cx = W * 0.5, cy = H * 0.42;

    ctx.save();
    for (let i = 0; i < 12; i++) {
      ctx.save(); ctx.translate(cx, cy); ctx.rotate((i * Math.PI) / 6);
      ctx.fillStyle = "rgba(45, 212, 191, 0.25)"; ctx.strokeStyle = "#2dd4bf"; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.ellipse(0, -90, 45, 90, 0, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#fef08a"; ctx.beginPath(); ctx.arc(cx, cy, 32, 0, Math.PI * 2); ctx.fill();
    ctx.restore();

    drawBadge(ctx, "INNER PEACE", W * 0.5, H * 0.1, "#2dd4bf", "#000", 26, 0);
  } else if (sceneType === 3) {
    // V3: Northern Lights Aurora Borealis
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#030b14"); bg.addColorStop(0.5, "#081c24"); bg.addColorStop(1, "#03080e");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    ctx.save();
    const aGrad = ctx.createLinearGradient(0, 50, W, 250);
    aGrad.addColorStop(0, "rgba(52, 211, 153, 0.7)"); aGrad.addColorStop(0.5, "rgba(168, 85, 247, 0.6)"); aGrad.addColorStop(1, "transparent");
    ctx.fillStyle = aGrad;
    ctx.beginPath(); ctx.moveTo(0, 180);
    ctx.bezierCurveTo(W * 0.25, 40, W * 0.6, 260, W, 80);
    ctx.lineTo(W, 300); ctx.bezierCurveTo(W * 0.5, 420, W * 0.2, 160, 0, 320); ctx.closePath(); ctx.fill();
    ctx.restore();

    ctx.fillStyle = "#030712";
    ctx.beginPath(); ctx.moveTo(0, H * 0.6);
    ctx.lineTo(W * 0.2, H * 0.45); ctx.lineTo(W * 0.45, H * 0.58); ctx.lineTo(W * 0.75, H * 0.42); ctx.lineTo(W, H * 0.55);
    ctx.lineTo(W, H); ctx.lineTo(0, H); ctx.fill();

    drawBadge(ctx, "SLEEP SOUNDS", W * 0.5, H * 0.1, "#34d399", "#000", 26, 0);
  } else {
    // V4: Minimalist Horizon & Floating Pastel Glass Orb
    const bg = ctx.createLinearGradient(0, 0, 0, H);
    bg.addColorStop(0, "#1e1b4b"); bg.addColorStop(0.6, "#f43f5e"); bg.addColorStop(1, "#fde047");
    ctx.fillStyle = bg; ctx.fillRect(0, 0, W, H);

    const ox = W * 0.5, oy = H * 0.44;
    const og = ctx.createRadialGradient(ox - 30, oy - 30, 20, ox, oy, 130);
    og.addColorStop(0, "rgba(255,255,255,0.7)"); og.addColorStop(0.7, "rgba(255,255,255,0.2)"); og.addColorStop(1, "transparent");
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(ox, oy, 130, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "rgba(255,255,255,0.8)"; ctx.lineWidth = 4; ctx.stroke();

    ctx.strokeStyle = "rgba(255,255,255,0.4)"; ctx.lineWidth = 5;
    ctx.beginPath();
    for (let x = 0; x <= W; x += 10) {
      const y = H * 0.58 + Math.sin(x * 0.02) * 24;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    drawBadge(ctx, "SERENITY", W * 0.5, H * 0.1, "#ffffff", "#000", 26, 0);
  }

  fitOutlinedText(ctx, hook, W / 2, H * 0.84, W * 0.84, 94, "#ffffff", "#000");
}


// ==========================================
// 7. RIDDLES (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawRiddlesThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["CAN YOU SOLVE IT?", "THINK ABOUT IT", "MYSTERY TIME", "BRAIN BENDER", "WHAT AM I?", "RIDDLE THIS", "GOT THE ANSWER?", "PUZZLE TIME", "FIGURE IT OUT", "USE YOUR BRAIN"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Giant Question Mark
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${H * 0.65}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W * 0.5, H * 0.45);

    // Glow
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 40;
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${H * 0.65}px Arial`;
    ctx.fillText("?", W * 0.5, H * 0.45);
    ctx.shadowBlur = 0;

  } else if (sceneType === 1) {
    // Lock and Key
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Lock
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.35, H * 0.45, W * 0.3, H * 0.25);
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.45, W * 0.12, Math.PI, 0, true);
    ctx.lineWidth = W * 0.06;
    ctx.strokeStyle = colors.primary;
    ctx.stroke();

    // Keyhole
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.54, W * 0.04, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillRect(W * 0.48, H * 0.54, W * 0.04, H * 0.08);

  } else if (sceneType === 2) {
    // Brain Maze
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Brain outline
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.25, 0, Math.PI * 2);
    ctx.stroke();

    // Maze lines
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 4;
    for (let i = 0; i < 8; i++) {
      ctx.beginPath();
      const angle = (i / 8) * Math.PI * 2;
      const x1 = W * 0.5 + Math.cos(angle) * W * 0.15;
      const y1 = H * 0.5 + Math.sin(angle) * W * 0.15;
      const x2 = W * 0.5 + Math.cos(angle) * W * 0.25;
      const y2 = H * 0.5 + Math.sin(angle) * W * 0.25;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

  } else if (sceneType === 3) {
    // Light Bulb Moment
    const grad = ctx.createLinearGradient(0, H, W, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Bulb
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.4, W * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Glow
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 60;
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.4, W * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Base
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.45, H * 0.52, W * 0.1, H * 0.08);

    // Rays
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 6;
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2 - Math.PI / 2;
      ctx.beginPath();
      ctx.moveTo(W * 0.5 + Math.cos(angle) * W * 0.18, H * 0.4 + Math.sin(angle) * W * 0.18);
      ctx.lineTo(W * 0.5 + Math.cos(angle) * W * 0.26, H * 0.4 + Math.sin(angle) * W * 0.26);
      ctx.stroke();
    }

  } else if (sceneType === 4) {
    // Thinking Head Silhouette
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Head
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.45, W * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Question marks floating
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("?", W * 0.3, H * 0.3);
    ctx.fillText("?", W * 0.7, H * 0.35);
    ctx.fillText("?", W * 0.6, H * 0.25);

  } else if (sceneType === 5) {
    // Puzzle Piece
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.6);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Puzzle piece shape
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(W * 0.3, H * 0.35);
    ctx.lineTo(W * 0.7, H * 0.35);
    ctx.lineTo(W * 0.7, H * 0.65);
    ctx.lineTo(W * 0.3, H * 0.65);
    ctx.closePath();
    ctx.fill();

    // Tab
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.35, W * 0.08, 0, Math.PI, true);
    ctx.fill();

    // Notch
    ctx.fillStyle = colors.bg;
    ctx.beginPath();
    ctx.arc(W * 0.7, H * 0.5, W * 0.08, Math.PI * 1.5, Math.PI * 0.5);
    ctx.fill();

  } else if (sceneType === 6) {
    // Detective Magnifying Glass
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Glass
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(W * 0.45, H * 0.4, W * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Handle
    ctx.beginPath();
    ctx.moveTo(W * 0.58, H * 0.52);
    ctx.lineTo(W * 0.75, H * 0.7);
    ctx.lineWidth = 12;
    ctx.strokeStyle = colors.primary;
    ctx.stroke();

    // Question mark inside glass
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.15}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W * 0.45, H * 0.4);

  } else if (sceneType === 7) {
    // Mystery Box
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Box
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.25, H * 0.45, W * 0.5, H * 0.35);

    // Lid
    ctx.fillStyle = colors.secondary;
    ctx.fillRect(W * 0.22, H * 0.4, W * 0.56, H * 0.08);

    // Question mark emerging
    ctx.fillStyle = colors.accent;
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 30;
    ctx.font = `bold ${W * 0.18}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("?", W * 0.5, H * 0.28);
    ctx.shadowBlur = 0;

  } else if (sceneType === 8) {
    // Word Cloud
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const words = ["WHAT", "WHY", "HOW", "WHO", "WHEN", "WHERE"];
    ctx.fillStyle = colors.primary;
    ctx.textAlign = "center";
    for (let i = 0; i < words.length; i++) {
      const angle = (i / words.length) * Math.PI * 2;
      const radius = W * 0.25;
      const x = W * 0.5 + Math.cos(angle) * radius;
      const y = H * 0.5 + Math.sin(angle) * radius;
      ctx.font = `bold ${W * 0.08}px Arial`;
      ctx.fillText(words[i], x, y);
    }

    // Central question mark
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.2}px Arial`;
    ctx.fillText("?", W * 0.5, H * 0.5);

  } else {
    // Labyrinth Path
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Spiral path
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 8;
    ctx.beginPath();
    for (let i = 0; i < 100; i++) {
      const angle = (i / 100) * Math.PI * 6;
      const radius = (i / 100) * W * 0.3;
      const x = W * 0.5 + Math.cos(angle) * radius;
      const y = H * 0.5 + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.stroke();

    // Destination
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.05, 0, Math.PI * 2);
    ctx.fill();
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.85, W * 0.88, 96, colors.primary, colors.bg);
}

// ==========================================
// 8. TRIVIA (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawTriviaThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["DO YOU KNOW?", "QUIZ TIME", "TEST YOUR KNOWLEDGE", "TRUE OR FALSE?", "THINK FAST", "TRIVIA CHALLENGE", "HOW MANY CAN YOU GET?", "BRAIN QUIZ", "ANSWER THIS", "FACT CHECK"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Multiple Choice Grid
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const options = ["A", "B", "C", "D"];
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${W * 0.15}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * W * 0.5 + W * 0.25;
      const y = Math.floor(i / 2) * H * 0.35 + H * 0.3;
      
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 6;
      ctx.strokeRect(x - W * 0.15, y - H * 0.1, W * 0.3, H * 0.2);
      
      ctx.fillStyle = i === 2 ? colors.accent : colors.primary;
      ctx.fillText(options[i], x, y);
    }

  } else if (sceneType === 1) {
    // Quiz Show Podium
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Podium
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(W * 0.35, H * 0.7);
    ctx.lineTo(W * 0.65, H * 0.7);
    ctx.lineTo(W * 0.6, H * 0.45);
    ctx.lineTo(W * 0.4, H * 0.45);
    ctx.closePath();
    ctx.fill();

    // Screen
    ctx.fillStyle = colors.accent;
    ctx.fillRect(W * 0.42, H * 0.5, W * 0.16, H * 0.15);

    // Score lights
    for (let i = 0; i < 5; i++) {
      ctx.fillStyle = i < 3 ? colors.accent : colors.secondary;
      ctx.beginPath();
      ctx.arc(W * 0.3 + i * W * 0.1, H * 0.28, W * 0.03, 0, Math.PI * 2);
      ctx.fill();
    }

  } else if (sceneType === 2) {
    // Book Stack
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.6);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Books
    const bookColors = [colors.primary, colors.accent, colors.secondary, colors.primary];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = bookColors[i];
      ctx.fillRect(W * 0.35, H * 0.65 - i * H * 0.12, W * 0.3, H * 0.1);
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 2;
      ctx.strokeRect(W * 0.35, H * 0.65 - i * H * 0.12, W * 0.3, H * 0.1);
    }

    // Question mark on top
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("?", W * 0.5, H * 0.25);

  } else if (sceneType === 3) {
    // Brain with Checkmark
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Brain
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.45, W * 0.22, 0, Math.PI * 2);
    ctx.fill();

    // Checkmark
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 12;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(W * 0.38, H * 0.45);
    ctx.lineTo(W * 0.46, H * 0.52);
    ctx.lineTo(W * 0.62, H * 0.35);
    ctx.stroke();

  } else if (sceneType === 4) {
    // Trophy
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Cup
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.moveTo(W * 0.35, H * 0.35);
    ctx.lineTo(W * 0.3, H * 0.55);
    ctx.lineTo(W * 0.7, H * 0.55);
    ctx.lineTo(W * 0.65, H * 0.35);
    ctx.closePath();
    ctx.fill();

    // Handles
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(W * 0.28, H * 0.42, W * 0.06, Math.PI, Math.PI * 1.5);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(W * 0.72, H * 0.42, W * 0.06, Math.PI * 1.5, Math.PI * 2);
    ctx.stroke();

    // Base
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.42, H * 0.55, W * 0.16, H * 0.05);
    ctx.fillRect(W * 0.38, H * 0.6, W * 0.24, H * 0.05);

    // Star
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("★", W * 0.5, H * 0.44);

  } else if (sceneType === 5) {
    // Lightboard
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Board frame
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.2, H * 0.25, W * 0.6, H * 0.5);

    // Light bulbs
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 === 0 ? colors.accent : colors.secondary;
      ctx.beginPath();
      ctx.arc(W * 0.25 + i * W * 0.07, H * 0.3, W * 0.02, 0, Math.PI * 2);
      ctx.fill();
      ctx.arc(W * 0.25 + i * W * 0.07, H * 0.7, W * 0.02, 0, Math.PI * 2);
      ctx.fill();
    }

    // "?" in center
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.2}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("?", W * 0.5, H * 0.5);

  } else if (sceneType === 6) {
    // Scoreboard
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Board
    ctx.fillStyle = colors.primary;
    ctx.fillRect(W * 0.2, H * 0.3, W * 0.6, H * 0.4);

    // Score display
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.18}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("100", W * 0.5, H * 0.52);

    // Label
    ctx.fillStyle = colors.bg;
    ctx.font = `${W * 0.06}px Arial`;
    ctx.fillText("SCORE", W * 0.5, H * 0.62);

  } else if (sceneType === 7) {
    // Buzzer
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Button
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.2, 0, Math.PI * 2);
    ctx.fill();

    // Highlight
    ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
    ctx.beginPath();
    ctx.arc(W * 0.48, H * 0.47, W * 0.12, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.2)";
    ctx.beginPath();
    ctx.ellipse(W * 0.5, H * 0.68, W * 0.22, W * 0.08, 0, 0, Math.PI * 2);
    ctx.fill();

    // Text on button
    ctx.fillStyle = colors.bg;
    ctx.font = `bold ${W * 0.08}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("BUZZ", W * 0.5, H * 0.52);

  } else if (sceneType === 8) {
    // Flash Cards
    const grad = ctx.createLinearGradient(W, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Cards stacked
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.rotate((i - 1) * 0.15);
      ctx.fillStyle = i === 1 ? colors.primary : colors.secondary;
      ctx.fillRect(-W * 0.25, -H * 0.2, W * 0.5, H * 0.4);
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 3;
      ctx.strokeRect(-W * 0.25, -H * 0.2, W * 0.5, H * 0.4);
      ctx.restore();
    }

    // Question mark on front card
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.15}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("?", W * 0.5, H * 0.52);

  } else {
    // Checkboxes
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Checkboxes
    for (let i = 0; i < 4; i++) {
      const y = H * 0.25 + i * H * 0.16;
      
      // Box
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 5;
      ctx.strokeRect(W * 0.25, y, W * 0.1, W * 0.1);
      
      // Checkmark on one
      if (i === 2) {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(W * 0.27, y + W * 0.05);
        ctx.lineTo(W * 0.3, y + W * 0.08);
        ctx.lineTo(W * 0.33, y + W * 0.02);
        ctx.stroke();
      }
      
      // Line
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(W * 0.4, y + W * 0.05);
      ctx.lineTo(W * 0.7, y + W * 0.05);
      ctx.stroke();
    }
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.87, W * 0.88, 96, colors.primary, colors.bg);
}


// ==========================================
// 9. MEMORY CHALLENGES (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawMemoryThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["REMEMBER THIS", "CAN YOU RECALL?", "MEMORY TEST", "PATTERN CHALLENGE", "SEQUENCE RECALL", "FOCUS NOW", "WATCH CAREFULLY", "BRAIN MEMORY", "RECALL IT", "MEMORY MASTER"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Grid Pattern Memory
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const gridSize = 4;
    const cellSize = W * 0.15;
    const startX = W * 0.5 - (gridSize * cellSize) / 2;
    const startY = H * 0.5 - (gridSize * cellSize) / 2;

    for (let i = 0; i < gridSize; i++) {
      for (let j = 0; j < gridSize; j++) {
        const highlight = (i + j) % 3 === 0;
        ctx.fillStyle = highlight ? colors.accent : colors.primary;
        ctx.fillRect(startX + j * cellSize + 5, startY + i * cellSize + 5, cellSize - 10, cellSize - 10);
        
        if (highlight) {
          ctx.shadowColor = colors.accent;
          ctx.shadowBlur = 20;
          ctx.fillRect(startX + j * cellSize + 5, startY + i * cellSize + 5, cellSize - 10, cellSize - 10);
          ctx.shadowBlur = 0;
        }
      }
    }

  } else if (sceneType === 1) {
    // Sequence Numbers
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const numbers = [1, 2, 3, 4, 5];
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    numbers.forEach((num, i) => {
      const x = W * 0.2 + i * W * 0.15;
      const y = H * 0.5;
      
      ctx.fillStyle = i === 2 ? colors.accent : colors.primary;
      ctx.beginPath();
      ctx.arc(x, y, W * 0.08, 0, Math.PI * 2);
      ctx.fill();
      
      ctx.fillStyle = colors.bg;
      ctx.fillText(String(num), x, y);
    });

  } else if (sceneType === 2) {
    // Card Flip Memory
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const cardW = W * 0.18;
    const cardH = H * 0.3;
    const positions = [
      { x: W * 0.25, y: H * 0.35 },
      { x: W * 0.5, y: H * 0.35 },
      { x: W * 0.75, y: H * 0.35 },
      { x: W * 0.375, y: H * 0.65 },
      { x: W * 0.625, y: H * 0.65 },
    ];

    positions.forEach((pos, i) => {
      const flipped = i < 2;
      ctx.save();
      ctx.translate(pos.x, pos.y);
      
      if (flipped) {
        ctx.fillStyle = colors.accent;
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        ctx.fillStyle = colors.bg;
        ctx.font = `bold ${cardW * 0.5}px Arial`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("★", 0, 0);
      } else {
        ctx.fillStyle = colors.primary;
        ctx.fillRect(-cardW / 2, -cardH / 2, cardW, cardH);
        ctx.strokeStyle = colors.bg;
        ctx.lineWidth = 3;
        ctx.strokeRect(-cardW / 2, -cardH / 2, cardW, cardH);
      }
      
      ctx.restore();
    });

  } else if (sceneType === 3) {
    // Brain with Gears
    const grad = ctx.createLinearGradient(W, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Brain outline
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.25, 0, Math.PI * 2);
    ctx.fill();

    // Gears inside
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 8;
    for (let i = 0; i < 3; i++) {
      const angle = (i / 3) * Math.PI * 2;
      const x = W * 0.5 + Math.cos(angle) * W * 0.12;
      const y = H * 0.5 + Math.sin(angle) * W * 0.12;
      ctx.beginPath();
      ctx.arc(x, y, W * 0.06, 0, Math.PI * 2);
      ctx.stroke();
    }

  } else if (sceneType === 4) {
    // Spotlight Memory
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.4, 0, W * 0.5, H * 0.4, W * 0.6);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(0.6, colors.bg);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Spotlight beam
    ctx.fillStyle = colors.accent;
    ctx.shadowColor = colors.accent;
    ctx.shadowBlur = 50;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Item in spotlight
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.fillText("👁", W * 0.5, H * 0.52);

  } else if (sceneType === 5) {
    // Pattern Blocks
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const blockSize = W * 0.12;
    const shapes = ["circle", "square", "triangle"];
    
    for (let i = 0; i < 6; i++) {
      const x = W * 0.25 + (i % 3) * W * 0.25;
      const y = H * 0.4 + Math.floor(i / 3) * H * 0.3;
      const shape = shapes[i % 3];
      
      ctx.fillStyle = i < 3 ? colors.accent : colors.primary;
      
      if (shape === "circle") {
        ctx.beginPath();
        ctx.arc(x, y, blockSize / 2, 0, Math.PI * 2);
        ctx.fill();
      } else if (shape === "square") {
        ctx.fillRect(x - blockSize / 2, y - blockSize / 2, blockSize, blockSize);
      } else {
        ctx.beginPath();
        ctx.moveTo(x, y - blockSize / 2);
        ctx.lineTo(x + blockSize / 2, y + blockSize / 2);
        ctx.lineTo(x - blockSize / 2, y + blockSize / 2);
        ctx.closePath();
        ctx.fill();
      }
    }

  } else if (sceneType === 6) {
    // Color Sequence
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const colorSequence = [colors.accent, colors.primary, colors.accent, colors.secondary, colors.primary];
    const boxW = W * 0.15;
    const boxH = H * 0.25;

    colorSequence.forEach((col, i) => {
      const x = W * 0.15 + i * W * 0.17;
      const y = H * 0.4;
      
      ctx.fillStyle = col;
      ctx.fillRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 4;
      ctx.strokeRect(x - boxW / 2, y - boxH / 2, boxW, boxH);
    });

  } else if (sceneType === 7) {
    // Timer Challenge
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Clock face
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.arc(W * 0.5, H * 0.5, W * 0.22, 0, Math.PI * 2);
    ctx.stroke();

    // Clock hands
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 8;
    ctx.lineCap = "round";
    
    // Hour hand
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.5);
    ctx.lineTo(W * 0.5, H * 0.35);
    ctx.stroke();
    
    // Minute hand
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.5);
    ctx.lineTo(W * 0.65, H * 0.5);
    ctx.stroke();

  } else if (sceneType === 8) {
    // Memory Trail
    const grad = ctx.createLinearGradient(W, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Dots connected by lines
    const points = [
      { x: W * 0.2, y: H * 0.3 },
      { x: W * 0.4, y: H * 0.45 },
      { x: W * 0.6, y: H * 0.35 },
      { x: W * 0.8, y: H * 0.55 },
    ];

    // Lines
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 6;
    ctx.beginPath();
    points.forEach((p, i) => {
      if (i === 0) ctx.moveTo(p.x, p.y);
      else ctx.lineTo(p.x, p.y);
    });
    ctx.stroke();

    // Dots
    points.forEach((p, i) => {
      ctx.fillStyle = i === 2 ? colors.accent : colors.primary;
      ctx.shadowColor = i === 2 ? colors.accent : "transparent";
      ctx.shadowBlur = i === 2 ? 20 : 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, W * 0.04, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.shadowBlur = 0;

  } else {
    // Flash Cards
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Stack of cards
    for (let i = 0; i < 3; i++) {
      ctx.save();
      ctx.translate(W * 0.5, H * 0.5);
      ctx.rotate((i - 1) * 0.1);
      
      ctx.fillStyle = i === 1 ? colors.accent : colors.primary;
      ctx.fillRect(-W * 0.25, -H * 0.2, W * 0.5, H * 0.4);
      
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 4;
      ctx.strokeRect(-W * 0.25, -H * 0.2, W * 0.5, H * 0.4);
      
      ctx.restore();
    }
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.87, W * 0.88, 96, colors.primary, colors.bg);
}

// ==========================================
// 10. WOULD YOU RATHER (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawWouldYouRatherThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["WOULD YOU RATHER?", "TOUGH CHOICE!", "YOU DECIDE", "CHOOSE WISELY", "WHICH ONE?", "PICK YOUR PATH", "MAKE A CHOICE", "WHAT DO YOU PICK?", "EITHER OR", "YOUR CHOICE"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Two paths splitting
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Split arrow
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    
    // Left path
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.7);
    ctx.lineTo(W * 0.3, H * 0.3);
    ctx.stroke();
    
    // Right path
    ctx.beginPath();
    ctx.moveTo(W * 0.5, H * 0.7);
    ctx.lineTo(W * 0.7, H * 0.3);
    ctx.stroke();
    
    // Circles at ends
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(W * 0.3, H * 0.3, W * 0.08, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = colors.accent;
    ctx.beginPath();
    ctx.arc(W * 0.7, H * 0.3, W * 0.08, 0, Math.PI * 2);
    ctx.fill();

  } else if (sceneType === 1) {
    // VS split screen
    const grad = ctx.createLinearGradient(0, 0, W, 0);
    grad.addColorStop(0, colors.primary);
    grad.addColorStop(0.5, colors.secondary);
    grad.addColorStop(1, colors.accent);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // VS text
    ctx.fillStyle = colors.bg;
    ctx.font = `bold ${W * 0.25}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("VS", W * 0.5, H * 0.5);

  } else if (sceneType === 2) {
    // Question mark with options
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Big question mark
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${W * 0.4}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W * 0.5, H * 0.5);

  } else {
    // Two boxes side by side
    const grad = ctx.createLinearGradient(0, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Left box
    ctx.fillStyle = hexA(colors.primary, 0.3);
    ctx.fillRect(W * 0.1, H * 0.3, W * 0.35, H * 0.4);
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 6;
    ctx.strokeRect(W * 0.1, H * 0.3, W * 0.35, H * 0.4);

    // Right box
    ctx.fillStyle = hexA(colors.accent, 0.3);
    ctx.fillRect(W * 0.55, H * 0.3, W * 0.35, H * 0.4);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 6;
    ctx.strokeRect(W * 0.55, H * 0.3, W * 0.35, H * 0.4);

    // Letters
    ctx.fillStyle = colors.primary;
    ctx.font = `bold ${W * 0.15}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("A", W * 0.275, H * 0.5);
    
    ctx.fillStyle = colors.accent;
    ctx.fillText("B", W * 0.725, H * 0.5);
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.87, W * 0.88, 96, colors.primary, colors.bg);
}

// ==========================================
// 11. MYTH BUSTERS (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawMythBustersThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["MYTH BUSTED!", "TRUE OR FALSE?", "FACT CHECK", "BUSTING MYTHS", "IS IT REAL?", "MYTH OR FACT?", "SCIENCE SAYS", "DEBUNKED", "TRUTH REVEALED", "MYTH BUSTER"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Stamp "BUSTED" effect
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Red stamp
    ctx.save();
    ctx.translate(W * 0.5, H * 0.5);
    ctx.rotate(-0.2);
    ctx.strokeStyle = colors.accent;
    ctx.lineWidth = 12;
    ctx.strokeRect(-W * 0.3, -H * 0.15, W * 0.6, H * 0.3);
    
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.12}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("BUSTED", 0, 0);
    ctx.restore();

  } else if (sceneType === 1) {
    // True/False checkmark and X
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Checkmark
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(W * 0.2, H * 0.5);
    ctx.lineTo(W * 0.3, H * 0.6);
    ctx.lineTo(W * 0.45, H * 0.35);
    ctx.stroke();

    // X mark
    ctx.strokeStyle = colors.accent;
    ctx.beginPath();
    ctx.moveTo(W * 0.55, H * 0.35);
    ctx.lineTo(W * 0.8, H * 0.65);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(W * 0.8, H * 0.35);
    ctx.lineTo(W * 0.55, H * 0.65);
    ctx.stroke();

  } else if (sceneType === 2) {
    // Magnifying glass
    const grad = ctx.createLinearGradient(0, H, W, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Glass
    ctx.strokeStyle = colors.primary;
    ctx.lineWidth = 12;
    ctx.beginPath();
    ctx.arc(W * 0.45, H * 0.4, W * 0.2, 0, Math.PI * 2);
    ctx.stroke();

    // Handle
    ctx.lineWidth = 16;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(W * 0.58, H * 0.53);
    ctx.lineTo(W * 0.75, H * 0.75);
    ctx.stroke();

    // Question mark inside
    ctx.fillStyle = colors.accent;
    ctx.font = `bold ${W * 0.15}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", W * 0.45, H * 0.4);

  } else {
    // Explosion burst
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.5);
    grad.addColorStop(0, colors.accent);
    grad.addColorStop(0.7, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Star burst
    ctx.fillStyle = colors.primary;
    ctx.beginPath();
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const outerR = W * 0.3;
      const innerR = W * 0.15;
      const isOuter = i % 2 === 0;
      const r = isOuter ? outerR : innerR;
      const x = W * 0.5 + Math.cos(angle) * r;
      const y = H * 0.5 + Math.sin(angle) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.87, W * 0.88, 96, colors.primary, colors.bg);
}

// ==========================================
// 12. QUICK POLLS (10 DISTINCT COMPOSITIONS)
// ==========================================
export function drawQuickPollThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, hookOverride?: string) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  const hook = hookOverride && hookOverride.length > 2 ? hookOverride : ["QUICK POLL!", "YOU VOTE", "PICK ONE", "POLL TIME", "WHAT DO YOU THINK?", "VOTE NOW", "YOUR OPINION", "SURVEY SAYS", "CHOOSE", "FAST POLL"][sceneType % 10];

  ctx.fillStyle = colors.bg;
  ctx.fillRect(0, 0, W, H);

  if (sceneType === 0) {
    // Bar chart
    const grad = ctx.createLinearGradient(0, H, 0, 0);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Four bars
    const barWidth = W * 0.15;
    const barColors = [colors.primary, colors.accent, colors.secondary, colors.text];
    const barHeights = [0.6, 0.8, 0.5, 0.4];

    barHeights.forEach((height, i) => {
      const x = W * 0.15 + i * W * 0.2;
      const barH = H * height * 0.5;
      const y = H * 0.65 - barH;
      
      ctx.fillStyle = barColors[i];
      ctx.fillRect(x, y, barWidth, barH);
      ctx.strokeStyle = colors.text;
      ctx.lineWidth = 3;
      ctx.strokeRect(x, y, barWidth, barH);
    });

  } else if (sceneType === 1) {
    // Pie chart
    const grad = ctx.createRadialGradient(W * 0.5, H * 0.5, 0, W * 0.5, H * 0.5, W * 0.7);
    grad.addColorStop(0, colors.secondary);
    grad.addColorStop(1, colors.bg);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const radius = W * 0.25;
    const slices = [0.4, 0.3, 0.2, 0.1];
    let currentAngle = -Math.PI / 2;

    slices.forEach((slice, i) => {
      const sliceAngle = slice * Math.PI * 2;
      ctx.fillStyle = [colors.primary, colors.accent, colors.secondary, colors.text][i];
      ctx.beginPath();
      ctx.moveTo(W * 0.5, H * 0.5);
      ctx.arc(W * 0.5, H * 0.5, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = colors.bg;
      ctx.lineWidth = 4;
      ctx.stroke();
      currentAngle += sliceAngle;
    });

  } else if (sceneType === 2) {
    // Checkboxes
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    const boxSize = W * 0.12;
    const positions = [[0.3, 0.35], [0.3, 0.55], [0.6, 0.35], [0.6, 0.55]];

    positions.forEach(([xRatio, yRatio], i) => {
      const x = W * xRatio;
      const y = H * yRatio;
      
      ctx.fillStyle = hexA(colors.primary, 0.2);
      ctx.fillRect(x, y, boxSize, boxSize);
      ctx.strokeStyle = colors.primary;
      ctx.lineWidth = 4;
      ctx.strokeRect(x, y, boxSize, boxSize);
      
      // Checkmark on first box
      if (i === 0) {
        ctx.strokeStyle = colors.accent;
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.beginPath();
        ctx.moveTo(x + boxSize * 0.2, y + boxSize * 0.5);
        ctx.lineTo(x + boxSize * 0.4, y + boxSize * 0.7);
        ctx.lineTo(x + boxSize * 0.8, y + boxSize * 0.3);
        ctx.stroke();
      }
    });

  } else {
    // Thumbs up/down
    const grad = ctx.createLinearGradient(W, 0, 0, H);
    grad.addColorStop(0, colors.bg);
    grad.addColorStop(1, colors.secondary);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Thumbs up (left)
    ctx.fillStyle = colors.primary;
    ctx.font = `${W * 0.25}px Arial`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("👍", W * 0.35, H * 0.5);

    // Thumbs down (right)
    ctx.fillStyle = colors.accent;
    ctx.fillText("👎", W * 0.65, H * 0.5);
  }

  applyMicroLayout(ctx, W, H, layoutMicro);
  fitOutlinedText(ctx, hook, W / 2, H * 0.87, W * 0.88, 96, colors.primary, colors.bg);
}
