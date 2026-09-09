import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { automations, channels, musicTracks, thumbnailFingerprints, videos, type Video } from "@/db/schema";
import { and, asc, eq, inArray, isNull, lte, or, sql } from "drizzle-orm";
import { generateComposition } from "@/lib/video/generate";
import { Composition, RNG, CATEGORIES } from "@/lib/video/core";
import { ThumbStyle } from "@/lib/video/thumbnail";
import { renderVideo, MUSIC_DIR, UPLOADS_MUSIC_DIR, renderThumbnail } from "./render";
import { uploadVideo } from "./youtube";
import { downloadFile, uploadFile, deleteFile } from "./storage";
import crypto from "crypto";

type G = typeof globalThis & { __studioWorker?: { running: boolean; timer?: NodeJS.Timeout; started: boolean; lastTick?: number } };
const g = globalThis as G;
g.__studioWorker ??= { running: false, started: false };

// ---------- music ----------
export async function seedMusic() {
  const manifest = path.join(process.cwd(), "data", "music-manifest.txt");
  if (!fs.existsSync(manifest)) return;
  const lines = fs.readFileSync(manifest, "utf8").split("\n").filter(Boolean);
  for (const line of lines) {
    const [mood, title, file] = line.split("|");
    if (!file || !fs.existsSync(path.join(MUSIC_DIR, file))) continue;
    await db.insert(musicTracks).values({ title, mood, filePath: `public/music/${file}`, source: "incompetech", attribution: `"${title}" Kevin MacLeod (incompetech.com) — CC BY 4.0` }).onConflictDoNothing();
  }
}

export function musicAbsPath(filePath: string) {
  if (filePath.startsWith("public/")) return path.join(process.cwd(), filePath);
  if (filePath.startsWith("data/")) return path.join(process.cwd(), filePath);
  return path.join(UPLOADS_MUSIC_DIR, path.basename(filePath));
}

async function musicLocalPath(filePath: string) {
  if (!filePath.startsWith("s3:") && !filePath.startsWith("https://res.cloudinary.com/")) return musicAbsPath(filePath);
  return downloadFile(filePath, path.join(UPLOADS_MUSIC_DIR, `remote-${filePath.slice(3).replace(/[^a-z0-9_.-]/gi, "_")}`));
}

async function pickMusic(mood: string, seed: string) {
  let rows = await db.select().from(musicTracks).where(eq(musicTracks.mood, mood));
  if (!rows.length) rows = await db.select().from(musicTracks);
  if (!rows.length) return null;
  return new RNG(seed + "music").pick(rows);
}

// ---------- thumbnail uniqueness ----------
// Generate a unique fingerprint for HTML-based thumbnails
function uniqueThumbFingerprint(seed: string): string {
  return crypto.createHash("sha256").update(`${seed}-unique-${Date.now()}`).digest("hex").slice(0, 16);
}

export async function uniqueThumbStyle(seed: string, category?: string): Promise<{ style: ThumbStyle; fingerprint: string }> {
  const rng = new RNG(seed + "thumb" + Date.now());
  const index = rng.int(0, 4); // Pick a random variation 0-4
  
  // Create a minimal ThumbStyle (values don't matter much since we're using unique HTML generation)
  const style: ThumbStyle = {
    paletteIdx: index,
    fontIdx: 0,
    hueShift: 0,
    pattern: "gradient",
    deco: "none",
    layout: "center-burst",
    tilt: 0,
    fx: "outline",
    textVariant: 0,
    themeVariant: index,
  };
  
  const fingerprint = uniqueThumbFingerprint(seed);
  
  // Check if this fingerprint already exists
  const exists = await db.select({ id: thumbnailFingerprints.id })
    .from(thumbnailFingerprints)
    .where(eq(thumbnailFingerprints.fingerprint, fingerprint))
    .limit(1);
  
  if (exists.length) {
    // Regenerate with a different timestamp
    await new Promise(resolve => setTimeout(resolve, 10));
    return uniqueThumbStyle(seed, category);
  }
  
  return { style, fingerprint };
}

// ---------- create ----------
export interface CreateVideoInput {
  category: string;
  orientation: "landscape" | "portrait";
  voice?: string;
  mood?: string;
  fallbackVoice?: string;
  channelId?: number | null;
  automationId?: number | null;
  mode?: "review" | "auto";
  scheduledFor?: Date | null;
  seed?: string;
}

