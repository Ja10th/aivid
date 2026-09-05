import { NextRequest } from "next/server";
import { db } from "@/db";
import { thumbnailFingerprints, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Composition } from "@/lib/video/core";
import { renderThumbnail } from "@/lib/server/render";
import { styleFingerprint } from "@/lib/video/thumbnail";
import { uniqueThumbStyle } from "@/lib/server/engine";
import { uploadFile } from "@/lib/server/storage";
import { bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [video] = await db.select().from(videos).where(eq(videos.id, Number(id)));
  if (!video) return bad("not found", 404);
  const style = await uniqueThumbStyle(`${video.seed}-${Date.now()}`);
  const localThumbPath = await renderThumbnail(video.id, video.composition as Composition, style);
  const thumbPath = await uploadFile(localThumbPath, `thumbs/${video.id}.png`, "image/png");
  await db.insert(thumbnailFingerprints).values({ fingerprint: styleFingerprint(style), videoId: video.id }).onConflictDoNothing();
  const [updated] = await db.update(videos).set({ thumbnailStyle: style, thumbnailFingerprint: styleFingerprint(style), thumbPath }).where(eq(videos.id, video.id)).returning();
  return Response.json(updated);
}