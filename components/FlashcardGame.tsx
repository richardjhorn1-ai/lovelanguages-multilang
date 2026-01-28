import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry, WordScore, AIChallengeMode, RomanticPhrase, TutorChallenge, WordRequest } from '../types';
import { getLevelFromXP, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS } from '../constants/language-config';
import { shuffleArray } from '../utils/array';
import { isCorrectAnswer, validateAnswerSmart } from '../utils/answer-helpers';
import { getRomanticPhrases, markPhrasesUsed, getAvailablePhraseCount } from '../services/romantic-phrases';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { sounds } from '../services/sounds';
import { haptics } from '../services/haptics';
import { useOffline } from '../hooks/useOffline';
import OfflineIndicator from './OfflineIndicator';
import TutorGames from './TutorGames';
import ErrorBoundary from './ErrorBoundary';
import PlayQuizChallenge from './PlayQuizChallenge';
import GameResults from './games/GameResults';
import { StreakIndicator, StreakCelebrationModal } from './games/components';
import { Flashcards, MultipleChoice } from './games/modes';
import PlayQuickFireChallenge from './PlayQuickFireChallenge';
import WordGiftLearning from './WordGiftLearning';
import ConversationPractice from './ConversationPractice';
import LimitReachedModal from './LimitReachedModal';

interface FlashcardGameProps { profile: Profile; }

type PracticeMode = 'love_notes' | 'flashcards' | 'multiple_choice' | 'type_it' | 'ai_challenge' | 'quick_fire';
type MainTab = 'local_games' | 'love_notes';
type LocalGameType = 'flashcards' | 'multiple_choice' | 'type_it' | 'quick_fire' | 'ai_challenge' | 'verb_mastery' | null;
type TypeItDirection = 'target_to_native' | 'native_to_target';
type VerbTense = 'present' | 'past' | 'future';
type VerbPerson = 'ja' | 'ty' | 'onOna' | 'my' | 'wy' | 'oni';

interface VerbMasteryQuestion {
  verb: DictionaryEntry;
  tense: VerbTense;
  person: VerbPerson;
  correctAnswer: string;
  infinitive: string;
  translation: string;
}

// TODO: ML-12 - Refactor Verb Mastery to be language-aware using getConjugationPersons()
// Currently Polish-specific; labels should come from LANGUAGE_CONFIGS[targetLanguage].grammar.conjugationPersons
const VERB_PERSONS: { key: VerbPerson; label: string; nativeLabel: string }[] = [
  { key: 'ja', label: 'ja', nativeLabel: 'I' },
  { key: 'ty', label: 'ty', nativeLabel: 'you (singular)' },
  { key: 'onOna', label: 'on/ona', nativeLabel: 'he/she' },
  { key: 'my', label: 'my', nativeLabel: 'we' },
  { key: 'wy', label: 'wy', nativeLabel: 'you (plural)' },
  { key: 'oni', label: 'oni', nativeLabel: 'they' }
];

interface TypeItQuestion {
  word: DictionaryEntry;
  direction: TypeItDirection;
}

type SessionLength = 10 | 20 | 'all';
type ChallengeQuestionType = 'flashcard' | 'multiple_choice' | 'type_it';

interface GameSessionAnswer {
  wordId?: string;
  wordText: string;
  correctAnswer: string;
  userAnswer?: string;
  questionType: 'flashcard' | 'multiple_choice' | 'type_it';
  isCorrect: boolean;
  explanation?: string;
}

interface ChallengeQuestion {
  id: string;
  type: ChallengeQuestionType;
  word: string;
  translation: string;
  wordId?: string;
  phraseId?: string;
  options?: string[];
}

// CHALLENGE_MODES moved inside component to use translations - see challengeModes useMemo

