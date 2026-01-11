import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

interface UsageData {
  subscription: {
    plan: string;
    status: string;
  };
  limits: {
    wordLimit: number | null;
    voiceMinutesPerMonth: number | null;
    listenMinutesPerMonth: number | null;
  };
  usage: {
    wordsAdded: number;
    voiceMinutes: number;
    listenMinutes: number;
  };
}

interface UsageSectionProps {
  userId: string;
}

const UsageSection: React.FC<UsageSectionProps> = ({ userId }) => {
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const [usageData, setUsageData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsage();
  }, [userId]);

  const fetchUsage = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setLoading(false);
        return;
      }

      const response = await fetch('/api/subscription-status', {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
      } else {
        setError('Failed to load usage data');
      }
    } catch (err) {
      console.error('[UsageSection] Error fetching usage:', err);
      setError('Failed to load usage data');
    } finally {
      setLoading(false);
    }
  };

  // Calculate percentage for progress bars
  const getUsagePercent = (used: number, limit: number | null): number => {
    if (limit === null) return 0; // Unlimited
    if (limit === 0) return 100; // At limit (no access)
    return Math.min((used / limit) * 100, 100);
  };

  // Get color based on usage percentage
  const getUsageColor = (percent: number): string => {
    if (percent >= 90) return '#ef4444'; // Red
    if (percent >= 75) return '#f59e0b'; // Amber
    return accentHex; // Accent color
  };

  // Don't show for users without a subscription
  if (loading) {
    return (
      <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-[var(--bg-primary)] rounded w-1/3" />
          <div className="h-2 bg-[var(--bg-primary)] rounded" />
          <div className="h-2 bg-[var(--bg-primary)] rounded" />
        </div>
      </div>
    );
  }

  if (error || !usageData) {
    return null;
  }

  // Don't show for non-subscribers
  if (usageData.subscription.plan === 'none' || usageData.subscription.status !== 'active') {
    return null;
  }

  const isUnlimited = usageData.subscription.plan === 'unlimited';

  // For unlimited plan, show a simple "unlimited" badge
  if (isUnlimited) {
    return (
      <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
        <h3 className="text-[11px] font-black mb-4 flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
          <ICONS.TrendingUp className="w-4 h-4" style={{ color: accentHex }} />
          <span>{t('usage.title')}</span>
        </h3>

        <div
          className="p-4 rounded-2xl text-center"
          style={{ backgroundColor: `${accentHex}15` }}
        >
          <div className="flex items-center justify-center gap-2 mb-1">
            <ICONS.Sparkles className="w-5 h-5" style={{ color: accentHex }} />
            <span className="font-black text-lg" style={{ color: accentHex }}>
              {t('usage.unlimitedPlan')}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)]">
            {t('usage.noLimits')}
          </p>
        </div>

        {/* Still show current counts for reference */}
        <div className="mt-4 grid grid-cols-3 gap-2 text-center">
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              {usageData.usage.wordsAdded}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{t('usage.words')}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              {usageData.usage.voiceMinutes}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{t('usage.voiceMin')}</p>
          </div>
          <div className="p-3 rounded-xl" style={{ backgroundColor: 'var(--bg-primary)' }}>
            <p className="text-lg font-black" style={{ color: 'var(--text-primary)' }}>
              {usageData.usage.listenMinutes}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)] uppercase tracking-wide">{t('usage.listenMin')}</p>
          </div>
        </div>
      </div>
    );
  }

  // Standard plan - show usage bars
  const { limits, usage } = usageData;

  return (
    <div className="bg-[var(--bg-card)] p-6 rounded-[2.5rem] border border-[var(--border-color)] shadow-sm">
      <h3 className="text-[11px] font-black mb-5 flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
        <ICONS.TrendingUp className="w-4 h-4" style={{ color: accentHex }} />
        <span>{t('usage.title')}</span>
      </h3>

      <div className="space-y-5">
        {/* Words Added */}
        {limits.wordLimit !== null && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ICONS.Book className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                {t('usage.vocabulary')}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {usage.wordsAdded.toLocaleString()} / {limits.wordLimit.toLocaleString()}
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getUsagePercent(usage.wordsAdded, limits.wordLimit)}%`,
                  backgroundColor: getUsageColor(getUsagePercent(usage.wordsAdded, limits.wordLimit))
                }}
              />
            </div>
          </div>
        )}

        {/* Voice Minutes */}
        {limits.voiceMinutesPerMonth !== null && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ICONS.Mic className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                {t('usage.voiceChat')}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {usage.voiceMinutes} / {limits.voiceMinutesPerMonth} min
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getUsagePercent(usage.voiceMinutes, limits.voiceMinutesPerMonth)}%`,
                  backgroundColor: getUsageColor(getUsagePercent(usage.voiceMinutes, limits.voiceMinutesPerMonth))
                }}
              />
            </div>
          </div>
        )}

        {/* Listen Minutes */}
        {limits.listenMinutesPerMonth !== null && (
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <ICONS.Volume2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                {t('usage.listenMode')}
              </span>
              <span className="text-xs font-bold" style={{ color: 'var(--text-secondary)' }}>
                {usage.listenMinutes} / {limits.listenMinutesPerMonth} min
              </span>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${getUsagePercent(usage.listenMinutes, limits.listenMinutesPerMonth)}%`,
                  backgroundColor: getUsageColor(getUsagePercent(usage.listenMinutes, limits.listenMinutesPerMonth))
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Upgrade prompt if close to limits */}
      {(getUsagePercent(usage.wordsAdded, limits.wordLimit) >= 80 ||
        getUsagePercent(usage.voiceMinutes, limits.voiceMinutesPerMonth) >= 80 ||
        getUsagePercent(usage.listenMinutes, limits.listenMinutesPerMonth) >= 80) && (
        <div
          className="mt-5 p-4 rounded-2xl text-center"
          style={{ backgroundColor: `${accentHex}10`, border: `1px solid ${accentHex}30` }}
        >
          <p className="text-sm font-bold" style={{ color: accentHex }}>
            {t('usage.upgradePrompt')}
          </p>
        </div>
      )}

      {/* Resets info */}
      <p className="mt-4 text-[10px] text-center" style={{ color: 'var(--text-secondary)' }}>
        {t('usage.resetsMonthly')}
      </p>
    </div>
  );
};

export default UsageSection;
