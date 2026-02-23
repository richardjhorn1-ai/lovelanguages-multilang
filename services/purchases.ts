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

// RevenueCat types — imported dynamically to avoid loading on web
type RCPackage = {
  identifier: string;
  packageType: string;
  product: {
    identifier: string;
    title: string;
    description: string;
    priceString: string;
    price: number;
    currencyCode: string;
  };
};

type RCOfferings = {
  current: {
    identifier: string;
    availablePackages: RCPackage[];
  } | null;
  all: Record<string, any>;
};

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
const RC_API_KEY = import.meta.env.VITE_REVENUECAT_API_KEY || '';

// Map App Store product IDs to our plan names
const PRODUCT_TO_PLAN: Record<string, { plan: 'standard' | 'unlimited'; period: 'weekly' | 'monthly' | 'yearly' }> = {
  'standard_weekly': { plan: 'standard', period: 'weekly' },
  'standard_monthly': { plan: 'standard', period: 'monthly' },
  'standard_yearly': { plan: 'standard', period: 'yearly' },
  'unlimited_weekly': { plan: 'unlimited', period: 'weekly' },
  'unlimited_monthly': { plan: 'unlimited', period: 'monthly' },
  'unlimited_yearly': { plan: 'unlimited', period: 'yearly' },
};

// Entitlement IDs configured in RevenueCat dashboard
const ENTITLEMENTS = {
  STANDARD: 'standard_access',
  UNLIMITED: 'unlimited_access',
} as const;

let isConfigured = false;
let purchasesModule: any = null;

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

  try {
    purchasesModule = await import('@revenuecat/purchases-capacitor');
    const { Purchases } = purchasesModule;

    await Purchases.configure({
      apiKey: RC_API_KEY,
      appUserID: userId,
    });

    isConfigured = true;
    console.log('[Purchases] RevenueCat configured for user:', userId);
  } catch (err) {
    console.error('[Purchases] Failed to configure RevenueCat:', err);
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
export async function getOfferings(): Promise<RCOfferings | null> {
  if (!isConfigured || !purchasesModule) return null;
  try {
    const { Purchases } = purchasesModule;
    const { offerings } = await Purchases.getOfferings();
    return offerings;
  } catch (err) {
    console.error('[Purchases] Failed to get offerings:', err);
    return null;
  }
}

/**
 * Purchase a package
 * Returns customer info on success, or null on failure/cancellation
 */
export async function purchasePackage(pkg: RCPackage): Promise<RCCustomerInfo | null> {
  if (!isConfigured || !purchasesModule) return null;
  try {
    const { Purchases } = purchasesModule;
    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg });
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
  if (!isConfigured || !purchasesModule) return null;
  try {
    const { Purchases } = purchasesModule;
    const { customerInfo } = await Purchases.restorePurchases();
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
  if (!isConfigured || !purchasesModule) return null;
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
  const activeEntitlements = customerInfo.entitlements.active;

  if (activeEntitlements[ENTITLEMENTS.UNLIMITED]?.isActive) {
    return {
      isActive: true,
      plan: 'unlimited',
      expirationDate: activeEntitlements[ENTITLEMENTS.UNLIMITED].expirationDate,
    };
  }

  if (activeEntitlements[ENTITLEMENTS.STANDARD]?.isActive) {
    return {
      isActive: true,
      plan: 'standard',
      expirationDate: activeEntitlements[ENTITLEMENTS.STANDARD].expirationDate,
    };
  }

  return { isActive: false, plan: null, expirationDate: null };
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
  } catch (err) {
    console.error('[Purchases] Failed to log out:', err);
  }
}
