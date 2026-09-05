import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/db";
import { channels, musicTracks, videos } from "@/db/schema";
import { eq } from "drizzle-orm";
import type { Composition } from "@/lib/video/core";
import Player from "@/components/Player";
import VideoActions from "@/components/VideoActions";
import LivePoll from "@/components/LivePoll";
import { Reveal } from "@/components/Anim";
import { fmtDur, relPath, CAT_LABEL } from "@/lib/format";
import ClipEditor from "@/components/ClipEditor";

export const dynamic = "force-dynamic";

export default async function VideoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [v] = await db.select().from(videos).where(eq(videos.id, Number(id)));
  if (!v) notFound();
  const [chs, track] = await Promise.all([
    db.select({ id: channels.id, title: channels.title }).from(channels),
    v.musicTrackId ? db.select().from(musicTracks).where(eq(musicTracks.id, v.musicTrackId)).then((r) => r[0]) : Promise.resolve(null),
  ]);
  const comp = v.composition as Composition;
  const videoUrl = v.status !== "rendering" && v.status !== "queued" && v.videoPath ? `/api/media?f=${encodeURIComponent(relPath(v.videoPath)!)}` : null;
  const thumbUrl = v.thumbPath ? `/api/media?f=${encodeURIComponent(relPath(v.thumbPath)!)}&v=${encodeURIComponent(v.thumbnailFingerprint ?? String(v.progress))}` : null;
  const busy = v.status === "rendering" || v.status === "queued" || v.status === "posting";
  const kinds = comp.scenes.reduce<Record<string, number>>((a, s) => { a[s.kind] = (a[s.kind] ?? 0) + 1; return a; }, {});

  return (
    <main className="page">
      <LivePoll active={busy} every={2500} />
      <div className="edge-label">video {String(v.id).padStart(4, "0")} · {v.status}</div>
      <div className="ghost-num" style={{ right: "-2rem", bottom: "8rem" }}>{String(v.id).padStart(2, "0")}</div>

      <Reveal as="header" from="left" className="col-span-12 md:col-start-1 md:col-span-4 z-10">
        <Link href="/videos" className="t-vt underline-hot">← library</Link>
        <div className="mt-6 t-vt text-oxblood">{CAT_LABEL[v.category] ?? v.category} · {v.orientation} · {fmtDur(v.durationSec)} · seed {v.seed}</div>
        <h1 className="h-bungee text-3xl md:text-4xl mt-2 leading-none">{v.title}</h1>
        <div className={`mt-4 t-vt text-2xl status-${v.status}`}>
          {v.status}{v.status === "rendering" ? ` — ${v.progress}% · ${v.stage}` : ""}{v.status === "queued" ? " — waiting for the render worker" : ""}
        </div>
        {v.status === "rendering" && <div className="h-3 bg-ink mt-2 tilt-l"><div className="h-full bg-acid transition-all" style={{ width: `${v.progress}%` }} /></div>}
        {v.error && <div className="mt-3 p-3 block-ox t-vt text-sm break-words">{v.error}</div>}
        {v.youtubeVideoId && <a href={`https://youtu.be/${v.youtubeVideoId}`} target="_blank" className="btn btn-hot mt-4">Open on YouTube ↗</a>}

        <div className="mt-10">
          <div className="t-vt text-oxblood mb-1">thumbnail · style {v.thumbnailFingerprint?.split("|").slice(0, 1)}</div>
          {thumbUrl ? <img src={thumbUrl} alt="thumbnail" className="thumb-frame tilt-r w-full max-w-[360px]" /> : <div className="t-vt">not yet</div>}
          <div className="t-vt text-xs opacity-60 mt-2 break-all">{v.thumbnailFingerprint}</div>
        </div>
      </Reveal>

      <Reveal delay={150} className="col-span-12 md:col-start-5 md:col-span-8 mt-10 md:mt-24 z-10">
        <Player comp={comp} videoUrl={videoUrl} className={v.orientation === "portrait" ? "max-w-[360px] ml-auto mr-10" : ""} />
        <div className="mt-6 flex flex-wrap gap-x-5 gap-y-1 t-vt text-[15px] opacity-80">
          <span>{comp.scenes.length} scenes</span>
          {Object.entries(kinds).map(([k, n]) => <span key={k}>{k}×{n}</span>)}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 t-vt text-[15px] opacity-80">
          <span>voice {comp.voice.name}</span>
          <span>music {track ? `${track.title} (${track.mood})` : "—"}</span>
          <span>fonts {comp.theme.fontDisplay} + {comp.theme.fontBody} + {comp.theme.fontMono}</span>
          <span>palettes {[...new Set(comp.scenes.map((s) => s.palette.name))].join(", ")}</span>
        </div>
      </Reveal>

      <ClipEditor videoId={v.id} composition={comp} />

      <VideoActions video={{ id: v.id, title: v.title, description: v.description, tags: v.tags, status: v.status, channelId: v.channelId, scheduledFor: v.scheduledFor ? v.scheduledFor.toISOString() : null, videoUrl, mode: v.mode }} channels={chs} />
    </main>
  );
}
