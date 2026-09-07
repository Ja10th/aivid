import {
  CATEGORIES,
  Composition,
  FONTS,
  Orientation,
  PALETTES,
  RNG,
  Scene,
  SceneKind,
  VOICES,
  BgStyle,
  estimateSpeech,
  Palette,
  Mood,
} from "./core";

const TRANSITIONS: Scene["transition"][] = ["cut", "fade", "wipe", "zoom", "slide", "iris"];
const BGS: BgStyle[] = ["solid", "gradient", "grid", "dots", "noise", "rays", "diagonal", "blobs", "rings"];

interface Ctx {
  rng: RNG;
  orientation: Orientation;
  palettes: Palette[];
  sceneCount: number;
  scenes: Scene[];
  t: number;
}

function push(ctx: Ctx, kind: SceneKind, duration: number, data: Record<string, unknown>, narration?: string, opts?: Partial<Scene>) {
  const pal = ctx.palettes[ctx.sceneCount % ctx.palettes.length];
  const sc: Scene = {
    id: `s${ctx.sceneCount}`,
    kind,
    start: ctx.t,
    duration,
    transition: ctx.sceneCount === 0 ? "cut" : ctx.rng.pick(TRANSITIONS),
    palette: pal,
    bgStyle: ctx.rng.pick(BGS),
    narration,
    narrationAt: opts?.narrationAt ?? 0.4,
    data,
    ...opts,
  };
  ctx.scenes.push(sc);
  ctx.sceneCount++;
  ctx.t += duration;
  return sc;
}

// ---------------- EYE TRAINING ----------------
const EYE_INTROS = [
  "Welcome to today's eye training session. Sit comfortably, keep your head still, and let only your eyes move.",
  "This is a guided eye workout. Relax your shoulders, breathe slowly, and follow the shapes with your eyes only.",
  "Let's give your eyes a gentle workout. Keep your head steady and stay about an arm's length from the screen.",
  "Time to train your eyes. Blink naturally, keep your neck relaxed, and follow every movement smoothly.",
];
const FOLLOW_PATHS = ["circle", "figure8", "lissajous", "zigzag", "spiral", "wave", "square", "random"] as const;
const FOLLOW_LINES: Record<string, string[]> = {
  circle: ["Follow the dot as it travels in a circle. Keep the motion smooth, no jumping ahead.", "Trace the circle with your eyes. Smooth and steady."],
  figure8: ["Now a figure eight. Let your eyes glide through the crossing point without stopping.", "Follow the infinity loop. Relax your brow as you track it."],
  lissajous: ["This path is a little unpredictable. Stay locked onto the dot and let your eyes flow.", "A weaving pattern now. Keep breathing while you track it."],
  zigzag: ["Sharp zigzags. Change direction quickly but keep your head perfectly still.", "Follow the zigzag. Fast turns, smooth tracking."],
  spiral: ["A spiral, outward then inward. Notice how far your eyes can comfortably reach.", "Track the spiral to the edge and back to center."],
  wave: ["A slow horizontal wave. This trains smooth pursuit from side to side.", "Ride the wave with your eyes, left to right and back."],
  square: ["Now a square path. Hold each corner briefly, then move along the edge.", "Trace the square. Corners are pauses, edges are smooth."],
  random: ["The dot will wander randomly. Stay with it, and don't anticipate.", "Free roaming dot. React, don't predict."],
};

