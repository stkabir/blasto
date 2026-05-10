import { ASTEROID_TYPES, SPLIT_MAP } from '../core/constants.js';
import type { AsteroidType, AsteroidTypeKey, AsteroidVertex, PlayerBullet } from '../core/types.js';

export class Asteroid {
  x: number;
  y: number;
  type: AsteroidType;
  radius: number;
  hp: number;
  vx: number;
  vy: number;
  createdAt: number;
  rotation: number;
  rotationSpeed: number;
  vertices: AsteroidVertex[];

  constructor(x: number, y: number, type: AsteroidTypeKey, vx: number | null = null, vy: number | null = null) {
    this.x = x;
    this.y = y;
    this.type = ASTEROID_TYPES[type];
    this.radius = this.type.radius;
    this.hp = this.type.hp;

    if (vx !== null && vy !== null) {
      this.vx = vx;
      this.vy = vy;
    } else {
      const speed = this.type.fallSpeed;
      const angle = Math.random() * Math.PI * 0.2 + Math.PI * 0.4;
      this.vx = Math.cos(angle) * speed * 0.3 * (x < window.innerWidth / 2 ? 1 : -1);
      this.vy = Math.sin(angle) * speed;
    }

    this.createdAt = Date.now();
    this.rotation = 0;
    this.rotationSpeed = (Math.random() - 0.5) * 2;
    this.vertices = this.generateVertices();
  }

