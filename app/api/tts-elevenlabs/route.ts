import { NextResponse } from 'next/server';
import { createHash } from 'crypto';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  getSubscriptionPlan,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '@/utils/api-middleware';
import { LANGUAGE_CONFIGS, isLanguageSupported } from '@/constants/language-config';

/**
 * ElevenLabs TTS API Endpoint
 *
 * Higher-quality text-to-speech using ElevenLabs v3 model.
 * Supports all 18 app languages with natural, expressive voices.
 */

// ElevenLabs voice IDs for each language
const ELEVENLABS_VOICES: Record<string, { voiceId: string; name: string }> = {
  default: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  en: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  es: { voiceId: 'ErXwobaYiN019PkySvjV', name: 'Antoni' },
  fr: { voiceId: 'ThT5KcBeYPX3keUQqHPh', name: 'Nicole' },
  it: { voiceId: 'VR6AewLTigWG4xSOukaG', name: 'Arnold' },
  pt: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  ro: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  de: { voiceId: 'pNInz6obpgDQGcFmaJgB', name: 'Adam' },
  nl: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  sv: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  no: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  da: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  pl: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  cs: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  ru: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  uk: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  el: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  hu: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
  tr: { voiceId: 'EXAVITQu4vr4xnSDxMaL', name: 'Bella' },
};

// Map language codes to ElevenLabs language codes (ISO 639-1)
function getElevenLabsLangCode(languageCode: string): string {
  const config = LANGUAGE_CONFIGS[languageCode];
  if (!config) return 'en';
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
        model_id: 'eleven_multilingual_v2',
        language_code: langCode,
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

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Get user's plan
    const plan = await getSubscriptionPlan(supabase, auth.userId);

    // Check rate limit (using same TTS limits)
    const limit = await checkRateLimit(supabase, auth.userId, 'tts', plan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt,
      }, { status: 429, headers: corsHeaders });
    }

    // Check API key
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.error('[tts-elevenlabs] ELEVENLABS_API_KEY not found');
      return NextResponse.json({ error: 'ElevenLabs TTS service not configured' }, { status: 500, headers: corsHeaders });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders });
    }

    const { text } = body || {};

    // Extract target language directly
    const targetLanguage = body.languageCode || body.targetLanguage;
    if (!targetLanguage || !isLanguageSupported(targetLanguage)) {
      return NextResponse.json({ error: 'Valid targetLanguage is required' }, { status: 400, headers: corsHeaders });
    }

    if (!text || typeof text !== 'string') {
      return NextResponse.json({ error: 'Text is required' }, { status: 400, headers: corsHeaders });
    }

    // Sanitize and limit text length (ElevenLabs has ~5000 char limit)
    const sanitizedText = text.trim().substring(0, 1000);
    if (!sanitizedText) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({
        url: existingFile.signedUrl,
        cached: true,
        provider: 'elevenlabs',
      }, { status: 200, headers: corsHeaders });
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
      const base64Audio = audioBuffer.toString('base64');
      return NextResponse.json({
        audioData: base64Audio,
        cached: false,
        cacheError: true,
        provider: 'elevenlabs',
      }, { status: 200, headers: corsHeaders });
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[tts-elevenlabs] Signed URL error:', signedUrlError);
      const base64Audio = audioBuffer.toString('base64');
      return NextResponse.json({
        audioData: base64Audio,
        cached: false,
        provider: 'elevenlabs',
      }, { status: 200, headers: corsHeaders });
    }

    console.log('[tts-elevenlabs] Audio generated and cached successfully');
    return NextResponse.json({
      url: signedUrlData.signedUrl,
      cached: false,
      provider: 'elevenlabs',
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[tts-elevenlabs] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate speech with ElevenLabs. Please try again.',
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}
