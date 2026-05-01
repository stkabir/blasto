"use strict";

const ASTEROID_TYPES = {
    LIGHT: { level: 1, color: '#84cc16', hp: 6, points: 15, minSpeed: 80, maxSpeed: 120, radius: 15 },
    MED: { level: 2, color: '#15803d', hp: 12, points: 30, minSpeed: 70, maxSpeed: 100, radius: 22 },
    BLUE: { level: 3, color: '#3b82f6', hp: 24, points: 60, minSpeed: 60, maxSpeed: 90, radius: 30 },
    PURPLE: { level: 4, color: '#a855f7', hp: 48, points: 120, minSpeed: 50, maxSpeed: 80, radius: 38 },
    RED: { level: 5, color: '#ef4444', hp: 96, points: 240, minSpeed: 40, maxSpeed: 60, radius: 46 }
};

const SPLIT_MAP = {
    1: null,
    2: 'LIGHT',
    3: 'MED',
    4: 'BLUE',
    5: 'PURPLE'
};

class Asteroid {
    constructor(x, y, type, vx = null, vy = null) {
        this.x = x;
        this.y = y;
        this.type = ASTEROID_TYPES[type];
        this.radius = this.type.radius;
        this.hp = this.type.hp;

        if (vx !== null && vy !== null) {
            this.vx = vx;
            this.vy = vy;
        } else {
            const speed = this.type.minSpeed + Math.random() * (this.type.maxSpeed - this.type.minSpeed);
            const angle = Math.random() * Math.PI * 0.2 + Math.PI * 0.4;
            this.vx = Math.cos(angle) * speed * (x < window.innerWidth / 2 ? 1 : -1);
            this.vy = Math.sin(angle) * speed;
        }

        this.rotation = 0;
        this.rotationSpeed = (Math.random() - 0.5) * 2;
        this.vertices = this.generateVertices();
    }

    generateVertices() {
        const points = 10;
        const vertices = [];
        for (let i = 0; i < points; i++) {
            const angle = (i / points) * Math.PI * 2;
            const jag = 0.4;
            const r = this.radius * (1 - jag + Math.random() * jag * 2);
            vertices.push({
                x: Math.cos(angle) * r,
                y: Math.sin(angle) * r
            });
        }
        return vertices;
    }

    update(dt, frozen) {
        const speedMod = frozen ? 0.5 : 1;
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

    draw(ctx) {
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

        ctx.restore();
    }

    hit(damage) {
        this.hp -= damage;
        return this.hp <= 0;
    }

    split() {
        const nextType = SPLIT_MAP[this.type.level];
        if (!nextType) return [];

        const children = [];
        const speed = 80 + Math.random() * 60;
        const baseAngle = this.vy >= 0 ? 0 : Math.PI;
        const spread = Math.PI * 0.15;

        const angle1 = baseAngle - spread / 2 + Math.random() * Math.PI * 0.1;
        const angle2 = baseAngle + spread / 2 + Math.random() * Math.PI * 0.1;

        children.push(new Asteroid(this.x, this.y, nextType, Math.cos(angle1) * speed * 0.25, Math.abs(Math.sin(angle1)) * speed));
        children.push(new Asteroid(this.x, this.y, nextType, Math.cos(angle2) * speed * 0.25, Math.abs(Math.sin(angle2)) * speed));

        return children;
    }

    getBounds() {
        return {
            x: this.x - this.radius,
            y: this.y - this.radius,
            width: this.radius * 2,
            height: this.radius * 2
        };
    }
}

class AsteroidManager {
    constructor() {
        this.asteroids = [];
        this.lastSpawnTime = 0;
        this.spawnInterval = 2000;
        this.minSpawnInterval = 800;
    }

    update(dt, frozen, score) {
        const adjustedInterval = Math.max(this.minSpawnInterval, this.spawnInterval - score * 2);

        for (let i = this.asteroids.length - 1; i >= 0; i--) {
            if (!this.asteroids[i].update(dt, frozen)) {
                this.asteroids.splice(i, 1);
            }
        }
    }

    trySpawn(score) {
        const now = Date.now();
        const adjustedInterval = Math.max(this.minSpawnInterval, this.spawnInterval - score * 2);

        if (now - this.lastSpawnTime > adjustedInterval) {
            this.lastSpawnTime = now;
            this.spawn();
        }
    }

    spawnInitial() {
        const leftType = this.getRandomTypeForScore(0);
        const rightType = this.getRandomTypeForScore(0);

        const leftAsteroid = new Asteroid(-30, 100, leftType);
        leftAsteroid.vx = Math.abs(leftAsteroid.vx);

        const rightAsteroid = new Asteroid(window.innerWidth + 30, 100, rightType);
        rightAsteroid.vx = -Math.abs(rightAsteroid.vx);

        this.asteroids.push(leftAsteroid, rightAsteroid);
    }

    spawn() {
        const side = Math.random() > 0.5 ? 0 : 1;
        const x = side === 0 ? -30 : window.innerWidth + 30;
        const y = -30 - Math.random() * 100;
        const type = this.getRandomTypeForScore(window.gameScore || 0);

        const asteroid = new Asteroid(x, y, type);
        if (side === 0) {
            asteroid.vx = Math.abs(asteroid.vx);
        } else {
            asteroid.vx = -Math.abs(asteroid.vx);
        }

        this.asteroids.push(asteroid);
    }

    getRandomTypeForScore(score) {
        const types = ['LIGHT', 'MED'];
        if (score >= 60) types.push('BLUE');
        if (score >= 120) types.push('PURPLE');
        if (score >= 200) types.push('RED');

        return types[Math.floor(Math.random() * types.length)];
    }

    draw(ctx) {
        for (const asteroid of this.asteroids) {
            asteroid.draw(ctx);
        }
    }

    checkBulletCollision(bullets) {
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

    remove(index) {
        this.asteroids.splice(index, 1);
    }

    getLargestAsteroid() {
        let largest = null;
        for (const a of this.asteroids) {
            if (!largest || a.type.level > largest.type.level) {
                largest = a;
            }
        }
        return largest;
    }

    clear() {
        this.asteroids = [];
        this.lastSpawnTime = 0;
    }
}

window.ASTEROID_TYPES = ASTEROID_TYPES;
window.Asteroid = Asteroid;
window.AsteroidManager = AsteroidManager;