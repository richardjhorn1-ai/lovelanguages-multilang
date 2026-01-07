import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// Inline constants to avoid module resolution issues in Vercel serverless

interface LevelTheme {
  name: string;
  description: string;
  concepts: string[];
  polishExamples: string[];
}

const QUESTION_COUNTS: Record<string, number> = {
  Beginner: 10,
  Elementary: 15,
  Conversational: 20,
  Proficient: 30,
  Fluent: 30,
  Master: 30
};

const CORE_QUESTIONS_RATIO = 0.70;

const LEVEL_THEMES: Record<string, LevelTheme> = {
  'Beginner 1->2': {
    name: 'First Words of Love',
    description: 'The most essential words to start connecting with your partner',
    concepts: ['hello/hi', 'I love you', 'good morning', 'good night', 'thank you', 'please', 'yes', 'no'],
    polishExamples: ['cześć', 'kocham cię', 'dzień dobry', 'dobranoc', 'dziękuję', 'proszę', 'tak', 'nie']
  },
  'Beginner 2->3': {
    name: 'Checking In',
    description: 'Simple questions to show you care about their day',
    concepts: ['how are you?', 'are you okay?', "what's wrong?", "I'm fine", "I'm good", 'and you?', 'everything okay?', 'how was your day?'],
    polishExamples: ['jak się masz?', 'wszystko w porządku?', 'co się stało?', 'dobrze się mam', 'w porządku', 'a ty?', 'wszystko dobrze?', 'jak minął dzień?']
  },
  'Beginner 3->Elementary 1': {
    name: 'Feelings',
    description: 'Express your emotions and understand theirs',
    concepts: ["I'm happy", "I'm tired", "I'm hungry", 'I miss you', "I'm sorry", "I'm excited", "I'm sad", 'I feel good'],
    polishExamples: ['jestem szczęśliwy/szczęśliwa', 'jestem zmęczony/zmęczona', 'jestem głodny/głodna', 'tęsknię za tobą', 'przepraszam', 'jestem podekscytowany/podekscytowana', 'jestem smutny/smutna', 'czuję się dobrze']
  },
  'Elementary 1->2': {
    name: 'Daily Life',
    description: 'Talk about everyday activities together',
    concepts: ["let's eat", "I'm going to work", "I'm home", 'breakfast/lunch/dinner', "let's go", 'come here', "I'm leaving", "I'll be back"],
    polishExamples: ['jedzmy', 'idę do pracy', 'jestem w domu', 'śniadanie/obiad/kolacja', 'chodźmy', 'chodź tutaj', 'wychodzę', 'wrócę']
  },
  'Elementary 2->3': {
    name: 'Preferences',
    description: 'Express what you like, want, and prefer',
    concepts: ['I like...', 'I want...', 'do you want...?', "let's...", 'I prefer...', 'I need...', 'I would like...', 'what do you want?'],
    polishExamples: ['lubię...', 'chcę...', 'czy chcesz...?', 'chodźmy...', 'wolę...', 'potrzebuję...', 'chciałbym/chciałabym...', 'czego chcesz?']
  },
  'Elementary 3->Conversational 1': {
    name: 'Making Plans',
    description: 'Plan activities and time together',
    concepts: ['when?', 'where?', 'tomorrow', 'today', 'together', 'later', 'this weekend', "what time?"],
    polishExamples: ['kiedy?', 'gdzie?', 'jutro', 'dzisiaj', 'razem', 'później', 'w ten weekend', 'o której?']
  },
  'Conversational 1->2': {
    name: 'Telling Stories',
    description: 'Share what happened in your day',
    concepts: ['yesterday', 'what happened?', 'I went to...', 'I saw...', 'I met...', 'it was...', 'then...', 'after that...'],
    polishExamples: ['wczoraj', 'co się stało?', 'poszedłem/poszłam do...', 'widziałem/widziałam...', 'spotkałem/spotkałam...', 'to było...', 'potem...', 'po tym...']
  },
  'Conversational 2->3': {
    name: 'Deeper Feelings',
    description: 'Express the depth of your love and connection',
    concepts: ['you mean everything to me', 'I love you so much', "I can't imagine life without you", 'you make me happy', 'always', 'forever', 'my heart', 'my love'],
    polishExamples: ['jesteś dla mnie wszystkim', 'bardzo cię kocham', 'nie wyobrażam sobie życia bez ciebie', 'sprawiasz, że jestem szczęśliwy/szczęśliwa', 'zawsze', 'na zawsze', 'moje serce', 'moja miłość']
  },
  'Conversational 3->Proficient 1': {
    name: 'Complex Conversations',
    description: 'Discuss plans, opinions, and deeper topics',
    concepts: ['I think that...', 'in my opinion...', 'I agree', 'I disagree', 'maybe we could...', 'what if...', 'I believe...', 'it depends on...'],
    polishExamples: ['myślę, że...', 'moim zdaniem...', 'zgadzam się', 'nie zgadzam się', 'może moglibyśmy...', 'a gdyby...', 'wierzę, że...', 'to zależy od...']
  },
  'Proficient 1->2': {
    name: 'Future Dreams',
    description: 'Talk about your future together',
    concepts: ['one day we will...', 'I dream of...', 'our future', 'I hope that...', 'we could live...', 'I want us to...', 'someday', 'when we...'],
    polishExamples: ['pewnego dnia będziemy...', 'marzę o...', 'nasza przyszłość', 'mam nadzieję, że...', 'moglibyśmy mieszkać...', 'chcę, żebyśmy...', 'kiedyś', 'kiedy my...']
  },
  'Proficient 2->3': {
    name: 'Problem Solving',
    description: 'Work through challenges together',
    concepts: ["let's talk about...", 'I understand', 'I hear you', "it's okay", 'we can fix this', "I'm here for you", "let's figure it out", 'together we can...'],
    polishExamples: ['porozmawiajmy o...', 'rozumiem', 'słyszę cię', 'w porządku', 'możemy to naprawić', 'jestem tu dla ciebie', 'rozwiążmy to', 'razem możemy...']
  },
  'Proficient 3->Fluent 1': {
    name: 'Cultural Nuance',
    description: 'Understand Polish expressions and culture',
    concepts: ['Polish idioms', 'cultural expressions', 'formal vs informal', 'family terms', 'holiday greetings', 'traditional phrases', 'regional expressions', 'slang (careful!)'],
    polishExamples: ['nie ma sprawy', 'trzymaj się', 'Pan/Pani vs ty', 'teściowie, szwagier', 'Wesołych Świąt', 'Sto lat!', 'spoko', 'super']
  },
  'Fluent 1->2': {
    name: 'Advanced Expression',
    description: 'Express complex thoughts with nuance',
    concepts: ['subjunctive mood', 'conditional statements', 'hypotheticals', 'reported speech', 'emphasis and contrast', 'literary expressions', 'formal writing', 'professional communication'],
    polishExamples: ['gdybym mógł/mogła...', 'jeśli by to było możliwe...', 'załóżmy, że...', 'powiedział, że...', 'co prawda... ale...', 'z głębi serca', 'szanowny Panie/Pani', 'z poważaniem']
  },
  'Fluent 2->3': {
    name: 'Native-Like Fluency',
    description: 'Communicate with near-native proficiency',
    concepts: ['subtle humor', 'wordplay', 'poetry and literature', 'news and current events', 'technical discussions', 'debate and persuasion', 'storytelling mastery', 'emotional depth'],
    polishExamples: ['dowcipy i żarty', 'gra słów', 'wiersze', 'wydarzenia bieżące', 'dyskusje techniczne', 'argumentacja', 'opowiadanie historii', 'głębokie emocje']
  },
  'Fluent 3->Master 1': {
    name: 'Expert Polish',
    description: 'Master the intricacies of the language',
    concepts: ['archaic expressions', 'regional dialects', 'professional jargon', 'academic Polish', 'legal/medical terms', 'historical context', 'linguistic analysis', 'translation expertise'],
    polishExamples: ['archaizmy', 'gwary regionalne', 'żargon zawodowy', 'język akademicki', 'terminologia prawnicza/medyczna', 'kontekst historyczny', 'analiza językowa', 'tłumaczenia']
  },
  'Master 1->2': {
    name: 'Cultural Mastery',
    description: 'Deep understanding of Polish culture and history',
    concepts: ['historical references', 'literary allusions', 'cultural symbols', 'national identity', 'philosophical discussions', 'artistic expression', 'social commentary', 'generational perspectives'],
    polishExamples: ['odniesienia historyczne', 'aluzje literackie', 'symbole kulturowe', 'tożsamość narodowa', 'dyskusje filozoficzne', 'wyrażenie artystyczne', 'komentarz społeczny', 'perspektywy pokoleniowe']
  },
  'Master 2->3': {
    name: 'Complete Mastery',
    description: 'You are truly bilingual - congratulations!',
    concepts: ['teach others', 'create content', 'professional translation', 'cultural ambassador', 'linguistic research', 'preserve traditions', 'bridge cultures', 'share your journey'],
    polishExamples: ['nauczanie innych', 'tworzenie treści', 'profesjonalne tłumaczenia', 'ambasador kulturowy', 'badania językowe', 'zachowanie tradycji', 'łączenie kultur', 'dzielenie się podróżą']
  }
};

