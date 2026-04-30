"use strict";

const BOSS_CONFIG = {
    pointsToAppear: 300,
    pointsReward: 350,
    speed: 100,
    bulletSpeed: 200,
    fireInterval: 2000,
    width: 80,
    height: 60
};

class Boss {
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

    update(dt) {
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
            this.fire();
            this.lastFireTime = now;
        }
    }

    fire() {
        const player = window.game?.player;
        if (!player) return;

        const startX = this.x + this.width / 2;
        const startY = this.y + this.height;

        this.bullets.push({
            x: startX,
            y: startY,
            targetX: player.x,
            targetY: player.y,
            radius: 6
        });
    }

    draw(ctx) {
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

    hit(damage) {
        this.hp -= damage;
        if (this.hp <= 0) {
            this.active = false;
            return true;
        }
        return false;
    }

    checkPlayerCollision(player) {
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

    getCenter() {
        return {
            x: this.x + this.width / 2,
            y: this.y + this.height / 2
        };
    }
}

class BossManager {
    constructor() {
        this.boss = null;
        this.nextBossScore = BOSS_CONFIG.pointsToAppear;
    }

    update(dt) {
        if (this.boss && this.boss.active) {
            this.boss.update(dt);
        }
    }

    trySpawn(score) {
        if (this.boss && this.boss.active) return;
        if (score >= this.nextBossScore) {
            this.spawn();
            this.nextBossScore += BOSS_CONFIG.pointsToAppear;
        }
    }

    spawn() {
        this.boss = new Boss();
    }

    draw(ctx) {
        if (this.boss && this.boss.active) {
            this.boss.draw(ctx);
        }
    }

    checkBulletCollision(bullets) {
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

    checkPlayerCollision(player) {
        if (this.boss && this.boss.active) {
            return this.boss.checkPlayerCollision(player);
        }
        return false;
    }

    clear() {
        this.boss = null;
        this.nextBossScore = BOSS_CONFIG.pointsToAppear;
    }
}

window.BOSS_CONFIG = BOSS_CONFIG;
window.Boss = Boss;
window.BossManager = BossManager;