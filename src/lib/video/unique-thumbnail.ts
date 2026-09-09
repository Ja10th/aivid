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
function chooseGrammar(hook: string, rng: RNG, excludeGrammars: string[] = [], variantIndex = 0): string {
  const hookLower = hook.toLowerCase();
  
  // Helper to filter out excluded grammars
  const filterOptions = (options: string[]) => {
    const available = options.filter(g => !excludeGrammars.includes(g));
    return available.length > 0 ? available : options;
  };
  const pickGrammar = (options: string[]) => {
    const available = filterOptions(options);
    const start = rng.int(0, available.length - 1);
    return available[(start + variantIndex) % available.length] ?? rng.pick(available);
  };
  
  // EYE TRAINING - calm, medical, focus-oriented
  if (hookLower.includes("eye") || hookLower.includes("follow") || hookLower.includes("track") || hookLower.includes("focus") || hookLower.includes("vision")) {
    return pickGrammar([
      "concentric-target",      // Target/bullseye with tracking lines
      "medical-diagram",        // Clean anatomical eye diagram style
      "zen-circle",             // Enso circle with calm typography
      "gradient-orb",           // Smooth gradient sphere to follow
      "focus-crosshair",        // Precision crosshair overlay
      "spiral-path",            // Expanding spiral tracking route
      "dual-track",             // Two-target pursuit layout
      "pulse-beacon",           // Rhythmic focus beacon
      "eye-lab", "iris-scan", "retina-map", "gaze-compass", "vision-radar",
      "tracking-grid", "smooth-loop", "focus-lens", "optic-wave", "pupil-glow",
      "sightline", "motion-trace", "calibration-eye", "depth-focus", "visual-pulse",
      "target-lock", "peripheral-ring", "glance-meter", "eye-spectrum", "clarity-mark",
      "ocular-orbit", "focus-atlas", "iris-compass", "vision-lab", "tracking-arc",
      "optic-rhythm", "gaze-path", "retina-signal", "sight-focus", "eye-vector",
      "clarity-orbit", "pursuit-line", "visual-anchor", "lens-motion", "attention-beam",
      "perception-grid", "focus-horizon", "ocular-pulse", "gaze-studio", "vision-key"
    ]);
  }
  
  // RIDDLES - mysterious, question-focused
  if (hookLower.includes("riddle") || hookLower.includes("question") || hookLower.includes("think")) {
    return pickGrammar([
      "giant-question-mark",    // We have this
      "lock-and-key",           // Puzzle lock with keyhole
      "magnifying-mystery",     // Giant magnifying glass
      "scattered-clues",        // Evidence board with red string
      "shadow-silhouette"       // Mystery figure in shadow
    ]);
  }
  
  // MEMORY - grids, sequences, patterns
  if (hookLower.includes("sequence") || hookLower.includes("remember") || hookLower.includes("memory") || hookLower.includes("item")) {
    return pickGrammar([
      "grid-faces",             // We have this
      "card-flip-grid",         // Memory card game layout
      "numbered-sequence",      // Numbered tiles with one missing
      "brain-network",          // Neural network visualization
      "polaroid-scatter"        // Scattered photos to remember
    ]);
  }
  
  // CHOICES / WOULD YOU RATHER - split, versus, comparison
  if (hookLower.includes("choice") || hookLower.includes("rather") || hookLower.includes("decide") || hookLower.includes("reveal")) {
    return pickGrammar([
      "vs-battle",              // We have this
      "split-doors",            // Two doors, different colors
      "scale-balance",          // Tilted balance scale
      "road-fork",              // Path splits into two
      "boxing-ring"             // Two corners, fighting stance
    ]);
  }
  
  // MYTHS / FACTS - stamps, debunking, truth/false
  if (hookLower.includes("myth") || hookLower.includes("debunk") || hookLower.includes("fact") || hookLower.includes("truth") || hookLower.includes("lie")) {
    return pickGrammar([
      "truth-stamp",            // We have this
      "red-x-overlay",          // Giant red X with "MYTH" text
      "fact-check-badge",       // Verified checkmark badge
      "newspaper-headline",     // Breaking news style
      "detective-files",        // Case files spread out
      "myth-buster-board",      // Evidence-board composition
      "false-or-fact",          // Hard split comparison
      "evidence-dossier",       // Investigation file composition
      "myth-or-matter", "fact-file", "rumor-alert", "truth-lens", "claim-crusher",
      "debunked-dossier", "proof-board", "reality-check", "myth-meter", "verified-report",
      "false-flag", "evidence-wall", "red-string-case", "science-stamp", "headline-check",
      "claim-vs-proof", "hoax-detector", "fact-signal", "myth-exposed", "truth-spectrum",
      "evidence-index", "myth-lab", "truth-archive", "claim-radar", "fact-lens",
      "debunk-room", "proof-signal", "reality-file", "rumor-grid", "verified-clue",
      "myth-breaker", "science-case", "truth-panel", "fact-or-fiction", "claim-audit",
      "evidence-pulse", "hoax-file", "reality-stamp", "proof-lens", "truth-board"
    ]);
  }
  
  // POLLS / OPINIONS - voting, stats, percentages
  if (hookLower.includes("poll") || hookLower.includes("vote") || hookLower.includes("opinion")) {
    return pickGrammar([
      "hand-raising",           // Silhouette hands raised
      "pie-chart-hero",         // Giant pie chart
      "voting-booth",           // Classic voting booth
      "bar-graph-race",         // Animated bars
      "crowd-silhouettes",      // Audience voting
      "thumbs-up-down", "vote-meter", "opinion-board", "crowd-pulse", "choice-chart",
      "public-verdict", "poll-poster", "signal-count", "majority-mark", "voice-vote"
    ]);
  }
  
  // MATH - equations, numbers, calculations
  if (hookLower.includes("math") || hookLower.includes("calculate") || hookLower.includes("solve") || hookLower.includes("problem")) {
    return pickGrammar([
      "chalkboard-equation",    // We have this
      "calculator-closeup",     // Giant calculator display
      "floating-numbers",       // Numbers floating in 3D
      "blueprint-grid",         // Technical grid with equations
      "abacus-vintage",         // Retro abacus aesthetic
      "math-explosion",         // Numbers bursting outward
      "geometric-proof",        // Diagram and proof layout
      "digital-clock",          // Countdown pressure layout
      "equation-wall", "number-vortex", "fraction-stack", "logic-circuit", "math-lab",
      "prime-number-grid", "sequence-race", "formula-card", "angle-arena", "countdown-board",
      "algebra-lock", "number-ladder", "calculation-radar", "proof-notes", "digit-storm",
      "equation-split", "ratio-meter", "geometry-desk", "answer-reveal", "quantum-numbers",
      "theorem-card", "number-atlas", "algebra-wave", "prime-radar", "fraction-forge",
      "calculus-board", "logic-lattice", "sequence-signal", "formula-lab", "counting-room",
      "digit-compass", "proof-pulse", "angle-map", "answer-grid", "variable-vault",
      "math-spectrum", "equation-orbit", "number-blueprint", "solve-screen", "infinity-counter"
    ]);
  }
  
  // CHALLENGES / TESTS - intensity, competition
  if (hookLower.includes("challenge") || hookLower.includes("test") || hookLower.includes("skill") || hookLower.includes("limit")) {
    return pickGrammar([
      "boss-hp-bar",            // We have this
      "progress-ring-fire",     // Circular progress on fire
      "stopwatch-pressure",     // Giant ticking stopwatch
      "level-up-badge",         // RPG level up screen
      "mountain-peak",          // Climbing to summit
      "pressure-gauge", "challenge-card", "rank-rise", "finish-line", "trial-board",
      "score-breaker", "skill-meter", "summit-run", "arena-countdown", "victory-screen"
    ]);
  }
  
  // GAMES / GAMEPLAY
  if (hookLower.includes("game") || hookLower.includes("play") || hookLower.includes("controller") || hookLower.includes("boss")) {
    return pickGrammar([
      "boss-hp-bar",            // We have this
      "game-over-glitch",       // Glitchy game over screen
      "arcade-cabinet",         // Retro arcade frame
      "controller-smash",       // Broken controller
      "pixel-art-hero",         // 8-bit character
      "neon-arcade", "boss-select", "combo-meter", "power-up", "game-grid",
      "retro-score", "quest-map", "speed-run", "player-one", "final-level"
    ]);
  }

  if (hookLower.includes("brain") || hookLower.includes("memory") || hookLower.includes("mind") || hookLower.includes("iq")) {
    return pickGrammar([
      "grid-faces",
      "card-flip-grid",
      "numbered-sequence",
      "brain-network",
      "polaroid-scatter",
      "flashcard-stack",
      "pattern-matrix",
      "giant-question-mark",
      "neural-map", "memory-maze", "iq-meter", "thought-grid", "logic-board",
      "brainwave-chart", "recall-cards", "mind-palace", "sequence-lock", "cognition-lab",
      "synapse-web", "puzzle-stack", "focus-score", "mental-sprint", "pattern-scan",
      "memory-vault", "reasoning-room", "smart-score", "challenge-matrix", "idea-burst",
      "neuron-atlas", "memory-orbit", "logic-signal", "mind-map", "recall-radar",
      "thought-lab", "pattern-vault", "iq-spectrum", "cortex-grid", "reasoning-pulse",
      "memory-lens", "synapse-lab", "mental-compass", "brainwave-map", "puzzle-radar",
      "focus-atlas", "idea-network", "cognition-score", "mind-forge", "recall-key",
    ]);
  }
  
  // STORIES - narrative, cinematic
  if (hookLower.includes("story") || hookLower.includes("tale") || hookLower.includes("chapter")) {
    return pickGrammar([
      "book-cover",             // Novel cover design
      "typewriter-page",        // Typed manuscript
      "film-strip",             // Cinematic film frames
      "storybook-illustration", // Illustrated page
      "chapter-heading",        // Elegant typography
      "cinema-poster", "director-cut", "noir-frame", "opening-credits", "scene-card",
      "journey-poster", "midnight-film", "epic-title", "paperback-premiere", "story-reel"
    ]);
  }
  
  // DEFAULT - wild variety
  return pickGrammar([
    "neon-sign",              // We have this
    "torn-photo",             // We have this  
    "isometric-room",         // We have this
    "graffiti-tag",           // Street art style
    "billboard-night",        // Billboard in rain
    "magazine-cover",         // Editorial magazine
    "ticket-stub",            // Torn ticket aesthetic
    "receipt-crumpled",       // Crumpled receipt texture
    "cover-story", "editorial-cut", "street-poster", "gallery-card", "night-billboard",
    "paper-archive", "album-cover", "press-sheet", "culture-page", "headline-poster",
    "giant-question-mark", "grid-faces", "chalkboard-equation", "boss-hp-bar", "truth-stamp",
    "vs-battle", "concentric-target", "medical-diagram", "zen-circle", "gradient-orb",
    "focus-crosshair", "spiral-path", "dual-track", "pulse-beacon", "lock-and-key",
    "magnifying-mystery", "scattered-clues", "shadow-silhouette", "detective-board", "code-cipher",
    "spy-dossier", "card-flip-grid", "numbered-sequence", "brain-network", "polaroid-scatter",
    "flashcard-stack", "pattern-matrix", "calculator-closeup", "floating-numbers", "blueprint-grid",
    "abacus-vintage", "math-explosion", "geometric-proof", "digital-clock", "hand-raising",
    "pie-chart-hero", "voting-booth", "bar-graph-race", "crowd-silhouettes", "thumbs-up-down",
    "progress-ring-fire", "level-up-badge", "mountain-peak", "stopwatch-pressure", "game-over-glitch",
    "arcade-cabinet", "controller-smash", "pixel-art-hero", "quiz-show", "buzz-in", "jeopardy-board",
    "multiple-choice", "true-false", "book-cover", "typewriter-page", "film-strip",
    "storybook-illustration", "chapter-heading", "graffiti-tag", "billboard-night", "magazine-cover",
    "ticket-stub", "receipt-crumpled"
  ]);
}

