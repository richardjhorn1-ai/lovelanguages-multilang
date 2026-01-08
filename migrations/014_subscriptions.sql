-- Subscription system for Love Languages
-- Two tiers: Standard ($19/mo, $69/yr) and Unlimited ($39/mo, $139/yr)

-- =====================================================
-- 1. Add subscription columns to profiles
-- =====================================================

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(20) DEFAULT 'none';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(20) DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id VARCHAR(100);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_period VARCHAR(10); -- 'monthly' or 'yearly'
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_ends_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_started_at TIMESTAMPTZ;

-- Index for Stripe customer lookup
CREATE INDEX IF NOT EXISTS idx_profiles_stripe_customer ON profiles(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

COMMENT ON COLUMN profiles.subscription_plan IS 'Current plan: none, standard, unlimited';
COMMENT ON COLUMN profiles.subscription_status IS 'Status: inactive, active, past_due, canceled';
COMMENT ON COLUMN profiles.stripe_customer_id IS 'Stripe customer ID for this user';
COMMENT ON COLUMN profiles.subscription_period IS 'Billing period: monthly or yearly';
COMMENT ON COLUMN profiles.subscription_ends_at IS 'When current subscription period ends';

-- =====================================================
-- 2. Subscription plans reference table
-- =====================================================

CREATE TABLE subscription_plans (
  id VARCHAR(20) PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  price_monthly_cents INT NOT NULL,
  price_yearly_cents INT NOT NULL,
  features JSONB NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Insert the two plans
INSERT INTO subscription_plans (id, name, price_monthly_cents, price_yearly_cents, features) VALUES
('standard', 'Standard', 1900, 6900, '{
  "word_limit": 2000,
  "voice_minutes_per_month": 60,
  "listen_minutes_per_month": 30,
  "ai_challenges_per_day": null,
  "conversation_scenarios": "all",
  "partner_invite": true,
  "gift_pass": false
}'::jsonb),
('unlimited', 'Unlimited', 3900, 13900, '{
  "word_limit": null,
  "voice_minutes_per_month": null,
  "listen_minutes_per_month": null,
  "ai_challenges_per_day": null,
  "conversation_scenarios": "all",
  "partner_invite": true,
  "gift_pass": true
}'::jsonb);

COMMENT ON TABLE subscription_plans IS 'Reference table for subscription tier features and pricing';

-- =====================================================
-- 3. Subscription events log
-- =====================================================

CREATE TABLE subscription_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_type VARCHAR(50) NOT NULL,
  stripe_event_id VARCHAR(100),
  previous_plan VARCHAR(20),
  new_plan VARCHAR(20),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_subscription_events_user ON subscription_events(user_id, created_at DESC);
CREATE INDEX idx_subscription_events_stripe ON subscription_events(stripe_event_id) WHERE stripe_event_id IS NOT NULL;

-- Enable RLS
ALTER TABLE subscription_events ENABLE ROW LEVEL SECURITY;

-- Users can only view their own subscription events
CREATE POLICY "Users can view own subscription events"
  ON subscription_events FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert (webhooks)
CREATE POLICY "Service role can insert subscription events"
  ON subscription_events FOR INSERT
  WITH CHECK (true);

COMMENT ON TABLE subscription_events IS 'Audit log of subscription changes triggered by Stripe webhooks';
COMMENT ON COLUMN subscription_events.event_type IS 'Type: checkout_completed, subscription_updated, subscription_deleted, payment_failed';

-- =====================================================
-- 4. Gift passes for Unlimited yearly subscribers
-- =====================================================

CREATE TABLE gift_passes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_by UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  code VARCHAR(20) UNIQUE NOT NULL,
  plan VARCHAR(20) NOT NULL DEFAULT 'standard',
  duration_months INT NOT NULL DEFAULT 12,
  redeemed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  redeemed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_gift_passes_code ON gift_passes(code) WHERE redeemed_by IS NULL;
CREATE INDEX idx_gift_passes_creator ON gift_passes(created_by);

-- Enable RLS
ALTER TABLE gift_passes ENABLE ROW LEVEL SECURITY;

-- Users can view gift passes they created
CREATE POLICY "Users can view own gift passes"
  ON gift_passes FOR SELECT
  USING (auth.uid() = created_by);

-- Users can view gift passes they redeemed
CREATE POLICY "Users can view redeemed gift passes"
  ON gift_passes FOR SELECT
  USING (auth.uid() = redeemed_by);

COMMENT ON TABLE gift_passes IS 'Gift passes that Unlimited yearly subscribers can give to another couple';
COMMENT ON COLUMN gift_passes.code IS 'Unique redemption code (e.g., LOVE-XXXX-XXXX)';
COMMENT ON COLUMN gift_passes.duration_months IS 'How long the gift subscription lasts (default 12 months)';

-- =====================================================
-- 5. Usage tracking for rate limits
-- =====================================================

CREATE TABLE usage_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  usage_type VARCHAR(30) NOT NULL,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  count INT NOT NULL DEFAULT 0,
  UNIQUE(user_id, usage_type, usage_date)
);

CREATE INDEX idx_usage_tracking_user_date ON usage_tracking(user_id, usage_date);

-- Enable RLS
ALTER TABLE usage_tracking ENABLE ROW LEVEL SECURITY;

-- Users can view their own usage
CREATE POLICY "Users can view own usage"
  ON usage_tracking FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage all usage (API endpoints)
CREATE POLICY "Service role can manage usage"
  ON usage_tracking FOR ALL
  USING (true);

COMMENT ON TABLE usage_tracking IS 'Daily usage counters for rate-limited features';
COMMENT ON COLUMN usage_tracking.usage_type IS 'Type: voice_minutes, listen_minutes, words_added';
