// Isomorphic thumbnail renderer with combinatorial, fingerprinted styles.
import { Composition, FONTS, PALETTES, Palette, RNG } from "./core";
import { C2D, fitText, hexA, rrect, wrap, font, poly, star } from "./draw";

export const THUMB_LAYOUTS = ["left-stack", "center-burst", "diagonal-band", "corner-box", "split-vertical", "bottom-bar", "circle-badge", "scatter"] as const;
export const THUMB_DECOS = ["arrows", "rings", "confetti", "stripes", "halftone", "frame", "sparks", "none"] as const;
export const THUMB_FX = ["shadow", "outline", "3d", "glitch", "underline", "box"] as const;
export const THUMB_PATTERNS = ["solid", "gradient", "grid", "dots", "rays", "diagonal", "blobs", "rings", "noise"] as const;

export interface ThumbStyle {
  layout: (typeof THUMB_LAYOUTS)[number];
  paletteIdx: number;
  fontIdx: number;
  deco: (typeof THUMB_DECOS)[number];
  fx: (typeof THUMB_FX)[number];
  pattern: (typeof THUMB_PATTERNS)[number];
  tilt: number; // degrees
  hueShift: number;
  textVariant?: number;
  themeVariant?: number; // 0-4: distinct visual composition theme
}

type ThumbnailCategory = "eye_training" | "math" | "story" | "gameplay" | "brain" | "calm" | "mixed";

const CATEGORY_THUMBNAILS: Record<ThumbnailCategory, Partial<ThumbStyle>> = {
  eye_training: { layout: "bottom-bar", paletteIdx: 4, deco: "rings", fx: "outline", pattern: "gradient" },
  math: { layout: "center-burst", paletteIdx: 2, deco: "rings", fx: "outline", pattern: "rays" },
  story: { layout: "left-stack", paletteIdx: 5, deco: "none", fx: "shadow", pattern: "gradient" },
  gameplay: { layout: "split-vertical", paletteIdx: 11, deco: "arrows", fx: "outline", pattern: "gradient" },
  brain: { layout: "bottom-bar", paletteIdx: 9, deco: "halftone", fx: "outline", pattern: "grid" },
  calm: { layout: "center-burst", paletteIdx: 3, deco: "rings", fx: "shadow", pattern: "gradient" },
  mixed: { layout: "diagonal-band", paletteIdx: 0, deco: "sparks", fx: "outline", pattern: "rays" },
};

const CATEGORY_LAYOUTS: Record<ThumbnailCategory, ThumbStyle["layout"][]> = {
  eye_training: ["bottom-bar", "split-vertical", "circle-badge"],
  math: ["center-burst", "corner-box", "diagonal-band"],
  story: ["left-stack", "corner-box", "center-burst"],
  gameplay: ["split-vertical", "corner-box", "diagonal-band"],
  brain: ["bottom-bar", "center-burst", "corner-box"],
  calm: ["center-burst", "circle-badge", "left-stack"],
  mixed: ["diagonal-band", "center-burst", "split-vertical"],
};

export function styleFingerprint(s: ThumbStyle) {
  return `v4|${s.layout}|${s.paletteIdx}|${s.fontIdx}|${s.deco}|${s.fx}|${s.pattern}|${s.textVariant ?? 0}|${s.themeVariant ?? 0}`;
}

export function randomThumbStyle(rng: RNG, category?: string): ThumbStyle {
  const preset = CATEGORY_THUMBNAILS[category as ThumbnailCategory] ?? {};
  return {
    layout: preset.layout ?? rng.pick(THUMB_LAYOUTS),
    paletteIdx: preset.paletteIdx ?? rng.int(0, PALETTES.length - 1),
    fontIdx: rng.int(0, FONTS.display.length - 1),
    deco: preset.deco ?? rng.pick(THUMB_DECOS),
    fx: preset.fx ?? rng.pick(THUMB_FX),
    pattern: preset.pattern ?? rng.pick(THUMB_PATTERNS),
    tilt: category === "story" ? 0 : rng.range(-2, 2),
    hueShift: rng.int(0, 359),
    themeVariant: 0,
  };
}

export function thumbnailCandidates(seed: string, category: string): ThumbStyle[] {
  const rng = new RNG(seed + "thumb-candidates-v4");
  const key = (category in CATEGORY_LAYOUTS ? category : "mixed") as ThumbnailCategory;
  const layouts = CATEGORY_LAYOUTS[key];

  // Generate 5 candidates, each with a distinct themeVariant (0-4) for visually different compositions
  return Array.from({ length: 5 }, (_, index) => {
    const themeVariant = index % 5;
    const style = randomThumbStyle(rng, key);
    return {
      ...style,
      layout: layouts[index % layouts.length],
      fontIdx: (style.fontIdx + index * 3) % FONTS.display.length,
      deco: index === 0 ? style.deco : index === 1 ? "frame" : index === 3 ? "sparks" : style.deco,
      fx: index === 2 && key !== "story" ? "3d" : style.fx,
      pattern: index === 1 ? "gradient" : style.pattern,
      tilt: key === "story" ? 0 : index === 0 ? 0 : rng.range(-1.5, 1.5),
      hueShift: index * 72, // spread evenly around color wheel
      textVariant: index,
      themeVariant,
    };
  });
}

export function thumbnailScore(style: ThumbStyle, category: string) {
  const key = (category in CATEGORY_LAYOUTS ? category : "mixed") as ThumbnailCategory;
  const layouts = CATEGORY_LAYOUTS[key];
  let score = 0;
  score += Math.max(0, 6 - layouts.indexOf(style.layout) * 2);
  if (style.fx === "outline") score += 3;
  if (style.pattern === "gradient" || style.pattern === "rays") score += 2;
  if (style.tilt === 0) score += 2;
  if (key === "story" && style.fx === "shadow") score += 4;
  if ((key === "math" || key === "brain") && style.fx === "3d") score -= 2;
  return score;
}

