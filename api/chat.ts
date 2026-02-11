import { GoogleGenAI, Type } from "@google/genai";
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
import { extractLanguages, type LanguageParams } from '../utils/language-helpers.js';
import { getGrammarExtractionNotes, type ChatMode } from '../utils/prompt-templates.js';
import { getExtractionInstructions } from '../utils/schema-builders.js';
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '../constants/language-config.js';
import { buildVocabularySchema, buildConjugationSchema } from '../utils/schema-builders.js';

// Sanitize output to remove any CSS/HTML artifacts the AI might generate
function sanitizeOutput(text: string): string {
  if (!text) return '';
  return text
    // Remove patterns like: (#FF4761) font-semibold"> or variations with any hex color
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    // Remove hex color in parentheses: (#FF4761)
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    // Remove font-semibold with any trailing punctuation
    .replace(/font-semibold["'>:\s]*/gi, '')
    // Remove Tailwind-style classes: text-[#FF4761]
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    // Remove any HTML tags
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    // Remove orphaned style/class fragments
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    // Remove any stray hex colors
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    // Clean up orphaned quotes, brackets, angle brackets
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    // Clean up double spaces
    .replace(/\s{2,}/g, ' ')
    .trim();
}

// Simplified PartnerContext for prompt generation (see types.ts for full version)
interface PartnerContext {
  learnerName: string;
  vocabulary: string[];
  weakSpots: Array<{ word: string; translation: string; failCount: number }>;
  recentWords: Array<{ word: string; translation: string }>;
  stats: { totalWords: number; masteredCount: number; xp: number; level: string };
  journey: {
    topicsExplored: string[];
    canNowSay: string[];
    suggestions: string[];
  } | null;
}

// Get user's profile data for personalization
interface UserProfile {
  role: 'student' | 'tutor';
  partnerName: string | null;
}

async function getUserProfile(userId: string): Promise<UserProfile> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return { role: 'student', partnerName: null };
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, partner_name')
    .eq('id', userId)
    .single();

  return {
    role: profile?.role === 'tutor' ? 'tutor' : 'student',
    partnerName: profile?.partner_name || null
  };
}

// Fetch partner's learning context for coach mode
async function getPartnerContext(userId: string, targetLanguage: string): Promise<PartnerContext | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Get the tutor's profile to find linked learner
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, linked_user_id')
    .eq('id', userId)
    .single();

  if (!profile || profile.role !== 'tutor' || !profile.linked_user_id) {
    return null;
  }

  const learnerId = profile.linked_user_id;

  // Get learner's profile
  const { data: learnerProfile } = await supabase
    .from('profiles')
    .select('full_name, xp, level')
    .eq('id', learnerId)
    .single();

  // Get learner's vocabulary for the specific language (limit to recent 50 - we only use ~30 in prompts)
  const { data: vocabulary } = await supabase
    .from('dictionary')
    .select('word, translation')  // Only need these fields for prompt context
    .eq('user_id', learnerId)
    .eq('language_code', targetLanguage)  // Filter by target language
    .order('unlocked_at', { ascending: false })
    .limit(50);

  // Get learner's scores for weak spots (filter by language via dictionary join)
  const { data: scores } = await supabase
    .from('word_scores')
    .select('word_id, total_attempts, correct_attempts, learned_at, dictionary:word_id(word, translation, language_code)')
    .eq('user_id', learnerId);

  // Calculate weak spots (words with incorrect attempts, filtered by language)
  const weakSpots = (scores || [])
    .filter((s: any) => (s.total_attempts || 0) > (s.correct_attempts || 0) && s.dictionary?.language_code === targetLanguage)
    .sort((a: any, b: any) => ((b.total_attempts || 0) - (b.correct_attempts || 0)) - ((a.total_attempts || 0) - (a.correct_attempts || 0)))
    .slice(0, 10)
    .map((s: any) => ({
      word: s.dictionary?.word || 'unknown',
      translation: s.dictionary?.translation || '',
      failCount: (s.total_attempts || 0) - (s.correct_attempts || 0)
    }));

  // Calculate mastered count
  const masteredCount = (scores || []).filter((s: any) => s.learned_at != null).length;

  // Get recent words (last 10)
  const recentWords = (vocabulary || []).slice(0, 10).map((v: any) => ({
    word: v.word,
    translation: v.translation
  }));

  // Level name lookup
  const levelNames = [
    'Beginner 1', 'Beginner 2', 'Beginner 3',
    'Elementary 1', 'Elementary 2', 'Elementary 3',
    'Conversational 1', 'Conversational 2', 'Conversational 3',
    'Proficient 1', 'Proficient 2', 'Proficient 3',
    'Fluent 1', 'Fluent 2', 'Fluent 3',
    'Master 1', 'Master 2', 'Master 3'
  ];
  const levelIndex = Math.min((learnerProfile?.level || 1) - 1, 17);
  const levelName = levelNames[levelIndex] || 'Beginner 1';

  // Get partner's learning journey summary
  const { data: journeySummary } = await supabase
    .from('progress_summaries')
    .select('topics_explored, can_now_say, suggestions')
    .eq('user_id', learnerId)
    .eq('language_code', targetLanguage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    learnerName: learnerProfile?.full_name || 'your partner',
    vocabulary: (vocabulary || []).map((v: any) => `${v.word} (${v.translation})`),
    weakSpots,
    recentWords,
    stats: {
      totalWords: vocabulary?.length || 0,
      masteredCount,
      xp: learnerProfile?.xp || 0,
      level: levelName
    },
    journey: journeySummary ? {
      topicsExplored: journeySummary.topics_explored || [],
      canNowSay: journeySummary.can_now_say || [],
      suggestions: journeySummary.suggestions || []
    } : null
  };
}

