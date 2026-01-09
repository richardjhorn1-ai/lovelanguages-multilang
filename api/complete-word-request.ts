import { createClient } from '@supabase/supabase-js';
import { GoogleGenAI, Type } from "@google/genai";
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware';

// BATCH enrich multiple words in ONE Gemini call (not N+1)
async function batchEnrichWordContexts(
  words: Array<{ word: string; translation: string; wordType: string }>
): Promise<any[]> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    // Return default contexts for all words
    return words.map(w => ({
      original: '',
      root: w.word,
      proTip: 'A gift from your partner!',
      examples: []
    }));
  }

  const ai = new GoogleGenAI({ apiKey });

  // Build batch prompt with all words
  const wordsText = words.map((w, i) =>
    `${i + 1}. Word: "${w.word}" | Translation: "${w.translation}" | Type: "${w.wordType}"`
  ).join('\n');

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate rich learning context for these ${words.length} Polish words/phrases.
This is for a romantic language learning app. Make it useful and heartfelt.

${wordsText}

For EACH word, provide:
- original: A sample sentence using the word
- root: Root/base form
- proTip: Brief usage tip (max 60 chars)
- examples: 5 example sentences with English translations in parentheses
- For VERBS: conjugations.present with ja, ty, onOna, my, wy, oni
- For NOUNS: gender (masculine/feminine/neuter) and plural form
- For ADJECTIVES: adjectiveForms with masculine, feminine, neuter, plural

Return a JSON array with ${words.length} objects in the same order as the input.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
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
      }
    });

    const contexts = JSON.parse(result.text || '[]');

    // Ensure we have a result for each input word (pad with defaults if needed)
    return words.map((w, i) => contexts[i] || {
      original: '',
      root: w.word,
      proTip: 'A gift from your partner!',
      examples: []
    });
  } catch (error) {
    console.error('Batch enrichment error:', error);
    // Return default contexts for all words
    return words.map(w => ({
      original: '',
      root: w.word,
      proTip: 'A gift from your partner!',
      examples: []
    }));
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

    // Step 1: BATCH enrich ALL words in ONE Gemini call (not N+1)
    const wordsToEnrich = selectedWords.map((w: any) => ({
      word: w.word,
      translation: w.translation,
      wordType: w.word_type || 'phrase'
    }));

    const enrichedContexts = await batchEnrichWordContexts(wordsToEnrich);

    // Step 2: Prepare all dictionary entries for batch upsert
    const now = new Date().toISOString();
    const dictionaryEntries = selectedWords.map((word: any, index: number) => ({
      user_id: auth.userId,
      word: word.word.toLowerCase().trim(),
      translation: word.translation,
      word_type: word.word_type || 'phrase',
      importance: 3,
      context: JSON.stringify(enrichedContexts[index]),
      unlocked_at: now
    }));

    // Step 3: Batch upsert ALL dictionary entries
    const { data: insertedWords, error: dictError } = await supabase
      .from('dictionary')
      .upsert(dictionaryEntries, {
        onConflict: 'user_id,word',
        ignoreDuplicates: false
      })
      .select();

    if (dictError) {
      console.error('Error adding words:', dictError);
      return res.status(500).json({ error: 'Failed to add words to dictionary' });
    }

    // Step 4: Calculate XP and prepare gift_words records
    const addedWords: any[] = [];
    let totalXpEarned = 0;
    const giftWordRecords: any[] = [];

    (insertedWords || []).forEach((dictEntry: any) => {
      const wordXp = Math.round(1 * xpMultiplier);
      totalXpEarned += wordXp;

      giftWordRecords.push({
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
    });

    // Step 5: Batch insert ALL gift_words records
    if (giftWordRecords.length > 0) {
      await supabase.from('gift_words').insert(giftWordRecords);
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
    console.error('[complete-word-request] Error:', error);
    return res.status(500).json({ error: 'Failed to add words. Please try again.' });
  }
}
