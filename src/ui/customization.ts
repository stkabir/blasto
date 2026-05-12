import { PLAYER_DESIGNS, SHIP_COLORS, BULLET_STYLES } from '../core/constants.js';
import { BACKGROUNDS } from '../background.js';
import { getDesignSVG } from '../core/utils.js';
import { soundManager } from '../systems/audio.js';

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
  background: string;
}

export function selectBackground(state: CustomizationState, id: string): void {
  state.background = id;
  localStorage.setItem('blasto_background', id);
  const items = document.querySelectorAll('.customize-bg-item');
  items.forEach(item => {
    item.classList.toggle('selected', (item as HTMLElement).dataset.id === id);
  });
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
  onSelectBackground?: (id: string) => void,
): void {
  const list = document.getElementById(containerId);
  if (!list) return;
  list.innerHTML = '';

  const tabBar = document.createElement('div');
  tabBar.className = 'customize-tabs';

  const tabConfig = [
    { key: 'color', label: 'COLOR', icon: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="5"/></svg>' },
    { key: 'design', label: 'NAVES', icon: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12,2 22,20 2,20"/></svg>' },
    { key: 'bullet', label: 'DISPAROS', icon: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="22" x2="12" y2="6"/><circle cx="12" cy="4" r="2"/></svg>' },
    { key: 'bg', label: 'FONDO', icon: '<svg class="tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="1"/><circle cx="5" cy="6" r="0.8"/><circle cx="18" cy="8" r="0.8"/><circle cx="8" cy="18" r="0.8"/></svg>' },
  ];

  const sectionMap = new Map<string, HTMLElement>();
  const tabMap = new Map<string, HTMLElement>();

  tabConfig.forEach((config, index) => {
    const tab = document.createElement('button');
    tab.className = 'customize-tab';
    tab.dataset.tab = config.key;
    tab.innerHTML = `${config.icon}<span>${config.label}</span>`;
    if (index === 0) tab.classList.add('active');
    tab.addEventListener('click', () => {
      tabBar.querySelectorAll('.customize-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      sectionMap.forEach((section, key) => {
        section.classList.toggle('active', key === config.key);
      });
      soundManager.play('menu_click');
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

  const bgSection = document.createElement('div');
  bgSection.className = 'customize-section';
  bgSection.dataset.section = 'bg';
  const bgGrid = document.createElement('div');
  bgGrid.className = 'customize-grid';
  BACKGROUNDS.forEach(bg => {
    const item = document.createElement('div');
    item.className = 'customize-bg-item customize-design-item';
    item.dataset.id = bg.id;

    const preview = document.createElement('div');
    preview.className = 'customize-bg-preview customize-design-preview';
    preview.style.background = bg.base;
    preview.style.borderRadius = '8px';
    preview.style.position = 'relative';
    preview.style.overflow = 'hidden';
    preview.innerHTML = bgPreviewSVG(bg.id);
    item.appendChild(preview);

    const label = document.createElement('div');
    label.style.fontSize = '11px';
    label.style.textAlign = 'center';
    label.style.marginTop = '4px';
    label.style.opacity = '0.85';
    label.textContent = bg.name;
    item.appendChild(label);

    if (bg.id === state.background) item.classList.add('selected');
    item.addEventListener('click', () => onSelectBackground && onSelectBackground(bg.id));
    bgGrid.appendChild(item);
  });
  bgSection.appendChild(bgGrid);
  list.appendChild(bgSection);
  sectionMap.set('bg', bgSection);
}

function bgPreviewSVG(id: string): string {
  switch (id) {
    case 'starfield':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><circle cx="10" cy="12" r="1" fill="white"/><circle cx="35" cy="20" r="1.5" fill="white"/><circle cx="50" cy="40" r="1" fill="white"/><circle cx="20" cy="48" r="1.2" fill="white"/><circle cx="42" cy="8" r="0.8" fill="white"/></svg>`;
    case 'nebula':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><defs><radialGradient id="n1" cx="0.3" cy="0.4"><stop offset="0%" stop-color="#7c3aed" stop-opacity="0.7"/><stop offset="100%" stop-color="#7c3aed" stop-opacity="0"/></radialGradient><radialGradient id="n2" cx="0.7" cy="0.7"><stop offset="0%" stop-color="#db2777" stop-opacity="0.7"/><stop offset="100%" stop-color="#db2777" stop-opacity="0"/></radialGradient></defs><rect width="60" height="60" fill="url(#n1)"/><rect width="60" height="60" fill="url(#n2)"/><circle cx="20" cy="20" r="0.8" fill="white"/><circle cx="45" cy="35" r="1" fill="white"/></svg>`;
    case 'deep':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><defs><radialGradient id="p1" cx="0.3" cy="0.5"><stop offset="0%" stop-color="#fbbf24"/><stop offset="60%" stop-color="#7c2d12"/><stop offset="100%" stop-color="#000"/></radialGradient></defs><circle cx="20" cy="32" r="14" fill="url(#p1)"/><circle cx="45" cy="15" r="0.8" fill="white"/><circle cx="50" cy="48" r="1" fill="white"/></svg>`;
    case 'grid':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><g stroke="#22d3ee" stroke-opacity="0.45" stroke-width="0.5" fill="none"><path d="M0 15H60M0 30H60M0 45H60M15 0V60M30 0V60M45 0V60"/></g><line x1="0" y1="40" x2="60" y2="40" stroke="#e879f9" stroke-width="1"/></svg>`;
    case 'aurora':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><defs><linearGradient id="a1" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#10b981" stop-opacity="0.6"/><stop offset="100%" stop-color="#10b981" stop-opacity="0"/></linearGradient><linearGradient id="a2" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#a78bfa" stop-opacity="0.5"/><stop offset="100%" stop-color="#a78bfa" stop-opacity="0"/></linearGradient></defs><path d="M0 25 Q15 15 30 22 T60 20 L60 60 L0 60Z" fill="url(#a1)"/><path d="M0 35 Q15 28 30 32 T60 30 L60 60 L0 60Z" fill="url(#a2)"/></svg>`;
    case 'crimson':
      return `<svg viewBox="0 0 60 60" style="width:100%;height:100%"><defs><radialGradient id="c1" cx="0.5" cy="0.4"><stop offset="0%" stop-color="#dc2626" stop-opacity="0.6"/><stop offset="100%" stop-color="#160506" stop-opacity="0"/></radialGradient></defs><rect width="60" height="60" fill="url(#c1)"/><circle cx="15" cy="50" r="0.8" fill="#fecaca"/><circle cx="48" cy="20" r="1" fill="#fecaca"/></svg>`;
    default:
      return '';
  }
}
