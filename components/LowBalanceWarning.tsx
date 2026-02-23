import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { ICONS } from '../constants';

interface LowBalanceWarningProps {
  remaining: number;
  limitType: string;
  threshold?: number; // default 5
  onDismiss?: () => void;
}

const LowBalanceWarning: React.FC<LowBalanceWarningProps> = ({
  remaining,
  limitType,
  threshold = 5,
  onDismiss
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // Show warning when remaining is at threshold or at 1
  useEffect(() => {
    if (isDismissed) return;

    if (remaining <= 1 || remaining <= threshold) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }
  }, [remaining, threshold, isDismissed]);

  const handleDismiss = () => {
    setIsDismissed(true);
    setIsVisible(false);
    onDismiss?.();
  };

  const handleUpgrade = () => {
    navigate('/pricing');
  };

  if (!isVisible) return null;

  const isUrgent = remaining <= 1;

  return (
    <div
      className={`fixed bottom-4 right-4 max-w-sm p-4 rounded-2xl shadow-lg z-40 transition-all duration-300 ${
        isUrgent
          ? 'bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-600'
          : 'glass-card'
      }`}
      role="alert"
      aria-live="polite"
    >
      <div className="flex items-start gap-3">
        <span className="flex-shrink-0">
          {isUrgent ? <ICONS.AlertTriangle className="w-6 h-6 text-amber-500" /> : <ICONS.Lightbulb className="w-6 h-6 text-[var(--accent-color)]" />}
        </span>

        <div className="flex-1 min-w-0">
          <p className={`font-bold text-scale-label ${
            isUrgent
              ? 'text-amber-800 dark:text-amber-200'
              : 'text-[var(--text-primary)]'
          }`}>
            {t('limits.warningLow', { count: remaining })}
          </p>

          <p className={`text-scale-caption mt-1 ${
            isUrgent
              ? 'text-amber-700 dark:text-amber-300'
              : 'text-[var(--text-secondary)]'
          }`}>
            {t('limits.remaining', { count: remaining })} {limitType}
          </p>

          <button
            onClick={handleUpgrade}
            className="mt-2 text-scale-caption font-bold text-[var(--accent-color)] hover:underline"
          >
            {t('limits.upgrade')} →
          </button>
        </div>

        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
          aria-label={t('common.close')}
        >
          <ICONS.X className="w-4 h-4 text-[var(--text-secondary)]" />
        </button>
      </div>
    </div>
  );
};

export default LowBalanceWarning;
