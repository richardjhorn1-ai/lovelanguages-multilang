import React from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface TutorPreviewStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TutorPreviewStep: React.FC<TutorPreviewStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  onNext,
  onBack,
  accentColor = '#14B8A6'
}) => {
  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-teal-200">
          <ICONS.Sparkles className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          Your teaching toolkit
        </h1>
        <p className="text-gray-500">
          Here's what you can do for {learnerName}
        </p>
      </div>

      <div className="space-y-4 mb-8">
        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
            <ICONS.MessageCircle className="w-5 h-5 text-[var(--accent-color)]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Coach Mode</h3>
            <p className="text-sm text-gray-500">Get personalized tips on helping {learnerName} based on their progress and struggles</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
            <ICONS.TrendingUp className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Progress Tracking</h3>
            <p className="text-sm text-gray-500">See which words {learnerName} has mastered and where they need help</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border-2 border-gray-100 flex items-start gap-4">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <ICONS.Gift className="w-5 h-5 text-purple-500" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">Word Gifts</h3>
            <p className="text-sm text-gray-500">Send special words and phrases to {learnerName}'s learning log</p>
          </div>
        </div>
      </div>

      <NextButton onClick={onNext} accentColor={accentColor}>
        Sounds great!
      </NextButton>
    </OnboardingStep>
  );
};
