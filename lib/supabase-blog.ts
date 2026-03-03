/**
 * Supabase client for blog queries (anonymous, no auth)
 *
 * Separate from lib/supabase-server.ts which uses createServerClient with
 * cookie-based auth. Blog queries are all public reads — no user session needed.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.warn('Blog Supabase: credentials not found in environment');
}

export const supabaseBlog = createClient(supabaseUrl, supabaseKey);
