import { Capacitor, registerPlugin } from '@capacitor/core';
import { IAP_PRODUCTS, type IAPProductId } from './unlocks.js';

interface NativeProduct {
  productId: string;
  title?: string;
  description?: string;
  price?: string;
  priceMicros?: number;
  currencyCode?: string;
}

interface PurchaseEvent {
  productId: string;
  purchaseToken: string;
  orderId?: string;
  acknowledged?: boolean;
}

interface PurchaseErrorEvent {
  productId?: string;
  code: number;
  message?: string;
  cancelled?: boolean;
}

interface BlastoBillingNative {
  initialize(): Promise<{ value: boolean }>;
  queryProducts(options: { productIds: string[] }): Promise<{ products: NativeProduct[] }>;
  purchase(options: { productId: string }): Promise<{ value: boolean }>;
  acknowledge(options: { purchaseToken: string; consume: boolean }): Promise<{ value: boolean }>;
  restorePurchases(): Promise<{ purchases: PurchaseEvent[] }>;
  addListener(eventName: string, listenerFunc: (info: any) => void): { remove: () => void };
}

const PRODUCT_IDS = Object.keys(IAP_PRODUCTS) as IAPProductId[];
const CONSUMABLE_IDS = new Set<string>(['lives_5', 'lives_20']);

const BlastoBillingPlugin = registerPlugin<BlastoBillingNative>('BlastoBilling');

let initialized = false;
let initPromise: Promise<boolean> | null = null;
const productCache = new Map<string, NativeProduct>();

function getPlugin(): BlastoBillingNative | null {
  if (!Capacitor.isNativePlatform()) return null;
  return BlastoBillingPlugin;
}

export function isBillingAvailable(): boolean {
  return Capacitor.isNativePlatform();
}

export async function initBilling(): Promise<boolean> {
  const p = getPlugin();
  if (!p) return false;
  if (initialized) return true;
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      await p.initialize();
    } catch (e) {
      console.warn('[billing] BillingClient setup failed', e);
      initPromise = null;
      return false;
    }
    try {
      const res = await p.queryProducts({ productIds: PRODUCT_IDS });
      for (const prod of res.products || []) {
        productCache.set(prod.productId, prod);
      }
      console.log('[billing] productos cargados:', productCache.size, '/', PRODUCT_IDS.length);
    } catch (e) {
      console.warn('[billing] queryProducts falló (productos no creados en Play Console?):', e);
    }
    initialized = true;
    return true;
  })();

  return initPromise;
}

export function getProductInfo(id: IAPProductId): { price: string; title: string; description: string } {
  const cached = productCache.get(id);
  const fallback = IAP_PRODUCTS[id];
  return {
    price: cached?.price ?? `$${fallback.price.toFixed(2)}`,
    title: cached?.title ?? fallback.name,
    description: cached?.description ?? fallback.desc,
  };
}

export interface PurchaseResult {
  success: boolean;
  cancelled?: boolean;
  error?: string;
}

export async function purchase(id: IAPProductId): Promise<PurchaseResult> {
  const p = getPlugin();
  if (!p) return { success: false, error: 'Billing not available' };

  const ok = await initBilling();
  if (!ok) return { success: false, error: 'Play Store no disponible. Instala la app desde Play Store (testing track), no por sideload.' };

  return new Promise<PurchaseResult>((resolve) => {
    let done = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const cleanup = () => {
      if (timeoutId) { clearTimeout(timeoutId); timeoutId = null; }
      updatedListener.remove();
      errorListener.remove();
    };

    const finish = (result: PurchaseResult) => {
      if (done) return;
      done = true;
      cleanup();
      resolve(result);
    };

    const updatedListener = p.addListener('onPurchaseUpdated', async (ev: PurchaseEvent) => {
      if (ev.productId !== id) return;
      try {
        await p.acknowledge({
          purchaseToken: ev.purchaseToken,
          consume: CONSUMABLE_IDS.has(id),
        });
      } catch (e) {
        console.warn('[billing] acknowledge failed', e);
      }
      finish({ success: true });
    });

    const errorListener = p.addListener('onPurchaseError', (ev: PurchaseErrorEvent) => {
      if (ev.productId && ev.productId !== id) return;
      if (ev.cancelled || ev.code === 1) {
        finish({ success: false, cancelled: true });
      } else {
        finish({ success: false, error: ev.message || `code ${ev.code}` });
      }
    });

    timeoutId = setTimeout(() => finish({ success: false, error: 'timeout' }), 120000);

    p.purchase({ productId: id }).catch((e) => {
      finish({ success: false, error: String(e) });
    });
  });
}

export async function restorePurchases(): Promise<string[]> {
  const p = getPlugin();
  if (!p) return [];
  const ok = await initBilling();
  if (!ok) return [];
  try {
    const res = await p.restorePurchases();
    const ids: string[] = [];
    for (const purch of res.purchases || []) {
      ids.push(purch.productId);
      if (!purch.acknowledged && !CONSUMABLE_IDS.has(purch.productId)) {
        try {
          await p.acknowledge({ purchaseToken: purch.purchaseToken, consume: false });
        } catch { }
      }
    }
    return ids;
  } catch (e) {
    console.warn('[billing] restore failed', e);
    return [];
  }
}
