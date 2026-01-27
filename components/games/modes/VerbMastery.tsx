import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { DictionaryEntry } from '../../../types';
import { shuffleArray } from '../../../utils/array';
import type { AnswerResult } from './types';

type VerbTense = 'present' | 'past' | 'future';

interface VerbPerson {
  key: string;
  label: string;
  nativeLabel: string;
}

interface VerbMasteryQuestion {
  verb: DictionaryEntry;
  tense: VerbTense;
  personKey: string;
  personLabel: string;
  personNativeLabel: string;
  correctAnswer: string;
  infinitive: string;
  translation: string;
}

interface VerbMasteryProps {
  /** Verbs with conjugation data */
  verbs: DictionaryEntry[];
  /** Person pronouns for the target language */
  verbPersons: VerbPerson[];
  /** Accent color */
  accentColor?: string;
  /** Max questions per session (default: 20) */
  maxQuestions?: number;
  /** Called when user answers */
  onAnswer: (result: AnswerResult & { explanation?: string }) => void;
  /** Called when game completes */
  onComplete: (results: {
    answers: (AnswerResult & { explanation?: string })[];
    score: { correct: number; incorrect: number };
  }) => void;
  /** Called to go back to game selection */
  onExit: () => void;
  /** Validate answer - returns { accepted, explanation } */
  validateAnswer?: (
    userAnswer: string,
    correctAnswer: string,
    context: { verb: DictionaryEntry; tense: VerbTense; person: string }
  ) => Promise<{ accepted: boolean; explanation: string }>;
  /** Simple validation fallback */
  simpleValidate?: (userAnswer: string, correctAnswer: string) => boolean;
}

type GamePhase = 'select_tense' | 'playing' | 'finished';

/**
 * Verb Mastery game mode - practice verb conjugations.
 * Configurable for any language with custom verb persons.
 */
