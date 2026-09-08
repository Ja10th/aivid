export function fmtDur(s: number) {
  const m = Math.floor(s / 60), r = Math.floor(s % 60);
  return `${m}:${String(r).padStart(2, "0")}`;
}
export function mediaUrl(p?: string | null, dl?: string) {
  if (!p) return null;
  const rel = p.includes("/app/") ? p.slice(p.indexOf("/app/") + 5) : p.replace(process.cwd?.() ? process.cwd() + "/" : "", "");
  return `/api/media?f=${encodeURIComponent(rel)}${dl ? `&dl=${encodeURIComponent(dl)}` : ""}`;
}
export function relPath(p?: string | null) {
  if (!p) return null;
  const i = p.indexOf("/data/");
  return i >= 0 ? p.slice(i + 1) : p;
}
export function fmtDate(d?: Date | string | null) {
  if (!d) return "—";
  const dt = typeof d === "string" ? new Date(d) : d;
  return dt.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}
export const CAT_LABEL: Record<string, string> = { 
  eye_training: "Eye Training", 
  math: "Math", 
  story: "Story", 
  gameplay: "Game Play", 
  brain: "Brain", 
  calm: "Calm", 
  riddles: "Riddles",
  trivia: "Trivia",
  memory: "Memory",
  wouldyourather: "Would You Rather",
  mythbusters: "Myth Busters",
  polls: "Polls",
  mixed: "Mixed" 
};
