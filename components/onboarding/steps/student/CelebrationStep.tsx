import React, { useEffect, useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';

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
  const [showConfetti, setShowConfetti] = useState(true);
  const [xpAnimated, setXpAnimated] = useState(false);

  useEffect(() => {
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
        <div className="text-8xl mb-6 animate-bounce">🎉</div>

        <h1 className="text-3xl font-black text-gray-800 mb-4 font-header">
          You did it!
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          You just learned your first Polish!<br />
          <span style={{ color: accentColor }} className="font-bold">{partnerName}</span> is going to love this.
        </p>

        {/* XP Award */}
        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full bg-amber-100 transition-all duration-500 ${
          xpAnimated ? 'scale-100 opacity-100' : 'scale-75 opacity-0'
        }`}>
          <span className="text-2xl">⭐</span>
          <span className="font-black text-amber-700 text-lg">+10 XP</span>
        </div>

        <div className="mt-4 mb-8 text-gray-400 text-sm">
          Your first experience points!
        </div>

        {/* Words learned summary */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8">
          <div className="text-sm text-gray-500 mb-3">Words you just learned:</div>
          <div className="flex justify-center gap-4">
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
              <span style={{ color: accentColor }} className="font-bold">Cześć</span>
              <span className="text-gray-400 text-sm ml-2">Hello</span>
            </div>
            <div className="bg-white px-4 py-2 rounded-xl shadow-sm">
              <span style={{ color: accentColor }} className="font-bold">Kocham cię</span>
              <span className="text-gray-400 text-sm ml-2">I love you</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={onNext}
          accentColor={accentColor}
        >
          Keep going!
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
