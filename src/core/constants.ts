import type { AsteroidType, AsteroidTypeKey, PlayerDesign, BulletStyle, PowerUpType } from './types.js';

export const GAME_CONFIG = {
  targetFPS: 60,
  stepMs: 1000 / 60,
};

export const ASTEROID_TYPES: Record<AsteroidTypeKey, AsteroidType> = {
  LIGHT:  { level: 1, color: '#84cc16', hp: 10,  radius: 20, fallSpeed: 70 },
  MED:    { level: 2, color: '#15803d', hp: 20,  radius: 28, fallSpeed: 50 },
  BLUE:   { level: 3, color: '#3b82f6', hp: 35,  radius: 30, fallSpeed: 50 },
  PURPLE: { level: 4, color: '#a855f7', hp: 50,  radius: 38, fallSpeed: 40 },
  RED:    { level: 5, color: '#ef4444', hp: 100, radius: 46, fallSpeed: 30 },
};

export const SPLIT_MAP: Record<number, AsteroidTypeKey | null> = {
  1: null,
  2: 'LIGHT',
  3: 'MED',
  4: 'BLUE',
  5: 'PURPLE',
};

export const PLAYER_CONFIG = {
  speed: 350,
  radius: 18,
  fireRate: 33,
  bulletSpeed: 500,
  bulletDamage: 1,
};

export const BOSS_CONFIG = {
  pointsToAppear: 1000,
  pointsReward: 350,
  speed: 100,
  bulletSpeed: 225,
  fireInterval: 600,
  width: 80,
  height: 60,
};

export const POWERUP_TYPES: Record<string, PowerUpType> = {
  TRIPLE: { id: 'triple', name: 'Triple', duration: 10000, color: '#22d3ee', icon: '⚡' },
  ROCKET: { id: 'rocket', name: 'Rocket', duration: 0, color: '#f59e0b', icon: '🚀' },
  SHIELD: { id: 'shield', name: 'Shield', duration: 10000, color: '#34d399', icon: '🛡' },
  FREEZE: { id: 'freeze', name: 'Freeze', duration: 8000, color: '#a78bfa', icon: '❄' },
  LIFE:   { id: 'life',   name: 'Life',   duration: 0, color: '#ef4444', icon: '❤' },
};

export const POWERUP_SPAWN_SCORE = 70;
export const POWERUP_LIFE_SCORE = 150;
export const POWERUP_LIFE_CHANCE = 0.12;
export const POWERUP_REGULAR_CHANCE = 0.25;
export const POWERUP_HP = 7;
export const LIFE_INVULNERABILITY_DURATION = 4000;

export function formatScore(n: number): string {
  return n.toLocaleString('es');
}

export const SHIP_COLORS = ['#22d3ee', '#e879f9', '#a3e635', '#818cf8', '#facc15', '#fb923c', '#f43f5e', '#cbd5e1', '#10b981', '#8b5cf6'];

function drawTriangle(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r * 0.8, r * 0.6);
  ctx.lineTo(r * 0.8, r * 0.6);
  ctx.closePath();
  ctx.stroke();
}

function drawDiamond(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r * 0.7, 0);
  ctx.lineTo(0, r * 0.8);
  ctx.lineTo(r * 0.7, 0);
  ctx.closePath();
  ctx.stroke();
}

function drawWing(ctx: CanvasRenderingContext2D, r: number): void {
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

function drawHexagon(ctx: CanvasRenderingContext2D, r: number): void {
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

function drawStar(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI / 5) * i - Math.PI / 2;
    const radius = i % 2 === 0 ? r : r * 0.45;
    const x = Math.cos(angle) * radius;
    const y = Math.sin(angle) * radius;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.stroke();
}

function drawCrescent(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.arc(0, 0, r, -0.6, Math.PI + 0.6);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(r * 0.3, 0, r * 0.65, -0.8, Math.PI + 0.8);
  ctx.stroke();
}

function drawCrux(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(r * 0.25, -r * 0.2);
  ctx.lineTo(r * 0.85, 0);
  ctx.lineTo(r * 0.25, r * 0.2);
  ctx.lineTo(0, r * 0.85);
  ctx.lineTo(-r * 0.25, r * 0.2);
  ctx.lineTo(-r * 0.85, 0);
  ctx.lineTo(-r * 0.25, -r * 0.2);
  ctx.closePath();
  ctx.stroke();
}

export const PLAYER_DESIGNS: Record<string, PlayerDesign> = {
  triangle:  { id: 'triangle',  name: 'Triángulo',  color: '#22d3ee', draw: drawTriangle },
  diamond:   { id: 'diamond',   name: 'Diamante',   color: '#e879f9', draw: drawDiamond },
  wing:      { id: 'wing',      name: 'Ala',        color: '#a3e635', draw: drawWing },
  hexagon:   { id: 'hexagon',   name: 'Hexágono',   color: '#38bdf8', draw: drawHexagon },
  star:      { id: 'star',      name: 'Estrella',   color: '#facc15', draw: drawStar },
  crescent:  { id: 'crescent',  name: 'Media Luna', color: '#cbd5e1', draw: drawCrescent },
  crux:      { id: 'crux',      name: 'Cruz',       color: '#f43f5e', draw: drawCrux },
};

export const BULLET_STYLES: Record<string, BulletStyle> = {
  glow:      { id: 'glow',      name: 'Brillo' },
  elongated: { id: 'elongated', name: 'Alargado' },
  dual:      { id: 'dual',      name: 'Doble' },
  beam:      { id: 'beam',      name: 'Láser' },
  spark:     { id: 'spark',     name: 'Chispa' },
};
