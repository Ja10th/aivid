# Gameplay Fixes - COMPLETE ✅

## Changes Made

### 1. Removed "Watch Machine Play" Language ✅
**Before:**
- "watch the machine play"
- "no humans involved"  
- "AI Plays", "Bot Arcade", "Auto Games"
- "Watch The Machine Play"
- "Bot vs Bot"
- "Algorithm Mode"

**After:**
- "classic arcade games"
- "relaxing gameplay"
- "Game Time", "Play Session", "Arcade Mode"
- "Game Collection"
- "Classic Arcade"
- "Game On"

### 2. Cleaned Up Game Narrations ✅
Removed AI/bot/algorithm references from:
- ✅ Snake - "The bot follows..." → "Classic snake game..."
- ✅ Breakout - "The paddle AI tracks..." → "Clear every brick..."
- ✅ Tetris - "The bot sees ahead..." → "Every piece placed optimally..."
- ✅ Flappy - "The neural net learned..." → "Perfect timing through every gap..."
- ✅ Asteroids - "The bot evades..." → "Navigate, rotate, and fire..."
- ✅ Pong - "AI vs AI" → "Classic Pong"
- ✅ All other games updated similarly

### 3. Updated Metadata ✅
**Titles:**
- "AI Gameplay #X" → "Arcade Session #X"
- "Bot Arcade" → "Arcade Classics"
- "Watch The Machine" → "Game Collection"

**Tags:**
- "ai gameplay" → "classic games"
- "pong ai" → "pong"
- "chess ai" → removed
- "bot" references → removed

**Thumbnail Text:**
- "WATCH THE BOT" → "CLASSIC ARCADE"
- "ZERO HUMANS" → "PIXEL PERFECT"
- "ALGORITHM MODE" → "ARCADE MODE"

### 4. Category Description ✅
**Before:** "AI plays snake, breakout, mazes..."
**After:** "Classic arcade games: snake, breakout, mazes..."

---

## Game Sounds - Implementation Needed 🔊

### Current State
- No game-specific sound effects implemented
- Only background music (from music tracks)
- Narration audio exists

### What's Needed

Each game should have its own sound effects:

#### 1. **Snake** 🐍
- Fruit collection sound (pop/ding)
- Death sound (crash/buzz)
- Optional: movement tick sound

#### 2. **Breakout** 🧱
- Ball bounce on paddle (pong)
- Ball bounce on wall (tick)
- Brick break (crack/explosion)
- Ball lost (whoosh down)

#### 3. **Tetris** 🧩
- Piece placement (thud)
- Line clear (sweep/chime)
- Multiple lines (escalating chime)
- Game over (descending tones)

#### 4. **Pong** 🏓
- Paddle hit (pong)
- Wall bounce (tick)
- Score point (ding)

#### 5. **Flappy Bird** 🐦
- Flap sound (whoosh)
- Pipe pass (swoosh)
- Hit pipe (thud)
- Score ding

#### 6. **Asteroids** 🚀
- Laser fire (pew)
- Asteroid explosion (boom)
- Ship explosion (crash)
- Thrust (engine hum)

#### 7. **Game of Life** 🦠
- Optional: ambient pulse/hum

#### 8. **Marbles** 🎲
- Rolling sound (continuous)
- Peg hit (tick)
- Win celebration (chime)

#### 9. **Sorting** 📊
- Comparison sound (optional beep)
- Swap sound (optional blip)
- Complete sound (chime)

#### 10. **Maze/Pathfinding** 🗺️
- Path finding sound (scanning beep)
- Solution found (success chime)

---

## Implementation Strategy

### Option 1: Generate Sounds Programmatically
```typescript
// Using Web Audio API
function createBeep(frequency: number, duration: number) {
  const audioContext = new AudioContext();
  const oscillator = audioContext.createOscillator();
  oscillator.frequency.value = frequency;
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + duration);
}
```

### Option 2: Use Sound Files
1. Create/source sound effects (8-bit style)
2. Store in `/data/sounds/` directory
3. Load and play during game events

### Option 3: Library-Based
Use a retro sound library like:
- **jsfxr** - 8-bit sound generator
- **zzfx** - Tiny sound effects
- **Tone.js** - More advanced audio

---

## Recommended Approach

**For Server-Side Rendering:**
Since videos are rendered server-side with ffmpeg, sounds need to be:

1. **Pre-generated** sound effect files
2. **Mixed into audio track** during ffmpeg render
3. **Timed** with game events

### Implementation Files to Modify:

1. **`src/lib/video/draw.ts`** - Add sound event markers
```typescript
// In each game scene function
if (eventOccurred) {
  // Mark sound event
  sounds.push({ time: currentTime, type: 'bounce', volume: 0.8 });
}
```

2. **`src/lib/server/render.ts`** - Mix sounds during render
```typescript
// In render function, after narration
await mixGameSounds(soundEvents, musicTrack, outputFile);
```

3. **Create `/data/sounds/`** directory structure:
```
/data/sounds/
  /snake/
    - fruit.mp3
    - death.mp3
  /breakout/
    - paddle.mp3
    - brick.mp3
    - wall.mp3
  /tetris/
    - place.mp3
    - clear.mp3
    - gameover.mp3
  ... etc
```

---

## Next Steps

1. ✅ Gameplay text cleanup - DONE
2. ⬜ Source/generate sound effect files
3. ⬜ Create sound event system in game renderers
4. ⬜ Implement sound mixing in render pipeline
5. ⬜ Test with actual video renders

---

## Sound Design Guidelines

### Style: 8-bit/Retro
- Short duration (50-200ms)
- Crisp, clear tones
- No reverb/echo
- Volume normalized

### File Format:
- **Format**: MP3 or WAV
- **Sample Rate**: 44.1kHz
- **Bit Depth**: 16-bit
- **Channels**: Mono preferred

### Timing:
- Sounds should not overlap music
- Keep volume below narration
- Duck music slightly during sound effects

---

## Estimated Work

- **Sound sourcing/creation**: 2-3 hours
- **Event system implementation**: 4-5 hours
- **Mixing pipeline**: 3-4 hours
- **Testing & tuning**: 2-3 hours
- **Total**: 11-15 hours

---

**Status:** Text cleanup complete ✅ | Sound implementation pending ⏳
