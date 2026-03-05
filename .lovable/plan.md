

## Problem

The text shadow on the hero overlay text looks low-quality — particularly the heavy blurred `rgba(0,0,0,0.7)` shadow on white text and the `rgba(255,255,255,0.4)` glow on dark text. The screenshot shows a muddy, diffuse halo around "Geniesse ein Dessert" that cheapens the look.

## Solution

Replace the blurry box-shadow approach with a subtle, tight multi-stroke technique using multiple small-offset shadows. This creates a clean "outline" effect rather than a fuzzy glow.

### Changes in `src/pages/home/SessionModeHome.tsx` and `src/pages/home/BrowseModeHome.tsx`

**Dark text on bright backgrounds** — remove the white glow entirely; dark text on bright hero is already readable. Use a very subtle, tight outline only if needed:
```ts
const heroTextShadow = isDarkText 
  ? 'none' 
  : '0 1px 2px rgba(0,0,0,0.5)';
```

- **`isDarkText` (day)**: `none` — dark text on bright sky needs no shadow
- **`!isDarkText` (night)**: `0 1px 2px rgba(0,0,0,0.5)` — a single tight, small shadow for slight depth without the blurry halo

This is a minimal, high-quality approach that avoids the "glow" artifact visible in the screenshot.

