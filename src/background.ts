import type { Star } from './core/types.js';

export interface NebulaBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
  _sprite?: HTMLCanvasElement;
}

export interface DistantBody {
  x: number;
  y: number;
  radius: number;
  color: string;
  rim: string;
  speed: number;
  _sprite?: HTMLCanvasElement;
}

export interface BackgroundState {
  stars: Star[];
  nebulas: NebulaBlob[];
  bodies: DistantBody[];
  gridOffset: number;
  auroraPhase: number;
  bgGradients: Map<string, CanvasGradient>;
  starSprites: Map<string, HTMLCanvasElement[]>;
}

export interface BackgroundTheme {
  id: string;
  name: string;
  base: string;
}

export const BACKGROUNDS: BackgroundTheme[] = [
  { id: 'starfield', name: 'Estrellas',  base: '#0b1017' },
  { id: 'nebula',    name: 'Nebulosa',   base: '#0a0418' },
  { id: 'deep',      name: 'Cosmos',     base: '#06070d' },
  { id: 'grid',      name: 'Cyber',      base: '#04060c' },
  { id: 'aurora',    name: 'Aurora',     base: '#031018' },
  { id: 'crimson',   name: 'Carmesí',    base: '#160506' },
  { id: 'inferno',   name: 'Infierno',   base: '#1a0502' },
  { id: 'abyss',     name: 'Abismo',     base: '#020513' },
  { id: 'paradise',  name: 'Paraíso',    base: '#021a0f' },
];

const NEBULA_COLORS_BY_THEME: Record<string, string[]> = {
  nebula:  ['#7c3aed', '#db2777', '#0ea5e9', '#f59e0b'],
  deep:    ['#1e3a8a', '#312e81', '#831843'],
  aurora:  ['#10b981', '#22ff9e', '#a78bfa'],
  crimson: ['#dc2626', '#9a3412', '#f59e0b'],
  inferno: ['#f97316', '#dc2626', '#fbbf24'],
  abyss:   ['#1e3a8a', '#6b21a8', '#0ea5e9'],
  paradise: ['#10b981', '#34d399', '#fbbf24'],
};

export function createBackgroundState(): BackgroundState {
  const stars: Star[] = [];
  for (let i = 0; i < 140; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 15 + Math.random() * 55,
      size: 0.4 + Math.random() * 1.8,
      alpha: 0.25 + Math.random() * 0.75,
    });
  }

  const nebulas: NebulaBlob[] = [];
  for (let i = 0; i < 6; i++) {
    nebulas.push(makeNebula());
  }

  const bodies: DistantBody[] = [];
  for (let i = 0; i < 2; i++) {
    bodies.push(makeBody());
  }

  return {
    stars,
    nebulas,
    bodies,
    gridOffset: 0,
    auroraPhase: 0,
    bgGradients: new Map(),
    starSprites: new Map(),
  };
}

export function invalidateBackgroundCache(state: BackgroundState): void {
  state.bgGradients.clear();
  state.starSprites.clear();
  for (const n of state.nebulas) {
    n._sprite = undefined;
  }
  for (const b of state.bodies) {
    b._sprite = undefined;
  }
}

function makeNebula(): NebulaBlob {
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    vx: (Math.random() - 0.5) * 8,
    vy: (Math.random() - 0.5) * 4 + 6,
    radius: 180 + Math.random() * 260,
    color: '#7c3aed',
    alpha: 0.08 + Math.random() * 0.12,
  };
}

function makeBody(): DistantBody {
  const palette = [
    ['#1e293b', '#475569'],
    ['#7c2d12', '#fbbf24'],
    ['#312e81', '#a78bfa'],
    ['#064e3b', '#34d399'],
  ];
  const p = palette[Math.floor(Math.random() * palette.length)];
  return {
    x: Math.random() * window.innerWidth,
    y: Math.random() * window.innerHeight,
    radius: 30 + Math.random() * 80,
    color: p[0],
    rim: p[1],
    speed: 3 + Math.random() * 8,
  };
}

export function updateBackground(state: BackgroundState, dt: number, isPlaying: boolean, speedMult: number, themeId: string): void {
  for (const star of state.stars) {
    const s = star.speed * speedMult;
    if (isPlaying) {
      star.y += s * dt;
      if (star.y > window.innerHeight + 5) {
        star.y = -5;
        star.x = Math.random() * window.innerWidth;
      }
    } else {
      star.x -= s * dt;
      if (star.x < -5) {
        star.x = window.innerWidth + 5;
        star.y = Math.random() * window.innerHeight;
      }
    }
  }

  const palette = NEBULA_COLORS_BY_THEME[themeId];
  if (palette) {
    for (const n of state.nebulas) {
      n.y += n.vy * speedMult * dt * 0.4;
      n.x += n.vx * speedMult * dt * 0.4;
      if (n.y - n.radius > window.innerHeight) {
        n.y = -n.radius;
        n.x = Math.random() * window.innerWidth;
        n.color = palette[Math.floor(Math.random() * palette.length)];
        n._sprite = undefined;
      }
      if (n.x + n.radius < 0) n.x = window.innerWidth + n.radius;
      if (n.x - n.radius > window.innerWidth) n.x = -n.radius;
    }
  }

  if (themeId === 'deep') {
    for (const b of state.bodies) {
      b.y += b.speed * speedMult * dt * 0.3;
      if (b.y - b.radius > window.innerHeight) {
        b.y = -b.radius;
        b.x = Math.random() * window.innerWidth;
        b.radius = 30 + Math.random() * 80;
        b._sprite = undefined;
      }
    }
  }

  state.gridOffset = (state.gridOffset + speedMult * dt * 80) % 60;
  state.auroraPhase += dt * 0.4 * speedMult;
}

