import { createClient } from '@supabase/supabase-js';

// CORS configuration
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

        // Language configuration for Polish with English translation
        language_config: {
          languages: ['pl'],  // Polish
          code_switching: false,
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
        error: 'Failed to initialize Listen Mode',
        details: errorText
      });
    }

    const gladiaSession = await gladiaResponse.json();

    console.log(`[gladia-token] Created Gladia session ${gladiaSession.id} for user ${auth.userId}`);

    // Return the WebSocket URL to the frontend
    // The URL contains an embedded token, so the frontend can connect directly
    // without needing the API key
    return res.status(200).json({
      sessionId: gladiaSession.id,
      websocketUrl: gladiaSession.url,
      userId: auth.userId,
    });

  } catch (error: any) {
    console.error('Gladia token error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
