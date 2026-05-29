import { BOSS_TYPES, getBossHP } from '../core/constants.js';
import type { BossTypeConfig } from '../core/constants.js';
import type { BossTypeKey, BossBullet, PlayerBullet } from '../core/types.js';
import type { Player } from './player.js';

const BOSS_ANNOUNCEMENTS: Record<BossTypeKey, { text: string; color: string; fontSize: number }> = {
  horizontal:        { text: '¡JEFE!', color: '#ef4444', fontSize: 80 },
  asteroid_spawner:  { text: '¡JEFE!', color: '#ef4444', fontSize: 80 },
  pattern:           { text: '¡JEFE!', color: '#ef4444', fontSize: 80 },
  stationary:        { text: '¡JEFE!', color: '#ef4444', fontSize: 80 },
};

const BOSS_COLORS: Record<BossTypeKey, { body: string; stroke: string; eye: string; bullet: string }> = {
  horizontal:        { body: '#1a1a2e', stroke: '#ef4444', eye: '#ef4444', bullet: '#ef4444' },
  asteroid_spawner:  { body: '#0d0d0d', stroke: '#4b5563', eye: '#ef4444', bullet: '#ef4444' },
  pattern:           { body: '#1b1b2f', stroke: '#a855f7', eye: '#06b6d4', bullet: '#a855f7' },
  stationary:        { body: '#1e293b', stroke: '#f59e0b', eye: '#ef4444', bullet: '#f59e0b' },
};

export class Boss {
  type: BossTypeKey;
  x!: number;
  y!: number;
  width: number;
  height: number;
  direction: number;
  hp: number;
  maxHp: number;
  lastFireTime: number;
  lastSpawnTime: number;
  bullets: BossBullet[];
  active: boolean;
  spawnAsteroidCb: ((x: number, y: number) => void) | null = null;
  private wobblePhase: number;

  constructor(type: BossTypeKey, wave: number) {
    const config = BOSS_TYPES[type];
    this.type = type;
    this.width = config.width;
    this.height = config.height;
    this.direction = 1;
    this.hp = getBossHP(config.hp, wave);
    this.maxHp = this.hp;
    this.lastFireTime = 0;
    this.lastSpawnTime = 0;
    this.bullets = [];
    this.active = true;
    this.spawnAsteroidCb = null;
    this.wobblePhase = Math.random() * Math.PI * 2;

    switch (type) {
      case 'horizontal':
      case 'pattern':
        this.x = -this.width;
        this.y = 80;
        break;
      case 'asteroid_spawner':
        this.x = window.innerWidth / 2 - this.width / 2;
        this.y = window.innerHeight / 2 - this.height / 2;
        break;
      case 'stationary':
        this.x = window.innerWidth / 2 - this.width / 2;
        this.y = 100;
        break;
    }
  }

  get config(): BossTypeConfig {
    return BOSS_TYPES[this.type];
  }

  get colors() {
    return BOSS_COLORS[this.type];
  }

  update(dt: number, player: Player | null): void {
    const config = this.config;

    switch (this.type) {
      case 'horizontal':
      case 'pattern':
        this.x += config.speed * this.direction * dt;
        if (this.x > window.innerWidth + this.width) {
          this.direction = -1;
          this.x = window.innerWidth + this.width;
        } else if (this.x < -this.width * 2) {
          this.direction = 1;
          this.x = -this.width * 2;
        }
        break;

      case 'asteroid_spawner':
        this.y += this.direction * config.speed * dt;
        this.wobblePhase += dt * 1.5;
        this.x += Math.sin(this.wobblePhase) * 15 * dt;
        if (this.y + this.height > window.innerHeight * 0.6) {
          this.direction = -1;
        } else if (this.y < 50) {
          this.direction = 1;
        }
        break;

      case 'stationary':
        break;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      if (b.vx !== undefined && b.vy !== undefined) {
        b.x += b.vx * dt;
        b.y += b.vy * dt;
      } else {
        b.y += config.bulletSpeed * dt;
      }
      if (b.y > window.innerHeight + 20 || b.x < -20 || b.x > window.innerWidth + 20) {
        this.bullets.splice(i, 1);
      }
    }

    if (this.type !== 'asteroid_spawner') {
      const now = Date.now();
      if (now - this.lastFireTime > config.fireInterval) {
        this.fire(player);
        this.lastFireTime = now;
      }
    }

    if (this.type === 'asteroid_spawner' && this.spawnAsteroidCb) {
      const now = Date.now();
      if (now - this.lastSpawnTime > 2000) {
        const cx = this.x + this.width / 2;
        const cy = this.y + this.height / 2;
        this.spawnAsteroidCb(cx, cy);
        this.lastSpawnTime = now;
      }
    }
  }

