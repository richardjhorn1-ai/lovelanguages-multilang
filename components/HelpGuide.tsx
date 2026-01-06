import React, { useState } from 'react';
import { ICONS } from '../constants';

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

const SECTIONS: GuideSection[] = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: 'Sparkles',
    content: (
      <div className="space-y-4">
        <p className="text-[var(--text-secondary)]">
          Love Languages helps you learn Polish through the lens of your relationship. Every word you learn is a gift of love.
        </p>
        <div className="bg-[var(--accent-light)] rounded-xl p-4">
          <h4 className="font-bold text-[var(--text-primary)] mb-2">Your AI companion: Cupid</h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Cupid is your warm, encouraging guide. They'll help you learn vocabulary, practice pronunciation, and find the perfect words to express your love.
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-[var(--text-primary)]">Student vs Tutor</h4>
          <ul className="text-sm text-[var(--text-secondary)] space-y-1 ml-4">
            <li><strong>Students</strong> are learning Polish - Cupid teaches you directly</li>
            <li><strong>Tutors</strong> help their partner learn - Cupid gives teaching tips</li>
          </ul>
        </div>
      </div>
    ),
  },
  {
    id: 'chat-modes',
    title: 'Chat Modes',
    icon: 'MessageCircle',
    content: (
      <div className="space-y-4">
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
          <h4 className="font-bold text-[var(--accent-color)] mb-2">Ask Mode <span className="text-xs text-[var(--text-secondary)] font-normal">(Students)</span></h4>
          <p className="text-sm text-[var(--text-secondary)] mb-2">Quick questions, casual learning. Perfect for:</p>
          <ul className="text-sm text-[var(--text-secondary)] ml-4 space-y-1">
            <li>"How do I say 'I love you'?"</li>
            <li>"What's a romantic phrase?"</li>
            <li>"How do you pronounce this?"</li>
          </ul>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
          <h4 className="font-bold text-teal-500 mb-2">Learn Mode <span className="text-xs text-[var(--text-secondary)] font-normal">(Students)</span></h4>
          <p className="text-sm text-[var(--text-secondary)] mb-2">Structured lessons with tables and drills. Use for:</p>
          <ul className="text-sm text-[var(--text-secondary)] ml-4 space-y-1">
            <li>Verb conjugation practice</li>
            <li>Grammar explanations</li>
            <li>Vocabulary lessons</li>
          </ul>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
          <h4 className="font-bold text-teal-500 mb-2">Coach Tab <span className="text-xs text-[var(--text-secondary)] font-normal">(Tutors)</span></h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Quick teaching tips and help explaining Polish concepts to your partner.
          </p>
        </div>
        <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-4">
          <h4 className="font-bold text-purple-500 mb-2">Context Tab <span className="text-xs text-[var(--text-secondary)] font-normal">(Tutors)</span></h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Uses your partner's actual progress to suggest personalized phrases and activities.
          </p>
        </div>
      </div>
    ),
  },
  {
    id: 'vocabulary',
    title: 'Building Vocabulary',
    icon: 'BookOpen',
    content: (
      <div className="space-y-4">
        <p className="text-[var(--text-secondary)]">
          Words from your conversations are automatically saved to your Love Log.
        </p>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
              <ICONS.RefreshCw className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">Sync Button</h4>
              <p className="text-xs text-[var(--text-secondary)]">Click sync in Love Log to extract new words from recent chats</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
              <ICONS.Star className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">Mastery Levels</h4>
              <p className="text-xs text-[var(--text-secondary)]">Practice words in games to increase mastery from 0-5 stars</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0">
              <ICONS.Clock className="w-4 h-4 text-[var(--accent-color)]" />
            </div>
            <div>
              <h4 className="font-bold text-[var(--text-primary)] text-sm">Tense Unlocking</h4>
              <p className="text-xs text-[var(--text-secondary)]">Learn past/future tenses in chat to unlock them in your verb entries</p>
            </div>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'games',
    title: 'Playing Games',
    icon: 'Gamepad2',
    content: (
      <div className="space-y-4">
        <p className="text-[var(--text-secondary)]">
          Games help you practice and remember vocabulary. Each correct answer builds mastery!
        </p>
        <div className="grid gap-3">
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
            <h4 className="font-bold text-[var(--text-primary)] text-sm">Flashcards</h4>
            <p className="text-xs text-[var(--text-secondary)]">Classic flip cards - see Polish, recall English</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
            <h4 className="font-bold text-[var(--text-primary)] text-sm">Multiple Choice</h4>
            <p className="text-xs text-[var(--text-secondary)]">Pick the right translation from 4 options</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
            <h4 className="font-bold text-[var(--text-primary)] text-sm">Type It</h4>
            <p className="text-xs text-[var(--text-secondary)]">Type the Polish word - tests spelling and recall</p>
          </div>
          <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl p-3">
            <h4 className="font-bold text-[var(--text-primary)] text-sm">AI Challenge</h4>
            <p className="text-xs text-[var(--text-secondary)]">Cupid generates unique challenges using your words</p>
          </div>
        </div>
      </div>
    ),
  },
  {
    id: 'progress',
    title: 'Tracking Progress',
    icon: 'TrendingUp',
    content: (
      <div className="space-y-4">
        <div className="bg-[var(--accent-light)] rounded-xl p-4">
          <h4 className="font-bold text-[var(--text-primary)] mb-2">XP & Levels</h4>
          <p className="text-sm text-[var(--text-secondary)]">
            Earn XP by chatting, playing games, and mastering words. Progress through 18 levels across 6 tiers!
          </p>
        </div>
        <div className="space-y-2">
          <h4 className="font-bold text-[var(--text-primary)]">Level Tiers</h4>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 rounded-lg px-3 py-2">Beginner 1-3</div>
            <div className="bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg px-3 py-2">Elementary 1-3</div>
            <div className="bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded-lg px-3 py-2">Conversational 1-3</div>
            <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-lg px-3 py-2">Proficient 1-3</div>
            <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-300 rounded-lg px-3 py-2">Fluent 1-3</div>
            <div className="bg-slate-50 dark:bg-slate-900/20 text-slate-700 dark:text-slate-300 rounded-lg px-3 py-2">Master 1-3</div>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Take <strong>Level Tests</strong> to prove your skills and advance faster!
        </p>
      </div>
    ),
  },
];

