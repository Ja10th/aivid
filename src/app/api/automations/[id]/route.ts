import { NextRequest } from "next/server";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
type P = { params: Promise<{ id: string }> };
export async function PATCH(req: NextRequest, { params }: P) {
  const { id } = await params;
  const b = await req.json().catch(() => ({}));
  const set: Partial<typeof automations.$inferInsert> = {};
  if ("enabled" in b) set.enabled = Boolean(b.enabled);
  if ("name" in b) set.name = String(b.name).slice(0, 80);
  if ("perDay" in b) set.perDay = Math.min(12, Math.max(1, Number(b.perDay)));
  if ("mode" in b) set.mode = b.mode === "auto" ? "auto" : "review";
  if ("categories" in b) set.categories = b.categories.map(String);
  if ("channelIds" in b) set.channelIds = b.channelIds.map(Number);
  if ("postTimes" in b) set.postTimes = b.postTimes.map(String);
  if ("orientation" in b) set.orientation = b.orientation;
  if ("voice" in b) set.voice = b.voice;
  if ("fallbackVoice" in b) set.fallbackVoice = b.fallbackVoice;
  if ("musicMood" in b) set.musicMood = b.musicMood;
  const [a] = await db.update(automations).set(set).where(eq(automations.id, Number(id))).returning();
  return Response.json(a);
}
export async function DELETE(_: NextRequest, { params }: P) {
  const { id } = await params;
  await db.delete(automations).where(eq(automations.id, Number(id)));
  return Response.json({ ok: true });
}
