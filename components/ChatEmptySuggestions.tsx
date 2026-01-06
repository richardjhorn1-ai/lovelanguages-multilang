import React from 'react';
import { ChatMode } from '../types';
import { ICONS } from '../constants';

interface Props {
  mode: ChatMode;
  role: 'student' | 'tutor';
  onSuggestionClick: (text: string) => void;
}

interface Suggestion {
  text: string;
  icon: keyof typeof ICONS;
}

const SUGGESTIONS: Record<string, Record<string, Suggestion[]>> = {
  student: {
    ask: [
      { text: "How do I say 'I love you' in Polish?", icon: 'Heart' },
      { text: "Teach me a sweet compliment", icon: 'Sparkles' },
      { text: "What's a romantic phrase for tonight?", icon: 'Moon' },
    ],
    learn: [
      { text: "Start a lesson on greetings", icon: 'MessageCircle' },
      { text: "Teach me verb conjugations", icon: 'BookOpen' },
      { text: "Practice food vocabulary", icon: 'Coffee' },
    ],
  },
  tutor: {
    // Tutors only have Coach mode - combines teaching tips + partner context
    coach: [
      { text: "How do I explain Polish cases simply?", icon: 'HelpCircle' },
      { text: "What new words should I teach them?", icon: 'Sparkles' },
      { text: "Suggest a romantic phrase for tonight", icon: 'Heart' },
    ],
  },
};

export const ChatEmptySuggestions: React.FC<Props> = ({ mode, role, onSuggestionClick }) => {
  const suggestions = SUGGESTIONS[role]?.[mode] || SUGGESTIONS.student.ask;

  return (
    <div className="flex flex-col items-center justify-center h-full px-6 py-12">
      <div className="text-center mb-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-[var(--accent-light)] flex items-center justify-center">
          <ICONS.MessageCircle className="w-8 h-8 text-[var(--accent-color)]" />
        </div>
        <h3 className="text-xl font-bold font-header text-[var(--text-primary)] mb-2">
          {role === 'student'
            ? (mode === 'ask' ? 'Ask Cupid anything' : 'Ready for a lesson?')
            : 'Coach your partner'
          }
        </h3>
        <p className="text-sm text-[var(--text-secondary)] max-w-xs mx-auto">
          {role === 'student'
            ? 'Every word you learn brings you closer together'
            : 'Teaching tips and personalized suggestions'
          }
        </p>
      </div>

      <div className="w-full max-w-md space-y-3">
        <p className="text-xs font-bold uppercase tracking-wider text-[var(--text-secondary)] text-center mb-4">
          Try asking...
        </p>
        {suggestions.map((suggestion, index) => {
          const Icon = ICONS[suggestion.icon];
          return (
            <button
              key={index}
              onClick={() => onSuggestionClick(suggestion.text)}
              className="w-full flex items-center gap-4 p-4 rounded-2xl bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--accent-color)] hover:shadow-md transition-all group text-left"
            >
              <div className="w-10 h-10 rounded-xl bg-[var(--accent-light)] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                <Icon className="w-5 h-5 text-[var(--accent-color)]" />
              </div>
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent-color)] transition-colors">
                {suggestion.text}
              </span>
              <ICONS.ChevronRight className="w-4 h-4 text-[var(--text-secondary)] ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          );
        })}
      </div>
    </div>
  );
};
