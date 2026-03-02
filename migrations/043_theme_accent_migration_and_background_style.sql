-- Migration: Update accent color constraint for new palette + add background_style column
--
-- The accent color palette was refreshed:
--   Old: rose, blush, lavender, wine, teal, honey
--   New: rose, coral, honey, mint, ocean, wine
--   Mapping: blush→coral, lavender→ocean, teal→mint
--
-- Also adds the background_style column (tinted/clean) for the clean mode feature.

-- Step 1: Migrate existing rows from old accent names to new ones
UPDATE profiles SET accent_color = 'coral' WHERE accent_color = 'blush';
UPDATE profiles SET accent_color = 'ocean' WHERE accent_color = 'lavender';
UPDATE profiles SET accent_color = 'mint'  WHERE accent_color = 'teal';

-- Step 2: Drop old constraint and add updated one with new palette names
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS valid_accent_color;
ALTER TABLE profiles ADD CONSTRAINT valid_accent_color
  CHECK (accent_color IS NULL OR accent_color IN ('rose', 'coral', 'honey', 'mint', 'ocean', 'wine'));

-- Step 3: Add background_style column
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS background_style TEXT DEFAULT 'tinted';

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_background_style'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT valid_background_style
        CHECK (background_style IS NULL OR background_style IN ('tinted', 'clean'));
    END IF;
END $$;