const STREAK_TO_LEARN = 5; // Number of consecutive correct answers to mark as learned

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [scores, setScores] = useState<WordScore[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Love Notes (partner challenges) state
  const [pendingChallenges, setPendingChallenges] = useState<TutorChallenge[]>([]);
  const [pendingWordRequests, setPendingWordRequests] = useState<WordRequest[]>([]);
  const [partnerName, setPartnerName] = useState('');
  const [activeChallenge, setActiveChallenge] = useState<TutorChallenge | null>(null);
  const [activeWordRequest, setActiveWordRequest] = useState<WordRequest | null>(null);

  // Main tab and local game state
  const [mainTab, setMainTab] = useState<MainTab>('local_games');
  const [localGameType, setLocalGameType] = useState<LocalGameType>(null);
  const [showConversationPractice, setShowConversationPractice] = useState(false);

  // Practice mode - default to love_notes if there are pending items
  const [mode, setMode] = useState<PracticeMode>('flashcards');
  const [finished, setFinished] = useState(false);
  const [sessionScore, setSessionScore] = useState({ correct: 0, incorrect: 0 });

  // Game session tracking
  const [sessionAnswers, setSessionAnswers] = useState<GameSessionAnswer[]>([]);
  const [sessionStartTime] = useState<number>(Date.now());

  // Streak tracking for current word
  const [currentWordStreak, setCurrentWordStreak] = useState(0);
  const [showStreakCelebration, setShowStreakCelebration] = useState(false);

  // Exit confirmation modal
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // Flashcard state
  const [isFlipped, setIsFlipped] = useState(false);

  // Multiple choice state
  const [mcOptions, setMcOptions] = useState<string[]>([]);
  const [mcSelected, setMcSelected] = useState<string | null>(null);
  const [mcShowFeedback, setMcShowFeedback] = useState(false);

  // Type It state
  const [typeItQuestions, setTypeItQuestions] = useState<TypeItQuestion[]>([]);
  const [typeItAnswer, setTypeItAnswer] = useState('');
  const [typeItSubmitted, setTypeItSubmitted] = useState(false);
  const [typeItCorrect, setTypeItCorrect] = useState(false);
  const [typeItExplanation, setTypeItExplanation] = useState('');
  const [showHint, setShowHint] = useState(false);

  // AI Challenge state
  const [selectedChallengeMode, setSelectedChallengeMode] = useState<AIChallengeMode | null>(null);
  const [sessionLength, setSessionLength] = useState<SessionLength | null>(null);
  const [challengeQuestions, setChallengeQuestions] = useState<ChallengeQuestion[]>([]);
  const [challengeStarted, setChallengeStarted] = useState(false);
  const [challengeIndex, setChallengeIndex] = useState(0);
  const [challengeFlipped, setChallengeFlipped] = useState(false);
  const [challengeMcSelected, setChallengeMcSelected] = useState<string | null>(null);
  const [challengeMcFeedback, setChallengeMcFeedback] = useState(false);
  const [challengeTypeAnswer, setChallengeTypeAnswer] = useState('');
  const [challengeTypeSubmitted, setChallengeTypeSubmitted] = useState(false);
  const [challengeTypeCorrect, setChallengeTypeCorrect] = useState(false);
  const [challengeTypeExplanation, setChallengeTypeExplanation] = useState('');
  const [loadingPhrases, setLoadingPhrases] = useState(false);

  // Quick Fire state
  const [quickFireWords, setQuickFireWords] = useState<DictionaryEntry[]>([]);
  const [quickFireIndex, setQuickFireIndex] = useState(0);
  const [quickFireInput, setQuickFireInput] = useState('');
  const [quickFireTimeLeft, setQuickFireTimeLeft] = useState(60);
  const [quickFireStarted, setQuickFireStarted] = useState(false);
  const [quickFireShowFeedback, setQuickFireShowFeedback] = useState<'correct' | 'wrong' | null>(null);
  const [showIncorrectShake, setShowIncorrectShake] = useState(false);
  const quickFireTimerRef = useRef<NodeJS.Timeout | null>(null);
  const quickFireAnswersRef = useRef<GameSessionAnswer[]>([]);
  const quickFireScoreRef = useRef({ correct: 0, incorrect: 0 });

  // Verb Mastery state
  const [verbMasteryTense, setVerbMasteryTense] = useState<VerbTense>('present');
  const [verbMasteryQuestions, setVerbMasteryQuestions] = useState<VerbMasteryQuestion[]>([]);
  const [verbMasteryIndex, setVerbMasteryIndex] = useState(0);
  const [verbMasteryInput, setVerbMasteryInput] = useState('');
  const [verbMasterySubmitted, setVerbMasterySubmitted] = useState(false);
  const [verbMasteryCorrect, setVerbMasteryCorrect] = useState(false);
  const [verbMasteryStarted, setVerbMasteryStarted] = useState(false);
  const [verbMasteryExplanation, setVerbMasteryExplanation] = useState<string | null>(null);

  // Rate limit / free tier state
  const [showLimitModal, setShowLimitModal] = useState(false);
  const [useBasicValidation, setUseBasicValidation] = useState(false);

  // Level styling
  const levelInfo = useMemo(() => getLevelFromXP(profile.xp || 0), [profile.xp]);
  const tierColor = useMemo(() => getTierColor(levelInfo.tier), [levelInfo.tier]);

  // Theme
  const { accentHex } = useTheme();

  // Language
  const { targetLanguage, targetName, nativeLanguage, languageParams } = useLanguage();
  const nativeName = LANGUAGE_CONFIGS[nativeLanguage]?.name || 'English';

  // i18n
  const { t } = useTranslation();

  // Offline mode
  const { isOnline, cacheVocabulary, getCachedVocabulary, cachedWordCount, lastSyncTime } = useOffline(profile.id, targetLanguage);

  // Challenge modes with translations (moved from module level to use t())
  const challengeModes = useMemo(() => [
    { id: 'weakest' as const, name: t('play.aiChallenge.modes.weakest'), description: t('play.aiChallenge.modes.weakestDesc'), icon: 'Target' as const },
    { id: 'gauntlet' as const, name: t('play.aiChallenge.modes.gauntlet'), description: t('play.aiChallenge.modes.gauntletDesc'), icon: 'Shuffle' as const },
    { id: 'romantic' as const, name: t('play.aiChallenge.modes.romantic'), description: t('play.aiChallenge.modes.romanticDesc', { language: targetName }), icon: 'Heart' as const },
    { id: 'least_practiced' as const, name: t('play.aiChallenge.modes.leastPracticed'), description: t('play.aiChallenge.modes.leastPracticedDesc'), icon: 'Clock' as const },
    { id: 'review_mastered' as const, name: t('play.aiChallenge.modes.reviewMastered'), description: t('play.aiChallenge.modes.reviewMasteredDesc'), icon: 'Trophy' as const }
  ], [t, targetName]);

  // Tutor dashboard data (computed unconditionally to follow Rules of Hooks)
  const masteredWords = useMemo(() =>
    deck.filter(w => scoresMap.get(w.id)?.learned_at != null),
    [deck, scoresMap]
  );

  const recentWords = useMemo(() => {
    return [...deck]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [deck]);

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
    if (deck.length >= 5 && deck.length % 5 === 0) {
      prompts.push({ icon: '🎉', message: `${deck.length} words in their vocabulary - celebrate this milestone!`, color: 'text-[var(--accent-color)]' });
    }
    if (recentWords.length > 0) {
      prompts.push({ icon: '✨', message: `They just learned "${recentWords[0].word}" - use it in conversation today!`, color: 'text-purple-600' });
    }
    return prompts.slice(0, 2);
  }, [masteredWords, scores, deck, recentWords]);

  useEffect(() => {
    fetchData();
  }, [profile, targetLanguage]);

  // Listen for language switch events from Profile settings
  useEffect(() => {
    const handleLanguageSwitch = () => {
      fetchData();
    };
    window.addEventListener('language-switched', handleLanguageSwitch);
    return () => window.removeEventListener('language-switched', handleLanguageSwitch);
  }, []);

  // Generate MC options when mode/index changes
  useEffect(() => {
    if (mode === 'multiple_choice' && deck.length >= 4 && currentIndex < deck.length) {
      generateMcOptions();
    }
  }, [mode, currentIndex, deck]);

  // Generate Type It questions when mode changes
  useEffect(() => {
    if (mode === 'type_it' && deck.length > 0) {
      generateTypeItQuestions();
    }
  }, [mode, deck]);

  const fetchData = async () => {
    setLoading(true);
    const targetUserId = (profile.role === 'tutor' && profile.linked_user_id)
      ? profile.linked_user_id
      : profile.id;

    // If offline, try to use cached data
    if (!isOnline) {
      const cachedData = getCachedVocabulary();
      if (cachedData && cachedData.length > 0) {
        setDeck(shuffleArray(cachedData));
        setLoading(false);
        return;
      }
    }

    const { data: dictData } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

    if (dictData) {
      setDeck(shuffleArray(dictData));
      // Cache for offline use
      cacheVocabulary(dictData);
    }

    const { data: scoreData } = await supabase
      .from('word_scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId)
      .eq('language_code', targetLanguage);

    if (scoreData) {
      setScores(scoreData as WordScore[]);
      // Create a map for quick lookup
      const map = new Map<string, WordScore>();
      scoreData.forEach((s: any) => map.set(s.word_id, s as WordScore));
      setScoresMap(map);
    }

    // Fetch pending challenges and word requests for students
    if (profile.role === 'student') {
      await fetchPendingItems();
    }

    setLoading(false);
  };

  const fetchPendingItems = async () => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;

      // Get partner name
      if (profile.linked_user_id) {
        const { data: partner } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('id', profile.linked_user_id)
          .single();
        if (partner) setPartnerName(partner.full_name);
      }

      // Fetch pending challenges
      const challengeRes = await fetch('/api/get-challenges', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams })
      });
      const challengeData = await challengeRes.json();
      if (challengeData.challenges) {
        setPendingChallenges(challengeData.challenges);
        // Auto-switch to Love Notes tab if there are pending items
        if (challengeData.challenges.length > 0) {
          setMainTab('love_notes');
        }
      }

      // Fetch pending word requests
      const requestRes = await fetch('/api/get-word-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ status: 'pending', role: 'student', ...languageParams })
      });
      const requestData = await requestRes.json();
      if (requestData.wordRequests) {
        setPendingWordRequests(requestData.wordRequests);
        // Auto-switch to Love Notes tab if there are pending items
        if (requestData.wordRequests.length > 0 && pendingChallenges.length === 0) {
          setMainTab('love_notes');
        }
      }
    } catch (error) {
      console.error('Error fetching pending items:', error);
    }
  };

  const handleChallengeComplete = () => {
    setActiveChallenge(null);
    fetchPendingItems();
    fetchData();
  };

  const handleWordRequestComplete = () => {
    setActiveWordRequest(null);
    fetchPendingItems();
    fetchData();
  };

  // Helper to update score with proper streak tracking
  const updateWordScore = async (wordId: string, isCorrect: boolean) => {
    const existingScore = scoresMap.get(wordId);

    // Calculate new values
    const newSuccessCount = (existingScore?.success_count || 0) + (isCorrect ? 1 : 0);
    const newFailCount = (existingScore?.fail_count || 0) + (isCorrect ? 0 : 1);

    // Streak logic: increment if correct, reset to 0 if incorrect
    const currentStreak = existingScore?.correct_streak || 0;
    const newStreak = isCorrect ? currentStreak + 1 : 0;

    // Check if word just became learned (hit streak threshold)
    const wasLearned = existingScore?.learned_at != null;
    const justLearned = !wasLearned && newStreak >= STREAK_TO_LEARN;
    const learnedAt = wasLearned
      ? existingScore.learned_at
      : (justLearned ? new Date().toISOString() : null);

    const scoreUpdate = {
      user_id: profile.id,
      word_id: wordId,
      success_count: newSuccessCount,
      fail_count: newFailCount,
      correct_streak: newStreak,
      learned_at: learnedAt,
      last_practiced: new Date().toISOString()
    };

    // Update in database
    await supabase.from('word_scores').upsert(scoreUpdate, {
      onConflict: 'user_id,word_id'
    });

    // Update local state
    setScoresMap(prev => {
      const newMap = new Map(prev);
      newMap.set(wordId, scoreUpdate as WordScore);
      return newMap;
    });

    // Update UI streak tracking
    setCurrentWordStreak(newStreak);

    // Trigger celebration when word is mastered (5 correct in a row)
    if (justLearned) {
      setShowStreakCelebration(true);
      sounds.play('perfect');
      haptics.trigger('tier-up');
      setTimeout(() => setShowStreakCelebration(false), 3000);
    }

    return { justLearned, newStreak };
  };

  // Trigger shake animation for incorrect answers
  const triggerIncorrectFeedback = () => {
    setShowIncorrectShake(true);
    setTimeout(() => setShowIncorrectShake(false), 500);
  };

  // Get streak for current word from scores
  const getCurrentWordStreak = (wordId: string): number => {
    const score = scoresMap.get(wordId);
    return score?.correct_streak || 0;
  };

  // Update current word streak when word changes
  useEffect(() => {
    if (deck.length > 0 && currentIndex < deck.length) {
      const wordId = deck[currentIndex]?.id;
      if (wordId) {
        setCurrentWordStreak(getCurrentWordStreak(wordId));
      }
    }
  }, [currentIndex, deck, scoresMap]);

  // Save game session to database
  const saveGameSession = async (gameMode: string, answers: GameSessionAnswer[], correct: number, incorrect: number) => {
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      const totalTimeSeconds = Math.floor((Date.now() - sessionStartTime) / 1000);

      await fetch('/api/submit-game-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          gameMode,
          correctCount: correct,
          incorrectCount: incorrect,
          totalTimeSeconds,
          answers,
          ...languageParams
        })
      });
    } catch (error) {
      console.error('Error saving game session:', error);
    }
  };

  // Calculate available word counts for AI Challenge modes
  const modeCounts = useMemo(() => {
    const unlearnedWords = deck.filter(w => !scoresMap.get(w.id)?.learned_at);
    const learnedWords = deck.filter(w => scoresMap.get(w.id)?.learned_at != null);
    const weakestWords = unlearnedWords.filter(w => {
      const score = scoresMap.get(w.id);
      return score && (score.fail_count > 0 || (score.correct_streak || 0) < 3);
    });
    return {
      weakest: weakestWords.length,
      gauntlet: unlearnedWords.length,
      romantic: getAvailablePhraseCount(targetLanguage, nativeLanguage),
      least_practiced: unlearnedWords.length,
      review_mastered: learnedWords.length
    };
  }, [deck, scoresMap, targetLanguage, nativeLanguage]);

  // Generate AI Challenge questions
  const generateChallengeQuestions = async (challengeMode: AIChallengeMode, length: SessionLength) => {
    let wordPool: DictionaryEntry[] = [];
    let phrasePool: RomanticPhrase[] = [];
    const unlearnedWords = deck.filter(w => !scoresMap.get(w.id)?.learned_at);
    const learnedWords = deck.filter(w => scoresMap.get(w.id)?.learned_at != null);

    switch (challengeMode) {
      case 'weakest':
        wordPool = [...unlearnedWords].sort((a, b) => {
          const scoreA = scoresMap.get(a.id);
          const scoreB = scoresMap.get(b.id);
          return ((scoreB?.fail_count || 0) - (scoreB?.success_count || 0)) - ((scoreA?.fail_count || 0) - (scoreA?.success_count || 0));
        });
        break;
      case 'gauntlet':
        wordPool = shuffleArray(unlearnedWords);
        break;
      case 'romantic':
        setLoadingPhrases(true);
        try {
          const difficulty = levelInfo.tier === 'Beginner' ? 'beginner' : levelInfo.tier === 'Elementary' || levelInfo.tier === 'Conversational' ? 'intermediate' : 'advanced';
          const count = length === 'all' ? 20 : length as number;
          phrasePool = await getRomanticPhrases(targetLanguage, nativeLanguage, count, difficulty);
        } catch (error) {
          console.error('Failed to load romantic phrases:', error);
          setLoadingPhrases(false);
          return;
        }
        setLoadingPhrases(false);
        break;
      case 'least_practiced':
        wordPool = [...unlearnedWords].sort((a, b) => {
          const scoreA = scoresMap.get(a.id);
          const scoreB = scoresMap.get(b.id);
          if (!scoreA?.last_practiced) return -1;
          if (!scoreB?.last_practiced) return 1;
          return new Date(scoreA.last_practiced).getTime() - new Date(scoreB.last_practiced).getTime();
        });
        break;
      case 'review_mastered':
        wordPool = shuffleArray(learnedWords);
        break;
    }

    const maxCount = challengeMode === 'romantic' ? phrasePool.length : wordPool.length;
    const count = length === 'all' ? maxCount : Math.min(length as number, maxCount);
    const generated: ChallengeQuestion[] = [];

    if (challengeMode === 'romantic') {
      phrasePool.slice(0, count).forEach((phrase, idx) => {
        generated.push({ id: `q-${idx}`, type: 'type_it', word: phrase.word, translation: phrase.translation, phraseId: phrase.id });
      });
    } else {
      wordPool.slice(0, count).forEach((word, idx) => {
        let qType: ChallengeQuestionType = challengeMode === 'gauntlet'
          ? (['flashcard', 'multiple_choice', 'type_it'] as ChallengeQuestionType[])[Math.floor(Math.random() * 3)]
          : Math.random() > 0.6 ? 'type_it' : 'multiple_choice';
        const q: ChallengeQuestion = { id: `q-${idx}`, type: qType, word: word.word, translation: word.translation, wordId: word.id };
        if (qType === 'multiple_choice' && deck.length >= 4) {
          q.options = shuffleArray([word.translation, ...shuffleArray(deck.filter(w => w.id !== word.id).map(w => w.translation)).slice(0, 3)]);
        } else if (qType === 'multiple_choice') {
          q.type = 'type_it';
        }
        generated.push(q);
      });
    }
    setChallengeQuestions(shuffleArray(generated));
  };

  const startChallenge = async () => {
    if (!selectedChallengeMode || !sessionLength) return;
    await generateChallengeQuestions(selectedChallengeMode, sessionLength);
    setChallengeStarted(true);
    setChallengeIndex(0);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]); // Reset answers for new session
    setFinished(false);
  };

  const resetChallenge = () => {
    setSelectedChallengeMode(null);
    setSessionLength(null);
    setChallengeQuestions([]);
    setChallengeStarted(false);
    setChallengeIndex(0);
    resetChallengeQuestionState();
  };

  const resetChallengeQuestionState = () => {
    setChallengeFlipped(false);
    setChallengeMcSelected(null);
    setChallengeMcFeedback(false);
    setChallengeTypeAnswer('');
    setChallengeTypeSubmitted(false);
    setChallengeTypeCorrect(false);
    setChallengeTypeExplanation('');
  };

  const handleChallengeFlashcardResponse = async (isCorrect: boolean) => {
    const q = challengeQuestions[challengeIndex];

    // Play feedback
    sounds.play('correct');
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.word,
      correctAnswer: q.translation,
      questionType: 'flashcard',
      isCorrect
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);

    const newScore = {
      correct: sessionScore.correct + (isCorrect ? 1 : 0),
      incorrect: sessionScore.incorrect + (isCorrect ? 0 : 1)
    };
    setSessionScore(newScore);

    if (q.wordId) await updateWordScore(q.wordId, isCorrect);
    advanceChallengeQuestion(newAnswers, newScore);
  };

  const handleChallengeMcSelect = async (option: string) => {
    if (challengeMcFeedback) return;
    setChallengeMcSelected(option);
    setChallengeMcFeedback(true);
    const q = challengeQuestions[challengeIndex];
    const correct = option === q.translation;

    // Play feedback
    sounds.play('correct');
    haptics.trigger(correct ? 'correct' : 'incorrect');

    // Visual feedback for incorrect
    if (!correct) {
      triggerIncorrectFeedback();
    }

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.word,
      correctAnswer: q.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect: correct
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);

    const newScore = {
      correct: sessionScore.correct + (correct ? 1 : 0),
      incorrect: sessionScore.incorrect + (correct ? 0 : 1)
    };
    setSessionScore(newScore);

    if (q.wordId) await updateWordScore(q.wordId, correct);
    setTimeout(() => advanceChallengeQuestion(newAnswers, newScore), correct ? 800 : 1500);
  };

  const handleChallengeTypeSubmit = async () => {
    if (challengeTypeSubmitted) {
      advanceChallengeQuestion(sessionAnswers, sessionScore);
      return;
    }
    const q = challengeQuestions[challengeIndex];

    // Use smart validation if enabled and not rate-limited, otherwise use local matching
    let correct: boolean;
    let explanation = '';
    if (profile.smart_validation && !useBasicValidation) {
      const result = await validateAnswerSmart(challengeTypeAnswer, q.translation, {
        targetWord: q.word,
        direction: 'target_to_native',
        languageParams
      });
      correct = result.accepted;
      explanation = result.explanation;
      // Check if rate limit was hit
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
    } else {
      correct = isCorrectAnswer(challengeTypeAnswer, q.translation);
      explanation = correct ? 'Exact match' : 'No match';
    }

    // Play feedback
    sounds.play('correct');
    haptics.trigger(correct ? 'correct' : 'incorrect');

    // Visual feedback for incorrect
    if (!correct) {
      triggerIncorrectFeedback();
    }

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.word,
      correctAnswer: q.translation,
      userAnswer: challengeTypeAnswer,
      questionType: 'type_it',
      isCorrect: correct,
      explanation
    };
    setSessionAnswers(prev => [...prev, answer]);

    setChallengeTypeSubmitted(true);
    setChallengeTypeCorrect(correct);
    setChallengeTypeExplanation(explanation);
    setSessionScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), incorrect: prev.incorrect + (correct ? 0 : 1) }));
    if (q.wordId) await updateWordScore(q.wordId, correct);
  };

  const advanceChallengeQuestion = (answers: GameSessionAnswer[], score: { correct: number; incorrect: number }) => {
    if (challengeIndex < challengeQuestions.length - 1) {
      resetChallengeQuestionState();
      setChallengeIndex(c => c + 1);
    } else {
      // Play perfect sound if all correct
      if (score.incorrect === 0) {
        sounds.play('perfect');
        haptics.trigger('perfect');
      }
      setFinished(true);
      // Save game session
      saveGameSession('ai_challenge', answers, score.correct, score.incorrect);
      // Mark romantic phrases as used after completing challenge
      if (selectedChallengeMode === 'romantic') {
        const usedIds = challengeQuestions
          .map(q => q.phraseId)
          .filter((id): id is string => !!id);
        if (usedIds.length > 0) {
          markPhrasesUsed(targetLanguage, nativeLanguage, usedIds);
        }
      }
    }
  };

  const generateMcOptions = () => {
    const currentWord = deck[currentIndex];
    const wrongOptions = deck
      .filter(w => w.id !== currentWord.id)
      .map(w => w.translation);

    const shuffledWrong = shuffleArray(wrongOptions).slice(0, 3);
    const allOptions = shuffleArray([currentWord.translation, ...shuffledWrong]);
    setMcOptions(allOptions);
    setMcSelected(null);
    setMcShowFeedback(false);
  };

  const generateTypeItQuestions = () => {
    const questions: TypeItQuestion[] = deck.map(word => ({
      word,
      direction: Math.random() > 0.5 ? 'target_to_native' : 'native_to_target'
    }));
    setTypeItQuestions(shuffleArray(questions));
    setCurrentIndex(0);
    resetTypeItState();
  };

  const resetTypeItState = () => {
    setTypeItAnswer('');
    setTypeItSubmitted(false);
    setTypeItCorrect(false);
    setTypeItExplanation('');
    setShowHint(false);
  };

  const handleModeChange = (newMode: PracticeMode) => {
    setMode(newMode);
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setIsFlipped(false);
    setMcSelected(null);
    setMcShowFeedback(false);
    resetTypeItState();
    // Reset AI Challenge state when switching modes
    resetChallenge();
    // Reset Quick Fire state
    resetQuickFire();

    // Reshuffle deck
    setDeck(shuffleArray([...deck]));
  };

  // Start a local game from the game selection grid
  const startLocalGame = (gameType: LocalGameType) => {
    setLocalGameType(gameType);
    if (gameType) {
      setMode(gameType as PracticeMode);
      setCurrentIndex(0);
      setFinished(false);
      setSessionScore({ correct: 0, incorrect: 0 });
      setSessionAnswers([]); // Reset answers for new session
      setDeck(shuffleArray([...deck]));

      // Start Quick Fire immediately if selected
      if (gameType === 'quick_fire') {
        const shuffled = shuffleArray(deck).slice(0, 20);
        setQuickFireWords(shuffled);
        setQuickFireIndex(0);
        setQuickFireInput('');
        setQuickFireTimeLeft(60);
        setQuickFireStarted(false); // Will start when user clicks Start
      }
    }
  };

  // Check if game is in progress (has started answering questions)
  const isGameInProgress = localGameType !== null && !finished && (
    challengeStarted || quickFireStarted || verbMasteryStarted ||
    currentIndex > 0 || sessionScore.correct > 0 || sessionScore.incorrect > 0
  );

  // Return to game selection grid (with confirmation if game in progress)
  const handleExitRequest = () => {
    if (isGameInProgress) {
      setShowExitConfirm(true);
    } else {
      exitLocalGame();
    }
  };

  const exitLocalGame = () => {
    setShowExitConfirm(false);
    setLocalGameType(null);
    setFinished(false);
    resetChallenge();
    resetQuickFire();
    resetTypeItState();
    resetVerbMastery();
  };

  // Quick Fire functions
  const startQuickFire = () => {
    // Play countdown sound at start
    sounds.play('countdown');

    const shuffled = shuffleArray(deck).slice(0, 20);
    setQuickFireWords(shuffled);
    setQuickFireIndex(0);
    setQuickFireInput('');
    setQuickFireTimeLeft(60);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    quickFireAnswersRef.current = [];
    quickFireScoreRef.current = { correct: 0, incorrect: 0 };
    setQuickFireStarted(true);
    setFinished(false);

    // Start timer
    quickFireTimerRef.current = setInterval(() => {
      setQuickFireTimeLeft(prev => {
        if (prev <= 1) {
          if (quickFireTimerRef.current) clearInterval(quickFireTimerRef.current);
          setFinished(true);
          // Save game session using refs (closure won't have latest state)
          saveGameSession('quick_fire', quickFireAnswersRef.current, quickFireScoreRef.current.correct, quickFireScoreRef.current.incorrect);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const handleQuickFireAnswer = async () => {
    if (!quickFireInput.trim()) return;

    const word = quickFireWords[quickFireIndex];

    // Use smart validation if enabled and not rate-limited, otherwise local matching
    let isCorrect: boolean;
    let explanation = '';
    if (profile.smart_validation && !useBasicValidation) {
      const result = await validateAnswerSmart(quickFireInput, word.translation, {
        targetWord: word.word,
        wordType: word.word_type,
        direction: 'target_to_native',
        languageParams
      });
      isCorrect = result.accepted;
      explanation = result.explanation;
      // Check if rate limit was hit
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
    } else {
      // Use diacritics-normalized comparison for consistency
      isCorrect = isCorrectAnswer(quickFireInput, word.translation);
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    // Record answer with explanation
    const answer: GameSessionAnswer & { explanation?: string } = {
      wordId: word.id,
      wordText: word.word,
      correctAnswer: word.translation,
      userAnswer: quickFireInput,
      questionType: 'type_it',
      isCorrect,
      explanation
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);
    // Also update ref for timer callback access
    quickFireAnswersRef.current = newAnswers;

    setQuickFireShowFeedback(isCorrect ? 'correct' : 'wrong');
    sounds.play('correct'); // Play feedback sound
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');
    setTimeout(() => setQuickFireShowFeedback(null), 200);

    const newScore = {
      correct: sessionScore.correct + (isCorrect ? 1 : 0),
      incorrect: sessionScore.incorrect + (isCorrect ? 0 : 1)
    };
    setSessionScore(newScore);
    // Also update ref for timer callback access
    quickFireScoreRef.current = newScore;

    // Update score
    await updateWordScore(word.id, isCorrect);

    setQuickFireInput('');

    if (quickFireIndex < quickFireWords.length - 1) {
      setQuickFireIndex(prev => prev + 1);
    } else {
      // Finished all words
      if (quickFireTimerRef.current) clearInterval(quickFireTimerRef.current);
      // Play perfect sound if all correct, otherwise just notification
      if (newScore.incorrect === 0) {
        sounds.play('perfect');
        haptics.trigger('perfect');
      }
      setFinished(true);
      // Save game session
      saveGameSession('quick_fire', newAnswers, newScore.correct, newScore.incorrect);
    }
  };

  const resetQuickFire = () => {
    if (quickFireTimerRef.current) clearInterval(quickFireTimerRef.current);
    setQuickFireWords([]);
    setQuickFireIndex(0);
    setQuickFireInput('');
    setQuickFireTimeLeft(60);
    setQuickFireStarted(false);
    setQuickFireShowFeedback(null);
  };

  // Helper to get context data from entry columns (new schema)
  const getEntryContext = (entry: DictionaryEntry) => {
    return {
      conjugations: entry.conjugations || null,
      gender: entry.gender || null,
      plural: entry.plural || null,
      adjectiveForms: entry.adjective_forms || null,
      proTip: entry.pro_tip || null,
      example: entry.example_sentence || null
    };
  };

  // Verb Mastery functions
  const verbsWithConjugations = useMemo(() => {
    return deck.filter(w => {
      if (w.word_type !== 'verb') return false;
      return (w.conjugations as any)?.present;
    }).map(w => ({
      ...w,
      conjugations: w.conjugations
    }));
  }, [deck]);

  const generateVerbMasteryQuestions = (tense: VerbTense): VerbMasteryQuestion[] => {
    const questions: VerbMasteryQuestion[] = [];
    const verbs = shuffleArray([...verbsWithConjugations]);

    for (const verb of verbs) {
      const conjugations = verb.conjugations;
      if (!conjugations) continue;

      const tenseData = conjugations[tense];
      if (!tenseData) continue;

      // Add a question for each person that has data
      for (const personInfo of VERB_PERSONS) {
        const answer = tenseData[personInfo.key];
        if (answer) {
          questions.push({
            verb,
            tense,
            person: personInfo.key,
            correctAnswer: answer,
            infinitive: verb.word,
            translation: verb.translation
          });
        }
      }
    }

    return shuffleArray(questions).slice(0, 20); // Limit to 20 questions
  };

  const startVerbMastery = (tense: VerbTense) => {
    const questions = generateVerbMasteryQuestions(tense);
    if (questions.length === 0) {
      alert(t('play.verbMastery.noVerbsAlert', { tense }));
      return;
    }
    setVerbMasteryTense(tense);
    setVerbMasteryQuestions(questions);
    setVerbMasteryIndex(0);
    setVerbMasteryInput('');
    setVerbMasterySubmitted(false);
    setVerbMasteryCorrect(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setSessionAnswers([]);
    setVerbMasteryStarted(true);
    setFinished(false);
  };

  const handleVerbMasterySubmit = async () => {
    if (!verbMasteryInput.trim() || verbMasterySubmitted) return;

    const question = verbMasteryQuestions[verbMasteryIndex];

    // Use smart validation if enabled and not rate-limited, otherwise use local matching
    let isCorrect: boolean;
    let explanation: string | null = null;
    if (profile.smart_validation && !useBasicValidation) {
      const result = await validateAnswerSmart(verbMasteryInput, question.correctAnswer, {
        targetWord: question.infinitive,
        wordType: 'verb',
        direction: 'native_to_target',
        languageParams
      });
      isCorrect = result.accepted;
      // Only show explanation if not exact match
      if (result.explanation && result.explanation !== 'Exact match') {
        explanation = result.explanation;
      }
      // Check if rate limit was hit
      if (result.rateLimitHit) {
        setShowLimitModal(true);
      }
    } else {
      isCorrect = isCorrectAnswer(verbMasteryInput, question.correctAnswer);
    }

    // Play feedback
    sounds.play('correct');
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');

    // Visual feedback for incorrect
    if (!isCorrect) {
      triggerIncorrectFeedback();
    }

    setVerbMasterySubmitted(true);
    setVerbMasteryCorrect(isCorrect);
    setVerbMasteryExplanation(explanation);

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: question.verb.id,
      wordText: `${question.infinitive} (${question.person})`,
      correctAnswer: question.correctAnswer,
      userAnswer: verbMasteryInput,
      questionType: 'type_it',
      isCorrect
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);

    const newScore = {
      correct: sessionScore.correct + (isCorrect ? 1 : 0),
      incorrect: sessionScore.incorrect + (isCorrect ? 0 : 1)
    };
    setSessionScore(newScore);

    // Update word score
    await updateWordScore(question.verb.id!, isCorrect);
  };

  const handleVerbMasteryNext = () => {
    if (verbMasteryIndex < verbMasteryQuestions.length - 1) {
      setVerbMasteryIndex(i => i + 1);
      setVerbMasteryInput('');
      setVerbMasterySubmitted(false);
      setVerbMasteryExplanation(null);
      setVerbMasteryCorrect(false);
    } else {
      // Play perfect sound if all correct
      if (sessionScore.incorrect === 0) {
        sounds.play('perfect');
        haptics.trigger('perfect');
      }
      setFinished(true);
      saveGameSession('verb_mastery', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
    }
  };

  const resetVerbMastery = () => {
    setVerbMasteryQuestions([]);
    setVerbMasteryIndex(0);
    setVerbMasteryInput('');
    setVerbMasterySubmitted(false);
    setVerbMasteryCorrect(false);
    setVerbMasteryStarted(false);
  };

  // Cleanup Quick Fire timer on unmount
  useEffect(() => {
    return () => {
      if (quickFireTimerRef.current) clearInterval(quickFireTimerRef.current);
    };
  }, []);

  // Exit confirmation when game is in progress
  useEffect(() => {
    const isGameInProgress = localGameType !== null && !finished && (
      challengeStarted || quickFireStarted || verbMasteryStarted ||
      currentIndex > 0 || sessionScore.correct > 0 || sessionScore.incorrect > 0
    );

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isGameInProgress) {
        e.preventDefault();
        // Modern browsers ignore custom messages, but this triggers the dialog
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
  }, [localGameType, finished, challengeStarted, quickFireStarted, verbMasteryStarted, currentIndex, sessionScore]);

  // Generic callbacks for extracted game mode components
  const handleGameAnswer = async (result: { wordId?: string; wordText: string; correctAnswer: string; userAnswer?: string; questionType: 'flashcard' | 'multiple_choice' | 'type_it'; isCorrect: boolean }) => {
    // Play feedback
    sounds.play('correct');
    haptics.trigger(result.isCorrect ? 'correct' : 'incorrect');

    // Visual shake for incorrect
    if (!result.isCorrect) {
      triggerIncorrectFeedback();
    }

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: result.wordId,
      wordText: result.wordText,
      correctAnswer: result.correctAnswer,
      userAnswer: result.userAnswer,
      questionType: result.questionType,
      isCorrect: result.isCorrect
    };
    setSessionAnswers(prev => [...prev, answer]);
    setSessionScore(prev => ({
      correct: prev.correct + (result.isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (result.isCorrect ? 0 : 1)
    }));

    // Update word score with streak tracking
    if (result.wordId) {
      await updateWordScore(result.wordId, result.isCorrect);
    }
  };

  const handleGameNext = () => {
    setCurrentIndex(c => c + 1);
  };

  const createGameCompleteHandler = (gameType: 'flashcards' | 'multiple_choice' | 'type_it' | 'quick_fire' | 'verb_mastery') => () => {
    // Play perfect sound if all correct
    if (sessionScore.incorrect === 0) {
      sounds.play('perfect');
      haptics.trigger('perfect');
    }
    setFinished(true);
    saveGameSession(gameType, sessionAnswers, sessionScore.correct, sessionScore.incorrect);
  };

  const handleTypeItSubmit = async () => {
    if (typeItSubmitted) {
      // Move to next question
      if (currentIndex < typeItQuestions.length - 1) {
        setCurrentIndex(c => c + 1);
        resetTypeItState();
      } else {
        // Play perfect sound if all correct
        if (sessionScore.incorrect === 0) {
          sounds.play('perfect');
          haptics.trigger('perfect');
        }
        setFinished(true);
        // Save game session
        saveGameSession('type_it', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
      }
      return;
    }

    const question = typeItQuestions[currentIndex];
    const correctAnswer = question.direction === 'target_to_native'
      ? question.word.translation
      : question.word.word;

    // Use smart validation if enabled, otherwise use local matching
    let isCorrect: boolean;
    let explanation = '';
    if (profile.smart_validation) {
      const result = await validateAnswerSmart(typeItAnswer, correctAnswer, {
        targetWord: question.word.word,
        wordType: question.word.word_type,
        direction: question.direction,
        languageParams
      });
      isCorrect = result.accepted;
      explanation = result.explanation;
    } else {
      isCorrect = isCorrectAnswer(typeItAnswer, correctAnswer);
      explanation = isCorrect ? 'Exact match' : 'No match';
    }

    // Play feedback
    sounds.play('correct');
    haptics.trigger(isCorrect ? 'correct' : 'incorrect');

    // Visual feedback for incorrect
    if (!isCorrect) {
      triggerIncorrectFeedback();
    }

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: question.word.id,
      wordText: question.word.word,
      correctAnswer,
      userAnswer: typeItAnswer,
      questionType: 'type_it',
      isCorrect,
      explanation
    };
    setSessionAnswers(prev => [...prev, answer]);

    setTypeItSubmitted(true);
    setTypeItCorrect(isCorrect);
    setTypeItExplanation(explanation);

    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    // Update score with proper streak tracking
    await updateWordScore(question.word.id, isCorrect);
  };

  const getHint = () => {
    const question = typeItQuestions[currentIndex];
    const answer = question.direction === 'target_to_native'
      ? question.word.translation
      : question.word.word;
    return answer.charAt(0) + '...';
  };

  const restartSession = () => {
    setDeck(shuffleArray([...deck]));
    setCurrentIndex(0);
    setFinished(false);
    setSessionScore({ correct: 0, incorrect: 0 });
    setIsFlipped(false);
    resetTypeItState();
    if (mode === 'type_it') {
      generateTypeItQuestions();
    }
  };

  // Loading state
  if (loading) return (
    <div className="h-full flex items-center justify-center font-bold text-[var(--accent-color)] animate-pulse">
      {t('play.loading')}
    </div>
  );

  // Tutor games view - Use TutorGames component
  if (profile.role === 'tutor') {
    return (
      <ErrorBoundary>
        <TutorGames profile={profile} />
      </ErrorBoundary>
    );
  }

  // Empty state
  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
      <div className="w-20 h-20 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent-color)] opacity-60 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">{t('play.empty.noWords')}</h2>
      <p className="text-[var(--text-secondary)] font-medium">{t('play.empty.noWordsDesc')}</p>
    </div>
  );

  // Not enough words for multiple choice
  if (mode === 'multiple_choice' && deck.length < 4) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 mb-6">
          <ICONS.Star className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">{t('play.empty.needMore')}</h2>
        <p className="text-[var(--text-secondary)] font-medium mb-6">{t('play.empty.needMoreDesc', { count: deck.length })}</p>
        <button
          onClick={() => handleModeChange('flashcards')}
          className="px-6 py-3 rounded-xl font-bold text-white text-scale-label"
          style={{ backgroundColor: tierColor }}
        >
          {t('play.empty.tryFlashcards')}
        </button>
      </div>
    );
  }

  // Finished state
  if (finished && localGameType) return (
    <GameResults
      correct={sessionScore.correct}
      incorrect={sessionScore.incorrect}
      tierColor={tierColor}
      onPlayAgain={restartSession}
      onExit={exitLocalGame}
      answers={sessionAnswers}
    />
  );

  // Current items based on mode/game type
  const getCurrentStats = (): { index: number; length: number } => {
    if (localGameType === 'ai_challenge' && challengeStarted && challengeQuestions.length > 0) {
      return { index: challengeIndex, length: challengeQuestions.length };
    }
    if (localGameType === 'verb_mastery' && verbMasteryStarted && verbMasteryQuestions.length > 0) {
      return { index: verbMasteryIndex, length: verbMasteryQuestions.length };
    }
    if (localGameType === 'quick_fire' && quickFireStarted && quickFireWords.length > 0) {
      return { index: quickFireIndex, length: quickFireWords.length };
    }
    if (mode === 'type_it' && typeItQuestions.length > 0) {
      return { index: currentIndex, length: typeItQuestions.length };
    }
    return { index: currentIndex, length: deck.length || 1 };
  };
  const { index: displayIndex, length: currentDeckLength } = getCurrentStats();
  const progress = ((displayIndex + 1) / currentDeckLength) * 100;
  const pendingCount = pendingChallenges.length + pendingWordRequests.length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Streak Celebration Modal */}
      <StreakCelebrationModal
        show={showStreakCelebration}
        word={deck[currentIndex]?.word}
      />

      {/* Offline Indicator */}
      {!isOnline && (
        <div className="shrink-0 px-4 pt-4">
          <OfflineIndicator
            isOnline={isOnline}
            cachedWordCount={cachedWordCount}
            lastSyncTime={lastSyncTime}
          />
        </div>
      )}

      {/* Header: Two Tabs - Fixed at top */}
      <div className="shrink-0 p-2 md:p-4 pb-1 md:pb-2">
        <div className="w-full max-w-lg mx-auto">
          {/* Two-Tab Layout: Local Games | Love Notes */}
          {!localGameType && (
            <>
              <h1 className="text-scale-heading md:text-2xl font-black text-[var(--text-primary)] mb-2 md:mb-3 text-center">{t('play.title')}</h1>
              <div className="inline-flex w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-0.5 md:p-1 rounded-lg md:rounded-xl mb-2 md:mb-3">
                <button
                  onClick={() => setMainTab('local_games')}
                  className={`flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-scale-label font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    mainTab === 'local_games'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent-color)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Play className="w-3.5 h-3.5 md:w-4 md:h-4" />
                  {t('play.tabs.games')}
                </button>
                <button
                  onClick={() => setMainTab('love_notes')}
                  className={`relative flex-1 px-2 md:px-4 py-1.5 md:py-2 rounded-md md:rounded-lg text-scale-label font-bold transition-all flex items-center justify-center gap-1.5 md:gap-2 ${
                    mainTab === 'love_notes'
                      ? 'bg-[var(--accent-color)] text-white shadow-sm'
                      : pendingCount > 0
                        ? 'text-[var(--accent-color)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Heart className={`w-3.5 h-3.5 md:w-4 md:h-4 ${mainTab === 'love_notes' ? 'fill-white' : pendingCount > 0 ? 'fill-[var(--accent-color)]' : ''}`} />
                  {t('play.tabs.loveNotes')}
                  {pendingCount > 0 && mainTab !== 'love_notes' && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 md:w-5 md:h-5 bg-[var(--accent-color)] text-white text-[8px] md:text-[10px] flex items-center justify-center rounded-full font-bold animate-bounce">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-scale-micro md:text-scale-caption text-center hidden md:block">
                {mainTab === 'local_games'
                  ? t('play.tabs.gamesDesc')
                  : t('play.tabs.loveNotesDesc', { partner: partnerName || t('play.session.yourPartner') })}
              </p>
            </>
          )}

          {/* Session Stats - Show only when a game is active */}
          {localGameType && (
            <>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={handleExitRequest}
                  className="p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
                >
                  <ICONS.ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.correct}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-scale-caption font-bold text-[var(--text-secondary)]">{sessionScore.incorrect}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {displayIndex + 1} / {currentDeckLength}
                </span>
              </div>

              {/* Progress Bar */}
              <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
                <div
                  className="h-full transition-all duration-500 rounded-full"
                  style={{ width: `${progress}%`, backgroundColor: tierColor }}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Content Area - Scrollable */}
      <div className="flex-1 overflow-y-auto p-4 pt-2">
        <div className="w-full max-w-lg mx-auto flex items-start justify-center min-h-full">
          <div className="w-full">

          {/* Game Card Grid - Show when in local_games tab and no game active */}
          {mainTab === 'local_games' && !localGameType && (
            <div className="grid grid-cols-2 md:grid-cols-2 gap-2 md:gap-4 mt-3 md:mt-4">
              {/* Flashcards */}
              <button
                onClick={() => startLocalGame('flashcards')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-[var(--accent-light)] rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🎴
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.flashcards')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.flashcardsDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Multiple Choice */}
              <button
                onClick={() => startLocalGame('multiple_choice')}
                disabled={deck.length < 4}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🔘
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.multiChoice')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.multiChoiceDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Type It */}
              <button
                onClick={() => startLocalGame('type_it')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-blue-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    ⌨️
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.typeIt')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.typeItDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Quick Fire */}
              <button
                onClick={() => startLocalGame('quick_fire')}
                disabled={deck.length < 5}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-amber-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.quickFire')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.quickFireDesc')}</p>
                  </div>
                </div>
              </button>

              {/* AI Challenge */}
              <button
                onClick={() => startLocalGame('ai_challenge')}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-green-500/30 transition-all text-left"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-green-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.aiChallenge')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.aiChallengeDesc')}</p>
                  </div>
                </div>
              </button>

              {/* Conversation Practice */}
              <button
                onClick={() => setShowConversationPractice(true)}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left relative"
              >
                <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 px-1.5 md:px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[7px] md:text-[9px] font-black uppercase tracking-wider rounded-full">
                  {t('play.beta')}
                </div>
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-purple-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🎙️
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.conversation')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">{t('play.games.conversationDesc', { language: targetName })}</p>
                  </div>
                </div>
              </button>

              {/* Verb Mastery */}
              <button
                onClick={() => startLocalGame('verb_mastery')}
                disabled={verbsWithConjugations.length === 0}
                className="group p-3 md:p-6 bg-[var(--bg-card)] rounded-xl md:rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all text-left relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
                  <div className="w-10 h-10 md:w-14 md:h-14 bg-orange-500/20 rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform">
                    🔄
                  </div>
                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-scale-label md:text-scale-body font-black text-[var(--text-primary)] mb-0.5 md:mb-1">{t('play.games.verbMastery')}</h3>
                    <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">
                      {verbsWithConjugations.length > 0
                        ? t('play.games.verbMasteryVerbs', { count: verbsWithConjugations.length })
                        : t('play.games.learnVerbsFirst')}
                    </p>
                  </div>
                </div>
              </button>
            </div>
          )}

          {/* Flashcards Mode - Using extracted component */}
          {localGameType === 'flashcards' && deck[currentIndex] && (
            <Flashcards
              words={deck}
              scoresMap={scoresMap}
              currentIndex={currentIndex}
              accentColor={tierColor}
              targetLanguageName={targetName}
              nativeLanguageName={nativeName}
              currentWordStreak={currentWordStreak}
              onAnswer={handleGameAnswer}
              onNext={handleGameNext}
              onComplete={createGameCompleteHandler('flashcards')}
            />
          )}

          {/* Multiple Choice Mode - Using extracted component */}
          {localGameType === 'multiple_choice' && deck[currentIndex] && (
            <MultipleChoice
              words={deck}
              scoresMap={scoresMap}
              currentIndex={currentIndex}
              accentColor={tierColor}
              targetLanguageName={targetName}
              nativeLanguageName={nativeName}
              currentWordStreak={currentWordStreak}
              showIncorrectShake={showIncorrectShake}
              onAnswer={handleGameAnswer}
              onNext={handleGameNext}
              onComplete={createGameCompleteHandler('multiple_choice')}
            />
          )}

          {/* Type It Mode */}
          {localGameType === 'type_it' && typeItQuestions.length > 0 && (
            <div className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${showIncorrectShake ? 'animate-shake' : ''}`}>
              {(() => {
                const question = typeItQuestions[currentIndex];
                const isTargetToNative = question.direction === 'target_to_native';
                const prompt = isTargetToNative ? question.word.word : question.word.translation;
                const correctAnswer = isTargetToNative ? question.word.translation : question.word.word;

                return (
                  <>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
                      style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                    >
                      {isTargetToNative
                        ? t('play.directions.targetToNative', { target: targetName, native: nativeName })
                        : t('play.directions.nativeToTarget', { native: nativeName, target: targetName })}
                    </span>

                    <div className="text-center mb-2">
                      <h3 className="text-3xl font-black text-[var(--text-primary)]">
                        {prompt}
                      </h3>
                      {currentWordStreak > 0 && (
                        <div className="mt-2">
                          <StreakIndicator streak={currentWordStreak} />
                        </div>
                      )}
                    </div>

                    {showHint && !typeItSubmitted && (
                      <p className="text-center text-[var(--text-secondary)] text-scale-label mb-4">
                        {t('play.typeIt.hint')} {getHint()}
                      </p>
                    )}

                    {typeItSubmitted && (
                      <div className={`text-center mb-4 p-3 rounded-xl ${
                        typeItCorrect ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {typeItCorrect ? (
                          <div>
                            <div className="flex items-center justify-center gap-2">
                              <ICONS.Check className="w-5 h-5" />
                              <span className="font-bold">{t('play.typeIt.correct')}</span>
                            </div>
                            {typeItExplanation && typeItExplanation !== 'Exact match' && (
                              <p className="text-scale-label mt-1 opacity-80">{typeItExplanation}</p>
                            )}
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ICONS.X className="w-5 h-5" />
                              <span className="font-bold">{t('play.typeIt.notQuite')}</span>
                            </div>
                            <p className="text-scale-label">
                              {t('play.typeIt.correctAnswer')} <span className="font-black">{correctAnswer}</span>
                            </p>
                            {typeItExplanation && typeItExplanation !== 'No match' && (
                              <p className="text-scale-label mt-1 opacity-80">{typeItExplanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    <div className="mt-6">
                      <input
                        type="text"
                        value={typeItAnswer}
                        onChange={(e) => setTypeItAnswer(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleTypeItSubmit()}
                        placeholder={isTargetToNative
                          ? t('play.typeIt.typeIn', { language: nativeName })
                          : t('play.typeIt.typeIn', { language: targetName })}
                        disabled={typeItSubmitted}
                        className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      {!typeItSubmitted && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="px-4 py-3 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] text-scale-label"
                          disabled={showHint}
                        >
                          {showHint ? t('play.typeIt.hintShown') : t('play.typeIt.showHint')}
                        </button>
                      )}
                      <button
                        onClick={handleTypeItSubmit}
                        disabled={!typeItAnswer.trim() && !typeItSubmitted}
                        className="flex-1 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50 transition-all"
                        style={{ backgroundColor: tierColor }}
                      >
                        {typeItSubmitted ? t('play.typeIt.next') : t('play.typeIt.check')}
                      </button>
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {/* AI Challenge Mode */}
          {localGameType === 'ai_challenge' && !challengeStarted && (
            <div className="w-full">
              <h2 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-4">{t('play.aiChallenge.chooseMode')}</h2>

              {/* Side-by-side layout: Modes on left, Session Length on right */}
              <div className="flex gap-4">
                {/* Mode Selection */}
                <div className="flex-1 space-y-2">
                  {challengeModes.map(cm => {
                    const count = modeCounts[cm.id];
                    const isDisabled = count === 0;
                    const isSelected = selectedChallengeMode === cm.id;
                    const IconComp = ICONS[cm.icon];
                    return (
                      <button
                        key={cm.id}
                        onClick={() => !isDisabled && setSelectedChallengeMode(cm.id)}
                        disabled={isDisabled}
                        className={`w-full p-3 rounded-2xl text-left transition-all border-2 flex items-center gap-3 ${
                          isSelected ? 'border-[var(--accent-color)] bg-[var(--accent-light)] dark:bg-[var(--accent-light)]' : isDisabled ? 'border-[var(--border-color)] bg-[var(--bg-primary)] opacity-50 cursor-not-allowed' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-secondary)]'
                        }`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isSelected ? 'bg-[var(--accent-light)] dark:bg-[var(--accent-light)]' : 'bg-[var(--bg-primary)]'}`}>
                          <IconComp className={`w-5 h-5 ${isSelected ? 'text-[var(--accent-color)]' : 'text-[var(--text-secondary)]'}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`font-bold text-scale-label truncate ${isSelected ? 'text-[var(--accent-color)] dark:text-[var(--accent-color)]' : 'text-[var(--text-primary)]'}`}>{cm.name}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-[var(--accent-light)] dark:bg-[var(--accent-light)] text-[var(--accent-text)] dark:text-[var(--accent-color)] opacity-60' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>{count}</span>
                          </div>
                          <p className="text-scale-caption text-[var(--text-secondary)] truncate">{cm.description}</p>
                        </div>
                        {isSelected && <ICONS.Check className="w-4 h-4 text-[var(--accent-color)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Session Length - appears to the right when mode selected */}
                {selectedChallengeMode && (
                  <div className="w-32 shrink-0 flex flex-col">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-2">{t('play.aiChallenge.length')}</h3>
                    <div className="flex-1 flex flex-col gap-2">
                      {([10, 20, 'all'] as SessionLength[]).map(len => {
                        const maxAvailable = modeCounts[selectedChallengeMode];
                        const actualCount = len === 'all' ? maxAvailable : Math.min(len as number, maxAvailable);
                        return (
                          <button
                            key={len}
                            onClick={() => setSessionLength(len)}
                            className={`flex-1 p-2 rounded-xl text-center transition-all border-2 ${sessionLength === len ? 'border-[var(--accent-color)] bg-[var(--accent-light)] dark:bg-[var(--accent-light)]' : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--text-secondary)]'}`}
                          >
                            <div className={`text-scale-heading font-black ${sessionLength === len ? 'text-[var(--accent-color)] dark:text-[var(--accent-color)]' : 'text-[var(--text-primary)]'}`}>{actualCount}</div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{len === 'all' ? t('play.aiChallenge.all') : t('play.aiChallenge.qs')}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedChallengeMode && sessionLength && (
                loadingPhrases ? (
                  <div className="text-center py-4 mt-4">
                    <div className="animate-spin w-6 h-6 border-2 border-pink-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-scale-label text-[var(--text-secondary)]">{t('play.aiChallenge.generatingPhrases')}</p>
                  </div>
                ) : (
                  <button onClick={startChallenge} className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-scale-label mt-4" style={{ backgroundColor: tierColor }}>
                    {t('play.aiChallenge.startChallenge')}
                  </button>
                )
              )}
            </div>
          )}

          {/* Quick Fire Mode */}
          {localGameType === 'quick_fire' && !quickFireStarted && (
            <div className="w-full text-center">
              <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-lg border border-[var(--border-color)] max-w-md mx-auto">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">{t('play.quickFire.title')}</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  {t('play.quickFire.description')}
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl mb-6">
                  <p className="text-scale-heading font-bold text-amber-600 dark:text-amber-400">
                    🔥 {t('play.quickFire.wordsAvailable', { count: deck.length })}
                  </p>
                  <p className="text-scale-label text-[var(--text-secondary)] mt-1">
                    {t('play.quickFire.upTo20')}
                  </p>
                </div>
                <button
                  onClick={startQuickFire}
                  disabled={deck.length < 5}
                  className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-scale-label bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {t('play.quickFire.start')}
                </button>
                {deck.length < 5 && (
                  <p className="text-scale-label text-red-500 mt-3">{t('play.quickFire.needAtLeast5')}</p>
                )}
              </div>
            </div>
          )}

          {localGameType === 'quick_fire' && quickFireStarted && !finished && (
            <div className={`w-full max-w-md mx-auto transition-colors duration-200 ${
              quickFireShowFeedback === 'correct' ? 'bg-green-500/20 rounded-3xl' :
              quickFireShowFeedback === 'wrong' ? 'bg-red-500/20 rounded-3xl' : ''
            }`}>
              {/* Timer Bar */}
              <div className="h-3 bg-[var(--border-color)] rounded-full mb-4 overflow-hidden">
                <div
                  className={`h-full transition-all duration-1000 ${
                    quickFireTimeLeft > 30 ? 'bg-amber-500' :
                    quickFireTimeLeft > 15 ? 'bg-orange-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${(quickFireTimeLeft / 60) * 100}%` }}
                />
              </div>

              {/* Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                  {quickFireIndex + 1} / {quickFireWords.length}
                </span>
                <span className={`text-3xl font-black ${
                  quickFireTimeLeft > 10 ? 'text-amber-500' : 'text-red-500 animate-pulse'
                }`}>
                  {quickFireTimeLeft}s
                </span>
              </div>

              {/* Word */}
              <div className="bg-amber-50 dark:bg-amber-900/30 p-8 rounded-2xl mb-6 text-center">
                <p className="text-4xl font-black text-amber-600 dark:text-amber-400">
                  {quickFireWords[quickFireIndex]?.word}
                </p>
              </div>

              {/* Input */}
              <input
                type="text"
                value={quickFireInput}
                onChange={e => setQuickFireInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleQuickFireAnswer()}
                placeholder={t('play.quickFire.typeTranslation')}
                autoFocus
                className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
              />

              {/* Progress */}
              <div className="mt-4 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-300"
                  style={{ width: `${((quickFireIndex + 1) / quickFireWords.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Verb Mastery - Tense Selection */}
          {localGameType === 'verb_mastery' && !verbMasteryStarted && (
            <div className="w-full max-w-md mx-auto">
              <div className="text-center mb-8">
                <div className="w-20 h-20 mx-auto bg-orange-500/20 rounded-2xl flex items-center justify-center text-4xl mb-4">
                  🔄
                </div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">{t('play.verbMastery.title')}</h2>
                <p className="text-[var(--text-secondary)]">
                  {t('play.verbMastery.practiceCount', { count: verbsWithConjugations.length })}
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  {t('play.verbMastery.selectTense')}
                </p>
                {(['present', 'past', 'future'] as VerbTense[]).map(tense => {
                  const verbsWithTense = verbsWithConjugations.filter(v => v.conjugations?.[tense]);
                  const isDisabled = verbsWithTense.length === 0;
                  return (
                    <button
                      key={tense}
                      onClick={() => !isDisabled && startVerbMastery(tense)}
                      disabled={isDisabled}
                      className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                        isDisabled
                          ? 'border-[var(--border-color)] bg-[var(--bg-primary)] opacity-50 cursor-not-allowed'
                          : 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-black text-[var(--text-primary)] capitalize">{t(`play.verbMastery.${tense}Tense`)}</h3>
                          <p className="text-scale-label text-[var(--text-secondary)]">
                            {isDisabled
                              ? t('play.verbMastery.noVerbsWithTense')
                              : t('play.verbMastery.verbsAvailable', { count: verbsWithTense.length })}
                          </p>
                        </div>
                        {!isDisabled && (
                          <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
                            <ICONS.Play className="w-5 h-5 text-orange-500" />
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={exitLocalGame}
                className="w-full p-3 text-[var(--text-secondary)] font-bold text-scale-label hover:text-[var(--text-primary)] transition-colors"
              >
                {t('play.verbMastery.backToGames')}
              </button>
            </div>
          )}

          {/* Verb Mastery - Active Game */}
          {localGameType === 'verb_mastery' && verbMasteryStarted && !finished && verbMasteryQuestions.length > 0 && (
            <div className={`w-full max-w-md mx-auto ${showIncorrectShake ? 'animate-shake' : ''}`}>
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-scale-label font-bold text-[var(--text-secondary)]">
                  {verbMasteryIndex + 1} / {verbMasteryQuestions.length}
                </span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-scale-caption font-black uppercase">
                  {verbMasteryTense} tense
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 mb-6">
                <p className="text-scale-caption font-bold text-orange-500 uppercase tracking-wider mb-2">
                  {t('play.verbMastery.conjugateVerb')}
                </p>
                <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2">
                  {verbMasteryQuestions[verbMasteryIndex]?.infinitive}
                </h3>
                <p className="text-scale-label text-[var(--text-secondary)] italic mb-4">
                  "{verbMasteryQuestions[verbMasteryIndex]?.translation}"
                </p>

                <div className="bg-[var(--bg-card)] p-4 rounded-xl">
                  <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    {t('play.verbMastery.forPronoun')}
                  </p>
                  <p className="text-2xl font-black text-orange-500">
                    {VERB_PERSONS.find(p => p.key === verbMasteryQuestions[verbMasteryIndex]?.person)?.label}
                  </p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">
                    ({VERB_PERSONS.find(p => p.key === verbMasteryQuestions[verbMasteryIndex]?.person)?.nativeLabel})
                  </p>
                </div>
              </div>

              {/* Input */}
              <div className="space-y-4">
                <input
                  type="text"
                  value={verbMasteryInput}
                  onChange={e => setVerbMasteryInput(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      if (verbMasterySubmitted) {
                        handleVerbMasteryNext();
                      } else {
                        handleVerbMasterySubmit();
                      }
                    }
                  }}
                  placeholder={t('play.verbMastery.typeConjugation')}
                  autoFocus
                  disabled={verbMasterySubmitted}
                  className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-orange-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] disabled:opacity-50"
                />

                {/* Feedback */}
                {verbMasterySubmitted && (
                  <div className={`p-4 rounded-xl ${verbMasteryCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {verbMasteryCorrect ? (
                      <div className="text-center">
                        <p className="text-green-600 dark:text-green-400 font-bold">
                          ✓ {t('play.typeIt.correct')}
                        </p>
                        {verbMasteryExplanation && (
                          <p className="text-scale-label text-green-600/80 dark:text-green-400/80 mt-1">
                            {verbMasteryExplanation}
                          </p>
                        )}
                      </div>
                    ) : (
                      <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 font-bold mb-1">✗ {t('play.typeIt.notQuite')}</p>
                        <p className="text-[var(--text-primary)]">
                          {t('play.typeIt.correctAnswer')} <span className="font-black">{verbMasteryQuestions[verbMasteryIndex]?.correctAnswer}</span>
                        </p>
                        {verbMasteryExplanation && (
                          <p className="text-scale-label text-red-600/80 dark:text-red-400/80 mt-1">
                            {verbMasteryExplanation}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Button */}
                <button
                  onClick={verbMasterySubmitted ? handleVerbMasteryNext : handleVerbMasterySubmit}
                  disabled={!verbMasteryInput.trim() && !verbMasterySubmitted}
                  className="w-full p-4 rounded-xl font-black text-white transition-all disabled:opacity-50"
                  style={{ backgroundColor: verbMasterySubmitted ? (verbMasteryIndex < verbMasteryQuestions.length - 1 ? '#f97316' : '#22c55e') : '#f97316' }}
                >
                  {verbMasterySubmitted
                    ? (verbMasteryIndex < verbMasteryQuestions.length - 1 ? t('play.verbMastery.nextQuestion') : t('play.verbMastery.seeResults'))
                    : t('play.verbMastery.checkAnswer')}
                </button>
              </div>

              {/* Progress Bar */}
              <div className="mt-6 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 transition-all duration-300"
                  style={{ width: `${((verbMasteryIndex + 1) / verbMasteryQuestions.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Love Notes Tab - Partner Challenges & Word Gifts */}
          {mainTab === 'love_notes' && !localGameType && (
            <div className="w-full space-y-4">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-[var(--accent-light)] rounded-full flex items-center justify-center text-3xl mx-auto mb-3 animate-pulse">
                  💌
                </div>
                <h2 className="text-scale-heading font-black text-[var(--text-primary)]">{t('play.loveNotes.title', { partner: partnerName })}</h2>
                <p className="text-scale-label text-[var(--text-secondary)]">{t('play.loveNotes.subtitle')}</p>
              </div>

              {/* Empty State */}
              {pendingChallenges.length === 0 && pendingWordRequests.length === 0 && (
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border border-[var(--border-color)] text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-scale-heading font-bold text-[var(--text-primary)] mb-2">{t('play.loveNotes.empty')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('play.loveNotes.emptyDesc', { partner: partnerName })}</p>
                </div>
              )}

              {/* Pending Challenges */}
              {pendingChallenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Zap className="w-3.5 h-3.5" /> {t('play.loveNotes.challenges')}
                  </h3>
                  {pendingChallenges.map(challenge => (
                    <button
                      key={challenge.id}
                      onClick={() => setActiveChallenge(challenge)}
                      className="w-full bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)] hover:border-[var(--accent-border)] dark:hover:border-[var(--accent-border)] hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                          {challenge.challenge_type === 'quiz' ? '🎯' : '⚡'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {challenge.title || (challenge.challenge_type === 'quiz' ? t('play.loveNotes.quizChallenge') : t('play.loveNotes.quickFire'))}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {t('play.loveNotes.words', { count: challenge.words_data?.length || 0 })}
                            </span>
                          </div>
                          <p className="text-scale-caption text-[var(--text-secondary)]">
                            {t('play.loveNotes.from', { partner: partnerName })} · {new Date(challenge.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ICONS.ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-[var(--accent-color)] group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Pending Word Gifts */}
              {pendingWordRequests.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-scale-caption font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Heart className="w-3.5 h-3.5 fill-[var(--text-secondary)]" /> {t('play.loveNotes.wordGifts')}
                  </h3>
                  {pendingWordRequests.map(request => (
                    <button
                      key={request.id}
                      onClick={() => setActiveWordRequest(request)}
                      className="w-full bg-[var(--bg-card)] rounded-2xl p-4 shadow-sm border border-[var(--border-color)] hover:border-amber-200 dark:hover:border-amber-700 hover:shadow-md transition-all text-left group"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-[var(--accent-light)] rounded-xl flex items-center justify-center text-xl shrink-0 group-hover:scale-110 transition-transform">
                          🎁
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-[var(--text-primary)] truncate">
                              {request.request_type === 'ai_topic' ? request.input_text : t('play.loveNotes.wordGift')}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                              {t('play.loveNotes.words', { count: request.selected_words?.length || 0 })}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {request.xp_multiplier}x XP
                            </span>
                          </div>
                          <p className="text-scale-caption text-[var(--text-secondary)]">
                            {t('play.loveNotes.from', { partner: partnerName })} · {new Date(request.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <ICONS.ChevronRight className="w-5 h-5 text-[var(--text-secondary)] group-hover:text-amber-400 group-hover:translate-x-1 transition-all" />
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Practice Other Modes Prompt */}
              {pendingChallenges.length === 0 && pendingWordRequests.length === 0 && (
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => { setMainTab('local_games'); }}
                    className="flex-1 py-3 rounded-xl font-bold text-scale-label text-white transition-colors"
                    style={{ backgroundColor: tierColor }}
                  >
                    {t('play.loveNotes.goToGames')}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* AI Challenge - Active */}
          {localGameType === 'ai_challenge' && challengeStarted && challengeQuestions.length > 0 && (
            <>
              {(() => {
                const q = challengeQuestions[challengeIndex];
                return (
                  <div className="w-full">
                    {/* Flashcard question */}
                    {q.type === 'flashcard' && (
                      <div onClick={() => setChallengeFlipped(!challengeFlipped)} className="relative w-full aspect-[4/5] cursor-pointer perspective-1000">
                        <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${challengeFlipped ? 'rotate-y-180' : ''}`}>
                          <div className="absolute inset-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
                            <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-8">POLISH</span>
                            <h3 className="text-4xl font-black text-[var(--text-primary)]">{q.word}</h3>
                            <p className="mt-12 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">Tap to reveal</p>
                          </div>
                          <div className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180" style={{ backgroundColor: tierColor }}>
                            <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">ENGLISH</span>
                            <h3 className="text-4xl font-black">{q.translation}</h3>
                            <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                              <button onClick={(e) => { e.stopPropagation(); handleChallengeFlashcardResponse(false); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-scale-caption font-black uppercase tracking-widest"><ICONS.X className="w-4 h-4" /> Hard</button>
                              <button onClick={(e) => { e.stopPropagation(); handleChallengeFlashcardResponse(true); }} className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-scale-caption" style={{ color: tierColor }}><ICONS.Check className="w-4 h-4" /> Got it!</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice question */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${showIncorrectShake ? 'animate-shake' : ''}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6" style={{ backgroundColor: `${tierColor}15`, color: tierColor }}>{targetName} → {nativeName}</span>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">{q.word}</h3>
                        <div className="space-y-3">
                          {q.options.map((opt, idx) => {
                            const isCorrect = opt === q.translation;
                            const isSelected = challengeMcSelected === opt;
                            let style = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                            if (challengeMcFeedback) {
                              if (isCorrect) style = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                              else if (isSelected) style = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                              else style = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                            }
                            return (
                              <button key={idx} onClick={() => handleChallengeMcSelect(opt)} disabled={challengeMcFeedback} className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${style}`}>
                                <span className="text-scale-caption font-bold text-[var(--text-secondary)] mr-3">{String.fromCharCode(65 + idx)}</span>{opt}
                                {challengeMcFeedback && isCorrect && <ICONS.Check className="w-5 h-5 float-right text-green-500" />}
                                {challengeMcFeedback && isSelected && !isCorrect && <ICONS.X className="w-5 h-5 float-right text-red-500" />}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Type It question */}
                    {q.type === 'type_it' && (
                      <div className={`bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)] ${showIncorrectShake ? 'animate-shake' : ''}`}>
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6" style={{ backgroundColor: `${tierColor}15`, color: tierColor }}>{targetName} → {nativeName}</span>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">{q.word}</h3>
                        {challengeTypeSubmitted && (
                          <div className={`text-center mb-4 p-3 rounded-xl ${challengeTypeCorrect ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {challengeTypeCorrect ? (
                              <div>
                                <div className="flex items-center justify-center gap-2"><ICONS.Check className="w-5 h-5" /><span className="font-bold">{t('play.typeIt.correct')}</span></div>
                                {challengeTypeExplanation && challengeTypeExplanation !== 'Exact match' && (
                                  <p className="text-scale-label mt-1 opacity-80">{challengeTypeExplanation}</p>
                                )}
                              </div>
                            ) : (
                              <div>
                                <div className="flex items-center justify-center gap-2 mb-1"><ICONS.X className="w-5 h-5" /><span className="font-bold">{t('play.typeIt.notQuite')}</span></div>
                                <p className="text-scale-label">{t('play.typeIt.correctAnswer')} <span className="font-black">{q.translation}</span></p>
                                {challengeTypeExplanation && challengeTypeExplanation !== 'No match' && (
                                  <p className="text-scale-label mt-1 opacity-80">{challengeTypeExplanation}</p>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <input type="text" value={challengeTypeAnswer} onChange={(e) => setChallengeTypeAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChallengeTypeSubmit()} placeholder={t('play.typeIt.typeIn', { language: nativeName })} disabled={challengeTypeSubmitted} className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-scale-heading font-medium text-center mt-4 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" autoFocus />
                        <button onClick={handleChallengeTypeSubmit} disabled={!challengeTypeAnswer.trim() && !challengeTypeSubmitted} className="w-full mt-4 py-4 rounded-2xl font-black text-white text-scale-label uppercase tracking-widest disabled:opacity-50" style={{ backgroundColor: tierColor }}>{challengeTypeSubmitted ? t('play.typeIt.next') : t('play.typeIt.check')}</button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </>
          )}

          </div>
        </div>
      </div>

      {/* Challenge Modal */}
      {activeChallenge && (
        activeChallenge.challenge_type === 'quiz' ? (
          <PlayQuizChallenge
            challenge={activeChallenge}
            partnerName={partnerName}
            onComplete={handleChallengeComplete}
            onClose={() => setActiveChallenge(null)}
            smartValidation={profile.smart_validation}
          />
        ) : (
          <PlayQuickFireChallenge
            challenge={activeChallenge}
            partnerName={partnerName}
            onComplete={handleChallengeComplete}
            onClose={() => setActiveChallenge(null)}
            smartValidation={profile.smart_validation}
          />
        )
      )}

      {/* Word Gift Modal */}
      {activeWordRequest && (
        <WordGiftLearning
          wordRequest={activeWordRequest}
          partnerName={partnerName}
          onComplete={handleWordRequestComplete}
          onClose={() => setActiveWordRequest(null)}
        />
      )}

      {/* Conversation Practice Modal */}
      {showConversationPractice && (
        <ConversationPractice
          userName={profile.full_name || 'Friend'}
          onClose={() => setShowConversationPractice(false)}
        />
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[var(--bg-card)] rounded-2xl shadow-xl max-w-sm w-full p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-4xl">
                ⚠️
              </div>
              <h3 className="text-xl font-black text-[var(--text-primary)] mb-2">
                {t('play.exitConfirm.title', 'Exit Game?')}
              </h3>
              <p className="text-[var(--text-secondary)] mb-6">
                {t('play.exitConfirm.message', 'Your progress in this session will be lost. Are you sure you want to exit?')}
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowExitConfirm(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] border border-[var(--border-color)] hover:bg-[var(--bg-card)] transition-colors"
                >
                  {t('play.exitConfirm.cancel', 'Keep Playing')}
                </button>
                <button
                  onClick={exitLocalGame}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors"
                >
                  {t('play.exitConfirm.confirm', 'Exit')}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Rate Limit Modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => setShowLimitModal(false)}
        limitType="validation"
        onContinueBasic={() => setUseBasicValidation(true)}
      />

      <style>{`
        .perspective-1000 { perspective: 1000px; }
        .transform-style-3d { transform-style: preserve-3d; }
        .backface-hidden { backface-visibility: hidden; }
        .rotate-y-180 { transform: rotateY(180deg); }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(255, 71, 97, 0.4); }
          50% { box-shadow: 0 0 0 3px rgba(255, 71, 97, 0.2); }
        }
        .animate-pulse-border { animation: pulse-border 2s ease-in-out infinite; }
      `}</style>
    </div>
  );
};

export default FlashcardGame;
