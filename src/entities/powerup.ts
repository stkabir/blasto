import { POWERUP_TYPES, POWERUP_SPAWN_KILLS, POWERUP_LIFE_CHANCE, POWERUP_REGULAR_CHANCE, POWERUP_HP } from '../core/constants.js';
import type { PowerUpType, ActivePowerUp, PlayerBullet } from '../core/types.js';
import { getScreenHeight } from '../core/screen.js';

type ActivePowerUpsMap = Record<string, ActivePowerUp>;

export class PowerUp {
  x: number;
  y: number;
  type: PowerUpType;
  radius: number;
  speed: number;
  angle: number;
  hp: number;

  constructor(x: number, y: number, type: PowerUpType) {
    this.x = x;
    this.y = y;
    this.type = type;
    this.radius = 20;
    this.speed = 60;
    this.angle = Math.PI / 2;
    this.hp = POWERUP_HP;
  }

  update(dt: number, frozen: boolean): void {
    const speedMod = frozen ? 0.5 : 1;
    this.y += Math.sin(this.angle) * this.speed * speedMod * dt;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.globalAlpha = 0.4;
    ctx.fillStyle = this.type.color;
    ctx.strokeStyle = this.type.color;
    ctx.lineWidth = 2;

    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.font = '16px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(this.type.icon, this.x, this.y);
    ctx.restore();
  }
}

export class PowerUpManager {
  powerups: PowerUp[];
  activePowerUps: ActivePowerUpsMap;
  killsSinceLastSpawn: number;

  constructor() {
    this.powerups = [];
    this.activePowerUps = {};
    this.killsSinceLastSpawn = 0;
  }

  update(dt: number, frozen: boolean): void {
    const powerups = this.powerups;
    const h = getScreenHeight();
    for (let i = powerups.length - 1; i >= 0; i--) {
      powerups[i].update(dt, frozen);
      if (powerups[i].y > h + 50) {
        powerups[i] = powerups[powerups.length - 1];
        powerups.pop();
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const p of this.powerups) {
      p.draw(ctx);
    }
  }

  checkCollision(x: number, y: number, radius: number): PowerUpType | null {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const dx = x - p.x;
      const dy = y - p.y;
      const r = radius + p.radius;
      if (dx * dx + dy * dy < r * r) {
        this.powerups.splice(i, 1);
        return p.type;
      }
    }
    return null;
  }

  onAsteroidKilled(): void {
    this.killsSinceLastSpawn++;
    if (this.killsSinceLastSpawn >= POWERUP_SPAWN_KILLS) {
      this.killsSinceLastSpawn = 0;

      if (!this.activePowerUps.life && Math.random() < POWERUP_LIFE_CHANCE) {
        this.spawn(POWERUP_TYPES.LIFE);
        return;
      }

      if (Math.random() < POWERUP_REGULAR_CHANCE) {
        this.spawnRandom();
      }
    }
  }

  spawnRandom(): void {
    const types = [POWERUP_TYPES.TRIPLE, POWERUP_TYPES.ROCKET, POWERUP_TYPES.SHIELD, POWERUP_TYPES.FREEZE];
    const type = types[Math.floor(Math.random() * types.length)];
    this.spawn(type);
  }

  spawn(type: PowerUpType): void {
    const x = Math.random() * (window.innerWidth - 100) + 50;
    const y = -30;
    const powerup = new PowerUp(x, y, type);
    this.powerups.push(powerup);
  }

  activate(type: PowerUpType): void {
    if (type.id === 'life') {
      this.activePowerUps.life = { type, remaining: Infinity, maxDuration: Infinity };
      return;
    }

    if (this.activePowerUps[type.id]) {
      this.activePowerUps[type.id].remaining = type.duration;
      this.activePowerUps[type.id].maxDuration = type.duration;
    } else {
      this.activePowerUps[type.id] = {
        type: type,
        remaining: type.duration,
        startTime: Date.now(),
        maxDuration: type.duration,
      };
    }
  }

  activateByShooting(bullets: PlayerBullet[]): PowerUpType | null {
    for (let i = this.powerups.length - 1; i >= 0; i--) {
      const p = this.powerups[i];
      const pr = p.radius;
      for (let j = bullets.length - 1; j >= 0; j--) {
        const b = bullets[j];
        const dx = b.x - p.x;
        const dy = b.y - p.y;
        const r = b.radius + pr;
        if (dx * dx + dy * dy < r * r) {
          p.hp--;
          bullets.splice(j, 1);
          if (p.hp <= 0) {
            const type = p.type;
            this.powerups.splice(i, 1);
            return type;
          }
          break;
        }
      }
    }
    return null;
  }

  updateActive(dt: number): void {
    for (const key in this.activePowerUps) {
      if (key === 'life') continue;
      const pu = this.activePowerUps[key];
      pu.remaining -= dt * 1000;
      if (pu.remaining <= 0) {
        delete this.activePowerUps[key];
      }
    }
  }

  hasActive(typeId: string): boolean {
    return typeId in this.activePowerUps;
  }

  getRemainingTime(typeId: string): number {
    if (typeId in this.activePowerUps) {
      return Math.max(0, this.activePowerUps[typeId].remaining);
    }
    return 0;
  }

  clear(): void {
    this.powerups = [];
    this.activePowerUps = {};
    this.killsSinceLastSpawn = 0;
  }
}