export async function createVideo(input: CreateVideoInput): Promise<Video> {
  const comp = generateComposition({ category: input.category, orientation: input.orientation, voice: input.voice, fallbackVoice: input.fallbackVoice, mood: input.mood, seed: input.seed });
  const track = await pickMusic(comp.music.mood, comp.seed);
  const { style, fingerprint } = await uniqueThumbStyle(comp.seed, comp.category);
  const [row] = await db
    .insert(videos)
    .values({
      title: comp.meta.title,
      description: comp.meta.description,
      tags: comp.meta.tags,
      category: comp.category,
      seed: comp.seed,
      orientation: comp.orientation,
      durationSec: comp.duration,
      status: "queued",
      stage: "queued",
      composition: comp,
      thumbnailStyle: style,
      thumbnailFingerprint: fingerprint,
      musicTrackId: track?.id ?? null,
      voice: comp.voice.name,
      channelId: input.channelId ?? null,
      automationId: input.automationId ?? null,
      mode: input.mode ?? "review",
      scheduledFor: input.scheduledFor ?? null,
    })
    .returning();
  await db.insert(thumbnailFingerprints).values({ fingerprint, videoId: row.id }).onConflictDoNothing();
  // pre-render the thumbnail immediately so the UI has something to show
  try {
    const { path: tp, grammar } = await renderThumbnail(row.id, comp, style);
    const storedThumb = await uploadFile(tp, `thumbs/${row.id}.png`, "image/png");
    await db.update(videos).set({ thumbPath: storedThumb }).where(eq(videos.id, row.id));
    // Store the grammar used
    await db.update(thumbnailFingerprints).set({ grammar }).where(eq(thumbnailFingerprints.fingerprint, fingerprint));
    row.thumbPath = storedThumb;
  } catch (e) { console.warn("thumb prerender failed", e); }
  kickWorker();
  return row;
}

// ---------- worker ----------
export function kickWorker() {
  if (process.env.VERCEL) return;
  if (g.__studioWorker!.running) return;
  g.__studioWorker!.running = true;
  (async () => {
    try {
      // recover anything stuck in rendering from a previous process
      await db.update(videos).set({ status: "queued", stage: "requeued", progress: 0 }).where(eq(videos.status, "rendering"));
      for (;;) {
        const [next] = await db.select().from(videos).where(eq(videos.status, "queued")).orderBy(asc(videos.createdAt)).limit(1);
        if (!next) break;
        await processVideo(next);
      }
    } catch (e) {
      console.error("worker error", e);
    } finally {
      g.__studioWorker!.running = false;
    }
  })();
}

export async function processQueuedOnce() {
  if (g.__studioWorker!.running) return false;
  const [next] = await db.select().from(videos).where(eq(videos.status, "queued")).orderBy(asc(videos.createdAt)).limit(1);
  if (!next) return false;
  g.__studioWorker!.running = true;
  try {
    await processVideo(next);
  } finally {
    g.__studioWorker!.running = false;
  }
  return true;
}

async function processVideo(v: Video) {
  await db.update(videos).set({ status: "rendering", progress: 0, stage: "starting", error: null }).where(eq(videos.id, v.id));
  const comp = v.composition as Composition;
  const track = v.musicTrackId ? (await db.select().from(musicTracks).where(eq(musicTracks.id, v.musicTrackId)))[0] : null;
  
  // Use existing thumbnailStyle or create a minimal one
  const style = (v.thumbnailStyle as ThumbStyle) ?? {
    paletteIdx: 0,
    fontIdx: 0,
    hueShift: 0,
    pattern: "gradient" as const,
    deco: "none" as const,
    layout: "center-burst" as const,
    tilt: 0,
    fx: "outline" as const,
    textVariant: 0,
    themeVariant: 0,
  };
  
  let lastWrite = 0;
  try {
    const res = await renderVideo(v.id, comp, track ? await musicLocalPath(track.filePath) : null, style, {
      onProgress: async (pct, stage) => {
        const now = Date.now();
        if (now - lastWrite < 700 && pct < 100) return;
        lastWrite = now;
        await db.update(videos).set({ progress: pct, stage }).where(eq(videos.id, v.id));
      },
    });
    const autoPost = v.mode === "auto" && v.channelId;
    const videoPath = await uploadFile(res.videoPath, `videos/${v.id}.mp4`, "video/mp4");
    const thumbPath = await uploadFile(res.thumbPath, `thumbs/${v.id}.png`, "image/png");
    await db.update(videos).set({ status: autoPost ? "scheduled" : "ready", progress: 100, stage: "done", videoPath, thumbPath, durationSec: res.durationSec }).where(eq(videos.id, v.id));
    if (autoPost) setTimeout(() => publishDue().catch(console.error), 500);
  } catch (e) {
    console.error("render failed", e);
    await db.update(videos).set({ status: "failed", stage: "failed", error: (e as Error).message.slice(0, 2000) }).where(eq(videos.id, v.id));
  }
}

