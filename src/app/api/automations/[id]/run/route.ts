import { NextRequest } from "next/server";
import { db } from "@/db";
import { automations } from "@/db/schema";
import { eq } from "drizzle-orm";
import { planAutomation } from "@/lib/server/engine";
import { bad } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function POST(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [a] = await db.select().from(automations).where(eq(automations.id, Number(id)));
  if (!a) return bad("not found", 404);
  const created = await planAutomation(a, true);
  return Response.json({ created });
}
