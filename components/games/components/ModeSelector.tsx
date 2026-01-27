import React from 'react';
import { GameModeCard } from './GameModeCard';

export interface GameModeConfig {
  /** Unique identifier for the game mode */
  id: string;
  /** Emoji icon */
  icon: string;
  /** Display name */
  title: string;
  /** Short description */
  description?: string;
  /** Accent color for styling (e.g., 'purple-500') */
  accentColor?: string;
  /** Whether the mode is disabled */
  disabled?: boolean;
  /** Optional badge (e.g., "Beta") */
  badge?: string;
}

interface ModeSelectorProps {
  /** Array of game mode configurations */
  modes: GameModeConfig[];
  /** Handler called when a mode is selected */
  onSelectMode: (modeId: string) => void;
  /** Optional class name for the grid container */
  className?: string;
}

/**
 * Grid of game mode cards for selecting which game to play.
 * Responsive: 2 columns on all screen sizes.
 */
export const ModeSelector: React.FC<ModeSelectorProps> = ({
  modes,
  onSelectMode,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-2 gap-2 md:gap-4 ${className}`}>
      {modes.map((mode) => (
        <GameModeCard
          key={mode.id}
          icon={mode.icon}
          title={mode.title}
          description={mode.description}
          accentColor={mode.accentColor}
          disabled={mode.disabled}
          badge={mode.badge}
          onClick={() => onSelectMode(mode.id)}
        />
      ))}
    </div>
  );
};

export default ModeSelector;
