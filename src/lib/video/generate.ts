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
import { RIDDLES, TRIVIA, MEMORY_CHALLENGES, WOULD_YOU_RATHER, MYTHS, POLLS } from "./content-data";

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
  "This is a guided eye workout. Relax your shoulders, breathe naturally, and follow the shapes with your eyes only.",
  "Let's give your eyes a gentle workout. Keep your head steady and stay about an arm's length from the screen.",
  "Time to train your eyes. Blink naturally, keep your neck relaxed, and follow every movement smoothly.",
  "Ready to strengthen your vision? Stay an arm's length from the screen. Head still, only your eyes move from here.",
  "Eye training session starting now. Soft gaze, relaxed forehead, and remember — move only your eyes, not your head.",
  "Seven minutes of deliberate eye movement. It will reduce strain and sharpen your focus over time.",
  "Your eyes have muscles — and like any muscle, they benefit from regular training. Let's begin.",
];
const FOLLOW_PATHS = ["circle", "figure8", "lissajous", "zigzag", "spiral", "wave", "square", "random", "diagonal", "bowtie", "triangle"] as const;
const FOLLOW_LINES: Record<string, string[]> = {
  circle: ["Follow the dot as it travels in a circle. Keep the motion smooth, no jumping ahead.", "Trace the circle with your eyes. Smooth and steady.", "A full circle now. Exhale slowly as you complete each loop.", "Round and round. Your eyes should glide, not jump."],
  figure8: ["Now a figure eight. Let your eyes glide through the crossing point without stopping.", "Follow the infinity loop. Relax your brow as you track it.", "The infinity path. Smooth through the center, no pausing.", "Infinity shape — a classic tracking exercise. Stay fluid through every curve."],
  lissajous: ["This path is a little unpredictable. Stay locked onto the dot and let your eyes flow.", "A weaving pattern now. Keep relaxed while you track it.", "Complex curve ahead. Don't rush — stay with the dot wherever it leads.", "Lissajous curve. Let your eyes adapt to the rhythm of the shape."],
  zigzag: ["Sharp zigzags. Change direction quickly but keep your head perfectly still.", "Follow the zigzag. Fast turns, smooth tracking.", "Zigzag pattern. React with your eyes only — your head stays locked.", "Rapid direction changes now. This is reflex training for your eye muscles."],
  spiral: ["A spiral, outward then inward. Notice how far your eyes can comfortably reach.", "Track the spiral to the edge and back to center.", "Expanding and contracting spiral. Feel the range of your vision.", "Spiral path — let your eyes ride the curve all the way out and all the way back."],
  wave: ["A slow horizontal wave. This trains smooth pursuit from side to side.", "Ride the wave with your eyes, left to right and back.", "Horizontal wave. Let your eyes surf across the screen without snapping.", "Side-to-side wave. This is one of the most natural motions for your eyes."],
  square: ["Now a square path. Hold each corner briefly, then move along the edge.", "Trace the square. Corners are pauses, edges are smooth.", "Square tracking. Crisp at the corners, smooth on the straights.", "Four sides, four corners. Let your gaze be deliberate and controlled."],
  random: ["The dot will wander randomly. Stay with it, and don't anticipate.", "Free roaming dot. React, don't predict.", "Random movement ahead. Stay alert — no guessing where it goes next.", "Unpredictable path. This tests reactive tracking — the hardest kind."],
  diagonal: ["A diagonal sweep now. Let your eyes slide from corner to corner, relaxed and controlled.", "Diagonal path — top left to bottom right and back. Feel the full extent of your visual field.", "Diagonal sweep. This covers the full diagonal range of your field of view."],
  bowtie: ["Bowtie shape — two triangles meeting at a point. Stay smooth through the center.", "This bowtie path crosses the midpoint twice per loop. Keep the crossing clean."],
  triangle: ["A triangle path. Three sharp turns. Hold each vertex for a beat, then move.", "Triangle tracking. Precise corners, even sides. Let your eyes be methodical."],
};

