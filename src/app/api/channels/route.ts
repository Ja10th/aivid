import { db } from "@/db";
import { channels } from "@/db/schema";
import { desc } from "drizzle-orm";
export const dynamic = "force-dynamic";
export async function GET() {
  const rows = await db.select({ id: channels.id, title: channels.title, handle: channels.handle, thumbnailUrl: channels.thumbnailUrl, youtubeChannelId: channels.youtubeChannelId, subscriberCount: channels.subscriberCount, createdAt: channels.createdAt }).from(channels).orderBy(desc(channels.createdAt));
  return Response.json(rows);
}