function eyeTraining(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, { title: r.pick(["Eye Workout", "Eye Training", "Vision Drills", "Eye Gym", "Focus & Track"]), sub: r.pick(["Guided session", "Follow with your eyes only", "Keep your head still", "Daily routine"]) }, r.pick(EYE_INTROS));
  let round = 0;
  while (ctx.t < target - 12) {
    const drill = r.pick(["follow", "follow", "saccade", "focus", "peripheral", "palming", "breathing"]);
    round++;
    if (drill === "follow") {
      const path = r.pick(FOLLOW_PATHS);
      const dur = r.int(22, 48);
      push(ctx, "eye-follow", dur, { path, speed: r.range(0.5, 1.4), size: r.int(14, 34), shape: r.pick(["dot", "ring", "star", "square", "diamond"]), trail: r.chance(0.5), rotateDir: r.chance(0.5) ? 1 : -1 }, r.pick(FOLLOW_LINES[path]));
    } else if (drill === "saccade") {
      const dur = r.int(20, 40);
      push(ctx, "eye-saccade", dur, { interval: r.range(0.7, 1.6), positions: r.int(2, 6), style: r.pick(["horizontal", "vertical", "diagonal", "corners", "random"]), size: r.int(18, 40) }, r.pick(["Now quick jumps. When the target appears, snap your eyes to it as fast as you can.", "Saccade drill. Jump to each new target immediately, then hold until the next one.", "Rapid targets now. Land your eyes precisely on each one."]));
    } else if (drill === "focus") {
      const dur = r.int(18, 36);
      push(ctx, "eye-focus", dur, { period: r.range(3, 6), shape: r.pick(["ring", "hex", "letter"]), letter: r.pick(["E", "A", "K", "8", "Z"]) }, r.pick(["Focus shift. As the shape grows, imagine it coming close. As it shrinks, let your focus relax into the distance.", "Near and far. Keep the shape crisp as it changes size.", "This drill relaxes your focusing muscles. Follow the size change and blink when you need to."]));
    } else if (drill === "peripheral") {
      const dur = r.int(20, 38);
      push(ctx, "eye-peripheral", dur, { flashEvery: r.range(0.9, 1.8), count: r.int(1, 3), spread: r.range(0.3, 0.46) }, r.pick(["Peripheral vision. Keep your eyes fixed on the center mark and simply notice the shapes appearing at the edges. Do not look at them.", "Stare only at the center. Count the shapes that flash around it using your side vision.", "Fix your gaze on the middle. Everything else is noticed, never chased."]));
    } else if (drill === "palming") {
      push(ctx, "eye-palming", r.int(12, 20), {}, r.pick(["Rest time. Rub your palms together until warm, then cup them gently over your closed eyes. Breathe.", "Close your eyes and cover them with warm palms. Let the darkness relax everything.", "Palming break. Eyes closed, palms cupped, slow breaths."]));
    } else {
      push(ctx, "breathing", r.int(16, 28), { inhale: r.int(3, 5), hold: r.int(1, 3), exhale: r.int(4, 6) }, r.pick(["A short breathing reset. Follow the circle, in as it grows, out as it shrinks.", "Breathe with the circle. Slow in, slow out."]));
    }
    if (round % 3 === 0 && r.chance(0.6)) push(ctx, "interlude", r.int(4, 7), { text: r.pick(["Blink a few times", "Relax your jaw", "Shoulders down", "Halfway there", "Keep your head still", "You're doing great"]) });
  }
  push(ctx, "outro", 9, { text: r.pick(["Session complete", "Well done", "See you tomorrow", "Eyes refreshed"]) }, r.pick(["That's the end of the session. Blink a few times, look at something far away, and enjoy the rest of your day.", "Great work. Do this once a day and your eyes will thank you. Subscribe for a new routine tomorrow.", "Session complete. Remember to rest your eyes every twenty minutes when working on screens."]));
}

// ---------------- MATH ----------------
function mathProblem(r: RNG, level: number): { q: string; a: string; speak: string } {
  const kind = r.pick(level < 2 ? ["add", "sub", "mul"] : level < 4 ? ["add", "sub", "mul", "div", "square", "percent"] : ["mul", "div", "square", "percent", "mixed", "root"]);
  switch (kind) {
    case "add": { const a = r.int(10, 60 + level * 60), b = r.int(10, 60 + level * 60); return { q: `${a} + ${b}`, a: `${a + b}`, speak: `${a} plus ${b}` }; }
    case "sub": { let a = r.int(20, 80 + level * 60), b = r.int(5, 60 + level * 40); if (b > a) [a, b] = [b, a]; return { q: `${a} − ${b}`, a: `${a - b}`, speak: `${a} minus ${b}` }; }
    case "mul": { const a = r.int(3, 9 + level * 3), b = r.int(3, 12 + level * 2); return { q: `${a} × ${b}`, a: `${a * b}`, speak: `${a} times ${b}` }; }
    case "div": { const b = r.int(2, 9 + level * 2), c = r.int(2, 12 + level * 2); return { q: `${b * c} ÷ ${b}`, a: `${c}`, speak: `${b * c} divided by ${b}` }; }
    case "square": { const a = r.int(4, 12 + level * 4); return { q: `${a}²`, a: `${a * a}`, speak: `${a} squared` }; }
    case "root": { const a = r.int(4, 20); return { q: `√${a * a}`, a: `${a}`, speak: `the square root of ${a * a}` }; }
    case "percent": { const p = r.pick([10, 20, 25, 50, 5, 15, 75]), n = r.int(2, 40) * 20; return { q: `${p}% of ${n}`, a: `${(p * n) / 100}`, speak: `${p} percent of ${n}` }; }
    default: { const a = r.int(2, 12), b = r.int(2, 12), c = r.int(1, 30); return { q: `${a} × ${b} + ${c}`, a: `${a * b + c}`, speak: `${a} times ${b}, plus ${c}` }; }
  }
}

function sequenceProblem(r: RNG) {
  const type = r.pick(["arith", "geo", "square", "fib", "alt"]);
  let seq: number[] = [];
  let rule = "";
  if (type === "arith") { const s = r.int(1, 20), d = r.int(2, 9); seq = [0, 1, 2, 3, 4].map((i) => s + d * i); rule = `add ${d} each time`; }
  else if (type === "geo") { const s = r.int(1, 4), m = r.pick([2, 3]); seq = [0, 1, 2, 3, 4].map((i) => s * Math.pow(m, i)); rule = `multiply by ${m}`; }
  else if (type === "square") { const s = r.int(1, 6); seq = [0, 1, 2, 3, 4].map((i) => (s + i) * (s + i)); rule = "square numbers"; }
  else if (type === "fib") { const a = r.int(1, 5), b = r.int(1, 6); seq = [a, b]; for (let i = 2; i < 5; i++) seq.push(seq[i - 1] + seq[i - 2]); rule = "each number is the sum of the previous two"; }
  else { const s = r.int(5, 30), d1 = r.int(2, 8), d2 = r.int(1, 4); seq = [s]; for (let i = 1; i < 5; i++) seq.push(i % 2 ? seq[i - 1] + d1 : seq[i - 1] - d2); rule = `plus ${d1}, minus ${d2}, repeating`; }
  return { shown: seq.slice(0, 4), answer: seq[4], rule };
}

