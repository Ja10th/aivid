// Isomorphic canvas renderer. No Node imports.
import { Composition, Scene, RNG, clamp, lerp, easeInOut, easeOutBack, easeOutElastic, estimateSpeech, Palette } from "./core";

export type C2D = CanvasRenderingContext2D;
export type Cache = Map<string, unknown>;

const TRANS_DUR = 0.7;

// ---------- helpers ----------
function font(ctx: C2D, size: number, family: string, weight = "") {
  ctx.font = `${weight ? weight + " " : ""}${Math.round(size)}px "${family}", "DejaVu Sans", sans-serif`;
}
function fitText(ctx: C2D, text: string, maxW: number, family: string, start: number, min = 14, weight = "") {
  let s = start;
  font(ctx, s, family, weight);
  while (ctx.measureText(text).width > maxW && s > min) {
    s -= Math.max(1, s * 0.06);
    font(ctx, s, family, weight);
  }
  return s;
}
function wrap(ctx: C2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const test = cur ? cur + " " + w : w;
    if (ctx.measureText(test).width > maxW && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}
function rrect(ctx: C2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function hexA(hex: string, a: number) {
  const h = hex.replace("#", "");
  const n = parseInt(h.length === 3 ? h.split("").map((c) => c + c).join("") : h, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}
function poly(ctx: C2D, cx: number, cy: number, r: number, n: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < n; i++) {
    const a = rot + (i / n) * Math.PI * 2;
    const x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function star(ctx: C2D, cx: number, cy: number, r: number, rot = 0) {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const rr = i % 2 ? r * 0.45 : r;
    const a = rot + (i / 10) * Math.PI * 2 - Math.PI / 2;
    const x = cx + Math.cos(a) * rr, y = cy + Math.sin(a) * rr;
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
}
function drawShape(ctx: C2D, shape: string, x: number, y: number, r: number, rot: number) {
  switch (shape) {
    case "ring": ctx.lineWidth = Math.max(3, r * 0.3); ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke(); break;
    case "star": star(ctx, x, y, r * 1.3, rot); ctx.fill(); break;
    case "square": ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.fillRect(-r, -r, r * 2, r * 2); ctx.restore(); break;
    case "diamond": poly(ctx, x, y, r * 1.2, 4, rot); ctx.fill(); break;
    default: ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  }
}

// ---------- backgrounds ----------
function drawBackground(ctx: C2D, s: Scene, comp: Composition, t: number) {
  const { width: W, height: H } = comp;
  const p = s.palette;
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, W, H);
  const seedR = new RNG(s.id + "bg");
  switch (s.bgStyle) {
    case "gradient": {
      const a = t * 0.05;
      const g = ctx.createLinearGradient(W * (0.5 + Math.cos(a) * 0.5), 0, W * (0.5 - Math.cos(a) * 0.5), H);
      g.addColorStop(0, p.bg); g.addColorStop(1, p.bg2);
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H); break;
    }
    case "grid": {
      ctx.strokeStyle = hexA(p.muted, 0.35); ctx.lineWidth = 1;
      const step = 40 + seedR.int(0, 40); const off = (t * 12) % step;
      ctx.beginPath();
      for (let x = -step + off; x < W + step; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x, H); }
      for (let y = -step + off; y < H + step; y += step) { ctx.moveTo(0, y); ctx.lineTo(W, y); }
      ctx.stroke(); break;
    }
    case "dots": {
      ctx.fillStyle = hexA(p.muted, 0.45);
      const step = 36 + seedR.int(0, 30);
      for (let x = step / 2; x < W; x += step) for (let y = step / 2; y < H; y += step) {
        const r = 1.5 + Math.sin(t * 2 + x * 0.02 + y * 0.03) * 1.2;
        ctx.beginPath(); ctx.arc(x, y, Math.max(0.3, r), 0, Math.PI * 2); ctx.fill();
      }
      break;
    }
    case "noise": {
      ctx.fillStyle = hexA(p.fg, 0.05);
      const n = 400; const r = new RNG(s.id + Math.floor(t * 6));
      for (let i = 0; i < n; i++) ctx.fillRect(r.next() * W, r.next() * H, 2, 2);
      break;
    }
    case "rays": {
      ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(t * 0.08 * (seedR.chance(0.5) ? 1 : -1));
      const n = 12 + seedR.int(0, 12);
      for (let i = 0; i < n; i++) {
        if (i % 2) continue;
        ctx.fillStyle = hexA(p.bg2, 0.9);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.arc(0, 0, Math.max(W, H), (i / n) * Math.PI * 2, ((i + 1) / n) * Math.PI * 2); ctx.closePath(); ctx.fill();
      }
      ctx.restore(); break;
    }
    case "diagonal": {
      ctx.save(); ctx.strokeStyle = hexA(p.bg2, 1); ctx.lineWidth = 18 + seedR.int(0, 30);
      const step = ctx.lineWidth * 2.2; const off = (t * 20) % step;
      ctx.beginPath();
      for (let x = -H - step + off; x < W + H; x += step) { ctx.moveTo(x, 0); ctx.lineTo(x + H, H); }
      ctx.stroke(); ctx.restore(); break;
    }
    case "blobs": {
      const n = 3 + seedR.int(0, 3);
      for (let i = 0; i < n; i++) {
        const bx = seedR.next(), by = seedR.next(), br = 0.15 + seedR.next() * 0.25, sp = 0.2 + seedR.next() * 0.4;
        const x = W * (bx + Math.sin(t * sp + i) * 0.08), y = H * (by + Math.cos(t * sp * 0.8 + i) * 0.08);
        const g = ctx.createRadialGradient(x, y, 0, x, y, Math.max(W, H) * br);
        g.addColorStop(0, hexA(i % 2 ? p.accent : p.accent2, 0.22)); g.addColorStop(1, hexA(p.bg, 0));
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      }
      break;
    }
    case "rings": {
      ctx.strokeStyle = hexA(p.muted, 0.4); ctx.lineWidth = 2;
      const cx = W * (0.2 + seedR.next() * 0.6), cy = H * (0.2 + seedR.next() * 0.6);
      const step = 40; const off = (t * 25) % step;
      for (let r = off; r < Math.max(W, H) * 1.2; r += step) { ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke(); }
      break;
    }
  }
}

// ---------- shared text blocks ----------
function progressBar(ctx: C2D, comp: Composition, s: Scene, lt: number, color: string) {
  const { width: W, height: H } = comp;
  ctx.fillStyle = hexA(color, 0.9);
  ctx.fillRect(0, H - 6, W * clamp(lt / s.duration, 0, 1), 6);
}
function timerRing(ctx: C2D, x: number, y: number, r: number, frac: number, p: Palette, label: string, fam: string) {
  ctx.lineWidth = r * 0.16; ctx.strokeStyle = hexA(p.muted, 0.5);
  ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
  ctx.strokeStyle = frac < 0.25 ? p.accent2 : p.accent;
  ctx.beginPath(); ctx.arc(x, y, r, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * frac); ctx.stroke();
  ctx.fillStyle = p.fg; ctx.textAlign = "center"; ctx.textBaseline = "middle";
  font(ctx, r * 0.9, fam); ctx.fillText(label, x, y + r * 0.05);
}
function captionWords(ctx: C2D, comp: Composition, text: string, elapsedSinceNarr: number, fam: string, y: number, color: string, hi: string, maxW: number, size: number, align: "left" | "center" = "center", x0?: number) {
  font(ctx, size, fam);
  const words = text.split(/\s+/);
  const total = estimateSpeech(text) - 0.6;
  const shown = elapsedSinceNarr <= 0 ? 0 : Math.min(words.length, Math.ceil((elapsedSinceNarr / total) * words.length));
  const lines = wrap(ctx, text, maxW);
  const lh = size * 1.25;
  let wi = 0;
  ctx.textBaseline = "alphabetic";
  const startY = y - ((lines.length - 1) * lh) / 2;
  for (let li = 0; li < lines.length; li++) {
    const lw = lines[li].split(" ");
    const lineW = ctx.measureText(lines[li]).width;
    let x = align === "center" ? (x0 ?? comp.width / 2) - lineW / 2 : (x0 ?? 0);
    for (const w of lw) {
      const active = wi < shown;
      ctx.fillStyle = active ? hi : color;
      ctx.globalAlpha = active ? 1 : 0.45;
      ctx.textAlign = "left";
      ctx.fillText(w, x, startY + li * lh);
      x += ctx.measureText(w + " ").width;
      wi++;
    }
  }
  ctx.globalAlpha = 1;
}

// ---------- scenes ----------
type SceneFn = (ctx: C2D, comp: Composition, s: Scene, lt: number, cache: Cache) => void;

const sceneTitle: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const e = easeOutBack(clamp(lt / 0.9, 0, 1));
  const r = new RNG(s.id + "layout");
  const layout = r.int(0, 3);
  const title = String(s.data.title ?? ""); const sub = String(s.data.sub ?? "");
  ctx.save();
  // decorative block
  ctx.fillStyle = p.accent;
  if (layout === 0) ctx.fillRect(0, H * 0.62 - 30 * e, W * 0.3 * e, 18);
  else if (layout === 1) { ctx.beginPath(); ctx.arc(W * 0.8, H * 0.25, 120 * e, 0, Math.PI * 2); ctx.fill(); }
  else if (layout === 2) { ctx.save(); ctx.translate(W * 0.15, H * 0.75); ctx.rotate(-0.4); ctx.fillRect(-200 * e, -20, 400 * e, 40); ctx.restore(); }
  else { ctx.fillRect(W * 0.55, 0, 12, H * e); }
  const maxW = W * 0.86;
  const size = fitText(ctx, title, maxW, th.fontDisplay, comp.orientation === "landscape" ? 120 : 84, 28);
  const lines = wrap(ctx, title, maxW);
  ctx.textBaseline = "middle";
  const x = layout === 2 ? W * 0.08 : layout === 3 ? W * 0.6 : W / 2;
  ctx.textAlign = layout === 2 || layout === 3 ? "left" : "center";
  const baseY = layout === 1 ? H * 0.55 : H * 0.45;
  lines.forEach((ln, i) => {
    const y = baseY + (i - (lines.length - 1) / 2) * size * 1.05;
    const off = (1 - e) * (i % 2 ? 80 : -80);
    ctx.fillStyle = p.accent2; ctx.fillText(ln, x + off + 5, y + 5);
    ctx.fillStyle = p.fg; ctx.fillText(ln, x + off, y);
  });
  if (sub) {
    const e2 = clamp((lt - 0.5) / 0.8, 0, 1);
    ctx.globalAlpha = e2;
    font(ctx, Math.max(20, size * 0.3), th.fontBody);
    ctx.fillStyle = p.fg; ctx.fillText(sub, x, baseY + (lines.length * size * 1.05) / 2 + size * 0.35 + (1 - e2) * 20);
    ctx.globalAlpha = 1;
  }
  ctx.restore();
};

const sceneOutro: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const e = easeInOut(clamp(lt / 1, 0, 1));
  const text = String(s.data.text ?? "Thanks");
  const size = fitText(ctx, text, W * 0.8, th.fontDisplay, comp.orientation === "landscape" ? 110 : 80, 30);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = p.fg; ctx.globalAlpha = e;
  ctx.fillText(text, W / 2, H * 0.38);
  ctx.globalAlpha = 1;
  const e2 = easeOutElastic(clamp((lt - 1.2) / 1.4, 0, 1));
  ctx.save(); ctx.translate(W / 2, H * 0.62); ctx.scale(e2, e2);
  rrect(ctx, -170, -40, 340, 80, 40); ctx.fillStyle = p.accent; ctx.fill();
  ctx.fillStyle = p.bg; font(ctx, 34, th.fontBody, "bold"); ctx.fillText("SUBSCRIBE", 0, 2);
  ctx.restore();
  const bl = Math.sin(lt * 3) > 0;
  ctx.fillStyle = bl ? p.accent2 : p.muted; font(ctx, 24, th.fontMono);
  ctx.fillText("new one tomorrow", W / 2, H * 0.62 + 80);
};

