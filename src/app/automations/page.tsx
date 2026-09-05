import { db } from "@/db";
import { automations, channels } from "@/db/schema";
import { desc } from "drizzle-orm";
import AutomationsPanel from "@/components/AutomationsPanel";
import { Reveal } from "@/components/Anim";

export const dynamic = "force-dynamic";

export default async function Automations() {
  const [autos, chs] = await Promise.all([db.select().from(automations).orderBy(desc(automations.createdAt)), db.select({ id: channels.id, title: channels.title }).from(channels)]);
  return (
    <main className="page">
      <div className="edge-label">automations · daily planner</div>
      <div className="ghost-num" style={{ left: "45%", top: "30vh" }}>04</div>
      <Reveal as="header" from="skew" className="col-span-12 md:col-start-7 md:col-span-6 z-10">
        <h1 className="h-display text-[14vw] md:text-[6.5vw]">Auto<br />mations</h1>
        <p className="t-serif t-italic text-2xl mt-4 max-w-md">Every day at midnight-ish the planner wakes up, generates the day&apos;s batch, renders it, and either waits for your review or posts it at the times you set.</p>
      </Reveal>
      <AutomationsPanel autos={autos.map((a) => ({ ...a, createdAt: a.createdAt.toISOString() }))} channels={chs} />
    </main>
  );
}
