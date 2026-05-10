import type { TrailParticle, Explosion, FloatingText, Announcement, SpeedLine, Shockwave } from '../core/types.js';
import type { Player } from '../entities/player.js';

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

export function drawTrail(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const p of effects.playerTrail) {
    ctx.globalAlpha = p.alpha;
    ctx.shadowColor = p.color;
    ctx.shadowBlur = p.size * 3;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalAlpha = 1;
}

export function createExplosion(x: number, y: number, color: string, scale: number = 1): Explosion {
  const particles = [];
  const dotCount = Math.floor(14 * scale);
  for (let i = 0; i < dotCount; i++) {
    const angle = (i / dotCount) * Math.PI * 2 + Math.random() * 0.4;
    const speed = (80 + Math.random() * 120) * scale;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: (2 + Math.random() * 4) * scale,
      life: 1,
      color: '#ffffff',
      shape: 'dot' as const,
      decay: 2.5,
    });
  }
  const chunkCount = Math.floor(8 * scale);
  for (let i = 0; i < chunkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (50 + Math.random() * 90) * scale;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - 30,
      radius: (3 + Math.random() * 5) * scale,
      life: 1,
      color,
      rotation: Math.random() * Math.PI * 2,
      rotSpeed: (Math.random() - 0.5) * 8,
      shape: 'chunk' as const,
      decay: 1.4,
    });
  }
  const sparkCount = Math.floor(10 * scale);
  for (let i = 0; i < sparkCount; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = (180 + Math.random() * 200) * scale;
    particles.push({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 1.5 + Math.random() * 1.5,
      life: 1,
      color,
      shape: 'spark' as const,
      decay: 3,
    });
  }
  return { particles };
}

export function addShockwave(effects: EffectsState, x: number, y: number, color: string, maxRadius: number = 80): void {
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
    ctx.shadowColor = s.color;
    ctx.shadowBlur = 12;
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
    if (allDead) explosions.splice(i, 1);
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
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;
        const r = p.radius * Math.max(0.3, p.life);
        ctx.fillRect(-r, -r * 0.6, r * 2, r * 1.2);
        ctx.restore();
      } else if (p.shape === 'spark') {
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 8;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = p.radius;
        ctx.lineCap = 'round';
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - p.vx * 0.04, p.y - p.vy * 0.04);
        ctx.stroke();
      } else {
        ctx.shadowColor = p.color === '#ffffff' ? '#fde68a' : p.color;
        ctx.shadowBlur = 10;
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
  if (speedMult <= 0.3) {
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
  for (const sl of effects.speedLines) {
    ctx.save();
    ctx.globalAlpha = sl.alpha;
    ctx.strokeStyle = '#7dd3fc';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38bdf8';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    const endX = sl.x + (sl.fromRight ? -sl.length : sl.length);
    ctx.moveTo(sl.x, sl.y);
    ctx.lineTo(endX, sl.y);
    ctx.stroke();
    ctx.restore();
  }
}