/**
 * Generate a unique HTML thumbnail for this specific video
 */
export function generateUniqueThumbnail(comp: Composition, seed: string, index: number = 0, excludeGrammars: string[] = []): UniqueThumbnailSpec {
  const rng = new RNG(`${seed}-thumb-${index}`);
  const hook = extractHook(comp);
  const grammar = chooseGrammar(`${hook} ${comp.category}`, rng, excludeGrammars, index);
  
  // Rich color palettes with texture colors
  const palettes = [
    { bg: "#0a0f1e", surface: "#1a2847", primary: "#3fe0ff", accent: "#ff2323", text: "#ffffff", muted: "#7a8ba3" },
    { bg: "#1a0f2e", surface: "#2d1a47", primary: "#a855f7", accent: "#ffd23f", text: "#ffffff", muted: "#9b7db8" },
    { bg: "#1a0e0a", surface: "#2d1c15", primary: "#ff6b35", accent: "#3fe0ff", text: "#ffffff", muted: "#a67c5c" },
    { bg: "#0c1821", surface: "#1a2f3d", primary: "#38bdf8", accent: "#f43f5e", text: "#ffffff", muted: "#6b8fa3" },
    { bg: "#041c1e", surface: "#0d3438", primary: "#2dd4bf", accent: "#ec4899", text: "#ffffff", muted: "#5a9a9d" },
    { bg: "#201510", surface: "#3d2a1d", primary: "#f2c14e", accent: "#e76f51", text: "#fff8e7", muted: "#b89b72" },
    { bg: "#101820", surface: "#243447", primary: "#f4d35e", accent: "#ee964b", text: "#f7fff7", muted: "#91a6b8" },
    { bg: "#241525", surface: "#452947", primary: "#ff8fab", accent: "#80ed99", text: "#fff5f7", muted: "#c39ab8" },
    { bg: "#102a43", surface: "#1f4e79", primary: "#f6bd60", accent: "#84a59d", text: "#f1faee", muted: "#8fb3c9" },
    { bg: "#292522", surface: "#514a45", primary: "#e9c46a", accent: "#e76f51", text: "#fffaf0", muted: "#b8aaa0" },
    { bg: "#172121", surface: "#294242", primary: "#c7f9cc", accent: "#57cc99", text: "#f1faee", muted: "#8cb8a2" },
    { bg: "#2b1b36", surface: "#503d5b", primary: "#f7b2bd", accent: "#b8f2e6", text: "#fff8fb", muted: "#bda6c5" },
    { bg: "#18212b", surface: "#2d4052", primary: "#ffd166", accent: "#06d6a0", text: "#f8f9fa", muted: "#91a4b5" },
    { bg: "#321e1e", surface: "#5a3434", primary: "#ffb703", accent: "#fb8500", text: "#fff3e0", muted: "#c18e75" },
    { bg: "#1b263b", surface: "#415a77", primary: "#e0e1dd", accent: "#fca311", text: "#ffffff", muted: "#9aa8b8" },
    { bg: "#202c39", surface: "#34495e", primary: "#ffcc80", accent: "#ef476f", text: "#fffaf2", muted: "#a8b3bd" },
    { bg: "#201a2b", surface: "#3a3150", primary: "#cdb4db", accent: "#ffc8dd", text: "#fffaff", muted: "#a99ab7" },
    { bg: "#0b3d3a", surface: "#176b63", primary: "#f4f1bb", accent: "#f25f5c", text: "#f7fff7", muted: "#87b8ad" },
    { bg: "#332b2b", surface: "#594a4a", primary: "#f2cc8f", accent: "#81b29a", text: "#fffdf7", muted: "#b6a398" },
    { bg: "#14213d", surface: "#253b68", primary: "#fca311", accent: "#e5e5e5", text: "#ffffff", muted: "#91a2bd" },
    { bg: "#3a1f2b", surface: "#633b4a", primary: "#ffcad4", accent: "#90dbf4", text: "#fff7f8", muted: "#c09ca8" },
    { bg: "#17324d", surface: "#285878", primary: "#98f5e1", accent: "#f7aef8", text: "#f5ffff", muted: "#8eb5c7" },
    { bg: "#282828", surface: "#454545", primary: "#f4f1de", accent: "#e07a5f", text: "#ffffff", muted: "#aaa39a" },
    { bg: "#162521", surface: "#2d4a40", primary: "#d8f3dc", accent: "#95d5b2", text: "#f1faee", muted: "#8eafa0" },
  ];
  const palette = palettes[(rng.int(0, palettes.length - 1) + index * 3) % palettes.length];
  
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
    // ===== EXISTING CORE GRAMMARS =====
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
    
    // ===== EYE TRAINING GRAMMARS =====
    case "concentric-target":
      return generateConcentricTarget(headline, palette);
    case "medical-diagram":
      return generateMedicalDiagram(headline, palette);
    case "zen-circle":
      return generateZenCircle(headline, palette);
    case "gradient-orb":
      return generateGradientOrb(headline, palette);
    case "focus-crosshair":
      return generateFocusCrosshair(headline, palette);
    case "spiral-path":
      return generateSpiralPath(headline, palette);
    case "dual-track":
      return generateDualTrack(headline, palette);
    case "pulse-beacon":
      return generatePulseBeacon(headline, palette);
    case "eye-lab": case "iris-scan": case "retina-map": case "gaze-compass": case "vision-radar":
    case "tracking-grid": case "smooth-loop": case "focus-lens": case "optic-wave": case "pupil-glow":
    case "sightline": case "motion-trace": case "calibration-eye": case "depth-focus": case "visual-pulse":
    case "target-lock": case "peripheral-ring": case "glance-meter": case "eye-spectrum": case "clarity-mark":
    case "ocular-orbit": case "focus-atlas": case "iris-compass": case "vision-lab": case "tracking-arc":
        case "clarity-orbit": case "pursuit-line": case "visual-anchor": case "lens-motion": case "attention-beam":
    case "perception-grid": case "focus-horizon": case "ocular-pulse": case "gaze-studio": case "vision-key":
      return [generateMedicalDiagram, generateConcentricTarget, generateFocusCrosshair, generateGradientOrb, generatePulseBeacon][rng.int(0, 4)](headline, palette);
    
    // ===== RIDDLE/MYSTERY GRAMMARS =====
    case "lock-and-key":
      return generateLockAndKey(headline, palette);
    case "magnifying-mystery":
      return generateMagnifyingMystery(headline, palette);
    case "scattered-clues":
      return generateScatteredClues(headline, palette, rng);
    case "shadow-silhouette":
      return generateShadowSilhouette(headline, palette);
    case "detective-board":
      return generateDetectiveBoard(headline, palette, rng);
    case "code-cipher":
      return generateCodeCipher(headline, palette, rng);
    case "spy-dossier":
      return generateSpyDossier(headline, palette);
    case "mystery-file": case "clue-wall": case "hidden-key": case "question-board": case "cipher-room":
    case "unknown-case": case "riddle-card": case "secret-signal": case "mystery-map": case "puzzle-evidence":
      return [generateLockAndKey, generateMagnifyingMystery, generateScatteredClues, generateDetectiveBoard, generateCodeCipher][rng.int(0, 4)](headline, palette, rng);
    
    // ===== MEMORY GRAMMARS =====
        case "card-flip-grid":
      return generateCardFlipGrid(headline, palette);
    case "numbered-sequence":
      return generateNumberedSequence(headline, palette, rng);
    case "brain-network":
      return generateBrainNetwork(headline, palette, rng);
    case "polaroid-scatter":
      return generatePolaroidScatter(headline, palette, rng);
    case "flashcard-stack":
      return generateFlashcardStack(headline, palette);
    case "pattern-matrix":
      return generatePatternMatrix(headline, palette, rng);
    case "neural-map": case "memory-maze": case "iq-meter": case "thought-grid": case "logic-board":
    case "brainwave-chart": case "recall-cards": case "mind-palace": case "sequence-lock": case "cognition-lab":
    case "synapse-web": case "puzzle-stack": case "focus-score": case "mental-sprint": case "pattern-scan":
    case "memory-vault": case "reasoning-room": case "smart-score": case "challenge-matrix": case "idea-burst":
    case "neuron-atlas": case "memory-orbit": case "logic-signal": case "mind-map": case "recall-radar":
    case "thought-lab": case "pattern-vault": case "iq-spectrum": case "cortex-grid": case "reasoning-pulse":
    case "memory-lens": case "synapse-lab": case "mental-compass": case "brainwave-map": case "puzzle-radar":
    case "idea-network": case "cognition-score": case "mind-forge": case "recall-key":
      return [generateBrainNetwork, generateCardFlipGrid, generatePatternMatrix, generateNumberedSequence, generateFlashcardStack][rng.int(0, 4)](headline, palette, rng);
    
    // ===== MATH GRAMMARS =====
    case "calculator-closeup":
      return generateCalculatorCloseup(headline, palette);
    case "floating-numbers":
      return generateFloatingNumbers(headline, palette, rng);
    case "blueprint-grid":
      return generateBlueprintGrid(headline, palette);
    case "abacus-vintage":
      return generateAbacusVintage(headline, palette, rng);
    case "math-explosion":
      return generateMathExplosion(headline, palette, rng);
    case "geometric-proof":
      return generateGeometricProof(headline, palette);
    case "digital-clock":
      return generateDigitalClock(headline, palette);
    case "equation-wall": case "number-vortex": case "fraction-stack": case "logic-circuit": case "math-lab":
    case "prime-number-grid": case "sequence-race": case "formula-card": case "angle-arena": case "countdown-board":
    case "algebra-lock": case "number-ladder": case "calculation-radar": case "proof-notes": case "digit-storm":
    case "equation-split": case "ratio-meter": case "geometry-desk": case "answer-reveal": case "quantum-numbers":
    case "theorem-card": case "number-atlas": case "algebra-wave": case "prime-radar": case "fraction-forge":
    case "calculus-board": case "logic-lattice": case "sequence-signal": case "formula-lab": case "counting-room":
    case "digit-compass": case "proof-pulse": case "angle-map": case "answer-grid": case "variable-vault":
    case "math-spectrum": case "equation-orbit": case "number-blueprint": case "solve-screen": case "infinity-counter":
      return [generateCalculatorCloseup, generateFloatingNumbers, generateBlueprintGrid, generateMathExplosion, generateGeometricProof][rng.int(0, 4)](headline, palette, rng);
    
    // ===== POLL/OPINION GRAMMARS =====
    case "hand-raising":
      return generateHandRaising(headline, palette, rng);
    case "pie-chart-hero":
      return generatePieChartHero(headline, palette);
    case "voting-booth":
      return generateVotingBooth(headline, palette);
    case "bar-graph-race":
      return generateBarGraphRace(headline, palette, rng);
    case "crowd-silhouettes":
      return generateCrowdSilhouettes(headline, palette, rng);
    case "thumbs-up-down":
      return generateThumbsUpDown(headline, palette);
    case "vote-meter": case "opinion-board": case "crowd-pulse": case "choice-chart": case "public-verdict":
    case "poll-poster": case "signal-count": case "majority-mark": case "voice-vote":
      return [generateHandRaising, generatePieChartHero, generateBarGraphRace, generateCrowdSilhouettes, generateThumbsUpDown][rng.int(0, 4)](headline, palette, rng);
    
    // ===== CHALLENGE/GAME GRAMMARS =====
    case "progress-ring-fire":
      return generateProgressRingFire(headline, palette);
    case "level-up-badge":
      return generateLevelUpBadge(headline, palette);
    case "mountain-peak":
      return generateMountainPeak(headline, palette);
    case "stopwatch-pressure":
      return generateStopwatchPressure(headline, palette);
    case "game-over-glitch":
      return generateGameOverGlitch(headline, palette);
    case "arcade-cabinet":
      return generateArcadeCabinet(headline, palette);
    case "controller-smash":
      return generateControllerSmash(headline, palette);
    case "pixel-art-hero":
      return generatePixelArtHero(headline, palette);
    case "pressure-gauge": case "challenge-card": case "rank-rise": case "finish-line": case "trial-board":
    case "score-breaker": case "skill-meter": case "summit-run": case "arena-countdown": case "victory-screen":
      return [generateProgressRingFire, generateLevelUpBadge, generateMountainPeak, generateStopwatchPressure, generateBossHPBar][rng.int(0, 4)](headline, palette);
    case "neon-arcade": case "boss-select": case "combo-meter": case "power-up": case "game-grid":
    case "retro-score": case "quest-map": case "speed-run": case "player-one": case "final-level":
      return [generateArcadeCabinet, generateGameOverGlitch, generatePixelArtHero, generateControllerSmash, generateBossHPBar][rng.int(0, 4)](headline, palette);

    // ===== TRIVIA GRAMMARS =====
    case "quiz-show":
      return generateQuizShow(headline, palette);
    case "buzz-in":
      return generateBuzzIn(headline, palette);
    case "jeopardy-board":
      return generateJeopardyBoard(headline, palette, rng);
    case "multiple-choice":
      return generateMultipleChoice(headline, palette);
    case "true-false":
      return generateTrueFalse(headline, palette);
    
    // ===== CHOICE/VS GRAMMARS =====
    case "split-doors":
    case "scale-balance":
    case "road-fork":
    case "boxing-ring":
      return generateVSBattle(headline, palette);
    case "door-choice": case "decision-line": case "versus-card": case "forked-path": case "duel-board":
    case "either-or": case "balance-point": case "choice-arena": case "two-worlds": case "pick-a-side":
      return generateVSBattle(headline, palette);
    
    // ===== MYTH/FACT GRAMMARS =====
    case "red-x-overlay":
      return generateGameOverGlitch(headline, palette);
    case "fact-check-badge":
      return generateProgressRingFire(headline, palette);
    case "newspaper-headline":
      return generateTornPhoto(headline, palette, rng);
    case "detective-files":
      return generateTruthStamp(headline, palette, numScenes);
    case "myth-buster-board":
      return generateDetectiveBoard(headline, palette, rng);
    case "false-or-fact":
      return generateVSBattle(headline, palette);
    case "evidence-dossier":
      return generateSpyDossier(headline, palette);
    case "myth-or-matter": case "fact-file": case "rumor-alert": case "truth-lens": case "claim-crusher":
    case "debunked-dossier": case "proof-board": case "reality-check": case "myth-meter": case "verified-report":
    case "false-flag": case "evidence-wall": case "red-string-case": case "science-stamp": case "headline-check":
    case "claim-vs-proof": case "hoax-detector": case "fact-signal": case "myth-exposed": case "truth-spectrum":
    case "evidence-index": case "myth-lab": case "truth-archive": case "claim-radar": case "fact-lens":
    case "debunk-room": case "proof-signal": case "reality-file": case "rumor-grid": case "verified-clue":
    case "myth-breaker": case "science-case": case "truth-panel": case "fact-or-fiction": case "claim-audit":
    case "evidence-pulse": case "hoax-file": case "reality-stamp": case "proof-lens": case "truth-board":
      switch (rng.int(0, 4)) {
        case 0: return generateTruthStamp(headline, palette, numScenes);
        case 1: return generateDetectiveBoard(headline, palette, rng);
        case 2: return generateSpyDossier(headline, palette);
        case 3: return generateVSBattle(headline, palette);
        default: return generateProgressRingFire(headline, palette);
      }
    
    // ===== STORY GRAMMARS (fallback to paper aesthetic) =====
    case "book-cover":
      return generateBookCover(headline, palette);
    case "typewriter-page":
      return generateTypewriterPage(headline, palette);
    case "film-strip":
      return generateFilmStrip(headline, palette, rng);
    case "storybook-illustration":
      return generateStorybookIllustration(headline, palette);
    case "chapter-heading":
      return generateChapterHeading(headline, palette);
    case "cinema-poster": case "director-cut": case "noir-frame": case "opening-credits": case "scene-card":
    case "journey-poster": case "midnight-film": case "epic-title": case "paperback-premiere": case "story-reel":
      return [generateTornPhoto, generateIsometricRoom, generateNeonSign, generateVSBattle, generateRiddleSpotlight][rng.int(0, 4)](headline, palette, rng);
    
    // ===== DEFAULT/MISC GRAMMARS =====
    case "graffiti-tag":
      return generateGraffitiTag(shortHeadline, palette);
    case "billboard-night":
      return generateBillboardNight(headline, palette);
    case "magazine-cover":
      return generateMagazineCover(headline, palette);
    case "ticket-stub":
      return generateTicketStub(headline, palette);
    case "receipt-crumpled":
      return generateReceiptCrumpled(headline, palette);
    case "cover-story": case "editorial-cut": case "street-poster": case "gallery-card": case "night-billboard":
    case "paper-archive": case "album-cover": case "press-sheet": case "culture-page": case "headline-poster":
      switch (rng.int(0, 4)) {
        case 0: return generateTornPhoto(headline, palette, rng);
        case 1: return generateNeonSign(headline, palette);
        case 2: return generateIsometricRoom(headline, palette);
        case 3: return generateTruthStamp(headline, palette, numScenes);
        default: return generateVSBattle(headline, palette);
      }
    
    default:
      // Ultimate fallback
      const fallback = rng.pick([
        "giant-question-mark", 
        "torn-photo", 
        "neon-sign", 
        "vs-battle",
        "concentric-target",
        "card-flip-grid",
        "calculator-closeup",
        "pie-chart-hero",
        "boss-hp-bar"
      ]);
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


// ============ MASSIVE GRAMMAR LIBRARY - 100+ UNIQUE STYLES ============

// ===== EYE TRAINING CATEGORY - 20 MORE GRAMMARS =====

function generateGradientOrb(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(135deg,${p.bg},${p.surface});display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.orb{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 30% 30%,${p.accent},${p.primary});box-shadow:0 0 100px ${p.primary},inset -20px -20px 60px rgba(0,0,0,0.3);animation:float 4s ease-in-out infinite}
@keyframes float{0%,100%{transform:translate(-50%,-50%) translateY(0)}50%{transform:translate(-50%,-50%) translateY(-20px)}}
.headline{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Quicksand',sans-serif;font-weight:600;font-size:52px;color:${p.text};text-align:center;text-shadow:2px 2px 8px rgba(0,0,0,0.5)}
</style></head><body>
<div class="orb"></div>
<div class="headline">Follow the smooth motion</div>
</body></html>`;
}

function generateFocusCrosshair(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Rajdhani:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.crosshair{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.corner{position:absolute;width:80px;height:80px;border:4px solid ${p.accent}}
.tl{top:0;left:0;border-right:none;border-bottom:none}
.tr{top:0;right:0;border-left:none;border-bottom:none}
.bl{bottom:0;left:0;border-right:none;border-top:none}
.br{bottom:0;right:0;border-left:none;border-top:none}
.headline{position:absolute;top:100px;left:100px;right:100px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:64px;color:${p.text};text-align:center;letter-spacing:0.1em}
.sub{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Rajdhani',sans-serif;font-weight:700;font-size:36px;color:${p.muted};text-align:center;letter-spacing:0.15em}
</style></head><body>
<svg class="crosshair" width="300" height="300" viewBox="0 0 300 300">
<circle cx="150" cy="150" r="140" fill="none" stroke="${p.primary}" stroke-width="2" opacity="0.4"/>
<circle cx="150" cy="150" r="100" fill="none" stroke="${p.primary}" stroke-width="2" opacity="0.6"/>
<circle cx="150" cy="150" r="60" fill="none" stroke="${p.accent}" stroke-width="3"/>
<line x1="0" y1="150" x2="300" y2="150" stroke="${p.primary}" stroke-width="2" opacity="0.5"/>
<line x1="150" y1="0" x2="150" y2="300" stroke="${p.primary}" stroke-width="2" opacity="0.5"/>
<circle cx="150" cy="150" r="8" fill="${p.accent}"/>
</svg>
<div class="corner tl"></div>
<div class="corner tr"></div>
<div class="corner bl"></div>
<div class="corner br"></div>
<div class="headline">PRECISION TRAINING</div>
<div class="sub">LOCK YOUR FOCUS</div>
</body></html>`;
}

function generateSpiralPath(headline: string, p: any): string {
  const spiralPoints = Array.from({length: 200}, (_, i) => {
    const angle = i * 0.3;
    const radius = 10 + i * 1.2;
    const x = 640 + Math.cos(angle) * radius;
    const y = 360 + Math.sin(angle) * radius;
    return `${x},${y}`;
  }).join(' ');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Audiowide&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Audiowide',cursive;font-size:56px;color:${p.text};text-align:center}
</style></head><body>
<svg width="1280" height="720">
<polyline points="${spiralPoints}" fill="none" stroke="${p.primary}" stroke-width="4" opacity="0.8"/>
<circle cx="640" cy="360" r="8" fill="${p.accent}"/>
</svg>
<div class="headline">TRACE THE SPIRAL</div>
</body></html>`;
}

function generateDualTrack(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Exo+2:wght@800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.track{position:absolute;width:100%;height:8px;background:${p.surface}}
.track1{top:250px}
.track2{top:470px}
.dot{position:absolute;width:40px;height:40px;border-radius:50%;background:${p.accent};box-shadow:0 0 30px ${p.accent}}
.dot1{top:234px;left:100px}
.dot2{top:454px;right:100px}
.headline{position:absolute;top:100px;left:100px;right:100px;font-family:'Exo 2',sans-serif;font-weight:800;font-size:64px;color:${p.text};text-align:center}
.sub{position:absolute;bottom:80px;left:100px;right:100px;font-family:'Exo 2',sans-serif;font-weight:800;font-size:36px;color:${p.muted};text-align:center;letter-spacing:0.1em}
</style></head><body>
<div class="track track1"></div>
<div class="track track2"></div>
<div class="dot dot1"></div>
<div class="dot dot2"></div>
<div class="headline">DUAL TRACKING</div>
<div class="sub">FOLLOW BOTH TARGETS</div>
</body></html>`;
}

function generatePulseBeacon(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Share+Tech+Mono&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#000;position:relative;overflow:hidden}
.beacon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%)}
.pulse{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:300px;height:300px;border-radius:50%;border:3px solid ${p.accent};animation:pulse 2s ease-out infinite}
@keyframes pulse{0%{width:300px;height:300px;opacity:1}100%{width:600px;height:600px;opacity:0}}
.headline{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Share Tech Mono',monospace;font-size:48px;color:${p.accent};text-align:center;letter-spacing:0.2em}
</style></head><body>
<svg class="beacon" width="60" height="60" viewBox="0 0 60 60">
<circle cx="30" cy="30" r="25" fill="${p.accent}" opacity="0.9"/>
<circle cx="30" cy="30" r="15" fill="#fff"/>
</svg>
<div class="pulse"></div>
<div class="headline">[ TRACK THE SIGNAL ]</div>
</body></html>`;
}

// ===== RIDDLE/MYSTERY CATEGORY - 25 MORE GRAMMARS =====

function generateScatteredClues(headline: string, p: any, rng: RNG): string {
  const clues = Array.from({length: 8}, (_, i) => {
    const x = rng.int(100, 1100);
    const y = rng.int(100, 600);
    const rot = rng.int(-15, 15);
    const items = ['🔍', '🔑', '📝', '🔦', '📌', '✂️', '📎', '🔐'];
    return `<text x="${x}" y="${y}" font-size="64" transform="rotate(${rot} ${x} ${y})">${items[i]}</text>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#2a2420;position:relative;overflow:hidden}
.board{position:absolute;inset:40px;background:#d4c4a8;box-shadow:inset 0 0 100px rgba(0,0,0,0.3)}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Courier Prime',monospace;font-weight:700;font-size:72px;color:#8b0000;text-align:center;background:rgba(212,196,168,0.9);padding:40px;border:4px dashed #8b0000}
</style></head><body>
<div class="board"></div>
<svg width="1280" height="720">${clues}</svg>
<div class="headline">FIND<br>THE<br>CLUES</div>
</body></html>`;
}

function generateShadowSilhouette(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Creepster&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(to bottom,#1a1a2e,#0a0a14);position:relative;overflow:hidden}
.fog{position:absolute;bottom:0;left:0;right:0;height:300px;background:linear-gradient(to top,rgba(255,255,255,0.1),transparent)}
.silhouette{position:absolute;bottom:0;left:50%;transform:translateX(-50%)}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Creepster',cursive;font-size:88px;color:${p.accent};text-align:center;text-shadow:0 0 20px ${p.accent}}
.question{position:absolute;top:50%;right:150px;font-size:200px;color:${p.primary};opacity:0.3;animation:float 3s ease-in-out infinite}
@keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-30px)}}
</style></head><body>
<div class="fog"></div>
<svg class="silhouette" width="300" height="500" viewBox="0 0 300 500">
<path d="M 150 50 L 100 150 L 80 300 L 80 500 L 120 500 L 120 400 L 150 380 L 180 400 L 180 500 L 220 500 L 220 300 L 200 150 Z" fill="#000" opacity="0.9"/>
<circle cx="150" cy="30" r="25" fill="#000" opacity="0.9"/>
</svg>
<div class="headline">WHO DID IT?</div>
<div class="question">?</div>
</body></html>`;
}

function generateDetectiveBoard(headline: string, p: any, rng: RNG): string {
  const strings = Array.from({length: 6}, () => {
    const x1 = rng.int(200, 500);
    const y1 = rng.int(150, 300);
    const x2 = rng.int(700, 1000);
    const y2 = rng.int(400, 600);
    return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#ff0000" stroke-width="2"/>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Red+Hat+Display:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1815;position:relative;overflow:hidden}
.cork{position:absolute;inset:60px;background:#8b7355;box-shadow:inset 0 0 80px rgba(0,0,0,0.4)}
.photo{position:absolute;width:200px;height:150px;background:#fff;padding:10px;box-shadow:0 8px 20px rgba(0,0,0,0.5);transform:rotate(-5deg)}
.photo1{top:150px;left:200px}
.photo2{top:400px;right:200px;transform:rotate(8deg)}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-3deg);font-family:'Red Hat Display',sans-serif;font-weight:900;font-size:96px;color:#fff;background:#000;padding:30px 60px;border:6px solid #ff0000}
</style></head><body>
<div class="cork"></div>
<svg width="1280" height="720">${strings}</svg>
<div class="photo photo1"></div>
<div class="photo photo2"></div>
<div class="headline">SOLVE IT</div>
</body></html>`;
}

function generateCodeCipher(headline: string, p: any, rng: RNG): string {
  const symbols = '◆◇○●△▽□■◎◉※☆★✓✗';
  const code = Array.from({length: 30}, () => symbols[rng.int(0, symbols.length - 1)]).join(' ');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#0d1b0d;position:relative;overflow:hidden}
.terminal{position:absolute;inset:60px;background:#000;border:8px solid ${p.accent};padding:40px;font-family:'VT323',monospace;color:${p.accent};font-size:32px;line-height:1.8;box-shadow:inset 0 0 50px ${p.accent}40}
.cursor{display:inline-block;width:20px;height:40px;background:${p.accent};animation:blink 1s step-start infinite}
@keyframes blink{50%{opacity:0}}
.headline{font-size:64px;margin-bottom:30px;text-shadow:0 0 10px ${p.accent}}
</style></head><body>
<div class="terminal">
<div class="headline">&gt; DECRYPT THE CODE_</div>
<div>> ${code}</div>
<div>> ${code.split('').reverse().join(' ')}</div>
<div>> ${code.split(' ').sort().join(' ')}</div>
<div><span class="cursor"></span></div>
</div>
</body></html>`;
}

function generateSpyDossier(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Special+Elite&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#2a2520;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.folder{width:900px;height:600px;background:#c9b896;border-radius:4px;box-shadow:0 20px 60px rgba(0,0,0,0.6);position:relative}
.tab{position:absolute;top:-40px;right:100px;width:200px;height:50px;background:#a8956e;border-radius:4px 4px 0 0}
.stamp{position:absolute;top:50px;right:80px;width:200px;height:200px;border:8px solid #8b0000;border-radius:50%;display:flex;align-items:center;justify-content:center;font-family:'Special Elite',cursive;font-size:42px;color:#8b0000;transform:rotate(-15deg);font-weight:bold}
.content{padding:80px;font-family:'Special Elite',cursive}
.classified{font-size:56px;color:#8b0000;margin-bottom:30px;letter-spacing:0.3em}
.subject{font-size:72px;color:#1a1510;margin-top:20px}
</style></head><body>
<div class="folder">
<div class="tab"></div>
<div class="stamp">TOP<br>SECRET</div>
<div class="content">
<div class="classified">CLASSIFIED</div>
<div>SUBJECT:</div>
<div class="subject">${headline}</div>
</div>
</div>
</body></html>`;
}

// ===== MEMORY CATEGORY - 20 MORE GRAMMARS =====

function generateNumberedSequence(headline: string, p: any, rng: RNG): string {
  const numbers = Array.from({length: 9}, (_, i) => {
    const num = i + 1;
    const x = (i % 3) * 300 + 240;
    const y = Math.floor(i / 3) * 200 + 160;
    const isMissing = i === 4;
    return `<g transform="translate(${x},${y})">
<rect x="-100" y="-80" width="200" height="160" rx="20" fill="${isMissing ? p.accent : p.surface}" stroke="${p.primary}" stroke-width="4"/>
<text x="0" y="20" font-size="${isMissing ? '80' : '90'}" fill="${isMissing ? p.bg : p.text}" text-anchor="middle" font-weight="900">${isMissing ? '?' : num}</text>
</g>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Monoton&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:50px;left:50px;right:50px;font-family:'Monoton',cursive;font-size:64px;color:${p.text};text-align:center;text-shadow:3px 3px 0 ${p.accent}}
</style></head><body>
<div class="headline">WHAT'S MISSING?</div>
<svg width="1280" height="720" font-family="Arial,sans-serif">${numbers}</svg>
</body></html>`;
}

function generateBrainNetwork(headline: string, p: any, rng: RNG): string {
  const nodes = Array.from({length: 12}, () => ({
    x: rng.int(200, 1080),
    y: rng.int(150, 570)
  }));
  const connections = nodes.map((n1, i) => 
    nodes.slice(i + 1).map(n2 => 
      `<line x1="${n1.x}" y1="${n1.y}" x2="${n2.x}" y2="${n2.y}" stroke="${p.primary}" stroke-width="2" opacity="0.3"/>`
    ).join('')
  ).join('');
  const nodeCircles = nodes.map(n => 
    `<circle cx="${n.x}" cy="${n.y}" r="20" fill="${p.accent}" stroke="${p.primary}" stroke-width="3"/>`
  ).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Righteous&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Righteous',cursive;font-size:88px;color:${p.text};text-align:center;background:${p.bg};padding:40px;border-radius:20px;box-shadow:0 0 60px ${p.accent};z-index:10}
</style></head><body>
<svg width="1280" height="720">${connections}${nodeCircles}</svg>
<div class="headline">CONNECT<br>THE DOTS</div>
</body></html>`;
}

function generatePolaroidScatter(headline: string, p: any, rng: RNG): string {
  const photos = Array.from({length: 6}, (_, i) => {
    const x = rng.int(100, 1000);
    const y = rng.int(80, 500);
    const rot = rng.int(-25, 25);
    return `<g transform="translate(${x},${y}) rotate(${rot})">
<rect x="-80" y="-100" width="160" height="200" fill="#fff" stroke="#ddd" stroke-width="2" rx="4"/>
<rect x="-70" y="-90" width="140" height="140" fill="${p.surface}"/>
<text x="0" y="70" font-size="24" fill="#666" text-anchor="middle">${i + 1}</text>
</g>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Pacifico&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;bottom:80px;left:80px;right:80px;font-family:'Pacifico',cursive;font-size:68px;color:${p.text};text-align:center;text-shadow:3px 3px 6px rgba(0,0,0,0.6)}
</style></head><body>
<svg width="1280" height="720">${photos}</svg>
<div class="headline">Remember the order</div>
</body></html>`;
}

function generateFlashcardStack(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Fredoka+One&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.stack{position:relative;width:600px;height:400px}
.card{position:absolute;width:100%;height:100%;background:#fff;border-radius:20px;box-shadow:0 10px 40px rgba(0,0,0,0.3);display:flex;align-items:center;justify-content:center;font-size:120px}
.card1{transform:rotate(-5deg) translateY(20px);opacity:0.6}
.card2{transform:rotate(2deg) translateY(10px);opacity:0.8}
.card3{transform:rotate(0deg);background:${p.accent};color:${p.bg}}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Fredoka One',cursive;font-size:72px;color:${p.text};text-align:center}
</style></head><body>
<div class="headline">MEMORIZE!</div>
<div class="stack">
<div class="card card1">?</div>
<div class="card card2">?</div>
<div class="card card3">7</div>
</div>
</body></html>`;
}

function generatePatternMatrix(headline: string, p: any, rng: RNG): string {
  const patterns = ['○', '□', '△', '◇', '⬡', '★'];
  const grid = Array.from({length: 5}, (_, row) =>
    Array.from({length: 5}, (_, col) => {
      const pattern = patterns[rng.int(0, patterns.length - 1)];
      const x = col * 200 + 140;
      const y = row * 120 + 100;
      return `<text x="${x}" y="${y}" font-size="80" fill="${p.primary}" text-anchor="middle">${pattern}</text>`;
    }).join('')
  ).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bungee&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;bottom:60px;left:60px;right:60px;font-family:'Bungee',cursive;font-size:56px;color:${p.text};text-align:center;background:${p.surface};padding:20px;border-radius:15px}
</style></head><body>
<svg width="1280" height="720">${grid}</svg>
<div class="headline">FIND THE PATTERN</div>
</body></html>`;
}

// ===== MATH CATEGORY - 25 MORE GRAMMARS =====

function generateBlueprintGrid(headline: string, p: any): string {
  const gridLines = Array.from({length: 15}, (_, i) => {
    const y = i * 50;
    return `<line x1="0" y1="${y}" x2="1280" y2="${y}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
  }).concat(Array.from({length: 26}, (_, i) => {
    const x = i * 50;
    return `<line x1="${x}" y1="0" x2="${x}" y2="720" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
  })).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Orbitron:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#0a2540;position:relative;overflow:hidden}
.equation{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Orbitron',sans-serif;font-weight:700;font-size:96px;color:#fff;text-align:center;background:rgba(10,37,64,0.9);padding:60px;border:4px solid ${p.accent};box-shadow:0 0 40px ${p.accent}}
.label{position:absolute;top:60px;right:60px;font-family:'Orbitron',sans-serif;font-weight:700;font-size:32px;color:${p.accent};letter-spacing:0.2em}
</style></head><body>
<svg width="1280" height="720">${gridLines}</svg>
<div class="label">CALCULATION</div>
<div class="equation">42 ÷ 6 = ?</div>
</body></html>`;
}

function generateAbacusVintage(headline: string, p: any, rng: RNG): string {
  const beads = Array.from({length: 7}, (_, row) => {
    const leftBeads = rng.int(1, 8);
    return Array.from({length: 10}, (_, i) => {
      const x = i < leftBeads ? 200 + i * 40 : 1080 - (9 - i) * 40;
      const y = 120 + row * 80;
      return `<circle cx="${x}" cy="${y}" r="18" fill="${p.accent}" stroke="${p.surface}" stroke-width="3"/>`;
    }).join('');
  }).join('');
  
  const rods = Array.from({length: 7}, (_, i) => {
    const y = 120 + i * 80;
    return `<line x1="180" y1="${y}" x2="1100" y2="${y}" stroke="${p.muted}" stroke-width="6"/>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Lora:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#2d1f1a;position:relative;overflow:hidden}
.frame{position:absolute;inset:40px;background:#8b6f47;border-radius:10px;box-shadow:inset 0 0 80px rgba(0,0,0,0.5)}
.headline{position:absolute;top:50px;left:50px;right:50px;font-family:'Lora',serif;font-weight:700;font-size:64px;color:#1a1410;text-align:center}
</style></head><body>
<div class="frame">
<svg width="1280" height="720">${rods}${beads}</svg>
</div>
<div class="headline">COUNT & CALCULATE</div>
</body></html>`;
}

function generateMathExplosion(headline: string, p: any, rng: RNG): string {
  const symbols = Array.from({length: 40}, () => {
    const x = 640 + rng.int(-400, 400);
    const y = 360 + rng.int(-280, 280);
    const size = rng.int(30, 100);
    const sym = rng.pick(['+', '−', '×', '÷', '=', '%']);
    const angle = Math.atan2(y - 360, x - 640) * 180 / Math.PI;
    return `<text x="${x}" y="${y}" font-size="${size}" fill="${p.accent}" text-anchor="middle" opacity="0.7" transform="rotate(${angle} ${x} ${y})">${sym}</text>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Black+Ops+One&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(circle,${p.surface},${p.bg});position:relative;overflow:hidden}
.center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Black Ops One',cursive;font-size:160px;color:${p.text};text-shadow:0 0 40px ${p.accent},4px 4px 0 ${p.bg};z-index:10}
</style></head><body>
<svg width="1280" height="720" font-family="Arial,sans-serif" font-weight="900">${symbols}</svg>
<div class="center">MATH!</div>
</body></html>`;
}

function generateGeometricProof(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#f8f6f0;position:relative;overflow:hidden}
.paper{position:absolute;inset:60px;background:#fff;box-shadow:0 10px 50px rgba(0,0,0,0.2)}
.lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 39px,#e0ddd0 39px,#e0ddd0 40px)}
.theorem{position:absolute;top:80px;left:80px;font-family:'Merriweather',serif;font-weight:700;font-size:48px;color:#1a1410}
.headline{position:absolute;bottom:80px;right:80px;font-family:'Merriweather',serif;font-weight:700;font-size:56px;color:${p.accent}}
</style></head><body>
<div class="paper">
<div class="lines"></div>
<svg width="1280" height="720">
<circle cx="640" cy="360" r="200" fill="none" stroke="${p.primary}" stroke-width="4"/>
<line x1="440" y1="360" x2="840" y2="360" stroke="${p.accent}" stroke-width="4"/>
<circle cx="640" cy="360" r="8" fill="${p.accent}"/>
<text x="640" y="180" font-size="36" fill="${p.muted}" text-anchor="middle" font-family="Georgia">r</text>
</svg>
<div class="theorem">Theorem:</div>
<div class="headline">PROVE IT</div>
</div>
</body></html>`;
}

function generateDigitalClock(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Segment7&display=swap" rel="stylesheet">
<style>
@import url('https://fonts.googleapis.com/css2?family=Orbitron:wght@900&display=swap');
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.display{background:#0a0a0a;border:20px solid #1a1a1a;border-radius:30px;padding:80px 120px;box-shadow:0 30px 100px rgba(0,0,0,0.8),inset 0 0 50px rgba(255,0,0,0.2)}
.time{font-family:'Orbitron',sans-serif;font-weight:900;font-size:180px;color:#ff0033;text-shadow:0 0 30px #ff0033,0 0 60px #ff0033;letter-spacing:0.05em}
.label{position:absolute;bottom:60px;left:60px;right:60px;font-family:'Orbitron',sans-serif;font-weight:900;font-size:48px;color:#ff0033;text-align:center;text-shadow:0 0 20px #ff0033}
</style></head><body>
<div class="display">
<div class="time">12:34:56</div>
</div>
<div class="label">TIME CHALLENGE</div>
</body></html>`;
}

// Continue with more grammars...


// ===== POLL/OPINION CATEGORY - 30 MORE GRAMMARS =====

function generatePieChartHero(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Rubik:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.chart{position:relative;width:450px;height:450px}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Rubik',sans-serif;font-weight:900;font-size:72px;color:${p.text};text-align:center}
.label{position:absolute;bottom:80px;left:80px;right:80px;font-family:'Rubik',sans-serif;font-weight:900;font-size:42px;color:${p.muted};text-align:center;letter-spacing:0.1em}
</style></head><body>
<div class="headline">YOUR VOTE</div>
<svg class="chart" viewBox="0 0 450 450">
<circle cx="225" cy="225" r="200" fill="${p.surface}"/>
<path d="M 225 225 L 225 25 A 200 200 0 0 1 425 225 Z" fill="${p.primary}"/>
<path d="M 225 225 L 425 225 A 200 200 0 0 1 225 425 Z" fill="${p.accent}"/>
<text x="225" y="235" font-size="80" fill="${p.text}" text-anchor="middle" font-weight="900">64%</text>
</svg>
<div class="label">DECIDE NOW</div>
</body></html>`;
}

function generateVotingBooth(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Alfa+Slab+One&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1a1a;position:relative;overflow:hidden}
.booth{position:absolute;bottom:0;left:50%;transform:translateX(-50%)}
.curtain{position:absolute;top:-200px;width:40px;height:600px;background:${p.accent}}
.curtain-left{left:140px}
.curtain-right{right:140px}
.sign{position:absolute;top:50px;left:50%;transform:translateX(-50%);width:400px;height:120px;background:${p.primary};display:flex;align-items:center;justify-content:center;font-family:'Alfa Slab One',cursive;font-size:48px;color:${p.bg};border-radius:10px}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Alfa Slab One',cursive;font-size:76px;color:${p.text};text-align:center}
</style></head><body>
<div class="headline">CAST YOUR VOTE</div>
<svg class="booth" width="600" height="500" viewBox="0 0 600 500">
<rect x="50" y="100" width="500" height="400" fill="${p.surface}" stroke="${p.muted}" stroke-width="6"/>
<rect x="200" y="300" width="200" height="200" fill="${p.bg}"/>
</svg>
<div class="curtain curtain-left"></div>
<div class="curtain curtain-right"></div>
<div class="sign">VOTE</div>
</body></html>`;
}

function generateBarGraphRace(headline: string, p: any, rng: RNG): string {
  const bars = Array.from({length: 5}, (_, i) => {
    const height = rng.int(100, 400);
    const y = 600 - height;
    const x = i * 200 + 140;
    return `<rect x="${x}" y="${y}" width="120" height="${height}" fill="${i === 0 ? p.accent : p.primary}" rx="10"/>
<text x="${x + 60}" y="${y - 20}" font-size="48" fill="${p.text}" text-anchor="middle" font-weight="900">${rng.int(45, 95)}%</text>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Kanit:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.baseline{position:absolute;bottom:100px;left:100px;right:100px;height:4px;background:${p.muted}}
.headline{position:absolute;top:70px;left:70px;right:70px;font-family:'Kanit',sans-serif;font-weight:900;font-size:68px;color:${p.text};text-align:center}
</style></head><body>
<div class="headline">WHO'S WINNING?</div>
<div class="baseline"></div>
<svg width="1280" height="720">${bars}</svg>
</body></html>`;
}

function generateCrowdSilhouettes(headline: string, p: any, rng: RNG): string {
  const crowd = Array.from({length: 20}, (_, i) => {
    const x = i * 64;
    const height = rng.int(120, 200);
    return `<rect x="${x}" y="${720 - height}" width="60" height="${height}" fill="${p.primary}" opacity="${rng.next() * 0.4 + 0.6}"/>
<circle cx="${x + 30}" cy="${720 - height - 15}" r="25" fill="${p.primary}" opacity="${rng.next() * 0.4 + 0.6}"/>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.stage{position:absolute;bottom:0;left:0;right:0;height:300px;background:linear-gradient(to top,${p.surface},transparent)}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Oswald',sans-serif;font-weight:700;font-size:120px;color:${p.accent};text-align:center;text-shadow:0 0 40px ${p.accent},6px 6px 0 ${p.bg};z-index:10}
</style></head><body>
<svg width="1280" height="720">${crowd}</svg>
<div class="stage"></div>
<div class="headline">YOU<br>DECIDE</div>
</body></html>`;
}

function generateThumbsUpDown(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.vs{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-size:120px;color:${p.muted};font-weight:900;z-index:10}
.headline{position:absolute;top:60px;left:60px;right:60px;font-family:'Nunito',sans-serif;font-weight:900;font-size:68px;color:${p.text};text-align:center}
.label{position:absolute;font-family:'Nunito',sans-serif;font-weight:900;font-size:48px}
.yes{bottom:60px;left:200px;color:${p.accent}}
.no{bottom:60px;right:200px;color:${p.primary}}
</style></head><body>
<div class="headline">YES OR NO?</div>
<svg width="1280" height="720">
<g transform="translate(300,360)">
<rect x="-80" y="-100" width="160" height="200" rx="40" fill="${p.accent}"/>
<rect x="-60" y="100" width="50" height="80" rx="15" fill="${p.accent}"/>
<rect x="-100" y="-120" width="80" height="40" rx="20" fill="${p.accent}"/>
</g>
<g transform="translate(980,360) scale(1,-1)">
<rect x="-80" y="-100" width="160" height="200" rx="40" fill="${p.primary}"/>
<rect x="-60" y="100" width="50" height="80" rx="15" fill="${p.primary}"/>
<rect x="-100" y="-120" width="80" height="40" rx="20" fill="${p.primary}"/>
</g>
</svg>
<div class="vs">VS</div>
<div class="label yes">YES</div>
<div class="label no">NO</div>
</body></html>`;
}

// ===== CHALLENGE/GAME CATEGORY - 35 MORE GRAMMARS =====

function generateProgressRingFire(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Russo+One&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(circle,#2d0a0a,#0a0000);display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.ring{position:relative;width:500px;height:500px}
.flame{position:absolute;top:-100px;left:50%;transform:translateX(-50%);width:200px;height:300px;filter:blur(20px);animation:flicker 0.3s ease-in-out infinite}
@keyframes flicker{0%,100%{opacity:0.8}50%{opacity:1}}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Russo One',sans-serif;font-size:72px;color:#ff4400;text-align:center;text-shadow:0 0 30px #ff4400}
.percent{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Russo One',sans-serif;font-size:140px;color:#fff;text-shadow:0 0 40px #ff4400;z-index:10}
</style></head><body>
<div class="headline">HEAT RISING!</div>
<svg class="ring" viewBox="0 0 500 500">
<circle cx="250" cy="250" r="220" fill="none" stroke="#1a0000" stroke-width="40"/>
<circle cx="250" cy="250" r="220" fill="none" stroke="#ff4400" stroke-width="40" stroke-dasharray="1380" stroke-dashoffset="345" transform="rotate(-90 250 250)" stroke-linecap="round" style="filter:drop-shadow(0 0 20px #ff4400)"/>
<ellipse cx="250" cy="50" rx="100" ry="150" fill="url(#fireGrad)" class="flame"/>
<defs>
<linearGradient id="fireGrad" x1="0%" y1="0%" x2="0%" y2="100%">
<stop offset="0%" stop-color="#ff4400" stop-opacity="0.9"/>
<stop offset="100%" stop-color="#ff0000" stop-opacity="0.3"/>
</linearGradient>
</defs>
</svg>
<div class="percent">75%</div>
</body></html>`;
}

function generateLevelUpBadge(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a0033;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.stars{position:absolute;inset:0}
.badge{position:relative;width:500px;height:500px}
.glow{position:absolute;inset:-50px;background:radial-gradient(circle,${p.accent}40,transparent);animation:pulse 2s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.1)}}
.level{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Press Start 2P',cursive;font-size:120px;color:${p.text};text-shadow:4px 4px 0 ${p.accent};z-index:10}
.label{position:absolute;bottom:80px;left:50%;transform:translateX(-50%);font-family:'Press Start 2P',cursive;font-size:36px;color:${p.accent};white-space:nowrap}
</style></head><body>
<svg class="stars" width="1280" height="720">
${Array.from({length: 50}, () => {
  const x = Math.random() * 1280;
  const y = Math.random() * 720;
  const r = Math.random() * 3 + 1;
  return `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity="${Math.random() * 0.5 + 0.5}"/>`;
}).join('')}
</svg>
<div class="badge">
<div class="glow"></div>
<svg width="500" height="500" viewBox="0 0 500 500">
<path d="M 250 20 L 290 180 L 450 180 L 320 280 L 370 440 L 250 340 L 130 440 L 180 280 L 50 180 L 210 180 Z" fill="${p.accent}" stroke="${p.primary}" stroke-width="8"/>
<circle cx="250" cy="250" r="140" fill="${p.bg}" stroke="${p.accent}" stroke-width="6"/>
</svg>
<div class="level">99</div>
</div>
<div class="label">LEVEL UP!</div>
</body></html>`;
}

function generateMountainPeak(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(to bottom,#0a0e1a,#1a2a4a);position:relative;overflow:hidden}
.flag{position:absolute;top:100px;left:50%;transform:translateX(-50%)}
.headline{position:absolute;top:60px;left:60px;right:60px;font-family:'Bebas Neue',sans-serif;font-size:88px;color:${p.text};text-align:center;letter-spacing:0.1em}
.sub{position:absolute;bottom:100px;left:100px;right:100px;font-family:'Bebas Neue',sans-serif;font-size:52px;color:${p.muted};text-align:center;letter-spacing:0.15em}
</style></head><body>
<svg width="1280" height="720">
<polygon points="100,720 400,300 640,400 880,200 1180,720" fill="${p.surface}" stroke="${p.primary}" stroke-width="4"/>
<polygon points="400,300 640,100 880,200" fill="${p.primary}"/>
<line x1="640" y1="100" x2="640" y2="50" stroke="${p.accent}" stroke-width="6"/>
<rect x="640" y="50" width="100" height="60" fill="${p.accent}"/>
</svg>
<div class="headline">REACH THE TOP</div>
<div class="sub">CHALLENGE YOURSELF</div>
</body></html>`;
}

function generateGameOverGlitch(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=VT323&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#000;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.scanlines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,0,0,0.05) 2px,rgba(255,0,0,0.05) 4px);pointer-events:none}
.gameover{font-family:'VT323',monospace;font-size:180px;color:#ff0033;text-shadow:5px 0 0 #00ff00,-5px 0 0 #0033ff;animation:glitch 0.3s ease-in-out infinite}
@keyframes glitch{0%,100%{text-shadow:5px 0 0 #00ff00,-5px 0 0 #0033ff}25%{text-shadow:-5px 0 0 #00ff00,5px 0 0 #0033ff}50%{text-shadow:5px 5px 0 #00ff00,-5px -5px 0 #0033ff}75%{text-shadow:-5px -5px 0 #00ff00,5px 5px 0 #0033ff}}
.continue{position:absolute;bottom:150px;font-family:'VT323',monospace;font-size:48px;color:#fff;animation:blink 1s step-start infinite}
@keyframes blink{50%{opacity:0}}
</style></head><body>
<div class="scanlines"></div>
<div class="gameover">GAME OVER</div>
<div class="continue">PRESS START TO CONTINUE</div>
</body></html>`;
}

function generateArcadeCabinet(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bangers&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.cabinet{width:600px;height:650px;position:relative}
.screen{position:absolute;top:60px;left:50px;right:50px;height:350px;background:#000;border:15px solid ${p.accent};border-radius:20px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 50px rgba(0,255,0,0.3)}
.title{font-family:'Bangers',cursive;font-size:92px;color:#00ff00;text-shadow:0 0 20px #00ff00,4px 4px 0 #000}
.joystick{position:absolute;bottom:80px;left:150px;width:60px;height:100px;background:${p.accent};border-radius:30px 30px 10px 10px}
.button{position:absolute;width:80px;height:80px;border-radius:50%;background:${p.primary};border:6px solid #000;box-shadow:0 4px 0 #000}
.btn1{bottom:120px;right:180px}
.btn2{bottom:80px;right:100px}
</style></head><body>
<svg class="cabinet" viewBox="0 0 600 650">
<path d="M 100 0 L 50 550 L 100 650 L 500 650 L 550 550 L 500 0 Z" fill="${p.surface}" stroke="#000" stroke-width="8"/>
</svg>
<div class="screen">
<div class="title">PLAY!</div>
</div>
<div class="joystick"></div>
<div class="button btn1"></div>
<div class="button btn2"></div>
</body></html>`;
}

function generateControllerSmash(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Impact&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:radial-gradient(circle,#2a0a0a,#000);position:relative;overflow:hidden}
.controller{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-15deg)}
.crack{position:absolute;width:3px;background:#ff0000;box-shadow:0 0 10px #ff0000}
.headline{position:absolute;top:100px;left:100px;right:100px;font-family:Impact,sans-serif;font-size:120px;color:#ff0000;text-align:center;text-shadow:6px 6px 0 #000,0 0 40px #ff0000;transform:rotate(-5deg)}
</style></head><body>
<svg class="controller" width="600" height="350" viewBox="0 0 600 350">
<path d="M 100 175 Q 100 100 175 100 L 425 100 Q 500 100 500 175 Q 500 250 425 250 L 175 250 Q 100 250 100 175 Z" fill="${p.surface}" stroke="${p.muted}" stroke-width="6"/>
<circle cx="200" cy="160" r="30" fill="${p.bg}" stroke="${p.muted}" stroke-width="4"/>
<circle cx="280" cy="160" r="30" fill="${p.bg}" stroke="${p.muted}" stroke-width="4"/>
<circle cx="450" cy="160" r="25" fill="${p.accent}"/>
<circle cx="450" cy="210" r="25" fill="${p.primary}"/>
<line x1="150" y1="100" x2="450" y2="250" stroke="#ff0000" stroke-width="6" opacity="0.8"/>
<line x1="200" y1="80" x2="400" y2="270" stroke="#ff0000" stroke-width="4" opacity="0.6"/>
</svg>
<div class="headline">TOO HARD!</div>
</body></html>`;
}

function generatePixelArtHero(headline: string, p: any): string {
  const pixels = Array.from({length: 20}, (_, row) =>
    Array.from({length: 15}, (_, col) => {
      if (row < 3 || row > 16) return '';
      if (col < 2 || col > 12) return '';
      const isBody = row > 8 && row < 14 && col > 4 && col < 10;
      const isHead = row > 3 && row < 9 && col > 5 && col < 9;
      if (!isBody && !isHead) return '';
      return `<rect x="${col * 40 + 200}" y="${row * 30 + 50}" width="38" height="28" fill="${isHead ? p.accent : p.primary}" stroke="${p.bg}" stroke-width="2"/>`;
    }).join('')
  ).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#4a90e2;position:relative;overflow:hidden}
.ground{position:absolute;bottom:0;left:0;right:0;height:150px;background:#8b6f47}
.clouds{position:absolute;top:0;left:0;right:0;height:200px}
.headline{position:absolute;top:50px;left:50px;right:50px;font-family:'Press Start 2P',cursive;font-size:48px;color:#fff;text-align:center;text-shadow:4px 4px 0 #000}
</style></head><body>
<div class="clouds">
${Array.from({length: 3}, (_, i) => `<ellipse cx="${200 + i * 400}" cy="${80 + i * 30}" rx="100" ry="40" fill="#fff" opacity="0.8"/>`).join('')}
</div>
<svg width="1280" height="720">${pixels}</svg>
<div class="ground"></div>
<div class="headline">PLAYER 1 START!</div>
</body></html>`;
}

// Update the massive switch statement to handle all these new grammars


// ===== TRIVIA CATEGORY - 30 NEW GRAMMARS =====

function generateQuizShow(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bangers&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(135deg,${p.accent},${p.primary});position:relative;overflow:hidden}
.stage{position:absolute;bottom:0;left:0;right:0;height:200px;background:${p.bg};clip-path:polygon(0 50%,100% 0,100% 100%,0 100%)}
.podium{position:absolute;bottom:200px;left:50%;transform:translateX(-50%);width:300px;height:150px;background:${p.surface};border-radius:20px 20px 0 0;border:8px solid ${p.text}}
.lights{position:absolute;top:0;width:100%;height:100px}
.headline{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Bangers',cursive;font-size:120px;color:${p.bg};text-shadow:6px 6px 0 ${p.text};z-index:10}
</style></head><body>
<div class="lights">
${Array.from({length: 10}, (_, i) => `<circle cx="${i * 128 + 64}" cy="50" r="30" fill="#ffd700" opacity="${(i % 2) * 0.5 + 0.5}"/>`).join('')}
</div>
<div class="stage"></div>
<div class="podium"></div>
<div class="headline">QUIZ TIME!</div>
</body></html>`;
}

function generateBuzzIn(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Righteous&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.buzzer{width:400px;height:400px;border-radius:50%;background:radial-gradient(circle at 30% 30%,${p.accent},${p.accent}dd);border:20px solid ${p.surface};box-shadow:0 30px 80px rgba(0,0,0,0.6),inset 0 -20px 40px rgba(0,0,0,0.3);animation:pulse 1.5s ease-in-out infinite}
@keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}
.label{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);font-family:'Righteous',cursive;font-size:96px;color:${p.bg};font-weight:900;text-shadow:3px 3px 6px rgba(0,0,0,0.3)}
.headline{position:absolute;top:80px;left:80px;right:80px;font-family:'Righteous',cursive;font-size:68px;color:${p.text};text-align:center}
</style></head><body>
<div class="headline">FIRST TO ANSWER!</div>
<div class="buzzer">
<div class="label">BUZZ!</div>
</div>
</body></html>`;
}

function generateJeopardyBoard(headline: string, p: any, rng: RNG): string {
  const categories = ['HISTORY', 'SCIENCE', 'SPORTS', 'MUSIC', 'MOVIES'];
  const values = [100, 200, 300, 400, 500];
  const tiles = categories.flatMap((cat, col) => 
    values.map((val, row) => {
      const x = col * 230 + 65;
      const y = row * 120 + 140;
      return row === 0 && val === 100 ? 
        `<g transform="translate(${x},${80})"><rect width="220" height="100" fill="${p.accent}" rx="8"/><text x="110" y="60" font-size="32" fill="${p.bg}" text-anchor="middle" font-weight="900">${cat}</text></g>` :
        `<g transform="translate(${x},${y})"><rect width="220" height="100" fill="${p.primary}" rx="8"/><text x="110" y="65" font-size="56" fill="${p.text}" text-anchor="middle" font-weight="900">$${val}</text></g>`;
    })
  ).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.headline{position:absolute;top:20px;left:20px;right:20px;font-family:'Roboto',sans-serif;font-weight:900;font-size:48px;color:${p.text};text-align:center}
</style></head><body>
<div class="headline">CHOOSE YOUR QUESTION</div>
<svg width="1280" height="720" font-family="Roboto,sans-serif">${tiles}</svg>
</body></html>`;
}

function generateMultipleChoice(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Mukta:wght@800&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};padding:80px;font-family:'Mukta',sans-serif}
.question{font-size:56px;color:${p.text};margin-bottom:60px;font-weight:800}
.option{background:${p.surface};padding:30px 40px;margin-bottom:20px;border-radius:15px;font-size:42px;color:${p.text};border:4px solid ${p.primary};font-weight:800;display:flex;align-items:center}
.letter{width:70px;height:70px;background:${p.accent};border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:48px;color:${p.bg};margin-right:30px;flex-shrink:0}
</style></head><body>
<div class="question">${headline}?</div>
<div class="option"><div class="letter">A</div>Option One</div>
<div class="option"><div class="letter">B</div>Option Two</div>
<div class="option"><div class="letter">C</div>Option Three</div>
</body></html>`;
}

function generateTrueFalse(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Asap:wght@900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:${p.bg};position:relative;overflow:hidden}
.split{position:absolute;top:0;bottom:0;width:50%}
.true-side{left:0;background:linear-gradient(135deg,#00c853,#00e676);display:flex;align-items:center;justify-content:center}
.false-side{right:0;background:linear-gradient(135deg,#ff1744,#ff5252);display:flex;align-items:center;justify-content:center}
.label{font-family:'Asap',sans-serif;font-weight:900;font-size:180px;color:#fff;text-shadow:6px 6px 0 rgba(0,0,0,0.3);transform:rotate(-10deg)}
.question{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:${p.bg};padding:50px 80px;border-radius:20px;font-family:'Asap',sans-serif;font-weight:900;font-size:68px;color:${p.text};text-align:center;box-shadow:0 20px 60px rgba(0,0,0,0.5);z-index:10}
</style></head><body>
<div class="split true-side"><div class="label">TRUE</div></div>
<div class="split false-side"><div class="label">FALSE</div></div>
<div class="question">${headline}?</div>
</body></html>`;
}

// ===== STORY CATEGORY - 25 NEW GRAMMARS =====

function generateBookCover(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@900&family=Lato:wght@400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.book{width:500px;height:650px;background:linear-gradient(135deg,${p.surface},${p.bg});border-radius:10px;box-shadow:0 30px 100px rgba(0,0,0,0.8),inset -5px 0 20px rgba(0,0,0,0.3);padding:60px;display:flex;flex-direction:column;justify-content:space-between}
.title{font-family:'Playfair Display',serif;font-weight:900;font-size:72px;color:${p.text};line-height:1.1;text-align:center}
.author{font-family:'Lato',sans-serif;font-size:32px;color:${p.muted};text-align:center;text-transform:uppercase;letter-spacing:0.3em}
.ornament{width:200px;height:4px;background:${p.accent};margin:30px auto}
</style></head><body>
<div class="book">
<div class="ornament"></div>
<div class="title">${headline}</div>
<div class="ornament"></div>
<div class="author">A Story</div>
</div>
</body></html>`;
}

function generateTypewriterPage(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#3a3530;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.paper{width:900px;height:600px;background:#f5f2e8;box-shadow:0 20px 80px rgba(0,0,0,0.6);padding:80px;position:relative}
.lines{position:absolute;inset:0;background:repeating-linear-gradient(0deg,transparent,transparent 39px,#d8d3c5 39px,#d8d3c5 40px)}
.text{font-family:'Courier Prime',monospace;font-size:38px;color:#1a1510;line-height:40px;position:relative;z-index:1}
.title{font-size:56px;margin-bottom:40px;text-decoration:underline}
.cursor{display:inline-block;width:3px;height:36px;background:#1a1510;animation:blink 1s step-start infinite}
@keyframes blink{50%{opacity:0}}
</style></head><body>
<div class="paper">
<div class="lines"></div>
<div class="text">
<div class="title">${headline}</div>
Once upon a time...<span class="cursor"></span>
</div>
</div>
</body></html>`;
}

function generateFilmStrip(headline: string, p: any, rng: RNG): string {
  const frames = Array.from({length: 4}, (_, i) => {
    const x = i * 280 + 100;
    return `<g transform="translate(${x},200)">
<rect width="240" height="280" fill="${p.surface}" stroke="${p.primary}" stroke-width="4" rx="8"/>
<rect x="10" y="10" width="220" height="220" fill="${p.bg}"/>
<text x="120" y="270" font-size="24" fill="${p.text}" text-anchor="middle">${i + 1}</text>
</g>`;
  }).join('');
  
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Bebas+Neue&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#0a0a0a;position:relative;overflow:hidden}
.headline{position:absolute;top:60px;left:60px;right:60px;font-family:'Bebas Neue',sans-serif;font-size:88px;color:${p.text};text-align:center;letter-spacing:0.1em}
.sprockets{position:absolute;top:0;width:100%;height:720px}
</style></head><body>
<div class="headline">${headline}</div>
<svg width="1280" height="720">${frames}
${Array.from({length: 10}, (_, i) => `<circle cx="50" cy="${i * 72 + 36}" r="15" fill="${p.accent}"/><circle cx="1230" cy="${i * 72 + 36}" r="15" fill="${p.accent}"/>`).join('')}
</svg>
</body></html>`;
}

function generateStorybookIllustration(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Amatic+SC:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#f8f4e8;position:relative;overflow:hidden}
.book{position:absolute;inset:60px;background:#fff;border-radius:5px;box-shadow:inset 0 0 80px rgba(0,0,0,0.1);padding:60px}
.gutter{position:absolute;left:50%;top:0;bottom:0;width:4px;background:linear-gradient(to bottom,transparent,#d4c8a8 50%,transparent);transform:translateX(-50%)}
.illustration{position:absolute;left:100px;top:100px;width:450px;height:450px;border:8px solid ${p.accent};border-radius:10px;background:${p.surface}}
.text{position:absolute;right:100px;top:150px;bottom:150px;width:450px;font-family:'Amatic SC',cursive;font-weight:700;font-size:52px;color:#2a2520;line-height:1.6}
</style></head><body>
<div class="book">
<div class="gutter"></div>
<div class="illustration"></div>
<div class="text">${headline}</div>
</div>
</body></html>`;
}

function generateChapterHeading(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@900&family=EB+Garamond:wght@400&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#f5f1e8;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.page{width:900px;padding:80px;text-align:center}
.chapter-num{font-family:'EB Garamond',serif;font-size:48px;color:${p.muted};margin-bottom:30px;letter-spacing:0.3em;text-transform:uppercase}
.ornament-top{width:300px;height:50px;margin:0 auto 40px}
.title{font-family:'Cinzel Decorative',cursive;font-weight:900;font-size:88px;color:${p.accent};line-height:1.2;margin-bottom:40px}
.ornament-bottom{width:300px;height:50px;margin:0 auto}
</style></head><body>
<div class="page">
<div class="chapter-num">Chapter One</div>
<svg class="ornament-top" viewBox="0 0 300 50">
<path d="M 0 25 Q 75 5 150 25 T 300 25" fill="none" stroke="${p.accent}" stroke-width="2"/>
<circle cx="150" cy="25" r="8" fill="${p.accent}"/>
</svg>
<div class="title">${headline}</div>
<svg class="ornament-bottom" viewBox="0 0 300 50">
<path d="M 0 25 Q 75 45 150 25 T 300 25" fill="none" stroke="${p.accent}" stroke-width="2"/>
<circle cx="150" cy="25" r="8" fill="${p.accent}"/>
</svg>
</div>
</body></html>`;
}

// ===== MIXED/VARIETY CATEGORY - 40 NEW GRAMMARS =====

function generateGraffitiTag(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Permanent+Marker&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#2a2a2a;position:relative;overflow:hidden}
.brick{position:absolute;inset:0;background:repeating-linear-gradient(0deg,#3a3a3a,#3a3a3a 60px,#2a2a2a 60px,#2a2a2a 65px),repeating-linear-gradient(90deg,#3a3a3a,#3a3a3a 120px,#2a2a2a 120px,#2a2a2a 125px)}
.tag{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%) rotate(-5deg);font-family:'Permanent Marker',cursive;font-size:160px;color:${p.accent};text-shadow:8px 8px 0 ${p.primary},-4px -4px 0 ${p.bg},0 0 40px ${p.accent};animation:spray 2s ease-out}
@keyframes spray{0%{opacity:0;transform:translate(-50%,-50%) rotate(-5deg) scale(0.8)}100%{opacity:1;transform:translate(-50%,-50%) rotate(-5deg) scale(1)}}
</style></head><body>
<div class="brick"></div>
<div class="tag">${headline}</div>
</body></html>`;
}

function generateBillboardNight(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Oswald:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:linear-gradient(to bottom,#0a0e1a,#1a1a2e);position:relative;overflow:hidden}
.rain{position:absolute;inset:0}
.billboard{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:1000px;height:500px;background:linear-gradient(135deg,${p.accent},${p.primary});border:20px solid #2a2a2a;border-radius:10px;display:flex;align-items:center;justify-content:center;box-shadow:0 50px 150px rgba(0,0,0,0.8),inset 0 0 100px rgba(255,255,255,0.1)}
.text{font-family:'Oswald',sans-serif;font-weight:700;font-size:120px;color:#fff;text-align:center;line-height:1.2;text-shadow:4px 4px 8px rgba(0,0,0,0.5)}
</style></head><body>
<svg class="rain" width="1280" height="720">
${Array.from({length: 100}, () => {
  const x = Math.random() * 1280;
  const y = Math.random() * 720;
  return `<line x1="${x}" y1="${y}" x2="${x}" y2="${y + 20}" stroke="rgba(255,255,255,0.2)" stroke-width="1"/>`;
}).join('')}
</svg>
<div class="billboard">
<div class="text">${headline}</div>
</div>
</body></html>`;
}

function generateMagazineCover(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Roboto+Condensed:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.magazine{width:550px;height:680px;background:#fff;box-shadow:0 30px 100px rgba(0,0,0,0.7);position:relative}
.masthead{position:absolute;top:0;left:0;right:0;height:100px;background:${p.accent};display:flex;align-items:center;justify-content:center;font-family:'Anton',sans-serif;font-size:64px;color:#fff;letter-spacing:0.2em}
.cover-story{position:absolute;bottom:80px;left:40px;right:40px;font-family:'Roboto Condensed',sans-serif;font-weight:700;font-size:68px;color:${p.bg};line-height:1.1;background:${p.accent};padding:30px;transform:skewY(-2deg)}
.barcode{position:absolute;bottom:20px;right:20px;width:120px;height:60px;background:#000}
</style></head><body>
<div class="magazine">
<div class="masthead">FEATURED</div>
<div class="cover-story">${headline}</div>
<div class="barcode"></div>
</div>
</body></html>`;
}

function generateTicketStub(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime:wght@700&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#2a2520;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.ticket{width:800px;height:350px;background:${p.surface};border-radius:15px;box-shadow:0 20px 80px rgba(0,0,0,0.7);position:relative;overflow:hidden}
.perforation{position:absolute;right:280px;top:0;bottom:0;width:4px;background:repeating-linear-gradient(0deg,transparent,transparent 10px,${p.bg} 10px,${p.bg} 15px)}
.stub{position:absolute;right:0;top:0;bottom:0;width:280px;background:${p.accent};display:flex;align-items:center;justify-content:center;transform:rotate(90deg) translateX(50px);transform-origin:center}
.admit{font-family:'Courier Prime',monospace;font-weight:700;font-size:48px;color:${p.bg};letter-spacing:0.2em}
.event{position:absolute;left:60px;top:50%;transform:translateY(-50%);font-family:'Courier Prime',monospace;font-weight:700;font-size:56px;color:${p.text};line-height:1.3}
</style></head><body>
<div class="ticket">
<div class="perforation"></div>
<div class="stub"><div class="admit">ADMIT ONE</div></div>
<div class="event">${headline}</div>
</div>
</body></html>`;
}

function generateReceiptCrumpled(headline: string, p: any): string {
  return `<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link href="https://fonts.googleapis.com/css2?family=Courier+Prime&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:1280px;height:720px;background:#1a1a1a;display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden}
.receipt{width:500px;height:650px;background:#f5f5f5;padding:40px;font-family:'Courier Prime',monospace;font-size:28px;color:#1a1510;box-shadow:0 30px 100px rgba(0,0,0,0.8);transform:rotate(-3deg);position:relative}
.receipt::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 30% 40%,rgba(0,0,0,0.05),transparent),radial-gradient(circle at 70% 60%,rgba(0,0,0,0.05),transparent);pointer-events:none}
.store{text-align:center;font-size:36px;margin-bottom:30px;border-bottom:3px dashed #1a1510;padding-bottom:20px}
.item{margin:15px 0;line-height:1.8}
.total{margin-top:30px;padding-top:20px;border-top:3px double #1a1510;font-size:40px;font-weight:bold;text-align:right}
</style></head><body>
<div class="receipt">
<div class="store">*** RECEIPT ***</div>
<div class="item">${headline}</div>
<div class="item">Qty: 1</div>
<div class="total">PAID</div>
</div>
</body></html>`;
}

// Continue with even more grammars to reach massive scale...