// ---------- publishing ----------
export async function publishVideo(videoId: number, channelId?: number | null): Promise<string> {
  const [v] = await db.select().from(videos).where(eq(videos.id, videoId));
  if (!v) throw new Error("video not found");
  if (!v.videoPath) throw new Error("video file not rendered yet");
  const chId = channelId ?? v.channelId;
  if (!chId) throw new Error("no channel selected");
  const [ch] = await db.select().from(channels).where(eq(channels.id, chId));
  if (!ch) throw new Error("channel not found");
  await db.update(videos).set({ status: "posting", channelId: chId, error: null }).where(eq(videos.id, videoId));
  try {
    const uploadDir = path.join(UPLOADS_MUSIC_DIR, "youtube");
    const videoFile = await downloadFile(v.videoPath, path.join(uploadDir, `${videoId}.mp4`));
    const thumbFile = v.thumbPath ? await downloadFile(v.thumbPath, path.join(uploadDir, `${videoId}.png`)) : null;
    const ytId = await uploadVideo(ch, { filePath: videoFile, thumbPath: thumbFile, title: v.title, description: v.description, tags: v.tags });
    await db.update(videos).set({ status: "posted", youtubeVideoId: ytId, postedAt: new Date() }).where(eq(videos.id, videoId));
    return ytId;
  } catch (e) {
    await db.update(videos).set({ status: "ready", error: (e as Error).message.slice(0, 2000) }).where(eq(videos.id, videoId));
    throw e;
  }
}

let publishing = false;
export async function publishDue() {
  if (publishing) return;
  publishing = true;
  try {
    const due = await db.select().from(videos).where(and(eq(videos.status, "scheduled"), or(isNull(videos.scheduledFor), lte(videos.scheduledFor, new Date()))));
    for (const v of due) {
      try { await publishVideo(v.id); } catch (e) { console.error("publish failed", v.id, e); }
    }
  } finally {
    publishing = false;
  }
}

// ---------- planning ----------
function todayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function atToday(hhmm: string) {
  const [h, m] = hhmm.split(":").map(Number);
  const d = new Date();
  d.setHours(h || 0, m || 0, 0, 0);
  return d;
}

export async function planAutomation(a: typeof automations.$inferSelect, force = false) {
  const key = todayKey();
  if (!force && a.lastPlannedDate === key) return 0;
  await db.update(automations).set({ lastPlannedDate: key }).where(eq(automations.id, a.id));
  const rng = new RNG(`${a.id}-${key}-${Date.now()}`);
  const cats = a.categories.length ? a.categories : CATEGORIES.map((c) => c.id);
  const chans = a.channelIds.length ? a.channelIds : [null];
  const times = a.postTimes.length ? a.postTimes : Array.from({ length: a.perDay }, (_, i) => `${String(9 + Math.floor((i * 12) / Math.max(1, a.perDay))).padStart(2, "0")}:00`);
  let created = 0;
  for (let i = 0; i < a.perDay; i++) {
    const orientation = a.orientation === "mixed" ? (rng.chance(0.5) ? "landscape" : "portrait") : (a.orientation as "landscape" | "portrait");
    const when = atToday(times[i % times.length]);
    if (i >= times.length) when.setMinutes(when.getMinutes() + Math.floor(i / times.length) * 37);
    await createVideo({
      category: rng.pick(cats),
      orientation,
      voice: a.voice,
      fallbackVoice: a.fallbackVoice,
      mood: a.musicMood,
      channelId: chans[i % chans.length],
      automationId: a.id,
      mode: a.mode as "review" | "auto",
      scheduledFor: when,
    });
    created++;
  }
  return created;
}

export async function tick() {
  g.__studioWorker!.lastTick = Date.now();
  const list = await db.select().from(automations).where(eq(automations.enabled, true));
  for (const a of list) {
    try { await planAutomation(a); } catch (e) { console.error("plan failed", a.id, e); }
  }
  await publishDue();
  kickWorker();
}

export function startScheduler() {
  if (g.__studioWorker!.started) return;
  g.__studioWorker!.started = true;
  seedMusic().catch(console.error);
  setTimeout(() => tick().catch(console.error), 3000);
  g.__studioWorker!.timer = setInterval(() => tick().catch(console.error), 60_000);
}

export function workerStatus() {
  return { running: g.__studioWorker!.running, started: g.__studioWorker!.started, lastTick: g.__studioWorker!.lastTick ?? null };
}

export async function queueStats() {
  const rows = await db.select({ status: videos.status, n: sql<number>`count(*)::int` }).from(videos).groupBy(videos.status);
  const out: Record<string, number> = {};
  for (const r of rows) out[r.status] = r.n;
  return out;
}

export async function deleteVideo(id: number) {
  const [v] = await db.select().from(videos).where(eq(videos.id, id));
  if (!v) return;
  for (const f of [v.videoPath, v.thumbPath]) if (f) await deleteFile(f);
  await db.delete(videos).where(eq(videos.id, id));
}

export async function channelsByIds(ids: number[]) {
  if (!ids.length) return [];
  return db.select().from(channels).where(inArray(channels.id, ids));
}
