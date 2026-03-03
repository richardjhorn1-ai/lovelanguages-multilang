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
import { getTTSLangCode, getTTSVoice, isLanguageSupported } from '@/constants/language-config';

// Generate hash for cache key - includes userId to prevent cross-user cache sharing
function generateCacheKey(text: string, userId: string): string {
  const hash = createHash('sha256').update(`${userId}:${text.toLowerCase().trim()}`).digest('hex');
  return hash.substring(0, 16);
}

function buildCacheLogContext(sanitizedText: string) {
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
        languageCode: getTTSLangCode(languageCode),
        name: getTTSVoice(languageCode),
      },
      audioConfig: {
        audioEncoding: 'MP3',
        speakingRate: 0.9,
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

    // Get user's plan (free users get limited access, not blocked)
    const plan = await getSubscriptionPlan(supabase, auth.userId);

    // Check rate limit based on plan
    const limit = await checkRateLimit(supabase, auth.userId, 'tts', plan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    // Check API key
    const apiKey = process.env.GOOGLE_CLOUD_TTS_API_KEY;
    if (!apiKey) {
      console.error('[tts] GOOGLE_CLOUD_TTS_API_KEY not found');
      return NextResponse.json({ error: 'TTS service not configured' }, { status: 500, headers: corsHeaders });
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

    // Sanitize and limit text length (Google TTS has limits)
    const sanitizedText = text.trim().substring(0, 500);
    if (!sanitizedText) {
      return NextResponse.json({ error: 'Text cannot be empty' }, { status: 400, headers: corsHeaders });
    }

    // Generate cache key with user_id to prevent cross-user cache sharing
    const cacheKey = generateCacheKey(sanitizedText, auth.userId);
    const fileName = `${targetLanguage}/${cacheKey}.mp3`;

    // Check if cached audio exists
    const { data: existingFile } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (existingFile?.signedUrl) {
      console.log('[tts] Cache hit', buildCacheLogContext(sanitizedText));
      return NextResponse.json({
        url: existingFile.signedUrl,
        cached: true,
      }, { status: 200, headers: corsHeaders });
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
      const base64Audio = audioBuffer.toString('base64');
      return NextResponse.json({
        audioData: base64Audio,
        cached: false,
        cacheError: true,
      }, { status: 200, headers: corsHeaders });
    }

    // Get signed URL for the uploaded file
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from('tts-cache')
      .createSignedUrl(fileName, 3600);

    if (signedUrlError || !signedUrlData?.signedUrl) {
      console.error('[tts] Signed URL error:', signedUrlError);
      const base64Audio = audioBuffer.toString('base64');
      return NextResponse.json({
        audioData: base64Audio,
        cached: false,
      }, { status: 200, headers: corsHeaders });
    }

    console.log('[tts] Audio generated and cached successfully');
    return NextResponse.json({
      url: signedUrlData.signedUrl,
      cached: false,
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[tts] Error:', error);
    return NextResponse.json({
      error: 'Failed to generate speech. Please try again.',
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}
