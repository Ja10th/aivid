// Isomorphic core: works in Node and browser (no Node imports here).

export type Orientation = "landscape" | "portrait";

export type SceneKind =
  | "title"
  | "outro"
  | "eye-follow"
  | "eye-saccade"
  | "eye-focus"
  | "eye-peripheral"
  | "eye-palming"
  | "eye-rotation"
  | "eye-tracing"
  | "math-question"
  | "math-sequence"
  | "story-panel"
  | "game-snake"
  | "game-breakout"
  | "game-maze"
  | "game-life"
  | "game-marbles"
  | "game-pong"
  | "game-tetris"
  | "game-flappy"
  | "game-asteroids"
  | "game-sort"
  | "game-pathfinder"
  | "game-sand"
  | "game-chess"
  | "memory-sequence"
  | "trivia"
  | "word-scramble"
  | "breathing"
  | "interlude";

export interface Palette {
  name: string;
  bg: string;
  bg2: string;
  fg: string;
  accent: string;
  accent2: string;
  muted: string;
}

export interface Scene {
  id: string;
  kind: SceneKind;
  start: number;
  duration: number;
  transition: "cut" | "fade" | "wipe" | "zoom" | "slide" | "iris";
  palette: Palette;
  bgStyle: BgStyle;
  narration?: string;
  narrationAt?: number; // offset from scene start
  narrationMuted?: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any;
}

export type BgStyle =
  | "solid"
  | "gradient"
  | "grid"
  | "dots"
  | "noise"
  | "rays"
  | "diagonal"
  | "blobs"
  | "rings";

export interface Composition {
  version: 1;
  seed: string;
  category: string;
  orientation: Orientation;
  width: number;
  height: number;
  fps: number;
  duration: number;
  theme: {
    palette: Palette;
    fontDisplay: string;
    fontBody: string;
    fontMono: string;
  };
  scenes: Scene[];
  music: { mood: string; volume: number };
  voice: { name: string; fallbackVoice?: string; rate: string; pitch: string };
  meta: {
    title: string;
    description: string;
    tags: string[];
    thumbText: string;
    thumbSub: string;
  };
}

// ---------- RNG ----------
export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

export class RNG {
  private s: number;
  constructor(seed: string | number) {
    this.s = typeof seed === "number" ? seed >>> 0 : hashSeed(seed);
    if (this.s === 0) this.s = 0x9e3779b9;
  }
  next(): number {
    // mulberry32
    this.s = (this.s + 0x6d2b79f5) >>> 0;
    let t = this.s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }
  range(min: number, max: number) {
    return min + this.next() * (max - min);
  }
  int(min: number, max: number) {
    return Math.floor(this.range(min, max + 1));
  }
  pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(this.next() * arr.length)];
  }
  shuffle<T>(arr: readonly T[]): T[] {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(this.next() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }
  chance(p: number) {
    return this.next() < p;
  }
  fork(label: string) {
    return new RNG(hashSeed(label + ":" + this.next().toString(36)));
  }
}

// ---------- Palettes (dissonant on purpose) ----------
export const PALETTES: Palette[] = [
  { name: "acid-night", bg: "#0b0b12", bg2: "#1a1030", fg: "#f4f1e8", accent: "#c6ff00", accent2: "#ff2d95", muted: "#5b5a75" },
  { name: "bone-oxblood", bg: "#efe9dc", bg2: "#e2d6c2", fg: "#2b0a12", accent: "#a3122e", accent2: "#1f2bff", muted: "#a89c86" },
  { name: "cobalt-tang", bg: "#101cc4", bg2: "#0a128a", fg: "#fdfcf7", accent: "#ff8a00", accent2: "#a8ffdf", muted: "#5560e0" },
  { name: "mint-rust", bg: "#d7fff0", bg2: "#b8f5dc", fg: "#1a2a24", accent: "#b7410e", accent2: "#5b2cff", muted: "#7fb8a3" },
  { name: "deep-sea", bg: "#04141a", bg2: "#082b36", fg: "#d6f6ff", accent: "#ffd23f", accent2: "#ff4e50", muted: "#2f5d6b" },
  { name: "plum-lime", bg: "#2a0a2e", bg2: "#470f4f", fg: "#fbe9ff", accent: "#bfff3c", accent2: "#ff9ecb", muted: "#7b3f85" },
  { name: "sand-storm", bg: "#f5d98b", bg2: "#efc35a", fg: "#2d1b00", accent: "#0f3d91", accent2: "#e0133b", muted: "#c9a349" },
  { name: "graphite-neon", bg: "#1c1c1c", bg2: "#2a2a2a", fg: "#fafafa", accent: "#00f5d4", accent2: "#f15bb5", muted: "#666" },
  { name: "peach-void", bg: "#ffd4c2", bg2: "#ffb99a", fg: "#1c0f2e", accent: "#3a0ca3", accent2: "#0b7a75", muted: "#d99b86" },
  { name: "forest-hot", bg: "#0e2a1a", bg2: "#164a2b", fg: "#eefbe7", accent: "#ff6b35", accent2: "#f7ff58", muted: "#3f7a55" },
  { name: "paper-ink", bg: "#f8f5ef", bg2: "#ebe6da", fg: "#111", accent: "#ff3b00", accent2: "#0043ff", muted: "#b9b3a6" },
  { name: "ultraviolet", bg: "#12003b", bg2: "#2b0a6b", fg: "#e9e0ff", accent: "#00e5ff", accent2: "#ff9f1c", muted: "#5d3fa8" },
  { name: "tomato-cream", bg: "#ff4d3d", bg2: "#e83a2b", fg: "#fff7e6", accent: "#fff275", accent2: "#0b2545", muted: "#f28c82" },
  { name: "slate-ember", bg: "#2e3440", bg2: "#3b4252", fg: "#eceff4", accent: "#ffb703", accent2: "#8ecae6", muted: "#6c7386" },
];