function shiftHue(hex: string, deg: number) {
  if (!deg) return hex;
  const h = hex.replace("#", "");
  const n = parseInt(h, 16);
  let r = ((n >> 16) & 255) / 255, g = ((n >> 8) & 255) / 255, b = (n & 255) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let hh = 0; const l = (max + min) / 2; const d = max - min;
  const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
  if (d !== 0) { if (max === r) hh = ((g - b) / d) % 6; else if (max === g) hh = (b - r) / d + 2; else hh = (r - g) / d + 4; }
  hh = (hh * 60 + deg + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s, x = c * (1 - Math.abs(((hh / 60) % 2) - 1)), m = l - c / 2;
  let rr = 0, gg = 0, bb = 0;
  if (hh < 60) [rr, gg, bb] = [c, x, 0]; else if (hh < 120) [rr, gg, bb] = [x, c, 0]; else if (hh < 180) [rr, gg, bb] = [0, c, x]; else if (hh < 240) [rr, gg, bb] = [0, x, c]; else if (hh < 300) [rr, gg, bb] = [x, 0, c]; else [rr, gg, bb] = [c, 0, x];
  r = rr + m; g = gg + m; b = bb + m;
  const to = (v: number) => Math.round(v * 255).toString(16).padStart(2, "0");
  return `#${to(r)}${to(g)}${to(b)}`;
}

function fxText(ctx: C2D, text: string, x: number, y: number, fx: string, fg: string, acc: string, acc2: string, size: number) {
  switch (fx) {
    case "shadow": ctx.fillStyle = "rgba(0,0,0,0.6)"; ctx.fillText(text, x + size * 0.06, y + size * 0.06); ctx.fillStyle = fg; ctx.fillText(text, x, y); break;
    case "outline": ctx.lineWidth = Math.max(4, size * 0.08); ctx.strokeStyle = acc2; ctx.lineJoin = "round"; ctx.strokeText(text, x, y); ctx.fillStyle = fg; ctx.fillText(text, x, y); break;
    case "3d": for (let i = 8; i > 0; i--) { ctx.fillStyle = i % 2 ? acc : acc2; ctx.fillText(text, x + i * 1.5, y + i * 1.5); } ctx.fillStyle = fg; ctx.fillText(text, x, y); break;
    case "glitch": ctx.fillStyle = acc; ctx.fillText(text, x - 6, y - 3); ctx.fillStyle = acc2; ctx.fillText(text, x + 6, y + 3); ctx.fillStyle = fg; ctx.fillText(text, x, y); break;
    case "underline": { ctx.fillStyle = fg; ctx.fillText(text, x, y); const w = ctx.measureText(text).width; const ox = ctx.textAlign === "center" ? x - w / 2 : ctx.textAlign === "right" ? x - w : x; ctx.fillStyle = acc; ctx.fillRect(ox, y + size * 0.42, w, size * 0.12); break; }
    default: { const w = ctx.measureText(text).width; const ox = ctx.textAlign === "center" ? x - w / 2 : ctx.textAlign === "right" ? x - w : x; ctx.fillStyle = acc; ctx.fillRect(ox - size * 0.15, y - size * 0.55, w + size * 0.3, size * 1.1); ctx.fillStyle = fg === acc ? acc2 : fg; ctx.fillText(text, x, y); }
  }
}

function outlinedText(ctx: C2D, text: string, x: number, y: number, size: number, fill: string, stroke = "#000", align: CanvasTextAlign = "center") {
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

function fitOutlinedText(ctx: C2D, text: string, x: number, y: number, maxW: number, size: number, fill: string, stroke = "#000") {
  ctx.font = `900 ${Math.round(size)}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  let fitted = size;
  while (ctx.measureText(text).width > maxW && fitted > 34) {
    fitted -= Math.max(1, fitted * 0.05);
    ctx.font = `900 ${Math.round(fitted)}px "Anton", "Arial Black", "DejaVu Sans", sans-serif`;
  }
  outlinedText(ctx, text, x, y, fitted, fill, stroke);
}

// Draw a pill/badge shape
function drawBadge(ctx: C2D, text: string, cx: number, cy: number, bg: string, fg: string, fontSize: number, rotateDeg = 0) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate((rotateDeg * Math.PI) / 180);
  ctx.font = `800 ${fontSize}px "Anton", "Arial Black", sans-serif`;
  const tw = ctx.measureText(text).width;
  const ph = fontSize * 1.3;
  const pw = tw + fontSize * 1.2;
  // shadow
  ctx.shadowColor = "rgba(0,0,0,0.45)";
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

// Timer ring with number
function drawTimerRing(ctx: C2D, cx: number, cy: number, r: number, num: string, progress: number, ringColor: string, numColor: string) {
  // background ring
  ctx.strokeStyle = "rgba(255,255,255,0.15)";
  ctx.lineWidth = r * 0.22;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  // progress ring
  ctx.strokeStyle = ringColor;
  ctx.lineWidth = r * 0.22;
  ctx.beginPath();
  ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progress);
  ctx.stroke();
  // number
  outlinedText(ctx, num, cx, cy, r * 0.78, numColor, "#000");
}

// ===== CATEGORY THUMBNAIL RENDERERS =====

// ----- EYE TRAINING -----
// Theme palettes for eye training
const EYE_THEMES = [
  { bg1: "#04141c", bg2: "#123246", iris: "#3fe0ff", dot: "#ff2323", glow: "rgba(63,224,255,0.35)", accent: "#3fe0ff", dotGlow: "rgba(255,35,35,0.65)", hook: "FOLLOW\nTHE DOT" },
  { bg1: "#0a0820", bg2: "#1a1060", iris: "#a855f7", dot: "#22d3ee", glow: "rgba(168,85,247,0.3)", accent: "#a855f7", dotGlow: "rgba(34,211,238,0.65)", hook: "TRACK\nTHIS" },
  { bg1: "#1a0a02", bg2: "#3d1f04", iris: "#f59e0b", dot: "#10b981", glow: "rgba(245,158,11,0.3)", accent: "#f59e0b", dotGlow: "rgba(16,185,129,0.65)", hook: "KEEP\nSTILL" },
  { bg1: "#00100e", bg2: "#003d38", iris: "#34d399", dot: "#f97316", glow: "rgba(52,211,153,0.3)", accent: "#34d399", dotGlow: "rgba(249,115,22,0.65)", hook: "EYE\nWORKOUT" },
  { bg1: "#12021a", bg2: "#3b0764", iris: "#e879f9", dot: "#fbbf24", glow: "rgba(232,121,249,0.3)", accent: "#e879f9", dotGlow: "rgba(251,191,36,0.65)", hook: "VISION\nDRILL" },
];

function drawEyeTrainingThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG) {
  const th = EYE_THEMES[themeVariant % EYE_THEMES.length];

  // Background — radial gradient
  const bgGrad = ctx.createRadialGradient(W * 0.32, H * 0.48, 40, W * 0.32, H * 0.48, W * 0.85);
  bgGrad.addColorStop(0, th.bg2);
  bgGrad.addColorStop(1, th.bg1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Glow blob behind eye
  const glowX = W * 0.08, glowY = H * 0.5;
  const gBlob = ctx.createRadialGradient(glowX, glowY, 10, glowX, glowY, 340);
  gBlob.addColorStop(0, th.glow);
  gBlob.addColorStop(1, "transparent");
  ctx.fillStyle = gBlob;
  ctx.fillRect(0, 0, W, H);

  // -------- Eyeball --------
  const eyeCX = W * 0.34, eyeCY = H * 0.47;
  const eyeW = W * 0.52, eyeH = H * 0.44;

  // White sclera — almond shape via bezier
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 48;
  ctx.shadowOffsetY = 18;
  ctx.fillStyle = "#f6ede0";
  ctx.beginPath();
  ctx.moveTo(eyeCX - eyeW / 2, eyeCY);
  ctx.bezierCurveTo(eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2, eyeCY);
  ctx.bezierCurveTo(eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY + eyeH / 2, eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY + eyeH / 2, eyeCX - eyeW / 2, eyeCY);
  ctx.fill();
  ctx.restore();

  // Iris — dark background with color ring
  const irisR = eyeH * 0.46;
  // Iris fill
  const irisGrad = ctx.createRadialGradient(eyeCX, eyeCY, 0, eyeCX, eyeCY, irisR);
  irisGrad.addColorStop(0, th.bg1);
  irisGrad.addColorStop(0.5, th.bg2);
  irisGrad.addColorStop(1, th.bg1);
  ctx.fillStyle = irisGrad;
  ctx.beginPath();
  ctx.arc(eyeCX, eyeCY, irisR, 0, Math.PI * 2);
  ctx.fill();

  // Iris color ring
  ctx.strokeStyle = th.iris;
  ctx.lineWidth = 10;
  ctx.beginPath();
  ctx.arc(eyeCX, eyeCY, irisR, 0, Math.PI * 2);
  ctx.stroke();

  // Iris spokes (subtle)
  ctx.save();
  ctx.globalAlpha = 0.25;
  ctx.strokeStyle = th.iris;
  ctx.lineWidth = 2;
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    ctx.beginPath();
    ctx.moveTo(eyeCX + Math.cos(a) * irisR * 0.45, eyeCY + Math.sin(a) * irisR * 0.45);
    ctx.lineTo(eyeCX + Math.cos(a) * irisR * 0.92, eyeCY + Math.sin(a) * irisR * 0.92);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Pupil
  ctx.fillStyle = "#01060a";
  ctx.beginPath();
  ctx.arc(eyeCX, eyeCY, irisR * 0.44, 0, Math.PI * 2);
  ctx.fill();

  // Catchlight
  ctx.fillStyle = "rgba(255,255,255,0.92)";
  ctx.beginPath();
  ctx.arc(eyeCX - irisR * 0.28, eyeCY - irisR * 0.28, irisR * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(255,255,255,0.4)";
  ctx.beginPath();
  ctx.arc(eyeCX + irisR * 0.18, eyeCY + irisR * 0.22, irisR * 0.07, 0, Math.PI * 2);
  ctx.fill();

  // Eyelid outline strokes (top and bottom lashes line)
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 14;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(eyeCX - eyeW / 2, eyeCY);
  ctx.bezierCurveTo(eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY - eyeH / 2, eyeCX + eyeW / 2, eyeCY);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(eyeCX - eyeW / 2, eyeCY);
  ctx.bezierCurveTo(eyeCX - eyeW / 2 + eyeW * 0.18, eyeCY + eyeH / 2, eyeCX + eyeW / 2 - eyeW * 0.18, eyeCY + eyeH / 2, eyeCX + eyeW / 2, eyeCY);
  ctx.stroke();

  // Upper eyelashes
  ctx.strokeStyle = "#000";
  ctx.lineWidth = 6;
  const lashPositions = [-0.35, -0.2, -0.05, 0.12, 0.28];
  for (const lp of lashPositions) {
    const lx = eyeCX + lp * eyeW;
    const ly = eyeCY - eyeH * 0.46;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + lp * 20, ly - 24 + Math.abs(lp) * 10);
    ctx.stroke();
  }

  // -------- Dashed arc trail --------
  const trailStart = eyeCX + eyeW * 0.22;
  ctx.save();
  ctx.strokeStyle = th.dot;
  ctx.lineWidth = 7;
  ctx.setLineDash([6, 22]);
  ctx.lineCap = "round";
  ctx.globalAlpha = 0.78;
  ctx.beginPath();
  ctx.moveTo(trailStart, H * 0.53);
  ctx.bezierCurveTo(W * 0.62, H * 0.2, W * 0.8, H * 0.18, W * 0.88, H * 0.28);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.globalAlpha = 1;
  ctx.restore();

  // -------- Red dot --------
  const dotX = W * 0.88, dotY = H * 0.3;
  // Glow
  const dg = ctx.createRadialGradient(dotX, dotY, 0, dotX, dotY, 55);
  dg.addColorStop(0, th.dotGlow);
  dg.addColorStop(1, "transparent");
  ctx.fillStyle = dg;
  ctx.fillRect(dotX - 60, dotY - 60, 120, 120);

  // Dot fill with radial gradient
  const dotFill = ctx.createRadialGradient(dotX - 10, dotY - 10, 2, dotX, dotY, 26);
  dotFill.addColorStop(0, "#ffb3b3");
  dotFill.addColorStop(0.6, th.dot);
  dotFill.addColorStop(1, "#990000");
  ctx.fillStyle = dotFill;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 26, 0, Math.PI * 2);
  ctx.fill();

  // Outer ring
  ctx.strokeStyle = hexA(th.dot, 0.5);
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(dotX, dotY, 42, 0, Math.PI * 2);
  ctx.stroke();

  // -------- Badge top-right --------
  drawBadge(ctx, "TRACK IT →", W * 0.83, H * 0.1, th.accent, "#000", 28, -5);

  // -------- Headline bottom center --------
  const hookLines = th.hook.split("\n");
  const headlineY = H * 0.81;
  ctx.font = `900 104px "Anton", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  hookLines.forEach((line, i) => {
    const y = headlineY + (i - (hookLines.length - 1) / 2) * 108;
    ctx.lineWidth = 8;
    ctx.strokeStyle = "#000";
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = i === 1 ? th.accent : "#ffffff";
    ctx.fillText(line, W / 2, y);
  });
}

// ----- MATH -----
const MATH_THEMES = [
  { bg1: "#0a0d24", bg2: "#2a3170", numColor: "#ffd23f", opColor: "#ffffff", qmarkColor: "#ff3b3b", strokeColor: "#000", headlineFill: "#ffffff", headlineStroke: "#ff3b3b", hook: "CAN YOU\nSOLVE IT?" },
  { bg1: "#000000", bg2: "#1a1a2e", numColor: "#22d3ee", opColor: "#ffffff", qmarkColor: "#f97316", strokeColor: "#000", headlineFill: "#22d3ee", headlineStroke: "#000", hook: "NO\nCALCULATOR" },
  { bg1: "#0f0a00", bg2: "#2d1f00", numColor: "#fb923c", opColor: "#fef3c7", qmarkColor: "#ef4444", strokeColor: "#000", headlineFill: "#fef3c7", headlineStroke: "#ef4444", hook: "BEAT THE\nTIMER" },
  { bg1: "#0d0017", bg2: "#2d0047", numColor: "#e879f9", opColor: "#ffffff", qmarkColor: "#fbbf24", strokeColor: "#000", headlineFill: "#fbbf24", headlineStroke: "#000", hook: "MATH\nSPRINT" },
  { bg1: "#001a0a", bg2: "#003321", numColor: "#34d399", opColor: "#d1fae5", qmarkColor: "#f87171", strokeColor: "#000", headlineFill: "#ffffff", headlineStroke: "#059669", hook: "MENTAL\nMATH" },
];

function drawMathThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG, equation: string) {
  const th = MATH_THEMES[themeVariant % MATH_THEMES.length];

  // Background
  const bgGrad = ctx.createRadialGradient(W * 0.72, H * 0.24, 30, W * 0.72, H * 0.24, W * 0.9);
  bgGrad.addColorStop(0, th.bg2);
  bgGrad.addColorStop(1, th.bg1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle chalk-grid lines
  ctx.save();
  ctx.globalAlpha = 0.06;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  for (let x = 0; x < W; x += 120) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); }
  for (let y = 0; y < H; y += 120) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Parse equation into tokens and layout them tumbled across the left/center
  const parts = equation.replace("=?", "").split(/([\+\-\×\÷\+\-×÷])/g).filter(Boolean);
  const positions = [
    { x: W * 0.06, y: H * 0.38, rot: -4 },
    { x: W * 0.26, y: H * 0.5, rot: 3 },
    { x: W * 0.46, y: H * 0.35, rot: 2 },
    { x: W * 0.66, y: H * 0.48, rot: -3 },
    { x: W * 0.85, y: H * 0.36, rot: 6 },
  ];

  parts.slice(0, 5).forEach((part, i) => {
    const pos = positions[i];
    const isOp = /[\+\-\×\÷×÷\−]/.test(part.trim());
    const sz = isOp ? 150 : 200;
    ctx.save();
    ctx.translate(pos.x + sz * 0.5, pos.y);
    ctx.rotate((pos.rot * Math.PI) / 180);
    ctx.font = `900 ${sz}px "Anton", "Arial Black", sans-serif`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.lineJoin = "round";
    ctx.lineWidth = 8;
    ctx.strokeStyle = th.strokeColor;
    ctx.strokeText(part.trim(), 0, 0);
    ctx.fillStyle = isOp ? th.opColor : th.numColor;
    ctx.fillText(part.trim(), 0, 0);
    ctx.restore();
  });

  // Big "?" on the right
  ctx.save();
  ctx.translate(W * 0.93, H * 0.32);
  ctx.rotate((6 * Math.PI) / 180);
  ctx.font = `900 230px "Anton", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.lineJoin = "round";
  ctx.lineWidth = 10;
  ctx.strokeStyle = th.strokeColor;
  ctx.strokeText("?", 0, 0);
  ctx.fillStyle = th.qmarkColor;
  ctx.fillText("?", 0, 0);
  ctx.restore();

  // Timer ring bottom-right
  drawTimerRing(ctx, W * 0.84, H * 0.72, 72, "10", 0.72, th.qmarkColor, "#ffffff");

  // Headline bottom
  const hookLines = th.hook.split("\n");
  ctx.font = `900 88px "Anton", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.lineJoin = "round";
  hookLines.forEach((line, i) => {
    const y = H * 0.84 + (i - (hookLines.length - 1) / 2) * 94;
    ctx.lineWidth = 8;
    ctx.strokeStyle = th.headlineStroke;
    ctx.strokeText(line, W / 2, y);
    ctx.fillStyle = th.headlineFill;
    ctx.fillText(line, W / 2, y);
  });

  void rng;
}

