import { GAME_CONFIG, PLAYER_DESIGNS } from './core/constants.js';
import { setupInput } from './core/input.js';
import { Player } from './entities/player.js';
import { AsteroidManager } from './entities/asteroid.js';
import { BossManager } from './entities/boss.js';
import { PowerUpManager } from './entities/powerup.js';
import { createStarfield, updateStarfield, drawStarfield } from './background.js';
import {
  createEffectsState,
  addTrailParticle,
  updateTrail,
  drawTrail,
  updateExplosions,
  drawExplosions,
  updateFloatingTexts,
  drawFloatingTexts,
  updateAnnouncements,
  drawAnnouncements,
  updateShake,
  updateFlash,
  announce,
  triggerShake,
  triggerFlash,
} from './systems/effects.js';
import { checkAllCollisions, updateRockets, type ComboState } from './systems/collision.js';
import { saveLocalScore, submitGlobalScore, renderLocalLeaderboard, renderGlobalLeaderboard } from './ui/leaderboard.js';
import {
  createCustomizeList,
  selectDesign,
  selectColor,
  selectBulletStyle,
  type CustomizationState,
} from './ui/customization.js';
import { createPowerUpIcon, updatePowerUpIconStyles } from './ui/powerup-indicator.js';
import type { GameState, GameInput, Rocket, Star, ActivePowerUp } from './core/types.js';

class Game {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  scoreEl: HTMLElement;
  highEl: HTMLElement;
  powerupIndicator: HTMLElement;
  startScreen: HTMLElement;
  gameOverScreen: HTMLElement;
  pauseScreen: HTMLElement;
  instructionsScreen: HTMLElement;
  customizeScreen: HTMLElement;
  leaderboardScreen: HTMLElement;
  playerInfo: HTMLElement;
  playerNameDisplay: HTMLElement;
  playerNameInput: HTMLInputElement;
  finalScoreEl: HTMLElement;
  hud: HTMLElement;
  gameoverNameInput: HTMLInputElement;

  playerName: string;
  keys: GameInput;
  state: GameState;
  score: number;
  high: number;

  player: Player | null = null;
  asteroidManager: AsteroidManager | null = null;
  bossManager: BossManager | null = null;
  powerUpManager: PowerUpManager | null = null;
  rockets: Rocket[] = [];
  starfield: Star[] = [];

  effects = createEffectsState();
  combo: ComboState = { count: 0, lastHitTime: 0 };
  powerUpIcons: Record<string, HTMLElement> = {};

  lastTime = 0;
  acc = 0;

  customization: CustomizationState;
  bossActive: boolean = false;

