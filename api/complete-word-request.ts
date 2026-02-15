import { GoogleGenAI, Type } from "@google/genai";
import { setCorsHeaders, verifyAuth, createServiceClient } from '../utils/api-middleware.js';
import { getProfileLanguages } from '../utils/language-helpers.js';
import { getLanguageName, getLanguageConfig } from '../constants/language-config.js';
import { buildVocabularySchema } from '../utils/schema-builders.js';

export const maxDuration = 30;

// BATCH enrich multiple words in ONE Gemini call (not N+1)
async function batchEnrichWordContexts(
  words: Array<{ word: string; translation: string; wordType: string }>,
  targetLanguage: string,
  nativeLanguage: string
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
  const targetName = getLanguageName(targetLanguage);
  const nativeName = getLanguageName(nativeLanguage);
  const targetConfig = getLanguageConfig(targetLanguage);

  // Get grammar features for this language
  const hasConjugation = targetConfig?.grammar?.hasConjugation || false;
  const conjugationPersons = targetConfig?.grammar?.conjugationPersons || ['I', 'you', 'he/she', 'we', 'you (pl)', 'they'];
  const hasGender = targetConfig?.grammar?.hasGender || false;
  const genderTypes = targetConfig?.grammar?.genderTypes || [];

  // Build batch prompt with all words
  const wordsText = words.map((w, i) =>
    `${i + 1}. Word: "${w.word}" | Translation: "${w.translation}" | Type: "${w.wordType}"`
  ).join('\n');

  // Build grammar-specific instructions
  let grammarInstructions = '';
  if (hasConjugation) {
    grammarInstructions += `- For VERBS: conjugations.present with persons: ${conjugationPersons.join(', ')}\n`;
  }
  if (hasGender) {
    grammarInstructions += `- For NOUNS: gender (${genderTypes.join('/')}) and plural form\n`;
    grammarInstructions += `- For ADJECTIVES: adjectiveForms with ${genderTypes.join(', ')}, plural\n`;
  }

  try {
    const result = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate rich learning context for these ${words.length} ${targetName} words/phrases.
This is for a romantic language learning app. Make it useful and heartfelt.

${wordsText}

For EACH word, provide:
- original: A sample sentence using the word in ${targetName}
- root: Root/base form
- proTip: Brief usage tip (max 60 chars)
- examples: 2 example sentences in ${targetName} with ${nativeName} translations in parentheses
${grammarInstructions}
Return a JSON array with ${words.length} objects in the same order as the input.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: buildVocabularySchema(targetLanguage)
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

    const supabase = createServiceClient();
    if (!supabase) {
      return res.status(500).json({ error: 'Server configuration error' });
    }

    const { requestId } = req.body;

    if (!requestId) {
      return res.status(400).json({ error: 'Missing requestId' });
    }

    // Get the word request and atomically mark as in-progress to prevent race conditions
    let wordRequest: any;
    const { data: claimedRequest, error: requestError } = await supabase
      .from('word_requests')
      .update({ status: 'in_progress' })
      .eq('id', requestId)
      .eq('status', 'pending')  // Only update if still pending (prevents double completion)
      .select('*')
      .single();

    if (requestError || !claimedRequest) {
      // Could be not found, already completed, or stuck in_progress from a timed-out attempt
      const { data: existingRequest } = await supabase
        .from('word_requests')
        .select('*, updated_at')
        .eq('id', requestId)
        .single();

      if (!existingRequest) {
        return res.status(404).json({ error: 'Word request not found' });
      }
      if (existingRequest.student_id !== auth.userId) {
        return res.status(403).json({ error: 'Not authorized' });
      }
      if (existingRequest.status === 'completed') {
        return res.status(400).json({ error: 'Already completed' });
      }
      if (existingRequest.status === 'in_progress') {
        // Recovery: if stuck in_progress for >60s, a previous attempt timed out — reclaim it
        const stuckSince = new Date(existingRequest.updated_at).getTime();
        const now = Date.now();
        if (now - stuckSince > 60_000) {
          wordRequest = existingRequest;
        } else {
          return res.status(400).json({ error: 'Already in progress' });
        }
      } else {
        return res.status(500).json({ error: 'Failed to start word request completion' });
      }
    } else {
      wordRequest = claimedRequest;
    }

    if (wordRequest.student_id !== auth.userId) {
      // Revert the status change since this user shouldn't have access
      await supabase.from('word_requests').update({ status: 'pending' }).eq('id', requestId);
      return res.status(403).json({ error: 'Not authorized' });
    }

    const selectedWords = wordRequest.selected_words || [];
    const xpMultiplier = wordRequest.xp_multiplier || 2.0;

    // Fetch language pair, student profile, and tutor profile in parallel
    const [studentLangs, profileResult, tutorProfileResult] = await Promise.all([
      getProfileLanguages(supabase, auth.userId),
      supabase.from('profiles').select('xp, full_name').eq('id', auth.userId).single(),
      supabase.from('profiles').select('full_name').eq('id', wordRequest.tutor_id).single(),
    ]);

    const targetLanguage = wordRequest.language_code || studentLangs.targetLanguage;
    const nativeLanguage = studentLangs.nativeLanguage;
    const profile = profileResult.data;
    const tutorProfile = tutorProfileResult.data;

    // Step 1: Save BASIC word data immediately (no Gemini — that's the bottleneck)
    const now = new Date().toISOString();
    const dictionaryEntries = selectedWords.map((word: any) => ({
      user_id: auth.userId,
      language_code: targetLanguage,
      word: word.word.toLowerCase().trim(),
      translation: word.translation,
      word_type: word.word_type || 'phrase',
      example_sentence: null,
      pro_tip: null,
      gender: null,
      plural: null,
      conjugations: null,
      adjective_forms: null,
      enriched_at: null,
      source: 'gift',
      unlocked_at: now
    }));

    // Step 2: Batch upsert ALL dictionary entries
    const { data: insertedWords, error: dictError } = await supabase
      .from('dictionary')
      .upsert(dictionaryEntries, {
        onConflict: 'user_id,word,language_code',
        ignoreDuplicates: false
      })
      .select();

    if (dictError) {
      console.error('Error adding words:', dictError);
      return res.status(500).json({ error: 'Failed to add words to dictionary' });
    }

    // Step 3: Calculate XP and prepare gift_words records
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
        language_code: targetLanguage,
        xp_earned: wordXp
      });

      addedWords.push({
        ...dictEntry,
        xp_earned: wordXp
      });
    });

    // Add completion bonus (+5 XP)
    const completionBonus = 5;
    totalXpEarned += completionBonus;
    const newXp = (profile?.xp || 0) + totalXpEarned;

    // Step 4: Run all post-insert operations in parallel — these are all independent
    const postInsertOps = [
      // Insert gift_words records
      giftWordRecords.length > 0
        ? supabase.from('gift_words').insert(giftWordRecords)
        : Promise.resolve(),
      // Update student's XP
      supabase.from('profiles').update({ xp: newXp }).eq('id', auth.userId),
      // Mark word request as completed
      supabase.from('word_requests').update({
        status: 'completed',
        completed_at: new Date().toISOString()
      }).eq('id', requestId),
      // Mark notification as read
      supabase.from('notifications').update({ read_at: new Date().toISOString() })
        .eq('user_id', auth.userId)
        .eq('type', 'word_request')
        .filter('data->>request_id', 'eq', requestId),
      // Notify tutor that student completed the gift
      supabase.from('notifications').insert({
        user_id: wordRequest.tutor_id,
        type: 'gift_complete',
        title: `${profile?.full_name || 'Your partner'} learned your words!`,
        message: `They learned ${addedWords.length} word${addedWords.length > 1 ? 's' : ''} and earned ${totalXpEarned} XP`,
        data: {
          request_id: requestId,
          words_learned: addedWords.length,
          xp_earned: totalXpEarned
        }
      }),
      // Add to activity feed
      supabase.from('activity_feed').insert({
        user_id: auth.userId,
        partner_id: wordRequest.tutor_id,
        event_type: 'gift_received',
        title: 'Learned gifted words',
        subtitle: `${addedWords.length} words from ${tutorProfile?.full_name || 'partner'}`,
        data: { request_id: requestId, words_count: addedWords.length, xp_earned: totalXpEarned },
        language_code: targetLanguage,
      }),
    ];

    await Promise.all(postInsertOps);

    // Check for and activate any linked challenges (depends on completion above)
    let activatedChallengeId: string | null = null;
    if (wordRequest.linked_challenge_id) {
      const { data: linkedChallenge, error: activateError } = await supabase
        .from('tutor_challenges')
        .update({ status: 'pending' })
        .eq('id', wordRequest.linked_challenge_id)
        .eq('status', 'scheduled')  // Only activate if still scheduled
        .select('id, title, challenge_type')
        .single();

      if (!activateError && linkedChallenge) {
        activatedChallengeId = linkedChallenge.id;

        // Notify student about the activated challenge
        await supabase.from('notifications').insert({
          user_id: auth.userId,
          type: 'challenge',
          title: `Now test your new words!`,
          message: `${tutorProfile?.full_name || 'Your partner'} prepared a ${linkedChallenge.challenge_type} challenge`,
          data: {
            challenge_id: linkedChallenge.id,
            challenge_type: linkedChallenge.challenge_type,
            linked_to_gift: true,
          },
        });
      }
    }

    // Respond immediately (~2-3s) — words are saved, user sees success
    res.status(200).json({
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
      giftedBy: tutorProfile?.full_name || 'Your partner',
      activatedChallengeId,
    });

    // === BACKGROUND ENRICHMENT (after response sent) ===
    // Vercel keeps the function alive until it returns or hits maxDuration.
    // Words already exist with basic data — enrichment adds examples, pro tips, grammar forms.
    try {
      const wordsToEnrich = selectedWords.map((w: any) => ({
        word: w.word,
        translation: w.translation,
        wordType: w.word_type || 'phrase'
      }));

      const enrichedContexts = await batchEnrichWordContexts(wordsToEnrich, targetLanguage, nativeLanguage);

      // Update each dictionary entry with enriched data
      for (const [i, dictEntry] of (insertedWords || []).entries()) {
        const enriched = enrichedContexts[i] || {};
        await supabase.from('dictionary').update({
          example_sentence: enriched.original || null,
          pro_tip: enriched.proTip || null,
          gender: enriched.gender || null,
          plural: enriched.plural || null,
          conjugations: enriched.conjugations || null,
          adjective_forms: enriched.adjectiveForms || null,
          enriched_at: new Date().toISOString()
        }).eq('id', dictEntry.id);
      }
    } catch (e) {
      // Non-fatal: words exist with basic data, still usable in flashcards
      console.error('[complete-word-request] Background enrichment failed:', e);
    }

  } catch (error: any) {
    console.error('[complete-word-request] Error:', error);
    return res.status(500).json({ error: 'Failed to add words. Please try again.' });
  }
}
