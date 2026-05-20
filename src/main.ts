import { GAME_CONFIG, PLAYER_DESIGNS, formatScore, SAVE_KEY } from './core/constants.js';
import { setupInput } from './core/input.js';
import { Player } from './entities/player.js';
import { AsteroidManager } from './entities/asteroid.js';
import { BossManager } from './entities/boss.js';
import { PowerUpManager } from './entities/powerup.js';
import { soundManager } from './systems/audio.js';
import { createBackgroundState, updateBackground, drawBackground, BACKGROUNDS, type BackgroundState } from './background.js';
import {
  createEffectsState,
  addTrailParticle,
  updateTrail,
  drawTrail,
  updateExplosions,
  drawExplosions,
  updateShockwaves,
  drawShockwaves,
  updateFloatingTexts,
  drawFloatingTexts,
  updateAnnouncements,
  drawAnnouncements,
  updateShake,
  updateFlash,
  announce,
  triggerShake,
  triggerFlash,
  updateSpeedLines,
  drawSpeedLines,
} from './systems/effects.js';
import { checkAllCollisions, updateRockets, type ComboState } from './systems/collision.js';
import { saveLocalScore, submitGlobalScore, renderLocalLeaderboard, renderGlobalLeaderboard } from './ui/leaderboard.js';
import {
  createCustomizeList,
  selectDesign,
  selectColor,
  selectBulletStyle,
  selectBackground,
  type CustomizationState,
} from './ui/customization.js';
import { createPowerUpIcon, updatePowerUpIconStyles } from './ui/powerup-indicator.js';
import { getWordmarkSVG, getSplashLogoSVG } from './ui/logo.js';
import type { GameState, GameInput, Rocket, ActivePowerUp } from './core/types.js';
import { initAds, showRewardAd, showBanner, hideBanner, isNative } from './monetization/ads.js';
import { addLives, consumeLife, getLivesBalance, hasRemoveAds, buyDesign, buyBullet, buyBackground, buyRemoveAds, buyMegaPack, isPurchased, PREMIUM_DESIGNS, PREMIUM_BULLETS, PREMIUM_BACKGROUNDS, IAP_PRODUCTS, type IAPProductId } from './monetization/unlocks.js';

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
  finalScoreEl: HTMLElement;
  resumeBtn: HTMLElement;
  startBtn: HTMLElement;
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
  background: BackgroundState;

  effects = createEffectsState();
  combo: ComboState = { count: 0, lastHitTime: 0 };
  powerUpIcons: Record<string, HTMLElement> = {};

  lastTime = 0;
  acc = 0;

  customization: CustomizationState;
  bossActive: boolean = false;

  lives: number = 3;
  reviveRequested: boolean = false;

  shopScreen: HTMLElement;
  shopList: HTMLElement;

  starSpeedMult: number = 1.0;
  targetStarSpeedMult: number = 1.0;
  currentTier: number = 0;

  lastShootSound = 0;

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
    this.shopScreen = document.getElementById('shop-screen')!;
    this.shopList = document.getElementById('shop-list')!;
    this.playerInfo = document.getElementById('player-info')!;
    this.playerNameDisplay = document.getElementById('player-name-display')!;
    this.finalScoreEl = document.getElementById('final-score')!;
    this.hud = document.getElementById('hud')!;
    this.gameoverNameInput = document.getElementById('gameover-name-input') as HTMLInputElement;
    this.resumeBtn = document.getElementById('resume-btn')!;
    this.startBtn = document.getElementById('start-btn')!;

    this.playerName = localStorage.getItem('blasto_playerName') || 'Player 1';
    this.playerNameDisplay.textContent = this.playerName;
    const startNameDisplay = document.getElementById('start-name-display');
    if (startNameDisplay) startNameDisplay.textContent = this.playerName;

    this.updateStartButtons();

    this.customization = {
      playerDesign: localStorage.getItem('blasto_playerDesign') || 'triangle',
      playerColor: localStorage.getItem('blasto_playerColor') || PLAYER_DESIGNS.triangle.color,
      bulletStyle: localStorage.getItem('blasto_bulletStyle') || 'dual',
      background: localStorage.getItem('blasto_background') || 'starfield',
    };

    this.state = 'start';
    this.score = 0;
    this.high = parseInt(localStorage.getItem('blasto_high') || '0');
    this.highEl.textContent = formatScore(this.high);

    this.background = createBackgroundState();

    this.resize();
    window.addEventListener('resize', () => this.resize());

    this.initSplash();
    this.initLogo();

    const reviveAdBtn = document.getElementById('revive-ad-btn');
    if (reviveAdBtn) {
      reviveAdBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        this.tryReviveWithAd();
      });
      reviveAdBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.tryReviveWithAd();
      }, { passive: false });
    }

    this.keys = setupInput({
      onTogglePause: () => this.togglePause(),
      onStartGame: () => this.startGame(),
      onResumeGame: () => this.resumeGame(),
      onRestart: () => this.restart(),
      onShowInstructions: () => this.showInstructions(),
      onHideInstructions: () => this.hideInstructions(),
      onShowLeaderboard: () => this.showLeaderboard(),
      onHideLeaderboard: () => this.hideLeaderboard(),
      onShowCustomize: () => this.showCustomize(),
      onHideCustomize: () => this.hideCustomize(),
      onShowShop: () => this.showShop(),
      onHideShop: () => this.hideShop(),
      onBackToMenu: () => this.backToMenu(),
      getState: () => this.state,
    });

    initAds();

    requestAnimationFrame((t) => this.loop(t));
  }

  resize(): void {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  initSplash(): void {
    const splash = document.getElementById('splash-screen');
    const splashLogo = document.getElementById('splash-logo');
    if (splashLogo) splashLogo.innerHTML = getSplashLogoSVG(120);
    if (splash) {
      setTimeout(() => {
        splash.classList.add('hidden');
        setTimeout(() => { splash.style.display = 'none'; }, 400);
      }, 800);
    }
  }

  initLogo(): void {
    const container = document.getElementById('logo-container');
    if (container) container.innerHTML = getWordmarkSVG();
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
      this.customization.playerDesign,
      this.customization.playerColor,
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

  showShop(): void {
    this.state = 'shop';
    this.startScreen.classList.add('hidden');
    this.shopScreen.classList.remove('hidden');
    this.renderShop();
    hideBanner();
  }

  hideShop(): void {
    this.shopScreen.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.state = 'start';
    if (!hasRemoveAds()) showBanner();
  }

  renderShop(): void {
    this.shopList.innerHTML = '';

    const livesCount = getLivesBalance();
    const livesLabel = document.createElement('div');
    livesLabel.className = 'shop-lives-header';
    livesLabel.innerHTML = `Vidas disponibles: <strong>${livesCount}</strong>`;
    this.shopList.appendChild(livesLabel);

    const iapItems: { id: IAPProductId; name: string; desc: string; price: number; icon: string }[] = [
      { ...IAP_PRODUCTS.removeAds, icon: '🚫' },
      { ...IAP_PRODUCTS.lives5, icon: '❤️' },
      { ...IAP_PRODUCTS.lives20, icon: '💕' },
      { ...IAP_PRODUCTS.designPack, icon: '🚀' },
      { ...IAP_PRODUCTS.bulletPack, icon: '💥' },
      { ...IAP_PRODUCTS.bgPack, icon: '🎨' },
      { ...IAP_PRODUCTS.megaPack, icon: '⭐' },
    ];

    for (const item of iapItems) {
      const card = document.createElement('div');
      card.className = 'shop-item';
      if (item.id === 'megaPack') card.classList.add('shop-item-featured');

      let purchased = false;
      if (item.id === 'removeAds') purchased = hasRemoveAds();
      else if (item.id === 'designPack') purchased = PREMIUM_DESIGNS.every(d => isPurchased('design', d.id));
      else if (item.id === 'bulletPack') purchased = PREMIUM_BULLETS.every(b => isPurchased('bullet', b.id));
      else if (item.id === 'bgPack') purchased = PREMIUM_BACKGROUNDS.every(bg => isPurchased('background', bg.id));

      card.innerHTML = `
        <div class="shop-item-icon">${item.icon}</div>
        <div class="shop-item-info">
          <div class="shop-item-name">${item.name}</div>
          <div class="shop-item-desc">${item.desc}</div>
        </div>
        <div class="shop-item-price">$${item.price.toFixed(2)}</div>
      `;

      if (purchased) {
        card.classList.add('shop-item-owned');
        const btn = document.createElement('div');
        btn.className = 'shop-owned-badge';
        btn.textContent = 'ADQUIRIDO';
        card.appendChild(btn);
      }

      card.addEventListener('click', () => {
        if (purchased) return;
        this.purchaseItem(item.id);
      });

      this.shopList.appendChild(card);
    }
  }

  purchaseItem(id: IAPProductId): void {
    switch (id) {
      case 'removeAds':
        buyRemoveAds();
        break;
      case 'lives5':
        addLives(5);
        break;
      case 'lives20':
        addLives(20);
        break;
      case 'designPack':
        for (const d of PREMIUM_DESIGNS) buyDesign(d.id);
        break;
      case 'bulletPack':
        for (const b of PREMIUM_BULLETS) buyBullet(b.id);
        break;
      case 'bgPack':
        for (const bg of PREMIUM_BACKGROUNDS) buyBackground(bg.id);
        break;
      case 'megaPack':
        buyMegaPack();
        break;
    }
    this.renderShop();
  }

  backToMenu(): void {
    if (this.state === 'paused') {
      this.saveGameState();
    }
    for (const id in this.powerUpIcons) {
      if (this.powerUpIcons[id].parentNode) {
        this.powerUpIcons[id].parentNode.removeChild(this.powerUpIcons[id]);
      }
    }
    this.powerUpIcons = {};
    if (this.powerUpManager) this.powerUpManager.activePowerUps = {};
    this.gameOverScreen.classList.add('hidden');
    this.pauseScreen.classList.add('hidden');
    this.shopScreen.classList.add('hidden');
    this.playerInfo.classList.remove('paused');
    this.hud.classList.add('hidden');
    this.startScreen.classList.remove('hidden');
    this.updateStartButtons();
    this.starSpeedMult = 1.0;
    this.targetStarSpeedMult = 1.0;
    this.currentTier = 0;
    this.state = 'start';
  }

  saveGameState(): void {
    if (!this.asteroidManager || !this.powerUpManager) return;
    const save = {
      score: this.score,
      wave: this.asteroidManager.currentWave,
      killsSinceLastSpawn: this.powerUpManager.killsSinceLastSpawn,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(save));
  }

  hasSavedGame(): boolean {
    try {
      const data = localStorage.getItem(SAVE_KEY);
      if (!data) return false;
      const save = JSON.parse(data);
      return typeof save.score === 'number' && typeof save.wave === 'number';
    } catch {
      return false;
    }
  }

  updateStartButtons(): void {
    const hasSave = this.hasSavedGame();
    this.resumeBtn.classList.toggle('hidden', !hasSave);
    if (hasSave) {
      this.startBtn.textContent = 'Nueva partida';
      this.startBtn.classList.remove('primary-btn');
      this.startBtn.classList.add('secondary-btn');
    } else {
      this.startBtn.textContent = 'Iniciar';
      this.startBtn.classList.add('primary-btn');
      this.startBtn.classList.remove('secondary-btn');
    }
  }

  resumeGame(): void {
    this.state = 'playing';
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');
    this.lives = 3;

    this.effects = createEffectsState();
    this.combo = { count: 0, lastHitTime: 0 };
    for (const id in this.powerUpIcons) {
      if (this.powerUpIcons[id].parentNode) {
        this.powerUpIcons[id].parentNode.removeChild(this.powerUpIcons[id]);
      }
    }
    this.powerUpIcons = {};
    this.bossActive = false;

    this.starSpeedMult = 1.0;
    this.targetStarSpeedMult = 1.0;

    this.player = new Player(this.canvas.width / 2, this.canvas.height - 150);
    this.player.setDesign(this.customization.playerDesign);
    this.player.setColor(this.customization.playerColor);
    this.player.setBulletStyle(this.customization.bulletStyle);

    this.asteroidManager = new AsteroidManager();
    this.asteroidManager.onPhaseStart = (wave: number) => {
      this.targetStarSpeedMult = 1.0 + this.currentTier * 0.4;
      const tier = Math.min(4, Math.floor((wave - 1) / 5));
      if (tier > this.currentTier && wave > 1) {
        this.currentTier = tier;
        this.score += 10000;
        this.updateHUD();
        triggerShake(this.effects, 8, 400);
        triggerFlash(this.effects, 0.5);
      }
    };
    this.asteroidManager.onPauseStart = (isWaveEnd: boolean, duration: number, waveBeforePause: number) => {
      const completedPhase = isWaveEnd ? 3 : ((waveBeforePause - 1) % 3) + 1;
      const upcomingPhase = isWaveEnd ? 1 : (completedPhase % 3) + 1;
      const positiveTexts = ['¡Bien hecho!', '¡Sigue así!', '¡Impecable!', '¡Perfecto!', '¡Eso es!', '¡Impresionante!'];
      const phaseTexts: Record<number, string[]> = {
        1: ['Prepárate...', 'Vienen más...', 'Allá van...'],
        2: ['Se acercan...', 'No te confíes...', 'Cuidado...'],
        3: ['¡Agárrate!', '¡Resiste!', '¡No cedas!'],
      };
      const phaseColors: Record<number, string> = { 1: '#22d3ee', 2: '#facc15', 3: '#f43f5e' };

      let txt: string;
      let color: string;

      if (Math.random() < 0.3) {
        txt = positiveTexts[Math.floor(Math.random() * positiveTexts.length)];
        color = '#34d399';
      } else {
        const opts = phaseTexts[upcomingPhase];
        txt = opts[Math.floor(Math.random() * opts.length)];
        color = phaseColors[upcomingPhase];
      }

      if (completedPhase === 3) {
        this.targetStarSpeedMult = 4.0;
      }

      if (!isWaveEnd) {
        this.score += 3000;
        this.updateHUD();
      }

      announce(this.effects.announcements, this.canvas.height, this.canvas.width, txt, {
        color,
        fontSize: 42,
        duration,
      });
    };
    this.asteroidManager.onWaveComplete = () => {
      this.targetStarSpeedMult = 4.0;
      this.score += 3000;
      this.updateHUD();
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

    try {
      const raw = localStorage.getItem(SAVE_KEY);
      if (raw) {
        const save = JSON.parse(raw);
        this.score = save.score;
        this.asteroidManager.jumpToWave(save.wave);
        this.powerUpManager.killsSinceLastSpawn = save.killsSinceLastSpawn ?? 0;
        this.currentTier = Math.min(4, Math.floor((save.wave - 1) / 5));
      }
    } catch {
      this.asteroidManager.jumpToWave(0);
      this.currentTier = 0;
    }

    this.canvas.style.transform = 'scale(1.25)';
    this.canvas.style.opacity = '0';
    this.canvas.style.transition = 'transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease-out';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.canvas.style.transform = 'scale(1)';
        this.canvas.style.opacity = '1';
      });
    });

    this.updateHUD();
  }

  renderCustomizeList(): void {
    createCustomizeList(
      this.customization,
      'customize-design-list',
      (id) => selectDesign(this.customization, id),
      (color) => selectColor(this.customization, color),
      (id) => selectBulletStyle(this.customization, id),
      (id) => selectBackground(this.customization, id),
    );
  }

  startGame(): void {
    localStorage.removeItem(SAVE_KEY);
    this.playerName = localStorage.getItem('blasto_playerName') || 'Player 1';
    localStorage.setItem('blasto_playerName', this.playerName);
    this.playerNameDisplay.textContent = this.playerName;
    this.lives = 3;

    this.state = 'playing';
    this.score = 0;
    this.startScreen.classList.add('hidden');
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');

    this.effects = createEffectsState();
    this.combo = { count: 0, lastHitTime: 0 };
    for (const id in this.powerUpIcons) {
      if (this.powerUpIcons[id].parentNode) {
        this.powerUpIcons[id].parentNode.removeChild(this.powerUpIcons[id]);
      }
    }
    this.powerUpIcons = {};
    this.bossActive = false;

    this.starSpeedMult = 1.0;
    this.targetStarSpeedMult = 1.0;
    this.currentTier = 0;

    this.player = new Player(this.canvas.width / 2, this.canvas.height - 150);
    this.player.setDesign(this.customization.playerDesign);
    this.player.setColor(this.customization.playerColor);
    this.player.setBulletStyle(this.customization.bulletStyle);

    this.asteroidManager = new AsteroidManager();
    this.asteroidManager.onWarmupComplete = () => {
      this.asteroidManager!.startWaveSystem();
    };
    this.asteroidManager.onPhaseStart = (wave: number) => {
      this.targetStarSpeedMult = 1.0 + this.currentTier * 0.4;
      const tier = Math.min(4, Math.floor((wave - 1) / 5));
      if (tier > this.currentTier && wave > 1) {
        this.currentTier = tier;
        this.score += 10000;
        this.updateHUD();
        triggerShake(this.effects, 8, 400);
        triggerFlash(this.effects, 0.5);
      }
    };
    this.asteroidManager.onPauseStart = (isWaveEnd: boolean, duration: number, waveBeforePause: number) => {
      const completedPhase = isWaveEnd ? 3 : ((waveBeforePause - 1) % 3) + 1;
      const upcomingPhase = isWaveEnd ? 1 : (completedPhase % 3) + 1;
      const positiveTexts = ['¡Bien hecho!', '¡Sigue así!', '¡Impecable!', '¡Perfecto!', '¡Eso es!', '¡Impresionante!'];
      const phaseTexts: Record<number, string[]> = {
        1: ['Prepárate...', 'Vienen más...', 'Allá van...'],
        2: ['Se acercan...', 'No te confíes...', 'Cuidado...'],
        3: ['¡Agárrate!', '¡Resiste!', '¡No cedas!'],
      };
      const phaseColors: Record<number, string> = { 1: '#22d3ee', 2: '#facc15', 3: '#f43f5e' };

      let txt: string;
      let color: string;

      if (Math.random() < 0.3) {
        txt = positiveTexts[Math.floor(Math.random() * positiveTexts.length)];
        color = '#34d399';
      } else {
        const opts = phaseTexts[upcomingPhase];
        txt = opts[Math.floor(Math.random() * opts.length)];
        color = phaseColors[upcomingPhase];
      }

      if (completedPhase === 3) {
        this.targetStarSpeedMult = 4.0;
      }

      if (!isWaveEnd) {
        this.score += 3000;
        this.updateHUD();
      }

      announce(this.effects.announcements, this.canvas.height, this.canvas.width, txt, {
        color,
        fontSize: 42,
        duration,
      });
    };
    this.asteroidManager.onWaveComplete = () => {
      this.targetStarSpeedMult = 4.0;
      this.score += 3000;
      this.updateHUD();
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
    }
    this.startGame();
  }

  update(dt: number): void {
    this.starSpeedMult += (this.targetStarSpeedMult - this.starSpeedMult) * dt * 1.5;
    updateBackground(this.background, dt, this.state === 'playing', this.starSpeedMult, this.customization.background);
    const tierBase = 1.0 + this.currentTier * 0.4;
    const excessSpeed = Math.max(0, this.starSpeedMult - tierBase);
    updateSpeedLines(this.effects, dt, excessSpeed, this.canvas.width, this.canvas.height);
    updateShake(this.effects, dt);
    updateFlash(this.effects, dt);
    updateTrail(this.effects, dt);
    updateShockwaves(this.effects, dt);
    updateFloatingTexts(this.effects.floatingTexts, dt);
    updateAnnouncements(this.effects.announcements, dt);

    if (this.state !== 'playing') return;
    if (!this.player || !this.asteroidManager || !this.bossManager || !this.powerUpManager) return;

    const frozen = this.powerUpManager.hasActive('freeze');
    const hasTriple = this.powerUpManager.hasActive('triple');

    this.player.update(dt, this.keys, frozen, hasTriple);

    const now = Date.now();
    if (now - this.player.lastFireTime < 20 && now - this.lastShootSound > 100) {
      this.lastShootSound = now;
      soundManager.play('shoot');
    }

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
      this.playerDied();
      return;
    }

    if (this.bossActive && this.asteroidManager && this.bossManager && !this.bossManager.boss) {
      this.bossActive = false;
      this.asteroidManager.notifyBossDefeated();
    }

    const mult = 1 + (this.asteroidManager?.currentWave ?? 0) * 0.05;
    this.score += Math.floor(result * mult);
    if (result > 0) this.updateHUD();

    updateExplosions(this.effects.explosions, dt);
    this.updatePowerUpIndicator();
    updatePowerUpIconStyles(this.powerUpIcons, this.powerUpManager.activePowerUps, Date.now());

    addTrailParticle(this.effects, this.player);
  }

  playerDied(): void {
    const extraLife = consumeLife();
    if (extraLife) {
      if (this.player) {
        this.player.invulnerableUntil = Date.now() + 4000;
      }
      triggerShake(this.effects, 6, 200);
      announce(this.effects.announcements, this.canvas.height, this.canvas.width, '¡VIDA EXTRA!', { color: '#ef4444', fontSize: 48 });
      return;
    }

    this.gameOver();
  }

  async gameOver(): Promise<void> {
    this.state = 'gameover';
    localStorage.removeItem(SAVE_KEY);
    soundManager.play('gameover');
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

    const reviveBtn = document.getElementById('revive-ad-btn') as HTMLElement;
    const noAds = hasRemoveAds();
    if (reviveBtn) {
      reviveBtn.classList.remove('hidden');
      if (noAds) {
        reviveBtn.textContent = 'Continuar';
        reviveBtn.classList.add('revive-no-ads');
      } else {
        reviveBtn.textContent = 'Ver anuncio para continuar';
        reviveBtn.classList.remove('revive-no-ads');
      }
    }

    this.highEl.textContent = formatScore(this.high);
    this.playerInfo.classList.remove('paused');
    this.hud.classList.add('hidden');

    saveLocalScore(this.playerName, this.score, this.customization.playerDesign, this.customization.playerColor);
    await submitGlobalScore(this.playerName, this.score, this.customization.playerDesign, this.customization.playerColor);
    this.gameoverNameInput.value = this.playerName;
    await renderGlobalLeaderboard(
      document.getElementById('gameover-local-lb')!,
      this.playerName,
      this.score,
      this.customization.playerDesign,
      this.customization.playerColor,
    );

    setTimeout(() => {
      this.finalScoreEl.textContent = formatScore(this.score);
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

  tryReviveWithAd(): void {
    const noAds = hasRemoveAds();
    if (noAds) {
      this.revivePlayer();
      return;
    }

    const reviveBtn = document.getElementById('revive-ad-btn') as HTMLElement;
    if (reviveBtn) {
      reviveBtn.textContent = 'Cargando...';
      reviveBtn.classList.add('hidden');
    }

    showRewardAd((result) => {
      if (result.rewarded) {
        this.revivePlayer();
      } else {
        if (reviveBtn) {
          reviveBtn.textContent = 'Ver anuncio para continuar';
          reviveBtn.classList.remove('hidden');
        }
      }
    });
  }

  revivePlayer(): void {
    this.state = 'playing';
    this.gameOverScreen.classList.add('hidden');
    this.hud.classList.remove('hidden');

    if (this.player) {
      this.player.reset(this.canvas.width / 2, this.canvas.height - 150);
      this.player.setDesign(this.customization.playerDesign);
      this.player.setColor(this.customization.playerColor);
      this.player.setBulletStyle(this.customization.bulletStyle);
      this.player.invulnerableUntil = Date.now() + 4000;
    }

    this.canvas.style.transform = 'scale(1.05)';
    this.canvas.style.opacity = '0';
    this.canvas.style.transition = 'transform 0.3s ease-out, opacity 0.2s ease-out';

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.canvas.style.transform = 'scale(1)';
        this.canvas.style.opacity = '1';
      });
    });

    this.updateHUD();
  }

  updateHUD(): void {
    this.scoreEl.textContent = formatScore(this.score);
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

    const theme = BACKGROUNDS.find(b => b.id === this.customization.background) ?? BACKGROUNDS[0];
    this.ctx.fillStyle = theme.base;
    this.ctx.fillRect(-10, -10, this.canvas.width + 20, this.canvas.height + 20);

    drawBackground(this.ctx, this.background, this.customization.background);
    drawSpeedLines(this.ctx, this.effects);
    drawTrail(this.ctx, this.effects);

    if (this.state === 'playing') {
      if (this.powerUpManager) this.powerUpManager.draw(this.ctx);
      if (this.asteroidManager) this.asteroidManager.draw(this.ctx);
      if (this.bossManager) this.bossManager.draw(this.ctx);
      if (this.player) this.player.draw(this.ctx, this.powerUpManager?.hasActive('shield') ?? false);
      this.drawRockets();
      drawShockwaves(this.ctx, this.effects);
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
