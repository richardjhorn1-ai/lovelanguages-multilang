/**
 * TrialReminderNotification
 * Shows in-app notification when trial is expiring (days 5, 3, 1, 0)
 * Persists dismiss state in localStorage to avoid repeated showing
 */

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';

interface Props {
  daysRemaining: number;
  hoursRemaining?: number | null;
}

const STORAGE_KEY_PREFIX = 'trial_reminder_dismissed_';

export const TrialReminderNotification: React.FC<Props> = ({ daysRemaining, hoursRemaining }) => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissKey = `${STORAGE_KEY_PREFIX}${daysRemaining}`;
    const isDismissed = localStorage.getItem(dismissKey) === 'true';

    if (!isDismissed && [5, 3, 1, 0].includes(daysRemaining)) {
      setVisible(true);
    }
  }, [daysRemaining]);

  const handleDismiss = () => {
    const dismissKey = `${STORAGE_KEY_PREFIX}${daysRemaining}`;
    localStorage.setItem(dismissKey, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  // Get message based on days remaining
  const getMessage = () => {
    if (daysRemaining === 0) {
      return {
        emoji: '🚨',
        title: t('trial.reminder.lastDay.title', { defaultValue: 'Last day of your trial!' }),
        subtitle: hoursRemaining && hoursRemaining > 0
          ? t('trial.reminder.lastDay.hours', { hours: hoursRemaining, defaultValue: `Only ${hoursRemaining} hours left` })
          : t('trial.reminder.lastDay.subtitle', { defaultValue: 'Subscribe now to keep learning together' })
      };
    }
    if (daysRemaining === 1) {
      return {
        emoji: '⚠️',
        title: t('trial.reminder.oneDay.title', { defaultValue: '1 day left in your trial' }),
        subtitle: t('trial.reminder.oneDay.subtitle', { defaultValue: "Don't lose your progress!" })
      };
    }
    if (daysRemaining === 3) {
      return {
        emoji: '💕',
        title: t('trial.reminder.threeDays.title', { defaultValue: '3 days left in your trial' }),
        subtitle: t('trial.reminder.threeDays.subtitle', { defaultValue: 'Subscribe to continue learning together' })
      };
    }
    // 5 days
    return {
      emoji: '⏰',
      title: t('trial.reminder.fiveDays.title', { defaultValue: '5 days left in your trial' }),
      subtitle: t('trial.reminder.fiveDays.subtitle', { defaultValue: 'Enjoying learning together? Keep it going!' })
    };
  };

  const msg = getMessage();

  return (
    <div className="fixed top-20 right-4 z-50 animate-in slide-in-from-right duration-300">
      <div
        className="relative rounded-xl shadow-lg border p-4 max-w-sm"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-color)'
        }}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
          aria-label={t('common.dismiss', { defaultValue: 'Dismiss' })}
        >
          <ICONS.X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-3 pr-6">
          <span className="text-2xl">{msg.emoji}</span>
          <div>
            <p className="font-bold" style={{ color: 'var(--text-primary)' }}>
              {msg.title}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {msg.subtitle}
            </p>
            <button
              onClick={() => navigate('/pricing')}
              className="mt-3 text-sm font-bold hover:underline"
              style={{ color: 'var(--accent-color)' }}
            >
              {t('trial.reminder.viewPlans', { defaultValue: 'View plans →' })}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TrialReminderNotification;
