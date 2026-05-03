"use strict";

const PLAYER_DESIGNS = {
    triangle: { id: 'triangle', name: 'Triangle', color: '#22d3ee' },
    diamond:  { id: 'diamond',  name: 'Diamond',  color: '#e879f9' },
    wing:     { id: 'wing',     name: 'Wing',     color: '#a3e635' },
    hexagon:  { id: 'hexagon',  name: 'Hexagon',  color: '#38bdf8' }
};

function drawTriangle(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.8, r * 0.6);
    ctx.lineTo(r * 0.8, r * 0.6);
    ctx.closePath();
    ctx.stroke();
}

function drawDiamond(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.7, 0);
    ctx.lineTo(0, r * 0.8);
    ctx.lineTo(r * 0.7, 0);
    ctx.closePath();
    ctx.stroke();
}

function drawWing(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r);
    ctx.lineTo(-r * 0.9, r * 0.5);
    ctx.lineTo(-r * 0.5, r * 0.3);
    ctx.lineTo(0, r * 0.5);
    ctx.lineTo(r * 0.5, r * 0.3);
    ctx.lineTo(r * 0.9, r * 0.5);
    ctx.closePath();
    ctx.stroke();
}

function drawHexagon(ctx, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 2;
        const x = Math.cos(angle) * r;
        const y = Math.sin(angle) * r;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
}

PLAYER_DESIGNS.triangle.draw = drawTriangle;
PLAYER_DESIGNS.diamond.draw = drawDiamond;
PLAYER_DESIGNS.wing.draw = drawWing;
PLAYER_DESIGNS.hexagon.draw = drawHexagon;

const PLAYER_CONFIG = {
    speed: 350,
    radius: 18,
    fireRate: 33,
    bulletSpeed: 500,
    bulletDamage: 1
};

const BULLET_STYLES = {
    glow: { id: 'glow', name: 'Glow' },
    elongated: { id: 'elongated', name: 'Elongated' },
    dual: { id: 'dual', name: 'Dual' }
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
        this.designId = 'triangle';
        this.bulletStyle = 'dual';
    }

    setDesign(id) {
        if (PLAYER_DESIGNS[id]) {
            this.designId = id;
        }
    }

    setBulletStyle(id) {
        if (BULLET_STYLES[id]) {
            this.bulletStyle = id;
        }
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
            radius: 8,
            history: [{ x: this.x, y: this.y }]
        });
    }

    fireTriple() {
        const baseAngle = -Math.PI / 2;
        const angles = [
            baseAngle - Math.PI / 15,
            baseAngle,
            baseAngle + Math.PI / 15
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
                history: [{ x: this.x, y: this.y }]
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
            damage: largest.hp,
            radius: 8
        };
    }

    updateBullets(dt) {
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

        const design = PLAYER_DESIGNS[this.designId] || PLAYER_DESIGNS.triangle;
        ctx.strokeStyle = design.color;
        ctx.lineWidth = 2;
        design.draw(ctx, this.radius);

        ctx.restore();

        for (const b of this.bullets) {
            this.drawBullet(ctx, b, design.color);
        }
    }

    drawBullet(ctx, b, color) {
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

    reset(x, y) {
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.bullets = [];
        this.aimAngle = -Math.PI / 2;
    }
}

window.PLAYER_CONFIG = PLAYER_CONFIG;
window.PLAYER_DESIGNS = PLAYER_DESIGNS;
window.BULLET_STYLES = BULLET_STYLES;
window.Player = Player;