/**
 * Vocabulary Context — Shared utility for fetching and formatting vocabulary mastery data.
 *
 * Used by boot-session.ts (cached per session) and as fallback in chat-stream.ts / chat.ts / live-token.ts.
 * Replaces the unreliable progress_summaries-based journey context with always-available
 * dictionary + word_scores data.
 */

export interface VocabularyItem {
  word: string;
  translation: string;
  wordType?: string;
  mastery: 'mastered' | 'learning' | 'struggling';
  streak?: number;
}

export interface VocabularyTier {
  vocabulary: VocabularyItem[];
  masteredWords: Array<{ word: string; translation: string; wordType?: string }>;
  weakSpots: Array<{ word: string; translation: string; failCount: number }>;
  recentWords: Array<{ word: string; translation: string }>;
  stats: { totalWords: number; masteredCount: number };
  lastActive: string | null;
}

/**
 * Fetch vocabulary context from dictionary + word_scores tables.
 * Cross-references to compute mastery tiers (mastered / learning / struggling).
 */
export async function fetchVocabularyContext(
  supabase: any,
  userId: string,
  targetLanguage: string
): Promise<VocabularyTier> {
  // Parallel fetch: vocabulary, scores, and total count
  const [vocabResult, scoresResult, countResult] = await Promise.all([
    supabase
      .from('dictionary')
      .select('id, word, translation, word_type')
      .eq('user_id', userId)
      .eq('language_code', targetLanguage)
      .order('unlocked_at', { ascending: false })
      .limit(200),
    supabase
      .from('word_scores')
      .select('word_id, correct_attempts, total_attempts, correct_streak, learned_at, updated_at')
      .eq('user_id', userId)
      .eq('language_code', targetLanguage),
    supabase
      .from('dictionary')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('language_code', targetLanguage)
  ]);

  const vocabulary = vocabResult.data || [];
  const scores = scoresResult.data || [];
  const totalWords = countResult.count || vocabulary.length;

  // Index scores by word_id for fast lookup
  const scoreMap = new Map<string, any>();
  for (const s of scores) {
    scoreMap.set(s.word_id, s);
  }

  // Classify each vocabulary item into mastery tiers
  const classified: VocabularyItem[] = vocabulary.map((v: any) => {
    const score = scoreMap.get(v.id);
    let mastery: 'mastered' | 'learning' | 'struggling' = 'learning';
    let streak = 0;

    if (score) {
      streak = score.correct_streak || 0;
      const totalAttempts = score.total_attempts || 0;
      const correctAttempts = score.correct_attempts || 0;
      const failRate = totalAttempts > 0 ? (totalAttempts - correctAttempts) / totalAttempts : 0;

      if (score.learned_at || streak >= 5) {
        mastery = 'mastered';
      } else if (failRate > 0.4 && streak < 3 && totalAttempts >= 3) {
        mastery = 'struggling';
      }
    }

    return {
      word: v.word,
      translation: v.translation,
      wordType: v.word_type || undefined,
      mastery,
      streak
    };
  });

  // Build mastered words (up to 50)
  const masteredWords = classified
    .filter(v => v.mastery === 'mastered')
    .slice(0, 50)
    .map(v => ({ word: v.word, translation: v.translation, wordType: v.wordType }));

  // Build weak spots with fail counts (up to 20)
  const weakSpots = classified
    .filter(v => v.mastery === 'struggling')
    .map(v => {
      const score = scoreMap.get(vocabulary.find((vv: any) => vv.word === v.word)?.id);
      const failCount = score ? (score.total_attempts - score.correct_attempts) : 0;
      return { word: v.word, translation: v.translation, failCount };
    })
    .sort((a, b) => b.failCount - a.failCount)
    .slice(0, 20);

  // Recent words (first 20 from vocab — already sorted by unlocked_at desc)
  const recentWords = vocabulary.slice(0, 20).map((v: any) => ({
    word: v.word,
    translation: v.translation
  }));

  // Mastered count from scores
  const masteredCount = scores.filter((s: any) => s.learned_at != null || (s.correct_streak || 0) >= 5).length;

  // Find last active time from scores
  const lastActive = scores.length > 0
    ? scores.reduce((latest: string | null, s: any) => {
        if (!s.updated_at) return latest;
        if (!latest) return s.updated_at;
        return s.updated_at > latest ? s.updated_at : latest;
      }, null)
    : null;

  return {
    vocabulary: classified,
    masteredWords,
    weakSpots,
    recentWords,
    stats: { totalWords, masteredCount },
    lastActive
  };
}

/**
 * Format vocabulary tier data into a prompt section for Gemini.
 * @param tier - Vocabulary tier data from fetchVocabularyContext
 * @param label - Optional label (e.g., partner name for tutors: "Anna's Progress")
 */
export function formatVocabularyPromptSection(tier: VocabularyTier, label?: string): string {
  if (tier.stats.totalWords === 0) {
    return 'VOCABULARY: New learner — no words yet. Start with basics.';
  }

  const header = label
    ? `VOCABULARY CONTEXT — ${label} (knows ${tier.stats.totalWords} words total, ${tier.stats.masteredCount} mastered):`
    : `VOCABULARY CONTEXT (knows ${tier.stats.totalWords} words total, ${tier.stats.masteredCount} mastered):`;

  const sections: string[] = [header];

  // Mastered words
  if (tier.masteredWords.length > 0) {
    const masteredList = tier.masteredWords
      .map(w => `${w.word} (${w.translation})${w.wordType ? ` [${w.wordType}]` : ''}`)
      .join(', ');
    sections.push(`Mastered (${tier.masteredWords.length}): ${masteredList}`);
  }

  // Recently learned
  if (tier.recentWords.length > 0) {
    const recentList = tier.recentWords
      .map(w => `${w.word} (${w.translation})`)
      .join(', ');
    sections.push(`Recently learned (${tier.recentWords.length}): ${recentList}`);
  }

  // Struggling words
  if (tier.weakSpots.length > 0) {
    const weakList = tier.weakSpots
      .map(w => `${w.word} / ${w.translation} (${w.failCount} failures)`)
      .join(', ');
    sections.push(`Struggling (${tier.weakSpots.length}): ${weakList}`);
  }

  sections.push('');
  sections.push('RULES:');
  sections.push('- Do NOT re-explain mastered words — reference them as known, build on them');
  sections.push('- Weave struggling words into responses naturally to give extra practice');
  sections.push('- Celebrate progress when relevant (milestones, streaks, new words)');

  return sections.join('\n');
}
