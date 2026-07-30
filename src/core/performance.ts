export type QualityTier = 'high' | 'medium' | 'low';

export interface QualitySettings {
  starCount: number;
  nebulas: boolean;
  distantBodies: boolean;
  aurora: boolean;
  cyberGrid: boolean;
  speedLines: boolean;
  shockwaves: boolean;
  trailParticles: boolean;
  explosionParticles: number;
  floatingTexts: boolean;
  bulletShadows: boolean;
  asteroidSpriteDetail: boolean;
  targetFps: number;
}

const TIER_SETTINGS: Record<QualityTier, QualitySettings> = {
  high: {
    starCount: 140,
    nebulas: true,
    distantBodies: true,
    aurora: true,
    cyberGrid: true,
    speedLines: true,
    shockwaves: true,
    trailParticles: true,
    explosionParticles: 1,
    floatingTexts: true,
    bulletShadows: true,
    asteroidSpriteDetail: true,
    targetFps: 60,
  },
  medium: {
    starCount: 100,
    nebulas: true,
    distantBodies: false,
    aurora: false,
    cyberGrid: true,
    speedLines: true,
    shockwaves: true,
    trailParticles: true,
    explosionParticles: 0.7,
    floatingTexts: true,
    bulletShadows: true,
    asteroidSpriteDetail: true,
    targetFps: 60,
  },
  low: {
    starCount: 60,
    nebulas: false,
    distantBodies: false,
    aurora: false,
    cyberGrid: false,
    speedLines: false,
    shockwaves: false,
    trailParticles: false,
    explosionParticles: 0.4,
    floatingTexts: true,
    bulletShadows: false,
    asteroidSpriteDetail: false,
    targetFps: 30,
  },
};

export function getTierSettings(tier: QualityTier): QualitySettings {
  return TIER_SETTINGS[tier];
}

export class PerformanceProfiler {
  tier: QualityTier = 'high';
  private frameTimes: number[] = [];
  private lastCheck = 0;
  private lowEndHint = false;

  constructor() {
    this.lowEndHint = detectLowEndHint();
    this.tier = this.lowEndHint ? 'low' : 'high';
  }

  recordFrame(dtMs: number): void {
    this.frameTimes.push(dtMs);
    if (this.frameTimes.length > 60) {
      this.frameTimes.shift();
    }

    const now = performance.now();
    if (now - this.lastCheck < 5000) return;
    this.lastCheck = now;

    if (this.frameTimes.length < 30) return;

    const avg = this.frameTimes.reduce((a, b) => a + b, 0) / this.frameTimes.length;
    const p95 = this.frameTimes.slice().sort((a, b) => a - b)[Math.floor(this.frameTimes.length * 0.95)];

    if (this.tier === 'high' && (avg > 22 || p95 > 30)) {
      this.tier = 'medium';
    } else if (this.tier === 'medium' && (avg > 28 || p95 > 40)) {
      this.tier = 'low';
    } else if (!this.lowEndHint && this.tier === 'low' && avg < 16 && p95 < 22) {
      // Solo subimos si estamos muy sobrados y no detectamos gama baja.
      this.tier = 'medium';
    }
  }

  getSettings(): QualitySettings {
    return TIER_SETTINGS[this.tier];
  }

  reset(): void {
    this.frameTimes.length = 0;
    this.tier = this.lowEndHint ? 'low' : 'high';
    this.lastCheck = 0;
  }
}

function detectLowEndHint(): boolean {
  try {
    const memory = (navigator as any).deviceMemory;
    const cores = navigator.hardwareConcurrency;
    const ua = navigator.userAgent.toLowerCase();

    // Dispositivos con poca RAM o pocos cores.
    if (memory != null && memory <= 3) return true;
    if (cores != null && cores <= 4) return true;

    // Heurística para Android de gama baja común.
    if (ua.includes('android')) {
      if (memory != null && memory <= 4) return true;
      if (cores != null && cores <= 6) return true;
    }
  } catch {
    // ignore
  }
  return false;
}
