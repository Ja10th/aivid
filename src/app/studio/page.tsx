import { db } from "@/db";
import { channels } from "@/db/schema";
import StudioForm from "@/components/StudioForm";
import { Reveal } from "@/components/Anim";

export const dynamic = "force-dynamic";

export default async function Studio() {
  const chs = await db.select({ id: channels.id, title: channels.title }).from(channels);
  return (
    <main className="page">
      <div className="edge-label">studio · generate</div>
      <div className="ghost-num" style={{ left: "38%", top: "0" }}>02</div>
      <Reveal as="header" from="left" className="col-span-12 md:col-span-4 mt-2 z-10">
        <h1 className="h-display text-[15vw] md:text-[6.5vw] leading-[0.8]">Stu<br />dio</h1>
        <p className="t-serif t-italic text-2xl mt-6 max-w-xs">Pick an engine. The preview on the right is the real composition, running live in your browser, seeded exactly like the render will be.</p>
        <p className="t-vt mt-6 text-oxblood max-w-xs">Landscape episodes are always at least 4 minutes and their length is random. Shorts stay tight and start right on the main action.</p>
      </Reveal>
      <StudioForm channels={chs} />
    </main>
  );
}
