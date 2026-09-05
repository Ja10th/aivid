import { queueStats, workerStatus, startScheduler } from "@/lib/server/engine";
export const dynamic = "force-dynamic";
export async function GET() {
  startScheduler();
  return Response.json({ worker: workerStatus(), queue: await queueStats() });
}
