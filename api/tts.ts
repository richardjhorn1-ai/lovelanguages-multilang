import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';

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
    console.error('[tts] Missing Supabase config for auth verification');
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    console.error('[tts] Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
}

// Generate hash for cache key
function generateCacheKey(text: string): string {
  const hash = createHash('sha256').update(text.toLowerCase().trim()).digest('hex');
  return hash.substring(0, 16); // Use first 16 chars for shorter filenames
}

// Google Cloud TTS API
async function synthesizeSpeech(text: string, apiKey: string): Promise<Buffer> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: 'pl-PL',
        name: 'pl-PL-Standard-A', // Female Polish voice
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9, // Slightly slower for learning
        pitch: 0.0,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[tts] Google Cloud TTS error:', errorText);
    throw new Error(`Google Cloud TTS failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.audioContent) {
    throw new Error('No audio content in response');
  }

  return Buffer.from(data.audioContent, 'base64');
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Check API key
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    if (!apiKey) {
      console.error('[tts] GOOGLE_CLOUD_TTS_API_KEY not found');
      return res.status(500).json({ error: 'TTS service not configured' });
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

    const { text } = body || {};

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Sanitize and limit text length (Google TTS has limits)
    const sanitizedText = text.trim().substring(0, 500);
    if (!sanitizedText) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // Generate cache key
    const cacheKey = generateCacheKey(sanitizedText);
    const fileName = `pl/${cacheKey}.mp3`;

    // Initialize Supabase client with service key for storage access
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Storage not configured' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check if cached audio exists
    const { data: existingFile } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600); // 1 hour signed URL

    if (existingFile?.signedUrl) {
      console.log('[tts] Cache hit for:', sanitizedText.substring(0, 20) + '...');
      return res.status(200).json({
        url: existingFile.signedUrl,
        cached: true,
      });
    }

    // Cache miss - generate audio
    console.log('[tts] Cache miss, generating audio for:', sanitizedText.substring(0, 20) + '...');

    const audioBuffer = await synthesizeSpeech(sanitizedText, apiKey);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('tts-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[tts] Upload error:', uploadError);
      // Still return the audio even if caching fails - serve it directly
      const base64Audio = audioBuffer.toString('base64');
      return res.status(200).json({
        audioData: base64Audio,
        cached: false,
        cacheError: true,
      });
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[tts] Signed URL error:', signedUrlError);
      // Fallback to base64
      const base64Audio = audioBuffer.toString('base64');
      return res.status(200).json({
        audioData: base64Audio,
        cached: false,
      });
    }

    console.log('[tts] Audio generated and cached successfully');
    return res.status(200).json({
      url: signedUrlData.signedUrl,
      cached: false,
    });

  } catch (error: any) {
    console.error('[tts] Error:', error.message || error);
    return res.status(500).json({
      error: error.message || 'Failed to generate speech',
    });
  }
}
