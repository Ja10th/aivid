/**
 * Per-video unique thumbnail generation
 * Each video gets a completely unique composition based on its specific content,
 * NOT a template based on its genre category.
 * 
 * Inspired by rich, editorial-style thumbnails with illustrations, textures, and depth
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
  
  // Eye training detection
  const hasEyeTraining = category === "eye_training" || 
    sceneKinds.some(k => ["smooth-pursuit", "saccade", "convergence", "rotation", "tracing"].includes(k)) ||
    title.toLowerCase().includes("eye");
  
  // Extract specific data from scenes
  const riddleData = scenes?.find(s => s.kind === "riddle")?.data as { question?: string; answer?: string } | undefined;
  const mathData = scenes?.find(s => s.kind === "math-question")?.data as { q?: string } | undefined;
  const memoryData = scenes?.find(s => s.kind === "memory-challenge")?.data as { sequence?: number[] } | undefined;
  
  // Build a specific hook based on what's in the video
  if (hasEyeTraining) {
    const exerciseTypes = sceneKinds.filter(k => ["smooth-pursuit", "saccade", "convergence", "rotation", "tracing"].includes(k));
    if (exerciseTypes.length > 0) {
      return `Follow, focus, track — ${exerciseTypes.length} eye movement exercises`;
    }
    return `Guided eye training — strengthen your vision muscles`;
  }
  
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
  
  // EYE TRAINING - calm, medical, focus-oriented
  if (hookLower.includes("eye") || hookLower.includes("follow") || hookLower.includes("track") || hookLower.includes("focus") || hookLower.includes("vision")) {
    return rng.pick([
      "concentric-target",      // Target/bullseye with tracking lines
      "medical-diagram",        // Clean anatomical eye diagram style
      "zen-circle",             // Enso circle with calm typography
      "gradient-orb",           // Smooth gradient sphere to follow
      "focus-crosshair"         // Precision crosshair overlay
    ]);
  }
  
  // RIDDLES - mysterious, question-focused
  if (hookLower.includes("riddle") || hookLower.includes("question") || hookLower.includes("think")) {
    return rng.pick([
      "giant-question-mark",    // We have this
      "lock-and-key",           // Puzzle lock with keyhole
      "magnifying-mystery",     // Giant magnifying glass
      "scattered-clues",        // Evidence board with red string
      "shadow-silhouette"       // Mystery figure in shadow
    ]);
  }
  
  // MEMORY - grids, sequences, patterns
  if (hookLower.includes("sequence") || hookLower.includes("remember") || hookLower.includes("memory") || hookLower.includes("item")) {
    return rng.pick([
      "grid-faces",             // We have this
      "card-flip-grid",         // Memory card game layout
      "numbered-sequence",      // Numbered tiles with one missing
      "brain-network",          // Neural network visualization
      "polaroid-scatter"        // Scattered photos to remember
    ]);
  }
  
  // CHOICES / WOULD YOU RATHER - split, versus, comparison
  if (hookLower.includes("choice") || hookLower.includes("rather") || hookLower.includes("decide") || hookLower.includes("reveal")) {
    return rng.pick([
      "vs-battle",              // We have this
      "split-doors",            // Two doors, different colors
      "scale-balance",          // Tilted balance scale
      "road-fork",              // Path splits into two
      "boxing-ring"             // Two corners, fighting stance
    ]);
  }
  
  // MYTHS / FACTS - stamps, debunking, truth/false
  if (hookLower.includes("myth") || hookLower.includes("debunk") || hookLower.includes("fact") || hookLower.includes("truth") || hookLower.includes("lie")) {
    return rng.pick([
      "truth-stamp",            // We have this
      "red-x-overlay",          // Giant red X with "MYTH" text
      "fact-check-badge",       // Verified checkmark badge
      "newspaper-headline",     // Breaking news style
      "detective-files"         // Case files spread out
    ]);
  }
  
  // POLLS / OPINIONS - voting, stats, percentages
  if (hookLower.includes("poll") || hookLower.includes("vote") || hookLower.includes("opinion")) {
    return rng.pick([
      "hand-raising",           // Silhouette hands raised
      "pie-chart-hero",         // Giant pie chart
      "voting-booth",           // Classic voting booth
      "bar-graph-race",         // Animated bars
      "crowd-silhouettes"       // Audience voting
    ]);
  }
  
  // MATH - equations, numbers, calculations
  if (hookLower.includes("math") || hookLower.includes("calculate") || hookLower.includes("solve") || hookLower.includes("problem")) {
    return rng.pick([
      "chalkboard-equation",    // We have this
      "calculator-closeup",     // Giant calculator display
      "floating-numbers",       // Numbers floating in 3D
      "blueprint-grid",         // Technical grid with equations
      "abacus-vintage"          // Retro abacus aesthetic
    ]);
  }
  
  // CHALLENGES / TESTS - intensity, competition
  if (hookLower.includes("challenge") || hookLower.includes("test") || hookLower.includes("skill") || hookLower.includes("limit")) {
    return rng.pick([
      "boss-hp-bar",            // We have this
      "progress-ring-fire",     // Circular progress on fire
      "stopwatch-pressure",     // Giant ticking stopwatch
      "level-up-badge",         // RPG level up screen
      "mountain-peak"           // Climbing to summit
    ]);
  }
  
  // GAMES / GAMEPLAY
  if (hookLower.includes("game") || hookLower.includes("play") || hookLower.includes("controller") || hookLower.includes("boss")) {
    return rng.pick([
      "boss-hp-bar",            // We have this
      "game-over-glitch",       // Glitchy game over screen
      "arcade-cabinet",         // Retro arcade frame
      "controller-smash",       // Broken controller
      "pixel-art-hero"          // 8-bit character
    ]);
  }
  
  // STORIES - narrative, cinematic
  if (hookLower.includes("story") || hookLower.includes("tale") || hookLower.includes("chapter")) {
    return rng.pick([
      "book-cover",             // Novel cover design
      "typewriter-page",        // Typed manuscript
      "film-strip",             // Cinematic film frames
      "storybook-illustration", // Illustrated page
      "chapter-heading"         // Elegant typography
    ]);
  }
  
  // DEFAULT - wild variety
  return rng.pick([
    "neon-sign",              // We have this
    "torn-photo",             // We have this  
    "isometric-room",         // We have this
    "graffiti-tag",           // Street art style
    "billboard-night",        // Billboard in rain
    "magazine-cover",         // Editorial magazine
    "ticket-stub",            // Torn ticket aesthetic
    "receipt-crumpled"        // Crumpled receipt texture
  ]);
}

/**
 * Generate a unique HTML thumbnail for this specific video
 */
