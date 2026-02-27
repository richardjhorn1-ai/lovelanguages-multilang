import React from 'react';
import { ICONS } from '../constants';

const AI_CONSENT_KEY = 'gemini-ai-consent-accepted';

/** Check if user has already accepted the AI data-sharing disclosure */
export const hasAIConsent = (): boolean => {
  return localStorage.getItem(AI_CONSENT_KEY) === 'true';
};

interface GeminiAIConsentProps {
  isOpen: boolean;
  onAccept: () => void;
}

/**
 * AI Disclosure Modal — Apple Guideline 5.1.2(i)
 *
 * Shown once before the user's first AI chat message or voice session.
 * Discloses that messages and learning data are sent to Google Gemini.
 * Stores acceptance in localStorage so it only appears once per device.
 */
const GeminiAIConsent: React.FC<GeminiAIConsentProps> = ({ isOpen, onAccept }) => {
  if (!isOpen) return null;

  const handleAccept = () => {
    localStorage.setItem(AI_CONSENT_KEY, 'true');
    onAccept();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)' }}>
      <div
        className="glass-card-solid rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto"
        style={{ animation: 'fadeScaleIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="text-center mb-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3"
            style={{ backgroundColor: 'var(--accent-light)' }}
          >
            <ICONS.Sparkles className="w-7 h-7" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h3 className="text-xl font-black font-header" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Conversations
          </h3>
          <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            Before you start chatting, here's what you should know
          </p>
        </div>

        {/* Disclosure content */}
        <div className="space-y-3 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <p>
            Love Languages uses{' '}
            <strong style={{ color: 'var(--text-primary)' }}>Google Gemini AI</strong> to power your
            language coaching. When you chat, the following data is sent to Google for processing:
          </p>
          <ul className="list-disc ml-5 space-y-1.5">
            <li>Your messages and any images you share</li>
            <li>Recent conversation history</li>
            <li>Your vocabulary and learning progress</li>
            <li>Your language pair and proficiency level</li>
          </ul>
          <p className="text-xs" style={{ color: 'var(--text-tertiary, var(--text-secondary))' }}>
            Google processes this data solely to generate responses and does not use it to train
            their models.
          </p>
        </div>

        {/* Privacy link */}
        <a
          href="#/privacy"
          className="block text-center text-sm mt-4 font-semibold hover:underline"
          style={{ color: 'var(--accent-color)' }}
        >
          Read our full Privacy Policy
        </a>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          className="w-full py-3 mt-4 rounded-xl text-white font-bold text-sm transition-opacity hover:opacity-90 active:scale-[0.98]"
          style={{ backgroundColor: 'var(--accent-color)' }}
        >
          I Understand
        </button>
      </div>

      <style>{`
        @keyframes fadeScaleIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default GeminiAIConsent;
