import { NextRequest } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { db } from "@/db";
import { musicTracks } from "@/db/schema";
import { asc } from "drizzle-orm";
import { seedMusic } from "@/lib/server/engine";
import { UPLOADS_MUSIC_DIR } from "@/lib/server/render";
import { bad } from "@/lib/server/http";
import { uploadFile } from "@/lib/server/storage";
export const dynamic = "force-dynamic";

export async function GET() {
  let rows = await db.select().from(musicTracks).orderBy(asc(musicTracks.mood), asc(musicTracks.title));
  if (!rows.length) { await seedMusic(); rows = await db.select().from(musicTracks).orderBy(asc(musicTracks.mood), asc(musicTracks.title)); }
  return Response.json(rows);
}

export async function POST(req: NextRequest) {
  const ct = req.headers.get("content-type") || "";
  let title = "", mood = "focus", buf: Buffer | null = null, source = "upload", attribution: string | null = null;
  if (ct.includes("multipart/form-data")) {
    const fd = await req.formData();
    const f = fd.get("file") as File | null;
    if (!f) return bad("file required");
    title = String(fd.get("title") || f.name.replace(/\.[^.]+$/, ""));
    mood = String(fd.get("mood") || "focus");
    buf = Buffer.from(await f.arrayBuffer());
  } else {
    const b = await req.json().catch(() => ({}));
    if (!b.url) return bad("url required");
    let sourceUrl: URL;
    try { sourceUrl = new URL(String(b.url)); } catch { return bad("enter a valid direct audio URL"); }
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return bad(`download failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a)(?:$|\?)/i.test(sourceUrl.pathname)) return bad("that URL is not a direct audio file; download the Pixabay track and upload the file instead");
    buf = Buffer.from(await res.arrayBuffer());
    title = String(b.title || decodeURIComponent(path.basename(sourceUrl.pathname)).replace(/\.[^.]+$/, ""));
    mood = String(b.mood || "focus");
    source = "url";
    attribution = String(b.attribution || sourceUrl.toString());
  }
  if (!buf || buf.length < 10000) return bad("file too small or empty");
  const safe = title.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "track";
  const file = `${Date.now()}_${safe}.mp3`;
  const localPath = path.join(UPLOADS_MUSIC_DIR, file);
  fs.writeFileSync(localPath, buf);
  const filePath = await uploadFile(localPath, `music/${file}`, "audio/mpeg");
  const [row] = await db.insert(musicTracks).values({ title, mood, filePath, source, attribution }).returning();
  return Response.json(row);
}
