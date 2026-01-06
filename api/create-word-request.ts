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

// Get AI suggestions for a topic with full grammatical data
async function getTopicSuggestions(topic: string, count: number = 10, excludeWords: string[] = []): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) return [];

  const ai = new GoogleGenAI({ apiKey });

  // Build exclusion instruction if there are words to exclude
  const exclusionText = excludeWords.length > 0
    ? `\n\nIMPORTANT: Do NOT include any of these words (the learner already knows them): ${excludeWords.slice(0, 100).join(', ')}`
    : '';

  const result = await ai.models.generateContent({
    model: "gemini-2.0-flash",
    contents: `Generate ${count} Polish vocabulary words/phrases related to the topic: "${topic}"

For a romantic couple learning Polish together. The words should be practical and useful for everyday communication.${exclusionText}

IMPORTANT - Include grammatical data based on word type:
- VERBS: Must include present tense conjugations for all 6 persons (ja, ty, on/ona/ono, my, wy, oni/one)
- NOUNS: Must include grammatical gender (masculine/feminine/neuter) and plural form
- ADJECTIVES: Must include all 4 forms (masculine, feminine, neuter, plural)

Return ONLY the JSON array, no other text.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            word: { type: Type.STRING, description: "Polish word or phrase (infinitive for verbs, masculine singular for adjectives)" },
            translation: { type: Type.STRING, description: "English translation" },
            word_type: { type: Type.STRING, enum: ["noun", "verb", "adjective", "adverb", "phrase", "other"] },
            pronunciation: { type: Type.STRING, description: "Pronunciation guide in English" },
            // Verb conjugations
            conjugations: {
              type: Type.OBJECT,
              description: "Present tense conjugations for verbs only",
              properties: {
                present: {
                  type: Type.OBJECT,
                  properties: {
                    ja: { type: Type.STRING },
                    ty: { type: Type.STRING },
                    on_ona_ono: { type: Type.STRING },
                    my: { type: Type.STRING },
                    wy: { type: Type.STRING },
                    oni_one: { type: Type.STRING }
                  }
                }
              }
            },
            // Noun data
            gender: { type: Type.STRING, enum: ["masculine", "feminine", "neuter"], description: "Grammatical gender for nouns" },
            plural: { type: Type.STRING, description: "Plural form for nouns" },
            // Adjective forms
            adjective_forms: {
              type: Type.OBJECT,
              description: "All 4 forms for adjectives",
              properties: {
                masculine: { type: Type.STRING },
                feminine: { type: Type.STRING },
                neuter: { type: Type.STRING },
                plural: { type: Type.STRING }
              }
            },
            // Example
            example_sentence: { type: Type.STRING, description: "Example sentence using the word" },
            example_translation: { type: Type.STRING, description: "English translation of example" }
          },
          required: ["word", "translation", "word_type", "pronunciation"]
        }
      }
    }
  });

  try {
    const words = JSON.parse(result.text || '[]');

    // Process each word to store grammatical data in context field
    return words.map((w: any) => {
      const context: any = {};

      if (w.word_type === 'verb' && w.conjugations?.present) {
        context.conjugations = w.conjugations;
      }

      if (w.word_type === 'noun') {
        if (w.gender) context.gender = w.gender;
        if (w.plural) context.plural = w.plural;
      }

      if (w.word_type === 'adjective' && w.adjective_forms) {
        context.adjective_forms = w.adjective_forms;
      }

      if (w.example_sentence) {
        context.example_sentence = w.example_sentence;
        context.example_translation = w.example_translation;
      }

      return {
        word: w.word,
        translation: w.translation,
        word_type: w.word_type,
        pronunciation: w.pronunciation,
        context: Object.keys(context).length > 0 ? JSON.stringify(context) : undefined
      };
    });
  } catch {
    return [];
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

    // Get tutor's profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, role, linked_user_id, full_name')
      .eq('id', auth.userId)
      .single();

    if (profileError || !profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }

    if (profile.role !== 'tutor') {
      return res.status(403).json({ error: 'Only tutors can create word requests' });
    }

    if (!profile.linked_user_id) {
      return res.status(400).json({ error: 'No linked partner found' });
    }

    const { requestType, inputText, selectedWords, xpMultiplier, dryRun, excludeWords, count } = req.body;

    if (!requestType || !inputText) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let aiSuggestions = null;
    let finalWords = selectedWords || [];

    // For AI topic requests, generate suggestions
    if (requestType === 'ai_topic') {
      const wordCount = count || 10;
      const wordsToExclude = excludeWords || [];
      aiSuggestions = await getTopicSuggestions(inputText, wordCount, wordsToExclude);

      // If dryRun, just return suggestions without creating a word request
      if (dryRun) {
        return res.status(200).json({
          success: true,
          suggestions: aiSuggestions
        });
      }

      // If no selectedWords provided, mark first 5 as selected
      if (!selectedWords || selectedWords.length === 0) {
        finalWords = aiSuggestions.slice(0, 5).map(w => ({ ...w, selected: true }));
      }
    } else if (requestType === 'free_text' && !selectedWords) {
      // For free text, create a single word entry from the input
      // The tutor typed a specific word/phrase
      const parts = inputText.split('=').map((s: string) => s.trim());
      const word = parts[0];
      const translation = parts[1] || '';

      finalWords = [{
        word,
        translation,
        word_type: 'phrase',
        selected: true
      }];
    }

    // Create the word request
    const { data: wordRequest, error: requestError } = await supabase
      .from('word_requests')
      .insert({
        tutor_id: auth.userId,
        student_id: profile.linked_user_id,
        request_type: requestType,
        input_text: inputText,
        ai_suggestions: aiSuggestions,
        selected_words: finalWords.filter((w: any) => w.selected !== false),
        status: 'pending',
        xp_multiplier: xpMultiplier || 2.0
      })
      .select()
      .single();

    if (requestError) {
      console.error('Error creating word request:', requestError);
      return res.status(500).json({ error: 'Failed to create word request' });
    }

    // Create notification for student
    const wordCount = finalWords.filter((w: any) => w.selected !== false).length;
    const { error: notificationError } = await supabase.from('notifications').insert({
      user_id: profile.linked_user_id,
      type: 'word_request',
      title: `${profile.full_name} sent you ${wordCount} word${wordCount > 1 ? 's' : ''} to learn!`,
      message: requestType === 'ai_topic'
        ? `Topic: ${inputText}`
        : `A special gift from your partner`,
      data: {
        request_id: wordRequest.id,
        word_count: wordCount
      }
    });

    if (notificationError) {
      console.error('Error creating notification:', notificationError);
      // Don't fail - word request was created, just warn
    }

    return res.status(200).json({
      success: true,
      wordRequest,
      suggestions: aiSuggestions,
      notificationError: notificationError ? 'Words sent but notification may not have been delivered' : undefined
    });

  } catch (error: any) {
    console.error('Create word request error:', error);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
