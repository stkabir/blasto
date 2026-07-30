import { PLAYER_CONFIG, LIFE_INVULNERABILITY_DURATION, BOSS_POINTS_BONUS } from '../core/constants.js';
import type { Player } from '../entities/player.js';
import { soundManager } from './audio.js';
import type { Asteroid } from '../entities/asteroid.js';
import type { AsteroidManager } from '../entities/asteroid.js';
import type { BossManager } from '../entities/boss.js';
import type { PowerUpManager } from '../entities/powerup.js';
import type { Rocket } from '../core/types.js';
import { SpatialGrid } from './spatial-grid.js';
import {
  addFloatingText,
  createExplosion,
  addShockwave,
  triggerShake,
  triggerFlash,
  announce,
} from './effects.js';
import type { EffectsState } from './effects.js';

export interface ComboState {
  count: number;
  lastHitTime: number;
}

let grid: SpatialGrid | null = null;
let gridWidth = 0;
let gridHeight = 0;

function ensureGrid(width: number, height: number): SpatialGrid {
  if (!grid || gridWidth !== width || gridHeight !== height) {
    grid = new SpatialGrid(width, height, 120);
    gridWidth = width;
    gridHeight = height;
  }
  return grid;
}

function destroyAsteroid(
  asteroid: Asteroid,
  index: number,
  asteroidManager: AsteroidManager,
  powerUpManager: PowerUpManager,
  effects: EffectsState,
  scoreRef: { value: number },
): void {
  scoreRef.value += asteroid.type.hp * 3;
  powerUpManager.onAsteroidKilled();
  soundManager.play('explode');
  const shakeIntensity = asteroid.type.level <= 2 ? 4 : asteroid.type.level <= 3 ? 6 : 10;
  triggerShake(effects, shakeIntensity, 100);
  const scale = 0.7 + asteroid.type.level * 0.25;
  effects.explosions.push(createExplosion(asteroid.x, asteroid.y, asteroid.type.color, scale));
  addShockwave(effects, asteroid.x, asteroid.y, asteroid.type.color, asteroid.radius * 3.5);
  if (asteroid.type.level >= 4) triggerFlash(effects, 0.18);
  const children = asteroid.split();
  asteroidManager.remove(index);
  for (const child of children) {
    asteroidManager.asteroids.push(child);
  }
}

