import { NextResponse } from 'next/server';
import { GoogleGenAI } from "@google/genai";
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  SubscriptionPlan,
} from '@/utils/api-middleware';
import { extractLanguages } from '@/utils/language-helpers';
import { getLanguageConfig, getLanguageName } from '@/constants/language-config';
import { fetchVocabularyContext, fetchKnownWordsList, formatVocabularyPromptSection } from '@/utils/vocabulary-context';

// Conversation scenario interface
interface ConversationScenario {
  id: string;
  name: string;
  persona: string;
  context: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

// Build conversation practice system instruction
function buildConversationSystemInstruction(
  scenario: ConversationScenario,
  userName: string,
  targetLanguage: string,
  nativeLanguage: string
): string {
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  return `
You are Cupid, helping ${userName} practice ${targetName} by role-playing as ${scenario.name}.

SCENARIO: ${scenario.context}
YOUR CHARACTER: ${scenario.persona}

HOW TO PLAY THIS:
- Speak in ${targetName} as your character - this is immersive practice
- Stay in character, keep responses short (1-3 sentences)
- Difficulty: ${scenario.difficulty}
- If they're struggling, step out briefly in ${nativeName} to help, then get back in character
- Remember: they're practicing to connect with someone they love

Start the conversation as your character.
`;
}

// Voice system instructions per mode
function buildVoiceSystemInstruction(
  mode: string,
  targetLanguage: string,
  nativeLanguage: string,
  vocabularySection: string
): string {
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  const COMMON = `
You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.

VOICE RULES:
- Speak primarily in ${nativeName}, then introduce ${targetName} words
- Pattern: ${nativeName} explanation -> ${targetName} word -> pronunciation
- Keep responses concise (2-3 sentences)
- Be encouraging and warm
`;

  const vocabBlock = vocabularySection ? `\n${vocabularySection}\n` : '';

  const MODES: Record<string, string> = {
    ask: `
${COMMON}
${vocabBlock}
ASK MODE - Casual Chat

You're catching up with them. Ask about their relationship, how things are going, what moments are coming up. Be curious.

"So how are things with you two? Any special moments coming up?"
"Want to learn something specific to say to them tonight?"

When they ask something, help them quickly and keep the conversation going.
`,
    learn: `
${COMMON}
${vocabBlock}
LEARN MODE - Voice Lesson

You're teaching them. Go slow, be clear.
- Say the word, pause, let them repeat
- Give pronunciation tips
- For verbs: one conjugation at a time
- Challenge them with words they need to practice
`,
    coach: `
You are Cupid - a warm, helpful teaching assistant for a ${targetName} native speaker who is teaching their partner.

The tutor is with their partner right now and needs quick help explaining something in ${targetName}.

HOW TO HELP:
- Give alternative ways to explain ${targetName} concepts
- Suggest simple phrases they can use with their partner
- Offer pronunciation tips they can pass on
- Keep responses SHORT (2-3 sentences) - they're mid-lesson!
- Speak in ${nativeName} so the tutor understands immediately

Be practical, concise, and supportive. They're teaching someone they love.
`
  };

  return MODES[mode] || MODES.ask;
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

    // Check subscription access
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Check rate limit
    const limit = await checkRateLimit(supabase, auth.userId, 'liveToken', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[live-token] API Configuration Error: GEMINI_API_KEY not found.");
      return NextResponse.json({ error: "Server Configuration Error: API key missing" }, { status: 500, headers: corsHeaders });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format" }, { status: 400, headers: corsHeaders });
    }

    const { mode = 'ask', conversationScenario, userName = 'Friend' } = body || {};

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(body);

    // Input validation to prevent prompt injection and cost/latency abuse
    const MAX_USERNAME_LENGTH = 50;
    const MAX_SCENARIO_FIELD_LENGTH = 500;

    // Validate and sanitize userName
    const sanitizedUserName = typeof userName === 'string'
      ? userName.trim().substring(0, MAX_USERNAME_LENGTH)
      : 'Friend';

    // Validate conversationScenario if provided
    let sanitizedScenario = conversationScenario;
    if (conversationScenario && typeof conversationScenario === 'object') {
      sanitizedScenario = {
        id: typeof conversationScenario.id === 'string' ? conversationScenario.id.substring(0, 50) : '',
        name: typeof conversationScenario.name === 'string' ? conversationScenario.name.substring(0, 100) : '',
        persona: typeof conversationScenario.persona === 'string' ? conversationScenario.persona.substring(0, MAX_SCENARIO_FIELD_LENGTH) : '',
        context: typeof conversationScenario.context === 'string' ? conversationScenario.context.substring(0, MAX_SCENARIO_FIELD_LENGTH) : '',
        difficulty: ['beginner', 'intermediate', 'advanced'].includes(conversationScenario.difficulty)
          ? conversationScenario.difficulty
          : 'beginner'
      };
    }

    // Fetch vocabulary context for personalized voice (tutor-aware: fetch partner's vocab if tutor)
    const { data: profileData } = await supabase
      .from('profiles')
      .select('role, linked_user_id')
      .eq('id', auth.userId)
      .single();

    const isTutor = profileData?.role === 'tutor';
    const vocabUserId = (isTutor && profileData?.linked_user_id) ? profileData.linked_user_id : auth.userId;

    const [vocabTier, knownWords] = await Promise.all([
      fetchVocabularyContext(supabase, vocabUserId, targetLanguage),
      fetchKnownWordsList(supabase, vocabUserId, targetLanguage),
    ]);
    const vocabularySection = formatVocabularyPromptSection(vocabTier, undefined, { knownWords });

    // Build mode-specific system instruction
    let systemInstruction: string;
    const voiceName = 'Kore';

    if (mode === 'conversation' && sanitizedScenario) {
      systemInstruction = buildConversationSystemInstruction(
        sanitizedScenario,
        sanitizedUserName,
        targetLanguage,
        nativeLanguage
      );
    } else {
      systemInstruction = buildVoiceSystemInstruction(
        mode,
        targetLanguage,
        nativeLanguage,
        vocabularySection
      );
    }

    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

    // Initialize Gemini client with v1alpha for Live API
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' }
    });

    // Create ephemeral token using the SDK
    const aiAny = ai as any;

    if (!aiAny.authTokens || typeof aiAny.authTokens.create !== 'function') {
      console.error('authTokens API not available in SDK');
      return NextResponse.json({
        error: 'Voice mode requires SDK version with authTokens support'
      }, { status: 500, headers: corsHeaders });
    }

    console.log('[live-token] Creating ephemeral token for model:', model, 'voice:', voiceName);

    const tokenResponse = await aiAny.authTokens.create({
      config: {
        uses: 1,
        httpOptions: { apiVersion: 'v1alpha' },
        liveConnectConstraints: {
          model: `models/${model}`,
          config: {
            responseModalities: ['AUDIO'],
            outputAudioTranscription: {},
            inputAudioTranscription: {},
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: {
                  voiceName: voiceName
                }
              }
            },
            systemInstruction: {
              parts: [{ text: systemInstruction }]
            }
          }
        }
      }
    });

    const tokenName = tokenResponse?.name;

    if (!tokenName) {
      console.error('[live-token] No token name in response:', tokenResponse);
      return NextResponse.json({ error: 'Failed to get token from response' }, { status: 500, headers: corsHeaders });
    }

    console.log('[live-token] Token created successfully for model:', model);

    return NextResponse.json({
      token: tokenName,
      model: model,
      voiceName: voiceName,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    }, { status: 200, headers: corsHeaders });

  } catch (error: any) {
    console.error("[live-token] Error:", error);
    return NextResponse.json({
      error: "Failed to start voice mode. Please try again."
    }, { status: 500, headers: getCorsHeaders(request) });
  }
}
