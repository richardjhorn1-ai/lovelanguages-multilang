import { createClient } from '@supabase/supabase-js';
import { createHash } from 'crypto';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  getSubscriptionPlan,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { getTTSLangCode, getTTSVoice } from '../constants/language-config.js';
import { extractLanguages } from '../utils/language-helpers.js';

// Generate hash for cache key - includes userId to prevent cross-user cache sharing
function generateCacheKey(text: string, userId: string): string {
  // Include userId in hash to ensure users don't share cached audio
  // This prevents potential privacy issues if sensitive text is synthesized
  const hash = createHash('sha256').update(`${userId}:${text.toLowerCase().trim()}`).digest('hex');
  return hash.substring(0, 16); // Use first 16 chars for shorter filenames
}

export function buildCacheLogContext(sanitizedText: string) {
  return {
    length: sanitizedText.length,
    hash: createHash('sha256').update(sanitizedText).digest('hex'),
  };
}

// Google Cloud TTS API
async function synthesizeSpeech(text: string, apiKey: string, languageCode: string): Promise<Buffer> {
  const url = `https://texttospeech.googleapis.com/v1/text:synthesize?key=${apiKey}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      input: { text },
      voice: {
        languageCode: getTTSLangCode(languageCode),  // Dynamic: 'pl-PL', 'es-ES', etc.
        name: getTTSVoice(languageCode),             // Dynamic: 'pl-PL-Standard-A', etc.
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

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Get user's plan (free users get limited access, not blocked)
    const plan = await getSubscriptionPlan(supabase, auth.userId);

    // Check rate limit based on plan
    const limit = await checkRateLimit(supabase, auth.userId, 'tts', plan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
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

    // Extract language - check languageCode first (legacy), then standard extraction
    // This ensures backward compatibility with older clients
    const { targetLanguage } = body.languageCode
      ? { targetLanguage: body.languageCode }
      : extractLanguages(body);

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Sanitize and limit text length (Google TTS has limits)
    const sanitizedText = text.trim().substring(0, 500);
    if (!sanitizedText) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // Generate cache key with user_id to prevent cross-user cache sharing
    const cacheKey = generateCacheKey(sanitizedText, auth.userId);
    const fileName = `${targetLanguage}/${cacheKey}.mp3`;

    // Check if cached audio exists
    const { data: existingFile } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600); // 1 hour signed URL

    if (existingFile?.signedUrl) {
      console.log('[tts] Cache hit', buildCacheLogContext(sanitizedText));
      return res.status(200).json({
        url: existingFile.signedUrl,
        cached: true,
      });
    }

    // Cache miss - generate audio
    console.log('[tts] Cache miss, generating audio', buildCacheLogContext(sanitizedText));

    // Track usage for new TTS generation (not cache hits)
    incrementUsage(supabase, auth.userId, RATE_LIMITS.tts.type);

    const audioBuffer = await synthesizeSpeech(sanitizedText, apiKey, targetLanguage);

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
    console.error('[tts] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate speech. Please try again.',
    });
  }
}
