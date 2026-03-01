import React from 'react';
import { useTranslation } from 'react-i18next';
import { ChatMode } from '../types';
import { ICONS } from '../constants';
import { useLanguage } from '../context/LanguageContext';

interface Props {
  mode: ChatMode;
  role: 'student' | 'tutor';
  onSuggestionClick: (text: string) => void;
}

interface Suggestion {
  text: string;
  icon: keyof typeof ICONS;
}

export const ChatEmptySuggestions: React.FC<Props> = ({ mode, role, onSuggestionClick }) => {
  const { t } = useTranslation();
  const { targetName } = useLanguage();

  const SUGGESTIONS: Record<string, Record<string, Suggestion[]>> = {
    student: {
      ask: [
        { text: t('chatSuggestions.suggestions.student.ask.s1', { language: targetName }), icon: 'Heart' },
        { text: t('chatSuggestions.suggestions.student.ask.s2'), icon: 'Sparkles' },
        { text: t('chatSuggestions.suggestions.student.ask.s3'), icon: 'Moon' },
      ],
      learn: [
        { text: t('chatSuggestions.suggestions.student.learn.s1'), icon: 'MessageCircle' },
        { text: t('chatSuggestions.suggestions.student.learn.s2'), icon: 'BookOpen' },
        { text: t('chatSuggestions.suggestions.student.learn.s3'), icon: 'Coffee' },
      ],
    },
    tutor: {
      // Tutors only have Coach mode - combines teaching tips + partner context
      coach: [
        { text: t('chatSuggestions.suggestions.tutor.coach.s1', { language: targetName }), icon: 'HelpCircle' },
        { text: t('chatSuggestions.suggestions.tutor.coach.s2'), icon: 'Sparkles' },
        { text: t('chatSuggestions.suggestions.tutor.coach.s3'), icon: 'Heart' },
      ],
    },
  };

  const suggestions = SUGGESTIONS[role]?.[mode] || SUGGESTIONS.student.ask;

  return (
    <div className="flex flex-col items-center justify-center h-full px-3 py-4 md:px-6 md:py-12">
      <div className="text-center mb-4 md:mb-8">
        <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
          <ICONS.MessageCircle className="w-6 h-6 md:w-8 md:h-8 text-[var(--accent-color)]" />
        </div>
        <h3 className="text-scale-body md:text-scale-heading font-bold font-header text-[var(--text-primary)] mb-1 md:mb-2">
          {role === 'student'
            ? (mode === 'ask' ? t('chatSuggestions.student.askTitle') : t('chatSuggestions.student.learnTitle'))
            : t('chatSuggestions.tutor.coachTitle')
          }
        </h3>
        <p className="text-scale-caption md:text-scale-label text-[var(--text-secondary)] max-w-xs mx-auto">
          {role === 'student'
            ? t('chatSuggestions.student.subtitle')
            : t('chatSuggestions.tutor.subtitle')
          }
        </p>
      </div>

      <div className="w-full max-w-md space-y-2 md:space-y-3">
        <p className="text-scale-micro md:text-scale-caption font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center mb-2 md:mb-4">
          {t('chatSuggestions.tryAsking')}
        </p>
        {suggestions.map((suggestion, index) => {
          const Icon = ICONS[suggestion.icon];
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="w-full flex items-center gap-2.5 md:gap-4 p-2.5 md:p-4 rounded-xl md:rounded-2xl glass-card hover:border-[var(--accent-color)] hover:shadow-md transition-all group text-left"
            >
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-lg md:rounded-xl bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="w-4 h-4 md:w-5 md:h-5 text-[var(--accent-color)]" />
              </div>
              <span className="text-scale-caption md:text-scale-label font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                {suggestion.text}
              </span>
              <ICONS.ChevronRight className="w-3.5 h-3.5 md:w-4 md:h-4 text-[var(--text-secondary)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
