import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';
import { apiFetch } from '../services/api-config';

interface InvitePartnerSectionProps {
  userId: string;
  subscriptionStatus: string | null;
  subscriptionGrantedBy: string | null;
  linkedUserId: string | null;
}

const InvitePartnerSection: React.FC<InvitePartnerSectionProps> = ({
  userId,
  subscriptionStatus,
  subscriptionGrantedBy,
  linkedUserId
}) => {
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);

  const { accentHex } = useTheme();
  const { t } = useTranslation();

  // Check eligibility
  const isEligible =
    !subscriptionGrantedBy &&  // Not inherited subscription
    !linkedUserId;              // Not already linked

  // Check for existing invite on mount
  useEffect(() => {
    if (!isEligible) return;

    const checkExistingInvite = async () => {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) return;

      try {
        // Try to generate - API will return existing if one exists
        const response = await apiFetch('/api/generate-invite/', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.isExisting) {
            setInviteLink(data.inviteLink);
            setExpiresAt(data.expiresAt);
          }
        }
      } catch (err) {
        // Ignore - will generate on demand
      }
    };

    checkExistingInvite();
  }, [isEligible]);

  const handleGenerateInvite = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await apiFetch('/api/generate-invite/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate invite');
      }

      setInviteLink(data.inviteLink);
      setExpiresAt(data.expiresAt);
    } catch (err: any) {
      setError(err.message || 'Failed to generate invite');
    }

    setLoading(false);
  };

  const handleCopyLink = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const formatExpiresAt = (dateStr: string | null) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (daysLeft <= 0) return t('invite.expired');
    if (daysLeft === 1) return t('invite.expiresTomorrow');
    return t('invite.expiresIn', { days: daysLeft });
  };

  // Not eligible - don't show anything
  if (!isEligible) {
    return null;
  }

  return (
    <div
      className="rounded-2xl p-6 border"
      style={{
        background: `linear-gradient(to bottom right, ${accentHex}10, ${accentHex}15)`,
        borderColor: `${accentHex}30`
      }}
    >
      <div className="flex items-center gap-3 mb-4">
        <ICONS.Heart className="w-8 h-8 text-[var(--accent-color)]" />
        <div>
          <h3 className="font-bold font-header text-[var(--text-primary)]">{t('invite.title')}</h3>
          <p className="text-scale-label text-[var(--text-secondary)]">
            {t('invite.subtitle')}
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl p-3 mb-4 text-scale-label">
          {error}
        </div>
      )}

      {inviteLink ? (
        <div className="space-y-4">
          <div className="glass-card rounded-xl p-4">
            <p className="text-scale-caption text-[var(--text-secondary)] mb-2">{t('invite.shareLinkLabel')}</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={inviteLink}
                readOnly
                className="flex-1 px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border-color)] text-scale-label text-[var(--text-primary)] truncate"
              />
              <button
                onClick={handleCopyLink}
                className="px-4 py-2 rounded-lg font-bold text-scale-label transition-colors text-white"
                style={{ backgroundColor: copied ? '#22c55e' : accentHex }}
              >
                {copied ? t('invite.copied') : t('invite.copy')}
              </button>
            </div>
            {expiresAt && (
              <p className="text-scale-caption text-[var(--text-secondary)] mt-2">
                {formatExpiresAt(expiresAt)}
              </p>
            )}
          </div>

          <div className="text-scale-label text-[var(--text-secondary)]">
            <p className="font-medium mb-1">{t('invite.howItWorks')}</p>
            <ol className="list-decimal list-inside space-y-1 text-scale-caption">
              <li>{t('invite.step1')}</li>
              <li>{t('invite.step2')}</li>
              <li>{t('invite.step3')}</li>
            </ol>
          </div>
        </div>
      ) : (
        <button
          onClick={handleGenerateInvite}
          disabled={loading}
          className="w-full py-3 px-6 rounded-xl text-white font-bold transition-opacity hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ backgroundColor: accentHex }}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('invite.generating')}
            </span>
          ) : (
            t('invite.generateButton')
          )}
        </button>
      )}
    </div>
  );
};

export default InvitePartnerSection;