export function checkAllCollisions(
  player: Player,
  asteroidManager: AsteroidManager,
  bossManager: BossManager,
  powerUpManager: PowerUpManager,
  rockets: Rocket[],
  effects: EffectsState,
  combo: ComboState,
  canvas: HTMLCanvasElement,
): number {
  let scoreIncrement = 0;
  const scoreRef = { value: 0 };
  const now = Date.now();

  if (now - combo.lastHitTime > 1500 && combo.count >= 3) {
    combo.count = 0;
  }

  const asteroids = asteroidManager.asteroids;
  const asteroidsLen = asteroids.length;

  // Construir grilla espacial para colisiones con asteroides.
  const g = ensureGrid(canvas.width, canvas.height);
  g.clear();
  for (let i = 0; i < asteroidsLen; i++) {
    g.insert(asteroids[i]);
  }

  const bullets = player.bullets;
  for (let i = bullets.length - 1; i >= 0; i--) {
    const b = bullets[i];
    let hit = false;
    g.query(b.x, b.y, b.radius, (a) => {
      if (a.hp <= 0) return false;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const rr = a.radius + b.radius;
      if (dx * dx + dy * dy < rr * rr) {
        const destroyed = a.hit(PLAYER_CONFIG.bulletDamage);
        scoreIncrement += PLAYER_CONFIG.bulletDamage;
        soundManager.play('hit');

        combo.lastHitTime = now;
        combo.count++;

        if (combo.count === 5) {
          soundManager.play('combo');
          announce(effects.announcements, canvas.height, canvas.width, '¡COMBO!', { color: '#f59e0b', fontSize: 56 });
          triggerShake(effects, 6, 150);
        } else if (combo.count === 10) {
          soundManager.play('combo');
          announce(effects.announcements, canvas.height, canvas.width, '¡EN FUEGO!', { color: '#ef4444', fontSize: 64 });
          triggerShake(effects, 8, 200);
        } else if (combo.count === 20) {
          soundManager.play('combo');
          announce(effects.announcements, canvas.height, canvas.width, '¡INCREÍBLE!', { color: '#a855f7', fontSize: 72 });
          triggerShake(effects, 10, 250);
        }

        addFloatingText(effects.floatingTexts, a.x, a.y - a.radius, `+${PLAYER_CONFIG.bulletDamage}`);

        if (destroyed) {
          const idx = asteroidManager.asteroids.indexOf(a);
          if (idx > -1) {
            destroyAsteroid(a, idx, asteroidManager, powerUpManager, effects, scoreRef);
            scoreIncrement += scoreRef.value;
            scoreRef.value = 0;
          }
        }

        hit = true;
        return true;
      }
      return false;
    });
    if (hit) {
      // swap-and-pop sobre bullets (pool release ocurre en player.updateBullets,
      // aquí solo necesitamos remover de la lista activa).
      bullets[i] = bullets[bullets.length - 1];
      bullets.pop();
    }
  }

  // Balas vs boss.
  const bossHit = bossManager.checkBulletCollision(player.bullets);
  if (bossHit && bossManager.boss) {
    const destroyed = bossManager.boss.hit(PLAYER_CONFIG.bulletDamage);
    scoreIncrement += PLAYER_CONFIG.bulletDamage;
    soundManager.play('hit');
    triggerFlash(effects, 0.2);
    addFloatingText(
      effects.floatingTexts,
      bossManager.boss.x + bossManager.boss.width / 2,
      bossManager.boss.y,
      `+${PLAYER_CONFIG.bulletDamage}`
    );
    if (destroyed) {
      scoreIncrement += BOSS_POINTS_BONUS;
      const bossType = bossManager.boss.type;
      const explosionColor = bossManager.boss.getExplosionColor();
      const shockwaveColor = bossType === 'asteroid_spawner' ? '#9ca3af' : explosionColor;
      soundManager.play('explode');
      triggerShake(effects, 12, 200);
      const bx = bossManager.boss.x + bossManager.boss.width / 2;
      const by = bossManager.boss.y + bossManager.boss.height / 2;
      effects.explosions.push(createExplosion(bx, by, explosionColor, 2.5));
      addShockwave(effects, bx, by, shockwaveColor, 240);
      addShockwave(effects, bx, by, '#fbbf24', 180);
      triggerFlash(effects, 0.5);
      bossManager.boss = null;
    }
  }

  // Balas vs powerups (pocos powerups, chequeo directo).
  const powerupType = powerUpManager.activateByShooting(player.bullets);
  if (powerupType) {
    if (powerupType.id === 'rocket') {
      const rocket = player.fireRocket(asteroidManager);
      if (rocket) rockets.push(rocket);
    } else {
      powerUpManager.activate(powerupType);
      soundManager.play('powerup');
    }
  }

  // Rockets vs asteroides (un solo objetivo por rocket).
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    if (!r.target || !(r.target as Asteroid).hp) {
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
      continue;
    }
    const t = r.target as Asteroid;
    const dx = r.x - t.x;
    const dy = r.y - t.y;
    const rr = t.radius + r.radius;
    if (dx * dx + dy * dy < rr * rr) {
      t.hp -= r.damage;
      scoreIncrement += r.damage;
      if (t.hp <= 0) {
        const scale = 0.7 + t.type.level * 0.25;
        effects.explosions.push(createExplosion(t.x, t.y, t.type.color, scale));
        addShockwave(effects, t.x, t.y, t.type.color, t.radius * 3.5);
        const children = t.split();
        const idx = asteroidManager.asteroids.indexOf(t);
        if (idx > -1) asteroidManager.remove(idx);
        for (const child of children) {
          asteroidManager.asteroids.push(child);
        }
      }
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
    }
  }

  // Player vs asteroides (también usa grilla).
  let playerDied = false;
  g.query(player.x, player.y, player.radius, (a) => {
    if (a.hp <= 0) return false;
    const dx = player.x - a.x;
    const dy = player.y - a.y;
    const r = player.radius + a.radius;
    if (dx * dx + dy * dy < r * r) {
      if (powerUpManager.hasActive('shield')) return false;
      if (player.isInvulnerable()) return false;
      if (powerUpManager.hasActive('life')) {
        delete powerUpManager.activePowerUps.life;
        player.invulnerableUntil = Date.now() + LIFE_INVULNERABILITY_DURATION;
        soundManager.play('life');
        return true;
      }
      playerDied = true;
      return true;
    }
    return false;
  });

  if (playerDied) return -1;

  if (bossManager.checkPlayerCollision(player)) {
    if (powerUpManager.hasActive('shield')) return scoreIncrement;
    if (player.isInvulnerable()) return scoreIncrement;
    if (powerUpManager.hasActive('life')) {
      delete powerUpManager.activePowerUps.life;
      player.invulnerableUntil = Date.now() + LIFE_INVULNERABILITY_DURATION;
      soundManager.play('life');
      return scoreIncrement;
    }
    return -1;
  }

  const powerup = powerUpManager.checkCollision(player.x, player.y, player.radius);
  if (powerup) {
    if (powerup.id === 'rocket') {
      const rocket = player.fireRocket(asteroidManager);
      if (rocket) rockets.push(rocket);
    } else {
      powerUpManager.activate(powerup);
      soundManager.play('powerup');
    }
  }

  return scoreIncrement;
}

export function updateRockets(rockets: Rocket[], dt: number, frozen: boolean, canvasHeight: number): void {
  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    if (!r.target || !(r.target as Asteroid).hp || (r.target as Asteroid).hp <= 0) {
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
      continue;
    }

    const t = r.target as Asteroid;
    const dx = t.x - r.x;
    const dy = t.y - r.y;
    const distSq = dx * dx + dy * dy;
    const rCol = t.radius + r.radius;

    if (distSq < rCol * rCol) {
      t.hp -= r.damage;
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
      continue;
    }

    const speedMod = frozen ? 0.5 : 1;
    const speed = r.speed * speedMod;
    const dist = Math.sqrt(distSq);
    if (dist > 0.001) {
      r.x += (dx / dist) * speed * dt;
      r.y += (dy / dist) * speed * dt;
    }

    if (r.y > canvasHeight + 20) {
      rockets[i] = rockets[rockets.length - 1];
      rockets.pop();
    }
  }
}
