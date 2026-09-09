/**
 * Per-video unique thumbnail generation
 * Each video gets a completely unique composition based on its specific content,
 * NOT a template based on its genre category.
 */

import type { Composition, Scene } from "./core";
import { RNG } from "./core";

export interface UniqueThumbnailSpec {
  html: string;
  hook: string; // The specific hook extracted from this video
  grammar: string; // The composition grammar chosen
}

/**
 * Extract the unique hook from a video - what makes THIS video different from all others
 */
function extractHook(comp: Composition): string {
  const { meta, scenes, category } = comp;
  const title = meta?.title || "";
  
  // Analyze scenes to find the most interesting/unique element
  const sceneKinds = scenes?.map(s => s.kind) || [];
  const hasRiddle = sceneKinds.includes("riddle");
  const hasMemory = sceneKinds.includes("memory-challenge");
  const hasTrivia = sceneKinds.includes("trivia-quiz");
  const hasWouldYouRather = sceneKinds.includes("would-you-rather");
  const hasMythBuster = sceneKinds.includes("myth-buster");
  const hasPoll = sceneKinds.includes("quick-poll");
  const hasMath = sceneKinds.includes("math-question");
  const hasGame = sceneKinds.some(k => k.startsWith("game-"));
  
  // Extract specific data from scenes
  const riddleData = scenes?.find(s => s.kind === "riddle")?.data as { question?: string; answer?: string } | undefined;
  const mathData = scenes?.find(s => s.kind === "math-question")?.data as { q?: string } | undefined;
  const memoryData = scenes?.find(s => s.kind === "memory-challenge")?.data as { sequence?: number[] } | undefined;
  
  // Build a specific hook based on what's in the video
  if (hasRiddle && riddleData?.question) {
    return `A riddle that makes you think: ${riddleData.question.substring(0, 50)}...`;
  }
  
  if (hasMath && mathData?.q) {
    const numScenes = scenes?.length || 0;
    return `${numScenes} rapid-fire math problems - can you keep up?`;
  }
  
  if (hasMemory && memoryData?.sequence) {
    const length = memoryData.sequence.length;
    return `Remember ${length} items in sequence - harder than it looks`;
  }
  
  if (hasWouldYouRather) {
    return `Impossible choices that reveal who you really are`;
  }
  
  if (hasMythBuster) {
    return `Common beliefs debunked with science and facts`;
  }
  
  if (hasPoll) {
    return `Your opinion matters - vote and see what others think`;
  }
  
  if (hasGame) {
    const gameType = sceneKinds.find(k => k.startsWith("game-"))?.replace("game-", "") || "challenge";
    return `Interactive ${gameType} game you can play along with`;
  }
  
  // Fallback to title analysis
  const titleLower = title.toLowerCase();
  if (titleLower.includes("impossible") || titleLower.includes("extreme")) {
    return `The ultimate challenge - think you can handle it?`;
  }
  
  if (titleLower.includes("brain") || titleLower.includes("iq")) {
    return `Test your mental skills with these mind-bending challenges`;
  }
  
  // Generic but category-aware fallback
  const sceneCounts = {
    math: sceneKinds.filter(k => k.includes("math")).length,
    riddle: sceneKinds.filter(k => k.includes("riddle")).length,
    trivia: sceneKinds.filter(k => k.includes("trivia")).length,
  };
  
  const maxType = Object.entries(sceneCounts).sort((a, b) => b[1] - a[1])[0];
  if (maxType && maxType[1] > 0) {
    return `${maxType[1]} ${maxType[0]} challenges that will push your limits`;
  }
  
  return title || `A unique ${category} experience designed to challenge you`;
}

/**
 * Choose a composition grammar based on the hook
 */
function chooseGrammar(hook: string, rng: RNG): string {
  const hookLower = hook.toLowerCase();
  
  // Grammar selection based on hook content
  if (hookLower.includes("riddle") || hookLower.includes("question")) {
    return rng.pick(["giant-question-mark", "mystery-spotlight", "think-bubble"]);
  }
  
  if (hookLower.includes("sequence") || hookLower.includes("remember") || hookLower.includes("memory")) {
    return rng.pick(["grid-progression", "sequence-line", "pattern-reveal"]);
  }
  
  if (hookLower.includes("choice") || hookLower.includes("rather") || hookLower.includes("decide")) {
    return rng.pick(["split-comparison", "vs-battle", "two-paths"]);
  }
  
  if (hookLower.includes("myth") || hookLower.includes("debunk") || hookLower.includes("fact")) {
    return rng.pick(["truth-stamp", "false-reveal", "fact-check-badge"]);
  }
  
  if (hookLower.includes("poll") || hookLower.includes("vote") || hookLower.includes("opinion")) {
    return rng.pick(["stat-bar-hero", "percentage-circle", "voting-hands"]);
  }
  
  if (hookLower.includes("math") || hookLower.includes("calculate") || hookLower.includes("solve")) {
    return rng.pick(["equation-hero", "number-explosion", "calculation-race"]);
  }
  
  if (hookLower.includes("challenge") || hookLower.includes("test") || hookLower.includes("skills")) {
    return rng.pick(["stat-bar-hero", "progress-ring", "level-up"]);
  }
  
  if (hookLower.includes("game") || hookLower.includes("play")) {
    return rng.pick(["gameplay-screenshot", "controller-hands", "game-over"]);
  }
  
  // Default grammars
  return rng.pick(["impact-number", "corner-spotlight", "diagonal-energy"]);
}

