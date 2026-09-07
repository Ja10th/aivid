import { studioSample, isStudioVoice } from "@/lib/server/studio-api";

export const dynamic = "force-dynamic";

type P = { params: Promise<{ voice_id: string }> };

export async function GET(_: Request, { params }: P) {
  const { voice_id: voiceId } = await params;
  if (!isStudioVoice(voiceId)) return Response.json({ error: "Unknown Studio Voice" }, { status: 404 });
  try {
    return new Response(await studioSample(voiceId), { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "VoxLab Studio API is temporarily unavailable" }, { status: 503 });
  }
}
