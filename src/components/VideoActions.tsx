"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Reveal } from "./Anim";

interface V { id: number; title: string; description: string; tags: string[]; status: string; channelId: number | null; scheduledFor: string | null; videoUrl: string | null; mode: string }

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso); const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
}

async function readResponse(response: Response) {
  const text = await response.text();
  if (!text) return {};
  try { return JSON.parse(text) as Record<string, unknown>; } catch {
    const title = /<title[^>]*>([^<]+)<\/title>/i.exec(text)?.[1]?.trim();
    throw new Error(title ? `${response.status}: ${title}` : `${response.status}: server returned an invalid response`);
  }
}

export default function VideoActions({ video, channels }: { video: V; channels: { id: number; title: string }[] }) {
  const router = useRouter();
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description);
  const [tags, setTags] = useState(video.tags.join(", "));
  const [channelId, setChannelId] = useState(video.channelId ? String(video.channelId) : "");
  const [when, setWhen] = useState(toLocalInput(video.scheduledFor));
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const call = async (label: string, fn: () => Promise<Response>) => {
    setBusy(label); setMsg(null);
    try {
      const r = await fn(); const j = await readResponse(r);
      if (!r.ok) throw new Error(typeof j.error === "string" ? j.error : "failed");
      setMsg(`${label}: ok`); router.refresh();
      return j;
    } catch (e) { setMsg(`${label}: ${(e as Error).message}`); }
    finally { setBusy(null); }
  };
  const patch = (body: Record<string, unknown>) => fetch(`/api/videos/${video.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
  const save = () => call("save", () => patch({ title, description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), channelId: channelId || null, scheduledFor: when ? new Date(when).toISOString() : null }));
  const postNow = async () => { await save(); await call("post", () => fetch(`/api/videos/${video.id}/post`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ channelId: channelId || null }) })); };
  const schedule = async () => call("schedule", () => patch({ title, description, tags: tags.split(",").map((t) => t.trim()).filter(Boolean), channelId: channelId || null, scheduledFor: when ? new Date(when).toISOString() : null, action: "schedule" }));
  const unschedule = () => call("unschedule", () => patch({ action: "unschedule" }));
  const retry = () => call("retry", () => patch({ action: "retry" }));
  const regen = async () => { const j = await call("regenerate", () => fetch(`/api/videos/${video.id}/regenerate`, { method: "POST" })); if (j?.id) router.push(`/videos/${j.id}`); };
  const regenThumb = () => call("thumbnail", () => fetch(`/api/videos/${video.id}/thumbnail`, { method: "POST" }));
  const del = async () => { if (!confirm("Delete this video and its files?")) return; await call("delete", () => fetch(`/api/videos/${video.id}`, { method: "DELETE" })); router.push("/videos"); };

  const canPost = video.status === "ready" || video.status === "scheduled";
  return (
    <>
      <Reveal delay={300} className="col-span-12 md:col-start-2 md:col-span-6 mt-16 z-10">
        <div className="h-display text-3xl mb-4">What YouTube<br />will see</div>
        <label className="lbl">title ({title.length}/100)</label>
        <input value={title} onChange={(e) => setTitle(e.target.value.slice(0, 100))} className="field text-2xl" />
        <label className="lbl mt-5">description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={9} className="field" />
        <label className="lbl mt-5">tags (comma separated)</label>
        <input value={tags} onChange={(e) => setTags(e.target.value)} className="field" />
        <button onClick={save} disabled={!!busy} className="btn btn-ghost mt-4">Save metadata</button>
      </Reveal>

      <Reveal delay={450} from="right" className="col-span-12 md:col-start-9 md:col-span-4 mt-16 md:mt-40 z-10">
        <div className="block-cobalt p-5 tilt-rr">
          <div className="h-bungee text-2xl mb-3">Ship it</div>
          <label className="lbl text-acid">channel</label>
          <select value={channelId} onChange={(e) => setChannelId(e.target.value)} className="field text-bone border-bone bg-cobalt">
            <option value="">— pick a channel —</option>
            {channels.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
          <label className="lbl text-acid mt-4">schedule (local time)</label>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="field text-bone border-bone" />
          <div className="flex flex-col gap-2 mt-5">
            <button onClick={postNow} disabled={!!busy || !canPost || !channelId} className="btn btn-hot">{busy === "post" ? "uploading…" : "Post to YouTube now"}</button>
            <button onClick={schedule} disabled={!!busy || !canPost || !channelId || !when} className="btn">Schedule auto-post</button>
            {video.status === "scheduled" && <button onClick={unschedule} disabled={!!busy} className="btn btn-ghost text-bone border-bone">Cancel schedule</button>}
            {!canPost && <div className="t-vt text-acid">{video.status === "posted" ? "already posted" : "available once the render is ready"}</div>}
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-6 ml-4">
          {video.videoUrl && <a href={`${video.videoUrl}&dl=video-${video.id}.mp4`} className="btn btn-ghost">Download MP4</a>}
          <button onClick={regenThumb} disabled={!!busy} className="btn btn-ghost">Regenerate thumbnail</button>
          <button onClick={regen} disabled={!!busy} className="btn btn-ghost">Regenerate (new seed)</button>
          {video.status === "failed" && <button onClick={retry} disabled={!!busy} className="btn btn-ghost">Retry render</button>}
          <button onClick={del} disabled={!!busy} className="btn btn-danger">Delete</button>
        </div>
        {msg && <div className="t-vt mt-3 ml-4 text-oxblood">{msg}</div>}
      </Reveal>
    </>
  );
}
