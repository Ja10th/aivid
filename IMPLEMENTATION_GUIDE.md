# 800 Thumbnail Variations - Implementation Guide

## Status: INFRASTRUCTURE COMPLETE ✅

### Completed:
1. ✅ Added COLOR_PALETTES array (20 palettes)
2. ✅ Added decodeThemeVariant() function
3. ✅ Added applyMicroLayout() function  
4. ✅ Updated thumbnail.ts randomThumbStyle (0-799 range)
5. ✅ Updated thumbnail.ts thumbnailCandidates (10 scene distribution)

### Remaining Work:

Each of the 6 category functions needs updating:

#### Pattern for each function:
```typescript
export function drawXxxThumbnail(..., themeVariant: number, ...) {
  const { sceneType, colorIdx, layoutMicro } = decodeThemeVariant(themeVariant);
  const colors = COLOR_PALETTES[colorIdx];
  
  ctx.save();
  const { badgeX, badgeY, flip } = applyMicroLayout(ctx, W, H, layoutMicro);
  
  if (sceneType === 0) {
    // Scene 0 - replace hardcoded colors with colors.primary, etc.
  } else if (sceneType === 1) {
    // Scene 1
  }
  // ... up to sceneType === 9 (10 total scenes)
  
  ctx.restore();
}
```

#### For Each Scene:
1. Replace `#3fe0ff` → `colors.primary`
2. Replace `#ff2323` → `colors.secondary`  
3. Replace `#ffd23f` → `colors.accent`
4. Replace `#ffffff` → `colors.text`
5. Use `badgeX, badgeY` from applyMicroLayout for badge positioning
6. Add 5 NEW scenes (currently 5, need 10)

### Quick Win Strategy:

Start with the simplest transformations:
1. Update drawEyeTrainingThumbnail (add wrapper + decode)
2. Add 5 new eye training scenes  
3. Repeat for other 5 categories

### New Scenes Needed (5 per category):

**Eye Training:**
- Scene 5: Focus Grid Matrix  
- Scene 6: Vision Test Chart
- Scene 7: Peripheral Dots
- Scene 8: Speed Reading Bars
- Scene 9: Multi-Object Tracking

**Gameplay:**
- Scene 5: Fighting Game (Street Fighter style)
- Scene 6: Racing Track (top-down view)
- Scene 7: Platform Jumper (Mario style)
- Scene 8: Tower Defense
- Scene 9: Card Battle

**Math:**
- Scene 5: Number Pyramid
- Scene 6: Equation Balance Scale
- Scene 7: Graph/Plot
- Scene 8: Pattern Sequence  
- Scene 9: Mental Math Race

**Brain:**
- Scene 5: Word Search Grid
- Scene 6: Sudoku
- Scene 7: Logic Gates
- Scene 8: Riddle Scroll
- Scene 9: IQ Test Pattern

**Story:**
- Scene 5: Desert Oasis at Dusk
- Scene 6: Snowy Mountain Peak
- Scene 7: Underwater Ruins
- Scene 8: Floating Sky Islands
- Scene 9: Time Portal/Wormhole

**Calm:**
- Scene 5: Bamboo Forest Path
- Scene 6: Ocean Sunset
- Scene 7: Mountain Reflection Lake
- Scene 8: Cloud Garden
- Scene 9: Starfield Drift

## Testing:
```bash
npm run build
# Check for TypeScript errors
# Test thumbnail generation in UI
```

## Result:
- 10 scenes × 20 palettes × 4 micro-layouts = 800 per category
- 6 categories × 800 = **4,800 unique thumbnails**
- Never repeats before 160 regenerations
