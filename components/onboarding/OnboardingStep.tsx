import React, { useContext } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';
import { OnboardingContext } from './Onboarding';

// ============================================
// Shared Glass Design Constants
// ============================================

/** Glass card for main content areas (word cards, feature lists, summaries)
 *  No backdrop-filter — canvas elements sit on separate compositing layers
 *  that backdrop-filter can't capture, so it blocks hearts instead of blurring them.
 *  Semi-transparent background lets hearts show through naturally. */
export const ONBOARDING_GLASS: React.CSSProperties = {
  backgroundColor: 'rgba(255, 255, 255, 0.55)',
  border: '1px solid rgba(255, 255, 255, 0.6)',
  boxShadow: '0 8px 32px -8px rgba(0, 0, 0, 0.08)',
  borderRadius: '20px',
};

/** Selection button style (language, vibe, role cards) */
export const ONBOARDING_OPTION = (isSelected: boolean, accentColor: string): React.CSSProperties => ({
  backgroundColor: isSelected ? `${accentColor}15` : 'rgba(255, 255, 255, 0.4)',
  border: isSelected ? `2px solid ${accentColor}50` : '2px solid rgba(255, 255, 255, 0.6)',
  borderRadius: '16px',
  boxShadow: isSelected
    ? `0 4px 20px -4px ${accentColor}25`
    : '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
  transition: 'all 0.2s ease',
});

/** Glass input field style */
export const ONBOARDING_INPUT = (isFilled: boolean, accentColor: string): React.CSSProperties => ({
  backgroundColor: 'rgba(255, 255, 255, 0.4)',
  border: isFilled ? `2px solid ${accentColor}40` : '2px solid rgba(255, 255, 255, 0.4)',
  borderRadius: '16px',
  boxShadow: isFilled ? `0 0 0 3px ${accentColor}15` : '0 2px 8px -2px rgba(0, 0, 0, 0.04)',
});

interface OnboardingStepProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps: number;
  onBack?: () => void;
  canGoBack?: boolean;
  accentColor?: string;
  wide?: boolean; // Use wider container (for plan selection cards)
}

export const OnboardingStep: React.FC<OnboardingStepProps> = ({
  children,
  currentStep,
  totalSteps,
  onBack,
  canGoBack = true,
  accentColor = '#F9B0C9',
  wide = false
}) => {
  const { t } = useTranslation();
  // Get onQuit from context - no prop drilling needed
  const { onQuit } = useContext(OnboardingContext);
  const progress = (currentStep / totalSteps) * 100;

  // On step 1, back button goes back (to language confirmation) or quits; on other steps, it goes back
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else if (currentStep === 1 && onQuit) {
      onQuit();
    }
  };

  return (
    <div className="h-full flex flex-col relative z-10" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Progress bar */}
      <div className="w-full h-1.5 bg-white/30">
        <div
          className="h-full transition-all duration-500 ease-out rounded-r-full"
          style={{
            width: `${progress}%`,
            backgroundColor: accentColor,
            boxShadow: `0 0 8px ${accentColor}40`,
          }}
        />
      </div>

      {/* Header with back button, step counter, and quit button */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Back button - always shown */}
        {canGoBack && (onBack || onQuit) ? (
          <button
            onClick={handleBack}
            className="flex items-center gap-2 text-gray-400 hover:text-[var(--text-secondary)] transition-colors"
          >
            <ICONS.ChevronLeft className="w-5 h-5" />
            <span className="text-scale-label font-medium">{t('onboarding.step.back')}</span>
          </button>
        ) : (
          <div />
        )}

        {/* Step counter */}
        <span className="text-scale-caption font-bold text-gray-300 uppercase tracking-widest">
          {t('onboarding.step.counter', { current: currentStep, total: totalSteps })}
        </span>

        {/* Quit button */}
        {onQuit ? (
          <button
            onClick={onQuit}
            className="text-gray-400 hover:text-[var(--text-secondary)] transition-colors p-1"
            title={t('onboarding.step.quitTitle')}
          >
            <ICONS.X className="w-5 h-5" />
          </button>
        ) : (
          <div className="w-7" />
        )}
      </div>

      {/* Main content area - scrollable on mobile
           Removed min-h-full which was breaking iOS scroll calculation
           Added min-h-0 to fix flex container scroll on iOS Safari */}
      <div
        className="flex-1 overflow-y-auto overscroll-contain px-6 min-h-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
          paddingBottom: 'max(3rem, env(safe-area-inset-bottom, 0px))'
        }}
      >
        <div className={`w-full mx-auto py-8 animate-reveal ${wide ? 'max-w-4xl' : 'max-w-md'}`}>
          {children}
        </div>
      </div>

      {/* Custom animations */}
      <style>{`
        @keyframes reveal-up {
          from {
            opacity: 0;
            transform: translateY(24px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-reveal {
          animation: reveal-up 0.5s ease-out both;
        }
        .animate-fadeIn {
          animation: reveal-up 0.5s ease-out both;
        }
        .stagger-1 { animation-delay: 0.05s; }
        .stagger-2 { animation-delay: 0.1s; }
        .stagger-3 { animation-delay: 0.15s; }
        .stagger-4 { animation-delay: 0.2s; }
        .stagger-5 { animation-delay: 0.25s; }
        .stagger-6 { animation-delay: 0.3s; }
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
  accentColor = '#F9B0C9'
}) => {
  const { t } = useTranslation();
  const buttonText = children || t('onboarding.step.continue');

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-4 rounded-2xl text-white font-bold text-scale-heading transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-105"
      style={{
        backgroundColor: disabled ? '#ccc' : accentColor,
        boxShadow: disabled ? 'none' : `0 8px 20px -4px ${accentColor}40`,
      }}
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
      className="mt-4 text-gray-400 text-scale-label font-medium hover:text-[var(--text-secondary)] transition-colors"
    >
      {buttonText}
    </button>
  );
};
