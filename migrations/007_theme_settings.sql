-- Migration: Add theme settings to profiles table
-- These settings allow users to persist their color/theme preferences across devices

-- Add theme columns to profiles
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS accent_color TEXT DEFAULT 'rose',
ADD COLUMN IF NOT EXISTS dark_mode TEXT DEFAULT 'off',
ADD COLUMN IF NOT EXISTS font_size TEXT DEFAULT 'medium';

-- Add check constraints for valid values
ALTER TABLE profiles
ADD CONSTRAINT valid_accent_color CHECK (accent_color IN ('rose', 'blush', 'lavender', 'wine', 'teal', 'honey')),
ADD CONSTRAINT valid_dark_mode CHECK (dark_mode IN ('off', 'midnight', 'charcoal', 'black')),
ADD CONSTRAINT valid_font_size CHECK (font_size IN ('small', 'medium', 'large'));
