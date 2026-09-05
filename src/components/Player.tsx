"use client";
import { useEffect, useRef, useState } from "react";
import type { Composition } from "@/lib/video/core";
import { FONT_FILES } from "@/lib/video/core";
import { drawFrame, sceneAt } from "@/lib/video/draw";

async function loadFonts(comp: Composition) {
  if (typeof document === "undefined" || !("fonts" in document)) return;
  const fams = new Set<string>([comp.theme.fontDisplay, comp.theme.fontBody, comp.theme.fontMono]);
  await Promise.all([...fams].filter((f) => FONT_FILES[f]).map((f) => document.fonts.load(`40px "${f}"`).catch(() => null)));
}

export default function Player({ comp, videoUrl, className }: { comp: Composition; videoUrl?: string | null; className?: string }) {
  const [mode, setMode] = useState<"live" | "file">(() => videoUrl ? "file" : "live");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [playing, setPlaying] = useState(true);
  const [t, setT] = useState(0);
  const tRef = useRef(0);
  const playingRef = useRef(true);
  const cacheRef = useRef(new Map<string, unknown>());

  useEffect(() => { playingRef.current = playing; }, [playing]);

  useEffect(() => {
    if (mode !== "live") return;
    let raf = 0; let last = performance.now(); let alive = true;
    cacheRef.current = new Map();
    loadFonts(comp).then(() => {
      const loop = (now: number) => {
        if (!alive) return;
        const dt = Math.min(0.1, (now - last) / 1000); last = now;
        if (playingRef.current) { tRef.current += dt; if (tRef.current >= comp.duration) { tRef.current = 0; cacheRef.current = new Map(); } }
        const c = canvasRef.current;
        if (c) { const ctx = c.getContext("2d"); if (ctx) drawFrame(ctx, comp, tRef.current, cacheRef.current); }
        if (Math.floor(tRef.current * 4) !== Math.floor(t * 4)) setT(tRef.current);
        raf = requestAnimationFrame(loop);
      };
      raf = requestAnimationFrame(loop);
    });
    return () => { alive = false; cancelAnimationFrame(raf); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [comp, mode]);

  const seek = (nt: number) => { tRef.current = Math.max(0, Math.min(comp.duration - 0.05, nt)); cacheRef.current = new Map(); setT(tRef.current); };
  const idx = sceneAt(comp, t);
  const scene = comp.scenes[idx];
  const fmt = (s: number) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, "0")}`;
  const ratio = comp.orientation === "portrait" ? "9 / 16" : "16 / 9";

  return (
    <div className={className}>
      <div className="thumb-frame" style={{ aspectRatio: ratio, maxHeight: comp.orientation === "portrait" ? 640 : undefined, marginInline: comp.orientation === "portrait" ? 0 : undefined, width: comp.orientation === "portrait" ? "auto" : "100%" }}>
        {mode === "file" && videoUrl ? (
          <video src={videoUrl} controls playsInline style={{ width: "100%", height: "100%", background: "#000" }} />
        ) : (
          <canvas ref={canvasRef} width={comp.width} height={comp.height} style={{ width: "100%", height: "100%" }} onClick={() => setPlaying((p) => !p)} />
        )}
      </div>
      <div className="flex flex-wrap items-center gap-3 mt-3 t-vt">
        {videoUrl && (
          <div className="flex">
            <button className={`chip ${mode === "file" ? "on" : ""}`} onClick={() => setMode("file")}>Rendered MP4</button>
            <button className={`chip ${mode === "live" ? "on" : ""}`} onClick={() => setMode("live")}>Live engine</button>
          </div>
        )}
        {mode === "live" && (
          <>
            <button className="chip" onClick={() => setPlaying((p) => !p)}>{playing ? "pause" : "play"}</button>
            <input type="range" min={0} max={comp.duration} step={0.1} value={t} onChange={(e) => seek(Number(e.target.value))} className="flex-1 min-w-[140px] accent-[#ff2d95]" />
            <span>{fmt(t)} / {fmt(comp.duration)}</span>
            <span className="text-oxblood">scene {idx + 1}/{comp.scenes.length} · {scene?.kind}</span>
          </>
        )}
      </div>
      {mode === "live" && (
        <div className="flex gap-[2px] mt-2 h-3">
          {comp.scenes.map((s, i) => (
            <button key={s.id} title={`${s.kind} ${fmt(s.start)}`} onClick={() => seek(s.start)} style={{ flex: s.duration, background: i === idx ? "#ff2d95" : i < idx ? "#0b0b0f" : s.palette.accent, outline: "1px solid #0b0b0f" }} />
          ))}
        </div>
      )}
    </div>
  );
}
