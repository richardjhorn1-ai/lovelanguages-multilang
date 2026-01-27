import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '../utils/api-middleware.js';
import { extractLanguages } from '../utils/language-helpers.js';
import { getLanguageConfig, getLanguageName } from '../constants/language-config.js';

// Learning journey context for personalized voice
interface LearningJourneyContext {
  level: string;
  totalWords: number;
  topicsExplored: string[];
  suggestions: string[];
  struggledWords: Array<{ word: string; translation: string }>;
}

async function getLearningJourneyContext(
  userId: string,
  targetLanguage: string,
  nativeLanguage: string
): Promise<LearningJourneyContext | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch latest progress summary for this language pair
  const { data: summary } = await supabase
    .from('progress_summaries')
    .select('level_at_time, words_learned, topics_explored, suggestions')
    .eq('user_id', userId)
    .eq('language_code', targetLanguage)
    .eq('native_language', nativeLanguage)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  // Fetch struggled words (high fail count)
  const { data: scores } = await supabase
    .from('word_scores')
    .select('fail_count, dictionary:word_id(word, translation, language_code)')
    .eq('user_id', userId)
    .gt('fail_count', 0)
    .order('fail_count', { ascending: false })
    .limit(10);

  const struggledWords = (scores || [])
    .filter((s: any) => s.dictionary?.language_code === targetLanguage)
    .slice(0, 5)
    .map((s: any) => ({
      word: s.dictionary?.word || '',
      translation: s.dictionary?.translation || ''
    }));

  if (!summary && struggledWords.length === 0) return null;

  return {
    level: summary?.level_at_time || 'Beginner 1',
    totalWords: summary?.words_learned || 0,
    topicsExplored: summary?.topics_explored || [],
    suggestions: summary?.suggestions || [],
    struggledWords
  };
}

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
  journeyContext: LearningJourneyContext | null
): string {
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);

  const COMMON = `
You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.

VOICE RULES:
- Speak primarily in ${nativeName}, then introduce ${targetName} words
- Pattern: ${nativeName} explanation → ${targetName} word → pronunciation
- Keep responses concise (2-3 sentences)
- Be encouraging and warm
`;

  const journeySection = journeyContext ? `
THEIR JOURNEY:
- Level: ${journeyContext.level} | Words learned: ${journeyContext.totalWords}
${journeyContext.struggledWords.length > 0 ? `- Needs practice: ${journeyContext.struggledWords.map(w => w.word).join(', ')}` : ''}
${journeyContext.suggestions.length > 0 ? `- Suggested focus: ${journeyContext.suggestions.slice(0, 2).join(', ')}` : ''}
` : '';

  const MODES: Record<string, string> = {
    ask: `
${COMMON}
${journeySection}
ASK MODE - Casual Chat

You're catching up with them. Ask about their relationship, how things are going, what moments are coming up. Be curious.

"So how are things with you two? Any special moments coming up?"
"Want to learn something specific to say to them tonight?"

When they ask something, help them quickly and keep the conversation going.
`,
    learn: `
${COMMON}
${journeySection}
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

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  console.log('[live-token] Request received');

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      console.log('[live-token] Auth failed');
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }
    console.log('[live-token] Auth successful for user:', auth.userId.substring(0, 8) + '...');

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
    const limit = await checkRateLimit(supabase, auth.userId, 'liveToken', sub.plan as SubscriptionPlan);
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        resetAt: limit.resetAt
      });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.error("[live-token] API Configuration Error: GEMINI_API_KEY not found.");
      return res.status(500).json({ error: "Server Configuration Error: API key missing" });
    }

    // Parse request body
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format" });
      }
    }

    const { mode = 'ask', userLog = [], conversationScenario, userName = 'Friend' } = body || {};

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(body);

    // Input validation to prevent prompt injection and cost/latency abuse
    const MAX_USERNAME_LENGTH = 50;
    const MAX_USERLOG_ITEMS = 30;
    const MAX_USERLOG_ITEM_LENGTH = 200;
    const MAX_SCENARIO_FIELD_LENGTH = 500;

    // Validate and sanitize userName
    const sanitizedUserName = typeof userName === 'string'
      ? userName.trim().substring(0, MAX_USERNAME_LENGTH)
      : 'Friend';

    // Validate and sanitize userLog (limit array size and item lengths)
    const sanitizedUserLog = Array.isArray(userLog)
      ? userLog
          .slice(0, MAX_USERLOG_ITEMS)
          .map(item => typeof item === 'string' ? item.substring(0, MAX_USERLOG_ITEM_LENGTH) : '')
          .filter(item => item.length > 0)
      : [];

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

    // Fetch learning journey context for personalized voice
    const journeyContext = await getLearningJourneyContext(auth.userId, targetLanguage, nativeLanguage);

    // Build mode-specific system instruction
    let systemInstruction: string;
    const voiceName = 'Kore'; // Use Kore for all voice modes

    if (mode === 'conversation' && sanitizedScenario) {
      // Conversation practice mode - use scenario-specific prompt (with sanitized inputs)
      systemInstruction = buildConversationSystemInstruction(
        sanitizedScenario,
        sanitizedUserName,
        targetLanguage,
        nativeLanguage
      );
    } else {
      // Regular voice mode with journey context
      systemInstruction = buildVoiceSystemInstruction(
        mode,
        targetLanguage,
        nativeLanguage,
        journeyContext
      );
    }
    // Use the only model that supports Live API (BidiGenerateContent)
    const model = 'gemini-2.5-flash-native-audio-preview-12-2025';

    // Initialize Gemini client with v1alpha for Live API
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: { apiVersion: 'v1alpha' }
    });

    // Create ephemeral token using the SDK
    // Using liveConnectConstraints as per SDK documentation
    const aiAny = ai as any;

    if (!aiAny.authTokens || typeof aiAny.authTokens.create !== 'function') {
      console.error('authTokens API not available in SDK');
      return res.status(500).json({
        error: 'Voice mode requires SDK version with authTokens support'
      });
    }

    console.log('[live-token] Creating ephemeral token for model:', model, 'voice:', voiceName);

    // Create token with full config locked in constraints
    // CRITICAL: httpOptions must be INSIDE the config object for v1alpha
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

    // Token is returned as { name: "auth_tokens/xxx" }
    const tokenName = tokenResponse?.name;

    if (!tokenName) {
      console.error('[live-token] No token name in response:', tokenResponse);
      return res.status(500).json({ error: 'Failed to get token from response' });
    }

    console.log('[live-token] Token created successfully for model:', model);

    // Increment usage after success
    incrementUsage(supabase, auth.userId, RATE_LIMITS.liveToken.type);

    return res.status(200).json({
      token: tokenName,
      model: model,
      voiceName: voiceName,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error("[live-token] Error:", error);
    return res.status(500).json({
      error: "Failed to start voice mode. Please try again."
    });
  }
}
