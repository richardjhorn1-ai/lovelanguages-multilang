-- Migration: Add font customization columns to profiles table
-- Adds font preset (style) and font weight settings

-- Add font customization columns
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS font_preset TEXT DEFAULT 'classic',
ADD COLUMN IF NOT EXISTS font_weight TEXT DEFAULT 'regular';

-- Add check constraints for valid values
-- Using DO block to handle case where constraints may already exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_font_preset'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT valid_font_preset
        CHECK (font_preset IS NULL OR font_preset IN ('classic', 'modern', 'playful'));
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'valid_font_weight'
    ) THEN
        ALTER TABLE profiles
        ADD CONSTRAINT valid_font_weight
        CHECK (font_weight IS NULL OR font_weight IN ('light', 'regular', 'bold'));
    END IF;
END $$;