  constructor() {
    this.canvas = document.getElementById('game') as HTMLCanvasElement;
    this.ctx = this.canvas.getContext('2d')!;
    this.scoreEl = document.getElementById('score')!;
    this.highEl = document.getElementById('high')!;
    this.powerupIndicator = document.getElementById('powerup-indicator')!;
    this.startScreen = document.getElementById('start-screen')!;
    this.gameOverScreen = document.getElementById('game-over-screen')!;
    this.pauseScreen = document.getElementById('pause-screen')!;
    this.instructionsScreen = document.getElementById('instructions-screen')!;
    this.customizeScreen = document.getElementById('customize-screen')!;
    this.leaderboardScreen = document.getElementById('leaderboard-screen')!;
    this.playerInfo = document.getElementById('player-info')!;
    this.playerNameDisplay = document.getElementById('player-name-display')!;
    this.playerNameInput = document.getElementById('player-name-input') as HTMLInputElement;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.hud = document.getElementById('hud')!;
    this.gameoverNameInput = document.getElementById('gameover-name-input') as HTMLInputElement;

    this.playerName = localStorage.getItem('blasto_playerName') || 'Player 1';
    this.playerNameDisplay.textContent = this.playerName;
    this.playerNameInput.value = this.playerName;

    this.customization = {
      playerDesign: localStorage.getItem('blasto_playerDesign') || 'triangle',
      playerColor: localStorage.getItem('blasto_playerColor') || PLAYER_DESIGNS.triangle.color,
      bulletStyle: localStorage.getItem('blasto_bulletStyle') || 'dual',
    };

    this.state = 'start';
    this.score = 0;
    this.high = parseInt(localStorage.getItem('blasto_high') || '0');
    this.highEl.textContent = String(this.high);

    this.starfield = createStarfield(100);

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.keys = setupInput({
      onTogglePause: () => this.togglePause(),
      onStartGame: () => this.startGame(),
      onRestart: () => this.restart(),
      onShowInstructions: () => this.showInstructions(),
      onHideInstructions: () => this.hideInstructions(),
      onShowLeaderboard: () => this.showLeaderboard(),
      onHideLeaderboard: () => this.hideLeaderboard(),
      onShowCustomize: () => this.showCustomize(),
      onHideCustomize: () => this.hideCustomize(),
      onBackToMenu: () => this.backToMenu(),
      getState: () => this.state,
    });

    requestAnimationFrame((t) => this.loop(t));
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  togglePause(): void {
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

  showInstructions(): void {
    this.state = 'instructions';
    this.startScreen.classList.add('hidden');
    this.instructionsScreen.classList.remove('hidden');
  }

  hideInstructions(): void {
    this.instructionsScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.state = 'start';
  }

  showCustomize(): void {
    this.state = 'customize';
    this.startScreen.classList.add('hidden');
    this.customizeScreen.classList.remove('hidden');
    this.renderCustomizeList();
  }

  hideCustomize(): void {
    this.customizeScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.state = 'start';
  }

  showLeaderboard(): void {
    this.state = 'leaderboard';
    this.startScreen.classList.add('hidden');
    this.leaderboardScreen.classList.remove('hidden');
    renderLocalLeaderboard(
      document.getElementById('lb-local-list')!,
      this.playerName,
      this.score,
    );
    renderGlobalLeaderboard(
      document.getElementById('lb-global-list')!,
      this.playerName,
      this.score,
    );
    const localTab = this.leaderboardScreen.querySelector('[data-tab="local"]');
    const globalTab = this.leaderboardScreen.querySelector('[data-tab="global"]');
    localTab?.classList.add('active');
    globalTab?.classList.remove('active');
    document.getElementById('lb-local-tab')!.classList.remove('hidden');
    document.getElementById('lb-global-tab')!.classList.add('hidden');
  }

  hideLeaderboard(): void {
    this.leaderboardScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.state = 'start';
  }

  backToMenu(): void {
    this.gameOverScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.playerNameInput.value = this.playerName;
    this.state = 'start';
  }

  renderCustomizeList(): void {
    createCustomizeList(
      this.customization,
      'customize-design-list',
      (id) => selectDesign(this.customization, id),
      (color) => selectColor(this.customization, color),
      (id) => selectBulletStyle(this.customization, id),
    );
  }

  startGame(): void {
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

    this.effects = createEffectsState();
    this.combo = { count: 0, lastHitTime: 0 };
    this.powerUpIcons = {};
    this.bossActive = false;

    this.player = new Player(this.canvas.width / 2, this.canvas.height - 150);
    this.player.setDesign(this.customization.playerDesign);
    this.player.setColor(this.customization.playerColor);
    this.player.setBulletStyle(this.customization.bulletStyle);

    this.asteroidManager = new AsteroidManager();
    this.asteroidManager.onWarmupComplete = () => {
      this.asteroidManager!.startWaveSystem();
    };
    this.asteroidManager.onBossWave = (wave: number) => {
      if (this.bossManager) {
        this.bossManager.spawn();
        this.bossActive = true;
        triggerShake(this.effects, 10, 300);
        announce(this.effects.announcements, this.canvas.height, this.canvas.width, '¡JEFE!', { color: '#ef4444', fontSize: 80 });
      }
    };
    this.bossManager = new BossManager();

    this.powerUpManager = new PowerUpManager();
    this.rockets = [];

    this.asteroidManager.spawnInitial();

    this.canvas.style.transform = 'scale(1.25)';
    this.canvas.style.opacity = '0';
    this.canvas.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';
    triggerShake(this.effects, 5, 100);

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.canvas.style.transform = 'scale(1)';
        this.canvas.style.opacity = '1';
      });
    });

    this.updateHUD();
  }

  restart(): void {
    const newName = this.gameoverNameInput.value.trim();
    if (newName) {
      this.playerName = newName;
      localStorage.setItem('blasto_playerName', this.playerName);
      this.playerNameDisplay.textContent = this.playerName;
      this.playerNameInput.value = this.playerName;
    }
    this.startGame();
  }

  update(dt: number): void {
    updateStarfield(this.starfield, dt);
    updateShake(this.effects, dt);
    updateFlash(this.effects, dt);
    updateTrail(this.effects, dt);
    updateFloatingTexts(this.effects.floatingTexts, dt);
    updateAnnouncements(this.effects.announcements, dt);

    if (this.state !== 'playing') return;
    if (!this.player || !this.asteroidManager || !this.bossManager || !this.powerUpManager) return;

    const frozen = this.powerUpManager.hasActive('freeze');
    const hasTriple = this.powerUpManager.hasActive('triple');

    this.player.update(dt, this.keys, frozen, hasTriple);
    this.asteroidManager.update(dt, frozen);
    this.bossManager.update(dt, this.player);
    this.powerUpManager.update(dt, frozen);
    this.powerUpManager.updateActive(dt);

    updateRockets(this.rockets, dt, frozen, this.canvas.height);

    const result = checkAllCollisions(
      this.player,
      this.asteroidManager,
      this.bossManager,
      this.powerUpManager,
      this.rockets,
      this.effects,
      this.combo,
      this.canvas,
    );

    if (result === -1) {
      this.gameOver();
      return;
    }

    if (this.bossActive && this.asteroidManager && this.bossManager && !this.bossManager.boss) {
      this.bossActive = false;
      this.asteroidManager.notifyBossDefeated();
    }

    this.score += result;
    if (result > 0) this.updateHUD();

    this.powerUpManager.trySpawnPowerUp(this.score);
    updateExplosions(this.effects.explosions, dt);
    this.updatePowerUpIndicator();
    updatePowerUpIconStyles(this.powerUpIcons, this.powerUpManager.activePowerUps, Date.now());

    addTrailParticle(this.effects, this.player);
  }

  gameOver(): void {
    this.state = 'gameover';
    triggerFlash(this.effects, 0.6);
    triggerShake(this.effects, 12, 300);

    if (this.score > this.high) {
      this.high = this.score;
      localStorage.setItem('blasto_high', String(this.high));
    }

    if (this.powerUpManager) {
      this.powerUpManager.activePowerUps = {};
    }

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

    this.highEl.textContent = String(this.high);
    this.playerInfo.classList.remove('paused');
    this.hud.classList.add('hidden');

    saveLocalScore(this.playerName, this.score, this.customization.playerDesign, this.customization.playerColor);
    submitGlobalScore(this.playerName, this.score, this.customization.playerDesign, this.customization.playerColor);
    this.gameoverNameInput.value = this.playerName;
    renderLocalLeaderboard(
      document.getElementById('gameover-local-lb')!,
      this.playerName,
      this.score,
    );

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

  updateHUD(): void {
    this.scoreEl.textContent = String(this.score);
  }

  updatePowerUpIndicator(): void {
    if (!this.powerUpManager) return;
    const activeCount = Object.keys(this.powerUpManager.activePowerUps).length;
    if (activeCount === 0) return;

    for (const [id, pu] of Object.entries(this.powerUpManager.activePowerUps)) {
      if (pu.remaining <= 0 && id !== 'life') continue;

      if (!this.powerUpIcons[id]) {
        this.powerUpIcons[id] = createPowerUpIcon(id, pu, this.powerupIndicator);
      } else {
        delete this.powerUpIcons[id].dataset.fading;
        this.powerUpIcons[id].style.opacity = '1';
      }
    }
  }

  draw(): void {
    let offsetX = 0, offsetY = 0;
    if (this.effects.shakeIntensity > 0) {
      offsetX = (Math.random() - 0.5) * this.effects.shakeIntensity * 2;
      offsetY = (Math.random() - 0.5) * this.effects.shakeIntensity * 2;
    }

    this.ctx.save();
    this.ctx.translate(offsetX, offsetY);

    this.ctx.fillStyle = '#0b1017';
    this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

    drawStarfield(this.ctx, this.starfield);
    drawTrail(this.ctx, this.effects);

    if (this.state === 'playing') {
      if (this.powerUpManager) this.powerUpManager.draw(this.ctx);
      if (this.asteroidManager) this.asteroidManager.draw(this.ctx);
      if (this.bossManager) this.bossManager.draw(this.ctx);
      if (this.player) this.player.draw(this.ctx, this.powerUpManager?.hasActive('shield') ?? false);
      this.drawRockets();
      drawExplosions(this.ctx, this.effects.explosions);
      drawFloatingTexts(this.ctx, this.effects.floatingTexts);
      drawAnnouncements(this.ctx, this.effects.announcements);
    }

    this.ctx.restore();

    if (this.effects.flashAlpha > 0) {
      this.ctx.fillStyle = `rgba(255, 255, 255, ${this.effects.flashAlpha})`;
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawRockets(): void {
    this.ctx.fillStyle = '#f59e0b';
    for (const r of this.rockets) {
      this.ctx.beginPath();
      this.ctx.arc(r.x, r.y, r.radius, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  loop(timestamp: number): void {
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

window.addEventListener('load', () => {
  new Game();
});
