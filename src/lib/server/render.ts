import path from "node:path";
import fs from "node:fs";
import { spawn } from "node:child_process";
import { createCanvas, GlobalFonts } from "@napi-rs/canvas";
import { Composition, FONT_FILES, RNG, estimateSpeech } from "@/lib/video/core";
import { drawFrame, C2D, Cache } from "@/lib/video/draw";
import { drawThumbnail, ThumbStyle } from "@/lib/video/thumbnail";
import { isStudioVoice, speedFromRate, studioTts } from "@/lib/server/studio-api";

export const DATA_DIR = process.env.VERCEL ? path.join("/tmp", "aiv2") : path.join(process.cwd(), "data");
export const VIDEOS_DIR = path.join(DATA_DIR, "videos");
export const THUMBS_DIR = path.join(DATA_DIR, "thumbs");
export const TMP_DIR = path.join(DATA_DIR, "tmp");
export const MUSIC_DIR = path.join(process.cwd(), "public", "music");
export const UPLOADS_MUSIC_DIR = path.join(DATA_DIR, "music");

for (const d of [DATA_DIR, VIDEOS_DIR, THUMBS_DIR, TMP_DIR, UPLOADS_MUSIC_DIR]) fs.mkdirSync(d, { recursive: true });

// eslint-disable-next-line @typescript-eslint/no-require-imports
const FFMPEG: string = require("ffmpeg-static") as string;

let fontsLoaded = false;
export function ensureFonts() {
  if (fontsLoaded) return;
  const dir = path.join(process.cwd(), "public", "fonts");
  if (fs.existsSync(dir)) {
    for (const [family, file] of Object.entries(FONT_FILES)) {
      const fp = path.join(dir, file);
      if (fs.existsSync(fp)) {
        try { GlobalFonts.registerFromPath(fp, family); } catch { /* ignore */ }
      }
    }
    // Register aliases so canvas never renders blank glyphs if a specific name is requested
    const anton = path.join(dir, "Anton-Regular.ttf");
    if (fs.existsSync(anton)) {
      try {
        GlobalFonts.registerFromPath(anton, "Anton");
        GlobalFonts.registerFromPath(anton, "Arial Black");
        GlobalFonts.registerFromPath(anton, "sans-serif");
        GlobalFonts.registerFromPath(anton, "DejaVu Sans");
      } catch { /* ignore */ }
    }
    const playfair = path.join(dir, "PlayfairDisplay.ttf");
    if (fs.existsSync(playfair)) {
      try {
        GlobalFonts.registerFromPath(playfair, "Playfair Display");
        GlobalFonts.registerFromPath(playfair, "Georgia");
        GlobalFonts.registerFromPath(playfair, "serif");
      } catch { /* ignore */ }
    }
    const poppins = path.join(dir, "Poppins-Bold.ttf");
    if (fs.existsSync(poppins)) {
      try {
        GlobalFonts.registerFromPath(poppins, "Poppins");
        GlobalFonts.registerFromPath(poppins, "Arial");
      } catch { /* ignore */ }
    }
  }
  fontsLoaded = true;
}

