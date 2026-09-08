# New Content Engines - Expansion Plan

## Current Engines (6)
1. ✅ Eye Training
2. ✅ Math Exercises  
3. ✅ Gameplay Videos
4. ✅ Brain Teasers
5. ✅ Story Narratives
6. ✅ Calm/Meditation

---

## Proposed New Engines (6 More)

### 7. RIDDLES 🧩
**Purpose**: Engage viewers with clever wordplay and logic puzzles

**Content Types:**
- Classic riddles ("What has keys but no locks?")
- Lateral thinking puzzles
- "What am I?" mysteries
- Brain-bending paradoxes
- Situational puzzles

**Thumbnail Scenes (10):**
1. Question Mark in Spotlight
2. Detective Magnifying Glass
3. Maze with Hidden Path
4. Lightbulb Moment
5. Lock and Key Mystery
6. Silhouette Profile Thinking
7. Puzzle Pieces Scattered
8. Hourglass Time Challenge
9. Door with Three Locks
10. Think Outside the Box

**Hook Examples:**
- "95% Get This Wrong"
- "Can You Solve It?"
- "Only Geniuses Get This"

---

### 8. TRIVIA 📚
**Purpose**: Test knowledge across various topics

**Content Types:**
- History facts
- Science questions
- Pop culture
- Geography challenges
- Sports statistics
- General knowledge

**Thumbnail Scenes (10):**
1. Quiz Show Podium
2. Multiple Choice Grid
3. Trophy and Medal
4. World Map Spotlight
5. Timeline with Dates
6. Fact vs Fiction Split
7. Knowledge Trophy Stack
8. Brain with Book
9. True/False Scales
10. Leaderboard Ranking

**Hook Examples:**
- "Do You Know The Answer?"
- "Test Your Knowledge"
- "99% Fail This Quiz"

---

### 9. MEMORY CHALLENGES 🧠
**Purpose**: Train working memory and recall

**Content Types:**
- Remember the sequence
- Spot the difference
- Match the pairs
- What changed?
- Number sequences
- Pattern recall

**Thumbnail Scenes (10):**
1. Grid of Flipped Cards
2. Sequence of Numbers
3. Two Nearly Identical Images
4. Memory Palace Door
5. Flash Cards Fanning
6. Timer with Icons
7. Pattern Recognition Grid
8. Simon Says Colors
9. Before/After Split
10. Spotlight on Details

**Hook Examples:**
- "Remember All 8?"
- "Can You Spot The Change?"
- "Memory Master Test"

---

### 10. LANGUAGE PUZZLES 📝
**Purpose**: Wordplay, vocabulary, and linguistic challenges

**Content Types:**
- Word scrambles
- Anagrams
- Synonyms/Antonyms
- Rhyme challenges
- Grammar puzzles
- Idiom explanations

**Thumbnail Scenes (10):**
1. Scattered Letter Tiles
2. Crossword Grid
3. Dictionary Book Open
4. Speech Bubbles Tangled
5. Alphabet Soup
6. Word Cloud Formation
7. Pen and Paper Challenge
8. Letter Blocks Stacking
9. Scrabble Board
10. Language Translation

**Hook Examples:**
- "Unscramble This Word"
- "Find The Hidden Word"
- "Vocabulary Challenge"

---

### 11. SCIENCE EXPERIMENTS 🔬
**Purpose**: Quick science facts and demonstrations

**Content Types:**
- Physics principles
- Chemistry reactions
- Biology facts
- Space discoveries
- Technology explained
- Scientific method

**Thumbnail Scenes (10):**
1. Test Tubes Bubbling
2. Atom Symbol Glowing
3. Microscope View
4. Rocket Launch
5. DNA Helix Spiral
6. Lab Coat Scientist
7. Periodic Table Highlight
8. Planetary Orbit
9. Chemical Formula
10. Lightning Bolt Energy

**Hook Examples:**
- "Science Fact or Fiction?"
- "Mind-Blowing Discovery"
- "How Does This Work?"

---

### 12. HISTORY MYSTERIES 🏛️
**Purpose**: Fascinating historical events and figures

