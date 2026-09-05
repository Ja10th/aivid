import { db } from "@/db";
import { channels, videos } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import ChannelsPanel from "@/components/ChannelsPanel";
import { Reveal } from "@/components/Anim";

export const dynamic = "force-dynamic";

export default async function Channels({ searchParams }: { searchParams: Promise<{ error?: string; connected?: string }> }) {
  const sp = await searchParams;
  const chs = await db.select().from(channels).orderBy(desc(channels.createdAt));
  const posted = await db.select({ channelId: videos.channelId, n: sql<number>`count(*)::int` }).from(videos).where(eq(videos.status, "posted")).groupBy(videos.channelId);
  const postedMap: Record<number, number> = {};
  for (const p of posted) if (p.channelId) postedMap[p.channelId] = p.n;
  return (
    <main className="page">
      <div className="edge-label">channels · youtube oauth</div>
      <div className="ghost-num" style={{ left: "-3rem", bottom: "4rem" }}>05</div>
      <Reveal as="header" from="right" className="col-span-12 md:col-start-8 md:col-span-5 z-10">
        <h1 className="h-display text-[14vw] md:text-[6.5vw]">Chan<br />nels</h1>
        <p className="t-serif t-italic text-2xl mt-4">Connect as many YouTube channels as you like. Each one gets its own OAuth grant; automations round-robin across them.</p>
      </Reveal>
      <ChannelsPanel channels={chs.map((c) => ({ id: c.id, title: c.title, handle: c.handle, thumbnailUrl: c.thumbnailUrl, subscriberCount: c.subscriberCount ?? 0, posted: postedMap[c.id] ?? 0, hasRefresh: Boolean(c.refreshToken) }))} flash={sp} />
    </main>
  );
}