const sceneInterlude: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const text = String(s.data.text ?? "");
  const e = easeInOut(clamp(lt / 0.6, 0, 1)) * (1 - easeInOut(clamp((lt - (s.duration - 0.6)) / 0.6, 0, 1)));
  const r = new RNG(s.id);
  const x = W * r.range(0.25, 0.75), y = H * r.range(0.3, 0.7);
  ctx.save(); ctx.translate(x, y); ctx.rotate(r.range(-0.15, 0.15)); ctx.globalAlpha = e;
  const size = fitText(ctx, text, W * 0.7, th.fontDisplay, 90, 24);
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = p.accent; ctx.fillText(text, 4, 4); ctx.fillStyle = p.fg; ctx.fillText(text, 0, 0);
  ctx.restore();
  ctx.globalAlpha = 1;
  void size;
};

function followPos(path: string, ph: number, W: number, H: number, rng: RNG): [number, number] {
  const cx = W / 2, cy = H / 2, rx = W * 0.38, ry = H * 0.36;
  switch (path) {
    case "circle": return [cx + Math.cos(ph) * Math.min(rx, ry), cy + Math.sin(ph) * Math.min(rx, ry)];
    case "figure8": return [cx + Math.sin(ph) * rx, cy + Math.sin(ph * 2) * ry * 0.8];
    case "lissajous": return [cx + Math.sin(ph * 3) * rx, cy + Math.sin(ph * 2 + 1) * ry];
    case "zigzag": { const u = (ph / (Math.PI * 2)) % 1; const k = Math.floor(u * 8); const f = (u * 8) % 1; const x0 = k % 2 ? W * 0.1 : W * 0.9, x1 = k % 2 ? W * 0.9 : W * 0.1; return [lerp(x0, x1, f), H * 0.15 + (k / 7) * H * 0.7]; }
    case "spiral": { const u = (ph / (Math.PI * 2)) % 2; const rr = (u < 1 ? u : 2 - u); return [cx + Math.cos(ph * 3) * rr * rx, cy + Math.sin(ph * 3) * rr * ry]; }
    case "wave": return [cx + Math.sin(ph) * rx, cy + Math.sin(ph * 4) * ry * 0.25];
    case "square": { const u = (ph / (Math.PI * 2)) % 1; const side = Math.floor(u * 4), f = (u * 4) % 1; const L = cx - rx * 0.9, R = cx + rx * 0.9, T = cy - ry * 0.9, B = cy + ry * 0.9; if (side === 0) return [lerp(L, R, f), T]; if (side === 1) return [R, lerp(T, B, f)]; if (side === 2) return [lerp(R, L, f), B]; return [L, lerp(B, T, f)]; }
    case "diagonal": {
      const u = (Math.sin(ph) + 1) / 2;
      return [lerp(cx - rx, cx + rx, u), lerp(cy - ry, cy + ry, u)];
    }
    case "bowtie": {
      const u = (ph / (Math.PI * 2)) % 1;
      const t = u * 4;
      if (t < 1) return [lerp(cx - rx, cx, t), lerp(cy - ry, cy, t)];
      if (t < 2) return [lerp(cx, cx + rx, t - 1), lerp(cy, cy + ry, t - 1)];
      if (t < 3) return [lerp(cx + rx, cx, t - 2), lerp(cy + ry, cy, t - 2)];
      return [lerp(cx, cx - rx, t - 3), lerp(cy, cy - ry, t - 3)];
    }
    case "triangle": {
      const u = (ph / (Math.PI * 2)) % 1;
      const t = u * 3;
      const p0: [number, number] = [cx, cy - ry];
      const p1: [number, number] = [cx + rx, cy + ry];
      const p2: [number, number] = [cx - rx, cy + ry];
      if (t < 1) return [lerp(p0[0], p1[0], t), lerp(p0[1], p1[1], t)];
      if (t < 2) return [lerp(p1[0], p2[0], t - 1), lerp(p1[1], p2[1], t - 1)];
      return [lerp(p2[0], p0[0], t - 2), lerp(p2[1], p0[1], t - 2)];
    }
    default: { // random smooth: sum of sines with random freqs
      const a = rng.next() * 2 + 0.5, b = rng.next() * 2 + 0.5, c = rng.next() * 6, d = rng.next() * 6;
      return [cx + (Math.sin(ph * a + c) * 0.6 + Math.sin(ph * b * 1.7 + d) * 0.4) * rx, cy + (Math.cos(ph * b + d) * 0.6 + Math.sin(ph * a * 1.3 + c) * 0.4) * ry];
    }
  }
}

const sceneEyeFollow: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const speed = Number(s.data.speed), size = Number(s.data.size);

  if (s.data.convergence) {
    const u = (Math.sin(lt * speed * 2) + 1) / 2;
    const sep = lerp(W * 0.35, 14, u);
    const y = H / 2;
    ctx.fillStyle = p.accent; ctx.shadowColor = p.accent; ctx.shadowBlur = 20;
    drawShape(ctx, "dot", W / 2 - sep, y, size, lt);
    ctx.fillStyle = p.accent2; ctx.shadowColor = p.accent2;
    drawShape(ctx, "dot", W / 2 + sep, y, size, lt);
    ctx.shadowBlur = 0;
    ctx.strokeStyle = hexA(p.muted, 0.4); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(W / 2, H / 2 - 24); ctx.lineTo(W / 2, H / 2 + 24); ctx.stroke();
    ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 22, comp.theme.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillText("convergence · keep both in focus", 24, 20);
    progressBar(ctx, comp, s, lt, p.accent2);
    return;
  }

  if (s.data.blinkCued) {
    const cycle = 3.2;
    const phB = (lt % cycle) / cycle;
    const pulse = Math.sin(phB * Math.PI);
    const isBlink = phB > 0.75;
    const rRing = lerp(32, 88, pulse);
    ctx.strokeStyle = isBlink ? p.accent2 : p.accent;
    ctx.lineWidth = isBlink ? 8 : 4;
    ctx.beginPath(); ctx.arc(W / 2, H / 2, rRing, 0, Math.PI * 2); ctx.stroke();
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    if (isBlink) {
      ctx.fillStyle = p.accent2; font(ctx, 36, comp.theme.fontDisplay);
      ctx.fillText("BLINK", W / 2, H / 2);
    } else {
      ctx.fillStyle = hexA(p.fg, 0.6); font(ctx, 22, comp.theme.fontMono);
      ctx.fillText("relax", W / 2, H / 2);
    }
    ctx.textAlign = "left"; ctx.textBaseline = "top";
    ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 22, comp.theme.fontMono);
    ctx.fillText("blink training · full deliberate blink", 24, 20);
    progressBar(ctx, comp, s, lt, p.accent2);
    return;
  }

  const rng = new RNG(s.id + "path");
  const ph = lt * speed * (s.data.rotateDir as number);
  if (s.data.trail) {
    for (let i = 12; i > 0; i--) {
      const [tx, ty] = followPos(String(s.data.path), ph - i * 0.05 * speed, W, H, new RNG(s.id + "path"));
      ctx.fillStyle = hexA(p.accent, 0.4 * (1 - i / 12)); ctx.beginPath(); ctx.arc(tx, ty, size * (1 - i / 14), 0, Math.PI * 2); ctx.fill();
    }
  }
  const [x, y] = followPos(String(s.data.path), ph, W, H, rng);
  ctx.fillStyle = p.accent; ctx.strokeStyle = p.accent;
  ctx.shadowColor = p.accent; ctx.shadowBlur = 20;
  drawShape(ctx, String(s.data.shape), x, y, size, lt);
  ctx.shadowBlur = 0;
  // small center cross + label
  ctx.strokeStyle = hexA(p.muted, 0.6); ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(W / 2 - 10, H / 2); ctx.lineTo(W / 2 + 10, H / 2); ctx.moveTo(W / 2, H / 2 - 10); ctx.lineTo(W / 2, H / 2 + 10); ctx.stroke();
  ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 22, comp.theme.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`follow · ${s.data.path}`, 24, 20);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneEyeSaccade: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const interval = Number(s.data.interval); const idx = Math.floor(lt / interval); const f = (lt % interval) / interval;
  const style = String(s.data.style); const size = Number(s.data.size);
  const r = new RNG(s.id + idx);
  let x = W / 2, y = H / 2;
  if (style === "horizontal") { x = idx % 2 ? W * 0.12 : W * 0.88; }
  else if (style === "vertical") { y = idx % 2 ? H * 0.12 : H * 0.88; }
  else if (style === "diagonal") { const k = idx % 4; x = k === 0 || k === 3 ? W * 0.12 : W * 0.88; y = k < 2 ? H * 0.12 : H * 0.88; }
  else if (style === "corners") { const k = idx % 4; x = k % 2 ? W * 0.88 : W * 0.12; y = k < 2 ? H * 0.12 : H * 0.88; }
  else { x = W * r.range(0.08, 0.92); y = H * r.range(0.1, 0.9); }
  const pop = easeOutBack(clamp(f * 4, 0, 1));
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(x, y, size * pop, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.fg; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(x, y, size * pop * 1.6 * (1 - f) + 2, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 22, comp.theme.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`saccades · ${style} · ${idx + 1}`, 24, 20);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneEyeFocus: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const period = Number(s.data.period);
  const u = (Math.sin((lt / period) * Math.PI * 2 - Math.PI / 2) + 1) / 2; // 0..1
  const r = lerp(Math.min(W, H) * 0.05, Math.min(W, H) * 0.42, easeInOut(u));
  ctx.strokeStyle = p.accent; ctx.fillStyle = p.accent;
  if (s.data.shape === "ring") { ctx.lineWidth = Math.max(4, r * 0.12); ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.stroke(); }
  else if (s.data.shape === "hex") { ctx.lineWidth = Math.max(4, r * 0.1); poly(ctx, W / 2, H / 2, r, 6, lt * 0.3); ctx.stroke(); }
  else { font(ctx, r * 1.8, comp.theme.fontDisplay); ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(String(s.data.letter), W / 2, H / 2); }
  ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 26, comp.theme.fontMono); ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(u > 0.5 ? "NEAR" : "FAR", W / 2, H * 0.06);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneEyePeripheral: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const every = Number(s.data.flashEvery); const idx = Math.floor(lt / every); const f = (lt % every) / every;
  const r = new RNG(s.id + idx);
  // center fixation
  ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(W / 2, H / 2, 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = p.accent; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(W / 2, H / 2, 22 + Math.sin(lt * 4) * 3, 0, Math.PI * 2); ctx.stroke();
  if (f < 0.55) {
    const n = Number(s.data.count); const spread = Number(s.data.spread);
    for (let i = 0; i < n; i++) {
      const ang = r.next() * Math.PI * 2; const dist = Math.min(W, H) * (spread + r.next() * 0.1);
      const x = W / 2 + Math.cos(ang) * dist * (W / Math.min(W, H)), y = H / 2 + Math.sin(ang) * dist;
      ctx.fillStyle = r.chance(0.5) ? p.accent : p.accent2; ctx.globalAlpha = 1 - f / 0.55;
      drawShape(ctx, r.pick(["dot", "square", "diamond", "star"]), clamp(x, 40, W - 40), clamp(y, 40, H - 40), 18 + r.int(0, 14), 0);
      ctx.globalAlpha = 1;
    }
  }
  ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 22, comp.theme.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("peripheral · eyes on center", 24, 20);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneEyePalming: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const dim = easeInOut(clamp(lt / 2, 0, 1));
  ctx.fillStyle = hexA("#000000", 0.75 * dim); ctx.fillRect(0, 0, W, H);
  ctx.fillStyle = hexA(p.fg, 0.8); font(ctx, 46, comp.theme.fontBody); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText("eyes closed · palms warm", W / 2, H / 2);
  font(ctx, 30, comp.theme.fontMono);
  ctx.fillText(`${Math.max(0, Math.ceil(s.duration - lt))}`, W / 2, H / 2 + 60);
};

