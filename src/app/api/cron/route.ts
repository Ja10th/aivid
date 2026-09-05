import { tick, workerStatus } from "@/lib/server/engine";
export const dynamic = "force-dynamic";
export async function GET() {
  await tick();
  return Response.json({ ok: true, ...workerStatus() });
}
