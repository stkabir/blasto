import { PLAYER_CONFIG, PLAYER_DESIGNS, BULLET_STYLES } from '../core/constants.js';
import type { PlayerBullet, Rocket, GameInput } from '../core/types.js';
import type { AsteroidManager } from './asteroid.js';

export class Player {
  x: number;
  y: number;
  radius: number;
  targetX: number;
  aimAngle: number;
  lastFireTime: number;
  bullets: PlayerBullet[];
  designId: string;
  color: string;
  bulletStyle: string;
  invulnerableUntil: number = 0;

  constructor(x: number, y: number) {
    this.x = x;
    this.y = y;
    this.radius = PLAYER_CONFIG.radius;
    this.targetX = x;
    this.aimAngle = -Math.PI / 2;
    this.lastFireTime = 0;
    this.bullets = [];
    this.designId = 'triangle';
    this.color = PLAYER_DESIGNS.triangle.color;
    this.bulletStyle = 'dual';
  }

  setDesign(id: string): void {
    if (PLAYER_DESIGNS[id]) {
      this.designId = id;
      this.color = PLAYER_DESIGNS[id].color;
    }
  }

  setColor(color: string): void {
    this.color = color;
  }

  setBulletStyle(id: string): void {
    if (BULLET_STYLES[id]) {
      this.bulletStyle = id;
    }
  }

  isInvulnerable(): boolean {
    return Date.now() < this.invulnerableUntil;
  }

  update(dt: number, keys: GameInput, frozen: boolean, hasTripleActive: boolean): void {
    const speed = PLAYER_CONFIG.speed;

    if (keys.touchX !== null) {
      this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, keys.touchX));
    } else {
      if (keys.left) {
        this.x -= speed * dt;
      }
      if (keys.right) {
        this.x += speed * dt;
      }
      this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.x));
    }

    this.targetX = this.x;

    this.tryFire(hasTripleActive);
    this.updateBullets(dt);
  }

  tryFire(hasTripleActive: boolean): void {
    const now = Date.now();
    if (now - this.lastFireTime < PLAYER_CONFIG.fireRate) return;
    this.lastFireTime = now;

    this.fireNormal();

    if (hasTripleActive) {
      this.fireTriple();
    }
  }

  fireNormal(): void {
    this.bullets.push({
      x: this.x,
      y: this.y,
      vx: 0,
      vy: -PLAYER_CONFIG.bulletSpeed,
      radius: 8,
      history: [{ x: this.x, y: this.y }],
    });
  }

  fireTriple(): void {
    const baseAngle = -Math.PI / 2;
    const angles = [
      baseAngle - Math.PI / 15,
      baseAngle,
      baseAngle + Math.PI / 15,
    ];

    for (const angle of angles) {
      const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
      const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;
      this.bullets.push({
        x: this.x,
        y: this.y,
        vx,
        vy,
        radius: 6,
        history: [{ x: this.x, y: this.y }],
      });
    }
  }

  fireRocket(asteroidManager: AsteroidManager | null): Rocket | null {
    const largest = asteroidManager?.getLargestAsteroid();
    if (!largest) return null;

    return {
      x: this.x,
      y: this.y,
      target: largest,
      speed: 400,
      damage: largest.hp,
      radius: 8,
    };
  }

  updateBullets(dt: number): void {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.history.push({ x: b.x, y: b.y });
      if (b.history.length > 6) b.history.shift();

      if (b.y < -20 || b.y > window.innerHeight + 20 ||
          b.x < -20 || b.x > window.innerWidth + 20) {
        this.bullets.splice(i, 1);
      }
    }
  }

  draw(ctx: CanvasRenderingContext2D, hasShieldActive: boolean): void {
    ctx.save();
    ctx.translate(this.x, this.y);

    if (hasShieldActive) {
      ctx.beginPath();
      ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 3;
      ctx.stroke();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
      ctx.fill();
    }

    if (this.isInvulnerable()) {
      ctx.globalAlpha = Math.floor(Date.now() / 150) % 2 === 0 ? 1 : 0.25;
    }

    const design = PLAYER_DESIGNS[this.designId] || PLAYER_DESIGNS.triangle;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    design.draw(ctx, this.radius);

    if (this.isInvulnerable()) {
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    for (const b of this.bullets) {
      this.drawBullet(ctx, b, this.color);
    }
  }

  drawBullet(ctx: CanvasRenderingContext2D, b: PlayerBullet, color: string): void {
    ctx.save();

    if (b.history.length > 1 && this.bulletStyle !== 'beam' && this.bulletStyle !== 'elongated') {
      ctx.strokeStyle = color;
      ctx.lineCap = 'round';
      ctx.lineWidth = b.radius * 0.9;
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.moveTo(b.history[0].x, b.history[0].y);
      for (let i = 1; i < b.history.length; i++) {
        ctx.lineTo(b.history[i].x, b.history[i].y);
      }
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    switch (this.bulletStyle) {
      case 'glow': {
        ctx.shadowColor = color;
        ctx.shadowBlur = 24;
        const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 1.5);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.4, color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 1.5, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'elongated': {
        const len = 28;
        const speed = Math.hypot(b.vx, b.vy) || 1;
        const tx = b.x - (b.vx / speed) * len;
        const ty = b.y - (b.vy / speed) * len;

        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        ctx.strokeStyle = color;
        ctx.lineWidth = 5;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.lineWidth = 2;
        ctx.strokeStyle = '#ffffff';
        ctx.beginPath();
        ctx.moveTo(b.x - (b.vx / speed) * len * 0.5, b.y - (b.vy / speed) * len * 0.5);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius * 1.1, b.radius * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'beam':
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;
        ctx.strokeStyle = color;
        ctx.lineWidth = 6;
        ctx.lineCap = 'round';
        ctx.globalAlpha = 0.35;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius);
        ctx.lineTo(b.x, b.y - 36);
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(b.x, b.y + b.radius);
        ctx.lineTo(b.x, b.y - 36);
        ctx.stroke();
        ctx.shadowBlur = 0;
        break;

      case 'spark': {
        const t = Date.now() / 60;
        ctx.shadowColor = color;
        ctx.shadowBlur = 14;
        for (let s = 0; s < 5; s++) {
          const angle = t + (s / 5) * Math.PI * 2;
          const dist = 6 + Math.sin(t * 4 + s) * 3;
          const sx = b.x + Math.cos(angle) * dist;
          const sy = b.y + Math.sin(angle) * dist;
          ctx.globalAlpha = 0.7;
          ctx.fillStyle = color;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.55, 0, Math.PI * 2);
        ctx.fill();
        break;
      }

      case 'dual':
      default: {
        ctx.shadowColor = color;
        ctx.shadowBlur = 22;
        const dg = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, b.radius * 1.2);
        dg.addColorStop(0, '#ffffff');
        dg.addColorStop(0.4, color);
        dg.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.fillStyle = dg;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.32, 0, Math.PI * 2);
        ctx.fill();
        break;
      }
    }

    ctx.restore();
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.bullets = [];
    this.aimAngle = -Math.PI / 2;
    this.invulnerableUntil = 0;
  }
}
