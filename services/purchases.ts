/**
 * RevenueCat In-App Purchase Service
 *
 * Wraps @revenuecat/purchases-capacitor for iOS in-app purchases.
 * Only active on iOS — web uses Stripe (existing flow).
 *
 * Product IDs in App Store Connect must match:
 *   standard_weekly, standard_monthly, standard_yearly
 *   unlimited_weekly, unlimited_monthly, unlimited_yearly
 */

import { Capacitor } from '@capacitor/core';
import { apiFetch } from './api-config';
import { supabase } from './supabase';

// RevenueCat types — imported dynamically to avoid loading on web
export type RCPackage = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
    introPrice?: {
      priceString?: string;
      periodNumberOfUnits?: number;
      periodUnit?: string;
    } | null;
  };
};

export type RCOfferings = {
  current: {
    identifier: string;
    availablePackages: RCPackage[];
  } | null;
  all: Record<string, any>;
};

export type RevenueCatCatalogState = {
  offerings: RCOfferings | null;
  packages: RCPackage[];
  errorMessage: string | null;
  ready: boolean;
};

export function getRevenueCatPackageProductId(pkg: RCPackage): string | null {
  return pkg.product?.identifier || pkg.identifier || null;
}

type RCCustomerInfo = {
  activeSubscriptions: string[];
  entitlements: {
    active: Record<string, {
      identifier: string;
      productIdentifier: string;
      isActive: boolean;
      willRenew: boolean;
      expirationDate: string | null;
    }>;
    all: Record<string, any>;
  };
};

// RevenueCat API key — set in environment
const RC_API_KEY = String(import.meta.env.VITE_REVENUECAT_API_KEY || '').trim();

// Map App Store product IDs to our plan names
const PRODUCT_TO_PLAN: Record<string, { plan: 'standard' | 'unlimited'; period: 'weekly' | 'monthly' | 'yearly' }> = {
  'standard_weekly': { plan: 'standard', period: 'weekly' },
  'standard_monthly': { plan: 'standard', period: 'monthly' },
  'standard_yearly': { plan: 'standard', period: 'yearly' },
  'unlimited_weekly': { plan: 'unlimited', period: 'weekly' },
  'unlimited_monthly': { plan: 'unlimited', period: 'monthly' },
  'unlimited_yearly': { plan: 'unlimited', period: 'yearly' },
};

const ENTITLEMENT_ALIASES: Record<'standard' | 'unlimited', string[]> = {
  standard: ['standard_access', 'Standard'],
  unlimited: ['unlimited_access', 'Unlimited'],
};

let isConfigured = false;
let purchasesModule: any = null;
let configurePromise: Promise<void> | null = null;
const POSTHOG_USER_ATTRIBUTE_KEY = '$posthogUserId';

const GENERIC_CATALOG_ERROR =
  'Subscriptions are currently unavailable from the App Store on this device. Please try again in a moment or tap Restore Purchases if you already subscribed.';

export function describeOfferingsError(err: any): string {
  const code = String(err?.code || '');
  const message = String(err?.message || '').toLowerCase();

  if (
    code === '23' ||
    message.includes('offerings') ||
    message.includes('app store connect') ||
    message.includes('storekit') ||
    message.includes('product could not be fetched')
  ) {
    return GENERIC_CATALOG_ERROR;
  }

  return 'We could not load App Store subscriptions right now. Please try again in a moment.';
}

async function waitForPurchasesConfigured(timeoutMs = 4000): Promise<boolean> {
  if (isConfigured && purchasesModule) {
    return true;
  }

  const startedAt = Date.now();
  while (Date.now() - startedAt < timeoutMs) {
    await new Promise((resolve) => globalThis.setTimeout(resolve, 150));
    if (isConfigured && purchasesModule) {
      return true;
    }
  }

  return isConfigured && Boolean(purchasesModule);
}

async function fetchOfferingsRaw(): Promise<RCOfferings> {
  if (!purchasesModule) {
    throw new Error('Purchases module not initialized');
  }

  const { Purchases } = purchasesModule;
  const offerings = await Purchases.getOfferings();
  return offerings;
}

async function persistRevenueCatIdentity(appUserId: string): Promise<boolean> {
  try {
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token;
    if (!accessToken) {
      return false;
    }

    const response = await apiFetch('/api/revenuecat/sync-identity/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ revenuecatCustomerId: appUserId }),
      __llErrorContext: {
        screen: 'billing',
        userAction: 'sync_revenuecat_identity',
      },
    });

    return response.ok;
  } catch (error) {
    console.warn('[Purchases] Failed to persist RevenueCat identity:', error);
    return false;
  }
}

/**
 * Check if IAP is available (iOS native only)
 */
export function isIAPAvailable(): boolean {
  return Capacitor.getPlatform() === 'ios';
}

/**
 * Initialize RevenueCat — call once after user is authenticated
 */
