# Acceleration Improvements Plan

## Summary
Make the starfield acceleration more noticeable by increasing duration, adding progressive speed per tier, and adding speed lines visual effect.

## Changes

### 1. `src/core/types.ts` — Add `SpeedLine` interface
Add after the `TrailParticle` interface:
```ts
export interface SpeedLine {
  x: number;
  y: number;
  vx: number;
  alpha: number;
  length: number;
  fromRight: boolean;
}
```

### 2. `src/systems/effects.ts` — Add speed lines system

**State additions:**
- Add `speedLines: SpeedLine[]` to `EffectsState`
- Add `speedLineTimer: number` to `EffectsState`
- Initialize both in `createEffectsState()`: `speedLines: []`, `speedLineTimer: 0`

**New functions:**
```ts
export function updateSpeedLines(effects: EffectsState, dt: number, speedMult: number, canvasWidth: number, canvasHeight: number): void {
  // Spawn new speed lines when speedMult > 1.5
  effects.speedLineTimer += dt;
  const spawnRate = 0.02 / Math.max(1, speedMult - 1.0); // faster spawn at higher speeds
  const maxLines = Math.floor((speedMult - 1.0) * 30);
  
  while (effects.speedLineTimer >= spawnRate && effects.speedLines.length < maxLines) {
    effects.speedLineTimer -= spawnRate;
    const fromRight = Math.random() < 0.5;
    effects.speedLines.push({
      x: fromRight ? canvasWidth + 10 : -10,
      y: Math.random() * canvasHeight,
      vx: (fromRight ? -1 : 1) * (400 + Math.random() * 600),
      alpha: 0.3 + Math.random() * 0.5,
      length: 30 + Math.random() * 100,
      fromRight,
    });
  }
  
  // Update existing lines
  for (let i = effects.speedLines.length - 1; i >= 0; i--) {
    const sl = effects.speedLines[i];
    sl.x += sl.vx * dt;
    sl.alpha -= dt * 1.5;
    if (sl.alpha <= 0) {
      effects.speedLines.splice(i, 1);
    }
  }
}

export function drawSpeedLines(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  for (const sl of effects.speedLines) {
    ctx.save();
    ctx.globalAlpha = sl.alpha;
    ctx.strokeStyle = '#e0f2fe';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    const endX = sl.x + (sl.fromRight ? -sl.length : sl.length);
    ctx.moveTo(sl.x, sl.y);
    ctx.lineTo(endX, sl.y);
    ctx.stroke();
    ctx.restore();
  }
}
```

### 3. `src/main.ts` — Progressive speed + longer duration

**A) `onPhaseStart` (two locations: lines 291-292 and 417-418):**
```ts
// Before:
this.targetStarSpeedMult = 1.0;
// After:
this.targetStarSpeedMult = 1.0 + this.currentTier * 0.4;
```

**B) `onPauseStart` phase 3 completed (lines 323-324 and 449-450):**
```ts
// Before:
if (completedPhase === 3) {
  this.targetStarSpeedMult = 2.5;
}
// After:
if (completedPhase === 3) {
  this.targetStarSpeedMult = 4.0;
}
```

**C) `onWaveComplete` (lines 333-334 and 459-460):**
```ts
// Before:
this.targetStarSpeedMult = 2.5;
// After:
this.targetStarSpeedMult = 4.0;
```

**D) Lerp factor (line 503):**
```ts
// Before:
this.starSpeedMult += (this.targetStarSpeedMult - this.starSpeedMult) * dt * 3.0;
// After:
this.starSpeedMult += (this.targetStarSpeedMult - this.starSpeedMult) * dt * 1.5;
```

**E) Add `updateSpeedLines` call in `update()` (line 504, after `updateStarfield`):**
```ts
updateSpeedLines(this.effects, dt, this.starSpeedMult, this.canvas.width, this.canvas.height);
```

**F) Add `drawSpeedLines` call in `draw()` (line 662, after `drawStarfield`):**
```ts
drawSpeedLines(this.ctx, this.effects);
```

**G) Add import for `updateSpeedLines, drawSpeedLines` from effects.**

### 4. Verify with type check
Run `pnpm exec tsc --noEmit`.
