import { NextRequest } from "next/server";
import { bad } from "@/lib/server/http";
import { processQueuedOnce, tick, workerStatus } from "@/lib/server/engine";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 300;

export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (secret && req.headers.get("authorization") !== `Bearer ${secret}`) return bad("unauthorized", 401);
  await tick();
  const processed = await processQueuedOnce();
  return Response.json({ ok: true, processed, ...workerStatus() });
}
