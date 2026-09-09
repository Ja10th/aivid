"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MOODS } from "@/lib/video/core";
import { Reveal, StaggerList } from "./Anim";

interface T { id: number; title: string; mood: string; filePath: string; source: string; attribution: string | null }

const MAX_FILES_PER_BATCH = 2;
const MAX_BATCH_BYTES = 8 * 1024 * 1024;
const MAX_SINGLE_FILE_BYTES = 4 * 1024 * 1024;

export default function MusicPanel({ tracks }: { tracks: T[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState("all");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("focus");
  const [files, setFiles] = useState<File[]>([]);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const shown = tracks.filter((t) => filter === "all" || t.mood === filter);

  const handleFiles = (nextFiles: FileList | File[] | null) => {
    const selected = Array.from(nextFiles ?? []).filter((file) => file.type.startsWith("audio/") || /\.(mp3|wav|ogg|m4a|aac|flac)$/i.test(file.name));
    const valid = selected.filter((file) => file.size <= MAX_SINGLE_FILE_BYTES);
    const rejected = selected.filter((file) => file.size > MAX_SINGLE_FILE_BYTES);
    setFiles(valid);
    if (rejected.length) setMsg(`Skipped ${rejected.length} file${rejected.length > 1 ? "s" : ""}: max file size is 4MB for this hosting.`);
    else if (valid.length) setMsg(null);
  };

  const add = async () => {
    setBusy(true); setMsg(null);
    try {
      if (!files.length && !url) throw new Error("choose a music file or direct URL");
      const uploaded: string[] = [];

      if (files.length) {
        for (const file of files) {
          if (file.size > MAX_SINGLE_FILE_BYTES) throw new Error(`file too large: ${file.name} exceeds 4MB`);
          const presign = await fetch("/api/music/presign");
          const presignData = await presign.json();
          if (!presign.ok || !presignData.enabled) throw new Error("Cloudinary is not configured for direct uploads");

          const form = new FormData();
          form.append("file", file);
          form.append("api_key", presignData.apiKey);
          form.append("timestamp", String(presignData.timestamp));
          form.append("signature", presignData.signature);
          form.append("folder", presignData.folder);

          const uploadRes = await fetch(`https://api.cloudinary.com/v1_1/${presignData.cloudName}/auto/upload`, { method: "POST", body: form });
          const uploadJson = await uploadRes.json().catch(() => ({}));
          if (!uploadRes.ok) throw new Error(uploadJson.error?.message || "direct upload failed");

          const storedTitle = (title || file.name.replace(/\.[^.]+$/, "")).trim() || "track";
          const r = await fetch("/api/music", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: uploadJson.secure_url, title: storedTitle, mood, attribution: uploadJson.secure_url }),
          });
          const text = await r.text();
          let j: any = {};
          try { j = text ? JSON.parse(text) : {}; } catch { throw new Error(text || `request failed with status ${r.status}`); }
          if (!r.ok) throw new Error(j.error || "failed");
          uploaded.push(j.title || storedTitle);
        }
      } else {
        const r = await fetch("/api/music", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ url, title, mood }) });
        const text = await r.text();
        let j: any = {};
        try { j = text ? JSON.parse(text) : {}; } catch { throw new Error(text || `request failed with status ${r.status}`); }
        if (!r.ok) throw new Error(j.error || "failed");
        uploaded.push(j.title);
      }

      setMsg(`added ${uploaded.join(", ")}`);
      setUrl(""); setTitle(""); setFiles([]); router.refresh();
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
          <div
            onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => { e.preventDefault(); setDragging(false); handleFiles(e.dataTransfer.files); }}
            className={`border-2 border-dashed rounded-xl p-4 text-center transition ${dragging ? "border-acid bg-acid/10" : "border-bone/30 bg-ink/30"}`}
          >
            <div className="t-vt text-acid">drag & drop audio files here</div>
            <div className="t-serif mt-2 text-sm opacity-80">or pick a batch from your computer</div>
            <input type="file" accept="audio/*" multiple onChange={(e) => handleFiles(e.target.files)} className="mt-3 block w-full text-sm text-bone file:mr-3 file:rounded file:border-0 file:bg-acid file:px-3 file:py-2 file:text-ink" />
          </div>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div><label className="lbl">title</label><input value={title} onChange={(e) => setTitle(e.target.value)} className="field bg-transparent" placeholder={files.length > 1 ? "optional for batch" : "optional"} /></div>
            <div><label className="lbl">mood</label><select value={mood} onChange={(e) => setMood(e.target.value)} className="field bg-transparent">{MOODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></div>
          </div>
          <div className="t-vt mt-2 text-oxblood">{files.length > 0 ? `${files.length} file${files.length > 1 ? "s" : ""} selected — same mood applied to the batch` : "No files selected"}</div>
          <button onClick={add} disabled={busy || (!url && !files.length)} className="btn mt-4">{busy ? "adding…" : files.length > 1 ? `Add ${files.length} tracks` : "Add to library"}</button>
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
