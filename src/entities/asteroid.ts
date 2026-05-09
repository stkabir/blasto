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

    if (this.y > window.innerHeight + this.radius * 2) {
      return false;
    }
    if (this.x < -this.radius * 2 || this.x > window.innerWidth + this.radius * 2) {
      return false;
    }
    return true;
  }

  draw(ctx: CanvasRenderingContext2D): void {
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);

    ctx.beginPath();
    for (let i = 0; i < this.vertices.length; i++) {
      if (i === 0) {
        ctx.moveTo(this.vertices[i].x, this.vertices[i].y);
      } else {
        ctx.lineTo(this.vertices[i].x, this.vertices[i].y);
      }
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
    return {
      x: this.x - this.radius,
      y: this.y - this.radius,
      width: this.radius * 2,
      height: this.radius * 2,
    };
  }
}

export class AsteroidManager {
  asteroids: Asteroid[];
  lastSpawnTime: number;
  spawnInterval: number;
  minSpawnInterval: number;

  constructor() {
    this.asteroids = [];
    this.lastSpawnTime = 0;
    this.spawnInterval = 2000;
    this.minSpawnInterval = 800;
  }

  update(dt: number, frozen: boolean): void {
    for (let i = this.asteroids.length - 1; i >= 0; i--) {
      if (!this.asteroids[i].update(dt, frozen)) {
        this.asteroids.splice(i, 1);
      }
    }
  }

  trySpawn(score: number): void {
    const now = Date.now();
    const adjustedInterval = Math.max(this.minSpawnInterval, this.spawnInterval - score * 2);

    if (now - this.lastSpawnTime > adjustedInterval) {
      this.lastSpawnTime = now;
      this.spawn(score);
    }
  }

  spawnInitial(): void {
    const leftType = this.getRandomTypeForScore(0);
    const rightType = this.getRandomTypeForScore(0);

    const leftAsteroid = new Asteroid(window.innerWidth * 0.25, -30, leftType);
    const rightAsteroid = new Asteroid(window.innerWidth * 0.75, -30, rightType);

    const centerX = window.innerWidth / 2;
    leftAsteroid.vx = (centerX - leftAsteroid.x) * 0.015;
    leftAsteroid.vy = 60 + Math.random() * 40;
    rightAsteroid.vx = (centerX - rightAsteroid.x) * 0.015;
    rightAsteroid.vy = 60 + Math.random() * 40;

    this.asteroids.push(leftAsteroid, rightAsteroid);
  }

  spawn(score: number): void {
    const x = Math.random() * window.innerWidth;
    const y = -30 - Math.random() * 100;
    const type = this.getRandomTypeForScore(score);

    const asteroid = new Asteroid(x, y, type);
    const centerX = window.innerWidth / 2;
    asteroid.vx = (centerX - x) * 0.02 + (Math.random() - 0.5) * 30;
    asteroid.vy = Math.abs(asteroid.vy) || 60 + Math.random() * 40;

    this.asteroids.push(asteroid);
  }

  getRandomTypeForScore(_score: number): AsteroidTypeKey {
    const rand = Math.random() * 100;
    if (rand < 40) return 'LIGHT';
    if (rand < 70) return 'MED';
    if (rand < 90) return 'BLUE';
    if (rand < 96) return 'PURPLE';
    return 'RED';
  }

  draw(ctx: CanvasRenderingContext2D): void {
    for (const asteroid of this.asteroids) {
      asteroid.draw(ctx);
    }
  }

  checkBulletCollision(bullets: PlayerBullet[]): { asteroid: Asteroid; bullet: PlayerBullet; index: number } | null {
    for (let i = bullets.length - 1; i >= 0; i--) {
      const bullet = bullets[i];
      for (let j = this.asteroids.length - 1; j >= 0; j--) {
        const asteroid = this.asteroids[j];
        const dx = bullet.x - asteroid.x;
        const dy = bullet.y - asteroid.y;
        if (Math.sqrt(dx * dx + dy * dy) < asteroid.radius) {
          bullets.splice(i, 1);
          return { asteroid, bullet, index: j };
        }
      }
    }
    return null;
  }

  remove(index: number): void {
    this.asteroids.splice(index, 1);
  }

  getLargestAsteroid(): Asteroid | null {
    let largest: Asteroid | null = null;
    for (const a of this.asteroids) {
      if (!largest || a.type.level > largest.type.level) {
        largest = a;
      }
    }
    return largest;
  }

  clear(): void {
    this.asteroids = [];
    this.lastSpawnTime = 0;
  }
}
