"use strict";

const PLAYER_CONFIG = {
    speed: 350,
    radius: 18,
    fireRate: 167,
    bulletSpeed: 500,
    bulletDamage: 10
};

class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.radius = PLAYER_CONFIG.radius;
        this.targetX = x;
        this.aimAngle = -Math.PI / 2;
        this.lastFireTime = 0;
        this.bullets = [];
        this.hasShield = false;
        this.shieldStartTime = 0;
    }

    update(dt, keys) {
        const speed = PLAYER_CONFIG.speed;

        if (keys.touchX !== null) {
            this.targetX = keys.touchX;
        }

        const dx = this.targetX - this.x;
        if (Math.abs(dx) > 5) {
            this.x += Math.sign(dx) * speed * dt;
        }

        this.x = Math.max(this.radius, Math.min(window.innerWidth - this.radius, this.x));

        this.tryFire();
        this.updateBullets(dt);
    }

    tryFire() {
        const now = Date.now();
        if (now - this.lastFireTime < PLAYER_CONFIG.fireRate) return;
        this.lastFireTime = now;

        this.fireNormal();

        if (window.powerUpManager && window.powerUpManager.hasActive('triple')) {
            this.fireTriple();
        }
    }

    fireNormal() {
        const vx = 0;
        const vy = -PLAYER_CONFIG.bulletSpeed;
        this.bullets.push({
            x: this.x,
            y: this.y,
            vx,
            vy,
            radius: 4
        });
    }

    fireTriple() {
        const baseAngle = -Math.PI / 2;
        const angles = [
            baseAngle - Math.PI / 6,
            baseAngle,
            baseAngle + Math.PI / 6
        ];

        for (const angle of angles) {
            const vx = Math.cos(angle) * PLAYER_CONFIG.bulletSpeed;
            const vy = Math.sin(angle) * PLAYER_CONFIG.bulletSpeed;
            this.bullets.push({
                x: this.x,
                y: this.y,
                vx,
                vy,
                radius: 3
            });
        }
    }

    fireRocket() {
        const largest = window.asteroidManager?.getLargestAsteroid();
        if (!largest) return null;

        return {
            x: this.x,
            y: this.y,
            target: largest,
speed: 400,
            damage: 200,
            radius: 8
        };
    }

    updateBullets(dt) {
        for (let i = this.bullets.length - 1; i >= 0; i--) {
            const b = this.bullets[i];
            b.x += b.vx * dt;
            b.y += b.vy * dt;

            if (b.y < -20 || b.y > window.innerHeight + 20 ||
                b.x < -20 || b.x > window.innerWidth + 20) {
                this.bullets.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);

        if (window.powerUpManager?.hasActive('shield')) {
            ctx.beginPath();
            ctx.arc(0, 0, this.radius + 10, 0, Math.PI * 2);
            ctx.strokeStyle = '#34d399';
            ctx.lineWidth = 3;
            ctx.stroke();
            ctx.fillStyle = 'rgba(52, 211, 153, 0.2)';
            ctx.fill();
        }

        ctx.strokeStyle = '#22d3ee';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, -this.radius);
        ctx.lineTo(-this.radius * 0.8, this.radius * 0.6);
        ctx.lineTo(this.radius * 0.8, this.radius * 0.6);
        ctx.closePath();
        ctx.stroke();

        ctx.restore();

        ctx.fillStyle = '#22d3ee';
        for (const b of this.bullets) {
            ctx.beginPath();
            ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    }

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.bullets = [];
        this.aimAngle = -Math.PI / 2;
    }
}

window.PLAYER_CONFIG = PLAYER_CONFIG;
window.Player = Player;