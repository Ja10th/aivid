import { studioHealth, studioVoices } from "@/lib/server/studio-api";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const available = await studioHealth();
    if (!available) return Response.json({ voices: [], available: false });
    return Response.json(await studioVoices());
  } catch {
    return Response.json({ voices: [], available: false });
  }
}
