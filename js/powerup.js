"use strict";

const POWERUP_TYPES = {
    TRIPLE: { id: 'triple', name: 'Triple', duration: 8000, color: '#22d3ee', icon: '⚡' },
    ROCKET: { id: 'rocket', name: 'Rocket', duration: 0, color: '#f59e0b', icon: '🚀' },
    SHIELD: { id: 'shield', name: 'Shield', duration: 7000, color: '#34d399', icon: '🛡' },
    FREEZE: { id: 'freeze', name: 'Freeze', duration: 7000, color: '#a78bfa', icon: '❄' },
    LIFE: { id: 'life', name: 'Life', duration: 0, color: '#ef4444', icon: '❤' }
};

const POWERUP_SPAWN_SCORE = 50;
const POWERUP_LIFE_SCORE = 150;
const POWERUP_LIFE_CHANCE = 0.12;
const POWERUP_REGULAR_CHANCE = 0.25;

const POWERUP_HP = 7;

class PowerUp {
    constructor(x, y, type) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.radius = 20;
        this.active = true;
        this.speed = 60;
        this.angle = Math.random() * Math.PI * 0.5 + Math.PI * 0.25;
        this.horizontalSpeed = (Math.random() > 0.5 ? 1 : -1) * 30;
        this.hp = POWERUP_HP;
    }

    update(dt, frozen) {
        const speedMod = frozen ? 0.5 : 1;
        this.y += Math.sin(this.angle) * this.speed * speedMod * dt;
        this.x += this.horizontalSpeed * speedMod * dt;
    }

    draw(ctx) {
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

class PowerUpManager {
    constructor() {
        this.powerups = [];
        this.activePowerUps = {};
        this.lastSpawnScore = 0;
    }

    update(dt, frozen) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            this.powerups[i].update(dt, frozen);
            if (this.powerups[i].y > window.innerHeight + 50) {
                this.powerups.splice(i, 1);
            }
        }
    }

    draw(ctx) {
        for (const p of this.powerups) {
            p.draw(ctx);
        }
    }

    checkCollision(x, y, radius) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            const dx = x - p.x;
            const dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < radius + p.radius) {
                this.powerups.splice(i, 1);
                return p.type;
            }
        }
        return null;
    }

    trySpawnPowerUp(score) {
        const scoreThreshold = Math.floor(score / POWERUP_SPAWN_SCORE);
        const lastThreshold = Math.floor(this.lastSpawnScore / POWERUP_SPAWN_SCORE);

        if (scoreThreshold > lastThreshold) {
            this.lastSpawnScore = score;

            if (score >= POWERUP_LIFE_SCORE && !this.activePowerUps.life) {
                if (Math.random() < POWERUP_LIFE_CHANCE) {
                    this.spawn(POWERUP_TYPES.LIFE);
                    return;
                }
                this.spawnRandom();
            } else {
                if (Math.random() < POWERUP_REGULAR_CHANCE) {
                    this.spawnRandom();
                }
            }
        }
    }

    spawnRandom() {
        const types = [POWERUP_TYPES.TRIPLE, POWERUP_TYPES.ROCKET, POWERUP_TYPES.SHIELD, POWERUP_TYPES.FREEZE];
        const type = types[Math.floor(Math.random() * types.length)];
        this.spawn(type);
    }

    spawn(type) {
        const side = Math.random() > 0.5 ? 0 : 1;
        const x = side === 0 ? 50 : window.innerWidth - 50;
        const y = -30;
        const powerup = new PowerUp(x, y, type);
        this.powerups.push(powerup);
    }

    activate(type) {
        if (type.id === 'life') {
            this.activePowerUps.life = true;
            return;
        }

        this.activePowerUps[type.id] = {
            type: type,
            remaining: type.duration,
            startTime: Date.now(),
            maxDuration: type.duration
        };
    }

    activateByShooting(bullets) {
        for (let i = this.powerups.length - 1; i >= 0; i--) {
            const p = this.powerups[i];
            for (let j = bullets.length - 1; j >= 0; j--) {
                const b = bullets[j];
                const dx = b.x - p.x;
                const dy = b.y - p.y;
                if (Math.sqrt(dx * dx + dy * dy) < b.radius + p.radius) {
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

    updateActive(dt) {
        for (const key in this.activePowerUps) {
            if (key === 'life') continue;
            const pu = this.activePowerUps[key];
            pu.remaining -= dt * 1000;
            if (pu.remaining <= 0) {
                delete this.activePowerUps[key];
            }
        }
    }

    hasActive(typeId) {
        return typeId in this.activePowerUps;
    }

    getRemainingTime(typeId) {
        if (typeId in this.activePowerUps) {
            return Math.max(0, this.activePowerUps[typeId].remaining);
        }
        return 0;
    }

    clear() {
        this.powerups = [];
        this.activePowerUps = {};
        this.lastSpawnScore = 0;
    }
}

window.POWERUP_TYPES = POWERUP_TYPES;
window.PowerUp = PowerUp;
window.PowerUpManager = PowerUpManager;