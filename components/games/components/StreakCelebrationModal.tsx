import React from 'react';
import { useTranslation } from 'react-i18next';

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

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
      <div className="bg-gradient-to-br from-green-400 to-emerald-500 rounded-3xl p-8 shadow-2xl animate-bounce text-center max-w-sm mx-4">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-black text-white mb-2">
          {t('games.celebration.wordMastered', 'Word Mastered!')}
        </h2>
        {word && (
          <p className="text-white/90 font-bold text-lg mb-2">{word}</p>
        )}
        <p className="text-white/80 text-sm">
          {t('games.celebration.streakComplete', '5 correct in a row! This word is now learned! 🎓')}
        </p>
        <div className="mt-4 flex justify-center gap-2">
          {['🌟', '⭐', '✨', '💫', '🌟'].map((star, i) => (
            <span
              key={i}
              className="text-2xl animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            >
              {star}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default StreakCelebrationModal;