function eyeTraining(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Eye Workout", "Eye Training", "Vision Drills", "Eye Gym", "Focus & Track", "Daily Eye Care", "Eye Mobility", "Eye Strength", "Visual Training"]),
    sub: r.pick(["Guided session", "Follow with your eyes only", "Keep your head still", "Daily routine", "No equipment needed", "Reduce screen fatigue", "Strengthen your focus", "5–10 minutes a day"]),
  }, r.pick(EYE_INTROS));
  let round = 0;
  while (ctx.t < target - 12) {
    const drill = r.pick([
      "follow", "follow", "follow", "follow",
      "saccade", "saccade",
      "focus", "focus",
      "peripheral",
      "palming",
      "convergence",
      "blink-count",
      "rotation",
      "tracing",
    ]);
    round++;
    if (drill === "follow") {
      const path = r.pick(FOLLOW_PATHS);
      const dur = r.int(20, 52);
      const shape = r.pick(["dot", "ring", "star", "square", "diamond", "cross", "arrow"]);
      push(ctx, "eye-follow", dur, { path, speed: r.range(0.45, 1.5), size: r.int(12, 36), shape, trail: r.chance(0.4), color: r.pick(["red", "cyan", "white", "green", "yellow"]), rotateDir: r.chance(0.5) ? 1 : -1 }, r.pick(FOLLOW_LINES[path] ?? FOLLOW_LINES.circle));
    } else if (drill === "saccade") {
      const dur = r.int(18, 42);
      const style = r.pick(["horizontal", "vertical", "diagonal", "corners", "random", "cross", "star-pattern"]);
      push(ctx, "eye-saccade", dur, { interval: r.range(0.6, 1.8), positions: r.int(2, 8), style, size: r.int(16, 44), shape: r.pick(["dot", "ring", "x", "plus"]) }, r.pick([
        "Now quick jumps. When the target appears, snap your eyes to it as fast as you can.",
        "Saccade drill. Jump to each new target immediately, then hold until the next one.",
        "Rapid targets now. Land your eyes precisely on each one.",
        "Snap tracking. The moment a target appears, your eyes should already be moving.",
        "Fast targets. Snap, hold, snap again. Precision and speed.",
        `${style} saccades. Keep your head locked and react with only your eyes.`,
      ]));
    } else if (drill === "focus") {
      const dur = r.int(16, 38);
      const shape = r.pick(["ring", "hex", "letter", "cross", "spiral"]);
      push(ctx, "eye-focus", dur, { period: r.range(2.5, 6), shape, letter: r.pick(["E", "A", "K", "8", "Z", "F", "T", "O", "C", "X"]) }, r.pick([
        "Focus shift. As the shape grows, imagine it coming close. As it shrinks, let your focus relax into the distance.",
        "Near and far. Keep the shape crisp as it changes size.",
        "This drill relaxes your focusing muscles. Follow the size change and blink when you need to.",
        "Accommodation training. Let your lens adjust naturally with each size change.",
        "The shape is pulsing between near and far. Ride that shift without straining.",
        "Focus in as it grows, defocus as it shrinks. It's a workout for your ciliary muscle.",
      ]));
    } else if (drill === "peripheral") {
      const dur = r.int(18, 40);
      push(ctx, "eye-peripheral", dur, { flashEvery: r.range(0.8, 2.0), count: r.int(1, 4), spread: r.range(0.28, 0.48), shape: r.pick(["dot", "triangle", "letter"]) }, r.pick([
        "Peripheral vision. Keep your eyes fixed on the center mark and simply notice the shapes appearing at the edges. Do not look at them.",
        "Stare only at the center. Count the shapes that flash around it using your side vision.",
        "Fix your gaze on the middle. Everything else is noticed, never chased.",
        "Peripheral awareness. Your center is locked. Your awareness is wide.",
        "Eyes forward. The targets are not for chasing — only for noticing.",
        "Anchor your gaze at the dot. Let the edges of your vision do the work.",
      ]));
    } else if (drill === "convergence") {
      const dur = r.int(22, 44);
      push(ctx, "eye-follow", dur, { path: "circle", speed: r.range(0.25, 0.65), size: r.int(8, 20), shape: "dot", trail: false, rotateDir: 1, convergence: true, color: r.pick(["red", "cyan", "white"]) }, r.pick([
        "Convergence drill. Watch the two targets as they approach each other. Keep both in focus.",
        "Both targets together now. Let your eyes converge as they meet in the center.",
        "Cross-eye training. Follow the targets toward each other without losing either one.",
        "Convergence. This exercise strengthens the muscles that pull your eyes inward to read and focus up close.",
      ]));
    } else if (drill === "blink-count") {
      const dur = r.int(16, 30);
      push(ctx, "eye-follow", dur, { path: "wave", speed: 0.4, size: 22, shape: "ring", trail: false, rotateDir: 1, blinkCued: true, color: "cyan" }, r.pick([
        "Blink training. Each time the ring pulses, do one full, slow blink. This resets your tear film.",
        "Deliberate blinking now. When the pulse happens, blink fully and slowly. Don't squint.",
        "Blink with the rhythm. Full blinks help rehydrate your eyes — especially after screen time.",
        "Structured blink drill. One full blink per pulse. This counters the reduced blinking that happens when we stare at screens.",
      ]));
    } else if (drill === "rotation") {
      // Clockwise / counterclockwise slow rotation drill
      const dur = r.int(20, 36);
      const dir = r.chance(0.5) ? "clockwise" : "counterclockwise";
      push(ctx, "eye-rotation", dur, { direction: dir, speed: r.range(0.3, 0.7), reps: r.int(2, 5) }, r.pick([
        `Slow eye rotation, ${dir}. Let your eyes travel the full circle — top, right, bottom, left. Keep the arc smooth.`,
        `Eye circles ${dir}. This stretches the extraocular muscles and increases their range of motion.`,
        `Rolling your eyes ${dir} deliberately is a real exercise. Nice and slow, all the way around.`,
        `${dir.charAt(0).toUpperCase() + dir.slice(1)} rotation now. If you feel a slight tension, that's the muscle working.`,
      ]));
    } else if (drill === "tracing") {
      // Trace a fixed shape on the screen without a moving dot
      const shape = r.pick(["H", "star", "diamond", "infinity", "clock"]);
      const dur = r.int(18, 34);
      push(ctx, "eye-tracing", dur, { shape, speed: r.range(0.4, 0.9), reps: r.int(2, 4) }, r.pick([
        `Trace the ${shape} shape with your eyes, slowly and precisely. No dot to follow — just the outline.`,
        `Eye tracing — ${shape}. Go around the edges deliberately. This trains controlled, intentional eye movement.`,
        `Slowly trace the ${shape} without moving your head. Precision over speed.`,
        `The ${shape} is your guide. Trace every edge calmly and without rushing.`,
      ]));
    } else if (drill === "palming") {
      push(ctx, "eye-palming", r.int(12, 22), { warm: r.chance(0.6) }, r.pick([
        "Rest time. Rub your palms together until warm, then cup them gently over your closed eyes. Breathe.",
        "Close your eyes and cover them with warm palms. Let the darkness relax everything.",
        "Palming break. Eyes closed, palms cupped, slow breaths.",
        "Palm your eyes now. The warmth and darkness are deeply restoring.",
        "Cup your warm palms over your closed eyes. Imagine complete darkness. Let your eye muscles go limp.",
        "Palming — the oldest eye rest technique. Warm hands, closed eyes, full darkness. Rest here.",
      ]));
    }
    if (round % 3 === 0 && r.chance(0.55)) push(ctx, "interlude", r.int(4, 8), { text: r.pick(["Blink a few times", "Relax your jaw", "Shoulders down", "Halfway there", "Keep your head still", "You're doing great", "Unclench your forehead", "Look away for a moment", "Roll your neck gently", "Good work so far"]) });
  }
  push(ctx, "outro", 9, { text: r.pick(["Session complete", "Well done", "See you tomorrow", "Eyes refreshed", "Good work", "Great session"]) }, r.pick([
    "That's the end of the session. Blink a few times, look at something far away, and enjoy the rest of your day.",
    "Great work. Do this once a day and your eyes will thank you. Subscribe for a new routine tomorrow.",
    "Session complete. Remember to rest your eyes every twenty minutes when working on screens.",
    "Nice session. Your eyes have been trained, stretched and rested. Come back tomorrow for a new routine.",
    "Done. Your eyes have earned a rest. Look out the window at something distant before going back to your screen.",
    "That's it. Blink ten times slowly, then let your eyes fall closed for a few seconds before continuing your day.",
  ]));
}

