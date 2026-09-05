import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { exchangeCode, fetchMyChannel } from "@/lib/server/youtube";
import { originOf } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET(req: NextRequest) {
  const origin = originOf(req);
  const code = req.nextUrl.searchParams.get("code");
  const err = req.nextUrl.searchParams.get("error");
  if (err || !code) return Response.redirect(`${origin}/channels?error=${encodeURIComponent(err || "no code")}`);
  try {
    const tok = await exchangeCode(code, origin);
    const ch = await fetchMyChannel(tok.access_token);
    const expiry = new Date(Date.now() + tok.expires_in * 1000);
    await db.insert(channels).values({ youtubeChannelId: ch.id, title: ch.title, handle: ch.handle, thumbnailUrl: ch.thumbnailUrl, accessToken: tok.access_token, refreshToken: tok.refresh_token ?? null, tokenExpiry: expiry, subscriberCount: ch.subscriberCount })
      .onConflictDoUpdate({ target: channels.youtubeChannelId, set: { title: ch.title, handle: ch.handle, thumbnailUrl: ch.thumbnailUrl, accessToken: tok.access_token, ...(tok.refresh_token ? { refreshToken: tok.refresh_token } : {}), tokenExpiry: expiry, subscriberCount: ch.subscriberCount } });
    return Response.redirect(`${origin}/channels?connected=${encodeURIComponent(ch.title)}`);
  } catch (e) {
    return Response.redirect(`${origin}/channels?error=${encodeURIComponent((e as Error).message)}`);
  }
}
