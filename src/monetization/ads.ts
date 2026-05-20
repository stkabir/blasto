interface BlastoAdMobNative {
  initialize(options: { appId: string }): Promise<{ value: boolean }>;
  showBanner(options: { adId?: string }): Promise<{ value: boolean }>;
  hideBanner(): Promise<{ value: boolean }>;
  prepareRewardVideoAd(options: { adId?: string }): Promise<{ value: boolean }>;
  showRewardVideoAd(): Promise<{ value: boolean }>;
  addListener(eventName: string, listenerFunc: (info: any) => void): { remove: () => void };
  removeAllListeners?(): void;
}

const AD_UNIT_IDS = {
  reward: 'ca-app-pub-2603532225773045/8696982352',
  banner: 'ca-app-pub-2603532225773045/1397910983',
};

let plugin: BlastoAdMobNative | null = null;
let initialized = false;
let rewardAdLoaded = false;

function getPlugin(): BlastoAdMobNative | null {
  if (plugin) return plugin;
  try {
    if (typeof (window as any).Capacitor !== 'undefined') {
      const { Capacitor } = window as any;
      const plugins = Capacitor.Plugins || {};
      if (plugins.BlastoAdMob) {
        plugin = plugins.BlastoAdMob as BlastoAdMobNative;
        return plugin;
      }
    }
  } catch { }
  return null;
}

export function isNative(): boolean {
  return getPlugin() !== null;
}

export async function initAds(): Promise<void> {
  const p = getPlugin();
  if (!p || initialized) return;

  try {
    initialized = true;
    preloadRewardAd();
  } catch (e) {
    console.warn('[Ads] Init failed:', e);
  }
}

export async function preloadBanner(): Promise<void> {
  const p = getPlugin();
  if (!p) return;

  try {
    await p.showBanner({ adId: AD_UNIT_IDS.banner });
  } catch { }
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

export async function preloadRewardAd(): Promise<void> {
  const p = getPlugin();
  if (!p) return;

  try {
    await p.prepareRewardVideoAd({ adId: AD_UNIT_IDS.reward });
    rewardAdLoaded = true;
  } catch {
    rewardAdLoaded = false;
  }
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

  const rewardedListener = p.addListener('onRewarded', () => {
    if (resolved) return;
    resolved = true;
    rewardedListener.remove();
    closedListener.remove();
    onResult({ rewarded: true });
    preloadRewardAd();
  });

  const closedListener = p.addListener('onRewardedVideoAdClosed', () => {
    if (resolved) return;
    resolved = true;
    rewardedListener.remove();
    closedListener.remove();
    onResult({ rewarded: false });
    preloadRewardAd();
  });

  p.showRewardVideoAd().catch(() => {
    if (resolved) return;
    resolved = true;
    rewardedListener.remove();
    closedListener.remove();
    onResult({ rewarded: true });
    preloadRewardAd();
  });
}