// ---------------- MATH ----------------
function mathProblem(r: RNG, level: number): { q: string; a: string; speak: string } {
  const kindPool = level < 2
    ? ["add", "sub", "mul"]
    : level < 4
    ? ["add", "sub", "mul", "div", "square", "percent", "order"]
    : ["mul", "div", "square", "percent", "mixed", "root", "order", "cube"];
  const kind = r.pick(kindPool);
  switch (kind) {
    case "add": { const a = r.int(10, 60 + level * 60), b = r.int(10, 60 + level * 60); return { q: `${a} + ${b}`, a: `${a + b}`, speak: `${a} plus ${b}` }; }
    case "sub": { let a = r.int(20, 80 + level * 60), b = r.int(5, 60 + level * 40); if (b > a) [a, b] = [b, a]; return { q: `${a} − ${b}`, a: `${a - b}`, speak: `${a} minus ${b}` }; }
    case "mul": { const a = r.int(3, 9 + level * 3), b = r.int(3, 12 + level * 2); return { q: `${a} × ${b}`, a: `${a * b}`, speak: `${a} times ${b}` }; }
    case "div": { const b = r.int(2, 9 + level * 2), c = r.int(2, 12 + level * 2); return { q: `${b * c} ÷ ${b}`, a: `${c}`, speak: `${b * c} divided by ${b}` }; }
    case "square": { const a = r.int(4, 12 + level * 4); return { q: `${a}²`, a: `${a * a}`, speak: `${a} squared` }; }
    case "cube": { const a = r.int(2, 6 + level); return { q: `${a}³`, a: `${a * a * a}`, speak: `${a} cubed` }; }
    case "root": { const a = r.int(4, 20); return { q: `√${a * a}`, a: `${a}`, speak: `the square root of ${a * a}` }; }
    case "percent": { const p = r.pick([10, 20, 25, 50, 5, 15, 75]), n = r.int(2, 40) * 20; return { q: `${p}% of ${n}`, a: `${(p * n) / 100}`, speak: `${p} percent of ${n}` }; }
    case "order": { const a = r.int(1, 20), b = r.int(2, 8), c = r.int(2, 9); return { q: `${a} + ${b} × ${c}`, a: `${a + b * c}`, speak: `${a} plus ${b} times ${c}` }; }
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
  push(ctx, "title", 6, {
    title: r.pick(["Mental Math", "Math Sprint", "Quick Math", "Brain Math", "Number Drill", "Math Blitz", "Speed Math"]),
    sub: `${levelName} · ${r.pick(["answer before the timer", "no calculator", "how many can you get?", "beat the clock"])}`,

  }, r.pick([
    `Welcome to a ${levelName.toLowerCase()} mental math session. Each question has a timer. Say your answer out loud before it runs out.`,
    `Time for a math sprint. ${levelName} level today. Solve each problem in your head before the reveal.`,
    `Let's warm up your brain with some ${levelName.toLowerCase()} arithmetic. Ready?`,
    `${levelName} math challenge. No calculator, no pen — just your brain. Let's go.`,
  ]));
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
    if (n % 8 === 0) push(ctx, "interlude", r.int(4, 6), { text: r.pick(["Keep going", "Nice streak", "Shake it out", "Halfway", "Stay sharp", "You've got this"]) }, r.pick(["Nice. Keep the pace.", "Good. Next set.", undefined]));
  }
  push(ctx, "outro", 10, { text: `${correctTally} problems done` }, r.pick([
    `That's ${correctTally} problems. How many did you get? Tell us in the comments and come back tomorrow for a new set.`,
    `Session over. ${correctTally} problems solved. Subscribe for a fresh set every day.`,
    `${correctTally} questions done. Challenge a friend and see who scores higher. New session drops tomorrow.`,
  ]));
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
  push(ctx, "title", 6, {
    title: r.pick(["Game Time", "Play Session", "Level Up", "Game On", "Arcade Mode", "Gaming Hour", "Play Mode", "Game Session", "Let's Play", "Gameplay Arena"]),
    sub: r.pick(["classic arcade games", "retro gaming", "satisfying gameplay", "game collection", "arcade classics", "pixel perfect", "game variety", "gaming session"]),
  }, r.pick([
    "Welcome to the arcade. A collection of classic games, each with unique mechanics.",
    "Different games, different challenges. Let's see what we have today.",
    "Relax and enjoy. Each game brings its own style and strategy.",
    "Classic arcade games reimagined. Pick your favorite and enjoy the ride.",
    "Every run is unique. Same rules, different seed, always a new outcome.",
    "Pure gaming entertainment. Watch the classics come to life.",
  ]));

  const ALL_GAMES: SceneKind[] = [
    "game-snake", "game-snake",
    "game-breakout", "game-breakout",
    "game-maze", "game-maze",
    "game-life", "game-life",
    "game-marbles",
    "game-pong",
    "game-tetris",
    "game-flappy",
    "game-asteroids",
    "game-sort",
    "game-pathfinder",
    "game-sand",
    "game-chess",
  ];
  const games = r.shuffle(ALL_GAMES);
  let i = 0;

  while (ctx.t < target - 12) {
    const g = games[i % games.length];
    i++;

    if (g === "game-snake") {
      const theme = r.pick(["neon", "retro", "flat", "pastel", "dark"]);
      const cols = r.int(16, 32);
      push(ctx, g, r.int(38, 95), { cols, stepsPerSec: r.range(5, 13), theme, seed: r.int(1, 1e9), wrap: r.chance(0.3) }, r.pick([
        "Classic snake game. Follow the path to the fruit and grow.",
        `${cols}×${Math.round(cols * 0.56)} grid snake with ${theme} theme. See how long it gets.`,
        "The snake knows its path. Every turn calculated, every fruit claimed.",
        "How big can this snake grow? Let's find out together.",
        "Satisfying snake run. Every move is planned, every fruit is earned.",
        "Snake game - visit every cell and claim the perfect score.",
      ]));
    } else if (g === "game-breakout") {
      const rows = r.int(4, 8), cols2 = r.int(8, 16);
      const ballSpeed = r.range(0.8, 1.8);
      push(ctx, g, r.int(32, 85), { rows, cols: cols2, speed: ballSpeed, seed: r.int(1, 1e9), bricks: r.pick(["standard", "striped", "random", "diamond"]) }, r.pick([
        "Breakout. Clear every brick, one bounce at a time.",
        `${rows}×${cols2} brick layout. Ball speed ${ballSpeed.toFixed(1)}x. Let's clear them all.`,
        "Classic brick breaker. Watch the wall come down piece by piece.",
        "Watch the ball bounce through the entire layout. Satisfying every time.",
        "Breakout session. Every brick must go.",
        "Clear the board. No brick survives this run.",
      ]));
    } else if (g === "game-maze") {
      const algo = r.pick(["bfs", "dfs", "astar", "dijkstra"]);
      const mazeSize = r.int(15, 40);
      push(ctx, g, r.int(28, 75), { cols: mazeSize, algo, seed: r.int(1, 1e9), showExploration: r.chance(0.7) }, r.pick([
        `${algo.toUpperCase()} maze solving. Watch the search expand, then trace the shortest path.`,
        `Fresh ${mazeSize}×${Math.round(mazeSize * 0.56)} maze. Generated in real time, solved instantly.`,
        "Maze solving. Explore first, then find the optimal route.",
        "Watch the search spread from start. When it hits the exit, the path snaps into view.",
        `${algo === "astar" ? "A-star" : algo === "bfs" ? "Breadth-first" : algo === "dfs" ? "Depth-first" : "Dijkstra's"} search through a fresh maze.`,
        "Finding the shortest path through the maze.",
      ]));
    } else if (g === "game-life") {
      const density = r.range(0.15, 0.42);
      const style = r.pick(["squares", "dots", "glow", "hex", "circles"]);
      push(ctx, g, r.int(22, 60), { cols: r.int(40, 100), density, stepsPerSec: r.range(5, 16), seed: r.int(1, 1e9), style }, r.pick([
        `Game of Life — ${style} style. ${Math.round(density * 100)}% initial density. Watch what emerges.`,
        "Conway's Game of Life. Simple rules, infinite complexity.",
        "Cellular automata. Patterns bloom, collapse, and stabilize.",
        "From random noise, recognizable patterns form. Emergent complexity at work.",
        "Four rules. Zero players. Endless outcomes. Conway's masterpiece.",
        "Watch the population surge, crash, and settle into a stable rhythm.",
      ]));
    } else if (g === "game-marbles") {
      const count = r.int(8, 28);
      push(ctx, g, r.int(32, 78), { count, gravity: r.range(0.5, 1.4), pegs: r.int(8, 36), seed: r.int(1, 1e9), style: r.pick(["classic", "neon", "pastel"]) }, r.pick([
        `${count} marbles, one winner. Physics decides. Pick your color.`,
        "Marble race. Pure physics — just gravity and geometry.",
        "Which one reaches the bottom first? Place your bets.",
        "Pure physics simulation. Chaotic until the winner emerges.",
        "The pegs make every race unique. Same track, different result every time.",
        "Marble run. Beauty in the chaos of Newtonian physics.",
      ]));
    } else if (g === "game-pong") {
      const difficulty = r.pick(["easy", "medium", "hard", "perfect"]);
      push(ctx, g, r.int(35, 80), { difficulty, speed: r.range(0.8, 1.6), seed: r.int(1, 1e9), style: r.pick(["classic", "neon", "minimal"]) }, r.pick([
        `Pong — ${difficulty} level. Both paddles in action.`,
        "The original game. The rally continues endlessly.",
        `Classic Pong. Difficulty: ${difficulty}. Watch the volleys.`,
        `Pong. Invented in 1972. Still satisfying to watch in ${new Date().getFullYear()}.`,
        "Both paddles tracking the ball. The rally never stops.",
        "The world's simplest game. Still captivating decades later.",
      ]));
    } else if (g === "game-tetris") {
      const level = r.int(1, 15);
      push(ctx, g, r.int(40, 90), { level, seed: r.int(1, 1e9), style: r.pick(["classic", "neon", "ghost"]), showNext: r.chance(0.8), hardDrop: r.chance(0.6) }, r.pick([
        `Tetris — level ${level}. Every piece placed optimally.`,
        "Tetris session. Watch the line clears stack up.",
        `Level ${level} Tetris. Satisfying clears ahead.`,
        "Every piece placed with intention. Every line cleared with satisfaction.",
        "Tetris gameplay — optimal placement, one piece at a time.",
        "No hesitation. Just smooth Tetris action.",
      ]));
    } else if (g === "game-flappy") {
      push(ctx, g, r.int(30, 70), { seed: r.int(1, 1e9), style: r.pick(["original", "neon", "minimal", "space"]), gravity: r.range(0.6, 1.2), gapSize: r.range(0.18, 0.28) }, r.pick([
        "Flappy Bird. Perfect timing through every gap.",
        "Flappy session. Watch the precise navigation through the pipes.",
        "Flappy Bird gameplay. How far can we go?",
        "Watch the perfect timing and gap navigation.",
        "Every flap is perfectly timed. Every gap is cleared smoothly.",
        "How many pipes can we clear? Let's find out.",
      ]));
    } else if (g === "game-asteroids") {
      push(ctx, g, r.int(35, 80), { seed: r.int(1, 1e9), style: r.pick(["classic", "neon", "wireframe"]), difficulty: r.pick(["normal", "hard", "survival"]), shipCount: r.int(1, 3) }, r.pick([
        "Asteroids. Navigate, rotate, and fire. Every rock gets split and cleared.",
        "Classic Asteroids gameplay. Threading through the debris field.",
        "Watch the ship navigate through space rocks. Every shot counts.",
        "Asteroids run. Clear the screen systematically.",
        "Evade and eliminate. Classic space shooter action.",
        "Threading through the asteroid field. Precision shots clear the way.",
      ]));
    } else if (g === "game-sort") {
      const algo = r.pick(["bubble", "merge", "quick", "heap", "insertion", "selection", "shell", "radix"]);
      const n = r.int(20, 120);
      push(ctx, g, r.int(25, 65), { algo, n, seed: r.int(1, 1e9), style: r.pick(["bars", "dots", "scatter", "waveform"]), sound: r.chance(0.4) }, r.pick([
        `${algo.charAt(0).toUpperCase() + algo.slice(1)} sort — ${n} elements. Watch the comparisons and swaps.`,
        `Visualizing ${algo} sort. See the sorting process in real time.`,
        `${n} unsorted values. ${algo} sort will organize them. Watch how.`,
        `${algo === "merge" ? "Merge sort divides and conquers" : algo === "quick" ? "Quick sort pivots through" : algo === "heap" ? "Heap sort builds the structure" : algo === "bubble" ? "Bubble sort compares neighbors" : algo === "radix" ? "Radix sort works digit by digit" : "Sorting"} — visualized.`,
        "Sorting in motion. Every comparison is a step toward order.",
        "From chaos to perfect order. This is what sorting looks like.",
      ]));
    } else if (g === "game-pathfinder") {
      const pfAlgo = r.pick(["astar", "dijkstra", "greedy", "jps"]);
      push(ctx, g, r.int(28, 65), { algo: pfAlgo, seed: r.int(1, 1e9), obstacles: r.pick(["random", "maze", "rooms", "spiral"]), heuristic: r.pick(["manhattan", "euclidean", "chebyshev"]) }, r.pick([
        `${pfAlgo === "astar" ? "A*" : pfAlgo === "jps" ? "Jump Point Search" : pfAlgo.charAt(0).toUpperCase() + pfAlgo.slice(1)} pathfinding — navigating around obstacles.`,
        "Pathfinding visualized. Explore, backtrack, find the best route.",
        "Finding the shortest path through obstacles.",
        "Watch the search expand until it reaches the goal.",
        "Every node visited, every shortcut found. Pathfinding in action.",
        "This is how navigation algorithms find the optimal route.",
      ]));
    } else if (g === "game-sand") {
      push(ctx, g, r.int(30, 70), { seed: r.int(1, 1e9), elements: r.pick(["sand", "water", "fire", "mixed", "all"]), rate: r.range(0.4, 1.0), style: r.pick(["pixel", "smooth"]) }, r.pick([
        "Falling sand simulation. Particles flow, pile, and interact with each other.",
        "Sand physics. Each grain falls, slides, and settles according to simple rules.",
        "Watch water fill the gaps and fire spread upward. It's a tiny physics world.",
        "Falling sand — the meditative simulation. No goal, no score, just particle physics.",
        "Every particle follows two rules: fall down, slide to a free space. The result is strangely beautiful.",
        "Particle simulation running. Sand, water, fire — watch them interact.",
      ]));
    } else if (g === "game-chess") {
      const depth = r.int(2, 5);
      push(ctx, g, r.int(45, 100), { depth, seed: r.int(1, 1e9), style: r.pick(["classic", "minimal", "neon"]), showEval: r.chance(0.5), opening: r.pick(["random", "sicilian", "kings-indian", "london", "ruy-lopez"]) }, r.pick([
        `Chess — depth ${depth} engine vs depth ${depth} engine. ${r.pick(["Sicilian", "King's Indian", "London", "Random"])} opening.`,
        "Two chess engines playing each other. No emotions, no fatigue — just evaluation.",
        `Depth-${depth} minimax chess. Every move is evaluated ${Math.pow(depth, 2)} positions ahead.`,
        "Watch the bot choose its opening, develop its pieces, and build toward the endgame.",
        "Chess at machine speed. The evaluation score shifts with every move.",
        "Two algorithms playing the world's most studied game. Let's see who resigns first.",
      ]));
    }

    if (i % 2 === 0 && r.chance(0.5)) {
      push(ctx, "interlude", r.int(3, 6), { text: r.pick(["Next game", "Loading...", `Round ${i + 1}`, "Insert coin", "Switching games", "New seed", "Initializing...", `Game ${i + 1}`]) });
    }
  }

  push(ctx, "outro", 9, { text: r.pick(["Game Over", "Thanks for watching", "Continue?", "See you tomorrow", "End of session", "Run complete"]) }, r.pick([
    "That's the session. New games and new seeds tomorrow.",
    "Game over. Subscribe for daily auto play.",
    "Thanks for watching the machine play.",
    "New session drops tomorrow. Same time, different seeds.",
    "Every session is generated fresh. Come back tomorrow for a different run.",
    "Session ended. The algorithms will be back with new configurations tomorrow.",
  ]));
}


