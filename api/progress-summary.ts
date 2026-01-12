import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';
import { setCorsHeaders, verifyAuth } from '../utils/api-middleware.js';
import { getLanguageName } from '../constants/language-config.js';

// Get level display name from XP
function getLevelDisplayName(xp: number): string {
  const tiers = [
    { name: 'Beginner', min: 0, max: 100, levels: [0, 30, 60, 100] },
    { name: 'Elementary', min: 100, max: 500, levels: [100, 230, 360, 500] },
    { name: 'Conversational', min: 500, max: 1500, levels: [500, 830, 1160, 1500] },
    { name: 'Proficient', min: 1500, max: 3000, levels: [1500, 2000, 2500, 3000] },
    { name: 'Fluent', min: 3000, max: 6000, levels: [3000, 4000, 5000, 6000] },
    { name: 'Master', min: 6000, max: Infinity, levels: [6000, 8000, 10000, Infinity] },
  ];

  for (const tier of tiers) {
    if (xp >= tier.min && xp < tier.max) {
      for (let i = 0; i < tier.levels.length - 1; i++) {
        if (xp < tier.levels[i + 1]) {
          return `${tier.name} ${i + 1}`;
        }
      }
    }
  }
  return 'Master 3';
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

  const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;
  const supabase = createClient(supabaseUrl!, supabaseServiceKey!);

  const { action = 'generate' } = req.body || {};

  // LIST: Return all past summaries for current language pair (for the index)
  if (action === 'list') {
    try {
      // Get user's language settings
      const { data: profile } = await supabase
        .from('profiles')
        .select('active_language, native_language')
        .eq('id', auth.userId)
        .single();

      const targetLanguage = profile?.active_language || 'pl';
      const nativeLanguage = profile?.native_language || 'en';

      const { data: summaries, error } = await supabase
        .from('progress_summaries')
        .select('id, title, summary, words_learned, xp_at_time, level_at_time, language_code, created_at')
        .eq('user_id', auth.userId)
        .eq('language_code', targetLanguage)
        .eq('native_language', nativeLanguage)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return res.status(200).json({
        success: true,
        summaries: summaries || []
      });
    } catch (error: any) {
      console.error('Error fetching summaries:', error);
      return res.status(500).json({ error: 'Failed to fetch summaries' });
    }
  }

  // GET: Return a specific summary by ID
  if (action === 'get') {
    const { summaryId } = req.body;
    if (!summaryId) {
      return res.status(400).json({ error: 'summaryId required' });
    }

    try {
      const { data: summary, error } = await supabase
        .from('progress_summaries')
        .select('*')
        .eq('id', summaryId)
        .eq('user_id', auth.userId)
        .single();

      if (error) throw error;

      return res.status(200).json({
        success: true,
        summary: summary ? {
          id: summary.id,
          summary: summary.summary,
          topicsExplored: summary.topics_explored,
          grammarHighlights: summary.grammar_highlights,
          canNowSay: summary.can_now_say,
          suggestions: summary.suggestions,
          wordsLearned: summary.words_learned,
          xpAtTime: summary.xp_at_time,
          levelAtTime: summary.level_at_time,
          createdAt: summary.created_at,
          generatedAt: summary.created_at
        } : null
      });
    } catch (error: any) {
      console.error('Error fetching summary:', error);
      return res.status(500).json({ error: 'Failed to fetch summary' });
    }
  }

  // GENERATE: Create a new summary (default action)
  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    // STEP 1: Check for previous summary to determine incremental vs full mode
    const { data: lastSummary } = await supabase
      .from('progress_summaries')
      .select('id, created_at, topics_explored, can_now_say, words_learned')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    const isIncremental = !!lastSummary;
    const sinceDate = lastSummary?.created_at || new Date(0).toISOString();

    // STEP 2: Fetch profile with language settings (always needed)
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, full_name, active_language, native_language')
      .eq('id', auth.userId)
      .single();

    const targetLanguage = profile?.active_language || 'pl';
    const nativeLanguage = profile?.native_language || 'en';
    const targetName = getLanguageName(targetLanguage);
    const nativeName = getLanguageName(nativeLanguage);

    // STEP 3: Incremental fetches - only data SINCE last summary
    // Vocabulary: only new words since last summary (or all if first summary, limited to 100)
    const vocabQuery = supabase
      .from('dictionary')
      .select('word, translation, word_type, context, unlocked_at')
      .eq('user_id', auth.userId)
      .eq('language_code', targetLanguage)
      .order('unlocked_at', { ascending: false });

    if (isIncremental) {
      vocabQuery.gte('unlocked_at', sinceDate);
    } else {
      vocabQuery.limit(100);
    }
    const { data: vocabulary } = await vocabQuery;

    // Total word count (for stats)
    const { count: totalWordCount } = await supabase
      .from('dictionary')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', auth.userId)
      .eq('language_code', targetLanguage);

    // Messages: only since last summary (or last 14 days if first)
    const messagesSinceDate = isIncremental ? sinceDate : (() => {
      const d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString();
    })();
    const { data: messages } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .eq('user_id', auth.userId)
      .gte('created_at', messagesSinceDate)
      .order('created_at', { ascending: false })
      .limit(isIncremental ? 50 : 100);

    // Game sessions: only since last summary
    const gameQuery = supabase
      .from('game_sessions')
      .select('id, game_mode, correct_count, incorrect_count, completed_at')
      .eq('user_id', auth.userId)
      .order('completed_at', { ascending: false });

    if (isIncremental) {
      gameQuery.gte('completed_at', sinceDate);
    } else {
      gameQuery.limit(20);
    }
    const { data: gameSessions } = await gameQuery;

    // Game answers (skip if no sessions to analyze)
    const sessionIds = gameSessions?.map(s => s.id) || [];
    const { data: gameAnswers } = sessionIds.length > 0 ? await supabase
      .from('game_session_answers')
      .select('is_correct, explanation')
      .in('session_id', sessionIds) : { data: [] };

    // Level tests: only since last summary
    const testQuery = supabase
      .from('level_tests')
      .select('from_level, to_level, passed, score, completed_at')
      .eq('user_id', auth.userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false });

    if (isIncremental) {
      testQuery.gte('completed_at', sinceDate);
    } else {
      testQuery.limit(5);
    }
    const { data: levelTests } = await testQuery;

    // Use total count from DB, not just fetched vocabulary length
    const totalWords = totalWordCount || 0;
    const newWordsSinceLast = vocabulary?.length || 0;

    // Count words by type (from fetched vocabulary - new words only in incremental mode)
    const wordTypes: Record<string, number> = {};
    vocabulary?.forEach(w => {
      wordTypes[w.word_type] = (wordTypes[w.word_type] || 0) + 1;
    });

    // Get words from last 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const recentWords = vocabulary?.filter(w =>
      new Date(w.unlocked_at) > weekAgo
    ) || [];

    // Extract topics from recent conversations
    const recentConversationText = messages
      ?.filter(m => m.role === 'user')
      .map(m => m.content)
      .join(' ')
      .slice(0, 2000) || '';

    // Calculate game performance stats
    const gameStats = gameSessions?.reduce((acc, session) => {
      acc.totalGames++;
      acc.totalCorrect += session.correct_count || 0;
      acc.totalIncorrect += session.incorrect_count || 0;
      if (!acc.byMode[session.game_mode]) {
        acc.byMode[session.game_mode] = { correct: 0, incorrect: 0, games: 0 };
      }
      acc.byMode[session.game_mode].correct += session.correct_count || 0;
      acc.byMode[session.game_mode].incorrect += session.incorrect_count || 0;
      acc.byMode[session.game_mode].games++;
      return acc;
    }, { totalGames: 0, totalCorrect: 0, totalIncorrect: 0, byMode: {} as Record<string, { correct: number; incorrect: number; games: number }> });

    const overallAccuracy = gameStats && gameStats.totalGames > 0
      ? Math.round((gameStats.totalCorrect / (gameStats.totalCorrect + gameStats.totalIncorrect)) * 100)
      : null;

    // Analyze validation patterns from game answers
    const validationPatterns = {
      totalAnswers: 0,
      exactMatches: 0,
      diacriticIssues: 0,
      synonymsAccepted: 0,
      typosAccepted: 0,
      wrongAnswers: 0,
      otherSmartAccepted: 0
    };

    gameAnswers?.forEach(answer => {
      validationPatterns.totalAnswers++;
      const explanation = (answer.explanation || '').toLowerCase();

      if (answer.is_correct) {
        if (explanation === 'exact match' || explanation === '') {
          validationPatterns.exactMatches++;
        } else if (explanation.includes('diacritic') || explanation.includes('accent')) {
          validationPatterns.diacriticIssues++;
        } else if (explanation.includes('synonym') || explanation.includes('valid alternative')) {
          validationPatterns.synonymsAccepted++;
        } else if (explanation.includes('typo') || explanation.includes('minor')) {
          validationPatterns.typosAccepted++;
        } else {
          validationPatterns.otherSmartAccepted++;
        }
      } else {
        validationPatterns.wrongAnswers++;
      }
    });

    // Calculate percentages for patterns
    const smartAcceptedTotal = validationPatterns.diacriticIssues +
      validationPatterns.synonymsAccepted +
      validationPatterns.typosAccepted +
      validationPatterns.otherSmartAccepted;

    const hasSignificantPatterns = validationPatterns.totalAnswers >= 10 && smartAcceptedTotal > 0;

    // Calculate test performance
    const testStats = levelTests?.length ? {
      totalTests: levelTests.length,
      passed: levelTests.filter(t => t.passed).length,
      avgScore: Math.round(levelTests.reduce((sum, t) => sum + (t.score || 0), 0) / levelTests.length),
      highestLevel: levelTests.find(t => t.passed)?.to_level || null
    } : null;

    const ai = new GoogleGenAI({ apiKey });

    // Build context from last summary (for delta mode)
    const previousTopics = lastSummary?.topics_explored || [];
    const previousPhrases = lastSummary?.can_now_say || [];
    const previousWordCount = lastSummary?.words_learned || 0;

    // Build the prompt based on mode (incremental vs first-time)
    const gameStatsSection = gameStats && gameStats.totalGames > 0 ? `
**Game Performance (${gameStats.totalGames} games):**
- Overall Accuracy: ${overallAccuracy}%
- Total Correct: ${gameStats.totalCorrect} | Incorrect: ${gameStats.totalIncorrect}
${Object.entries(gameStats.byMode).map(([mode, stats]) => {
  const modeNames: Record<string, string> = { flashcards: 'Flashcards', multiple_choice: 'Multiple Choice', type_it: 'Type It', quick_fire: 'Quick Fire', ai_challenge: 'AI Challenge' };
  const accuracy = Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100);
  return `  - ${modeNames[mode] || mode}: ${accuracy}%`;
}).join('\n')}` : '';

    const testStatsSection = testStats ? `
**Level Tests:** ${testStats.passed}/${testStats.totalTests} passed (avg ${testStats.avgScore}%)` : '';

    const validationSection = hasSignificantPatterns ? `
**Validation Insights:** ${validationPatterns.diacriticIssues} diacritic issues, ${validationPatterns.synonymsAccepted} synonyms used` : '';

    const vocabList = vocabulary?.slice(0, 30).map(w => `${w.word} = ${w.translation}`).join('\n') || 'No new vocabulary';

    const prompt = isIncremental
      ? `You are Cupid, celebrating someone's recent ${targetName} progress. They're learning to connect with their partner - every word is a small act of love.

Write in ${nativeName} (the learner's native language). ${targetName} words should be in ${targetName}.

## What's New Since Last Time
- New words: ${newWordsSinceLast} (total now: ${totalWords})
- XP: ${profile?.xp || 0}
${gameStatsSection}
${testStatsSection}

**New Vocabulary:**
${vocabList}

**What They've Been Asking About:**
${recentConversationText?.slice(0, 1000) || 'None'}

## Already Covered (don't repeat)
- Topics: ${previousTopics.slice(0, 5).join(', ') || 'None'}
- Phrases: ${previousPhrases.slice(0, 5).join(', ') || 'None'}

## Your Task
Write a warm progress update that feels personal. Notice patterns in what they're learning ("You've been learning a lot of food words - planning a romantic dinner?"). Celebrate specific wins, not just numbers. Keep it brief (2-3 sentences) but make them feel seen.`

      : `You are Cupid, reflecting on someone's ${targetName} learning journey. They're learning to connect intimately with their partner - every word is a small act of love.

Write in ${nativeName} (the learner's native language). ${targetName} words should be in ${targetName}.

## Their Data
- Total words: ${totalWords} | This week: ${recentWords.length} | XP: ${profile?.xp || 0}
- By type: ${Object.entries(wordTypes).map(([type, count]) => `${type}: ${count}`).join(', ')}
${gameStatsSection}
${testStatsSection}
${validationSection}

**Recent Words:**
${recentWords.slice(0, 20).map(w => `${w.word} (${w.translation})`).join(', ') || 'None yet'}

**All Vocabulary:**
${vocabList}

**What They've Been Asking About:**
${recentConversationText?.slice(0, 1500) || 'None'}

## Your Task
Write a progress summary that feels personal, not generic. You have freedom to:
- Notice interesting patterns ("You've been learning a lot of food words - planning a romantic dinner?")
- Celebrate specific wins, not just numbers
- Connect their vocabulary to romantic moments they could create
- Be warm and encouraging, like a friend who's genuinely proud of them
- Suggest phrases that combine words they already know

The summary should make them feel seen, not just measured.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: `A short, creative title for this journey entry (3-5 words, like "Mastering Kitchen ${targetName}" or "Love Words Week")`
            },
            summary: {
              type: Type.STRING,
              description: 'A warm, personal paragraph (2-3 sentences) summarizing their progress'
            },
            topicsExplored: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 3-5 topics/themes they have explored'
            },
            grammarHighlights: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2-4 grammar concepts they have learned'
            },
            canNowSay: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 3-5 practical phrases they can now say to their partner'
            },
            suggestions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: 'List of 2-3 suggestions for what to learn next'
            }
          },
          required: ['title', 'summary', 'topicsExplored', 'grammarHighlights', 'canNowSay', 'suggestions']
        }
      }
    });

    const text = response.text || '';
    let parsed;

    try {
      parsed = JSON.parse(text);
    } catch (e) {
      console.error('Failed to parse AI response:', text);
      // Return a default response
      parsed = {
        title: totalWords > 0 ? `Your ${targetName} Journey` : 'Getting Started',
        summary: totalWords > 0
          ? `You've learned ${totalWords} ${targetName} words so far - that's wonderful progress! Each word brings you closer to meaningful conversations with your partner.`
          : `Your ${targetName} journey is just beginning! Start chatting to learn your first words.`,
        topicsExplored: totalWords > 0 ? ['Basic vocabulary', 'Everyday phrases'] : ['Getting started'],
        grammarHighlights: totalWords > 0 ? ['Word recognition', 'Basic pronunciation'] : [],
        canNowSay: recentWords.slice(0, 3).map(w => w.translation) || [],
        suggestions: ['Try learning greetings', `Practice saying "I love you" in ${targetName}`]
      };
    }

    const xp = profile?.xp || 0;
    const levelAtTime = getLevelDisplayName(xp);
    const generatedAt = new Date().toISOString();

    // Save to database
    const { data: savedSummary, error: saveError } = await supabase
      .from('progress_summaries')
      .insert({
        user_id: auth.userId,
        language_code: targetLanguage,
        native_language: nativeLanguage,
        title: parsed.title,
        summary: parsed.summary,
        topics_explored: parsed.topicsExplored,
        grammar_highlights: parsed.grammarHighlights,
        can_now_say: parsed.canNowSay,
        suggestions: parsed.suggestions,
        words_learned: totalWords,
        xp_at_time: xp,
        level_at_time: levelAtTime,
        created_at: generatedAt
      })
      .select('id')
      .single();

    if (saveError) {
      console.error('Error saving summary:', saveError);
      // Continue anyway - return the summary even if save fails
    }

    return res.status(200).json({
      success: true,
      id: savedSummary?.id,
      ...parsed,
      wordsLearned: totalWords,
      xpAtTime: xp,
      levelAtTime,
      newWordsSinceLastVisit: recentWords.length,
      generatedAt,
      createdAt: generatedAt,
      // Include validation patterns for UI display
      validationPatterns: hasSignificantPatterns ? {
        totalAnswers: validationPatterns.totalAnswers,
        exactMatches: validationPatterns.exactMatches,
        diacriticIssues: validationPatterns.diacriticIssues,
        synonymsAccepted: validationPatterns.synonymsAccepted,
        typosAccepted: validationPatterns.typosAccepted,
        wrongAnswers: validationPatterns.wrongAnswers
      } : null
    });

  } catch (error: any) {
    console.error('Error generating progress summary:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}
