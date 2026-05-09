import type { TrailParticle, Explosion, FloatingText, Announcement } from '../core/types.js';
import type { Player } from '../entities/player.js';

export interface EffectsState {
  playerTrail: TrailParticle[];
  maxTrailParticles: number;
  explosions: Explosion[];
  floatingTexts: FloatingText[];
  announcements: Announcement[];
  shakeIntensity: number;
  shakeTimer: number;
  flashAlpha: number;
}

export function createEffectsState(): EffectsState {
  return {
    playerTrail: [],
    maxTrailParticles: 30,
    explosions: [],
    floatingTexts: [],
    announcements: [],
    shakeIntensity: 0,
    shakeTimer: 0,
    flashAlpha: 0,
  };
}

export function addTrailParticle(effects: EffectsState, player: Player): void {
  if (effects.playerTrail.length >= effects.maxTrailParticles) {
    effects.playerTrail.shift();
  }
  effects.playerTrail.push({
    x: player.x + (Math.random() - 0.5) * 10,
    y: player.y + player.radius * 0.5,
    vx: (Math.random() - 0.5) * 20,
    vy: 20 + Math.random() * 30,
    alpha: 0.8,
    size: 2 + Math.random() * 2,
    color: player.color,
  });
}

export function updateTrail(effects: EffectsState, dt: number): void {
  for (let i = effects.playerTrail.length - 1; i >= 0; i--) {
    const p = effects.playerTrail[i];
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.alpha -= dt * 2.5;
    if (p.alpha <= 0) {
      effects.playerTrail.splice(i, 1);
    }
  }
}

export function drawTrail(ctx: CanvasRenderingContext2D, effects: EffectsState): void {
  for (const p of effects.playerTrail) {
    ctx.globalAlpha = p.alpha;
    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

export function createExplosion(x: number, y: number, color: string): Explosion {
  const particles = [];
  for (let i = 0; i < 12; i++) {
    const angle = (i / 12) * Math.PI * 2;
    particles.push({
      x, y,
      vx: Math.cos(angle) * (80 + Math.random() * 70),
      vy: Math.sin(angle) * (100 + Math.random() * 80),
      radius: Math.random() * 8 + 4,
      life: 1,
      color,
    });
  }
  return { particles };
}

export function updateExplosions(explosions: Explosion[], dt: number): void {
  for (let i = explosions.length - 1; i >= 0; i--) {
    const exp = explosions[i];
    let allDead = true;
    for (const p of exp.particles) {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += 100 * dt;
      p.life -= dt * 2;
      if (p.life > 0) allDead = false;
    }
    if (allDead) explosions.splice(i, 1);
  }
}

export function drawExplosions(ctx: CanvasRenderingContext2D, explosions: Explosion[]): void {
  for (const exp of explosions) {
    for (const p of exp.particles) {
      ctx.globalAlpha = p.life;
      ctx.fillStyle = p.color;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
      ctx.fill();
    }
  }
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
