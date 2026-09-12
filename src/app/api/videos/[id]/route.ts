import { NextRequest } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { deleteVideo, kickWorker, publishDue } from "@/lib/server/engine";
import { bad } from "@/lib/server/http";
import type { Composition } from "@/lib/video/core";

export const dynamic = "force-dynamic";
type P = { params: Promise<{ id: string }> };

export async function GET(_: NextRequest, { params }: P) {
  const { id } = await params;
  const [v] = await db.select().from(videos).where(eq(videos.id, Number(id)));
  if (!v) return bad("not found", 404);
  return Response.json(v);
}

export async function PATCH(req: NextRequest, { params }: P) {
  try {
    const { id } = await params;
    const b = await req.json().catch(() => ({}));
    const set: Partial<typeof videos.$inferInsert> = {};
    if (typeof b.title === "string") set.title = b.title.slice(0, 100);
  if (typeof b.description === "string") set.description = b.description.slice(0, 4900);
  if (Array.isArray(b.tags)) set.tags = b.tags.map(String).slice(0, 30);
  if ("channelId" in b) set.channelId = b.channelId ? Number(b.channelId) : null;
  if ("scheduledFor" in b) set.scheduledFor = b.scheduledFor ? new Date(b.scheduledFor) : null;
  if (b.composition && typeof b.composition === "object" && Array.isArray(b.composition.scenes)) {
    const composition = b.composition as Composition;
    let start = 0;
    composition.scenes = composition.scenes
      .filter((scene) => scene && typeof scene.duration === "number" && scene.duration > 0)
      .map((scene) => {
        const next = { ...scene, start, duration: Math.max(0.5, Math.min(3600, scene.duration)), narrationMuted: Boolean(scene.narrationMuted) };
        start += next.duration;
        return next;
      });
    composition.duration = start;
    composition.music = { ...composition.music, volume: Math.max(0, Math.min(1, Number(composition.music?.volume ?? 0.16))) };
    set.composition = composition;
    set.durationSec = start;
    set.status = "queued";
    set.progress = 0;
    set.stage = "queued";
    set.error = null;
    set.videoPath = null;
  }
  if (b.action === "schedule") { set.status = "scheduled"; set.error = null; }
  if (b.action === "unschedule") set.status = "ready";
  if (b.action === "retry") { set.status = "queued"; set.progress = 0; set.stage = "queued"; set.error = null; }
  if (b.action === "retry-post") { set.status = "ready"; set.progress = 100; set.stage = "ready"; set.error = null; }
  const [v] = await db.update(videos).set(set).where(eq(videos.id, Number(id))).returning();
  if (!v) return bad("not found", 404);
  if (b.action === "retry") kickWorker();
  if (b.action === "retry-post") { setTimeout(() => publishDue().catch(console.error), 200); }
  if (b.composition) kickWorker();
  if (b.action === "schedule") setTimeout(() => publishDue().catch(console.error), 200);
    return Response.json(v);
  } catch (error) {
    console.error("video update failed", error);
    return bad((error as Error).message || "video update failed", 500);
  }
}

export async function DELETE(_: NextRequest, { params }: P) {
  const { id } = await params;
  await deleteVideo(Number(id));
  return Response.json({ ok: true });
}
