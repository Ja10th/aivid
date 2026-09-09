import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels, thumbnailFingerprints, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Composition } from "@/lib/video/core";
import { renderThumbnail } from "@/lib/server/render";
import type { ThumbStyle } from "@/lib/video/thumbnail";
import { uploadFile } from "@/lib/server/storage";
import { updateVideoThumbnail } from "@/lib/server/youtube";
import { bad } from "@/lib/server/http";
import crypto from "crypto";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

// Generate a fingerprint for unique HTML thumbnails
function uniqueThumbFingerprint(seed: string, index: number): string {
  return crypto.createHash("sha256").update(`${seed}-unique-${index}`).digest("hex").slice(0, 16);
}

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const [video] = await db.select().from(videos).where(eq(videos.id, Number(id)));
    if (!video) return bad("not found", 404);
    const body = await _.json().catch(() => ({})) as { action?: string; index?: number; fingerprint?: string };

    const comp: Composition = {
      ...(video.composition as Composition),
      category: (video.composition as Composition)?.category || video.category,
      seed: (video.composition as Composition)?.seed || video.seed,
      meta: {
        ...((video.composition as Composition)?.meta ?? {}),
        title: video.title || (video.composition as Composition)?.meta?.title || "",
      },
      scenes: (video.composition as Composition)?.scenes || [],
    };

    // Use consistent seed - only change when explicitly regenerating new options
    // If user is selecting a variant, use the original video seed to maintain consistency
    const baseSeed = body.action === "select" && body.fingerprint 
      ? video.seed // Use original seed when selecting to ensure consistency
      : `${video.seed}-${Date.now()}`; // New seed when generating new options

    if (body.action !== "select") {
      // Generate 5 completely unique thumbnail variants
      console.log(`[Thumbnail] Generating 5 unique HTML thumbnails for video ${video.id}`);
      const variants = [];
      
      // Check if we should use the Render worker for better quality
      const useWorker = !!process.env.RENDER_WORKER_URL;
      
      for (let index = 0; index < 5; index++) {
        const fingerprint = uniqueThumbFingerprint(baseSeed, index);
        console.log(`[Thumbnail] Variant ${index}: fingerprint=${fingerprint}`);
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
          themeVariant: index 
        };
        
        let path: string;
        
        if (useWorker) {
          // Use Render worker for Puppeteer rendering
          console.log(`[Thumbnail] Requesting render from worker...`);
          try {
            const response = await fetch(`${process.env.RENDER_WORKER_URL}/render-thumbnail`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                videoId: video.id,
                composition: comp,
                style,
                outputKey: `${video.id}-variant-${index}-${fingerprint}`,
              }),
            });
            const result = await response.json();
            if (result.success) {
              path = result.path;
              console.log(`[Thumbnail] Worker rendered: ${path}`);
            } else {
              throw new Error(result.error);
            }
          } catch (error) {
            console.error(`[Thumbnail] Worker failed, falling back to local:`, (error as Error).message);
            const localThumbPath = await renderThumbnail(video.id, comp, style, `${video.id}-variant-${index}-${fingerprint}`);
            path = await uploadFile(localThumbPath, `thumbs/${video.id}-variant-${index}-${fingerprint}.png`, "image/png");
          }
        } else {
          // Render locally (canvas fallback on Vercel)
          console.log(`[Thumbnail] Rendering variant ${index} locally...`);
          const localThumbPath = await renderThumbnail(video.id, comp, style, `${video.id}-variant-${index}-${fingerprint}`);
          console.log(`[Thumbnail] Rendered to: ${localThumbPath}`);
          path = await uploadFile(localThumbPath, `thumbs/${video.id}-variant-${index}-${fingerprint}.png`, "image/png");
          console.log(`[Thumbnail] Uploaded to: ${path}`);
        }
        
        variants.push({ index, path, fingerprint, style });
      }
      console.log(`[Thumbnail] Successfully generated ${variants.length} variants`);
      return Response.json({ video, variants });
    }

    const index = Number(body.index);
    if (!Number.isInteger(index) || index < 0 || index >= 5) return bad("invalid thumbnail option", 400);
    
    // CRITICAL FIX: Use the fingerprint from the selected variant to regenerate EXACTLY the same thumbnail
    const fingerprint = body.fingerprint || uniqueThumbFingerprint(baseSeed, index);
    
    // Empty style object - unique HTML generation doesn't use ThumbStyle
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
      themeVariant: index 
    };
    
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