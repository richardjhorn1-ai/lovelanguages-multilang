import { GoogleGenAI, Type } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

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

  // LIST: Return all past summaries (for the index)
  if (action === 'list') {
    try {
      const { data: summaries, error } = await supabase
        .from('progress_summaries')
        .select('id, title, summary, words_learned, xp_at_time, level_at_time, created_at')
        .eq('user_id', auth.userId)
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
    // Fetch user's vocabulary (all words for comprehensive analysis)
    const { data: vocabulary } = await supabase
      .from('dictionary')
      .select('word, translation, word_type, context, unlocked_at')
      .eq('user_id', auth.userId)
      .order('unlocked_at', { ascending: false });

    // Fetch messages from last 14 days for more context
    const twoWeeksAgo = new Date();
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const { data: messages } = await supabase
      .from('messages')
      .select('content, role, created_at')
      .gte('created_at', twoWeeksAgo.toISOString())
      .order('created_at', { ascending: false })
      .limit(100);

    // Fetch user's profile for level info
    const { data: profile } = await supabase
      .from('profiles')
      .select('xp, level, full_name')
      .eq('id', auth.userId)
      .single();

    // Fetch last 3 summaries to avoid repetition
    const { data: previousSummaries } = await supabase
      .from('progress_summaries')
      .select('summary, topics_explored, can_now_say, created_at')
      .eq('user_id', auth.userId)
      .order('created_at', { ascending: false })
      .limit(3);

    // Fetch recent game sessions for performance stats
    const { data: gameSessions } = await supabase
      .from('game_sessions')
      .select('game_mode, correct_count, incorrect_count, completed_at')
      .eq('user_id', auth.userId)
      .order('completed_at', { ascending: false })
      .limit(20);

    // Fetch level tests for assessment progress
    const { data: levelTests } = await supabase
      .from('level_tests')
      .select('from_level, to_level, passed, score, completed_at')
      .eq('user_id', auth.userId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(5);

    const totalWords = vocabulary?.length || 0;

    // Count words by type
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

    // Calculate test performance
    const testStats = levelTests?.length ? {
      totalTests: levelTests.length,
      passed: levelTests.filter(t => t.passed).length,
      avgScore: Math.round(levelTests.reduce((sum, t) => sum + (t.score || 0), 0) / levelTests.length),
      highestLevel: levelTests.find(t => t.passed)?.to_level || null
    } : null;

    const ai = new GoogleGenAI({ apiKey });

    // Build previous summaries context to avoid repetition
    const previousTopics = previousSummaries?.flatMap(s => s.topics_explored || []) || [];
    const previousPhrases = previousSummaries?.flatMap(s => s.can_now_say || []) || [];
    const hasPreviousSummaries = previousSummaries && previousSummaries.length > 0;

    const prompt = `You are a warm, encouraging language learning coach for a Polish language app designed for couples.

## User's Learning Data

**Total Words Learned:** ${totalWords}
**Words This Week:** ${recentWords.length}
**XP:** ${profile?.xp || 0}

**Vocabulary by Type:**
${Object.entries(wordTypes).map(([type, count]) => `- ${type}: ${count}`).join('\n')}

**Recent Words (last 7 days):**
${recentWords.slice(0, 20).map(w => `- ${w.word} (${w.translation})`).join('\n') || 'None yet'}

${gameStats && gameStats.totalGames > 0 ? `
**Game Performance (Recent ${gameStats.totalGames} games):**
- Overall Accuracy: ${overallAccuracy}%
- Total Correct: ${gameStats.totalCorrect} | Incorrect: ${gameStats.totalIncorrect}
- Game Breakdown:
${Object.entries(gameStats.byMode).map(([mode, stats]) => {
  const modeNames: Record<string, string> = {
    flashcards: 'Flashcards',
    multiple_choice: 'Multiple Choice',
    type_it: 'Type It',
    quick_fire: 'Quick Fire',
    ai_challenge: 'AI Challenge'
  };
  const accuracy = Math.round((stats.correct / (stats.correct + stats.incorrect)) * 100);
  return `  - ${modeNames[mode] || mode}: ${accuracy}% (${stats.games} games)`;
}).join('\n')}
` : ''}

${testStats ? `
**Level Test Performance:**
- Tests Completed: ${testStats.totalTests}
- Tests Passed: ${testStats.passed}
- Average Score: ${testStats.avgScore}%
${testStats.highestLevel ? `- Achieved Level: ${testStats.highestLevel}` : ''}
` : ''}

**Recent Conversation Topics:**
${recentConversationText || 'No conversations yet'}

**All Vocabulary (for comprehensive analysis):**
${vocabulary?.slice(0, 100).map(w => {
  let context = '';
  try {
    const parsed = JSON.parse(w.context || '{}');
    context = parsed.proTip || '';
  } catch {}
  return `${w.word} = ${w.translation}${context ? ` (${context})` : ''}`;
}).join('\n') || 'No vocabulary yet'}

${hasPreviousSummaries ? `
## IMPORTANT: Avoid Repetition

Previous journey summaries have already covered these topics. DO NOT repeat them:
- Topics already discussed: ${previousTopics.slice(0, 10).join(', ') || 'None'}
- Phrases already highlighted: ${previousPhrases.slice(0, 8).join(', ') || 'None'}

Generate FRESH, NOVEL insights that haven't been mentioned before. Look for:
- New vocabulary themes not yet explored
- Different grammar patterns
- New phrase combinations
- Recent progress not yet celebrated
` : ''}

## Your Task

Generate an encouraging, personalized progress summary for this learner. The tone should be warm and romantic since this is an app for couples learning each other's language.

Focus on:
1. What they've accomplished (specific words and topics) - BE SPECIFIC AND NOVEL
2. What they can now say to their partner - DIFFERENT phrases from before
3. Grammar concepts they've encountered
4. What to explore next

Keep it personal and encouraging. Reference specific words they've learned when possible. ${hasPreviousSummaries ? 'AVOID repeating themes from previous summaries.' : ''}`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: {
              type: Type.STRING,
              description: 'A short, creative title for this journey entry (3-5 words, like "Mastering Kitchen Polish" or "Love Words Week")'
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
        title: totalWords > 0 ? 'Your Polish Journey' : 'Getting Started',
        summary: totalWords > 0
          ? `You've learned ${totalWords} Polish words so far - that's wonderful progress! Each word brings you closer to meaningful conversations with your partner.`
          : "Your Polish journey is just beginning! Start chatting to learn your first words.",
        topicsExplored: totalWords > 0 ? ['Basic vocabulary', 'Everyday phrases'] : ['Getting started'],
        grammarHighlights: totalWords > 0 ? ['Word recognition', 'Basic pronunciation'] : [],
        canNowSay: recentWords.slice(0, 3).map(w => w.translation) || [],
        suggestions: ['Try learning greetings', 'Practice saying "I love you" in Polish']
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
      createdAt: generatedAt
    });

  } catch (error: any) {
    console.error('Error generating progress summary:', error);
    return res.status(500).json({ error: 'Failed to generate summary' });
  }
}
