import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, TutorChallenge, WordRequest, DictionaryEntry, WordScore, TutorStats } from '../types';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import CreateQuizChallenge from './CreateQuizChallenge';
import CreateQuickFireChallenge from './CreateQuickFireChallenge';
import WordRequestCreator from './WordRequestCreator';
import { useLanguage } from '../context/LanguageContext';
import { validateAnswerSmart } from '../utils/answer-helpers';
import LimitReachedModal from './LimitReachedModal';
import {
  TutorFlashcards,
  TutorMultipleChoice,
  TutorTypeIt,
  TutorQuickFire,
  TutorGameResults,
  type TutorAnswerResult,
} from './games/tutor-modes';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';
import { apiFetch, readJsonResponse } from '../services/api-config';
import { fetchPartnerProfileView } from '../services/partner-profile';
import { analytics } from '../services/analytics';
import PlayHubArtwork, { type PlayHubArtworkVariant } from './play/PlayHubArtwork';
import { playRoleVar, type PlayColorRole } from './play/playColorRoles';

interface TutorGamesProps {
  profile: Profile;
}

interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it' | 'quick_fire';
  isCorrect: boolean;
  explanation?: string;
}

type PlayMode = 'send' | 'local';

const SAVE_PREF_KEY = 'tutor_save_to_student_progress';

interface TutorHubItem {
  id: string;
  title: string;
  description: string;
  meta?: string;
  badge?: string;
  eyebrow?: string;
  artwork: PlayHubArtworkVariant;
  colorRole: PlayColorRole;
  featured?: boolean;
  disabled?: boolean;
  actionLabel?: string;
  onClick?: () => void;
}

interface TutorHubStat {
  label: string;
  value: string;
  role: PlayColorRole;
}

const rolePalette = (role: PlayColorRole, featured: boolean) => ({
  border: `color-mix(in srgb, ${playRoleVar(role, 'border')} ${featured ? '100%' : '88%'}, var(--border-color))`,
  overlay: `radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar(role, 'soft')} ${featured ? '74%' : '58%'}, transparent), transparent 56%)`,
  iconBg: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar(role, 'soft')} 76%, var(--bg-card)), color-mix(in srgb, ${playRoleVar(role, 'mist')} 52%, var(--bg-card)))`,
  iconBorder: `color-mix(in srgb, ${playRoleVar(role, 'border')} 92%, var(--border-color))`,
  iconColor: playRoleVar(role, 'deep'),
  eyebrow: playRoleVar(role, 'deep'),
  badgeBg: `color-mix(in srgb, ${playRoleVar(role, 'soft')} 84%, var(--bg-card))`,
  badgeText: playRoleVar(role, 'deep'),
  metaBg: `color-mix(in srgb, ${playRoleVar(role, 'soft')} 70%, var(--bg-card))`,
  metaText: playRoleVar(role, 'text'),
  actionBg: playRoleVar(role, 'color'),
  actionText: '#ffffff',
  description: `color-mix(in srgb, var(--text-secondary) 84%, ${playRoleVar(role, 'text')})`,
  shadow: `0 18px 36px -28px color-mix(in srgb, ${playRoleVar(role, 'deep')} 22%, transparent)`,
});

const TutorSectionHeader: React.FC<{ title: string; description: string }> = ({ title, description }) => (
  <div className="mb-4 md:mb-5">
    <div className="inline-flex items-center gap-2 mb-2">
      <span
        className="block w-8 h-[3px] rounded-full"
        style={{ background: `linear-gradient(90deg, ${playRoleVar('warm', 'color')}, ${playRoleVar('blend', 'color')})` }}
      />
      <h2 className="text-xl md:text-2xl font-black font-header text-[var(--text-primary)]">{title}</h2>
    </div>
    <p className="text-sm md:text-base text-[var(--text-secondary)] mt-1">{description}</p>
  </div>
);

const TutorHubTile: React.FC<{ item: TutorHubItem }> = ({ item }) => {
  const { t } = useTranslation();
  const isFeatured = Boolean(item.featured);
  const palette = rolePalette(item.colorRole, isFeatured);

  const content = (
    <>
      <div className="absolute inset-0 pointer-events-none opacity-75" style={{ background: palette.overlay }} />
      <div
        className="absolute inset-x-0 top-0 h-16 md:h-20 pointer-events-none opacity-55"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, ${playRoleVar(item.colorRole, 'mist')} 20%, transparent), transparent 88%)`,
        }}
      />

      <div className="relative z-10 flex h-full flex-col">
        <div className="flex items-start gap-4">
          <div
            className={`shrink-0 rounded-[22px] flex items-center justify-center ${isFeatured ? 'w-20 h-20 md:w-24 md:h-24' : 'w-16 h-16 md:w-[4.5rem] md:h-[4.5rem]'}`}
            style={{
              background: palette.iconBg,
              border: `1px solid ${palette.iconBorder}`,
            }}
          >
            <PlayHubArtwork
              variant={item.artwork}
              className={isFeatured ? 'w-10 h-10 md:w-12 md:h-12' : 'w-8 h-8 md:w-9 md:h-9'}
              style={{ color: palette.iconColor }}
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              {item.eyebrow && (
                <span
                  className="text-[10px] md:text-xs font-black uppercase tracking-[0.22em]"
                  style={{ color: palette.eyebrow }}
                >
                  {item.eyebrow}
                </span>
              )}
              {item.badge && (
                <span
                  className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.18em]"
                  style={{ background: palette.badgeBg, color: palette.badgeText }}
                >
                  {item.badge}
                </span>
              )}
            </div>

            <h3
              className={`font-black font-header text-[var(--text-primary)] tracking-[-0.03em] ${isFeatured ? 'text-[2.05rem] md:text-[2.35rem] leading-[0.95]' : 'text-[1.6rem] md:text-[1.8rem] leading-[0.97]'}`}
              style={{ textWrap: 'balance' }}
            >
              {item.title}
            </h3>
          </div>
        </div>

        <p
          className={`mt-4 ${isFeatured ? 'max-w-[36rem] text-lg md:text-[1.12rem] leading-[1.55]' : 'max-w-[24rem] text-base md:text-lg leading-[1.55]'}`}
          style={{ color: palette.description }}
        >
          {item.description}
        </p>

        {(item.meta || item.actionLabel || item.onClick) && (
          <div className={`mt-auto pt-5 flex items-end gap-3 ${isFeatured ? 'md:pt-6' : ''}`}>
            {item.meta && (
              <span
                className="inline-flex min-w-0 max-w-full items-center justify-center rounded-full px-3.5 py-2 text-sm md:text-base font-bold text-center leading-tight"
                style={{ background: palette.metaBg, color: palette.metaText }}
              >
                {item.meta}
              </span>
            )}

            {item.onClick && (
              <span
                className="ml-auto shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-sm md:text-base font-black font-header transition-transform group-hover:translate-x-0.5"
                style={{
                  background: palette.actionBg,
                  color: palette.actionText,
                }}
              >
                {item.actionLabel || t('play.hub.openLabel')}
                <ICONS.ChevronRight className="w-4 h-4" />
              </span>
            )}
          </div>
        )}
      </div>
    </>
  );

  const commonClassName = `group glass-card relative overflow-hidden rounded-[30px] p-4 md:p-5 text-left transition-all hover:shadow-card ${item.disabled ? 'opacity-45' : ''} ${isFeatured ? 'md:col-span-2 xl:col-span-2' : ''}`;
  const commonStyle = {
    border: `1px solid ${palette.border}`,
    boxShadow: palette.shadow,
  } as React.CSSProperties;

  if (item.onClick && !item.disabled) {
    return (
      <button type="button" onClick={item.onClick} className={commonClassName} style={commonStyle}>
        {content}
      </button>
    );
  }

  return (
    <div className={commonClassName} style={commonStyle}>
      {content}
    </div>
  );
};

