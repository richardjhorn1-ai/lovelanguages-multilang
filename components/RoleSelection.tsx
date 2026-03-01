import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { UserRole, Profile } from '../types';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../constants/language-config';
import { useLanguage } from '../context/LanguageContext';

interface RoleSelectionProps {
  userId: string;
  profile: Profile;
  onRoleSelected: () => void;
}

const RoleSelection: React.FC<RoleSelectionProps> = ({ userId, profile, onRoleSelected }) => {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Language confirmation state - initialized from the PROFILE (source of truth)
  const [nativeLanguage, setNativeLanguage] = useState<string>(profile.native_language || 'en');
  const [targetLanguage, setTargetLanguage] = useState<string>(profile.active_language || 'pl');
  const [showNativeDropdown, setShowNativeDropdown] = useState(false);
  const [showTargetDropdown, setShowTargetDropdown] = useState(false);
  const nativeDropdownRef = useRef<HTMLDivElement>(null);
  const targetDropdownRef = useRef<HTMLDivElement>(null);

  const { t } = useTranslation();
  const { setLanguageOverride } = useLanguage();

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (nativeDropdownRef.current && !nativeDropdownRef.current.contains(event.target as Node)) {
        setShowNativeDropdown(false);
      }
      if (targetDropdownRef.current && !targetDropdownRef.current.contains(event.target as Node)) {
        setShowTargetDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Pre-select role from profile (set during signup) or fall back to metadata/localStorage
  useEffect(() => {
    const checkIntendedRole = async () => {
      try {
        // Priority 1: Use role already set in profile (from signup trigger)
        if (profile.role === 'student' || profile.role === 'tutor') {
          setSelectedRole(profile.role);
          setLoading(false);
          return;
        }

        // Priority 2: Check user metadata (for email signups)
        const { data: { user } } = await supabase.auth.getUser();
        const userMeta = user?.user_metadata || {};
        let intendedRole = userMeta.intended_role;

        // Priority 3: Check localStorage (for OAuth signups)
        if (!intendedRole) {
          const storedRole = localStorage.getItem('intended_role');
          if (storedRole === 'student' || storedRole === 'tutor') {
            intendedRole = storedRole;
            localStorage.removeItem('intended_role');
          }
        }

        if (intendedRole === 'student' || intendedRole === 'tutor') {
          setSelectedRole(intendedRole as UserRole);
        }
      } catch (err) {
        console.error('Error checking intended role:', err);
      } finally {
        setLoading(false);
      }
    };

    checkIntendedRole();
  }, [userId, profile.native_language, profile.role]);

  const handleNativeSelect = (code: string) => {
    setNativeLanguage(code);
    setShowNativeDropdown(false);
    // Update LanguageContext override → useI18nSync picks it up → i18n updates
    setLanguageOverride({ nativeLanguage: code, targetLanguage });
  };

  const handleTargetSelect = (code: string) => {
    setTargetLanguage(code);
    setShowTargetDropdown(false);
    setLanguageOverride({ nativeLanguage, targetLanguage: code });
  };

  const handleConfirm = async () => {
    if (!selectedRole) return;

    setSaving(true);
    try {
      // Save role, languages, and mark as confirmed
      const { error } = await supabase
        .from('profiles')
        .update({
          role: selectedRole,
          role_confirmed_at: new Date().toISOString(),
          native_language: nativeLanguage,
          active_language: targetLanguage,
          languages: [targetLanguage]
        })
        .eq('id', userId);

      if (error) throw error;

      // Clear localStorage language preferences since they're now confirmed in database
      localStorage.removeItem('preferredNativeLanguage');
      localStorage.removeItem('preferredLanguage');  // Legacy key cleanup
      localStorage.removeItem('preferredTargetLanguage');

      onRoleSelected();
    } catch (err) {
      console.error('Error saving profile:', err);
      setSaving(false);
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
        <div className="text-center">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
            <ICONS.Heart className="w-8 h-8" style={{ color: 'var(--accent-color)' }} />
          </div>
          <div className="inline-flex items-center gap-2 text-[var(--text-secondary)]">
            <div className="w-5 h-5 border-2 border-[var(--accent-color)] border-t-transparent rounded-full animate-spin" />
            {t('roleSelection.loading')}
          </div>
        </div>
      </div>
    );
  }

  const isStudent = selectedRole === 'student';
  const isTutor = selectedRole === 'tutor';
  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage] || LANGUAGE_CONFIGS['en'];
  const targetConfig = LANGUAGE_CONFIGS[targetLanguage] || LANGUAGE_CONFIGS['pl'];

  // Role-specific content
  const roleContent = {
    student: {
      icon: <ICONS.Book className="w-7 h-7" />,
      title: t('roleSelection.student.title', { language: t(`languageNames.${targetLanguage}`) }),
      subtitle: t('roleSelection.student.subtitle', { language: t(`languageNames.${targetLanguage}`) }),
      confirmMessage: t('roleSelection.student.confirmMessage', { language: t(`languageNames.${targetLanguage}`) }),
      confirmSubtext: t('roleSelection.student.confirmSubtext'),
      accentColor: 'var(--accent-color)',
      bgLight: 'bg-[var(--accent-light)]',
      bgAccent: 'bg-[var(--accent-light)]',
      borderAccent: 'border-[var(--accent-color)]',
      hoverBorder: 'hover:border-[var(--accent-border)]',
      hoverBg: 'hover:bg-[var(--accent-light)]',
    },
    tutor: {
      icon: <ICONS.Sparkles className="w-7 h-7" />,
      title: t('roleSelection.tutor.title', { language: t(`languageNames.${targetLanguage}`) }),
      subtitle: t('roleSelection.tutor.subtitle'),
      confirmMessage: t('roleSelection.tutor.confirmMessage', { language: t(`languageNames.${targetLanguage}`) }),
      confirmSubtext: t('roleSelection.tutor.confirmSubtext'),
      accentColor: 'var(--accent-color)',
      bgLight: 'bg-[var(--accent-light)]',
      bgAccent: 'bg-[var(--accent-light)]',
      borderAccent: 'border-[var(--accent-color)]',
      hoverBorder: 'hover:border-[var(--accent-border)]',
      hoverBg: 'hover:bg-rose-50',
    },
  };

  // Language dropdown component
  const LanguageDropdown = ({
    label,
    value,
    isOpen,
    setIsOpen,
    onSelect,
    dropdownRef,
    excludeCode,
  }: {
    label: string;
    value: string;
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    onSelect: (code: string) => void;
    dropdownRef: React.RefObject<HTMLDivElement>;
    excludeCode?: string;
  }) => {
    const config = LANGUAGE_CONFIGS[value] || LANGUAGE_CONFIGS['en'];
    const availableLanguages = SUPPORTED_LANGUAGE_CODES.filter(code => code !== excludeCode);

    return (
      <div ref={dropdownRef} className="relative">
        <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">{label}</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={saving}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 glass-card rounded-xl hover:border-rose-300 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.flag}</span>
            <div className="text-left">
              <div className="font-semibold text-[var(--text-primary)]">{t(`languageNames.${value}`)}</div>
              <div className="text-sm text-[var(--text-secondary)]">{config.nativeName}</div>
            </div>
          </div>
          <ICONS.ChevronDown className={`w-5 h-5 text-[var(--text-secondary)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto glass-card-solid rounded-xl">
            {availableLanguages.map(code => {
              const langConfig = LANGUAGE_CONFIGS[code];
              return (
                <button
                  key={code}
                  onClick={() => onSelect(code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-[var(--accent-light)] transition-colors text-left ${
                    code === value ? 'bg-[var(--accent-light)]' : ''
                  }`}
                >
                  <span className="text-xl">{langConfig.flag}</span>
                  <div>
                    <div className="font-medium text-[var(--text-primary)]">{t(`languageNames.${code}`)}</div>
                    <div className="text-sm text-[var(--text-secondary)]">{langConfig.nativeName}</div>
                  </div>
                  {code === value && (
                    <ICONS.Check className="w-5 h-5 text-[var(--accent-color)] ml-auto" />
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen h-screen flex flex-col bg-gradient-to-br from-pink-50 to-rose-100 overflow-hidden" style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      {/* Header bar — consistent with OnboardingStep */}
      <div className="flex items-center justify-between px-6 py-4 flex-shrink-0">
        <button
          onClick={() => supabase.auth.signOut()}
          className="flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors"
        >
          <ICONS.ChevronLeft className="w-5 h-5" />
          <span className="text-scale-label font-medium">{t('onboarding.step.back')}</span>
        </button>
        <div />
        <button
          onClick={() => supabase.auth.signOut()}
          className="text-[var(--text-secondary)] hover:text-[var(--text-secondary)] transition-colors p-1"
          title={t('onboarding.step.quitTitle')}
        >
          <ICONS.X className="w-5 h-5" />
        </button>
      </div>

      <div
        className="flex-1 flex flex-col items-center px-4 md:px-6 pb-6 md:pb-8 overflow-y-auto min-h-0"
        style={{
          WebkitOverflowScrolling: 'touch',
          touchAction: 'pan-y',
        }}
      >
        <div className="w-full max-w-md md:max-w-3xl">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: 'var(--accent-light)' }}>
              <ICONS.Heart className="w-7 h-7" style={{ color: 'var(--accent-color)' }} />
            </div>
            <h1 className="text-2xl font-black text-[var(--text-primary)] mb-2 font-header">
              {t('roleSelection.confirmSettings')}
            </h1>
            <p className="text-[var(--text-secondary)]">
              {t('roleSelection.confirmSettingsSubtitle')}
            </p>
          </div>

          {/* Two-column layout on desktop, stacked on mobile */}
          <div className="flex flex-col md:flex-row md:gap-6 md:items-start">
            {/* Language Confirmation Section */}
            <div className="flex-1 bg-white/70 backdrop-blur-sm rounded-2xl p-5 mb-4 md:mb-0 border border-white/80">
              <h2 className="text-sm font-bold font-header text-[var(--text-primary)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <ICONS.Globe className="w-5 h-5 text-[var(--accent-color)]" />
                {t('roleSelection.languageSettings')}
              </h2>

              <div className="space-y-4">
                {/* Native Language (Interface) */}
                <LanguageDropdown
                  label={t('roleSelection.nativeLanguage')}
                  value={nativeLanguage}
                  isOpen={showNativeDropdown}
                  setIsOpen={setShowNativeDropdown}
                  onSelect={handleNativeSelect}
                  dropdownRef={nativeDropdownRef as React.RefObject<HTMLDivElement>}
                  excludeCode={selectedRole === 'student' || !selectedRole ? targetLanguage : undefined}
                />

                {/* Target Language (Learning/Teaching) */}
                <LanguageDropdown
                  label={isStudent || !selectedRole ? t('roleSelection.learningLanguage') : t('roleSelection.teachingLanguage')}
                  value={targetLanguage}
                  isOpen={showTargetDropdown}
                  setIsOpen={setShowTargetDropdown}
                  onSelect={handleTargetSelect}
                  dropdownRef={targetDropdownRef as React.RefObject<HTMLDivElement>}
                  excludeCode={selectedRole === 'student' || !selectedRole ? nativeLanguage : undefined}
                />
              </div>
            </div>

            {/* Role Selection Section */}
            <div className="flex-1 mb-4 md:mb-0">
              <h2 className="text-sm font-bold font-header text-[var(--text-primary)] uppercase tracking-wide mb-4 flex items-center gap-2">
                <ICONS.User className="w-5 h-5 text-[var(--accent-color)]" />
                {t('roleSelection.chooseYourRole')}
              </h2>

              <div className="space-y-3">
                {/* Student Option */}
                <button
                  onClick={() => setSelectedRole('student')}
                  disabled={saving}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
                    isStudent
                      ? `${roleContent.student.borderAccent} ${roleContent.student.bgLight} shadow-md`
                      : `border-[var(--border-color)] bg-[var(--bg-card)] ${roleContent.student.hoverBorder} ${roleContent.student.hoverBg}`
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${roleContent.student.bgAccent} flex items-center justify-center`}>
                      <span className="text-[var(--accent-color)]">{roleContent.student.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-header text-[var(--text-primary)]">{roleContent.student.title}</h3>
                      <p className="text-[var(--text-secondary)] text-sm">{roleContent.student.subtitle}</p>
                    </div>
                    {isStudent && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: roleContent.student.accentColor }}
                      >
                        <ICONS.Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>

                {/* Tutor Option */}
                <button
                  onClick={() => setSelectedRole('tutor')}
                  disabled={saving}
                  className={`w-full p-5 rounded-2xl border-2 transition-all text-left disabled:opacity-50 ${
                    isTutor
                      ? `${roleContent.tutor.borderAccent} ${roleContent.tutor.bgLight} shadow-md`
                      : `border-[var(--border-color)] bg-[var(--bg-card)] ${roleContent.tutor.hoverBorder} ${roleContent.tutor.hoverBg}`
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full ${roleContent.tutor.bgAccent} flex items-center justify-center`}>
                      <span className="text-[var(--accent-color)]">{roleContent.tutor.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold font-header text-[var(--text-primary)]">{roleContent.tutor.title}</h3>
                      <p className="text-[var(--text-secondary)] text-sm">{roleContent.tutor.subtitle}</p>
                    </div>
                    {isTutor && (
                      <div
                        className="w-6 h-6 rounded-full flex items-center justify-center"
                        style={{ backgroundColor: roleContent.tutor.accentColor }}
                      >
                        <ICONS.Check className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                </button>
              </div>
            </div>
          </div>

          {/* Confirmation Button - full width below the two columns */}
          {selectedRole && (
            <div className="text-center animate-fadeIn mt-6">
              <p className="text-lg font-bold text-[var(--text-primary)] mb-1">
                {roleContent[selectedRole].confirmMessage}
              </p>
              <p className="text-[var(--text-secondary)] text-sm mb-6">
                {roleContent[selectedRole].confirmSubtext}
              </p>

              <button
                onClick={handleConfirm}
                disabled={saving}
                className="w-full md:max-w-md md:mx-auto py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50 block"
                style={{ backgroundColor: roleContent[selectedRole].accentColor }}
              >
                {saving ? (
                  <span className="inline-flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    {t('roleSelection.settingUp')}
                  </span>
                ) : (
                  t('roleSelection.letsGo')
                )}
              </button>
            </div>
          )}

          {/* Fallback if nothing selected */}
          {!selectedRole && (
            <p className="text-center text-[var(--text-secondary)] text-sm mt-6">
              {t('roleSelection.chooseRole')}
            </p>
          )}

          {/* Bottom padding for iOS safe area */}
          <div className="h-6 md:h-0" />
        </div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
};

export default RoleSelection;
