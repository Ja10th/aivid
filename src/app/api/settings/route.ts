import { NextRequest } from "next/server";
import { getGoogleCreds, redirectUri, setSetting } from "@/lib/server/youtube";
import { originOf } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const c = await getGoogleCreds();
  return Response.json({ configured: c.configured, clientId: c.clientId ? c.clientId.slice(0, 12) + "…" : null, redirectUri: redirectUri(originOf(req)), fromEnv: Boolean(process.env.GOOGLE_CLIENT_ID) });
}
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (b.clientId) await setSetting("google_client_id", String(b.clientId).trim());
  if (b.clientSecret) await setSetting("google_client_secret", String(b.clientSecret).trim());
  return Response.json({ ok: true });
}
