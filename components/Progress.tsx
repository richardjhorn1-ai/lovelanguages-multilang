import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { geminiService } from '../services/gemini';
import { Profile, DictionaryEntry, WordType, ProgressSummary, SavedProgressSummary, WordScore } from '../types';
import { getLevelFromXP, getLevelProgress, getTierColor, translateLevel } from '../services/level-utils';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS } from '../constants/language-config';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../services/sounds';
import GameHistory from './GameHistory';
import TutorAnalyticsDashboard from './tutor/TutorAnalyticsDashboard';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';

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

// Theme keys for translation - maps level transitions to i18n keys
const THEME_KEYS: Record<string, string> = {
  'Beginner 1->2': 'firstWords',
  'Beginner 2->3': 'checkingIn',
  'Beginner 3->Elementary 1': 'feelings',
  'Elementary 1->2': 'dailyLife',
  'Elementary 2->3': 'preferences',
  'Elementary 3->Conversational 1': 'makingPlans',
  'Conversational 1->2': 'tellingStories',
  'Conversational 2->3': 'deeperFeelings',
  'Conversational 3->Proficient 1': 'complexConversations',
  'Proficient 1->2': 'futureDreams',
  'Proficient 2->3': 'problemSolving',
  'Proficient 3->Fluent 1': 'culturalNuance',
  'Fluent 1->2': 'advancedExpression',
  'Fluent 2->3': 'nativeFluency',
  'Fluent 3->Master 1': 'expertLevel',
  'Master 1->2': 'culturalMastery',
  'Master 2->3': 'completeMastery'
};

// Tier names for data matching (stored in DB as English)
const TIER_NAMES = ['Beginner', 'Elementary', 'Conversational', 'Proficient', 'Fluent', 'Master'];

// Get all level transitions up to current level for practice
function getPreviousLevelTests(currentLevel: string): { from: string; to: string; themeKey: string }[] {
  const allTransitions: { from: string; to: string; themeKey: string }[] = [];

  // Parse current level
  const match = currentLevel.match(/^(.+)\s+(\d)$/);
  if (!match) return allTransitions;

  const currentTier = match[1];
  const currentSubLevel = parseInt(match[2], 10);
  const currentTierIndex = TIER_NAMES.indexOf(currentTier);

  // Generate all transitions up to current level
  for (let tierIdx = 0; tierIdx <= currentTierIndex; tierIdx++) {
    const tier = TIER_NAMES[tierIdx];
    const maxSubLevel = tierIdx === currentTierIndex ? currentSubLevel : 3;

    for (let subLevel = 1; subLevel < maxSubLevel; subLevel++) {
      const from = `${tier} ${subLevel}`;
      const to = `${tier} ${subLevel + 1}`;
      // Theme key uses short format: "Beginner 1->2"
      const transitionKey = `${tier} ${subLevel}->${subLevel + 1}`;
      allTransitions.push({ from, to, themeKey: THEME_KEYS[transitionKey] || 'practice' });
    }

    // Add tier transition (e.g., Beginner 3 -> Elementary 1)
    if (tierIdx < currentTierIndex) {
      const from = `${tier} 3`;
      const nextTier = TIER_NAMES[tierIdx + 1];
      const to = `${nextTier} 1`;
      // Theme key for tier transitions: "Beginner 3->Elementary 1"
      const transitionKey = `${from}->${to}`;
      allTransitions.push({ from, to, themeKey: THEME_KEYS[transitionKey] || 'practice' });
    }
  }

  return allTransitions.reverse(); // Most recent first
}

