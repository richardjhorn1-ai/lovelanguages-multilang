
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { supabase } from '../services/supabase';
import { Profile, DictionaryEntry, WordScore, AIChallengeMode, RomanticPhrase, TutorChallenge, WordRequest } from '../types';
import { getLevelFromXP, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';
import { shuffleArray } from '../utils/array';
import { ROMANTIC_PHRASES, getRandomPhrases } from '../constants/romantic-phrases';
import { useTheme } from '../context/ThemeContext';
import TutorGames from './TutorGames';
import PlayQuizChallenge from './PlayQuizChallenge';
import GameResults from './games/GameResults';
import PlayQuickFireChallenge from './PlayQuickFireChallenge';
import WordGiftLearning from './WordGiftLearning';
import ConversationPractice from './ConversationPractice';

interface FlashcardGameProps { profile: Profile; }

type PracticeMode = 'love_notes' | 'flashcards' | 'multiple_choice' | 'type_it' | 'ai_challenge' | 'quick_fire';
type MainTab = 'local_games' | 'love_notes';
type LocalGameType = 'flashcards' | 'multiple_choice' | 'type_it' | 'quick_fire' | 'ai_challenge' | 'verb_mastery' | null;
type TypeItDirection = 'polish_to_english' | 'english_to_polish';
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

const VERB_PERSONS: { key: VerbPerson; label: string; english: string }[] = [
  { key: 'ja', label: 'ja', english: 'I' },
  { key: 'ty', label: 'ty', english: 'you (singular)' },
  { key: 'onOna', label: 'on/ona', english: 'he/she' },
  { key: 'my', label: 'my', english: 'we' },
  { key: 'wy', label: 'wy', english: 'you (plural)' },
  { key: 'oni', label: 'oni', english: 'they' }
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
}

interface ChallengeQuestion {
  id: string;
  type: ChallengeQuestionType;
  polish: string;
  english: string;
  wordId?: string;
  phraseId?: string;
  options?: string[];
}

const CHALLENGE_MODES: { id: AIChallengeMode; name: string; description: string; icon: keyof typeof ICONS }[] = [
  { id: 'weakest', name: 'Weakest Words', description: 'Focus on words you struggle with', icon: 'Target' },
  { id: 'gauntlet', name: 'Mixed Gauntlet', description: 'Random mix of all types', icon: 'Shuffle' },
  { id: 'romantic', name: 'Romantic Phrases', description: 'Sweet Polish expressions', icon: 'Heart' },
  { id: 'least_practiced', name: 'Least Practiced', description: 'Words you haven\'t seen lately', icon: 'Clock' },
  { id: 'review_mastered', name: 'Review Mastered', description: 'Practice learned words', icon: 'Trophy' }
];

const STREAK_TO_LEARN = 5; // Number of consecutive correct answers to mark as learned

// Lenient answer matching
function isCorrectAnswer(userAnswer: string, correctAnswer: string): boolean {
  const normalize = (s: string) => s
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, ''); // Remove diacritics

  return normalize(userAnswer) === normalize(correctAnswer);
}