function run(args: string[], opts?: { input?: NodeJS.ReadableStream }): Promise<void> {
  return new Promise((resolve, reject) => {
    const p = spawn(FFMPEG, args, { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d.toString(); if (err.length > 20000) err = err.slice(-10000); });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg exited ${code}: ${err.slice(-1500)}`))));
    if (opts?.input) opts.input.pipe(p.stdin); else p.stdin.end();
  });
}

export async function audioDuration(file: string): Promise<number> {
  return new Promise((resolve) => {
    const p = spawn(FFMPEG, ["-i", file, "-f", "s16le", "-ac", "1", "-ar", "16000", "-v", "quiet", "pipe:1"], { stdio: ["ignore", "pipe", "ignore"] });
    let bytes = 0;
    p.stdout.on("data", (d) => (bytes += d.length));
    p.on("close", () => resolve(bytes / (16000 * 2)));
    p.on("error", () => resolve(0));
  });
}

const STUDIO_FALLBACK_VOICE = "en-CA-Liam";

// ---------- TTS (Microsoft Edge neural voices, no API key) ----------
export async function synthesize(text: string, voice: string, rate: string, pitch: string, outFile: string, fallbackVoice = STUDIO_FALLBACK_VOICE): Promise<boolean> {
  if (isStudioVoice(voice)) {
    try {
      const audio = await studioTts(text, voice, speedFromRate(rate));
      if (audio.length <= 500 || audio.subarray(0, 4).toString() !== "RIFF") throw new Error("invalid Studio audio response");
      fs.writeFileSync(outFile, audio);
      return true;
    } catch (error) {
      console.warn(`Studio Voice ${voice} unavailable; falling back to ${fallbackVoice}:`, (error as Error).message);
      return synthesizeLocal(text, fallbackVoice, rate, pitch, outFile);
    }
  }
  return synthesizeLocal(text, voice, rate, pitch, outFile);
}

async function synthesizeLocal(text: string, voice: string, rate: string, pitch: string, outFile: string): Promise<boolean> {
  try {
    const { MsEdgeTTS, OUTPUT_FORMAT } = await import("msedge-tts");
    const tts = new MsEdgeTTS();
    await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = tts.toStream(text, { rate, pitch });
    await new Promise<void>((resolve, reject) => {
      const ws = fs.createWriteStream(outFile);
      const timer = setTimeout(() => reject(new Error("tts timeout")), 45000);
      audioStream.on("error", (e: Error) => { clearTimeout(timer); reject(e); });
      ws.on("error", (e) => { clearTimeout(timer); reject(e); });
      ws.on("finish", () => { clearTimeout(timer); resolve(); });
      audioStream.pipe(ws);
    });
    try { tts.close(); } catch { /* noop */ }
    const st = fs.statSync(outFile);
    return st.size > 500;
  } catch (e) {
    console.warn("TTS failed:", (e as Error).message);
    return false;
  }
}

export interface RenderHooks {
  onProgress?: (pct: number, stage: string) => Promise<void> | void;
}

export interface RenderResult {
  videoPath: string;
  thumbPath: string;
  durationSec: number;
}

export function mediaContentType(file: string) {
  const ext = path.extname(file).toLowerCase();
  return ext === ".mp4" ? "video/mp4" : ext === ".png" ? "image/png" : ext === ".mp3" ? "audio/mpeg" : ext === ".wav" ? "audio/wav" : "application/octet-stream";
}

export async function renderVideo(id: number, comp: Composition, musicFile: string | null, thumbStyle: ThumbStyle, hooks: RenderHooks = {}): Promise<RenderResult> {
  ensureFonts();
  const tmp = path.join(TMP_DIR, String(id));
  fs.rmSync(tmp, { recursive: true, force: true });
  fs.mkdirSync(tmp, { recursive: true });
  const report = async (p: number, s: string) => { try { await hooks.onProgress?.(Math.round(p), s); } catch { /* noop */ } };

  // 1) Voice-over
  const narrations: { file: string; at: number; dur: number }[] = [];
  let narrationEnd = 0;
  const narrScenes = comp.scenes.filter((s) => s.narration);
  let i = 0;
  for (const s of narrScenes) {
    i++;
    const file = path.join(tmp, `n${i}.${isStudioVoice(comp.voice.name) ? "wav" : "mp3"}`);
    const ok = await synthesize(s.narration!, comp.voice.name, comp.voice.rate, comp.voice.pitch, file, comp.voice.fallbackVoice);
    if (ok && !s.narrationMuted) {
      const dur = await audioDuration(file);
      const requestedAt = s.start + (s.narrationAt ?? 0.4);
      const at = Math.max(requestedAt, narrationEnd + 0.08);
      const actualDur = dur || estimateSpeech(s.narration!);
      narrations.push({ file, at, dur: actualDur });
      narrationEnd = at + actualDur;
    }
    await report((i / Math.max(1, narrScenes.length)) * 15, `voice ${i}/${narrScenes.length}`);
  }

  // 2) Frames -> silent video
  const { width: W, height: H, fps } = comp;
  const totalFrames = Math.ceil(comp.duration * fps);
  const silent = path.join(tmp, "video.mp4");
  const canvas = createCanvas(W, H);
  const ctx = canvas.getContext("2d") as unknown as C2D;
  const cache: Cache = new Map();

  await new Promise<void>((resolve, reject) => {
    const args = ["-y", "-f", "rawvideo", "-pix_fmt", "rgba", "-s", `${W}x${H}`, "-r", String(fps), "-i", "pipe:0", "-an", "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-threads", "3", silent];
    const p = spawn(FFMPEG, args, { stdio: ["pipe", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => { err += d.toString(); if (err.length > 20000) err = err.slice(-10000); });
    p.on("error", reject);
    p.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`ffmpeg(video) exited ${code}: ${err.slice(-1200)}`))));
    (async () => {
      try {
        let lastPct = -1;
        for (let f = 0; f < totalFrames; f++) {
          const t = f / fps;
          drawFrame(ctx, comp, t, cache);
          const buf = canvas.data();
          const ok = p.stdin.write(Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength));
          if (!ok) await new Promise<void>((r) => p.stdin.once("drain", () => r()));
          if (f % 6 === 0) await new Promise<void>((r) => setImmediate(r));
          const pct = 15 + (f / totalFrames) * 70;
          if (Math.floor(pct) !== lastPct && f % 24 === 0) { lastPct = Math.floor(pct); await report(pct, `frames ${f}/${totalFrames}`); }
        }
        p.stdin.end();
      } catch (e) { p.kill("SIGKILL"); reject(e); }
    })();
  });

  // 3) Mix audio & mux
  await report(86, "mixing audio");
  const out = path.join(VIDEOS_DIR, `${id}.mp4`);
  const D = comp.duration;
  const inputs: string[] = ["-i", silent];
  const filters: string[] = [];
  const mixIn: string[] = [];
  let idx = 1;
  if (musicFile && fs.existsSync(musicFile)) {
    inputs.push("-stream_loop", "-1", "-i", musicFile);
    filters.push(`[${idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=${comp.music.volume.toFixed(2)},atrim=0:${D.toFixed(2)},asetpts=PTS-STARTPTS,afade=t=in:d=2,afade=t=out:st=${Math.max(0, D - 3).toFixed(2)}:d=3[m]`);
    mixIn.push("[m]");
    idx++;
  }
  for (let n = 0; n < narrations.length; n++) {
    const nr = narrations[n];
    inputs.push("-i", nr.file);
    const ms = Math.round(nr.at * 1000);
    filters.push(`[${idx}:a]aformat=sample_rates=44100:channel_layouts=stereo,volume=1.0,adelay=${ms}|${ms}[n${n}]`);
    mixIn.push(`[n${n}]`);
    idx++;
  }
  if (mixIn.length === 0) {
    inputs.push("-f", "lavfi", "-i", "anullsrc=r=44100:cl=stereo");
    filters.push(`[1:a]atrim=0:${D.toFixed(2)}[m]`);
    mixIn.push("[m]");
  }
  filters.push(`${mixIn.join("")}amix=inputs=${mixIn.length}:duration=longest:normalize=0,atrim=0:${D.toFixed(2)},alimiter=limit=0.95[out]`);
  await run(["-y", ...inputs, "-filter_complex", filters.join(";"), "-map", "0:v", "-map", "[out]", "-c:v", "copy", "-c:a", "aac", "-b:a", "160k", "-shortest", "-movflags", "+faststart", out]);

  // 4) Thumbnail
  await report(96, "thumbnail");
  const thumbPath = await renderThumbnail(id, comp, thumbStyle);
  fs.rmSync(tmp, { recursive: true, force: true });
  await report(100, "done");
  return { videoPath: out, thumbPath, durationSec: D };
}

export async function renderThumbnail(id: number, comp: Composition, style: ThumbStyle, outputKey?: string): Promise<string> {
  // Generate unique HTML-based thumbnail
  const { generateUniqueThumbnail } = await import("@/lib/video/unique-thumbnail");
  const seed = `${comp.seed}-${outputKey || id}`;
  const index = typeof style.themeVariant === "number" ? style.themeVariant : 0;
  const spec = generateUniqueThumbnail(comp, seed, index);
  
  const htmlFile = path.join(TMP_DIR, `thumb-${outputKey ?? id}.html`);
  const file = path.join(THUMBS_DIR, `${outputKey ?? id}.png`);
  fs.writeFileSync(htmlFile, spec.html);
  
  console.log(`[Thumbnail] Rendering ${spec.grammar} via Puppeteer...`);
  
  try {
    const puppeteer = await import("puppeteer-core");
    const chromium = await import("@sparticuz/chromium");
    
    // Get chromium executable path
    const executablePath = await chromium.default.executablePath();
    
    // If local development and chromium not found, try to find local Chrome
    let actualPath = executablePath;
    if (!process.env.VERCEL && !fs.existsSync(executablePath)) {
      const localPaths = [
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        '/Applications/Chromium.app/Contents/MacOS/Chromium',
        '/usr/bin/google-chrome',
        '/usr/bin/chromium-browser',
        '/usr/bin/chromium',
      ];
      actualPath = localPaths.find(p => fs.existsSync(p)) || executablePath;
    }
    
    const browser = await puppeteer.default.launch({
      args: [...chromium.default.args, '--no-sandbox', '--disable-setuid-sandbox'],
      executablePath: actualPath,
      headless: true,
    });
    
    const page = await browser.newPage();
    await page.setViewport({ width: 1280, height: 720 });
    await page.goto(`file://${htmlFile}`, { waitUntil: 'networkidle0' });
    await page.screenshot({ path: file, type: 'png' });
    await browser.close();
    
    // Clean up HTML file
    try { fs.unlinkSync(htmlFile); } catch {}
    
    console.log(`[Thumbnail] ✓ Puppeteer render complete: ${file}`);
    return file;
  } catch (error) {
    console.error("[Thumbnail] Puppeteer failed:", (error as Error).message);
    console.log("[Thumbnail] Falling back to canvas rendering...");
    
    // Canvas fallback
    ensureFonts();
    const c = createCanvas(1280, 720);
    const ctx = c.getContext("2d") as unknown as C2D;
    
    const palettes = [
      { bg: "#0a0f1e", primary: "#3fe0ff", accent: "#ff2323", text: "#ffffff" },
      { bg: "#1a0f2e", primary: "#a855f7", accent: "#ffd23f", text: "#ffffff" },
      { bg: "#1a0e0a", primary: "#ff6b35", accent: "#3fe0ff", text: "#ffffff" },
      { bg: "#0c1821", primary: "#38bdf8", accent: "#f43f5e", text: "#ffffff" },
      { bg: "#041c1e", primary: "#2dd4bf", accent: "#ec4899", text: "#ffffff" },
    ];
    const palette = palettes[index % palettes.length];
    const words = (comp.meta?.title || "Brain Challenge").split(" ");
    const headline = words.slice(0, Math.min(5, words.length)).join(" ");
    
    // Render based on grammar type
    switch (spec.grammar) {
      case "giant-question-mark":
        renderGiantQuestionMark(ctx, headline, palette);
        break;
      case "split-comparison":
      case "vs-battle":
        renderVSBattle(ctx, headline, palette);
        break;
      case "stat-bar-hero":
        renderStatBar(ctx, headline, palette, index);
        break;
      case "truth-stamp":
        renderTruthStamp(ctx, headline, palette);
        break;
      case "impact-number":
        renderImpactNumber(ctx, headline, palette, comp.scenes?.length || 10);
        break;
      case "grid-progression":
        renderGrid(ctx, headline, palette);
        break;
      default:
        renderDefault(ctx, headline, palette, index);
    }
    
    fs.writeFileSync(file, await c.encode("png"));
    console.log(`[Thumbnail] ✓ Canvas fallback complete: ${file}`);
    return file;
  }
}

// Canvas rendering functions for each grammar
function renderGiantQuestionMark(ctx: C2D, headline: string, p: any) {
  // Radial gradient background
  const grad = ctx.createRadialGradient(640, 320, 100, 640, 320, 700);
  grad.addColorStop(0, p.primary + "22");
  grad.addColorStop(1, p.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  
  // Giant question mark
  ctx.font = "900 550px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.primary;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 60;
  ctx.shadowOffsetY = 20;
  ctx.fillText("?", 640, 320);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // Headline at bottom
  ctx.font = "900 52px Arial, sans-serif";
  ctx.strokeStyle = p.bg;
  ctx.lineWidth = 6;
  ctx.strokeText(headline, 640, 620);
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 620);
}

function renderVSBattle(ctx: C2D, headline: string, p: any) {
  // Split background
  ctx.fillStyle = p.primary;
  ctx.fillRect(0, 0, 640, 720);
  ctx.fillStyle = p.accent;
  ctx.fillRect(640, 0, 640, 720);
  
  // VS text
  ctx.font = "900 280px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.bg;
  ctx.shadowColor = "rgba(0,0,0,0.4)";
  ctx.shadowBlur = 40;
  ctx.shadowOffsetY = 15;
  ctx.fillText("VS", 640, 360);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  
  // Headline box
  ctx.fillStyle = p.bg;
  ctx.fillRect(60, 600, 1160, 90);
  ctx.font = "900 48px Arial, sans-serif";
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 645);
}

function renderStatBar(ctx: C2D, headline: string, p: any, index: number) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 1280, 720);
  
  const percentage = (index * 19 + 23) % 96 + 5;
  
  // Label
  ctx.font = "700 42px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = p.primary;
  ctx.fillText("CHALLENGE LEVEL", 640, 180);
  
  // Bar track
  ctx.strokeStyle = p.text;
  ctx.lineWidth = 8;
  ctx.strokeRect(140, 230, 1000, 100);
  
  // Bar fill
  ctx.fillStyle = p.accent;
  ctx.fillRect(140, 230, 1000 * (percentage / 100), 100);
  
  // Percentage number
  ctx.font = "900 200px Arial, sans-serif";
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 10;
  ctx.strokeText(`${percentage}%`, 640, 480);
  ctx.fillStyle = p.text;
  ctx.fillText(`${percentage}%`, 640, 480);
  
  // Headline
  ctx.font = "800 44px Arial, sans-serif";
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 600);
}