function getCachedGradient(state: BackgroundState, key: string, build: () => CanvasGradient): CanvasGradient {
  let g = state.bgGradients.get(key);
  if (!g) {
    g = build();
    state.bgGradients.set(key, g);
  }
  return g;
}

export function drawBackground(ctx: CanvasRenderingContext2D, state: BackgroundState, themeId: string): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;
  const sizeKey = `${w}x${h}`;

  if (themeId === 'aurora') {
    const grad = getCachedGradient(state, `aurora-bg-${sizeKey}`, () => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#031018');
      g.addColorStop(0.5, '#072a2c');
      g.addColorStop(1, '#031018');
      return g;
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    drawAuroraWaves(ctx, state, w, h);
  } else if (themeId === 'crimson') {
    const grad = getCachedGradient(state, `crimson-bg-${sizeKey}`, () => {
      const g = ctx.createRadialGradient(w / 2, h * 0.3, 50, w / 2, h * 0.5, Math.max(w, h));
      g.addColorStop(0, '#3b0a0a');
      g.addColorStop(1, '#0a0204');
      return g;
    });
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  if (themeId === 'nebula' || themeId === 'deep' || themeId === 'aurora' || themeId === 'crimson' || themeId === 'inferno' || themeId === 'abyss' || themeId === 'paradise') {
    drawNebulas(ctx, state);
  }

  if (themeId === 'deep' || themeId === 'abyss') {
    drawDistantBodies(ctx, state);
  }

  if (themeId === 'inferno') {
    const infernoGrad = getCachedGradient(state, `inferno-bg-${sizeKey}`, () => {
      const g = ctx.createRadialGradient(w / 2, h * 0.35, 0, w / 2, h * 0.6, Math.max(w, h));
      g.addColorStop(0, '#7c2d12');
      g.addColorStop(0.5, '#3b0a02');
      g.addColorStop(1, '#0d0200');
      return g;
    });
    ctx.fillStyle = infernoGrad;
    ctx.fillRect(0, 0, w, h);
  }

  if (themeId === 'paradise') {
    const paradiseGrad = getCachedGradient(state, `paradise-bg-${sizeKey}`, () => {
      const g = ctx.createLinearGradient(0, 0, 0, h);
      g.addColorStop(0, '#042e1a');
      g.addColorStop(0.5, '#065f36');
      g.addColorStop(1, '#021408');
      return g;
    });
    ctx.fillStyle = paradiseGrad;
    ctx.fillRect(0, 0, w, h);
  }

  if (themeId === 'grid') {
    drawCyberGrid(ctx, state, w, h);
  }

  drawStars(ctx, state, state.stars, themeId);
}

const STAR_SIZE_BUCKETS = [0.5, 0.9, 1.3, 1.7, 2.1];

function tintForTheme(themeId: string): string {
  return themeId === 'crimson' ? '#fecaca'
    : themeId === 'aurora' ? '#bbf7d0'
    : themeId === 'inferno' ? '#fed7aa'
    : themeId === 'abyss' ? '#bfdbfe'
    : themeId === 'paradise' ? '#a7f3d0'
    : '#ffffff';
}

function getStarSprites(state: BackgroundState, themeId: string): HTMLCanvasElement[] {
  const cached = state.starSprites.get(themeId);
  if (cached) return cached;
  const tint = tintForTheme(themeId);
  const sprites: HTMLCanvasElement[] = STAR_SIZE_BUCKETS.map((size) => {
    const blur = size > 1.4 ? size * 3 : 0;
    const pad = blur + size + 2;
    const dim = Math.ceil(pad * 2);
    const c = document.createElement('canvas');
    c.width = dim;
    c.height = dim;
    const cx = c.getContext('2d')!;
    cx.fillStyle = tint;
    if (blur > 0) {
      cx.shadowColor = tint;
      cx.shadowBlur = blur;
    }
    cx.beginPath();
    cx.arc(pad, pad, size, 0, Math.PI * 2);
    cx.fill();
    return c;
  });
  state.starSprites.set(themeId, sprites);
  return sprites;
}

function bucketIndex(size: number): number {
  let best = 0;
  let bestDiff = Math.abs(STAR_SIZE_BUCKETS[0] - size);
  for (let i = 1; i < STAR_SIZE_BUCKETS.length; i++) {
    const d = Math.abs(STAR_SIZE_BUCKETS[i] - size);
    if (d < bestDiff) { bestDiff = d; best = i; }
  }
  return best;
}

function drawStars(ctx: CanvasRenderingContext2D, state: BackgroundState, stars: Star[], themeId: string): void {
  const sprites = getStarSprites(state, themeId);
  for (const star of stars) {
    const sprite = sprites[bucketIndex(star.size)];
    const half = sprite.width * 0.5;
    ctx.globalAlpha = star.alpha;
    ctx.drawImage(sprite, star.x - half, star.y - half);
  }
  ctx.globalAlpha = 1;
}

function buildNebulaSprite(n: NebulaBlob): HTMLCanvasElement {
  const dim = Math.ceil(n.radius * 2);
  const c = document.createElement('canvas');
  c.width = dim;
  c.height = dim;
  const cx = c.getContext('2d')!;
  const g = cx.createRadialGradient(n.radius, n.radius, 0, n.radius, n.radius, n.radius);
  g.addColorStop(0, hexA(n.color, n.alpha));
  g.addColorStop(0.5, hexA(n.color, n.alpha * 0.5));
  g.addColorStop(1, hexA(n.color, 0));
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(n.radius, n.radius, n.radius, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function drawNebulas(ctx: CanvasRenderingContext2D, state: BackgroundState): void {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const n of state.nebulas) {
    if (!n._sprite) n._sprite = buildNebulaSprite(n);
    ctx.drawImage(n._sprite, n.x - n.radius, n.y - n.radius);
  }
  ctx.restore();
}

function buildBodySprite(b: DistantBody): HTMLCanvasElement {
  const dim = Math.ceil(b.radius * 2);
  const c = document.createElement('canvas');
  c.width = dim;
  c.height = dim;
  const cx = c.getContext('2d')!;
  const g = cx.createRadialGradient(b.radius - b.radius * 0.4, b.radius - b.radius * 0.4, b.radius * 0.1, b.radius, b.radius, b.radius);
  g.addColorStop(0, b.rim);
  g.addColorStop(0.5, b.color);
  g.addColorStop(1, '#000000');
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(b.radius, b.radius, b.radius, 0, Math.PI * 2);
  cx.fill();
  return c;
}

function drawDistantBodies(ctx: CanvasRenderingContext2D, state: BackgroundState): void {
  ctx.globalAlpha = 0.5;
  for (const b of state.bodies) {
    if (!b._sprite) b._sprite = buildBodySprite(b);
    ctx.drawImage(b._sprite, b.x - b.radius, b.y - b.radius);
  }
  ctx.globalAlpha = 1;
}

function drawCyberGrid(ctx: CanvasRenderingContext2D, state: BackgroundState, w: number, h: number): void {
  ctx.save();
  ctx.strokeStyle = 'rgba(34, 255, 158, 0.18)';
  ctx.lineWidth = 1;
  const step = 60;
  const off = state.gridOffset;
  ctx.beginPath();
  for (let x = -step + (off % step); x < w + step; x += step) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
  }
  for (let y = -step + (off % step); y < h + step; y += step) {
    ctx.moveTo(0, y);
    ctx.lineTo(w, y);
  }
  ctx.stroke();

  ctx.strokeStyle = 'rgba(232, 121, 249, 0.25)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  const accentY = (off * 4) % h;
  ctx.moveTo(0, accentY);
  ctx.lineTo(w, accentY);
  ctx.stroke();
  ctx.restore();
}

function drawAuroraWaves(ctx: CanvasRenderingContext2D, state: BackgroundState, w: number, h: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  const colors = ['#10b981', '#22ff9e', '#a78bfa'];
  for (let i = 0; i < 3; i++) {
    const phase = state.auroraPhase + i * 1.3;
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let x = 0; x <= w; x += 20) {
      const y = h * 0.5 + Math.sin(x * 0.005 + phase) * 60 + Math.sin(x * 0.012 + phase * 1.5) * 40 + i * 50;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    const grad = getCachedGradient(state, `aurora-wave-${i}-${h}`, () => {
      const g = ctx.createLinearGradient(0, h * 0.3, 0, h);
      g.addColorStop(0, hexA(colors[i], 0.25));
      g.addColorStop(1, hexA(colors[i], 0));
      return g;
    });
    ctx.fillStyle = grad;
    ctx.fill();
  }
  ctx.restore();
}

function hexA(hex: string, a: number): string {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return `rgba(255,255,255,${a})`;
  return `rgba(${parseInt(m[1], 16)},${parseInt(m[2], 16)},${parseInt(m[3], 16)},${a})`;
}

export function createStarfield(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 15 + Math.random() * 45,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

export function updateStarfield(stars: Star[], dt: number, isPlaying: boolean, speedMult: number): void {
  for (const star of stars) {
    const s = star.speed * speedMult;
    if (isPlaying) {
      star.y += s * dt;
      if (star.y > window.innerHeight + 5) {
        star.y = -5;
        star.x = Math.random() * window.innerWidth;
      }
    } else {
      star.x -= s * dt;
      if (star.x < -5) {
        star.x = window.innerWidth + 5;
        star.y = Math.random() * window.innerHeight;
      }
    }
  }
}

