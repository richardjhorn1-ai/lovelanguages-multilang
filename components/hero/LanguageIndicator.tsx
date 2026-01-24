import React from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND } from './heroConstants';
import { LANGUAGE_CONFIGS } from '../../constants/language-config';

interface LanguageIndicatorProps {
  nativeCode: string;
  targetCode: string;
  onChangeClick: () => void;
  isStudent: boolean;
}

const LanguageIndicator: React.FC<LanguageIndicatorProps> = ({
  nativeCode,
  targetCode,
  onChangeClick,
  isStudent
}) => {
  const { t } = useTranslation();
  const nativeConfig = LANGUAGE_CONFIGS[nativeCode];
  const targetConfig = LANGUAGE_CONFIGS[targetCode];
  const accentColor = isStudent ? BRAND.primary : BRAND.teal;

  return (
    <div className="flex items-center justify-center gap-4 mt-8 p-4 rounded-2xl bg-white/50">
      <div className="flex items-center gap-2">
        <span className="text-xl">{nativeConfig?.flag}</span>
        <span className="text-scale-label font-bold text-gray-700">{nativeConfig?.nativeName}</span>
      </div>
      <span className="text-gray-400">→</span>
      <div className="flex items-center gap-2">
        <span className="text-xl">{targetConfig?.flag}</span>
        <span className="text-scale-label font-bold text-gray-700">{targetConfig?.nativeName}</span>
      </div>
      <button
        onClick={onChangeClick}
        className="ml-2 text-scale-caption font-bold transition-all hover:opacity-70"
        style={{ color: accentColor }}
      >
        {t('hero.languageSelector.change')}
      </button>
    </div>
  );
};

export default LanguageIndicator;
