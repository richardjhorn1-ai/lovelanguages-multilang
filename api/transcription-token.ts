import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  SubscriptionPlan,
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

    // Check subscription access
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'transcriptionToken', sub.plan as SubscriptionPlan);
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

    // Extract language parameters
    let { targetLanguage, nativeLanguage } = extractLanguages(body || {});

    // If not provided in body, fall back to user's profile
    if (!body?.targetLanguage || !body?.nativeLanguage) {
      const profileLangs = await getProfileLanguages(supabase, auth.userId);
      targetLanguage = body?.targetLanguage || profileLangs.targetLanguage;
      nativeLanguage = body?.nativeLanguage || profileLangs.nativeLanguage;
    }

    // Get OpenAI API key from environment
    const openaiApiKey = process.env.OPENAI_API_KEY;

    if (!openaiApiKey) {
      console.error('OPENAI_API_KEY not configured');
      return res.status(500).json({ error: 'Listen Mode not configured' });
    }

    // Create an ephemeral client secret via OpenAI Realtime API.
    // The frontend uses this short-lived secret to connect directly to the browser WebSocket.
    const sessionResponse = await fetch('https://api.openai.com/v1/realtime/client_secrets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        session: {
          type: 'transcription',
          audio: {
            input: {
              format: {
                type: 'audio/pcm',
                rate: 24000,
              },
              noise_reduction: {
                type: 'near_field',
              },
              transcription: {
                model: 'gpt-4o-transcribe',
                // Omit language for auto-detect (supports code-switching between target & native)
              },
              turn_detection: {
                type: 'server_vad',
                threshold: 0.6,
                silence_duration_ms: 800,
                prefix_padding_ms: 300,
              },
            },
          },
        },
      }),
    });

    if (!sessionResponse.ok) {
      const errorText = await sessionResponse.text();
      console.error('OpenAI Realtime API error:', sessionResponse.status, errorText);
      return res.status(500).json({
        error: 'Failed to initialize Listen Mode'
      });
    }

    const tokenResult = await sessionResponse.json();
    const clientSecret =
      tokenResult?.value ||
      tokenResult?.client_secret?.value ||
      null;
    const sessionId =
      tokenResult?.session?.id ||
      tokenResult?.id ||
      'unknown';

    if (!clientSecret) {
      console.error('[transcription-token] Missing client secret in OpenAI response:', tokenResult);
      return res.status(500).json({ error: 'Failed to initialize Listen Mode' });
    }

    console.log(`[transcription-token] Created session ${sessionId} for user ${auth.userId.substring(0, 8)}... (${targetLanguage}→${nativeLanguage})`);

    // Usage is tracked in minutes by report-session-usage endpoint (not at session start)

    // Return the ephemeral token to the frontend
    // SECURITY NOTE: The client_secret is:
    // - Short-lived (expires in ~60 seconds)
    // - Single-use for one WebSocket connection
    // - Not logged server-side (only session ID is logged)
    return res.status(200).json({
      token: clientSecret,
      url: 'wss://api.openai.com/v1/realtime',
      targetLanguage,
      nativeLanguage,
    });

  } catch (error: any) {
    console.error('[transcription-token] Error:', error);
    return res.status(500).json({ error: 'Failed to start listen mode. Please try again.' });
  }
}
