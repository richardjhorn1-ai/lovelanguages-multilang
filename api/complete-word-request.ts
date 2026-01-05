import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from "@google/genai";

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

// Generate rich word context using Gemini
async function enrichWordContext(word: string, translation: string, wordType: string): Promise<any> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return null;

  const ai = new GoogleGenAI({ apiKey });

  const result = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Generate rich learning context for the Polish word/phrase:
Word: "${word}"
Translation: "${translation}"
Type: "${wordType}"

This is for a romantic language learning app. Make it useful and heartfelt.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          original: { type: Type.STRING, description: "A sample sentence using this word" },
          root: { type: Type.STRING, description: "Root/base form of the word" },
          proTip: { type: Type.STRING, description: "Brief usage tip (max 60 chars)" },
          examples: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "5 example sentences with English translations in parentheses"
          },
          conjugations: {
            type: Type.OBJECT,
            description: "Only for verbs - present tense conjugations",
            properties: {
              present: {
                type: Type.OBJECT,
                properties: {
                  ja: { type: Type.STRING },
                  ty: { type: Type.STRING },
                  onOna: { type: Type.STRING },
                  my: { type: Type.STRING },
                  wy: { type: Type.STRING },
                  oni: { type: Type.STRING }
                }
              }
            }
          },
          gender: { type: Type.STRING, enum: ["masculine", "feminine", "neuter"] },
          plural: { type: Type.STRING, description: "Plural form for nouns" },
          adjectiveForms: {
            type: Type.OBJECT,
            description: "Only for adjectives",
            properties: {
              masculine: { type: Type.STRING },
              feminine: { type: Type.STRING },
              neuter: { type: Type.STRING },
              plural: { type: Type.STRING }
            }
          }
        },
        required: ["original", "root", "proTip", "examples"]
      }
    }
  });

  try {
    return JSON.parse(result.text || '{}');
  } catch {
    return {
      original: '',
      root: word,
      proTip: 'A gift from your partner!',
      examples: []
    };
  }
}

export default async function handler(req: any, res: any) {
  if (setCorsHeaders(req, res)) {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const auth = await verifyAuth(req);
    if (!auth) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the word request
    const { data: wordRequest, error: requestError } = await supabase
      .from('word_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (requestError || !wordRequest) {
      return res.status(404).json({ error: 'Word request not found' });
    }

    if (wordRequest.student_id !== auth.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    if (wordRequest.status === 'completed') {
      return res.status(400).json({ error: 'Already completed' });
    }

    const selectedWords = wordRequest.selected_words || [];
    const xpMultiplier = wordRequest.xp_multiplier || 2.0;

    // Get student's current profile
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, full_name')
      .eq('id', auth.userId)
      .single();

    // Get tutor's name for gift badge
    const { data: tutorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', wordRequest.tutor_id)
      .single();

    const addedWords: any[] = [];
    let totalXpEarned = 0;

    // Add each word to the dictionary
    for (const word of selectedWords) {
      // Enrich the word with AI-generated context
      const context = await enrichWordContext(
        word.word,
        word.translation,
        word.word_type || 'phrase'
      );

      // Insert into dictionary
      const { data: dictEntry, error: dictError } = await supabase
        .from('dictionary')
        .upsert({
          user_id: auth.userId,
          word: word.word.toLowerCase().trim(),
          translation: word.translation,
          word_type: word.word_type || 'phrase',
          importance: 3,
          context: JSON.stringify(context),
          unlocked_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,word',
          ignoreDuplicates: false
        })
        .select()
        .single();

      if (dictError) {
        console.error('Error adding word:', dictError);
        continue;
      }

      // Calculate XP for this word (base 1 × multiplier)
      const wordXp = Math.round(1 * xpMultiplier);
      totalXpEarned += wordXp;

      // Create gift_words record for badge tracking
      await supabase.from('gift_words').insert({
        word_id: dictEntry.id,
        word_request_id: requestId,
        tutor_id: wordRequest.tutor_id,
        student_id: auth.userId,
        xp_earned: wordXp
      });

      addedWords.push({
        ...dictEntry,
        xp_earned: wordXp
      });
    }

    // Add completion bonus (+5 XP)
    const completionBonus = 5;
    totalXpEarned += completionBonus;

    // Update student's XP
    const newXp = (profile?.xp || 0) + totalXpEarned;
    await supabase
      .from('profiles')
      .update({ xp: newXp })
      .eq('id', auth.userId);

    // Update word request status
    await supabase
      .from('word_requests')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', requestId);

    // Mark notification as read
    await supabase
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', auth.userId)
      .eq('type', 'word_request')
      .filter('data->request_id', 'eq', requestId);

    // Notify tutor that student completed the gift
    await supabase.from('notifications').insert({
      user_id: wordRequest.tutor_id,
      type: 'gift_complete',
      title: `${profile?.full_name || 'Your partner'} learned your words!`,
      message: `They learned ${addedWords.length} word${addedWords.length > 1 ? 's' : ''} and earned ${totalXpEarned} XP`,
      data: {
        request_id: requestId,
        words_learned: addedWords.length,
        xp_earned: totalXpEarned
      }
    });

    return res.status(200).json({
      success: true,
      wordsAdded: addedWords.length,
      words: addedWords,
      xpEarned: totalXpEarned,
      breakdown: {
        wordsXp: totalXpEarned - completionBonus,
        completionBonus,
        multiplier: xpMultiplier
      },
      newTotalXp: newXp,
      giftedBy: tutorProfile?.full_name || 'Your partner'
    });

  } catch (error: any) {
    console.error('Complete word request error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
