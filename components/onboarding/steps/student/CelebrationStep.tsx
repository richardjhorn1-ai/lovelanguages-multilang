import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_GLASS } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../../../../constants/language-config';
import { sounds } from '../../../../services/sounds';

interface CelebrationStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const CelebrationStep: React.FC<CelebrationStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetLanguage, nativeLanguage } = useLanguage();
  const targetConfig = LANGUAGE_CONFIGS[targetLanguage];
  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];
  const targetName = targetConfig?.name || 'the language';

  // Get dynamic words
  const helloWord = targetConfig?.examples.hello || 'Hello';
  const helloTranslation = nativeConfig?.examples.hello || 'Hello';
  const lovePhrase = targetConfig?.examples.iLoveYou || 'I love you';
  const loveTranslation = nativeConfig?.examples.iLoveYou || 'I love you';

  const [showConfetti, setShowConfetti] = useState(true);
  const [xpAnimated, setXpAnimated] = useState(false);

  useEffect(() => {
    // Play celebration sound
    sounds.play('perfect');
    // Trigger XP animation after a short delay
    const timer = setTimeout(() => setXpAnimated(true), 500);
    // Hide confetti after animation
    const confettiTimer = setTimeout(() => setShowConfetti(false), 3000);
    return () => {
      clearTimeout(timer);
      clearTimeout(confettiTimer);
    };
  }, []);

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      canGoBack={false}
      accentColor={accentColor}
    >
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                backgroundColor: ['#FF4761', '#FFD700', '#4ECDC4', '#FF6B6B', '#9B59B6'][Math.floor(Math.random() * 5)]
              }}
            />
          ))}
        </div>
      )}

      <div className="text-center">
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.Trophy className="w-10 h-10" style={{ color: accentColor }} />
        </div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-4 font-header">
          {t('onboarding.student.celebration.title')}
        </h1>

        <p className="text-xl text-[var(--text-secondary)] mb-8">
          {t('onboarding.student.celebration.subtitle', { language: targetName })}<br />
          <span style={{ color: accentColor }} className="font-bold">{t('onboarding.student.celebration.partnerReaction', { name: partnerName })}</span>
        </p>

        {/* XP Award */}
        <div className={`inline-flex items-center gap-3 px-6 py-3 transition-all duration-500 ${
          xpAnimated ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`} style={{ backgroundColor: 'rgba(255, 191, 0, 0.15)', border: '1px solid rgba(255,191,0,0.3)', borderRadius: '9999px' }}>
          <ICONS.Star className="w-6 h-6 text-amber-500" />
          <span className="font-black text-amber-700 text-scale-heading">{t('onboarding.student.celebration.xpEarned')}</span>
        </div>

        <div className="mt-4 mb-8 text-gray-400 text-scale-label">
          {t('onboarding.student.celebration.firstXp')}
        </div>

        {/* Words learned summary */}
        <div className="p-6 mb-8" style={ONBOARDING_GLASS}>
          <div className="text-scale-label text-[var(--text-secondary)] mb-3">{t('onboarding.student.celebration.wordsLearned')}</div>
          <div className="flex justify-center gap-4">
            <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
              <span style={{ color: accentColor }} className="font-bold">{helloWord}</span>
              <span className="text-gray-400 text-scale-label ml-2">{helloTranslation}</span>
            </div>
            <div className="px-4 py-2" style={{ backgroundColor: 'rgba(255,255,255,0.4)', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.6)' }}>
              <span style={{ color: accentColor }} className="font-bold">{lovePhrase}</span>
              <span className="text-gray-400 text-scale-label ml-2">{loveTranslation}</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={onNext}
          accentColor={accentColor}
        >
          {t('onboarding.student.celebration.keepGoing')}
        </NextButton>
      </div>

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
          width: 10px;
          height: 10px;
          animation: confetti 3s ease-out forwards;
        }
      `}</style>
    </OnboardingStep>
  );
};
