import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { CONVERSATION_SCENARIOS, ConversationScenario } from '../constants/conversation-scenarios';
import { useLanguage } from '../context/LanguageContext';

interface ScenarioSelectorProps {
  onSelect: (scenario: ConversationScenario) => void;
  onClose: () => void;
}

const ScenarioSelector: React.FC<ScenarioSelectorProps> = ({ onSelect, onClose }) => {
  const { t } = useTranslation();
  const { targetName, nativeName } = useLanguage();
  const [customTopic, setCustomTopic] = useState('');
  const [showCustom, setShowCustom] = useState(false);

  const difficultyColors = {
    beginner: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
    intermediate: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400',
    advanced: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
  };

  const handleCustomStart = () => {
    if (!customTopic.trim()) return;

    const customScenario: ConversationScenario = {
      id: 'custom',
      name: t('scenarioSelector.customScenarioName'),
      icon: '✨',
      description: customTopic,
      persona: t('scenarioSelector.customPersona', { language: targetName }),
      context: customTopic,
      difficulty: 'intermediate'
    };

    onSelect(customScenario);
  };

  return (
    <div className="fixed inset-0 modal-backdrop flex items-center justify-center z-50 p-4">
      <div className="glass-card-solid rounded-2xl w-full max-w-lg max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-[var(--border-color)] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 bg-[var(--secondary-light)] rounded-xl flex items-center justify-center text-[var(--secondary-color)]">
                <ICONS.Mic className="w-5 h-5" />
              </div>
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 bg-amber-500 text-white text-[9px] font-black rounded-full uppercase">
                {t('scenarioSelector.beta')}
              </span>
            </div>
            <div>
              <h2 className="font-black font-header text-[var(--text-primary)]">{t('scenarioSelector.title')}</h2>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('scenarioSelector.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--bg-primary)] rounded-xl transition-colors"
          >
            <ICONS.X className="w-5 h-5 text-[var(--text-secondary)]" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3">
          {!showCustom ? (
            <>
              {/* Preset Scenarios */}
              {CONVERSATION_SCENARIOS.map(scenario => (
                <button
                  key={scenario.id}
                  onClick={() => onSelect(scenario)}
                  className="w-full p-4 bg-[var(--bg-primary)] hover:bg-[var(--secondary-light)] border border-[var(--border-color)] hover:border-[var(--secondary-border)] rounded-2xl text-left transition-all group"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
                      {scenario.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-bold font-header text-[var(--text-primary)]">{t(`scenarioSelector.scenarios.${scenario.id}.name`)}</h3>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded-full ${difficultyColors[scenario.difficulty]}`}>
                          {t(`scenarioSelector.difficulty.${scenario.difficulty}`)}
                        </span>
                      </div>
                      <p className="text-scale-label text-[var(--text-secondary)]">{t(`scenarioSelector.scenarios.${scenario.id}.description`)}</p>
                    </div>
                    <ICONS.ChevronRight className="w-5 h-5 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </button>
              ))}

              {/* Custom Option */}
              <button
                onClick={() => setShowCustom(true)}
                className="w-full p-4 bg-[var(--secondary-light)] border border-[var(--secondary-border)] hover:border-[var(--secondary-color)] rounded-2xl text-left transition-all group"
              >
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 glass-card rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform text-[var(--secondary-color)]">
                    <ICONS.Sparkles className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold font-header text-[var(--secondary-color)]">{t('scenarioSelector.createOwn')}</h3>
                    <p className="text-scale-label text-[var(--secondary-color)]/70">{t('scenarioSelector.createOwnDesc')}</p>
                  </div>
                  <ICONS.ChevronRight className="w-5 h-5 text-[var(--secondary-color)] opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </button>
            </>
          ) : (
            <>
              {/* Custom Scenario Input */}
              <div>
                <button
                  onClick={() => setShowCustom(false)}
                  className="flex items-center gap-1 text-scale-label text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
                >
                  <ICONS.ChevronLeft className="w-4 h-4" />
                  {t('scenarioSelector.backToScenarios')}
                </button>

                <div className="text-center mb-6">
                  <div className="mb-2 text-[var(--secondary-color)]"><ICONS.Sparkles className="w-10 h-10 mx-auto" /></div>
                  <h3 className="font-black font-header text-[var(--text-primary)]">{t('scenarioSelector.customScenario')}</h3>
                  <p className="text-scale-label text-[var(--text-secondary)]">{t('scenarioSelector.describeScenario')}</p>
                </div>

                <textarea
                  value={customTopic}
                  onChange={e => setCustomTopic(e.target.value)}
                  placeholder={t('scenarioSelector.customPlaceholder')}
                  rows={4}
                  className="w-full p-4 border-2 border-[var(--border-color)] rounded-2xl text-scale-label focus:outline-none focus:border-[var(--secondary-color)] bg-[var(--bg-primary)] text-[var(--text-primary)] placeholder:text-[var(--text-secondary)] resize-none"
                  autoFocus
                />

                <button
                  onClick={handleCustomStart}
                  disabled={!customTopic.trim()}
                  className="w-full mt-4 py-4 bg-[var(--secondary-color)] text-white font-bold rounded-2xl hover:bg-[var(--secondary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <ICONS.Play className="w-4 h-4" />
                  {t('scenarioSelector.startPractice')}
                </button>
              </div>
            </>
          )}
        </div>

        {/* Footer Info */}
        <div className="p-4 border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
          <p className="text-scale-caption text-center text-[var(--text-secondary)]">
            {t('scenarioSelector.footerInfo', { targetLanguage: targetName, nativeLanguage: nativeName })}
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScenarioSelector;
