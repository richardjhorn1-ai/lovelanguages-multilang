import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { extractLanguages, getProfileLanguages } from '../utils/language-helpers.js';

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

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Block free users
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'gladiaToken', sub.plan as 'standard' | 'unlimited');
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    // Parse request body
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: 'Invalid JSON format' });
      }
    }

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    let { targetLanguage, nativeLanguage } = extractLanguages(body || {});

    // If not provided in body, fall back to user's profile
    if (!body?.targetLanguage || !body?.nativeLanguage) {
      const profileLangs = await getProfileLanguages(supabase, auth.userId);
      targetLanguage = body?.targetLanguage || profileLangs.targetLanguage;
      nativeLanguage = body?.nativeLanguage || profileLangs.nativeLanguage;
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

        // Language configuration - detect both target and native language with code switching
        language_config: {
          languages: [targetLanguage, nativeLanguage],  // Dynamic language pair
          code_switching: true,  // Allow switching between languages mid-conversation
        },

        // Real-time processing options
        realtime_processing: {
          // Enable translation to native language
          translation: true,
          translation_config: {
            target_languages: [nativeLanguage],  // Translate to native language
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

    console.log(`[gladia-token] Created Gladia session ${gladiaSession.id} for user ${auth.userId.substring(0, 8)}... (${targetLanguage}→${nativeLanguage})`);

    // Increment usage after success
    incrementUsage(supabase, auth.userId, RATE_LIMITS.gladiaToken.type);

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
