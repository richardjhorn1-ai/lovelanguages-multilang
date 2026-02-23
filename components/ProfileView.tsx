
import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile, OnboardingData } from '../types';
import { ICONS } from '../constants';
import SubscriptionManager from './SubscriptionManager';
import UsageSection from './UsageSection';
import InvitePartnerSection from './InvitePartnerSection';
import BreakupModal from './BreakupModal';
import AvatarUpload from './AvatarUpload';
import LanguagesSection from './LanguagesSection';
import AccountSettings from './AccountSettings';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { LANGUAGE_CONFIGS } from '../constants/language-config';
import {
  AccentColor,
  DarkModeStyle,
  FontSize,
  FontPreset,
  FontWeight,
  ACCENT_COLORS,
  DARK_MODE_STYLES,
  FONT_SIZES,
  FONT_PRESETS,
  FONT_WEIGHTS
} from '../services/theme';
import { sounds } from '../services/sounds';
import { haptics } from '../services/haptics';

// Extend Window interface for PWA install prompt
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface ProfileViewProps {
  profile: Profile;
  onRefresh: () => void;
}

// Options for dropdowns (matching onboarding)
const VIBE_OPTIONS = ['Passionate', 'Playful', 'Growing', 'Forever', 'Long-distance', 'New love'];
const TIME_OPTIONS = ['5 min', '10 min', '20+ min'];
const WHEN_OPTIONS = ['Morning', 'Afternoon', 'Evening', 'Whenever'];
const FEAR_OPTIONS = ['Pronunciation', 'Grammar', 'Sounding silly', 'Forgetting words'];
const RELATION_OPTIONS = ['partner', 'spouse', 'friend', 'family'];
const CONNECTION_OPTIONS = ['native', 'heritage', 'fluent', 'bilingual'];
const ORIGIN_OPTIONS = ['poland', 'family', 'school', 'self'];
const STYLE_OPTIONS = ['patient', 'playful', 'structured', 'immersive'];

