import { PLAYER_CONFIG, LIFE_INVULNERABILITY_DURATION, BOSS_POINTS_BONUS } from '../core/constants.js';
import type { Player } from '../entities/player.js';
import { soundManager } from './audio.js';
import type { Asteroid } from '../entities/asteroid.js';
import type { AsteroidManager } from '../entities/asteroid.js';
import type { BossManager } from '../entities/boss.js';
import type { PowerUpManager } from '../entities/powerup.js';
import type { Rocket } from '../core/types.js';
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
  const now = Date.now();

  if (now - combo.lastHitTime > 1500 && combo.count >= 3) {
    combo.count = 0;
  }

  const asteroidHit = asteroidManager.checkBulletCollision(player.bullets);
    if (asteroidHit) {
      const { asteroid, index } = asteroidHit;
      const destroyed = asteroid.hit(PLAYER_CONFIG.bulletDamage);
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

    addFloatingText(effects.floatingTexts, asteroid.x, asteroid.y - asteroid.radius, `+${PLAYER_CONFIG.bulletDamage}`);

      if (destroyed) {
        scoreIncrement += asteroid.type.hp * 3;
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
  }

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

  for (let i = rockets.length - 1; i >= 0; i--) {
    const r = rockets[i];
    if (!r.target || !(r.target as Asteroid).hp) {
      rockets.splice(i, 1);
      continue;
    }
    const t = r.target as Asteroid;
    const dx = r.x - t.x;
    const dy = r.y - t.y;
    if (Math.sqrt(dx * dx + dy * dy) < t.radius) {
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
      rockets.splice(i, 1);
    }
  }

  for (const asteroid of asteroidManager.asteroids) {
    const dx = player.x - asteroid.x;
    const dy = player.y - asteroid.y;
    if (Math.sqrt(dx * dx + dy * dy) < player.radius + asteroid.radius) {
      if (powerUpManager.hasActive('shield')) continue;
      if (player.isInvulnerable()) continue;
      if (powerUpManager.hasActive('life')) {
        delete powerUpManager.activePowerUps.life;
        player.invulnerableUntil = Date.now() + LIFE_INVULNERABILITY_DURATION;
        soundManager.play('life');
        return scoreIncrement;
      }
      return -1;
    }
  }

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
      rockets.splice(i, 1);
      continue;
    }

    const t = r.target as Asteroid;
    const dx = t.x - r.x;
    const dy = t.y - r.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist < t.radius) {
      t.hp -= r.damage;
      rockets.splice(i, 1);
      continue;
    }

    const speedMod = frozen ? 0.5 : 1;
    const speed = r.speed * speedMod;
    r.x += (dx / dist) * speed * dt;
    r.y += (dy / dist) * speed * dt;

    if (r.y > canvasHeight + 20) {
      rockets.splice(i, 1);
    }
  }
}
