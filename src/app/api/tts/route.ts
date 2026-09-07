import { studioTts, isStudioVoice } from "@/lib/server/studio-api";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null) as { text?: unknown; voice_id?: unknown; speed?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text : "";
  const voiceId = typeof body?.voice_id === "string" ? body.voice_id : "";
  const speed = typeof body?.speed === "number" && Number.isFinite(body.speed) ? body.speed : 1;
  if (!text.trim() || !isStudioVoice(voiceId)) return Response.json({ error: "text and a valid Studio Voice are required" }, { status: 400 });
  try {
    return new Response(await studioTts(text, voiceId, speed), { headers: { "Content-Type": "audio/wav", "Cache-Control": "no-store" } });
  } catch {
    return Response.json({ error: "VoxLab Studio API is temporarily unavailable" }, { status: 503 });
  }
}
