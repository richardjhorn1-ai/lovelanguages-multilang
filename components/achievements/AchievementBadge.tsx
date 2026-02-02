import React from 'react';

interface AchievementBadgeProps {
  icon: string;
  name: string;
  description?: string;
  unlocked: boolean;
  unlockedAt?: string | null;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
  onClick?: () => void;
}

const AchievementBadge: React.FC<AchievementBadgeProps> = ({
  icon,
  name,
  description,
  unlocked,
  unlockedAt,
  size = 'md',
  showDetails = false,
  onClick,
}) => {
  const sizeClasses = {
    sm: 'w-10 h-10 text-lg',
    md: 'w-14 h-14 text-2xl',
    lg: 'w-20 h-20 text-4xl',
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className={`flex flex-col items-center gap-1 ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      {/* Badge circle */}
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all ${
          unlocked
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 shadow-lg shadow-amber-500/30'
            : 'bg-[var(--bg-primary)] border-2 border-dashed border-[var(--border-color)]'
        }`}
      >
        <span className={unlocked ? '' : 'grayscale opacity-40'}>
          {icon}
        </span>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="text-center mt-1">
          <p
            className={`text-scale-caption font-bold ${
              unlocked ? 'text-[var(--text-primary)]' : 'text-[var(--text-secondary)]'
            }`}
          >
            {name}
          </p>
          {description && (
            <p className="text-scale-micro text-[var(--text-secondary)] max-w-[120px]">
              {description}
            </p>
          )}
          {unlocked && unlockedAt && (
            <p className="text-scale-micro text-amber-600 dark:text-amber-400">
              {formatDate(unlockedAt)}
            </p>
          )}
        </div>
      )}
    </div>
  );
};

export default AchievementBadge;