/**
 * Generate a unique HTML thumbnail for this specific video
 */
export function generateUniqueThumbnail(comp: Composition, seed: string, index: number = 0): UniqueThumbnailSpec {
  const rng = new RNG(`${seed}-thumb-${index}`);
  const hook = extractHook(comp);
  const grammar = chooseGrammar(hook, rng);
  
  // Color palette selection (5 different palettes rotated by index)
  const palettes = [
    { bg: "#0a0f1e", primary: "#3fe0ff", accent: "#ff2323", text: "#ffffff" },
    { bg: "#1a0f2e", primary: "#a855f7", accent: "#ffd23f", text: "#ffffff" },
    { bg: "#1a0e0a", primary: "#ff6b35", accent: "#3fe0ff", text: "#ffffff" },
    { bg: "#0c1821", primary: "#38bdf8", accent: "#f43f5e", text: "#ffffff" },
    { bg: "#041c1e", primary: "#2dd4bf", accent: "#ec4899", text: "#ffffff" },
  ];
  const palette = palettes[index % palettes.length];
  
  const html = generateThumbnailHTML(grammar, hook, comp, palette, rng);
  
  return { html, hook, grammar };
}

/**
 * Generate the actual HTML for a thumbnail based on grammar
 */
function generateThumbnailHTML(
  grammar: string,
  hook: string,
  comp: Composition,
  palette: { bg: string; primary: string; accent: string; text: string },
  rng: RNG
): string {
  const title = comp.meta?.title || "Brain Challenge";
  const category = comp.category;
  
  // Extract a short headline from title (max 4-5 words)
  const words = title.split(" ");
  const headline = words.slice(0, Math.min(5, words.length)).join(" ");
  
  switch (grammar) {
    case "giant-question-mark":
      return generateGiantQuestionMark(headline, palette);
    
    case "split-comparison":
      return generateSplitComparison(headline, palette);
    
    case "stat-bar-hero":
      return generateStatBarHero(headline, palette, rng);
    
    case "truth-stamp":
      return generateTruthStamp(headline, palette);
    
    case "impact-number":
      return generateImpactNumber(headline, palette, comp);
    
    case "grid-progression":
      return generateGridProgression(headline, palette);
    
    case "vs-battle":
      return generateVSBattle(headline, palette);
    
    default:
      return generateDefaultUnique(headline, palette, rng);
  }
}

