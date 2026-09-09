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
  
  // Grammar selection based on hook content - only return grammars we ACTUALLY implement
  if (hookLower.includes("eye") || hookLower.includes("follow") || hookLower.includes("track") || hookLower.includes("focus") || hookLower.includes("vision")) {
    return rng.pick(["neon-sign", "torn-photo", "isometric-room"]); // Calming, focused aesthetics
  }
  
  if (hookLower.includes("riddle") || hookLower.includes("question") || hookLower.includes("think")) {
    return "giant-question-mark"; // We have this one
  }
  
  if (hookLower.includes("sequence") || hookLower.includes("remember") || hookLower.includes("memory") || hookLower.includes("item")) {
    return "grid-faces"; // We have this one
  }
  
  if (hookLower.includes("choice") || hookLower.includes("rather") || hookLower.includes("decide") || hookLower.includes("reveal")) {
    return rng.pick(["split-comparison", "vs-battle"]); // We have both
  }
  
  if (hookLower.includes("myth") || hookLower.includes("debunk") || hookLower.includes("fact") || hookLower.includes("truth") || hookLower.includes("lie")) {
    return "truth-stamp"; // We have this one
  }
  
  if (hookLower.includes("poll") || hookLower.includes("vote") || hookLower.includes("opinion")) {
    return rng.pick(["torn-photo", "neon-sign"]); // We have these
  }
  
  if (hookLower.includes("math") || hookLower.includes("calculate") || hookLower.includes("solve") || hookLower.includes("problem")) {
    return "chalkboard-equation"; // We have this one
  }
  
  if (hookLower.includes("challenge") || hookLower.includes("test") || hookLower.includes("skill") || hookLower.includes("limit")) {
    return "boss-hp-bar"; // We have this one
  }
  
  if (hookLower.includes("game") || hookLower.includes("play") || hookLower.includes("controller") || hookLower.includes("boss")) {
    return "boss-hp-bar"; // Reuse boss HP bar for game content
  }
  
  // Default grammars - all implemented
  return rng.pick(["torn-photo", "neon-sign", "vs-battle", "isometric-room"]);
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
    
    default:
      // Fallback: use a random implemented grammar
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