function math(ctx: Ctx, target: number) {
  const r = ctx.rng;
  const level = r.int(1, 5);
  const levelName = ["", "Easy", "Medium", "Tricky", "Hard", "Expert"][level];
  push(ctx, "title", 6, { title: r.pick(["Mental Math", "Math Sprint", "Quick Math", "Brain Math", "Number Drill"]), sub: `${levelName} · ${r.pick(["answer before the timer", "no calculator", "how many can you get?"])}` }, r.pick([`Welcome to a ${levelName.toLowerCase()} mental math session. Each question has a timer. Say your answer out loud before it runs out.`, `Time for a math sprint. ${levelName} level today. Solve each problem in your head before the reveal.`, `Let's warm up your brain with some ${levelName.toLowerCase()} arithmetic. Ready?`]));
  let n = 0;
  let correctTally = 0;
  while (ctx.t < target - 14) {
    n++;
    if (n % 5 === 0 && r.chance(0.7)) {
      const s = sequenceProblem(r);
      const think = r.int(8, 14);
      push(ctx, "math-sequence", think + 5, { shown: s.shown, answer: s.answer, rule: s.rule, think, index: n }, `What comes next? ${s.shown.join(", ")}...`, { narrationAt: 0.6 });
    } else {
      const p = mathProblem(r, level);
      const think = r.int(4, 10) + level;
      push(ctx, "math-question", think + 3.5, { q: p.q, a: p.a, think, index: n, layout: r.pick(["center", "left", "big", "card", "split"]) }, r.chance(0.7) ? `${p.speak}.` : undefined, { narrationAt: 0.5 });
    }
    correctTally++;
    if (n % 8 === 0) push(ctx, "interlude", r.int(4, 6), { text: r.pick(["Keep going", "Nice streak", "Shake it out", "Halfway", "Stay sharp"]) }, r.pick(["Nice. Keep the pace.", "Good. Next set.", undefined]));
  }
  push(ctx, "outro", 10, { text: `${correctTally} problems done` }, r.pick([`That's ${correctTally} problems. How many did you get? Tell us in the comments and come back tomorrow for a new set.`, `Session over. ${correctTally} problems solved. Subscribe for a fresh set every day.`]));
}

// ---------------- STORY ----------------
const NAMES = ["Mira", "Tobias", "June", "Elias", "Noor", "Wren", "Kaito", "Ada", "Felix", "Sana", "Oren", "Lila", "Bram", "Ines", "Theo", "Zadie"];
const PLACES = ["a lighthouse at the end of the world", "a train that only stopped at night", "a bakery beneath the observatory", "an island made of clocks", "a library where the books whispered", "the last greenhouse in the city", "a village that floated on the lake", "a museum of forgotten sounds", "an attic full of unsent letters", "a desert where it rained upward"];
const OBJECTS = ["a brass key with no lock", "a map that redrew itself", "a jar of captured thunder", "a compass that pointed to people", "a paper boat that never got wet", "a coin that landed on its edge every time", "a violin string that hummed on its own", "a photograph of tomorrow", "a seed that glowed at night", "a pair of glasses that showed what was missing"];
const WANTS = ["to find the way home", "to return something borrowed", "to hear their grandmother's voice again", "to fix a broken promise", "to learn why the stars had gone quiet", "to deliver a message before dawn", "to make one person laugh", "to remember a forgotten name", "to outrun the fog", "to catch the last ferry"];
const OBSTACLES = ["the tide came in faster than expected", "a stranger asked a question with no answer", "every door led back to the same room", "the wind stole the map", "the clocks began running backward", "a fox demanded a toll", "the bridge had been eaten by moss", "the moon refused to rise", "the stairs kept adding steps", "the letters on every sign rearranged themselves"];
const HELPERS = ["an old cartographer with ink-stained hands", "a girl who spoke only in questions", "a dog named Comet", "a retired storm", "a robot that collected lullabies", "a baker who could read footprints", "a moth the size of a hand", "a chess-playing heron", "a twin who did not exist yet", "a ghost who was terrible at haunting"];
const TWISTS = ["the key had been for a door inside themselves all along", "the fog was the village's way of dreaming", "the helper had written the map years before", "the message was addressed to the messenger", "the object had been found, not lost, by everyone before them", "the stars were only waiting for someone to look up", "home had followed quietly the whole way", "the promise had never been broken, only misremembered", "the last ferry left every night, and always would", "the coin had been choosing them"];
const MORALS = ["Some journeys only end when you stop measuring them.", "What we carry matters less than why we carry it.", "Sometimes the way forward is the way you already came.", "You can't lose what chooses to stay.", "Answers are quieter than questions, and arrive later.", "Every fog lifts for someone who keeps walking.", "Not every lock needs opening.", "The smallest helpers leave the deepest footprints."];
const GENRES = ["A Small Fable", "A Night Tale", "A Slow Mystery", "A Bedtime Story", "A Tiny Odyssey", "A Quiet Adventure"];

