import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

interface TeachingImpactCardProps {
  xpContributed: number;
  wordsMastered: number;
  challengeSuccessRate: number;
  partnerName: string;
  tierColor: string;
}

const TeachingImpactCard: React.FC<TeachingImpactCardProps> = ({
  xpContributed,
  wordsMastered,
  challengeSuccessRate,
  partnerName,
  tierColor,
}) => {
  const { t } = useTranslation();

  return (
    <div
      className="p-4 md:p-6 rounded-xl md:rounded-[2rem] text-white relative overflow-hidden"
      style={{
        background: `linear-gradient(135deg, ${tierColor}20 0%, ${tierColor}40 100%)`,
        border: `1px solid ${tierColor}30`,
      }}
    >
      <div className="absolute top-0 right-0 opacity-10">
        <ICONS.Heart className="w-16 h-16 md:w-24 md:h-24" style={{ color: tierColor }} />
      </div>

      <div className="relative z-10">
        <h3
          className="text-scale-micro font-black font-header uppercase tracking-widest mb-3 flex items-center gap-2"
          style={{ color: tierColor }}
        >
          <ICONS.TrendingUp className="w-4 h-4" />
          {t('tutor.impact.title', 'Your Teaching Impact')}
        </h3>

        <p className="text-scale-label text-[var(--text-primary)] mb-4">
          {t('tutor.impact.subtitle', "You've helped {{name}} grow", { name: partnerName })}
        </p>

        <div className="grid grid-cols-3 gap-3">
          <div
            className="text-center p-3 glass-card rounded-xl"
            aria-label={`XP Given: ${xpContributed}`}
          >
            <div className="text-scale-heading font-black" style={{ color: tierColor }}>
              {xpContributed}
            </div>
            <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
              {t('tutor.impact.xpContributed', 'XP Given')}
            </div>
          </div>
          <div
            className="text-center p-3 glass-card rounded-xl"
            aria-label={`Words Mastered: ${wordsMastered}`}
          >
            <div className="text-scale-heading font-black" style={{ color: tierColor }}>
              {wordsMastered}
            </div>
            <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
              {t('tutor.impact.wordsMastered', 'Mastered')}
            </div>
          </div>
          <div
            className="text-center p-3 glass-card rounded-xl"
            aria-label={`Success Rate: ${challengeSuccessRate}%`}
          >
            <div className="text-scale-heading font-black" style={{ color: tierColor }}>
              {challengeSuccessRate}%
            </div>
            <div className="text-scale-micro text-[var(--text-secondary)] uppercase font-bold">
              {t('tutor.impact.successRate', 'Success')}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeachingImpactCard;
