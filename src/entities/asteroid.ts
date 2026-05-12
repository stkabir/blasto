import { ASTEROID_TYPES, SPLIT_MAP } from '../core/constants.js';
import type { AsteroidType, AsteroidTypeKey, AsteroidVertex, PlayerBullet } from '../core/types.js';

function mix(a: string, b: string, t: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r},${g},${bl})`;
}

function parseHex(hex: string): [number, number, number] {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!m) return [128, 128, 128];
  return [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)];
}

interface Crater { x: number; y: number; r: number; lightAngle: number; }
interface Vein { points: AsteroidVertex[]; }

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
  innerVertices: AsteroidVertex[];
  craters: Crater[];
  veins: Vein[];
  maxHp: number;

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
    this.vertices = this.generateVertices(18, 0.10);
    this.innerVertices = this.generateVertices(14, 0.08, 0.6);
    this.craters = this.generateCraters();
    this.veins = this.generateVeins();
    this.maxHp = this.hp;
  }

  private generateVertices(points: number, jag: number, scale: number = 1): AsteroidVertex[] {
    const vertices: AsteroidVertex[] = [];
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const r = this.radius * scale * (1 - jag + Math.random() * jag * 2);
      vertices.push({
        x: Math.cos(angle) * r,
        y: Math.sin(angle) * r,
      });
    }
    return vertices;
  }

  private generateCraters(): Crater[] {
    const n = 2 + Math.floor(Math.random() * 3);
    const list: Crater[] = [];
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const d = Math.random() * this.radius * 0.5;
      list.push({
        x: Math.cos(a) * d,
        y: Math.sin(a) * d,
        r: this.radius * (0.1 + Math.random() * 0.18),
        lightAngle: -Math.PI * 0.75,
      });
    }
    return list;
  }

  private generateVeins(): Vein[] {
    const n = 2 + Math.floor(Math.random() * 3);
    const veins: Vein[] = [];
    for (let i = 0; i < n; i++) {
      const baseAngle = Math.random() * Math.PI * 2;
      const len = this.radius * (0.6 + Math.random() * 0.6);
      const startD = -this.radius * 0.4 + Math.random() * this.radius * 0.4;
      const points: AsteroidVertex[] = [];
      const segs = 3 + Math.floor(Math.random() * 3);
      for (let s = 0; s <= segs; s++) {
        const t = s / segs;
        const along = startD + t * len;
        const wobble = (Math.random() - 0.5) * this.radius * 0.18;
        const a = baseAngle + Math.PI / 2;
        points.push({
          x: Math.cos(baseAngle) * along + Math.cos(a) * wobble,
          y: Math.sin(baseAngle) * along + Math.sin(a) * wobble,
        });
      }
      veins.push({ points });
    }
    return veins;
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

    const palette = {
      base: this.type.color,
      highlight: mix(this.type.color, '#ffffff', 0.35),
      shadow: mix(this.type.color, '#000000', 0.55),
    };
    const r = this.radius;

    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      if (i === 0) ctx.moveTo(this.vertices[i].x, this.vertices[i].y);
      else ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = palette.base;
    ctx.fill();

    ctx.save();
    ctx.clip();

    ctx.fillStyle = palette.shadow;
    ctx.globalAlpha = 0.45;
    ctx.beginPath();
    for (let i = 0; i < this.innerVertices.length; i++) {
      const v = this.innerVertices[i];
      const x = v.x + r * 0.35;
      const y = v.y + r * 0.35;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.fillStyle = palette.highlight;
    ctx.globalAlpha = 0.35;
    ctx.beginPath();
    for (let i = 0; i < this.innerVertices.length; i++) {
      const v = this.innerVertices[i];
      const x = v.x - r * 0.3;
      const y = v.y - r * 0.3;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;

    ctx.strokeStyle = 'rgba(0,0,0,0.45)';
    ctx.lineWidth = 1;
    ctx.lineCap = 'round';
    for (const v of this.veins) {
      ctx.beginPath();
      ctx.moveTo(v.points[0].x, v.points[0].y);
      for (let i = 1; i < v.points.length; i++) {
        ctx.lineTo(v.points[i].x, v.points[i].y);
      }
      ctx.stroke();
    }

    for (const c of this.craters) {
      ctx.fillStyle = palette.shadow;
      ctx.globalAlpha = 0.85;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r, 0, Math.PI * 2);
      ctx.fill();

      ctx.globalAlpha = 0.6;
      ctx.strokeStyle = palette.highlight;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.95, c.lightAngle - Math.PI * 0.45, c.lightAngle + Math.PI * 0.45);
      ctx.stroke();

      ctx.globalAlpha = 0.5;
      ctx.strokeStyle = 'rgba(0,0,0,0.7)';
      ctx.beginPath();
      ctx.arc(c.x, c.y, c.r * 0.95, c.lightAngle + Math.PI - Math.PI * 0.45, c.lightAngle + Math.PI + Math.PI * 0.45);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    const dmg = 1 - this.hp / this.maxHp;
    if (dmg > 0.15) {
      ctx.strokeStyle = `rgba(0,0,0,${0.4 + dmg * 0.5})`;
      ctx.lineWidth = 1.4;
      ctx.lineCap = 'round';
      const cracks = Math.floor(dmg * 5);
      for (let i = 0; i < cracks; i++) {
        const a = (i / cracks) * Math.PI * 2 + (i * 0.37);
        const midR = r * 0.3;
        const endR = r * (0.85 + Math.random() * 0.1);
        const midX = Math.cos(a) * midR + Math.cos(a + 1.2) * r * 0.12;
        const midY = Math.sin(a) * midR + Math.sin(a + 1.2) * r * 0.12;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(midX, midY);
        ctx.lineTo(Math.cos(a) * endR, Math.sin(a) * endR);
        ctx.stroke();
      }
    }

    ctx.restore();

    ctx.strokeStyle = 'rgba(0,0,0,0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      if (i === 0) ctx.moveTo(this.vertices[i].x, this.vertices[i].y);
      else ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.rotate(-this.rotation);
    ctx.beginPath();
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.arc(0, 0, this.radius * 0.42, 0, Math.PI * 2);
    ctx.fill();

    ctx.font = `bold ${this.radius * 0.65}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(String(this.hp), 0, 0);
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
    this.currentPhase++;
    if (this.currentPhase > 3) {
      this.currentPhase = 1;
      this.currentWave++;
    }
    if (this.currentWave === 0) {
      this.currentWave = 1;
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