// ---------------- BRAIN ----------------
const BRAIN_TRIVIA = [
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
  // Extended set
  { q: "How many chambers does a human heart have?", opts: ["2", "3", "4", "5"], a: 2 },
  { q: "Which planet is closest to the Sun?", opts: ["Venus", "Mars", "Mercury", "Earth"], a: 2 },
  { q: "What is the chemical symbol for gold?", opts: ["Gd", "Go", "Au", "Ag"], a: 2 },
  { q: "How many continents are there?", opts: ["5", "6", "7", "8"], a: 2 },
  { q: "Which country invented the internet?", opts: ["Japan", "UK", "USA", "Germany"], a: 2 },
  { q: "How many teeth does an adult human have?", opts: ["28", "30", "32", "34"], a: 2 },
  { q: "What is the tallest mountain on Earth?", opts: ["K2", "Kangchenjunga", "Everest", "Lhotse"], a: 2 },
  { q: "Which gas makes up most of Earth's atmosphere?", opts: ["Oxygen", "Carbon dioxide", "Nitrogen", "Argon"], a: 2 },
  { q: "How many legs does a spider have?", opts: ["6", "7", "8", "10"], a: 2 },
  { q: "Who painted the Mona Lisa?", opts: ["Michelangelo", "Raphael", "Da Vinci", "Botticelli"], a: 2 },
  { q: "What is the capital of Japan?", opts: ["Osaka", "Kyoto", "Hiroshima", "Tokyo"], a: 3 },
  { q: "How many days are in a leap year?", opts: ["364", "365", "366", "367"], a: 2 },
  { q: "Which organ filters blood in the human body?", opts: ["Liver", "Spleen", "Kidney", "Pancreas"], a: 2 },
  { q: "What is the speed of sound in air (approx)?", opts: ["300 m/s", "343 m/s", "400 m/s", "500 m/s"], a: 1 },
  { q: "How many keys does a standard piano have?", opts: ["76", "80", "88", "92"], a: 2 },
  { q: "Which country has the most natural lakes?", opts: ["Russia", "USA", "Brazil", "Canada"], a: 3 },
];
const WORDS = ["planet", "guitar", "window", "silver", "forest", "rocket", "camera", "bridge", "jungle", "pencil", "candle", "island", "garden", "mirror", "puzzle", "violin", "orange", "dragon", "ladder", "castle", "tunnel", "meadow", "anchor", "basket", "wizard", "helmet", "marble", "engine", "falcon", "harbor", "blanket", "captain", "crystal", "diamond", "eclipse", "feather", "glacier", "horizon", "lantern", "leopard", "monsoon", "phantom", "quantum", "raven", "safari", "sphinx", "thunder", "voyage", "walrus", "zenith"];