export const VerbMastery: React.FC<VerbMasteryProps> = ({
  verbs,
  verbPersons,
  accentColor = '#f97316', // orange-500
  maxQuestions = 20,
  onAnswer,
  onComplete,
  onExit,
  validateAnswer,
  simpleValidate,
}) => {
  const { t } = useTranslation();
  const [phase, setPhase] = useState<GamePhase>('select_tense');
  const [selectedTense, setSelectedTense] = useState<VerbTense>('present');
  const [questions, setQuestions] = useState<VerbMasteryQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [input, setInput] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, incorrect: 0 });
  const [localShake, setLocalShake] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const answersRef = useRef<(AnswerResult & { explanation?: string })[]>([]);
  const scoreRef = useRef({ correct: 0, incorrect: 0 });
  const shakeTimeoutRef = useRef<ReturnType<typeof setTimeout>>();
  const onCompleteRef = useRef(onComplete);
  const onAnswerRef = useRef(onAnswer);

  // Keep callback refs current
  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onAnswerRef.current = onAnswer;
  }, [onAnswer]);

  // Cleanup
  useEffect(() => {
    return () => {
      if (shakeTimeoutRef.current) clearTimeout(shakeTimeoutRef.current);
    };
  }, []);

  // Filter verbs that have conjugation data for each tense
  const verbsByTense = useMemo(() => {
    const result: Record<VerbTense, DictionaryEntry[]> = {
      present: [],
      past: [],
      future: [],
    };

    for (const verb of verbs) {
      const conj = verb.conjugations as Record<string, any> | null;
      if (!conj) continue;

      if (conj.present) result.present.push(verb);
      if (conj.past) result.past.push(verb);
      if (conj.future) result.future.push(verb);
    }

    return result;
  }, [verbs]);

  const generateQuestions = useCallback(
    (tense: VerbTense): VerbMasteryQuestion[] => {
      const questionsArr: VerbMasteryQuestion[] = [];
      const tenseVerbs = shuffleArray([...verbsByTense[tense]]);

      for (const verb of tenseVerbs) {
        const conj = verb.conjugations as Record<string, any>;
        const tenseData = conj?.[tense];
        if (!tenseData) continue;

        for (const person of verbPersons) {
          const answer = tenseData[person.key];
          if (answer) {
            questionsArr.push({
              verb,
              tense,
              personKey: person.key,
              personLabel: person.label,
              personNativeLabel: person.nativeLabel,
              correctAnswer: answer,
              infinitive: verb.word,
              translation: verb.translation,
            });
          }
        }
      }

      return shuffleArray(questionsArr).slice(0, maxQuestions);
    },
    [verbsByTense, verbPersons, maxQuestions]
  );

  const startGame = useCallback(
    (tense: VerbTense) => {
      const generatedQuestions = generateQuestions(tense);
      if (generatedQuestions.length === 0) {
        alert(t('play.verbMastery.noVerbsAlert', { tense }));
        return;
      }

      setSelectedTense(tense);
      setQuestions(generatedQuestions);
      setCurrentIndex(0);
      setInput('');
      setSubmitted(false);
      setIsCorrect(false);
      setExplanation(null);
      setScore({ correct: 0, incorrect: 0 });
      scoreRef.current = { correct: 0, incorrect: 0 };
      answersRef.current = [];
      setPhase('playing');
    },
    [generateQuestions, t]
  );

  const handleSubmit = useCallback(async () => {
    if (!input.trim() || submitted || isValidating) return;

    const question = questions[currentIndex];
    if (!question) return;

    setIsValidating(true);

    // Validate
    let accepted: boolean;
    let explanationText: string | null = null;

    if (validateAnswer) {
      const result = await validateAnswer(input, question.correctAnswer, {
        verb: question.verb,
        tense: question.tense,
        person: question.personKey,
      });
      accepted = result.accepted;
      if (result.explanation && result.explanation !== 'Exact match') {
        explanationText = result.explanation;
      }
    } else if (simpleValidate) {
      accepted = simpleValidate(input, question.correctAnswer);
    } else {
      accepted = input.trim().toLowerCase() === question.correctAnswer.toLowerCase();
    }

    setIsValidating(false);
    setSubmitted(true);
    setIsCorrect(accepted);
    setExplanation(explanationText);

    // Shake on incorrect
    if (!accepted) {
      setLocalShake(true);
      shakeTimeoutRef.current = setTimeout(() => setLocalShake(false), 500);
    }

    // Record answer
    const answerResult: AnswerResult & { explanation?: string } = {
      wordId: question.verb.id,
      wordText: `${question.infinitive} (${question.personLabel})`,
      correctAnswer: question.correctAnswer,
      userAnswer: input,
      questionType: 'type_it',
      isCorrect: accepted,
      explanation: explanationText || undefined,
    };
    answersRef.current = [...answersRef.current, answerResult];
    onAnswerRef.current(answerResult);

    // Update score
    const newScore = {
      correct: scoreRef.current.correct + (accepted ? 1 : 0),
      incorrect: scoreRef.current.incorrect + (accepted ? 0 : 1),
    };
    setScore(newScore);
    scoreRef.current = newScore;
  }, [input, submitted, isValidating, questions, currentIndex, validateAnswer, simpleValidate]);

  const handleNext = useCallback(() => {
    const isLastQuestion = currentIndex >= questions.length - 1;

    if (isLastQuestion) {
      setPhase('finished');
      onCompleteRef.current({
        answers: answersRef.current,
        score: scoreRef.current,
      });
    } else {
      setCurrentIndex((i) => i + 1);
      setInput('');
      setSubmitted(false);
      setIsCorrect(false);
      setExplanation(null);
    }
  }, [currentIndex, questions.length]);

  const currentQuestion = questions[currentIndex];
  const isLastQuestion = currentIndex >= questions.length - 1;

  // Tense selection screen
  if (phase === 'select_tense') {
    return (
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto bg-orange-500/20 rounded-2xl flex items-center justify-center text-4xl mb-4">
            🔄
          </div>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-2">
            {t('play.verbMastery.title')}
          </h2>
          <p className="text-[var(--text-secondary)]">
            {t('play.verbMastery.practiceCount', { count: verbs.length })}
          </p>
        </div>

        <div className="space-y-3 mb-8">
          <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
            {t('play.verbMastery.selectTense')}
          </p>
          {(['present', 'past', 'future'] as VerbTense[]).map((tense) => {
            const tenseVerbs = verbsByTense[tense];
            const isDisabled = tenseVerbs.length === 0;

            return (
              <button
                key={tense}
                onClick={() => !isDisabled && startGame(tense)}
                disabled={isDisabled}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all ${
                  isDisabled
                    ? 'border-[var(--border-color)] bg-[var(--bg-primary)] opacity-50 cursor-not-allowed'
                    : 'border-orange-300 dark:border-orange-700 bg-orange-50 dark:bg-orange-900/20 hover:border-orange-500'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-black text-[var(--text-primary)] capitalize">
                      {t(`play.verbMastery.${tense}Tense`)}
                    </h3>
                    <p className="text-scale-label text-[var(--text-secondary)]">
                      {isDisabled
                        ? t('play.verbMastery.noVerbsWithTense')
                        : t('play.verbMastery.verbsAvailable', { count: tenseVerbs.length })}
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
          onClick={onExit}
          className="w-full p-3 text-[var(--text-secondary)] font-bold text-scale-label hover:text-[var(--text-primary)] transition-colors"
        >
          {t('play.verbMastery.backToGames')}
        </button>
      </div>
    );
  }

  // Playing screen
  if (phase === 'playing' && currentQuestion) {
    return (
      <div className={`w-full max-w-md mx-auto ${localShake ? 'animate-shake' : ''}`}>
        {/* Progress Header */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-scale-label font-bold text-[var(--text-secondary)]">
            {currentIndex + 1} / {questions.length}
          </span>
          <span className="px-3 py-1 bg-orange-500/20 text-orange-600 dark:text-orange-400 rounded-full text-scale-caption font-black uppercase">
            {selectedTense} tense
          </span>
        </div>

        {/* Question Card */}
        <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-2xl border border-orange-200 dark:border-orange-800 mb-6">
          <p className="text-scale-caption font-bold text-orange-500 uppercase tracking-wider mb-2">
            {t('play.verbMastery.conjugateVerb')}
          </p>
          <h3 className="text-3xl font-black text-[var(--text-primary)] mb-2">
            {currentQuestion.infinitive}
          </h3>
          <p className="text-scale-label text-[var(--text-secondary)] italic mb-4">
            "{currentQuestion.translation}"
          </p>

          <div className="bg-[var(--bg-card)] p-4 rounded-xl">
            <p className="text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-1">
              {t('play.verbMastery.forPronoun')}
            </p>
            <p className="text-2xl font-black text-orange-500">
              {currentQuestion.personLabel}
            </p>
            <p className="text-scale-caption text-[var(--text-secondary)]">
              ({currentQuestion.personNativeLabel})
            </p>
          </div>
        </div>

        {/* Input */}
        <div className="space-y-4">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                if (submitted) {
                  handleNext();
                } else {
                  handleSubmit();
                }
              }
            }}
            placeholder={t('play.verbMastery.typeConjugation')}
            autoFocus
            disabled={submitted || isValidating}
            className="w-full p-4 border-2 border-[var(--border-color)] rounded-xl text-center text-scale-heading font-bold focus:outline-none focus:border-orange-500 bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] disabled:opacity-50"
          />

          {/* Feedback */}
          {submitted && (
            <div
              className={`p-4 rounded-xl ${
                isCorrect
                  ? 'bg-green-100 dark:bg-green-900/30'
                  : 'bg-red-100 dark:bg-red-900/30'
              }`}
            >
              {isCorrect ? (
                <div className="text-center">
                  <p className="text-green-600 dark:text-green-400 font-bold">
                    ✓ {t('play.typeIt.correct')}
                  </p>
                  {explanation && (
                    <p className="text-scale-label text-green-600/80 dark:text-green-400/80 mt-1">
                      {explanation}
                    </p>
                  )}
                </div>
              ) : (
                <div className="text-center">
                  <p className="text-red-600 dark:text-red-400 font-bold mb-1">
                    ✗ {t('play.typeIt.notQuite')}
                  </p>
                  <p className="text-[var(--text-primary)]">
                    {t('play.typeIt.correctAnswer')}{' '}
                    <span className="font-black">{currentQuestion.correctAnswer}</span>
                  </p>
                  {explanation && (
                    <p className="text-scale-label text-red-600/80 dark:text-red-400/80 mt-1">
                      {explanation}
                    </p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Action Button */}
          <button
            onClick={submitted ? handleNext : handleSubmit}
            disabled={(!input.trim() && !submitted) || isValidating}
            className="w-full p-4 rounded-xl font-black text-white transition-all disabled:opacity-50"
            style={{
              backgroundColor: submitted
                ? isLastQuestion
                  ? '#22c55e'
                  : accentColor
                : accentColor,
            }}
          >
            {isValidating
              ? t('play.typeIt.checking', 'Checking...')
              : submitted
              ? isLastQuestion
                ? t('play.verbMastery.seeResults')
                : t('play.verbMastery.nextQuestion')
              : t('play.verbMastery.checkAnswer')}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="mt-6 h-2 bg-[var(--border-color)] rounded-full overflow-hidden">
          <div
            className="h-full bg-orange-500 transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
          />
        </div>

        {/* Shake animation */}
        <style>{`
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-4px); }
            20%, 40%, 60%, 80% { transform: translateX(4px); }
          }
          .animate-shake {
            animation: shake 0.5s ease-in-out;
          }
        `}</style>
      </div>
    );
  }

  // Finished - parent handles results
  return null;
};

export default VerbMastery;
