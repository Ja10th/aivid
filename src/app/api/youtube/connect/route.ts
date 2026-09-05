import { NextRequest } from "next/server";
import { authUrl, getGoogleCreds } from "@/lib/server/youtube";
import { originOf } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const { configured } = await getGoogleCreds();
  const origin = originOf(req);
  if (!configured) return Response.redirect(`${origin}/channels?error=${encodeURIComponent("Add your Google OAuth client ID and secret first.")}`);
  return Response.redirect(await authUrl(origin));
}
