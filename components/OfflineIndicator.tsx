/**
 * Offline indicator component
 * Shows a banner when the user is offline with cached data info
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { WifiSlash } from '@phosphor-icons/react';

interface OfflineIndicatorProps {
  isOnline: boolean;
  cachedWordCount: number;
  lastSyncTime: string | null;
  compact?: boolean;
  pendingCount?: number;
  isSyncing?: boolean;
}

const OfflineIndicator: React.FC<OfflineIndicatorProps> = ({
  isOnline,
  cachedWordCount,
  lastSyncTime,
  compact = false,
  pendingCount = 0,
  isSyncing = false,
}) => {
  const { t } = useTranslation();

  if (isOnline) return null;

  const formatSyncTime = (isoString: string | null): string => {
    if (!isoString) return t('offline.never', 'Never');
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return t('offline.justNow', 'Just now');
    if (diffMins < 60) return t('offline.minsAgo', '{{mins}} mins ago', { mins: diffMins });
    if (diffHours < 24) return t('offline.hoursAgo', '{{hours}} hours ago', { hours: diffHours });
    return t('offline.daysAgo', '{{days}} days ago', { days: diffDays });
  };

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full text-scale-label">
        <WifiSlash className="w-4 h-4" />
        <span>{t('offline.offlineMode', 'Offline')}</span>
      </div>
    );
  }

  return (
    <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <WifiSlash className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1">
          <h3 className="font-bold font-header text-amber-600 dark:text-amber-400">
            {t('offline.title', "You're offline")}
          </h3>
          <p className="text-scale-label text-[var(--text-secondary)] mt-1">
            {cachedWordCount > 0
              ? t('offline.canPractice', 'You can still practice with {{count}} cached words from your Love Log.', { count: cachedWordCount })
              : t('offline.noCache', 'No cached vocabulary available. Connect to the internet to sync your Love Log.')}
          </p>
          {lastSyncTime && (
            <p className="text-scale-caption text-[var(--text-tertiary)] mt-2">
              {t('offline.lastSync', 'Last synced: {{time}}', { time: formatSyncTime(lastSyncTime) })}
            </p>
          )}
          {pendingCount > 0 && (
            <p className="text-scale-caption text-amber-600 dark:text-amber-400 mt-1 font-medium">
              {isSyncing
                ? t('offline.syncing', 'Syncing...')
                : t('offline.pendingSync', '{{count}} items waiting to sync', { count: pendingCount })}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default OfflineIndicator;
