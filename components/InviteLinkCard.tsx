import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, InviteToken } from '../types';
import { ICONS } from '../constants';

interface InviteLinkCardProps {
  profile: Profile;
}

const InviteLinkCard: React.FC<InviteLinkCardProps> = ({ profile }) => {
  const { t } = useTranslation();
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check for existing valid token on mount
  useEffect(() => {
    checkExistingToken();
  }, [profile.id]);

  const checkExistingToken = async () => {
    try {
      const { data, error } = await supabase
        .from('invite_tokens')
        .select('*')
        .eq('inviter_id', profile.id)
        .is('used_at', null)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const baseUrl = window.location.origin;
        setInviteLink(`${baseUrl}/#/join/${data.token}`);
        setExpiresAt(data.expires_at);
      }
    } catch (e) {
      // No existing token, that's fine
    }
  };

  const generateInviteLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/generate-invite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to generate invite (${response.status})`);
      }

      setInviteLink(data.inviteLink);
      setExpiresAt(data.expiresAt);
    } catch (e: any) {
      console.error('[InviteLinkCard] Error:', e);
      setError(e.message || 'Failed to generate invite link');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    if (!inviteLink) return;

    try {
      await navigator.clipboard.writeText(inviteLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
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

  const formatExpiryDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return t('inviteLink.expired');
    if (diffDays === 1) return t('inviteLink.expiresTomorrow');
    return t('inviteLink.expiresIn', { days: diffDays });
  };

  const regenerateLink = async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/generate-invite/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ regenerate: true })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Failed to regenerate invite (${response.status})`);
      }

      setInviteLink(data.inviteLink);
      setExpiresAt(data.expiresAt);
    } catch (e: any) {
      console.error('[InviteLinkCard] Regenerate error:', e);
      setError(e.message || 'Failed to regenerate invite link');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="glass-card p-6 rounded-[2rem]">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-10 h-10 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
          <ICONS.Link className="w-5 h-5 text-[var(--accent-color)]" />
        </div>
        <div>
          <h3 className="text-scale-label font-black font-header text-[var(--text-primary)]">{t('inviteLink.title')}</h3>
          <p className="text-[10px] text-[var(--text-secondary)] font-medium">{t('inviteLink.subtitle')}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-100 rounded-xl">
          <p className="text-scale-caption text-red-600 font-medium">{error}</p>
        </div>
      )}

      {!inviteLink ? (
        <button
          onClick={generateInviteLink}
          disabled={loading}
          className="w-full bg-[var(--accent-color)] text-white py-4 rounded-2xl font-black text-scale-label uppercase tracking-widest shadow-lg shadow-[var(--accent-shadow)] hover:bg-[var(--accent-hover)] disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              {t('inviteLink.generating')}
            </>
          ) : (
            <>
              <ICONS.Sparkles className="w-4 h-4" />
              {t('inviteLink.generate')}
            </>
          )}
        </button>
      ) : (
        <div className="space-y-3">
          {/* Link display */}
          <div className="glass-card p-4 rounded-xl flex items-center gap-3">
            <div className="flex-1 truncate">
              <p className="text-scale-caption text-[var(--text-secondary)] font-medium mb-1">{t('inviteLink.yourLink')}</p>
              <p className="text-scale-label font-mono text-[var(--text-secondary)] truncate">{inviteLink}</p>
            </div>
          </div>

          {/* Copy button */}
          <button
            onClick={copyToClipboard}
            className={`w-full py-4 rounded-2xl font-black text-scale-label uppercase tracking-widest shadow-lg transition-all flex items-center justify-center gap-2 ${
              copied
                ? 'bg-green-500 text-white shadow-green-100'
                : 'bg-[var(--accent-color)] text-white shadow-[var(--accent-shadow)] hover:bg-[var(--accent-hover)]'
            }`}
          >
            {copied ? (
              <>
                <ICONS.Check className="w-4 h-4" />
                {t('inviteLink.copied')}
              </>
            ) : (
              <>
                <ICONS.Copy className="w-4 h-4" />
                {t('inviteLink.copyLink')}
              </>
            )}
          </button>

          {/* Expiry and regenerate */}
          <div className="flex items-center justify-between text-scale-caption">
            <span className="text-[var(--text-secondary)] font-medium">
              {expiresAt && formatExpiryDate(expiresAt)}
            </span>
            <button
              onClick={regenerateLink}
              disabled={loading}
              className="text-[var(--accent-color)] font-bold hover:text-[var(--accent-hover)] transition-colors flex items-center gap-1"
            >
              <ICONS.RefreshCw className="w-3 h-3" />
              {t('inviteLink.newLink')}
            </button>
          </div>

          {/* How it works */}
          <div className="pt-4 border-t border-[var(--border-color)]">
            <p className="text-[10px] text-[var(--text-secondary)] font-medium text-center">
              {t('inviteLink.description')}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InviteLinkCard;
