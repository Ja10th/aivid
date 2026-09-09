import { config } from "dotenv";
import http from "http";

config({ path: ".env.local" });
config();
const intervalMs = Number(process.env.WORKER_INTERVAL_MS || 5000);
const once = process.env.WORKER_ONCE === "true";
const port = Number(process.env.PORT || 10000);

// Health check endpoint for Render
const server = http.createServer(async (req, res) => {
  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  
  if (req.method === "OPTIONS") {
    res.writeHead(200);
    res.end();
    return;
  }
  
  if (req.url === "/health" || req.url === "/") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok", worker: "running" }));
  } else if (req.url === "/render-thumbnail" && req.method === "POST") {
    // Endpoint for Vercel to request thumbnail rendering
    let body = "";
    req.on("data", chunk => body += chunk);
    req.on("end", async () => {
      try {
        const { videoId, composition, style, outputKey } = JSON.parse(body);
        const { renderThumbnail } = await import("@/lib/server/render");
        const { uploadFile } = await import("@/lib/server/storage");
        
        const localPath = await renderThumbnail(videoId, composition, style, outputKey);
        const cloudPath = await uploadFile(localPath, `thumbs/${outputKey}.png`, "image/png");
        
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: true, path: cloudPath }));
      } catch (error) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ success: false, error: (error as Error).message }));
      }
    });
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