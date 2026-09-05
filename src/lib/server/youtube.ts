import fs from "node:fs";
import { db } from "@/db";
import { channels, settings, type Channel } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function getSetting(key: string): Promise<string | null> {
  const rows = await db.select().from(settings).where(eq(settings.key, key)).limit(1);
  return rows[0]?.value ?? null;
}
export async function setSetting(key: string, value: string) {
  await db.insert(settings).values({ key, value }).onConflictDoUpdate({ target: settings.key, set: { value } });
}

export async function getGoogleCreds() {
  const clientId = process.env.GOOGLE_CLIENT_ID || (await getSetting("google_client_id"));
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || (await getSetting("google_client_secret"));
  return { clientId, clientSecret, configured: Boolean(clientId && clientSecret) };
}

export function redirectUri(origin: string) {
  return `${origin}/api/youtube/callback`;
}

const SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];

export async function authUrl(origin: string) {
  const { clientId } = await getGoogleCreds();
  const u = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  u.searchParams.set("client_id", clientId!);
  u.searchParams.set("redirect_uri", redirectUri(origin));
  u.searchParams.set("response_type", "code");
  u.searchParams.set("scope", SCOPES.join(" "));
  u.searchParams.set("access_type", "offline");
  u.searchParams.set("prompt", "consent select_account");
  u.searchParams.set("include_granted_scopes", "true");
  return u.toString();
}

interface TokenResp { access_token: string; refresh_token?: string; expires_in: number; error?: string; error_description?: string }

export async function exchangeCode(code: string, origin: string) {
  const { clientId, clientSecret } = await getGoogleCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ code, client_id: clientId!, client_secret: clientSecret!, redirect_uri: redirectUri(origin), grant_type: "authorization_code" }),
  });
  const j = (await res.json()) as TokenResp;
  if (!res.ok || j.error) throw new Error(j.error_description || j.error || "token exchange failed");
  return j;
}

export async function refreshAccessToken(ch: Channel): Promise<string> {
  const fresh = ch.tokenExpiry && ch.tokenExpiry.getTime() - Date.now() > 120_000;
  if (fresh) return ch.accessToken;
  if (!ch.refreshToken) throw new Error(`Channel ${ch.title} has no refresh token — reconnect it.`);
  const { clientId, clientSecret } = await getGoogleCreds();
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ refresh_token: ch.refreshToken, client_id: clientId!, client_secret: clientSecret!, grant_type: "refresh_token" }),
  });
  const j = (await res.json()) as TokenResp;
  if (!res.ok || j.error) throw new Error(j.error_description || j.error || "token refresh failed");
  await db.update(channels).set({ accessToken: j.access_token, tokenExpiry: new Date(Date.now() + j.expires_in * 1000) }).where(eq(channels.id, ch.id));
  return j.access_token;
}

export async function fetchMyChannel(accessToken: string) {
  const res = await fetch("https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics&mine=true", { headers: { Authorization: `Bearer ${accessToken}` } });
  const j = await res.json();
  if (!res.ok) throw new Error(j?.error?.message || "failed to fetch channel");
  const item = j.items?.[0];
  if (!item) throw new Error("This Google account has no YouTube channel.");
  return {
    id: item.id as string,
    title: item.snippet.title as string,
    handle: (item.snippet.customUrl as string) || null,
    thumbnailUrl: (item.snippet.thumbnails?.default?.url as string) || null,
    subscriberCount: Number(item.statistics?.subscriberCount ?? 0),
  };
}

export async function uploadVideo(ch: Channel, opts: { filePath: string; thumbPath?: string | null; title: string; description: string; tags: string[]; privacy?: "public" | "unlisted" | "private"; publishAt?: Date | null }) {
  const token = await refreshAccessToken(ch);
  const size = fs.statSync(opts.filePath).size;
  const meta = {
    snippet: { title: opts.title.slice(0, 100), description: opts.description.slice(0, 4900), tags: opts.tags.slice(0, 30), categoryId: "27" },
    status: { privacyStatus: opts.privacy ?? "public", selfDeclaredMadeForKids: false, ...(opts.publishAt ? { publishAt: opts.publishAt.toISOString(), privacyStatus: "private" } : {}) },
  };
  const init = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Length": String(size), "X-Upload-Content-Type": "video/mp4" },
    body: JSON.stringify(meta),
  });
  if (!init.ok) throw new Error(`upload init failed: ${init.status} ${await init.text()}`);
  const loc = init.headers.get("location");
  if (!loc) throw new Error("no upload location returned");
  const body = fs.readFileSync(opts.filePath);
  const up = await fetch(loc, { method: "PUT", headers: { "Content-Length": String(size), "Content-Type": "video/mp4" }, body });
  if (!up.ok) throw new Error(`upload failed: ${up.status} ${await up.text()}`);
  const vid = (await up.json()) as { id: string };
  if (opts.thumbPath && fs.existsSync(opts.thumbPath)) {
    try {
      const th = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${vid.id}`, { method: "POST", headers: { Authorization: `Bearer ${token}`, "Content-Type": "image/png" }, body: fs.readFileSync(opts.thumbPath) });
      if (!th.ok) console.warn("thumbnail set failed", await th.text());
    } catch (e) { console.warn("thumbnail set error", e); }
  }
  return vid.id;
}
