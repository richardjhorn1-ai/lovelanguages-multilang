import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, SkipButton, ONBOARDING_GLASS, ONBOARDING_OPTION, ONBOARDING_INPUT } from '../../OnboardingStep';
import { ICONS } from '../../../../constants';
import { apiFetch, APP_URL } from '../../../../services/api-config';
import { supabase } from '../../../../services/supabase';
import { useLanguage } from '../../../../context/LanguageContext';

// TODO: Future enhancements from COO spec:
// - Smart share: detect platform (WhatsApp/iMessage) and pre-write message with invite link
// - Invite reminder: 24h/72h nudge if user skipped the invite step
// - A/B test invite placement: after celebration vs after personalization
// - Invite analytics: track generated, shared, opened, completed, time_to_accept

export type InviteIntent = { method: 'link'; inviteLink?: string } | { method: 'email'; email: string };

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
  const { targetName } = useLanguage();
  const [selectedMethod, setSelectedMethod] = useState<'link' | 'email' | null>(null);
  const [email, setEmail] = useState('');

  // Link generation state
  const [inviteLink, setInviteLink] = useState<string | null>(null);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkCopied, setLinkCopied] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const linkGenerated = useRef(false);

  // Auto-generate invite link when user selects "link" method
  useEffect(() => {
    if (selectedMethod !== 'link' || linkGenerated.current || inviteLink) return;
    linkGenerated.current = true;

    const generateLink = async () => {
      setLinkLoading(true);
      setLinkError(null);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.access_token) throw new Error('Not authenticated');

        const response = await apiFetch('/api/generate-invite/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Failed to generate invite');

        setInviteLink(data.inviteLink);
      } catch (e: any) {
        console.warn('[InvitePartnerStep] Link generation failed:', e);
        setLinkError(t('onboarding.invite.linkError', "Couldn't generate link — you can do this later from settings."));
        linkGenerated.current = false; // Allow retry
      } finally {
        setLinkLoading(false);
      }
    };

    generateLink();
  }, [selectedMethod]);

  // Clear link state when switching away from link method
  useEffect(() => {
    if (selectedMethod !== 'link') {
      setLinkCopied(false);
      setLinkError(null);
    }
  }, [selectedMethod]);

  const copyToClipboard = async () => {
    if (!inviteLink) return;
    try {
      await navigator.clipboard.writeText(inviteLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const shareLink = async () => {
    if (!inviteLink) return;
    try {
      await navigator.share({
        title: 'Love Languages',
        text: t('onboarding.invite.shareText', {
          language: targetName,
          defaultValue: `Join me on Love Languages! Learn ${targetName} together.`,
        }),
        url: inviteLink,
      });
    } catch {
      // User cancelled share or share failed — no action needed
    }
  };

  const canShare = typeof navigator !== 'undefined' && typeof navigator.share === 'function';

  const handleContinue = () => {
    if (selectedMethod === 'link') {
      onNext({ method: 'link', inviteLink: inviteLink || undefined });
    } else if (selectedMethod === 'email') {
      onNext({ method: 'email', email });
    }
  };

  const isValid =
    (selectedMethod === 'link' && !linkLoading) ||
    (selectedMethod === 'email' && email.includes('@') && email.includes('.'));

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

          {/* Link reveal section */}
          {selectedMethod === 'link' && (
            <div className="mt-3 animate-reveal space-y-3">
              {linkLoading && (
                <div className="p-4 flex items-center justify-center gap-2" style={ONBOARDING_GLASS}>
                  <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: accentColor, borderTopColor: 'transparent' }} />
                  <span className="text-scale-label text-[var(--text-secondary)]">
                    {t('onboarding.invite.generating', 'Generating your link...')}
                  </span>
                </div>
              )}

              {linkError && (
                <div className="p-4 text-left" style={ONBOARDING_GLASS}>
                  <p className="text-scale-caption text-[var(--text-secondary)] mb-2">{linkError}</p>
                  <button
                    onClick={() => { linkGenerated.current = false; setSelectedMethod(null); setTimeout(() => setSelectedMethod('link'), 0); }}
                    className="text-scale-caption font-bold transition-colors"
                    style={{ color: accentColor }}
                  >
                    {t('onboarding.invite.retry', 'Try again')}
                  </button>
                </div>
              )}

              {inviteLink && (
                <>
                  {/* Link display */}
                  <div className="p-4 text-left" style={ONBOARDING_GLASS}>
                    <p className="text-[10px] text-[var(--text-secondary)] font-medium mb-1">
                      {t('onboarding.invite.yourLink', 'Your invite link:')}
                    </p>
                    <p className="text-scale-caption font-mono text-[var(--text-secondary)] truncate">{inviteLink}</p>
                  </div>

                  {/* Copy + Share buttons */}
                  <div className={`grid gap-2 ${canShare ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    <button
                      onClick={copyToClipboard}
                      className="py-3 rounded-2xl font-bold text-scale-label transition-all flex items-center justify-center gap-2"
                      style={{
                        backgroundColor: linkCopied ? '#22c55e' : `${accentColor}15`,
                        color: linkCopied ? '#fff' : accentColor,
                      }}
                    >
                      {linkCopied ? (
                        <><ICONS.Check className="w-4 h-4" />{t('onboarding.invite.copied', 'Copied!')}</>
                      ) : (
                        <><ICONS.Copy className="w-4 h-4" />{t('onboarding.invite.copyLink', 'Copy link')}</>
                      )}
                    </button>
                    {canShare && (
                      <button
                        onClick={shareLink}
                        className="py-3 rounded-2xl font-bold text-scale-label transition-all flex items-center justify-center gap-2"
                        style={{ backgroundColor: `${accentColor}15`, color: accentColor }}
                      >
                        <ICONS.Send className="w-4 h-4" />
                        {t('onboarding.invite.share', 'Share...')}
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

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