function brain(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Brain Teasers", "Mind Gym", "Quick Quiz", "Memory & Logic", "Think Fast", "Brain Blast", "Mind Sprint"]),
    sub: r.pick(["memory · trivia · words", "beat the timer", "train your brain daily", "no peeking"]),

  }, r.pick([
    "Welcome to brain training. Memory, trivia and words. Answer out loud before the reveal.",
    "Let's exercise your brain. Watch closely, remember, and answer fast.",
    "Brain teasers today. No pressure, just play.",
    "Memory, trivia, word scrambles — let's find out how sharp you are.",
  ]));
  const trivia = r.shuffle(BRAIN_TRIVIA);
  const words = r.shuffle(WORDS);
  let ti = 0, wi = 0, n = 0;
  while (ctx.t < target - 12) {
    const kind = r.pick(["memory", "trivia", "trivia", "word", "trivia"]);
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
  push(ctx, "outro", 9, { text: r.pick(["Well played", "Nice work", "Sharp mind"]) }, r.pick(["That's all for today. How did you score? New puzzles tomorrow.", "Brain workout done. Come back tomorrow for a fresh set.", "That's the session. Subscribe to keep your brain sharp every day."]));
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

// ---------------- RIDDLES ----------------
function riddles(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Riddle Time", "Brain Benders", "Think About It", "Puzzle Hour", "Riddle Challenge"]),
    sub: r.pick(["can you solve them all?", "classic riddles", "lateral thinking", "brain teasers", "mystery puzzles"]),
  }, r.pick([
    "Welcome to riddle time. Listen carefully, think creatively, and see if you can solve them before the reveal.",
    "Classic riddles and brain teasers. Some are tricky, some are clever. All of them will make you think.",
    "Let's test your lateral thinking. Each riddle has a surprising answer.",
    "Think outside the box. The answers are simpler than you think — or are they?",
  ]));

  const shuffled = r.shuffle([...RIDDLES]);
  let riddleIndex = 0;
  
  while (ctx.t < target - 12) {
    const riddleData = shuffled[riddleIndex % shuffled.length];
    riddleIndex++;
    
    const thinkTime = riddleData.difficulty === "easy" ? r.int(8, 12) : riddleData.difficulty === "medium" ? r.int(12, 16) : r.int(15, 20);
    const revealTime = r.int(4, 6);
    
    // Question
    push(ctx, "riddle", thinkTime, { 
      question: riddleData.question, 
      answer: riddleData.answer,
      hints: riddleData.hints,
      difficulty: riddleData.difficulty,
      phase: "question"
    }, r.pick([
      `Here's a ${riddleData.difficulty} one. ${riddleData.question}`,
      riddleData.question,
      `Think about this: ${riddleData.question}`,
    ]));
    
    // Reveal
    push(ctx, "riddle", revealTime, { 
      question: riddleData.question, 
      answer: riddleData.answer,
      hints: riddleData.hints,
      difficulty: riddleData.difficulty,
      phase: "answer"
    }, r.pick([
      `The answer is: ${riddleData.answer}.`,
      `Did you get it? ${riddleData.answer}.`,
      `${riddleData.answer}. ${r.pick(["Got it?", "Make sense?", "Clever, right?"])}`,
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["How many did you get?", "Nice work", "Thanks for playing"]) }, r.pick(["How many did you solve? Let us know in the comments.", "That's all for today. See you next time for more riddles."]));
}

