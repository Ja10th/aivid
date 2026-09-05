import { NextRequest } from "next/server";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import { createVideo } from "@/lib/server/engine";
import { bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";

export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [v] = await db.select().from(videos).where(eq(videos.id, Number(id)));
  if (!v) return bad("not found", 404);
  const nv = await createVideo({ category: v.category, orientation: v.orientation as "landscape" | "portrait", channelId: v.channelId, mode: v.mode as "review" | "auto" });
  return Response.json({ id: nv.id });
}
