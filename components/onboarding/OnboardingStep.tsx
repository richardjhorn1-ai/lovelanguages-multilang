import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { OnboardingContext } from './Onboarding';

interface OnboardingStepProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  canGoBack?: boolean;
  accentColor?: string;
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  children,
  currentStep,
  totalSteps,
  onBack,
  canGoBack = true,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  // Get onQuit from context - no prop drilling needed
  const { onQuit } = useContext(OnboardingContext);
  const progress = (currentStep / totalSteps) * 100;

  // On step 1, back button quits; on other steps, it goes back
  const handleBack = () => {
    if (currentStep === 1 && onQuit) {
      onQuit();
    } else if (onBack) {
      onBack();
    }
  };

  return (
    <div className="min-h-screen flex flex-col relative z-10">
      {/* Progress bar */}
      <div className="w-full h-1 bg-gray-100">
        <div
          className="h-full transition-all duration-500 ease-out"
          style={{ width: `${progress}%`, backgroundColor: accentColor }}
        />
      </div>

      {/* Header with back button, step counter, and quit button */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Back button - always shown */}
        {canGoBack && (onBack || onQuit) ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ICONS.ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">{t('onboarding.step.back')}</span>
          </button>
        ) : (
          <div />
        )}

        {/* Step counter */}
        <span className="text-xs font-bold text-gray-300 uppercase tracking-widest">
          {t('onboarding.step.counter', { current: currentStep, total: totalSteps })}
        </span>

        {/* Quit button */}
        {onQuit ? (
          <button
            onClick={onQuit}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1"
            title={t('onboarding.step.quitTitle')}
          >
            <ICONS.X className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* Main content area with animation */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-12 animate-fadeIn">
        <div className="w-full max-w-md">
          {children}
        </div>
      </div>

      {/* Custom animation */}
      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

// Reusable button for moving to next step
interface NextButtonProps {
  onClick: () => void;
  disabled?: boolean;
  children?: React.ReactNode;
  accentColor?: string;
}

export const NextButton: React.FC<NextButtonProps> = ({
  onClick,
  disabled = false,
  children,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const buttonText = children || t('onboarding.step.continue');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ backgroundColor: disabled ? '#ccc' : accentColor }}
    >
      {buttonText}
    </button>
  );
};

// Skip button for optional steps
interface SkipButtonProps {
  onClick: () => void;
  children?: React.ReactNode;
}

export const SkipButton: React.FC<SkipButtonProps> = ({
  onClick,
  children
}) => {
  const { t } = useTranslation();
  const buttonText = children || t('onboarding.step.skipForNow');

  return (
    <button
      onClick={onClick}
      className="mt-4 text-gray-400 text-sm font-medium hover:text-gray-600 transition-colors"
    >
      {buttonText}
    </button>
  );
};
