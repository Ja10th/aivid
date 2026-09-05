// Isomorphic thumbnail renderer with combinatorial, fingerprinted styles.
import { Composition, FONTS, PALETTES, RNG } from "./core";
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
}

export function styleFingerprint(s: ThumbStyle) {
  return `${s.layout}|${s.paletteIdx}|${s.fontIdx}|${s.deco}|${s.fx}|${s.pattern}`;
}

export function randomThumbStyle(rng: RNG): ThumbStyle {
  return {
    layout: rng.pick(THUMB_LAYOUTS),
    paletteIdx: rng.int(0, PALETTES.length - 1),
    fontIdx: rng.int(0, FONTS.display.length - 1),
    deco: rng.pick(THUMB_DECOS),
    fx: rng.pick(THUMB_FX),
    pattern: rng.pick(THUMB_PATTERNS),
    tilt: rng.range(-9, 9),
    hueShift: rng.int(0, 359),
  };
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
  // subject graphic: a visual hint of the category
  const cat = comp.category;
  ctx.save(); ctx.translate(W * 0.78, H * 0.5);
  if (cat === "eye_training") { ctx.fillStyle = p.fg; ctx.beginPath(); ctx.ellipse(0, 0, 170, 95, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(0, 0, 70, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.bg; ctx.beginPath(); ctx.arc(0, 0, 32, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(-18, -18, 12, 0, Math.PI * 2); ctx.fill(); }
  else if (cat === "math") { ctx.fillStyle = p.accent; font(ctx, 190, fam); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(rng.pick(["7×8", "√81", "?", "12²", "+", "÷"]), 0, 0); }
  else if (cat === "story") { ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(-40, -60, 60, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.fg; ctx.fillRect(-160, 40, 320, 16); ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.moveTo(-120, 40); ctx.lineTo(-40, -40); ctx.lineTo(40, 40); ctx.closePath(); ctx.fill(); }
  else if (cat === "gameplay") { ctx.fillStyle = p.accent; for (let i = 0; i < 5; i++) ctx.fillRect(-120 + i * 42, 0, 38, 38); ctx.fillStyle = p.accent2; ctx.beginPath(); ctx.arc(120, -60, 24, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = p.fg; ctx.fillRect(-120, -100, 38, 38); ctx.fillRect(-78, -100, 38, 38); }
  else if (cat === "brain") { ctx.strokeStyle = p.accent; ctx.lineWidth = 14; poly(ctx, 0, 0, 120, 6); ctx.stroke(); ctx.fillStyle = p.fg; font(ctx, 140, fam); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText("?", 0, 6); }
  else if (cat === "calm") { for (let i = 4; i > 0; i--) { ctx.fillStyle = hexA(p.accent, 0.25 * i); ctx.beginPath(); ctx.arc(0, 0, 40 * i, 0, Math.PI * 2); ctx.fill(); } }
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
