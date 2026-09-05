import { NextRequest } from "next/server";
import { db } from "@/db";
import { channels } from "@/db/schema";
import { eq } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await db.delete(channels).where(eq(channels.id, Number(id)));
  return Response.json({ ok: true });
}
