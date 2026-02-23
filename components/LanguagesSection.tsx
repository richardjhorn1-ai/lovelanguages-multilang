import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '../services/supabase';
import { Profile } from '../types';
import { ICONS } from '../constants';
import { LANGUAGE_CONFIGS } from '../constants/language-config';
import { useTheme } from '../context/ThemeContext';

interface LanguagesSectionProps {
  profile: Profile;
  onRefresh: () => void;
}

interface LanguageStats {
  code: string;
  wordCount: number;
}

const LanguagesSection: React.FC<LanguagesSectionProps> = ({ profile, onRefresh }) => {
  const { t } = useTranslation();
  const { accentHex } = useTheme();
  const [languageStats, setLanguageStats] = useState<LanguageStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState<string | null>(null);

  const nativeLanguage = profile.native_language || 'en';
  const activeLanguage = profile.active_language || 'pl';
  const languages = profile.languages || ['pl'];

  const nativeConfig = LANGUAGE_CONFIGS[nativeLanguage];
  const nativeName = t(`languageNames.${nativeLanguage}`, { defaultValue: nativeConfig?.name || 'English' });
  const nativeFlag = nativeConfig?.flag || '🇬🇧';

  useEffect(() => {
    fetchLanguageStats();
  }, [profile.id, languages]);

  const fetchLanguageStats = async () => {
    setLoading(true);
    try {
      // Get word counts for each language
      const stats: LanguageStats[] = [];

      for (const langCode of languages) {
        const { count } = await supabase
          .from('dictionary')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', profile.id)
          .eq('language_code', langCode);

        stats.push({
          code: langCode,
          wordCount: count || 0,
        });
      }

      setLanguageStats(stats);
    } catch (err) {
      console.error('Error fetching language stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSwitchLanguage = async (langCode: string) => {
    if (langCode === activeLanguage || switching) return;

    setSwitching(langCode);
    try {
      const token = (await supabase.auth.getSession()).data.session?.access_token;
      if (!token) throw new Error('Not authenticated');

      const response = await fetch('/api/switch-language/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ languageCode: langCode }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to switch language');
      }

      // Refresh profile to get updated active_language
      onRefresh();

      // Also update localStorage for immediate UI updates
      localStorage.setItem('preferredTargetLanguage', langCode);

      // Dispatch event for other components to react
      window.dispatchEvent(new CustomEvent('language-switched', { detail: { languageCode: langCode } }));
    } catch (err) {
      console.error('Error switching language:', err);
    } finally {
      setSwitching(null);
    }
  };

  const getLanguageInfo = (code: string) => {
    const config = LANGUAGE_CONFIGS[code];
    return {
      name: t(`languageNames.${code}`, { defaultValue: config?.name || code.toUpperCase() }),
      flag: config?.flag || '🌐',
    };
  };

  const getStatsForLanguage = (code: string) => {
    return languageStats.find(s => s.code === code);
  };

  return (
    <div className="glass-card p-6 rounded-[2.5rem]">
      <h3 className="text-scale-micro font-black font-header mb-6 flex items-center gap-2 text-[var(--text-secondary)] uppercase tracking-[0.2em]">
        <ICONS.Globe style={{ color: accentHex }} className="w-4 h-4" />
        {t('profile.languages.title')}
      </h3>

      {/* Native Language */}
      <div className="mb-6">
        <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          {t('profile.languages.nativeLanguage')}
        </p>
        <div
          className="flex items-center gap-3 p-4 rounded-2xl border"
          style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-color)' }}
        >
          <span className="text-2xl">{nativeFlag}</span>
          <span className="font-bold text-[var(--text-primary)]">{nativeName}</span>
        </div>
      </div>

      {/* Learning Languages */}
      <div>
        <p className="text-scale-micro font-bold text-[var(--text-secondary)] uppercase tracking-wider mb-2">
          {t('profile.languages.learning')}
        </p>
        <div className="space-y-2">
          {languages.map((langCode) => {
            const { name, flag } = getLanguageInfo(langCode);
            const stats = getStatsForLanguage(langCode);
            const isActive = langCode === activeLanguage;
            const isSwitching = switching === langCode;

            return (
              <div
                key={langCode}
                className="flex items-center gap-3 p-4 rounded-2xl border transition-all"
                style={{
                  backgroundColor: isActive ? `${accentHex}10` : 'var(--bg-primary)',
                  borderColor: isActive ? `${accentHex}40` : 'var(--border-color)',
                }}
              >
                <span className="text-2xl">{flag}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[var(--text-primary)]">{name}</span>
                    {isActive && (
                      <span
                        className="text-scale-micro font-black uppercase tracking-wider px-2 py-0.5 rounded-full"
                        style={{ backgroundColor: accentHex, color: 'white' }}
                      >
                        {t('profile.languages.active')}
                      </span>
                    )}
                  </div>
                  {!loading && stats && (
                    <p className="text-scale-caption text-[var(--text-secondary)]">
                      {t('profile.languages.wordsLearned', { count: stats.wordCount })}
                    </p>
                  )}
                  {loading && (
                    <p className="text-scale-caption text-[var(--text-secondary)]">{t('profile.languages.loading')}</p>
                  )}
                </div>
                {!isActive && (
                  <button
                    onClick={() => handleSwitchLanguage(langCode)}
                    disabled={isSwitching}
                    className="px-4 py-2 rounded-xl text-scale-caption font-bold transition-all active:scale-[0.98] disabled:opacity-50"
                    style={{
                      backgroundColor: `${accentHex}15`,
                      color: accentHex,
                    }}
                  >
                    {isSwitching ? t('profile.languages.switching') : t('profile.languages.switch')}
                  </button>
                )}
                {isActive && (
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: `${accentHex}20` }}
                  >
                    <ICONS.Check className="w-4 h-4" style={{ color: accentHex }} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add Language Button (ML-9: Premium feature)

          IMPORTANT: Multi-language access is protected by:
          1. profile.languages array - only contains unlocked language codes
          2. /api/switch-language validates languageCode is in user's languages array
          3. New users get languages: [their selected target language] on signup
          4. Additional languages require payment (+$5/language/month)

          ML-9 TODO:
          - Create language selection modal
          - Integrate Stripe payment for add-on
          - API to add language to profile.languages after payment
      */}
      <button
        className="w-full mt-4 p-4 rounded-2xl border-2 border-dashed transition-all flex items-center justify-center gap-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--text-secondary)]"
        style={{ borderColor: 'var(--border-color)' }}
        onClick={() => {
          // ML-9: This should open language picker + payment flow
          alert(t('profile.languages.comingSoon'));
        }}
      >
        <ICONS.Plus className="w-4 h-4" />
        <span className="text-scale-label font-bold">{t('profile.languages.addLanguage')}</span>
      </button>
    </div>
  );
};

export default LanguagesSection;