const TIPS = [
  {
    question: "What's the best way to learn verbs?",
    answer: "Use Learn mode and ask for conjugation tables. Practice all 6 persons (I, you, he/she, we, you all, they) together.",
  },
  {
    question: "How do I practice with my partner?",
    answer: "Use phrases you've learned in daily conversations. Even simple greetings count! Create challenges for each other in the Play section.",
  },
  {
    question: "How fast can I progress?",
    answer: "15-20 minutes of daily practice works wonders. Consistency beats cramming!",
  },
  {
    question: "What if I forget a word?",
    answer: "Play games - they automatically resurface words you're struggling with. The spaced repetition helps lock them in.",
  },
];

export const HelpGuide: React.FC<Props> = ({ isOpen, onClose, role }) => {
  const [activeSection, setActiveSection] = useState<Section>('index');

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
              <h2 className="font-header font-bold text-lg text-[var(--text-primary)]">Your Guide</h2>
              <p className="text-xs text-[var(--text-secondary)]">Love Languages</p>
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                  Contents
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
                        <span className="font-medium text-sm text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
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
                <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] mb-4">
                  Quick Tips
                </h3>
                <div className="space-y-3">
                  {TIPS.map((tip, i) => (
                    <details key={i} className="group">
                      <summary className="flex items-center gap-2 p-3 rounded-xl bg-white dark:bg-[var(--bg-primary)] border border-[var(--border-color)] cursor-pointer hover:border-[var(--accent-color)] transition-all list-none">
                        <ICONS.HelpCircle className="w-4 h-4 text-[var(--accent-color)] flex-shrink-0" />
                        <span className="text-sm font-medium text-[var(--text-primary)]">{tip.question}</span>
                        <ICONS.ChevronDown className="w-4 h-4 text-[var(--text-secondary)] ml-auto group-open:rotate-180 transition-transform" />
                      </summary>
                      <div className="mt-2 ml-6 p-3 text-sm text-[var(--text-secondary)] bg-[var(--accent-light)] rounded-xl">
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
                className="flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--accent-color)] mb-6 transition-colors"
              >
                <ICONS.ArrowLeft className="w-4 h-4" />
                Back to contents
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
                    <h3 className="font-header font-bold text-xl text-[var(--text-primary)]">
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
          <p className="text-xs text-center text-[var(--text-secondary)]">
            Made with love for couples learning together
          </p>
        </div>
      </div>
    </>
  );
};