// ----- STORY -----
const STORY_THEMES = [
  { sky: ["#1a1030", "#4a1f45", "#a84a35", "#d97f3f"], moonColor: "#ffe9b0", moonGlow: "rgba(255,233,176,0.45)", moonX: 0.78, hillColor: "#2f1638", houseColor: "#160a1e", textColor: "#fff8ec", kicker: "AN ORIGINAL STORY" },
  { sky: ["#102d4a", "#1a4f6e", "#2e8b9a", "#e18b53"], moonColor: "#d8f5ff", moonGlow: "rgba(200,240,255,0.45)", moonX: 0.64, hillColor: "#0d2a3d", houseColor: "#080f18", textColor: "#d8f5ff", kicker: "SHORT STORIES" },
  { sky: ["#34142f", "#8d3d5c", "#e6a247", "#f5c94e"], moonColor: "#fff0c0", moonGlow: "rgba(255,220,100,0.5)", moonX: 0.82, hillColor: "#260d22", houseColor: "#1a0818", textColor: "#fff8ec", kicker: "BEDTIME TALES" },
  { sky: ["#0a1a30", "#1e3a5f", "#4a7fa5", "#8bc0d0"], moonColor: "#ffffff", moonGlow: "rgba(255,255,255,0.4)", moonX: 0.7, hillColor: "#0a1520", houseColor: "#050b12", textColor: "#e0f0ff", kicker: "ORIGINAL FICTION" },
  { sky: ["#200030", "#5a1060", "#b84080", "#e86050"], moonColor: "#ffe0f0", moonGlow: "rgba(255,180,200,0.45)", moonX: 0.75, hillColor: "#1a0828", houseColor: "#100418", textColor: "#ffe0f0", kicker: "NIGHT STORIES" },
];

function drawStoryThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, titleText: string) {
  const th = STORY_THEMES[themeVariant % STORY_THEMES.length];

  // Sky gradient
  const skyGrad = ctx.createLinearGradient(0, 0, 0, H);
  th.sky.forEach((c, i) => skyGrad.addColorStop(i / (th.sky.length - 1), c));
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, W, H);

  // Stars
  ctx.fillStyle = "rgba(255,255,255,0.85)";
  const starPositions = [
    [120, 90, 3], [220, 150, 2], [340, 60, 2.5], [480, 120, 2], [90, 220, 2],
    [560, 70, 3], [700, 40, 2], [850, 90, 2.5], [980, 60, 2], [150, 170, 1.5],
    [400, 30, 2], [620, 140, 1.5], [760, 80, 2], [1050, 100, 2.5], [1150, 50, 2],
  ];
  for (const [sx, sy, sr] of starPositions) {
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }

  // Moon
  const moonX = W * th.moonX, moonY = H * 0.22;
  const moonGlowGrad = ctx.createRadialGradient(moonX, moonY, 0, moonX, moonY, 110);
  moonGlowGrad.addColorStop(0, th.moonGlow);
  moonGlowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = moonGlowGrad;
  ctx.fillRect(moonX - 120, moonY - 120, 240, 240);

  const moonFill = ctx.createRadialGradient(moonX - 22, moonY - 22, 5, moonX, moonY, 72);
  moonFill.addColorStop(0, "#ffffff");
  moonFill.addColorStop(1, th.moonColor);
  ctx.fillStyle = moonFill;
  ctx.beginPath();
  ctx.arc(moonX, moonY, 72, 0, Math.PI * 2);
  ctx.fill();

  // Birds near moon
  ctx.save();
  ctx.globalAlpha = 0.65;
  ctx.strokeStyle = th.sky[0];
  ctx.lineWidth = 3;
  ctx.lineCap = "round";
  const birdPairs: [number, number][] = [[moonX - 160, moonY - 20], [moonX - 120, moonY - 50], [moonX + 80, moonY + 10]];
  for (const [bx, by] of birdPairs) {
    ctx.beginPath();
    ctx.moveTo(bx, by); ctx.quadraticCurveTo(bx + 12, by - 14, bx + 24, by);
    ctx.quadraticCurveTo(bx + 36, by - 14, bx + 48, by);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Far hills
  ctx.fillStyle = th.hillColor;
  ctx.globalAlpha = 0.85;
  ctx.beginPath();
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.65);
  ctx.quadraticCurveTo(W * 0.25, H * 0.5, W * 0.5, H * 0.58);
  ctx.quadraticCurveTo(W * 0.75, H * 0.45, W, H * 0.55);
  ctx.lineTo(W, H);
  ctx.fill();
  ctx.globalAlpha = 1;

  // House silhouette
  ctx.fillStyle = th.houseColor;
  ctx.beginPath();
  // House walls
  ctx.moveTo(0, H);
  ctx.lineTo(0, H * 0.52);
  ctx.lineTo(W * 0.055, H * 0.35);  // chimney left
  ctx.lineTo(W * 0.09, H * 0.35);   // chimney top
  ctx.lineTo(W * 0.09, H * 0.42);   // chimney right bottom
  ctx.lineTo(W * 0.22, H * 0.33);   // roof peak approach
  ctx.lineTo(W * 0.15, H * 0.44);   // left eave
  ctx.lineTo(W * 0.165, H * 0.44);
  ctx.lineTo(W * 0.22, H * 0.36);   // roof peak
  ctx.lineTo(W * 0.38, H * 0.46);   // right eave
  ctx.lineTo(W * 0.42, H * 0.52);   // wall
  ctx.lineTo(W * 0.5, H * 0.55);
  ctx.lineTo(W * 0.5, H);
  ctx.fill();

  // Window glow on house
  ctx.fillStyle = "#ffcf7a";
  ctx.shadowColor = "rgba(255,207,122,0.8)";
  ctx.shadowBlur = 28;
  ctx.shadowOffsetX = 0;
  ctx.fillRect(W * 0.19, H * 0.52, 22, 30);
  ctx.shadowBlur = 0;

  // Kicker text
  ctx.font = `700 22px "Poppins", "Arial", sans-serif`;
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  ctx.fillStyle = hexA(th.textColor, 0.8);
  ctx.fillText(th.kicker, W * 0.94, H * 0.6);

  // Story title (right-aligned italic serif)
  const maxTitleW = W * 0.66;
  let fontSize = 106;
  ctx.font = `italic 900 ${fontSize}px "Playfair Display", "Georgia", serif`;
  const titleLines = titleText.length > 14 ? [titleText.split(" ").slice(0, Math.ceil(titleText.split(" ").length / 2)).join(" "), titleText.split(" ").slice(Math.ceil(titleText.split(" ").length / 2)).join(" ")] : [titleText];
  const longestLine = titleLines.reduce((a, b) => (a.length > b.length ? a : b), "");
  while (ctx.measureText(longestLine).width > maxTitleW && fontSize > 48) {
    fontSize -= 4;
    ctx.font = `italic 900 ${fontSize}px "Playfair Display", "Georgia", serif`;
  }
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";
  const titleBottom = H * 0.88;
  titleLines.reverse().forEach((line, i) => {
    const y = titleBottom - i * (fontSize * 1.1);
    ctx.shadowColor = "rgba(0,0,0,0.6)";
    ctx.shadowBlur = 20;
    ctx.fillStyle = th.textColor;
    ctx.fillText(line, W * 0.94, y);
    ctx.shadowBlur = 0;
  });
}

