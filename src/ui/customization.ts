import { PLAYER_DESIGNS, SHIP_COLORS, BULLET_STYLES } from '../core/constants.js';
import { getDesignSVG } from '../core/utils.js';

function getBulletStyleSVG(id: string, colorOverride: string): string {
  const color = colorOverride || '#22d3ee';
  switch (id) {
    case 'glow':
      return `<svg viewBox="0 0 40 40">
        <defs>
          <filter id="glow-preview" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="2" result="blur"/>
            <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="20" cy="20" r="8" fill="${color}" filter="url(#glow-preview)"/>
      </svg>`;
    case 'elongated':
      return `<svg viewBox="0 0 40 40">
        <line x1="20" y1="32" x2="20" y2="8" stroke="${color}" stroke-width="4" stroke-linecap="round" opacity="0.5"/>
        <ellipse cx="20" cy="20" rx="5" ry="8" fill="${color}"/>
      </svg>`;
    case 'beam':
      return `<svg viewBox="0 0 40 40">
        <line x1="20" y1="34" x2="20" y2="4" stroke="white" stroke-width="6" opacity="0.15" stroke-linecap="round"/>
        <line x1="20" y1="34" x2="20" y2="4" stroke="white" stroke-width="2" stroke-linecap="round"/>
      </svg>`;
    case 'spark':
      return `<svg viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="3.5" fill="${color}"/>
        <circle cx="14" cy="14" r="1.5" fill="${color}" opacity="0.6"/>
        <circle cx="26" cy="14" r="1.5" fill="${color}" opacity="0.6"/>
        <circle cx="14" cy="26" r="1.5" fill="${color}" opacity="0.6"/>
        <circle cx="26" cy="26" r="1.5" fill="${color}" opacity="0.6"/>
      </svg>`;
    case 'dual':
    default:
      return `<svg viewBox="0 0 40 40">
        <circle cx="20" cy="20" r="8" fill="${color}" opacity="0.3"/>
        <circle cx="20" cy="20" r="5" fill="${color}"/>
        <circle cx="20" cy="20" r="2" fill="white"/>
      </svg>`;
  }
}

export interface CustomizationState {
  playerDesign: string;
  playerColor: string;
  bulletStyle: string;
}

export function selectDesign(state: CustomizationState, id: string): void {
  state.playerDesign = id;
  localStorage.setItem('blasto_playerDesign', id);
  const items = document.querySelectorAll('.customize-design-item');
  items.forEach(item => {
    item.classList.toggle('selected', (item as HTMLElement).dataset.id === id);
  });
  updateAllPreviews(state.playerColor);
}

export function selectColor(state: CustomizationState, color: string): void {
  state.playerColor = color;
  localStorage.setItem('blasto_playerColor', color);
  const items = document.querySelectorAll('.customize-color-item');
  items.forEach(item => {
    item.classList.toggle('selected', (item as HTMLElement).dataset.color === color);
  });
  updateAllPreviews(color);
}

export function selectBulletStyle(state: CustomizationState, id: string): void {
  state.bulletStyle = id;
  localStorage.setItem('blasto_bulletStyle', id);
  const items = document.querySelectorAll('.customize-bullet-item');
  items.forEach(item => {
    item.classList.toggle('selected', (item as HTMLElement).dataset.id === id);
  });
}

export function updateAllPreviews(color: string): void {
  document.querySelectorAll('.customize-design-item').forEach((item) => {
    const designId = (item as HTMLElement).dataset.id;
    if (designId) {
      const preview = item.querySelector('.customize-design-preview');
      if (preview) preview.innerHTML = getDesignSVG(designId, color);
    }
  });
  document.querySelectorAll('.customize-bullet-item').forEach((item) => {
    const bulletId = (item as HTMLElement).dataset.id;
    const preview = item.querySelector('.customize-bullet-preview');
    if (preview && bulletId) {
      preview.innerHTML = getBulletStyleSVG(bulletId, color);
    }
  });
}