// ---------------- TRIVIA ----------------
function trivia(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Trivia Time", "Quiz Challenge", "Test Your Knowledge", "Trivia Quiz", "Know It All"]),
    sub: r.pick(["multiple choice quiz", "test your knowledge", "general knowledge", "quick questions", "brain quiz"]),
  }, r.pick([
    "Time to test your knowledge. Multiple choice questions across all categories. Let's see how many you can get right.",
    "General knowledge quiz. Read carefully, think fast, and choose your answer.",
    "From history to science to pop culture — how much do you really know?",
    "Quick trivia challenge. No cheating! Pick your answers before the reveal.",
  ]));

  const shuffled = r.shuffle([...TRIVIA]);
  let triviaIndex = 0;
  
  while (ctx.t < target - 12) {
    const triviaData = shuffled[triviaIndex % shuffled.length];
    triviaIndex++;
    
    const thinkTime = triviaData.difficulty === "easy" ? r.int(6, 10) : triviaData.difficulty === "medium" ? r.int(10, 14) : r.int(12, 16);
    const revealTime = r.int(4, 6);
    
    // Question
    push(ctx, "trivia-quiz", thinkTime, { 
      question: triviaData.question,
      options: triviaData.options,
      answer: triviaData.answer,
      difficulty: triviaData.difficulty,
      category: triviaData.category,
      phase: "question"
    }, r.pick([
      `${triviaData.category.replace("_", " ").toUpperCase()}. ${triviaData.question}`,
      triviaData.question,
      `Question: ${triviaData.question}`,
    ]));
    
    // Reveal
    push(ctx, "trivia-quiz", revealTime, { 
      question: triviaData.question,
      options: triviaData.options,
      answer: triviaData.answer,
      difficulty: triviaData.difficulty,
      category: triviaData.category,
      phase: "answer"
    }, r.pick([
      `The answer is ${String.fromCharCode(65 + triviaData.answer)}: ${triviaData.options[triviaData.answer]}.`,
      `Correct answer: ${triviaData.options[triviaData.answer]}.`,
      `It's ${triviaData.options[triviaData.answer]}. ${r.pick(["Did you get it?", "Knew that one?", "Easy one!"])}`,
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["How'd you do?", "Nice job", "Thanks for playing"]) }, r.pick(["Count up your score. How many did you get right?", "That's the end of the quiz. Come back for more trivia next time."]));
}

// ---------------- MEMORY CHALLENGES ----------------
function memory(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Memory Challenge", "Recall Test", "Brain Memory", "Remember This", "Memory Master"]),
    sub: r.pick(["sequence recall", "pattern matching", "visual memory", "memory training"]),
  }, r.pick([
    "Memory training time. Watch carefully, remember the patterns, and test your recall.",
    "Let's test your memory. Pay attention to the sequences and see how much you can remember.",
    "Memory challenges ahead. Focus, observe, and recall.",
  ]));

  const shuffled = r.shuffle([...MEMORY_CHALLENGES]);
  let memIndex = 0;
  
  while (ctx.t < target - 12) {
    const memData = shuffled[memIndex % shuffled.length];
    memIndex++;
    
    const data = memData.data as { length: number };
    const seq = Array.from({ length: data.length }, () => r.int(0, 3));
    const showDur = data.length * 0.9 + 1.5;
    const recall = memData.difficulty === "easy" ? r.int(6, 8) : memData.difficulty === "medium" ? r.int(5, 7) : r.int(4, 6);
    
    push(ctx, "memory-challenge", showDur + recall + 4, {
      seq,
      showDur,
      recall,
      difficulty: memData.difficulty,
    }, r.pick([
      "Watch the sequence carefully.",
      "Memorize the pattern.",
      "Remember the colors in order.",
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["Great recall!", "Well remembered", "Nice work"]) }, r.pick(["How many did you get? Memory improves with practice.", "That's it for today. Come back tomorrow to train your memory again."]));
}

// ---------------- WOULD YOU RATHER ----------------
function wouldyourather(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Would You Rather", "Tough Choices", "Pick One", "This or That", "Choose Wisely"]),
    sub: r.pick(["impossible decisions", "fun dilemmas", "thought-provoking", "make your choice"]),
  }, r.pick([
    "Time for some tough choices. Would you rather scenarios that will make you think.",
    "Welcome to Would You Rather. Some easy, some impossible. What would YOU choose?",
    "Fun dilemmas ahead. Pick your choice and see what most people would do.",
  ]));

  const shuffled = r.shuffle([...WOULD_YOU_RATHER]);
  let index = 0;
  
  while (ctx.t < target - 12) {
    const data = shuffled[index % shuffled.length];
    index++;
    
    const duration = r.int(15, 22); // Increased for better engagement
    
    push(ctx, "would-you-rather", duration, {
      question: data.question,
      optionA: data.optionA,
      optionB: data.optionB,
      category: data.category,
      funFact: data.funFact,
    }, r.pick([
      `${data.question} ${data.optionA}, or ${data.optionB}?`,
      `Tough choice: ${data.optionA} or ${data.optionB}?`,
      data.funFact || `${data.optionA} versus ${data.optionB}. What's your pick?`,
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["What did you choose?", "Tough choices", "Thanks for playing"]) }, r.pick(["Which scenarios stumped you? Let us know in the comments.", "That's all the dilemmas for today. More tomorrow!"]));
}