// Grammar implementations
function generateGiantQuestionMark(headline: string, p: { bg: string; primary: string; accent: string; text: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(ellipse 900px 700px at 50% 45%, ${p.primary}22, ${p.bg});display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.qmark{font-size:550px;font-weight:900;color:${p.primary};font-family:Arial,sans-serif;text-shadow:0 20px 60px rgba(0,0,0,0.6);line-height:1;margin-top:-40px}
.headline{position:absolute;bottom:80px;left:80px;right:80px;font-size:52px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:left;line-height:1.2;text-shadow:3px 3px 0 ${p.bg}, 6px 6px 20px rgba(0,0,0,0.5)}
</style></head><body>
<div class="qmark">?</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateSplitComparison(headline: string, p: { bg: string; primary: string; accent: string; text: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;position:relative;overflow:hidden}
.left{position:absolute;left:0;top:0;bottom:0;width:50%;background:${p.primary}}
.right{position:absolute;right:0;top:0;bottom:0;width:50%;background:${p.accent}}
.vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:280px;font-weight:900;color:${p.bg};font-family:Arial,sans-serif;text-shadow:0 15px 40px rgba(0,0,0,0.4)}
.headline{position:absolute;bottom:60px;left:60px;right:60px;font-size:48px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:center;background:${p.bg};padding:30px;border-radius:8px}
</style></head><body>
<div class="left"></div>
<div class="right"></div>
<div class="vs">VS</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateStatBarHero(headline: string, p: { bg: string; primary: string; accent: string; text: string }, rng: RNG): string {
  const percentage = rng.int(5, 98);
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;flex-direction:column;align-items:center;justify-content:center;padding:100px}
.label{font-size:42px;font-weight:700;color:${p.primary};font-family:Arial,sans-serif;margin-bottom:30px;letter-spacing:0.1em}
.track{width:100%;height:100px;border:8px solid ${p.text};border-radius:12px;background:rgba(0,0,0,0.5);overflow:hidden;position:relative}
.fill{height:100%;width:${percentage}%;background:${p.accent};box-shadow:0 0 30px 6px ${p.accent}}
.number{font-size:200px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;margin-top:40px;line-height:1;-webkit-text-stroke:10px ${p.accent};paint-order:stroke fill}
.headline{font-size:44px;font-weight:800;color:${p.text};font-family:Arial,sans-serif;margin-top:30px;text-align:center}
</style></head><body>
<div class="label">CHALLENGE LEVEL</div>
<div class="track"><div class="fill"></div></div>
<div class="number">${percentage}%</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateTruthStamp(headline: string, p: { bg: string; primary: string; accent: string; text: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative}
.stamp{transform:rotate(-12deg);border:20px solid ${p.accent};padding:60px 100px;border-radius:20px;font-size:140px;font-weight:900;color:${p.accent};font-family:Arial,sans-serif;text-align:center;box-shadow:0 30px 80px rgba(0,0,0,0.6)}
.headline{position:absolute;bottom:70px;left:70px;right:70px;font-size:50px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:center;line-height:1.3}
</style></head><body>
<div class="stamp">TRUE?</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateImpactNumber(headline: string, p: { bg: string; primary: string; accent: string; text: string }, comp: Composition): string {
  const scenes = comp.scenes || [];
  const count = Math.max(5, Math.min(99, scenes.length));
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(circle at 50% 40%, ${p.accent}33, ${p.bg} 70%);display:flex;flex-direction:column;align-items:center;justify-content:center}
.number{font-size:380px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;line-height:1;text-shadow:0 0 60px ${p.accent}, 0 20px 50px rgba(0,0,0,0.6);-webkit-text-stroke:8px ${p.accent};paint-order:stroke fill}
.headline{font-size:56px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;margin-top:40px;text-align:center;max-width:900px;line-height:1.3}
</style></head><body>
<div class="number">${count}</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateGridProgression(headline: string, p: { bg: string; primary: string; accent: string; text: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:grid;grid-template-columns:repeat(5,1fr);grid-template-rows:repeat(3,1fr);gap:20px;padding:100px}
.cell{background:${p.primary};border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:80px;color:${p.bg};font-weight:900;transition:all 0.3s}
.cell:nth-child(1){background:${p.accent}}
.cell:nth-child(5){background:${p.accent}}
.cell:nth-child(11){background:${p.accent}}
.overlay{position:fixed;bottom:0;left:0;right:0;background:linear-gradient(to top, ${p.bg}, transparent);padding:60px 80px;font-size:48px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:center}
</style></head><body>
<div class="cell">1</div><div class="cell">2</div><div class="cell">3</div><div class="cell">4</div><div class="cell">5</div>
<div class="cell">6</div><div class="cell">7</div><div class="cell">8</div><div class="cell">9</div><div class="cell">10</div>
<div class="cell">11</div><div class="cell">12</div><div class="cell">13</div><div class="cell">14</div><div class="cell">15</div>
<div class="overlay">${headline}</div>
</body></html>`;
}

function generateVSBattle(headline: string, p: { bg: string; primary: string; accent: string; text: string }): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(135deg, ${p.primary} 0%, ${p.primary} 48%, ${p.bg} 49%, ${p.bg} 51%, ${p.accent} 52%, ${p.accent} 100%);position:relative}
.vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:300px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-shadow:0 0 50px rgba(0,0,0,0.8), 0 20px 60px rgba(0,0,0,0.6)}
.headline{position:absolute;top:70px;left:70px;right:70px;font-size:54px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:center;background:${p.bg};padding:30px;border-radius:12px;box-shadow:0 20px 60px rgba(0,0,0,0.5)}
</style></head><body>
<div class="vs">VS</div>
<div class="headline">${headline}</div>
</body></html>`;
}

function generateDefaultUnique(headline: string, p: { bg: string; primary: string; accent: string; text: string }, rng: RNG): string {
  const shapes = ["circle", "triangle", "square"];
  const shape = rng.pick(shapes);
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8"><style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(ellipse 1000px 800px at 50% 50%, ${p.primary}22, ${p.bg});display:flex;align-items:center;justify-content:center;position:relative}
.shape{width:400px;height:400px;background:${p.accent};${shape === "circle" ? "border-radius:50%" : ""};transform:rotate(${rng.int(-20, 20)}deg);box-shadow:0 30px 80px rgba(0,0,0,0.6)}
.headline{position:absolute;bottom:80px;left:80px;right:80px;font-size:60px;font-weight:900;color:${p.text};font-family:Arial,sans-serif;text-align:center;line-height:1.2;text-shadow:3px 3px 0 ${p.bg}, 6px 6px 30px rgba(0,0,0,0.6)}
</style></head><body>
<div class="shape"></div>
<div class="headline">${headline}</div>
</body></html>`;
}