export function generateUniqueThumbnail(comp: Composition, seed: string, index: number = 0): UniqueThumbnailSpec {
  const rng = new RNG(`${seed}-thumb-${index}`);
  const hook = extractHook(comp);
  const grammar = chooseGrammar(hook, rng);
  
  // Rich color palettes with texture colors
  const palettes = [
    { bg: "#0a0f1e", surface: "#1a2847", primary: "#3fe0ff", accent: "#ff2323", text: "#ffffff", muted: "#7a8ba3" },
    { bg: "#1a0f2e", surface: "#2d1a47", primary: "#a855f7", accent: "#ffd23f", text: "#ffffff", muted: "#9b7db8" },
    { bg: "#1a0e0a", surface: "#2d1c15", primary: "#ff6b35", accent: "#3fe0ff", text: "#ffffff", muted: "#a67c5c" },
    { bg: "#0c1821", surface: "#1a2f3d", primary: "#38bdf8", accent: "#f43f5e", text: "#ffffff", muted: "#6b8fa3" },
    { bg: "#041c1e", surface: "#0d3438", primary: "#2dd4bf", accent: "#ec4899", text: "#ffffff", muted: "#5a9a9d" },
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
  palette: { bg: string; surface: string; primary: string; accent: string; text: string; muted: string },
  rng: RNG
): string {
  const title = comp.meta?.title || "Brain Challenge";
  
  // Extract a compelling headline from title
  const words = title.split(" ");
  const headline = words.slice(0, Math.min(6, words.length)).join(" ");
  const shortHeadline = words.slice(0, Math.min(3, words.length)).join(" ");
  
  const numScenes = comp.scenes?.length || 10;
  
  switch (grammar) {
    // Existing grammars
    case "giant-question-mark":
      return generateRiddleSpotlight(headline, palette);
    case "grid-faces":
      return generateFaceGrid(shortHeadline, palette, rng);
    case "chalkboard-equation":
      return generateChalkboard(headline, palette, rng);
    case "boss-hp-bar":
      return generateBossHPBar(headline, palette);
    case "torn-photo":
      return generateTornPhoto(headline, palette, rng);
    case "truth-stamp":
      return generateTruthStamp(headline, palette, numScenes);
    case "neon-sign":
      return generateNeonSign(shortHeadline, palette);
    case "split-comparison":
    case "vs-battle":
      return generateVSBattle(headline, palette);
    case "isometric-room":
      return generateIsometricRoom(shortHeadline, palette);
    
    // Eye training grammars
    case "concentric-target":
      return generateConcentricTarget(headline, palette);
    case "medical-diagram":
      return generateMedicalDiagram(headline, palette);
    case "zen-circle":
      return generateZenCircle(headline, palette);
    case "gradient-orb":
    case "focus-crosshair":
      return generateConcentricTarget(headline, palette); // Reuse similar
    
    // Riddle grammars
    case "lock-and-key":
      return generateLockAndKey(headline, palette);
    case "magnifying-mystery":
      return generateMagnifyingMystery(headline, palette);
    case "scattered-clues":
    case "shadow-silhouette":
      return generateMagnifyingMystery(headline, palette); // Reuse similar
    
    // Memory grammars
    case "card-flip-grid":
      return generateCardFlipGrid(headline, palette);
    case "numbered-sequence":
    case "brain-network":
    case "polaroid-scatter":
      return generateCardFlipGrid(headline, palette); // Reuse grid concept
    
    // Choice grammars (already have split-comparison, vs-battle)
    case "split-doors":
    case "scale-balance":
    case "road-fork":
    case "boxing-ring":
      return generateVSBattle(headline, palette); // Reuse split concept
    
    // Myth/fact grammars (already have truth-stamp)
    case "red-x-overlay":
    case "fact-check-badge":
    case "newspaper-headline":
    case "detective-files":
      return generateTruthStamp(headline, palette, numScenes); // Reuse stamp
    
    // Poll grammars
    case "hand-raising":
      return generateHandRaising(headline, palette, rng);
    case "pie-chart-hero":
    case "voting-booth":
    case "bar-graph-race":
    case "crowd-silhouettes":
      return generateHandRaising(headline, palette, rng); // Reuse hand concept
    
    // Math grammars
    case "calculator-closeup":
      return generateCalculatorCloseup(headline, palette);
    case "floating-numbers":
      return generateFloatingNumbers(headline, palette, rng);
    case "blueprint-grid":
    case "abacus-vintage":
      return generateFloatingNumbers(headline, palette, rng); // Reuse number theme
    
    // Challenge grammars
    case "progress-ring-fire":
    case "level-up-badge":
    case "mountain-peak":
      return generateBossHPBar(headline, palette); // Reuse intensity
    case "stopwatch-pressure":
      return generateStopwatchPressure(headline, palette);
    
    // Game grammars
    case "game-over-glitch":
    case "arcade-cabinet":
    case "controller-smash":
    case "pixel-art-hero":
      return generateBossHPBar(headline, palette); // Reuse game intensity
    
    // Story grammars (not yet implemented - use fallback)
    case "book-cover":
    case "typewriter-page":
    case "film-strip":
    case "storybook-illustration":
    case "chapter-heading":
      return generateTornPhoto(headline, palette, rng); // Paper/literary feel
    
    // Default category grammars (not yet implemented - use existing)
    case "graffiti-tag":
    case "billboard-night":
      return generateNeonSign(shortHeadline, palette);
    case "magazine-cover":
    case "ticket-stub":
    case "receipt-crumpled":
      return generateTornPhoto(headline, palette, rng);
    
    default:
      // Ultimate fallback: use a random implemented grammar
      const fallback = rng.pick(["giant-question-mark", "torn-photo", "neon-sign", "vs-battle"]);
      return generateThumbnailHTML(fallback, hook, comp, palette, rng);
  }
}

// ============ RICH GRAMMAR IMPLEMENTATIONS ============

function generateRiddleSpotlight(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden;font-family:'Poppins',sans-serif}
.spotlight{position:absolute;top:-200px;left:50%;transform:translateX(-50%);width:600px;height:800px;background:radial-gradient(ellipse at center,${p.primary}40 0%,transparent 60%);filter:blur(40px)}
.qmark{position:absolute;top:50%;left:50%;transform:translate(-50%,-60%);font-size:520px;font-weight:900;color:${p.primary};font-family:'Anton',sans-serif;text-shadow:0 30px 80px rgba(0,0,0,0.8),0 0 100px ${p.primary}80;opacity:0.95}
.circle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-8deg);width:480px;height:480px;border:16px solid ${p.accent};border-radius:50%;opacity:0.7}
.headline{position:absolute;bottom:70px;left:70px;right:70px;font-size:56px;font-weight:900;color:${p.text};line-height:1.15;text-shadow:4px 4px 0 ${p.bg},8px 8px 30px rgba(0,0,0,0.7)}
.headline b{color:${p.accent}}
</style></head><body>
<div class="spotlight"></div>
<div class="circle"></div>
<div class="qmark">?</div>
<div class="headline"><b>CAN YOU</b><br>${headline}</div>
</body></html>`;
}

function generateFaceGrid(headline: string, p: any, rng: RNG): string {
  const skinTones = ['#e6c299','#d9a878','#c99a6b','#f0d4ae','#e6c299','#d9a878','#c99a6b','#f0d4ae','#e6c299','#d9a878','#c99a6b','#f0d4ae'];
  const faces = skinTones.map(c => `<div class="cell"><svg width="100%" height="100%" viewBox="0 0 90 110"><ellipse cx="45" cy="50" rx="34" ry="42" fill="${c}"/><circle cx="32" cy="42" r="5" fill="#2a1f14"/><circle cx="58" cy="42" r="5" fill="#2a1f14"/><path d="M32 66 Q45 74 58 66" stroke="#2a1f14" stroke-width="3" fill="none" stroke-linecap="round"/></svg></div>`).join('');
  
  const oddIndex = rng.int(0, 11);
  const ringTop = Math.floor(oddIndex / 4) * 160 + 170;
  const ringLeft = (oddIndex % 4) * 240 + 160;
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Anton&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#eae4d6;position:relative;overflow:hidden}
.grid{position:absolute;inset:40px;display:grid;grid-template-columns:repeat(4,1fr);grid-template-rows:repeat(3,1fr);gap:20px}
.cell{display:flex;align-items:center;justify-content:center;background:#f5f1e8;border:3px solid #d8cfb8;border-radius:8px}
.ring{position:absolute;top:${ringTop}px;left:${ringLeft}px;width:200px;height:200px;border:12px solid ${p.accent};border-radius:50%;box-shadow:0 0 0 8px #eae4d6,0 20px 40px rgba(0,0,0,0.3);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.label{position:absolute;top:${ringTop + 210}px;left:${ringLeft + 100}px;transform:translateX(-50%);font-family:'Anton',sans-serif;font-size:48px;color:${p.accent};text-shadow:3px 3px 0 #eae4d6}
.headline{position:absolute;top:50px;left:50px;font-family:'Archivo Black',sans-serif;font-size:64px;color:#161310;line-height:1.1;max-width:600px}
.headline b{color:${p.accent}}
</style></head><body>
<div class="grid">${faces}</div>
<div class="ring"></div>
<div class="label">!</div>
<div class="headline">SPOT THE<br><b>FAKE</b></div>
</body></html>`;
}

