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

const MAX_FILES_PER_REQUEST = 3;
const MAX_TOTAL_UPLOAD_BYTES = 18 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const fd = await req.formData();
      const files = Array.from(fd.getAll("file")).filter((value): value is File => value instanceof File);
      if (!files.length) return bad("file required");
      const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
      if (files.length > MAX_FILES_PER_REQUEST) return bad(`too many files in one upload (${files.length}). Please upload ${MAX_FILES_PER_REQUEST} at a time.`);
      if (totalBytes > MAX_TOTAL_UPLOAD_BYTES) return bad(`upload batch too large (${Math.round(totalBytes / (1024 * 1024))}MB). Keep each batch under ${Math.round(MAX_TOTAL_UPLOAD_BYTES / (1024 * 1024))}MB.`);
      const mood = String(fd.get("mood") || "focus");
      const providedTitles = Array.from(fd.getAll("title")).map((value) => String(value));
      const rows = [] as any[];
      for (let index = 0; index < files.length; index++) {
        const file = files[index];
        const title = (providedTitles[index] || providedTitles[0] || file.name.replace(/\.[^.]+$/, "")).trim();
        const buf = Buffer.from(await file.arrayBuffer());
        if (!buf || buf.length < 10000) return bad(`file too small or empty: ${file.name}`);
        const safe = title.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "track";
        const outFile = `${Date.now()}_${index}_${safe}.mp3`;
        const localPath = path.join(UPLOADS_MUSIC_DIR, outFile);
        fs.writeFileSync(localPath, buf);
        const filePath = await uploadFile(localPath, `music/${outFile}`, "audio/mpeg");
        const [row] = await db.insert(musicTracks).values({ title, mood, filePath, source: "upload", attribution: null }).returning();
        rows.push(row);
      }
      return Response.json(rows.length === 1 ? rows[0] : rows);
    }

    const b = await req.json().catch(() => ({}));
    if (!b.url) return bad("url required");
    let sourceUrl: URL;
    try { sourceUrl = new URL(String(b.url)); } catch { return bad("enter a valid direct audio URL"); }
    const res = await fetch(sourceUrl, { headers: { "User-Agent": "Mozilla/5.0" } });
    if (!res.ok) return bad(`download failed: ${res.status}`);
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("audio/") && !/\.(mp3|wav|ogg|m4a)(?:$|\?)/i.test(sourceUrl.pathname)) return bad("that URL is not a direct audio file; download the Pixabay track and upload the file instead");
    const buf = Buffer.from(await res.arrayBuffer());
    if (!buf || buf.length < 10000) return bad("file too small or empty");
    const title = String(b.title || decodeURIComponent(path.basename(sourceUrl.pathname)).replace(/\.[^.]+$/, ""));
    const mood = String(b.mood || "focus");
    const safe = title.replace(/[^a-z0-9_-]+/gi, "_").slice(0, 60) || "track";
    const file = `${Date.now()}_${safe}.mp3`;
    const localPath = path.join(UPLOADS_MUSIC_DIR, file);
    fs.writeFileSync(localPath, buf);
    const filePath = await uploadFile(localPath, `music/${file}`, "audio/mpeg");
    const [row] = await db.insert(musicTracks).values({ title, mood, filePath, source: "url", attribution: String(b.attribution || sourceUrl.toString()) }).returning();
    return Response.json(row);
  } catch (error) {
    return bad(error instanceof Error ? error.message : "music upload failed", 500);
  }
}
