const UNLOCKS_KEY = 'blasto_unlocks';

export interface PremiumItem {
  type: 'design' | 'bullet' | 'background';
  id: string;
  name: string;
  color?: string;
  price: number;
}

export const PREMIUM_DESIGNS: PremiumItem[] = [
  { type: 'design', id: 'phoenix', name: 'Fénix', color: '#f97316', price: 0.99 },
  { type: 'design', id: 'viper', name: 'Víbora', color: '#84cc16', price: 0.99 },
  { type: 'design', id: 'falcon', name: 'Halcón', color: '#38bdf8', price: 0.99 },
];

export const PREMIUM_BULLETS: PremiumItem[] = [
  { type: 'bullet', id: 'vortex', name: 'Vórtice', color: '#a855f7', price: 0.99 },
  { type: 'bullet', id: 'plasma', name: 'Plasma', color: '#ef4444', price: 0.99 },
];

export const PREMIUM_BACKGROUNDS: PremiumItem[] = [
  { type: 'background', id: 'inferno', name: 'Infierno', color: '#dc2626', price: 0.99 },
  { type: 'background', id: 'abyss', name: 'Abismo', color: '#1e40af', price: 0.99 },
  { type: 'background', id: 'paradise', name: 'Paraíso', color: '#059669', price: 0.99 },
];

export const IAP_PRODUCTS = {
  remove_ads: { id: 'remove_ads', name: 'Sin anuncios', price: 2.99, desc: 'Elimina todos los anuncios para siempre' },
  lives_5: { id: 'lives_5', name: '5 Vidas', price: 0.99, desc: '5 vidas extra para tus partidas' },
  lives_20: { id: 'lives_20', name: '20 Vidas', price: 2.99, desc: '20 vidas extra para tus partidas' },
  design_pack: { id: 'design_pack', name: 'Pack Diseños', price: 1.99, desc: '3 diseños de nave premium' },
  bullet_pack: { id: 'bullet_pack', name: 'Pack Disparos', price: 1.49, desc: '2 estilos de disparo premium' },
  bg_pack: { id: 'bg_pack', name: 'Pack Fondos', price: 1.49, desc: '3 fondos premium' },
  mega_pack: { id: 'mega_pack', name: 'Mega Pack', price: 5.99, desc: 'Todo: sin anuncios + todos los premium' },
} as const;

export type IAPProductId = keyof typeof IAP_PRODUCTS;

export interface UnlockState {
  designs: string[];
  bullets: string[];
  backgrounds: string[];
  removeAds: boolean;
}

function getState(): UnlockState {
  try {
    const raw = localStorage.getItem(UNLOCKS_KEY);
    if (raw) return JSON.parse(raw);
  } catch { }
  return { designs: [], bullets: [], backgrounds: [], removeAds: false };
}

function saveState(state: UnlockState): void {
  localStorage.setItem(UNLOCKS_KEY, JSON.stringify(state));
}

export function isPurchased(type: 'design' | 'bullet' | 'background' | 'removeAds', id?: string): boolean {
  const state = getState();

  if (type === 'removeAds') return state.removeAds;

  if (type === 'design') return state.designs.includes(id!);
  if (type === 'bullet') return state.bullets.includes(id!);
  if (type === 'background') return state.backgrounds.includes(id!);

  return false;
}

export function hasRemoveAds(): boolean {
  return getState().removeAds;
}

export function buyDesign(id: string): void {
  const state = getState();
  if (!state.designs.includes(id)) {
    state.designs.push(id);
    saveState(state);
  }
}

export function buyBullet(id: string): void {
  const state = getState();
  if (!state.bullets.includes(id)) {
    state.bullets.push(id);
    saveState(state);
  }
}

export function buyBackground(id: string): void {
  const state = getState();
  if (!state.backgrounds.includes(id)) {
    state.backgrounds.push(id);
    saveState(state);
  }
}

export function buyRemoveAds(): void {
  const state = getState();
  state.removeAds = true;
  saveState(state);
}

export function buyMegaPack(): void {
  const state = getState();
  state.designs = PREMIUM_DESIGNS.map(d => d.id);
  state.bullets = PREMIUM_BULLETS.map(b => b.id);
  state.backgrounds = PREMIUM_BACKGROUNDS.map(b => b.id);
  state.removeAds = true;
  saveState(state);
}

export function getLivesBalance(): number {
  try {
    const raw = localStorage.getItem('blasto_lives');
    return raw ? parseInt(raw, 10) : 0;
  } catch {
    return 0;
  }
}

export function setLivesBalance(count: number): void {
  localStorage.setItem('blasto_lives', String(Math.max(0, count)));
}

export function addLives(amount: number): void {
  const current = getLivesBalance();
  setLivesBalance(current + amount);
}

export function consumeLife(): boolean {
  const current = getLivesBalance();
  if (current > 0) {
    setLivesBalance(current - 1);
    return true;
  }
  return false;
}

export function grantProduct(id: IAPProductId): void {
  switch (id) {
    case 'remove_ads':
      buyRemoveAds();
      break;
    case 'lives_5':
      addLives(5);
      break;
    case 'lives_20':
      addLives(20);
      break;
    case 'design_pack':
      for (const d of PREMIUM_DESIGNS) buyDesign(d.id);
      break;
    case 'bullet_pack':
      for (const b of PREMIUM_BULLETS) buyBullet(b.id);
      break;
    case 'bg_pack':
      for (const bg of PREMIUM_BACKGROUNDS) buyBackground(bg.id);
      break;
    case 'mega_pack':
      buyMegaPack();
      break;
  }
}
