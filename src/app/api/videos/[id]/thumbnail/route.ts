import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels, thumbnailFingerprints, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Composition } from "@/lib/video/core";
import { renderThumbnail } from "@/lib/server/render";
import { styleFingerprint } from "@/lib/video/thumbnail";
import { uniqueThumbStyle } from "@/lib/server/engine";
import { uploadFile } from "@/lib/server/storage";
import { updateVideoThumbnail } from "@/lib/server/youtube";
import { bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [video] = await db.select().from(videos).where(eq(videos.id, Number(id)));
    if (!video) return bad("not found", 404);
    const style = await uniqueThumbStyle(`${video.seed}-${Date.now()}`, video.category);
    const localThumbPath = await renderThumbnail(video.id, video.composition as Composition, style);
    const thumbPath = await uploadFile(localThumbPath, `thumbs/${video.id}.png`, "image/png");
    if (video.youtubeVideoId) {
      if (!video.channelId) throw new Error("posted video has no connected YouTube channel");
      const [channel] = await db.select().from(channels).where(eq(channels.id, video.channelId));
      if (!channel) throw new Error("connected YouTube channel not found");
      await updateVideoThumbnail(channel, video.youtubeVideoId, localThumbPath);
    }
    const fingerprint = styleFingerprint(style);
    await db.insert(thumbnailFingerprints).values({ fingerprint, videoId: video.id }).onConflictDoNothing();
    const [updated] = await db.update(videos).set({ thumbnailStyle: style, thumbnailFingerprint: fingerprint, thumbPath }).where(eq(videos.id, video.id)).returning();
    return Response.json(updated);
  } catch (error) {
    return bad((error as Error).message || "thumbnail regeneration failed", 500);
  }
}