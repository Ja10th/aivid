import Link from "next/link";
import { fmtDur, fmtDate, CAT_LABEL, relPath } from "@/lib/format";

export interface VideoLite {
  id: number; title: string; category: string; orientation: string; durationSec: number; status: string; progress: number; stage: string | null; thumbPath: string | null; thumbnailFingerprint: string | null; scheduledFor: Date | string | null; youtubeVideoId: string | null; createdAt: Date | string; mode: string;
}

export default function VideoCard({ v, i = 0 }: { v: VideoLite; i?: number }) {
  const thumb = relPath(v.thumbPath);
  const tilt = ["tilt-l", "", "tilt-r", "", "tilt-rr", ""][i % 6];
  return (
    <Link href={`/videos/${v.id}`} className={`block group ${tilt}`} style={{ marginTop: i % 3 === 1 ? "2.5rem" : i % 4 === 3 ? "-1rem" : 0 }}>
      <div className="thumb-frame relative overflow-hidden" style={{ aspectRatio: "16/9" }}>
        {thumb ? <img src={`/api/media?f=${encodeURIComponent(thumb)}&v=${encodeURIComponent(v.thumbnailFingerprint ?? String(v.progress))}`} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform" /> : <div className="w-full h-full block-ox" />}
        {v.status === "rendering" && (
          <div className="absolute inset-x-0 bottom-0 h-2 bg-ink"><div className="h-full bg-acid" style={{ width: `${v.progress}%` }} /></div>
        )}
        <span className="absolute top-2 left-2 t-vt bg-ink text-bone px-1 text-[13px]">{v.orientation === "portrait" ? "SHORT" : fmtDur(v.durationSec)}</span>
        <span className={`absolute top-2 right-2 t-vt px-1 text-[13px] bg-bone status-${v.status}`}>{v.status}{v.status === "rendering" ? ` ${v.progress}%` : ""}</span>
      </div>
      <div className="mt-2 flex gap-3 items-start">
        <span className="h-display text-2xl text-magenta">{String(v.id).padStart(3, "0")}</span>
        <div className="min-w-0">
          <div className="t-serif t-italic text-xl leading-tight line-clamp-2 group-hover:underline decoration-magenta decoration-2">{v.title}</div>
          <div className="t-vt text-[15px] opacity-70">{CAT_LABEL[v.category] ?? v.category} · {v.mode} · {v.scheduledFor ? `⏰ ${fmtDate(v.scheduledFor)}` : fmtDate(v.createdAt)}{v.youtubeVideoId ? " · on YouTube" : ""}</div>
        </div>
      </div>
    </Link>
  );
}
