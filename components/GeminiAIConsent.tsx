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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 modal-backdrop">
      <div
        className="glass-card-solid rounded-2xl p-5 max-w-sm w-full"
        style={{ animation: 'fadeScaleIn 0.25s ease-out' }}
      >
        {/* Header */}
        <div className="text-center mb-3">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2"
            style={{ backgroundColor: 'var(--accent-light)' }}
          >
            <ICONS.Sparkles className="w-6 h-6" style={{ color: 'var(--accent-color)' }} />
          </div>
          <h3 className="text-lg font-black font-header" style={{ color: 'var(--text-primary)' }}>
            AI-Powered Chat
          </h3>
        </div>

        {/* Disclosure — single concise paragraph */}
        <p className="text-scale-label text-center" style={{ color: 'var(--text-secondary)' }}>
          Your messages and learning data are sent to{' '}
          <strong style={{ color: 'var(--text-primary)' }}>Google Gemini</strong> to power
          language coaching. Google does not use this data to train their models.
        </p>

        {/* Privacy link */}
        <a
          href="#/privacy"
          className="block text-center text-scale-caption mt-3 font-semibold hover:underline"
          style={{ color: 'var(--accent-color)' }}
        >
          Read our Privacy Policy
        </a>

        {/* Accept button */}
        <button
          onClick={handleAccept}
          className="w-full py-3 mt-3 rounded-xl text-white font-bold text-scale-label transition-opacity hover:opacity-90 active:scale-[0.98]"
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