function story(ctx: Ctx, target: number) {
  const r = ctx.rng;
  const name = r.pick(NAMES), place = r.pick(PLACES), obj = r.pick(OBJECTS), want = r.pick(WANTS), obstacle = r.pick(OBSTACLES), helper = r.pick(HELPERS), twist = r.pick(TWISTS), moral = r.pick(MORALS);
  const titleWord = obj.replace(/^a (pair of |jar of )?/, "").split(/ (that|with|which|of) /)[0];
  const storyTitle = r.pick([`${name} and the ${titleWord}`, `The ${titleWord[0].toUpperCase() + titleWord.slice(1)}`, `${name}'s Long Night`, `What ${name} Found`]);
  const paras: string[] = [
    `${name} lived in ${place}. Most days were the same, and ${name} had learned to like that.`,
    `One morning, ${name} found ${obj}. It was sitting exactly where nothing had been the night before.`,
    `${name} wanted, more than anything, ${want}. And somehow the ${titleWord} seemed to know it.`,
    `So ${name} set out. The first hour was easy. The second was not, because ${obstacle}.`,
    `${name} nearly turned back. Then, from nowhere in particular, appeared ${helper}.`,
    `"You're holding it wrong," said the helper, though ${name} was not holding anything. They walked on together.`,
    `The path twisted. ${name} counted steps, then stopped counting. The helper hummed something old.`,
    `Near the end, ${name} understood: ${twist}.`,
    `${name} laughed, the kind of laugh that is mostly breath. The ${titleWord} grew warm, then quiet.`,
    `By morning, ${name} was back in ${place}. Everything looked the same, and nothing was.`,
    moral,
  ];
  // Optional extra middle paragraphs to reach target length
  const extras = [
    `The sky did something it had never done before. ${name} pretended not to notice, and failed.`,
    `They rested under a tree that seemed to lean in to listen. The helper told a joke with no punchline.`,
    `${name} thought of home. It felt further than distance and closer than memory.`,
    `A door appeared in a wall that had no other side. ${name} knocked, out of politeness. Nobody answered, which was an answer.`,
    `The helper said: "Everything lost is just early." ${name} wrote it on the back of a hand.`,
    `For a while there was only walking, and the soft sound of the ${titleWord} keeping time.`,
    `A bird flew backward across the sky, apologising to nobody.`,
    `${name} whispered the thing they wanted, out loud, for the first time. The wind took it somewhere useful.`,
  ];
  push(ctx, "title", 7, { title: storyTitle, sub: r.pick(GENRES) }, `${storyTitle}. ${r.pick(GENRES).replace("A ", "A short ")}, read for you tonight.`);
  const sceneStyles = ["landscape", "night", "interior", "sea", "forest", "city", "desert", "abstract"];
  let pi = 0;
  const all = [...paras];
  let extraIdx = 0;
  const shuffledExtras = r.shuffle(extras);
  // Insert extras in the middle while the story is too short
  const estTotal = () => all.reduce((s, p) => s + estimateSpeech(p) + 2.4, 0) + 20;
  while (estTotal() < target && extraIdx < shuffledExtras.length) {
    all.splice(4 + extraIdx, 0, shuffledExtras[extraIdx]);
    extraIdx++;
  }
  for (const p of all) {
    const dur = estimateSpeech(p) + r.range(2.2, 3.6);
    push(ctx, "story-panel", dur, { text: p, style: r.pick(sceneStyles), panel: pi++, kenburns: r.pick(["in", "out", "left", "right"]), characterHue: r.int(0, 360) }, p, { narrationAt: 0.9 });
  }
  // Pad with a calm outro so we hit minimum duration
  while (ctx.t < target - 9) {
    push(ctx, "interlude", Math.min(target - 9 - ctx.t, r.int(5, 9)), { text: r.pick(["The end.", "Sleep well.", "Fin.", "Goodnight."]) });
    if (ctx.t >= target - 9) break;
  }
  push(ctx, "outro", 9, { text: "The End" }, r.pick(["The end. Thank you for listening. A new story is written for tomorrow.", "That's tonight's story. Sleep well, and come back tomorrow for another one.", "The end. If you enjoyed it, there's a new tale every day."]));
}

