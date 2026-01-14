-- Add haptics preference to profiles table
-- This allows users to enable/disable haptic feedback in the native app

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS haptics_enabled BOOLEAN DEFAULT true;

-- Comment for documentation
COMMENT ON COLUMN profiles.haptics_enabled IS 'Whether haptic feedback is enabled for native app (iOS/Android)';