const sceneEyeRotation: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const dir = String(s.data.direction ?? "clockwise");
  const speed = Number(s.data.speed ?? 0.5);
  const angle = (dir === "clockwise" ? 1 : -1) * lt * speed * Math.PI * 2;
  const radius = Math.min(W * 0.36, H * 0.36);
  const cx = W / 2, cy = H / 2;

  // Draw circular track
  ctx.strokeStyle = hexA(p.muted, 0.25); ctx.lineWidth = 3;
  ctx.beginPath(); ctx.arc(cx, cy, radius, 0, Math.PI * 2); ctx.stroke();

  // Clock ticks
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const r1 = radius - (i % 3 === 0 ? 16 : 8);
    ctx.strokeStyle = hexA(p.fg, i % 3 === 0 ? 0.6 : 0.25);
    ctx.lineWidth = i % 3 === 0 ? 3 : 1.5;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1);
    ctx.lineTo(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
    ctx.stroke();
  }

  // Trailing ghost targets
  for (let i = 8; i > 0; i--) {
    const ta = angle - (dir === "clockwise" ? 1 : -1) * (i * 0.08);
    const tx = cx + Math.cos(ta) * radius, ty = cy + Math.sin(ta) * radius;
    ctx.fillStyle = hexA(p.accent, 0.3 * (1 - i / 8));
    ctx.beginPath(); ctx.arc(tx, ty, 18 * (1 - i / 10), 0, Math.PI * 2); ctx.fill();
  }

  // Moving target
  const tx = cx + Math.cos(angle) * radius, ty = cy + Math.sin(angle) * radius;
  ctx.fillStyle = p.accent; ctx.shadowColor = p.accent; ctx.shadowBlur = 24;
  ctx.beginPath(); ctx.arc(tx, ty, 20, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(tx, ty, 6, 0, Math.PI * 2); ctx.fill();

  // Center indicator
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = hexA(p.fg, 0.45); font(ctx, 28, th.fontBody);
  ctx.fillText("roll smoothly with the target", cx, cy);

  ctx.fillStyle = hexA(p.fg, 0.85); font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`eye rotation · ${dir}`, 24, 20);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneEyeTracing: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const shape = String(s.data.shape ?? "star");
  const speed = Number(s.data.speed ?? 0.6);
  const u = (lt * speed) % 1;
  const cx = W / 2, cy = H / 2;
  const size = Math.min(W * 0.32, H * 0.32);

  // Guide shape
  ctx.strokeStyle = hexA(p.muted, 0.4); ctx.lineWidth = 3; ctx.setLineDash([8, 8]);
  ctx.save(); ctx.translate(cx, cy);
  if (shape === "star") star(ctx, 0, 0, size);
  else if (shape === "diamond") poly(ctx, 0, 0, size, 4);
  else if (shape === "infinity") {
    ctx.beginPath();
    for (let t = 0; t <= Math.PI * 2; t += 0.05) {
      const x = Math.sin(t) * size, y = Math.sin(t * 2) * size * 0.5;
      if (t === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath(); ctx.stroke();
  } else {
    ctx.beginPath(); ctx.arc(0, 0, size, 0, Math.PI * 2); ctx.stroke();
  }
  if (shape !== "infinity") ctx.stroke();
  ctx.setLineDash([]);
  ctx.restore();

  // Cursor pos
  let px = cx, py = cy;
  if (shape === "star" || shape === "diamond") {
    const sides = shape === "star" ? 10 : 4;
    const seg = Math.floor(u * sides), subU = (u * sides) % 1;
    const getPoint = (i: number) => {
      const n = shape === "star" ? 10 : 4;
      const rr = shape === "star" ? (i % 2 ? size * 0.45 : size) : size;
      const a = (i / n) * Math.PI * 2 - Math.PI / 2;
      return [cx + Math.cos(a) * rr, cy + Math.sin(a) * rr];
    };
    const p1 = getPoint(seg), p2 = getPoint((seg + 1) % sides);
    px = lerp(p1[0], p2[0], subU); py = lerp(p1[1], p2[1], subU);
  } else if (shape === "infinity") {
    const t = u * Math.PI * 2;
    px = cx + Math.sin(t) * size; py = cy + Math.sin(t * 2) * size * 0.5;
  } else {
    const a = u * Math.PI * 2;
    px = cx + Math.cos(a) * size; py = cy + Math.sin(a) * size;
  }

  // Cursor
  ctx.fillStyle = p.accent; ctx.shadowColor = p.accent; ctx.shadowBlur = 20;
  ctx.beginPath(); ctx.arc(px, py, 18, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = p.fg; ctx.beginPath(); ctx.arc(px, py, 5, 0, Math.PI * 2); ctx.fill();

  ctx.fillStyle = hexA(p.fg, 0.85); font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`trace · ${shape}`, 24, 20);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneBreathing: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette;
  const inh = Number(s.data.inhale), hold = Number(s.data.hold), exh = Number(s.data.exhale);
  const cycle = inh + hold + exh; const c = lt % cycle;
  let u = 0, label = "", rem = 0;
  if (c < inh) { u = easeInOut(c / inh); label = "inhale"; rem = inh - c; }
  else if (c < inh + hold) { u = 1; label = "hold"; rem = inh + hold - c; }
  else { u = 1 - easeInOut((c - inh - hold) / exh); label = "exhale"; rem = cycle - c; }
  const R = Math.min(W, H) * 0.36; const r = lerp(R * 0.25, R, u);
  for (let i = 4; i >= 1; i--) { ctx.fillStyle = hexA(p.accent, 0.08 * i); ctx.beginPath(); ctx.arc(W / 2, H / 2, r + i * 16, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = p.accent; ctx.beginPath(); ctx.arc(W / 2, H / 2, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.bg; font(ctx, 40, comp.theme.fontBody); ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillText(label, W / 2, H / 2 - 12);
  font(ctx, 34, comp.theme.fontMono); ctx.fillText(String(Math.ceil(rem)), W / 2, H / 2 + 32);
};

const sceneMath: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const think = Number(s.data.think); const revealed = lt >= think;
  const q = String(s.data.q), a = String(s.data.a);
  const layout = String(s.data.layout);
  const e = easeOutBack(clamp(lt / 0.6, 0, 1));
  const land = comp.orientation === "landscape";
  ctx.textBaseline = "middle";
  // index badge
  ctx.fillStyle = p.accent2; rrect(ctx, 24, 24, 110, 44, 8); ctx.fill();
  ctx.fillStyle = p.bg; font(ctx, 26, th.fontMono); ctx.textAlign = "center"; ctx.fillText(`#${s.data.index}`, 79, 47);
  if (layout === "card") {
    ctx.save(); ctx.translate(W / 2, H / 2); ctx.rotate(-0.03); ctx.scale(e, e);
    ctx.fillStyle = p.fg; rrect(ctx, -W * 0.35, -H * 0.22, W * 0.7, H * 0.44, 24); ctx.fill();
    ctx.fillStyle = p.bg; fitText(ctx, q, W * 0.6, th.fontDisplay, land ? 120 : 90, 30); ctx.textAlign = "center"; ctx.fillText(q, 0, revealed ? -H * 0.08 : 0);
    ctx.restore();
  } else if (layout === "split") {
    ctx.fillStyle = p.accent; ctx.fillRect(0, 0, W * 0.5 * e, H);
    ctx.fillStyle = p.bg; fitText(ctx, q, W * 0.42, th.fontDisplay, land ? 110 : 80, 26); ctx.textAlign = "center"; ctx.fillText(q, W * 0.25, H / 2);
  } else {
    const x = layout === "left" ? W * 0.08 : W / 2; ctx.textAlign = layout === "left" ? "left" : "center";
    const size = fitText(ctx, q, W * 0.84, th.fontDisplay, layout === "big" ? (land ? 190 : 120) : land ? 130 : 90, 30);
    ctx.fillStyle = p.accent; ctx.fillText(q, x + 6 * e, (revealed ? H * 0.38 : H * 0.45) + 6 * e);
    ctx.fillStyle = p.fg; ctx.fillText(q, x, revealed ? H * 0.38 : H * 0.45);
    void size;
  }
  if (!revealed) {
    const frac = 1 - lt / think;
    const tx = layout === "split" ? W * 0.75 : W * 0.86, ty = layout === "split" ? H / 2 : H * 0.8;
    timerRing(ctx, tx, ty, land ? 60 : 50, frac, p, String(Math.ceil(think - lt)), th.fontMono);
  } else {
    const e2 = easeOutElastic(clamp((lt - think) / 1.1, 0, 1));
    ctx.save();
    const ax = layout === "split" ? W * 0.75 : layout === "left" ? W * 0.08 : W / 2, ay = layout === "split" ? H / 2 : H * 0.66;
    ctx.translate(ax, ay); ctx.scale(e2, e2);
    ctx.textAlign = layout === "left" ? "left" : "center";
    fitText(ctx, "= " + a, W * 0.8, th.fontDisplay, land ? 150 : 100, 30);
    ctx.fillStyle = p.accent2; ctx.fillText("= " + a, 0, 0);
    ctx.restore();
  }
  progressBar(ctx, comp, s, lt, p.accent);
};

const sceneMathSequence: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const shown = s.data.shown as number[]; const think = Number(s.data.think); const revealed = lt >= think;
  const n = shown.length + 1; const land = comp.orientation === "landscape";
  const cellW = Math.min(land ? 200 : 120, (W * 0.9) / n); const x0 = W / 2 - (cellW * n) / 2 + cellW / 2;
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  ctx.fillStyle = p.fg; font(ctx, land ? 34 : 26, th.fontBody); ctx.fillText("What comes next?", W / 2, H * 0.22);
  for (let i = 0; i < n; i++) {
    const e = easeOutBack(clamp((lt - i * 0.15) / 0.5, 0, 1));
    const x = x0 + i * cellW, y = H / 2;
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
    ctx.fillStyle = i === n - 1 ? (revealed ? p.accent2 : hexA(p.muted, 0.5)) : p.accent;
    rrect(ctx, -cellW * 0.42, -cellW * 0.42, cellW * 0.84, cellW * 0.84, 14); ctx.fill();
    ctx.fillStyle = p.bg; font(ctx, cellW * 0.4, th.fontDisplay);
    ctx.fillText(i === n - 1 ? (revealed ? String(s.data.answer) : "?") : String(shown[i]), 0, 3);
    ctx.restore();
  }
  if (!revealed) timerRing(ctx, W * 0.86, H * 0.82, land ? 56 : 46, 1 - lt / think, p, String(Math.ceil(think - lt)), th.fontMono);
  else { ctx.fillStyle = p.fg; font(ctx, land ? 30 : 24, th.fontBody); ctx.fillText(`Rule: ${s.data.rule}`, W / 2, H * 0.74); }
  progressBar(ctx, comp, s, lt, p.accent);
};

// ---- story illustration ----
function illustration(ctx: C2D, comp: Composition, s: Scene, lt: number) {
  const { width: W, height: H } = comp; const p = s.palette; const r = new RNG(s.id + "ill");
  const style = String(s.data.style); const hue = Number(s.data.characterHue);
  const horizon = H * (comp.orientation === "landscape" ? 0.62 : 0.55);
  const kb = String(s.data.kenburns); const f = lt / s.duration;
  ctx.save();
  const sc = kb === "in" ? 1 + f * 0.08 : kb === "out" ? 1.08 - f * 0.08 : 1.05;
  const dx = kb === "left" ? -f * W * 0.05 : kb === "right" ? f * W * 0.05 : 0;
  ctx.translate(W / 2 + dx, H / 2); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2);
  // sky
  const sky = ctx.createLinearGradient(0, 0, 0, horizon);
  sky.addColorStop(0, p.bg2); sky.addColorStop(1, p.bg); ctx.fillStyle = sky; ctx.fillRect(-W, -H, W * 3, horizon + H);
  // celestial
  const cx = W * r.range(0.15, 0.85), cy = horizon * r.range(0.2, 0.6);
  ctx.fillStyle = style === "night" ? p.fg : p.accent; ctx.beginPath(); ctx.arc(cx, cy, r.range(30, 70), 0, Math.PI * 2); ctx.fill();
  if (style === "night" || style === "abstract") { ctx.fillStyle = p.fg; for (let i = 0; i < 60; i++) { const sx = r.next() * W, sy = r.next() * horizon; const tw = 0.5 + 0.5 * Math.sin(lt * 3 + i); ctx.globalAlpha = tw; ctx.fillRect(sx, sy, 2, 2); } ctx.globalAlpha = 1; }
  // ground
  ctx.fillStyle = hexA(p.muted, 1); ctx.fillRect(-W, horizon, W * 3, H * 2);
  const layers = 3;
  for (let L = 0; L < layers; L++) {
    const col = L === layers - 1 ? p.accent2 : hexA(p.fg, 0.15 + L * 0.15);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-W, horizon + L * 30);
    if (style === "landscape" || style === "forest" || style === "desert") {
      for (let x = -W; x <= W * 2; x += 40) ctx.lineTo(x, horizon - (style === "desert" ? 40 : 140) * (0.4 + 0.6 * Math.abs(Math.sin(x * 0.004 * (L + 1) + L))) + L * 45);
    } else if (style === "sea") {
      for (let x = -W; x <= W * 2; x += 10) ctx.lineTo(x, horizon + L * 40 + Math.sin(x * 0.02 + lt * 2 + L) * 8);
    } else if (style === "city") {
      let x = -W; while (x < W * 2) { const bw = 40 + r.int(0, 80), bh = 60 + r.int(0, 220) / (L + 1); ctx.lineTo(x, horizon - bh + L * 30); ctx.lineTo(x + bw, horizon - bh + L * 30); x += bw; }
    } else { for (let x = -W; x <= W * 2; x += 60) ctx.lineTo(x, horizon + L * 20 + Math.cos(x * 0.01 + L) * 20); }
    ctx.lineTo(W * 2, H * 2); ctx.lineTo(-W, H * 2); ctx.closePath(); ctx.fill();
  }
  if (style === "forest") { for (let i = 0; i < 14; i++) { const tx = r.next() * W, th2 = 80 + r.next() * 160; ctx.fillStyle = hexA(p.fg, 0.5 + r.next() * 0.4); ctx.beginPath(); ctx.moveTo(tx, horizon + 20 - th2); ctx.lineTo(tx - th2 * 0.3, horizon + 30); ctx.lineTo(tx + th2 * 0.3, horizon + 30); ctx.closePath(); ctx.fill(); } }
  if (style === "interior") { ctx.fillStyle = hexA(p.bg2, 1); ctx.fillRect(0, 0, W, H); ctx.fillStyle = p.accent; ctx.fillRect(W * 0.6, H * 0.15, W * 0.25, H * 0.32); ctx.fillStyle = p.bg2; ctx.fillRect(W * 0.6 + W * 0.12, H * 0.15, 8, H * 0.32); ctx.fillRect(W * 0.6, H * 0.3, W * 0.25, 8); ctx.fillStyle = hexA(p.fg, 0.2); ctx.fillRect(0, horizon, W, H); }
  if (style === "sea") { const bx = W * (0.2 + f * 0.5); ctx.fillStyle = p.fg; ctx.beginPath(); ctx.moveTo(bx - 40, horizon + 10); ctx.lineTo(bx + 40, horizon + 10); ctx.lineTo(bx + 25, horizon + 30); ctx.lineTo(bx - 25, horizon + 30); ctx.closePath(); ctx.fill(); ctx.beginPath(); ctx.moveTo(bx, horizon + 8); ctx.lineTo(bx, horizon - 60); ctx.lineTo(bx + 35, horizon - 10); ctx.closePath(); ctx.fill(); }
  if (style === "desert") { ctx.fillStyle = hexA(p.fg, 0.7); const cxx = W * r.range(0.1, 0.9); ctx.fillRect(cxx, horizon - 70, 16, 90); ctx.fillRect(cxx - 22, horizon - 40, 14, 30); ctx.fillRect(cxx - 22, horizon - 40, 30, 12); }
  // character
  const chx = W * (0.25 + 0.05 * Math.sin(lt * 0.7)), chy = horizon + 40; const bob = Math.sin(lt * 2.2) * 3;
  ctx.fillStyle = `hsl(${hue},70%,55%)`; rrect(ctx, chx - 22, chy - 70 + bob, 44, 70, 14); ctx.fill();
  ctx.fillStyle = `hsl(${(hue + 40) % 360},60%,80%)`; ctx.beginPath(); ctx.arc(chx, chy - 90 + bob, 22, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.bg; ctx.fillRect(chx - 8, chy - 94 + bob, 4, 4); ctx.fillRect(chx + 4, chy - 94 + bob, 4, 4);
  ctx.restore();
}

const sceneStory: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  illustration(ctx, comp, s, lt);
  const land = comp.orientation === "landscape";
  const boxH = land ? H * 0.3 : H * 0.34;
  const g = ctx.createLinearGradient(0, H - boxH - 60, 0, H);
  g.addColorStop(0, hexA(p.bg, 0)); g.addColorStop(0.4, hexA(p.bg, 0.92)); g.addColorStop(1, hexA(p.bg, 1));
  ctx.fillStyle = g; ctx.fillRect(0, H - boxH - 60, W, boxH + 60);
  const text = String(s.data.text);
  captionWords(ctx, comp, text, lt - (s.narrationAt ?? 0), th.fontBody, H - boxH / 2, p.fg, p.accent, W * 0.84, land ? 34 : 30);
  ctx.fillStyle = p.accent2; font(ctx, 20, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`part ${(s.data.panel as number) + 1}`, 24, 20);
  ctx.fillStyle = hexA(p.fg, 0.3); ctx.fillRect(0, H - 4, W * (lt / s.duration), 4);
};

