import fs from "node:fs";
import path from "node:path";
import { NextRequest } from "next/server";
import { getObject } from "@/lib/server/storage";

export const dynamic = "force-dynamic";

const ROOT = process.cwd();
const ALLOWED = [path.join(ROOT, "data"), path.join(ROOT, "public", "music")];

export async function GET(req: NextRequest) {
  const f = req.nextUrl.searchParams.get("f");
  if (!f) return new Response("missing", { status: 400 });
  if (f.startsWith("https://res.cloudinary.com/")) return Response.redirect(f, 307);
  if (f.startsWith("s3:")) {
    const object = await getObject(f);
    if (!object) return new Response("not found", { status: 404 });
    const headers = new Headers({ "Content-Type": object.contentType, "Cache-Control": "public, max-age=31536000, immutable" });
    if (object.length) headers.set("Content-Length", String(object.length));
    const download = req.nextUrl.searchParams.get("dl");
    if (download) headers.set("Content-Disposition", `attachment; filename="${download}"`);
    return new Response(object.body as unknown as ReadableStream, { headers });
  }
  const abs = path.resolve(ROOT, f);
  if (!ALLOWED.some((a) => abs.startsWith(a)) || !fs.existsSync(abs)) return new Response("not found", { status: 404 });
  const stat = fs.statSync(abs);
  const ext = path.extname(abs).toLowerCase();
  const type = ext === ".mp4" ? "video/mp4" : ext === ".png" ? "image/png" : ext === ".jpg" ? "image/jpeg" : ext === ".mp3" ? "audio/mpeg" : "application/octet-stream";
  const range = req.headers.get("range");
  const download = req.nextUrl.searchParams.get("dl");
  const common: Record<string, string> = { "Content-Type": type, "Accept-Ranges": "bytes", "Cache-Control": "private, max-age=3600" };
  if (download) common["Content-Disposition"] = `attachment; filename="${download}"`;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    let start = m && m[1] ? parseInt(m[1]) : 0;
    let end = m && m[2] ? parseInt(m[2]) : stat.size - 1;
    if (isNaN(start)) start = 0;
    if (isNaN(end) || end >= stat.size) end = stat.size - 1;
    const stream = fs.createReadStream(abs, { start, end });
    return new Response(stream as unknown as ReadableStream, { status: 206, headers: { ...common, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": String(end - start + 1) } });
  }
  const stream = fs.createReadStream(abs);
  return new Response(stream as unknown as ReadableStream, { status: 200, headers: { ...common, "Content-Length": String(stat.size) } });
}