// ---------------- GAMEPLAY ----------------
function gameplay(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, { title: r.pick(["AI Plays", "Bot Arcade", "Auto Games", "Machine Plays", "Pixel Session"]), sub: r.pick(["watch the machine play", "no humans involved", "relaxing gameplay", "satisfying runs"]) }, r.pick(["Welcome to the arcade. Today the machine plays for you. Sit back and watch.", "Auto play session. Different games, different seeds, never the same twice.", "Relax and watch the bot play. Let's see how far it gets."]));
  const games: SceneKind[] = ["game-snake", "game-breakout", "game-maze", "game-life", "game-marbles"];
  let i = 0;
  while (ctx.t < target - 12) {
    const g = r.pick(games);
    i++;
    if (g === "game-snake") push(ctx, g, r.int(40, 90), { cols: r.int(16, 28), stepsPerSec: r.range(6, 11), theme: r.pick(["neon", "retro", "flat"]), seed: r.int(1, 1e9) }, r.pick(["Snake. The bot follows a path to the fruit and tries not to trap itself.", "Let's see how long this snake gets.", "Snake time. Watch the greedy pathfinder work."]));
    else if (g === "game-breakout") push(ctx, g, r.int(35, 80), { rows: r.int(4, 7), cols: r.int(8, 14), speed: r.range(0.9, 1.5), seed: r.int(1, 1e9) }, r.pick(["Breakout. The paddle tracks the ball, the bricks don't stand a chance.", "Brick breaker run. Satisfying, hopefully.", "Breakout. Let's clear the wall."]));
    else if (g === "game-maze") push(ctx, g, r.int(30, 70), { cols: r.int(15, 35), algo: r.pick(["bfs", "dfs"]), seed: r.int(1, 1e9) }, r.pick(["A fresh maze. Watch the search spread out and then trace the shortest path.", "Maze solving. Generated seconds ago, never seen before.", "Let's carve and solve a new maze."]));
    else if (g === "game-life") push(ctx, g, r.int(25, 55), { cols: r.int(40, 90), density: r.range(0.18, 0.4), stepsPerSec: r.range(6, 14), seed: r.int(1, 1e9), style: r.pick(["squares", "dots", "glow"]) }, r.pick(["Game of Life. Simple rules, endless patterns.", "Cellular automata. Watch civilizations bloom and collapse.", "Conway's Game of Life with a random start."]));
    else push(ctx, g, r.int(35, 75), { count: r.int(8, 24), gravity: r.range(0.6, 1.3), pegs: r.int(10, 30), seed: r.int(1, 1e9) }, r.pick(["Marble race. Pick a color and cheer for it.", "Which marble wins? Place your bets.", "Marble run. Physics decides."]));
    if (i % 2 === 0 && r.chance(0.5)) push(ctx, "interlude", r.int(3, 6), { text: r.pick(["Next game", "Loading...", "Round " + (i + 1), "Insert coin"]) });
  }
  push(ctx, "outro", 9, { text: r.pick(["Game Over", "Thanks for watching", "Continue?"]) }, r.pick(["That's the session. New games and new seeds tomorrow.", "Game over. Subscribe for daily auto play.", "Thanks for watching the machine play."]));
}

// ---------------- BRAIN ----------------
const TRIVIA = [
  { q: "Which planet has the most moons?", opts: ["Jupiter", "Saturn", "Uranus", "Neptune"], a: 1 },
  { q: "What is the largest organ of the human body?", opts: ["Liver", "Brain", "Skin", "Lungs"], a: 2 },
  { q: "How many bones does an adult human have?", opts: ["186", "206", "226", "246"], a: 1 },
  { q: "Which language has the most native speakers?", opts: ["English", "Hindi", "Spanish", "Mandarin"], a: 3 },
  { q: "What gas do plants absorb from the air?", opts: ["Oxygen", "Nitrogen", "Carbon dioxide", "Hydrogen"], a: 2 },
  { q: "Which ocean is the deepest?", opts: ["Atlantic", "Indian", "Pacific", "Arctic"], a: 2 },
  { q: "What is the square root of 144?", opts: ["10", "11", "12", "14"], a: 2 },
  { q: "Which metal is liquid at room temperature?", opts: ["Lead", "Mercury", "Tin", "Zinc"], a: 1 },
  { q: "How many strings does a standard violin have?", opts: ["4", "5", "6", "7"], a: 0 },
  { q: "Which continent is the Sahara in?", opts: ["Asia", "Africa", "Australia", "South America"], a: 1 },
  { q: "What is the hardest natural substance?", opts: ["Quartz", "Steel", "Diamond", "Granite"], a: 2 },
  { q: "How many hearts does an octopus have?", opts: ["1", "2", "3", "4"], a: 2 },
  { q: "Which is the smallest prime number?", opts: ["0", "1", "2", "3"], a: 2 },
  { q: "What is the capital of Canada?", opts: ["Toronto", "Vancouver", "Ottawa", "Montreal"], a: 2 },
  { q: "Light takes about how long to reach Earth from the Sun?", opts: ["8 seconds", "8 minutes", "8 hours", "8 days"], a: 1 },
  { q: "Which bird is known for mimicking sounds?", opts: ["Sparrow", "Lyrebird", "Pigeon", "Falcon"], a: 1 },
  { q: "How many sides does a hexagon have?", opts: ["5", "6", "7", "8"], a: 1 },
  { q: "Water boils at what temperature at sea level?", opts: ["90°C", "100°C", "110°C", "120°C"], a: 1 },
  { q: "Which instrument measures air pressure?", opts: ["Thermometer", "Barometer", "Hygrometer", "Anemometer"], a: 1 },
  { q: "What is the longest river in South America?", opts: ["Paraná", "Orinoco", "Amazon", "Magdalena"], a: 2 },
  { q: "Which element has the symbol O?", opts: ["Gold", "Osmium", "Oxygen", "Oganesson"], a: 2 },
  { q: "How many players are on a soccer team on the field?", opts: ["9", "10", "11", "12"], a: 2 },
  { q: "The Great Barrier Reef is off the coast of which country?", opts: ["Brazil", "Australia", "Indonesia", "Mexico"], a: 1 },
  { q: "Which is the fastest land animal?", opts: ["Lion", "Cheetah", "Pronghorn", "Greyhound"], a: 1 },
];
const WORDS = ["planet", "guitar", "window", "silver", "forest", "rocket", "camera", "bridge", "jungle", "pencil", "candle", "island", "garden", "mirror", "puzzle", "violin", "orange", "dragon", "ladder", "castle", "tunnel", "meadow", "anchor", "basket", "wizard", "helmet", "marble", "engine", "falcon", "harbor"];

