import React from 'react';
import { ICONS } from '../../../constants';

interface GameHeaderProps {
  /** Current score */
  score: {
    correct: number;
    incorrect: number;
  };
  /** Current progress (1-indexed) */
  currentIndex: number;
  /** Total items in session */
  totalItems: number;
  /** Accent color for progress bar */
  accentColor?: string;
  /** Handler for back/exit button */
  onExit: () => void;
}

/**
 * Header bar shown during active game sessions.
 * Displays back button, score counters, progress indicator, and progress bar.
 */
export const GameHeader: React.FC<GameHeaderProps> = ({
  score,
  currentIndex,
  totalItems,
  accentColor = 'var(--accent-color)',
  onExit,
}) => {
  const progress = totalItems > 0 ? (currentIndex / totalItems) * 100 : 0;

  return (
    <div className="w-full">
      {/* Stats Row */}
      <div className="flex items-center justify-between mb-2">
        {/* Back Button */}
        <button
          onClick={onExit}
          className="p-2 hover:bg-[var(--bg-card)] rounded-xl transition-colors"
        >
          <ICONS.ChevronLeft className="w-5 h-5 text-[var(--text-secondary)]" />
        </button>

        {/* Score Counters */}
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-scale-caption font-bold text-[var(--text-secondary)]">
              {score.correct}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-red-400" />
            <span className="text-scale-caption font-bold text-[var(--text-secondary)]">
              {score.incorrect}
            </span>
          </div>
        </div>

        {/* Progress Counter */}
        <span className="text-[10px] font-black text-[var(--text-secondary)] uppercase tracking-widest">
          {currentIndex} / {totalItems}
        </span>
      </div>

      {/* Progress Bar */}
      <div className="h-1.5 bg-[var(--border-color)] rounded-full overflow-hidden">
        <div
          className="h-full transition-all duration-500 rounded-full"
          style={{ width: `${progress}%`, backgroundColor: accentColor }}
        />
      </div>
    </div>
  );
};

export default GameHeader;
