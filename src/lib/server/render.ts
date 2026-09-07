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
  for (const [family, file] of Object.entries(FONT_FILES)) {
    const fp = path.join(dir, file);
    if (fs.existsSync(fp)) {
      try { GlobalFonts.registerFromPath(fp, family); } catch { /* ignore */ }
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

const STUDIO_FALLBACK_VOICE = "en-US-AriaNeural";

// ---------- TTS (Microsoft Edge neural voices, no API key) ----------
export async function synthesize(text: string, voice: string, rate: string, pitch: string, outFile: string): Promise<boolean> {
  if (isStudioVoice(voice)) {
    try {
      fs.writeFileSync(outFile, await studioTts(text, voice, speedFromRate(rate)));
      return true;
    } catch (error) {
      console.warn(`Studio Voice ${voice} unavailable; falling back to ${STUDIO_FALLBACK_VOICE}:`, (error as Error).message);
      return synthesizeLocal(text, STUDIO_FALLBACK_VOICE, rate, pitch, outFile);
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
    const ok = await synthesize(s.narration!, comp.voice.name, comp.voice.rate, comp.voice.pitch, file);
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

export async function renderThumbnail(id: number, comp: Composition, style: ThumbStyle): Promise<string> {
  ensureFonts();
  const c = createCanvas(1280, 720);
  drawThumbnail(c.getContext("2d") as unknown as C2D, comp, style, 1280, 720);
  const file = path.join(THUMBS_DIR, `${id}.png`);
  fs.writeFileSync(file, await c.encode("png"));
  return file;
}

export async function renderPreviewFrame(comp: Composition, t: number): Promise<Buffer> {
  ensureFonts();
  const c = createCanvas(comp.width, comp.height);
  drawFrame(c.getContext("2d") as unknown as C2D, comp, t, new Map());
  return Buffer.from(await c.encode("jpeg", 80));
}

export function pickSeedRng(seed: string) { return new RNG(seed); }
