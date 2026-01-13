import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const CONSENT_KEY = 'cookie-consent-accepted';

/**
 * Cookie Consent Banner
 *
 * CURRENT STATE: Informational only
 * - App only uses essential cookies (Supabase auth sessions)
 * - No analytics or tracking cookies are currently implemented
 * - Banner satisfies GDPR notice requirement for essential cookies
 *
 * FUTURE: When adding analytics (PostHog, GA, etc.), check this consent:
 *   if (localStorage.getItem('cookie-consent-accepted')) {
 *     // Initialize analytics
 *   }
 */

const CookieConsent: React.FC = () => {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Only show if consent hasn't been given
    const hasConsent = localStorage.getItem(CONSENT_KEY);
    if (!hasConsent) {
      // Small delay so it doesn't flash immediately on load
      const timer = setTimeout(() => setVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(CONSENT_KEY, 'true');
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4 animate-slideUp">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-4 flex flex-col sm:flex-row items-center gap-4">
        <p className="text-sm text-gray-600 flex-1 text-center sm:text-left">
          {t('cookies.message', 'We use cookies to improve your experience.')}{' '}
          <a
            href="#/privacy"
            className="text-[var(--accent-color)] hover:underline font-semibold"
          >
            {t('cookies.learnMore', 'Learn more')}
          </a>
        </p>
        <button
          onClick={handleAccept}
          className="px-6 py-2 bg-[var(--accent-color)] text-white font-bold rounded-xl text-sm hover:opacity-90 transition-opacity whitespace-nowrap"
        >
          {t('cookies.accept', 'Accept')}
        </button>
      </div>
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slideUp { animation: slideUp 0.3s ease-out; }
      `}</style>
    </div>
  );
};

export default CookieConsent;