function brain(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, { title: r.pick(["Brain Teasers", "Mind Gym", "Quick Quiz", "Memory & Logic", "Think Fast"]), sub: r.pick(["memory · trivia · words", "beat the timer", "train your brain daily"]) }, r.pick(["Welcome to brain training. Memory, trivia and words. Answer out loud before the reveal.", "Let's exercise your brain. Watch closely, remember, and answer fast.", "Brain teasers today. No pressure, just play."]));
  const trivia = r.shuffle(TRIVIA);
  const words = r.shuffle(WORDS);
  let ti = 0, wi = 0, n = 0;
  while (ctx.t < target - 12) {
    const kind = r.pick(["memory", "trivia", "trivia", "word"]);
    n++;
    if (kind === "memory") {
      const len = r.int(3, 7);
      const seq = Array.from({ length: len }, () => r.int(0, 3));
      const showDur = len * 0.9 + 1.5, recall = r.int(5, 9);
      push(ctx, "memory-sequence", showDur + recall + 4, { seq, showDur, recall, grid: r.pick(["2x2", "4x1", "diamond"]) }, "Memorize the sequence.", { narrationAt: 0.3 });
    } else if (kind === "trivia" && ti < trivia.length) {
      const t = trivia[ti++];
      const think = r.int(6, 10);
      push(ctx, "trivia", think + 5, { ...t, think, layout: r.pick(["stack", "grid", "row"]) }, t.q, { narrationAt: 0.5 });
    } else if (wi < words.length) {
      const w = words[wi++];
      const scr = r.shuffle(w.split("")).join("");
      const think = r.int(7, 12);
      push(ctx, "word-scramble", think + 4, { word: w, scrambled: scr, think, hint: r.chance(0.5) }, "Unscramble this word.", { narrationAt: 0.4 });
    }
    if (n % 6 === 0) push(ctx, "interlude", r.int(3, 6), { text: r.pick(["Nice", "Keep going", "Round " + (n / 6 + 1), "Focus"]) });
  }
  push(ctx, "outro", 9, { text: "Well played" }, r.pick(["That's all for today. How did you score? New puzzles tomorrow.", "Brain workout done. Come back tomorrow for a fresh set."]));
}

// ---------------- CALM ----------------
function calm(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 8, { title: r.pick(["Breathe", "Slow Down", "Reset", "Quiet Minutes", "Still"]), sub: r.pick(["a guided pause", "breathing pacer", "focus reset"]) }, r.pick(["Take a few minutes for yourself. Sit comfortably, soften your gaze, and breathe with the shapes.", "This is a short reset. Nothing to do except breathe and watch.", "Welcome. Let your shoulders drop and follow the rhythm on screen."]));
  let n = 0;
  while (ctx.t < target - 12) {
    n++;
    const k = r.pick(["breathing", "breathing", "eye-follow", "eye-focus", "interlude"]);
    if (k === "breathing") push(ctx, "breathing", r.int(30, 60), { inhale: r.int(4, 5), hold: r.int(2, 7), exhale: r.int(5, 8) }, n === 1 ? "Inhale as the circle grows. Hold. Exhale as it shrinks." : r.pick(["Keep breathing with the circle.", "Slow and easy.", undefined, undefined]));
    else if (k === "eye-follow") push(ctx, "eye-follow", r.int(25, 45), { path: r.pick(["wave", "circle", "spiral"]), speed: r.range(0.3, 0.6), size: r.int(20, 34), shape: "ring", trail: true, rotateDir: 1 }, r.pick(["Let your eyes drift with the shape.", "Follow gently. No effort.", undefined]));
    else if (k === "eye-focus") push(ctx, "eye-focus", r.int(20, 40), { period: r.range(6, 9), shape: "ring", letter: "O" }, r.pick(["Soften your focus as it grows, sharpen as it shrinks.", undefined]));
    else push(ctx, "interlude", r.int(6, 12), { text: r.pick(["...", "just breathe", "nowhere to be", "notice the quiet", "unclench"]) });
  }
  push(ctx, "outro", 10, { text: r.pick(["Return slowly", "That's enough", "Carry it with you"]) }, r.pick(["Come back slowly. Wiggle your fingers. Carry this calm into your day.", "That's the end. Take one more breath and return whenever you like."]));
}

