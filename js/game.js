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
        this.customizeScreen = document.getElementById('customize-screen');
        this.customizeBackBtn = document.getElementById('customize-back-btn');
        this.customizeDesignList = document.getElementById('customize-design-list');
        this.playerInfo = document.getElementById('player-info');
        this.playerNameDisplay = document.getElementById('player-name-display');
        this.playerNameInput = document.getElementById('player-name-input');
        this.finalScoreEl = document.getElementById('final-score');
        this.leaderboardScreen = document.getElementById('leaderboard-screen');
        this.leaderboardBtn = document.getElementById('leaderboard-btn');
        this.leaderboardBackBtn = document.getElementById('leaderboard-back-btn');
        this.lbLocalList = document.getElementById('lb-local-list');
        this.lbGlobalList = document.getElementById('lb-global-list');
        this.gameoverLocalLb = document.getElementById('gameover-local-lb');
        this.gameoverGlobalLb = document.getElementById('gameover-global-lb');
        this.gameoverNameInput = document.getElementById('gameover-name-input');
        this.gameoverBackBtn = document.getElementById('gameover-back-btn');
        this.hud = document.getElementById('hud');

        this.playerName = localStorage.getItem('blasto_playerName') || 'Player 1';
        this.playerNameDisplay.textContent = this.playerName;
        this.playerNameInput.value = this.playerName;

        this.playerDesign = localStorage.getItem('blasto_playerDesign') || 'triangle';
        this.bulletStyle = localStorage.getItem('blasto_bulletStyle') || 'dual';

        const savedColor = localStorage.getItem('blasto_playerColor');
        this.playerColor = savedColor || PLAYER_DESIGNS[this.playerDesign].color;

        this.SHIP_COLORS = ['#22d3ee', '#e879f9', '#a3e635', '#38bdf8'];

        this.resize();
        window.addEventListener('resize', () => this.resize());

        this.keys = { touchX: null, touchY: null, left: false, right: false };
        this.setupInput();

        this.state = 'start';
        this.score = 0;
        this.high = parseInt(localStorage.getItem('blasto_high') || '0');

        this.player = null;
        this.asteroidManager = null;
        this.bossManager = null;
        this.powerUpManager = null;
        this.rockets = [];
        this.explosions = [];
        this.powerUpIcons = {};

        this.lastTime = 0;
        this.acc = 0;
        this.lastBossSpawn = 0;

        this.starfield = this.createStarfield(100);
        this.shakeIntensity = 0;
        this.shakeTimer = 0;

        this.flashAlpha = 0;

        this.playerTrail = [];
        this.maxTrailParticles = 30;

        this.floatingTexts = [];
        this.announcements = [];
        this.comboCount = 0;
        this.lastHitTime = 0;

        this.init();
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    createStarfield(count) {
        const stars = [];
        for (let i = 0; i < count; i++) {
            stars.push({
                x: Math.random() * window.innerWidth,
                y: Math.random() * window.innerHeight,
                speed: 15 + Math.random() * 45,
                size: 0.5 + Math.random() * 1.5,
                alpha: 0.3 + Math.random() * 0.7
            });
        }
        return stars;
    }

    updateStarfield(dt) {
        for (const star of this.starfield) {
            star.x -= star.speed * dt;
            if (star.x < -5) {
                star.x = window.innerWidth + 5;
                star.y = Math.random() * window.innerHeight;
            }
        }
    }

    drawStarfield() {
        this.ctx.fillStyle = '#ffffff';
        for (const star of this.starfield) {
            this.ctx.globalAlpha = star.alpha;
            this.ctx.beginPath();
            this.ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    triggerShake(intensity, duration) {
        this.shakeIntensity = Math.max(this.shakeIntensity, intensity);
        this.shakeTimer = Math.max(this.shakeTimer, duration);
    }

    updateShake(dt) {
        if (this.shakeTimer > 0) {
            this.shakeTimer -= dt * 1000;
            if (this.shakeTimer <= 0) {
                this.shakeIntensity = 0;
            }
        }
        if (this.shakeIntensity > 0) {
            this.shakeIntensity *= 0.92;
            if (this.shakeIntensity < 0.5) this.shakeIntensity = 0;
        }
    }

    triggerFlash(alpha = 0.3) {
        this.flashAlpha = alpha;
    }

    updateFlash(dt) {
        if (this.flashAlpha > 0) {
            this.flashAlpha -= dt * 2.5;
            if (this.flashAlpha < 0) this.flashAlpha = 0;
        }
    }

    addTrailParticle() {
        if (!this.player) return;
        if (this.playerTrail.length >= this.maxTrailParticles) {
            this.playerTrail.shift();
        }
        const design = PLAYER_DESIGNS[this.player.designId] || PLAYER_DESIGNS.triangle;
        this.playerTrail.push({
            x: this.player.x + (Math.random() - 0.5) * 10,
            y: this.player.y + this.player.radius * 0.5,
            vx: (Math.random() - 0.5) * 20,
            vy: 20 + Math.random() * 30,
            alpha: 0.8,
            size: 2 + Math.random() * 2,
            color: this.player.color
        });
    }

    updateTrail(dt) {
        for (let i = this.playerTrail.length - 1; i >= 0; i--) {
            const p = this.playerTrail[i];
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            p.alpha -= dt * 2.5;
            if (p.alpha <= 0) {
                this.playerTrail.splice(i, 1);
            }
        }
    }

    drawTrail() {
        for (const p of this.playerTrail) {
            this.ctx.globalAlpha = p.alpha;
            this.ctx.fillStyle = p.color;
            this.ctx.beginPath();
            this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            this.ctx.fill();
        }
        this.ctx.globalAlpha = 1;
    }

    addFloatingText(x, y, text) {
        this.floatingTexts.push({
            x,
            y,
            text,
            alpha: 1,
            vy: -60,
            life: 600
        });
    }

    updateFloatingTexts(dt) {
        for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
            const ft = this.floatingTexts[i];
            ft.y += ft.vy * dt;
            ft.life -= dt * 1000;
            ft.alpha = Math.max(0, ft.life / 600);
            if (ft.life <= 0) {
                this.floatingTexts.splice(i, 1);
            }
        }
    }

    drawFloatingTexts() {
        this.ctx.font = 'bold 18px system-ui';
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        for (const ft of this.floatingTexts) {
            this.ctx.globalAlpha = ft.alpha;
            this.ctx.strokeStyle = '#000000';
            this.ctx.lineWidth = 3;
            this.ctx.strokeText(ft.text, ft.x, ft.y);
            this.ctx.fillStyle = '#ffffff';
            this.ctx.fillText(ft.text, ft.x, ft.y);
        }
        this.ctx.globalAlpha = 1;
    }

    announce(text, options = {}) {
        const {
            color = '#ffffff',
            fontSize = 64,
            duration = 800,
            y = this.canvas.height * 0.35,
            strokeColor = '#000000',
            strokeWidth = 6
        } = options;

        this.announcements = this.announcements || [];
        const id = Date.now() + Math.random();
        const ann = {
            id,
            text,
            x: this.canvas.width / 2,
            y,
            color,
            fontSize,
            duration,
            elapsed: 0,
            strokeColor,
            strokeWidth,
            scale: 2.5,
            alpha: 0
        };
        this.announcements.push(ann);
    }

    updateAnnouncements(dt) {
        if (!this.announcements) return;
        for (let i = this.announcements.length - 1; i >= 0; i--) {
            const a = this.announcements[i];
            a.elapsed += dt * 1000;

            const phase = a.elapsed / a.duration;
            if (phase < 0.15) {
                a.alpha = phase / 0.15;
                a.scale = 2.5 - (1.5 * phase / 0.15);
            } else if (phase < 0.7) {
                a.alpha = 1;
                a.scale = 1;
            } else {
                a.alpha = 1 - ((phase - 0.7) / 0.3);
                a.scale = 1 - ((phase - 0.7) / 0.3) * 0.2;
            }

            if (a.elapsed >= a.duration) {
                this.announcements.splice(i, 1);
            }
        }
    }

    drawAnnouncements() {
        if (!this.announcements) return;
        for (const a of this.announcements) {
            this.ctx.save();
            this.ctx.globalAlpha = a.alpha;
            this.ctx.translate(a.x, a.y);
            this.ctx.scale(a.scale, a.scale);
            this.ctx.font = `bold ${a.fontSize}px system-ui`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.strokeStyle = a.strokeColor;
            this.ctx.lineWidth = a.strokeWidth;
            this.ctx.strokeText(a.text, 0, 0);
            this.ctx.fillStyle = a.color;
            this.ctx.fillText(a.text, 0, 0);
            this.ctx.restore();
        }
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
            if (this.state === 'start' && !e.target.closest('button')) this.startGame();
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
            if (this.state === 'start' && !e.target.closest('button')) this.startGame();
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

        this.gameOverScreen.addEventListener('click', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
            if (this.state === 'gameover') this.restart();
        });

        this.gameOverScreen.addEventListener('touchstart', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
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

        this.gameoverBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.backToMenu();
        });

        this.gameoverBackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.backToMenu();
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

        this.leaderboardBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showLeaderboard();
        });

        this.leaderboardBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showLeaderboard();
        }, { passive: false });

        this.leaderboardBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideLeaderboard();
        });

        this.leaderboardBackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideLeaderboard();
        }, { passive: false });

        this.leaderboardScreen.querySelectorAll('.lb-tab').forEach((tab) => {
            tab.addEventListener('click', (e) => {
                e.stopPropagation();
                const target = tab.dataset.tab;
                this.leaderboardScreen.querySelectorAll('.lb-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                document.getElementById('lb-local-tab').classList.toggle('hidden', target !== 'local');
                document.getElementById('lb-global-tab').classList.toggle('hidden', target !== 'global');
            });
        });

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
            if (e.key === 'ArrowLeft') this.keys.left = true;
            if (e.key === 'ArrowRight') this.keys.right = true;
        });

        window.addEventListener('keyup', (e) => {
            if (e.key === 'ArrowLeft') this.keys.left = false;
            if (e.key === 'ArrowRight') this.keys.right = false;
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
        this.state = 'instructions';
        this.startScreen.classList.add('hidden');
        this.instructionsScreen.classList.remove('hidden');
    }

    hideInstructions() {
        this.instructionsScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.state = 'start';
    }

    showCustomize() {
        this.state = 'customize';
        this.startScreen.classList.add('hidden');
        this.customizeScreen.classList.remove('hidden');
        this.createCustomizeList();
    }

    hideCustomize() {
        this.customizeScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.state = 'start';
    }

    showLeaderboard() {
        this.state = 'leaderboard';
        this.startScreen.classList.add('hidden');
        this.leaderboardScreen.classList.remove('hidden');
        this.renderLocalLeaderboard(this.lbLocalList);
        this.renderGlobalLeaderboard(this.lbGlobalList);
        const localTab = this.leaderboardScreen.querySelector('[data-tab="local"]');
        const globalTab = this.leaderboardScreen.querySelector('[data-tab="global"]');
        localTab.classList.add('active');
        globalTab.classList.remove('active');
        document.getElementById('lb-local-tab').classList.remove('hidden');
        document.getElementById('lb-global-tab').classList.add('hidden');
    }

    hideLeaderboard() {
        this.leaderboardScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.state = 'start';
    }

    getLocalLeaderboard() {
        try {
            return JSON.parse(localStorage.getItem('blasto_leaderboard') || '[]');
        } catch {
            return [];
        }
    }

    saveLocalScore(name, score, designId, color) {
        const lb = this.getLocalLeaderboard();
        lb.push({ name, score, designId, color, date: Date.now() });
        lb.sort((a, b) => b.score - a.score);
        const trimmed = lb.slice(0, 5);
        localStorage.setItem('blasto_leaderboard', JSON.stringify(trimmed));
        return trimmed;
    }

    async fetchGlobalLeaderboard() {
        try {
            const res = await fetch('https://api.blasto.pro/api/get-leaderboard');
            if (!res.ok) throw new Error('Failed');
            return await res.json();
        } catch {
            return null;
        }
    }

    async submitGlobalScore(name, score, designId, color) {
        try {
            await fetch('https://api.blasto.pro/api/submit-score', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, score, designId, color }),
            });
        } catch {
        }
    }

    renderLeaderboardRows(container, entries, currentName, currentScore, showShip = false) {
        container.innerHTML = '';
        if (!entries || entries.length === 0) {
            container.innerHTML = '<div class="lb-empty">Sin puntuaciones aún</div>';
            return;
        }
        entries.forEach((entry, i) => {
            const row = document.createElement('div');
            row.className = 'lb-row';
            const isCurrent = entry.name === currentName && entry.score === currentScore;
            if (isCurrent) row.classList.add('current');
            if (i === 0) row.classList.add('rank-1');
            else if (i === 1) row.classList.add('rank-2');
            else if (i === 2) row.classList.add('rank-3');
            let shipHtml = '';
            if (showShip && entry.designId) {
                const color = entry.color || '#22d3ee';
                shipHtml = `<span class="lb-ship">${this.getShipIconSVG(entry.designId, color)}</span>`;
            }
            row.innerHTML = `
                <span class="lb-rank">${i + 1}</span>
                ${shipHtml}
                <span class="lb-name">${this.escapeHtml(entry.name)}</span>
                <span class="lb-score">${entry.score}</span>
            `;
            container.appendChild(row);
        });
    }

    renderLocalLeaderboard(container, currentName, currentScore) {
        const lb = this.getLocalLeaderboard();
        this.renderLeaderboardRows(container, lb, currentName, currentScore, true);
    }

    async renderGlobalLeaderboard(container, currentName, currentScore) {
        container.innerHTML = '<div class="lb-loading">Cargando...</div>';
        const data = await this.fetchGlobalLeaderboard();
        if (!data) {
            container.innerHTML = '<div class="lb-empty">No disponible</div>';
            return;
        }
        this.renderLeaderboardRows(container, data, currentName, currentScore, true);
    }

    escapeHtml(str) {
        const d = document.createElement('div');
        d.textContent = str;
        return d.innerHTML;
    }

