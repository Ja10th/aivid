"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOODS } from "@/lib/video/core";
import { Reveal, StaggerList } from "./Anim";

interface T { id: number; title: string; mood: string; filePath: string; source: string; attribution: string | null }

export default function MusicPanel({ tracks }: { tracks: T[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("focus");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const shown = tracks.filter((t) => filter === "all" || t.mood === filter);

  const add = async () => {
    setBusy(true); setMsg(null);
    try {
      let r: Response;
      if (file) { const fd = new FormData(); fd.append("file", file); fd.append("title", title || file.name); fd.append("mood", mood); r = await fetch("/api/music", { method: "POST", body: fd }); }
      else r = await fetch("/api/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, title, mood }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error || "failed");
      setMsg(`added ${j.title}`); setUrl(""); setTitle(""); setFile(null); router.refresh();
    } catch (e) { setMsg((e as Error).message); } finally { setBusy(false); }
  };
  const del = async (id: number) => { await fetch(`/api/music/${id}`, { method: "DELETE" }); router.refresh(); };

  return (
    <>
      <Reveal delay={200} from="right" className="col-span-12 md:col-start-8 md:col-span-5 mt-4 z-10">
        <div className="block-hot p-5 tilt-l">
          <div className="h-bungee text-2xl mb-3">Add a track</div>
          <label className="lbl">direct audio URL (or upload a downloaded Pixabay file)</label>
          <input value={url} onChange={(e) => setUrl(e.target.value)} className="field bg-transparent" placeholder="https://…/track.mp3" />
          <div className="t-vt my-2 text-center">— or —</div>
          <input type="file" accept="audio/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="t-vt" />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className="lbl">title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="field bg-transparent" /></div>
            <div><label className="lbl">mood</label><select value={mood} onChange={(e) => setMood(e.target.value)} className="field bg-transparent">{MOODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <button onClick={add} disabled={busy || (!url && !file)} className="btn mt-4">{busy ? "adding…" : "Add to library"}</button>
          {msg && <div className="t-vt mt-2">{msg}</div>}
        </div>
      </Reveal>
      <section className="col-span-12 md:col-start-1 md:col-span-7 mt-12 z-10">
        <div className="flex flex-wrap gap-2 mb-6 ml-2">
          <button onClick={() => setFilter("all")} className={`chip ${filter === "all" ? "on" : ""}`}>all {tracks.length}</button>
          {MOODS.map((m) => <button key={m} onClick={() => setFilter(m)} className={`chip ${filter === m ? "on" : ""}`}>{m} {tracks.filter((t) => t.mood === m).length}</button>)}
        </div>
        <StaggerList className="flex flex-col">
          {!shown.length && (
            <div className="block-ox p-6 max-w-xl">
              <div className="h-bungee text-2xl mb-2">No tracks yet.</div>
              <p className="t-serif text-xl">Download an audio file from Pixabay, then use the upload control above. A Pixabay track page URL is not an audio file URL, so upload the downloaded file instead.</p>
            </div>
          )}
          {shown.map((t, i) => (
            <div key={t.id} className="flex flex-wrap items-center gap-3 py-2 border-b-2 border-ink" style={{ marginLeft: `${(i % 5) * 14}px` }}>
              <span className="t-vt text-magenta w-20">{t.mood}</span>
              <span className="t-serif text-xl flex-1 min-w-[160px]">{t.title}</span>
              <audio controls preload="none" src={`/api/media?f=${encodeURIComponent(t.filePath)}`} className="h-8 w-56" />
              {t.source !== "incompetech" && <button onClick={() => del(t.id)} className="chip text-oxblood">remove</button>}
            </div>
          ))}
        </StaggerList>
        <div className="t-vt opacity-60 mt-6">Kevin MacLeod tracks are CC BY 4.0 — attribution is auto-appended to every video description.</div>
      </section>
    </>
  );
}
