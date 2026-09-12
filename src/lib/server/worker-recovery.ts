export const POSTING_TIMEOUT_MS = 30 * 60 * 1000;

export function isStalePosting(
  video: { status: string; createdAt?: Date | string | null },
  now = new Date(),
) {
  if (video.status !== "posting") return false;
  if (!video.createdAt) return false;

  const createdAt = new Date(video.createdAt).getTime();
  if (!Number.isFinite(createdAt)) return false;

  return now.getTime() - createdAt > POSTING_TIMEOUT_MS;
}