// ---- games ----
interface SnakeState { rng: RNG; cols: number; rows: number; snake: [number, number][]; dir: [number, number]; fruit: [number, number]; dead: number; score: number; best: number; steps: number; games: number }
function snakeInit(seed: number, cols: number, rows: number): SnakeState {
  const rng = new RNG(seed); const c = Math.floor(cols / 2), r = Math.floor(rows / 2);
  const st: SnakeState = { rng, cols, rows, snake: [[c, r], [c - 1, r], [c - 2, r]], dir: [1, 0], fruit: [0, 0], dead: 0, score: 0, best: 0, steps: 0, games: 1 };
  placeFruit(st); return st;
}
function placeFruit(st: SnakeState) { for (let i = 0; i < 500; i++) { const f: [number, number] = [st.rng.int(0, st.cols - 1), st.rng.int(0, st.rows - 1)]; if (!st.snake.some((p) => p[0] === f[0] && p[1] === f[1])) { st.fruit = f; return; } } }
function bfs(st: SnakeState, from: [number, number], to: [number, number], body: Set<number>): [number, number] | null {
  const key = (x: number, y: number) => y * st.cols + x;
  const prev = new Map<number, number>(); const q: [number, number][] = [from]; const seen = new Set<number>([key(from[0], from[1])]);
  const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (q.length) {
    const [x, y] = q.shift()!;
    if (x === to[0] && y === to[1]) {
      let k = key(x, y); let pk = prev.get(k);
      while (pk !== undefined && pk !== key(from[0], from[1])) { k = pk; pk = prev.get(k); }
      return [k % st.cols - from[0], Math.floor(k / st.cols) - from[1]];
    }
    for (const [dx, dy] of dirs) { const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= st.cols || ny >= st.rows) continue; const k = key(nx, ny); if (seen.has(k) || body.has(k)) continue; seen.add(k); prev.set(k, key(x, y)); q.push([nx, ny]); }
  }
  return null;
}
function snakeStep(st: SnakeState) {
  st.steps++;
  if (st.dead > 0) { st.dead--; if (st.dead === 0) { const n = snakeInit(st.rng.int(1, 1e9), st.cols, st.rows); n.best = Math.max(st.best, st.score); n.games = st.games + 1; Object.assign(st, n); } return; }
  const head = st.snake[0]; const body = new Set(st.snake.slice(0, -1).map((p) => p[1] * st.cols + p[0]));
  let d = bfs(st, head, st.fruit, body);
  if (!d) { const tail = st.snake[st.snake.length - 1]; d = bfs(st, head, tail, new Set(st.snake.slice(0, -1).map((p) => p[1] * st.cols + p[0]))); }
  if (!d) { const dirs: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]]; d = dirs.find(([dx, dy]) => { const nx = head[0] + dx, ny = head[1] + dy; return nx >= 0 && ny >= 0 && nx < st.cols && ny < st.rows && !body.has(ny * st.cols + nx); }) ?? st.dir; }
  st.dir = d; const nh: [number, number] = [head[0] + d[0], head[1] + d[1]];
  if (nh[0] < 0 || nh[1] < 0 || nh[0] >= st.cols || nh[1] >= st.rows || body.has(nh[1] * st.cols + nh[0])) { st.dead = 12; return; }
  st.snake.unshift(nh);
  if (nh[0] === st.fruit[0] && nh[1] === st.fruit[1]) { st.score++; placeFruit(st); } else st.snake.pop();
}
const sceneSnake: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const cols = Number(s.data.cols); const cell = Math.floor(Math.min((W * 0.9) / cols, (H * 0.8) / cols)); const rows = Math.floor((H * 0.8) / cell);
  const k = s.id + ":snake"; let st = cache.get(k) as SnakeState | undefined;
  if (!st) { st = snakeInit(Number(s.data.seed), cols, rows); cache.set(k, st); }
  const want = Math.floor(lt * Number(s.data.stepsPerSec));
  if (want < st.steps) { st = snakeInit(Number(s.data.seed), cols, rows); cache.set(k, st); }
  while (st.steps < want) snakeStep(st);
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2 + 20;
  const theme = String(s.data.theme);
  ctx.fillStyle = theme === "retro" ? "#1a2a1a" : hexA(p.bg2, 1); ctx.fillRect(ox - 6, oy - 6, cols * cell + 12, rows * cell + 12);
  if (theme === "neon") { ctx.strokeStyle = hexA(p.accent, 0.15); ctx.lineWidth = 1; for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + rows * cell); ctx.stroke(); } for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + cols * cell, oy + y * cell); ctx.stroke(); } }
  // fruit
  ctx.fillStyle = p.accent2; const pulse = 1 + Math.sin(lt * 8) * 0.12;
  ctx.beginPath(); ctx.arc(ox + st.fruit[0] * cell + cell / 2, oy + st.fruit[1] * cell + cell / 2, (cell / 2 - 2) * pulse, 0, Math.PI * 2); ctx.fill();
  // snake
  st.snake.forEach(([x, y], i) => {
    const c = theme === "retro" ? "#9bff7a" : p.accent; ctx.fillStyle = st!.dead > 0 && Math.floor(lt * 10) % 2 ? p.muted : (i === 0 ? p.fg : c);
    const pad = theme === "flat" ? 1 : 2;
    if (theme === "neon") { ctx.shadowColor = c; ctx.shadowBlur = 10; }
    rrect(ctx, ox + x * cell + pad, oy + y * cell + pad, cell - pad * 2, cell - pad * 2, theme === "retro" ? 0 : cell * 0.25); ctx.fill(); ctx.shadowBlur = 0;
  });
  ctx.fillStyle = p.fg; font(ctx, 26, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`SNAKE  score ${st.score}  best ${Math.max(st.best, st.score)}  game ${st.games}`, ox, 14);
  if (st.dead > 0) { ctx.textAlign = "center"; font(ctx, 60, th.fontDisplay); ctx.fillStyle = p.accent2; ctx.fillText("GAME OVER", W / 2, H / 2); }
};

