export const STUDIO_API_URL = (process.env.VOXLAB_STUDIO_API_URL || "https://voice-kepv.onrender.com").replace(/\/$/, "");
export const STUDIO_VOICES = [
  { id: "aria", label: "Aria" },
  { id: "nicole", label: "Nicole" },
  { id: "adam", label: "Adam" },
  { id: "fable", label: "Fable" },
] as const;
export type StudioVoiceId = (typeof STUDIO_VOICES)[number]["id"];

const GENERATION_TIMEOUT_MS = 110_000;
const REQUEST_TIMEOUT_MS = 15_000;

type StudioState = typeof globalThis & { __voxlabStudioKeepAlive?: NodeJS.Timeout };
const state = globalThis as StudioState;

export class StudioApiError extends Error {
  constructor(message = "VoxLab Studio API is temporarily unavailable") {
    super(message);
    this.name = "StudioApiError";
  }
}

export function isStudioVoice(voice: string): voice is StudioVoiceId {
  return STUDIO_VOICES.some((item) => item.id === voice);
}

async function studioFetch(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  try {
    return await fetch(`${STUDIO_API_URL}${path}`, { ...init, signal: AbortSignal.timeout(timeoutMs), cache: "no-store" });
  } catch {
    throw new StudioApiError();
  }
}

function studioVoiceOrThrow(voiceId: string): StudioVoiceId {
  if (!isStudioVoice(voiceId)) throw new StudioApiError("Unknown VoxLab Studio voice");
  return voiceId;
}

function responseError() {
  return new StudioApiError();
}

export async function studioHealth() {
  const response = await studioFetch("/api/health");
  return response.ok;
}

export async function studioVoices() {
  const response = await studioFetch("/api/voices");
  if (!response.ok) throw responseError();
  const body = await response.json().catch(() => null) as unknown;
  return { voices: STUDIO_VOICES, remote: body, available: true };
}

async function studioAudio(path: string, init?: RequestInit, timeoutMs = REQUEST_TIMEOUT_MS) {
  const response = await studioFetch(path, init, timeoutMs);
  if (!response.ok) throw responseError();
  const bytes = await response.arrayBuffer();
  if (!bytes.byteLength) throw responseError();
  return Buffer.from(bytes);
}

export async function studioSample(voiceId: string) {
  return studioAudio(`/api/sample/${encodeURIComponent(studioVoiceOrThrow(voiceId))}`);
}

export function speedFromRate(rate: string) {
  const match = /^([+-]?\d+(?:\.\d+)?)%$/.exec(rate.trim());
  const speed = match ? 1 + Number(match[1]) / 100 : 1;
  return Math.max(0.5, Math.min(2, Number(speed.toFixed(2))));
}

export async function studioTts(text: string, voiceId: string, speed = 1) {
  if (!text.trim()) throw new StudioApiError("Studio Voice text cannot be empty");
  const voice = studioVoiceOrThrow(voiceId);
  return studioAudio("/api/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "audio/wav" },
    body: JSON.stringify({ text, voice_id: voice, speed }),
  }, GENERATION_TIMEOUT_MS);
}

export function startStudioKeepAlive() {
  if (state.__voxlabStudioKeepAlive || process.env.VERCEL) return;
  const minutes = Number(process.env.VOXLAB_STUDIO_KEEPALIVE_MINUTES || 12);
  const intervalMs = Math.max(10, Math.min(14, Number.isFinite(minutes) ? minutes : 12)) * 60_000;
  const ping = () => { void studioHealth().catch(() => undefined); };
  ping();
  state.__voxlabStudioKeepAlive = setInterval(ping, intervalMs);
  state.__voxlabStudioKeepAlive.unref?.();
}

export function stopStudioKeepAlive() {
  if (!state.__voxlabStudioKeepAlive) return;
  clearInterval(state.__voxlabStudioKeepAlive);
  state.__voxlabStudioKeepAlive = undefined;
}
