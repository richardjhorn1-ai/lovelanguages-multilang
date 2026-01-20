import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { UserRole, Profile } from '../types';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS, SUPPORTED_LANGUAGE_CODES } from '../constants/language-config';

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

  const { t, i18n } = useTranslation();

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
        // Sync i18n with native language from profile
        if (profile.native_language && i18n.language !== profile.native_language) {
          i18n.changeLanguage(profile.native_language);
        }

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
  }, [userId, i18n, profile.native_language, profile.role]);

  const handleNativeSelect = (code: string) => {
    setNativeLanguage(code);
    setShowNativeDropdown(false);
    // Update i18n to show UI in selected language
    i18n.changeLanguage(code);
  };

  const handleTargetSelect = (code: string) => {
    setTargetLanguage(code);
    setShowTargetDropdown(false);
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
      localStorage.removeItem('preferredLanguage');
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
      <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-center p-6">
        <div className="text-center">
          <div className="text-6xl mb-4">💕</div>
          <div className="inline-flex items-center gap-2 text-gray-500">
            <div className="w-5 h-5 border-2 border-rose-400 border-t-transparent rounded-full animate-spin" />
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
      emoji: '📚',
      title: t('roleSelection.student.title', { language: targetConfig.name }),
      subtitle: t('roleSelection.student.subtitle', { language: targetConfig.name }),
      confirmMessage: t('roleSelection.student.confirmMessage', { language: targetConfig.name }),
      confirmSubtext: t('roleSelection.student.confirmSubtext'),
      accentColor: '#FF4761',
      bgLight: 'bg-rose-50',
      bgAccent: 'bg-rose-100',
      borderAccent: 'border-rose-400',
      hoverBorder: 'hover:border-rose-300',
      hoverBg: 'hover:bg-rose-50',
    },
    tutor: {
      emoji: '🎓',
      title: t('roleSelection.tutor.title', { language: targetConfig.name }),
      subtitle: t('roleSelection.tutor.subtitle'),
      confirmMessage: t('roleSelection.tutor.confirmMessage', { language: targetConfig.name }),
      confirmSubtext: t('roleSelection.tutor.confirmSubtext'),
      accentColor: '#FF4761',
      bgLight: 'bg-rose-50',
      bgAccent: 'bg-rose-100',
      borderAccent: 'border-rose-400',
      hoverBorder: 'hover:border-rose-300',
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
        <label className="block text-sm font-medium text-gray-600 mb-1.5">{label}</label>
        <button
          onClick={() => setIsOpen(!isOpen)}
          disabled={saving}
          className="w-full flex items-center justify-between gap-2 px-4 py-3 bg-white border-2 border-gray-200 rounded-xl hover:border-rose-300 transition-all disabled:opacity-50"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">{config.flag}</span>
            <div className="text-left">
              <div className="font-semibold text-gray-800">{config.name}</div>
              <div className="text-sm text-gray-500">{config.nativeName}</div>
            </div>
          </div>
          <ICONS.ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute z-50 mt-2 w-full max-h-64 overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-lg">
            {availableLanguages.map(code => {
              const langConfig = LANGUAGE_CONFIGS[code];
              return (
                <button
                  key={code}
                  onClick={() => onSelect(code)}
                  className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-50 transition-colors text-left ${
                    code === value ? 'bg-rose-50' : ''
                  }`}
                >
                  <span className="text-xl">{langConfig.flag}</span>
                  <div>
                    <div className="font-medium text-gray-800">{langConfig.name}</div>
                    <div className="text-sm text-gray-500">{langConfig.nativeName}</div>
                  </div>
                  {code === value && (
                    <ICONS.Check className="w-5 h-5 text-rose-500 ml-auto" />
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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-rose-100 flex flex-col items-center justify-start p-6 overflow-y-auto">
      <div className="max-w-md w-full my-auto">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-4">💕</div>
          <h1 className="text-2xl font-black text-gray-800 mb-2 font-header">
            {t('roleSelection.confirmSettings')}
          </h1>
          <p className="text-gray-500">
            {t('roleSelection.confirmSettingsSubtitle')}
          </p>
        </div>

        {/* Language Confirmation Section */}
        <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 mb-6 border border-white/80">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-lg">🌍</span>
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
              excludeCode={targetLanguage}
            />

            {/* Target Language (Learning/Teaching) */}
            <LanguageDropdown
              label={isStudent || !selectedRole ? t('roleSelection.learningLanguage') : t('roleSelection.teachingLanguage')}
              value={targetLanguage}
              isOpen={showTargetDropdown}
              setIsOpen={setShowTargetDropdown}
              onSelect={handleTargetSelect}
              dropdownRef={targetDropdownRef as React.RefObject<HTMLDivElement>}
              excludeCode={nativeLanguage}
            />
          </div>
        </div>

        {/* Role Selection Section */}
        <div className="mb-6">
          <h2 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center gap-2">
            <span className="text-lg">👤</span>
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
                  : `border-gray-200 bg-white ${roleContent.student.hoverBorder} ${roleContent.student.hoverBg}`
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${roleContent.student.bgAccent} flex items-center justify-center`}>
                  <span className="text-xl">{roleContent.student.emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{roleContent.student.title}</h3>
                  <p className="text-gray-500 text-sm">{roleContent.student.subtitle}</p>
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
                  : `border-gray-200 bg-white ${roleContent.tutor.hoverBorder} ${roleContent.tutor.hoverBg}`
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full ${roleContent.tutor.bgAccent} flex items-center justify-center`}>
                  <span className="text-xl">{roleContent.tutor.emoji}</span>
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-gray-800">{roleContent.tutor.title}</h3>
                  <p className="text-gray-500 text-sm">{roleContent.tutor.subtitle}</p>
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

        {/* Confirmation Button */}
        {selectedRole && (
          <div className="text-center animate-fadeIn">
            <p className="text-lg font-bold text-gray-700 mb-1">
              {roleContent[selectedRole].confirmMessage}
            </p>
            <p className="text-gray-500 text-sm mb-6">
              {roleContent[selectedRole].confirmSubtext}
            </p>

            <button
              onClick={handleConfirm}
              disabled={saving}
              className="w-full py-4 rounded-2xl text-white font-bold text-lg shadow-lg transition-all active:scale-[0.98] disabled:opacity-50"
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
          <p className="text-center text-gray-400 text-sm">
            {t('roleSelection.chooseRole')}
          </p>
        )}

        {/* Logout link */}
        <button
          onClick={() => supabase.auth.signOut()}
          className="mt-6 text-gray-400 hover:text-gray-600 text-sm font-medium transition-colors"
        >
          {t('roleSelection.logout', 'Log out')}
        </button>
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