  private generateVertices(): AsteroidVertex[] {
    const points = 10;
    const vertices: AsteroidVertex[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const jag = 0.15;
      const r = this.radius * (1 - jag + Math.random() * jag * 2);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return vertices;
  }

  update(dt: number, frozen: boolean): boolean {
    const speedMod = frozen ? 0.5 : 1;
    if (this.vy < this.type.fallSpeed && Date.now() - this.createdAt > 500) {
      this.vy = this.type.fallSpeed;
    }
    this.x += this.vx * speedMod * dt;
    this.y += this.vy * speedMod * dt;
    this.rotation += this.rotationSpeed * dt;

    if (this.y > window.innerHeight + this.radius * 2) return false;
    if (this.x < -this.radius * 2 || this.x > window.innerWidth + this.radius * 2) return false;
    return true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      if (i === 0) ctx.moveTo(this.vertices[i].x, this.vertices[i].y);
      else ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = 'rgba(15, 24, 36, 0.5)';
    ctx.fill();
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2;
    ctx.stroke();

    ctx.font = `bold ${this.radius * 0.7}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    ctx.fillText(String(this.hp), 1, 1);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(this.hp), 0, 0);

    ctx.restore();
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    return this.hp <= 0;
  }

  split(): Asteroid[] {
    const nextType = SPLIT_MAP[this.type.level];
    if (!nextType) return [];

    const children: Asteroid[] = [];
    const speed = 80 + Math.random() * 60;
    const verticalSpeed = speed * (0.8 + Math.random() * 0.2);
    const horizontalSpeed = speed * 0.1;
    const upwardBoost = -80 - Math.random() * 40;

    children.push(new Asteroid(this.x, this.y, nextType, -horizontalSpeed * Math.random(), verticalSpeed + upwardBoost));
    children.push(new Asteroid(this.x, this.y, nextType, horizontalSpeed * Math.random(), verticalSpeed + upwardBoost));

    return children;
  }

  getBounds(): { x: number; y: number; width: number; height: number } {
    return { x: this.x - this.radius, y: this.y - this.radius, width: this.radius * 2, height: this.radius * 2 };
  }
}

interface PhaseSpawn {
  LIGHT: number;
  MED: number;
  BLUE: number;
  PURPLE: number;
  RED: number;
}

const WAVE_CONFIG: Record<number, [PhaseSpawn, PhaseSpawn, PhaseSpawn]> = {
  0: [
    { LIGHT: 3, MED: 1, BLUE: 0, PURPLE: 0, RED: 0 },
    { LIGHT: 2, MED: 3, BLUE: 0, PURPLE: 0, RED: 0 },
    { LIGHT: 1, MED: 3, BLUE: 1, PURPLE: 0, RED: 0 },
  ],
  1: [
    { LIGHT: 4, MED: 2, BLUE: 0, PURPLE: 0, RED: 0 },
    { LIGHT: 3, MED: 4, BLUE: 1, PURPLE: 0, RED: 0 },
    { LIGHT: 1, MED: 3, BLUE: 2, PURPLE: 1, RED: 0 },
  ],
  2: [
    { LIGHT: 4, MED: 3, BLUE: 1, PURPLE: 0, RED: 0 },
    { LIGHT: 3, MED: 5, BLUE: 2, PURPLE: 0, RED: 0 },
    { LIGHT: 1, MED: 4, BLUE: 3, PURPLE: 2, RED: 0 },
  ],
  3: [
    { LIGHT: 5, MED: 3, BLUE: 2, PURPLE: 0, RED: 0 },
    { LIGHT: 4, MED: 5, BLUE: 3, PURPLE: 1, RED: 0 },
    { LIGHT: 0, MED: 4, BLUE: 4, PURPLE: 3, RED: 1 },
  ],
  4: [
    { LIGHT: 5, MED: 4, BLUE: 3, PURPLE: 1, RED: 0 },
    { LIGHT: 4, MED: 6, BLUE: 4, PURPLE: 2, RED: 0 },
    { LIGHT: 0, MED: 5, BLUE: 5, PURPLE: 4, RED: 2 },
  ],
};

const PHASE_PAUSE = 1000;
const WAVE_PAUSE = 1500;

export class AsteroidManager {
  asteroids: Asteroid[] = [];

  currentWave: number = 0;
  currentPhase: number = 0;
  phaseTimer: number = 0;
  waveSystemActive: boolean = false;
  warmupActive: boolean = false;
  private waitingForBoss: boolean = false;

  onPhaseStart: ((wave: number, phase: number) => void) | null = null;
  onWaveComplete: ((wave: number) => void) | null = null;
  onBossWave: ((wave: number) => void) | null = null;
  onWarmupComplete: (() => void) | null = null;
  onPauseStart: ((isWaveEnd: boolean, duration: number, waveBeforePause: number) => void) | null = null;

  update(dt: number, frozen: boolean): void {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      if (!this.asteroids[i].update(dt, frozen)) {
        this.asteroids.splice(i, 1);
      }
    }

    if (this.waitingForBoss) return;

    if (this.warmupActive && this.asteroids.length === 0) {
      this.warmupActive = false;
      if (this.onWarmupComplete) this.onWarmupComplete();
      return;
    }

    if (!this.waveSystemActive) return;

    if (this.currentPhase === 0) {
      this.phaseTimer -= dt * 1000;
      if (this.phaseTimer <= 0) {
        this.startNextPhaseOrWave();
      }
      return;
    }

    if (this.asteroids.length === 0) {
      if (this.currentPhase < 3) {
        this.phaseTimer = PHASE_PAUSE;
        this.currentPhase = 0;
        if (this.onPauseStart) this.onPauseStart(false, PHASE_PAUSE, this.currentWave);
      } else {
        const waveCompleted = this.currentWave;
        this.phaseTimer = WAVE_PAUSE;
        this.currentPhase = 0;
        this.currentWave++;
        if (this.onPauseStart) this.onPauseStart(true, WAVE_PAUSE, waveCompleted);
        if (this.onWaveComplete) this.onWaveComplete(this.currentWave);
      }
    }
  }

  startWaveSystem(): void {
    this.currentWave = 0;
    this.currentPhase = 0;
    this.phaseTimer = 0;
    this.waveSystemActive = true;
    this.warmupActive = false;
    this.waitingForBoss = false;
    this.startNextPhaseOrWave();
  }

  jumpToWave(wave: number): void {
    this.currentWave = wave;
    this.currentPhase = 0;
    this.phaseTimer = 0;
    this.waveSystemActive = true;
    this.warmupActive = false;
    this.waitingForBoss = false;
    this.asteroids = [];
  }

  spawnInitial(): void {
    this.warmupActive = true;
    const left = new Asteroid(window.innerWidth * 0.25, -30, 'LIGHT');
    const right = new Asteroid(window.innerWidth * 0.75, -30, 'LIGHT');
    const cx = window.innerWidth / 2;
    left.vx = (cx - left.x) * 0.015;
    left.vy = 60 + Math.random() * 40;
    right.vx = (cx - right.x) * 0.015;
    right.vy = 60 + Math.random() * 40;
    this.asteroids.push(left, right);
  }

  notifyBossDefeated(): void {
    if (!this.waitingForBoss) return;
    this.waitingForBoss = false;
    const waveCompleted = this.currentWave;
    this.phaseTimer = WAVE_PAUSE;
    this.currentPhase = 0;
    this.currentWave++;
    if (this.onPauseStart) this.onPauseStart(true, WAVE_PAUSE, waveCompleted);
    if (this.onWaveComplete) this.onWaveComplete(this.currentWave);
  }

  private startNextPhaseOrWave(): void {
    if (this.currentPhase === 0) {
      this.currentWave++;
      this.currentPhase = 1;
    } else {
      this.currentPhase++;
    }

    if (this.currentPhase > 3) {
      this.currentPhase = 1;
      this.currentWave++;
    }

    if (this.currentPhase === 3 && this.currentWave % 5 === 0) {
      this.waitingForBoss = true;
      if (this.onBossWave) this.onBossWave(this.currentWave);
      return;
    }

    const types = this.getPhaseSpawns(this.currentPhase);
    this.spawnTypes(types);

    if (this.onPhaseStart) {
      this.onPhaseStart(this.currentWave, this.currentPhase);
    }
  }

  private getPhaseSpawns(phase: number): AsteroidTypeKey[] {
    const tier = Math.min(4, Math.floor((this.currentWave - 1) / 5));
    const bonus = (this.currentWave - 1) % 5;
    const cfg = WAVE_CONFIG[tier][phase - 1];
    const types: AsteroidTypeKey[] = [];

    const push = (t: AsteroidTypeKey, n: number) => { for (let i = 0; i < n; i++) types.push(t); };
    push('LIGHT', cfg.LIGHT + bonus);
    push('MED', cfg.MED + Math.floor(bonus * 0.6));
    push('BLUE', cfg.BLUE + Math.floor(bonus * 0.4));
    push('PURPLE', cfg.PURPLE + Math.floor(bonus * 0.2));
    push('RED', cfg.RED);

    return types;
  }

  private spawnTypes(types: AsteroidTypeKey[]): void {
    const delay = Math.max(200, 600 - this.currentWave * 10);

    types.forEach((type, i) => {
      setTimeout(() => {
        if (!this.waveSystemActive) return;
        const x = 40 + Math.random() * (window.innerWidth - 80);
        const y = -30 - Math.random() * 40;
        const a = new Asteroid(x, y, type);
        a.vx = (window.innerWidth / 2 - x) * 0.015 + (Math.random() - 0.5) * 20;
        a.vy = Math.abs(a.vy) || 50 + Math.random() * 40;
        this.asteroids.push(a);
      }, i * delay);
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const a of this.asteroids) a.draw(ctx);
  }

  checkBulletCollision(bullets: PlayerBullet[]): { asteroid: Asteroid; bullet: PlayerBullet; index: number } | null {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const b = bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const a = this.asteroids[j];
        if (Math.hypot(b.x - a.x, b.y - a.y) < a.radius) {
          bullets.splice(i, 1);
          return { asteroid: a, bullet: b, index: j };
        }
      }
    }
    return null;
  }

  remove(index: number): void {
    this.asteroids.splice(index, 1);
  }

  getLargestAsteroid(): Asteroid | null {
    let best: Asteroid | null = null;
    for (const a of this.asteroids) {
      if (!best || a.type.level > best.type.level) best = a;
    }
    return best;
  }

  clear(): void {
    this.asteroids = [];
    this.currentWave = 0;
    this.currentPhase = 0;
    this.phaseTimer = 0;
    this.waveSystemActive = false;
    this.warmupActive = false;
    this.waitingForBoss = false;
  }
}