// ----- GAMEPLAY -----
const GAME_THEMES = [
  { bg: ["#ff3fb0", "#7b2ff7", "#1a1150"], boardBg: "rgba(0,0,0,0.28)", gemColors: ["#ff5757", "#ffd23f", "#3fe0ff", "#3fff88", "#ff9f3f"], glowColor: "#fff700", comboColor: "#fff700", hook: "LEVEL 47" },
  { bg: ["#ff6b35", "#e91e63", "#4527a0"], boardBg: "rgba(0,0,0,0.3)", gemColors: ["#ffd23f", "#ff5757", "#a855f7", "#22d3ee", "#f97316"], glowColor: "#ffd23f", comboColor: "#ffd23f", hook: "LEVEL 23" },
  { bg: ["#00bfa5", "#0066cc", "#0a0a2e"], boardBg: "rgba(0,0,0,0.25)", gemColors: ["#3fe0ff", "#3fff88", "#ffd23f", "#ff5757", "#34d399"], glowColor: "#3fe0ff", comboColor: "#3fe0ff", hook: "ROUND 7" },
  { bg: ["#dc2626", "#7c3aed", "#1e1b4b"], boardBg: "rgba(0,0,0,0.3)", gemColors: ["#fca5a5", "#c4b5fd", "#6ee7b7", "#fde68a", "#fb7185"], glowColor: "#fde68a", comboColor: "#fde68a", hook: "LEVEL 99" },
  { bg: ["#0ea5e9", "#6366f1", "#0f172a"], boardBg: "rgba(0,0,0,0.28)", gemColors: ["#38bdf8", "#818cf8", "#6ee7b7", "#fbbf24", "#fb7185"], glowColor: "#38bdf8", comboColor: "#38bdf8", hook: "NEW RUN" },
];

function drawGameplayThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG) {
  const th = GAME_THEMES[themeVariant % GAME_THEMES.length];

  // Background gradient
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, th.bg[0]);
  bgGrad.addColorStop(0.55, th.bg[1]);
  bgGrad.addColorStop(1, th.bg[2]);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Gem board background panel
  const boardX = 56, boardY = 64, boardW = 600, boardH = 600;
  ctx.fillStyle = th.boardBg;
  rrect(ctx, boardX, boardY, boardW, boardH, 28);
  ctx.fill();

  // Inset shadow on board (canvas doesn't natively support this)


  // Draw 5x5 gem grid
  const cols = 5, rows = 5;
  const tileGap = 12;
  const tilePad = 18;
  const tileW = (boardW - tilePad * 2 - tileGap * (cols - 1)) / cols;
  const tileH = (boardH - tilePad * 2 - tileGap * (rows - 1)) / rows;

  // Gem layout with rng-based variety
  const gemDefs: { c: string; circle: boolean; glow: boolean }[] = [];
  for (let gi = 0; gi < 25; gi++) {
    const c = th.gemColors[gi % th.gemColors.length];
    const circle = gi % 3 === 0;
    const glow = gi === 7; // one highlighted gem
    gemDefs.push({ c, circle, glow });
  }
  void rng;

  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const gi = row * cols + col;
      const gd = gemDefs[gi];
      const tx = boardX + tilePad + col * (tileW + tileGap);
      const ty = boardY + tilePad + row * (tileH + tileGap);

      ctx.save();
      if (gd.glow) {
        ctx.shadowColor = th.glowColor;
        ctx.shadowBlur = 22;
      } else {
        ctx.shadowColor = "rgba(0,0,0,0.35)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 6;
      }

      if (gd.circle) {
        ctx.fillStyle = gd.c;
        ctx.beginPath();
        ctx.arc(tx + tileW / 2, ty + tileH / 2, Math.min(tileW, tileH) / 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillStyle = gd.c;
        rrect(ctx, tx, ty, tileW, tileH, 14);
        ctx.fill();
      }
      ctx.restore();

      // Inner highlight (top)
      ctx.save();
      ctx.globalAlpha = 0.35;
      ctx.fillStyle = "#ffffff";
      if (gd.circle) {
        ctx.beginPath();
        ctx.arc(tx + tileW / 2, ty + tileH * 0.32, tileW * 0.28, 0, Math.PI * 2);
        ctx.fill();
      } else {
        rrect(ctx, tx + 4, ty + 4, tileW - 8, tileH * 0.28, 8);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Bottom shadow (inner)
      ctx.save();
      ctx.globalAlpha = 0.25;
      ctx.fillStyle = "#000000";
      if (!gd.circle) {
        rrect(ctx, tx + 2, ty + tileH * 0.72, tileW - 4, tileH * 0.24, 8);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.restore();

      // Glow outline on highlighted gem
      if (gd.glow) {
        ctx.strokeStyle = th.glowColor;
        ctx.lineWidth = 5;
        ctx.strokeRect(tx - 4, ty - 4, tileW + 8, tileH + 8);
      }
    }
  }

  // HUD panel right side
  const hudX = 694, hudY = 56;

  // Avatar
  const avatarGrad = ctx.createRadialGradient(hudX + 38, hudY + 36, 4, hudX + 38, hudY + 38, 38);
  avatarGrad.addColorStop(0, "#ffe98a");
  avatarGrad.addColorStop(1, "#ffb100");
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.35)";
  ctx.shadowBlur = 12;
  ctx.fillStyle = avatarGrad;
  ctx.beginPath();
  ctx.arc(hudX + 38, hudY + 38, 38, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 5;
  ctx.stroke();
  ctx.restore();

  // HP bar
  const hpX = hudX + 88, hpY = hudY + 20, hpW = 460 - 88, hpH = 24;
  ctx.fillStyle = "rgba(0,0,0,0.4)";
  rrect(ctx, hpX, hpY, hpW, hpH, 12);
  ctx.fill();
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 3;
  ctx.stroke();

  const hpFillGrad = ctx.createLinearGradient(hpX, 0, hpX + hpW, 0);
  hpFillGrad.addColorStop(0, "#3fff88");
  hpFillGrad.addColorStop(1, "#1ed65f");
  ctx.fillStyle = hpFillGrad;
  rrect(ctx, hpX + 2, hpY + 2, (hpW - 4) * 0.78, hpH - 4, 10);
  ctx.fill();

  // Combo text
  outlinedText(ctx, "×8 COMBO", hudX + 240, hudY + 120, 44, th.comboColor, "#000", "center");

  // Score
  outlinedText(ctx, "18,420", hudX + 220, hudY + 195, 62, "#ffffff", "#000", "center");

  // Yellow arrow
  const arrowX = W * 0.76, arrowY = H * 0.62;
  ctx.save();
  ctx.strokeStyle = th.glowColor;
  ctx.lineWidth = 16;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(arrowX - 60, arrowY);
  ctx.lineTo(arrowX + 60, arrowY);
  ctx.moveTo(arrowX + 24, arrowY - 36);
  ctx.lineTo(arrowX + 60, arrowY);
  ctx.lineTo(arrowX + 24, arrowY + 36);
  ctx.stroke();
  ctx.restore();

  // Headline
  outlinedText(ctx, th.hook, W / 2, H * 0.9, 82, "#ffffff", "#000");
}

