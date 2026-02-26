import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { useLanguage } from '../../../../context/LanguageContext';

interface TutorPersonalizationStepProps {
  currentStep: number;
  totalSteps: number;
  learnerName: string;
  initialRelation?: string;
  initialConnection?: string;
  initialOrigin?: string;
  onNext: (relation: string, connection: string, origin: string) => void;
  onBack?: () => void;
  accentColor?: string;
}

export const TutorPersonalizationStep: React.FC<TutorPersonalizationStepProps> = ({
  currentStep,
  totalSteps,
  learnerName,
  initialRelation = '',
  initialConnection = '',
  initialOrigin = '',
  onNext,
  onBack,
  accentColor = '#B1C870'
}) => {
  const { t } = useTranslation();
  const { targetName, targetFlag } = useLanguage();
  const [relation, setRelation] = useState(initialRelation);
  const [connection, setConnection] = useState(initialConnection);
  const [origin, setOrigin] = useState(initialOrigin);

  const relationOptions: { id: string; icon: React.ReactNode; label: string }[] = [
    { id: 'partner', label: t('onboarding.tutor.relation.partner'), icon: <ICONS.Heart className="w-5 h-5" /> },
    { id: 'spouse', label: t('onboarding.tutor.relation.spouse'), icon: <ICONS.Star className="w-5 h-5" /> },
    { id: 'friend', label: t('onboarding.tutor.relation.friend'), icon: <ICONS.Users className="w-5 h-5" /> },
    { id: 'family', label: t('onboarding.tutor.relation.family'), icon: <ICONS.Users className="w-5 h-5" /> },
  ];

  const connectionOptions: { id: string; icon: React.ReactNode | string; label: string }[] = [
    { id: 'native', label: t('onboarding.tutor.connection.native'), icon: targetFlag },
    { id: 'heritage', label: t('onboarding.tutor.connection.heritage'), icon: <ICONS.Globe className="w-5 h-5" /> },
    { id: 'fluent', label: t('onboarding.tutor.connection.fluent'), icon: <ICONS.Book className="w-5 h-5" /> },
    { id: 'bilingual', label: t('onboarding.tutor.connection.bilingual'), icon: <ICONS.MessageCircle className="w-5 h-5" /> },
  ];

  const canContinue = relation && connection;

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={accentColor}
    >
      <div className="text-center mb-8">
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ backgroundColor: `${accentColor}15` }}
        >
          <ICONS.Users className="w-8 h-8" style={{ color: accentColor }} />
        </div>
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.tutorPersonalization.title', 'Tell us about you')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.tutorPersonalization.subtitle', 'Help us personalize the teaching experience')}
        </p>
      </div>

      {/* Section 1: Relationship to learner */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.tutorPersonalization.relationLabel', { name: learnerName, defaultValue: `${learnerName} is your...` })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {relationOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setRelation(opt.id)}
              className="p-3 transition-all text-center overflow-hidden"
              style={ONBOARDING_OPTION(relation === opt.id, accentColor)}
            >
              <span className="block mb-1 flex justify-center" style={{ color: (relation === opt.id || connection === opt.id) ? accentColor : '#6b7280' }}>{opt.icon}</span>
              <span
                className="font-bold text-scale-label leading-tight block break-words"
                style={{ color: relation === opt.id ? accentColor : 'var(--text-primary)' }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 2: Language connection */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.tutorPersonalization.connectionLabel', { language: targetName, defaultValue: `Your ${targetName} connection` })}
        </p>
        <div className="grid grid-cols-2 gap-2">
          {connectionOptions.map((opt) => (
            <button
              key={opt.id}
              onClick={() => setConnection(opt.id)}
              className="p-3 transition-all text-center overflow-hidden"
              style={ONBOARDING_OPTION(connection === opt.id, accentColor)}
            >
              <span className="block mb-1 flex justify-center" style={{ color: (relation === opt.id || connection === opt.id) ? accentColor : '#6b7280' }}>{opt.icon}</span>
              <span
                className="font-bold text-scale-label leading-tight block break-words"
                style={{ color: connection === opt.id ? accentColor : 'var(--text-primary)' }}
              >
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Section 3: Origin (optional) */}
      <div className="mb-8">
        <p className="text-scale-label font-black uppercase tracking-widest text-gray-400 mb-3">
          {t('onboarding.tutorPersonalization.originLabel', 'Where are you from? (optional)')}
        </p>
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder={t('onboarding.tutorPersonalization.originPlaceholder', 'City, country...')}
          className="w-full px-5 py-3 focus:outline-none font-medium text-[var(--text-primary)] placeholder:text-gray-300 transition-all"
          style={ONBOARDING_INPUT(!!origin.trim(), accentColor)}
          onKeyDown={(e) => e.key === 'Enter' && canContinue && onNext(relation, connection, origin.trim())}
        />
      </div>

      <NextButton
        onClick={() => canContinue && onNext(relation, connection, origin.trim())}
        disabled={!canContinue}
        accentColor={accentColor}
      />
    </OnboardingStep>
  );
};
