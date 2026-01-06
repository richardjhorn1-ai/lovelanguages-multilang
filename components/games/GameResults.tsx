import React from 'react';

interface GameResultsProps {
  correct: number;
  incorrect: number;
  tierColor: string;
  onPlayAgain: () => void;
  onExit?: () => void;
}

const GameResults: React.FC<GameResultsProps> = ({
  correct,
  incorrect,
  tierColor,
  onPlayAgain,
  onExit
}) => {
  const total = correct + incorrect;
  const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="h-full flex flex-col items-center justify-center p-8 bg-[var(--bg-primary)]">
      <div className="bg-[var(--bg-card)] p-12 rounded-[3rem] shadow-2xl text-center max-w-sm w-full border border-[var(--border-color)]">
        <h2 className="text-3xl font-black text-[var(--text-primary)] mb-2">Great Job!</h2>
        <div className="text-6xl my-8">
          {correct >= incorrect ? '🏆' : '💪'}
        </div>
        <p className="text-[var(--text-secondary)] font-medium mb-1">Session results:</p>
        <div className="flex justify-center gap-8 mb-8">
          <div className="text-center">
            <div className="text-4xl font-black text-green-500">{correct}</div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest">Correct</div>
          </div>
          <div className="text-center">
            <div className="text-4xl font-black text-red-400">{incorrect}</div>
            <div className="text-[10px] uppercase font-bold text-[var(--text-secondary)] tracking-widest">Missed</div>
          </div>
        </div>
        <div className="text-2xl font-black mb-8" style={{ color: tierColor }}>
          {percentage}%
        </div>
        <div className="flex gap-3">
          {onExit && (
            <button
              onClick={onExit}
              className="flex-1 py-4 border-2 border-[var(--border-color)] rounded-2xl font-bold text-[var(--text-secondary)] hover:bg-[var(--bg-primary)] active:scale-95 transition-all uppercase tracking-widest text-sm"
            >
              Done
            </button>
          )}
          <button
            onClick={onPlayAgain}
            className={`${onExit ? 'flex-1' : 'w-full'} text-white py-4 rounded-2xl font-bold shadow-lg hover:opacity-90 active:scale-95 transition-all uppercase tracking-widest text-sm`}
            style={{ backgroundColor: tierColor }}
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResults;
