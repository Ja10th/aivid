import { db } from "@/db";
import { musicTracks } from "@/db/schema";
import { asc } from "drizzle-orm";
import { seedMusic } from "@/lib/server/engine";
import MusicPanel from "@/components/MusicPanel";
import { Reveal } from "@/components/Anim";

export const dynamic = "force-dynamic";

export default async function Music() {
  let rows = await db.select().from(musicTracks).orderBy(asc(musicTracks.mood), asc(musicTracks.title));
  if (!rows.length) { await seedMusic(); rows = await db.select().from(musicTracks).orderBy(asc(musicTracks.mood), asc(musicTracks.title)); }
  return (
    <main className="page">
      <div className="edge-label">music · {rows.length} tracks</div>
      <div className="ghost-num" style={{ right: "10%", top: "20vh" }}>06</div>
      <Reveal as="header" from="up" className="col-span-12 md:col-start-2 md:col-span-6 z-10">
        <h1 className="h-display text-[14vw] md:text-[6.5vw]">Music<br /><span className="text-magenta">bed</span></h1>
        <p className="t-serif t-italic text-2xl mt-4 max-w-lg">Real tracks, grouped by mood. The engine picks one that fits the category, loops it under the voice at low volume, and fades it out. Add your own by upload or URL.</p>
      </Reveal>
      <MusicPanel tracks={rows.map((t) => ({ id: t.id, title: t.title, mood: t.mood, filePath: t.filePath, source: t.source, attribution: t.attribution }))} />
    </main>
  );
}
