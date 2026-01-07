import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Profile, TestQuestion } from '../types';
import { geminiService } from '../services/gemini';
import { getLevelFromXP, getTierColor } from '../services/level-utils';
import { ICONS } from '../constants';

interface LevelTestProps {
  profile: Profile;
}

type TestState = 'loading' | 'ready' | 'in_progress' | 'submitting' | 'results';

const LevelTest: React.FC<LevelTestProps> = ({ profile }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [state, setState] = useState<TestState>('loading');
  const [error, setError] = useState<string | null>(null);

  // Test data
  const [testId, setTestId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<TestQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});

  // Theme info
  const [themeName, setThemeName] = useState('');
  const [fromLevel, setFromLevel] = useState('');
  const [toLevel, setToLevel] = useState('');

  // Results
  const [results, setResults] = useState<any>(null);

  // Get level info
  const levelInfo = getLevelFromXP(profile.xp || 0);
  const tierColor = getTierColor(levelInfo.tier);

  useEffect(() => {
    // Check if levels are provided in URL params
    const from = searchParams.get('from') || levelInfo.displayName;
    const to = searchParams.get('to') || levelInfo.nextLevel;

    if (!to) {
      setError("You're already at the maximum level!");
      setState('ready');
      return;
    }

    setFromLevel(from);
    setToLevel(to);
    generateTest(from, to);
  }, []);

  const generateTest = async (from: string, to: string) => {
    setState('loading');
    setError(null);

    const result = await geminiService.generateLevelTest(from, to);

    if (!result.success || !result.data) {
      setError(result.error || 'Failed to generate test');
      setState('ready');
      return;
    }

    setTestId(result.data.testId);
    setQuestions(result.data.questions);
    setThemeName(result.data.theme);
    setState('ready');
  };

  const startTest = () => {
    setState('in_progress');
    setCurrentIndex(0);
    setAnswers({});
  };

  const handleAnswer = (answer: string) => {
    const question = questions[currentIndex];
    setAnswers(prev => ({ ...prev, [question.id]: answer }));
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      submitTest();
    }
  };

  const prevQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const submitTest = async () => {
    if (!testId) return;

    setState('submitting');

    const answerArray = Object.entries(answers).map(([questionId, userAnswer]) => ({
      questionId,
      userAnswer
    }));

    const result = await geminiService.submitLevelTest(testId, answerArray);

    if (!result.success || !result.data) {
      setError(result.error || 'Failed to submit test');
      setState('in_progress');
      return;
    }

    setResults(result.data);
    setState('results');
  };

  const currentQuestion = questions[currentIndex];
  const currentAnswer = currentQuestion ? answers[currentQuestion.id] || '' : '';
  const progress = questions.length > 0 ? ((currentIndex + 1) / questions.length) * 100 : 0;

  // Loading state
  if (state === 'loading') {
    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-lg text-center max-w-md w-full border border-[var(--border-color)]">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
            <ICONS.Sparkles className="w-8 h-8 text-[var(--accent-color)] animate-pulse" />
          </div>
          <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Preparing Your Test</h2>
          <p className="text-[var(--text-secondary)] text-sm">Generating questions based on your level...</p>
        </div>
      </div>
    );
  }

  // Ready state (before starting)
  if (state === 'ready') {
    if (error) {
      return (
        <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
          <div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-lg text-center max-w-md w-full border border-[var(--border-color)]">
            <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <ICONS.X className="w-8 h-8 text-red-400" />
            </div>
            <h2 className="text-xl font-black text-[var(--text-primary)] mb-2">Oops!</h2>
            <p className="text-[var(--text-secondary)] text-sm mb-6">{error}</p>
            <button
              onClick={() => navigate('/progress')}
              className="bg-[var(--bg-primary)] text-[var(--text-primary)] px-6 py-3 rounded-xl font-bold text-sm"
            >
              Back to Progress
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
        <div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-xl text-center max-w-md w-full border border-[var(--border-color)]">
          <div
            className="w-20 h-20 mx-auto mb-6 rounded-full flex items-center justify-center"
            style={{ backgroundColor: `${tierColor}15` }}
          >
            <ICONS.Star className="w-10 h-10" style={{ color: tierColor }} />
          </div>

          <p className="text-[10px] uppercase tracking-widest text-[var(--text-secondary)] font-black mb-2">Level Up Test</p>
          <h2 className="text-2xl font-black text-[var(--text-primary)] mb-1">{themeName}</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">{fromLevel} → {toLevel}</p>

          <div className="bg-[var(--bg-primary)] rounded-2xl p-4 mb-6 text-left">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Questions</span>
              <span className="font-bold text-[var(--text-primary)]">{questions.length}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-[var(--text-secondary)]">Pass threshold</span>
              <span className="font-bold text-[var(--text-primary)]">80%</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Time limit</span>
              <span className="font-bold text-[var(--text-primary)]">None</span>
            </div>
          </div>

          <button
            onClick={startTest}
            className="w-full py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest shadow-lg transition-all active:scale-95"
            style={{ backgroundColor: tierColor }}
          >
            Start Test
          </button>
        </div>
      </div>
    );
  }

  // Results state
  if (state === 'results' && results) {
    const passed = results.passed;

    return (
      <div className="h-full flex flex-col items-center p-8 bg-[var(--bg-primary)] overflow-y-auto">
        <div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-xl text-center max-w-md w-full border border-[var(--border-color)]">
          <div
            className={`w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center ${
              passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-amber-50 dark:bg-amber-900/20'
            }`}
          >
            {passed ? (
              <ICONS.Check className="w-12 h-12 text-green-500" />
            ) : (
              <ICONS.RefreshCw className="w-12 h-12 text-amber-500" />
            )}
          </div>

          <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">
            {passed ? 'Congratulations!' : 'Keep Practicing!'}
          </h2>

          <p className="text-[var(--text-secondary)] mb-6">
            {passed
              ? results.newLevel
                ? `You've advanced to ${results.newLevel}!`
                : 'You passed the test!'
              : `You scored ${results.score}%. You need 80% to pass.`}
          </p>

          {/* Show warning if level update failed */}
          {passed && results.levelUpdateError && (
            <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-amber-700 dark:text-amber-400 text-sm">
              {results.levelUpdateError}
            </div>
          )}

          <div className="text-6xl font-black mb-6" style={{ color: passed ? '#10B981' : '#F59E0B' }}>
            {results.score}%
          </div>

          <div className="bg-[var(--bg-primary)] rounded-2xl p-4 mb-6">
            <div className="flex justify-between text-sm">
              <span className="text-[var(--text-secondary)]">Correct answers</span>
              <span className="font-bold text-[var(--text-primary)]">{results.correctAnswers} / {results.totalQuestions}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => navigate('/progress')}
              className="flex-1 py-4 rounded-2xl font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] text-sm"
            >
              Back to Progress
            </button>
            {!passed && (
              <button
                onClick={() => generateTest(fromLevel, toLevel)}
                className="flex-1 py-4 rounded-2xl font-bold text-white text-sm"
                style={{ backgroundColor: tierColor }}
              >
                Try Again
              </button>
            )}
          </div>

          {/* View Full Results */}
          <button
            onClick={() => navigate('/progress')}
            className="mt-6 text-sm text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors flex items-center justify-center gap-2 w-full"
          >
            <ICONS.List className="w-4 h-4" />
            View detailed results on Progress
            <ICONS.ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // In progress state
  if (state === 'in_progress' || state === 'submitting') {
    return (
      <div className="h-full flex flex-col p-6 bg-[var(--bg-primary)]">
        {/* Header */}
        <div className="max-w-xl mx-auto w-full mb-6">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => navigate('/progress')}
              className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
            >
              <ICONS.X className="w-6 h-6" />
            </button>
            <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
              {currentIndex + 1} / {questions.length}
            </span>
            <div className="w-6" /> {/* Spacer for centering */}
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-[var(--bg-primary)] rounded-full overflow-hidden">
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${progress}%`, backgroundColor: tierColor }}
            />
          </div>
        </div>

        {/* Question Card */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-[var(--bg-card)] p-8 rounded-[2.5rem] shadow-lg max-w-xl w-full border border-[var(--border-color)]">
            {/* Question type badge */}
            <div className="flex justify-between items-center mb-6">
              <span
                className="text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full"
                style={{ backgroundColor: `${tierColor}15`, color: tierColor }}
              >
                {currentQuestion?.type === 'multiple_choice' && 'Multiple Choice'}
                {currentQuestion?.type === 'fill_blank' && 'Fill in the Blank'}
                {currentQuestion?.type === 'translation' && 'Translation'}
              </span>
              {currentQuestion?.isCore && (
                <span className="text-[9px] font-bold text-[var(--text-secondary)] uppercase tracking-widest">
                  Core Concept
                </span>
              )}
            </div>

            {/* Question text */}
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-8 leading-relaxed">
              {currentQuestion?.question}
            </h3>

            {/* Answer input based on question type */}
            {currentQuestion?.type === 'multiple_choice' && currentQuestion.options && (
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleAnswer(option)}
                    className={`w-full p-4 rounded-2xl text-left font-medium transition-all border-2 ${
                      currentAnswer === option
                        ? 'border-[var(--accent-color)] bg-[var(--accent-light)] text-[var(--accent-text)]'
                        : 'border-[var(--border-color)] hover:border-[var(--text-secondary)] text-[var(--text-primary)]'
                    }`}
                  >
                    <span className="text-xs font-bold text-[var(--text-secondary)] mr-3">
                      {String.fromCharCode(65 + idx)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            )}

            {(currentQuestion?.type === 'fill_blank' || currentQuestion?.type === 'translation') && (
              <div>
                {currentQuestion.context && (
                  <p className="text-[var(--text-secondary)] text-sm mb-4 italic">{currentQuestion.context}</p>
                )}
                <input
                  type="text"
                  value={currentAnswer}
                  onChange={(e) => handleAnswer(e.target.value)}
                  placeholder={
                    currentQuestion.type === 'fill_blank'
                      ? 'Type the missing word...'
                      : 'Type your translation...'
                  }
                  className="w-full p-4 rounded-2xl border-2 border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none text-lg font-medium bg-[var(--bg-primary)] text-[var(--text-primary)]"
                  autoFocus
                />
              </div>
            )}

            {/* Navigation */}
            <div className="flex gap-3 mt-8">
              {currentIndex > 0 && (
                <button
                  onClick={prevQuestion}
                  className="px-6 py-3 rounded-xl font-bold text-[var(--text-primary)] bg-[var(--bg-primary)] text-sm"
                >
                  Back
                </button>
              )}
              <button
                onClick={nextQuestion}
                disabled={!currentAnswer || state === 'submitting'}
                className="flex-1 py-4 rounded-2xl font-black text-white text-sm uppercase tracking-widest disabled:opacity-50 transition-all"
                style={{ backgroundColor: tierColor }}
              >
                {state === 'submitting' ? (
                  'Submitting...'
                ) : currentIndex === questions.length - 1 ? (
                  'Submit Test'
                ) : (
                  'Next'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default LevelTest;