export const FONTS = {
  display: [
    "Bangers",
    "Anton",
    "Permanent Marker",
    "Righteous",
    "Bungee",
    "Rubik Mono One",
    "Unbounded",
    "Syne",
    "Major Mono Display",
    "Lobster",
    "Pacifico",
    "Press Start 2P",
    "Fredoka",
  ],
  body: ["Space Grotesk", "Cormorant Garamond", "Playfair Display", "Fredoka", "Syne", "Special Elite", "DejaVu Sans"],
  mono: ["VT323", "Major Mono Display", "Press Start 2P", "Special Elite", "DejaVu Sans Mono"],
} as const;

export const FONT_FILES: Record<string, string> = {
  Bangers: "Bangers-Regular.ttf",
  Anton: "Anton-Regular.ttf",
  "Permanent Marker": "PermanentMarker-Regular.ttf",
  Righteous: "Righteous-Regular.ttf",
  Bungee: "Bungee-Regular.ttf",
  "Rubik Mono One": "RubikMonoOne-Regular.ttf",
  Unbounded: "Unbounded.ttf",
  Syne: "Syne.ttf",
  "Major Mono Display": "MajorMonoDisplay-Regular.ttf",
  Lobster: "Lobster-Regular.ttf",
  Pacifico: "Pacifico-Regular.ttf",
  "Press Start 2P": "PressStart2P-Regular.ttf",
  Fredoka: "Fredoka.ttf",
  "Space Grotesk": "SpaceGrotesk.ttf",
  "Cormorant Garamond": "CormorantGaramond.ttf",
  "Playfair Display": "PlayfairDisplay.ttf",
  "Special Elite": "SpecialElite-Regular.ttf",
  VT323: "VT323-Regular.ttf",
};

export const VOICES = [
  "en-US-AriaNeural",
  "en-US-GuyNeural",
  "en-US-JennyNeural",
  "en-US-ChristopherNeural",
  "en-US-EricNeural",
  "en-US-MichelleNeural",
  "en-US-RogerNeural",
  "en-US-SteffanNeural",
  "en-GB-SoniaNeural",
  "en-GB-RyanNeural",
  "en-GB-LibbyNeural",
  "en-AU-NatashaNeural",
  "en-AU-WilliamNeural",
  "en-IE-EmilyNeural",
  "en-CA-LiamNeural",
];

export const STUDIO_VOICES = [
  { id: "aria", label: "Aria" },
  { id: "nicole", label: "Nicole" },
  { id: "adam", label: "Adam" },
  { id: "fable", label: "Fable" },
] as const;

export const MOODS = ["calm", "focus", "playful", "chiptune", "cinematic", "mystery", "energetic"] as const;
export type Mood = (typeof MOODS)[number];

export const CATEGORIES: { id: string; label: string; blurb: string; moods: Mood[] }[] = [
  { id: "eye_training", label: "Eye Training", blurb: "Smooth pursuit, saccades, focus shifts, rotation, tracing, and convergence drills — narrated.", moods: ["calm", "focus"] },
  { id: "math", label: "Math Exercises", blurb: "Timed arithmetic, sequences and mental math with reveals.", moods: ["focus", "playful", "chiptune"] },
  { id: "story", label: "Stories", blurb: "Procedurally written short fiction, narrated, with illustrated panels.", moods: ["cinematic", "calm", "mystery"] },
  { id: "gameplay", label: "Game Plays", blurb: "Classic arcade games: snake, breakout, mazes, pong, tetris, flappy bird, asteroids, sorting visualizations, and more.", moods: ["chiptune", "energetic", "playful"] },
  { id: "brain", label: "Brain Teasers", blurb: "Memory sequences, trivia and word scrambles against the clock.", moods: ["playful", "focus", "mystery"] },
  { id: "calm", label: "Calm & Breathing", blurb: "Breathing pacers and slow visual drift for focus resets.", moods: ["calm"] },
  { id: "mixed", label: "Everything Mixed", blurb: "A different blend of all engines every time.", moods: ["playful", "focus", "cinematic"] },
];

export function estimateSpeech(text: string) {
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1.2, words / 2.55 + 0.6);
}

export function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}
export function lerp(a: number, b: number, t: number) {
  return a + (b - a) * t;
}
export function easeInOut(t: number) {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}
export function easeOutBack(t: number) {
  const c1 = 1.70158;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
}
export function easeOutElastic(t: number) {
  if (t === 0 || t === 1) return t;
  return Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
}
