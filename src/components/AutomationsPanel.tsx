"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES, MOODS, STUDIO_VOICES, VOICES } from "@/lib/video/core";
import { Reveal, StaggerList } from "./Anim";

interface A { id: number; name: string; categories: string[]; channelIds: number[]; perDay: number; mode: string; postTimes: string[]; orientation: string; voice: string; fallbackVoice: string; musicMood: string; enabled: boolean; lastPlannedDate: string | null; createdAt: string }

export default function AutomationsPanel({ autos, channels }: { autos: A[]; channels: { id: number; title: string }[] }) {
  const router = useRouter();
  const [name, setName] = useState("Daily eye + brain");
  const [cats, setCats] = useState<string[]>(["eye_training", "brain"]);
  const [chIds, setChIds] = useState<number[]>(channels.slice(0, 1).map((c) => c.id));
  const [perDay, setPerDay] = useState(2);
  const [mode, setMode] = useState<"review" | "auto">("review");
  const [times, setTimes] = useState("09:00, 18:00");
  const [orientation, setOrientation] = useState("landscape");
  const [voice, setVoice] = useState("random");
  const [fallbackVoice, setFallbackVoice] = useState("en-CA-Liam");
  const [mood, setMood] = useState("auto");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const toggle = <T,>(arr: T[], v: T) => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);
  const updateVoice = async (id: number, field: "voice" | "fallbackVoice", value: string) => {
    setBusy(`voice${id}`); setMsg(null);
    const response = await fetch(`/api/automations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ [field]: value }) });
    if (!response.ok) setMsg("Could not update automation voice");
    setBusy(null); router.refresh();
  };

  const create = async () => {
    setBusy("create"); setMsg(null);
    const r = await fetch("/api/automations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, categories: cats, channelIds: chIds, perDay, mode, postTimes: times.split(",").map((t) => t.trim()).filter(Boolean), orientation, voice, fallbackVoice, musicMood: mood }) });
    const j = await r.json(); setBusy(null);
    if (!r.ok) return setMsg(j.error || "failed");
    setMsg("created — it will plan today's batch within a minute, or hit ▶ run now"); router.refresh();
  };
  const act = async (id: number, what: "toggle" | "run" | "delete", enabled?: boolean) => {
    setBusy(`${what}${id}`); setMsg(null);
    if (what === "delete") { if (!confirm("Delete automation?")) { setBusy(null); return; } await fetch(`/api/automations/${id}`, { method: "DELETE" }); }
    else if (what === "toggle") await fetch(`/api/automations/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ enabled: !enabled }) });
    else { const r = await fetch(`/api/automations/${id}/run`, { method: "POST" }); const j = await r.json(); setMsg(`queued ${j.created} video(s) for today`); }
    setBusy(null); router.refresh();
  };

  return (
    <>
      <Reveal delay={200} from="left" className="col-span-12 md:col-start-1 md:col-span-5 mt-10 md:-mt-10 z-10">
        <div className="block-ink p-6 tilt-l">
          <div className="h-bungee text-2xl text-acid mb-4">New automation</div>
          <label className="lbl text-acid">name</label>
          <input value={name} onChange={(e) => setName(e.target.value)} className="field text-bone border-bone" />
          <label className="lbl text-acid mt-4">content engines (random pick per video)</label>
          <div className="flex flex-wrap gap-1">{CATEGORIES.map((c) => <button key={c.id} onClick={() => setCats(toggle(cats, c.id))} className={`chip text-bone ${cats.includes(c.id) ? "on" : ""}`}>{c.label}</button>)}</div>
          <label className="lbl text-acid mt-4">channels (round-robin)</label>
          <div className="flex flex-wrap gap-1">
            {channels.map((c) => <button key={c.id} onClick={() => setChIds(toggle(chIds, c.id))} className={`chip text-bone ${chIds.includes(c.id) ? "on" : ""}`}>{c.title}</button>)}
            {!channels.length && <span className="t-vt text-magenta">no channels connected — videos will be generated for review only</span>}
          </div>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div><label className="lbl text-acid">videos per day</label><input type="number" min={1} max={12} value={perDay} onChange={(e) => setPerDay(Number(e.target.value))} className="field text-bone border-bone" /></div>
            <div><label className="lbl text-acid">post times (HH:MM, local)</label><input value={times} onChange={(e) => setTimes(e.target.value)} className="field text-bone border-bone" /></div>
            <div><label className="lbl text-acid">format</label>
              <select value={orientation} onChange={(e) => setOrientation(e.target.value)} className="field text-bone border-bone bg-ink"><option value="landscape">16:9 episodes (4+ min)</option><option value="portrait">9:16 shorts</option><option value="mixed">mixed</option></select></div>
            <div><label className="lbl text-acid">after render</label>
              <div className="flex gap-1"><button className={`chip text-bone ${mode === "review" ? "on" : ""}`} onClick={() => setMode("review")}>review</button><button className={`chip text-bone ${mode === "auto" ? "on" : ""}`} onClick={() => setMode("auto")}>auto-post</button></div></div>
            <div><label className="lbl text-acid">voice</label><select value={voice} onChange={(e) => setVoice(e.target.value)} className="field text-bone border-bone bg-ink"><option value="random">random</option>{STUDIO_VOICES.map((v) => <option key={v.id} value={v.id}>{v.label} · Studio</option>)}{VOICES.map((v) => <option key={v} value={v}>{v.replace("Neural", "")}</option>)}</select></div>
            <div><label className="lbl text-acid">Studio fallback</label><select value={fallbackVoice} onChange={(e) => setFallbackVoice(e.target.value)} className="field text-bone border-bone bg-ink">{VOICES.map((v) => <option key={v} value={v}>{v.replace("Neural", "")}</option>)}</select></div>
            <div><label className="lbl text-acid">music</label><select value={mood} onChange={(e) => setMood(e.target.value)} className="field text-bone border-bone bg-ink"><option value="auto">auto</option>{MOODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <button onClick={create} disabled={busy === "create" || !cats.length} className="btn btn-hot mt-6 text-xl">Create automation</button>
          {msg && <div className="t-vt text-acid mt-3">{msg}</div>}
        </div>
      </Reveal>

      <section className="col-span-12 md:col-start-7 md:col-span-6 mt-16 z-10">
        <div className="h-display text-3xl mb-6 ml-16">Running<br />now</div>
        {!autos.length && <div className="t-serif t-italic text-2xl ml-16">None yet. The factory is idle.</div>}
        <StaggerList className="flex flex-col gap-6">
          {autos.map((a, i) => (
            <div key={a.id} className={`p-5 border-[3px] border-ink ${a.enabled ? "bg-bone" : "opacity-50"} ${i % 2 ? "tilt-r ml-10" : "tilt-l"}`} style={{ boxShadow: `8px 8px 0 ${a.enabled ? "var(--magenta)" : "#999"}` }}>
              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="h-bungee text-2xl">{a.name}</div>
                  <div className="t-vt text-oxblood">{a.perDay}/day · {a.mode === "auto" ? "auto-post" : "review first"} · {a.orientation} · at {a.postTimes.join(", ") || "spread"}</div>
                  <div className="t-vt mt-1">{a.categories.map((c) => CATEGORIES.find((x) => x.id === c)?.label ?? c).join(" / ")}</div>
                  <div className="t-vt opacity-70">→ {a.channelIds.map((id) => channels.find((c) => c.id === id)?.title ?? `#${id}`).join(", ") || "no channel (review only)"} · last planned {a.lastPlannedDate ?? "never"}</div>
                  <select value={a.voice} onChange={(event) => updateVoice(a.id, "voice", event.target.value)} disabled={busy === `voice${a.id}`} className="field mt-3 border-ink bg-transparent">
                    <option value="random">random voice</option>
                    {STUDIO_VOICES.map((voiceOption) => <option key={voiceOption.id} value={voiceOption.id}>{voiceOption.label} · Studio</option>)}
                    {VOICES.map((voiceOption) => <option key={voiceOption} value={voiceOption}>{voiceOption.replace("Neural", "")}</option>)}
                  </select>
                  <select value={a.fallbackVoice || "en-CA-Liam"} onChange={(event) => updateVoice(a.id, "fallbackVoice", event.target.value)} disabled={busy === `voice${a.id}`} className="field border-ink bg-transparent">
                    {VOICES.map((voiceOption) => <option key={voiceOption} value={voiceOption}>fallback · {voiceOption.replace("Neural", "")}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <button onClick={() => act(a.id, "toggle", a.enabled)} className="chip">{a.enabled ? "pause" : "resume"}</button>
                  <button onClick={() => act(a.id, "run")} disabled={busy === `run${a.id}`} className="chip on">▶ run today now</button>
                  <button onClick={() => act(a.id, "delete")} className="chip text-oxblood">delete</button>
                </div>
              </div>
            </div>
          ))}
        </StaggerList>
      </section>
    </>
  );
}