// ----- BRAIN -----
const BRAIN_THEMES = [
  { bg1: "#050c07", bg2: "#123018", puzzleColor: "#3fff6e", puzzleOpacity: 0.92, qmarkColor: "#0d1b0f", ringColor: "#ff3b3b", badgeBg: "#3fff6e", badgeFg: "#0d1b0f", headlineColor: "#3fff6e", hook: "BEAT THE CLOCK", badge: "99% FAIL" },
  { bg1: "#03060f", bg2: "#0a1a3d", puzzleColor: "#3fe0ff", puzzleOpacity: 0.9, qmarkColor: "#03060f", ringColor: "#ff3b3b", badgeBg: "#3fe0ff", badgeFg: "#03060f", headlineColor: "#3fe0ff", hook: "THINK FAST", badge: "CAN YOU?" },
  { bg1: "#0f0800", bg2: "#2d1f00", puzzleColor: "#ffd23f", puzzleOpacity: 0.88, qmarkColor: "#0f0800", ringColor: "#ff3b3b", badgeBg: "#ffd23f", badgeFg: "#0f0800", headlineColor: "#ffd23f", hook: "BEAT THE CLOCK", badge: "5 SECONDS" },
  { bg1: "#100010", bg2: "#2d0047", puzzleColor: "#e879f9", puzzleOpacity: 0.9, qmarkColor: "#100010", ringColor: "#ffd23f", badgeBg: "#e879f9", badgeFg: "#100010", headlineColor: "#e879f9", hook: "MIND GAME", badge: "99% FAIL" },
  { bg1: "#001510", bg2: "#003828", puzzleColor: "#34d399", puzzleOpacity: 0.9, qmarkColor: "#001510", ringColor: "#f87171", badgeBg: "#34d399", badgeFg: "#001510", headlineColor: "#34d399", hook: "THINK FAST", badge: "CAN YOU?" },
];

// Draw a puzzle piece shape
function drawPuzzlePiece(ctx: C2D, x: number, y: number, w: number, h: number, color: string, opacity: number) {
  const tx = w / 6; // tab radius relative
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.fillStyle = color;

  // Shadow
  ctx.shadowColor = "rgba(0,0,0,0.55)";
  ctx.shadowBlur = 34;
  ctx.shadowOffsetY = 20;

  ctx.beginPath();
  // Top edge: left to (w*0.35) straight, then tab bump up, then to right
  ctx.moveTo(x, y);
  ctx.lineTo(x + w * 0.35, y);
  // Tab on top (bump outward = upward)
  ctx.quadraticCurveTo(x + w * 0.38, y - tx, x + w * 0.42, y - tx);
  ctx.quadraticCurveTo(x + w * 0.5, y - tx * 1.8, x + w * 0.58, y - tx);
  ctx.quadraticCurveTo(x + w * 0.62, y - tx, x + w * 0.65, y);
  ctx.lineTo(x + w, y);
  // Right edge: top to (h*0.35) straight, then tab bump right, then to bottom
  ctx.lineTo(x + w, y + h * 0.35);
  ctx.quadraticCurveTo(x + w + tx, y + h * 0.38, x + w + tx, y + h * 0.42);
  ctx.quadraticCurveTo(x + w + tx * 1.8, y + h * 0.5, x + w + tx, y + h * 0.58);
  ctx.quadraticCurveTo(x + w + tx, y + h * 0.62, x + w, y + h * 0.65);
  ctx.lineTo(x + w, y + h);
  // Bottom edge: right to (w*0.65) straight, then socket cut inward, then to left
  ctx.lineTo(x + w * 0.65, y + h);
  ctx.quadraticCurveTo(x + w * 0.62, y + h + tx, x + w * 0.58, y + h + tx);
  ctx.quadraticCurveTo(x + w * 0.5, y + h + tx * 1.8, x + w * 0.42, y + h + tx);
  ctx.quadraticCurveTo(x + w * 0.38, y + h + tx, x + w * 0.35, y + h);
  ctx.lineTo(x, y + h);
  // Left edge: bottom to (h*0.65), then socket inward, then to top
  ctx.lineTo(x, y + h * 0.65);
  ctx.quadraticCurveTo(x - tx, y + h * 0.62, x - tx, y + h * 0.58);
  ctx.quadraticCurveTo(x - tx * 1.8, y + h * 0.5, x - tx, y + h * 0.42);
  ctx.quadraticCurveTo(x - tx, y + h * 0.38, x, y + h * 0.35);
  ctx.lineTo(x, y);
  ctx.fill();
  ctx.restore();
}

