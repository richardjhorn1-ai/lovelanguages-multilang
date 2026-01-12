import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import {
  setCorsHeaders,
  verifyAuth,
  createServiceClient,
  requireSubscription,
  checkRateLimit,
  incrementUsage,
  RATE_LIMITS
} from '../utils/api-middleware.js';
import { extractLanguages, type LanguageParams } from '../utils/language-helpers.js';
import { buildCupidSystemPrompt, getGrammarExtractionNotes, type ChatMode } from '../utils/prompt-templates.js';
import { getLanguageConfig, getLanguageName, getConjugationPersons } from '../constants/language-config.js';
import { buildVocabularySchema } from '../utils/schema-builders.js';

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
// Uses string[] for vocabulary instead of full objects - only word strings needed for prompts
interface PartnerContext {
  learnerName: string;
  vocabulary: string[];
  weakSpots: Array<{ word: string; translation: string; failCount: number }>;
  recentWords: Array<{ word: string; translation: string }>;
  stats: { totalWords: number; masteredCount: number; xp: number; level: string };
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
    .select('word_id, success_count, fail_count, learned_at, dictionary:word_id(word, translation, language_code)')
    .eq('user_id', learnerId);

  // Calculate weak spots (words with failures, filtered by language)
  const weakSpots = (scores || [])
    .filter((s: any) => s.fail_count > 0 && s.dictionary?.language_code === targetLanguage)
    .sort((a: any, b: any) => b.fail_count - a.fail_count)
    .slice(0, 10)
    .map((s: any) => ({
      word: s.dictionary?.word || 'unknown',
      translation: s.dictionary?.translation || '',
      failCount: s.fail_count
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
    }
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
    const limit = await checkRateLimit(supabase, auth.userId, 'chat', sub.plan as 'standard' | 'unlimited', { failClosed: true });
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

    // Build dynamic vocabulary extraction instructions based on target language grammar
    const conjugationPersons = getConjugationPersons(targetLanguage);
    const hasGender = targetConfig?.grammar.hasGender || false;
    const genderTypes = targetConfig?.grammar.genderTypes || [];
    const hasConjugation = targetConfig?.grammar.hasConjugation || false;

    // Build conjugation example if language has conjugation
    const conjugationExample = hasConjugation && conjugationPersons.length >= 6
      ? `{ present: { first_singular: "...", second_singular: "...", third_singular: "...", first_plural: "...", second_plural: "...", third_plural: "..." } }
  Person labels for ${targetName}: ${conjugationPersons.join(', ')}`
      : 'This language has minimal conjugation - include base form only';

    // Build gender instruction if language has grammatical gender
    const genderInstruction = hasGender
      ? `- MUST include "gender": "${genderTypes.join('" | "')}"
- MUST include "plural": the plural form`
      : '- Include "plural" form if applicable';

    // Build adjective forms instruction
    const adjectiveInstruction = hasGender
      ? `- MUST include "adjectiveForms" with gender forms:
  { ${genderTypes.map(g => `${g}: "..."`).join(', ')}, plural: "..." }
- EVERY field MUST be filled - no nulls or empty strings`
      : '- Include base form and plural if applicable';

    const COMMON_INSTRUCTIONS = `
You are "Cupid" - a warm, encouraging ${targetName} language companion helping someone learn their partner's native language. Every word they learn is a gift of love.

CONTEXT AWARENESS:
You can see the recent conversation history. Use it to:
- Reference what was discussed earlier ("Earlier you learned X, now let's build on that...")
- Avoid repeating information already covered
- Build progressively on vocabulary they've seen in this chat
- Notice patterns in what they're asking about

CORE PRINCIPLES:
- You are NOT flirty with the user - you ENCOURAGE them to be romantic with their partner
- Celebrate every small win enthusiastically
- Connect vocabulary to relationship moments
- Always explain ${targetName} in ${nativeName} first, then show ${targetName} with (translation in brackets)

LANGUAGE RULES:
- ${targetName} text ALWAYS followed by (${nativeName} translation)
- Never dump multiple concepts - one thing at a time
- Include pronunciation hints for tricky words

FORMATTING - YOU MUST FOLLOW THIS EXACTLY:
- ${targetName} words go inside **double asterisks**: **word**, **phrase**
- Pronunciation goes in [square brackets]: [pronunciation guide]
- Complete example: **${targetConfig?.examples.hello || 'Hello'}** [pronunciation] means "${nativeConfig?.examples.hello || 'Hello'}"
- Output ONLY plain text with markdown - nothing else

VOCABULARY EXTRACTION - THIS IS MANDATORY FOR EVERY RESPONSE:

You MUST populate the newWords array with COMPLETE data. Incomplete entries are NOT acceptable.

=== FOR VERBS ===
- Use INFINITIVE form as "word"
- type: "verb"
${hasConjugation ? `- ONLY extract PRESENT TENSE conjugations with ALL persons:
  ${conjugationExample}
- EVERY field MUST be filled - no nulls or empty strings
- DO NOT include past or future tenses - users unlock those separately when ready` : '- Include base/infinitive form'}
- Include 5 example sentences in ${targetName} with ${nativeName} translations in parentheses
- proTip: romantic/practical usage tip (max 60 chars)

=== FOR NOUNS ===
- Use singular nominative as "word"
- type: "noun"
${genderInstruction}
- Include 5 example sentences
- proTip: usage tip

=== FOR ADJECTIVES ===
- Use base form as "word"
- type: "adjective"
${adjectiveInstruction}
- Include 5 example sentences
- proTip: usage tip

=== FOR PHRASES ===
- type: "phrase"
- Include 5 example sentences showing different contexts
- proTip: when/how to use it

=== EXAMPLES FIELD ===
EVERY word MUST have exactly 5 examples. Format each as:
"${targetName} sentence. (${nativeName} translation.)"

=== VALIDATION CHECKLIST ===
Before returning, verify:
${hasConjugation ? `[ ] Every verb has conjugations.present with ALL persons filled (NO past/future - those are unlocked later)` : '[ ] Every verb has base form'}
${hasGender ? `[ ] Every noun has gender AND plural` : '[ ] Every noun has plural if applicable'}
${hasGender ? `[ ] Every adjective has adjectiveForms with ALL gender forms filled` : '[ ] Every adjective has base form'}
[ ] Every word has exactly 5 examples
[ ] Every word has a proTip

DO NOT return incomplete data. If unsure of a form, look it up - ${targetName} grammar is consistent.
`;

    const MODE_DEFINITIONS = {
        ask: `
### MODE: ASK - Quick Text Chat

You are texting a friend. Be BRIEF and natural.

CRITICAL RULES:
- Maximum 2-3 sentences
- NEVER repeat the same word/phrase twice
- Give the ${targetName} word ONCE with pronunciation, then move on
- End with a quick follow-up question

FORMAT TEMPLATE:
"[${targetName} word] ([pronunciation]) means [meaning]. [One romantic tip]. [Follow-up question]?"

EXAMPLE:
User: "How do I say hello?"
Good: "${targetConfig?.examples.hello || 'Hello'} [pronunciation]! Whisper it to them when you wake up. Want the evening version?"
Bad: "You can say hello by saying ${targetConfig?.examples.hello || 'Hello'} (Hello)..." ← TOO REPETITIVE

BANNED:
- Tables, bullet points, numbered lists
- Repeating the ${nativeName} translation multiple times
- Long explanations
- Saying "you can say X by saying X"
`,
        learn: `
### MODE: LEARN - Structured Lesson

You MUST use special markdown syntax. This is NON-NEGOTIABLE.

Known vocabulary: [${sanitizedUserLog.slice(0, 30).join(', ')}]

VERB TEACHING RULE:
${hasConjugation ? `When teaching ANY verb, ALWAYS show ALL ${conjugationPersons.length} conjugations (${conjugationPersons.join(', ')}).
This is essential - never show partial conjugations.` : `Show the base/infinitive form and any key variations.`}

YOUR RESPONSE MUST CONTAIN THESE EXACT PATTERNS:

PATTERN 1 - Table (copy this EXACT format):
::: table
Column1 | Column2 | Column3
---|---|---
Row1Col1 | Row1Col2 | Row1Col3
:::

PATTERN 2 - Drill (copy this EXACT format):
::: drill
Your challenge text here
:::

COMPLETE EXAMPLE FOR VERB TEACHING:
"Let's master 'to love' - the most important verb in any language!

::: table
Person | ${targetName} | Pronunciation
---|---|---
${conjugationPersons[0] || 'I'} | [I form] | [pronunciation]
${conjugationPersons[1] || 'You'} | [You form] | [pronunciation]
${conjugationPersons[2] || 'He/She/It'} | [He/She form] | [pronunciation]
${conjugationPersons[3] || 'We'} | [We form] | [pronunciation]
${conjugationPersons[4] || 'You (pl)'} | [You plural form] | [pronunciation]
${conjugationPersons[5] || 'They'} | [They form] | [pronunciation]
:::

Try whispering 'We love each other' in ${targetName} while hugging.

::: drill
Tonight's challenge: Say '${targetConfig?.examples.iLoveYou || 'I love you'}' while looking into their eyes.
:::

Want me to show you the past and future tenses too?"

ALWAYS END WITH A FOLLOW-UP QUESTION offering to teach related content (other tenses, similar words, etc.)

VALIDATION:
[ ] Table has "::: table" and ":::" markers
[ ] Drill has "::: drill" and ":::" markers
${hasConjugation ? `[ ] Verbs show ALL ${conjugationPersons.length} conjugations` : `[ ] Verbs show base form and key variations`}
[ ] Ends with follow-up question

If you write a table WITHOUT "::: markers, IT WILL NOT RENDER.
`,
        coach: '' // Placeholder - will be dynamically generated with partner context
    };

    // Generate coach mode prompt with partner context
    const generateCoachPrompt = (context: PartnerContext | null): string => {
      if (!context) {
        return `
### MODE: COACH - Relationship Language Guide

You are a warm, supportive relationship coach, but your partner hasn't connected their account yet.

Encourage the user to:
1. Ask their partner to accept the connection request
2. Come back once they're linked to get personalized suggestions

Keep responses warm and encouraging!
`;
      }

      const vocabList = context.vocabulary.slice(0, 30).join(', ') || 'No words learned yet';
      const weakSpotList = context.weakSpots.map(w => `${w.word} (${w.translation}) - ${w.failCount} mistakes`).join(', ') || 'None yet';
      const recentList = context.recentWords.map(w => `${w.word} (${w.translation})`).join(', ') || 'None yet';

      return `
### MODE: COACH - Tutor's Assistant

You are a warm, helpful assistant for a ${nativeName} speaker who is helping their ${nativeName}-speaking partner (${context.learnerName}) learn ${targetName}.

=== ${context.learnerName.toUpperCase()}'S PROGRESS (use naturally, don't over-reference) ===
- Total words: ${context.stats.totalWords} | Mastered: ${context.stats.masteredCount} | Level: ${context.stats.level}
- Known vocabulary: ${vocabList}
- Struggling with: ${weakSpotList}
- Recently learned: ${recentList}

=== YOUR TWO ROLES ===

**1. TEACHING HELPER** - Answer questions about ${targetName}:
- How to explain grammar concepts simply
- Pronunciation tips they can share
- Fun practice activities for couples
- ${targetName} culture and context

**2. CONTEXT-AWARE COACH** - Use ${context.learnerName}'s progress when helpful:
- Suggest phrases using words they already know
- Help with words they're struggling with
- Recommend NEW words to grow their vocabulary
- Create intimate moments through language

=== RESPONSE GUIDELINES ===
- Keep responses concise (2-4 sentences)
- ${targetName} words in **bold** with [pronunciation]
- Be practical - suggestions they can use tonight
- DON'T force partner data into every response
- When they ask general questions, answer directly
- When they ask about their partner, use the context data

=== GROWING VOCABULARY ===
Actively suggest NEW ${targetName} words ${context.learnerName} hasn't learned yet! Expand their vocabulary by:
- Teaching new words related to ones they know
- Suggesting romantic phrases they haven't tried
- Building on their current level with slightly more advanced vocabulary

=== EXAMPLES ===

User: "How do I explain ${targetName} grammar?"
Good: "Start simple! ${targetConfig?.grammar.hasCases ? `Cases are like 'word costumes' that change based on a word's job. Practice with objects around the room - point and decline together!` : targetConfig?.grammar.hasGender ? `Grammatical gender is like giving every noun a personality. Practice by grouping objects by gender!` : `Focus on common patterns first. Practice with everyday objects and phrases!`}"

User: "What can I say to them tonight?"
Good: "Since ${context.learnerName} knows some vocabulary, suggest something romantic! Try teaching them '${targetConfig?.examples.iLoveYou || 'I love you'}' - perfect for bedtime whispers. For something NEW, expand their romantic vocabulary with related phrases!"

User: "They're frustrated with learning"
Good: "Make it a game - you say a word, they repeat. Each correct answer = a kiss! Celebrate small wins. Want a fun 5-minute drill?"

=== IMPORTANT ===
- DO NOT extract vocabulary - you're helping the tutor, not the learner
- Focus on CONNECTION over perfection
- Suggest NEW words alongside known ones to grow their vocabulary
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
          }
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
      ? `You are a warm, helpful assistant for a ${nativeName} speaker helping their partner learn ${targetName}. Your responses should be encouraging and practical.

FORMATTING:
- ${targetName} words go inside **double asterisks**: **${targetConfig?.examples.iLoveYou || 'word'}**, **${targetConfig?.examples.hello || 'phrase'}**
- Pronunciation goes in [square brackets]: [pronunciation]
- Keep responses warm, conversational, and focused on helping the couple connect through language

${modePrompt}`
      : `${COMMON_INSTRUCTIONS}${personalizedContext}
${modePrompt}`;

    // Lightweight schema for tutor/coach mode - no vocabulary extraction needed
    // Tutors don't add words to their Love Log, so we skip the expensive extraction
    const coachModeSchema = {
      type: Type.OBJECT,
      properties: {
        replyText: { type: Type.STRING }
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
