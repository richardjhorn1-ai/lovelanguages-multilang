import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType, ProgressSummary, SavedProgressSummary, WordScore } from '../types';
import { getLevelFromXP, getLevelProgress, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';
import { useTheme } from '../context/ThemeContext';

interface ProgressProps {
  profile: Profile;
}

interface SummaryIndex {
  id: string;
  summary: string;
  title?: string;
  words_learned: number;
  xp_at_time: number;
  level_at_time: string;
  created_at: string;
}

interface TestAttempt {
  id: string;
  from_level: string;
  to_level: string;
  passed: boolean;
  score: number;
  correct_answers: number;
  total_questions: number;
  completed_at: string;
  questions: any[];
}

// Get all level transitions up to current level for practice
function getPreviousLevelTests(currentLevel: string): { from: string; to: string; theme: string }[] {
  const tiers = ['Beginner', 'Elementary', 'Conversational', 'Proficient', 'Fluent', 'Master'];
  const allTransitions: { from: string; to: string; theme: string }[] = [];

  const themes: Record<string, string> = {
    'Beginner 1->2': 'First Words of Love',
    'Beginner 2->3': 'Checking In',
    'Beginner 3->Elementary 1': 'Feelings',
    'Elementary 1->2': 'Daily Life',
    'Elementary 2->3': 'Preferences',
    'Elementary 3->Conversational 1': 'Making Plans',
    'Conversational 1->2': 'Telling Stories',
    'Conversational 2->3': 'Deeper Feelings',
    'Conversational 3->Proficient 1': 'Complex Conversations',
    'Proficient 1->2': 'Future Dreams',
    'Proficient 2->3': 'Problem Solving',
    'Proficient 3->Fluent 1': 'Cultural Nuance',
    'Fluent 1->2': 'Advanced Expression',
    'Fluent 2->3': 'Native-Like Fluency',
    'Fluent 3->Master 1': 'Expert Polish',
    'Master 1->2': 'Cultural Mastery',
    'Master 2->3': 'Complete Mastery'
  };

  // Parse current level
  const match = currentLevel.match(/^(.+)\s+(\d)$/);
  if (!match) return allTransitions;

  const currentTier = match[1];
  const currentSubLevel = parseInt(match[2], 10);
  const currentTierIndex = tiers.indexOf(currentTier);

  // Generate all transitions up to current level
  for (let tierIdx = 0; tierIdx <= currentTierIndex; tierIdx++) {
    const tier = tiers[tierIdx];
    const maxSubLevel = tierIdx === currentTierIndex ? currentSubLevel : 3;

    for (let subLevel = 1; subLevel < maxSubLevel; subLevel++) {
      const from = `${tier} ${subLevel}`;
      const to = `${tier} ${subLevel + 1}`;
      // Theme key uses short format: "Beginner 1->2"
      const themeKey = `${tier} ${subLevel}->${subLevel + 1}`;
      allTransitions.push({ from, to, theme: themes[themeKey] || 'Practice' });
    }

    // Add tier transition (e.g., Beginner 3 -> Elementary 1)
    if (tierIdx < currentTierIndex) {
      const from = `${tier} 3`;
      const nextTier = tiers[tierIdx + 1];
      const to = `${nextTier} 1`;
      // Theme key for tier transitions: "Beginner 3->Elementary 1"
      const themeKey = `${from}->${to}`;
      allTransitions.push({ from, to, theme: themes[themeKey] || 'Practice' });
    }
  }

  return allTransitions.reverse(); // Most recent first
}

const Progress: React.FC<ProgressProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<DictionaryEntry[]>([]);
  const [summaryIndex, setSummaryIndex] = useState<SummaryIndex[]>([]);
  const [selectedSummary, setSelectedSummary] = useState<SavedProgressSummary | null>(null);
  const [loadingSummaries, setLoadingSummaries] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [showPreviousTests, setShowPreviousTests] = useState(false);
  const [testAttempts, setTestAttempts] = useState<TestAttempt[]>([]);
  const [selectedTestResult, setSelectedTestResult] = useState<TestAttempt | null>(null);
  const [expandedLevel, setExpandedLevel] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalWords: 0,
    nouns: 0,
    verbs: 0,
    adjectives: 0,
    phrases: 0,
    other: 0
  });

  // Tutor dashboard state
  const [scores, setScores] = useState<WordScore[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [partnerProfile, setPartnerProfile] = useState<Profile | null>(null);

  // Calculate level info - use partner's XP for tutors
  const targetXp = (profile.role === 'tutor' && partnerProfile) ? (partnerProfile.xp || 0) : (profile.xp || 0);
  const levelInfo = getLevelFromXP(targetXp);
  const levelProgress = getLevelProgress(targetXp);
  const tierColor = getTierColor(levelInfo.tier);

  // Theme
  const { accentHex } = useTheme();
  const previousTests = getPreviousLevelTests(levelInfo.displayName);

  // Tutor dashboard computed values
  const masteredWords = useMemo(() =>
    entries.filter(w => scoresMap.get(w.id)?.learned_at != null),
    [entries, scoresMap]
  );

  const quickPhrases = useMemo(() => {
    const phrases: Array<{ polish: string; english: string; tip: string }> = [];
    const verbs = masteredWords.filter(w => w.word_type === 'verb').slice(0, 3);
    const adjectives = masteredWords.filter(w => w.word_type === 'adjective').slice(0, 3);
    const nouns = masteredWords.filter(w => w.word_type === 'noun').slice(0, 3);

    if (verbs.length > 0) {
      phrases.push({
        polish: `${verbs[0].word} - use it tonight!`,
        english: verbs[0].translation,
        tip: 'Try using this in conversation'
      });
    }
    if (adjectives.length > 0 && nouns.length > 0) {
      phrases.push({
        polish: `${adjectives[0].word} ${nouns[0].word}`,
        english: `${adjectives[0].translation} ${nouns[0].translation}`,
        tip: 'Compliment them with this!'
      });
    }
    const hasLove = entries.some(w => w.word.includes('koch') || w.translation.toLowerCase().includes('love'));
    if (hasLove) {
      phrases.push({
        polish: 'Kocham cię bardzo',
        english: 'I love you very much',
        tip: 'Whisper this before bed'
      });
    }
    return phrases.slice(0, 3);
  }, [masteredWords, entries]);

  const recentWords = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
      .slice(0, 5);
  }, [entries]);

  const encouragementPrompts = useMemo(() => {
    const prompts: Array<{ icon: string; message: string; color: string }> = [];
    const masteredCount = masteredWords.length;
    const weakCount = scores.filter(s => s.fail_count > 0).length;

    if (masteredCount >= 10) {
      prompts.push({ icon: '🏆', message: `${masteredCount} words mastered! Time for a celebration date!`, color: 'text-amber-600' });
    }
    if (weakCount > 0 && weakCount <= 3) {
      prompts.push({ icon: '💪', message: `Just ${weakCount} words need work - you can quiz them tonight!`, color: 'text-teal-600' });
    }
    if (entries.length >= 5 && entries.length % 5 === 0) {
      prompts.push({ icon: '🎉', message: `${entries.length} words in their vocabulary - celebrate this milestone!`, color: 'text-[var(--accent-color)]' });
    }
    if (recentWords.length > 0) {
      prompts.push({ icon: '✨', message: `They just learned "${recentWords[0].word}" - use it in conversation today!`, color: 'text-purple-600' });
    }
    return prompts.slice(0, 2);
  }, [masteredWords, scores, entries, recentWords]);

  useEffect(() => {
    fetchEntries();
    fetchSummaryIndex();
    fetchTestAttempts();
    if (profile.role === 'tutor') {
      fetchScores();
      fetchPartnerProfile();
    }
  }, [profile]);

  const fetchTestAttempts = async () => {
    const { data } = await supabase
      .from('level_tests')
      .select('*')
      .eq('user_id', profile.id)
      .not('completed_at', 'is', null)
      .order('completed_at', { ascending: false });

    if (data) {
      setTestAttempts(data);
    }
  };

  const fetchScores = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id)
      ? profile.linked_user_id
      : profile.id;

    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId);

    if (scoreData) {
      setScores(scoreData as WordScore[]);
      const map = new Map<string, WordScore>();
      scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
      setScoresMap(map);
    }
  };

  const fetchPartnerProfile = async () => {
    if (!profile.linked_user_id) return;
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.linked_user_id)
      .single();
    if (data) setPartnerProfile(data);
  };

  // Get attempts for a specific level transition
  const getAttemptsForLevel = (from: string, to: string) => {
    return testAttempts.filter(a => a.from_level === from && a.to_level === to);
  };

  // Sync XP with word count if out of sync (handles legacy words added before XP system)
  useEffect(() => {
    const syncXpWithWordCount = async () => {
      if (stats.totalWords > 0 && (profile.xp || 0) < stats.totalWords) {
        const xpDifference = stats.totalWords - (profile.xp || 0);
        if (xpDifference > 0) {
          await geminiService.incrementXP(xpDifference);
          window.location.reload();
        }
      }
    };
    syncXpWithWordCount();
  }, [stats.totalWords, profile.xp]);

  const fetchEntries = async () => {
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;
    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId);

    if (data) {
      setEntries(data);
      const nouns = data.filter(e => e.word_type === 'noun').length;
      const verbs = data.filter(e => e.word_type === 'verb').length;
      const adjectives = data.filter(e => e.word_type === 'adjective').length;
      const phrases = data.filter(e => e.word_type === 'phrase').length;
      const other = data.length - nouns - verbs - adjectives - phrases;

      setStats({
        totalWords: data.length,
        nouns,
        verbs,
        adjectives,
        phrases,
        other
      });
    }
  };

  const fetchSummaryIndex = async () => {
    setLoadingSummaries(true);
    const result = await geminiService.listProgressSummaries();
    if (result.success && result.data) {
      setSummaryIndex(result.data);
      // Auto-select the most recent summary if exists
      if (result.data.length > 0) {
        loadSummary(result.data[0].id);
      }
    }
    setLoadingSummaries(false);
  };

  const loadSummary = async (summaryId: string) => {
    const result = await geminiService.getProgressSummaryById(summaryId);
    if (result.success && result.data) {
      setSelectedSummary(result.data);
    }
  };

  const generateNewSummary = async () => {
    setGenerating(true);
    const result = await geminiService.getProgressSummary();
    if (result.success && result.data) {
      // Add to index and select it
      const newEntry: SummaryIndex = {
        id: result.data.id,
        summary: result.data.summary,
        words_learned: result.data.wordsLearned,
        xp_at_time: result.data.xpAtTime,
        level_at_time: result.data.levelAtTime,
        created_at: result.data.createdAt
      };
      setSummaryIndex(prev => [newEntry, ...prev]);
      setSelectedSummary({
        id: result.data.id,
        summary: result.data.summary,
        topicsExplored: result.data.topicsExplored,
        grammarHighlights: result.data.grammarHighlights,
        canNowSay: result.data.canNowSay,
        suggestions: result.data.suggestions,
        wordsLearned: result.data.wordsLearned,
        newWordsSinceLastVisit: result.data.newWordsSinceLastVisit,
        generatedAt: result.data.generatedAt,
        xpAtTime: result.data.xpAtTime,
        levelAtTime: result.data.levelAtTime,
        createdAt: result.data.createdAt
      });
    }
    setGenerating(false);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
    });
  };

  // Generate a short title from the summary text
  const generateTitle = (summary: string): string => {
    // Try to extract a meaningful title from the summary
    const words = summary.split(' ').slice(0, 6);
    let title = words.join(' ');

    // If the summary is short enough, just truncate it nicely
    if (title.length > 35) {
      title = title.slice(0, 35).trim();
    }

    // Remove trailing punctuation and add ellipsis if needed
    title = title.replace(/[,.:;!?]$/, '');
    if (summary.length > title.length) {
      title += '...';
    }

    return title;
  };

  // Always allow taking tests
  const canTakeTest = levelInfo.nextLevel !== null;

  // Tutor Dashboard View
  if (profile.role === 'tutor') {
    return (
      <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[var(--bg-primary)]">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Partner's Level Card - Compact */}
          <div
            className="p-6 rounded-[2rem] shadow-lg text-white relative overflow-hidden"
            style={{
              background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`
            }}
          >
            <div className="absolute top-0 right-0 opacity-10">
              <ICONS.Heart className="w-24 h-24" />
            </div>
            <div className="flex items-center justify-between relative z-10">
              <div>
                <p className="text-white/60 text-[9px] font-black uppercase tracking-widest mb-1">
                  {partnerProfile?.full_name || 'Your Partner'}'s Level
                </p>
                <h2 className="text-2xl font-black">{levelInfo.displayName}</h2>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black">{targetXp}</p>
                <p className="text-white/60 text-[9px] font-black uppercase tracking-widest">XP</p>
              </div>
            </div>
            <div className="mt-4 relative z-10">
              <div className="flex justify-between text-[9px] font-bold text-white/60 mb-1">
                <span>Progress to {levelInfo.nextLevel || 'Max'}</span>
                <span>{levelProgress}%</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all duration-1000"
                  style={{ width: `${levelProgress}%` }}
                />
              </div>
            </div>
          </div>

          {/* Stats Overview - Compact Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)] text-center">
              <div className="text-2xl font-black text-[var(--accent-color)]">{stats.totalWords}</div>
              <div className="text-[9px] uppercase font-bold text-[var(--accent-color)] tracking-wider">Total Words</div>
            </div>
            <div className="bg-teal-50 p-4 rounded-2xl border border-teal-100 text-center">
              <div className="text-2xl font-black text-teal-600">{masteredWords.length}</div>
              <div className="text-[9px] uppercase font-bold text-teal-400 tracking-wider">Mastered</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100 text-center">
              <div className="text-2xl font-black text-amber-600">
                {scores.filter(s => s.fail_count > 0).length}
              </div>
              <div className="text-[9px] uppercase font-bold text-amber-400 tracking-wider">Needs Review</div>
            </div>
          </div>

          {/* Encouragement Prompts */}
          {encouragementPrompts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {encouragementPrompts.map((prompt, i) => (
                <div key={i} className="bg-gradient-to-br from-white to-[var(--accent-light)] p-4 rounded-2xl border border-[var(--accent-border)] shadow-sm flex items-center gap-3">
                  <span className="text-2xl">{prompt.icon}</span>
                  <p className={`font-bold text-sm ${prompt.color}`}>{prompt.message}</p>
                </div>
              ))}
            </div>
          )}

          {/* Two Column Layout: Phrases + Recent */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quick Phrases */}
            {quickPhrases.length > 0 && (
              <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)]">
                <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
                  <ICONS.Heart className="w-3.5 h-3.5 text-[var(--accent-color)]" />
                  Phrases for Tonight
                </h3>
                <div className="space-y-3">
                  {quickPhrases.map((phrase, i) => (
                    <div key={i} className="p-3 bg-gradient-to-r from-[var(--accent-light)] to-transparent dark:from-[var(--accent-light)] dark:to-transparent rounded-xl border border-[var(--accent-border)] dark:border-[var(--accent-border)]">
                      <p className="font-black text-[var(--accent-color)] dark:text-[var(--accent-color)]">{phrase.polish}</p>
                      <p className="text-xs text-[var(--text-secondary)] italic">{phrase.english}</p>
                      <p className="text-[9px] uppercase font-bold text-[var(--accent-color)] mt-1">{phrase.tip}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Recent Words */}
            {recentWords.length > 0 && (
              <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)]">
                <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
                  <ICONS.Clock className="w-3.5 h-3.5 text-teal-400" />
                  Recently Learned
                </h3>
                <div className="flex flex-wrap gap-2">
                  {recentWords.map((word, i) => (
                    <div key={i} className="px-3 py-1.5 bg-teal-50 rounded-full border border-teal-100">
                      <span className="font-bold text-teal-700 text-sm">{word.word}</span>
                      <span className="text-teal-400 mx-1.5">·</span>
                      <span className="text-xs text-teal-600">{word.translation}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Words to Practice Together */}
          <div className="bg-[var(--bg-card)] p-6 rounded-[2rem] shadow-sm border border-[var(--border-color)]">
            <h3 className="text-[10px] font-black uppercase text-[var(--text-secondary)] tracking-widest mb-4 flex items-center gap-2">
              <ICONS.Target className="w-3.5 h-3.5 text-amber-400" />
              Words to Practice Together
            </h3>
            <div className="space-y-2">
              {scores.filter(s => s.fail_count > 0).length === 0 ? (
                <p className="text-[var(--text-secondary)] text-center py-6 italic text-sm">No weak spots - they're doing great!</p>
              ) : (
                scores.filter(s => s.fail_count > 0).sort((a,b) => b.fail_count - a.fail_count).slice(0, 5).map(s => (
                  <div key={s.id} className="flex items-center justify-between p-3 bg-[var(--bg-primary)] rounded-xl border border-[var(--border-color)]">
                    <div>
                      <p className="font-bold text-[var(--text-primary)]">{s.dictionary?.word}</p>
                      <p className="text-xs text-[var(--text-secondary)] italic">{s.dictionary?.translation}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-red-500 font-bold text-sm">{s.fail_count} misses</div>
                      <button
                        onClick={() => navigate('/play')}
                        className="text-[9px] uppercase font-bold text-[var(--accent-color)] hover:text-[var(--accent-color)] transition-colors"
                      >
                        Quiz them →
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => navigate('/play')}
              className="bg-[var(--bg-card)] p-5 rounded-[1.5rem] border border-[var(--border-color)] shadow-sm text-center hover:shadow-md transition-all"
            >
              <ICONS.Play className="w-6 h-6 mx-auto mb-1.5 text-[var(--accent-color)]" />
              <p className="text-sm font-bold text-[var(--text-primary)]">Play Together</p>
              <p className="text-[9px] text-[var(--text-secondary)]">Quiz games & activities</p>
            </button>
            <button
              onClick={() => navigate('/log')}
              className="bg-[var(--bg-card)] p-5 rounded-[1.5rem] border border-[var(--border-color)] shadow-sm text-center hover:shadow-md transition-all"
            >
              <ICONS.Book className="w-6 h-6 mx-auto mb-1.5 text-[var(--accent-color)]" />
              <p className="text-sm font-bold text-[var(--text-primary)]">Their Vocabulary</p>
              <p className="text-[9px] text-[var(--text-secondary)]">Browse Love Log</p>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8 bg-[var(--bg-primary)]">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Level & XP Card */}
        <div
          className="p-8 rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`
          }}
        >
          <div className="absolute top-0 right-0 opacity-10">
            <ICONS.Sparkles className="w-32 h-32" />
          </div>

          <div className="flex items-center justify-between mb-6 relative z-10">
            <div>
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Current Level</p>
              <h2 className="text-3xl font-black">{levelInfo.displayName}</h2>
            </div>
            <div className="text-right">
              <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Total XP</p>
              <p className="text-2xl font-black">{profile.xp || 0}</p>
            </div>
          </div>

          <div className="relative z-10 mb-6">
            <div className="flex justify-between text-[10px] font-bold text-white/60 mb-2">
              <span>Progress to {levelInfo.nextLevel || 'Max Level'}</span>
              <span>{levelProgress}%</span>
            </div>
            <div className="h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            {levelInfo.nextLevel && (
              <p className="text-[10px] text-white/60 mt-2 text-center">
                {levelInfo.xpToNextLevel} XP to {levelInfo.nextLevel}
              </p>
            )}
          </div>

          {/* Take Level Test Button - Always visible for retakes */}
          {canTakeTest && (
            <button
              onClick={() => navigate(`/test?from=${encodeURIComponent(levelInfo.displayName)}&to=${encodeURIComponent(levelInfo.nextLevel!)}`)}
              className="w-full bg-white text-gray-800 py-4 rounded-2xl text-sm font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-3"
            >
              <ICONS.Star className="w-5 h-5" style={{ color: tierColor }} />
              {levelInfo.canTakeTest ? 'Take Level Test' : 'Practice Level Test'}
            </button>
          )}

          {!canTakeTest && (
            <div className="text-center text-white/50 text-xs">
              You've reached the maximum level!
            </div>
          )}

          {/* Practice Previous Levels */}
          {previousTests.length > 0 && (
            <div className="mt-4 relative z-10">
              <button
                onClick={() => setShowPreviousTests(!showPreviousTests)}
                className="w-full text-white/80 text-xs font-bold flex items-center justify-center gap-2 py-2 hover:text-white transition-colors"
              >
                <ICONS.RefreshCw className="w-3.5 h-3.5" />
                Practice Previous Levels
                <ICONS.ChevronDown className={`w-3.5 h-3.5 transition-transform ${showPreviousTests ? 'rotate-180' : ''}`} />
              </button>

              {showPreviousTests && (
                <div className="mt-3 bg-white/10 backdrop-blur-sm rounded-2xl p-3 max-h-64 overflow-y-auto">
                  <div className="space-y-2">
                    {previousTests.map((test, idx) => {
                      const attempts = getAttemptsForLevel(test.from, test.to);
                      const levelKey = `${test.from}->${test.to}`;
                      const isExpanded = expandedLevel === levelKey;

                      return (
                        <div key={idx} className="bg-white/10 rounded-xl overflow-hidden">
                          <div className="flex items-center">
                            <button
                              onClick={() => navigate(`/test?from=${encodeURIComponent(test.from)}&to=${encodeURIComponent(test.to)}`)}
                              className="flex-1 text-left px-4 py-3 hover:bg-white/10 transition-all flex items-center justify-between group"
                            >
                              <div>
                                <p className="text-white text-xs font-bold">{test.theme}</p>
                                <p className="text-white/60 text-[10px]">{test.from} → {test.to}</p>
                              </div>
                              <ICONS.Play className="w-4 h-4 text-white/40 group-hover:text-white transition-colors" />
                            </button>
                            {attempts.length > 0 && (
                              <button
                                onClick={() => setExpandedLevel(isExpanded ? null : levelKey)}
                                className="px-3 py-3 text-white/60 hover:text-white transition-colors border-l border-white/10"
                                title="View previous attempts"
                              >
                                <ICONS.List className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Previous Attempts for this level */}
                          {isExpanded && attempts.length > 0 && (
                            <div className="px-3 pb-3 border-t border-white/10 pt-2">
                              <p className="text-[9px] text-white/40 uppercase tracking-wider font-bold mb-2">Previous Attempts</p>
                              <div className="space-y-1">
                                {attempts.slice(0, 5).map((attempt) => (
                                  <button
                                    key={attempt.id}
                                    onClick={() => setSelectedTestResult(attempt)}
                                    className="w-full flex items-center justify-between px-3 py-2 bg-white/5 hover:bg-white/15 rounded-lg text-left transition-all"
                                  >
                                    <div className="flex items-center gap-2">
                                      <div className={`w-5 h-5 rounded-full flex items-center justify-center ${attempt.passed ? 'bg-green-500/20' : 'bg-amber-500/20'}`}>
                                        {attempt.passed ? (
                                          <ICONS.Check className="w-3 h-3 text-green-400" />
                                        ) : (
                                          <ICONS.X className="w-3 h-3 text-amber-400" />
                                        )}
                                      </div>
                                      <span className="text-[10px] text-white/70">
                                        {new Date(attempt.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-xs font-bold ${attempt.passed ? 'text-green-400' : 'text-amber-400'}`}>
                                        {attempt.score}%
                                      </span>
                                      <ICONS.ChevronRight className="w-3 h-3 text-white/40" />
                                    </div>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Goal Sticky Note - Why they're learning */}
        {profile.onboarding_data?.learningReason && (
          <div
            className="relative bg-amber-50 dark:bg-amber-900/30 p-6 rounded-2xl shadow-md border-l-4 border-amber-400 transform rotate-[0.5deg]"
            style={{ boxShadow: '4px 4px 0 rgba(251, 191, 36, 0.3)' }}
          >
            <div className="absolute -top-2 -left-2 w-8 h-8 bg-amber-200 dark:bg-amber-700 rounded-full flex items-center justify-center shadow">
              <span className="text-sm">📌</span>
            </div>
            <div className="ml-4">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-2">
                Why I'm learning Polish
              </p>
              <p className="text-[var(--text-primary)] font-medium italic leading-relaxed">
                "{profile.onboarding_data.learningReason}"
              </p>
              {profile.partner_name && (
                <p className="text-xs text-amber-500 mt-3 font-bold">
                  For {profile.partner_name} 💕
                </p>
              )}
            </div>
          </div>
        )}

        {/* Love Log Stats Card - Moved above Learning Journey */}
        <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[11px] font-black flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
              <ICONS.Book className="w-4 h-4" style={{ color: tierColor }} />
              Love Log Stats
            </h3>
            <span className="text-3xl font-black" style={{ color: tierColor }}>{stats.totalWords}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Nouns', count: stats.nouns },
              { label: 'Verbs', count: stats.verbs },
              { label: 'Adjectives', count: stats.adjectives },
              { label: 'Phrases', count: stats.phrases }
            ].map(stat => (
              <div key={stat.label} className="p-4 rounded-2xl border text-center" style={{ backgroundColor: `${accentHex}10`, borderColor: `${accentHex}30`, color: accentHex }}>
                <p className="text-2xl font-black">{stat.count}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Learning Journey Book/Diary */}
        <div className="bg-[var(--bg-card)] rounded-[2.5rem] border border-[var(--border-color)] shadow-sm overflow-hidden">
          <div className="p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <h3 className="text-[11px] font-black flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
              <ICONS.Book className="w-4 h-4" style={{ color: tierColor }} />
              Learning Journey
            </h3>
            <button
              onClick={generateNewSummary}
              disabled={generating}
              className="px-4 py-2 rounded-xl text-xs font-bold text-white flex items-center gap-2 transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: tierColor }}
            >
              {generating ? (
                <>
                  <ICONS.RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <ICONS.Sparkles className="w-3.5 h-3.5" />
                  New Entry
                </>
              )}
            </button>
          </div>

          <div className="flex min-h-[400px]">
            {/* Left Page: Index */}
            <div className="w-1/3 border-r border-[var(--border-color)] bg-[var(--bg-primary)] p-4">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Journal Entries
              </p>

              {loadingSummaries ? (
                <div className="text-center py-8">
                  <ICONS.RefreshCw className="w-5 h-5 mx-auto text-[var(--text-secondary)] animate-spin" />
                </div>
              ) : summaryIndex.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-xs text-center py-8 italic">
                  No entries yet.<br/>Click "New Entry" to start!
                </p>
              ) : (
                <div className="space-y-2 max-h-[340px] overflow-y-auto">
                  {summaryIndex.map((entry, idx) => (
                    <button
                      key={entry.id}
                      onClick={() => loadSummary(entry.id)}
                      className={`w-full text-left p-3 rounded-xl transition-all ${
                        selectedSummary?.id === entry.id
                          ? 'bg-[var(--bg-card)] shadow-sm border-l-4'
                          : 'hover:bg-[var(--bg-card)]/70'
                      }`}
                      style={selectedSummary?.id === entry.id ? { borderLeftColor: tierColor } : {}}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-bold text-[var(--text-secondary)]">
                          {formatDate(entry.created_at)}
                        </span>
                        <span
                          className="text-[9px] font-bold px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                        >
                          {entry.level_at_time}
                        </span>
                      </div>
                      <p className="text-xs font-semibold text-[var(--text-primary)] line-clamp-1">
                        {entry.title || generateTitle(entry.summary)}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-1">
                        {entry.words_learned} words • {entry.xp_at_time} XP
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Page: Selected Entry */}
            <div className="flex-1 p-6">
              {!selectedSummary ? (
                <div className="h-full flex flex-col items-center justify-center text-center">
                  <ICONS.Book className="w-12 h-12 text-[var(--text-secondary)] opacity-50 mb-4" />
                  <p className="text-[var(--text-secondary)] text-sm">
                    {summaryIndex.length === 0
                      ? "Start your learning journey by clicking 'New Entry'"
                      : "Select an entry to view"}
                  </p>
                </div>
              ) : (
                <div className="space-y-5">
                  {/* Entry Header */}
                  <div className="flex items-center justify-between pb-4 border-b border-[var(--border-color)]">
                    <div>
                      <p className="text-[10px] text-[var(--text-secondary)] font-bold">
                        {new Date(selectedSummary.createdAt).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })}
                      </p>
                      <p
                        className="text-sm font-bold"
                        style={{ color: tierColor }}
                      >
                        {selectedSummary.levelAtTime} • {selectedSummary.xpAtTime} XP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black" style={{ color: tierColor }}>
                        {selectedSummary.wordsLearned}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)] font-bold uppercase">Words</p>
                    </div>
                  </div>

                  {/* Main Summary */}
                  <p className="text-[var(--text-primary)] leading-relaxed text-sm">
                    {selectedSummary.summary}
                  </p>

                  {/* What You Can Say */}
                  {selectedSummary.canNowSay && selectedSummary.canNowSay.length > 0 && (
                    <div>
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                        You Can Now Say
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {selectedSummary.canNowSay.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-3 py-1.5 rounded-full text-xs font-medium"
                            style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics & Grammar */}
                  <div className="grid grid-cols-2 gap-4">
                    {selectedSummary.topicsExplored && selectedSummary.topicsExplored.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                          Topics
                        </p>
                        <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                          {selectedSummary.topicsExplored.slice(0, 4).map((topic, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: tierColor }} />
                              {topic}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedSummary.grammarHighlights && selectedSummary.grammarHighlights.length > 0 && (
                      <div>
                        <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                          Grammar
                        </p>
                        <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                          {selectedSummary.grammarHighlights.slice(0, 4).map((grammar, idx) => (
                            <li key={idx} className="flex items-center gap-2">
                              <span className="w-1 h-1 rounded-full" style={{ backgroundColor: tierColor }} />
                              {grammar}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {selectedSummary.suggestions && selectedSummary.suggestions.length > 0 && (
                    <div className="bg-[var(--bg-primary)] rounded-xl p-4">
                      <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2">
                        Up Next
                      </p>
                      <ul className="text-xs text-[var(--text-secondary)] space-y-1">
                        {selectedSummary.suggestions.map((suggestion, idx) => (
                          <li key={idx}>→ {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => navigate('/play')}
            className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm text-center hover:shadow-md transition-all"
          >
            <ICONS.Play className="w-8 h-8 mx-auto mb-2 text-[var(--accent-color)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Practice</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Flashcards & quizzes</p>
          </button>

          <button
            onClick={() => navigate('/log')}
            className="bg-[var(--bg-card)] p-6 rounded-[2rem] border border-[var(--border-color)] shadow-sm text-center hover:shadow-md transition-all"
          >
            <ICONS.Book className="w-8 h-8 mx-auto mb-2 text-[var(--accent-color)]" />
            <p className="text-sm font-bold text-[var(--text-primary)]">Love Log</p>
            <p className="text-[10px] text-[var(--text-secondary)]">Your vocabulary</p>
          </button>
        </div>

      </div>

      {/* Test Results Modal */}
      {selectedTestResult && (
        <div
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTestResult(null)}
        >
          <div
            className="bg-[var(--bg-card)] rounded-[2rem] max-w-md w-full max-h-[80vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  Test Results
                </h3>
                <button
                  onClick={() => setSelectedTestResult(null)}
                  className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  <ICONS.X className="w-5 h-5" />
                </button>
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-14 h-14 rounded-full flex items-center justify-center ${selectedTestResult.passed ? 'bg-green-100 dark:bg-green-900/30' : 'bg-amber-100 dark:bg-amber-900/30'}`}>
                  {selectedTestResult.passed ? (
                    <ICONS.Check className="w-7 h-7 text-green-500" />
                  ) : (
                    <ICONS.RefreshCw className="w-7 h-7 text-amber-500" />
                  )}
                </div>
                <div>
                  <p className="text-2xl font-black" style={{ color: selectedTestResult.passed ? '#10B981' : '#F59E0B' }}>
                    {selectedTestResult.score}%
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    {selectedTestResult.correct_answers} / {selectedTestResult.total_questions} correct
                  </p>
                </div>
              </div>
              <p className="text-xs text-[var(--text-secondary)] mt-3">
                {selectedTestResult.from_level} → {selectedTestResult.to_level} • {new Date(selectedTestResult.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Questions Review */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                Your Answers
              </p>
              <div className="space-y-3">
                {selectedTestResult.questions?.map((q: any, idx: number) => {
                  // Find the answer for this question if we have graded answers stored
                  const isCorrect = q.userAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();

                  return (
                    <div key={q.id || idx} className="bg-[var(--bg-primary)] rounded-xl p-3">
                      <div className="flex items-start gap-2">
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                          q.userAnswer ? (isCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30') : 'bg-[var(--border-color)]'
                        }`}>
                          {q.userAnswer ? (
                            isCorrect ? (
                              <ICONS.Check className="w-3 h-3 text-green-600 dark:text-green-400" />
                            ) : (
                              <ICONS.X className="w-3 h-3 text-red-600 dark:text-red-400" />
                            )
                          ) : (
                            <span className="text-[8px] text-[var(--text-secondary)]">?</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                            Q{idx + 1} • {q.type?.replace('_', ' ')}
                          </p>
                          <p className="text-xs font-medium text-[var(--text-primary)] mb-2">
                            {q.question}
                          </p>
                          {q.userAnswer && (
                            <p className={`text-xs ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              Your answer: {q.userAnswer}
                            </p>
                          )}
                          {!isCorrect && q.correctAnswer && (
                            <p className="text-xs text-green-600">
                              Correct: {q.correctAnswer}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[var(--border-color)]">
              <button
                onClick={() => {
                  setSelectedTestResult(null);
                  navigate(`/test?from=${encodeURIComponent(selectedTestResult.from_level)}&to=${encodeURIComponent(selectedTestResult.to_level)}`);
                }}
                className="w-full py-3 rounded-xl font-bold text-white text-sm"
                style={{ backgroundColor: tierColor }}
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
