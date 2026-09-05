import { config } from "dotenv";

config({ path: ".env.local" });
config();
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 5000);
const once = process.env.WORKER_ONCE === "true";

async function run() {
  const { kickWorker, tick, workerStatus } = await import("@/lib/server/engine");
  console.log(`render worker online; polling every ${intervalMs}ms`);
  if (once) {
    await tick();
    while (workerStatus().running) await new Promise((resolve) => setTimeout(resolve, 1000));
    return;
  }
  for (;;) {
    try {
      await tick();
      while (workerStatus().running) await new Promise((resolve) => setTimeout(resolve, 1000));
      kickWorker();
    } catch (error) {
      console.error("worker tick failed", error);
    }
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }
}

run().catch((error) => { console.error(error); process.exitCode = 1; });