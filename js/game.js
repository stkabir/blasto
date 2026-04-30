"use strict";

const GAME_CONFIG = {
    targetFPS: 60,
    stepMs: 1000 / 60
};

class Game {
    constructor() {
        this.canvas = document.getElementById('game');
        this.ctx = this.canvas.getContext('2d');
        this.scoreEl = document.getElementById('score');
        this.highEl = document.getElementById('high');
        this.powerupIndicator = document.getElementById('powerup-indicator');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.pauseScreen = document.getElementById('pause-screen');
        this.instructionsScreen = document.getElementById('instructions-screen');
        this.instructionsBackBtn = document.getElementById('instructions-back-btn');
        this.howToPlayBtn = document.getElementById('how-to-play-btn');
        this.playerInfo = document.getElementById('player-info');
        this.playerNameDisplay = document.getElementById('player-name-display');
        this.playerNameInput = document.getElementById('player-name-input');
        this.finalScoreEl = document.getElementById('final-score');

        this.playerName = localStorage.getItem('blasto_playerName') || 'Player 1';
        this.playerNameDisplay.textContent = this.playerName;
        this.playerNameInput.value = this.playerName;

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.keys = { touchX: null, touchY: null };
        this.setupInput();

        this.state = 'start';
        this.score = 0;
        this.high = parseInt(localStorage.getItem('blasto_high') || '0');

        this.player = null;
        this.asteroidManager = null;
        this.bossManager = null;
        this.powerUpManager = null;
        this.rockets = [];

        this.lastTime = 0;
        this.acc = 0;
        this.lastBossSpawn = 0;

        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupInput() {
        const handleStart = (x, y) => {
            this.keys.touchX = x;
            this.keys.touchY = y;
        };

        const handleMove = (x, y) => {
            this.keys.touchX = x;
            this.keys.touchY = y;
        };

        const handleEnd = () => {
            this.keys.touchX = null;
            this.keys.touchY = null;
        };

        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleStart(touch.clientX, touch.clientY);
            if (this.state === 'start') this.startGame();
            if (this.state === 'gameover') this.restart();
        }, { passive: false });

        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            handleMove(touch.clientX, touch.clientY);
        }, { passive: false });

        this.canvas.addEventListener('touchend', () => handleEnd());

        this.canvas.addEventListener('mousedown', (e) => {
            handleStart(e.clientX, e.clientY);
            if (this.state === 'start') this.startGame();
            if (this.state === 'gameover') this.restart();
        });

        this.startScreen.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            if (this.state === 'start') this.startGame();
        });

        this.startScreen.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            e.preventDefault();
            if (this.state === 'start') this.startGame();
        }, { passive: false });

        this.gameOverScreen.addEventListener('click', () => {
            if (this.state === 'gameover') this.restart();
        });

        this.gameOverScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'gameover') this.restart();
        }, { passive: false });

        this.playerInfo.addEventListener('click', () => {
            if (this.state === 'playing' || this.state === 'paused') {
                this.togglePause();
            }
        });

        this.playerInfo.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (this.state === 'playing' || this.state === 'paused') {
                this.togglePause();
            }
        }, { passive: false });

        this.instructionsBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideInstructions();
        });

        this.instructionsBackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideInstructions();
        }, { passive: false });

        this.pauseScreen.addEventListener('click', () => {
            if (this.state === 'paused') this.togglePause();
        });

        this.pauseScreen.addEventListener('touchstart', (e) => {
            e.preventDefault();
            if (this.state === 'paused') this.togglePause();
        }, { passive: false });

        this.howToPlayBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showInstructions();
        });

        this.howToPlayBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showInstructions();
        }, { passive: false });

        this.canvas.addEventListener('mousemove', (e) => {
            if (e.buttons === 1) handleMove(e.clientX, e.clientY);
        });

        this.canvas.addEventListener('mouseup', () => handleEnd());
        this.canvas.addEventListener('mouseleave', () => handleEnd());

        window.addEventListener('keydown', (e) => {
            if (e.key === 'p' || e.key === 'P' || e.key === 'Escape') {
                if (this.state === 'playing' || this.state === 'paused') {
                    this.togglePause();
                }
            }
        });
    }

    togglePause() {
        if (this.state === 'playing') {
            this.state = 'paused';
            this.pauseScreen.classList.remove('hidden');
            this.playerInfo.classList.add('paused');
        } else if (this.state === 'paused') {
            this.state = 'playing';
            this.pauseScreen.classList.add('hidden');
            this.playerInfo.classList.remove('paused');
        }
    }

    showInstructions() {
        this.instructionsScreen.classList.remove('hidden');
    }

    hideInstructions() {
        this.instructionsScreen.classList.add('hidden');
    }

    init() {
        this.highEl.textContent = this.high;
        requestAnimationFrame((t) => this.loop(t));
    }

    startGame() {
        this.playerName = this.playerNameInput.value.trim() || 'Player 1';
        localStorage.setItem('blasto_playerName', this.playerName);
        this.playerNameDisplay.textContent = this.playerName;

        this.state = 'playing';
        this.score = 0;
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');

        this.player = new Player(this.canvas.width / 2, this.canvas.height - 150);
        this.asteroidManager = new AsteroidManager();
        this.bossManager = new BossManager();
        this.powerUpManager = new PowerUpManager();
        this.rockets = [];

        window.game = this;
        window.gameScore = 0;
        window.player = this.player;
        window.asteroidManager = this.asteroidManager;
        window.powerUpManager = this.powerUpManager;

        this.asteroidManager.spawnInitial();

        this.updateHUD();
    }

    restart() {
        this.startGame();
    }

    update(dt) {
        if (this.state !== 'playing') return;

        const frozen = this.powerUpManager.hasActive('freeze');

        this.player.update(dt, this.keys, frozen);
        this.asteroidManager.update(dt, frozen, this.score);
        this.bossManager.update(dt);
        this.powerUpManager.update(dt, frozen);
        this.powerUpManager.updateActive(dt);
        this.asteroidManager.trySpawn(this.score);

        this.updateRockets(dt, frozen);
        this.checkCollisions();

        this.powerUpManager.trySpawnPowerUp(this.score);
        this.bossManager.trySpawn(this.score);
    }

    updateRockets(dt, frozen) {
        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            if (!r.target || !r.target.hp || r.target.hp <= 0) {
                this.rockets.splice(i, 1);
                continue;
            }

            const dx = r.target.x - r.x;
            const dy = r.target.y - r.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < r.target.radius) {
                r.target.hp -= r.damage;
                this.rockets.splice(i, 1);
                continue;
            }

            const speedMod = frozen ? 0.5 : 1;
            const speed = r.speed * speedMod;
            r.x += (dx / dist) * speed * dt;
            r.y += (dy / dist) * speed * dt;

            if (r.y > this.canvas.height + 20) {
                this.rockets.splice(i, 1);
            }
        }
    }

    checkCollisions() {
        const collision = this.asteroidManager.checkBulletCollision(this.player.bullets);
        if (collision) {
            const { asteroid, index } = collision;
            const destroyed = asteroid.hit(PLAYER_CONFIG.bulletDamage);

            if (destroyed) {
                this.score += asteroid.type.points;
                const children = asteroid.split();
                this.asteroidManager.remove(index);
                for (const child of children) {
                    this.asteroidManager.asteroids.push(child);
                }
            }

            this.updateHUD();
        }

        const bossHit = this.bossManager.checkBulletCollision(this.player.bullets);
        if (bossHit) {
            const destroyed = this.bossManager.boss.hit(PLAYER_CONFIG.bulletDamage);
            if (destroyed) {
                this.score += BOSS_CONFIG.pointsReward;
                this.bossManager.boss = null;
                this.updateHUD();
            }
        }

        const powerupType = this.powerUpManager.activateByShooting(this.player.bullets);
        if (powerupType) {
            if (powerupType.id === 'rocket') {
                const rocket = this.player.fireRocket();
                if (rocket) this.rockets.push(rocket);
            } else {
                this.powerUpManager.activate(powerupType);
            }
            this.updatePowerUpIndicator();
        }

        for (let i = this.rockets.length - 1; i >= 0; i--) {
            const r = this.rockets[i];
            if (!r.target) {
                this.rockets.splice(i, 1);
                continue;
            }
            const dx = r.x - r.target.x;
            const dy = r.y - r.target.y;
            if (Math.sqrt(dx * dx + dy * dy) < r.target.radius) {
                const destroyed = r.target.hp <= 0;
                r.target.hp -= r.damage;
                if (destroyed) {
                    this.score += r.target.type.points;
                    const children = r.target.split();
                    const idx = this.asteroidManager.asteroids.indexOf(r.target);
                    if (idx > -1) this.asteroidManager.remove(idx);
                    for (const child of children) {
                        this.asteroidManager.asteroids.push(child);
                    }
                }
                this.rockets.splice(i, 1);
                this.updateHUD();
            }
        }

        for (const asteroid of this.asteroidManager.asteroids) {
            const dx = this.player.x - asteroid.x;
            const dy = this.player.y - asteroid.y;
            if (Math.sqrt(dx * dx + dy * dy) < this.player.radius + asteroid.radius) {
                if (this.powerUpManager.hasActive('shield')) {
                    continue;
                }
                if (this.powerUpManager.hasActive('life')) {
                    delete this.powerUpManager.activePowerUps.life;
                    return;
                }
                this.gameOver();
                return;
            }
        }

        if (this.bossManager.checkPlayerCollision(this.player)) {
            if (this.powerUpManager.hasActive('shield')) {
                return;
            }
            if (this.powerUpManager.hasActive('life')) {
                delete this.powerUpManager.activePowerUps.life;
                return;
            }
            this.gameOver();
        }

        const powerup = this.powerUpManager.checkCollision(this.player.x, this.player.y, this.player.radius);
        if (powerup) {
            this.powerUpManager.activate(powerup);
            if (powerup.id === 'rocket') {
                const rocket = this.player.fireRocket();
                if (rocket) this.rockets.push(rocket);
            }
            this.updatePowerUpIndicator();
        }
    }

    draw() {
        this.ctx.fillStyle = '#0b1017';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();

        if (this.state === 'playing') {
            this.powerUpManager.draw(this.ctx);
            this.asteroidManager.draw(this.ctx);
            this.bossManager.draw(this.ctx);
            this.player.draw(this.ctx);
            this.drawRockets();
        }
    }

    drawGrid() {
        this.ctx.strokeStyle = '#0f1824';
        this.ctx.lineWidth = 1;
        const gridSize = 36;

        for (let x = 0; x <= this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x + 0.5, 0);
            this.ctx.lineTo(x + 0.5, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = 0; y <= this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y + 0.5);
            this.ctx.lineTo(this.canvas.width, y + 0.5);
            this.ctx.stroke();
        }
    }

    drawRockets() {
        this.ctx.fillStyle = '#f59e0b';
        for (const r of this.rockets) {
            this.ctx.beginPath();
            this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
            this.ctx.fill();
        }
    }

    gameOver() {
        this.state = 'gameover';
        if (this.score > this.high) {
            this.high = this.score;
            localStorage.setItem('blasto_high', this.high.toString());
        }
        document.getElementById('final-score-name').textContent = this.playerName;
        this.finalScoreEl.textContent = `${this.score}`;
        this.gameOverScreen.style.display = '';
        this.gameOverScreen.classList.remove('hidden');
        this.highEl.textContent = this.high;
        this.playerInfo.classList.remove('paused');
    }

    updateHUD() {
        this.scoreEl.textContent = this.score;
        window.gameScore = this.score;
    }