export async function configurePurchases(userId: string): Promise<void> {
  if (!isIAPAvailable() || isConfigured) return;
  if (!RC_API_KEY) {
    console.warn('[Purchases] VITE_REVENUECAT_API_KEY not set');
    return;
  }

  if (configurePromise) {
    await configurePromise;
    return;
  }

  try {
    configurePromise = (async () => {
      purchasesModule = await import('@revenuecat/purchases-capacitor');
      const { Purchases } = purchasesModule;

      await Purchases.configure({
        apiKey: RC_API_KEY,
        appUserID: userId,
      });

      isConfigured = true;
      console.log('[Purchases] RevenueCat configured for user:', userId);
    })();

    await configurePromise;
  } catch (err) {
    console.error('[Purchases] Failed to configure RevenueCat:', err);
  } finally {
    configurePromise = null;
  }
}

/**
 * Identify user with RevenueCat (call when user logs in)
 */
export async function identifyUser(userId: string): Promise<void> {
  if (!isConfigured || !purchasesModule) return;
  try {
    const { Purchases } = purchasesModule;
    await Purchases.logIn({ appUserID: userId });
  } catch (err) {
    console.error('[Purchases] Failed to identify user:', err);
  }
}

/**
 * Get available offerings (packages with prices from App Store)
 */
export async function loadRevenueCatCatalog(timeoutMs = 4000): Promise<RevenueCatCatalogState> {
  if (!isIAPAvailable()) {
    return {
      offerings: null,
      packages: [],
      errorMessage: null,
      ready: false,
    };
  }

  const ready = await waitForPurchasesConfigured(timeoutMs);
  if (!ready) {
    return {
      offerings: null,
      packages: [],
      errorMessage: 'App Store subscriptions are still loading. Please try again in a moment.',
      ready: false,
    };
  }

  try {
    const offerings = await fetchOfferingsRaw();
    const packages = offerings?.current?.availablePackages || [];

    if (packages.length === 0) {
      return {
        offerings,
        packages,
        errorMessage: GENERIC_CATALOG_ERROR,
        ready: true,
      };
    }

    return {
      offerings,
      packages,
      errorMessage: null,
      ready: true,
    };
  } catch (err) {
    console.error('[Purchases] Failed to get offerings:', err);
    return {
      offerings: null,
      packages: [],
      errorMessage: describeOfferingsError(err),
      ready: true,
    };
  }
}

export async function findRevenueCatPackage(
  productId: string,
  timeoutMs = 4000
): Promise<RCPackage | null> {
  const catalog = await loadRevenueCatCatalog(timeoutMs);
  return catalog.packages.find((pkg) => getRevenueCatPackageProductId(pkg) === productId) || null;
}

export async function getOfferings(): Promise<RCOfferings | null> {
  const catalog = await loadRevenueCatCatalog();
  return catalog.offerings;
}

export async function getRevenueCatAppUserId(): Promise<string | null> {
  if (!isConfigured || !purchasesModule) return null;

  try {
    const { Purchases } = purchasesModule;
    const { appUserID } = await Purchases.getAppUserID();
    return typeof appUserID === 'string' && appUserID.trim().length > 0
      ? appUserID.trim()
      : null;
  } catch (err) {
    console.error('[Purchases] Failed to get RevenueCat app user ID:', err);
    return null;
  }
}

export async function syncRevenueCatIdentity(options: {
  posthogDistinctId?: string | null;
} = {}): Promise<{ appUserId: string | null; synced: boolean }> {
  if (!isConfigured || !purchasesModule) {
    return { appUserId: null, synced: false };
  }

  try {
    const { Purchases } = purchasesModule;

    if (options.posthogDistinctId) {
      await Purchases.setAttributes({
        [POSTHOG_USER_ATTRIBUTE_KEY]: options.posthogDistinctId,
      });
      await Purchases.syncAttributesAndOfferingsIfNeeded();
    }
  } catch (err) {
    console.warn('[Purchases] Failed to sync RevenueCat subscriber attributes:', err);
  }

  const appUserId = await getRevenueCatAppUserId();
  if (!appUserId) {
    return { appUserId: null, synced: false };
  }

  return {
    appUserId,
    synced: await persistRevenueCatIdentity(appUserId),
  };
}

/**
 * Purchase a package
 * Returns customer info on success, or null on failure/cancellation
 */
export async function purchasePackage(pkg: RCPackage): Promise<RCCustomerInfo | null> {
  const ready = await waitForPurchasesConfigured();
  if (!ready || !purchasesModule) {
    throw new Error('App Store purchases are still loading. Please try again in a moment.');
  }
  try {
    const { Purchases } = purchasesModule;
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
    void syncRevenueCatIdentity();
    return customerInfo;
  } catch (err: any) {
    // User cancelled purchase
    if (err?.code === '1' || err?.message?.includes('cancelled') || err?.message?.includes('canceled')) {
      console.log('[Purchases] User cancelled purchase');
      return null;
    }
    console.error('[Purchases] Purchase failed:', err);
    throw err;
  }
}