function drawBrainThumbnail(ctx: C2D, W: number, H: number, themeVariant: number, rng: RNG) {
  const th = BRAIN_THEMES[themeVariant % BRAIN_THEMES.length];

  // Background
  const bgGrad = ctx.createRadialGradient(W * 0.76, H * 0.3, 30, W * 0.76, H * 0.3, W * 0.85);
  bgGrad.addColorStop(0, th.bg2);
  bgGrad.addColorStop(1, th.bg1);
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle puzzle grid texture
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = hexA(th.puzzleColor, 1);
  ctx.lineWidth = 3;
  for (let px = 0; px < W; px += 160) {
    for (let py = 0; py < H; py += 160) {
      ctx.beginPath();
      ctx.moveTo(px, py + 80); ctx.lineTo(px + 80, py + 80); ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(px + 80, py); ctx.lineTo(px + 80, py + 80); ctx.stroke();
    }
  }
  ctx.globalAlpha = 1;
  ctx.restore();

  // Main puzzle piece (left side)
  drawPuzzlePiece(ctx, 54, 72, 540, 540, th.puzzleColor, th.puzzleOpacity);

  // Big "?" overlaid on puzzle
  ctx.save();
  ctx.font = `900 280px "Anton", "Arial Black", sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = th.qmarkColor;
  ctx.globalAlpha = 0.85;
  ctx.fillText("?", 54 + 270, 72 + 270);
  ctx.globalAlpha = 1;
  ctx.restore();

  // Timer ring top-right
  drawTimerRing(ctx, W * 0.84, H * 0.2, 88, "05", 0.28, th.ringColor, "#ffffff");

  // Badge
  drawBadge(ctx, th.badge, W * 0.78, H * 0.56, th.badgeBg, th.badgeFg, 28, 5);

  // Headline bottom
  outlinedText(ctx, th.hook, W / 2, H * 0.88, 92, th.headlineColor, "#000");

  void rng;
}

// ----- CALM -----
function drawCalmThumbnail(ctx: C2D, comp: Composition, p: Palette, W: number, H: number, variant: number) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const hook = ["BREATHE", "SLOW DOWN", "RESET YOUR MIND", "QUIET MINUTES", "JUST BREATHE"][variant % 5];
  for (let radius = 250; radius > 40; radius -= 36) {
    ctx.fillStyle = hexA(p.accent, 0.08);
    ctx.beginPath();
    ctx.arc(W / 2, H * 0.42, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 20;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.42, 160, 0, Math.PI * 2);
  ctx.stroke();

  // Inner glow
  const glowGrad = ctx.createRadialGradient(W / 2, H * 0.42, 0, W / 2, H * 0.42, 160);
  glowGrad.addColorStop(0, hexA(p.accent, 0.2));
  glowGrad.addColorStop(1, "transparent");
  ctx.fillStyle = glowGrad;
  ctx.beginPath();
  ctx.arc(W / 2, H * 0.42, 160, 0, Math.PI * 2);
  ctx.fill();

  fitOutlinedText(ctx, hook, W / 2, H * 0.82, W * 0.82, 94, p.fg);
}

// ===== MAIN DISPATCHER =====
function drawReferenceThumbnail(ctx: C2D, comp: Composition, p: Palette, W: number, H: number, style: ThumbStyle) {
  const cat = comp.category;
  const themeVariant = style.themeVariant ?? 0;
  const rng = new RNG(styleFingerprint(style) + comp.seed);

  if (cat === "eye_training") {
    drawEyeTrainingThumbnail(ctx, W, H, themeVariant, rng);
    return true;
  }

  if (cat === "math") {
    const equation = String((comp.scenes.find((s) => s.kind === "math-question")?.data as { q?: string } | undefined)?.q ?? "7×8+15=?");
    drawMathThumbnail(ctx, W, H, themeVariant, rng, equation);
    return true;
  }

  if (cat === "story") {
    const hook = comp.meta.thumbText || comp.meta.title || "The Last Letter";
    drawStoryThumbnail(ctx, W, H, themeVariant, hook);
    return true;
  }

  if (cat === "gameplay") {
    drawGameplayThumbnail(ctx, W, H, themeVariant, rng);
    return true;
  }

  if (cat === "brain") {
    drawBrainThumbnail(ctx, W, H, themeVariant, rng);
    return true;
  }

  if (cat === "calm") {
    drawCalmThumbnail(ctx, comp, p, W, H, themeVariant);
    return true;
  }

  return false;
}

export function drawThumbnail(ctx: C2D, comp: Composition, style: ThumbStyle, W = 1280, H = 720) {
  const base = PALETTES[style.paletteIdx];
  const p = { ...base, accent: shiftHue(base.accent, style.hueShift % 60), accent2: shiftHue(base.accent2, (style.hueShift * 2) % 90) };
  const fam = FONTS.display[style.fontIdx];
  const rng = new RNG(styleFingerprint(style) + comp.seed);
  ctx.save();
  // background pattern
  ctx.fillStyle = p.bg; ctx.fillRect(0, 0, W, H);
  switch (style.pattern) {
    case "gradient": { const g = ctx.createLinearGradient(0, 0, W, H); g.addColorStop(0, p.bg); g.addColorStop(1, p.bg2); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); break; }
    case "grid": ctx.strokeStyle = hexA(p.muted, 0.5); ctx.lineWidth = 2; for (let x = 0; x < W; x += 64) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke(); } for (let y = 0; y < H; y += 64) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke(); } break;
    case "dots": ctx.fillStyle = hexA(p.muted, 0.6); for (let x = 20; x < W; x += 44) for (let y = 20; y < H; y += 44) { ctx.beginPath(); ctx.arc(x, y, 4, 0, Math.PI * 2); ctx.fill(); } break;
    case "rays": ctx.save(); ctx.translate(W * 0.7, H * 0.4); for (let i = 0; i < 24; i += 2) { ctx.fillStyle = hexA(p.bg2, 1); ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 1600, (i / 24) * Math.PI * 2, ((i + 1) / 24) * Math.PI * 2); ctx.fill(); } ctx.restore(); break;
    case "diagonal": ctx.strokeStyle = p.bg2; ctx.lineWidth = 40; for (let x = -H; x < W + H; x += 110) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + H, H); ctx.stroke(); } break;
    case "blobs": for (let i = 0; i < 4; i++) { const x = rng.next() * W, y = rng.next() * H; const g = ctx.createRadialGradient(x, y, 0, x, y, 300 + rng.next() * 300); g.addColorStop(0, hexA(i % 2 ? p.accent : p.accent2, 0.5)); g.addColorStop(1, hexA(p.bg, 0)); ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); } break;
    case "rings": ctx.strokeStyle = hexA(p.accent2, 0.5); ctx.lineWidth = 6; for (let r = 40; r < 900; r += 70) { ctx.beginPath(); ctx.arc(W * 0.8, H * 0.5, r, 0, Math.PI * 2); ctx.stroke(); } break;
    case "noise": ctx.fillStyle = hexA(p.fg, 0.08); for (let i = 0; i < 3000; i++) ctx.fillRect(rng.next() * W, rng.next() * H, 3, 3); break;
  }
  if (drawReferenceThumbnail(ctx, comp, p, W, H, style)) { ctx.restore(); return; }

  // decoration
  switch (style.deco) {
    case "arrows": ctx.fillStyle = p.accent2; for (let i = 0; i < 3; i++) { const x = W * 0.72 + i * 60, y = H * 0.7; ctx.beginPath(); ctx.moveTo(x, y - 60); ctx.lineTo(x + 60, y); ctx.lineTo(x, y + 60); ctx.lineTo(x + 20, y); ctx.closePath(); ctx.fill(); } break;
    case "rings": for (let i = 0; i < 5; i++) { ctx.strokeStyle = i % 2 ? p.accent : p.accent2; ctx.lineWidth = 14; ctx.beginPath(); ctx.arc(W * 0.82, H * 0.3, 40 + i * 45, 0, Math.PI * 2); ctx.stroke(); } break;
    case "confetti": for (let i = 0; i < 70; i++) { ctx.fillStyle = [p.accent, p.accent2, p.fg][i % 3]; ctx.save(); ctx.translate(rng.next() * W, rng.next() * H); ctx.rotate(rng.next() * 6); ctx.fillRect(-10, -4, 20, 8); ctx.restore(); } break;
    case "stripes": ctx.fillStyle = p.accent; for (let i = 0; i < 5; i++) ctx.fillRect(W - 60 - i * 40, 0, 16, H); break;
    case "halftone": for (let x = W * 0.6; x < W; x += 26) for (let y = 0; y < H; y += 26) { const r = ((x - W * 0.6) / (W * 0.4)) * 11; ctx.fillStyle = hexA(p.accent2, 0.9); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill(); } break;
    case "frame": ctx.strokeStyle = p.accent; ctx.lineWidth = 28; ctx.strokeRect(14, 14, W - 28, H - 28); ctx.strokeStyle = p.accent2; ctx.lineWidth = 6; ctx.strokeRect(50, 50, W - 100, H - 100); break;
    case "sparks": for (let i = 0; i < 12; i++) { ctx.fillStyle = i % 2 ? p.accent : p.fg; star(ctx, rng.next() * W, rng.next() * H, 14 + rng.next() * 30, rng.next()); ctx.fill(); } break;
  }
  // The hero is category-specific so the thumbnail reads before its text does.
  const cat = comp.category;
  ctx.save(); ctx.translate(W * 0.78, H * 0.5);
  if (cat === "eye_training") {
    ctx.fillStyle = p.fg; ctx.beginPath(); ctx.ellipse(0, 0, 210, 125, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(0, 0, 82, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.bg; ctx.beginPath(); ctx.arc(0, 0, 38, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(-22, -22, 15, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = p.accent2; ctx.lineWidth = 9; ctx.setLineDash([18, 14]); ctx.beginPath(); ctx.arc(0, 0, 270, -2.5, -0.35); ctx.stroke(); ctx.setLineDash([]);
  } else if (cat === "math") {
    ctx.fillStyle = p.accent; font(ctx, 230, fam); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(rng.pick(["7×8", "√81", "?", "12²", "+", "÷"]), 0, 0);
  } else if (cat === "story") {
    ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(30, -125, 86, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = p.fg; ctx.beginPath(); ctx.moveTo(-240, 145); ctx.lineTo(-110, 75); ctx.lineTo(-25, 105); ctx.lineTo(80, 25); ctx.lineTo(250, 145); ctx.closePath(); ctx.fill();
    ctx.fillStyle = p.bg; ctx.fillRect(-24, 60, 48, 85);
  } else if (cat === "gameplay") {
    ctx.fillStyle = hexA(p.bg, 0.7); rrect(ctx, -240, -225, 480, 450, 28); ctx.fill();
    for (let i = 0; i < 5; i++) for (let j = 0; j < 5; j++) { ctx.fillStyle = [p.accent, p.accent2, p.fg][(i + j) % 3]; rrect(ctx, -190 + i * 78, -175 + j * 70, 62, 54, 10); ctx.fill(); }
    ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(170, -160, 30, 0, Math.PI * 2); ctx.fill();
  } else if (cat === "brain") {
    ctx.strokeStyle = p.accent; ctx.lineWidth = 18; poly(ctx, 0, 0, 145, 6); ctx.stroke();
    ctx.fillStyle = p.fg; font(ctx, 180, fam); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, 8);
  } else if (cat === "calm") {
    ctx.strokeStyle = p.accent; ctx.lineWidth = 24; ctx.beginPath(); ctx.arc(0, 0, 150, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = p.fg; font(ctx, 100, fam); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("BREATHE", 0, 8);
  }
  else { ctx.fillStyle = p.accent; poly(ctx, 0, 0, 130, 3, -Math.PI / 2); ctx.fill(); ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.arc(60, 60, 60, 0, Math.PI * 2); ctx.fill(); }
  ctx.restore();

  // text
  const text = comp.meta.thumbText || comp.meta.title.split(" ").slice(0, 3).join(" ");
  const sub = comp.meta.thumbSub;
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.rotate((style.tilt * Math.PI) / 180); ctx.translate(-W / 2, -H / 2);
  const maxW = style.layout === "split-vertical" || style.layout === "left-stack" || style.layout === "corner-box" ? W * 0.58 : W * 0.86;
  const size = fitText(ctx, text, maxW, fam, 220, 60);
  const lines = wrap(ctx, text, maxW);
  ctx.textBaseline = "middle";
  let x = W * 0.06, y = H * 0.5; ctx.textAlign = "left";
  switch (style.layout) {
    case "center-burst": x = W / 2; ctx.textAlign = "center"; break;
    case "diagonal-band": ctx.fillStyle = hexA(p.accent2, 0.9); ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.12); ctx.fillRect(-W, -size * 0.7 * lines.length, W * 2, size * 1.4 * lines.length); ctx.restore(); x = W / 2; ctx.textAlign = "center"; break;
    case "corner-box": ctx.fillStyle = p.fg; ctx.fillRect(0, 0, W * 0.62, H * 0.5); x = W * 0.04; y = H * 0.25; break;
    case "split-vertical": ctx.fillStyle = p.accent; ctx.fillRect(0, 0, W * 0.6, H); x = W * 0.04; break;
    case "bottom-bar": ctx.fillStyle = p.fg; ctx.fillRect(0, H * 0.66, W, H * 0.34); x = W * 0.04; y = H * 0.83; break;
    case "circle-badge": ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(W * 0.35, H * 0.5, Math.min(W, H) * 0.42, 0, Math.PI * 2); ctx.fill(); x = W * 0.35; ctx.textAlign = "center"; break;
    case "scatter": x = W * 0.08; y = H * 0.35; break;
  }
  const dark = style.layout === "corner-box" || style.layout === "bottom-bar";
  const fg = dark ? p.bg : p.fg;
  const lh = size * 1.02;
  lines.forEach((ln, i) => {
    const ly = y + (i - (lines.length - 1) / 2) * lh + (style.layout === "scatter" ? i * 30 : 0);
    const lx = style.layout === "scatter" ? x + i * 90 : x;
    font(ctx, size, fam);
    fxText(ctx, ln, lx, ly, style.fx, fg, style.layout === "split-vertical" ? p.bg : p.accent, p.accent2, size);
  });
  if (sub) {
    font(ctx, Math.max(34, size * 0.28), FONTS.body[style.fontIdx % FONTS.body.length], "bold");
    const sy = y + (lines.length * lh) / 2 + size * 0.3;
    const sw = ctx.measureText(sub).width;
    const sx = ctx.textAlign === "center" ? x - sw / 2 - 16 : x - 16;
    ctx.fillStyle = p.accent2; rrect(ctx, sx, sy - 28, sw + 32, 56, 10); ctx.fill();
    ctx.fillStyle = p.bg; ctx.fillText(sub, x, sy);
  }
  ctx.restore();
  ctx.restore();
}