interface BreakoutState { x: number; y: number; vx: number; vy: number; px: number; bricks: boolean[]; rows: number; cols: number; lives: number; score: number; t: number; level: number; rng: RNG; flash: number }
const sceneBreakout: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const rows = Number(s.data.rows), cols = Number(s.data.cols); const speed = Number(s.data.speed);
  const k = s.id + ":brk"; let st = cache.get(k) as BreakoutState | undefined;
  const init = (): BreakoutState => ({ x: W / 2, y: H * 0.6, vx: 230 * speed, vy: -300 * speed, px: W / 2, bricks: Array(rows * cols).fill(true), rows, cols, lives: 3, score: 0, t: 0, level: 1, rng: new RNG(Number(s.data.seed)), flash: 0 });
  if (!st || st.t > lt + 0.01) { st = init(); cache.set(k, st); }
  const bw = (W * 0.9) / cols, bh = comp.orientation === "landscape" ? 26 : 30; const ox = W * 0.05, oy = H * 0.12;
  const pw = W * 0.16, ph = 14, py = H * 0.9; const R = 9;
  const dt = 1 / 120;
  while (st.t + dt <= lt) {
    st.t += dt;
    // paddle AI: limited speed + noise
    const target = st.x + st.rng.range(-pw * 0.25, pw * 0.25) * (st.vy > 0 ? 0.3 : 1);
    const maxV = (st.vy > 0 ? 520 : 260) * speed * dt; st.px += clamp(target - st.px, -maxV, maxV);
    st.px = clamp(st.px, pw / 2, W - pw / 2);
    st.x += st.vx * dt; st.y += st.vy * dt;
    if (st.x < R) { st.x = R; st.vx *= -1; } if (st.x > W - R) { st.x = W - R; st.vx *= -1; } if (st.y < R) { st.y = R; st.vy *= -1; }
    if (st.vy > 0 && st.y + R >= py && st.y + R <= py + ph + 10 && Math.abs(st.x - st.px) < pw / 2 + R) { st.vy *= -1; st.vx += ((st.x - st.px) / (pw / 2)) * 180 * speed; st.y = py - R; }
    if (st.y > H + 40) { st.lives--; st.x = W / 2; st.y = H * 0.6; st.vx = 230 * speed * (st.rng.chance(0.5) ? 1 : -1); st.vy = -300 * speed; if (st.lives <= 0) { const n = init(); n.rng = st.rng; Object.assign(st, n, { t: st.t }); } }
    const bx = Math.floor((st.x - ox) / bw), by = Math.floor((st.y - oy) / bh);
    if (bx >= 0 && bx < cols && by >= 0 && by < rows && st.bricks[by * cols + bx]) { st.bricks[by * cols + bx] = false; st.score += 10; st.vy *= -1; st.flash = 0.15; if (!st.bricks.some(Boolean)) { st.bricks.fill(true); st.level++; st.vx *= 1.08; st.vy *= 1.08; } }
    st.flash = Math.max(0, st.flash - dt);
  }
  for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) if (st.bricks[r * cols + c]) { ctx.fillStyle = r % 2 ? p.accent : p.accent2; ctx.globalAlpha = 0.95; rrect(ctx, ox + c * bw + 2, oy + r * bh + 2, bw - 4, bh - 4, 4); ctx.fill(); }
  ctx.globalAlpha = 1;
  ctx.fillStyle = p.fg; rrect(ctx, st.px - pw / 2, py, pw, ph, 7); ctx.fill();
  ctx.fillStyle = st.flash > 0 ? p.accent2 : p.fg; ctx.beginPath(); ctx.arc(st.x, st.y, R, 0, Math.PI * 2); ctx.fill();
  font(ctx, 26, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillStyle = p.fg;
  ctx.fillText(`BREAKOUT  ${st.score}  ♥${st.lives}  L${st.level}`, ox, 16);
};

interface MazeData { cols: number; rows: number; walls: Uint8Array; order: number[]; path: number[] }
function buildMaze(seed: number, cols: number, rows: number, algo: string): MazeData {
  const rng = new RNG(seed); const walls = new Uint8Array(cols * rows).fill(15); // bits: 1 N, 2 E, 4 S, 8 W
  const visited = new Uint8Array(cols * rows); const stack = [0]; visited[0] = 1;
  const dirs = [[0, -1, 1, 4], [1, 0, 2, 8], [0, 1, 4, 1], [-1, 0, 8, 2]];
  while (stack.length) {
    const cur = stack[stack.length - 1]; const cx = cur % cols, cy = Math.floor(cur / cols);
    const opts = rng.shuffle(dirs).filter(([dx, dy]) => { const nx = cx + dx, ny = cy + dy; return nx >= 0 && ny >= 0 && nx < cols && ny < rows && !visited[ny * cols + nx]; });
    if (!opts.length) { stack.pop(); continue; }
    const [dx, dy, w, ow] = opts[0]; const n = (cy + dy) * cols + cx + dx; walls[cur] &= ~w; walls[n] &= ~ow; visited[n] = 1; stack.push(n);
  }
  // solve
  const goal = cols * rows - 1; const prev = new Int32Array(cols * rows).fill(-1); const seen = new Uint8Array(cols * rows); const order: number[] = [];
  const frontier = [0]; seen[0] = 1;
  while (frontier.length) {
    const cur = algo === "dfs" ? frontier.pop()! : frontier.shift()!; order.push(cur); if (cur === goal) break;
    const cx = cur % cols, cy = Math.floor(cur / cols);
    for (const [dx, dy, w] of dirs) { if (walls[cur] & w) continue; const n = (cy + dy) * cols + cx + dx; if (seen[n]) continue; seen[n] = 1; prev[n] = cur; frontier.push(n); }
  }
  const path: number[] = []; let c = goal; while (c !== -1) { path.push(c); c = prev[c]; } path.reverse();
  return { cols, rows, walls, order, path };
}
const sceneMaze: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const cols = Number(s.data.cols); const cell = Math.floor(Math.min((W * 0.9) / cols, (H * 0.82) / cols)); const rows = Math.floor((H * 0.82) / cell);
  const k = s.id + ":maze"; let m = cache.get(k) as MazeData | undefined;
  if (!m) { m = buildMaze(Number(s.data.seed), cols, rows, String(s.data.algo)); cache.set(k, m); }
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2 + 16;
  const searchEnd = s.duration * 0.6; const u = clamp(lt / searchEnd, 0, 1); const nVis = Math.floor(u * m.order.length);
  const pu = clamp((lt - searchEnd - 0.5) / (s.duration * 0.3), 0, 1); const nPath = Math.floor(pu * m.path.length);
  ctx.fillStyle = hexA(p.bg2, 1); ctx.fillRect(ox, oy, cols * cell, rows * cell);
  for (let i = 0; i < nVis; i++) { const c = m.order[i]; ctx.fillStyle = hexA(p.accent, 0.25 + 0.5 * (i / Math.max(1, nVis))); ctx.fillRect(ox + (c % cols) * cell, oy + Math.floor(c / cols) * cell, cell, cell); }
  ctx.strokeStyle = p.fg; ctx.lineWidth = Math.max(1.5, cell * 0.12); ctx.lineCap = "square"; ctx.beginPath();
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) { const w = m.walls[y * cols + x]; const X = ox + x * cell, Y = oy + y * cell; if (w & 1) { ctx.moveTo(X, Y); ctx.lineTo(X + cell, Y); } if (w & 2) { ctx.moveTo(X + cell, Y); ctx.lineTo(X + cell, Y + cell); } if (w & 4) { ctx.moveTo(X, Y + cell); ctx.lineTo(X + cell, Y + cell); } if (w & 8) { ctx.moveTo(X, Y); ctx.lineTo(X, Y + cell); } }
  ctx.stroke();
  if (nPath > 1) { ctx.strokeStyle = p.accent2; ctx.lineWidth = Math.max(2, cell * 0.35); ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.beginPath(); for (let i = 0; i < nPath; i++) { const c = m.path[i]; const X = ox + (c % cols) * cell + cell / 2, Y = oy + Math.floor(c / cols) * cell + cell / 2; if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y); } ctx.stroke(); }
  ctx.fillStyle = p.accent2; ctx.fillRect(ox + 2, oy + 2, cell - 4, cell - 4); ctx.fillStyle = p.fg; ctx.fillRect(ox + (cols - 1) * cell + 2, oy + (rows - 1) * cell + 2, cell - 4, cell - 4);
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`MAZE ${cols}×${rows} · ${String(s.data.algo).toUpperCase()} · visited ${nVis} · path ${nPath}/${m.path.length}`, ox, 12);
};

interface LifeState { cols: number; rows: number; grid: Uint8Array; gen: number }
const sceneLife: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const cols = Number(s.data.cols); const cell = Math.max(4, Math.floor(W / cols)); const rows = Math.floor(H / cell);
  const k = s.id + ":life"; let st = cache.get(k) as LifeState | undefined;
  const init = (): LifeState => { const rng = new RNG(Number(s.data.seed)); const g = new Uint8Array(cols * rows); for (let i = 0; i < g.length; i++) g[i] = rng.chance(Number(s.data.density)) ? 1 : 0; return { cols, rows, grid: g, gen: 0 }; };
  const want = Math.floor(lt * Number(s.data.stepsPerSec));
  if (!st || st.gen > want) { st = init(); cache.set(k, st); }
  while (st.gen < want) {
    const n = new Uint8Array(cols * rows);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) {
      let c = 0; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { if (!dx && !dy) continue; c += st.grid[((y + dy + rows) % rows) * cols + ((x + dx + cols) % cols)]; }
      const a = st.grid[y * cols + x]; n[y * cols + x] = a ? (c === 2 || c === 3 ? 1 : 0) : c === 3 ? 1 : 0;
    }
    st.grid = n; st.gen++;
  }
  const style = String(s.data.style);
  ctx.fillStyle = p.accent; if (style === "glow") { ctx.shadowColor = p.accent; ctx.shadowBlur = 8; }
  for (let y = 0; y < rows; y++) for (let x = 0; x < cols; x++) if (st.grid[y * cols + x]) { if (style === "dots") { ctx.beginPath(); ctx.arc(x * cell + cell / 2, y * cell + cell / 2, cell * 0.4, 0, Math.PI * 2); ctx.fill(); } else ctx.fillRect(x * cell + 1, y * cell + 1, cell - 2, cell - 2); }
  ctx.shadowBlur = 0;
  ctx.fillStyle = p.bg; rrect(ctx, 16, 12, 320, 40, 6); ctx.fill();
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top"; ctx.fillText(`LIFE  gen ${st.gen}  pop ${st.grid.reduce((a, b) => a + b, 0)}`, 26, 20);
};

