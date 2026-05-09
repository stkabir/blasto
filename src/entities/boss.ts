import { BOSS_CONFIG } from '../core/constants.js';
import type { BossBullet, PlayerBullet } from '../core/types.js';
import type { Player } from './player.js';

export class Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  direction: number;
  hp: number;
  lastFireTime: number;
  bullets: BossBullet[];
  active: boolean;

  constructor() {
    this.x = -BOSS_CONFIG.width;
    this.y = 80;
    this.width = BOSS_CONFIG.width;
    this.height = BOSS_CONFIG.height;
    this.direction = 1;
    this.hp = BOSS_CONFIG.pointsReward;
    this.lastFireTime = 0;
    this.bullets = [];
    this.active = true;
  }

  update(dt: number, player: Player | null): void {
    this.x += BOSS_CONFIG.speed * this.direction * dt;

    if (this.x > window.innerWidth + this.width) {
      this.direction = -1;
      this.x = window.innerWidth + this.width;
    } else if (this.x < -this.width * 2) {
      this.direction = 1;
      this.x = -this.width * 2;
    }

    for (let i = this.bullets.length - 1; i >= 0; i--) {
      this.bullets[i].y += BOSS_CONFIG.bulletSpeed * dt;
      if (this.bullets[i].y > window.innerHeight + 20) {
        this.bullets.splice(i, 1);
      }
    }

    const now = Date.now();
    if (now - this.lastFireTime > BOSS_CONFIG.fireInterval) {
      this.fire(player);
      this.lastFireTime = now;
    }
  }

  fire(player: Player | null): void {
    if (!player) return;

    const startX = this.x + this.width / 2;
    const startY = this.y + this.height;

    this.bullets.push({
      x: startX,
      y: startY,
      targetX: player.x,
      targetY: player.y,
      radius: 6,
    });
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x + this.width / 2, this.y + this.height / 2);

    ctx.fillStyle = '#1a1a2e';
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 3;

    ctx.beginPath();
    ctx.moveTo(-this.width / 2, this.height / 2);
    ctx.lineTo(-this.width / 2, -this.height / 3);
    ctx.lineTo(0, -this.height / 2);
    ctx.lineTo(this.width / 2, -this.height / 3);
    ctx.lineTo(this.width / 2, this.height / 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.arc(-this.width / 4, 0, 8, 0, Math.PI * 2);
    ctx.arc(this.width / 4, 0, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    ctx.fillStyle = '#ef4444';
    for (const bullet of this.bullets) {
      ctx.beginPath();
      ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
      ctx.fill();
    }
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

    if (player.x > this.x && player.x < this.x + this.width &&
        player.y > this.y && player.y < this.y + this.height) {
      return true;
    }

    return false;
  }

  getCenter(): { x: number; y: number } {
    return {
      x: this.x + this.width / 2,
      y: this.y + this.height / 2,
    };
  }
}

export class BossManager {
  boss: Boss | null;
  nextBossScore: number;
  onSpawn: (() => void) | null;

  constructor() {
    this.boss = null;
    this.nextBossScore = BOSS_CONFIG.pointsToAppear;
    this.onSpawn = null;
  }

  update(dt: number, player: Player | null): void {
    if (this.boss && this.boss.active) {
      this.boss.update(dt, player);
    }
  }

  trySpawn(score: number): void {
    if (this.boss && this.boss.active) return;
    if (score >= this.nextBossScore) {
      this.spawn();
      this.nextBossScore += BOSS_CONFIG.pointsToAppear;
      if (this.onSpawn) this.onSpawn();
    }
  }

  spawn(): void {
    this.boss = new Boss();
  }

  draw(ctx: CanvasRenderingContext2D): void {
    if (this.boss && this.boss.active) {
      this.boss.draw(ctx);
    }
  }

  checkBulletCollision(bullets: PlayerBullet[]): { boss: Boss; bullet: PlayerBullet } | null {
    if (!this.boss || !this.boss.active) return null;

    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      if (bullet.x > this.boss.x && bullet.x < this.boss.x + this.boss.width &&
          bullet.y > this.boss.y && bullet.y < this.boss.y + this.boss.height) {
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

  clear(): void {
    this.boss = null;
    this.nextBossScore = BOSS_CONFIG.pointsToAppear;
  }
}