function renderTruthStamp(ctx: C2D, headline: string, p: any) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 1280, 720);
  
  // Rotated stamp
  ctx.save();
  ctx.translate(640, 360);
  ctx.rotate(-0.2);
  
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 20;
  ctx.strokeRect(-280, -120, 560, 240);
  
  ctx.font = "900 140px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillStyle = p.accent;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 80;
  ctx.fillText("TRUE?", 0, 0);
  ctx.shadowBlur = 0;
  
  ctx.restore();
  
  // Headline
  ctx.font = "900 50px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 640);
}

function renderImpactNumber(ctx: C2D, headline: string, p: any, count: number) {
  const grad = ctx.createRadialGradient(640, 280, 100, 640, 280, 600);
  grad.addColorStop(0, p.accent + "33");
  grad.addColorStop(0.7, p.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  
  // Big number
  ctx.font = "900 380px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = p.accent;
  ctx.lineWidth = 8;
  ctx.strokeText(String(count), 640, 300);
  ctx.fillStyle = p.text;
  ctx.shadowColor = p.accent;
  ctx.shadowBlur = 60;
  ctx.fillText(String(count), 640, 300);
  ctx.shadowBlur = 0;
  
  // Headline
  ctx.font = "900 56px Arial, sans-serif";
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 560);
}

