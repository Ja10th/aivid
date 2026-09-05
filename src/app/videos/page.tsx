import Link from "next/link";
import { db } from "@/db";
import { videos } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import VideoCard from "@/components/VideoCard";
import { StaggerList } from "@/components/Anim";
import LivePoll from "@/components/LivePoll";

export const dynamic = "force-dynamic";
const STATUSES = ["all", "queued", "rendering", "ready", "scheduled", "posted", "failed"];

export default async function Library({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const { status } = await searchParams;
  const q = db.select().from(videos).orderBy(desc(videos.createdAt)).limit(120);
  const rows = status && status !== "all" ? await q.where(eq(videos.status, status)) : await q;
  const active = rows.some((r) => r.status === "rendering" || r.status === "queued" || r.status === "posting");
  return (
    <main className="page">
      <LivePoll active={active} />
      <div className="edge-label">library · {rows.length} items</div>
      <div className="ghost-num" style={{ right: "3rem", top: "-2rem" }}>03</div>
      <header className="col-span-12 md:col-start-1 md:col-span-5 mt-4 z-10">
        <h1 className="h-display text-[16vw] md:text-[7vw]">Libr<br />ary</h1>
        <div className="flex flex-wrap gap-2 mt-6 ml-12">
          {STATUSES.map((s) => <Link key={s} href={s === "all" ? "/videos" : `/videos?status=${s}`} className={`chip ${(status ?? "all") === s ? "on" : ""}`}>{s}</Link>)}
        </div>
      </header>
      <section className="col-span-12 md:col-start-4 md:col-span-9 mt-16">
        {rows.length === 0 ? <div className="t-serif t-italic text-3xl">Empty. <Link href="/studio" className="underline-hot">Make something.</Link></div> : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-x-10 gap-y-14">
            {rows.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
          </StaggerList>
        )}
      </section>
    </main>
  );
}
