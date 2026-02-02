import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { sounds } from '../../services/sounds';
import { haptics } from '../../services/haptics';

interface UnlockedAchievement {
  code: string;
  name: string;
  description: string;
  icon: string;
  xp_reward: number;
}

interface AchievementUnlockModalProps {
  achievements: UnlockedAchievement[];
  onClose: () => void;
}

const AchievementUnlockModal: React.FC<AchievementUnlockModalProps> = ({
  achievements,
  onClose,
}) => {
  const { t } = useTranslation();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showConfetti, setShowConfetti] = useState(true);

  const current = achievements[currentIndex];
  const hasMore = currentIndex < achievements.length - 1;

  useEffect(() => {
    // Play celebration sound and haptic
    sounds.play('notification');
    haptics.trigger('correct');
  }, [currentIndex]);

  // Auto-hide confetti after animation
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 2000);
    return () => clearTimeout(timer);
  }, [currentIndex]);

  const handleNext = () => {
    if (hasMore) {
      setCurrentIndex(currentIndex + 1);
      setShowConfetti(true);
    } else {
      onClose();
    }
  };

  if (!current) return null;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-3 h-3 animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#FFD700', '#FF69B4', '#00CED1', '#FF6347', '#9370DB'][i % 5],
                animationDelay: `${Math.random() * 0.5}s`,
                borderRadius: Math.random() > 0.5 ? '50%' : '0',
              }}
            />
          ))}
        </div>
      )}

      <div className="bg-[var(--bg-card)] rounded-[2rem] max-w-sm w-full shadow-2xl overflow-hidden animate-in zoom-in duration-300">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white text-center relative">
          <div className="absolute top-4 right-4">
            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
            >
              <ICONS.X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-amber-100 text-scale-micro font-black uppercase tracking-widest mb-2">
            {t('achievements.unlocked', 'Achievement Unlocked!')}
          </p>
          <div className="text-6xl mb-2 animate-bounce">{current.icon}</div>
          <h2 className="text-scale-heading font-black">{current.name}</h2>
        </div>

        {/* Content */}
        <div className="p-6 text-center">
          <p className="text-[var(--text-secondary)] text-scale-label mb-4">
            {current.description}
          </p>

          {current.xp_reward > 0 && (
            <div className="inline-flex items-center gap-2 bg-amber-100 dark:bg-amber-900/30 px-4 py-2 rounded-full mb-4">
              <ICONS.Star className="w-5 h-5 text-amber-500" />
              <span className="font-black text-amber-600 dark:text-amber-400">
                +{current.xp_reward} XP
              </span>
            </div>
          )}

          {/* Progress indicator for multiple achievements */}
          {achievements.length > 1 && (
            <div className="flex justify-center gap-2 mb-4">
              {achievements.map((_, i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full transition-all ${
                    i === currentIndex
                      ? 'bg-amber-500 w-4'
                      : i < currentIndex
                      ? 'bg-amber-300'
                      : 'bg-[var(--border-color)]'
                  }`}
                />
              ))}
            </div>
          )}

          <button
            onClick={handleNext}
            className="w-full bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3 rounded-xl font-bold text-scale-label active:scale-95 transition-transform"
          >
            {hasMore
              ? t('achievements.next', 'Next Achievement')
              : t('achievements.awesome', 'Awesome!')}
          </button>
        </div>
      </div>

      {/* CSS for confetti animation */}
      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti 2.5s ease-in-out forwards;
        }
      `}</style>
    </div>
  );
};

export default AchievementUnlockModal;