// Learning journey context for personalized chat
interface LearningJourneyContext {
  level: string;
  totalWords: number;
  topicsExplored: string[];
  canNowSay: string[];
  suggestions: string[];
  struggledWords: Array<{ word: string; translation: string; failCount: number }>;
}

async function getLearningJourneyContext(
  userId: string,
  targetLanguage: string
): Promise<LearningJourneyContext | null> {
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) return null;

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Fetch latest progress summary for this language pair
  const { data: summary } = await supabase
    .from('progress_summaries')
    .select('level_at_time, words_learned, topics_explored, can_now_say, suggestions')
    .eq('user_id', userId)
    .eq('language_code', targetLanguage)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Fetch struggled words (words with incorrect attempts)
  const { data: scores } = await supabase
    .from('word_scores')
    .select('total_attempts, correct_attempts, dictionary:word_id(word, translation, language_code)')
    .eq('user_id', userId)
    .gt('total_attempts', 0)
    .limit(50);

  const struggledWords = (scores || [])
    .filter((s: any) => s.dictionary?.language_code === targetLanguage && (s.total_attempts || 0) > (s.correct_attempts || 0))
    .sort((a: any, b: any) => ((b.total_attempts || 0) - (b.correct_attempts || 0)) - ((a.total_attempts || 0) - (a.correct_attempts || 0)))
    .slice(0, 5)
    .map((s: any) => ({
      word: s.dictionary?.word || '',
      translation: s.dictionary?.translation || '',
      failCount: (s.total_attempts || 0) - (s.correct_attempts || 0)
    }));

  if (!summary && struggledWords.length === 0) return null;

  return {
    level: summary?.level_at_time || 'Beginner 1',
    totalWords: summary?.words_learned || 0,
    topicsExplored: summary?.topics_explored || [],
    canNowSay: summary?.can_now_say || [],
    suggestions: summary?.suggestions || [],
    struggledWords
  };
}

