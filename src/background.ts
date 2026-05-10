import type { Star } from './core/types.js';

export function createStarfield(count: number): Star[] {
  const stars: Star[] = [];
  for (let i = 0; i < count; i++) {
    stars.push({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      speed: 15 + Math.random() * 45,
      size: 0.5 + Math.random() * 1.5,
      alpha: 0.3 + Math.random() * 0.7,
    });
  }
  return stars;
}

export function updateStarfield(stars: Star[], dt: number, isPlaying: boolean, speedMult: number): void {
  for (const star of stars) {
    const s = star.speed * speedMult;
    if (isPlaying) {
      star.y += s * dt;
      if (star.y > window.innerHeight + 5) {
        star.y = -5;
        star.x = Math.random() * window.innerWidth;
      }
    } else {
      star.x -= s * dt;
      if (star.x < -5) {
        star.x = window.innerWidth + 5;
        star.y = Math.random() * window.innerHeight;
      }
    }
  }
}

export function drawStarfield(ctx: CanvasRenderingContext2D, stars: Star[]): void {
  ctx.fillStyle = '#ffffff';
  for (const star of stars) {
    ctx.globalAlpha = star.alpha;
    ctx.beginPath();
    ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}