function mixed(ctx: Ctx, target: number) {
  const r = ctx.rng;
  const parts = r.shuffle(["eye", "math", "brain", "game", "calm"]).slice(0, r.int(3, 4));
  const per = target / parts.length;
  push(ctx, "title", 6, { title: r.pick(["Daily Mix", "Mind & Eyes", "The Variety Hour", "Mixed Session"]), sub: parts.join(" · ") }, "A mixed session today. A little bit of everything, so stay with us.");
  for (const p of parts) {
    const sub = ctx.t + per - 8;
    const before = ctx.scenes.length;
    if (p === "eye") eyeTraining(ctx, sub);
    else if (p === "math") math(ctx, sub);
    else if (p === "brain") brain(ctx, sub);
    else if (p === "game") gameplay(ctx, sub);
    else calm(ctx, sub);
    // remove nested outros except last
    const added = ctx.scenes.slice(before);
    const outro = added.find((s) => s.kind === "outro");
    if (outro && p !== parts[parts.length - 1]) {
      ctx.scenes.splice(ctx.scenes.indexOf(outro), 1);
      ctx.t -= outro.duration;
    }
  }
  // fix starts
  let t = 0;
  for (const s of ctx.scenes) { s.start = t; t += s.duration; }
  ctx.t = t;
}

