import { useEffect, useState } from 'react';

import {
  checkIntroEligibility,
  findRevenueCatPackage,
  getRevenueCatPackageProductId,
  isIAPAvailable,
  loadRevenueCatCatalog,
  type RCPackage,
} from '../services/purchases';
import type { BillingPeriod, PaidPlanId } from '../services/subscription-pricing';

type NativePaidPlanId = PaidPlanId;

export function useNativePaywall() {
  const enabled = isIAPAvailable();
  const [packages, setPackages] = useState<RCPackage[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);
  const [introEligible, setIntroEligible] = useState(false);

  const syncCatalog = async (isActive?: () => boolean) => {
    if (!enabled) {
      setPackages([]);
      setLoading(false);
      setError(null);
      setIntroEligible(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const catalog = await loadRevenueCatCatalog();
      if (isActive && !isActive()) return;
      setPackages(catalog.packages);
      setError(catalog.packages.length > 0 ? null : catalog.errorMessage);

      if (catalog.packages.some((pkg) => pkg.product?.identifier === 'standard_monthly')) {
        const eligible = await checkIntroEligibility();
        if (isActive && !isActive()) return;
        setIntroEligible(eligible);
      } else {
        setIntroEligible(false);
      }
    } finally {
      if (isActive && !isActive()) return;
      setLoading(false);
    }
  };

  const refresh = async () => {
    await syncCatalog();
  };

  useEffect(() => {
    let active = true;

    void syncCatalog(() => active);

    return () => {
      active = false;
    };
  }, [enabled]);

  const getPackageFor = (plan: NativePaidPlanId, billingPeriod: BillingPeriod) => {
    const productId = `${plan}_${billingPeriod}`;
    const matched = packages.find((pkg) => getRevenueCatPackageProductId(pkg) === productId) || null;

    if (!matched) {
      console.warn('[NativePaywall] Package not found', {
        plan,
        billingPeriod,
        productId,
        availableProductIds: packages.map((pkg) => getRevenueCatPackageProductId(pkg)).filter(Boolean),
        loading,
        error,
      });
    }

    return matched;
  };

  const resolvePackageFor = async (plan: NativePaidPlanId, billingPeriod: BillingPeriod) => {
    const cached = getPackageFor(plan, billingPeriod);
    if (cached) {
      console.log('[NativePaywall] Using cached package', {
        plan,
        billingPeriod,
        productId: getRevenueCatPackageProductId(cached),
        packageId: cached.identifier,
      });
      return cached;
    }

    const productId = `${plan}_${billingPeriod}`;
    const freshPackage = await findRevenueCatPackage(productId);

    if (freshPackage) {
      console.log('[NativePaywall] Resolved fresh package', {
        plan,
        billingPeriod,
        requestedProductId: productId,
        resolvedProductId: getRevenueCatPackageProductId(freshPackage),
        packageId: freshPackage.identifier,
      });
      setPackages((current) => {
        if (
          current.some(
            (pkg) =>
              getRevenueCatPackageProductId(pkg) === getRevenueCatPackageProductId(freshPackage)
          )
        ) {
          return current;
        }
        return [...current, freshPackage];
      });
      setError(null);
      return freshPackage;
    }

    console.warn('[NativePaywall] Failed to resolve package', {
      plan,
      billingPeriod,
      requestedProductId: productId,
      availableProductIds: packages.map((pkg) => getRevenueCatPackageProductId(pkg)).filter(Boolean),
      availablePackageIds: packages.map((pkg) => pkg.identifier).filter(Boolean),
    });

    return null;
  };

  return {
    useIAP: enabled,
    packages,
    loading,
    error,
    introEligible,
    refresh,
    getPackageFor,
    resolvePackageFor,
  };
}
