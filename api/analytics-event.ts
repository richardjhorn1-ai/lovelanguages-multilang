/**
 * Analytics Event API
 *
 * Stores user events in Supabase for per-user journey tracking.
 * Works alongside GA4 for richer, queryable analytics.
 *
 * Auth-optional: accepts pre-login events (anonymous_id).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || '';

// Allowlist of valid event names (prevents arbitrary data injection)
const ALLOWED_EVENTS = new Set([
  // Onboarding
  'page_view', 'signup_started', 'signup_completed', 'onboarding_step', 'onboarding_completed',
  'role_selected', 'language_selected', 'plan_selected',
  // Chat
  'chat_message', 'chat_response', 'chat_message_sent', 'chat_response_received',
  'voice_session_started', 'voice_session_ended',
  'session_start', 'first_chat_message', 'tts_played',
  // Games
  'game_started', 'game_completed', 'first_game_completed', 'first_game_played',
  // Vocabulary
  'word_added', 'first_word_added', 'words_extracted',
  // Level tests
  'level_test_started', 'level_test_completed',
  // Subscription
  'checkout_started', 'subscription_activated', 'subscription_completed',
  'subscription_failed', 'trial_started',
  // Retention
  'partner_invited', 'partner_joined', 'streak_maintained', 'streak_broken',
  // Churn
  'error_encountered', 'error_occurred', 'feature_abandoned', 'account_deleted',
  // General
  'app_installed', 'theme_changed', 'language_switched',
  'feature_used', 'cta_click', 'app_store_click',
  'paywall_view', 'paywall_dismissed',
  'challenge_created', 'challenge_completed', 'word_practiced',
  'trial_converted', 'trial_expired',
]);

// Max event_params size (10KB)
const MAX_PARAMS_SIZE = 10 * 1024;

export const config = {
  runtime: 'edge',
};

function corsHeaders(): Record<string, string> {
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Max-Age': '86400',
  };
}

export default async function handler(request: Request) {
  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers: corsHeaders() });
  }

  // Only accept POST
  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
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
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // Validate event name against allowlist
    if (!ALLOWED_EVENTS.has(event_name)) {
      return new Response(JSON.stringify({ error: 'Invalid event_name' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // Cap event_params size
    const paramsStr = JSON.stringify(event_params);
    if (paramsStr.length > MAX_PARAMS_SIZE) {
      return new Response(JSON.stringify({ error: 'event_params too large' }), {
        status: 400,
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    // Create client per request (Edge Runtime doesn't persist module state reliably)
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

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
        headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('Analytics event error:', e);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders(), 'Content-Type': 'application/json' },
    });
  }
}
