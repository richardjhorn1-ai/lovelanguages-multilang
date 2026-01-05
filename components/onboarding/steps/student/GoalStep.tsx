import React, { useState } from 'react';
import { OnboardingStep, NextButton } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

interface GoalStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialValue?: string;
  onNext: (goal: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

const GOAL_OPTIONS = [
  { id: 'love', label: 'Say "I love you" perfectly', emoji: '💕' },
  { id: 'phrases', label: 'Learn 10 romantic phrases', emoji: '💬' },
  { id: 'surprise', label: 'Surprise them with a Polish greeting', emoji: '🎁' },
  { id: 'custom', label: 'Set my own goal', emoji: '✏️' },
];

export const GoalStep: React.FC<GoalStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  initialValue = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const [selected, setSelected] = useState(initialValue || '');
  const [customGoal, setCustomGoal] = useState('');

  const handleNext = () => {
    if (selected === 'custom' && customGoal.trim()) {
      onNext(customGoal.trim());
    } else if (selected && selected !== 'custom') {
      const option = GOAL_OPTIONS.find(o => o.id === selected);
      onNext(option?.label || selected);
    }
  };

  const canContinue = selected && (selected !== 'custom' || customGoal.trim());

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div className="w-16 h-16 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-6">
          <ICONS.Target className="w-8 h-8 text-amber-500" />
        </div>
        <h1 className="text-3xl font-black text-gray-800 mb-3 font-header">
          What's your first milestone?
        </h1>
        <p className="text-gray-500">
          A goal to work toward with {partnerName}
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {GOAL_OPTIONS.map((option) => (
          <button
            key={option.id}
            onClick={() => setSelected(option.id)}
            className={`w-full p-4 rounded-2xl border-2 transition-all flex items-center gap-4 ${
              selected === option.id
                ? 'border-amber-300 bg-amber-50'
                : 'border-gray-100 bg-white hover:border-gray-200'
            }`}
          >
            <span className="text-2xl">{option.emoji}</span>
            <span className={`font-bold text-left ${selected === option.id ? 'text-amber-700' : 'text-gray-700'}`}>
              {option.label}
            </span>
          </button>
        ))}
      </div>

      {selected === 'custom' && (
        <div className="mb-6 animate-fadeIn">
          <input
            type="text"
            value={customGoal}
            onChange={(e) => setCustomGoal(e.target.value)}
            placeholder={`e.g., "Order in Polish at their favorite restaurant"`}
            autoFocus
            className="w-full px-5 py-4 rounded-xl bg-white border-2 border-gray-100 focus:border-amber-200 focus:outline-none text-gray-800 placeholder:text-gray-300 transition-all"
          />
        </div>
      )}

      <NextButton
        onClick={handleNext}
        disabled={!canContinue}
        accentColor={accentColor}
      />

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn { animation: fadeIn 0.2s ease-out; }
      `}</style>
    </OnboardingStep>
  );
};