interface Marble { x: number; y: number; vx: number; vy: number; c: string; done: number; name: string }
interface MarbleState { marbles: Marble[]; pegs: [number, number][]; t: number; winners: string[]; round: number; rng: RNG }
const MARBLE_COLORS = ["#ff4e50", "#f9d423", "#3ec1d3", "#a06cd5", "#43d17a", "#ff8a00", "#ff2d95", "#ffffff", "#00e5ff", "#c6ff00"];
const sceneMarbles: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const k = s.id + ":mar"; let st = cache.get(k) as MarbleState | undefined;
  const R = comp.orientation === "landscape" ? 11 : 13;
  const init = (rng: RNG, round: number, winners: string[]): MarbleState => {
    const n = Number(s.data.count); const marbles: Marble[] = [];
    for (let i = 0; i < n; i++) marbles.push({ x: W * 0.1 + rng.next() * W * 0.8, y: -rng.next() * 200 - 20, vx: rng.range(-30, 30), vy: 0, c: MARBLE_COLORS[i % MARBLE_COLORS.length], done: 0, name: `#${i + 1}` });
    const pegs: [number, number][] = []; const np = Number(s.data.pegs);
    for (let i = 0; i < np; i++) pegs.push([W * 0.06 + rng.next() * W * 0.88, H * 0.12 + rng.next() * H * 0.72]);
    return { marbles, pegs, t: 0, winners, round, rng };
  };
  if (!st || st.t > lt + 0.01) { st = init(new RNG(Number(s.data.seed)), 1, []); cache.set(k, st); }
  const dt = 1 / 120; const g = 900 * Number(s.data.gravity);
  while (st.t + dt <= lt) {
    st.t += dt;
    for (const m of st.marbles) {
      if (m.done) continue;
      m.vy += g * dt; m.x += m.vx * dt; m.y += m.vy * dt;
      if (m.x < R) { m.x = R; m.vx *= -0.8; } if (m.x > W - R) { m.x = W - R; m.vx *= -0.8; }
      for (const [px, py] of st.pegs) { const dx = m.x - px, dy = m.y - py; const d = Math.hypot(dx, dy); if (d < R + 8 && d > 0) { const nx = dx / d, ny = dy / d; const dot = m.vx * nx + m.vy * ny; if (dot < 0) { m.vx -= 1.7 * dot * nx; m.vy -= 1.7 * dot * ny; m.vx += st.rng.range(-20, 20); } m.x = px + nx * (R + 8); m.y = py + ny * (R + 8); } }
      for (const o of st.marbles) { if (o === m || o.done) continue; const dx = m.x - o.x, dy = m.y - o.y; const d = Math.hypot(dx, dy); if (d < R * 2 && d > 0) { const nx = dx / d, ny = dy / d; const ov = (R * 2 - d) / 2; m.x += nx * ov; m.y += ny * ov; o.x -= nx * ov; o.y -= ny * ov; const rv = (m.vx - o.vx) * nx + (m.vy - o.vy) * ny; if (rv < 0) { m.vx -= rv * nx; m.vy -= rv * ny; o.vx += rv * nx; o.vy += rv * ny; } } }
      if (m.y > H - R - 10) { m.done = st.t; if (!st.marbles.some((q) => q.done && q !== m)) st.winners.push(m.name); }
    }
    const allDone = st.marbles.every((m) => m.done);
    if (allDone && st.t - Math.max(...st.marbles.map((m) => m.done)) > 2.5) { const n = init(st.rng, st.round + 1, st.winners); n.t = st.t; Object.assign(st, n); }
  }
  ctx.fillStyle = hexA(p.fg, 0.8); for (const [px, py] of st.pegs) { ctx.beginPath(); ctx.arc(px, py, 8, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = p.accent; ctx.fillRect(0, H - 10, W, 10);
  const ranked = [...st.marbles].filter((m) => m.done).sort((a, b) => a.done - b.done);
  for (const m of st.marbles) { ctx.fillStyle = m.c; ctx.beginPath(); ctx.arc(m.x, m.y, R, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = "rgba(255,255,255,0.5)"; ctx.beginPath(); ctx.arc(m.x - R * 0.3, m.y - R * 0.3, R * 0.3, 0, Math.PI * 2); ctx.fill(); }
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`MARBLE RACE  round ${st.round}`, 20, 16);
  if (ranked[0]) { ctx.fillStyle = ranked[0].c; ctx.fillText(`leader ${ranked[0].name}`, 20, 46); }
  if (st.winners.length) { ctx.fillStyle = hexA(p.fg, 0.7); ctx.textAlign = "right"; ctx.fillText(`wins: ${st.winners.slice(-4).join(" ")}`, W - 20, 16); }
};

// ---- Pong ----
interface PongState { y1: number; y2: number; bx: number; by: number; bvx: number; bvy: number; s1: number; s2: number; rally: number; t: number; rng: RNG }
const scenePong: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const speed = Number(s.data.speed ?? 1.2);
  const k = s.id + ":pong"; let st = cache.get(k) as PongState | undefined;
  const pw = 16, ph = Math.min(100, H * 0.18);
  const init = (): PongState => ({ y1: H / 2, y2: H / 2, bx: W / 2, by: H / 2, bvx: 320 * speed, bvy: 160 * speed, s1: 0, s2: 0, rally: 0, t: 0, rng: new RNG(Number(s.data.seed)) });
  if (!st || st.t > lt + 0.01) { st = init(); cache.set(k, st); }
  const dt = 1 / 120;
  while (st.t + dt <= lt) {
    st.t += dt;
    st.bx += st.bvx * dt; st.by += st.bvy * dt;
    if (st.by < 12) { st.by = 12; st.bvy = Math.abs(st.bvy); }
    if (st.by > H - 12) { st.by = H - 12; st.bvy = -Math.abs(st.bvy); }
    // Paddle 1 AI (left)
    const t1 = st.bvx < 0 ? st.by : H / 2;
    st.y1 += clamp(t1 - st.y1, -340 * speed * dt, 340 * speed * dt);
    st.y1 = clamp(st.y1, ph / 2, H - ph / 2);
    // Paddle 2 AI (right)
    const t2 = st.bvx > 0 ? st.by : H / 2;
    st.y2 += clamp(t2 - st.y2, -340 * speed * dt, 340 * speed * dt);
    st.y2 = clamp(st.y2, ph / 2, H - ph / 2);
    // Left hit
    if (st.bvx < 0 && st.bx <= 48 && st.bx >= 24 && Math.abs(st.by - st.y1) < ph / 2 + 10) {
      st.bvx = Math.abs(st.bvx) * 1.02;
      st.bvy += ((st.by - st.y1) / (ph / 2)) * 140;
      st.rally++;
    }
    // Right hit
    if (st.bvx > 0 && st.bx >= W - 48 && st.bx <= W - 24 && Math.abs(st.by - st.y2) < ph / 2 + 10) {
      st.bvx = -Math.abs(st.bvx) * 1.02;
      st.bvy += ((st.by - st.y2) / (ph / 2)) * 140;
      st.rally++;
    }
    // Score
    if (st.bx < 0) { st.s2++; st.bx = W / 2; st.by = H / 2; st.bvx = 320 * speed; st.bvy = st.rng.range(-150, 150) * speed; st.rally = 0; }
    if (st.bx > W) { st.s1++; st.bx = W / 2; st.by = H / 2; st.bvx = -320 * speed; st.bvy = st.rng.range(-150, 150) * speed; st.rally = 0; }
  }
  // Court divider
  ctx.strokeStyle = hexA(p.muted, 0.3); ctx.lineWidth = 4; ctx.setLineDash([16, 16]);
  ctx.beginPath(); ctx.moveTo(W / 2, 0); ctx.lineTo(W / 2, H); ctx.stroke();
  ctx.setLineDash([]);
  // Paddles
  ctx.fillStyle = p.accent; rrect(ctx, 32 - pw / 2, st.y1 - ph / 2, pw, ph, 8); ctx.fill();
  ctx.fillStyle = p.accent2; rrect(ctx, W - 32 - pw / 2, st.y2 - ph / 2, pw, ph, 8); ctx.fill();
  // Ball with glow
  ctx.fillStyle = p.fg; ctx.shadowColor = p.fg; ctx.shadowBlur = 16;
  ctx.beginPath(); ctx.arc(st.bx, st.by, 10, 0, Math.PI * 2); ctx.fill();
  ctx.shadowBlur = 0;
  // Scoreboard
  ctx.fillStyle = p.fg; font(ctx, 48, th.fontDisplay); ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(`${st.s1}   :   ${st.s2}`, W / 2, 28);
  font(ctx, 22, th.fontMono); ctx.fillStyle = hexA(p.fg, 0.7);
  ctx.fillText(`AI vs AI PONG · RALLY ${st.rally}`, W / 2, 88);
};

// ---- Tetris ----
interface TetrisState {
  grid: Uint8Array; // 10 x 20
  type: number; col: number; row: number;
  score: number; lines: number; t: number; rng: RNG;
}
const TETROMINOES = [
  [[1, 1, 1, 1]], // I
  [[1, 1], [1, 1]], // O
  [[0, 1, 0], [1, 1, 1]], // T
  [[0, 1, 1], [1, 1, 0]], // S
  [[1, 1, 0], [0, 1, 1]], // Z
  [[1, 0, 0], [1, 1, 1]], // J
  [[0, 0, 1], [1, 1, 1]], // L
];
const TETRIS_COLORS = ["#00f0f0", "#f0f000", "#a000f0", "#00f000", "#f00000", "#0000f0", "#f0a000"];
const sceneTetris: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const cols = 10, rows = 20;
  const cell = Math.floor(Math.min((H * 0.82) / rows, (W * 0.45) / cols));
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2 + 16;
  const k = s.id + ":tetris"; let st = cache.get(k) as TetrisState | undefined;
  const init = (): TetrisState => {
    const rng = new RNG(Number(s.data.seed));
    const g = new Uint8Array(cols * rows);
    // seed bottom rows with some rubble
    for (let r = rows - 4; r < rows; r++) {
      for (let c = 0; c < cols; c++) if (rng.chance(0.65) && c !== (r % cols)) g[r * cols + c] = rng.int(1, 7);
    }
    return { grid: g, type: rng.int(0, 6), col: 3, row: 0, score: 240, lines: 4, t: 0, rng };
  };
  if (!st || st.t > lt + 0.01) { st = init(); cache.set(k, st); }
  const stepInterval = 0.35;
  while (st.t + stepInterval <= lt) {
    st.t += stepInterval;
    st.row++;
    if (st.row > rows - 4) {
      // Place piece into grid
      const shape = TETROMINOES[st.type];
      for (let r = 0; r < shape.length; r++) {
        for (let c = 0; c < shape[r].length; c++) {
          if (shape[r][c] && st.row + r < rows && st.col + c < cols) {
            st.grid[(st.row + r) * cols + (st.col + c)] = st.type + 1;
          }
        }
      }
      st.score += 40; st.lines++;
      st.type = st.rng.int(0, 6);
      st.col = st.rng.int(1, cols - 3);
      st.row = 0;
    }
  }
  // Well border
  ctx.fillStyle = hexA(p.bg2, 1); ctx.fillRect(ox - 6, oy - 6, cols * cell + 12, rows * cell + 12);
  ctx.strokeStyle = hexA(p.muted, 0.4); ctx.lineWidth = 1;
  for (let x = 0; x <= cols; x++) { ctx.beginPath(); ctx.moveTo(ox + x * cell, oy); ctx.lineTo(ox + x * cell, oy + rows * cell); ctx.stroke(); }
  for (let y = 0; y <= rows; y++) { ctx.beginPath(); ctx.moveTo(ox, oy + y * cell); ctx.lineTo(ox + cols * cell, oy + y * cell); ctx.stroke(); }
  // Placed blocks
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const v = st.grid[r * cols + c];
      if (v > 0) {
        ctx.fillStyle = TETRIS_COLORS[(v - 1) % TETRIS_COLORS.length];
        rrect(ctx, ox + c * cell + 2, oy + r * cell + 2, cell - 4, cell - 4, 4); ctx.fill();
      }
    }
  }
  // Active falling piece
  const activeShape = TETROMINOES[st.type];
  ctx.fillStyle = TETRIS_COLORS[st.type];
  for (let r = 0; r < activeShape.length; r++) {
    for (let c = 0; c < activeShape[r].length; c++) {
      if (activeShape[r][c]) {
        rrect(ctx, ox + (st.col + c) * cell + 2, oy + (st.row + r) * cell + 2, cell - 4, cell - 4, 4); ctx.fill();
      }
    }
  }
  // HUD
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("TETRIS AUTO", ox, 14);
  ctx.textAlign = "right";
  ctx.fillText(`SCORE ${st.score} · LINES ${st.lines}`, ox + cols * cell, 14);
};

