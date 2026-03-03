import { NextResponse } from 'next/server';
import { GoogleGenAI, Type } from "@google/genai";
import {
  getCorsHeaders,
  handleCorsPreflightResponse,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS,
  SubscriptionPlan,
} from '@/utils/api-middleware';
import { extractLanguages, getProfileLanguages, type LanguageParams } from '@/utils/language-helpers';
import { getGrammarExtractionNotes, type ChatMode } from '@/utils/prompt-templates';
import { getExtractionInstructions } from '@/utils/schema-builders';
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '@/constants/language-config';
import { buildVocabularySchema, buildConjugationSchema } from '@/utils/schema-builders';
import { fetchVocabularyContext, fetchKnownWordsList, formatVocabularyPromptSection } from '@/utils/vocabulary-context';

// Sanitize output to remove any CSS/HTML artifacts the AI might generate
function sanitizeOutput(text: string): string {
  if (!text) return '';
  return text
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    .replace(/font-semibold["'>:\s]*/gi, '')
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Simplified PartnerContext for coach mode prompt generation
interface PartnerContext {
  learnerName: string;
  vocabulary: string[];
  weakSpots: Array<{ word: string; translation: string; failCount: number }>;
  recentWords: Array<{ word: string; translation: string }>;
  stats: { totalWords: number; masteredCount: number; xp: number; level: string };
}

// Consolidated tutor context fetcher
interface TutorSetup {
  partnerName: string | null;
  partnerContext: PartnerContext;
  studentLanguages: { targetLanguage: string; nativeLanguage: string };
}

async function getTutorContext(supabase: any, tutorUserId: string): Promise<TutorSetup | null> {
  const { data: tutorProfile } = await supabase
    .from('profiles')
    .select('partner_name, linked_user_id')
    .eq('id', tutorUserId)
    .single();

  if (!tutorProfile?.linked_user_id) return null;

  const [studentLangs, learnerProfileResult] = await Promise.all([
    getProfileLanguages(supabase, tutorProfile.linked_user_id),
    supabase
      .from('profiles')
      .select('full_name, xp, level')
      .eq('id', tutorProfile.linked_user_id)
      .single()
  ]);

  const learnerProfile = learnerProfileResult.data;

  const vocabContext = await fetchVocabularyContext(supabase, tutorProfile.linked_user_id, studentLangs.targetLanguage);

  const levelNames = [
    'Beginner 1', 'Beginner 2', 'Beginner 3',
    'Elementary 1', 'Elementary 2', 'Elementary 3',
    'Conversational 1', 'Conversational 2', 'Conversational 3',
    'Proficient 1', 'Proficient 2', 'Proficient 3',
    'Fluent 1', 'Fluent 2', 'Fluent 3',
    'Master 1', 'Master 2', 'Master 3'
  ];
  const levelIndex = Math.min((learnerProfile?.level || 1) - 1, 17);

  return {
    partnerName: tutorProfile.partner_name || null,
    partnerContext: {
      learnerName: learnerProfile?.full_name || 'your partner',
      vocabulary: vocabContext.vocabulary.map(v => `${v.word} (${v.translation})`),
      weakSpots: vocabContext.weakSpots.slice(0, 10),
      recentWords: vocabContext.recentWords.slice(0, 10),
      stats: {
        totalWords: vocabContext.stats.totalWords,
        masteredCount: vocabContext.stats.masteredCount,
        xp: learnerProfile?.xp || 0,
        level: levelNames[levelIndex] || 'Beginner 1'
      }
    },
    studentLanguages: studentLangs
  };
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

    // Create Supabase client for rate limiting and data access
    const supabase = createServiceClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500, headers: corsHeaders });
    }

    // Block free users - subscription required
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return NextResponse.json({ error: sub.error }, { status: 403, headers: corsHeaders });
    }

    // Check rate limit for chat endpoint
    const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as SubscriptionPlan, { failClosed: true });
    if (!limit.allowed) {
      return NextResponse.json({
        error: limit.error,
        remaining: limit.remaining,
        limit: limit.limit,
        resetAt: limit.resetAt
      }, { status: 429, headers: corsHeaders });
    }

    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      console.error("API Configuration Error: GEMINI_API_KEY not found.");
      return NextResponse.json({ error: "Server Configuration Error: GEMINI_API_KEY missing." }, { status: 500, headers: corsHeaders });
    }

    // Parse request body
    let body: any;
    try {
      body = await request.json();
    } catch (e) {
      return NextResponse.json({ error: "Invalid JSON format in request body." }, { status: 400, headers: corsHeaders });
    }

    // Require either prompt or action in request body
    if (!body || (!body.prompt && !body.action)) {
       return NextResponse.json({
         error: "Missing required field: 'prompt' or 'action'"
       }, { status: 400, headers: corsHeaders });
    }

    const { prompt, mode = 'ask', action, images, messages = [], sessionContext } = body;

    // Extract language parameters
    let { targetLanguage, nativeLanguage } = extractLanguages(body);
    let targetConfig = getLanguageConfig(targetLanguage);
    let nativeConfig = getLanguageConfig(nativeLanguage);
    let targetName = getLanguageName(targetLanguage);
    let nativeName = getLanguageName(nativeLanguage);

    // Input validation to prevent API cost abuse and potential DoS
    const MAX_PROMPT_LENGTH = 10000;
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 5000;
    const MAX_IMAGES = 5;
    const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;
    const MAX_TOTAL_IMAGE_SIZE = 16 * 1024 * 1024;
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Validate prompt length
    if (prompt && typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json({
        error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`
      }, { status: 400, headers: corsHeaders });
    }

    // Sanitize messages array
    const sanitizedMessages = Array.isArray(messages)
      ? messages.slice(0, MAX_MESSAGES).map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string'
            ? msg.content.substring(0, MAX_MESSAGE_LENGTH)
            : msg.content
        }))
      : [];

    // Validate images array
    let validatedImages: Array<{ data: string; mimeType: string }> = [];
    if (images && Array.isArray(images)) {
      if (images.length > MAX_IMAGES) {
        return NextResponse.json({
          error: `Too many images. Maximum ${MAX_IMAGES} images allowed.`
        }, { status: 400, headers: corsHeaders });
      }

      let totalSize = 0;
      for (const img of images) {
        if (!img || typeof img.data !== 'string' || typeof img.mimeType !== 'string') {
          continue;
        }

        if (!ALLOWED_MIME_TYPES.includes(img.mimeType)) {
          return NextResponse.json({
            error: `Invalid image type: ${img.mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
          }, { status: 400, headers: corsHeaders });
        }

        const estimatedSize = Math.ceil(img.data.length * 0.75);

        if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
          return NextResponse.json({
            error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB per image.`
          }, { status: 400, headers: corsHeaders });
        }

        totalSize += estimatedSize;

        if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
          return NextResponse.json({
            error: `Total image size too large. Maximum is ${MAX_TOTAL_IMAGE_SIZE / (1024 * 1024)}MB combined.`
          }, { status: 400, headers: corsHeaders });
        }

        validatedImages.push({ data: img.data, mimeType: img.mimeType });
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    // Handle Title Generation
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3.1-flash-lite-preview",
        contents: `Generate a short (2-3 word) romantic or cute title for a ${targetName} learning session starting with: "${prompt}"`,
      });
      return NextResponse.json({ title: response.text?.replace(/"/g, '').trim() || "New Session" }, { status: 200, headers: corsHeaders });
    }

    // Variables for mode-specific instructions
    const conjugationPersons = getConjugationPersons(targetLanguage);
    const hasConjugation = targetConfig?.grammar.hasConjugation || false;

    // Build vocabulary context section from sessionContext or fresh fetch
    let vocabularySection = '';
    if (sessionContext && sessionContext.bootedAt) {
      if (sessionContext.role === 'tutor' && sessionContext.partner) {
        const p = sessionContext.partner;
        vocabularySection = formatVocabularyPromptSection({
          vocabulary: p.vocabulary || [],
          masteredWords: p.masteredWords || [],
          weakSpots: p.weakSpots || [],
          recentWords: p.recentWords || [],
          stats: p.stats || { totalWords: 0, masteredCount: 0 },
          lastActive: null
        }, `${p.name}'s Progress`, { level: p.level });
      } else {
        vocabularySection = formatVocabularyPromptSection({
          vocabulary: sessionContext.vocabulary || [],
          masteredWords: sessionContext.masteredWords || [],
          weakSpots: sessionContext.weakSpots || [],
          recentWords: sessionContext.recentWords || [],
          stats: sessionContext.stats || { totalWords: 0, masteredCount: 0 },
          lastActive: null
        }, undefined, {
          level: sessionContext.level,
          knownWords: sessionContext.knownWordsList
        });
      }
    } else {
      const supabaseFallback = createServiceClient();
      if (supabaseFallback) {
        const { data: profileData } = await supabaseFallback
          .from('profiles')
          .select('role, linked_user_id')
          .eq('id', auth.userId)
          .single();
        const isTutor = profileData?.role === 'tutor';
        const vocabUserId = (isTutor && profileData?.linked_user_id) ? profileData.linked_user_id : auth.userId;

        const [vocabTier, knownWords] = await Promise.all([
          fetchVocabularyContext(supabaseFallback, vocabUserId, targetLanguage),
          fetchKnownWordsList(supabaseFallback, vocabUserId, targetLanguage),
        ]);
        vocabularySection = formatVocabularyPromptSection(vocabTier, undefined, { knownWords });
      }
    }

    const vocabBlock = vocabularySection ? `\n${vocabularySection}\n` : '';

    const COMMON_INSTRUCTIONS = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${vocabBlock}
CONTEXT: Use conversation history naturally - build on what they've learned, don't repeat yourself.

CORE PRINCIPLES:
- You are NOT flirty with the user - you ENCOURAGE them to be romantic with their partner
- Celebrate every small win enthusiastically
- Connect vocabulary to relationship moments
- Write ALL explanations in ${nativeName}, then introduce ${targetName} words with their ${nativeName} translation

PACE: Don't overwhelm. One concept at a time. Translate everything helpfully.

FORMAT:
- ${targetName} words in **bold**: **word**
- Pronunciation in [brackets]: [pro-nun-see-AY-shun]
- Example: **${targetConfig?.examples.hello || 'Hello'}** [pronunciation] means "${nativeConfig?.examples.hello || 'Hello'}"

VOCABULARY EXTRACTION:
Extract every new ${targetName} word you teach into the newWords array.
${getExtractionInstructions(targetLanguage)}
`;

    const MODE_DEFINITIONS = {
        ask: `
### ASK MODE - Quick Q&A

Be conversational and concise. 2-3 sentences max.
- Give the ${targetName} word once with pronunciation, then move on
- End with a follow-up question to keep the conversation going
- No tables, lists, or lectures - just natural chat
`,
        learn: `
### MODE: LEARN - Structured Teaching

RESPONSE STYLE:
- Keep explanations concise - teach one concept well, don't overwhelm
- Use tables for conjugations/declensions (when teaching verbs or grammar)
- Use drills sparingly - only for actionable practice challenges
- Don't force both table AND drill into every response

SPECIAL MARKDOWN (use when appropriate):
::: table
Header1 | Header2
---|---
Data1 | Data2
:::

::: drill
Practice challenge here
:::

${hasConjugation ? `VERBS: When teaching a verb, show all ${conjugationPersons.length} persons (${conjugationPersons.join(', ')}).` : ''}
`,
        coach: '' // Placeholder - will be dynamically generated with partner context
    };

    // Generate coach mode prompt with partner context
    const generateCoachPrompt = (context: PartnerContext | null): string => {
      if (!context) {
        return `
### COACH MODE

Your partner hasn't connected their account yet. Encourage the tutor to:
1. Ask their partner to accept the connection request
2. Come back once linked for personalized suggestions
`;
      }

      const weakWords = context.weakSpots.slice(0, 5).map(w => w.word).join(', ') || 'None identified';
      const recentWords = context.recentWords.slice(0, 5).map(w => w.word).join(', ') || 'Just starting';

      return `
### COACH MODE - Teaching Assistant

You're here to assist a ${targetName}-speaking tutor who is teaching their ${nativeName}-speaking partner (${context.learnerName}).

=== QUICK SNAPSHOT ===
- Level: ${context.stats.level} | XP: ${context.stats.xp}
- Words: ${context.stats.totalWords} learned, ${context.stats.masteredCount} mastered

=== ACTIONS (Optional Superpower) ===

Beyond conversation, you can also CREATE and SEND things directly to ${context.learnerName} through this app.

**When to use proposedAction:**
When the tutor asks you to create or send something for their partner:
- "create a quiz on food" / "make a quiz" / "send a quiz"
- "send some words about..." / "give them vocabulary on..."
- "send a challenge" / "create a challenge"
- "send encouragement" / "send a love note"

**When to just have a conversation:**
When they're asking questions or discussing (not requesting something be created):
- "what words should I teach?" -> give suggestions
- "what's a good quiz topic?" -> discuss options
- "how is she doing?" -> review progress together
- "help me with vocabulary ideas" -> brainstorm together

**If you use proposedAction:**
1. Briefly explain what you're creating in replyText
2. Include the action in proposedAction
3. They'll see a confirmation before it sends

**Action types:**
- word_gift: Send vocabulary (include words array with word, translation, word_type)
- quiz: Quiz challenge (wordSource: weak_words, recent_words, or specific)
- quickfire: Timed speed challenge (specify word count and time limit)
- love_note: Encouragement message (category: encouragement/celebration/check_in)

GUIDANCE:
- Be practical - give suggestions they can use tonight
- Don't force the partner data into every response
- Suggest NEW words to grow their vocabulary
- Focus on connection over perfection
- CRITICAL: Word gifts must ALWAYS contain words in ${targetName} with translations in ${nativeName} -- regardless of what language the tutor speaks to you in
`;
    };

    // Get user's profile for mode-specific prompts and personalization
    let userRole: 'student' | 'tutor';
    let partnerName: string | null = null;
    let partnerContext: PartnerContext | null = null;

    if (sessionContext && sessionContext.bootedAt) {
      userRole = sessionContext.role === 'tutor' ? 'tutor' : 'student';
      partnerName = sessionContext.partnerName;

      if (userRole === 'tutor' && sessionContext.partner) {
        const p = sessionContext.partner;
        partnerContext = {
          learnerName: p.name,
          vocabulary: (p.vocabulary || []).map((v: any) => `${v.word} (${v.translation})`),
          weakSpots: p.weakSpots,
          recentWords: p.recentWords,
          stats: {
            totalWords: p.stats.totalWords,
            masteredCount: p.stats.masteredCount,
            xp: p.xp,
            level: p.level
          }
        };

        if (p.targetLanguage && p.nativeLanguage) {
          targetLanguage = p.targetLanguage;
          nativeLanguage = p.nativeLanguage;
          targetConfig = getLanguageConfig(targetLanguage);
          nativeConfig = getLanguageConfig(nativeLanguage);
          targetName = getLanguageName(targetLanguage);
          nativeName = getLanguageName(nativeLanguage);
        }
      }
    } else {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, partner_name')
        .eq('id', auth.userId)
        .single();

      userRole = profile?.role === 'tutor' ? 'tutor' : 'student';
      partnerName = profile?.partner_name || null;

      if (userRole === 'tutor') {
        const tutorSetup = await getTutorContext(supabase, auth.userId);
        if (tutorSetup) {
          partnerName = tutorSetup.partnerName;
          partnerContext = tutorSetup.partnerContext;
          targetLanguage = tutorSetup.studentLanguages.targetLanguage;
          nativeLanguage = tutorSetup.studentLanguages.nativeLanguage;
          targetConfig = getLanguageConfig(targetLanguage);
          nativeConfig = getLanguageConfig(nativeLanguage);
          targetName = getLanguageName(targetLanguage);
          nativeName = getLanguageName(nativeLanguage);
        }
      }
    }

    // For tutors, ALWAYS use coach mode with partner context
    let modePrompt = '';
    if (userRole === 'tutor') {
      modePrompt = generateCoachPrompt(partnerContext);
    } else {
      modePrompt = MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.ask;
    }

    // Generate personalized context for students
    const personalizedContext = partnerName && userRole === 'student'
      ? `\nPERSONALIZATION:\nThe user is learning ${targetName} for someone named ${partnerName}. Reference this person naturally in examples and encouragement (e.g., "Try saying this to ${partnerName} tonight!" or "Imagine ${partnerName}'s reaction when you say this!").\n`
      : '';

    // Tutors use simplified instructions
    const isTutorMode = userRole === 'tutor';
    const activeSystemInstruction = isTutorMode
      ? `You are a warm, helpful assistant for a ${targetName} speaker helping their partner learn ${targetName}. Your responses should be encouraging and practical.

FORMATTING:
- ${targetName} words go inside **double asterisks**: **${targetConfig?.examples.iLoveYou || 'word'}**, **${targetConfig?.examples.hello || 'phrase'}**
- Pronunciation goes in [square brackets]: [pronunciation]
- Keep responses warm, conversational, and focused on helping the couple connect through language

${modePrompt}`
      : `${COMMON_INSTRUCTIONS}${personalizedContext}
${modePrompt}`;

    // Enhanced schema for tutor/coach mode
    const coachModeSchema = {
      type: Type.OBJECT,
      properties: {
        replyText: { type: Type.STRING },
        proposedAction: {
          type: Type.OBJECT,
          nullable: true,
          description: "Optional action to execute after user confirmation",
          properties: {
            type: {
              type: Type.STRING,
              enum: ["word_gift", "quiz", "quickfire", "love_note"],
              description: "Type of action to execute"
            },
            title: {
              type: Type.STRING,
              description: "Short title for the action (shown in confirmation UI)"
            },
            description: {
              type: Type.STRING,
              description: "Brief description of what will happen"
            },
            topic: {
              type: Type.STRING,
              nullable: true,
              description: "Topic for word gift"
            },
            words: {
              type: Type.ARRAY,
              nullable: true,
              description: `Words to include in word gift. Words MUST be in ${targetName}, translations MUST be in ${nativeName}.`,
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING, description: `The word/phrase in ${targetName} (the language being learned)` },
                  translation: { type: Type.STRING, description: `Translation in ${nativeName} (the learner's native language)` },
                  word_type: {
                    type: Type.STRING,
                    enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"]
                  }
                },
                required: ["word", "translation"]
              }
            },
            challengeConfig: {
              type: Type.OBJECT,
              nullable: true,
              description: "Configuration for quiz/quickfire challenges",
              properties: {
                wordCount: { type: Type.NUMBER },
                timeLimitSeconds: { type: Type.NUMBER, nullable: true },
                wordSource: {
                  type: Type.STRING,
                  enum: ["weak_words", "recent_words", "specific"],
                  nullable: true
                },
                questionTypes: {
                  type: Type.ARRAY,
                  nullable: true,
                  items: {
                    type: Type.STRING,
                    enum: ["multiple_choice", "type_it", "flashcard"]
                  }
                }
              }
            },
            noteCategory: {
              type: Type.STRING,
              enum: ["encouragement", "celebration", "check_in"],
              nullable: true,
              description: "Category for love note"
            },
            noteMessage: {
              type: Type.STRING,
              nullable: true,
              description: "Custom message for love note"
            },
            linkedChallenge: {
              type: Type.OBJECT,
              nullable: true,
              description: "Create a linked challenge that activates after word gift completion",
              properties: {
                type: {
                  type: Type.STRING,
                  enum: ["quiz", "quickfire"]
                },
                wordCount: { type: Type.NUMBER, nullable: true },
                timeLimitSeconds: { type: Type.NUMBER, nullable: true },
                config: {
                  type: Type.OBJECT,
                  nullable: true,
                  description: "Additional challenge configuration",
                  properties: {
                    questionTypes: {
                      type: Type.ARRAY,
                      nullable: true,
                      items: { type: Type.STRING }
                    },
                    difficulty: {
                      type: Type.STRING,
                      enum: ["easy", "medium", "hard"],
                      nullable: true
                    }
                  }
                }
              }
            }
          },
          required: ["type", "title", "description"]
        }
      },
      required: ["replyText"]
    };

    // Full schema for student modes
    const vocabSchema = buildVocabularySchema(targetLanguage);
    const studentModeSchema = {
      type: Type.OBJECT,
      properties: {
        replyText: { type: Type.STRING },
        ...vocabSchema.properties
      },
      required: ["replyText", "newWords"]
    };

    // Build multi-turn conversation contents
    const contents: any[] = [];

    if (sanitizedMessages.length > 0) {
      sanitizedMessages.slice(-50).forEach((msg: any) => {
        if (msg.content) {
          contents.push({
            role: msg.role === 'model' ? 'model' : 'user',
            parts: [{ text: msg.content }]
          });
        }
      });
    }

    // Build current message parts (with validated images)
    const currentParts: any[] = [];
    validatedImages.forEach((img) => {
      currentParts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
    });
    currentParts.push({ text: prompt || " " });

    contents.push({ role: 'user', parts: currentParts });

    const result = await ai.models.generateContent({
      model: "gemini-3.1-flash-lite-preview",
      contents,
      config: {
        systemInstruction: activeSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: isTutorMode ? coachModeSchema : studentModeSchema
      }
    });

    const output = result.text;
    try {
      const parsed = JSON.parse(output);
      parsed.replyText = sanitizeOutput(parsed.replyText || '');
      if (!parsed.newWords) {
        parsed.newWords = [];
      }

      // Validate: if language has conjugation, verbs must have conjugations
      const hasConjugation = targetConfig?.grammar.hasConjugation || false;
      if (hasConjugation && parsed.newWords.length > 0) {
        const verbsWithoutConjugations = parsed.newWords.filter(
          (w: any) => w.type === 'verb' && (!w.conjugations || !w.conjugations.present)
        );

        if (verbsWithoutConjugations.length > 0) {
          console.log(`[chat] ${verbsWithoutConjugations.length} verbs missing conjugations, fetching...`);
          const conjugationPersons = getConjugationPersons(targetLanguage);

          const conjugationPrompt = `Generate ${targetName} verb conjugations for these verbs. Return ONLY the conjugations object for each.

VERBS NEEDING CONJUGATIONS:
${verbsWithoutConjugations.map((v: any) => `- ${v.word} (${v.translation})`).join('\n')}

For EACH verb, provide present tense with ALL ${conjugationPersons.length} persons using normalized keys:
{ present: { first_singular: "...", second_singular: "...", third_singular: "...", first_plural: "...", second_plural: "...", third_plural: "..." } }

Return as JSON array matching the order above.`;

          try {
            const conjResponse = await ai.models.generateContent({
              model: "gemini-2.5-flash",
              contents: conjugationPrompt,
              config: {
                responseMimeType: "application/json",
                responseSchema: {
                  type: Type.OBJECT,
                  properties: {
                    conjugations: {
                      type: Type.ARRAY,
                      items: buildConjugationSchema(targetLanguage) || { type: Type.OBJECT }
                    }
                  },
                  required: ['conjugations']
                }
              }
            });

            const conjText = conjResponse.text || '';
            if (conjText.trim().startsWith('{')) {
              const conjParsed = JSON.parse(conjText);
              const conjugationsArray = conjParsed.conjugations || [];

              verbsWithoutConjugations.forEach((verb: any, index: number) => {
                if (conjugationsArray[index]) {
                  const wordIndex = parsed.newWords.findIndex((w: any) => w.word === verb.word);
                  if (wordIndex !== -1) {
                    parsed.newWords[wordIndex].conjugations = conjugationsArray[index];
                  }
                }
              });
              console.log(`[chat] Successfully backfilled ${conjugationsArray.length} verb conjugations`);
            }
          } catch (conjError) {
            console.error('[chat] Failed to backfill conjugations:', conjError);
          }
        }
      }

      // Increment usage after successful response (non-blocking)
      incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);
      return NextResponse.json(parsed, { status: 200, headers: corsHeaders });
    } catch (parseError) {
      incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);
      return NextResponse.json({ replyText: sanitizeOutput(output), newWords: [] }, { status: 200, headers: corsHeaders });
    }

  } catch (error: any) {
    console.error("[chat] Error:", error);
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500, headers: getCorsHeaders(request) });
  }
}
