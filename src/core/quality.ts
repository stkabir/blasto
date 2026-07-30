import type { QualityTier, QualitySettings } from './performance.js';
import { getTierSettings } from './performance.js';

let currentTier: QualityTier = 'high';

export function setQualityTier(tier: QualityTier): void {
  currentTier = tier;
}

export function getQualityTier(): QualityTier {
  return currentTier;
}

export function getQualitySettings(): QualitySettings {
  return getTierSettings(currentTier);
}