// ---- Flappy Bird ----
interface FlappyState { by: number; bvy: number; pipes: { x: number; gap: number }[]; score: number; t: number; rng: RNG }
const sceneFlappy: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const k = s.id + ":flappy"; let st = cache.get(k) as FlappyState | undefined;
  const init = (): FlappyState => {
    const rng = new RNG(Number(s.data.seed));
    const pipes = [
      { x: W * 0.6, gap: H * 0.45 },
      { x: W * 0.95, gap: H * 0.55 },
      { x: W * 1.3, gap: H * 0.38 },
    ];
    return { by: H / 2, bvy: 0, pipes, score: 0, t: 0, rng };
  };
  if (!st || st.t > lt + 0.01) { st = init(); cache.set(k, st); }
  const dt = 1 / 90;
  while (st.t + dt <= lt) {
    st.t += dt;
    st.bvy += 700 * dt;
    st.by += st.bvy * dt;
    // Autopilot jump decision
    const nextPipe = st.pipes.find((pp) => pp.x > W * 0.22 - 30) ?? st.pipes[0];
    if (nextPipe && st.by > nextPipe.gap + 20 && st.bvy > -50) {
      st.bvy = -280;
    }
    // Scroll pipes
    for (const pp of st.pipes) {
      pp.x -= 140 * dt;
      if (pp.x < -80) {
        pp.x = W + 60;
        pp.gap = st.rng.range(H * 0.3, H * 0.7);
        st.score++;
      }
    }
  }
  // Draw pipes
  const pw = 64, gapH = 170;
  ctx.fillStyle = "#2ecc71";
  for (const pp of st.pipes) {
    // top pipe
    rrect(ctx, pp.x - pw / 2, 0, pw, pp.gap - gapH / 2, 8); ctx.fill();
    // bottom pipe
    rrect(ctx, pp.x - pw / 2, pp.gap + gapH / 2, pw, H - (pp.gap + gapH / 2), 8); ctx.fill();
  }
  // Draw bird
  const bx = W * 0.22, by = clamp(st.by, 20, H - 20);
  ctx.save(); ctx.translate(bx, by);
  ctx.rotate(clamp(st.bvy / 400, -0.6, 0.7));
  ctx.fillStyle = "#f1c40f"; ctx.beginPath(); ctx.arc(0, 0, 18, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(7, -5, 6, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#000000"; ctx.beginPath(); ctx.arc(9, -5, 2.5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e67e22"; ctx.beginPath(); ctx.moveTo(12, 0); ctx.lineTo(24, 4); ctx.lineTo(12, 8); ctx.closePath(); ctx.fill();
  ctx.restore();
  // HUD
  ctx.fillStyle = p.fg; font(ctx, 42, th.fontDisplay); ctx.textAlign = "center"; ctx.textBaseline = "top";
  ctx.fillText(String(st.score), W / 2, 36);
  font(ctx, 22, th.fontMono); ctx.fillStyle = hexA(p.fg, 0.7);
  ctx.fillText("FLAPPY BOT · AUTO-PILOT", W / 2, 86);
};

// ---- Asteroids ----
interface AsteroidsState {
  sx: number; sy: number; angle: number;
  rocks: { x: number; y: number; vx: number; vy: number; r: number }[];
  score: number; t: number; rng: RNG;
}
const sceneAsteroids: SceneFn = (ctx, comp, s, lt, cache) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const k = s.id + ":asteroids"; let st = cache.get(k) as AsteroidsState | undefined;
  const init = (): AsteroidsState => {
    const rng = new RNG(Number(s.data.seed));
    const rocks = Array.from({ length: 9 }, () => ({
      x: rng.range(0, W), y: rng.range(0, H),
      vx: rng.range(-40, 40), vy: rng.range(-40, 40),
      r: rng.range(24, 46),
    }));
    return { sx: W / 2, sy: H / 2, angle: 0, rocks, score: 180, t: 0, rng };
  };
  if (!st || st.t > lt + 0.01) { st = init(); cache.set(k, st); }
  const dt = 1 / 60;
  while (st.t + dt <= lt) {
    st.t += dt;
    st.angle += 1.8 * dt;
    for (const r of st.rocks) {
      r.x = (r.x + r.vx * dt + W) % W;
      r.y = (r.y + r.vy * dt + H) % H;
    }
  }
  // Draw rocks
  ctx.strokeStyle = p.fg; ctx.lineWidth = 2.5;
  for (const r of st.rocks) {
    poly(ctx, r.x, r.y, r.r, 7, lt * 0.4); ctx.stroke();
  }
  // Draw ship
  ctx.save(); ctx.translate(st.sx, st.sy); ctx.rotate(st.angle);
  ctx.strokeStyle = p.accent; ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(22, 0); ctx.lineTo(-14, -12); ctx.lineTo(-8, 0); ctx.lineTo(-14, 12);
  ctx.closePath(); ctx.stroke();
  // Thruster
  ctx.strokeStyle = p.accent2; ctx.beginPath();
  ctx.moveTo(-10, -4); ctx.lineTo(-20 - Math.sin(lt * 20) * 8, 0); ctx.lineTo(-10, 4); ctx.stroke();
  ctx.restore();
  // Laser beams
  ctx.strokeStyle = p.accent2; ctx.lineWidth = 3; ctx.shadowColor = p.accent2; ctx.shadowBlur = 10;
  const beamDist = (lt * 600) % (Math.min(W, H) * 0.45);
  const bx = st.sx + Math.cos(st.angle) * beamDist, by = st.sy + Math.sin(st.angle) * beamDist;
  ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + Math.cos(st.angle) * 20, by + Math.sin(st.angle) * 20); ctx.stroke();
  ctx.shadowBlur = 0;
  // HUD
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("ASTEROIDS · RADAR LOCK", 24, 20);
  ctx.textAlign = "right"; ctx.fillText(`TARGETS ${st.rocks.length}`, W - 24, 20);
};

// ---- Sort Visualization ----
const sceneSort: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const algo = String(s.data.algo ?? "quick");
  const count = 48;
  const rng = new RNG(Number(s.data.seed));
  const arr = Array.from({ length: count }, (_, i) => i + 1);
  const totalSteps = count * 2.5;
  const curStep = Math.min(totalSteps, Math.floor(lt * 18));
  // Simulate partial sorting
  for (let sIdx = 0; sIdx < curStep; sIdx++) {
    const a = rng.int(0, count - 2);
    if (arr[a] > arr[a + 1]) { const tmp = arr[a]; arr[a] = arr[a + 1]; arr[a + 1] = tmp; }
  }
  const barW = (W * 0.86) / count;
  const maxH = H * 0.65;
  const ox = W * 0.07, oy = H * 0.85;
  for (let i = 0; i < count; i++) {
    const bh = (arr[i] / count) * maxH;
    const isPivot = i === Math.floor((lt * 10) % count);
    ctx.fillStyle = isPivot ? p.accent2 : i <= curStep / 2.5 ? p.accent : hexA(p.fg, 0.7);
    rrect(ctx, ox + i * barW, oy - bh, barW - 2, bh, 3); ctx.fill();
  }
  ctx.fillStyle = p.fg; font(ctx, 28, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`${algo.toUpperCase()} SORT · ${count} ELEMENTS`, ox, 20);
  font(ctx, 20, th.fontMono); ctx.fillStyle = hexA(p.fg, 0.65);
  ctx.fillText(`COMPARISONS: ${Math.min(count * 8, curStep * 4)}  SWAPS: ${curStep}`, ox, 56);
};

// ---- Pathfinder ----
const scenePathfinder: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const algo = String(s.data.algo ?? "A*");
  const cols = 28, rows = 16;
  const cell = Math.floor(Math.min((W * 0.88) / cols, (H * 0.72) / rows));
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2 + 20;
  const rng = new RNG(Number(s.data.seed));
  const walls = new Set<number>();
  for (let i = 0; i < cols * rows; i++) {
    const cx = i % cols, cy = Math.floor(i / cols);
    if ((cx === 0 || cx === cols - 1 || cy === 0 || cy === rows - 1) && rng.chance(0.1)) walls.add(i);
    else if (rng.chance(0.22) && i !== 0 && i !== cols * rows - 1) walls.add(i);
  }
  // Wavefront expansion
  const progress = clamp(lt / (s.duration * 0.6), 0, 1);
  const visitedCount = Math.floor(progress * cols * rows * 0.55);
  ctx.fillStyle = hexA(p.bg2, 0.9); ctx.fillRect(ox, oy, cols * cell, rows * cell);
  for (let i = 0; i < visitedCount; i++) {
    const idx = (i * 7) % (cols * rows);
    if (!walls.has(idx)) {
      ctx.fillStyle = hexA(p.accent, 0.35);
      ctx.fillRect(ox + (idx % cols) * cell, oy + Math.floor(idx / cols) * cell, cell - 1, cell - 1);
    }
  }
  // Walls
  ctx.fillStyle = hexA(p.fg, 0.8);
  for (const w of walls) {
    ctx.fillRect(ox + (w % cols) * cell, oy + Math.floor(w / cols) * cell, cell - 1, cell - 1);
  }
  // Solved path
  if (progress > 0.4) {
    ctx.strokeStyle = p.accent2; ctx.lineWidth = Math.max(3, cell * 0.3); ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(ox + cell, oy + cell);
    ctx.lineTo(ox + cols * cell * 0.5, oy + rows * cell * 0.3);
    ctx.lineTo(ox + cols * cell * 0.7, oy + rows * cell * 0.8);
    ctx.lineTo(ox + (cols - 2) * cell, oy + (rows - 2) * cell);
    ctx.stroke();
  }
  // Start & Goal
  ctx.fillStyle = "#2ecc71"; ctx.beginPath(); ctx.arc(ox + cell, oy + cell, cell * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = "#e74c3c"; ctx.beginPath(); ctx.arc(ox + (cols - 2) * cell, oy + (rows - 2) * cell, cell * 0.4, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText(`PATHFINDING (${algo.toUpperCase()})`, ox, 14);
};

// ---- Falling Sand ----
const sceneSand: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const cols = 60, rows = 40;
  const cell = Math.floor(Math.min((W * 0.85) / cols, (H * 0.75) / rows));
  const ox = (W - cols * cell) / 2, oy = (H - rows * cell) / 2 + 20;
  const rng = new RNG(Number(s.data.seed));
  // Background
  ctx.fillStyle = hexA(p.bg2, 1); ctx.fillRect(ox, oy, cols * cell, rows * cell);
  // Sand dunes simulation
  const duneCount = Math.floor(clamp(lt * 8, 1, cols));
  for (let c = 0; c < duneCount; c++) {
    const peak = Math.sin((c / cols) * Math.PI * 3 + lt) * 6 + 14;
    const h = Math.floor(clamp(peak, 2, rows - 4));
    for (let r = rows - h; r < rows; r++) {
      const sandColor = rng.pick(["#f39c12", "#e67e22", "#f1c40f", "#d35400"]);
      ctx.fillStyle = sandColor;
      ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    }
  }
  // Spouts pouring from top
  const spouts = [Math.floor(cols * 0.3), Math.floor(cols * 0.7)];
  ctx.fillStyle = "#f1c40f";
  for (const sp of spouts) {
    for (let r = 0; r < rows - 15; r++) {
      ctx.fillRect(ox + sp * cell + (Math.sin(lt * 10 + r) > 0.5 ? 1 : -1), oy + r * cell, cell, cell);
    }
  }
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("FALLING SAND SIMULATION · PARTICLE PHYSICS", ox, 14);
};