export function createCustomizeList(
  state: CustomizationState,
  containerId: string,
  onSelectDesign: (id: string) => void,
  onSelectColor: (color: string) => void,
  onSelectBulletStyle: (id: string) => void,
): void {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';

  const tabBar = document.createElement('div');
  tabBar.className = 'customize-tabs';

  const tabConfig = [
    { key: 'color', label: 'COLOR' },
    { key: 'design', label: 'NAVES' },
    { key: 'bullet', label: 'DISPAROS' },
  ];

  const sectionMap = new Map<string, HTMLElement>();
  const tabMap = new Map<string, HTMLElement>();

  tabConfig.forEach((config, index) => {
    const tab = document.createElement('button');
    tab.className = 'customize-tab';
    tab.dataset.tab = config.key;
    tab.textContent = config.label;
    if (index === 0) tab.classList.add('active');
    tab.addEventListener('click', () => {
      tabBar.querySelectorAll('.customize-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sectionMap.forEach((section, key) => {
        section.classList.toggle('active', key === config.key);
      });
    });
    tabBar.appendChild(tab);
    tabMap.set(config.key, tab);
  });

  list.appendChild(tabBar);

  const colorSection = document.createElement('div');
  colorSection.className = 'customize-section active';
  colorSection.dataset.section = 'color';
  const colorGrid = document.createElement('div');
  colorGrid.className = 'customize-grid';
  SHIP_COLORS.forEach(color => {
    const item = document.createElement('div');
    item.className = 'customize-color-item';
    item.dataset.color = color;

    const preview = document.createElement('div');
    preview.className = 'customize-color-preview';
    preview.style.background = color;
    preview.style.boxShadow = `0 0 15px ${color}`;
    item.appendChild(preview);

    if (color === state.playerColor) {
      item.classList.add('selected');
    }

    item.addEventListener('click', () => onSelectColor(color));
    colorGrid.appendChild(item);
  });
  colorSection.appendChild(colorGrid);
  list.appendChild(colorSection);
  sectionMap.set('color', colorSection);

  const designSection = document.createElement('div');
  designSection.className = 'customize-section';
  designSection.dataset.section = 'design';
  const shipsGrid = document.createElement('div');
  shipsGrid.className = 'customize-grid';
  const designs = Object.values(PLAYER_DESIGNS);
  designs.forEach(design => {
    const item = document.createElement('div');
    item.className = 'customize-design-item';
    item.dataset.id = design.id;

    const preview = document.createElement('div');
    preview.className = 'customize-design-preview';
    preview.innerHTML = getDesignSVG(design.id, state.playerColor);
    item.appendChild(preview);

    if (design.id === state.playerDesign) {
      item.classList.add('selected');
    }

    item.addEventListener('click', () => onSelectDesign(design.id));
    shipsGrid.appendChild(item);
  });
  designSection.appendChild(shipsGrid);
  list.appendChild(designSection);
  sectionMap.set('design', designSection);

  const bulletSection = document.createElement('div');
  bulletSection.className = 'customize-section';
  bulletSection.dataset.section = 'bullet';
  const bulletsGrid = document.createElement('div');
  bulletsGrid.className = 'customize-grid';
  const bulletStyles = Object.values(BULLET_STYLES);
  bulletStyles.forEach(style => {
    const item = document.createElement('div');
    item.className = 'customize-bullet-item';
    item.dataset.id = style.id;

    const preview = document.createElement('div');
    preview.className = 'customize-bullet-preview';
    preview.innerHTML = getBulletStyleSVG(style.id, state.playerColor);
    item.appendChild(preview);

    if (style.id === state.bulletStyle) {
      item.classList.add('selected');
    }

    item.addEventListener('click', () => onSelectBulletStyle(style.id));
    bulletsGrid.appendChild(item);
  });
  bulletSection.appendChild(bulletsGrid);
  list.appendChild(bulletSection);
  sectionMap.set('bullet', bulletSection);
}
