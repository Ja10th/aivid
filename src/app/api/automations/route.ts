import { NextRequest } from "next/server";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { desc } from "drizzle-orm";
import { bad } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(await db.select().from(automations).orderBy(desc(automations.createdAt)));
}
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (!b.name) return bad("name required");
  const [a] = await db.insert(automations).values({
    name: String(b.name).slice(0, 80),
    categories: Array.isArray(b.categories) ? b.categories.map(String) : [],
    channelIds: Array.isArray(b.channelIds) ? b.channelIds.map(Number) : [],
    perDay: Math.min(12, Math.max(1, Number(b.perDay || 1))),
    mode: b.mode === "auto" ? "auto" : "review",
    postTimes: Array.isArray(b.postTimes) ? b.postTimes.map(String).filter((t: string) => /^\d{2}:\d{2}$/.test(t)) : [],
    orientation: ["landscape", "portrait", "mixed"].includes(b.orientation) ? b.orientation : "landscape",
    voice: b.voice || "random",
    fallbackVoice: b.fallbackVoice || "en-CA-Liam",
    musicMood: b.musicMood || "auto",
    enabled: b.enabled !== false,
  }).returning();
  return Response.json(a);
}