function getThemeForTransition(fromLevel: string, toLevel: string): LevelTheme | null {
  // Parse levels - format is "Tier N" (e.g., "Beginner 2")
  const fromParts = fromLevel.match(/^(.+)\s+(\d)$/);
  const toParts = toLevel.match(/^(.+)\s+(\d)$/);

  if (!fromParts || !toParts) {
    // Fallback to original key format
    const key = `${fromLevel}->${toLevel}`;
    return LEVEL_THEMES[key] || null;
  }

  const fromTier = fromParts[1];
  const fromNum = fromParts[2];
  const toTier = toParts[1];
  const toNum = toParts[2];

  let key: string;
  if (fromTier === toTier) {
    // Same tier: "Beginner 2->3" (short format matching LEVEL_THEMES keys)
    key = `${fromTier} ${fromNum}->${toNum}`;
  } else {
    // Cross tier: "Beginner 3->Elementary 1" (full format)
    key = `${fromLevel}->${toLevel}`;
  }

  return LEVEL_THEMES[key] || null;
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
    return null;
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return null;
  }

  return { userId: user.id };
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const auth = await verifyAuth(req);
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  let body = req.body;
  if (typeof body === 'string' && body.length > 0) {
    try {
      body = JSON.parse(body);
    } catch (e) {
      return res.status(400).json({ error: 'Invalid JSON' });
    }
  }

  const { fromLevel, toLevel } = body || {};

  if (!fromLevel || !toLevel) {
    return res.status(400).json({ error: 'Missing fromLevel or toLevel' });
  }

  // Get theme for this transition
  const theme = getThemeForTransition(fromLevel, toLevel);
  if (!theme) {
    return res.status(400).json({ error: `No theme found for transition ${fromLevel} -> ${toLevel}` });
  }

  // Determine question count based on tier
  const tier = fromLevel.split(' ')[0];
  const totalQuestions = QUESTION_COUNTS[tier] || 10;
  const coreQuestionCount = Math.ceil(totalQuestions * CORE_QUESTIONS_RATIO);
  const personalizedCount = totalQuestions - coreQuestionCount;

  // Fetch user's vocabulary for personalized questions
  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const { data: userWords } = await supabase
    .from('dictionary')
    .select('id, word, translation, word_type')
    .eq('user_id', auth.userId)
    .limit(50);

  const userVocab = userWords || [];

  try {
    const ai = new GoogleGenAI({ apiKey });

    // Generate questions using Gemini
    const prompt = `You are generating a level-up test for a Polish language learning app designed for couples.

## Test Context
- Transition: ${fromLevel} -> ${toLevel}
- Theme: "${theme.name}"
- Description: ${theme.description}

## Core Concepts to Test (REQUIRED - generate ${coreQuestionCount} questions for these):
${theme.concepts.map((c, i) => `${i + 1}. "${c}" = "${theme.polishExamples[i]}"`).join('\n')}

## User's Vocabulary (for ${personalizedCount} personalized questions):
${userVocab.length > 0
  ? userVocab.slice(0, 20).map(w => `- ${w.word} (${w.translation})`).join('\n')
  : 'No vocabulary yet - use additional core concepts instead'}

## Question Types to Generate
- 60% Multiple Choice: "What does 'X' mean?" with 4 options
- 25% Fill-in-blank: "Good morning = Dzień ___" (answer: dobry)
- 15% Translation: "How do you say 'I love you' in Polish?" (answer: kocham cię)

## Requirements
1. Generate exactly ${totalQuestions} questions total
2. First ${coreQuestionCount} questions must cover the core concepts
3. Remaining ${personalizedCount} questions should use the user's vocabulary (or extra core concepts if no vocab)
4. Each question must have a unique ID (q1, q2, etc.)
5. Multiple choice questions need exactly 4 options with one correct answer
6. Fill-in-blank answers should be a single word
7. Keep questions relationship-focused and encouraging
8. For fill-in-blank, put "___" where the answer goes

Generate the test questions now.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: 'Unique question ID (q1, q2, etc.)' },
                  type: { type: Type.STRING, enum: ['multiple_choice', 'fill_blank', 'translation'] },
                  question: { type: Type.STRING, description: 'The question text' },
                  context: { type: Type.STRING, description: 'Additional context if needed' },
                  options: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'For multiple choice only - 4 options'
                  },
                  correctAnswer: { type: Type.STRING, description: 'The correct answer' },
                  theme: { type: Type.STRING, description: 'Which concept this tests' },
                  isCore: { type: Type.BOOLEAN, description: 'true if core concept, false if personalized' }
                },
                required: ['id', 'type', 'question', 'correctAnswer', 'theme', 'isCore']
              }
            }
          },
          required: ['questions']
        }
      }
    });

    const text = response.text || '';

    // Parse and validate response
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse Gemini response:', text);
      return res.status(502).json({ error: 'Invalid AI response format' });
    }

    if (!parsed.questions || !Array.isArray(parsed.questions)) {
      return res.status(502).json({ error: 'AI response missing questions array' });
    }

    // Ensure we have the right number of questions
    const questions = parsed.questions.slice(0, totalQuestions);

    // Create test record in database
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from('level_tests')
      .insert({
        id: testId,
        user_id: auth.userId,
        from_level: fromLevel,
        to_level: toLevel,
        passed: false,
        score: 0,
        total_questions: questions.length,
        correct_answers: 0,
        started_at: new Date().toISOString(),
        questions: questions
      });

    if (insertError) {
      console.error('Failed to create test record:', insertError);
      return res.status(500).json({ error: 'Failed to create test' });
    }

    return res.status(200).json({
      success: true,
      testId,
      fromLevel,
      toLevel,
      theme: theme.name,
      totalQuestions: questions.length,
      questions
    });

  } catch (error: any) {
    console.error('Error generating test:', error);
    return res.status(500).json({ error: 'Failed to generate test' });
  }
}