init() {
        this.highEl.textContent = this.high;
        this.setupDesignToggle();
        this.setupCustomizeBack();
        requestAnimationFrame(t => this.loop(t));
    }

    setupDesignToggle() {
        const toggleBtn = document.getElementById('design-toggle');
        if (!toggleBtn) return;
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCustomize();
        });
        toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCustomize();
        }, { passive: false });
    }

createDesignSelector() {
        const container = document.getElementById('design-selector');
        if (!container) return;
        container.innerHTML = '';

        const toggleBtn = document.createElement('button');
        toggleBtn.id = 'design-toggle';
        toggleBtn.className = 'menu-btn';
        toggleBtn.textContent = 'Personalizar';
        container.appendChild(toggleBtn);

        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.showCustomize();
        });
        toggleBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.showCustomize();
        }, { passive: false });
    }

    createCustomizeList() {
        const list = this.customizeDesignList;
        if (!list) return;
        list.innerHTML = '';

        const colorSeparator = document.createElement('div');
        colorSeparator.className = 'customize-section-separator';
        colorSeparator.textContent = 'COLOR';
        list.appendChild(colorSeparator);

        const colorGrid = document.createElement('div');
        colorGrid.className = 'customize-grid';
        this.SHIP_COLORS.forEach(color => {
            const item = document.createElement('div');
            item.className = 'customize-color-item';
            item.dataset.color = color;

            const preview = document.createElement('div');
            preview.className = 'customize-color-preview';
            preview.style.background = color;
            preview.style.boxShadow = `0 0 15px ${color}`;
            item.appendChild(preview);

            if (color === this.playerColor) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => this.selectColor(color));
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectColor(color);
            }, { passive: false });
            colorGrid.appendChild(item);
        });
        list.appendChild(colorGrid);

        const shipsSeparator = document.createElement('div');
        shipsSeparator.className = 'customize-section-separator';
        shipsSeparator.textContent = 'NAVES';
        list.appendChild(shipsSeparator);

        const shipsGrid = document.createElement('div');
        shipsGrid.className = 'customize-grid';
        const designs = Object.values(window.PLAYER_DESIGNS);
        designs.forEach(design => {
            const item = document.createElement('div');
            item.className = 'customize-design-item';
            item.dataset.id = design.id;

            const preview = document.createElement('div');
            preview.className = 'customize-design-preview';
            preview.innerHTML = this.getDesignSVG(design, this.playerColor);
            item.appendChild(preview);

            if (design.id === this.playerDesign) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => this.selectDesign(design.id));
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectDesign(design.id);
            }, { passive: false });
            shipsGrid.appendChild(item);
        });
        list.appendChild(shipsGrid);

        const separator = document.createElement('div');
        separator.className = 'customize-section-separator';
        separator.textContent = 'DISPAROS';
        list.appendChild(separator);

        const bulletsGrid = document.createElement('div');
        bulletsGrid.className = 'customize-grid';
        const bulletStyles = Object.values(window.BULLET_STYLES);
        bulletStyles.forEach(style => {
            const item = document.createElement('div');
            item.className = 'customize-bullet-item';
            item.dataset.id = style.id;

            const preview = document.createElement('div');
            preview.className = 'customize-bullet-preview';
            preview.innerHTML = this.getBulletStyleSVG(style.id);
            item.appendChild(preview);

            if (style.id === this.bulletStyle) {
                item.classList.add('selected');
            }

            item.addEventListener('click', () => this.selectBulletStyle(style.id));
            item.addEventListener('touchstart', (e) => {
                e.preventDefault();
                this.selectBulletStyle(style.id);
            }, { passive: false });
            bulletsGrid.appendChild(item);
        });
        list.appendChild(bulletsGrid);
    }

    getDesignSVG(design, colorOverride) {
        const color = colorOverride || design.color;
        let path = '';
        switch (design.id) {
            case 'triangle':
                path = `<polygon points="20,4 36,32 4,32" fill="none" stroke="${color}" stroke-width="2"/>`;
                break;
            case 'diamond':
                path = `<polygon points="20,2 36,20 20,38 4,20" fill="none" stroke="${color}" stroke-width="2"/>`;
                break;
            case 'wing':
                path = `<polygon points="20,2 36,30 26,24 20,32 14,24 4,30" fill="none" stroke="${color}" stroke-width="2"/>`;
                break;
            case 'hexagon':
                path = `<polygon points="20,2 35,11 35,29 20,38 5,29 5,11" fill="none" stroke="${color}" stroke-width="2"/>`;
                break;
        }
        return `<svg viewBox="0 0 40 40">${path}</svg>`;
    }

    getShipIconSVG(designId, colorOverride) {
        const design = window.PLAYER_DESIGNS[designId] || window.PLAYER_DESIGNS.triangle;
        return this.getDesignSVG(design, colorOverride);
    }

    selectDesign(id) {
        this.playerDesign = id;
        localStorage.setItem('blasto_playerDesign', id);
        const items = document.querySelectorAll('.customize-design-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.id === id);
        });
        this.updateColorPickerSelection();
        this.updateAllPreviews(this.playerColor);
    }

    selectColor(color) {
        this.playerColor = color;
        localStorage.setItem('blasto_playerColor', color);
        const items = document.querySelectorAll('.customize-color-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.color === color);
        });
        this.updateAllPreviews(color);
    }

    updateColorPickerSelection() {
        const items = document.querySelectorAll('.customize-color-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.color === this.playerColor);
        });
    }

    updateAllPreviews(color) {
        document.querySelectorAll('.customize-design-item').forEach((item, i) => {
            const designId = item.dataset.id;
            const design = window.PLAYER_DESIGNS[designId];
            if (design) {
                item.querySelector('.customize-design-preview').innerHTML = this.getDesignSVG(design, color);
            }
        });
        document.querySelectorAll('.customize-bullet-item').forEach(item => {
            const bulletId = item.dataset.id;
            item.querySelector('.customize-bullet-preview').innerHTML = this.getBulletStyleSVG(bulletId, color);
        });
    }

    getBulletStyleSVG(id, colorOverride) {
        const color = colorOverride || '#22d3ee';
        switch (id) {
            case 'glow':
                return `<svg viewBox="0 0 40 40">
                    <defs>
                        <filter id="glow-preview" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="2" result="blur"/>
                            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
                        </filter>
                    </defs>
                    <circle cx="20" cy="20" r="8" fill="${color}" filter="url(#glow-preview)"/>
                </svg>`;
            case 'elongated':
                return `<svg viewBox="0 0 40 40">
                    <line x1="20" y1="32" x2="20" y2="8" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
                    <ellipse cx="20" cy="20" rx="5" ry="8" fill="${color}"/>
                </svg>`;
            case 'dual':
            default:
                return `<svg viewBox="0 0 40 40">
                    <circle cx="20" cy="20" r="8" fill="${color}" opacity="0.3"/>
                    <circle cx="20" cy="20" r="5" fill="${color}"/>
                    <circle cx="20" cy="20" r="2" fill="white"/>
                </svg>`;
        }
    }

    selectBulletStyle(id) {
        this.bulletStyle = id;
        localStorage.setItem('blasto_bulletStyle', id);
        const items = document.querySelectorAll('.customize-bullet-item');
        items.forEach(item => {
            item.classList.toggle('selected', item.dataset.id === id);
        });
    }

    setupCustomizeBack() {
        this.customizeBackBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.hideCustomize();
        });
        this.customizeBackBtn.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            this.hideCustomize();
        }, { passive: false });
    }

    startGame() {
        const enteredName = this.playerNameInput.value.trim();
        if (!enteredName) {
            this.playerNameInput.focus();
            this.playerNameInput.style.borderBottomColor = '#ef4444';
            setTimeout(() => {
                this.playerNameInput.style.borderBottomColor = '#22d3ee';
            }, 1000);
            return;
        }
        this.playerName = enteredName;
        localStorage.setItem('blasto_playerName', this.playerName);
        this.playerNameDisplay.textContent = this.playerName;

        this.state = 'playing';
        this.score = 0;
        this.startScreen.classList.add('hidden');
        this.gameOverScreen.classList.add('hidden');
        this.hud.classList.remove('hidden');

        this.playerTrail = [];
        this.floatingTexts = [];

        this.player = new Player(this.canvas.width / 2, this.canvas.height - 150);
        this.player.setDesign(this.playerDesign);
        this.player.setColor(this.playerColor);
        this.player.setBulletStyle(this.bulletStyle);
        this.asteroidManager = new AsteroidManager();
        this.bossManager = new BossManager();
        this.bossManager.onSpawn = () => {
            this.triggerShake(10, 300);
            this.announce('¡JEFE!', { color: '#ef4444', fontSize: 80 });
        };
        this.powerUpManager = new PowerUpManager();
        this.rockets = [];
        this.explosions = [];
        this.powerUpIcons = {};

        window.game = this;
        window.gameScore = 0;
        window.player = this.player;
        window.asteroidManager = this.asteroidManager;
        window.powerUpManager = this.powerUpManager;

        this.asteroidManager.spawnInitial();

        this.canvas.style.transform = 'scale(1.25)';
        this.canvas.style.opacity = '0';
        this.canvas.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';
        this.triggerShake(5, 100);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.canvas.style.transform = 'scale(1)';
                this.canvas.style.opacity = '1';
            });
        });

        this.updateHUD();
    }

    restart() {
        const newName = this.gameoverNameInput.value.trim();
        if (newName) {
            this.playerName = newName;
            localStorage.setItem('blasto_playerName', this.playerName);
            this.playerNameDisplay.textContent = this.playerName;
            this.playerNameInput.value = this.playerName;
        }
        this.startGame();
    }

    backToMenu() {
        this.gameOverScreen.classList.add('hidden');
        this.startScreen.classList.remove('hidden');
        this.playerNameInput.value = this.playerName;
        this.state = 'start';
    }

    update(dt) {
        this.updateStarfield(dt);
        this.updateShake(dt);
        this.updateFlash(dt);
        this.updateTrail(dt);
        this.updateFloatingTexts(dt);
        this.updateAnnouncements(dt);

        if (this.state !== 'playing') return;

        const now = Date.now();
        if (now - this.lastHitTime > 1500 && this.comboCount >= 3) {
            this.comboCount = 0;
        }

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
        this.updateExplosions(dt);
        this.updatePowerUpIconStyles();

        this.addTrailParticle();
    }

    createExplosion(x, y, color) {
        const particles = [];
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            particles.push({
                x, y,
                vx: Math.cos(angle) * (80 + Math.random() * 70),
                vy: Math.sin(angle) * (100 + Math.random() * 80),
                radius: Math.random() * 8 + 4,
                life: 1,
                color
            });
        }
        this.explosions.push({ particles });
    }

    updateExplosions(dt) {
        for (let i = this.explosions.length - 1; i >= 0; i--) {
            const exp = this.explosions[i];
            let allDead = true;
            for (const p of exp.particles) {
                p.x += p.vx * dt;
                p.y += p.vy * dt;
                p.vy += 100 * dt;
                p.life -= dt * 2;
                if (p.life > 0) allDead = false;
            }
            if (allDead) this.explosions.splice(i, 1);
        }
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
            this.score += PLAYER_CONFIG.bulletDamage;

            this.lastHitTime = Date.now();
            this.comboCount++;

            if (this.comboCount === 5) {
                this.announce('¡COMBO!', { color: '#f59e0b', fontSize: 56 });
                this.triggerShake(6, 150);
            } else if (this.comboCount === 10) {
                this.announce('¡EN FUEGO!', { color: '#ef4444', fontSize: 64 });
                this.triggerShake(8, 200);
            } else if (this.comboCount === 20) {
                this.announce('¡INCREÍBLE!', { color: '#a855f7', fontSize: 72 });
                this.triggerShake(10, 250);
            }

            this.addFloatingText(asteroid.x, asteroid.y - asteroid.radius, `+${PLAYER_CONFIG.bulletDamage}`);

            if (destroyed) {
                const shakeIntensity = asteroid.type.level <= 2 ? 4 : asteroid.type.level <= 3 ? 6 : 10;
                this.triggerShake(shakeIntensity, 100);
                this.createExplosion(asteroid.x, asteroid.y, asteroid.type.color);
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
            this.score += PLAYER_CONFIG.bulletDamage;
            this.triggerFlash(0.2);
            this.addFloatingText(this.bossManager.boss.x + this.bossManager.boss.width / 2, this.bossManager.boss.y, `+${PLAYER_CONFIG.bulletDamage}`);
            if (destroyed) {
                this.triggerShake(12, 200);
                this.createExplosion(this.bossManager.boss.x + this.bossManager.boss.width / 2, this.bossManager.boss.y + this.bossManager.boss.height / 2, '#ef4444');
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
                r.target.hp -= r.damage;
                this.score += r.damage;
                if (r.target.hp <= 0) {
                    this.createExplosion(r.target.x, r.target.y, r.target.type.color);
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
        let offsetX = 0, offsetY = 0;
        if (this.shakeIntensity > 0) {
            offsetX = (Math.random() - 0.5) * this.shakeIntensity * 2;
            offsetY = (Math.random() - 0.5) * this.shakeIntensity * 2;
        }

        this.ctx.save();
        this.ctx.translate(offsetX, offsetY);

        this.ctx.fillStyle = '#0b1017';
        this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

        this.drawStarfield();
        this.drawTrail();

        if (this.state === 'playing') {
            this.powerUpManager.draw(this.ctx);
            this.asteroidManager.draw(this.ctx);
            this.bossManager.draw(this.ctx);
            this.player.draw(this.ctx);
            this.drawRockets();
            this.drawExplosions();
            this.drawFloatingTexts();
            this.drawAnnouncements();
        }

        this.ctx.restore();

        if (this.flashAlpha > 0) {
            this.ctx.fillStyle = `rgba(255, 255, 255, ${this.flashAlpha})`;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
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

    drawExplosions() {
        for (const exp of this.explosions) {
            for (const p of exp.particles) {
                this.ctx.globalAlpha = p.life;
                this.ctx.fillStyle = p.color;
                this.ctx.beginPath();
                this.ctx.arc(p.x, p.y, p.radius * p.life, 0, Math.PI * 2);
                this.ctx.fill();
            }
        }
        this.ctx.globalAlpha = 1;
    }

    gameOver() {
        this.state = 'gameover';
        this.triggerFlash(0.6);
        this.triggerShake(12, 300);

        if (this.score > this.high) {
            this.high = this.score;
            localStorage.setItem('blasto_high', this.high.toString());
        }

        this.powerUpManager.activePowerUps = {};
        for (const id in this.powerUpIcons) {
            if (this.powerUpIcons[id].parentNode) {
                this.powerUpIcons[id].parentNode.removeChild(this.powerUpIcons[id]);
            }
        }
        this.powerUpIcons = {};

        this.finalScoreEl.style.opacity = '0';
        this.finalScoreEl.style.transform = 'scale(0.8)';
        this.finalScoreEl.style.transition = 'none';

        this.gameOverScreen.style.display = '';
        this.gameOverScreen.classList.remove('hidden');
        this.gameOverScreen.style.opacity = '0';
        this.gameOverScreen.style.transform = 'scale(0.9)';
        this.gameOverScreen.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';

        this.highEl.textContent = this.high;
        this.playerInfo.classList.remove('paused');
        this.hud.classList.add('hidden');

        this.saveLocalScore(this.playerName, this.score, this.playerDesign, this.playerColor);
        this.submitGlobalScore(this.playerName, this.score, this.playerDesign, this.playerColor);
        this.gameoverNameInput.value = this.playerName;
        this.renderLocalLeaderboard(this.gameoverLocalLb, this.playerName, this.score);

        setTimeout(() => {
            this.finalScoreEl.textContent = `${this.score}`;
            this.finalScoreEl.style.opacity = '1';
            this.finalScoreEl.style.transform = 'scale(1)';
            this.finalScoreEl.style.transition = 'opacity 0.4s ease-out, transform 0.4s ease-out';
        }, 500);

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                this.gameOverScreen.style.opacity = '1';
                this.gameOverScreen.style.transform = 'scale(1)';
            });
        });
    }

    updateHUD() {
        this.scoreEl.textContent = this.score;
        window.gameScore = this.score;
    }

updatePowerUpIndicator() {
        const activeCount = Object.keys(this.powerUpManager.activePowerUps).length;
        if (activeCount === 0) return;

        for (const [id, pu] of Object.entries(this.powerUpManager.activePowerUps)) {
            if (pu.remaining <= 0 && id !== 'life') continue;

            if (!this.powerUpIcons[id]) {
                this.createPowerUpElement(id, pu);
            }
        }
    }

    createPowerUpElement(id, pu) {
        const div = document.createElement('div');
        div.className = `powerup-icon ${id} active`;
        div.style.opacity = '0';
        div.style.transition = 'none';

        const color = pu.type.color;
        const rgb = this.hexToRgb(color);

        div.style.background = `radial-gradient(circle at 30% 30%, rgba(${rgb}, 0.6), rgba(${rgb}, 0.3))`;
        div.style.border = `2px solid rgba(${rgb}, 0.9)`;
        div.style.boxShadow = `0 0 25px rgba(${rgb}, 0.8), 0 0 50px rgba(${rgb}, 0.4), inset 0 0 20px rgba(${rgb}, 0.3)`;
        div.style.textShadow = `0 0 15px rgba(${rgb}, 1)`;

        const outerRing = document.createElement('div');
        outerRing.className = 'powerup-ring';
        outerRing.style.cssText = `
            position: absolute;
            top: -4px;
            left: -4px;
            right: -4px;
            bottom: -4px;
            border: 1px solid rgba(${rgb}, 0.5);
            border-radius: 16px;
            pointer-events: none;
        `;

        const iconSpan = document.createElement('span');
        iconSpan.className = 'powerup-icon-inner';
        iconSpan.style.position = 'relative';
        iconSpan.style.zIndex = '1';
        iconSpan.style.fontSize = '20px';
        iconSpan.textContent = pu.type.icon;

        div.style.position = 'relative';
        div.style.overflow = 'visible';

        div.appendChild(outerRing);
        div.appendChild(iconSpan);

        this.powerupIndicator.appendChild(div);
        this.powerUpIcons[id] = div;

        requestAnimationFrame(() => {
            div.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
            div.style.opacity = '1';
            div.style.transform = 'scale(1)';
            setTimeout(() => {
                div.style.transform = 'scale(1)';
            }, 400);
        });
    }

    updatePowerUpIconStyles() {
        const now = Date.now();

        for (const id in this.powerUpIcons) {
            const element = this.powerUpIcons[id];
            const pu = this.powerUpManager.activePowerUps[id];

            if (!pu || (pu.remaining <= 0 && id !== 'life')) {
                element.style.opacity = '0';
                element.style.transition = 'opacity 0.3s ease-out';
                setTimeout(() => {
                    if (element.parentNode) {
                        element.parentNode.removeChild(element);
                    }
                    delete this.powerUpIcons[id];
                }, 300);
                continue;
            }

            const color = pu.type.color;

            if (id === 'life' || pu.maxDuration === 0 || pu.maxDuration === Infinity) {
                element.style.opacity = '1';
                element.style.boxShadow = `0 0 20px rgba(${this.hexToRgb(color)}, 1), inset 0 0 15px rgba(${this.hexToRgb(color)}, 0.5)`;
            } else {
                const progress = Math.max(0, pu.remaining / pu.maxDuration);
                const glowOpacity = 0.3 + (progress * 0.7);
                const bgOpacity = 0.3 + (progress * 0.5);

                if (pu.remaining <= 3000) {
                    const blink = (Math.sin(now / 200) + 1) / 2;
                    const opacity = 0.3 + (blink * 0.7);
                    element.style.opacity = opacity;
                    element.style.boxShadow = `0 0 ${15 + blink * 10}px rgba(${this.hexToRgb(color)}, ${glowOpacity}), inset 0 0 15px rgba(${this.hexToRgb(color)}, ${glowOpacity * 0.5})`;
                } else {
                    element.style.opacity = glowOpacity;
                    element.style.boxShadow = `0 0 20px rgba(${this.hexToRgb(color)}, ${glowOpacity}), inset 0 0 15px rgba(${this.hexToRgb(color)}, ${glowOpacity * 0.5})`;
                }

                element.style.background = `rgba(${this.hexToRgb(color)}, ${bgOpacity})`;
                element.style.borderColor = `rgba(${this.hexToRgb(color)}, ${progress})`;
            }
        }
    }

    hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result
            ? `${parseInt(result[1], 16)}, ${parseInt(result[2], 16)}, ${parseInt(result[3], 16)}`
            : '255, 255, 255';
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