**Content Types:**
- Historical what-ifs
- Ancient civilizations
- Famous figures
- Lost artifacts
- War strategies
- Cultural evolution

**Thumbnail Scenes (10):**
1. Ancient Scroll Unfurling
2. Hourglass with Dates
3. Stone Tablet with Symbols
4. Vintage Map and Compass
5. Crown and Scepter
6. Battlefield Strategy Map
7. Museum Artifact Spotlight
8. Time Machine Portal
9. Historical Figure Silhouette
10. Ancient vs Modern Split

**Hook Examples:**
- "History's Greatest Mystery"
- "What Really Happened?"
- "Hidden Truth Revealed"

---

## Implementation Priority

### Phase 1 (Immediate):
1. **Riddles** - Simplest to implement, high engagement
2. **Trivia** - Similar to math quizzes, easy adaptation

### Phase 2 (Next):
3. **Memory Challenges** - Moderate complexity
4. **Language Puzzles** - Good variety addition

### Phase 3 (Future):
5. **Science Experiments** - Requires more visual assets
6. **History Mysteries** - Needs curated content

---

## Technical Implementation

### For Each New Engine:

1. **Add Category Definition**
```typescript
// In composition engine
const CATEGORY = {
  riddles: { ... },
  trivia: { ... },
  memory: { ... },
  language: { ... },
  science: { ... },
  history: { ... }
}
```

2. **Create Thumbnail Function**
```typescript
// In thumbnail-categories.ts
export function drawRiddlesThumbnail(ctx, W, H, themeVariant, rng, hookOverride) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  // ... 10 scenes
}
```

3. **Add Content Generation Logic**
```typescript
// Scene generation for each engine
function generateRiddleScene(rng) {
  return {
    kind: "riddle-question",
    data: {
      question: "...",
      answer: "...",
      hints: [...]
    }
  };
}
```

4. **Register in Router**
```typescript
// Add to CATEGORY_THUMBNAILS
const CATEGORY_THUMBNAILS = {
  ...existing,
  riddles: { layout: "center-burst", ... },
  trivia: { layout: "corner-box", ... },
  // etc
}
```

---

## Content Database Structure

### Riddles Collection
```json
{
  "id": "riddle_001",
  "question": "What has keys but can't open locks?",
  "answer": "A piano",
  "difficulty": "easy",
  "category": "wordplay",
  "hints": ["Musical instrument", "Black and white"]
}
```

### Trivia Collection
```json
{
  "id": "trivia_001",
  "question": "What year did the first moon landing occur?",
  "answer": "1969",
  "options": ["1967", "1969", "1971", "1973"],
  "difficulty": "medium",
  "category": "space"
}
```

---

## Engagement Metrics

### Expected Performance:
- **Riddles**: High shares, strong engagement
- **Trivia**: Quick views, good retention
- **Memory**: Interactive, repeat views
- **Language**: Educational appeal, niche audience
- **Science**: Viral potential, broad appeal
- **History**: Story-driven, medium engagement

---

## Resource Requirements

### Content Creation:
- **Riddles**: 100 riddles to start
- **Trivia**: 200 questions across 10 categories
- **Memory**: 50 unique challenges
- **Language**: 100 word puzzles
- **Science**: 75 fact-based questions
- **History**: 50 historical events/figures

### Development Time:
- Per engine: ~2-3 days
- Total for 6 engines: **2-3 weeks**

---

## Success Metrics

### KPIs Per Engine:
- View completion rate > 80%
- Share rate > 5%
- Comment engagement > 2%
- Thumbnail CTR > 10%
- Channel subscription conversion > 1%

---

## Next Steps

1. ✅ Complete 800 thumbnail system (DONE)
2. 🟡 Gather content for Riddles engine
3. 🟡 Implement Riddles thumbnail renderer
4. 🟡 Create Riddles scene generator
5. ⬜ Test and iterate
6. ⬜ Repeat for other 5 engines

---

**Total Content Engines After Implementation: 12**  
**Total Unique Thumbnails: 12 × 800 = 9,600 variations**  
**Total Possible Videos: Nearly infinite with content variety** 🚀
