# 800 Thumbnail Variations Implementation Plan

## Summary
Implementing 10 scene types × 20 color palettes × 4 micro-layouts = **800 unique variations per category**

## Changes Made

### 1. thumbnail.ts - Updated randomThumbStyle and thumbnailCandidates
- Changed themeVariant range from 0-4 to 0-799
- Updated thumbnailCandidates to generate 5 well-spread samples across 800 range
- Ensures each of 5 shown thumbnails comes from different scene type (v % 10)

### 2. thumbnail-categories.ts - Added 3-Layer Decode System
- Added 20 universal COLOR_PALETTES array
- Added decodeThemeVariant() function: extracts sceneType (0-9), colorIdx (0-19), layoutMicro (0-3)
- Added applyMicroLayout() function: 4 compositional variations
  - 0: Default centered
  - 1: Left-heavy, badge top-left
  - 2: Mirrored horizontally
  - 3: Zoomed 1.08x, badge bottom-right

### 3. Each Category Expanded from 5 to 10 Scenes
- Eye Training: 10 distinct visual compositions
- Gameplay: 10 game types
- Math: 10 challenge styles
- Brain: 10 puzzle types
- Story: 10 narrative moods
- Calm: 10 relaxation themes

### 4. All Scenes Use Parametric Colors
- Replace hardcoded hex colors with colors.primary, colors.secondary, etc.
- Each scene adapts to 20 different color palettes automatically

## Result
- 6 categories × 800 variations = 4,800 unique thumbnails total
- Each "Regenerate" shows 5 visually distinct scenes
- Never repeats before 160 regenerations (800 ÷ 5)
