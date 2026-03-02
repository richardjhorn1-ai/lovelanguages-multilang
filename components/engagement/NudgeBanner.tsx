import React from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../../constants';

interface NudgeBannerProps {
  type: 'student_inactive' | 'tutor_inactive';
  partnerName: string;
  daysSinceActivity: number;
  onAction: () => void;
  onDismiss: () => void;
}

const NudgeBanner: React.FC<NudgeBannerProps> = ({
  type,
  partnerName,
  daysSinceActivity,
  onAction,
  onDismiss,
}) => {
  const { t } = useTranslation();

  const getMessage = () => {
    if (type === 'student_inactive') {
      if (daysSinceActivity >= 5) {
        return {
          icon: <ICONS.Target className="w-6 h-6" />,
          title: t('nudge.studentInactive5.title', 'Create a fun challenge?'),
          subtitle: t('nudge.studentInactive5.subtitle', '{{name}} could use some encouragement!', { name: partnerName }),
          action: t('nudge.studentInactive5.action', 'Create Challenge'),
          gradient: 'from-blue-500 to-cyan-500',
        };
      }
      return {
        icon: <ICONS.Heart className="w-6 h-6" />,
        title: t('nudge.studentInactive2.title', 'Send some encouragement?'),
        subtitle: t('nudge.studentInactive2.subtitle', "{{name}} hasn't practiced in a while", { name: partnerName }),
        action: t('nudge.studentInactive2.action', 'Send Love Note'),
        gradient: 'from-pink-500 to-rose-500',
      };
    }

    // Tutor inactive
    return {
      icon: <ICONS.Mail className="w-6 h-6" />,
      title: t('nudge.tutorInactive.title', 'Miss your tutor?'),
      subtitle: t('nudge.tutorInactive.subtitle', 'Send {{name}} a love note!', { name: partnerName }),
      action: t('nudge.tutorInactive.action', 'Send Note'),
      gradient: 'from-purple-500 to-pink-500',
    };
  };

  const config = getMessage();

  return (
    <div
      className={`relative overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-r ${config.gradient} p-4 text-white shadow-lg`}
    >
      {/* Dismiss button */}
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
        aria-label={t('common.dismiss', 'Dismiss')}
      >
        <ICONS.X className="w-3.5 h-3.5" />
      </button>

      <div className="flex items-center gap-4">
        {/* Icon */}
        <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center flex-shrink-0">{config.icon}</div>

        {/* Content */}
        <div className="flex-1">
          <h4 className="font-black font-header text-scale-label">{config.title}</h4>
          <p className="text-white/80 text-scale-caption">{config.subtitle}</p>
        </div>

        {/* Action Button */}
        <button
          onClick={onAction}
          className="px-4 py-2 bg-[var(--bg-card)] text-[var(--text-primary)] rounded-xl font-bold text-scale-caption active:scale-95 transition-transform flex-shrink-0"
        >
          {config.action}
        </button>
      </div>
    </div>
  );
};

export default NudgeBanner;
