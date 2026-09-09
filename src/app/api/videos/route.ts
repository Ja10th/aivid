import { NextRequest } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { createVideo } from "@/lib/server/engine";
import { bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const status = req.nextUrl.searchParams.get("status");
  const q = db.select({ id: videos.id, title: videos.title, category: videos.category, orientation: videos.orientation, durationSec: videos.durationSec, status: videos.status, progress: videos.progress, stage: videos.stage, thumbPath: videos.thumbPath, thumbnailFingerprint: videos.thumbnailFingerprint, videoPath: videos.videoPath, channelId: videos.channelId, scheduledFor: videos.scheduledFor, youtubeVideoId: videos.youtubeVideoId, createdAt: videos.createdAt, error: videos.error, mode: videos.mode, seed: videos.seed }).from(videos).orderBy(desc(videos.createdAt)).limit(200);
  const rows = status ? await q.where(eq(videos.status, status)) : await q;
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const category = String(b.category || "mixed");
  const orientation = b.orientation === "portrait" ? "portrait" : "landscape";
  const count = Math.min(10, Math.max(1, Number(b.count || 1)));
  const out = [];
  for (let i = 0; i < count; i++) {
    try {
      const v = await createVideo({ category, orientation, voice: b.voice || "random", mood: b.mood || "auto", channelId: b.channelId ? Number(b.channelId) : null, mode: b.mode === "auto" ? "auto" : "review", scheduledFor: b.scheduledFor ? new Date(b.scheduledFor) : null, seed: count === 1 && b.seed ? String(b.seed) : undefined });
      out.push({ id: v.id, title: v.title });
    } catch (e) {
      return bad((e as Error).message, 500);
    }
  }
  return Response.json(out.length === 1 ? out[0] : out);
}
