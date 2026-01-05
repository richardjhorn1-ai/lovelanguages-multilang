import React from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface StartStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  partnerName: string;
  onComplete: () => void;
  accentColor?: string;
}

export const StartStep: React.FC<StartStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  partnerName,
  onComplete,
  accentColor = '#FF4761'
}) => {
  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      canGoBack={false}
      accentColor={accentColor}
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--accent-color)] to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-[var(--accent-shadow)]">
          <ICONS.Heart className="w-10 h-10 text-white fill-white" />
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-4 font-header">
          Ready to begin, {userName}?
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Your journey to speak {partnerName}'s language starts now.
        </p>

        {/* What's unlocked */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            What you'll have access to:
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                <ICONS.MessageCircle className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <span className="font-medium text-gray-700">AI conversations with Cupid</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <ICONS.Book className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-medium text-gray-700">Your Love Log vocabulary tracker</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <ICONS.Play className="w-4 h-4 text-teal-500" />
              </div>
              <span className="font-medium text-gray-700">Games to practice and master words</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <ICONS.TrendingUp className="w-4 h-4 text-purple-500" />
              </div>
              <span className="font-medium text-gray-700">Progress tracking and level tests</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={onComplete}
          accentColor={accentColor}
        >
          Let's go! 🚀
        </NextButton>
      </div>
    </OnboardingStep>
  );
};
