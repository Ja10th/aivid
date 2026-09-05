import { NextRequest } from "next/server";
import { publishVideo } from "@/lib/server/engine";
import { bad } from "@/lib/server/http";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  try {
    const ytId = await publishVideo(Number(id), b.channelId ? Number(b.channelId) : null);
    return Response.json({ ok: true, youtubeVideoId: ytId });
  } catch (e) {
    return bad((e as Error).message, 500);
  }
}