/**
 * Restore previous purchases (required by Apple for App Store)
 */
export async function restorePurchases(): Promise<RCCustomerInfo | null> {
  const ready = await waitForPurchasesConfigured();
  if (!ready || !purchasesModule) {
    throw new Error('App Store purchases are still loading. Please try again in a moment.');
  }
  try {
    const { Purchases } = purchasesModule;
    const { customerInfo } = await Purchases.restorePurchases();
    void syncRevenueCatIdentity();
    return customerInfo;
  } catch (err) {
    console.error('[Purchases] Failed to restore purchases:', err);
    throw err;
  }
}

/**
 * Get current customer info (subscription status)
 */
export async function getCustomerInfo(): Promise<RCCustomerInfo | null> {
  const ready = await waitForPurchasesConfigured();
  if (!ready || !purchasesModule) return null;
  try {
    const { Purchases } = purchasesModule;
    const { customerInfo } = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (err) {
    console.error('[Purchases] Failed to get customer info:', err);
    return null;
  }
}

/**
 * Check if user has an active entitlement
 */
export function hasActiveEntitlement(customerInfo: RCCustomerInfo): {
  isActive: boolean;
  plan: 'standard' | 'unlimited' | null;
  expirationDate: string | null;
} {
  const activeEntitlements = Object.values(customerInfo.entitlements.active || {}).filter(
    (entitlement) => entitlement?.isActive
  );

  const findEntitlementForPlan = (plan: 'standard' | 'unlimited') =>
    activeEntitlements.find((entitlement) => {
      const productPlan = getProductPlanInfo(entitlement.productIdentifier)?.plan;
      return productPlan === plan || ENTITLEMENT_ALIASES[plan].includes(entitlement.identifier);
    });

  const unlimitedEntitlement = findEntitlementForPlan('unlimited');
  if (unlimitedEntitlement) {
    return {
      isActive: true,
      plan: 'unlimited',
      expirationDate: unlimitedEntitlement.expirationDate,
    };
  }

  const standardEntitlement = findEntitlementForPlan('standard');
  if (standardEntitlement) {
    return {
      isActive: true,
      plan: 'standard',
      expirationDate: standardEntitlement.expirationDate,
    };
  }

  // Fallback to active subscriptions if RevenueCat entitlement IDs drift but products remain mapped.
  const activeSubscriptionPlans = (customerInfo.activeSubscriptions || [])
    .map((productId) => getProductPlanInfo(productId))
    .filter((planInfo): planInfo is NonNullable<typeof planInfo> => Boolean(planInfo));

  if (activeSubscriptionPlans.some((planInfo) => planInfo.plan === 'unlimited')) {
    return { isActive: true, plan: 'unlimited', expirationDate: null };
  }

  if (activeSubscriptionPlans.some((planInfo) => planInfo.plan === 'standard')) {
    return { isActive: true, plan: 'standard', expirationDate: null };
  }

  return {
    isActive: false,
    plan: null,
    expirationDate: null,
  };
}

/**
 * Check if the user is eligible for a free trial intro offer on standard_monthly.
 * Apple only allows one free trial per Apple ID per subscription group.
 */
export async function checkIntroEligibility(): Promise<boolean> {
  const ready = await waitForPurchasesConfigured();
  if (!ready || !purchasesModule) return false;
  try {
    const { Purchases } = purchasesModule;

    // Check per-user eligibility (Apple only allows one free trial per Apple ID per subscription group)
    const eligibility = await Purchases.checkTrialOrIntroductoryPriceEligibility({
      productIdentifiers: ['standard_monthly'],
    });

    const result = (eligibility as any)?.['standard_monthly'];
    // RevenueCat eligibility status: 0 = unknown, 1 = ineligible, 2 = eligible
    return result?.status === 2;
  } catch (err) {
    console.error('[Purchases] Intro eligibility check failed:', err);
    // Fallback: check if product has intro offer (less accurate but better than nothing)
    try {
      const offerings = await fetchOfferingsRaw();
      const pkg = offerings?.current?.availablePackages?.find(
        (p: any) => p.product?.identifier === 'standard_monthly'
      );
      return !!pkg?.product?.introPrice;
    } catch {
      return false;
    }
  }
}

/**
 * Map a product identifier to our plan/period
 */
export function getProductPlanInfo(productId: string): { plan: 'standard' | 'unlimited'; period: 'weekly' | 'monthly' | 'yearly' } | null {
  return PRODUCT_TO_PLAN[productId] || null;
}

/**
 * Log out from RevenueCat (call on sign out)
 */
export async function logOutPurchases(): Promise<void> {
  if (!isConfigured || !purchasesModule) return;
  try {
    const { Purchases } = purchasesModule;
    await Purchases.logOut();
    isConfigured = false;
    purchasesModule = null;
  } catch (err) {
    console.error('[Purchases] Failed to log out:', err);
    // Still reset state even if logOut fails to ensure clean re-init on next login
    isConfigured = false;
    purchasesModule = null;
  }
}
