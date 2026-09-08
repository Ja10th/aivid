import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels, thumbnailFingerprints, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Composition } from "@/lib/video/core";
import { renderThumbnail } from "@/lib/server/render";
import { styleFingerprint, thumbnailCandidates, type ThumbStyle } from "@/lib/video/thumbnail";
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
    const body = await _.json().catch(() => ({})) as { action?: string; index?: number; style?: ThumbStyle };
    const candidates = thumbnailCandidates(`${video.seed}-${Date.now()}`, video.category);
    // Ensure each candidate has a distinct themeVariant (0-4)
    candidates.forEach((c, i) => { c.themeVariant = i % 5; });

    const comp: Composition = {
      ...(video.composition as Composition),
      category: (video.composition as Composition)?.category || video.category,
      seed: (video.composition as Composition)?.seed || video.seed,
      meta: {
        ...((video.composition as Composition)?.meta ?? {}),
        title: video.title || (video.composition as Composition)?.meta?.title || "",
      },
    };

    if (body.action !== "select") {
      const variants = [];
      for (let index = 0; index < candidates.length; index++) {
        const style = candidates[index];
        const fingerprint = styleFingerprint(style);
        const localThumbPath = await renderThumbnail(video.id, comp, style, `${video.id}-variant-${index}-${fingerprint}`);
        const path = await uploadFile(localThumbPath, `thumbs/${video.id}-variant-${index}-${fingerprint}.png`, "image/png");
        variants.push({ index, path, fingerprint, style });
      }
      return Response.json({ video, variants });
    }

    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= candidates.length) return bad("invalid thumbnail option", 400);
    const style = body.style ?? candidates[index];
    const fingerprint = styleFingerprint(style);
    const localThumbPath = await renderThumbnail(video.id, comp, style, `${video.id}-${fingerprint}`);
    const thumbPath = await uploadFile(localThumbPath, `thumbs/${video.id}-${fingerprint}.png`, "image/png");
    if (video.youtubeVideoId) {
      if (!video.channelId) throw new Error("posted video has no connected YouTube channel");
      const [channel] = await db.select().from(channels).where(eq(channels.id, video.channelId));
      if (!channel) throw new Error("connected YouTube channel not found");
      await updateVideoThumbnail(channel, video.youtubeVideoId, localThumbPath);
    }
    await db.insert(thumbnailFingerprints).values({ fingerprint, videoId: video.id }).onConflictDoNothing();
    const [updated] = await db.update(videos).set({ thumbnailStyle: style, thumbnailFingerprint: fingerprint, thumbPath }).where(eq(videos.id, video.id)).returning();
    return Response.json({ video: updated, variants: [] });
  } catch (error) {
    return bad((error as Error).message || "thumbnail regeneration failed", 500);
  }
}