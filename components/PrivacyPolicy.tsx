import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

const PrivacyPolicy: React.FC = () => {
  const navigate = useNavigate();
  const { accentHex } = useTheme();

  const lastUpdated = 'January 8, 2026';

  return (
    <div className="min-h-screen overflow-y-auto" style={{ background: 'var(--bg-primary)', paddingTop: 'env(safe-area-inset-top, 0px)' }}>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 mb-8 transition-colors"
          style={{ color: 'var(--text-secondary)' }}
        >
          <ICONS.ChevronLeft className="w-5 h-5" />
          <span className="text-sm font-medium">Back</span>
        </button>

        {/* Header */}
        <h1 className="text-3xl sm:text-4xl font-black font-header mb-2" style={{ color: 'var(--text-primary)' }}>
          Privacy Policy
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Last updated: {lastUpdated}
        </p>

        {/* Content */}
        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          {/* Introduction */}
          <section>
            <p>
              Love Languages ("we," "our," or "us") respects your privacy and is committed to protecting your
              personal data. This Privacy Policy explains how we collect, use, disclose, and safeguard your
              information when you use our application and website (collectively, the "Service").
            </p>
            <p className="mt-4">
              Please read this Privacy Policy carefully. By using the Service, you consent to the practices
              described in this policy.
            </p>
          </section>

          {/* 1. Information We Collect */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              1. Information We Collect
            </h2>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              1.1 Information You Provide
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Account Information:</strong> Email address, password (hashed), display name, and
                profile picture
              </li>
              <li>
                <strong>Onboarding Data:</strong> Your role (student/tutor), learning motivation, partner's
                name (if provided), and personalization preferences
              </li>
              <li>
                <strong>Learning Content:</strong> Vocabulary words, chat messages, game answers, and level
                test responses
              </li>
              <li>
                <strong>Voice Data:</strong> Audio transcriptions from voice conversations and Listen Mode
                sessions (we do not store raw audio recordings)
              </li>
              <li>
                <strong>Payment Information:</strong> Billing details processed through Stripe (we do not
                store full credit card numbers)
              </li>
            </ul>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              1.2 Information Collected Automatically
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Usage Data:</strong> Features used, time spent, vocabulary progress, and game
                performance
              </li>
              <li>
                <strong>Device Information:</strong> Browser type, operating system, and device identifiers
              </li>
              <li>
                <strong>Log Data:</strong> IP address, access times, and pages viewed
              </li>
            </ul>
          </section>

          {/* 2. How We Use Your Information */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              2. How We Use Your Information
            </h2>
            <p>We use your information to:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Provide, maintain, and improve the Service</li>
              <li>Personalize your learning experience with AI-powered recommendations</li>
              <li>Process transactions and manage your subscription</li>
              <li>Enable partner features (sharing progress, sending challenges)</li>
              <li>Communicate with you about updates, support, and promotions</li>
              <li>Analyze usage patterns to improve our features</li>
              <li>Detect and prevent fraud, abuse, or security issues</li>
              <li>Comply with legal obligations</li>
            </ul>
          </section>

          {/* 3. How We Share Your Information */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              3. How We Share Your Information
            </h2>
            <p>We may share your information with:</p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              3.1 Service Providers
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Supabase:</strong> Database hosting and user authentication
              </li>
              <li>
                <strong>Google (Gemini API, Analytics):</strong> AI-powered language coaching, translations,
                content generation, and anonymized usage analytics
              </li>
              <li>
                <strong>Gladia:</strong> Speech-to-text transcription for voice features
              </li>
              <li>
                <strong>Stripe:</strong> Payment processing and subscription management
              </li>
              <li>
                <strong>Vercel:</strong> Website hosting and serverless functions
              </li>
            </ul>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              3.2 Your Partner
            </h3>
            <p>
              If you connect with a partner on the Service, they will be able to see:
            </p>
            <ul className="list-disc ml-6 mt-2 space-y-2">
              <li>Your display name and profile picture</li>
              <li>Your learning progress and level</li>
              <li>Your vocabulary list and mastery status</li>
              <li>Challenges and word gifts you exchange</li>
            </ul>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              3.3 Legal Requirements
            </h3>
            <p>
              We may disclose your information if required by law, legal process, or government request, or
              to protect the rights, property, or safety of Love Languages, our users, or others.
            </p>
          </section>

          {/* 4. Data Retention */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              4. Data Retention
            </h2>
            <p>We retain your data as follows:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>
                <strong>Account Data:</strong> Retained until you delete your account
              </li>
              <li>
                <strong>Learning Data:</strong> Retained while your account is active and for 30 days after
                deletion
              </li>
              <li>
                <strong>Voice Transcriptions:</strong> Listen Mode sessions are retained for 90 days
              </li>
              <li>
                <strong>Chat History:</strong> Retained for 1 year for learning continuity
              </li>
              <li>
                <strong>Payment Records:</strong> Retained as required by law (typically 7 years for tax
                purposes)
              </li>
            </ul>
          </section>

          {/* 5. Your Rights (GDPR & CCPA) */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              5. Your Rights
            </h2>
            <p>
              Depending on your location, you may have the following rights regarding your personal data:
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              5.1 For All Users
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Access:</strong> Request a copy of your personal data
              </li>
              <li>
                <strong>Correction:</strong> Update or correct inaccurate data
              </li>
              <li>
                <strong>Deletion:</strong> Request deletion of your account and data
              </li>
              <li>
                <strong>Data Portability:</strong> Export your data in a machine-readable format
              </li>
            </ul>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              5.2 For EEA/UK Residents (GDPR)
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Restriction:</strong> Request restriction of processing in certain circumstances
              </li>
              <li>
                <strong>Objection:</strong> Object to processing based on legitimate interests
              </li>
              <li>
                <strong>Withdraw Consent:</strong> Withdraw consent at any time where processing is based on
                consent
              </li>
              <li>
                <strong>Complaint:</strong> Lodge a complaint with your local data protection authority
              </li>
            </ul>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>
              5.3 For California Residents (CCPA)
            </h3>
            <ul className="list-disc ml-6 space-y-2">
              <li>
                <strong>Know:</strong> Know what personal information is collected and how it's used
              </li>
              <li>
                <strong>Delete:</strong> Request deletion of personal information
              </li>
              <li>
                <strong>Non-Discrimination:</strong> Not be discriminated against for exercising your rights
              </li>
            </ul>

            <div className="mt-4 p-4 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border-color)' }}>
              <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                To exercise your rights:
              </p>
              <ul className="list-disc ml-6 mt-2 space-y-1">
                <li>
                  <strong>Export Data:</strong> Go to Profile Settings and click "Export My Data"
                </li>
                <li>
                  <strong>Delete Account:</strong> Go to Profile Settings and click "Delete Account"
                </li>
                <li>
                  <strong>Other Requests:</strong> Email{' '}
                  <a href="mailto:privacy@lovelanguages.xyz" style={{ color: accentHex }}>
                    privacy@lovelanguages.xyz
                  </a>
                </li>
              </ul>
            </div>
          </section>

          {/* 6. Data Security */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              6. Data Security
            </h2>
            <p>We implement appropriate technical and organizational measures to protect your data:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>
                <strong>Encryption in Transit:</strong> All data transmitted between your device and our
                servers is encrypted using TLS
              </li>
              <li>
                <strong>Encryption at Rest:</strong> Data stored in our database is encrypted at rest
              </li>
              <li>
                <strong>Access Controls:</strong> Row-level security ensures users can only access their own
                data
              </li>
              <li>
                <strong>Authentication:</strong> Secure password hashing and JWT-based authentication
              </li>
              <li>
                <strong>Regular Audits:</strong> We conduct security reviews of our systems and practices
              </li>
            </ul>
            <p className="mt-3">
              However, no method of transmission over the Internet is 100% secure. While we strive to protect
              your data, we cannot guarantee absolute security.
            </p>
          </section>

          {/* 7. Children's Privacy */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              7. Children's Privacy
            </h2>
            <p>
              The Service is not intended for children under 13 years of age (or 16 in the EEA). We do not
              knowingly collect personal information from children. If you believe a child has provided us
              with personal information, please contact us and we will delete it.
            </p>
          </section>

          {/* 8. International Transfers */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              8. International Data Transfers
            </h2>
            <p>
              Your information may be transferred to and processed in countries other than your own. Our
              service providers operate in various jurisdictions including the United States and the European
              Union.
            </p>
            <p className="mt-3">
              Where required, we ensure appropriate safeguards are in place, such as Standard Contractual
              Clauses approved by the European Commission, to protect your data when transferred internationally.
            </p>
          </section>

          {/* 9. Cookies and Tracking */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              9. Cookies and Tracking
            </h2>
            <p>We use the following types of cookies and similar technologies:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>
                <strong>Essential Cookies:</strong> Required for authentication and basic functionality
              </li>
              <li>
                <strong>Preference Cookies:</strong> Store your theme, font size, and display preferences
              </li>
              <li>
                <strong>Analytics:</strong> Help us understand how users interact with the Service (Google
                Analytics 4, Vercel Analytics). Google Analytics collects anonymized usage data including
                pages visited, session duration, and general location. You can opt out via{' '}
                <a href="https://tools.google.com/dlpage/gaoptout" target="_blank" rel="noopener noreferrer" style={{ color: accentHex }}>
                  Google's opt-out browser add-on
                </a>.
              </li>
            </ul>
            <p className="mt-3">
              You can manage cookie preferences through your browser settings. Note that disabling certain
              cookies may affect the functionality of the Service.
            </p>
          </section>

          {/* 10. Third-Party Links */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              10. Third-Party Links
            </h2>
            <p>
              The Service may contain links to third-party websites or services. We are not responsible for
              the privacy practices of these third parties. We encourage you to review their privacy policies
              before providing any personal information.
            </p>
          </section>

          {/* 11. Changes to This Policy */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              11. Changes to This Policy
            </h2>
            <p>
              We may update this Privacy Policy from time to time. If we make material changes, we will
              notify you by email or through the Service. The "Last updated" date at the top indicates when
              this policy was last revised.
            </p>
          </section>

          {/* 12. Contact Us */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              12. Contact Us
            </h2>
            <p>
              If you have any questions about this Privacy Policy or our data practices, please contact us:
            </p>
            <div className="mt-3 space-y-2">
              <p>
                <strong style={{ color: 'var(--text-primary)' }}>Privacy Inquiries:</strong>{' '}
                <a href="mailto:privacy@lovelanguages.xyz" style={{ color: accentHex }}>
                  privacy@lovelanguages.xyz
                </a>
              </p>
              <p>
                <strong style={{ color: 'var(--text-primary)' }}>General Support:</strong>{' '}
                <a href="mailto:support@lovelanguages.xyz" style={{ color: accentHex }}>
                  support@lovelanguages.xyz
                </a>
              </p>
            </div>
          </section>

          {/* Footer */}
          <section className="pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm">
              By using Love Languages, you acknowledge that you have read and understood this Privacy Policy.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
