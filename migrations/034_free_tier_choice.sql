-- Track when user chose free tier (allows them to enter app)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS free_tier_chosen_at timestamptz;

COMMENT ON COLUMN profiles.free_tier_chosen_at IS 'When user chose the free tier on subscription screen. If set, user can access app with free limits.';

CREATE INDEX IF NOT EXISTS idx_profiles_free_tier_chosen ON profiles(free_tier_chosen_at) WHERE free_tier_chosen_at IS NOT NULL;