// ---------------- MYTH BUSTERS ----------------
function mythbusters(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Myth Busters", "True or False", "Fact Check", "Busted!", "Myth or Fact"]),
    sub: r.pick(["common misconceptions", "truth revealed", "fact vs fiction", "busting myths"]),
  }, r.pick([
    "Time to bust some myths. Common beliefs that are actually wrong. True or false?",
    "Myth Busters! Let's separate fact from fiction and reveal the truth.",
    "How many of these myths did you believe? Prepare to be surprised.",
  ]));

  const shuffled = r.shuffle([...MYTHS]);
  let index = 0;
  
  while (ctx.t < target - 18) {
    const data = shuffled[index % shuffled.length];
    index++;
    
    const thinkTime = r.int(8, 12); // Increased for better engagement
    const revealTime = r.int(7, 11); // Increased for better engagement
    
    // Question phase
    push(ctx, "myth-buster", thinkTime, {
      myth: data.myth,
      isTrue: data.isTrue,
      explanation: data.explanation,
      category: data.category,
      phase: "question"
    }, r.pick([
      `True or false: ${data.myth}`,
      `Myth: ${data.myth}. Is this true?`,
      `${data.myth}. Fact or fiction?`,
    ]));
    
    // Reveal phase
    push(ctx, "myth-buster", revealTime, {
      myth: data.myth,
      isTrue: data.isTrue,
      explanation: data.explanation,
      category: data.category,
      phase: "answer"
    }, r.pick([
      `${data.isTrue ? "TRUE!" : "BUSTED!"} ${data.explanation}`,
      `The answer is ${data.isTrue ? "true" : "false"}. ${data.explanation}`,
      data.explanation,
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["Myths busted!", "Now you know", "Truth revealed"]) }, r.pick(["How many did you guess correctly? More myth busting tomorrow.", "That's all the myths for today. Keep questioning everything!"]));
}