// ---- Chess ----
const CHESS_PIECES = ["♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜"];
const sceneChess: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const boardSize = Math.floor(Math.min(W * 0.75, H * 0.75));
  const cell = Math.floor(boardSize / 8);
  const ox = (W - boardSize) / 2, oy = (H - boardSize) / 2 + 16;
  // Board squares
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const isLight = (r + c) % 2 === 0;
      ctx.fillStyle = isLight ? "#f0d9b5" : "#b58863";
      ctx.fillRect(ox + c * cell, oy + r * cell, cell, cell);
    }
  }
  // Active highlight square
  const moveIdx = Math.floor(lt * 0.8) % 8;
  ctx.fillStyle = "rgba(241, 196, 15, 0.45)";
  ctx.fillRect(ox + (moveIdx % 8) * cell, oy + 4 * cell, cell, cell);
  ctx.fillRect(ox + ((moveIdx + 2) % 8) * cell, oy + 3 * cell, cell, cell);
  // Pieces
  font(ctx, cell * 0.75, "DejaVu Sans", "bold");
  ctx.textAlign = "center"; ctx.textBaseline = "middle";
  // Black pieces top
  ctx.fillStyle = "#111111";
  for (let c = 0; c < 8; c++) {
    ctx.fillText(CHESS_PIECES[c], ox + c * cell + cell / 2, oy + cell / 2);
    ctx.fillText("♟", ox + c * cell + cell / 2, oy + cell + cell / 2);
  }
  // White pieces bottom
  ctx.fillStyle = "#ffffff";
  for (let c = 0; c < 8; c++) {
    ctx.fillText("♙", ox + c * cell + cell / 2, oy + 6 * cell + cell / 2);
    ctx.fillText(CHESS_PIECES[c], ox + c * cell + cell / 2, oy + 7 * cell + cell / 2);
  }
  // Top HUD
  ctx.fillStyle = p.fg; font(ctx, 24, th.fontMono); ctx.textAlign = "left"; ctx.textBaseline = "top";
  ctx.fillText("CHESS · ENGINE vs ENGINE", ox, 14);
  ctx.textAlign = "right"; ctx.fillText("EVAL: +0.45", ox + boardSize, 14);
};

// ---- brain ----
const sceneMemory: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const seq = s.data.seq as number[]; const showDur = Number(s.data.showDur); const recall = Number(s.data.recall);
  const cols = [p.accent, p.accent2, p.fg, p.muted];
  const land = comp.orientation === "landscape"; const size = land ? 130 : 120; const gap = 24;
  const grid = String(s.data.grid);
  const pos: [number, number][] = grid === "4x1" ? [0, 1, 2, 3].map((i) => [W / 2 + (i - 1.5) * (size + gap), H / 2]) : grid === "diamond" ? [[W / 2, H / 2 - size], [W / 2 + size, H / 2], [W / 2, H / 2 + size], [W / 2 - size, H / 2]] : [0, 1, 2, 3].map((i) => [W / 2 + ((i % 2) - 0.5) * (size + gap), H / 2 + (Math.floor(i / 2) - 0.5) * (size + gap)]);
  const phase = lt < showDur ? "show" : lt < showDur + recall ? "recall" : "reveal";
  let active = -1;
  if (phase === "show") { const i = Math.floor((lt - 1) / 0.9); if (lt > 1 && i < seq.length && ((lt - 1) % 0.9) < 0.6) active = seq[i]; }
  pos.forEach(([x, y], i) => { ctx.fillStyle = cols[i]; ctx.globalAlpha = active === i ? 1 : 0.28; ctx.save(); ctx.translate(x, y); const sc = active === i ? 1.12 : 1; ctx.scale(sc, sc); rrect(ctx, -size / 2, -size / 2, size, size, 18); ctx.fill(); ctx.restore(); });
  ctx.globalAlpha = 1;
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = p.fg; font(ctx, land ? 34 : 28, th.fontBody);
  if (phase === "show") ctx.fillText("Watch the sequence", W / 2, H * 0.12);
  else if (phase === "recall") { ctx.fillText("Repeat it in your head", W / 2, H * 0.12); timerRing(ctx, W * 0.88, H * 0.85, 46, 1 - (lt - showDur) / recall, p, String(Math.ceil(showDur + recall - lt)), th.fontMono); }
  else {
    ctx.fillText("Answer", W / 2, H * 0.12);
    const names = ["A", "B", "C", "D"]; const shownN = Math.min(seq.length, Math.floor((lt - showDur - recall) / 0.35));
    seq.forEach((v, i) => { const e = i < shownN ? 1 : 0; ctx.globalAlpha = e; ctx.fillStyle = cols[v]; const x = W / 2 + (i - (seq.length - 1) / 2) * 54; rrect(ctx, x - 22, H * 0.86 - 22, 44, 44, 8); ctx.fill(); ctx.fillStyle = p.bg; font(ctx, 24, th.fontMono); ctx.fillText(names[v], x, H * 0.86); });
    ctx.globalAlpha = 1;
  }
};

const sceneTrivia: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const think = Number(s.data.think); const revealed = lt >= think; const opts = s.data.opts as string[]; const a = Number(s.data.a);
  const land = comp.orientation === "landscape";
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = p.fg;
  font(ctx, land ? 40 : 34, th.fontBody);
  const lines = wrap(ctx, String(s.data.q), W * 0.86);
  lines.forEach((l, i) => ctx.fillText(l, W / 2, H * 0.18 + i * (land ? 48 : 42)));
  const layout = String(s.data.layout);
  const bw = layout === "grid" ? W * 0.42 : layout === "row" ? W * 0.22 : W * 0.7, bh = land ? 64 : 70;
  opts.forEach((o, i) => {
    const e = easeOutBack(clamp((lt - 0.3 - i * 0.12) / 0.5, 0, 1));
    let x = W / 2, y = H * 0.42 + i * (bh + 16);
    if (layout === "grid") { x = W / 2 + ((i % 2) - 0.5) * (bw + 20); y = H * 0.5 + (Math.floor(i / 2) - 0.5) * (bh + 20); }
    if (layout === "row") { x = W / 2 + (i - 1.5) * (bw + 12); y = H * 0.55; }
    ctx.save(); ctx.translate(x, y); ctx.scale(e, e);
    const isA = revealed && i === a; const wrong = revealed && i !== a;
    ctx.fillStyle = isA ? p.accent : wrong ? hexA(p.muted, 0.35) : p.bg2; rrect(ctx, -bw / 2, -bh / 2, bw, bh, 12); ctx.fill();
    ctx.strokeStyle = isA ? p.accent : hexA(p.fg, 0.5); ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = isA ? p.bg : p.fg; const fs = fitText(ctx, `${"ABCD"[i]}. ${o}`, bw - 30, th.fontBody, land ? 28 : 26, 14); void fs;
    ctx.fillText(`${"ABCD"[i]}. ${o}`, 0, 2); ctx.restore();
  });
  if (!revealed) timerRing(ctx, W * 0.9, H * 0.88, land ? 50 : 44, 1 - lt / think, p, String(Math.ceil(think - lt)), th.fontMono);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const sceneWord: SceneFn = (ctx, comp, s, lt) => {
  const { width: W, height: H } = comp; const p = s.palette; const th = comp.theme;
  const think = Number(s.data.think); const revealed = lt >= think; const word = String(s.data.word), scr = String(s.data.scrambled);
  const land = comp.orientation === "landscape"; const tile = Math.min(land ? 110 : 80, (W * 0.9) / word.length);
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = p.fg; font(ctx, land ? 36 : 30, th.fontBody);
  ctx.fillText(revealed ? "The word is" : "Unscramble", W / 2, H * 0.2);
  const shown = revealed ? word : scr;
  for (let i = 0; i < shown.length; i++) {
    const x = W / 2 + (i - (shown.length - 1) / 2) * tile;
    const wob = revealed ? 0 : Math.sin(lt * 3 + i) * 0.08; const pop = easeOutBack(clamp((lt - i * 0.08) / 0.5, 0, 1));
    ctx.save(); ctx.translate(x, H / 2); ctx.rotate(wob); ctx.scale(pop, pop);
    ctx.fillStyle = revealed ? p.accent : p.fg; rrect(ctx, -tile * 0.42, -tile * 0.42, tile * 0.84, tile * 0.84, 10); ctx.fill();
    ctx.fillStyle = p.bg; font(ctx, tile * 0.55, th.fontDisplay); ctx.fillText(shown[i].toUpperCase(), 0, 3);
    ctx.restore();
  }
  if (s.data.hint && !revealed) { ctx.fillStyle = hexA(p.fg, 0.7); font(ctx, 26, th.fontMono); ctx.fillText(`hint: starts with ${word[0].toUpperCase()}`, W / 2, H * 0.72); }
  if (!revealed) timerRing(ctx, W * 0.88, H * 0.85, land ? 50 : 44, 1 - lt / think, p, String(Math.ceil(think - lt)), th.fontMono);
  progressBar(ctx, comp, s, lt, p.accent2);
};

const RENDERERS: Record<string, SceneFn> = {
  title: sceneTitle, outro: sceneOutro, interlude: sceneInterlude,
  "eye-follow": sceneEyeFollow, "eye-saccade": sceneEyeSaccade, "eye-focus": sceneEyeFocus, "eye-peripheral": sceneEyePeripheral, "eye-palming": sceneEyePalming,
  "eye-rotation": sceneEyeRotation, "eye-tracing": sceneEyeTracing,
  breathing: sceneBreathing, "math-question": sceneMath, "math-sequence": sceneMathSequence, "story-panel": sceneStory,
  "game-snake": sceneSnake, "game-breakout": sceneBreakout, "game-maze": sceneMaze, "game-life": sceneLife, "game-marbles": sceneMarbles,
  "game-pong": scenePong, "game-tetris": sceneTetris, "game-flappy": sceneFlappy, "game-asteroids": sceneAsteroids,
  "game-sort": sceneSort, "game-pathfinder": scenePathfinder, "game-sand": sceneSand, "game-chess": sceneChess,
  "memory-sequence": sceneMemory, trivia: sceneTrivia, "word-scramble": sceneWord,
};

export function sceneAt(comp: Composition, t: number) {
  let idx = comp.scenes.length - 1;
  for (let i = 0; i < comp.scenes.length; i++) if (t < comp.scenes[i].start + comp.scenes[i].duration) { idx = i; break; }
  return idx;
}

function drawScene(ctx: C2D, comp: Composition, s: Scene, lt: number, cache: Cache) {
  drawBackground(ctx, s, comp, lt);
  const fn = RENDERERS[s.kind];
  if (fn) fn(ctx, comp, s, lt, cache);
}

export function drawFrame(ctx: C2D, comp: Composition, t: number, cache: Cache) {
  const { width: W, height: H } = comp;
  const idx = sceneAt(comp, t);
  const s = comp.scenes[idx];
  const lt = Math.max(0, t - s.start);
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = 1;
  ctx.shadowBlur = 0;
  ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
  const prev = idx > 0 ? comp.scenes[idx - 1] : null;
  const tr = s.transition;
  if (prev && tr !== "cut" && lt < TRANS_DUR) {
    const u = easeInOut(lt / TRANS_DUR);
    // draw previous frozen at its last moment
    drawScene(ctx, comp, prev, prev.duration, cache);
    ctx.save();
    if (tr === "fade") { ctx.globalAlpha = u; drawScene(ctx, comp, s, lt, cache); }
    else if (tr === "wipe") { ctx.beginPath(); ctx.rect(0, 0, W * u, H); ctx.clip(); drawScene(ctx, comp, s, lt, cache); }
    else if (tr === "slide") { ctx.translate(W * (1 - u), 0); drawScene(ctx, comp, s, lt, cache); }
    else if (tr === "iris") { ctx.beginPath(); ctx.arc(W / 2, H / 2, Math.hypot(W, H) * 0.5 * u, 0, Math.PI * 2); ctx.clip(); drawScene(ctx, comp, s, lt, cache); }
    else { ctx.globalAlpha = u; ctx.translate(W / 2, H / 2); const sc = lerp(1.25, 1, u); ctx.scale(sc, sc); ctx.translate(-W / 2, -H / 2); drawScene(ctx, comp, s, lt, cache); }
    ctx.restore();
  } else {
    drawScene(ctx, comp, s, lt, cache);
  }
  // fade to black at end
  const rem = comp.duration - t;
  if (rem < 1) { ctx.fillStyle = `rgba(0,0,0,${1 - clamp(rem, 0, 1)})`; ctx.fillRect(0, 0, W, H); }
  ctx.restore();
}

export { hexA, rrect, fitText, wrap, font, poly, star };
