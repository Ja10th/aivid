import { startStudioKeepAlive, stopStudioKeepAlive } from "@/lib/server/studio-api";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs" && !process.env.VERCEL) {
    const { startScheduler } = await import("@/lib/server/engine");
    startScheduler();
    startStudioKeepAlive();
    process.once("SIGTERM", stopStudioKeepAlive);
    process.once("SIGINT", stopStudioKeepAlive);
    process.once("exit", stopStudioKeepAlive);
  }
}
