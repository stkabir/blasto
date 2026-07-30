import type { TrailParticle, Explosion, ExplosionParticle, FloatingText, Announcement, SpeedLine, Shockwave } from '../core/types.js';
import type { Player } from '../entities/player.js';
import { getQualitySettings } from '../core/quality.js';

const particlePool: ExplosionParticle[] = [];

function acquireParticle(): ExplosionParticle {
  return particlePool.pop() ?? ({
    x: 0, y: 0, vx: 0, vy: 0, radius: 1, life: 1, color: '#fff',
  } as ExplosionParticle);
}

function releaseParticles(ps: ExplosionParticle[]): void {
  for (const p of ps) particlePool.push(p);
  ps.length = 0;
}

export interface EffectsState {
  playerTrail: TrailParticle[];
  maxTrailParticles: number;
  explosions: Explosion[];
  shockwaves: Shockwave[];
  floatingTexts: FloatingText[];
  announcements: Announcement[];
  shakeIntensity: number;
  shakeTimer: number;
  flashAlpha: number;
  speedLines: SpeedLine[];
  speedLineTimer: number;
}

export function createEffectsState(): EffectsState {
  return {
    playerTrail: [],
    maxTrailParticles: 50,
    explosions: [],
    shockwaves: [],
    floatingTexts: [],
    announcements: [],
    shakeIntensity: 0,
    shakeTimer: 0,
    flashAlpha: 0,
    speedLines: [],
    speedLineTimer: 0,
  };
}

export function addTrailParticle(effects: EffectsState, player: Player): void {
  if (!getQualitySettings().trailParticles) return;
  for (let i = 0; i < 3; i++) {
    if (effects.playerTrail.length >= effects.maxTrailParticles) {
      effects.playerTrail.shift();
    }
    const isCore = i === 0;
    effects.playerTrail.push({
      x: player.x + (Math.random() - 0.5) * (isCore ? 4 : 12),
      y: player.y + player.radius * 0.6 + (Math.random() - 0.5) * 2,
      vx: (Math.random() - 0.5) * (isCore ? 12 : 40),
      vy: 60 + Math.random() * 60,
      alpha: isCore ? 1 : 0.6,
      size: isCore ? 3 + Math.random() * 2 : 1.5 + Math.random() * 2,
      color: isCore ? '#ffffff' : player.color,
    });
  }
}

