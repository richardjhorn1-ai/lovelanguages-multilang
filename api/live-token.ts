import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// CORS configuration - secure version that prevents wildcard + credentials
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  // Check for explicit origin match (not wildcard)
  const isExplicitMatch = origin && allowedOrigins.includes(origin) && origin !== '*';

  if (isExplicitMatch) {
    // Explicit match - safe to allow credentials
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  } else if (allowedOrigins.includes('*')) {
    // Wildcard mode - NEVER combine with credentials (security vulnerability)
    res.setHeader('Access-Control-Allow-Origin', '*');
    // Do NOT set credentials header with wildcard
  } else if (allowedOrigins.length > 0) {
    // No match but have allowed origins - use first one
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

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
    console.error('Auth verification failed:', error?.message || 'No user');
    return null;
  }

  return { userId: user.id };
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
function buildConversationSystemInstruction(scenario: ConversationScenario, userName: string): string {
  return `
You are playing the role described below in a Polish language practice conversation.

## Your Role
${scenario.persona}

## Scenario Context
${scenario.context}

## CRITICAL RULES - FOLLOW EXACTLY:

1. **SPEAK ONLY IN POLISH** - This is the most important rule. Default to Polish for everything.

2. **STAY IN CHARACTER** - You are ${scenario.name}. Do not break character unless the user is completely stuck.

3. **KEEP RESPONSES SHORT** - Use 1-3 sentences maximum. This is a conversation, not a lecture.

4. **ADJUST TO USER'S LEVEL** - This scenario is marked as ${scenario.difficulty}. Keep your Polish appropriate:
   ${scenario.difficulty === 'beginner' ? '- Use simple vocabulary, present tense, basic sentences' : ''}
   ${scenario.difficulty === 'intermediate' ? '- Use varied vocabulary, past/future tenses, natural expressions' : ''}
   ${scenario.difficulty === 'advanced' ? '- Use complex grammar, idioms, and natural conversational Polish' : ''}

5. **HELP WHEN NEEDED** - If the user struggles significantly (seems stuck for 2+ attempts):
   - First: Rephrase your Polish more simply
   - Second: Offer a gentle hint in English, then return to Polish immediately
   - Never make them feel bad about mistakes

6. **BE ENCOURAGING** - The user's name is ${userName}. They are learning Polish to connect with someone they love. Be patient and supportive.

7. **NATURAL CONVERSATION** - Respond naturally to what they say. Ask follow-up questions. React to their answers.

8. **SPOKEN AUDIO OUTPUT** - You are speaking out loud:
   - Do NOT include any text formatting, markdown, or styling
   - Just speak naturally in Polish
   - Keep it conversational

## START THE CONVERSATION
Begin speaking in Polish, appropriate to your role. Start with a greeting and opening question/statement.
`;
}