updatePowerUpIndicator() {
        this.powerupIndicator.innerHTML = '';

        const activeCount = Object.keys(this.powerUpManager.activePowerUps).filter(k => k !== 'life').length;
        if (activeCount === 0) return;

        for (const [id, pu] of Object.entries(this.powerUpManager.activePowerUps)) {
            if (id === 'life') continue;
            if (pu.remaining <= 0) continue;

            const progress = pu.remaining / pu.maxDuration;
            const div = document.createElement('div');
            div.className = `powerup-icon ${id}`;
            div.style.setProperty('--progress', progress);

            const iconSpan = document.createElement('span');
            iconSpan.className = 'powerup-icon-inner';
            iconSpan.textContent = pu.type.icon;
            div.appendChild(iconSpan);

            this.powerupIndicator.appendChild(div);
        }
    }

    loop(timestamp) {
        const dt = (timestamp - this.lastTime) / 1000;
        this.lastTime = timestamp;

        this.acc += dt * 1000;
        while (this.acc >= GAME_CONFIG.stepMs) {
            this.update(GAME_CONFIG.stepMs / 1000);
            this.acc -= GAME_CONFIG.stepMs;
        }

        this.draw();
        requestAnimationFrame((t) => this.loop(t));
    }
}

window.Game = Game;
window.addEventListener('load', () => {
    window.gameInstance = new Game();
});