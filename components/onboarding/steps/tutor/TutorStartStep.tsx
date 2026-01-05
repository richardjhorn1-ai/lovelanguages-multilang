import React from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TutorStartStepProps {
  currentStep: number;
  totalSteps: number;
  userName: string;
  learnerName: string;
  onComplete: () => void;
  accentColor?: string;
}

export const TutorStartStep: React.FC<TutorStartStepProps> = ({
  currentStep,
  totalSteps,
  userName,
  learnerName,
  onComplete,
  accentColor = '#14B8A6'
}) => {
  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      canGoBack={false}
      accentColor={accentColor}
    >
      <div className="text-center">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200">
          <ICONS.Heart className="w-10 h-10 text-white fill-white" />
        </div>

        <h1 className="text-3xl font-black text-gray-800 mb-4 font-header">
          Ready to be {learnerName}'s guide, {userName}?
        </h1>

        <p className="text-xl text-gray-600 mb-8">
          Your language is a gift. Let's share it with love.
        </p>

        {/* What's unlocked */}
        <div className="bg-gray-50 rounded-2xl p-6 mb-8 text-left">
          <div className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-4">
            Your tutor toolkit:
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
                <ICONS.MessageCircle className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <span className="font-medium text-gray-700">Ask Cupid for teaching tips</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                <ICONS.TrendingUp className="w-4 h-4 text-amber-500" />
              </div>
              <span className="font-medium text-gray-700">Track {learnerName}'s progress</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                <ICONS.Gift className="w-4 h-4 text-purple-500" />
              </div>
              <span className="font-medium text-gray-700">Send word gifts to surprise them</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-teal-100 flex items-center justify-center">
                <ICONS.Users className="w-4 h-4 text-teal-500" />
              </div>
              <span className="font-medium text-gray-700">Link accounts to see their journey</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={onComplete}
          accentColor={accentColor}
        >
          Start helping {learnerName}! 🎯
        </NextButton>
      </div>
    </OnboardingStep>
  );
};
