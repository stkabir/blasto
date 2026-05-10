export interface Vec2 {
  x: number;
  y: number;
}

export interface Star {
  x: number;
  y: number;
  speed: number;
  size: number;
  alpha: number;
}

export interface AsteroidType {
  level: number;
  color: string;
  hp: number;
  radius: number;
  fallSpeed: number;
}

export interface AsteroidVertex {
  x: number;
  y: number;
}

export interface PowerUpType {
  id: string;
  name: string;
  duration: number;
  color: string;
  icon: string;
}

export interface ActivePowerUp {
  type: PowerUpType;
  remaining: number;
  startTime?: number;
  maxDuration: number;
}

export interface PlayerDesign {
  id: string;
  name: string;
  color: string;
  draw: (ctx: CanvasRenderingContext2D, r: number) => void;
}

export interface BulletStyle {
  id: string;
  name: string;
}

export interface PlayerBullet {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  history: Vec2[];
}

export interface Rocket {
  x: number;
  y: number;
  target: Asteroid | null;
  speed: number;
  damage: number;
  radius: number;
}

export interface ExplosionParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  life: number;
  color: string;
}

export interface Explosion {
  particles: ExplosionParticle[];
}

export interface TrailParticle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  alpha: number;
  size: number;
  color: string;
}

export interface SpeedLine {
  x: number;
  y: number;
  vx: number;
  alpha: number;
  length: number;
  fromRight: boolean;
}

export interface FloatingText {
  x: number;
  y: number;
  text: string;
  alpha: number;
  vy: number;
  life: number;
}

export interface Announcement {
  id: number;
  text: string;
  x: number;
  y: number;
  color: string;
  fontSize: number;
  duration: number;
  elapsed: number;
  strokeColor: string;
  strokeWidth: number;
  scale: number;
  alpha: number;
}

export interface LeaderboardEntry {
  name: string;
  score: number;
  designId?: string;
  color?: string;
  date?: number;
}

export interface BossBullet {
  x: number;
  y: number;
  targetX: number;
  targetY: number;
  radius: number;
}

export interface GameInput {
  touchX: number | null;
  touchY: number | null;
  left: boolean;
  right: boolean;
}

export type GameState = 'start' | 'playing' | 'paused' | 'gameover' | 'instructions' | 'customize' | 'leaderboard';

export type AsteroidTypeKey = 'LIGHT' | 'MED' | 'BLUE' | 'PURPLE' | 'RED';

import type { Asteroid } from '../entities/asteroid.js';
import type { Player } from '../entities/player.js';
