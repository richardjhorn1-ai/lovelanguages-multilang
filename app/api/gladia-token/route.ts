import { NextResponse } from 'next/server';
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  SubscriptionPlan,
} from '@/utils/api-middleware';
import { extractLanguages, getProfileLanguages } from '@/utils/language-helpers';

export async function OPTIONS(request: Request) {
  return handleCorsPreflightResponse(request);
}

export async function POST(request: Request) {
  const corsHeaders = getCorsHeaders(request);

  try {
    // Verify authentication
    const auth = await verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: corsHeaders });
    }

    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Check subscription access
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'gladiaToken', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: 'Invalid JSON format' }, { status: 400, headers: corsHeaders });
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
      return NextResponse.json({ error: 'Listen Mode not configured' }, { status: 500, headers: corsHeaders });
    }

    // Step 1: Call Gladia API to initiate a live session
    const gladiaResponse = await fetch('https://api.gladia.io/v2/live', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-gladia-key': gladiaApiKey,
      },
      body: JSON.stringify({
        encoding: 'wav/pcm',
        sample_rate: 16000,
        bit_depth: 16,
        channels: 1,
        model: 'solaria-1',
        language_config: {
          languages: [targetLanguage, nativeLanguage],
          code_switching: true,
        },
        pre_processing: {
          audio_enhancer: true,
          speech_threshold: 0.75,
        },
        realtime_processing: {
          translation: true,
          translation_config: {
            target_languages: [nativeLanguage],
            model: 'enhanced',
          },
        },
        post_processing: {
          summarization: true,
          summarization_config: { type: 'concise' },
        },
        messages_config: {
          receive_partial_transcripts: true,
          receive_final_transcripts: true,
          receive_speech_events: true,
          receive_pre_processing_events: false,
          receive_realtime_processing_events: true,
          receive_post_processing_events: true,
          receive_acknowledgments: false,
        },
        endpointing: 1.0,
        maximum_duration_without_endpointing: 10,
      }),
    });

    if (!gladiaResponse.ok) {
      const errorText = await gladiaResponse.text();
      console.error('Gladia API error:', gladiaResponse.status, errorText);
      return NextResponse.json({
        error: `Failed to initialize Listen Mode: ${errorText}`
      }, { status: 500, headers: corsHeaders });
    }

    const gladiaSession = await gladiaResponse.json();

    console.log(`[gladia-token] Created Gladia session ${gladiaSession.id} for user ${auth.userId.substring(0, 8)}... (${targetLanguage}->${nativeLanguage})`);

    return NextResponse.json({
      sessionId: gladiaSession.id,
      websocketUrl: gladiaSession.url,
      userId: auth.userId,
      targetLanguage,
      nativeLanguage,
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error('[gladia-token] Error:', error);
    return NextResponse.json({ error: 'Failed to start listen mode. Please try again.' }, { status: 500, headers: getCorsHeaders(request) });
  }
}