const Progress: React.FC<ProgressProps> = ({ profile }) => {
  const { t } = useTranslation();
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
  const [showJourneyMenu, setShowJourneyMenu] = useState(false);
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
  const { targetLanguage, targetName, languageParams } = useLanguage();
  const { isOnline, cachedWordCount, lastSyncTime, pendingCount, isSyncing: offlineSyncing, cacheVocabulary, getCachedVocabulary, cacheWordScores, getCachedWordScores } = useOffline(profile.id, targetLanguage);
  const previousTests = getPreviousLevelTests(levelInfo.displayName);


  // Tutor dashboard computed values
  const masteredWords = useMemo(() =>
    entries.filter(w => scoresMap.get(w.id)?.learned_at != null),
    [entries, scoresMap]
  );

  const quickPhrases = useMemo(() => {
    const phrases: Array<{ targetWord: string; nativeWord: string; tip: string }> = [];
    const verbs = masteredWords.filter(w => w.word_type === 'verb').slice(0, 3);
    const adjectives = masteredWords.filter(w => w.word_type === 'adjective').slice(0, 3);
    const nouns = masteredWords.filter(w => w.word_type === 'noun').slice(0, 3);

    if (verbs.length > 0) {
      phrases.push({
        targetWord: t('progress.tutor.useItTonight', { word: verbs[0].word }),
        nativeWord: verbs[0].translation,
        tip: t('progress.tutor.tryInConversation')
      });
    }
    if (adjectives.length > 0 && nouns.length > 0) {
      phrases.push({
        targetWord: `${adjectives[0].word} ${nouns[0].word}`,
        nativeWord: `${adjectives[0].translation} ${nouns[0].translation}`,
        tip: t('progress.tutor.complimentThem')
      });
    }
    const hasLove = entries.some(w => w.word.includes('koch') || w.translation.toLowerCase().includes('love'));
    if (hasLove) {
      const lovePhrase = LANGUAGE_CONFIGS[targetLanguage]?.examples.iLoveYou || 'I love you';
      phrases.push({
        targetWord: lovePhrase,
        nativeWord: t('progress.tutor.iLoveYouVeryMuch'),
        tip: t('progress.tutor.whisperBeforeBed')
      });
    }
    return phrases.slice(0, 3);
  }, [masteredWords, entries, t, targetLanguage]);

  const recentWords = useMemo(() => {
    return [...entries]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [entries]);

  const encouragementPrompts = useMemo(() => {
    const prompts: Array<{ icon: React.ReactNode; message: string; color: string }> = [];
    const masteredCount = masteredWords.length;
    const weakCount = scores.filter(s => (s.total_attempts || 0) > (s.correct_attempts || 0)).length;

    if (masteredCount >= 10) {
      prompts.push({ icon: <ICONS.Trophy className="w-5 h-5" />, message: t('progress.encouragement.wordsMastered', { count: masteredCount }), color: 'text-amber-600' });
    }
    if (weakCount > 0 && weakCount <= 3) {
      prompts.push({ icon: <ICONS.TrendingUp className="w-5 h-5" />, message: t('progress.encouragement.wordsNeedWork', { count: weakCount }), color: 'text-teal-600' });
    }
    if (entries.length >= 5 && entries.length % 5 === 0) {
      prompts.push({ icon: <ICONS.Award className="w-5 h-5" />, message: t('progress.encouragement.milestone', { count: entries.length }), color: 'text-[var(--accent-color)]' });
    }
    if (recentWords.length > 0) {
      prompts.push({ icon: <ICONS.Sparkles className="w-5 h-5" />, message: t('progress.encouragement.justLearned', { word: recentWords[0].word }), color: 'text-purple-600' });
    }
    return prompts.slice(0, 2);
  }, [masteredWords, scores, entries, recentWords, t]);

  useEffect(() => {
    fetchEntries();
    fetchSummaryIndex();
    fetchTestAttempts();
    if (profile.role === 'tutor') {
      fetchScores();
      fetchPartnerProfile();
    }
  }, [profile, targetLanguage]);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    const handleLanguageSwitch = () => {
      fetchEntries();
      fetchSummaryIndex();
      fetchTestAttempts();
      if (profile.role === 'tutor') {
        fetchScores();
      }
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, [profile.role]);

  const fetchTestAttempts = async () => {
    const { data } = await supabase
      .from('level_tests')
      .select('*')
      .eq('user_id', profile.id)
      .eq('language_code', targetLanguage)
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
      .from('word_scores')
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
    // Offline: load from IndexedDB cache
    if (!isOnline) {
      const cachedVocab = await getCachedVocabulary();
      if (cachedVocab && cachedVocab.length > 0) {
        setEntries(cachedVocab);
        const nouns = cachedVocab.filter((e: any) => e.word_type === 'noun').length;
        const verbs = cachedVocab.filter((e: any) => e.word_type === 'verb').length;
        const adjectives = cachedVocab.filter((e: any) => e.word_type === 'adjective').length;
        const phrases = cachedVocab.filter((e: any) => e.word_type === 'phrase').length;
        const other = cachedVocab.length - nouns - verbs - adjectives - phrases;
        setStats({ totalWords: cachedVocab.length, nouns, verbs, adjectives, phrases, other });
      }
      return;
    }

    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id) ? profile.linked_user_id : profile.id;
    const { data } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

    if (data) {
      setEntries(data);
      await cacheVocabulary(data);
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
    const result = await geminiService.listProgressSummaries(languageParams);
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
    const result = await geminiService.getProgressSummaryById(summaryId, languageParams);
    if (result.success && result.data) {
      setSelectedSummary(result.data);
    }
  };

  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [retrying, setRetrying] = useState(false);
  const lastGeneratedRef = useRef<number>(0);

  const handleSummaryResult = (data: any) => {
    if (!data.cached) sounds.play('notification');
    const newEntry: SummaryIndex = {
      id: data.id,
      summary: data.summary,
      words_learned: data.wordsLearned,
      xp_at_time: data.xpAtTime,
      level_at_time: data.levelAtTime,
      created_at: data.createdAt
    };
    // Only add to index if not cached (avoid duplicates)
    if (!data.cached) {
      setSummaryIndex(prev => [newEntry, ...prev]);
    }
    setSelectedSummary({
      id: data.id,
      summary: data.summary,
      topicsExplored: data.topicsExplored,
      grammarHighlights: data.grammarHighlights,
      canNowSay: data.canNowSay,
      suggestions: data.suggestions,
      wordsLearned: data.wordsLearned,
      newWordsSinceLastVisit: data.newWordsSinceLastVisit,
      generatedAt: data.generatedAt,
      xpAtTime: data.xpAtTime,
      levelAtTime: data.levelAtTime,
      createdAt: data.createdAt
    });
  };

  const generateNewSummary = async () => {
    // Cooldown only after non-cached SUCCESS (not after errors or cache hits)
    if (Date.now() - lastGeneratedRef.current < 30_000) {
      setSummaryError(t('progress.journey.cooldown', 'Please wait before generating another entry.'));
      return;
    }
    setGenerating(true);
    setSummaryError(null);
    setRetrying(false);
    try {
      let result = await geminiService.getProgressSummary(languageParams);
      // Single transparent auto-retry on retryable errors (transient 503)
      if (!result.success && result.retryable) {
        setRetrying(true);
        await new Promise(r => setTimeout(r, 3000));
        result = await geminiService.getProgressSummary(languageParams);
        setRetrying(false);
      }
      if (result.success && result.data) {
        if (!result.data.cached) lastGeneratedRef.current = Date.now();
        handleSummaryResult(result.data);
        setSummaryError(null);
      } else {
        setSummaryError(result.error || t('progress.journey.generateFailed', 'Failed to generate summary.'));
      }
    } catch (e) {
      setSummaryError(t('progress.journey.generateFailed', 'Failed to generate summary.'));
    } finally {
      setGenerating(false);
      setRetrying(false);
    }
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

  // Tutor Dashboard View - Use new analytics dashboard
  if (profile.role === 'tutor') {
    return <TutorAnalyticsDashboard profile={profile} />;
  }

  return (
    <div className="h-full overflow-y-auto p-3 md:p-8">
      <div className="max-w-4xl mx-auto space-y-4 md:space-y-6">

        {!isOnline && (
          <OfflineIndicator
            isOnline={isOnline}
            cachedWordCount={cachedWordCount}
            lastSyncTime={lastSyncTime}
            pendingCount={pendingCount}
            isSyncing={offlineSyncing}
          />
        )}

        {/* Level & XP Card */}
        <div
          className="p-4 md:p-8 rounded-2xl md:rounded-[2.5rem] shadow-xl text-white relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${tierColor} 0%, ${tierColor}dd 100%)`
          }}
        >
          <div className="absolute top-0 right-0 opacity-10">
            <ICONS.Sparkles className="w-20 h-20 md:w-32 md:h-32" />
          </div>

          <div className="flex items-center justify-between mb-4 md:mb-6 relative z-10">
            <div>
              <p className="text-white/65 text-scale-micro font-black uppercase tracking-widest mb-0.5 md:mb-1">{t('progress.level.current')}</p>
              <h2 className="text-scale-heading font-black font-header">{translateLevel(levelInfo.displayName, t)}</h2>
            </div>
            <div className="text-right">
              <p className="text-white/65 text-scale-micro font-black uppercase tracking-widest mb-0.5 md:mb-1">{t('progress.level.totalXp')}</p>
              <p className="text-scale-heading font-black">{profile.xp || 0}</p>
            </div>
          </div>

          <div className="relative z-10 mb-4 md:mb-6">
            <div className="flex justify-between text-scale-micro font-bold text-white/65 mb-1.5 md:mb-2">
              <span>{t('progress.level.progressTo', { level: translateLevel(levelInfo.nextLevel, t) || t('progress.level.maxLevel') })}</span>
              <span>{levelProgress}%</span>
            </div>
            <div className="h-2 md:h-3 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-1000 shadow-lg"
                style={{ width: `${levelProgress}%` }}
              />
            </div>
            {levelInfo.nextLevel && (
              <p className="text-scale-micro text-white/65 mt-1.5 md:mt-2 text-center">
                {t('progress.level.xpToNext', { xp: levelInfo.xpToNextLevel, level: translateLevel(levelInfo.nextLevel, t) })}
              </p>
            )}
          </div>

          {/* Take Level Test Button - Always visible for retakes */}
          {canTakeTest && (
            <button
              onClick={() => navigate(`/test?from=${encodeURIComponent(levelInfo.displayName)}&to=${encodeURIComponent(levelInfo.nextLevel!)}`)}
              className="w-full bg-white text-[var(--text-primary)] py-3 md:py-4 rounded-xl md:rounded-2xl text-scale-label font-black uppercase tracking-widest shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 md:gap-3"
            >
              <ICONS.Star className="w-4 h-4 md:w-5 md:h-5" style={{ color: tierColor }} />
              {levelInfo.canTakeTest ? t('progress.level.takeTest') : t('progress.level.practiceTest')}
            </button>
          )}

          {!canTakeTest && (
            <div className="text-center text-white/50 text-scale-caption">
              {t('progress.level.reachedMax')}
            </div>
          )}

          {/* Practice Previous Levels */}
          {previousTests.length > 0 && (
            <div className="mt-4 relative z-10">
              <button
                onClick={() => setShowPreviousTests(!showPreviousTests)}
                className="w-full text-white/85 text-scale-caption font-bold flex items-center justify-center gap-2 py-2 hover:text-white transition-colors"
              >
                <ICONS.RefreshCw className="w-3.5 h-3.5" />
                {t('progress.previousTests.title')}
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
                                <p className="text-white text-scale-caption font-bold">{t(`progress.levelThemes.${test.themeKey}`)}</p>
                                <p className="text-white/65 text-[10px]">{test.from} → {test.to}</p>
                              </div>
                              <ICONS.Play className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />
                            </button>
                            {attempts.length > 0 && (
                              <button
                                onClick={() => setExpandedLevel(isExpanded ? null : levelKey)}
                                className="px-3 py-3 text-white/65 hover:text-white transition-colors border-l border-white/10"
                                title={t('progress.previousTests.viewAttempts')}
                              >
                                <ICONS.List className="w-4 h-4" />
                              </button>
                            )}
                          </div>

                          {/* Previous Attempts for this level */}
                          {isExpanded && attempts.length > 0 && (
                            <div className="px-3 pb-3 border-t border-white/10 pt-2">
                              <p className="text-[9px] text-white/50 uppercase tracking-wider font-bold mb-2">{t('progress.previousTests.previousAttempts')}</p>
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
                                      <span className="text-[10px] text-white/65">
                                        {new Date(attempt.completed_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      <span className={`text-scale-caption font-bold ${attempt.passed ? 'text-green-400' : 'text-amber-400'}`}>
                                        {attempt.score}%
                                      </span>
                                      <ICONS.ChevronRight className="w-3 h-3 text-white/50" />
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

        {/* Motivation Card - Why they're learning */}
        {profile.onboarding_data?.learningReason && (
          <div className="relative overflow-hidden bg-gradient-to-br from-[var(--accent-light)] via-[var(--bg-card)] to-[var(--accent-light)] p-4 md:p-6 rounded-xl md:rounded-[2rem] border border-[var(--accent-border)]">
            {/* Decorative heart pattern */}
            <div className="absolute top-0 right-0 w-20 h-20 md:w-32 md:h-32 opacity-[0.07]" style={{ color: accentHex }}>
              <ICONS.Heart className="w-full h-full fill-current" />
            </div>

            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-2 md:mb-3">
                <div className="w-7 h-7 md:w-8 md:h-8 rounded-lg md:rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
                  <ICONS.Heart className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: accentHex, fill: accentHex }} />
                </div>
                <span className="text-scale-micro font-black uppercase tracking-widest" style={{ color: accentHex }}>
                  {t('progress.motivation.title')}
                </span>
              </div>

              <p className="text-[var(--text-primary)] text-scale-label md:text-scale-heading font-semibold leading-relaxed mb-2 md:mb-3">
                "{profile.onboarding_data.learningReason}"
              </p>

              {profile.partner_name && (
                <div className="flex items-center gap-2 pt-2 border-t border-[var(--border-color)]">
                  <span className="text-scale-label text-[var(--text-secondary)]">{t('progress.motivation.learningFor')}</span>
                  <span className="text-scale-label font-bold" style={{ color: accentHex }}>{profile.partner_name}</span>
                  <ICONS.Heart className="w-4 h-4 text-[var(--accent-color)]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Love Log Stats Card - Moved above Learning Journey */}
        <div className="glass-card p-4 md:p-8 rounded-xl md:rounded-[2.5rem]">
          <div className="flex items-center justify-between mb-3 md:mb-6">
            <h3 className="text-scale-caption font-black font-header flex items-center gap-1.5 md:gap-2 text-[var(--text-secondary)] uppercase tracking-[0.15em] md:tracking-[0.2em]">
              <ICONS.Book className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: tierColor }} />
              {t('progress.stats.title')}
            </h3>
            <span className="text-scale-heading font-black" style={{ color: tierColor }}>{stats.totalWords}</span>
          </div>

          <div className="grid grid-cols-4 gap-2 md:gap-3">
            {[
              { label: t('progress.stats.nouns'), count: stats.nouns },
              { label: t('progress.stats.verbs'), count: stats.verbs },
              { label: t('progress.stats.adjectives'), count: stats.adjectives },
              { label: t('progress.stats.phrases'), count: stats.phrases }
            ].map(stat => (
              <div key={stat.label} className="p-2 md:p-4 rounded-lg md:rounded-2xl border border-[var(--accent-border)] bg-[var(--accent-light)] text-[var(--accent-color)] text-center">
                <p className="text-scale-heading font-black">{stat.count}</p>
                <p className="text-scale-micro font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Game History Section */}
        <div className="glass-card rounded-xl md:rounded-[2.5rem] overflow-hidden">
          <div className="p-3 md:p-6 border-b border-[var(--border-color)]">
            <h3 className="text-scale-caption font-black font-header flex items-center gap-1.5 md:gap-2 text-[var(--text-secondary)] uppercase tracking-[0.15em] md:tracking-[0.2em]">
              <ICONS.Clock className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: tierColor }} />
              {t('progress.gameHistory.title')}
            </h3>
          </div>
          <div className="p-3 md:p-6">
            <GameHistory xp={profile.xp || 0} />
          </div>
        </div>

        {/* Learning Journey Book/Diary */}
        <div className="glass-card rounded-xl md:rounded-[2.5rem] overflow-hidden relative">
          <div className="p-3 md:p-6 border-b border-[var(--border-color)] flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* Mobile hamburger menu button with entry count */}
              <button
                onClick={() => setShowJourneyMenu(true)}
                className="md:hidden p-1.5 -ml-1 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                aria-label="View journal entries"
              >
                <ICONS.Menu className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
              <h3 className="text-scale-caption font-black font-header flex items-center gap-1.5 md:gap-2 text-[var(--text-secondary)] uppercase tracking-[0.15em] md:tracking-[0.2em]">
                <ICONS.Book className="w-3.5 h-3.5 md:w-4 md:h-4" style={{ color: tierColor }} />
                {t('progress.journey.title')}
              </h3>
            </div>
            <button
              onClick={generateNewSummary}
              disabled={generating || !isOnline}
              className="px-2.5 md:px-4 py-1.5 md:py-2 rounded-lg md:rounded-xl text-scale-caption font-bold text-white flex items-center gap-1.5 md:gap-2 shadow-md hover:shadow-lg transition-all active:scale-95 disabled:opacity-50"
              style={{ backgroundColor: tierColor }}
              title={!isOnline ? t('offline.featureUnavailable', 'Unavailable offline') : ''}
            >
              {generating ? (
                <>
                  <ICONS.RefreshCw className="w-3 h-3 md:w-3.5 md:h-3.5 animate-spin" />
                  <span className="hidden md:inline">{retrying ? t('progress.journey.retrying', 'AI busy, trying again...') : t('progress.journey.analyzing')}</span>
                  <span className="md:hidden">...</span>
                </>
              ) : (
                <>
                  <ICONS.Sparkles className="w-3 h-3 md:w-3.5 md:h-3.5" />
                  <span className="hidden md:inline">{t('progress.journey.newEntry')}</span>
                  <span className="md:hidden">{t('progress.journey.new')}</span>
                </>
              )}
            </button>
          </div>

          {/* Error + Retry UI */}
          {summaryError && !generating && (
            <div className="mx-3 md:mx-6 mt-2 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 flex items-center gap-2">
              <ICONS.X className="w-4 h-4 text-red-500 shrink-0" />
              <span className="text-scale-caption text-red-600 dark:text-red-400 flex-1">{summaryError}</span>
              <button
                onClick={generateNewSummary}
                className="text-scale-caption font-bold text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300 transition-colors px-2 py-1 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 shrink-0"
              >
                {t('progress.journey.retry', 'Retry')}
              </button>
            </div>
          )}

          <div className="flex flex-col md:flex-row min-h-[250px] md:min-h-[400px]">
            {/* Left Page: Index - hidden on mobile (use hamburger menu), sidebar on desktop */}
            <div className="hidden md:block md:w-1/3 border-r border-[var(--border-color)] p-4">
              <p className="text-[9px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                {t('progress.journey.journalEntries')}
              </p>

              {loadingSummaries ? (
                <div className="text-center py-8">
                  <ICONS.RefreshCw className="w-5 h-5 mx-auto text-[var(--text-secondary)] animate-spin" />
                </div>
              ) : summaryIndex.length === 0 ? (
                <p className="text-[var(--text-secondary)] text-scale-caption text-center py-8 italic">
                  {t('progress.journey.noEntries')}<br/>{t('progress.journey.clickNew')}
                </p>
              ) : (
                <div className="flex flex-col gap-2 overflow-y-auto max-h-[340px]">
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
                          {translateLevel(entry.level_at_time, t)}
                        </span>
                      </div>
                      <p className="text-scale-caption font-semibold text-[var(--text-primary)] line-clamp-1">
                        {entry.title || generateTitle(entry.summary)}
                      </p>
                      <p className="text-[9px] text-[var(--text-secondary)] mt-1">
                        {t('progress.journey.wordsXp', { words: entry.words_learned, xp: entry.xp_at_time })}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Right Page: Selected Entry */}
            <div className="flex-1 p-3 md:p-6">
              {!selectedSummary ? (
                <div className="h-full flex flex-col items-center justify-center text-center py-6 md:py-0">
                  <ICONS.Book className="w-8 h-8 md:w-12 md:h-12 text-[var(--text-secondary)] opacity-50 mb-2 md:mb-4" />
                  <p className="text-[var(--text-secondary)] text-scale-label">
                    {summaryIndex.length === 0
                      ? t('progress.journey.startJourney')
                      : t('progress.journey.selectEntry')}
                  </p>
                </div>
              ) : (
                <div className="space-y-3 md:space-y-5">
                  {/* Entry Header */}
                  <div className="flex items-center justify-between pb-2 md:pb-4 border-b border-[var(--border-color)]">
                    <div>
                      <p className="text-scale-micro text-[var(--text-secondary)] font-bold">
                        {new Date(selectedSummary.createdAt).toLocaleDateString('en-US', {
                          weekday: 'short',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                      <p
                        className="text-scale-label font-bold"
                        style={{ color: tierColor }}
                      >
                        {selectedSummary.levelAtTime} • {selectedSummary.xpAtTime} XP
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-scale-heading font-black" style={{ color: tierColor }}>
                        {selectedSummary.wordsLearned}
                      </p>
                      <p className="text-scale-micro text-[var(--text-secondary)] font-bold uppercase">{t('progress.summary.words')}</p>
                    </div>
                  </div>

                  {/* Main Summary */}
                  <p className="text-[var(--text-primary)] leading-relaxed text-scale-label">
                    {selectedSummary.summary}
                  </p>

                  {/* What You Can Say */}
                  {selectedSummary.canNowSay && selectedSummary.canNowSay.length > 0 && (
                    <div>
                      <p className="text-scale-micro font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1.5 md:mb-2">
                        {t('progress.summary.youCanSay')}
                      </p>
                      <div className="flex flex-wrap gap-1.5 md:gap-2">
                        {selectedSummary.canNowSay.map((phrase, idx) => (
                          <span
                            key={idx}
                            className="px-2 md:px-3 py-1 md:py-1.5 rounded-full text-scale-caption font-medium"
                            style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                          >
                            "{phrase}"
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Topics & Grammar */}
                  <div className="grid grid-cols-2 gap-2 md:gap-4">
                    {selectedSummary.topicsExplored && selectedSummary.topicsExplored.length > 0 && (
                      <div>
                        <p className="text-scale-micro font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 md:mb-2">
                          {t('progress.summary.topics')}
                        </p>
                        <ul className="text-scale-micro md:text-scale-caption text-[var(--text-secondary)] space-y-0.5 md:space-y-1">
                          {selectedSummary.topicsExplored.slice(0, 4).map((topic, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 md:gap-2">
                              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: tierColor }} />
                              <span className="truncate">{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {selectedSummary.grammarHighlights && selectedSummary.grammarHighlights.length > 0 && (
                      <div>
                        <p className="text-scale-micro font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 md:mb-2">
                          {t('progress.summary.grammar')}
                        </p>
                        <ul className="text-scale-micro md:text-scale-caption text-[var(--text-secondary)] space-y-0.5 md:space-y-1">
                          {selectedSummary.grammarHighlights.slice(0, 4).map((grammar, idx) => (
                            <li key={idx} className="flex items-center gap-1.5 md:gap-2">
                              <span className="w-1 h-1 rounded-full flex-shrink-0" style={{ backgroundColor: tierColor }} />
                              <span className="truncate">{grammar}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  {/* Suggestions */}
                  {selectedSummary.suggestions && selectedSummary.suggestions.length > 0 && (
                    <div className="bg-[var(--bg-primary)] rounded-lg md:rounded-xl p-2.5 md:p-4">
                      <p className="text-scale-micro font-black text-[var(--text-secondary)] uppercase tracking-widest mb-1 md:mb-2">
                        {t('progress.summary.upNext')}
                      </p>
                      <ul className="text-scale-micro md:text-scale-caption text-[var(--text-secondary)] space-y-0.5 md:space-y-1">
                        {selectedSummary.suggestions.map((suggestion, idx) => (
                          <li key={idx}>→ {suggestion}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Validation Patterns (if available) */}
                  {selectedSummary.validationPatterns && (
                    <div className="bg-gradient-to-br from-[var(--bg-primary)] to-[var(--accent-light)] rounded-lg md:rounded-xl p-2.5 md:p-4 border border-[var(--accent-border)]">
                      <p className="text-scale-micro font-black text-[var(--text-secondary)] uppercase tracking-widest mb-2 md:mb-3">
                        {t('progress.summary.answerInsights')}
                      </p>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        {selectedSummary.validationPatterns.diacriticIssues > 0 && (
                          <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
                            <div className="text-scale-heading font-black text-amber-600 dark:text-amber-400">
                              {selectedSummary.validationPatterns.diacriticIssues}
                            </div>
                            <div className="text-[8px] uppercase font-bold text-amber-600/70 dark:text-amber-400/70">
                              {t('progress.summary.diacritics')}
                            </div>
                          </div>
                        )}
                        {selectedSummary.validationPatterns.synonymsAccepted > 0 && (
                          <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                            <div className="text-scale-heading font-black text-green-600 dark:text-green-400">
                              {selectedSummary.validationPatterns.synonymsAccepted}
                            </div>
                            <div className="text-[8px] uppercase font-bold text-green-600/70 dark:text-green-400/70">
                              {t('progress.summary.synonyms')}
                            </div>
                          </div>
                        )}
                        {selectedSummary.validationPatterns.typosAccepted > 0 && (
                          <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            <div className="text-scale-heading font-black text-blue-600 dark:text-blue-400">
                              {selectedSummary.validationPatterns.typosAccepted}
                            </div>
                            <div className="text-[8px] uppercase font-bold text-blue-600/70 dark:text-blue-400/70">
                              {t('progress.summary.typosOk')}
                            </div>
                          </div>
                        )}
                      </div>
                      {selectedSummary.validationPatterns.diacriticIssues > 3 && (
                        <p className="text-[9px] text-amber-600 dark:text-amber-400 mt-2 italic">
                          {t('progress.summary.diacriticTip', { language: targetName })}
                        </p>
                      )}
                      {selectedSummary.validationPatterns.synonymsAccepted > 3 && (
                        <p className="text-[9px] text-green-600 dark:text-green-400 mt-2 italic">
                          {t('progress.summary.synonymTip')}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile Learning Journey Menu - contained within component */}
          {showJourneyMenu && (
            <div className="md:hidden absolute inset-0 z-10 rounded-xl overflow-hidden">
              {/* Backdrop */}
              <div
                className="absolute inset-0 modal-backdrop"
                onClick={() => setShowJourneyMenu(false)}
              />

              {/* Slide-out panel */}
              <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-[260px] glass-card-solid animate-in slide-in-from-left duration-200 flex flex-col">
                {/* Header */}
                <div className="p-3 border-b border-[var(--border-color)] flex items-center justify-between flex-shrink-0">
                  <h3 className="text-[10px] font-black font-header text-[var(--text-secondary)] uppercase tracking-widest flex items-center gap-2">
                    <ICONS.Book className="w-3.5 h-3.5" style={{ color: tierColor }} />
                    {t('progress.journey.journalEntries')}
                  </h3>
                  <button
                    onClick={() => setShowJourneyMenu(false)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-primary)] transition-colors"
                  >
                    <ICONS.X className="w-4 h-4 text-[var(--text-secondary)]" />
                  </button>
                </div>

                {/* Entries list */}
                <div className="p-2 overflow-y-auto flex-1">
                  {loadingSummaries ? (
                    <div className="text-center py-6">
                      <ICONS.RefreshCw className="w-4 h-4 mx-auto text-[var(--text-secondary)] animate-spin" />
                    </div>
                  ) : summaryIndex.length === 0 ? (
                    <div className="text-center py-6">
                      <ICONS.Book className="w-6 h-6 mx-auto text-[var(--text-secondary)] opacity-50 mb-2" />
                      <p className="text-[var(--text-secondary)] text-[10px] italic">
                        {t('progress.journey.noEntries')}<br/>{t('progress.journey.clickNewShort')}
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {summaryIndex.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => {
                            loadSummary(entry.id);
                            setShowJourneyMenu(false);
                          }}
                          className={`w-full text-left p-2.5 rounded-lg transition-all ${
                            selectedSummary?.id === entry.id
                              ? 'bg-[var(--bg-primary)] shadow-sm border-l-3'
                              : 'hover:bg-[var(--bg-primary)]/70'
                          }`}
                          style={selectedSummary?.id === entry.id ? { borderLeftWidth: '3px', borderLeftColor: tierColor } : {}}
                        >
                          <div className="flex items-center justify-between mb-0.5">
                            <span className="text-[9px] font-bold text-[var(--text-secondary)]">
                              {formatDate(entry.created_at)}
                            </span>
                            <span
                              className="text-[8px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                            >
                              {translateLevel(entry.level_at_time, t)}
                            </span>
                          </div>
                          <p className="text-[10px] font-semibold text-[var(--text-primary)] line-clamp-2">
                            {entry.title || generateTitle(entry.summary)}
                          </p>
                          <p className="text-[8px] text-[var(--text-secondary)] mt-0.5">
                            {t('progress.journey.wordsXp', { words: entry.words_learned, xp: entry.xp_at_time })}
                          </p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-2 md:gap-4">
          <button
            onClick={() => navigate('/play')}
            className="glass-card p-3 md:p-6 rounded-xl md:rounded-[2rem] text-center hover:bg-white/70 dark:hover:bg-white/20 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <ICONS.Play className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[var(--accent-color)]" />
            <p className="text-scale-label font-bold text-[var(--text-primary)]">{t('progress.quickActions.practice')}</p>
            <p className="text-scale-micro text-[var(--text-secondary)] hidden md:block">{t('progress.quickActions.practiceDesc')}</p>
          </button>

          <button
            onClick={() => navigate('/log')}
            className="glass-card p-3 md:p-6 rounded-xl md:rounded-[2rem] text-center hover:bg-white/70 dark:hover:bg-white/20 hover:shadow-md active:scale-[0.98] transition-all"
          >
            <ICONS.Book className="w-6 h-6 md:w-8 md:h-8 mx-auto mb-1 md:mb-2 text-[var(--accent-color)]" />
            <p className="text-scale-label font-bold text-[var(--text-primary)]">{t('progress.quickActions.loveLog')}</p>
            <p className="text-scale-micro text-[var(--text-secondary)] hidden md:block">{t('progress.quickActions.loveLogDesc')}</p>
          </button>
        </div>

      </div>

      {/* Test Results Modal */}
      {selectedTestResult && (
        <div
          className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedTestResult(null)}
        >
          <div
            className="glass-card-solid rounded-[2rem] max-w-md w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-6 border-b border-[var(--border-color)]">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-[10px] font-black font-header text-[var(--text-secondary)] uppercase tracking-widest">
                  {t('progress.testResults.title')}
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
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    {selectedTestResult.correct_answers} / {selectedTestResult.total_questions} {t('progress.testResults.correct')}
                  </p>
                </div>
              </div>
              <p className="text-scale-caption text-[var(--text-secondary)] mt-3">
                {selectedTestResult.from_level} → {selectedTestResult.to_level} • {new Date(selectedTestResult.completed_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>

            {/* Questions Review */}
            <div className="p-4 overflow-y-auto max-h-[50vh]">
              <p className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest mb-3">
                {t('progress.testResults.yourAnswers')}
              </p>
              <div className="space-y-3">
                {selectedTestResult.questions?.map((q: any, idx: number) => {
                  // Use the stored isCorrect from smart validation, fallback to string compare for legacy data
                  const isCorrect = q.isCorrect !== undefined
                    ? q.isCorrect
                    : q.userAnswer?.toLowerCase().trim() === q.correctAnswer?.toLowerCase().trim();

                  // Show explanation if it's interesting (not exact match)
                  const showExplanation = q.explanation && q.explanation !== 'Exact match';

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
                          <p className="text-scale-caption font-medium text-[var(--text-primary)] mb-2">
                            {q.question}
                          </p>
                          {q.userAnswer && (
                            <p className={`text-scale-caption ${isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                              {t('progress.testResults.yourAnswer', { answer: q.userAnswer })}
                            </p>
                          )}
                          {!isCorrect && q.correctAnswer && (
                            <p className="text-scale-caption text-green-600">
                              {t('progress.testResults.correctAnswer', { answer: q.correctAnswer })}
                            </p>
                          )}
                          {showExplanation && (
                            <p className={`text-[10px] mt-1 italic ${isCorrect ? 'text-green-600/70' : 'text-red-600/70'}`}>
                              {q.explanation}
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
                className="w-full py-3 rounded-xl font-bold text-white text-scale-label shadow-md hover:shadow-lg active:scale-[0.98] transition-all"
                style={{ backgroundColor: tierColor }}
              >
                {t('progress.testResults.tryAgain')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Progress;
