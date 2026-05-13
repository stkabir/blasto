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
  fireRate: 25,
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

export const POWERUP_SPAWN_KILLS = 10;
export const POWERUP_LIFE_CHANCE = 0.08;
export const POWERUP_REGULAR_CHANCE = 0.15;
export const POWERUP_HP = 7;
export const LIFE_INVULNERABILITY_DURATION = 4000;

export function formatScore(n: number): string {
  return n.toLocaleString('es');
}

export const SAVE_KEY = 'blasto_savedGame';

export const SHIP_COLORS = ['#22d3ee', '#e879f9', '#a3e635', '#818cf8', '#facc15', '#fb923c', '#f43f5e', '#cbd5e1', '#10b981', '#8b5cf6'];

function fillStrokeShip(ctx: CanvasRenderingContext2D, fill: string): void {
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.shadowColor = ctx.strokeStyle as string;
  ctx.shadowBlur = 12;
  ctx.stroke();
  ctx.shadowBlur = 0;
}

function cockpit(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  grad.addColorStop(0, '#ffffff');
  grad.addColorStop(0.5, ctx.strokeStyle as string);
  grad.addColorStop(1, 'rgba(0,0,0,0.6)');
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = grad;
  ctx.fill();
}

function bodyFill(ctx: CanvasRenderingContext2D, r: number): string {
  const grad = ctx.createLinearGradient(0, -r, 0, r);
  grad.addColorStop(0, 'rgba(255,255,255,0.25)');
  grad.addColorStop(0.5, 'rgba(15,24,36,0.85)');
  grad.addColorStop(1, 'rgba(5,8,13,0.95)');
  return grad as unknown as string;
}

function drawTriangle(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r * 0.8, r * 0.6);
  ctx.lineTo(-r * 0.45, r * 0.4);
  ctx.lineTo(0, r * 0.55);
  ctx.lineTo(r * 0.45, r * 0.4);
  ctx.lineTo(r * 0.8, r * 0.6);
  ctx.closePath();
  fillStrokeShip(ctx, bodyFill(ctx, r));
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.5);
  ctx.lineTo(-r * 0.2, r * 0.2);
  ctx.lineTo(r * 0.2, r * 0.2);
  ctx.closePath();
  ctx.fillStyle = (ctx.strokeStyle as string);
  ctx.globalAlpha = 0.35;
  ctx.fill();
  ctx.globalAlpha = 1;
  cockpit(ctx, 0, -r * 0.05, r * 0.22);
}

function drawDiamond(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.beginPath();
  ctx.moveTo(0, -r);
  ctx.lineTo(-r * 0.7, 0);
  ctx.lineTo(0, r * 0.8);
  ctx.lineTo(r * 0.7, 0);
  ctx.closePath();
  fillStrokeShip(ctx, bodyFill(ctx, r));
  ctx.beginPath();
  ctx.moveTo(0, -r * 0.6);
  ctx.lineTo(-r * 0.4, 0);
  ctx.lineTo(0, r * 0.45);
  ctx.lineTo(r * 0.4, 0);
  ctx.closePath();
  ctx.strokeStyle = ctx.strokeStyle;
  ctx.globalAlpha = 0.6;
  ctx.lineWidth = 1;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  cockpit(ctx, 0, -r * 0.1, r * 0.2);
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
  fillStrokeShip(ctx, bodyFill(ctx, r));
  ctx.beginPath();
  ctx.moveTo(-r * 0.7, r * 0.4);
  ctx.lineTo(-r * 0.4, r * 0.4);
  ctx.moveTo(r * 0.7, r * 0.4);
  ctx.lineTo(r * 0.4, r * 0.4);
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.lineWidth = 2;
  cockpit(ctx, 0, -r * 0.2, r * 0.25);
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
  fillStrokeShip(ctx, bodyFill(ctx, r));
  ctx.beginPath();
  for (let i = 0; i < 6; i++) {
    const angle = (Math.PI / 3) * i - Math.PI / 2;
    const x = Math.cos(angle) * r * 0.55;
    const y = Math.sin(angle) * r * 0.55;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.globalAlpha = 0.5;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.globalAlpha = 1;
  ctx.lineWidth = 2;
  cockpit(ctx, 0, 0, r * 0.28);
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
  fillStrokeShip(ctx, bodyFill(ctx, r));
  cockpit(ctx, 0, 0, r * 0.3);
}

function drawCrescent(ctx: CanvasRenderingContext2D, r: number): void {
  ctx.save();
  ctx.beginPath();
  ctx.arc(0, 0, r, -Math.PI * 0.85, Math.PI * 0.85);
  ctx.arc(r * 0.35, 0, r * 0.7, Math.PI * 0.85, -Math.PI * 0.85, true);
  ctx.closePath();
  fillStrokeShip(ctx, bodyFill(ctx, r));
  ctx.restore();
  cockpit(ctx, -r * 0.2, 0, r * 0.2);
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
  fillStrokeShip(ctx, bodyFill(ctx, r));
  cockpit(ctx, 0, 0, r * 0.22);
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

export const GAME_VERSION = '0.7.3';

export const BULLET_STYLES: Record<string, BulletStyle> = {
  glow:      { id: 'glow',      name: 'Brillo' },
  elongated: { id: 'elongated', name: 'Alargado' },
  dual:      { id: 'dual',      name: 'Doble' },
  beam:      { id: 'beam',      name: 'Láser' },
  spark:     { id: 'spark',     name: 'Chispa' },
};
