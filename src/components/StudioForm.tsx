"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, MOODS, STUDIO_VOICES, VOICES } from "@/lib/video/core";
import { generateComposition } from "@/lib/video/generate";
import Player from "./Player";
import { fmtDur } from "@/lib/format";
import { Reveal } from "./Anim";

export default function StudioForm({ channels }: { channels: { id: number; title: string }[] }) {
  const router = useRouter();
  const [category, setCategory] = useState("eye_training");
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [voice, setVoice] = useState("random");
  const [mood, setMood] = useState("auto");
  const [count, setCount] = useState(1);
  const [channelId, setChannelId] = useState<string>("");
  const [mode, setMode] = useState<"review" | "auto">("review");
  const [when, setWhen] = useState("");
  const [seed, setSeed] = useState(() => Math.random().toString(36).slice(2, 9));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [studioAvailable, setStudioAvailable] = useState(false);
  const [previewing, setPreviewing] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/voices").then((res) => res.json()).then((body) => setStudioAvailable(body.available === true)).catch(() => setStudioAvailable(false));
  }, []);

  const preview = async (voiceId: string) => {
    setPreviewing(voiceId); setErr(null);
    try {
      const res = await fetch(`/api/sample/${voiceId}`);
      if (!res.ok) throw new Error("VoxLab Studio API is temporarily unavailable");
      const url = URL.createObjectURL(await res.blob());
      const audio = new Audio(url);
      audio.onended = () => { URL.revokeObjectURL(url); setPreviewing(null); };
      await audio.play();
    } catch (error) { setErr((error as Error).message); setPreviewing(null); }
  };

  const comp = useMemo(() => generateComposition({ category, orientation, seed, voice, mood }), [category, orientation, seed, voice, mood]);
  const reroll = () => setSeed(Math.random().toString(36).slice(2, 9));

  const submit = async () => {
    setBusy(true); setErr(null);
    try {
      const res = await fetch("/api/videos", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ category, orientation, voice, mood, count, seed: count === 1 ? seed : undefined, channelId: channelId || null, mode, scheduledFor: when ? new Date(when).toISOString() : null }) });
      const j = await res.json();
      if (!res.ok) throw new Error(j.error || "failed");
      router.push(Array.isArray(j) ? "/videos" : `/videos/${j.id}`);
    } catch (e) { setErr((e as Error).message); setBusy(false); }
  };

  return (
    <>
      <Reveal delay={150} className="col-span-12 md:col-start-5 md:col-span-8 mt-6 md:mt-24 z-10">
        <div className="flex flex-wrap gap-2 mb-4">
          {CATEGORIES.map((c) => <button key={c.id} onClick={() => setCategory(c.id)} className={`chip text-base ${category === c.id ? "on" : ""}`}>{c.label}</button>)}
        </div>
        <div className="t-serif t-italic text-xl mb-4 ml-8 max-w-lg">{CATEGORIES.find((c) => c.id === category)?.blurb}</div>
        <Player comp={comp} className={orientation === "portrait" ? "max-w-[340px] ml-auto mr-12" : ""} />
        <div className="mt-4 flex flex-wrap items-baseline gap-x-6 gap-y-1 t-vt">
          <span className="text-magenta">seed {seed}</span>
          <span>{fmtDur(comp.duration)} · {comp.scenes.length} scenes</span>
          <span>{comp.theme.fontDisplay} / {comp.theme.fontBody}</span>
          <span>voice {comp.voice.name.replace("Neural", "").replace("en-", "")}</span>
          <span>music: {comp.music.mood}</span>
          <button onClick={reroll} className="chip">↻ reroll everything</button>
        </div>
        <div className="mt-3 t-serif text-lg"><span className="t-vt text-oxblood">title</span> {comp.meta.title}</div>
      </Reveal>

      <Reveal delay={350} from="up" className="col-span-12 md:col-start-2 md:col-span-4 mt-14 z-10">
        <div className="block-ink p-5 tilt-r">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="lbl text-acid">format</label>
              <div className="flex gap-1">
                <button className={`chip text-bone ${orientation === "landscape" ? "on" : ""}`} onClick={() => setOrientation("landscape")}>16:9 episode</button>
                <button className={`chip text-bone ${orientation === "portrait" ? "on" : ""}`} onClick={() => setOrientation("portrait")}>9:16 reel (up to 3 min)</button>
              </div>
            </div>
            <div>
              <label className="lbl text-acid">how many</label>
              <input type="number" min={1} max={10} value={count} onChange={(e) => setCount(Number(e.target.value))} className="field text-bone border-bone" />
            </div>
            <div>
              <label className="lbl text-acid">voice</label>
              <select value={voice} onChange={(e) => setVoice(e.target.value)} className="field text-bone border-bone bg-ink">
                <option value="random">random each time</option>
                {STUDIO_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label} · Studio</option>)}
                {VOICES.map((v) => <option key={v} value={v}>{v.replace("Neural", "")}</option>)}
              </select>
              <div className="t-vt mt-2">Studio API: {studioAvailable ? "available" : "temporarily unavailable"}</div>
              <div className="flex flex-wrap gap-1 mt-2">
                {STUDIO_VOICES.map((v) => <button key={v.id} type="button" onClick={() => preview(v.id)} disabled={!studioAvailable || previewing !== null} className="chip">{previewing === v.id ? "playing…" : `preview ${v.label}`}</button>)}
              </div>
            </div>
            <div>
              <label className="lbl text-acid">music mood</label>
              <select value={mood} onChange={(e) => setMood(e.target.value)} className="field text-bone border-bone bg-ink">
                <option value="auto">auto (fits category)</option>
                {MOODS.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
          </div>
        </div>
      </Reveal>

      <Reveal delay={500} from="right" className="col-span-12 md:col-start-7 md:col-span-5 mt-6 md:-mt-10 z-10">
        <div className="block-hot p-5 tilt-l">
          <div className="h-bungee text-2xl mb-3">Where does it go?</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="lbl">channel</label>
              <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="field bg-transparent">
                <option value="">— just generate, decide later —</option>
                {channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              {!channels.length && <div className="t-vt mt-1">no channels connected yet</div>}
            </div>
            <div>
              <label className="lbl">after render</label>
              <div className="flex gap-1">
                <button className={`chip ${mode === "review" ? "on" : ""}`} onClick={() => setMode("review")}>I review first</button>
                <button className={`chip ${mode === "auto" ? "on" : ""}`} onClick={() => setMode("auto")} disabled={!channelId}>post automatically</button>
              </div>
            </div>
            <div className="sm:col-span-2">
              <label className="lbl">schedule for (optional, local time)</label>
              <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="field bg-transparent" />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-4 flex-wrap">
            <button onClick={submit} disabled={busy} className="btn text-2xl">{busy ? "queuing…" : count > 1 ? `Generate ${count} videos` : "Generate & render"}</button>
            {err && <span className="t-vt text-oxblood">{err}</span>}
          </div>
        </div>
      </Reveal>
    </>
  );
}