const FlashcardGame: React.FC<FlashcardGameProps> = ({ profile }) => {
  const [deck, setDeck] = useState<DictionaryEntry[]>([]);
  const [scores, setScores] = useState<WordScore[]>([]);
  const [scoresMap, setScoresMap] = useState<Map<string, WordScore>>(new Map());
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Love Notes (partner challenges) state
  const [pendingChallenges, setPendingChallenges] = useState<TutorChallenge[]>([]);
  const [pendingWordRequests, setPendingWordRequests] = useState<WordRequest[]>([]);
  const [partnerName, setPartnerName] = useState('Your Partner');
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

  // Quick Fire state
  const [quickFireWords, setQuickFireWords] = useState<DictionaryEntry[]>([]);
  const [quickFireIndex, setQuickFireIndex] = useState(0);
  const [quickFireInput, setQuickFireInput] = useState('');
  const [quickFireTimeLeft, setQuickFireTimeLeft] = useState(60);
  const [quickFireStarted, setQuickFireStarted] = useState(false);
  const [quickFireShowFeedback, setQuickFireShowFeedback] = useState<'correct' | 'wrong' | null>(null);
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

  // Level styling
  const levelInfo = useMemo(() => getLevelFromXP(profile.xp || 0), [profile.xp]);
  const tierColor = useMemo(() => getTierColor(levelInfo.tier), [levelInfo.tier]);

  // Theme
  const { accentHex } = useTheme();

  // Tutor dashboard data (computed unconditionally to follow Rules of Hooks)
  const masteredWords = useMemo(() =>
    deck.filter(w => scoresMap.get(w.id)?.learned_at != null),
    [deck, scoresMap]
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
    const hasLove = deck.some(w => w.word.includes('koch') || w.translation.toLowerCase().includes('love'));
    if (hasLove) {
      phrases.push({
        polish: 'Kocham cię bardzo',
        english: 'I love you very much',
        tip: 'Whisper this before bed'
      });
    }
    return phrases.slice(0, 3);
  }, [masteredWords, deck]);

  const recentWords = useMemo(() => {
    return [...deck]
      .sort((a, b) => new Date(b.unlocked_at).getTime() - new Date(a.unlocked_at).getTime())
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
  }, [profile]);

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

    const { data: dictData } = await supabase
      .from('dictionary')
      .select('*')
      .eq('user_id', targetUserId);

    if (dictData) setDeck(shuffleArray(dictData));

    const { data: scoreData } = await supabase
      .from('scores')
      .select('*, dictionary:word_id(word, translation)')
      .eq('user_id', targetUserId);

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
        body: JSON.stringify({ status: 'pending', role: 'student' })
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
        body: JSON.stringify({ status: 'pending', role: 'student' })
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
    await supabase.from('scores').upsert(scoreUpdate, {
      onConflict: 'user_id,word_id'
    });

    // Update local state
    setScoresMap(prev => {
      const newMap = new Map(prev);
      newMap.set(wordId, scoreUpdate as WordScore);
      return newMap;
    });

    return { justLearned, newStreak };
  };

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
          answers
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
      romantic: ROMANTIC_PHRASES.length,
      least_practiced: unlearnedWords.length,
      review_mastered: learnedWords.length
    };
  }, [deck, scoresMap]);

  // Generate AI Challenge questions
  const generateChallengeQuestions = (challengeMode: AIChallengeMode, length: SessionLength) => {
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
        const difficulty = levelInfo.tier === 'Beginner' ? 'beginner' : levelInfo.tier === 'Elementary' || levelInfo.tier === 'Conversational' ? 'intermediate' : 'advanced';
        phrasePool = getRandomPhrases(length === 'all' ? ROMANTIC_PHRASES.length : length as number, difficulty);
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
        generated.push({ id: `q-${idx}`, type: 'type_it', polish: phrase.polish, english: phrase.english, phraseId: phrase.id });
      });
    } else {
      wordPool.slice(0, count).forEach((word, idx) => {
        let qType: ChallengeQuestionType = challengeMode === 'gauntlet'
          ? (['flashcard', 'multiple_choice', 'type_it'] as ChallengeQuestionType[])[Math.floor(Math.random() * 3)]
          : Math.random() > 0.6 ? 'type_it' : 'multiple_choice';
        const q: ChallengeQuestion = { id: `q-${idx}`, type: qType, polish: word.word, english: word.translation, wordId: word.id };
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

  const startChallenge = () => {
    if (!selectedChallengeMode || !sessionLength) return;
    generateChallengeQuestions(selectedChallengeMode, sessionLength);
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
  };

  const handleChallengeFlashcardResponse = async (isCorrect: boolean) => {
    const q = challengeQuestions[challengeIndex];

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.polish,
      correctAnswer: q.english,
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
    const correct = option === q.english;

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.polish,
      correctAnswer: q.english,
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
    const correct = isCorrectAnswer(challengeTypeAnswer, q.english);

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: q.wordId,
      wordText: q.polish,
      correctAnswer: q.english,
      userAnswer: challengeTypeAnswer,
      questionType: 'type_it',
      isCorrect: correct
    };
    setSessionAnswers(prev => [...prev, answer]);

    setChallengeTypeSubmitted(true);
    setChallengeTypeCorrect(correct);
    setSessionScore(prev => ({ correct: prev.correct + (correct ? 1 : 0), incorrect: prev.incorrect + (correct ? 0 : 1) }));
    if (q.wordId) await updateWordScore(q.wordId, correct);
  };

  const advanceChallengeQuestion = (answers: GameSessionAnswer[], score: { correct: number; incorrect: number }) => {
    if (challengeIndex < challengeQuestions.length - 1) {
      resetChallengeQuestionState();
      setChallengeIndex(c => c + 1);
    } else {
      setFinished(true);
      // Save game session
      saveGameSession('ai_challenge', answers, score.correct, score.incorrect);
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
      direction: Math.random() > 0.5 ? 'polish_to_english' : 'english_to_polish'
    }));
    setTypeItQuestions(shuffleArray(questions));
    setCurrentIndex(0);
    resetTypeItState();
  };

  const resetTypeItState = () => {
    setTypeItAnswer('');
    setTypeItSubmitted(false);
    setTypeItCorrect(false);
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

  // Return to game selection grid
  const exitLocalGame = () => {
    setLocalGameType(null);
    setFinished(false);
    resetChallenge();
    resetQuickFire();
    resetTypeItState();
    resetVerbMastery();
  };

  // Quick Fire functions
  const startQuickFire = () => {
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
    const isCorrect = quickFireInput.toLowerCase().trim() === word.translation.toLowerCase().trim();

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: word.id,
      wordText: word.word,
      correctAnswer: word.translation,
      userAnswer: quickFireInput,
      questionType: 'type_it',
      isCorrect
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);
    // Also update ref for timer callback access
    quickFireAnswersRef.current = newAnswers;

    setQuickFireShowFeedback(isCorrect ? 'correct' : 'wrong');
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

  // Helper to parse context JSON
  const parseContext = (entry: DictionaryEntry) => {
    try {
      return typeof entry.context === 'string' ? JSON.parse(entry.context) : entry.context;
    } catch {
      return null;
    }
  };

  // Verb Mastery functions
  const verbsWithConjugations = useMemo(() => {
    return deck.filter(w => {
      if (w.word_type !== 'verb') return false;
      const ctx = parseContext(w);
      return ctx?.conjugations?.present;
    }).map(w => ({
      ...w,
      conjugations: parseContext(w)?.conjugations
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
      alert('No verbs found with ' + tense + ' tense conjugations. Learn more verbs first!');
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
    const isCorrect = isCorrectAnswer(verbMasteryInput, question.correctAnswer);

    setVerbMasterySubmitted(true);
    setVerbMasteryCorrect(isCorrect);

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
      setVerbMasteryCorrect(false);
    } else {
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

  const handleFlashcardResponse = async (isCorrect: boolean) => {
    const word = deck[currentIndex];

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: word.id,
      wordText: word.word,
      correctAnswer: word.translation,
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

    // Update score with proper streak tracking
    await updateWordScore(word.id, isCorrect);

    if (currentIndex < deck.length - 1) {
      setIsFlipped(false);
      setTimeout(() => setCurrentIndex(c => c + 1), 300);
    } else {
      setFinished(true);
      // Save game session
      saveGameSession('flashcards', newAnswers, newScore.correct, newScore.incorrect);
    }
  };

  const handleMcSelect = async (option: string) => {
    if (mcShowFeedback) return;

    setMcSelected(option);
    setMcShowFeedback(true);

    const currentWord = deck[currentIndex];
    const isCorrect = option === currentWord.translation;

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: currentWord.id,
      wordText: currentWord.word,
      correctAnswer: currentWord.translation,
      userAnswer: option,
      questionType: 'multiple_choice',
      isCorrect
    };
    const newAnswers = [...sessionAnswers, answer];
    setSessionAnswers(newAnswers);

    const newScore = {
      correct: sessionScore.correct + (isCorrect ? 1 : 0),
      incorrect: sessionScore.incorrect + (isCorrect ? 0 : 1)
    };
    setSessionScore(newScore);

    // Update score with proper streak tracking
    await updateWordScore(currentWord.id, isCorrect);

    // Auto-advance after delay
    setTimeout(() => {
      if (currentIndex < deck.length - 1) {
        setCurrentIndex(c => c + 1);
      } else {
        setFinished(true);
        // Save game session
        saveGameSession('multiple_choice', newAnswers, newScore.correct, newScore.incorrect);
      }
    }, isCorrect ? 800 : 1500);
  };

  const handleTypeItSubmit = async () => {
    if (typeItSubmitted) {
      // Move to next question
      if (currentIndex < typeItQuestions.length - 1) {
        setCurrentIndex(c => c + 1);
        resetTypeItState();
      } else {
        setFinished(true);
        // Save game session
        saveGameSession('type_it', sessionAnswers, sessionScore.correct, sessionScore.incorrect);
      }
      return;
    }

    const question = typeItQuestions[currentIndex];
    const correctAnswer = question.direction === 'polish_to_english'
      ? question.word.translation
      : question.word.word;

    const isCorrect = isCorrectAnswer(typeItAnswer, correctAnswer);

    // Record answer
    const answer: GameSessionAnswer = {
      wordId: question.word.id,
      wordText: question.word.word,
      correctAnswer,
      userAnswer: typeItAnswer,
      questionType: 'type_it',
      isCorrect
    };
    setSessionAnswers(prev => [...prev, answer]);

    setTypeItSubmitted(true);
    setTypeItCorrect(isCorrect);

    setSessionScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      incorrect: prev.incorrect + (isCorrect ? 0 : 1)
    }));

    // Update score with proper streak tracking
    await updateWordScore(question.word.id, isCorrect);
  };

  const getHint = () => {
    const question = typeItQuestions[currentIndex];
    const answer = question.direction === 'polish_to_english'
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
      Loading practice module...
    </div>
  );

  // Tutor games view - Use TutorGames component
  if (profile.role === 'tutor') {
    return <TutorGames profile={profile} />;
  }

  // Empty state
  if (deck.length === 0) return (
    <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
      <div className="w-20 h-20 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] rounded-full flex items-center justify-center text-[var(--accent-color)] opacity-60 mb-6">
        <ICONS.Book className="w-10 h-10" />
      </div>
      <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">No Words Yet</h2>
      <p className="text-[var(--text-secondary)] font-medium">Learn some words in Chat first, then come back to practice!</p>
    </div>
  );

  // Not enough words for multiple choice
  if (mode === 'multiple_choice' && deck.length < 4) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto bg-[var(--bg-primary)]">
        <div className="w-20 h-20 bg-amber-50 dark:bg-amber-900/30 rounded-full flex items-center justify-center text-amber-400 mb-6">
          <ICONS.Star className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-black text-[var(--text-primary)] mb-4">Need More Words</h2>
        <p className="text-[var(--text-secondary)] font-medium mb-6">Multiple choice requires at least 4 words. You have {deck.length}.</p>
        <button
          onClick={() => handleModeChange('flashcards')}
          className="px-6 py-3 rounded-xl font-bold text-white text-sm"
          style={{ backgroundColor: tierColor }}
        >
          Try Flashcards Instead
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
    />
  );

  // Current items based on mode
  const currentDeckLength = mode === 'type_it' ? typeItQuestions.length : deck.length;
  const progress = ((currentIndex + 1) / currentDeckLength) * 100;
  const pendingCount = pendingChallenges.length + pendingWordRequests.length;

  return (
    <div className="h-full flex flex-col overflow-hidden bg-[var(--bg-primary)]">
      {/* Header: Two Tabs - Fixed at top */}
      <div className="shrink-0 p-4 pb-2">
        <div className="w-full max-w-lg mx-auto">
          {/* Two-Tab Layout: Local Games | Love Notes */}
          {!localGameType && (
            <>
              <h1 className="text-2xl font-black text-[var(--text-primary)] mb-3 text-center">Practice</h1>
              <div className="inline-flex w-full bg-[var(--bg-card)] border border-[var(--border-color)] p-1 rounded-xl mb-3">
                <button
                  onClick={() => setMainTab('local_games')}
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    mainTab === 'local_games'
                      ? 'bg-[var(--bg-primary)] text-[var(--accent-color)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Play className="w-4 h-4" />
                  Local Games
                </button>
                <button
                  onClick={() => setMainTab('love_notes')}
                  className={`relative flex-1 px-4 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    mainTab === 'love_notes'
                      ? 'bg-[var(--accent-color)] text-white shadow-sm'
                      : pendingCount > 0
                        ? 'text-[var(--accent-color)]'
                        : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <ICONS.Heart className={`w-4 h-4 ${mainTab === 'love_notes' ? 'fill-white' : pendingCount > 0 ? 'fill-[var(--accent-color)]' : ''}`} />
                  Love Notes
                  {pendingCount > 0 && mainTab !== 'love_notes' && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-[var(--accent-color)] text-white text-[10px] flex items-center justify-center rounded-full font-bold animate-bounce">
                      {pendingCount > 9 ? '9+' : pendingCount}
                    </span>
                  )}
                </button>
              </div>
              <p className="text-[var(--text-secondary)] text-xs text-center">
                {mainTab === 'local_games'
                  ? 'Practice your vocabulary with different game modes'
                  : `Challenges and gifts from ${partnerName}`}
              </p>
            </>
          )}

          {/* Session Stats - Show only when a game is active */}
          {localGameType && (
            <>
              <div className="flex items-center justify-between mb-2">
                <button
                  onClick={exitLocalGame}
                  className="p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
                >
                  <ICONS.ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
                </button>
                <div className="flex gap-4">
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-green-500" />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{sessionScore.correct}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 rounded-full bg-red-400" />
                    <span className="text-xs font-bold text-[var(--text-secondary)]">{sessionScore.incorrect}</span>
                  </div>
                </div>
                <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
                  {currentIndex + 1} / {currentDeckLength}
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              {/* Flashcards */}
              <button
                onClick={() => startLocalGame('flashcards')}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-[var(--accent-border)] transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-[var(--accent-light)] rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🎴
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Flashcards</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Flip cards to reveal translations</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-[var(--accent-color)] text-xs font-bold">
                  <ICONS.Play className="w-3 h-3" />
                  <span>Start Now</span>
                </div>
              </button>

              {/* Multiple Choice */}
              <button
                onClick={() => startLocalGame('multiple_choice')}
                disabled={deck.length < 4}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🔘
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Multiple Choice</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Pick the correct translation</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-purple-500 text-xs font-bold">
                  <ICONS.Play className="w-3 h-3" />
                  <span>Start Now</span>
                </div>
              </button>

              {/* Type It */}
              <button
                onClick={() => startLocalGame('type_it')}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-blue-500/30 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-blue-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    ⌨️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Type It</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Type the translation yourself</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-blue-500 text-xs font-bold">
                  <ICONS.Play className="w-3 h-3" />
                  <span>Start Now</span>
                </div>
              </button>

              {/* Quick Fire */}
              <button
                onClick={() => startLocalGame('quick_fire')}
                disabled={deck.length < 5}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-amber-500/30 transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-amber-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    ⚡
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Quick Fire</h3>
                    <p className="text-sm text-[var(--text-secondary)]">60 second timed challenge</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-amber-500 text-xs font-bold">
                  <ICONS.Play className="w-3 h-3" />
                  <span>Start Now</span>
                </div>
              </button>

              {/* AI Challenge */}
              <button
                onClick={() => startLocalGame('ai_challenge')}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-green-500/30 transition-all text-left"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-green-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🤖
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">AI Challenge</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Mixed question types with smart word selection</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-green-500 text-xs font-bold">
                  <ICONS.Play className="w-3 h-3" />
                  <span>Start Challenge</span>
                </div>
              </button>

              {/* Conversation Practice */}
              <button
                onClick={() => setShowConversationPractice(true)}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-purple-500/30 transition-all text-left relative"
              >
                <div className="absolute top-3 right-3 px-2 py-0.5 bg-purple-500/20 text-purple-600 dark:text-purple-400 text-[9px] font-black uppercase tracking-wider rounded-full">
                  Beta
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-purple-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🎙️
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Conversation Practice</h3>
                    <p className="text-sm text-[var(--text-secondary)]">Talk to AI personas in Polish scenarios</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-purple-500 text-xs font-bold">
                  <ICONS.Mic className="w-3 h-3" />
                  <span>Start Conversation</span>
                </div>
              </button>

              {/* Verb Mastery */}
              <button
                onClick={() => startLocalGame('verb_mastery')}
                disabled={verbsWithConjugations.length === 0}
                className="group p-6 bg-[var(--bg-card)] rounded-[2rem] border border-[var(--border-color)] shadow-sm hover:shadow-md hover:border-orange-500/30 transition-all text-left relative disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="flex items-start gap-4">
                  <div className="w-14 h-14 bg-orange-500/20 rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform">
                    🔄
                  </div>
                  <div className="flex-1">
                    <h3 className="font-black text-[var(--text-primary)] mb-1">Verb Mastery</h3>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {verbsWithConjugations.length > 0
                        ? `Practice conjugations for ${verbsWithConjugations.length} verbs`
                        : 'Learn verbs first to unlock'}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-orange-500 text-xs font-bold">
                  <ICONS.Target className="w-3 h-3" />
                  <span>{verbsWithConjugations.length > 0 ? 'Start Practice' : 'Locked'}</span>
                </div>
              </button>
            </div>
          )}

          {/* Flashcards Mode */}
          {localGameType === 'flashcards' && (
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="relative w-full aspect-[4/5] cursor-pointer perspective-1000 group"
            >
              <div className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${isFlipped ? 'rotate-y-180' : ''}`}>
                {/* Front */}
                <div className="absolute inset-0 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden">
                  <span className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-8">POLISH WORD</span>
                  <h3 className="text-4xl font-black text-[var(--text-primary)]">{deck[currentIndex].word}</h3>
                  <p className="mt-12 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">Tap to reveal</p>
                </div>

                {/* Back */}
                <div
                  className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180"
                  style={{ backgroundColor: tierColor }}
                >
                  <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">TRANSLATION</span>
                  <h3 className="text-4xl font-black">{deck[currentIndex].translation}</h3>
                  <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(false); }}
                      className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-xs font-black uppercase tracking-widest transition-colors"
                    >
                      <ICONS.X className="w-4 h-4" /> Hard
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); handleFlashcardResponse(true); }}
                      className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs shadow-lg transition-all active:scale-95"
                      style={{ color: tierColor }}
                    >
                      <ICONS.Check className="w-4 h-4" /> Got it!
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Multiple Choice Mode */}
          {localGameType === 'multiple_choice' && (
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)]">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
                style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
              >
                Polish → English
              </span>

              <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">
                {deck[currentIndex].word}
              </h3>

              <div className="space-y-3">
                {mcOptions.map((option, idx) => {
                  const isCorrect = option === deck[currentIndex].translation;
                  const isSelected = mcSelected === option;

                  let buttonStyle = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                  if (mcShowFeedback) {
                    if (isCorrect) {
                      buttonStyle = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                    } else if (isSelected && !isCorrect) {
                      buttonStyle = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                    } else {
                      buttonStyle = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                    }
                  } else if (isSelected) {
                    buttonStyle = 'border-[var(--text-secondary)] bg-[var(--bg-primary)] text-[var(--text-primary)]';
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleMcSelect(option)}
                      disabled={mcShowFeedback}
                      className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${buttonStyle}`}
                    >
                      <span className="text-xs font-bold text-[var(--text-secondary)] mr-3">
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                      {mcShowFeedback && isCorrect && (
                        <ICONS.Check className="w-5 h-5 float-right text-green-500" />
                      )}
                      {mcShowFeedback && isSelected && !isCorrect && (
                        <ICONS.X className="w-5 h-5 float-right text-red-500" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Type It Mode */}
          {localGameType === 'type_it' && typeItQuestions.length > 0 && (
            <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)]">
              {(() => {
                const question = typeItQuestions[currentIndex];
                const isPolishToEnglish = question.direction === 'polish_to_english';
                const prompt = isPolishToEnglish ? question.word.word : question.word.translation;
                const correctAnswer = isPolishToEnglish ? question.word.translation : question.word.word;

                return (
                  <>
                    <span
                      className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6"
                      style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
                    >
                      {isPolishToEnglish ? 'Polish → English' : 'English → Polish'}
                    </span>

                    <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">
                      {prompt}
                    </h3>

                    {showHint && !typeItSubmitted && (
                      <p className="text-center text-[var(--text-secondary)] text-sm mb-4">
                        Hint: {getHint()}
                      </p>
                    )}

                    {typeItSubmitted && (
                      <div className={`text-center mb-4 p-3 rounded-xl ${
                        typeItCorrect ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                      }`}>
                        {typeItCorrect ? (
                          <div className="flex items-center justify-center gap-2">
                            <ICONS.Check className="w-5 h-5" />
                            <span className="font-bold">Correct!</span>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-center gap-2 mb-1">
                              <ICONS.X className="w-5 h-5" />
                              <span className="font-bold">Not quite</span>
                            </div>
                            <p className="text-sm">
                              Correct answer: <span className="font-black">{correctAnswer}</span>
                            </p>
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
                        placeholder={isPolishToEnglish ? 'Type in English...' : 'Type in Polish...'}
                        disabled={typeItSubmitted}
                        className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-lg font-medium text-center bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
                        autoFocus
                      />
                    </div>

                    <div className="flex gap-3 mt-6">
                      {!typeItSubmitted && (
                        <button
                          onClick={() => setShowHint(true)}
                          className="px-4 py-3 rounded-xl font-bold text-[var(--text-secondary)] bg-[var(--bg-primary)] text-sm"
                          disabled={showHint}
                        >
                          {showHint ? 'Hint shown' : 'Show hint'}
                        </button>
                      )}
                      <button
                        onClick={handleTypeItSubmit}
                        disabled={!typeItAnswer.trim() && !typeItSubmitted}
                        className="flex-1 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50 transition-all"
                        style={{ backgroundColor: tierColor }}
                      >
                        {typeItSubmitted ? 'Next' : 'Check'}
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
              <h2 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-4">Choose Challenge Mode</h2>

              {/* Side-by-side layout: Modes on left, Session Length on right */}
              <div className="flex gap-4">
                {/* Mode Selection */}
                <div className="flex-1 space-y-2">
                  {CHALLENGE_MODES.map(cm => {
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
                            <span className={`font-bold text-sm truncate ${isSelected ? 'text-[var(--accent-color)] dark:text-[var(--accent-color)]' : 'text-[var(--text-primary)]'}`}>{cm.name}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full shrink-0 ${isSelected ? 'bg-[var(--accent-light)] dark:bg-[var(--accent-light)] text-[var(--accent-text)] dark:text-[var(--accent-color)] opacity-60' : 'bg-[var(--bg-primary)] text-[var(--text-secondary)]'}`}>{count}</span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)] truncate">{cm.description}</p>
                        </div>
                        {isSelected && <ICONS.Check className="w-4 h-4 text-[var(--accent-color)] shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                {/* Session Length - appears to the right when mode selected */}
                {selectedChallengeMode && (
                  <div className="w-32 shrink-0 flex flex-col">
                    <h3 className="text-[9px] font-black uppercase tracking-widest text-[var(--text-secondary)] text-center mb-2">Length</h3>
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
                            <div className={`text-lg font-black ${sessionLength === len ? 'text-[var(--accent-color)] dark:text-[var(--accent-color)]' : 'text-[var(--text-primary)]'}`}>{actualCount}</div>
                            <div className="text-[8px] font-bold uppercase tracking-wider text-[var(--text-secondary)]">{len === 'all' ? 'All' : 'Qs'}</div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {selectedChallengeMode && sessionLength && (
                <button onClick={startChallenge} className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm mt-4" style={{ backgroundColor: tierColor }}>
                  Start Challenge
                </button>
              )}
            </div>
          )}

          {/* Quick Fire Mode */}
          {localGameType === 'quick_fire' && !quickFireStarted && (
            <div className="w-full text-center">
              <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-lg border border-[var(--border-color)] max-w-md mx-auto">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Quick Fire!</h2>
                <p className="text-[var(--text-secondary)] mb-6">
                  Translate as many words as you can in 60 seconds!
                </p>
                <div className="bg-amber-50 dark:bg-amber-900/30 p-4 rounded-2xl mb-6">
                  <p className="text-lg font-bold text-amber-600 dark:text-amber-400">
                    🔥 {deck.length} words available
                  </p>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">
                    Up to 20 random words per round
                  </p>
                </div>
                <button
                  onClick={startQuickFire}
                  disabled={deck.length < 5}
                  className="w-full py-4 rounded-2xl font-black text-white uppercase tracking-widest text-sm bg-amber-500 hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start!
                </button>
                {deck.length < 5 && (
                  <p className="text-sm text-red-500 mt-3">Need at least 5 words to play Quick Fire</p>
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
                <span className="text-sm font-bold text-[var(--text-secondary)]">
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
                placeholder="Type translation..."
                autoFocus
                className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-xl font-bold focus:outline-none focus:border-[var(--accent-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]"
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
                <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">Verb Mastery</h2>
                <p className="text-[var(--text-secondary)]">
                  Practice conjugating {verbsWithConjugations.length} verbs
                </p>
              </div>

              <div className="space-y-3 mb-8">
                <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
                  Select Tense
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
                          <h3 className="font-black text-[var(--text-primary)] capitalize">{tense} Tense</h3>
                          <p className="text-sm text-[var(--text-secondary)]">
                            {isDisabled
                              ? 'No verbs with this tense yet'
                              : `${verbsWithTense.length} verbs available`}
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
                className="w-full p-3 text-[var(--text-secondary)] font-bold text-sm hover:text-[var(--text-primary)] transition-colors"
              >
                ← Back to Games
              </button>
            </div>
          )}

          {/* Verb Mastery - Active Game */}
          {localGameType === 'verb_mastery' && verbMasteryStarted && !finished && verbMasteryQuestions.length > 0 && (
            <div className="w-full max-w-md mx-auto">
              {/* Progress Header */}
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-[var(--text-secondary)]">
                  {verbMasteryIndex + 1} / {verbMasteryQuestions.length}
                </span>
                <span className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-xs font-black uppercase">
                  {verbMasteryTense} tense
                </span>
              </div>

              {/* Question Card */}
              <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 mb-6">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider mb-2">
                  Conjugate the verb
                </p>
                <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2">
                  {verbMasteryQuestions[verbMasteryIndex]?.infinitive}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] italic mb-4">
                  "{verbMasteryQuestions[verbMasteryIndex]?.translation}"
                </p>

                <div className="bg-[var(--bg-card)] p-4 rounded-xl">
                  <p className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
                    For the pronoun
                  </p>
                  <p className="text-2xl font-black text-orange-500">
                    {VERB_PERSONS.find(p => p.key === verbMasteryQuestions[verbMasteryIndex]?.person)?.label}
                  </p>
                  <p className="text-xs text-[var(--text-secondary)]">
                    ({VERB_PERSONS.find(p => p.key === verbMasteryQuestions[verbMasteryIndex]?.person)?.english})
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
                  placeholder="Type conjugated form..."
                  autoFocus
                  disabled={verbMasterySubmitted}
                  className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-xl font-bold focus:outline-none focus:border-orange-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] disabled:opacity-50"
                />

                {/* Feedback */}
                {verbMasterySubmitted && (
                  <div className={`p-4 rounded-xl ${verbMasteryCorrect ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'}`}>
                    {verbMasteryCorrect ? (
                      <p className="text-green-600 dark:text-green-400 font-bold text-center">
                        ✓ Correct!
                      </p>
                    ) : (
                      <div className="text-center">
                        <p className="text-red-600 dark:text-red-400 font-bold mb-1">✗ Not quite</p>
                        <p className="text-[var(--text-primary)]">
                          Correct answer: <span className="font-black">{verbMasteryQuestions[verbMasteryIndex]?.correctAnswer}</span>
                        </p>
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
                    ? (verbMasteryIndex < verbMasteryQuestions.length - 1 ? 'Next Question' : 'See Results')
                    : 'Check Answer'}
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
                <h2 className="text-xl font-black text-[var(--text-primary)]">Love Notes from {partnerName}</h2>
                <p className="text-sm text-[var(--text-secondary)]">Challenges and gifts just for you</p>
              </div>

              {/* Empty State */}
              {pendingChallenges.length === 0 && pendingWordRequests.length === 0 && (
                <div className="bg-[var(--bg-card)] rounded-[2rem] p-8 shadow-sm border border-[var(--border-color)] text-center">
                  <div className="text-4xl mb-4">✨</div>
                  <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">No Love Notes Yet</h3>
                  <p className="text-sm text-[var(--text-secondary)]">When {partnerName} sends you challenges or word gifts, they'll appear here!</p>
                </div>
              )}

              {/* Pending Challenges */}
              {pendingChallenges.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Zap className="w-3.5 h-3.5" /> Challenges
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
                              {challenge.title || (challenge.challenge_type === 'quiz' ? 'Quiz Challenge' : 'Quick Fire')}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] dark:bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {challenge.words_data?.length || 0} words
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            From {partnerName} · {new Date(challenge.created_at).toLocaleDateString()}
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
                  <h3 className="text-xs font-black uppercase tracking-widest text-[var(--text-secondary)] flex items-center gap-2">
                    <ICONS.Heart className="w-3.5 h-3.5 fill-[var(--text-secondary)]" /> Word Gifts
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
                              {request.request_type === 'ai_topic' ? request.input_text : 'Word Gift'}
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 rounded-full shrink-0">
                              {request.selected_words?.length || 0} words
                            </span>
                            <span className="text-[9px] font-bold px-2 py-0.5 bg-[var(--accent-light)] text-[var(--accent-color)] dark:text-[var(--accent-color)] rounded-full shrink-0">
                              {request.xp_multiplier}x XP
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-secondary)]">
                            From {partnerName} · {new Date(request.created_at).toLocaleDateString()}
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
                    className="flex-1 py-3 rounded-xl font-bold text-sm text-white transition-colors"
                    style={{ backgroundColor: tierColor }}
                  >
                    Go to Practice Games
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
                            <h3 className="text-4xl font-black text-[var(--text-primary)]">{q.polish}</h3>
                            <p className="mt-12 text-[var(--text-secondary)] text-[10px] uppercase font-black tracking-widest animate-pulse">Tap to reveal</p>
                          </div>
                          <div className="absolute inset-0 text-white rounded-[2.5rem] p-10 flex flex-col items-center justify-center text-center shadow-lg backface-hidden rotate-y-180" style={{ backgroundColor: tierColor }}>
                            <span className="text-[10px] uppercase tracking-widest text-white/50 font-black mb-8">ENGLISH</span>
                            <h3 className="text-4xl font-black">{q.english}</h3>
                            <div className="mt-12 grid grid-cols-2 gap-3 w-full">
                              <button onClick={(e) => { e.stopPropagation(); handleChallengeFlashcardResponse(false); }} className="bg-white/10 hover:bg-white/20 p-4 rounded-2xl flex items-center justify-center gap-2 border border-white/20 text-xs font-black uppercase tracking-widest"><ICONS.X className="w-4 h-4" /> Hard</button>
                              <button onClick={(e) => { e.stopPropagation(); handleChallengeFlashcardResponse(true); }} className="bg-white p-4 rounded-2xl flex items-center justify-center gap-2 font-black uppercase tracking-widest text-xs" style={{ color: tierColor }}><ICONS.Check className="w-4 h-4" /> Got it!</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Multiple Choice question */}
                    {q.type === 'multiple_choice' && q.options && (
                      <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)]">
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6" style={{ backgroundColor: `${tierColor}15`, color: tierColor }}>Polish → English</span>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-8 text-center">{q.polish}</h3>
                        <div className="space-y-3">
                          {q.options.map((opt, idx) => {
                            const isCorrect = opt === q.english;
                            const isSelected = challengeMcSelected === opt;
                            let style = 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]';
                            if (challengeMcFeedback) {
                              if (isCorrect) style = 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400';
                              else if (isSelected) style = 'border-red-400 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400';
                              else style = 'border-[var(--border-color)] text-[var(--text-secondary)]';
                            }
                            return (
                              <button key={idx} onClick={() => handleChallengeMcSelect(opt)} disabled={challengeMcFeedback} className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${style}`}>
                                <span className="text-xs font-bold text-[var(--text-secondary)] mr-3">{String.fromCharCode(65 + idx)}</span>{opt}
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
                      <div className="bg-[var(--bg-card)] rounded-[2.5rem] p-8 shadow-lg border border-[var(--border-color)]">
                        <span className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full inline-block mb-6" style={{ backgroundColor: `${tierColor}15`, color: tierColor }}>Polish → English</span>
                        <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2 text-center">{q.polish}</h3>
                        {challengeTypeSubmitted && (
                          <div className={`text-center mb-4 p-3 rounded-xl ${challengeTypeCorrect ? 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400'}`}>
                            {challengeTypeCorrect ? (
                              <div className="flex items-center justify-center gap-2"><ICONS.Check className="w-5 h-5" /><span className="font-bold">Correct!</span></div>
                            ) : (
                              <div><div className="flex items-center justify-center gap-2 mb-1"><ICONS.X className="w-5 h-5" /><span className="font-bold">Not quite</span></div><p className="text-sm">Correct: <span className="font-black">{q.english}</span></p></div>
                            )}
                          </div>
                        )}
                        <input type="text" value={challengeTypeAnswer} onChange={(e) => setChallengeTypeAnswer(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleChallengeTypeSubmit()} placeholder="Type in English..." disabled={challengeTypeSubmitted} className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--text-secondary)] focus:outline-none text-lg font-medium text-center mt-4 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)]" autoFocus />
                        <button onClick={handleChallengeTypeSubmit} disabled={!challengeTypeAnswer.trim() && !challengeTypeSubmitted} className="w-full mt-4 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50" style={{ backgroundColor: tierColor }}>{challengeTypeSubmitted ? 'Next' : 'Check'}</button>
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
          />
        ) : (
          <PlayQuickFireChallenge
            challenge={activeChallenge}
            partnerName={partnerName}
            onComplete={handleChallengeComplete}
            onClose={() => setActiveChallenge(null)}
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