  fire(player: Player | null): void {
    if (!player) return;
    const config = this.config;
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height;

    switch (this.type) {
      case 'horizontal':
        this.bullets.push({
          x: cx, y: cy,
          targetX: player.x, targetY: player.y,
          radius: 6,
        });
        break;

      case 'pattern': {
        const spreadAngles = [-0.35, 0, 0.35];
        for (const angle of spreadAngles) {
          this.bullets.push({
            x: cx, y: cy,
            vx: Math.sin(angle) * config.bulletSpeed,
            vy: Math.cos(angle) * config.bulletSpeed,
            targetX: player.x, targetY: player.y,
            radius: 5,
          });
        }
        break;
      }

      case 'stationary': {
        const angles = [-0.6, -0.3, 0, 0.3, 0.6];
        for (const angle of angles) {
          this.bullets.push({
            x: cx, y: cy,
            vx: Math.sin(angle) * config.bulletSpeed * 0.5,
            vy: Math.cos(angle) * config.bulletSpeed,
            targetX: player.x, targetY: player.y,
            radius: 7,
          });
        }
        break;
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D): void {
    switch (this.type) {
      case 'horizontal':   this.drawHorizontal(ctx);   break;
      case 'pattern':      this.drawPattern(ctx);      break;
      case 'asteroid_spawner': this.drawAsteroidSpawner(ctx); break;
      case 'stationary':   this.drawStationary(ctx);   break;
    }

    const col = this.colors.bullet;
    ctx.fillStyle = col;
    for (const bullet of this.bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawHorizontal(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(cx, cy);

    const grad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
    grad.addColorStop(0, 'rgba(239,68,68,0.25)');
    grad.addColorStop(0.5, 'rgba(15,24,36,0.9)');
    grad.addColorStop(1, 'rgba(239,68,68,0.1)');

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-w / 2, h / 2);
    ctx.lineTo(-w / 2, -h / 3);
    ctx.lineTo(0, -h / 2);
    ctx.lineTo(w / 2, -h / 3);
    ctx.lineTo(w / 2, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-w / 4, 0, 8, 0, Math.PI * 2);
    ctx.arc(w / 4, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, -h / 2 - 12);
    ctx.moveTo(-8, -h / 2 - 8);
    ctx.lineTo(8, -h / 2 - 8);
    ctx.stroke();

    ctx.beginPath();
    ctx.moveTo(-w * 0.15, h / 2);
    ctx.lineTo(0, h / 2 + 10);
    ctx.lineTo(w * 0.15, h / 2);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.restore();
  }

  private drawPattern(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#1b1b2f';
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(w / 2, h / 3);
    ctx.lineTo(w * 0.25, h / 2);
    ctx.lineTo(-w * 0.25, h / 2);
    ctx.lineTo(-w / 2, h / 3);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#a855f7';
    ctx.globalAlpha = 0.3;
    ctx.beginPath();
    ctx.moveTo(-w * 0.3, h / 2);
    ctx.lineTo(0, h / 2 + 14);
    ctx.lineTo(w * 0.3, h / 2);
    ctx.closePath();
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = '#06b6d4';
    ctx.shadowColor = '#06b6d4';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(0, -h * 0.15, 7, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.strokeStyle = '#a855f7';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, -h / 2);
    ctx.lineTo(0, -h / 2 - 10);
    ctx.stroke();

    ctx.restore();
  }

  private drawAsteroidSpawner(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const r = this.config.radius || 60;

    ctx.save();
    ctx.translate(cx, cy);

    const vertices: { x: number; y: number }[] = [];
    const points = 20;
    const jag = 0.06;
    for (let i = 0; i < points; i++) {
      const angle = (i / points) * Math.PI * 2;
      const seed = Math.sin(i * 7.3 + 2.1) * 0.5 + 0.5;
      const rr = r * (1 - jag + seed * jag * 2);
      vertices.push({ x: Math.cos(angle) * rr, y: Math.sin(angle) * rr });
    }

    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.fillStyle = '#0d0d0d';
    ctx.fill();

    const innerVertices = vertices.map(v => ({ x: v.x * 0.6, y: v.y * 0.6 }));
    ctx.save();
    ctx.clip();
    ctx.fillStyle = 'rgba(40,40,40,0.35)';
    ctx.beginPath();
    for (let i = 0; i < innerVertices.length; i++) {
      const v = innerVertices[i];
      const dx = v.x + r * 0.15;
      const dy = v.y + r * 0.15;
      if (i === 0) ctx.moveTo(dx, dy);
      else ctx.lineTo(dx, dy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 10;
    for (let i = 0; i < 5; i++) {
      const a = Math.PI * 0.25 + i * Math.PI * 0.4;
      ctx.beginPath();
      ctx.moveTo(Math.cos(a) * r * 0.05, Math.sin(a) * r * 0.05);
      ctx.lineTo(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55);
      ctx.lineTo(Math.cos(a + 0.35) * r * 0.82, Math.sin(a + 0.35) * r * 0.82);
      ctx.stroke();
    }
    ctx.shadowBlur = 0;
    ctx.restore();

    ctx.strokeStyle = 'rgba(80,80,80,0.6)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(vertices[0].x, vertices[0].y);
    for (let i = 1; i < vertices.length; i++) {
      ctx.lineTo(vertices[i].x, vertices[i].y);
    }
    ctx.closePath();
    ctx.stroke();

    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.font = `bold ${r * 0.55}px system-ui`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.lineWidth = 3;
    ctx.strokeStyle = 'rgba(0,0,0,0.9)';
    ctx.strokeText(String(this.hp), 0, 0);
    ctx.fillStyle = '#ffffff';
    ctx.fillText(String(this.hp), 0, 0);

    ctx.restore();
  }

  private drawStationary(ctx: CanvasRenderingContext2D): void {
    const cx = this.x + this.width / 2;
    const cy = this.y + this.height / 2;
    const w = this.width;
    const h = this.height;

    ctx.save();
    ctx.translate(cx, cy);

    ctx.fillStyle = '#1e293b';
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    const bw = w / 2;
    const bh = h / 2;
    ctx.beginPath();
    ctx.rect(-bw, -bh, w, h);
    ctx.fill();
    ctx.stroke();

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-bw, -bh * 0.3);
    ctx.lineTo(bw, -bh * 0.3);
    ctx.moveTo(-bw, bh * 0.3);
    ctx.lineTo(bw, bh * 0.3);
    ctx.stroke();

    for (let i = -1; i <= 1; i++) {
      const tx = i * w * 0.25;
      const ty = -bh - 8;
      ctx.fillStyle = '#334155';
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.rect(tx - 12, ty - 14, 24, 14);
      ctx.fill();
      ctx.stroke();

      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(tx, ty - 14);
      ctx.lineTo(tx, ty - 28);
      ctx.stroke();
    }

    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 15;
    const coreGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, 14);
    coreGrad.addColorStop(0, '#fbbf24');
    coreGrad.addColorStop(0.5, '#ef4444');
    coreGrad.addColorStop(1, 'rgba(239,68,68,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, 0, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    ctx.restore();
  }

  hit(damage: number): boolean {
    this.hp -= damage;
    if (this.hp <= 0) {
      this.active = false;
      return true;
    }
    return false;
  }

  checkPlayerCollision(player: Player): boolean {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      const dx = b.x - player.x;
      const dy = b.y - player.y;
      if (Math.sqrt(dx * dx + dy * dy) < player.radius + b.radius) {
        this.bullets.splice(i, 1);
        return true;
      }
    }

    if (this.config.radius) {
      const cx = this.x + this.width / 2;
      const cy = this.y + this.height / 2;
      const dist = Math.hypot(player.x - cx, player.y - cy);
      if (dist < player.radius + this.config.radius) return true;
    } else {
      if (player.x > this.x && player.x < this.x + this.width &&
          player.y > this.y && player.y < this.y + this.height) {
        return true;
      }
    }

    return false;
  }

  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }

  getAnnouncementConfig(): { text: string; color: string; fontSize: number } {
    return BOSS_ANNOUNCEMENTS[this.type];
  }

  getExplosionColor(): string {
    switch (this.type) {
      case 'horizontal': return '#ef4444';
      case 'pattern':    return '#a855f7';
      case 'asteroid_spawner': return '#6b7280';
      case 'stationary': return '#f59e0b';
      default: return '#ef4444';
    }
  }
}

export class BossManager {
  boss: Boss | null;
  private lastBossType: BossTypeKey | null = null;

  constructor() {
    this.boss = null;
    this.lastBossType = null;
  }

  update(dt: number, player: Player | null): void {
    if (this.boss && this.boss.active) {
      this.boss.update(dt, player);
    }
  }

  spawn(wave: number): void {
    const allTypes: BossTypeKey[] = ['horizontal', 'asteroid_spawner', 'pattern', 'stationary'];
    const available = this.lastBossType
      ? allTypes.filter(t => t !== this.lastBossType)
      : allTypes;
    const type = available[Math.floor(Math.random() * available.length)];
    this.lastBossType = type;
    this.boss = new Boss(type, wave);
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.boss && this.boss.active) {
      this.boss.draw(ctx);
    }
  }

  checkBulletCollision(bullets: PlayerBullet[]): { boss: Boss; bullet: PlayerBullet } | null {
    if (!this.boss || !this.boss.active) return null;

    const config = this.boss.config;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      let hit = false;

      if (config.radius) {
        const cx = this.boss.x + this.boss.width / 2;
        const cy = this.boss.y + this.boss.height / 2;
        hit = Math.hypot(bullet.x - cx, bullet.y - cy) < config.radius;
      } else {
        hit = bullet.x > this.boss.x && bullet.x < this.boss.x + this.boss.width &&
              bullet.y > this.boss.y && bullet.y < this.boss.y + this.boss.height;
      }

      if (hit) {
        bullets.splice(i, 1);
        return { boss: this.boss, bullet };
      }
    }
    return null;
  }

  checkPlayerCollision(player: Player): boolean {
    if (this.boss && this.boss.active) {
      return this.boss.checkPlayerCollision(player);
    }
    return false;
  }
}
