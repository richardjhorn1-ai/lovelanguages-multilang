import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0 && allowedOrigins[0] !== '*') {
    // No match - set origin for debugging, but browser will block without credentials
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    // Note: NOT setting credentials when origin doesn't match
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

  return req.method === 'OPTIONS';
}

// Verify user authentication
async function verifyAuth(req: any): Promise<{ userId: string } | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return null;
  }

  const token = authHeader.split(' ')[1];
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  // Handle CORS
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Rate limiting - Listen mode: blocked for non-subscribers, 120 min/month for standard, unlimited for unlimited
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    // Track if we need to increment usage (set after passing limit check)
    let shouldIncrementUsage = false;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user's subscription plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', auth.userId)
        .single();

      const isActive = profile?.subscription_status === 'active';
      const plan = isActive ? (profile?.subscription_plan || 'none') : 'none';

      // Listen mode limits (minutes per month)
      // Tracking sessions as ~3 min each: 120 min = ~40 sessions
      const LISTEN_LIMITS: Record<string, number | null> = {
        'none': 0,         // Non-subscribers: blocked
        'standard': 40,    // Standard: ~120 min (40 sessions × 3 min avg)
        'unlimited': null  // Unlimited: no limit
      };

      const sessionLimit = LISTEN_LIMITS[plan];

      // Block non-subscribers completely
      if (sessionLimit === 0) {
        return res.status(403).json({
          error: 'Listen mode requires a subscription. Please upgrade to Standard or Unlimited.',
          feature: 'listen_mode'
        });
      }

      // Check usage for standard plan
      if (sessionLimit !== null) {
        const currentMonth = new Date().toISOString().slice(0, 7);
        // Calculate proper date range (handles Feb, Apr, Jun, Sep, Nov correctly)
        const [year, month] = currentMonth.split('-').map(Number);
        const nextMonth = month === 12
          ? `${year + 1}-01`
          : `${year}-${String(month + 1).padStart(2, '0')}`;

        const { data: monthlyUsage } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', auth.userId)
          .eq('usage_type', 'listen_sessions')
          .gte('usage_date', `${currentMonth}-01`)
          .lt('usage_date', `${nextMonth}-01`);

        const currentCount = (monthlyUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);

        if (currentCount >= sessionLimit) {
          return res.status(429).json({
            error: 'Monthly listen mode limit reached (120 minutes). Upgrade to Unlimited for unlimited listening.',
            limit: sessionLimit,
            used: currentCount
          });
        }

        // Mark for increment - will happen after successful session creation
        // This prevents charging users when the API call fails
        shouldIncrementUsage = true;
      }
    }

    // Get Gladia API key from environment
    const gladiaApiKey = process.env.GLADIA_API_KEY;

    if (!gladiaApiKey) {
      console.error('GLADIA_API_KEY not configured');
      return res.status(500).json({ error: 'Listen Mode not configured' });
    }

    // Step 1: Call Gladia API to initiate a live session
    // This returns a WebSocket URL with embedded authentication token
    const gladiaResponse = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gladia-key': gladiaApiKey,
      },
      body: JSON.stringify({
        // Audio configuration - matches our AudioRecorder settings
        encoding: 'wav/pcm',
        sample_rate: 16000,
        bit_depth: 16,
        channels: 1,

        // Language configuration for Polish and English with code switching
        language_config: {
          languages: ['pl', 'en'],  // Detect both Polish and English
          code_switching: true,      // Allow switching between languages mid-conversation
        },

        // Real-time processing options
        realtime_processing: {
          // Enable translation to English
          translation: true,
          translation_config: {
            target_languages: ['en'],
          },
        },

        // Configure which messages we want to receive
        messages_config: {
          receive_partial_transcripts: true,
          receive_final_transcripts: true,
          receive_speech_events: true,
          receive_pre_processing_events: false,
          receive_realtime_processing_events: true,
          receive_post_processing_events: false,
          receive_acknowledgments: false,
        },

        // Endpointing - how long to wait for silence before finalizing
        endpointing: 0.5,  // 500ms silence = end of utterance

        // Note: Speaker diarization is NOT supported for live streaming API
        // All transcripts will be attributed to "speaker_0"
      }),
    });

    if (!gladiaResponse.ok) {
      const errorText = await gladiaResponse.text();
      console.error('Gladia API error:', gladiaResponse.status, errorText);
      return res.status(500).json({
        error: `Failed to initialize Listen Mode: ${errorText}`
      });
    }

    const gladiaSession = await gladiaResponse.json();

    console.log(`[gladia-token] Created Gladia session ${gladiaSession.id} for user ${auth.userId.substring(0, 8)}...`);

    // INCREMENT USAGE AFTER SUCCESS - only charged if we got here
    if (shouldIncrementUsage && supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);
      const today = new Date().toISOString().split('T')[0];

      const { data: todayUsage } = await supabase
        .from('usage_tracking')
        .select('count')
        .eq('user_id', auth.userId)
        .eq('usage_type', 'listen_sessions')
        .eq('usage_date', today)
        .single();

      // Non-blocking increment - don't fail the request if tracking fails
      (async () => {
        try {
          await supabase
            .from('usage_tracking')
            .upsert({
              user_id: auth.userId,
              usage_type: 'listen_sessions',
              usage_date: today,
              count: (todayUsage?.count || 0) + 1
            }, {
              onConflict: 'user_id,usage_type,usage_date'
            });
          console.log('[gladia-token] Usage incremented for user:', auth.userId.substring(0, 8) + '...');
        } catch (err: any) {
          console.error('[gladia-token] Usage tracking failed:', err.message);
        }
      })();
    }

    // Return the WebSocket URL to the frontend
    // SECURITY NOTE: The URL contains an embedded bearer token from Gladia.
    // This is Gladia's design - the token is:
    // - Short-lived (session-scoped, ~30 min expiry)
    // - Single-use for this WebSocket connection
    // - Not logged server-side (only session ID is logged)
    //
    // Frontend should NOT log the full URL. Error tracking services
    // should be configured to redact URL query parameters.
    return res.status(200).json({
      sessionId: gladiaSession.id,
      websocketUrl: gladiaSession.url,
      userId: auth.userId,
    });

  } catch (error: any) {
    console.error('[gladia-token] Error:', error);
    return res.status(500).json({ error: 'Failed to start listen mode. Please try again.' });
  }
}
