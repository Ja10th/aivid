import { config } from "dotenv";
import http from "http";

config({ path: ".env.local" });
config();
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 5000);
const once = process.env.WORKER_ONCE === "true";
const port = Number(process.env.PORT || 10000);

// Health check endpoint for Render
const server = http.createServer((req, res) => {
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", worker: "running" }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(port, () => {
  console.log(`Health check server listening on port ${port}`);
});

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