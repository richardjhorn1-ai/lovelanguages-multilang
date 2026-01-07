-- Migration: 013_tts_cache_storage.sql
-- Creates storage bucket for TTS audio caching
-- Run this in Supabase SQL Editor

-- Create the storage bucket for TTS cache
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'tts-cache',
  'tts-cache',
  false,  -- Not public, use signed URLs
  1048576,  -- 1MB limit per file (MP3s are small)
  ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO NOTHING;

-- Policy: Allow authenticated users to read via signed URLs (handled by service role)
-- Note: We use service role key in the API, so no RLS policies needed for reads

-- Policy: Allow service role to upload (default behavior with service key)
-- The API uses SUPABASE_SERVICE_KEY which bypasses RLS

-- Optional: If you want to allow direct public access instead of signed URLs,
-- uncomment below and set bucket to public:
-- UPDATE storage.buckets SET public = true WHERE id = 'tts-cache';
-- CREATE POLICY "Public read access for tts-cache"
--   ON storage.objects FOR SELECT
--   USING (bucket_id = 'tts-cache');
