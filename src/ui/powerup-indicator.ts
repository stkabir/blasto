import type { ActivePowerUp } from '../core/types.js';
import { hexToRgb } from '../core/utils.js';

export function createPowerUpIcon(
  id: string,
  pu: ActivePowerUp,
  container: HTMLElement,
): HTMLElement {
  const div = document.createElement('div');
  div.className = `powerup-icon ${id} active`;
  div.style.opacity = '0';
  div.style.transition = 'none';

  const color = pu.type.color;
  const rgb = hexToRgb(color);

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

  container.appendChild(div);

  requestAnimationFrame(() => {
    div.style.transition = 'opacity 0.4s ease-out, transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    div.style.opacity = '1';
    div.style.transform = 'scale(1)';
    setTimeout(() => { div.style.transform = 'scale(1)'; }, 400);
  });

  return div;
}

export function updatePowerUpIconStyles(
  icons: Record<string, HTMLElement>,
  activePowerUps: Record<string, ActivePowerUp>,
  now: number,
): void {
  for (const id in icons) {
    const element = icons[id];
    const pu = activePowerUps[id];

    if (!pu || (pu.remaining <= 0 && id !== 'life')) {
      if (!element.dataset.fading) {
        element.dataset.fading = '1';
        element.style.opacity = '0';
        element.style.transition = 'opacity 0.15s ease-out';
      } else {
        element.parentNode?.removeChild(element);
        delete icons[id];
      }
      continue;
    }

    delete element.dataset.fading;

    const color = pu.type.color;

    if (id === 'life' || pu.maxDuration === 0 || pu.maxDuration === Infinity) {
      element.style.opacity = '1';
      element.style.boxShadow = `0 0 20px rgba(${hexToRgb(color)}, 1), inset 0 0 15px rgba(${hexToRgb(color)}, 0.5)`;
    } else {
      const progress = Math.max(0, pu.remaining / pu.maxDuration);
      const glowOpacity = 0.3 + (progress * 0.7);
      const bgOpacity = 0.3 + (progress * 0.5);

      if (pu.remaining <= 3000) {
        const blink = (Math.sin(now / 200) + 1) / 2;
        const opacity = 0.3 + (blink * 0.7);
        element.style.opacity = String(opacity);
        element.style.boxShadow = `0 0 ${15 + blink * 10}px rgba(${hexToRgb(color)}, ${glowOpacity}), inset 0 0 15px rgba(${hexToRgb(color)}, ${glowOpacity * 0.5})`;
      } else {
        element.style.opacity = String(glowOpacity);
        element.style.boxShadow = `0 0 20px rgba(${hexToRgb(color)}, ${glowOpacity}), inset 0 0 15px rgba(${hexToRgb(color)}, ${glowOpacity * 0.5})`;
      }

      element.style.background = `rgba(${hexToRgb(color)}, ${bgOpacity})`;
      element.style.borderColor = `rgba(${hexToRgb(color)}, ${progress})`;
    }
  }
}
