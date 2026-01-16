import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  role: 'student' | 'tutor';
}

type Section = 'index' | 'getting-started' | 'chat-modes' | 'vocabulary' | 'games' | 'progress' | 'tips';

interface GuideSection {
  id: Section;
  title: string;
  icon: keyof typeof ICONS;
  content: React.ReactNode;
}

export const HelpGuide: React.FC<Props> = ({ isOpen, onClose, role }) => {
  const { t } = useTranslation();
  const { targetName, nativeName } = useLanguage();
  const [activeSection, setActiveSection] = useState<Section>('index');

  const SECTIONS: GuideSection[] = [
    {
      id: 'getting-started',
      title: t('helpGuide.sections.gettingStarted.title'),
      icon: 'Sparkles',
      content: (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t('helpGuide.sections.gettingStarted.intro', { language: targetName })}
          </p>
          <div className="bg-[var(--accent-light)] rounded-xl p-4">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">{t('helpGuide.sections.gettingStarted.cupidTitle')}</h4>
            <p className="text-scale-label text-[var(--text-secondary)]">
              {t('helpGuide.sections.gettingStarted.cupidDescription')}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[var(--text-primary)]">{t('helpGuide.sections.gettingStarted.rolesTitle')}</h4>
            <ul className="text-scale-label text-[var(--text-secondary)] space-y-1 ml-4">
              <li><strong>Students</strong> {t('helpGuide.sections.gettingStarted.studentRole', { language: targetName })}</li>
              <li><strong>Tutors</strong> {t('helpGuide.sections.gettingStarted.tutorRole')}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'chat-modes',
      title: t('helpGuide.sections.chatModes.title'),
      icon: 'MessageCircle',
      content: (
        <div className="space-y-4">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
            <h4 className="font-bold text-[var(--accent-color)] mb-2">{t('helpGuide.sections.chatModes.askTitle')} <span className="text-scale-caption text-[var(--text-secondary)] font-normal">{t('helpGuide.sections.chatModes.askSubtitle')}</span></h4>
            <p className="text-scale-label text-[var(--text-secondary)] mb-2">{t('helpGuide.sections.chatModes.askDescription')}</p>
            <ul className="text-scale-label text-[var(--text-secondary)] ml-4 space-y-1">
              <li>{t('helpGuide.sections.chatModes.askExample1')}</li>
              <li>{t('helpGuide.sections.chatModes.askExample2')}</li>
              <li>{t('helpGuide.sections.chatModes.askExample3')}</li>
            </ul>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
            <h4 className="font-bold text-teal-500 mb-2">{t('helpGuide.sections.chatModes.learnTitle')} <span className="text-scale-caption text-[var(--text-secondary)] font-normal">{t('helpGuide.sections.chatModes.learnSubtitle')}</span></h4>
            <p className="text-scale-label text-[var(--text-secondary)] mb-2">{t('helpGuide.sections.chatModes.learnDescription')}</p>
            <ul className="text-scale-label text-[var(--text-secondary)] ml-4 space-y-1">
              <li>{t('helpGuide.sections.chatModes.learnExample1')}</li>
              <li>{t('helpGuide.sections.chatModes.learnExample2')}</li>
              <li>{t('helpGuide.sections.chatModes.learnExample3')}</li>
            </ul>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
            <h4 className="font-bold text-teal-500 mb-2">{t('helpGuide.sections.chatModes.coachTitle')} <span className="text-scale-caption text-[var(--text-secondary)] font-normal">{t('helpGuide.sections.chatModes.coachSubtitle')}</span></h4>
            <p className="text-scale-label text-[var(--text-secondary)] mb-2">{t('helpGuide.sections.chatModes.coachDescription')}</p>
            <ul className="text-scale-label text-[var(--text-secondary)] ml-4 space-y-1">
              <li>{t('helpGuide.sections.chatModes.coachExample1')}</li>
              <li>{t('helpGuide.sections.chatModes.coachExample2')}</li>
              <li>{t('helpGuide.sections.chatModes.coachExample3')}</li>
            </ul>
          </div>
        </div>
      ),
    },
    {
      id: 'vocabulary',
      title: t('helpGuide.sections.vocabulary.title'),
      icon: 'BookOpen',
      content: (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t('helpGuide.sections.vocabulary.intro')}
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.RefreshCw className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.vocabulary.syncTitle')}</h4>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.vocabulary.syncDescription')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.Star className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.vocabulary.masteryTitle')}</h4>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.vocabulary.masteryDescription')}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
                <ICONS.Clock className="w-4 h-4 text-[var(--accent-color)]" />
              </div>
              <div>
                <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.vocabulary.tenseTitle')}</h4>
                <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.vocabulary.tenseDescription')}</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'games',
      title: t('helpGuide.sections.games.title'),
      icon: 'Gamepad2',
      content: (
        <div className="space-y-4">
          <p className="text-[var(--text-secondary)]">
            {t('helpGuide.sections.games.intro')}
          </p>
          <div className="grid gap-3">
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
              <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.games.flashcards')}</h4>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.games.flashcardsDescription', { language: targetName, native: nativeName })}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
              <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.games.multipleChoice')}</h4>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.games.multipleChoiceDescription')}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
              <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.games.typeIt')}</h4>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.games.typeItDescription', { language: targetName })}</p>
            </div>
            <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
              <h4 className="font-bold text-[var(--text-primary)] text-scale-label">{t('helpGuide.sections.games.aiChallenge')}</h4>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.sections.games.aiChallengeDescription')}</p>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: 'progress',
      title: t('helpGuide.sections.progress.title'),
      icon: 'TrendingUp',
      content: (
        <div className="space-y-4">
          <div className="bg-[var(--accent-light)] rounded-xl p-4">
            <h4 className="font-bold text-[var(--text-primary)] mb-2">{t('helpGuide.sections.progress.xpTitle')}</h4>
            <p className="text-scale-label text-[var(--text-secondary)]">
              {t('helpGuide.sections.progress.xpDescription')}
            </p>
          </div>
          <div className="space-y-2">
            <h4 className="font-bold text-[var(--text-primary)]">{t('helpGuide.sections.progress.tiersTitle')}</h4>
            <div className="grid grid-cols-2 gap-2 text-scale-caption">
              <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.beginner')}</div>
              <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.elementary')}</div>
              <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.conversational')}</div>
              <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.proficient')}</div>
              <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.fluent')}</div>
              <div className="bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2">{t('helpGuide.sections.progress.master')}</div>
            </div>
          </div>
          <p className="text-scale-label text-[var(--text-secondary)]">
            {t('helpGuide.sections.progress.testsNote')}
          </p>
        </div>
      ),
    },
  ];

  const TIPS = [
    {
      question: t('helpGuide.tips.verbsQuestion'),
      answer: t('helpGuide.tips.verbsAnswer'),
    },
    {
      question: t('helpGuide.tips.partnerQuestion'),
      answer: t('helpGuide.tips.partnerAnswer'),
    },
    {
      question: t('helpGuide.tips.progressQuestion'),
      answer: t('helpGuide.tips.progressAnswer'),
    },
    {
      question: t('helpGuide.tips.forgetQuestion'),
      answer: t('helpGuide.tips.forgetAnswer'),
    },
  ];

  if (!isOpen) return null;

  const currentSection = SECTIONS.find(s => s.id === activeSection);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30 z-40 animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-[#FFF0F3] dark:bg-[var(--bg-card)] z-50 shadow-2xl animate-in slide-in-from-right duration-300 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--accent-color)] flex items-center justify-center">
              <ICONS.BookOpen className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-header font-bold text-scale-heading text-[var(--text-primary)]">{t('helpGuide.title')}</h2>
              <p className="text-scale-caption text-[var(--text-secondary)]">{t('helpGuide.subtitle')}</p>
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
        <div className="flex-1 overflow-y-auto p-6">
          {activeSection === 'index' ? (
            <div className="space-y-6">
              {/* Section Index */}
              <div>
                <h3 className="text-scale-caption font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                  {t('helpGuide.contents')}
                </h3>
                <div className="space-y-2">
                  {SECTIONS.map(section => {
                    const Icon = ICONS[section.icon];
                    return (
                      <button
                        key={section.id}
                        onClick={() => setActiveSection(section.id)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl bg-white dark:bg-[var(--bg-primary)] border border-[var(--border-color)] hover:border-[var(--accent-color)] transition-all group text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center group-hover:scale-110 transition-transform">
                          <Icon className="w-4 h-4 text-[var(--accent-color)]" />
                        </div>
                        <span className="font-medium text-scale-label text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                          {section.title}
                        </span>
                        <ICONS.ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto" />
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Quick Tips */}
              <div>
                <h3 className="text-scale-caption font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                  {t('helpGuide.quickTips')}
                </h3>
                <div className="space-y-3">
                  {TIPS.map((tip, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-[var(--bg-primary)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent-color)] transition-all list-none">
                        <ICONS.HelpCircle className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                        <span className="text-scale-label font-medium text-[var(--text-primary)]">{tip.question}</span>
                        <ICONS.ChevronDown className="w-4 h-4 text-[var(--text-secondary)] ml-auto group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="mt-2 ml-6 p-3 text-scale-label text-[var(--text-secondary)] bg-[var(--accent-light)] rounded-xl">
                        {tip.answer}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div>
              {/* Back button */}
              <button
                onClick={() => setActiveSection('index')}
                className="flex items-center gap-2 text-scale-label text-[var(--text-secondary)] hover:text-[var(--accent-color)] mb-6 transition-colors"
              >
                <ICONS.ArrowLeft className="w-4 h-4" />
                {t('helpGuide.backToContents')}
              </button>

              {/* Section content */}
              {currentSection && (
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    {(() => {
                      const Icon = ICONS[currentSection.icon];
                      return (
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center">
                          <Icon className="w-5 h-5 text-[var(--accent-color)]" />
                        </div>
                      );
                    })()}
                    <h3 className="font-header font-bold text-scale-heading text-[var(--text-primary)]">
                      {currentSection.title}
                    </h3>
                  </div>
                  {currentSection.content}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--border-color)] bg-white dark:bg-[var(--bg-primary)]">
          <p className="text-scale-caption text-center text-[var(--text-secondary)]">
            {t('helpGuide.footer')}
          </p>
        </div>
      </div>
    </>
  );
};
