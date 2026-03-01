import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../../constants';
import { haptics } from '../../../services/haptics';

interface StreakCelebrationModalProps {
  /** Whether to show the modal */
  show: boolean;
  /** The word that was just mastered */
  word?: string | null;
}

/**
 * Celebratory modal shown when a user masters a word (5 correct in a row).
 * Displays with animation and auto-dismisses (controlled by parent).
 */
export const StreakCelebrationModal: React.FC<StreakCelebrationModalProps> = ({
  show,
  word
}) => {
  const { t } = useTranslation();

  // Trigger celebration haptic when modal appears
  useEffect(() => {
    if (show) {
      haptics.trigger('perfect');
    }
  }, [show]);

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 shadow-2xl animate-pop-in text-center max-w-sm mx-4">
        <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center mx-auto mb-4">
          <ICONS.Trophy className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-black font-header text-white mb-2">
          {t('games.celebration.wordMastered', 'Word Mastered!')}
        </h2>
        {word && (
          <p className="text-white/90 font-bold text-lg mb-2">{word}</p>
        )}
        <p className="text-white/80 text-sm">
          {t('games.celebration.streakComplete', '5 correct in a row! This word is now learned!')}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {[ICONS.Star, ICONS.Star, ICONS.Sparkles, ICONS.Star, ICONS.Star].map((Icon, i) => (
            <span
              key={i}
              className="text-white/90 animate-sparkle"
              style={{ animationDelay: `${i * 150}ms` }}
            >
              <Icon className="w-6 h-6" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakCelebrationModal;
