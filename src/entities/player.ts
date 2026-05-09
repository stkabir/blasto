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

  update(dt: number, keys: GameInput, frozen: boolean, hasTripleActive: boolean): void {
    const speed = PLAYER_CONFIG.speed;

    if (keys.left) {
      this.targetX = this.x - 100;
    }
    if (keys.right) {
      this.targetX = this.x + 100;
    }

    if (keys.touchX !== null) {
      this.targetX = keys.touchX;
    }

    const dx = this.targetX - this.x;
    if (Math.abs(dx) > 5) {
      this.x += Math.sign(dx) * speed * dt;
    }

    this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.x));

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

      if (this.bulletStyle === 'elongated') {
        b.history.unshift({ x: b.x, y: b.y });
        if (b.history.length > 8) b.history.pop();
      }

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

    const design = PLAYER_DESIGNS[this.designId] || PLAYER_DESIGNS.triangle;
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 2;
    design.draw(ctx, this.radius);

    ctx.restore();

    for (const b of this.bullets) {
      this.drawBullet(ctx, b, this.color);
    }
  }

  drawBullet(ctx: CanvasRenderingContext2D, b: PlayerBullet, color: string): void {
    ctx.save();

    switch (this.bulletStyle) {
      case 'glow':
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'elongated':
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.lineCap = 'round';
        ctx.beginPath();
        for (let i = 0; i < b.history.length; i++) {
          const point = b.history[i];
          ctx.globalAlpha = (b.history.length - i) / b.history.length * 0.6;
          if (i === 0) ctx.moveTo(point.x, point.y);
          else ctx.lineTo(point.x, point.y);
        }
        ctx.stroke();
        ctx.globalAlpha = 1;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.ellipse(b.x, b.y, b.radius * 1.3, b.radius * 0.8, 0, 0, Math.PI * 2);
        ctx.fill();
        break;

      case 'dual':
      default:
        ctx.shadowColor = color;
        ctx.shadowBlur = 20;
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.6, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 8;
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(b.x, b.y, b.radius * 0.3, 0, Math.PI * 2);
        ctx.fill();
        break;
    }

    ctx.restore();
  }

  reset(x: number, y: number): void {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.bullets = [];
    this.aimAngle = -Math.PI / 2;
  }
}
