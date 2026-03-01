import React from 'react';
import { haptics } from '../../../services/haptics';

// Static color map - Tailwind needs complete class names at build time
// 'accent' and 'secondary' use CSS custom properties so they adapt to the user's theme
const colorClasses: Record<string, { bg: string; borderHover: string }> = {
  'accent': { bg: 'bg-[var(--accent-light)]', borderHover: 'hover:border-[var(--accent-border)]' },
  'secondary': { bg: 'bg-[var(--secondary-light)]', borderHover: 'hover:border-[var(--secondary-border)]' },
  'gray-500': { bg: 'bg-gray-500/20', borderHover: 'hover:border-gray-500/30' },
};

interface GameModeCardProps {
  /** Emoji icon for the game mode */
  icon: string;
  /** Display name */
  title: string;
  /** Short description (shown on desktop) */
  description?: string;
  /** Accent color key (e.g., 'purple-500', 'blue-500', 'accent') */
  accentColor?: string;
  /** Whether the mode is disabled */
  disabled?: boolean;
  /** Optional badge text (e.g., "Beta") */
  badge?: string;
  /** Click handler */
  onClick: () => void;
}

/**
 * Individual game mode card used in the mode selector grid.
 * Responsive design: compact on mobile, expanded on desktop.
 */
export const GameModeCard: React.FC<GameModeCardProps> = ({
  icon,
  title,
  description,
  accentColor = 'gray-500',
  disabled = false,
  badge,
  onClick,
}) => {
  // Get complete class names from map (dynamic interpolation doesn't work with Tailwind)
  const colors = colorClasses[accentColor] ?? colorClasses['gray-500'];
  const bgColorClass = colors.bg;
  const borderHoverClass = colors.borderHover;

  return (
    <button
      onClick={() => { haptics.trigger('selection'); onClick(); }}
      disabled={disabled}
      className={`group p-3 md:p-6 glass-card rounded-xl md:rounded-2xl hover:shadow-md transition-all text-left relative disabled:opacity-50 disabled:cursor-not-allowed ${
        !disabled ? borderHoverClass : ''
      }`}
    >
      {badge && (
        <div className="absolute top-1.5 right-1.5 md:top-3 md:right-3 px-1.5 md:px-2 py-0.5 bg-[var(--secondary-light)] text-[var(--secondary-color)] text-[7px] md:text-[9px] font-black uppercase tracking-wider rounded-full">
          {badge}
        </div>
      )}
      <div className="flex flex-col md:flex-row items-center md:items-start gap-2 md:gap-4">
        <div
          className={`w-10 h-10 md:w-14 md:h-14 ${bgColorClass} rounded-xl md:rounded-2xl flex items-center justify-center text-xl md:text-3xl group-hover:scale-110 transition-transform`}
        >
          {icon}
        </div>
        <div className="flex-1 text-center md:text-left">
          <h3 className="text-scale-label md:text-scale-body font-black font-header text-[var(--text-primary)] mb-0.5 md:mb-1">
            {title}
          </h3>
          {description && (
            <p className="text-[10px] md:text-scale-label text-[var(--text-secondary)] hidden md:block">
              {description}
            </p>
          )}
        </div>
      </div>
    </button>
  );
};

export default GameModeCard;
