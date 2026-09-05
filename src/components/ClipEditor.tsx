"use client";

import { useState } from "react";
import type { Composition } from "@/lib/video/core";

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as { error?: string }; } catch {
    const title = /<title[^>]*>([^<]+)<\/title>/i.exec(text)?.[1]?.trim();
    throw new Error(title ? `${response.status}: ${title}` : `${response.status}: server returned an invalid response`);
  }
}

export default function ClipEditor({ videoId, composition }: { videoId: number; composition: Composition }) {
  const [draft, setDraft] = useState<Composition>(() => structuredClone(composition));
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const fmt = (seconds: number) => `${Math.floor(seconds / 60)}:${String(Math.floor(seconds % 60)).padStart(2, "0")}`;

  const updateScene = (index: number, narrationMuted: boolean) => {
    setDraft((current) => ({ ...current, scenes: current.scenes.map((scene, i) => i === index ? { ...scene, narrationMuted } : scene) }));
  };
  const removeScene = (index: number) => {
    setDraft((current) => ({ ...current, scenes: current.scenes.filter((_, i) => i !== index) }));
  };
  const save = async () => {
    setBusy(true); setMessage(null);
    try {
      const res = await fetch(`/api/videos/${videoId}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ composition: draft }) });
      const json = await readResponse(res);
      if (!res.ok) throw new Error(json.error || "Could not save clip edits");
      setMessage("clip edits saved; render queued");
      window.location.reload();
    } catch (error) { setMessage((error as Error).message); setBusy(false); }
  };

  return (
    <section className="col-span-12 md:col-start-2 md:col-span-10 mt-16 z-10">
      <div className="block-ink p-5">
        <div className="flex flex-wrap items-end justify-between gap-4 mb-5">
          <div><div className="h-bungee text-2xl">Edit the cut</div><div className="t-vt text-acid mt-1">Mute narration, remove a clip, or turn the music up before rendering.</div></div>
          <button onClick={save} disabled={busy || draft.scenes.length === 0} className="btn btn-hot">{busy ? "queuing…" : "Save & render"}</button>
        </div>
        <label className="lbl text-acid">music volume · {Math.round(draft.music.volume * 100)}%</label>
        <input type="range" min="0" max="1" step="0.01" value={draft.music.volume} onChange={(event) => setDraft((current) => ({ ...current, music: { ...current.music, volume: Number(event.target.value) } }))} className="w-full accent-[#c6ff00] mb-5" />
        <div className="flex flex-col gap-2">
          {draft.scenes.map((scene, index) => (
            <div key={scene.id} className="flex flex-wrap items-center gap-3 border-b border-bone/20 py-3">
              <button onClick={() => removeScene(index)} className="chip text-oxblood" title="Remove this clip">remove</button>
              <button onClick={() => updateScene(index, !scene.narrationMuted)} className={`chip ${scene.narration && !scene.narrationMuted ? "on" : ""}`} disabled={!scene.narration}>{scene.narration ? (scene.narrationMuted ? "voice off" : "voice on") : "no voice"}</button>
              <span className="t-vt w-24">{fmt(scene.start)} · {fmt(scene.duration)}</span>
              <span className="h-bungee text-lg">{scene.kind}</span>
              <span className="t-serif text-lg opacity-75 flex-1 min-w-[220px] truncate">{scene.narration || "visual-only clip"}</span>
            </div>
          ))}
        </div>
        {message && <div className="t-vt text-acid mt-4">{message}</div>}
      </div>
    </section>
  );
}