// Voice system instructions per mode
function buildVoiceSystemInstruction(mode: string, userLog: string[]): string {
  const COMMON = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language.
Every word they learn is a gift of love.

VOICE INTERACTION RULES - ENGLISH FIRST:
- ALWAYS speak primarily in English - this is a beginner-friendly conversation
- Explain concepts and context in English first, then introduce Polish words/phrases
- Pattern: English explanation → Polish word → pronunciation tip
- Keep responses concise for voice (2-4 sentences max)
- Be encouraging and supportive

IMPORTANT - SPOKEN AUDIO OUTPUT:
- You are speaking out loud - do NOT include any text formatting, markdown, HTML, or styling
- NEVER output asterisks, brackets, CSS codes, or HTML tags
- Just speak naturally - say the Polish word, then the pronunciation, then the meaning
- Example of what to SAY: "The word is kocham, pronounced KOH-ham, meaning I love"
- Keep it conversational and natural for spoken audio
`;

  const MODES: Record<string, string> = {
    ask: `
${COMMON}
MODE: ASK - Casual Voice Chat

You are a supportive friend having a natural conversation IN ENGLISH with Polish sprinkled in.
- Speak naturally in English, introducing Polish words as they come up
- Keep responses SHORT (2-3 sentences)
- When teaching a Polish word: explain in English first, then say the Polish clearly
- Use encouraging phrases: "Perfect!", "You're getting it!", "Try it again!"
- When they attempt Polish, gently correct if needed
- Ask follow-up questions to keep the conversation flowing

Known vocabulary: [${userLog.slice(0, 20).join(', ')}]
`,
    learn: `
${COMMON}
MODE: LEARN - Voice Lesson

You are a patient, clear Polish teacher - speaking primarily in English.
- Explain concepts in English first, then introduce Polish
- Say the English meaning, pause briefly, then the Polish word with pronunciation
- Give pronunciation guidance for each word
- Ask them to repeat after you
- Provide gentle corrections and encouragement
- Speak at a measured, learnable pace

VERBS: Present one conjugation at a time, not all six at once.

Known vocabulary: [${userLog.slice(0, 20).join(', ')}]
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

    // Rate limiting - Voice mode: blocked for non-subscribers, 60 min/month for standard, unlimited for unlimited
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user's subscription plan
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', auth.userId)
        .single();

      const isActive = profile?.subscription_status === 'active';
      const plan = isActive ? (profile?.subscription_plan || 'none') : 'none';

      // Voice mode limits (minutes per month)
      // Tracking sessions as ~3 min each: 60 min = ~20 sessions
      const VOICE_LIMITS: Record<string, number | null> = {
        'none': 0,         // Non-subscribers: blocked
        'standard': 20,    // Standard: ~60 min (20 sessions × 3 min avg)
        'unlimited': null  // Unlimited: no limit
      };

      const sessionLimit = VOICE_LIMITS[plan];

      // Block non-subscribers completely
      if (sessionLimit === 0) {
        return res.status(403).json({
          error: 'Voice mode requires a subscription. Please upgrade to Standard or Unlimited.',
          feature: 'voice_mode'
        });
      }

      // Check usage for standard plan
      if (sessionLimit !== null) {
        const currentMonth = new Date().toISOString().slice(0, 7);

        const { data: monthlyUsage } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', auth.userId)
          .eq('usage_type', 'voice_sessions')
          .gte('usage_date', `${currentMonth}-01`)
          .lte('usage_date', `${currentMonth}-31`);

        const currentCount = (monthlyUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);

        if (currentCount >= sessionLimit) {
          return res.status(429).json({
            error: 'Monthly voice mode limit reached (60 minutes). Upgrade to Unlimited for unlimited voice.',
            limit: sessionLimit,
            used: currentCount
          });
        }

        // Increment usage
        const today = new Date().toISOString().split('T')[0];
        const { data: todayUsage } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', auth.userId)
          .eq('usage_type', 'voice_sessions')
          .eq('usage_date', today)
          .single();

        await supabase
          .from('usage_tracking')
          .upsert({
            user_id: auth.userId,
            usage_type: 'voice_sessions',
            usage_date: today,
            count: (todayUsage?.count || 0) + 1
          }, {
            onConflict: 'user_id,usage_type,usage_date'
          });
      }
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

    // Build mode-specific system instruction
    let systemInstruction: string;
    const voiceName = 'Kore'; // Use Kore for all voice modes

    if (mode === 'conversation' && sanitizedScenario) {
      // Conversation practice mode - use scenario-specific prompt (with sanitized inputs)
      systemInstruction = buildConversationSystemInstruction(sanitizedScenario, sanitizedUserName);
    } else {
      // Regular voice mode (with sanitized inputs)
      systemInstruction = buildVoiceSystemInstruction(mode, sanitizedUserLog);
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

    console.log('[live-token] Token created successfully:', tokenName.substring(0, 20) + '...');

    return res.status(200).json({
      token: tokenName,
      model: model,
      voiceName: voiceName,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString()
    });

  } catch (error: any) {
    console.error("[live-token] Error:", error.message || error);
    return res.status(500).json({
      error: error.message || "Failed to generate token"
    });
  }
}
