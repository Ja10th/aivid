// Isomorphic thumbnail renderer with combinatorial, fingerprinted styles.
import { Composition, FONTS, PALETTES, Palette, RNG } from "./core";
import { C2D, fitText, hexA, rrect, wrap, font, poly, star } from "./draw";
import {
  drawEyeTrainingThumbnail,
  drawGameplayThumbnail,
  drawMathThumbnail,
  drawBrainThumbnail,
  drawStoryThumbnail,
  drawCalmThumbnail,
} from "./thumbnail-categories";

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
    // 800 unique variants per category: 10 scene types × 20 palettes × 4 micro-layouts
    themeVariant: rng.int(0, 799),
  };
}

export function thumbnailCandidates(seed: string, category: string): ThumbStyle[] {
  const rng = new RNG(seed + "thumb-candidates-v6");
  const key = (category in CATEGORY_LAYOUTS ? category : "mixed") as ThumbnailCategory;
  const layouts = CATEGORY_LAYOUTS[key];

  // Pick a random starting colorIdx and microLayout for this regenerate session
  const colorBase = rng.int(0, 19);
  const microBase = rng.int(0, 3);

  // Shuffle 10 scene types, take first 5 — guarantees 5 visually distinct artworks every time
  const allSceneTypes = rng.shuffle([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]);

  return Array.from({ length: 5 }, (_, index) => {
    const sceneType = allSceneTypes[index]; // guaranteed unique scene type
    const colorIdx = (colorBase + index * 4) % 20; // spread across 20 palettes
    const micro = (microBase + index) % 4;
    // Encode into themeVariant: sceneType + colorIdx*10 + micro*200
    const themeVariant = sceneType + colorIdx * 10 + micro * 200;

    const style = randomThumbStyle(rng, key);
    return {
      ...style,
      layout: layouts[index % layouts.length],
      fontIdx: (style.fontIdx + index * 3) % FONTS.display.length,
      hueShift: index * 72,
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


// ===== MAIN DISPATCHER =====
function drawReferenceThumbnail(ctx: C2D, comp: Composition, p: Palette, W: number, H: number, style: ThumbStyle) {
  const cat = comp.category;
  const themeVariant = style.themeVariant ?? 0;
  const rng = new RNG(styleFingerprint(style) + comp.seed);
  const hook = comp.meta?.thumbText || comp.meta?.title || "";

  if (cat === "eye_training") {
    drawEyeTrainingThumbnail(ctx, W, H, themeVariant, rng, hook);
    return true;
  }

  if (cat === "math") {
    const equation = String((comp.scenes?.find((s) => s.kind === "math-question")?.data as { q?: string } | undefined)?.q ?? "7×8+15=?");
    drawMathThumbnail(ctx, W, H, themeVariant, rng, equation, hook);
    return true;
  }

  if (cat === "story") {
    const storyTitle = comp.meta?.thumbText || comp.meta?.title || "The Last Letter";
    drawStoryThumbnail(ctx, W, H, themeVariant, storyTitle);
    return true;
  }

  if (cat === "gameplay") {
    drawGameplayThumbnail(ctx, W, H, themeVariant, rng, hook);
    return true;
  }

  if (cat === "brain") {
    drawBrainThumbnail(ctx, W, H, themeVariant, rng, hook);
    return true;
  }

  if (cat === "calm") {
    drawCalmThumbnail(ctx, comp, p, W, H, themeVariant, hook);
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
