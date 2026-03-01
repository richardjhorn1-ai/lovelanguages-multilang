import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, SkipButton, ONBOARDING_GLASS, ONBOARDING_OPTION, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';

// TODO: Future enhancements from COO spec:
// - Smart share: detect platform (WhatsApp/iMessage) and pre-write message with invite link
// - Invite reminder: 24h/72h nudge if user skipped the invite step
// - A/B test invite placement: after celebration vs after personalization
// - Invite analytics: track generated, shared, opened, completed, time_to_accept

export type InviteIntent = { method: 'link' } | { method: 'email'; email: string };

interface InvitePartnerStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  onNext: (intent: InviteIntent | null) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const InvitePartnerStep: React.FC<InvitePartnerStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const [selectedMethod, setSelectedMethod] = useState<'link' | 'email' | null>(null);
  const [email, setEmail] = useState('');

  const handleContinue = () => {
    if (selectedMethod === 'link') {
      onNext({ method: 'link' });
    } else if (selectedMethod === 'email') {
      onNext({ method: 'email', email });
    }
  };

  const isValid = selectedMethod === 'link' || (selectedMethod === 'email' && email.includes('@') && email.includes('.'));

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center">
        {/* Icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6" style={{ backgroundColor: `${accentColor}15` }}>
          <ICONS.UserPlus className="w-10 h-10" style={{ color: accentColor }} />
        </div>

        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.invite.title', { name: partnerName })}
        </h1>
        <p className="text-lg text-[var(--text-secondary)] mb-8">
          {t('onboarding.invite.subtitle')}
        </p>

        {/* Option cards */}
        <div className="space-y-3 mb-6">
          <button
            onClick={() => setSelectedMethod('link')}
            className="w-full p-4 text-left transition-all"
            style={ONBOARDING_OPTION(selectedMethod === 'link', accentColor)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <ICONS.Link className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <div className="font-bold text-[var(--text-primary)]">{t('onboarding.invite.linkOption')}</div>
                <div className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.invite.linkDesc')}</div>
              </div>
            </div>
          </button>

          <button
            onClick={() => setSelectedMethod('email')}
            className="w-full p-4 text-left transition-all"
            style={ONBOARDING_OPTION(selectedMethod === 'email', accentColor)}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${accentColor}15` }}>
                <ICONS.Mail className="w-5 h-5" style={{ color: accentColor }} />
              </div>
              <div>
                <div className="font-bold text-[var(--text-primary)]">{t('onboarding.invite.emailOption')}</div>
                <div className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.invite.emailDesc')}</div>
              </div>
            </div>
          </button>

          {selectedMethod === 'email' && (
            <div className="mt-3 animate-reveal">
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder={t('onboarding.invite.emailPlaceholder', { name: partnerName })}
                className="w-full px-4 py-3 rounded-2xl text-[var(--text-primary)] outline-none transition-all"
                style={ONBOARDING_INPUT(email.length > 0, accentColor)}
                autoFocus
              />
            </div>
          )}
        </div>

        {/* Benefits */}
        <div className="p-5 mb-6 text-left" style={ONBOARDING_GLASS}>
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <ICONS.Gift className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
              <span className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.invite.benefit1')}</span>
            </div>
            <div className="flex items-center gap-3">
              <ICONS.Users className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
              <span className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.invite.benefit2')}</span>
            </div>
            <div className="flex items-center gap-3">
              <ICONS.Heart className="w-5 h-5 flex-shrink-0" style={{ color: accentColor }} />
              <span className="text-scale-label text-[var(--text-secondary)]">{t('onboarding.invite.benefit3')}</span>
            </div>
          </div>
        </div>

        <NextButton
          onClick={handleContinue}
          disabled={!isValid}
          accentColor={accentColor}
        >
          {t('onboarding.invite.continue', { name: partnerName })}
        </NextButton>

        <SkipButton onClick={() => onNext(null)}>
          {t('onboarding.invite.skip')}
        </SkipButton>
      </div>
    </OnboardingStep>
  );
};
