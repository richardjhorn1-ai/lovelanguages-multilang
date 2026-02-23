import React, { useState, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../../constants';
import { DictionaryEntry } from '../../../../types';
import {
  VerbTense,
  getAvailableTenses,
  getConjugationPersons,
  isTenseGendered,
  isTenseLimited,
  getImperativePersons,
} from '../../../../constants/language-config';
import { shuffleArray } from '../../../../utils/array';
import { useVerbQueue } from './useVerbQueue';
import { DojoMode, DojoQuestion, DojoSessionResult, FillTemplateQuestion } from './types';
import { FillTemplate } from './FillTemplate';
import { MatchPairs } from './MatchPairs';

// Normalized person keys (DB storage format)
const NORMALIZED_PERSONS = [
  'first_singular',
  'second_singular',
  'third_singular',
  'first_plural',
  'second_plural',
  'third_plural',
] as const;

// Native English labels for each person
const NATIVE_PERSON_LABELS = ['I', 'you (singular)', 'he/she/it', 'we', 'you (plural)', 'they'];

interface VerbDojoProps {
  verbs: DictionaryEntry[];
  targetLanguage: string;
  accentColor?: string;
  onAnswer?: (correct: boolean, xpEarned: number) => void;
  onComplete: (result: DojoSessionResult) => void;
  onExit: () => void;
  onStart?: () => void;
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    context: { verb: DictionaryEntry; tense: VerbTense; person: string }
  ) => Promise<{ accepted: boolean; explanation: string }>;
}

type GamePhase = 'select_mode' | 'playing' | 'finished';

const MODE_ICONS: Record<DojoMode, React.ReactNode> = {
  mixed: <ICONS.Shuffle className="w-8 h-8 md:w-10 md:h-10" />,
  match_pairs: <ICONS.Target className="w-8 h-8 md:w-10 md:h-10" />,
  fill_template: <ICONS.Pencil className="w-8 h-8 md:w-10 md:h-10" />,
  multiple_choice: <ICONS.CheckCircle className="w-8 h-8 md:w-10 md:h-10" />,
  audio_type: <ICONS.Volume2 className="w-8 h-8 md:w-10 md:h-10" />,
};

const MODE_KEYS: Record<DojoMode, { label: string; desc: string }> = {
  mixed: { label: 'play.verbDojo.modes.mixed', desc: 'play.verbDojo.modes.mixedDesc' },
  match_pairs: { label: 'play.verbDojo.modes.matchPairs', desc: 'play.verbDojo.modes.matchPairsDesc' },
  fill_template: { label: 'play.verbDojo.modes.fillTemplate', desc: 'play.verbDojo.modes.fillTemplateDesc' },
  multiple_choice: { label: 'play.verbDojo.modes.multipleChoice', desc: 'play.verbDojo.modes.multipleChoiceDesc' },
  audio_type: { label: 'play.verbDojo.modes.audioType', desc: 'play.verbDojo.modes.audioTypeDesc' },
};