function generateChalkboard(headline: string, p: any, rng: RNG): string {
  const eq = rng.pick(["x² + 7x = 200", "π × r² = ?", "∑(1→n) = ?", "√(x+y) = z"]);
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Caveat:wght@700&family=Permanent+Marker&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1c2b22;position:relative;overflow:hidden}
.board{position:absolute;inset:30px;background:#22392c;box-shadow:inset 0 0 120px rgba(0,0,0,0.6),0 20px 50px rgba(0,0,0,0.7);clip-path:polygon(0 2%,3% 0,97% 1%,100% 4%,99% 97%,96% 100%,2% 99%,0 95%)}
.chalk-eq{position:absolute;top:120px;left:100px;font-family:'Caveat',cursive;font-weight:700;font-size:140px;color:#f2efe4;transform:rotate(-2.5deg);line-height:1}
.circle{position:absolute;top:140px;right:200px;width:320px;height:180px}
.circle ellipse{fill:none;stroke:#ff5757;stroke-width:10;opacity:0.9}
.photo{position:absolute;bottom:0;right:0;width:460px;height:460px;border-radius:50% 0 0 0;overflow:hidden;box-shadow:-30px -30px 80px rgba(0,0,0,0.5);background:radial-gradient(circle at 40% 30%,#6b4a2f,#2c1c10)}
.face{position:absolute;bottom:0;right:80px;width:300px;height:380px}
.caption{position:absolute;bottom:80px;left:100px;font-family:'Caveat',cursive;font-weight:700;font-size:72px;color:#ffd23f;transform:rotate(-2deg);text-shadow:3px 3px 8px rgba(0,0,0,0.6)}
</style></head><body>
<div class="board"></div>
<div class="chalk-eq">${eq}</div>
<svg class="circle" viewBox="0 0 320 180"><ellipse cx="160" cy="90" rx="140" ry="70" transform="rotate(-10 160 90)"/></svg>
<div class="photo">
<svg class="face" viewBox="0 0 300 380"><path d="M80 380 L80 280 Q100 250 110 220 Q80 200 90 150 Q100 90 150 85 Q200 90 210 150 Q220 200 190 220 Q200 250 220 280 L220 380 Z" fill="#c99a6b"/></svg>
</div>
<div class="caption">okay it took<br>6 hours...</div>
</body></html>`;
}

function generateBossHPBar(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(ellipse 1100px 900px at 50% 35%,#4a0f0f,#0d0303 70%);position:relative;overflow:hidden}
.shake{position:absolute;inset:-15px;border:18px solid #ff1414;clip-path:polygon(0 0,3% 2%,8% 0,15% 3%,22% 0,30% 2%,40% 0,50% 3%,60% 0,70% 2%,80% 0,88% 3%,95% 0,100% 2%,100% 100%,92% 98%,85% 100%,75% 97%,65% 100%,55% 98%,45% 100%,35% 97%,25% 100%,15% 98%,5% 100%,0 98%)}
.burst{position:absolute;top:180px;left:400px;width:600px;height:600px;opacity:0.6}
.silhouette{position:absolute;top:30px;right:-60px;width:700px;height:700px;opacity:0.85}
.label{position:absolute;top:80px;left:80px;font-family:'Bebas Neue',sans-serif;font-size:38px;letter-spacing:0.15em;color:#ff8a8a}
.track{position:absolute;top:140px;left:80px;width:660px;height:72px;border:7px solid #fff;border-radius:10px;background:rgba(0,0,0,0.6);overflow:hidden}
.fill{height:100%;width:2%;background:#ff1414;box-shadow:0 0 25px 5px #ff1414;animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:0.7}}
.hp{position:absolute;top:250px;left:80px;font-family:'Anton',sans-serif;font-size:170px;color:#fff;-webkit-text-stroke:11px #ff1414;paint-order:stroke fill;line-height:0.9}
.sub{position:absolute;top:450px;left:85px;font-family:'Anton',sans-serif;font-size:42px;letter-spacing:0.08em;color:#fff}
</style></head><body>
<div class="shake"></div>
<svg class="burst" viewBox="0 0 600 600"><g fill="#ff1414"><polygon points="300,30 340,260 560,300 340,340 300,570 260,340 40,300 260,260"/></g></svg>
<svg class="silhouette" viewBox="0 0 700 700"><path d="M350 60 L460 160 L600 190 L540 330 L600 470 L460 500 L350 640 L240 500 L100 470 L160 330 L100 190 L240 160 Z" fill="#1a0505"/></svg>
<div class="label">BOSS HP</div>
<div class="track"><div class="fill"></div></div>
<div class="hp">1 HP</div>
<div class="sub">LEFT. THAT'S IT.</div>
</body></html>`;
}

function generateTornPhoto(headline: string, p: any, rng: RNG): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&family=Poppins:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.paper{width:900px;height:520px;background:#f9f6ed;position:relative;transform:rotate(-3deg);box-shadow:0 40px 100px rgba(0,0,0,0.7);clip-path:polygon(0 3%,2% 0,98% 1%,100% 3%,99% 97%,97% 100%,3% 99%,0 96%)}
.texture{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.02) 2px,rgba(0,0,0,0.02) 4px);opacity:0.4}
.polaroid{position:absolute;top:40px;left:60px;width:380px;height:420px;background:#fff;padding:20px 20px 60px;box-shadow:0 15px 40px rgba(0,0,0,0.4);transform:rotate(${rng.int(-8, 8)}deg)}
.photo-inner{width:100%;height:280px;background:radial-gradient(circle at 45% 40%,${p.primary}40,${p.surface})}
.marker-text{position:absolute;top:80px;right:100px;font-family:'Permanent Marker',cursive;font-size:82px;color:#2a2314;line-height:1.15;max-width:500px;transform:rotate(${rng.int(-4, 4)}deg)}
.marker-text b{color:${p.accent}}
.arrow{position:absolute;top:340px;right:80px;font-size:120px;color:${p.accent};transform:rotate(20deg)}
</style></head><body>
<div class="paper">
<div class="texture"></div>
<div class="polaroid">
<div class="photo-inner"></div>
</div>
<div class="marker-text">${headline.split(' ').slice(0, 4).join(' ')}<br><b>${headline.split(' ').slice(4).join(' ') || '?'}</b></div>
<div class="arrow">↗</div>
</div>
</body></html>`;
}

function generateTruthStamp(headline: string, p: any, numFacts: number): string {
  const statements = [
    '"I\'ve never left the country."',
    '"I have a twin brother."',
    '"I once met the president."',
    '"I can\'t swim."',
    '"I\'ve broken 4 bones."',
  ];
  const rows = statements.slice(0, Math.min(5, numFacts)).map((s, i) => {
    const isTrue = i === 2;
    return `<div class="strip${isTrue ? ' truth' : ''}" style="top:${i * 144}px"><span class="n">${i + 1}</span><span class="t">${s}</span></div>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Poppins:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#e8e2d4;position:relative;overflow:hidden}
.strip{position:absolute;left:0;right:0;height:144px;display:flex;align-items:center;padding:0 70px;border-bottom:4px solid #17130f;gap:30px}
.strip .n{font-family:'Anton',sans-serif;font-size:64px;color:#c9c0a8;min-width:100px}
.strip .t{font-family:'Poppins',sans-serif;font-weight:700;font-size:36px;color:#17130f;flex:1}
.strip.truth{background:#17130f}
.strip.truth .n{color:#ffd23f}
.strip.truth .t{color:#fff}
.stamp{position:absolute;top:20px;right:90px;font-family:'Anton',sans-serif;font-size:180px;color:#ff2323;opacity:0.9;transform:rotate(12deg);mix-blend-mode:multiply;-webkit-text-stroke:4px #ff2323}
</style></head><body>
${rows}
<div class="stamp">TRUTH?</div>
</body></html>`;
}

function generateNeonSign(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#0a0a0f;position:relative;overflow:hidden}
.brick{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#1a1520,#1a1520 8px,#120d18 8px,#120d18 16px)}
.glow{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:800px;height:400px;background:radial-gradient(ellipse at center,${p.primary}40,transparent 70%);filter:blur(60px)}
.neon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Orbitron',sans-serif;font-weight:900;font-size:120px;color:${p.primary};text-align:center;line-height:1.15;text-shadow:0 0 10px ${p.primary},0 0 20px ${p.primary},0 0 40px ${p.primary},0 0 80px ${p.primary},0 0 120px ${p.primary};animation:flicker 3s ease-in-out infinite}
@keyframes flicker{0%,100%{opacity:1}94%{opacity:0.8}96%{opacity:1}98%{opacity:0.9}}
</style></head><body>
<div class="brick"></div>
<div class="glow"></div>
<div class="neon">${headline.toUpperCase()}</div>
</body></html>`;
}

function generateVSBattle(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;position:relative;overflow:hidden}
.left{position:absolute;left:0;top:0;bottom:0;width:50%;background:${p.primary};clip-path:polygon(0 0,100% 0,85% 100%,0 100%)}
.right{position:absolute;right:0;top:0;bottom:0;width:50%;background:${p.accent};clip-path:polygon(15% 0,100% 0,100% 100%,0 100%)}
.vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Anton',sans-serif;font-size:320px;font-weight:900;color:${p.bg};text-shadow:0 20px 50px rgba(0,0,0,0.5);z-index:10}
.bolt{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:400px;opacity:0.3}
.headline{position:absolute;bottom:70px;left:70px;right:70px;font-family:'Bebas Neue',sans-serif;font-size:54px;color:${p.text};text-align:center;background:${p.bg};padding:35px;border-radius:10px;box-shadow:0 20px 60px rgba(0,0,0,0.6);letter-spacing:0.08em}
</style></head><body>
<div class="left"></div>
<div class="right"></div>
<svg class="bolt" viewBox="0 0 200 400"><polygon points="100,0 80,160 120,160 80,400 140,200 100,200" fill="#fff"/></svg>
<div class="vs">VS</div>
<div class="headline">${headline.toUpperCase()}</div>
</body></html>`;
}

function generateIsometricRoom(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=Poppins:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#050506;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.room{width:760px;height:560px;position:relative}
.light{position:absolute;top:0;left:380px;width:180px;height:720px;background:linear-gradient(180deg,rgba(255,230,180,0.22),transparent 65%)}
.word{position:absolute;bottom:90px;left:100px;font-family:'Archivo Black',sans-serif;font-size:120px;color:#f4ede0;letter-spacing:0.03em}
.word::after{content:'';position:absolute;left:5px;right:5px;bottom:-18px;height:6px;background:${p.accent}}
.sub{position:absolute;bottom:200px;left:105px;font-family:'Poppins',sans-serif;font-weight:700;font-size:26px;letter-spacing:0.18em;color:#8a8478;text-transform:uppercase}
</style></head><body>
<svg class="room" viewBox="0 0 760 560">
<polygon points="0,150 380,30 760,150 760,510 380,560 0,510" fill="#141210"/>
<polygon points="0,150 380,30 760,150 380,260" fill="#1c1917"/>
<polygon points="0,150 380,260 380,560 0,510" fill="#0c0a09"/>
<rect x="520" y="160" width="100" height="200" fill="#100e0c" stroke="#3a352c" stroke-width="5"/>
</svg>
<div class="light"></div>
<div class="sub">CAN YOU ESCAPE?</div>
<div class="word">TRAPPED</div>
</body></html>`;
}

// ============ NEW GRAMMARS FOR EACH CONTENT TYPE ============

// EYE TRAINING GRAMMARS
function generateConcentricTarget(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.target{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.headline{position:absolute;bottom:80px;left:80px;right:80px;font-family:'Inter',sans-serif;font-weight:700;font-size:48px;color:${p.text};text-align:center;letter-spacing:0.02em}
</style></head><body>
<svg class="target" width="500" height="500" viewBox="0 0 500 500">
<circle cx="250" cy="250" r="220" fill="none" stroke="${p.primary}" stroke-width="3" opacity="0.3"/>
<circle cx="250" cy="250" r="180" fill="none" stroke="${p.primary}" stroke-width="3" opacity="0.4"/>
<circle cx="250" cy="250" r="140" fill="none" stroke="${p.primary}" stroke-width="3" opacity="0.5"/>
<circle cx="250" cy="250" r="100" fill="none" stroke="${p.primary}" stroke-width="4" opacity="0.7"/>
<circle cx="250" cy="250" r="60" fill="none" stroke="${p.accent}" stroke-width="4" opacity="0.9"/>
<circle cx="250" cy="250" r="20" fill="${p.accent}"/>
<line x1="0" y1="250" x2="500" y2="250" stroke="${p.muted}" stroke-width="1" opacity="0.3"/>
<line x1="250" y1="0" x2="250" y2="500" stroke="${p.muted}" stroke-width="1" opacity="0.3"/>
</svg>
<div class="headline">FOLLOW • FOCUS • TRACK</div>
</body></html>`;
}

function generateMedicalDiagram(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#f8f9fa;position:relative;overflow:hidden}
.grid{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 19px,#e0e4e8 19px,#e0e4e8 20px),repeating-linear-gradient(90deg,transparent,transparent 19px,#e0e4e8 19px,#e0e4e8 20px)}
.eye{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.label{position:absolute;top:80px;left:80px;font-family:'IBM Plex Mono',sans-serif;font-weight:600;font-size:32px;color:#2d3748;letter-spacing:0.1em}
.subtext{position:absolute;bottom:80px;left:80px;right:80px;font-family:'IBM Plex Mono',sans-serif;font-weight:600;font-size:42px;color:#1a202c;text-align:center}
</style></head><body>
<div class="grid"></div>
<svg class="eye" width="400" height="250" viewBox="0 0 400 250">
<ellipse cx="200" cy="125" rx="180" ry="100" fill="none" stroke="${p.primary}" stroke-width="4"/>
<circle cx="200" cy="125" r="60" fill="none" stroke="${p.accent}" stroke-width="4"/>
<circle cx="200" cy="125" r="30" fill="${p.accent}"/>
<path d="M 50 125 L 20 105 M 50 125 L 20 145" stroke="${p.muted}" stroke-width="2"/>
<path d="M 350 125 L 380 105 M 350 125 L 380 145" stroke="${p.muted}" stroke-width="2"/>
</svg>
<div class="label">EYE TRAINING</div>
<div class="subtext">${headline.toUpperCase()}</div>
</body></html>`;
}

function generateZenCircle(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Noto+Serif:wght@400;700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#f5f1e8;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.circle{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg)}
.text{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Noto Serif',sans-serif;font-weight:700;font-size:54px;color:#2a2520;text-align:center;line-height:1.3}
.zen{position:absolute;top:100px;right:100px;font-family:'Noto Serif',sans-serif;font-weight:400;font-size:28px;color:#6b6158;writing-mode:vertical-rl}
</style></head><body>
<svg class="circle" width="500" height="500" viewBox="0 0 500 500">
<path d="M 450 250 A 200 200 0 1 1 50 250" fill="none" stroke="${p.accent}" stroke-width="40" stroke-linecap="round"/>
</svg>
<div class="zen">平和 · Peace</div>
<div class="text">${headline}</div>
</body></html>`;
}

// RIDDLE GRAMMARS
function generateLockAndKey(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.lock{position:absolute;top:50%;left:50%;transform:translate(-50%,-60%)}
.key{position:absolute;top:65%;left:50%;transform:translate(-50%,0) rotate(25deg)}
.headline{position:absolute;bottom:80px;left:80px;right:80px;font-family:'Cinzel',sans-serif;font-weight:900;font-size:52px;color:${p.text};text-align:center;line-height:1.2}
</style></head><body>
<svg class="lock" width="300" height="350" viewBox="0 0 300 350">
<rect x="50" y="150" width="200" height="180" rx="10" fill="${p.surface}" stroke="${p.primary}" stroke-width="6"/>
<path d="M 100 150 L 100 100 Q 100 20 150 20 Q 200 20 200 100 L 200 150" fill="none" stroke="${p.primary}" stroke-width="6"/>
<circle cx="150" cy="240" r="30" fill="${p.accent}"/>
<rect x="140" y="240" width="20" height="50" fill="${p.accent}"/>
</svg>
<svg class="key" width="200" height="80" viewBox="0 0 200 80">
<circle cx="40" cy="40" r="30" fill="none" stroke="${p.accent}" stroke-width="6"/>
<rect x="60" y="35" width="120" height="10" fill="${p.accent}"/>
<rect x="150" y="25" width="10" height="30" fill="${p.accent}"/>
<rect x="170" y="25" width="10" height="30" fill="${p.accent}"/>
</svg>
<div class="headline">CAN YOU<br>UNLOCK IT?</div>
</body></html>`;
}

function generateMagnifyingMystery(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1612;position:relative;overflow:hidden}
.paper{position:absolute;inset:60px;background:#e8dfc8;box-shadow:inset 0 0 100px rgba(0,0,0,0.2)}
.glass{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-20deg)}
.clue{position:absolute;top:140px;left:120px;font-family:'Special Elite',cursive;font-size:36px;color:#3a2f1e;max-width:500px;line-height:1.6;transform:rotate(-2deg)}
.headline{position:absolute;bottom:100px;right:120px;font-family:'Special Elite',cursive;font-size:56px;color:#a63c2e;transform:rotate(3deg);text-align:right}
</style></head><body>
<div class="paper"></div>
<svg class="glass" width="400" height="400" viewBox="0 0 400 400">
<circle cx="180" cy="180" r="150" fill="rgba(255,255,255,0.1)" stroke="${p.accent}" stroke-width="20"/>
<circle cx="180" cy="180" r="120" fill="none" stroke="${p.accent}" stroke-width="4" opacity="0.5"/>
<rect x="280" y="280" width="30" height="140" rx="15" fill="${p.accent}" transform="rotate(45 295 295)"/>
</svg>
<div class="clue">${headline}</div>
<div class="headline">FIND THE<br>ANSWER</div>
</body></html>`;
}

// MEMORY GRAMMARS
function generateCardFlipGrid(headline: string, p: any): string {
  const cards = Array.from({length: 12}, (_, i) => {
    const row = Math.floor(i / 4);
    const col = i % 4;
    const isFlipped = i === 5 || i === 8;
    return `<rect x="${col * 180 + 100}" y="${row * 200 + 80}" width="150" height="180" rx="8" fill="${isFlipped ? p.accent : p.surface}" stroke="${p.primary}" stroke-width="4"/>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Rubik',sans-serif;font-weight:900;font-size:72px;color:${p.text};text-align:center;z-index:10;text-shadow:4px 4px 0 ${p.bg}}
</style></head><body>
<svg width="1280" height="720">${cards}</svg>
<div class="headline">MATCH<br>THE PAIRS</div>
</body></html>`;
}

// MATH GRAMMARS
function generateCalculatorCloseup(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.surface};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.calc{width:800px;height:600px;background:${p.bg};border-radius:20px;padding:40px;box-shadow:0 30px 80px rgba(0,0,0,0.8)}
.display{background:#1a2a1a;color:${p.accent};font-family:'Orbitron',sans-serif;font-weight:900;font-size:96px;padding:40px;border-radius:10px;text-align:right;margin-bottom:30px}
.buttons{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
.btn{aspect-ratio:1;background:${p.surface};border-radius:10px;display:flex;align-items:center;justify-content:center;font-family:'Orbitron',sans-serif;font-weight:900;font-size:48px;color:${p.text};box-shadow:0 4px 0 rgba(0,0,0,0.3)}
</style></head><body>
<div class="calc">
<div class="display">42</div>
<div class="buttons">
<div class="btn">7</div><div class="btn">8</div><div class="btn">9</div><div class="btn" style="background:${p.accent}">÷</div>
<div class="btn">4</div><div class="btn">5</div><div class="btn">6</div><div class="btn" style="background:${p.accent}">×</div>
</div>
</div>
</body></html>`;
}

function generateFloatingNumbers(headline: string, p: any, rng: RNG): string {
  const numbers = Array.from({length: 20}, () => {
    const x = rng.int(50, 1230);
    const y = rng.int(50, 670);
    const size = rng.int(40, 120);
    const opacity = rng.next() * 0.5 + 0.3;
    const num = rng.pick(['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '+', '−', '×', '÷']);
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${p.primary}" opacity="${opacity}">${num}</text>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Anton',sans-serif;font-size:96px;color:${p.text};text-align:center;z-index:10;background:${p.bg};padding:40px 80px;border-radius:20px;box-shadow:0 20px 60px rgba(0,0,0,0.6)}
</style></head><body>
<svg width="1280" height="720" style="font-family:'Anton',sans-serif">${numbers}</svg>
<div class="headline">${headline}</div>
</body></html>`;
}

// POLL/OPINION GRAMMARS
function generateHandRaising(headline: string, p: any, rng: RNG): string {
  const hands = Array.from({length: 8}, (_, i) => {
    const x = i * 160 + 80;
    const h = rng.int(150, 350);
    return `<path d="M ${x},600 L ${x},${600 - h} L ${x - 20},${600 - h + 40} M ${x},${600 - h} L ${x + 20},${600 - h + 40}" stroke="${p.primary}" stroke-width="16" stroke-linecap="round" fill="none"/>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Bebas Neue',sans-serif;font-size:88px;color:${p.text};text-align:center;letter-spacing:0.05em}
.sub{position:absolute;top:200px;left:80px;right:80px;font-family:'Bebas Neue',sans-serif;font-size:42px;color:${p.muted};text-align:center;letter-spacing:0.15em}
</style></head><body>
<svg width="1280" height="720">${hands}</svg>
<div class="headline">WHAT DO YOU THINK?</div>
<div class="sub">VOTE NOW</div>
</body></html>`;
}

// CHALLENGE GRAMMARS
function generateStopwatchPressure(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Teko:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.watch{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.time{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Teko',sans-serif;font-weight:700;font-size:180px;color:${p.accent};text-shadow:0 0 40px ${p.accent}}
.headline{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Teko',sans-serif;font-weight:700;font-size:64px;color:${p.text};text-align:center;letter-spacing:0.08em}
</style></head><body>
<svg class="watch" width="600" height="600" viewBox="0 0 600 600">
<circle cx="300" cy="300" r="280" fill="none" stroke="${p.primary}" stroke-width="8"/>
<circle cx="300" cy="300" r="260" fill="${p.surface}"/>
${Array.from({length: 12}, (_, i) => {
  const angle = (i * 30 - 90) * Math.PI / 180;
  const x1 = 300 + Math.cos(angle) * 240;
  const y1 = 300 + Math.sin(angle) * 240;
  const x2 = 300 + Math.cos(angle) * 220;
  const y2 = 300 + Math.sin(angle) * 220;
  return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.muted}" stroke-width="6"/>`;
}).join('')}
<line x1="300" y1="300" x2="300" y2="120" stroke="${p.accent}" stroke-width="8" stroke-linecap="round"/>
<line x1="300" y1="300" x2="450" y2="300" stroke="${p.accent}" stroke-width="8" stroke-linecap="round"/>
<circle cx="300" cy="300" r="20" fill="${p.accent}"/>
</svg>
<div class="time">00:10</div>
<div class="headline">BEAT THE CLOCK</div>
</body></html>`;
}

// Update the switch statement to include all new grammars
