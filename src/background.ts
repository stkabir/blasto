import type { Star } from './core/types.js';

export interface NebulaBlob {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  color: string;
  alpha: number;
}

export interface DistantBody {
  x: number;
  y: number;
  radius: number;
  color: string;
  rim: string;
  speed: number;
}

export interface BackgroundState {
  stars: Star[];
  nebulas: NebulaBlob[];
  bodies: DistantBody[];
  gridOffset: number;
  auroraPhase: number;
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
];

const NEBULA_COLORS_BY_THEME: Record<string, string[]> = {
  nebula:  ['#7c3aed', '#db2777', '#0ea5e9', '#f59e0b'],
  deep:    ['#1e3a8a', '#312e81', '#831843'],
  aurora:  ['#10b981', '#22ff9e', '#a78bfa'],
  crimson: ['#dc2626', '#9a3412', '#f59e0b'],
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

  return { stars, nebulas, bodies, gridOffset: 0, auroraPhase: 0 };
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
      }
    }
  }

  state.gridOffset = (state.gridOffset + speedMult * dt * 80) % 60;
  state.auroraPhase += dt * 0.4 * speedMult;
}

export function drawBackground(ctx: CanvasRenderingContext2D, state: BackgroundState, themeId: string): void {
  const w = ctx.canvas.width;
  const h = ctx.canvas.height;

  if (themeId === 'aurora') {
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#031018');
    grad.addColorStop(0.5, '#072a2c');
    grad.addColorStop(1, '#031018');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
    drawAuroraWaves(ctx, state, w, h);
  } else if (themeId === 'crimson') {
    const grad = ctx.createRadialGradient(w / 2, h * 0.3, 50, w / 2, h * 0.5, Math.max(w, h));
    grad.addColorStop(0, '#3b0a0a');
    grad.addColorStop(1, '#0a0204');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);
  }

  if (themeId === 'nebula' || themeId === 'deep' || themeId === 'aurora' || themeId === 'crimson') {
    drawNebulas(ctx, state);
  }

  if (themeId === 'deep') {
    drawDistantBodies(ctx, state);
  }

  if (themeId === 'grid') {
    drawCyberGrid(ctx, state, w, h);
  }

  drawStars(ctx, state.stars, themeId);
}

function drawStars(ctx: CanvasRenderingContext2D, stars: Star[], themeId: string): void {
  const tint = themeId === 'crimson' ? '#fecaca' : themeId === 'aurora' ? '#bbf7d0' : '#ffffff';
  ctx.fillStyle = tint;
  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    if (star.size > 1.4) {
      ctx.shadowColor = tint;
      ctx.shadowBlur = star.size * 3;
    } else {
      ctx.shadowBlur = 0;
    }
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowBlur = 0;
  ctx.globalAlpha = 1;
}

function drawNebulas(ctx: CanvasRenderingContext2D, state: BackgroundState): void {
  ctx.save();
  ctx.globalCompositeOperation = 'screen';
  for (const n of state.nebulas) {
    const grad = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.radius);
    grad.addColorStop(0, hexA(n.color, n.alpha));
    grad.addColorStop(0.5, hexA(n.color, n.alpha * 0.5));
    grad.addColorStop(1, hexA(n.color, 0));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(n.x, n.y, n.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawDistantBodies(ctx: CanvasRenderingContext2D, state: BackgroundState): void {
  for (const b of state.bodies) {
    const grad = ctx.createRadialGradient(b.x - b.radius * 0.4, b.y - b.radius * 0.4, b.radius * 0.1, b.x, b.y, b.radius);
    grad.addColorStop(0, b.rim);
    grad.addColorStop(0.5, b.color);
    grad.addColorStop(1, '#000000');
    ctx.fillStyle = grad;
    ctx.globalAlpha = 0.5;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
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
    const grad = ctx.createLinearGradient(0, h * 0.3, 0, h);
    grad.addColorStop(0, hexA(colors[i], 0.25));
    grad.addColorStop(1, hexA(colors[i], 0));
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

export function drawStarfield(ctx: CanvasRenderingContext2D, stars: Star[]): void {
  drawStars(ctx, stars, 'starfield');
}
