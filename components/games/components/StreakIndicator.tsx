import React from 'react';
import { ICONS } from '../../../constants';

/** Default number of consecutive correct answers to mark as learned */
export const DEFAULT_STREAK_TO_LEARN = 5;

interface StreakIndicatorProps {
  /** Current streak count */
  streak: number;
  /** Target streak to complete (default: 5) */
  maxStreak?: number;
}

/**
 * Visual indicator showing progress toward mastering a word.
 * Shows current streak vs target (e.g., "3/5 🔥").
 * Hidden when streak is 0.
 */
export const StreakIndicator: React.FC<StreakIndicatorProps> = ({
  streak,
  maxStreak = DEFAULT_STREAK_TO_LEARN
}) => {
  if (streak === 0) return null;

  const isComplete = streak >= maxStreak;

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-bold ${
        isComplete
          ? 'bg-green-500/10 text-green-500'
          : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
      }`}
    >
      <span>
        {streak}/{maxStreak}
      </span>
      {isComplete ? <ICONS.Check className="w-3 h-3" /> : <ICONS.Zap className="w-3 h-3" />}
    </div>
  );
};

export default StreakIndicator;