export default async function handler(req: any, res: any) {
  // CORS Headers
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  // Enforce POST method only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    // Create Supabase client for rate limiting and data access
    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    // Block free users - subscription required
    const sub = await requireSubscription(supabase, auth.userId);
    if (!sub.allowed) {
      return res.status(403).json({ error: sub.error });
    }

    // Check rate limit for chat endpoint (sub.plan is guaranteed to be 'standard' or 'unlimited' after requireSubscription)
    const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as SubscriptionPlan, { failClosed: true });
    if (!limit.allowed) {
      return res.status(429).json({
        error: limit.error,
        remaining: limit.remaining,
        limit: limit.limit,
        resetAt: limit.resetAt
      });
    }

    // Priority 1: GEMINI_API_KEY
    const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

    if (!apiKey) {
      console.error("API Configuration Error: GEMINI_API_KEY not found.");
      return res.status(500).json({ error: "Server Configuration Error: GEMINI_API_KEY missing." });
    }

    // Robust Body Parsing
    let body = req.body;
    if (typeof body === 'string' && body.length > 0) {
      try {
        body = JSON.parse(body);
      } catch (e) {
        return res.status(400).json({ error: "Invalid JSON format in request body." });
      }
    }

    // Require either prompt or action in request body
    if (!body || (!body.prompt && !body.action)) {
       return res.status(400).json({
         error: "Missing required field: 'prompt' or 'action'"
       });
    }

    const { prompt, mode = 'ask', userLog = [], action, images, messages = [], sessionContext } = body;

    // Extract language parameters (defaults to Polish/English for backward compatibility)
    const { targetLanguage, nativeLanguage } = extractLanguages(body);
    const targetConfig = getLanguageConfig(targetLanguage);
    const nativeConfig = getLanguageConfig(nativeLanguage);
    const targetName = getLanguageName(targetLanguage);
    const nativeName = getLanguageName(nativeLanguage);

    // Input validation to prevent API cost abuse and potential DoS
    const MAX_PROMPT_LENGTH = 10000;
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 5000;
    const MAX_USERLOG_ITEMS = 50;
    const MAX_USERLOG_ITEM_LENGTH = 200;

    // Image validation limits
    const MAX_IMAGES = 5;
    const MAX_IMAGE_SIZE_BYTES = 4 * 1024 * 1024;      // 4MB per image
    const MAX_TOTAL_IMAGE_SIZE = 16 * 1024 * 1024;     // 16MB total
    const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

    // Validate prompt length
    if (prompt && typeof prompt === 'string' && prompt.length > MAX_PROMPT_LENGTH) {
      return res.status(400).json({
        error: `Prompt too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`
      });
    }

    // Sanitize messages array (limit count and individual message length)
    const sanitizedMessages = Array.isArray(messages)
      ? messages.slice(0, MAX_MESSAGES).map((msg: any) => ({
          ...msg,
          content: typeof msg.content === 'string'
            ? msg.content.substring(0, MAX_MESSAGE_LENGTH)
            : msg.content
        }))
      : [];

    // Sanitize userLog array
    const sanitizedUserLog = Array.isArray(userLog)
      ? userLog
          .slice(0, MAX_USERLOG_ITEMS)
          .map(item => typeof item === 'string' ? item.substring(0, MAX_USERLOG_ITEM_LENGTH) : '')
          .filter(item => item.length > 0)
      : [];

    // Validate images array
    let validatedImages: Array<{ data: string; mimeType: string }> = [];
    if (images && Array.isArray(images)) {
      // Check image count
      if (images.length > MAX_IMAGES) {
        return res.status(400).json({
          error: `Too many images. Maximum ${MAX_IMAGES} images allowed.`
        });
      }

      let totalSize = 0;
      for (const img of images) {
        // Validate structure
        if (!img || typeof img.data !== 'string' || typeof img.mimeType !== 'string') {
          continue; // Skip invalid entries
        }

        // Validate MIME type
        if (!ALLOWED_MIME_TYPES.includes(img.mimeType)) {
          return res.status(400).json({
            error: `Invalid image type: ${img.mimeType}. Allowed types: ${ALLOWED_MIME_TYPES.join(', ')}`
          });
        }

        // Calculate base64 decoded size (base64 is ~4/3 of original size)
        const estimatedSize = Math.ceil(img.data.length * 0.75);

        // Check individual image size
        if (estimatedSize > MAX_IMAGE_SIZE_BYTES) {
          return res.status(400).json({
            error: `Image too large. Maximum size is ${MAX_IMAGE_SIZE_BYTES / (1024 * 1024)}MB per image.`
          });
        }

        totalSize += estimatedSize;

        // Check total size
        if (totalSize > MAX_TOTAL_IMAGE_SIZE) {
          return res.status(400).json({
            error: `Total image size too large. Maximum is ${MAX_TOTAL_IMAGE_SIZE / (1024 * 1024)}MB combined.`
          });
        }

        validatedImages.push({ data: img.data, mimeType: img.mimeType });
      }
    }

    const ai = new GoogleGenAI({ apiKey });

    // Handle Title Generation
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short (2-3 word) romantic or cute title for a ${targetName} learning session starting with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '').trim() || "New Session" });
    }

    // Variables for mode-specific instructions
    const conjugationPersons = getConjugationPersons(targetLanguage);
    const hasConjugation = targetConfig?.grammar.hasConjugation || false;

    // Fetch learning journey context for personalization
    const journeyContext = await getLearningJourneyContext(auth.userId, targetLanguage);

    // Build learning journey section
    const learningJourneySection = journeyContext ? `
LEARNER'S JOURNEY:
- Level: ${journeyContext.level} | Words learned: ${journeyContext.totalWords}
- Recent topics: ${journeyContext.topicsExplored.slice(0, 3).join(', ') || 'Just starting'}
- Can now say: ${journeyContext.canNowSay.slice(0, 3).join(', ') || 'Building vocabulary'}
${journeyContext.struggledWords.length > 0 ? `- Needs practice: ${journeyContext.struggledWords.map(w => w.word).join(', ')}` : ''}
- Suggested focus: ${journeyContext.suggestions.slice(0, 2).join(', ') || 'Keep exploring'}
` : '';

    const COMMON_INSTRUCTIONS = `You are Cupid - a calm, engaging language companion who loves love. You help people learn their partner's language because every word learned is a small act of devotion.

You're a knowing friend - you get that they're learning this to whisper sweet things, flirt, and connect intimately. Encourage that. Be playful about romance without being weird about it.
${learningJourneySection}
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

Known vocabulary: [${sanitizedUserLog.slice(0, 30).join(', ')}]

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
    // Enhanced version with agentic action capabilities
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
${context.journey ? `- Topics: ${context.journey.topicsExplored.slice(0, 3).join(', ') || 'Just starting'}
- Can now say: ${context.journey.canNowSay.slice(0, 3).join(', ') || 'Building vocabulary'}` : ''}

=== NEEDS ATTENTION ===
- Struggling with: ${weakWords}
- Recently learned: ${recentWords}

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
- "what words should I teach?" → give suggestions
- "what's a good quiz topic?" → discuss options
- "how is she doing?" → review progress together
- "help me with vocabulary ideas" → brainstorm together

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
`;
    };

    // Get user's profile for mode-specific prompts and personalization
    // Use sessionContext if provided (avoids re-fetching on every message)
    let userRole: 'student' | 'tutor';
    let partnerName: string | null = null;
    let partnerContext: PartnerContext | null = null;

    if (sessionContext && sessionContext.bootedAt) {
      // Use cached session context (efficient path)
      userRole = sessionContext.role === 'tutor' ? 'tutor' : 'student';
      partnerName = sessionContext.partnerName;

      // For tutors, build partner context from session
      // Note: journey data not available in cached session, will be null
      if (userRole === 'tutor' && sessionContext.partner) {
        const p = sessionContext.partner;
        partnerContext = {
          learnerName: p.name,
          vocabulary: p.vocabulary.map(v => `${v.word} (${v.translation})`),
          weakSpots: p.weakSpots,
          recentWords: p.recentWords,
          stats: {
            totalWords: p.stats.totalWords,
            masteredCount: p.stats.masteredCount,
            xp: p.xp,
            level: p.level
          },
          journey: null // Journey fetched fresh when needed via getPartnerContext
        };
      }
    } else {
      // Fallback: Fetch fresh (backwards compatible, but slower)
      const userProfile = await getUserProfile(auth.userId);
      userRole = userProfile.role;
      partnerName = userProfile.partnerName;

      if (userRole === 'tutor') {
        partnerContext = await getPartnerContext(auth.userId, targetLanguage);
      }
    }

    // For tutors, ALWAYS use coach mode with partner context
    // For students, use the requested mode (ask/learn)
    let modePrompt = '';
    if (userRole === 'tutor') {
      modePrompt = generateCoachPrompt(partnerContext);
    } else {
      modePrompt = MODE_DEFINITIONS[mode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.ask;
    }

    // Generate personalized context for students (minimal - just partner name)
    const personalizedContext = partnerName && userRole === 'student'
      ? `\nPERSONALIZATION:\nThe user is learning ${targetName} for someone named ${partnerName}. Reference this person naturally in examples and encouragement (e.g., "Try saying this to ${partnerName} tonight!" or "Imagine ${partnerName}'s reaction when you say this!").\n`
      : '';

    // Tutors use simplified instructions (no vocabulary extraction needed)
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

    // Enhanced schema for tutor/coach mode with agentic action capabilities
    // Tutors don't add words to their Love Log, so we skip vocabulary extraction
    // But they CAN propose actions (word gifts, challenges, love notes)
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
              description: "Words to include in word gift",
              items: {
                type: Type.OBJECT,
                properties: {
                  word: { type: Type.STRING },
                  translation: { type: Type.STRING },
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

    // Full schema for student modes (ASK/LEARN) - vocabulary goes to Love Log
    // Uses dynamic schema builder that adapts to target language grammar
    const vocabSchema = buildVocabularySchema(targetLanguage);
    const studentModeSchema = {
      type: Type.OBJECT,
      properties: {
        replyText: { type: Type.STRING },
        ...vocabSchema.properties  // Adds newWords array with language-specific structure
      },
      required: ["replyText", "newWords"]
    };

    // Build multi-turn conversation contents
    const contents: any[] = [];

    // Add conversation history (using sanitized messages with length limits)
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

    // Add current user message
    contents.push({ role: 'user', parts: currentParts });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        systemInstruction: activeSystemInstruction,
        responseMimeType: "application/json",
        // Use lightweight schema for tutors (no vocab extraction), full schema for students
        responseSchema: isTutorMode ? coachModeSchema : studentModeSchema
      }
    });

    const output = result.text;
    try {
      const parsed = JSON.parse(output);
      // Sanitize the reply text to remove any CSS/HTML artifacts
      parsed.replyText = sanitizeOutput(parsed.replyText || '');
      // Ensure newWords is always present (empty for tutor mode)
      if (!parsed.newWords) {
        parsed.newWords = [];
      }

      // Validate: if language has conjugation, verbs must have conjugations
      const hasConjugation = targetConfig?.grammar.hasConjugation || false;
      if (hasConjugation && parsed.newWords.length > 0) {
        const verbsWithoutConjugations = parsed.newWords.filter(
          (w: any) => w.type === 'verb' && (!w.conjugations || !w.conjugations.present)
        );

        // If any verbs are missing conjugations, make a follow-up request to fill them
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

              // Merge conjugations back into the verbs
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
            // Continue without conjugations rather than failing entirely
          }
        }
      }

      // Increment usage after successful response (non-blocking)
      incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);
      return res.status(200).json(parsed);
    } catch (parseError) {
      // Still increment - Gemini API was called
      incrementUsage(supabase, auth.userId, RATE_LIMITS.chat.type);
      return res.status(200).json({ replyText: sanitizeOutput(output), newWords: [] });
    }

  } catch (error: any) {
    console.error("[chat] Error:", error);
    return res.status(500).json({ error: "Something went wrong. Please try again." });
  }
}
