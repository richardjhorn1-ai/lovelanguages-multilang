import React from 'react';
import { useTranslation } from 'react-i18next';
import { OnboardingStep, NextButton, ONBOARDING_OPTION } from '../../OnboardingStep';
import { useTheme } from '../../../../context/ThemeContext';
import {
  ACCENT_COLORS,
  DARK_MODE_STYLES,
  FONT_PRESETS,
  type AccentColor,
  type DarkModeStyle,
  type FontPreset,
} from '../../../../services/theme';

interface ThemeCustomizationStepProps {
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onBack?: () => void;
  accentColor?: string;
}

const accentEntries = Object.entries(ACCENT_COLORS) as [AccentColor, typeof ACCENT_COLORS[AccentColor]][];
const darkModeEntries = Object.entries(DARK_MODE_STYLES) as [DarkModeStyle, typeof DARK_MODE_STYLES[DarkModeStyle]][];
const fontEntries = Object.entries(FONT_PRESETS) as [FontPreset, typeof FONT_PRESETS[FontPreset]][];

export const ThemeCustomizationStep: React.FC<ThemeCustomizationStepProps> = ({
  currentStep,
  totalSteps,
  onNext,
  onBack,
}) => {
  const { t } = useTranslation();
  const { theme, setAccentColor, setDarkMode, setFontPreset } = useTheme();

  // Use live accent hex so the step reflects changes instantly
  const liveAccent = ACCENT_COLORS[theme.accentColor].primary;

  return (
    <OnboardingStep
      currentStep={currentStep}
      totalSteps={totalSteps}
      onBack={onBack}
      accentColor={liveAccent}
    >
      <div className="text-center mb-8">
        <h1 className="text-3xl font-black text-[var(--text-primary)] mb-3 font-header">
          {t('onboarding.themeCustomization.title', 'Make it yours')}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {t('onboarding.themeCustomization.subtitle', 'Choose your colors, mode & font')}
        </p>
      </div>

      {/* Section 1: Accent Color */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
          {t('onboarding.themeCustomization.accentLabel', 'Your color')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {accentEntries.map(([key, preset]) => {
            const isSelected = theme.accentColor === key;
            return (
              <button
                key={key}
                onClick={() => setAccentColor(key)}
                className="p-3 transition-all text-center"
                style={ONBOARDING_OPTION(isSelected, preset.primary)}
              >
                {/* Split circle: primary + secondary */}
                <div className="w-8 h-8 rounded-full mx-auto mb-1.5 overflow-hidden flex">
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.primary }} />
                  <div className="w-1/2 h-full" style={{ backgroundColor: preset.secondary.primary }} />
                </div>
                <span
                  className="text-scale-caption font-bold leading-tight block"
                  style={{ color: isSelected ? preset.primary : 'var(--text-primary)' }}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mb-6"><div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: `${liveAccent}15` }} /></div>

      {/* Section 2: Dark Mode */}
      <div className="mb-6">
        <p className="text-scale-label font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
          {t('onboarding.themeCustomization.darkModeLabel', 'Display mode')}
        </p>
        <div className="grid grid-cols-4 gap-2">
          {darkModeEntries.map(([key, preset]) => {
            const isSelected = theme.darkMode === key;
            return (
              <button
                key={key}
                onClick={() => setDarkMode(key)}
                className="p-3 transition-all text-center"
                style={ONBOARDING_OPTION(isSelected, liveAccent)}
              >
                <div
                  className="w-8 h-8 rounded-lg mx-auto mb-1.5 border border-black/10"
                  style={{ backgroundColor: preset.bgPrimary }}
                >
                  {/* Mini text preview inside the chip */}
                  <div className="flex items-center justify-center h-full">
                    <span className="text-[7px] font-black" style={{ color: preset.textPrimary }}>Aa</span>
                  </div>
                </div>
                <span
                  className="text-scale-caption font-bold leading-tight block"
                  style={{ color: isSelected ? liveAccent : 'var(--text-primary)' }}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex justify-center mb-6"><div className="h-[2px] w-8 rounded-full" style={{ backgroundColor: `${liveAccent}15` }} /></div>

      {/* Section 3: Font Style */}
      <div className="mb-8">
        <p className="text-scale-label font-black uppercase tracking-widest text-[var(--text-secondary)] mb-3">
          {t('onboarding.themeCustomization.fontLabel', 'Font style')}
        </p>
        <div className="grid grid-cols-3 gap-2">
          {fontEntries.map(([key, preset]) => {
            const isSelected = theme.fontPreset === key;
            return (
              <button
                key={key}
                onClick={() => setFontPreset(key)}
                className="p-3 transition-all text-center"
                style={ONBOARDING_OPTION(isSelected, liveAccent)}
              >
                <span
                  className="text-lg font-black block mb-1"
                  style={{ fontFamily: preset.header, color: isSelected ? liveAccent : '#6b7280' }}
                >
                  Aa
                </span>
                <span
                  className="text-scale-caption font-bold leading-tight block"
                  style={{ fontFamily: preset.body, color: isSelected ? liveAccent : 'var(--text-primary)' }}
                >
                  {preset.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <NextButton
        onClick={onNext}
        accentColor={liveAccent}
      >
        {t('onboarding.themeCustomization.continue', 'Looks great!')}
      </NextButton>
    </OnboardingStep>
  );
};