// ---------------- QUICK POLLS ----------------
function polls(ctx: Ctx, target: number) {
  const r = ctx.rng;
  push(ctx, "title", 6, {
    title: r.pick(["Quick Polls", "You Decide", "Cast Your Vote", "Opinion Time", "What Do You Think"]),
    sub: r.pick(["fun questions", "share your opinion", "vote now", "quick polls"]),
  }, r.pick([
    "Quick polls! Fun questions to see what everyone thinks. Cast your vote in the comments.",
    "Time for some quick polls. What's your opinion? Vote and see what others think.",
    "Simple questions, fun answers. Let's see where you stand on these topics.",
  ]));

  const shuffled = r.shuffle([...POLLS]);
  let index = 0;
  
  while (ctx.t < target - 12) {
    const data = shuffled[index % shuffled.length];
    index++;
    
    const duration = r.int(12, 18); // Increased for better engagement
    
    push(ctx, "quick-poll", duration, {
      question: data.question,
      options: data.options,
      category: data.category,
      funFact: data.funFact,
    }, r.pick([
      `${data.question} ${data.options.join(", or ")}?`,
      data.funFact || data.question,
      `Poll: ${data.question}`,
    ]));
  }
  
  push(ctx, "outro", 10, { text: r.pick(["Thanks for voting!", "Your turn", "Cast your votes"]) }, r.pick(["Drop your answers in the comments. Let's see what the majority thinks!", "That's all the polls for today. More fun questions tomorrow!"]));
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
    gameplay: [
      `${base} — ${scenes.filter((s) => s.kind.startsWith("game")).length} Classic Games ${emoji}`,
      `Arcade Session #${day}: Snake, Tetris, Breakout & More`,
      `Game Collection (${mins} min)`,
      `Classic Gameplay Session #${day}`,
      `Arcade Classics #${day} — Pong, Tetris, Snake & More`,
      `${mins} Min of Classic Gaming`,
    ],
    brain: [`${base}: Memory, Trivia & Word Puzzles ${emoji}`, `${mins} Minute Brain Workout #${day}`, `Can You Beat The Timer? Brain Teasers`, `Daily Brain Training — Quiz & Memory`],
    calm: [`${base} — ${mins} Minute Breathing Pacer ${emoji}`, `Guided Breathing & Focus Reset (${mins} min)`, `Quiet Minutes #${day}: Breathe With The Circle`, `Calm Reset — Slow Breathing Visual`],
    riddles: [`${base} — Can You Solve Them All? ${emoji}`, `${mins} Min Riddle Challenge #${day}`, `Brain Bending Riddles (${mins} min)`, `Classic Riddles & Lateral Thinking Puzzles`],
    trivia: [`${base}: ${scenes.filter((s) => s.kind === "trivia-quiz").length / 2} Questions ${emoji}`, `Trivia Quiz #${day} — Test Your Knowledge`, `${mins} Min General Knowledge Quiz`, `How Many Can You Get Right?`],
    memory: [`${base} — Simon Says Memory ${emoji}`, `${mins} Min Color Sequence Challenge`, `Memory Game #${day}`, `Can You Remember The Pattern?`],
    wouldyourather: [`${base} — Impossible Choices ${emoji}`, `${mins} Min Would You Rather`, `This or That #${day}`, `Tough Decisions Ahead`],
    mythbusters: [`${base} — True or False ${emoji}`, `${mins} Min Myth Busting`, `Fact Check #${day}`, `Common Myths Revealed`],
    polls: [`${base} — Quick Polls ${emoji}`, `${mins} Min Opinion Questions`, `You Decide #${day}`, `Vote Now!`],
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
    gameplay: ["classic games", "snake game", "breakout", "maze solving", "game of life", "marble race", "tetris", "pong", "sorting visualization", "pathfinding", "flappy bird", "asteroids", "particle simulation", "satisfying", "relaxing gameplay", "arcade classics"],
    brain: ["brain teasers", "trivia quiz", "memory game", "word scramble", "brain training", "quiz"],
    calm: ["breathing exercise", "meditation", "calm", "focus", "relax", "breathing pacer", "anxiety relief"],
    riddles: ["riddles", "brain teasers", "lateral thinking", "logic puzzles", "classic riddles", "wordplay", "mystery", "puzzle solving"],
    trivia: ["trivia quiz", "general knowledge", "quiz", "trivia questions", "test your knowledge", "multiple choice", "quiz challenge", "brain training"],
    memory: ["memory game", "simon says", "color sequence", "pattern matching", "recall challenge", "brain training", "memory test"],
    wouldyourather: ["would you rather", "this or that", "tough choices", "dilemmas", "impossible decisions", "fun questions", "opinion"],
    mythbusters: ["myth busters", "true or false", "fact check", "myths", "misconceptions", "busted", "truth revealed", "educational"],
    polls: ["quick polls", "opinion polls", "vote", "you decide", "surveys", "fun questions", "cast your vote"],
    mixed: ["brain training", "eye exercises", "mental math", "daily session", "focus"],
  };
  const tags = [...(tagBank[category] || []), "daily", orientation === "portrait" ? "shorts" : "generated"];
  const thumbHooks: Record<string, string[]> = {
    eye_training: ["FOLLOW THE DOT", "EYE WORKOUT", "KEEP YOUR HEAD STILL", "TRACK THIS", "EYE ROTATION", "TRACE THIS", "VISION DRILL", "BLINK TRAINING"],
    math: ["CAN YOU SOLVE IT?", "BEAT THE TIMER", "MENTAL MATH", "NO CALCULATOR", "ORDER OF OPS", "CUBE THIS", "MATH SPRINT"],
    story: [base, "THE LAST LETTER", "A STRANGE NIGHT", "WHAT HAPPENED?", "THE LOST KEY", "BEFORE DAWN"],
    gameplay: ["WATCH IT RUN", "CLASSIC ARCADE", "GAME TIME", "NEW RUN", "PIXEL PERFECT", "GAME ON", "PLAY SESSION", "ARCADE MODE"],
    brain: ["BEAT THE CLOCK", "CAN YOU REMEMBER?", "THINK FAST", "5 SECOND CHALLENGE", "DO YOU KNOW THIS?", "MEMORY TEST"],
    calm: ["BREATHE", "SLOW DOWN", "RESET YOUR MIND", "QUIET MINUTES", "JUST BREATHE"],
    riddles: ["CAN YOU SOLVE IT?", "THINK ABOUT IT", "MYSTERY TIME", "BRAIN BENDER", "WHAT AM I?", "RIDDLE THIS", "GOT THE ANSWER?"],
    trivia: ["DO YOU KNOW?", "QUIZ TIME", "TEST YOUR KNOWLEDGE", "TRUE OR FALSE?", "THINK FAST", "TRIVIA CHALLENGE", "HOW MANY CAN YOU GET?"],
    memory: ["WATCH CAREFULLY", "REMEMBER THIS", "SIMON SAYS", "COLOR CHALLENGE", "CAN YOU RECALL?", "MEMORY TEST", "PATTERN TIME"],
    wouldyourather: ["WOULD YOU RATHER", "THIS OR THAT", "TOUGH CHOICE", "YOU DECIDE", "PICK ONE", "IMPOSSIBLE DECISION", "CHOOSE WISELY"],
    mythbusters: ["TRUE OR FALSE?", "MYTH BUSTED", "FACT CHECK", "IS THIS REAL?", "TRUTH REVEALED", "BELIEVE IT?", "MYTH OR FACT"],
    polls: ["YOU DECIDE", "CAST YOUR VOTE", "WHAT DO YOU THINK?", "OPINION TIME", "VOTE NOW", "YOUR CHOICE", "QUICK POLL"],
    mixed: ["DAILY MIX", "TRY EVERYTHING", "MIND WORKOUT", "NEW SESSION"],
  };
  const thumbText = r.pick(thumbHooks[category] ?? [base.toUpperCase(), `${mins} MIN`, base, `DAY ${day}`]);
  const thumbSub = r.pick([catInfo?.label ?? "", `${mins} minutes`, `#${day}`, "new every day", ""]);
  return { title: title.slice(0, 100), description: desc, tags, thumbText, thumbSub };
}
function fmt(s: number) { const m = Math.floor(s / 60), r = Math.floor(s % 60); return `${m}:${r.toString().padStart(2, "0")}`; }
function chapterName(s: Scene): string {
  const d = s.data as Record<string, string | number>;
  switch (s.kind) {
    case "title": return String(d.title);
    case "outro": return "Outro";
    case "eye-follow": return d.convergence ? "Convergence" : d.blinkCued ? "Blink drill" : `Follow: ${d.path}`;
    case "eye-saccade": return `Saccades: ${d.style}`;
    case "eye-focus": return "Focus shift";
    case "eye-peripheral": return "Peripheral";
    case "eye-palming": return "Palming rest";
    case "eye-rotation": return `Eye rotation: ${d.direction}`;
    case "eye-tracing": return `Tracing: ${d.shape}`;
    case "math-question": return `Question ${d.index}`;
    case "math-sequence": return `Sequence ${d.index}`;
    case "story-panel": return `Part ${(d.panel as number) + 1}`;
    case "game-snake": return `Snake (${d.theme})`;
    case "game-breakout": return "Breakout";
    case "game-maze": return `Maze (${d.algo})`;
    case "game-life": return "Game of Life";
    case "game-marbles": return "Marble race";
    case "game-pong": return `Pong (${d.difficulty})`;
    case "game-tetris": return `Tetris level ${d.level}`;
    case "game-flappy": return "Flappy Bird";
    case "game-asteroids": return "Asteroids";
    case "game-sort": return `${String(d.algo).charAt(0).toUpperCase() + String(d.algo).slice(1)} sort`;
    case "game-pathfinder": return `Pathfinding (${d.algo})`;
    case "game-sand": return `Sand sim (${d.elements})`;
    case "game-chess": return `Chess depth-${d.depth}`;
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
  const target = opts.targetDuration ?? (orientation === "landscape" ? rng.int(245, 470) : rng.int(120, 178));
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
    case "riddles": riddles(ctx, target); break;
    case "trivia": trivia(ctx, target); break;
    case "memory": memory(ctx, target); break;
    case "wouldyourather": wouldyourather(ctx, target); break;
    case "mythbusters": mythbusters(ctx, target); break;
    case "polls": polls(ctx, target); break;
    default: mixed(ctx, target);
  }
  // Portrait (shorts): cap scene lengths and total at 180s (3 min - YouTube Shorts max)
  if (orientation === "portrait") {
    for (const s of ctx.scenes) {
      const need = s.narration ? estimateSpeech(s.narration) + 1.5 : 0;
      s.duration = Math.min(s.duration, Math.max(need, s.kind === "title" || s.kind === "outro" ? 5 : 25));
    }
    const total = () => ctx.scenes.reduce((a, s) => a + s.duration, 0);
    // Allow up to 180 seconds (3 minutes) for YouTube Shorts
    while (total() > 178 && ctx.scenes.length > 5) ctx.scenes.splice(ctx.scenes.length - 2, 1);
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
