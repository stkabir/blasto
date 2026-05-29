import { Capacitor, registerPlugin } from '@capacitor/core';

interface BlastoAdMobNative {
  initialize(options: { appId: string }): Promise<{ value: boolean }>;
  showBanner(options?: { adId?: string }): Promise<{ value: boolean }>;
  hideBanner(): Promise<{ value: boolean }>;
  prepareRewardVideoAd(options?: { adId?: string }): Promise<{ value: boolean }>;
  showRewardVideoAd(): Promise<{ value: boolean }>;
  addListener(eventName: string, listenerFunc: (info: any) => void): { remove: () => void };
  removeAllListeners?(): void;
}

const AD_UNIT_IDS = {
  reward: 'ca-app-pub-2603532225773045/8696982352',
  banner: 'ca-app-pub-2603532225773045/1397910983',
};

const BlastoAdMobPlugin = registerPlugin<BlastoAdMobNative>('BlastoAdMob');

let initialized = false;

function getPlugin(): BlastoAdMobNative | null {
  if (!Capacitor.isNativePlatform()) return null;
  return BlastoAdMobPlugin;
}

export function isNative(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initAds(): Promise<void> {
  const p = getPlugin();
  if (!p || initialized) return;
  initialized = true;
  try { await p.prepareRewardVideoAd({ adId: AD_UNIT_IDS.reward }); } catch { }
}

export async function preloadBanner(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.showBanner({ adId: AD_UNIT_IDS.banner }); } catch { }
}

export async function hideBanner(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.hideBanner(); } catch { }
}

export async function showBanner(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try { await p.showBanner({ adId: AD_UNIT_IDS.banner }); } catch { }
}

async function preloadRewardAd(): Promise<void> {
  const p = getPlugin();
  if (!p) return;
  try {
    await p.prepareRewardVideoAd({ adId: AD_UNIT_IDS.reward });
  } catch { }
}

export interface RewardAdResult {
  rewarded: boolean;
}

export function showRewardAd(onResult: (result: RewardAdResult) => void): void {
  const p = getPlugin();
  if (!p) {
    onResult({ rewarded: true });
    return;
  }

  let resolved = false;
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const cleanup = () => {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
    rewardedListener.remove();
    closedListener.remove();
    failedListener.remove();
    showingListener.remove();
  };

  const finish = (rewarded: boolean) => {
    if (resolved) return;
    resolved = true;
    cleanup();
    onResult({ rewarded });
    preloadRewardAd();
  };

  const rewardedListener = p.addListener('onRewarded', () => finish(true));
  const closedListener = p.addListener('onRewardedVideoAdClosed', () => finish(false));
  const failedListener = p.addListener('onRewardedVideoAdFailedToLoad', () => finish(false));
  const showingListener = p.addListener('onRewardedVideoAdShowing', () => {
    if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
  });

  timeoutId = setTimeout(() => finish(false), 15000);

  (async () => {
    try {
      await p.showRewardVideoAd();
    } catch {
      finish(false);
    }
  })();
}