function renderGrid(ctx: C2D, headline: string, p: any) {
  ctx.fillStyle = p.bg;
  ctx.fillRect(0, 0, 1280, 720);
  
  // 5x3 grid
  const cellW = 200, cellH = 160, gap = 20;
  const startX = 140, startY = 100;
  
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 5; col++) {
      const num = row * 5 + col + 1;
      const x = startX + col * (cellW + gap);
      const y = startY + row * (cellH + gap);
      
      const isHighlight = num === 1 || num === 5 || num === 11;
      ctx.fillStyle = isHighlight ? p.accent : p.primary;
      ctx.fillRect(x, y, cellW, cellH);
      
      ctx.font = "900 80px Arial, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillStyle = p.bg;
      ctx.fillText(String(num), x + cellW / 2, y + cellH / 2);
    }
  }
  
  // Headline overlay
  const gradOverlay = ctx.createLinearGradient(0, 600, 0, 720);
  gradOverlay.addColorStop(0, "transparent");
  gradOverlay.addColorStop(0.3, p.bg);
  ctx.fillStyle = gradOverlay;
  ctx.fillRect(0, 600, 1280, 120);
  
  ctx.font = "900 48px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 670);
}

function renderDefault(ctx: C2D, headline: string, p: any, index: number) {
  const grad = ctx.createRadialGradient(640, 360, 100, 640, 360, 800);
  grad.addColorStop(0, p.primary + "22");
  grad.addColorStop(1, p.bg);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 1280, 720);
  
  // Shape
  const rotation = (index * 37 - 20) * (Math.PI / 180);
  ctx.save();
  ctx.translate(640, 360);
  ctx.rotate(rotation);
  ctx.fillStyle = p.accent;
  ctx.shadowColor = "rgba(0,0,0,0.6)";
  ctx.shadowBlur = 80;
  ctx.shadowOffsetY = 30;
  
  if (index % 3 === 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 200, 0, Math.PI * 2);
    ctx.fill();
  } else {
    ctx.fillRect(-200, -200, 400, 400);
  }
  
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;
  ctx.restore();
  
  // Headline
  ctx.font = "900 60px Arial, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.strokeStyle = p.bg;
  ctx.lineWidth = 6;
  ctx.strokeText(headline, 640, 620);
  ctx.fillStyle = p.text;
  ctx.fillText(headline, 640, 620);
}

export async function renderPreviewFrame(comp: Composition, t: number): Promise<Buffer> {
  ensureFonts();
  const c = createCanvas(comp.width, comp.height);
  drawFrame(c.getContext("2d") as unknown as C2D, comp, t, new Map());
  return Buffer.from(await c.encode("jpeg", 80));
}

export function pickSeedRng(seed: string) { return new RNG(seed); }
