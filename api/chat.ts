import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

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
async function getPartnerContext(userId: string): Promise<PartnerContext | null> {
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

  // Get learner's vocabulary (limit to recent 50 - we only use ~30 in prompts)
  const { data: vocabulary } = await supabase
    .from('dictionary')
    .select('word, translation')  // Only need these fields for prompt context
    .eq('user_id', learnerId)
    .order('unlocked_at', { ascending: false })
    .limit(50);

  // Get learner's scores for weak spots
  const { data: scores } = await supabase
    .from('scores')
    .select('word_id, success_count, fail_count, learned_at, dictionary:word_id(word, translation)')
    .eq('user_id', learnerId);

  // Calculate weak spots (words with failures)
  const weakSpots = (scores || [])
    .filter((s: any) => s.fail_count > 0)
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

    // Rate limiting - check monthly text message usage
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (supabaseUrl && supabaseServiceKey) {
      const supabase = createClient(supabaseUrl, supabaseServiceKey);

      // Get user's subscription plan to determine limits
      const { data: profile } = await supabase
        .from('profiles')
        .select('subscription_plan, subscription_status')
        .eq('id', auth.userId)
        .single();

      const isActive = profile?.subscription_status === 'active';
      const plan = isActive ? (profile?.subscription_plan || 'none') : 'none';

      // Monthly limits per subscription tier (from pricing table)
      // Standard: 5,000 text messages/month
      // Unlimited: no limit
      const TEXT_MESSAGE_LIMITS: Record<string, number | null> = {
        'none': 100,       // Non-subscribers: 100 messages/month (trial)
        'standard': 5000,  // Standard plan: 5,000/month
        'unlimited': null  // Unlimited plan: no limit
      };

      const monthlyLimit = TEXT_MESSAGE_LIMITS[plan];

      // Skip rate limiting for unlimited plan
      if (monthlyLimit !== null) {
        // Get current month in YYYY-MM format for monthly tracking
        const currentMonth = new Date().toISOString().slice(0, 7);

        // Sum all usage for this month
        const { data: monthlyUsage } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', auth.userId)
          .eq('usage_type', 'text_messages')
          .gte('usage_date', `${currentMonth}-01`)
          .lte('usage_date', `${currentMonth}-31`);

        const currentCount = (monthlyUsage || []).reduce((sum, row) => sum + (row.count || 0), 0);

        if (currentCount >= monthlyLimit) {
          return res.status(429).json({
            error: 'Monthly message limit reached. Upgrade to Unlimited for unlimited messages.',
            limit: monthlyLimit,
            used: currentCount,
            plan: plan
          });
        }

        // Increment usage counter for today (daily granularity, monthly aggregation)
        const today = new Date().toISOString().split('T')[0];
        const { data: todayUsage } = await supabase
          .from('usage_tracking')
          .select('count')
          .eq('user_id', auth.userId)
          .eq('usage_type', 'text_messages')
          .eq('usage_date', today)
          .single();

        const todayCount = todayUsage?.count || 0;

        await supabase
          .from('usage_tracking')
          .upsert({
            user_id: auth.userId,
            usage_type: 'text_messages',
            usage_date: today,
            count: todayCount + 1
          }, {
            onConflict: 'user_id,usage_type,usage_date'
          });
      }
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

    // Input validation to prevent API cost abuse and potential DoS
    const MAX_PROMPT_LENGTH = 10000;
    const MAX_MESSAGES = 50;
    const MAX_MESSAGE_LENGTH = 5000;
    const MAX_USERLOG_ITEMS = 50;
    const MAX_USERLOG_ITEM_LENGTH = 200;

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

    const ai = new GoogleGenAI({ apiKey });

    // Handle Title Generation
    if (action === 'generateTitle') {
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate a short (2-3 word) romantic or cute title for a Polish learning session starting with: "${prompt}"`,
      });
      return res.status(200).json({ title: response.text?.replace(/"/g, '').trim() || "New Session" });
    }

    const COMMON_INSTRUCTIONS = `
You are "Cupid" - a warm, encouraging Polish language companion helping someone learn their partner's native language. Every word they learn is a gift of love.

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
- Always explain Polish in English first, then show Polish with (translation in brackets)

LANGUAGE RULES:
- Polish text ALWAYS followed by (English translation)
- Never dump multiple concepts - one thing at a time
- Include pronunciation hints for tricky words

FORMATTING - YOU MUST FOLLOW THIS EXACTLY:
- Polish words go inside **double asterisks**: **kocham**, **Dzień dobry**
- Pronunciation goes in [square brackets]: [KOH-ham], [jen DOH-bri]
- Complete example: **Dzień dobry** [jen DOH-bri] means "good morning"
- Output ONLY plain text with markdown - nothing else

VOCABULARY EXTRACTION - THIS IS MANDATORY FOR EVERY RESPONSE:

You MUST populate the newWords array with COMPLETE data. Incomplete entries are NOT acceptable.

=== FOR VERBS ===
- Use INFINITIVE form as "word" (e.g., "jeść" not "jem")
- type: "verb"
- ONLY extract PRESENT TENSE conjugations with ALL 6 persons:
  { present: { ja: "jem", ty: "jesz", onOna: "je", my: "jemy", wy: "jecie", oni: "jedzą" } }
- EVERY field (ja, ty, onOna, my, wy, oni) MUST be filled - no nulls or empty strings
- DO NOT include past or future tenses - users unlock those separately when ready
- Include 5 example sentences in Polish with English translations in parentheses
- proTip: romantic/practical usage tip (max 60 chars)

=== FOR NOUNS ===
- Use singular nominative as "word"
- type: "noun"
- MUST include "gender": "masculine" | "feminine" | "neuter"
- MUST include "plural": the plural form (e.g., word: "kot", plural: "koty")
- Include 5 example sentences
- proTip: usage tip

=== FOR ADJECTIVES ===
- Use masculine form as "word"
- type: "adjective"
- MUST include "adjectiveForms" with ALL 4 forms:
  { masculine: "dobry", feminine: "dobra", neuter: "dobre", plural: "dobrzy" }
- EVERY field MUST be filled - no nulls or empty strings
- Include 5 example sentences
- proTip: usage tip

=== FOR PHRASES ===
- type: "phrase"
- Include 5 example sentences showing different contexts
- proTip: when/how to use it

=== EXAMPLES FIELD ===
EVERY word MUST have exactly 5 examples. Format each as:
"Kocham cię bardzo. (I love you very much.)"

=== VALIDATION CHECKLIST ===
Before returning, verify:
[ ] Every verb has conjugations.present with ALL 6 persons filled (NO past/future - those are unlocked later)
[ ] Every noun has gender AND plural
[ ] Every adjective has adjectiveForms with ALL 4 forms filled
[ ] Every word has exactly 5 examples
[ ] Every word has a proTip

DO NOT return incomplete data. If unsure of a conjugation, look it up - Polish grammar is consistent.
`;

    const MODE_DEFINITIONS = {
        ask: `
### MODE: ASK - Quick Text Chat

You are texting a friend. Be BRIEF and natural.

CRITICAL RULES:
- Maximum 2-3 sentences
- NEVER repeat the same word/phrase twice
- Give the Polish word ONCE with pronunciation, then move on
- End with a quick follow-up question

FORMAT TEMPLATE:
"[Polish word] ([pronunciation]) means [meaning]. [One romantic tip]. [Follow-up question]?"

EXAMPLE:
User: "How do I say good morning?"
Good: "Dzień dobry (jen DOH-bri)! Whisper it to them before they open their eyes. Want the casual evening version?"
Bad: "You can say good morning by saying Dzień dobry (Good morning)..." ← TOO REPETITIVE

BANNED:
- Tables, bullet points, numbered lists
- Repeating the English translation multiple times
- Long explanations
- Saying "you can say X by saying X"
`,
        learn: `
### MODE: LEARN - Structured Lesson

You MUST use special markdown syntax. This is NON-NEGOTIABLE.

Known vocabulary: [${sanitizedUserLog.slice(0, 30).join(', ')}]

VERB TEACHING RULE:
When teaching ANY verb, ALWAYS show ALL 6 conjugations (I, You, He/She, We, You plural, They).
This is essential - never show partial conjugations.

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
"Let's master 'kochać' (to love) - the most important verb!

::: table
Person | Polish | Pronunciation
---|---|---
I | kocham | KOH-ham
You (singular) | kochasz | KOH-hash
He/She/It | kocha | KOH-ha
We | kochamy | koh-HA-mih
You (plural) | kochacie | koh-HA-chyeh
They | kochają | koh-HA-yohng
:::

Try whispering 'Kochamy się' (We love each other) while hugging.

::: drill
Tonight's challenge: Say 'Kocham cię' while looking into their eyes.
:::

Want me to show you the past and future tenses too?"

ALWAYS END WITH A FOLLOW-UP QUESTION offering to teach related content (other tenses, similar words, etc.)

VALIDATION:
[ ] Table has "::: table" and ":::" markers
[ ] Drill has "::: drill" and ":::" markers
[ ] Verbs show ALL 6 conjugations
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

You are a warm, helpful assistant for a Polish speaker who is helping their English-speaking partner (${context.learnerName}) learn Polish.

=== ${context.learnerName.toUpperCase()}'S PROGRESS (use naturally, don't over-reference) ===
- Total words: ${context.stats.totalWords} | Mastered: ${context.stats.masteredCount} | Level: ${context.stats.level}
- Known vocabulary: ${vocabList}
- Struggling with: ${weakSpotList}
- Recently learned: ${recentList}

=== YOUR TWO ROLES ===

**1. TEACHING HELPER** - Answer questions about Polish:
- How to explain grammar concepts simply
- Pronunciation tips they can share
- Fun practice activities for couples
- Polish culture and context

**2. CONTEXT-AWARE COACH** - Use ${context.learnerName}'s progress when helpful:
- Suggest phrases using words they already know
- Help with words they're struggling with
- Recommend NEW words to grow their vocabulary
- Create intimate moments through language

=== RESPONSE GUIDELINES ===
- Keep responses concise (2-4 sentences)
- Polish words in **bold** with [pronunciation]
- Be practical - suggestions they can use tonight
- DON'T force partner data into every response
- When they ask general questions, answer directly
- When they ask about their partner, use the context data

=== GROWING VOCABULARY ===
Actively suggest NEW Polish words ${context.learnerName} hasn't learned yet! Expand their vocabulary by:
- Teaching new words related to ones they know
- Suggesting romantic phrases they haven't tried
- Building on their current level with slightly more advanced vocabulary

=== EXAMPLES ===

User: "How do I explain Polish cases?"
Good: "Start simple! Cases are like 'word costumes' that change based on a word's job. Try: '**Kot** (cat) becomes **kota** when you DO something to the cat.' Practice with objects around the room - point and conjugate together!"

User: "What can I say to them tonight?"
Good: "Since ${context.learnerName} knows **piękny**, try '**Jesteś piękna**' [YES-tesh PYEN-kna] - 'You are beautiful'. For something NEW, teach them **tęsknię za tobą** [TENSH-nyeh zah TOH-boh] - 'I miss you' - perfect for bedtime whispers!"

User: "They're frustrated with learning"
Good: "I see **mówić** is tricky for them. Make it a game - you say 'Ja mówię', they repeat. Each correct answer = a kiss! Celebrate small wins. Want a fun 5-minute drill?"

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
        partnerContext = await getPartnerContext(auth.userId);
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
      ? `\nPERSONALIZATION:\nThe user is learning Polish for someone named ${partnerName}. Reference this person naturally in examples and encouragement (e.g., "Try saying this to ${partnerName} tonight!" or "Imagine ${partnerName}'s reaction when you say this!").\n`
      : '';

    // Tutors use simplified instructions (no vocabulary extraction needed)
    const isTutorMode = userRole === 'tutor';
    const activeSystemInstruction = isTutorMode
      ? `You are a warm, helpful assistant for a Polish speaker helping their partner learn Polish. Your responses should be encouraging and practical.

FORMATTING:
- Polish words go inside **double asterisks**: **kocham**, **Dzień dobry**
- Pronunciation goes in [square brackets]: [KOH-ham]
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
    const studentModeSchema = {
      type: Type.OBJECT,
      properties: {
        replyText: { type: Type.STRING },
        newWords: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              word: { type: Type.STRING },
              translation: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
              importance: { type: Type.INTEGER },
              context: { type: Type.STRING },
              rootWord: { type: Type.STRING },
              examples: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
                description: "REQUIRED: Exactly 5 example sentences. Format: 'Polish sentence. (English translation.)'"
              },
              proTip: { type: Type.STRING },
              conjugations: {
                type: Type.OBJECT,
                description: "REQUIRED for verbs. Only present tense - past/future unlocked separately.",
                properties: {
                  present: {
                    type: Type.OBJECT,
                    description: "Present tense conjugations - ALL 6 fields required",
                    properties: {
                      ja: { type: Type.STRING, description: "I form - REQUIRED" },
                      ty: { type: Type.STRING, description: "You (singular) form - REQUIRED" },
                      onOna: { type: Type.STRING, description: "He/She/It form - REQUIRED" },
                      my: { type: Type.STRING, description: "We form - REQUIRED" },
                      wy: { type: Type.STRING, description: "You (plural) form - REQUIRED" },
                      oni: { type: Type.STRING, description: "They form - REQUIRED" }
                    },
                    required: ["ja", "ty", "onOna", "my", "wy", "oni"]
                  }
                },
                required: ["present"]
              },
              adjectiveForms: {
                type: Type.OBJECT,
                description: "REQUIRED for adjectives. All 4 gender forms must be provided.",
                properties: {
                  masculine: { type: Type.STRING, description: "Masculine form - REQUIRED" },
                  feminine: { type: Type.STRING, description: "Feminine form - REQUIRED" },
                  neuter: { type: Type.STRING, description: "Neuter form - REQUIRED" },
                  plural: { type: Type.STRING, description: "Plural form - REQUIRED" }
                },
                required: ["masculine", "feminine", "neuter", "plural"]
              },
              gender: {
                type: Type.STRING,
                enum: ["masculine", "feminine", "neuter"],
                description: "REQUIRED for nouns. Grammatical gender."
              },
              plural: {
                type: Type.STRING,
                description: "REQUIRED for nouns. The plural form of the word."
              }
            },
            required: ["word", "translation", "type", "importance", "rootWord", "examples", "proTip"]
          }
        }
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

    // Build current message parts (with optional images)
    const currentParts: any[] = [];
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.data && img.mimeType) {
          currentParts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        }
      });
    }
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
      return res.status(200).json(parsed);
    } catch (parseError) {
      return res.status(200).json({ replyText: sanitizeOutput(output), newWords: [] });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