// ---------------- META ----------------
function meta(r: RNG, category: string, scenes: Scene[], durationSec: number, orientation: Orientation) {
  const mins = Math.round(durationSec / 60);
  const emoji = r.pick(["👁️", "🧠", "✨", "🔢", "🎮", "📖", "🌬️", "⚡", "🎯"]);
  const day = r.int(1, 999);
  const titleScene = scenes.find((s) => s.kind === "title");
  const base = (titleScene?.data.title as string) || "Session";
  const tmpl: Record<string, string[]> = {
    eye_training: [`${base} — ${mins} Minute Guided Eye Exercise ${emoji}`, `${mins} Min Eye Training | Follow, Focus, Relax`, `Daily Eye Workout #${day}: Smooth Pursuit & Saccades`, `Rest Your Eyes: ${mins}-Minute Guided Routine`],
    math: [`${base}: ${scenes.filter((s) => s.kind.startsWith("math")).length} Mental Math Questions ${emoji}`, `Can You Solve These? ${mins} Min Mental Math Sprint`, `Daily Math Drill #${day} — Answer Before The Timer`, `Mental Math Practice (${mins} min, timed)`],
    story: [`${base} | A Short Story ${emoji}`, `${base} — Narrated Story to Relax To`, `Bedtime Story: ${base}`, `${base} (Original Short Fiction, ${mins} min)`],
    gameplay: [`${base} — ${scenes.filter((s) => s.kind.startsWith("game")).length} Games, Zero Humans ${emoji}`, `Relaxing AI Gameplay #${day}: Snake, Breakout, Mazes`, `Watch The Machine Play (${mins} min)`, `Satisfying Auto-Play Session #${day}`],
    brain: [`${base}: Memory, Trivia & Word Puzzles ${emoji}`, `${mins} Minute Brain Workout #${day}`, `Can You Beat The Timer? Brain Teasers`, `Daily Brain Training — Quiz & Memory`],
    calm: [`${base} — ${mins} Minute Breathing Pacer ${emoji}`, `Guided Breathing & Focus Reset (${mins} min)`, `Quiet Minutes #${day}: Breathe With The Circle`, `Calm Reset — Slow Breathing Visual`],
    mixed: [`${base} #${day} — Eyes, Brain & Breath ${emoji}`, `${mins} Minute Mixed Mind Session`, `Daily Variety Session #${day}`],
  };
  const title = r.pick(tmpl[category] || tmpl.mixed);
  const catInfo = CATEGORIES.find((c) => c.id === category);
  const narrations = scenes.filter((s) => s.narration).slice(0, 3).map((s) => s.narration).join(" ");
  const chapters = scenes.filter((s) => s.kind !== "interlude").map((s) => `${fmt(s.start)} ${chapterName(s)}`).join("\n");
  const desc = `${catInfo?.blurb ?? ""}\n\n${narrations}\n\nChapters:\n${chapters}\n\n${r.pick(["New session generated every day.", "Every video is generated fresh — no two are the same.", "Subscribe for a new one tomorrow."])} ${r.pick(["#${category}", ""])}\n\nMusic: Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 — http://creativecommons.org/licenses/by/4.0/`
    .replace("${category}", category.replace("_", ""));
  const tagBank: Record<string, string[]> = {
    eye_training: ["eye exercises", "eye training", "vision", "eye workout", "smooth pursuit", "saccades", "eye strain relief", "focus"],
    math: ["mental math", "math practice", "arithmetic", "math quiz", "brain training", "math drill", "quick math"],
    story: ["short story", "bedtime story", "narrated story", "audiobook", "fiction", "storytelling", "relaxing"],
    gameplay: ["ai gameplay", "snake game", "breakout", "maze solving", "game of life", "marble race", "satisfying", "relaxing gameplay"],
    brain: ["brain teasers", "trivia quiz", "memory game", "word scramble", "brain training", "quiz"],
    calm: ["breathing exercise", "meditation", "calm", "focus", "relax", "breathing pacer", "anxiety relief"],
    mixed: ["brain training", "eye exercises", "mental math", "daily session", "focus"],
  };
  const tags = [...(tagBank[category] || []), "daily", orientation === "portrait" ? "shorts" : "generated"];
  const thumbText = r.pick([base.toUpperCase(), `${mins} MIN`, base, `DAY ${day}`, r.pick(["TRY THIS", "CAN YOU?", "WATCH", "DAILY"])]);
  const thumbSub = r.pick([catInfo?.label ?? "", `${mins} minutes`, `#${day}`, "new every day", ""]);
  return { title: title.slice(0, 100), description: desc, tags, thumbText, thumbSub };
}
function fmt(s: number) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${r.toString().padStart(2, "0")}`; }
function chapterName(s: Scene): string {
  const d = s.data as Record<string, string | number>;
  switch (s.kind) {
    case "title": return String(d.title);
    case "outro": return "Outro";
    case "eye-follow": return `Follow: ${d.path}`;
    case "eye-saccade": return "Saccades";
    case "eye-focus": return "Focus shift";
    case "eye-peripheral": return "Peripheral";
    case "eye-palming": return "Palming rest";
    case "math-question": return `Question ${d.index}`;
    case "math-sequence": return `Sequence ${d.index}`;
    case "story-panel": return `Part ${(d.panel as number) + 1}`;
    case "game-snake": return "Snake";
    case "game-breakout": return "Breakout";
    case "game-maze": return "Maze";
    case "game-life": return "Game of Life";
    case "game-marbles": return "Marble race";
    case "memory-sequence": return "Memory";
    case "trivia": return "Trivia";
    case "word-scramble": return "Word scramble";
    case "breathing": return "Breathing";
    default: return s.kind;
  }
}

export interface GenerateOptions {
  category: string;
  orientation: Orientation;
  seed?: string;
  voice?: string;
  fallbackVoice?: string;
  mood?: string;
  targetDuration?: number;
}

export function generateComposition(opts: GenerateOptions): Composition {
  const seed = opts.seed || `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const rng = new RNG(`${opts.category}|${opts.orientation}|${seed}`);
  const orientation = opts.orientation;
  const target = opts.targetDuration ?? (orientation === "landscape" ? rng.int(245, 470) : rng.int(28, 58));
  const palettes = rng.shuffle(PALETTES).slice(0, rng.int(2, 4));
  const ctx: Ctx = { rng, orientation, palettes, sceneCount: 0, scenes: [], t: 0 };
  const category = opts.category === "random" ? rng.pick(CATEGORIES.map((c) => c.id)) : opts.category;
  switch (category) {
    case "eye_training": eyeTraining(ctx, target); break;
    case "math": math(ctx, target); break;
    case "story": story(ctx, target); break;
    case "gameplay": gameplay(ctx, target); break;
    case "brain": brain(ctx, target); break;
    case "calm": calm(ctx, target); break;
    default: mixed(ctx, target);
  }
  // Portrait (shorts): cap scene lengths and total under 60s
  if (orientation === "portrait") {
    for (const s of ctx.scenes) {
      const need = s.narration ? estimateSpeech(s.narration) + 1.5 : 0;
      s.duration = Math.min(s.duration, Math.max(need, s.kind === "title" || s.kind === "outro" ? 5 : 18));
    }
    const total = () => ctx.scenes.reduce((a, s) => a + s.duration, 0);
    while (total() > 59 && ctx.scenes.length > 3) ctx.scenes.splice(ctx.scenes.length - 2, 1);
    let t = 0;
    for (const s of ctx.scenes) { s.start = t; t += s.duration; }
    ctx.t = t;
  }
  // Ensure landscape minimum of 4 minutes by stretching non-narrated scenes proportionally if needed
  if (orientation === "landscape" && ctx.t < 240) {
    const deficit = 240 - ctx.t + 3;
    const stretchable = ctx.scenes.filter((s) => !["title", "outro", "math-question", "trivia", "memory-sequence", "word-scramble", "math-sequence", "story-panel"].includes(s.kind));
    const pool = stretchable.length ? stretchable : ctx.scenes;
    const add = deficit / pool.length;
    for (const s of pool) s.duration += add;
    let t = 0;
    for (const s of ctx.scenes) { s.start = t; t += s.duration; }
    ctx.t = t;
  }
  const catInfo = CATEGORIES.find((c) => c.id === category);
  const mood = opts.mood && opts.mood !== "auto" ? opts.mood : rng.pick(catInfo?.moods ?? ["focus"]);
  const voiceName = opts.voice && opts.voice !== "random" ? opts.voice : rng.pick(VOICES);
  const isCalm = category === "calm" || category === "story" || category === "eye_training";
  const comp: Composition = {
    version: 1,
    seed,
    category,
    orientation,
    width: orientation === "landscape" ? 1280 : 720,
    height: orientation === "landscape" ? 720 : 1280,
    fps: 24,
    duration: Math.round(ctx.t * 10) / 10,
    theme: {
      palette: palettes[0],
      fontDisplay: rng.pick(FONTS.display),
      fontBody: rng.pick(FONTS.body),
      fontMono: rng.pick(FONTS.mono),
    },
    scenes: ctx.scenes,
    music: { mood, volume: isCalm ? 0.16 : 0.22 },
    voice: { name: voiceName, fallbackVoice: opts.fallbackVoice || "en-CA-Liam", rate: isCalm ? rng.pick(["-8%", "-12%", "-5%"]) : rng.pick(["+0%", "+4%", "-3%"]), pitch: rng.pick(["+0Hz", "-2Hz", "+2Hz"]) },
    meta: { title: "", description: "", tags: [], thumbText: "", thumbSub: "" },
  };
  comp.meta = meta(rng.fork("meta"), category, ctx.scenes, ctx.t, orientation);
  return comp;
}

export type { Mood };