const ProfileView: React.FC<ProfileViewProps> = ({ profile, onRefresh }) => {
  const [partner, setPartner] = useState<Profile | null>(null);
  const [showCustomisation, setShowCustomisation] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [editData, setEditData] = useState<Partial<OnboardingData>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [smartValidation, setSmartValidation] = useState(profile.smart_validation ?? true);
  const [savingValidation, setSavingValidation] = useState(false);
  const [showBreakupModal, setShowBreakupModal] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(sounds.isMuted());
  const [soundVolume, setSoundVolume] = useState(sounds.getVolume() * 100);
  const [isHapticsEnabled, setIsHapticsEnabled] = useState(haptics.isEnabled());
  const isHapticsAvailable = haptics.isAvailable();
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  // Check if running in Capacitor (native app)
  const isNativeApp = !!(window as any).Capacitor?.isNativePlatform?.();

  const { theme, setAccentColor, setDarkMode, setFontSize, setFontPreset, setFontWeight, accentHex, isDark } = useTheme();
  const { t } = useTranslation();
  const { targetLanguage, targetName } = useLanguage();
  const iLoveYou = LANGUAGE_CONFIGS[targetLanguage]?.examples?.iLoveYou || 'I love you';

  // Am I the payer (not receiving inherited subscription)?
  const isPayer = !profile.subscription_granted_by;

  useEffect(() => {
    if (profile.linked_user_id) fetchPartner();
    // Initialize edit data from profile
    setEditData(profile.onboarding_data || {});
  }, [profile]);

  // PWA Install prompt listener
  useEffect(() => {
    // Skip if in native app
    if (isNativeApp) return;

    // Check if already installed (standalone mode)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as BeforeInstallPromptEvent);
    };

    const handleAppInstalled = () => {
      setInstallPrompt(null);
      setIsInstalled(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isNativeApp]);

  const fetchPartner = async () => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', profile.linked_user_id)
      .single();
    if (data) setPartner(data);
  };

  const updateField = (key: keyof OnboardingData, value: string) => {
    setEditData(prev => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const toggleSmartValidation = async () => {
    const newValue = !smartValidation;
    setSavingValidation(true);
    try {
      await supabase
        .from('profiles')
        .update({ smart_validation: newValue })
        .eq('id', profile.id);
      setSmartValidation(newValue);
      onRefresh();
    } catch (err) {
      console.error('Error updating smart validation:', err);
    } finally {
      setSavingValidation(false);
    }
  };

  const saveChanges = async () => {
    setSaving(true);
    try {
      const partnerNameValue = profile.role === 'tutor' ? editData.learnerName : editData.partnerName;

      await supabase
        .from('profiles')
        .update({
          full_name: editData.userName || profile.full_name,
          partner_name: partnerNameValue || null,
          onboarding_data: editData
        })
        .eq('id', profile.id);

      setSaved(true);
      onRefresh();
    } catch (err) {
      console.error('Error saving preferences:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleInstallApp = async () => {
    if (!installPrompt) return;

    await installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;

    if (outcome === 'accepted') {
      setInstallPrompt(null);
      setIsInstalled(true);
    }
  };

  const handleBreakup = async () => {
    const token = (await supabase.auth.getSession()).data.session?.access_token;
    if (!token) throw new Error('Not authenticated');

    const response = await fetch('/api/delink-partner/', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to unlink accounts');
    }

    // Refresh profile to reflect changes
    setPartner(null);
    onRefresh();
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-8">
      <div className="max-w-xl mx-auto space-y-6">

        {/* User Card */}
        <div className="glass-card p-8 rounded-[2.5rem] text-center">
          <div className="mb-4">
            <AvatarUpload
              userId={profile.id}
              currentAvatarUrl={profile.avatar_url}
              userName={profile.full_name}
              size="md"
              accentHex={accentHex}
              onUploadComplete={() => onRefresh()}
              editable={true}
            />
          </div>
          <h2 className="text-2xl font-black font-header text-[var(--text-primary)]">{profile.full_name}</h2>
          <p className="text-[var(--text-secondary)] text-scale-label mb-4">{profile.email}</p>

          {/* Role Badge (display only, not toggleable) */}
          <div className="py-2 px-6 rounded-xl inline-block" style={{ backgroundColor: `${accentHex}15` }}>
            <p className="text-scale-micro font-black uppercase tracking-tighter" style={{ color: accentHex }}>
              {profile.role === 'student'
                ? t('profile.roles.student', { language: t(`languageNames.${targetLanguage}`) })
                : t('profile.roles.tutor')}
            </p>
          </div>
        </div>

        {/* Languages Section */}
        <LanguagesSection profile={profile} onRefresh={onRefresh} />

        {/* Subscription Manager */}
        <SubscriptionManager
          profile={{
            id: profile.id,
            subscription_plan: profile.subscription_plan || null,
            subscription_status: profile.subscription_status || null,
            subscription_ends_at: profile.subscription_ends_at || null,
            subscription_granted_by: profile.subscription_granted_by || null,
            linked_user_id: profile.linked_user_id || null,
            stripe_customer_id: profile.stripe_customer_id || null,
            free_tier_chosen_at: profile.free_tier_chosen_at || null,
            promo_expires_at: profile.promo_expires_at || null
          }}
          partnerName={partner?.full_name}
        />

        {/* Usage Section - Shows usage against plan limits */}
        <UsageSection userId={profile.id} />

        {/* Account Settings - Email, Password, and Creator Access */}
        <AccountSettings
          email={profile.email}
          accentHex={accentHex}
          subscriptionPlan={profile.subscription_plan}
          promoExpiresAt={(profile as any).promo_expires_at}
        />

        {/* Invite Partner Section - Only for payers without a partner */}
        <InvitePartnerSection
          userId={profile.id}
          subscriptionStatus={profile.subscription_status || null}
          subscriptionGrantedBy={profile.subscription_granted_by || null}
          linkedUserId={profile.linked_user_id || null}
        />

        {/* Connected Partner Card - Only show if linked */}
        {partner && (
          <div className="glass-card p-8 rounded-[2.5rem]">
            <h3 className="text-scale-micro font-black font-header mb-6 flex items-center justify-between text-[var(--text-secondary)] uppercase tracking-[0.2em]">
              <span className="flex items-center gap-2">
                <ICONS.Heart style={{ color: accentHex }} className="w-4 h-4" />
                {t('profile.partner.title')}
              </span>
              <button
                onClick={() => setShowBreakupModal(true)}
                className="text-red-400 hover:text-red-500 text-scale-micro font-bold normal-case tracking-normal transition-colors"
              >
                {t('profile.partner.unlink')}
              </button>
            </h3>
            <div
              className="flex items-center gap-4 p-5 rounded-[2rem] border relative overflow-hidden group"
              style={{ backgroundColor: `${accentHex}15`, borderColor: `${accentHex}30` }}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ICONS.Heart className="w-16 h-16" style={{ fill: accentHex }} />
              </div>
              <div
                className="w-12 h-12 glass-card rounded-full flex items-center justify-center font-black z-10 border-2"
                style={{ color: accentHex, borderColor: `${accentHex}30` }}
              >
                {(partner.full_name?.[0] || '?').toUpperCase()}
              </div>
              <div className="flex-1 z-10">
                <p className="font-black text-[var(--text-primary)] text-scale-label leading-none mb-1">{partner.full_name}</p>
                <p className="text-scale-micro font-bold uppercase tracking-wider" style={{ color: accentHex }}>{partner.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center text-green-500 z-10">
                <ICONS.Check className="w-4 h-4" />
              </div>
            </div>
          </div>
        )}

        {/* Customisation Section */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden">
          <button
            onClick={() => setShowCustomisation(!showCustomisation)}
            className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
                <ICONS.Palette className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold font-header text-[var(--text-primary)]">{t('profile.customisation.title')}</h3>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.customisation.subtitle')}</p>
              </div>
            </div>
            <ICONS.ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showCustomisation ? 'rotate-180' : ''}`} />
          </button>

          {showCustomisation && (
            <div className="px-6 pb-6 space-y-6 border-t border-[var(--border-color)] pt-4">
              {/* Accent Color */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.accentColor')}</label>
                <div className="flex gap-3">
                  {(Object.keys(ACCENT_COLORS) as AccentColor[]).map((color) => (
                    <button
                      key={color}
                      onClick={() => setAccentColor(color)}
                      className={`relative w-12 h-12 rounded-full transition-transform hover:scale-110 ${
                        theme.accentColor === color ? 'ring-2 ring-offset-2 ring-[var(--text-primary)] scale-110' : ''
                      }`}
                      style={{ backgroundColor: ACCENT_COLORS[color].primary }}
                      title={ACCENT_COLORS[color].name}
                    >
                      {theme.accentColor === color && (
                        <ICONS.Check className="w-5 h-5 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                      )}
                    </button>
                  ))}
                </div>
                <p className="text-scale-caption text-[var(--text-secondary)] mt-2">{ACCENT_COLORS[theme.accentColor].name}</p>
              </div>

              {/* Dark Mode */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.darkMode')}</label>
                <div className="grid grid-cols-2 gap-2">
                  {(Object.keys(DARK_MODE_STYLES) as DarkModeStyle[]).map((style) => (
                    <button
                      key={style}
                      onClick={() => setDarkMode(style)}
                      className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${
                        theme.darkMode === style
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg border border-[var(--border-color)]"
                        style={{ backgroundColor: DARK_MODE_STYLES[style].bgPrimary }}
                      />
                      <span className="text-scale-label font-medium text-[var(--text-primary)]">
                        {DARK_MODE_STYLES[style].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.fontSize')}</label>
                <div className="flex gap-2">
                  {(Object.keys(FONT_SIZES) as FontSize[]).map((size) => (
                    <button
                      key={size}
                      onClick={() => setFontSize(size)}
                      className={`flex-1 p-3 rounded-xl border-2 transition-all ${
                        theme.fontSize === size
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                    >
                      <span
                        className="font-medium text-[var(--text-primary)]"
                        style={{ fontSize: FONT_SIZES[size].base }}
                      >
                        Aa
                      </span>
                      <p className="text-scale-caption text-[var(--text-secondary)] mt-1">{FONT_SIZES[size].name}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Style */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.fontStyle', 'Font Style')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FONT_PRESETS) as FontPreset[]).map((preset) => (
                    <button
                      key={preset}
                      onClick={() => setFontPreset(preset)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        theme.fontPreset === preset
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                      style={{
                        backgroundColor: theme.fontPreset === preset ? 'var(--accent-light)' : 'var(--bg-card)'
                      }}
                    >
                      <span
                        className="text-lg font-bold block text-[var(--text-primary)]"
                        style={{ fontFamily: FONT_PRESETS[preset].header }}
                      >
                        Aa
                      </span>
                      <span className="text-scale-caption mt-1 block text-[var(--text-secondary)]">
                        {FONT_PRESETS[preset].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Weight */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.fontWeight', 'Font Weight')}</label>
                <div className="grid grid-cols-3 gap-2">
                  {(Object.keys(FONT_WEIGHTS) as FontWeight[]).map((weight) => (
                    <button
                      key={weight}
                      onClick={() => setFontWeight(weight)}
                      className={`p-3 rounded-xl border-2 transition-all ${
                        theme.fontWeight === weight
                          ? 'border-[var(--accent-color)]'
                          : 'border-[var(--border-color)] hover:border-[var(--text-secondary)]'
                      }`}
                      style={{
                        backgroundColor: theme.fontWeight === weight ? 'var(--accent-light)' : 'var(--bg-card)'
                      }}
                    >
                      <span
                        className="text-lg block text-[var(--text-primary)]"
                        style={{ fontWeight: FONT_WEIGHTS[weight].textWeight }}
                      >
                        Aa
                      </span>
                      <span className="text-scale-caption mt-1 block text-[var(--text-secondary)]">
                        {FONT_WEIGHTS[weight].name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Sound Effects */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.sounds')}</label>
                <button
                  onClick={() => {
                    const newMuted = sounds.toggleMute();
                    setIsSoundMuted(newMuted);
                    if (!newMuted) sounds.play('notification');
                  }}
                  className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between"
                  style={{
                    borderColor: !isSoundMuted ? accentHex : 'var(--border-color)',
                    backgroundColor: !isSoundMuted ? `${accentHex}08` : 'transparent'
                  }}
                >
                  <div className="flex items-center gap-3">
                    {isSoundMuted ? <ICONS.VolumeX className="w-6 h-6 text-[var(--text-secondary)]" /> : <ICONS.Volume2 className="w-6 h-6 text-[var(--accent-color)]" />}
                    <div className="text-left">
                      <p className="font-bold text-[var(--text-primary)]">
                        {isSoundMuted ? t('profile.customisation.soundsOff') : t('profile.customisation.soundsOn')}
                      </p>
                      <p className="text-scale-caption text-[var(--text-secondary)]">
                        {isSoundMuted
                          ? t('profile.customisation.soundsOffDesc')
                          : t('profile.customisation.soundsOnDesc')}
                      </p>
                    </div>
                  </div>
                  <div
                    className="w-12 h-7 rounded-full p-1 transition-all"
                    style={{ backgroundColor: !isSoundMuted ? accentHex : 'var(--border-color)' }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform ${
                        !isSoundMuted ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>

                {/* Volume Slider - only show when sounds are enabled */}
                {!isSoundMuted && (
                  <div className="mt-3 p-4 bg-white/40 dark:bg-white/12 rounded-xl">
                    <div className="flex items-center gap-3">
                      <ICONS.Volume1 className="w-5 h-5 text-[var(--text-secondary)]" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={soundVolume}
                        onChange={(e) => {
                          const vol = parseInt(e.target.value);
                          setSoundVolume(vol);
                          sounds.setVolume(vol / 100);
                        }}
                        onMouseUp={() => sounds.play('notification')}
                        onTouchEnd={() => sounds.play('notification')}
                        className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                        style={{
                          background: `linear-gradient(to right, ${accentHex} 0%, ${accentHex} ${soundVolume}%, var(--border-color) ${soundVolume}%, var(--border-color) 100%)`
                        }}
                      />
                      <ICONS.Volume2 className="w-5 h-5 text-[var(--accent-color)]" />
                    </div>
                    <p className="text-center text-scale-caption text-[var(--text-secondary)] mt-2">
                      {t('profile.customisation.volumeLevel', 'Volume')}: {Math.round(soundVolume)}%
                    </p>
                  </div>
                )}
              </div>

              {/* Haptic Feedback (only shown on native platforms) */}
              {isHapticsAvailable && (
                <div>
                  <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.haptics', 'Haptic Feedback')}</label>
                  <button
                    onClick={() => {
                      const newEnabled = haptics.toggle();
                      setIsHapticsEnabled(newEnabled);
                      if (newEnabled) haptics.trigger('button');
                    }}
                    className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between"
                    style={{
                      borderColor: isHapticsEnabled ? accentHex : 'var(--border-color)',
                      backgroundColor: isHapticsEnabled ? `${accentHex}08` : 'transparent'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {isHapticsEnabled ? <ICONS.Smartphone className="w-6 h-6 text-[var(--accent-color)]" /> : <ICONS.Smartphone className="w-6 h-6 text-[var(--text-secondary)]" />}
                      <div className="text-left">
                        <p className="font-bold text-[var(--text-primary)]">
                          {isHapticsEnabled ? t('profile.customisation.hapticsOn', 'Vibration On') : t('profile.customisation.hapticsOff', 'Vibration Off')}
                        </p>
                        <p className="text-scale-caption text-[var(--text-secondary)]">
                          {isHapticsEnabled
                            ? t('profile.customisation.hapticsOnDesc', 'Feel taps when you get answers right or wrong')
                            : t('profile.customisation.hapticsOffDesc', 'No vibration feedback during games')}
                        </p>
                      </div>
                    </div>
                    <div
                      className="w-12 h-7 rounded-full p-1 transition-all"
                      style={{ backgroundColor: isHapticsEnabled ? accentHex : 'var(--border-color)' }}
                    >
                      <div
                        className={`w-5 h-5 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform ${
                          isHapticsEnabled ? 'translate-x-5' : 'translate-x-0'
                        }`}
                      />
                    </div>
                  </button>
                </div>
              )}

              {/* Answer Validation Mode */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-3">{t('profile.customisation.answerChecking')}</label>
                <button
                  onClick={toggleSmartValidation}
                  disabled={savingValidation}
                  className="w-full p-4 rounded-xl border-2 transition-all flex items-center justify-between"
                  style={{
                    borderColor: smartValidation ? accentHex : 'var(--border-color)',
                    backgroundColor: smartValidation ? `${accentHex}08` : 'transparent'
                  }}
                >
                  <div className="flex items-center gap-3">
                    {smartValidation ? <ICONS.Lightbulb className="w-6 h-6 text-[var(--accent-color)]" /> : <ICONS.Target className="w-6 h-6 text-[var(--text-secondary)]" />}
                    <div className="text-left">
                      <p className="font-bold text-[var(--text-primary)]">
                        {smartValidation ? t('profile.customisation.smartMode') : t('profile.customisation.strictMode')}
                      </p>
                      <p className="text-scale-caption text-[var(--text-secondary)]">
                        {smartValidation
                          ? t('profile.customisation.smartModeDesc')
                          : t('profile.customisation.strictModeDesc')}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`w-12 h-7 rounded-full p-1 transition-all ${
                      savingValidation ? 'opacity-50' : ''
                    }`}
                    style={{ backgroundColor: smartValidation ? accentHex : 'var(--border-color)' }}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-[var(--bg-card)] shadow-sm transition-transform ${
                        smartValidation ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </div>
                </button>
              </div>

              {/* Preview */}
              <div className="p-4 rounded-xl bg-[var(--bg-primary)] border border-[var(--border-color)]">
                <p className="text-scale-caption text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.customisation.preview')}</p>
                <p
                  className="text-[var(--text-primary)]"
                  dangerouslySetInnerHTML={{
                    __html: t('profile.customisation.previewText', { language: targetName, iLoveYou })
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Advanced Settings */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden">
          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full p-6 flex items-center justify-between hover:opacity-80 transition-opacity"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[var(--bg-primary)] flex items-center justify-center">
                <ICONS.Settings className="w-5 h-5 text-[var(--text-secondary)]" />
              </div>
              <div className="text-left">
                <h3 className="font-bold font-header text-[var(--text-primary)]">{t('profile.advanced.title')}</h3>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.advanced.subtitle')}</p>
              </div>
            </div>
            <ICONS.ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${showAdvanced ? 'rotate-180' : ''}`} />
          </button>

          {showAdvanced && (
            <div className="px-6 pb-6 space-y-4 border-t border-[var(--border-color)] pt-4">
              {/* Common fields */}
              <div>
                <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.yourName')}</label>
                <input
                  type="text"
                  value={editData.userName || ''}
                  onChange={(e) => updateField('userName', e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none"
                />
              </div>

              {profile.role === 'student' ? (
                <>
                  {/* Student-specific fields */}
                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.partnerName')}</label>
                    <input
                      type="text"
                      value={editData.partnerName || ''}
                      onChange={(e) => updateField('partnerName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.relationshipVibe')}</label>
                    <select
                      value={editData.relationshipVibe || ''}
                      onChange={(e) => updateField('relationshipVibe', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      {VIBE_OPTIONS.map(v => <option key={v} value={v}>{t(`profile.vibeOptions.${v}`, v)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.learningReason', { language: targetName })}</label>
                    <textarea
                      value={editData.learningReason || ''}
                      onChange={(e) => updateField('learningReason', e.target.value)}
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none resize-none"
                      placeholder={t('profile.advanced.motivationPlaceholder')}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.dailyTime')}</label>
                      <select
                        value={editData.dailyTime || ''}
                        onChange={(e) => updateField('dailyTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none bg-[var(--bg-card)]"
                      >
                        <option value="">{t('profile.advanced.select')}</option>
                        {TIME_OPTIONS.map(opt => <option key={opt} value={opt}>{t(`profile.timeOptions.${opt}`, opt)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.preferredTime')}</label>
                      <select
                        value={editData.preferredTime || ''}
                        onChange={(e) => updateField('preferredTime', e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none bg-[var(--bg-card)]"
                      >
                        <option value="">{t('profile.advanced.select')}</option>
                        {WHEN_OPTIONS.map(w => <option key={w} value={w}>{t(`profile.whenOptions.${w}`, w)}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.biggestChallenge')}</label>
                    <select
                      value={editData.biggestFear || ''}
                      onChange={(e) => updateField('biggestFear', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      {FEAR_OPTIONS.map(f => <option key={f} value={f}>{t(`profile.fearOptions.${f}`, f)}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.firstGoal')}</label>
                    <input
                      type="text"
                      value={editData.firstGoal || ''}
                      onChange={(e) => updateField('firstGoal', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-[var(--accent-border)] focus:outline-none"
                      placeholder={t('profile.advanced.goalPlaceholder')}
                    />
                  </div>
                </>
              ) : (
                <>
                  {/* Tutor-specific fields */}
                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.learnerName')}</label>
                    <input
                      type="text"
                      value={editData.learnerName || ''}
                      onChange={(e) => updateField('learnerName', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.relationshipType')}</label>
                    <select
                      value={editData.relationshipType || ''}
                      onChange={(e) => updateField('relationshipType', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      {RELATION_OPTIONS.map(r => <option key={r} value={r} className="capitalize">{t(`profile.relationOptions.${r}`, r.charAt(0).toUpperCase() + r.slice(1))}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.languageConnection', { language: targetName })}</label>
                    <select
                      value={editData.languageConnection || editData.polishConnection || ''}
                      onChange={(e) => updateField('languageConnection', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      {CONNECTION_OPTIONS.map(c => <option key={c} value={c} className="capitalize">{t(`profile.connectionOptions.${c}`, c.charAt(0).toUpperCase() + c.slice(1))}</option>)}
                    </select>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.howYouLearned', { language: targetName })}</label>
                    <select
                      value={editData.languageOrigin || editData.polishOrigin || ''}
                      onChange={(e) => updateField('languageOrigin', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      <option value="poland">{t('profile.originOptions.grewUp')}</option>
                      <option value="family">{t('profile.originOptions.family')}</option>
                      <option value="school">{t('profile.originOptions.school')}</option>
                      <option value="self">{t('profile.originOptions.self')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.dreamPhrase')}</label>
                    <input
                      type="text"
                      value={editData.dreamPhrase || ''}
                      onChange={(e) => updateField('dreamPhrase', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none"
                      placeholder={t('profile.advanced.dreamPhrasePlaceholder')}
                    />
                  </div>

                  <div>
                    <label className="block text-scale-caption font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">{t('profile.advanced.teachingStyle')}</label>
                    <select
                      value={editData.teachingStyle || ''}
                      onChange={(e) => updateField('teachingStyle', e.target.value)}
                      className="w-full px-4 py-3 rounded-xl border border-[var(--border-color)] focus:border-teal-300 focus:outline-none bg-[var(--bg-card)]"
                    >
                      <option value="">{t('profile.advanced.select')}</option>
                      <option value="patient">{t('profile.styleOptions.patient')}</option>
                      <option value="playful">{t('profile.styleOptions.playful')}</option>
                      <option value="structured">{t('profile.styleOptions.structured')}</option>
                      <option value="immersive">{t('profile.styleOptions.immersive')}</option>
                    </select>
                  </div>
                </>
              )}

              {/* Save button */}
              <button
                onClick={saveChanges}
                disabled={saving}
                className={`w-full py-4 rounded-xl font-bold text-white transition-all ${
                  saved
                    ? 'bg-green-500'
                    : profile.role === 'student'
                      ? 'bg-[var(--accent-color)] hover:bg-[var(--accent-hover)]'
                      : 'bg-teal-500 hover:bg-teal-600'
                } disabled:opacity-50`}
              >
                {saving ? t('profile.buttons.saving') : saved ? t('profile.buttons.saved') : t('profile.buttons.saveChanges')}
              </button>
            </div>
          )}
        </div>

        {/* Extras Section */}
        <div className="glass-card rounded-[2.5rem] overflow-hidden">
          <div className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: `${accentHex}20` }}>
                <ICONS.Book className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <div>
                <h3 className="font-bold font-header text-[var(--text-primary)]">{t('profile.extras.title')}</h3>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.extras.subtitle')}</p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Install App Button - Only show on web when install is available */}
              {!isNativeApp && installPrompt && (
                <button
                  onClick={handleInstallApp}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border-2 transition-all group"
                  style={{
                    borderColor: accentHex,
                    backgroundColor: `${accentHex}10`
                  }}
                >
                  <ICONS.Download className="w-5 h-5 text-[var(--accent-color)]" />
                  <div className="flex-1 text-left">
                    <p className="font-bold text-[var(--text-primary)]">{t('profile.extras.installApp')}</p>
                    <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.extras.installAppDesc')}</p>
                  </div>
                  <div
                    className="px-3 py-1 rounded-full text-scale-caption font-bold text-white"
                    style={{ backgroundColor: accentHex }}
                  >
                    {t('profile.extras.install')}
                  </div>
                </button>
              )}

              {/* Installed confirmation */}
              {!isNativeApp && isInstalled && !installPrompt && (
                <div className="flex items-center gap-3 p-4 rounded-xl border border-green-200 bg-green-50">
                  <ICONS.Check className="w-5 h-5 text-green-600" />
                  <div className="flex-1">
                    <p className="font-bold text-green-700">{t('profile.extras.appInstalled')}</p>
                    <p className="text-scale-caption text-green-600">{t('profile.extras.appInstalledDesc')}</p>
                  </div>
                </div>
              )}

              <a
                href="/learn"
                className="flex items-center gap-3 p-4 rounded-xl border border-[var(--border-color)] hover:border-[var(--accent-color)] transition-all group"
              >
                <ICONS.FileText className="w-5 h-5 text-[var(--text-secondary)]" />
                <div className="flex-1">
                  <p className="font-bold text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">{t('profile.links.blog', { language: targetName })}</p>
                  <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.links.blogDescription')}</p>
                </div>
                <ICONS.ChevronDown className="w-4 h-4 text-[var(--text-secondary)] -rotate-90" />
              </a>

              <div className="flex gap-2 pt-2">
                <a
                  href="/#/terms"
                  className="flex-1 text-center py-2 text-scale-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('profile.extras.termsOfService')}
                </a>
                <a
                  href="/#/privacy"
                  className="flex-1 text-center py-2 text-scale-caption text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors"
                >
                  {t('profile.extras.privacyPolicy')}
                </a>
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={() => supabase.auth.signOut({ scope: 'local' })}
          className="w-full py-6 text-[var(--text-secondary)] text-scale-micro font-black hover:opacity-70 transition-all uppercase tracking-[0.3em]"
        >
          {t('profile.buttons.signOut')}
        </button>
      </div>

      {/* Breakup Modal */}
      {showBreakupModal && partner && (
        <BreakupModal
          partnerName={partner.full_name}
          isGranter={isPayer}
          onConfirm={handleBreakup}
          onCancel={() => setShowBreakupModal(false)}
        />
      )}
    </div>
  );
};

export default ProfileView;
