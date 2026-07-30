import type { ActivePowerUp } from '../core/types.js';
import { hexToRgb } from '../core/utils.js';

export function createPowerUpIcon(
  id: string,
  pu: ActivePowerUp,
  container: HTMLElement,
): HTMLElement {
  const div = document.createElement('div');
  div.className = `powerup-icon ${id} active`;
  div.dataset.id = id;

  const rgb = hexToRgb(pu.type.color);
  div.style.setProperty('--pu-color', pu.type.color);
  div.style.setProperty('--pu-rgb', rgb);
  div.style.setProperty('--pu-progress', '1');

  const outerRing = document.createElement('div');
  outerRing.className = 'powerup-ring';

  const iconSpan = document.createElement('span');
  iconSpan.className = 'powerup-icon-inner';
  iconSpan.textContent = pu.type.icon;

  div.appendChild(outerRing);
  div.appendChild(iconSpan);

  container.appendChild(div);

  requestAnimationFrame(() => {
    div.classList.remove('active');
  });

  return div;
}

function shouldRemove(pu: ActivePowerUp | undefined, id: string): boolean {
  if (!pu) return true;
  if (id === 'life') return false;
  if (pu.remaining <= 0) return true;
  return false;
}

export function updatePowerUpIconStyles(
  icons: Record<string, HTMLElement>,
  activePowerUps: Record<string, ActivePowerUp>,
  now: number,
): void {
  const toRemove: string[] = [];

  for (const id in icons) {
    const element = icons[id];
    const pu = activePowerUps[id];

    if (shouldRemove(pu, id)) {
      toRemove.push(id);
      continue;
    }

    if (id === 'life' || !pu || pu.maxDuration === 0 || pu.maxDuration === Infinity) {
      element.classList.remove('expiring');
      element.style.setProperty('--pu-progress', '1');
      continue;
    }

    const progress = Math.max(0, pu.remaining / pu.maxDuration);
    const isExpiring = pu.remaining <= 3000;

    element.style.setProperty('--pu-progress', String(progress));
    element.classList.toggle('expiring', isExpiring);
  }

  for (const id of toRemove) {
    const element = icons[id];
    if (element && element.parentNode) {
      element.parentNode.removeChild(element);
    }
    delete icons[id];
  }
}
