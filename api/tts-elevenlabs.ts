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
import { extractLanguages } from '../utils/language-helpers.js';
import { LANGUAGE_CONFIGS } from '../constants/language-config.js';

/**
 * ElevenLabs TTS API Endpoint
 *
 * Higher-quality text-to-speech using ElevenLabs v3 model.
 * Supports all 18 app languages with natural, expressive voices.
 *
 * Use cases:
 * - Languages not well supported by Google Cloud TTS
 * - Languages not available in Gemini Live
 * - Premium TTS quality for subscribers
 */

// ElevenLabs voice IDs for each language
// Using high-quality voices from the ElevenLabs library
// These can be customized per language for best results
const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string }> = {
  // Default voice for languages without specific mapping
  default: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },

  // Romance languages
  en: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  es: { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  fr: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Nicole' },
  it: { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Arnold' },
  pt: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  ro: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },

  // Germanic languages
  de: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  nl: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  sv: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  no: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  da: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },

  // Slavic languages
  pl: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  cs: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  ru: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  uk: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },

  // Other European
  el: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  hu: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  tr: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
};

// Map language codes to ElevenLabs language codes (ISO 639-1)
function getElevenLabsLangCode(languageCode: string): string {
  const config = LANGUAGE_CONFIGS[languageCode];
  if (!config) return 'en';

  // ElevenLabs uses ISO 639-1 codes
  return languageCode;
}

// Generate cache key
function generateCacheKey(text: string, userId: string, languageCode: string): string {
  const hash = createHash('sha256')
    .update(`elevenlabs:${userId}:${languageCode}:${text.toLowerCase().trim()}`)
    .digest('hex');
  return hash.substring(0, 16);
}

// Call ElevenLabs TTS API
async function synthesizeWithElevenLabs(
  text: string,
  apiKey: string,
  languageCode: string
): Promise<Buffer> {
  const voiceConfig = ELEVENLABS_VOICES[languageCode] || ELEVENLABS_VOICES.default;
  const langCode = getElevenLabsLangCode(languageCode);

  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceConfig.voiceId}`,
    {
      method: 'POST',
      headers: {
        'xi-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        model_id: 'eleven_multilingual_v2', // Best quality + 29 language support
        language_code: langCode, // Enforce language
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.3,
          use_speaker_boost: true,
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[tts-elevenlabs] API error:', response.status, errorText);
    throw new Error(`ElevenLabs TTS failed: ${response.status}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
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

    // Get user's plan - ElevenLabs could be premium-only if desired
    const plan = await getSubscriptionPlan(supabase, auth.userId);

    // Check rate limit (using same TTS limits)
    const limit = await checkRateLimit(supabase, auth.userId, 'tts', plan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      });
    }

    // Check API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[tts-elevenlabs] ELEVENLABS_API_KEY not found');
      return res.status(500).json({ error: 'ElevenLabs TTS service not configured' });
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
    const { targetLanguage } = extractLanguages(body);

    if (!text || typeof text !== 'string') {
      return res.status(400).json({ error: 'Text is required' });
    }

    // Sanitize and limit text length (ElevenLabs has ~5000 char limit)
    const sanitizedText = text.trim().substring(0, 1000);
    if (!sanitizedText) {
      return res.status(400).json({ error: 'Text cannot be empty' });
    }

    // Generate cache key
    const cacheKey = generateCacheKey(sanitizedText, auth.userId, targetLanguage);
    const fileName = `elevenlabs/${targetLanguage}/${cacheKey}.mp3`;

    // Check if cached audio exists
    const { data: existingFile } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (existingFile?.signedUrl) {
      console.log('[tts-elevenlabs] Cache hit for', targetLanguage);
      return res.status(200).json({
        url: existingFile.signedUrl,
        cached: true,
        provider: 'elevenlabs',
      });
    }

    // Cache miss - generate audio
    console.log('[tts-elevenlabs] Generating audio for', targetLanguage, '- text length:', sanitizedText.length);

    // Track usage
    incrementUsage(supabase, auth.userId, RATE_LIMITS.tts.type);

    const audioBuffer = await synthesizeWithElevenLabs(sanitizedText, apiKey, targetLanguage);

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('tts-cache')
      .upload(fileName, audioBuffer, {
        contentType: 'audio/mpeg',
        upsert: true,
      });

    if (uploadError) {
      console.error('[tts-elevenlabs] Upload error:', uploadError);
      // Still return the audio even if caching fails
      const base64Audio = audioBuffer.toString('base64');
      return res.status(200).json({
        audioData: base64Audio,
        cached: false,
        cacheError: true,
        provider: 'elevenlabs',
      });
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[tts-elevenlabs] Signed URL error:', signedUrlError);
      const base64Audio = audioBuffer.toString('base64');
      return res.status(200).json({
        audioData: base64Audio,
        cached: false,
        provider: 'elevenlabs',
      });
    }

    console.log('[tts-elevenlabs] Audio generated and cached successfully');
    return res.status(200).json({
      url: signedUrlData.signedUrl,
      cached: false,
      provider: 'elevenlabs',
    });

  } catch (error: any) {
    console.error('[tts-elevenlabs] Error:', error);
    return res.status(500).json({
      error: 'Failed to generate speech with ElevenLabs. Please try again.',
    });
  }
}
