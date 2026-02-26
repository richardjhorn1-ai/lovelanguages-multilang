import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';

interface CombinedNamesStepProps {
  currentStep: number;
  totalSteps: number;
  role: 'student' | 'tutor';
  initialUserName?: string;
  initialPartnerName?: string;
  onNext: (userName: string, partnerName: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const CombinedNamesStep: React.FC<CombinedNamesStepProps> = ({
  currentStep,
  totalSteps,
  role,
  initialUserName = '',
  initialPartnerName = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [userName, setUserName] = useState(initialUserName);
  const [partnerName, setPartnerName] = useState(initialPartnerName);
  const isStudent = role === 'student';

  const handleSubmit = () => {
    if (userName.trim() && partnerName.trim()) {
      onNext(userName.trim(), partnerName.trim());
    }
  };

  const canContinue = userName.trim().length > 0 && partnerName.trim().length > 0;

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-10">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Users className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.names.title', 'Let\'s get personal')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {isStudent
            ? t('onboarding.names.studentSubtitle', 'We\'ll personalize your learning experience')
            : t('onboarding.names.tutorSubtitle', 'We\'ll personalize the teaching experience')
          }
        </p>
      </div>

      <div className="space-y-5">
        {/* Your name */}
        <div>
          <label
            className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-2 ml-1"
            style={{ color: '#9ca3af' }}
          >
            {t('onboarding.names.yourName', 'Your name')}
          </label>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            placeholder={t('onboarding.name.placeholder')}
            autoFocus
            className="w-full px-6 py-4 focus:outline-none text-scale-heading font-medium text-[var(--text-primary)] placeholder:text-gray-300 transition-all"
            style={ONBOARDING_INPUT(!!userName.trim(), accentColor)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && userName.trim()) {
                // Focus the next input
                const next = (e.target as HTMLInputElement).parentElement?.nextElementSibling?.querySelector('input');
                next?.focus();
              }
            }}
          />
        </div>

        {/* Partner / Learner name */}
        <div>
          <label
            className="block text-scale-micro font-black uppercase tracking-[0.2em] mb-2 ml-1"
            style={{ color: '#9ca3af' }}
          >
            {isStudent
              ? t('onboarding.names.partnerLabel', 'Who are you learning for?')
              : t('onboarding.names.learnerLabel', 'Who will you teach?')
            }
          </label>
          <input
            type="text"
            value={partnerName}
            onChange={(e) => setPartnerName(e.target.value)}
            placeholder={isStudent
              ? t('onboarding.names.partnerPlaceholder', 'Their name')
              : t('onboarding.names.learnerPlaceholder', 'Learner\'s name')
            }
            className="w-full px-6 py-4 focus:outline-none text-scale-heading font-medium text-[var(--text-primary)] placeholder:text-gray-300 transition-all"
            style={ONBOARDING_INPUT(!!partnerName.trim(), accentColor)}
            onKeyDown={(e) => e.key === 'Enter' && canContinue && handleSubmit()}
          />
        </div>

        <NextButton
          onClick={handleSubmit}
          disabled={!canContinue}
          accentColor={accentColor}
        />
      </div>
    </OnboardingStep>
  );
};
