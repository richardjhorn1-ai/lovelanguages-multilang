/**
 * Analytics Event API
 *
 * Stores user events in Supabase for per-user journey tracking.
 * Works alongside GA4 for richer, queryable analytics.
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Create admin client for inserting events
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Ensure table exists (runs once on cold start)
let tableChecked = false;
async function ensureTable() {
  if (tableChecked) return;

  try {
    // Check if table exists by trying to select from it
    const { error } = await supabase
      .from('analytics_events')
      .select('id')
      .limit(1);

    if (error && error.code === '42P01') {
      // Table doesn't exist, create it
      const { error: createError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS public.analytics_events (
            id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
            anonymous_id text,
            event_name text NOT NULL,
            event_params jsonb DEFAULT '{}',
            page_path text,
            referrer text,
            session_id text,
            created_at timestamptz DEFAULT now()
          );

          CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);
          CREATE INDEX IF NOT EXISTS idx_analytics_events_event_name ON public.analytics_events(event_name);
          CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
        `
      });

      if (createError) {
        console.error('Failed to create analytics_events table:', createError);
      }
    }

    tableChecked = true;
  } catch (e) {
    console.error('Error checking analytics table:', e);
  }
}

export const config = {
  runtime: 'edge',
};

export default async function handler(request: Request) {
  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const body = await request.json();
    const {
      user_id,
      anonymous_id,
      event_name,
      event_params = {},
      page_path,
      referrer,
      session_id,
    } = body;

    if (!event_name) {
      return new Response(JSON.stringify({ error: 'event_name required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Ensure table exists
    await ensureTable();

    // Insert event
    const { error } = await supabase
      .from('analytics_events')
      .insert({
        user_id: user_id || null,
        anonymous_id: anonymous_id || null,
        event_name,
        event_params,
        page_path,
        referrer,
        session_id,
      });

    if (error) {
      console.error('Failed to insert analytics event:', error);
      return new Response(JSON.stringify({ error: 'Failed to store event' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Analytics event error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
