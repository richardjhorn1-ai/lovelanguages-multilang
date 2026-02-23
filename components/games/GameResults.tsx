import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

interface AnswerWithExplanation {
  wordText: string;
  userAnswer?: string;
  correctAnswer: string;
  isCorrect: boolean;
  explanation?: string;
}

interface GameResultsProps {
  correct: number;
  incorrect: number;
  tierColor: string;
  onPlayAgain: () => void;
  onExit?: () => void;
  answers?: AnswerWithExplanation[];
}

const GameResults: React.FC<GameResultsProps> = ({
  correct,
  incorrect,
  tierColor,
  onPlayAgain,
  onExit,
  answers
}) => {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  // Filter to answers with interesting explanations (not exact match or basic no match)
  const answersWithExplanations = answers?.filter(a =>
    a.explanation && a.explanation !== 'Exact match' && a.explanation !== 'No match'
  ) || [];

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="glass-card p-8 md:p-12 rounded-[3rem] text-center max-w-sm w-full">
        <h2 className="text-3xl font-black font-header text-[var(--text-primary)] mb-2">{t('gameResults.greatJob')}</h2>
        <div className="my-8">
          {correct >= incorrect ? <ICONS.Trophy className="w-16 h-16 mx-auto text-amber-500" /> : <ICONS.TrendingUp className="w-16 h-16 mx-auto text-teal-500" />}
        </div>
        <p className="text-[var(--text-secondary)] font-medium mb-1">{t('gameResults.sessionResults')}</p>
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-black text-green-500">{correct}</div>
            <div className="text-scale-micro uppercase font-bold text-[var(--text-secondary)] tracking-widest">{t('gameResults.correct')}</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-red-400">{incorrect}</div>
            <div className="text-scale-micro uppercase font-bold text-[var(--text-secondary)] tracking-widest">{t('gameResults.missed')}</div>
          </div>
        </div>
        <div className="text-2xl font-black mb-6" style={{ color: tierColor }}>
          {percentage}%
        </div>

        {/* Answer Details (collapsible) */}
        {answersWithExplanations.length > 0 && (
          <div className="mb-6">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex items-center justify-center gap-2 w-full text-scale-label text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
            >
              <span>{showDetails ? t('gameResults.hideDetails') : t('gameResults.showDetails')}</span>
              <ICONS.ChevronDown className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
            </button>
            {showDetails && (
              <div className="mt-3 space-y-2 max-h-48 overflow-y-auto text-left">
                {answersWithExplanations.map((answer, idx) => (
                  <div
                    key={idx}
                    className={`p-2 rounded-lg text-scale-caption ${
                      answer.isCorrect
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    <div className="flex items-center gap-1 font-bold">
                      {answer.isCorrect ? <ICONS.Check className="w-3 h-3" /> : <ICONS.X className="w-3 h-3" />}
                      <span>{answer.wordText}</span>
                    </div>
                    <div className="mt-0.5 opacity-80">
                      {answer.userAnswer} → {answer.correctAnswer}
                    </div>
                    <div className="mt-0.5 italic opacity-70">{answer.explanation}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="flex-1 py-4 border-2 border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] active:scale-95 transition-all uppercase tracking-widest text-scale-label"
            >
              {t('gameResults.done')}
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className={`${onExit ? 'flex-1' : 'w-full'} text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest text-scale-label`}
            style={{ backgroundColor: tierColor }}
          >
            {t('gameResults.playAgain')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
