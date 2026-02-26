import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';

interface PersonalizationStepProps {
  currentStep: number;
  totalSteps: number;
  partnerName: string;
  initialVibe?: string;
  initialTime?: string;
  initialPrior?: string;
  onNext: (vibe: string, time: string, prior: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const PersonalizationStep: React.FC<PersonalizationStepProps> = ({
  currentStep,
  totalSteps,
  partnerName,
  initialVibe = '',
  initialTime = '',
  initialPrior = '',
  onNext,
  onBack,
  accentColor = '#FF4761'
}) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();
  const [vibe, setVibe] = useState(initialVibe);
  const [time, setTime] = useState(initialTime);
  const [prior, setPrior] = useState(initialPrior);

  const vibes: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'passionate', icon: <ICONS.Zap className="w-5 h-5" />, label: t('onboarding.student.vibe.passionate') },
    { id: 'playful', icon: <ICONS.Sparkles className="w-5 h-5" />, label: t('onboarding.student.vibe.playful') },
    { id: 'growing', icon: <ICONS.TrendingUp className="w-5 h-5" />, label: t('onboarding.student.vibe.growing') },
    { id: 'forever', icon: <ICONS.Heart className="w-5 h-5" />, label: t('onboarding.student.vibe.forever') },
    { id: 'longdistance', icon: <ICONS.Globe className="w-5 h-5" />, label: t('onboarding.student.vibe.longDistance') },
    { id: 'newlove', icon: <ICONS.Star className="w-5 h-5" />, label: t('onboarding.student.vibe.newLove') },
  ];

  const timeOptions: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'quick', icon: <ICONS.Zap className="w-5 h-5" />, label: t('onboarding.student.time.quick') },
    { id: 'coffee', icon: <ICONS.Coffee className="w-5 h-5" />, label: t('onboarding.student.time.coffee') },
    { id: 'walk', icon: <ICONS.Clock className="w-5 h-5" />, label: t('onboarding.student.time.walk') },
  ];

  const canContinue = vibe && time && prior;

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.personalization.title', 'Make it yours')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.personalization.subtitle', 'Help us personalize your experience')}
        </p>
      </div>

      {/* Section 1: Relationship vibe */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.personalization.vibeLabel', 'Your relationship vibe')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {vibes.map((v) => (
            <button
              key={v.id}
              onClick={() => setVibe(v.id)}
              className="p-3 transition-all text-center"
              style={ONBOARDING_OPTION(vibe === v.id, accentColor)}
            >
              <span className="block mb-1" style={{ color: vibe === v.id ? accentColor : '#6b7280' }}>{v.icon}</span>
              <span
                className="text-scale-caption font-bold leading-tight block"
                style={{ color: vibe === v.id ? accentColor : 'var(--text-primary)' }}
              >
                {v.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-6"><div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: `${accentColor}20` }} /></div>

      {/* Section 2: Daily time */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.personalization.timeLabel', 'Daily practice time')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {timeOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setTime(opt.id)}
              className="p-3 transition-all text-center"
              style={ONBOARDING_OPTION(time === opt.id, accentColor)}
            >
              <span className="block mb-1" style={{ color: time === opt.id ? accentColor : '#6b7280' }}>{opt.icon}</span>
              <span
                className="text-scale-caption font-bold leading-tight block"
                style={{ color: time === opt.id ? accentColor : 'var(--text-primary)' }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex justify-center mb-6"><div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: `${accentColor}20` }} /></div>

      {/* Section 3: Prior experience */}
      <div className="mb-8">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.personalization.priorLabel', { language: targetName, defaultValue: `Tried ${targetName} before?` })}
        </p>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => setPrior('yes')}
            className="p-4 transition-all text-center"
            style={ONBOARDING_OPTION(prior === 'yes', accentColor)}
          >
            <span className="block mb-1" style={{ color: prior === 'yes' ? accentColor : '#6b7280' }}><ICONS.Check className="w-6 h-6 mx-auto" /></span>
            <span
              className="font-bold"
              style={{ color: prior === 'yes' ? accentColor : 'var(--text-primary)' }}
            >
              {t('onboarding.student.prior.yes')}
            </span>
          </button>
          <button
            onClick={() => setPrior('no')}
            className="p-4 transition-all text-center"
            style={ONBOARDING_OPTION(prior === 'no', accentColor)}
          >
            <span className="block mb-1" style={{ color: prior === 'no' ? accentColor : '#6b7280' }}><ICONS.Sparkles className="w-6 h-6 mx-auto" /></span>
            <span
              className="font-bold"
              style={{ color: prior === 'no' ? accentColor : 'var(--text-primary)' }}
            >
              {t('onboarding.student.prior.beginner')}
            </span>
          </button>
        </div>
      </div>

      <NextButton
        onClick={() => canContinue && onNext(vibe, time, prior)}
        disabled={!canContinue}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
