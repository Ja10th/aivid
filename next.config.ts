import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@napi-rs/canvas", "ffmpeg-static", "msedge-tts", "puppeteer"],
  outputFileTracingExcludes: { "*": ["./public/music/**", "./data/**"] },
};

export default nextConfig;