const TutorGames: React.FC<TutorGamesProps> = ({ profile }) => {
  const { t } = useTranslation();
  const { targetLanguage, nativeLanguage, languageParams, targetName, nativeName } = useLanguage();

  // Normalize smart_validation (undefined defaults to true)
  const smartValidation = profile.smart_validation ?? true;
  const { isOnline, cachedWordCount, lastSyncTime, pendingCount, isSyncing: offlineSyncing } = useOffline(profile.id, targetLanguage);
  const [challenges, setChallenges] = useState<TutorChallenge[]>([]);
  const [wordRequests, setWordRequests] = useState<WordRequest[]>([]);
  const [tutorStats, setTutorStats] = useState<TutorStats | null>(null);
  const [partnerVocab, setPartnerVocab] = useState<DictionaryEntry[]>([]);
  const [partnerScores, setPartnerScores] = useState<Map<string, WordScore>>(new Map());
  const [partnerName, setPartnerName] = useState<string>('Your Partner');
  const [loading, setLoading] = useState(true);

  // Play mode
  const [playMode, setPlayMode] = useState<PlayMode>('send');

  // Modal states
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showQuickFireModal, setShowQuickFireModal] = useState(false);
  const [showWordRequestModal, setShowWordRequestModal] = useState(false);

  // Local game states (components manage most state internally)
  const [localGameActive, setLocalGameActive] = useState<'quiz' | 'quickfire' | 'multiple_choice' | 'type_it' | null>(null);
  const [localGameWords, setLocalGameWords] = useState<DictionaryEntry[]>([]);
  const [localGameIndex, setLocalGameIndex] = useState(0);
  const [localGameScore, setLocalGameScore] = useState({ correct: 0, incorrect: 0 });
  const [localQuickFireTimeLeft, setLocalQuickFireTimeLeft] = useState(60);

  // Session tracking for save to student progress
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const [sessionStartTime, setSessionStartTime] = useState<number>(Date.now());
  const [savingProgress, setSavingProgress] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Rate limit / free tier state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useBasicValidation, setUseBasicValidation] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const tutorFetchInFlightRef = useRef<string | null>(null);
  const hubViewTrackedRef = useRef<PlayMode | null>(null);

  // Track if a game is in progress (for exit confirmation)
  const isGameInProgress = localGameActive !== null && (
    localGameIndex > 0 || localGameScore.correct > 0 || localGameScore.incorrect > 0
  );

  // Browser back/close protection when game is in progress
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameInProgress) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    if (isGameInProgress) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isGameInProgress]);

  useEffect(() => {
    fetchData();
  }, [profile, targetLanguage]);

  const fetchData = async () => {
    const fetchKey = `${profile.id}:${profile.linked_user_id || 'none'}:${targetLanguage}`;
    if (tutorFetchInFlightRef.current === fetchKey) return;

    tutorFetchInFlightRef.current = fetchKey;
    setLoading(true);
    try {
      // Get partner's name
      if (profile.linked_user_id) {
        try {
          const partnerProfile = await fetchPartnerProfileView();
          if (partnerProfile?.full_name) setPartnerName(partnerProfile.full_name);
        } catch (error) {
          if (import.meta.env.DEV) {
            console.warn('Partner profile view unavailable for tutor play.', error);
          }
        }

        // Get partner's vocabulary for game creation (filtered by current language)
        const { data: vocab } = await supabase
          .from('dictionary')
          .select('*')
          .eq('user_id', profile.linked_user_id)
          .eq('language_code', targetLanguage)
          .order('created_at', { ascending: false });
        if (vocab) setPartnerVocab(vocab);

        // Get partner's scores for smart word selection (filtered by current language)
        const { data: scores } = await supabase
          .from('word_scores')
          .select('*')
          .eq('user_id', profile.linked_user_id)
          .eq('language_code', targetLanguage);
        if (scores) {
          const map = new Map<string, WordScore>();
          scores.forEach((s: any) => map.set(s.word_id, s));
          setPartnerScores(map);
        }
      }

      // Fetch challenges
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      const challengeRes = await apiFetch('/api/get-challenges/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor', ...languageParams }),
        __llErrorContext: {
          screen: 'tutor_play',
          userAction: 'load_tutor_challenges',
          suppressErrorTracking: true,
          treat4xxAsError: false,
        },
      });
      const challengeData = await readJsonResponse<{ challenges?: TutorChallenge[] }>(challengeRes);
      if (challengeData.challenges) setChallenges(challengeData.challenges);
      else setChallenges([]);

      // Fetch word requests
      const requestRes = await apiFetch('/api/get-word-requests/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ role: 'tutor', ...languageParams }),
        __llErrorContext: {
          screen: 'tutor_play',
          userAction: 'load_tutor_word_requests',
          suppressErrorTracking: true,
          treat4xxAsError: false,
        },
      });
      const requestData = await readJsonResponse<{ wordRequests?: WordRequest[] }>(requestRes);
      if (requestData.wordRequests) setWordRequests(requestData.wordRequests);
      else setWordRequests([]);

      // Fetch tutor stats (for streak display)
      const statsRes = await apiFetch('/api/tutor-stats/', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        __llErrorContext: {
          screen: 'tutor_play',
          userAction: 'load_tutor_stats',
          suppressErrorTracking: true,
          treat4xxAsError: false,
        },
      });
      const statsData = await readJsonResponse<{ tutor?: { stats?: TutorStats } }>(statsRes);
      setTutorStats(statsData?.tutor?.stats || null);

    } catch (error) {
      if (import.meta.env.DEV) {
        console.warn('Tutor play data unavailable, keeping current empty state.', error);
      }
    } finally {
      tutorFetchInFlightRef.current = null;
      setLoading(false);
    }
  };

  const handleChallengeCreated = () => {
    fetchData();
    setShowQuizModal(false);
    setShowQuickFireModal(false);
  };

  const handleWordRequestCreated = () => {
    fetchData();
    setShowWordRequestModal(false);
  };

  const trackTutorAction = useCallback((ctaText: string, destination: string, location: string) => {
    analytics.track('cta_click', {
      cta_location: location,
      cta_text: ctaText,
      destination,
      mode: playMode,
      target_lang: targetLanguage,
      student_word_count: partnerVocab.length,
      pending_count: challenges.filter(c => c.status === 'pending').length + wordRequests.filter(r => r.status === 'pending').length,
    });
  }, [challenges, partnerVocab.length, playMode, targetLanguage, wordRequests]);

  // Check if this is the first time tutor is completing a local game
  const isFirstTimeSave = () => {
    return localStorage.getItem(SAVE_PREF_KEY) === null;
  };

  // Get save preference
  const getSavePreference = (): 'always' | 'never' | 'ask' => {
    const stored = localStorage.getItem(SAVE_PREF_KEY);
    if (stored === 'always' || stored === 'never') return stored;
    return 'ask';  // Default to 'ask' instead of null
  };

  // Save game session to student's progress
  const saveGameSessionToStudent = async (gameMode: string, answers: GameSessionAnswer[], correct: number, incorrect: number) => {
    if (!profile.linked_user_id) return;

    setSavingProgress(true);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      await apiFetch('/api/submit-game-session/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameMode: `tutor_${gameMode}`,
          correctCount: correct,
          incorrectCount: incorrect,
          totalTimeSeconds,
          answers,
          // Tell the API to save to the linked student, not the tutor
          targetUserId: profile.linked_user_id,
          ...languageParams
        })
      });

      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2000);
    } catch (error) {
      console.error('Error saving game session:', error);
    } finally {
      setSavingProgress(false);
    }
  };

  // Handle save preference selection
  const handleSavePreference = async (save: boolean, remember: boolean) => {
    if (remember) {
      localStorage.setItem(SAVE_PREF_KEY, save ? 'always' : 'never');
    } else if (isFirstTimeSave()) {
      // First time but didn't check "remember" - set to "ask"
      localStorage.setItem(SAVE_PREF_KEY, 'ask');
    }

    if (save) {
      const gameMode = localGameActive === 'quiz' ? 'flashcards' :
                       localGameActive === 'quickfire' ? 'quick_fire' :
                       localGameActive || 'flashcards';
      await saveGameSessionToStudent(gameMode, sessionAnswers, localGameScore.correct, localGameScore.incorrect);
    }
  };

  const startLocalQuiz = () => {
    // Pick 10 random words, prioritizing weak ones (incorrect attempts or low streak)
    const weakWords = partnerVocab.filter(w => {
      const score = partnerScores.get(w.id);
      const incorrectAttempts = score ? (score.total_attempts || 0) - (score.correct_attempts || 0) : 0;
      return score && (incorrectAttempts > 0 || (score.correct_streak || 0) < 3);
    });
    const otherWords = partnerVocab.filter(w => !weakWords.includes(w));
    const selectedWords = [...shuffleArray(weakWords).slice(0, 5), ...shuffleArray(otherWords).slice(0, 5)];
    setLocalGameWords(shuffleArray(selectedWords).slice(0, 10));
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('quiz');
    analytics.trackGameStarted({ game_type: 'tutor_flashcards', word_count: 10 });
  };

  const startLocalQuickFire = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 20);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalQuickFireTimeLeft(60);
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('quickfire');
    analytics.trackGameStarted({ game_type: 'tutor_quick_fire', word_count: shuffled.length });
  };

  const startLocalMultipleChoice = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 10);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('multiple_choice');
    analytics.trackGameStarted({ game_type: 'tutor_multiple_choice', word_count: shuffled.length });
  };

  const startLocalTypeIt = () => {
    const shuffled = shuffleArray(partnerVocab).slice(0, 10);
    setLocalGameWords(shuffled);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setSessionStartTime(Date.now());
    setSavedSuccess(false);
    setLocalGameActive('type_it');
    analytics.trackGameStarted({ game_type: 'tutor_type_it', word_count: shuffled.length });
  };

  // Old handlers removed - now using extracted components

  const resetLocalGame = useCallback(() => {
    setLocalGameActive(null);
    setLocalGameWords([]);
    setLocalGameIndex(0);
    setLocalGameScore({ correct: 0, incorrect: 0 });
    setLocalQuickFireTimeLeft(60);
    setSessionAnswers([]);
    setSavedSuccess(false);
    setShowExitConfirm(false);
  }, []);

  // Exit game with confirmation if in progress
  const handleExitGame = useCallback(() => {
    if (isGameInProgress) {
      setShowExitConfirm(true);
    } else {
      resetLocalGame();
    }
  }, [isGameInProgress, resetLocalGame]);

  const restartCurrentGame = () => {
    if (localGameActive === 'quiz') startLocalQuiz();
    else if (localGameActive === 'quickfire') startLocalQuickFire();
    else if (localGameActive === 'multiple_choice') startLocalMultipleChoice();
    else if (localGameActive === 'type_it') startLocalTypeIt();
  };

  // Unified handler for extracted components
  const handleTutorGameAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    setLocalGameScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));
    setSessionAnswers(prev => [...prev, {
      wordId: result.wordId,
      wordText: result.wordText,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      questionType: result.questionType,
      isCorrect: result.isCorrect,
      explanation: result.explanation
    }]);
  }, []);

  const handleFlashcardAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    handleTutorGameAnswer(result, isCorrect);
    if (localGameIndex < localGameWords.length - 1) {
      setTimeout(() => setLocalGameIndex(prev => prev + 1), 300);
    }
  }, [handleTutorGameAnswer, localGameIndex, localGameWords.length]);

  const handleMcAnswer = useCallback((result: TutorAnswerResult, isCorrect: boolean) => {
    handleTutorGameAnswer(result, isCorrect);
    setTimeout(() => {
      if (localGameIndex < localGameWords.length - 1) {
        setLocalGameIndex(prev => prev + 1);
      }
    }, isCorrect ? 800 : 1500);
  }, [handleTutorGameAnswer, localGameIndex, localGameWords.length]);

  const handleTypeItNext = useCallback(() => {
    if (localGameIndex < localGameWords.length - 1) {
      setLocalGameIndex(prev => prev + 1);
    } else {
      // Last question - force re-render to trigger game over detection
      // by touching a state variable (score is already correct, this just re-renders)
      setLocalGameScore(prev => ({ ...prev }));
    }
  }, [localGameIndex, localGameWords.length]);

  const handleQuickFireComplete = useCallback((results: {
    answers: TutorAnswerResult[];
    score: { correct: number; incorrect: number };
    timeRemaining: number;
  }) => {
    setLocalGameScore(results.score);
    setSessionAnswers(results.answers.map(r => ({
      wordId: r.wordId,
      wordText: r.wordText,
      correctAnswer: r.correctAnswer,
      userAnswer: r.userAnswer,
      questionType: r.questionType,
      isCorrect: r.isCorrect,
      explanation: r.explanation
    })));
    setLocalQuickFireTimeLeft(results.timeRemaining);
    // Set index to end so game-over detection works for auto-save
    setLocalGameIndex(localGameWords.length - 1);
  }, [localGameWords.length]);

  // Auto-save effect when preference is 'always'
  React.useEffect(() => {
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length
      && localGameWords.length > 0;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;
    const quickFireComplete = localGameActive === 'quickfire' && localGameIndex >= localGameWords.length - 1 && totalAnswered === localGameWords.length && localGameWords.length > 0;

    if ((isGameOver || quickFireTimeUp || quickFireComplete) && getSavePreference() === 'always' && !savedSuccess && !savingProgress && sessionAnswers.length > 0) {
      const gameMode = localGameActive === 'quiz' ? 'flashcards' :
                       localGameActive === 'quickfire' ? 'quick_fire' :
                       localGameActive || 'flashcards';
      saveGameSessionToStudent(gameMode, sessionAnswers, localGameScore.correct, localGameScore.incorrect);
    }
  }, [localGameActive, localGameIndex, localGameScore, localQuickFireTimeLeft, localGameWords.length, sessionAnswers.length, savedSuccess, savingProgress]);

  const pendingChallenges = challenges.filter(c => c.status === 'pending');
  const completedChallenges = challenges.filter(c => c.status === 'completed');
  const pendingRequests = wordRequests.filter(r => r.status === 'pending');
  const weakWords = useMemo(() => partnerVocab.filter((word) => {
    const score = partnerScores.get(word.id);
    if (!score) return false;
    const incorrectAttempts = (score.total_attempts || 0) - (score.correct_attempts || 0);
    return incorrectAttempts > 0 || (score.correct_streak || 0) < 3;
  }), [partnerScores, partnerVocab]);
  const sendStats = useMemo<TutorHubStat[]>(() => ([
    { label: t('tutorGames.stats.wordsTracked'), value: String(partnerVocab.length), role: 'warm' },
    { label: t('tutorGames.stats.pendingSends'), value: String(pendingChallenges.length + pendingRequests.length), role: 'bright' },
    { label: t('tutorGames.stats.completed'), value: String(completedChallenges.length), role: 'blend' },
    { label: t('tutorGames.stats.teachingStreak'), value: String(tutorStats?.teachingStreak || 0), role: 'ink' },
  ]), [completedChallenges.length, partnerVocab.length, pendingChallenges.length, pendingRequests.length, t, tutorStats?.teachingStreak]);
  const localStats = useMemo<TutorHubStat[]>(() => ([
    { label: t('tutorGames.stats.wordsTracked'), value: String(partnerVocab.length), role: 'warm' },
    { label: t('tutorGames.stats.weakWords'), value: String(weakWords.length), role: 'bright' },
    { label: t('tutorGames.stats.readyGames'), value: String(partnerVocab.length >= 4 ? 4 : 0), role: 'blend' },
    { label: t('tutorGames.stats.teachingStreak'), value: String(tutorStats?.teachingStreak || 0), role: 'ink' },
  ]), [partnerVocab.length, t, tutorStats?.teachingStreak, weakWords.length]);
  const sendItems = useMemo<TutorHubItem[]>(() => ([
    {
      id: 'word-gift',
      title: t('tutorGames.send.giftWords'),
      description: t('tutorGames.send.sendWords', { name: partnerName }),
      meta: t('tutorGames.send.wordGiftMeta', { name: partnerName }),
      eyebrow: t('tutorGames.hub.sendNowEyebrow'),
      artwork: 'word_gift',
      colorRole: 'bright',
      featured: true,
      disabled: !isOnline,
      actionLabel: t('tutorGames.send.sendGift'),
      onClick: () => {
        trackTutorAction('send_words', 'word_request', 'tutor_play_send');
        setShowWordRequestModal(true);
      },
    },
    {
      id: 'quiz-challenge',
      title: t('tutorGames.send.doYouRemember'),
      description: t('tutorGames.send.quizPartner', { name: partnerName }),
      meta: t('tutorGames.send.quizMeta'),
      eyebrow: t('tutorGames.hub.challengeEyebrow'),
      artwork: 'flashcards',
      colorRole: 'warm',
      disabled: !isOnline,
      actionLabel: t('tutorGames.send.createQuiz'),
      onClick: () => {
        trackTutorAction('send_quiz_challenge', 'quiz_modal', 'tutor_play_send');
        setShowQuizModal(true);
      },
    },
    {
      id: 'quick-fire-challenge',
      title: t('tutorGames.send.quickFire'),
      description: t('tutorGames.send.timedChallenge'),
      meta: t('tutorGames.send.quickFireMeta'),
      eyebrow: t('tutorGames.hub.momentumEyebrow'),
      artwork: 'quick_fire',
      colorRole: 'blend',
      disabled: !isOnline,
      actionLabel: t('tutorGames.send.createChallenge'),
      onClick: () => {
        trackTutorAction('send_quick_fire', 'quick_fire_modal', 'tutor_play_send');
        setShowQuickFireModal(true);
      },
    },
  ]), [isOnline, partnerName, t, trackTutorAction]);
  const waitingItems = useMemo<TutorHubItem[]>(() => {
    const challengeItems: TutorHubItem[] = pendingChallenges.slice(0, 2).map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: t('tutorGames.pending.challengeWaitingCopy', { name: partnerName }),
      meta: t('tutorGames.pending.words', { count: challenge.words_data?.length || 0 }),
      badge: t('tutorGames.pending.pending'),
      eyebrow: challenge.challenge_type === 'quiz'
        ? t('tutorGames.hub.challengeEyebrow')
        : t('tutorGames.hub.momentumEyebrow'),
      artwork: challenge.challenge_type === 'quiz' ? 'flashcards' : 'quick_fire',
      colorRole: challenge.challenge_type === 'quiz' ? 'warm' : 'blend',
    }));

    const requestItems: TutorHubItem[] = pendingRequests.slice(0, 2).map((request) => ({
      id: request.id,
      title: t('tutorGames.send.giftWords'),
      description: request.request_type === 'ai_topic'
        ? t('tutorGames.gifts.topic', { topic: request.input_text })
        : t('tutorGames.gifts.custom'),
      meta: t('tutorGames.gifts.word', { count: request.selected_words?.length || 0 }),
      badge: t('tutorGames.pending.pending'),
      eyebrow: t('tutorGames.hub.sendNowEyebrow'),
      artwork: 'word_gift',
      colorRole: 'bright',
    }));

    const items = [...challengeItems, ...requestItems];
    if (items.length > 0) return items;

    return [{
      id: 'no-pending',
      title: t('tutorGames.waiting.emptyTitle'),
      description: t('tutorGames.waiting.emptyCopy', { name: partnerName }),
      meta: t('tutorGames.pending.pending'),
      eyebrow: t('tutorGames.stats.pendingSends'),
      artwork: 'conversation',
      colorRole: 'ink',
    }];
  }, [partnerName, pendingChallenges, pendingRequests, t]);
  const resultItems = useMemo<TutorHubItem[]>(() => {
    const items: TutorHubItem[] = completedChallenges.slice(0, 3).map((challenge) => ({
      id: challenge.id,
      title: challenge.title,
      description: t('tutorGames.results.completed', {
        date: new Date(challenge.completed_at || challenge.created_at).toLocaleDateString(),
      }),
      meta: (challenge as any).result?.score != null
        ? t('tutorGames.results.scoreMeta', { score: (challenge as any).result.score })
        : t('tutorGames.results.finishedMeta'),
      eyebrow: t('tutorGames.results.title'),
      artwork: challenge.challenge_type === 'quiz' ? 'multiple_choice' : 'quick_fire',
      colorRole: challenge.challenge_type === 'quiz' ? 'bright' : 'blend',
    }));

    if (items.length > 0) return items;

    return [{
      id: 'no-results',
      title: t('tutorGames.results.emptyTitle'),
      description: t('tutorGames.results.emptyCopy', { name: partnerName }),
      meta: t('tutorGames.results.awaitingMeta'),
      eyebrow: t('tutorGames.results.title'),
      artwork: 'ai_challenge',
      colorRole: 'ink',
    }];
  }, [completedChallenges, partnerName, t]);
  const localItems = useMemo<TutorHubItem[]>(() => ([
    {
      id: 'local-flashcards',
      title: t('play.games.flashcards'),
      description: t('tutorGames.local.flashcardsLead', { name: partnerName }),
      meta: t('tutorGames.local.wordsReadyMeta', { count: partnerVocab.length }),
      eyebrow: t('play.hub.warmupEyebrow'),
      artwork: 'flashcards',
      colorRole: 'warm',
      featured: true,
      disabled: partnerVocab.length < 4,
      actionLabel: t('tutorGames.startNow'),
      onClick: partnerVocab.length >= 4 ? startLocalQuiz : undefined,
    },
    {
      id: 'local-quickfire',
      title: t('play.games.quickFire'),
      description: t('tutorGames.local.quickFireDesc'),
      meta: t('play.games.quickFireDesc'),
      eyebrow: t('play.hub.intensityEyebrow'),
      artwork: 'quick_fire',
      colorRole: 'blend',
      disabled: partnerVocab.length < 4,
      actionLabel: t('tutorGames.startNow'),
      onClick: partnerVocab.length >= 4 ? startLocalQuickFire : undefined,
    },
    {
      id: 'local-multiple-choice',
      title: t('play.games.multipleChoice'),
      description: t('tutorGames.local.multipleChoiceDesc'),
      meta: t('play.hub.requiresWords', { count: 4 }),
      eyebrow: t('play.hub.pickEyebrow'),
      artwork: 'multiple_choice',
      colorRole: 'bright',
      disabled: partnerVocab.length < 4,
      actionLabel: t('tutorGames.startNow'),
      onClick: partnerVocab.length >= 4 ? startLocalMultipleChoice : undefined,
    },
    {
      id: 'local-type-it',
      title: t('play.games.typeIt'),
      description: t('tutorGames.local.typeItDesc'),
      meta: t('play.hub.spellMeta'),
      eyebrow: t('play.hub.spellEyebrow'),
      artwork: 'type_it',
      colorRole: 'ink',
      disabled: partnerVocab.length < 4,
      actionLabel: t('tutorGames.startNow'),
      onClick: partnerVocab.length >= 4 ? startLocalTypeIt : undefined,
    },
  ]), [partnerName, partnerVocab.length, startLocalMultipleChoice, startLocalQuickFire, startLocalQuiz, startLocalTypeIt, t]);
  const localSupportItems = useMemo<TutorHubItem[]>(() => ([
    {
      id: 'local-support-focus',
      title: t('tutorGames.local.supportFocusTitle'),
      description: t('tutorGames.local.supportFocusCopy', { count: weakWords.length }),
      meta: t('tutorGames.stats.weakWords'),
      eyebrow: t('tutorGames.hub.studentStatusEyebrow'),
      artwork: 'speed_match',
      colorRole: 'bright',
    },
    {
      id: 'local-support-save',
      title: t('tutorGames.local.saveSupportTitle'),
      description: t('tutorGames.local.saveSupportCopy'),
      meta: t('tutorGames.gameOver.saveToProgress', { name: partnerName }),
      eyebrow: t('tutorGames.hub.challengeEyebrow'),
      artwork: 'word_gift',
      colorRole: 'warm',
    },
    {
      id: 'local-support-untracked',
      title: t('tutorGames.local.untrackedTitle'),
      description: t('tutorGames.local.untrackedCopy'),
      meta: t('tutorGames.playNow'),
      eyebrow: t('tutorGames.hub.momentumEyebrow'),
      artwork: 'conversation',
      colorRole: 'ink',
    },
  ]), [partnerName, t, weakWords.length]);

  useEffect(() => {
    if (loading || localGameActive) return;
    if (hubViewTrackedRef.current === playMode) return;

    hubViewTrackedRef.current = playMode;
    analytics.track('cta_click', {
      cta_location: 'tutor_play_view',
      cta_text: playMode === 'send' ? 'view_send_hub' : 'view_local_hub',
      destination: playMode,
      target_lang: targetLanguage,
      student_word_count: partnerVocab.length,
    });
  }, [loading, localGameActive, partnerVocab.length, playMode, targetLanguage]);

  if (loading) {
    return (
      <div className="h-full flex flex-col items-center justify-center gap-3">
        <div className="flex gap-2">
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce"></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
          <div className="w-2 h-2 bg-[var(--accent-color)] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">{t('tutorGames.loading')}</p>
      </div>
    );
  }

  // Local game is active - render game UI using extracted components
  if (localGameActive) {
    const totalAnswered = localGameScore.correct + localGameScore.incorrect;
    const isGameOver = (localGameActive === 'quiz' || localGameActive === 'multiple_choice' || localGameActive === 'type_it')
      && localGameWords.length > 0
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length;
    const quickFireTimeUp = localGameActive === 'quickfire' && localQuickFireTimeLeft <= 0;
    const quickFireComplete = localGameActive === 'quickfire'
      && localGameWords.length > 0
      && localGameIndex >= localGameWords.length - 1
      && totalAnswered === localGameWords.length;

    // Game Over Screen - Using TutorGameResults component
    if (isGameOver || quickFireTimeUp || quickFireComplete) {
      return (
        <TutorGameResults
          score={localGameScore}
          partnerName={partnerName}
          hasLinkedPartner={!!profile.linked_user_id}
          savePreference={getSavePreference()}
          isFirstTime={isFirstTimeSave()}
          savingProgress={savingProgress}
          savedSuccess={savedSuccess}
          onSave={(remember) => handleSavePreference(true, remember)}
          onDone={resetLocalGame}
          onPlayAgain={restartCurrentGame}
        />
      );
    }

    // Quiz/Flashcards - Using TutorFlashcards component
    if (localGameActive === 'quiz') {
      return (
        <TutorFlashcards
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleFlashcardAnswer}
          onExit={handleExitGame}
        />
      );
    }

    // Quick Fire - Using TutorQuickFire component
    if (localGameActive === 'quickfire') {
      return (
        <TutorQuickFire
          words={localGameWords}
          timeLimit={60}
          onAnswer={(result) => handleTutorGameAnswer(result, result.isCorrect)}
          onComplete={handleQuickFireComplete}
          onExit={handleExitGame}
          validateAnswer={smartValidation && !useBasicValidation ? async (userAnswer, correctAnswer, word) => {
            const result = await validateAnswerSmart(userAnswer, correctAnswer, {
              targetWord: word.word,
              languageParams: { targetLanguage, nativeLanguage }
            });
            if (result.rateLimitHit) setShowLimitModal(true);
            return { accepted: result.accepted, explanation: result.explanation };
          } : undefined}
        />
      );
    }

    // Multiple Choice - Using TutorMultipleChoice component
    if (localGameActive === 'multiple_choice') {
      return (
        <TutorMultipleChoice
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleMcAnswer}
          onExit={handleExitGame}
        />
      );
    }

    // Type It - Using TutorTypeIt component
    if (localGameActive === 'type_it') {
      return (
        <TutorTypeIt
          words={localGameWords}
          currentIndex={localGameIndex}
          score={localGameScore}
          targetLanguageName={targetName}
          nativeLanguageName={nativeName}
          onAnswer={handleTutorGameAnswer}
          onNext={handleTypeItNext}
          onExit={handleExitGame}
          validateAnswer={smartValidation && !useBasicValidation ? async (userAnswer, correctAnswer, word) => {
            const result = await validateAnswerSmart(userAnswer, correctAnswer, {
              targetWord: word.word,
              languageParams: { targetLanguage, nativeLanguage }
            });
            if (result.rateLimitHit) setShowLimitModal(true);
            return { accepted: result.accepted, explanation: result.explanation };
          } : undefined}
        />
      );
    }
  }

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {!isOnline && (
          <OfflineIndicator
            isOnline={isOnline}
            cachedWordCount={cachedWordCount}
            lastSyncTime={lastSyncTime}
            pendingCount={pendingCount}
            isSyncing={offlineSyncing}
          />
        )}

        <div className="flex justify-center">
          <div
            className="inline-flex p-1.5 rounded-[22px] glass-card"
            style={{ border: `1px solid ${playRoleVar(playMode === 'send' ? 'warm' : 'ink', 'border')}` }}
          >
            <button
              onClick={() => {
                setPlayMode('send');
                trackTutorAction('switch_to_send', 'send', 'tutor_play_toggle');
              }}
              className="px-4 md:px-5 py-2.5 rounded-[18px] text-sm md:text-base font-black font-header transition-all"
              style={{
                background: playMode === 'send' ? playRoleVar('warm', 'color') : 'transparent',
                color: playMode === 'send' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {t('tutorGames.sendChallenge')}
            </button>
            <button
              onClick={() => {
                setPlayMode('local');
                trackTutorAction('switch_to_local', 'local', 'tutor_play_toggle');
              }}
              className="px-4 md:px-5 py-2.5 rounded-[18px] text-sm md:text-base font-black font-header transition-all"
              style={{
                background: playMode === 'local' ? playRoleVar('ink', 'color') : 'transparent',
                color: playMode === 'local' ? '#ffffff' : 'var(--text-secondary)',
              }}
            >
              {t('tutorGames.playNow')}
            </button>
          </div>
        </div>

        <section
          className="glass-card rounded-[32px] p-5 md:p-6 xl:p-7 overflow-hidden relative"
          style={{ border: `1px solid ${playRoleVar(playMode === 'send' ? 'bright' : 'blend', 'border')}` }}
        >
          <div
            className="absolute inset-0"
            style={{
              background: playMode === 'send'
                ? `
                  radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar('bright', 'soft')} 72%, transparent), transparent 42%),
                  radial-gradient(circle at bottom right, color-mix(in srgb, ${playRoleVar('warm', 'soft')} 68%, transparent), transparent 38%)
                `
                : `
                  radial-gradient(circle at top left, color-mix(in srgb, ${playRoleVar('warm', 'soft')} 70%, transparent), transparent 42%),
                  radial-gradient(circle at bottom right, color-mix(in srgb, ${playRoleVar('ink', 'soft')} 66%, transparent), transparent 38%)
                `,
            }}
          />
          <div
            className="absolute inset-x-0 top-0 h-20 md:h-24 opacity-55"
            style={{
              background: `linear-gradient(180deg, color-mix(in srgb, ${playRoleVar(playMode === 'send' ? 'blend' : 'ink', 'mist')} 22%, transparent), transparent 92%)`,
            }}
          />

          <div className="relative z-10 grid xl:grid-cols-[1.2fr_0.78fr] gap-5 md:gap-6 items-center">
            <div>
                <span className="text-[11px] md:text-xs font-black uppercase tracking-[0.28em]" style={{ color: playRoleVar(playMode === 'send' ? 'warm' : 'ink', 'deep') }}>
                  {playMode === 'send'
                  ? t('tutorGames.hub.sendEyebrow')
                  : t('tutorGames.hub.localEyebrow')}
                </span>
              <h1
                className="font-black font-header text-[var(--text-primary)] tracking-[-0.045em] leading-[0.94] mt-2.5 mb-2.5 max-w-[11ch] text-[clamp(2.3rem,7vw,4.2rem)]"
                style={{ textWrap: 'balance' }}
              >
                {playMode === 'send'
                  ? t('tutorGames.hub.sendHeadline', { name: partnerName })
                  : t('tutorGames.hub.localHeadline', { name: partnerName })}
              </h1>
              <p className="text-base md:text-[1.02rem] text-[var(--text-secondary)] leading-relaxed max-w-xl">
                {playMode === 'send'
                  ? t('tutorGames.hub.sendDescription')
                  : t('tutorGames.hub.localDescription')}
              </p>

              <div className="grid gap-3 sm:flex sm:flex-wrap mt-5 max-w-xl">
                <button
                  onClick={() => {
                    if (playMode === 'send') {
                      trackTutorAction('hero_send_words', 'word_request', 'tutor_play_hero');
                      setShowWordRequestModal(true);
                    } else {
                      trackTutorAction('hero_start_flashcards', 'tutor_flashcards', 'tutor_play_hero');
                      startLocalQuiz();
                    }
                  }}
                  disabled={playMode === 'send' ? !isOnline : partnerVocab.length < 4}
                  className="w-full sm:w-auto min-h-[54px] px-5 py-3 rounded-2xl font-black font-header text-base md:text-lg tracking-tight text-center transition-all hover:-translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{
                    background: playMode === 'send' ? playRoleVar('bright', 'color') : playRoleVar('warm', 'color'),
                    color: '#ffffff',
                    boxShadow: `0 16px 34px -22px color-mix(in srgb, ${playRoleVar(playMode === 'send' ? 'bright' : 'warm', 'deep')} 30%, transparent)`,
                  }}
                >
                  {playMode === 'send'
                    ? t('tutorGames.send.sendGift')
                    : t('tutorGames.startNow')}
                </button>
                <button
                  onClick={() => {
                    if (playMode === 'send') {
                      trackTutorAction('hero_create_quiz', 'quiz_modal', 'tutor_play_hero');
                      setShowQuizModal(true);
                    } else {
                      trackTutorAction('hero_start_quickfire', 'tutor_quick_fire', 'tutor_play_hero');
                      startLocalQuickFire();
                    }
                  }}
                  disabled={playMode === 'send' ? !isOnline : partnerVocab.length < 4}
                  className="w-full sm:w-auto min-h-[54px] px-5 py-3 rounded-2xl font-black font-header text-base md:text-lg tracking-tight text-center transition-all hover:-translate-y-0.5 disabled:opacity-45 disabled:cursor-not-allowed"
                  style={{
                    background: `color-mix(in srgb, ${playRoleVar(playMode === 'send' ? 'warm' : 'ink', 'soft')} 74%, var(--bg-card))`,
                    border: `1px solid ${playRoleVar(playMode === 'send' ? 'warm' : 'ink', 'border')}`,
                    color: playRoleVar(playMode === 'send' ? 'warm' : 'ink', 'text'),
                  }}
                >
                  {playMode === 'send'
                    ? t('tutorGames.send.createQuiz')
                    : t('tutorGames.local.quickFire')}
                </button>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 md:mt-6">
                {(playMode === 'send' ? sendStats : localStats).map((stat) => (
                  <div
                    key={stat.label}
                    className="glass-card rounded-2xl px-4 py-3"
                    style={{
                      border: `1px solid ${playRoleVar(stat.role, 'border')}`,
                      boxShadow: `0 12px 28px -28px color-mix(in srgb, ${playRoleVar(stat.role, 'deep')} 26%, transparent)`,
                    }}
                  >
                    <div className="text-xl md:text-2xl font-black font-header text-[var(--text-primary)]">{stat.value}</div>
                    <div
                      className="text-[11px] md:text-xs uppercase tracking-[0.18em] font-bold mt-1"
                      style={{ color: playRoleVar(stat.role, 'deep') }}
                    >
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="hidden xl:flex justify-end pr-2" style={{ color: playRoleVar(playMode === 'send' ? 'bright' : 'warm', 'color') }}>
              <div
                className="rounded-[28px] p-5"
                style={{
                  background: `linear-gradient(145deg, color-mix(in srgb, ${playRoleVar(playMode === 'send' ? 'blend' : 'warm', 'soft')} 74%, var(--bg-card)), color-mix(in srgb, ${playRoleVar(playMode === 'send' ? 'bright' : 'ink', 'soft')} 52%, var(--bg-card)))`,
                  border: `1px solid ${playRoleVar(playMode === 'send' ? 'blend' : 'ink', 'border')}`,
                }}
              >
                <PlayHubArtwork variant={playMode === 'send' ? 'word_gift' : 'flashcards'} className="w-44 h-44" />
              </div>
            </div>
          </div>
        </section>

        {playMode === 'send' ? (
          <>
            <section className="mb-10">
              <TutorSectionHeader
                title={t('tutorGames.sections.sendTitle')}
                description={t('tutorGames.sections.sendCopy')}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {sendItems.map((item) => <TutorHubTile key={item.id} item={item} />)}
              </div>
            </section>

            <section className="mb-10">
              <TutorSectionHeader
                title={t('tutorGames.sections.waitingTitle')}
                description={t('tutorGames.sections.waitingCopy')}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {waitingItems.map((item) => <TutorHubTile key={item.id} item={item} />)}
              </div>
            </section>

            <section className="pb-2">
              <TutorSectionHeader
                title={t('tutorGames.sections.resultsTitle')}
                description={t('tutorGames.sections.resultsCopy')}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {resultItems.map((item) => <TutorHubTile key={item.id} item={item} />)}
              </div>
            </section>
          </>
        ) : (
          <>
            <section className="mb-10">
              <TutorSectionHeader
                title={t('tutorGames.sections.localTitle')}
                description={t('tutorGames.sections.localCopy')}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
                {localItems.map((item) => <TutorHubTile key={item.id} item={item} />)}
              </div>
              {partnerVocab.length < 4 && (
                <p className="text-sm text-[var(--text-secondary)] mt-4">
                  {t('tutorGames.local.needWords', { name: partnerName })}
                </p>
              )}
            </section>

            <section className="pb-2">
              <TutorSectionHeader
                title={t('tutorGames.sections.localTipsTitle')}
                description={t('tutorGames.sections.localTipsCopy')}
              />
              <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
                {localSupportItems.map((item) => <TutorHubTile key={item.id} item={item} />)}
              </div>
            </section>
          </>
        )}
      </div>

      {/* Modals */}
      {showQuizModal && (
        <CreateQuizChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerName={partnerName}
          onClose={() => setShowQuizModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showQuickFireModal && (
        <CreateQuickFireChallenge
          profile={profile}
          partnerVocab={partnerVocab}
          partnerScores={partnerScores}
          partnerName={partnerName}
          onClose={() => setShowQuickFireModal(false)}
          onCreated={handleChallengeCreated}
        />
      )}

      {showWordRequestModal && (
        <WordRequestCreator
          profile={profile}
          partnerName={partnerName}
          partnerVocab={partnerVocab}
          onClose={() => setShowWordRequestModal(false)}
          onCreated={handleWordRequestCreated}
        />
      )}

      {/* Rate Limit Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="validation"
        onContinueBasic={() => setUseBasicValidation(true)}
      />

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
          <div className="glass-card-solid rounded-2xl p-6 max-w-sm w-full">
            <h3 className="text-xl font-black font-header text-[var(--text-primary)] mb-2">
              {t('play.exitConfirm.title', 'Exit Game?')}
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              {t('play.exitConfirm.message', 'Your progress in this session will be lost. Are you sure you want to exit?')}
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitConfirm(false)}
                className="flex-1 py-3 rounded-xl font-bold glass-card hover:bg-white/55 text-[var(--text-primary)]"
              >
                {t('play.exitConfirm.cancel', 'Keep Playing')}
              </button>
              <button
                onClick={resetLocalGame}
                className="flex-1 py-3 rounded-xl font-bold bg-red-500 text-white"
              >
                {t('play.exitConfirm.confirm', 'Exit')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorGames;
