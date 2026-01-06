-- Add smart_validation setting to profiles
-- When true, uses AI to validate answers (accepts synonyms, typos, articles)
-- When false, uses strict string matching

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS smart_validation BOOLEAN DEFAULT true;

-- Add comment for documentation
COMMENT ON COLUMN profiles.smart_validation IS 'When true, uses AI-powered answer validation that accepts synonyms, minor typos, and article variations. When false, uses strict exact matching.';
