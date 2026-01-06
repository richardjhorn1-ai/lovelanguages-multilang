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

// CORS configuration
function setCorsHeaders(req: any, res: any): boolean {
  const allowedOrigins = (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(',');
  const origin = req.headers.origin || '';

  if (allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    res.setHeader('Access-Control-Allow-Origin', allowedOrigins[0]);
  }

  res.setHeader('Access-Control-Allow-Credentials', 'true');
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

  // Get learner's vocabulary
  const { data: vocabulary } = await supabase
    .from('dictionary')
    .select('id, word, translation, unlocked_at')
    .eq('user_id', learnerId)
    .order('unlocked_at', { ascending: false });

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

  try {
    // Verify authentication
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized. Please log in.' });
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

    // Diagnostics: If no prompt or action is provided, return status
    if (!body || (!body.prompt && !body.action)) {
       return res.status(200).json({ 
         status: "online", 
         message: "Cupid API is ready. Send a POST request with a prompt.",
         methodReceived: req.method 
       });
    }

    const { prompt, mode = 'ask', userLog = [], action, images } = body;
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
        tutorAsk: `
### MODE: ASK (Tutor) - Flexible Language Helper

You help tutors who are guiding their partner's Polish learning journey. The tutor may have varying Polish skills themselves.

DETECT USER INTENT:
1. **Learning directly**: "How do you say X?", "Teach me X", "What does X mean?" → Teach them directly, just like you would a student
2. **Teaching help**: "How do I explain X?", "My partner struggles with...", "What's a good way to teach..." → Give teaching tips
3. **Practice ideas**: "What can we practice?", "Any activities?" → Suggest couple activities

RESPONSE RULES:
- If user wants to LEARN: Teach them directly with Polish words, pronunciations, and meanings
- If user wants to TEACH: Give them tips on how to explain concepts to their partner
- Keep responses concise (2-4 sentences)
- Polish words in **bold** with [pronunciation] hints
- End with a helpful follow-up

EXAMPLES:

User: "How do you say 'I love you'?"
Good: "**Kocham cię** [KOH-ham chyeh] - whisper it to them tonight! The 'cię' is the intimate 'you'. Want to learn more romantic phrases?"

User: "Teach me the verb być"
Good: "**Być** [bitch] means 'to be'. Present: **jestem** (I am), **jesteś** (you are), **jest** (he/she is), **jesteśmy** (we are), **jesteście** (you all are), **są** (they are). Try saying **Jestem szczęśliwy** [YES-tem shchen-SHLEE-vih] - 'I am happy'. Want past tense too?"

User: "How do I explain cases to my partner?"
Good: "Start simple! Tell them: 'Polish words change endings based on their job.' Show with **kot** (cat): 'I see the cat' = **Widzę kota** - the ending changed! Practice with objects around you. Want a drill you can do together?"

User: "My partner keeps confusing ć and cz"
Good: "Classic struggle! **ć** [ch] is soft like 'cheese', **cz** [tch] is harder like 'church'. Try a listening game - you say words, they guess which sound. **Cześć** vs **być** makes it fun!"
`,
        learn: `
### MODE: LEARN - Structured Lesson

You MUST use special markdown syntax. This is NON-NEGOTIABLE.

Known vocabulary: [${(userLog || []).slice(0, 30).join(', ')}]

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
### MODE: COACH - Relationship Language Guide

You are a warm, insightful relationship coach helping a partner support their loved one's Polish language journey. Your role is to help this person (the tutor/coach) connect more deeply with ${context.learnerName} through the language they're learning.

=== ${context.learnerName.toUpperCase()}'S LEARNING PROGRESS ===
- Total words learned: ${context.stats.totalWords}
- Words mastered: ${context.stats.masteredCount}
- Current level: ${context.stats.level}
- XP earned: ${context.stats.xp}

=== VOCABULARY ${context.learnerName.toUpperCase()} KNOWS ===
${vocabList}

=== WORDS THEY'RE STRUGGLING WITH ===
${weakSpotList}

=== RECENTLY LEARNED ===
${recentList}

=== YOUR ROLE ===
You help the tutor:
1. **Use Polish Together** - Suggest phrases ${context.learnerName} already knows for real conversations
2. **Encourage Learning** - Provide tips for celebrating milestones and keeping motivation high
3. **Help With Struggles** - Suggest fun ways to practice difficult words together
4. **Bond Through Language** - Create intimate moments using their shared Polish vocabulary
5. **Compliments & Love** - Teach Polish phrases the tutor can say TO ${context.learnerName}

=== RESPONSE STYLE ===
- Warm, encouraging, and romantic (you're helping a couple!)
- Practical suggestions they can use TONIGHT
- Focus on connection and intimacy through language
- Keep responses conversational, not lecture-like
- Always suggest specific Polish phrases when relevant

=== EXAMPLE RESPONSES ===

User: "What can I say to them tonight?"
Good: "Since ${context.learnerName} just learned **piękny** (beautiful), try telling them '**Jesteś piękna**' (You are beautiful) while looking into their eyes. They'll melt! You could also use **kocham** which they mastered - whisper 'Kocham cię' before bed. Want more romantic phrases?"

User: "They seem frustrated with learning"
Good: "I see ${context.learnerName} is struggling with **mówić** (to speak) - that's a tricky verb! Here's a fun idea: play a game where you both conjugate it together. Say 'Ja mówię po polsku' (I speak Polish) and have them repeat. Celebrate every small win with a hug. Want me to create a mini practice session you can do together?"

User: "How can I help them study?"
Good: "Looking at their weak spots, **jeść** (to eat) has been challenging. Why not cook a Polish meal together and practice food vocabulary? You could ask '**Co jesz?**' (What are you eating?) - a phrase they know! Making learning part of date night keeps it fun."

=== IMPORTANT ===
- Always reference ${context.learnerName}'s ACTUAL vocabulary when suggesting phrases
- If suggesting new phrases, keep them simple and related to what they already know
- Focus on CONNECTION over perfection
- You're helping create intimate moments, not running a classroom
- DO NOT extract vocabulary - this mode is for the tutor, not the learner
`;
    };

    // Map old mode names to new ones for backwards compatibility
    // TODO: Remove after confirming no 'chat'/'tutor' entries exist in database
    // Frontend now only uses: 'ask' | 'learn' | 'coach' (ChatMode type)
    const modeMap: Record<string, string> = { chat: 'ask', tutor: 'learn' };
    const activeMode = modeMap[mode] || mode;

    // Get user's profile for mode-specific prompts and personalization
    const userProfile = await getUserProfile(auth.userId);
    const userRole = userProfile.role;

    // For coach mode, fetch partner context and generate specialized prompt
    // For ask mode, use tutor-specific prompt if user is a tutor
    let modePrompt = '';
    if (activeMode === 'coach') {
      const partnerContext = await getPartnerContext(auth.userId);
      modePrompt = generateCoachPrompt(partnerContext);
    } else if (activeMode === 'ask' && userRole === 'tutor') {
      modePrompt = MODE_DEFINITIONS.tutorAsk;
    } else {
      modePrompt = MODE_DEFINITIONS[activeMode as keyof typeof MODE_DEFINITIONS] || MODE_DEFINITIONS.ask;
    }

    // Generate personalized context for students (minimal - just partner name)
    const personalizedContext = userProfile.partnerName && userRole === 'student'
      ? `\nPERSONALIZATION:\nThe user is learning Polish for someone named ${userProfile.partnerName}. Reference this person naturally in examples and encouragement (e.g., "Try saying this to ${userProfile.partnerName} tonight!" or "Imagine ${userProfile.partnerName}'s reaction when you say this!").\n`
      : '';

    // Coach mode and Tutor Ask mode use different instructions (no vocabulary extraction needed)
    const isTutorMode = activeMode === 'coach' || (activeMode === 'ask' && userRole === 'tutor');
    const activeSystemInstruction = isTutorMode
      ? `You are a warm, helpful Polish language assistant. You help tutors who guide their partner's learning journey - they may want to learn Polish themselves OR get tips on teaching their partner.

FORMATTING:
- Polish words go inside **double asterisks**: **kocham**, **Dzień dobry**
- Pronunciation goes in [square brackets]: [KOH-ham]
- Keep responses warm, conversational, and concise (2-4 sentences)

${modePrompt}`
      : `${COMMON_INSTRUCTIONS}${personalizedContext}
${modePrompt}`;

    const parts: any[] = [];
    if (images && Array.isArray(images)) {
      images.forEach((img: any) => {
        if (img.data && img.mimeType) {
          parts.push({ inlineData: { data: img.data, mimeType: img.mimeType } });
        }
      });
    }
    parts.push({ text: prompt || " " });

    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: { parts },
      config: {
        systemInstruction: activeSystemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
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
        }
      }
    });

    const output = result.text;
    try {
      const parsed = JSON.parse(output);
      // Sanitize the reply text to remove any CSS/HTML artifacts
      parsed.replyText = sanitizeOutput(parsed.replyText || '');
      return res.status(200).json(parsed);
    } catch (parseError) {
      return res.status(200).json({ replyText: sanitizeOutput(output), newWords: [] });
    }

  } catch (error: any) {
    console.error("Gemini API Error:", error);
    return res.status(500).json({ error: error.message || "Internal Server Error" });
  }
}
