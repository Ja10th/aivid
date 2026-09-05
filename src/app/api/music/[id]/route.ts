import { NextRequest } from "next/server";
import fs from "node:fs";
import { db } from "@/db";
import { musicTracks } from "@/db/schema";
import { eq } from "drizzle-orm";
import { musicAbsPath } from "@/lib/server/engine";
import { deleteFile } from "@/lib/server/storage";
export const dynamic = "force-dynamic";
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t] = await db.select().from(musicTracks).where(eq(musicTracks.id, Number(id)));
  if (t && t.source !== "incompetech") await deleteFile(t.filePath.startsWith("s3:") ? t.filePath : musicAbsPath(t.filePath));
  await db.delete(musicTracks).where(eq(musicTracks.id, Number(id)));
  return Response.json({ ok: true });
}