export const VerbDojo: React.FC<VerbDojoProps> = ({
  verbs,
  targetLanguage,
  accentColor = '#f97316',
  onAnswer,
  onComplete,
  onExit,
  onStart,
  validateAnswer,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('select_mode');
  const [selectedMode, setSelectedMode] = useState<DojoMode>('mixed');
  const [focusTense, setFocusTense] = useState<VerbTense | null>(null);

  // Game state
  const [currentQuestion, setCurrentQuestion] = useState<DojoQuestion | null>(null);
  const [streak, setStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalWrong, setTotalWrong] = useState(0);
  const [xpEarned, setXpEarned] = useState(0);

  // Track total answered via ref to avoid stale closure issues
  const totalAnsweredRef = useRef(0);

  // Available tenses for this language
  const availableTenses = useMemo(() => getAvailableTenses(targetLanguage), [targetLanguage]);

  // Only show tenses that have at least one unlocked verb
  const unlockedTenses = useMemo(() => {
    const tenseSet = new Set<VerbTense>();
    for (const verb of verbs) {
      const conjugations = verb.conjugations as Record<string, any> | null;
      if (!conjugations) continue;
      for (const tense of availableTenses) {
        const tenseData = conjugations[tense];
        const isPresent = tense === 'present';
        const isUnlocked = isPresent ? !!tenseData : tenseData?.unlockedAt;
        if (isUnlocked && tenseData) tenseSet.add(tense);
      }
    }
    return Array.from(tenseSet);
  }, [verbs, availableTenses]);

  // Conjugation persons for this language
  const personLabels = useMemo(() => getConjugationPersons(targetLanguage), [targetLanguage]);

  // Queue management
  const { getNext, markCorrect, markWrong, isEmpty, queueLength } = useVerbQueue({
    verbs,
    targetLanguage,
    focusTense,
  });

  // Generate a question for the current combo
  const generateQuestion = useCallback(
    (mode: DojoMode): DojoQuestion | null => {
      const combo = getNext();
      if (!combo) return null;

      const { verb, tense } = combo;
      const conjugations = verb.conjugations as Record<string, any>;
      const tenseData = conjugations?.[tense];
      if (!tenseData) return null;

      // Determine actual mode (random if mixed)
      const actualMode =
        mode === 'mixed'
          ? (['fill_template', 'multiple_choice', 'match_pairs'] as DojoMode[])[Math.floor(Math.random() * 3)]
          : mode;

      // Get persons for this tense (limited for imperative)
      const isLimited = isTenseLimited(targetLanguage, tense);
      const persons = isLimited ? getImperativePersons(targetLanguage) : [...NORMALIZED_PERSONS];

      // Pick a random person
      const personKey = persons[Math.floor(Math.random() * persons.length)];
      const personIndex = NORMALIZED_PERSONS.indexOf(personKey as typeof NORMALIZED_PERSONS[number]);
      const personLabel = personLabels[personIndex] || personKey;
      const nativeLabel = NATIVE_PERSON_LABELS[personIndex] || personKey;

      // Get the correct answer
      const answer = tenseData[personKey];
      if (!answer) return null;

      if (actualMode === 'fill_template') {
        return {
          verb,
          tense,
          mode: 'fill_template',
          personKey,
          personLabel,
          nativeLabel,
          correctAnswer: answer,
        } as FillTemplateQuestion;
      }

      if (actualMode === 'multiple_choice') {
        // Generate distractors from other persons
        const correctAnswer = typeof answer === 'object' ? answer.masculine || answer.feminine : answer;
        const otherAnswers = persons
          .filter((p) => p !== personKey)
          .map((p) => {
            const a = tenseData[p];
            return typeof a === 'object' ? a.masculine || a.feminine : a;
          })
          .filter(Boolean);
        const distractors = shuffleArray(otherAnswers).slice(0, 3);
        const options = shuffleArray([correctAnswer, ...distractors]);

        return {
          verb,
          tense,
          mode: 'multiple_choice',
          personKey,
          personLabel,
          nativeLabel,
          correctAnswer,
          options,
        };
      }

      if (actualMode === 'match_pairs') {
        // Build all pairs for this verb+tense
        const pairs = persons
          .map((pKey, idx) => {
            const ans = tenseData[pKey];
            if (!ans) return null;
            const pIndex = NORMALIZED_PERSONS.indexOf(pKey as typeof NORMALIZED_PERSONS[number]);
            return {
              personKey: pKey,
              personLabel: personLabels[pIndex] || pKey,
              correctAnswer: typeof ans === 'object' ? ans.masculine || ans.feminine : ans,
            };
          })
          .filter(Boolean) as { personKey: string; personLabel: string; correctAnswer: string }[];

        if (pairs.length < 2) return null; // Need at least 2 pairs

        return {
          verb,
          tense,
          mode: 'match_pairs',
          pairs,
        };
      }

      // TODO: audio_type
      return null;
    },
    [getNext, targetLanguage, personLabels]
  );

  // Start the game
  const startGame = useCallback(() => {
    if (isEmpty) {
      alert(t('play.verbDojo.noVerbsAlert'));
      return;
    }

    const question = generateQuestion(selectedMode);
    if (!question) {
      alert(t('play.verbDojo.noVerbsAlert'));
      return;
    }

    setCurrentQuestion(question);
    setStreak(0);
    setLongestStreak(0);
    setTotalCorrect(0);
    setTotalWrong(0);
    setXpEarned(0);
    totalAnsweredRef.current = 0;
    setPhase('playing');
    onStart?.();
  }, [isEmpty, generateQuestion, selectedMode, t, onStart]);

  // Handle answer result
  const handleAnswer = useCallback(
    (correct: boolean) => {
      totalAnsweredRef.current += 1;

      if (correct) {
        markCorrect();
        const newStreak = streak + 1;
        setStreak(newStreak);
        setLongestStreak((prev) => Math.max(prev, newStreak));
        setTotalCorrect((prev) => prev + 1);

        // XP: 1 per 5 correct in a row
        if (newStreak % 5 === 0) {
          setXpEarned((prev) => prev + 1);
          onAnswer?.(true, 1);
        } else {
          onAnswer?.(true, 0);
        }
      } else {
        markWrong();
        setStreak(0);
        setTotalWrong((prev) => prev + 1);
        onAnswer?.(false, 0);
      }
    },
    [streak, markCorrect, markWrong, onAnswer]
  );

  // Move to next question
  const nextQuestion = useCallback(() => {
    // End session after 20 questions
    if (totalAnsweredRef.current >= 20) {
      setPhase('finished');
      onComplete({
        totalQuestions: totalAnsweredRef.current,
        correct: totalCorrect,
        wrong: totalWrong,
        longestStreak,
        xpEarned,
      });
      return;
    }

    const question = generateQuestion(selectedMode);
    if (!question) {
      // No more questions (shouldn't happen with cycling)
      setPhase('finished');
      onComplete({
        totalQuestions: totalCorrect + totalWrong,
        correct: totalCorrect,
        wrong: totalWrong,
        longestStreak,
        xpEarned,
      });
      return;
    }
    setCurrentQuestion(question);
  }, [generateQuestion, selectedMode, onComplete, totalCorrect, totalWrong, longestStreak, xpEarned]);

  // Exit game
  const handleExit = useCallback(() => {
    onComplete({
      totalQuestions: totalCorrect + totalWrong,
      correct: totalCorrect,
      wrong: totalWrong,
      longestStreak,
      xpEarned,
    });
    onExit();
  }, [onComplete, onExit, totalCorrect, totalWrong, longestStreak, xpEarned]);

  // Mode selection screen
  if (phase === 'select_mode') {
    const availableModes = (Object.keys(MODE_ICONS) as DojoMode[]).filter((mode) => mode !== 'audio_type');

    return (
      <div className="w-full max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            className="w-16 h-16 md:w-20 md:h-20 mx-auto rounded-2xl flex items-center justify-center mb-4"
            style={{ backgroundColor: `${accentColor}20`, color: accentColor }}
          >
            <ICONS.Fist className="w-8 h-8 md:w-10 md:h-10" />
          </div>
          <h2 className="text-xl md:text-2xl font-black font-header text-[var(--text-primary)] mb-1">
            {t('play.verbDojo.title', 'Verb Dojo')}
          </h2>
          <p className="text-scale-label text-[var(--text-secondary)]">
            {t('play.verbDojo.subtitle', 'Master your verb conjugations')}
          </p>
          <p className="text-scale-caption text-[var(--text-secondary)] mt-1">
            {queueLength} {t('play.verbDojo.combinationsAvailable', 'verb+tense combinations available')}
          </p>
        </div>

        {/* Mode selection - Grid on desktop */}
        <div className="mb-6">
          <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
            {t('play.verbDojo.selectMode')}
          </p>
          <div className="grid grid-cols-2 gap-3">
            {availableModes.map((mode) => {
              const icon = MODE_ICONS[mode];
              const keys = MODE_KEYS[mode];
              const isSelected = selectedMode === mode;

              return (
                <button
                  key={mode}
                  onClick={() => setSelectedMode(mode)}
                  className={`relative p-4 rounded-2xl border-2 text-center transition-all aspect-square flex flex-col items-center justify-center gap-2 ${
                    isSelected
                      ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                      : 'border-[var(--border-color)] bg-[var(--bg-card)] hover:border-[var(--accent-color)]/50'
                  }`}
                  style={{ '--accent-color': accentColor } as React.CSSProperties}
                >
                  <span>{icon}</span>
                  <div>
                    <h3 className="font-bold font-header text-[var(--text-primary)] text-sm md:text-base">{t(keys.label)}</h3>
                    <p className="text-[10px] md:text-scale-caption text-[var(--text-secondary)] line-clamp-2">{t(keys.desc)}</p>
                  </div>
                  {isSelected && (
                    <div
                      className="absolute top-2 right-2 w-5 h-5 md:w-6 md:h-6 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: accentColor }}
                    >
                      <ICONS.Check className="w-3 h-3 md:w-4 md:h-4 text-white" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Focus tense filter — only show if 2+ unlocked tenses */}
        {unlockedTenses.length >= 2 && (
          <div className="mb-6">
            <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
              {t('play.verbDojo.focusOn', 'Focus on (optional)')}
            </p>
            <select
              value={focusTense || ''}
              onChange={(e) => setFocusTense(e.target.value ? (e.target.value as VerbTense) : null)}
              className="w-full p-3 rounded-xl border-2 border-[var(--border-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent-color)]"
              style={{ '--accent-color': accentColor } as React.CSSProperties}
            >
              <option value="">{t('play.verbDojo.allTenses', 'All Tenses')}</option>
              {unlockedTenses.map((tense) => (
                <option key={tense} value={tense}>
                  {t(`loveLog.modal.${tense}`, tense)}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Start button */}
        <button
          onClick={startGame}
          disabled={isEmpty}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all disabled:opacity-50 hover:opacity-90"
          style={{ backgroundColor: accentColor }}
        >
          {t('play.verbDojo.startTraining', 'Start Training')}
        </button>

        <button
          onClick={onExit}
          className="w-full p-3 mt-3 text-[var(--text-secondary)] font-bold text-scale-label hover:text-[var(--text-primary)] transition-colors"
        >
          ← {t('play.verbDojo.backToGames', 'Back to Games')}
        </button>
      </div>
    );
  }

  // Playing screen
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className="w-full max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={handleExit} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
            <ICONS.X className="w-6 h-6" />
          </button>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1">
              <ICONS.Fire className="w-5 h-5 text-orange-500" />
              <span className="font-bold text-[var(--text-primary)]">{streak}</span>
            </div>
            <div className="flex items-center gap-1">
              <ICONS.Star className="w-5 h-5 text-amber-500" />
              <span className="font-bold text-[var(--text-primary)]">{xpEarned}</span>
            </div>
          </div>
        </div>

        {/* Streak progress bar */}
        <div className="mb-6">
          <div className="h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300"
              style={{
                width: `${(streak % 5) * 20}%`,
                backgroundColor: accentColor,
              }}
            />
          </div>
          <p className="text-scale-caption text-[var(--text-secondary)] text-center mt-1">
            {5 - (streak % 5)} more for +1 XP
          </p>
        </div>

        {/* Question */}
        {currentQuestion.mode === 'fill_template' && (
          <FillTemplate
            key={`${currentQuestion.verb.id}-${currentQuestion.tense}-${currentQuestion.personKey}`}
            question={currentQuestion as FillTemplateQuestion}
            targetLanguage={targetLanguage}
            accentColor={accentColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
            validateAnswer={validateAnswer}
          />
        )}

        {currentQuestion.mode === 'multiple_choice' && (
          <MultipleChoiceInline
            key={`${currentQuestion.verb.id}-${currentQuestion.tense}-${currentQuestion.personKey}`}
            question={currentQuestion}
            accentColor={accentColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}

        {currentQuestion.mode === 'match_pairs' && (
          <MatchPairsWrapper
            key={`${currentQuestion.verb.id}-${currentQuestion.tense}-pairs`}
            question={currentQuestion}
            targetLanguage={targetLanguage}
            accentColor={accentColor}
            onAnswer={handleAnswer}
            onNext={nextQuestion}
          />
        )}
      </div>
    );
  }

  return null;
};

// Inline multiple choice component (simple for now)
const MultipleChoiceInline: React.FC<{
  question: any;
  accentColor: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}> = ({ question, accentColor, onAnswer, onNext }) => {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const handleSelect = (option: string) => {
    if (submitted) return;
    setSelected(option);
  };

  const handleSubmit = () => {
    if (!selected || submitted) return;
    setSubmitted(true);
    onAnswer(selected === question.correctAnswer);
  };

  const handleNext = () => {
    setSelected(null);
    setSubmitted(false);
    onNext();
  };

  return (
    <div>
      {/* Question card */}
      <div
        className="p-6 rounded-2xl border mb-6"
        style={{ backgroundColor: `${accentColor}10`, borderColor: `${accentColor}30` }}
      >
        <p className="text-scale-caption font-bold uppercase tracking-wider mb-2" style={{ color: accentColor }}>
          {question.tense} tense
        </p>
        <h3 className="text-2xl font-black font-header text-[var(--text-primary)] mb-2">{question.verb.word}</h3>
        <p className="text-[var(--text-secondary)] italic mb-4">"{question.verb.translation}"</p>
        <div className="glass-card p-3 rounded-xl">
          <p className="text-lg font-bold" style={{ color: accentColor }}>
            {question.personLabel} ({question.nativeLabel})
          </p>
        </div>
      </div>

      {/* Options */}
      <div className="space-y-3 mb-6">
        {question.options.map((option: string) => {
          const isSelected = selected === option;
          const isCorrect = option === question.correctAnswer;
          const showResult = submitted;

          return (
            <button
              key={option}
              onClick={() => handleSelect(option)}
              disabled={submitted}
              className={`w-full p-4 rounded-xl border-2 text-left font-bold transition-all ${
                showResult
                  ? isCorrect
                    ? 'border-green-500 bg-green-500/10 text-green-700 dark:text-green-400'
                    : isSelected
                    ? 'border-red-500 bg-red-500/10 text-red-700 dark:text-red-400'
                    : 'border-[var(--border-color)] opacity-50'
                  : isSelected
                  ? 'border-[var(--accent-color)] bg-[var(--accent-color)]/10'
                  : 'border-[var(--border-color)] hover:border-[var(--accent-color)]/50'
              }`}
              style={{ '--accent-color': accentColor } as React.CSSProperties}
            >
              {option}
            </button>
          );
        })}
      </div>

      {/* Submit / Next button */}
      {!submitted ? (
        <button
          onClick={handleSubmit}
          disabled={!selected}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all disabled:opacity-50"
          style={{ backgroundColor: accentColor }}
        >
          {t('play.verbDojo.submit', 'Submit')}
        </button>
      ) : (
        <button
          onClick={handleNext}
          className="w-full py-4 rounded-2xl text-white font-bold text-lg transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {t('play.verbDojo.next', 'Next')}
        </button>
      )}
    </div>
  );
};

// Match Pairs wrapper component
const MatchPairsWrapper: React.FC<{
  question: any;
  targetLanguage: string;
  accentColor: string;
  onAnswer: (correct: boolean) => void;
  onNext: () => void;
}> = ({ question, targetLanguage, accentColor, onAnswer, onNext }) => {
  const { t } = useTranslation();
  const [completed, setCompleted] = useState(false);

  const handleComplete = useCallback((allCorrect: boolean) => {
    setCompleted(true);
    onAnswer(allCorrect);
  }, [onAnswer]);

  const handleNext = useCallback(() => {
    setCompleted(false);
    onNext();
  }, [onNext]);

  return (
    <div>
      <MatchPairs
        verb={question.verb}
        tense={question.tense}
        pairs={question.pairs}
        targetLanguage={targetLanguage}
        accentColor={accentColor}
        onComplete={handleComplete}
      />
      {completed && (
        <button
          onClick={handleNext}
          className="w-full py-4 mt-4 rounded-2xl text-white font-bold text-lg transition-all"
          style={{ backgroundColor: accentColor }}
        >
          {t('play.verbDojo.next', 'Next')}
        </button>
      )}
    </div>
  );
};

export default VerbDojo;