export function updateTrail(effects: EffectsState, dt: number): void {
  for (let i = effects.playerTrail.length - 1; i >= 0; i--) {
    const p = effects.playerTrail[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha -= dt * 3.5;
    p.size *= 0.97;
    if (p.alpha <= 0) {
      effects.playerTrail.splice(i, 1);
    }
  }
}

const trailSpriteCache = new Map<string, HTMLCanvasElement>();
const TRAIL_SPRITE_RADIUS = 16;

function getTrailSprite(color: string): HTMLCanvasElement {
  const cached = trailSpriteCache.get(color);
  if (cached) return cached;
  const r = TRAIL_SPRITE_RADIUS;
  const dim = r * 2;
  const c = document.createElement('canvas');
  c.width = dim;
  c.height = dim;
  const cx = c.getContext('2d')!;
  const g = cx.createRadialGradient(r, r, 0, r, r, r);
  g.addColorStop(0, color);
  g.addColorStop(0.4, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  cx.fillStyle = g;
  cx.beginPath();
  cx.arc(r, r, r, 0, Math.PI * 2);
  cx.fill();
  trailSpriteCache.set(color, c);
  return c;
}

export function drawTrail(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  if (effects.playerTrail.length === 0) return;
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of effects.playerTrail) {
    const sp = getTrailSprite(p.color);
    const scale = p.size / 3;
    const size = TRAIL_SPRITE_RADIUS * 2 * scale;
    ctx.globalAlpha = p.alpha;
    ctx.drawImage(sp, p.x - size * 0.5, p.y - size * 0.5, size, size);
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function createExplosion(x: number, y: number, color: string, scale: number = 1): Explosion {
  const particles: ExplosionParticle[] = [];
  const particleMult = getQualitySettings().explosionParticles;
  const dotCount = Math.floor(14 * scale * particleMult);
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + Math.random() * 0.4;
    const speed = (80 + Math.random() * 120) * scale;
    const p = acquireParticle();
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.radius = (2 + Math.random() * 4) * scale;
    p.life = 1;
    p.color = '#ffffff';
    p.shape = 'dot';
    p.decay = 2.5;
    p.rotation = undefined;
    p.rotSpeed = undefined;
    particles.push(p);
  }
  const chunkCount = Math.floor(8 * scale * particleMult);
  for (let i = 0; i < chunkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (50 + Math.random() * 90) * scale;
    const p = acquireParticle();
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed - 30;
    p.radius = (3 + Math.random() * 5) * scale;
    p.life = 1;
    p.color = color;
    p.rotation = Math.random() * Math.PI * 2;
    p.rotSpeed = (Math.random() - 0.5) * 8;
    p.shape = 'chunk';
    p.decay = 1.4;
    particles.push(p);
  }
  const sparkCount = Math.floor(10 * scale * particleMult);
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (180 + Math.random() * 200) * scale;
    const p = acquireParticle();
    p.x = x; p.y = y;
    p.vx = Math.cos(angle) * speed;
    p.vy = Math.sin(angle) * speed;
    p.radius = 1.5 + Math.random() * 1.5;
    p.life = 1;
    p.color = color;
    p.shape = 'spark';
    p.decay = 3;
    p.rotation = undefined;
    p.rotSpeed = undefined;
    particles.push(p);
  }
  return { particles };
}

export function addShockwave(effects: EffectsState, x: number, y: number, color: string, maxRadius: number = 80): void {
  if (!getQualitySettings().shockwaves) return;
  effects.shockwaves.push({ x, y, radius: 4, maxRadius, alpha: 0.9, color });
}

export function updateShockwaves(effects: EffectsState, dt: number): void {
  for (let i = effects.shockwaves.length - 1; i >= 0; i--) {
    const s = effects.shockwaves[i];
    s.radius += (s.maxRadius - s.radius) * dt * 6;
    s.alpha -= dt * 2.2;
    if (s.alpha <= 0) effects.shockwaves.splice(i, 1);
  }
}

export function drawShockwaves(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const s of effects.shockwaves) {
    ctx.globalAlpha = s.alpha;
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function updateExplosions(explosions: Explosion[], dt: number): void {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    let allDead = true;
    for (const p of exp.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vx *= 0.96;
      p.vy *= 0.96;
      p.vy += 80 * dt;
      if (p.rotation !== undefined && p.rotSpeed !== undefined) {
        p.rotation += p.rotSpeed * dt;
      }
      p.life -= dt * (p.decay ?? 2);
      if (p.life > 0) allDead = false;
    }
    if (allDead) {
      releaseParticles(exp.particles);
      explosions.splice(i, 1);
    }
  }
}

export function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const exp of explosions) {
    for (const p of exp.particles) {
      if (p.life <= 0) continue;
      ctx.globalAlpha = Math.min(1, p.life);
      if (p.shape === 'chunk' && p.rotation !== undefined) {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.fillStyle = p.color;
        const r = p.radius * Math.max(0.3, p.life);
        ctx.fillRect(-r, -r * 0.6, r * 2, r * 1.2);
        ctx.restore();
      } else if (p.shape === 'spark') {
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else {
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius * Math.max(0.2, p.life), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function addFloatingText(floatingTexts: FloatingText[], x: number, y: number, text: string): void {
  if (!getQualitySettings().floatingTexts) return;
  floatingTexts.push({
    x, y, text,
    alpha: 1,
    vy: -60,
    life: 600,
  });
}

export function updateFloatingTexts(floatingTexts: FloatingText[], dt: number): void {
  for (let i = floatingTexts.length - 1; i >= 0; i--) {
    const ft = floatingTexts[i];
    ft.y += ft.vy * dt;
    ft.life -= dt * 1000;
    ft.alpha = Math.max(0, ft.life / 600);
    if (ft.life <= 0) {
      floatingTexts.splice(i, 1);
    }
  }
}

export function drawFloatingTexts(ctx: CanvasRenderingContext2D, floatingTexts: FloatingText[]): void {
  ctx.font = 'bold 18px system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const ft of floatingTexts) {
    ctx.globalAlpha = ft.alpha;
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = 3;
    ctx.strokeText(ft.text, ft.x, ft.y);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(ft.text, ft.x, ft.y);
  }
  ctx.globalAlpha = 1;
}

export function announce(
  announcements: Announcement[],
  canvasHeight: number,
  canvasWidth: number,
  text: string,
  options: {
    color?: string;
    fontSize?: number;
    duration?: number;
    y?: number;
    strokeColor?: string;
    strokeWidth?: number;
  } = {}
): void {
  const {
    color = '#ffffff',
    fontSize = 64,
    duration = 800,
    y = canvasHeight * 0.35,
    strokeColor = '#000000',
    strokeWidth = 6,
  } = options;

  const id = Date.now() + Math.random();
  announcements.push({
    id, text,
    x: canvasWidth / 2,
    y, color, fontSize, duration,
    elapsed: 0, strokeColor, strokeWidth,
    scale: 2.5, alpha: 0,
  });
}

export function updateAnnouncements(announcements: Announcement[], dt: number): void {
  for (let i = announcements.length - 1; i >= 0; i--) {
    const a = announcements[i];
    a.elapsed += dt * 1000;

    const phase = a.elapsed / a.duration;
    if (phase < 0.15) {
      a.alpha = phase / 0.15;
      a.scale = 2.5 - (1.5 * phase / 0.15);
    } else if (phase < 0.7) {
      a.alpha = 1;
      a.scale = 1;
    } else {
      a.alpha = 1 - ((phase - 0.7) / 0.3);
      a.scale = 1 - ((phase - 0.7) / 0.3) * 0.2;
    }

    if (a.elapsed >= a.duration) {
      announcements.splice(i, 1);
    }
  }
}

export function drawAnnouncements(ctx: CanvasRenderingContext2D, announcements: Announcement[]): void {
  for (const a of announcements) {
    ctx.save();
    ctx.globalAlpha = a.alpha;
    ctx.translate(a.x, a.y);
    ctx.scale(a.scale, a.scale);
    ctx.font = `bold ${a.fontSize}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeStyle = a.strokeColor;
    ctx.lineWidth = a.strokeWidth;
    ctx.strokeText(a.text, 0, 0);
    ctx.fillStyle = a.color;
    ctx.fillText(a.text, 0, 0);
    ctx.restore();
  }
}

export function triggerShake(effects: EffectsState, intensity: number, duration: number): void {
  effects.shakeIntensity = Math.max(effects.shakeIntensity, intensity);
  effects.shakeTimer = Math.max(effects.shakeTimer, duration);
}

export function updateShake(effects: EffectsState, dt: number): void {
  if (effects.shakeTimer > 0) {
    effects.shakeTimer -= dt * 1000;
    if (effects.shakeTimer <= 0) {
      effects.shakeIntensity = 0;
    }
  }
  if (effects.shakeIntensity > 0) {
    effects.shakeIntensity *= 0.92;
    if (effects.shakeIntensity < 0.5) effects.shakeIntensity = 0;
  }
}

export function triggerFlash(effects: EffectsState, alpha: number = 0.3): void {
  effects.flashAlpha = alpha;
}

export function updateFlash(effects: EffectsState, dt: number): void {
  if (effects.flashAlpha > 0) {
    effects.flashAlpha -= dt * 2.5;
    if (effects.flashAlpha < 0) effects.flashAlpha = 0;
  }
}

export function updateSpeedLines(effects: EffectsState, dt: number, speedMult: number, canvasWidth: number, canvasHeight: number): void {
  if (!getQualitySettings().speedLines || speedMult <= 0.3) {
    effects.speedLines = [];
    effects.speedLineTimer = 0;
    return;
  }

  effects.speedLineTimer += dt;
  const intensity = speedMult;
  const spawnInterval = 0.025 / intensity;
  const maxLines = Math.floor(intensity * 30);

  while (effects.speedLineTimer >= spawnInterval && effects.speedLines.length < maxLines) {
    effects.speedLineTimer -= spawnInterval;
    const fromRight = Math.random() < 0.5;
    const speed = 500 + Math.random() * 800;
    effects.speedLines.push({
      x: fromRight ? canvasWidth + 20 : -20,
      y: Math.random() * canvasHeight,
      vx: (fromRight ? -1 : 1) * speed,
      alpha: 0.25 + Math.random() * 0.45,
      length: 40 + Math.random() * 120,
      fromRight,
    });
  }

  for (let i = effects.speedLines.length - 1; i >= 0; i--) {
    const sl = effects.speedLines[i];
    sl.x += sl.vx * dt;
    sl.alpha -= dt * 1.8;
    if (sl.alpha <= 0 || sl.x < -150 || sl.x > canvasWidth + 150) {
      effects.speedLines.splice(i, 1);
    }
  }
}

export function drawSpeedLines(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  if (effects.speedLines.length === 0) return;
  const lines = effects.speedLines;
  const quality = getQualitySettings();
  ctx.save();
  ctx.strokeStyle = '#7dd3fc';
  ctx.lineWidth = 2;
  if (quality.speedLines) {
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
  }
  for (let i = 0; i < lines.length; i++) {
    const sl = lines[i];
    ctx.globalAlpha = sl.alpha;
    const endX = sl.x + (sl.fromRight ? -sl.length : sl.length);
    ctx.beginPath();
    ctx.moveTo(sl.x, sl.y);
    ctx.lineTo(endX, sl.y);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}
