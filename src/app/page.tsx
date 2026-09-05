import Link from "next/link";
import { db } from "@/db";
import { automations, channels, videos } from "@/db/schema";
import { desc, sql } from "drizzle-orm";
import VideoCard from "@/components/VideoCard";
import { Reveal, StaggerList, Counter, Marquee, Pulse } from "@/components/Anim";
import { CATEGORIES } from "@/lib/video/core";
import LivePoll from "@/components/LivePoll";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [recent, chs, autos, counts] = await Promise.all([
    db.select().from(videos).orderBy(desc(videos.createdAt)).limit(7),
    db.select().from(channels),
    db.select().from(automations),
    db.select({ status: videos.status, n: sql<number>`count(*)::int` }).from(videos).groupBy(videos.status),
  ]);
  const c: Record<string, number> = {};
  for (const r of counts) c[r.status] = r.n;
  const total = Object.values(c).reduce((a, b) => a + b, 0);
  const active = (c.queued ?? 0) + (c.rendering ?? 0);

  return (
    <main className="page">
      <LivePoll active={active > 0} />
      <div className="edge-label">desk · loop foundry · {new Date().toDateString()}</div>
      <div className="ghost-num" style={{ left: "-1.5rem", top: "9rem" }}>01</div>

      {/* Hero: intentionally crammed to the right-top, leaving left void */}
      <Reveal as="header" from="skew" className="col-start-1 md:col-start-6 col-span-12 md:col-span-7 relative z-10 mt-6">
        <div className="t-vt text-oxblood">a video factory that never sleeps</div>
        <h1 className="h-display text-[15vw] md:text-[8.5vw] text-ink">
          LOOP<br /><span className="text-cobalt">FOUN</span><span className="text-magenta">DRY</span>
        </h1>
        <p className="t-serif t-italic text-2xl md:text-3xl max-w-xl mt-5 leading-tight">
          It writes the script, cuts every scene, records the voice, picks the music, paints the thumbnail — then posts it to <span className="bg-acid px-1 not-italic">YouTube</span> on your schedule. Never the same video twice.
        </p>
        <div className="flex gap-3 flex-wrap mt-6 items-center">
          <Link href="/studio" className="btn btn-hot text-xl">Generate a video now →</Link>
          <Link href="/automations" className="btn btn-ghost">Set up daily automation</Link>
        </div>
      </Reveal>

      {/* Stat stack far left, low */}
      <Reveal delay={300} from="left" className="col-span-12 md:col-start-1 md:col-span-3 mt-24 md:mt-40 z-10">
        <div className="block-ink p-5 tilt-l inline-block min-w-[220px]">
          <div className="t-vt text-acid">videos generated</div>
          <div className="h-display text-7xl"><Counter value={total} /></div>
          <div className="hairline bg-magenta my-3" />
          <div className="grid grid-cols-2 gap-x-6 gap-y-1 t-vt text-base">
            <span>ready</span><span className="text-acid text-right">{c.ready ?? 0}</span>
            <span>posted</span><span className="text-magenta text-right">{c.posted ?? 0}</span>
            <span>scheduled</span><span className="text-right">{c.scheduled ?? 0}</span>
            <span>working</span><span className="text-right">{active > 0 ? <Pulse>{active}</Pulse> : 0}</span>
            <span>failed</span><span className="text-right">{c.failed ?? 0}</span>
          </div>
        </div>
        <div className="mt-8 ml-10 t-vt">
          <div><span className="h-display text-4xl text-cobalt">{chs.length}</span> channel{chs.length === 1 ? "" : "s"} connected</div>
          <div><span className="h-display text-4xl text-magenta">{autos.filter((a) => a.enabled).length}</span> automation{autos.length === 1 ? "" : "s"} running</div>
          {!chs.length && <Link href="/channels" className="underline-hot block mt-2">connect a YouTube channel →</Link>}
        </div>
      </Reveal>

      {/* Category ribbon, off-grid */}
      <div className="col-span-12 mt-16 -mx-5 block-acid py-2 rotate-[-1.2deg]">
        <Marquee className="h-bungee text-2xl" text={CATEGORIES.map((c) => c.label.toUpperCase()).join("  ✦  ") + "  ✦  "} />
      </div>

      {/* Recent videos: staggered, uneven */}
      <section className="col-span-12 md:col-start-2 md:col-span-11 mt-20 relative">
        <div className="flex items-end gap-6 mb-8">
          <h2 className="h-display text-5xl md:text-7xl">Fresh<br />out</h2>
          <Link href="/videos" className="t-vt underline-hot mb-2">whole library →</Link>
        </div>
        {recent.length === 0 ? (
          <Reveal className="block-ox p-8 max-w-lg tilt-r">
            <div className="h-bungee text-3xl mb-2">Nothing here yet.</div>
            <p className="t-serif text-xl">Go to the <Link href="/studio" className="underline-hot text-acid">Studio</Link> and generate your first video. Rendering a 4–7 minute episode takes a couple of minutes.</p>
          </Reveal>
        ) : (
          <StaggerList className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-14">
            {recent.map((v, i) => <VideoCard key={v.id} v={v} i={i} />)}
          </StaggerList>
        )}
      </section>

      <footer className="col-span-12 mt-32 flex justify-between items-end t-vt opacity-60">
        <span>music: Kevin MacLeod / incompetech (CC BY 4.0) · voices: neural TTS · render: canvas → ffmpeg</span>
        <span className="text-right">{autos.length ? "scheduler ticks every minute" : "no automations yet"}</span>
      </footer>
    </main>
  );
}
