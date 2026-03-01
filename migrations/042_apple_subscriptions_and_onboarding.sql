-- Apple Sign In + In-App Purchases + Onboarding Persistence
-- Required for iOS App Store submission

-- =====================================================
-- 1. Onboarding progress persistence (cross-device resume)
-- =====================================================

-- Store onboarding progress so users can resume across devices
-- Previously only stored in localStorage (lost on device switch or cache clear)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_progress JSONB;

COMMENT ON COLUMN profiles.onboarding_progress IS 'Current onboarding step and collected data for cross-device resume. Cleared on completion.';

-- =====================================================
-- 2. Subscription source tracking (Stripe vs App Store)
-- =====================================================

-- Track which payment system manages the active subscription
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_source TEXT DEFAULT 'stripe';

COMMENT ON COLUMN profiles.subscription_source IS 'Payment source: stripe (web) or app_store (iOS IAP via RevenueCat)';

-- =====================================================
-- 3. RevenueCat customer ID
-- =====================================================

-- Store RevenueCat customer ID for cross-referencing subscriptions
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS revenuecat_customer_id TEXT;

CREATE INDEX IF NOT EXISTS idx_profiles_revenuecat_customer
  ON profiles(revenuecat_customer_id)
  WHERE revenuecat_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.revenuecat_customer_id IS 'RevenueCat customer ID for iOS in-app purchase tracking';
