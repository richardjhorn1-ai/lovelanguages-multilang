import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { ICONS } from '../constants';

const TermsOfService: React.FC = () => {
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
          Terms of Service
        </h1>
        <p className="text-sm mb-8" style={{ color: 'var(--text-secondary)' }}>
          Last updated: {lastUpdated}
        </p>

        {/* Content */}
        <div className="space-y-8 text-base leading-relaxed" style={{ color: 'var(--text-secondary)' }}>

          {/* Introduction */}
          <section>
            <p>
              Welcome to Love Languages ("we," "our," or "us"). These Terms of Service ("Terms") govern your
              access to and use of the Love Languages application and website (collectively, the "Service").
              By creating an account or using the Service, you agree to be bound by these Terms.
            </p>
            <p className="mt-4">
              <strong style={{ color: 'var(--text-primary)' }}>Please read these Terms carefully.</strong> If you do not agree
              to these Terms, you may not access or use the Service.
            </p>
          </section>

          {/* 1. Eligibility */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              1. Eligibility
            </h2>
            <p>
              You must be at least 13 years old to use the Service. If you are under 18, you represent that you have
              your parent or guardian's permission to use the Service. If you are located in the European Economic Area,
              you must be at least 16 years old to use the Service.
            </p>
            <p className="mt-3">
              By using the Service, you represent and warrant that you meet these eligibility requirements and that
              the information you provide during registration is accurate and complete.
            </p>
          </section>

          {/* 2. Account Registration */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              2. Account Registration
            </h2>
            <p>
              To access certain features of the Service, you must create an account. When you create an account, you agree to:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Provide accurate, current, and complete information</li>
              <li>Maintain and promptly update your account information</li>
              <li>Keep your password secure and confidential</li>
              <li>Notify us immediately of any unauthorized access to your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>
            <p className="mt-3">
              We reserve the right to suspend or terminate accounts that contain inaccurate information or
              violate these Terms.
            </p>
          </section>

          {/* 3. Subscription and Billing */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              3. Subscription and Billing
            </h2>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3.1 Subscription Plans</h3>
            <p>
              Love Languages offers subscription plans ("Standard" and "Unlimited") that provide access to
              premium features. Subscription fees are billed in advance on a monthly or yearly basis, depending
              on the plan you select.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3.2 Payment Processing</h3>
            <p>
              All payments are processed securely through Stripe. By subscribing, you authorize us to charge
              your payment method for the applicable subscription fees. You are responsible for keeping your
              payment information current.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3.3 Automatic Renewal</h3>
            <p>
              Subscriptions automatically renew at the end of each billing period unless you cancel before the
              renewal date. You will be charged the then-current subscription fee unless you cancel.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3.4 Cancellation</h3>
            <p>
              You may cancel your subscription at any time through your account settings or by contacting us.
              Cancellation will take effect at the end of your current billing period. You will retain access
              to premium features until your subscription expires.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>3.5 Refunds</h3>
            <p>
              Subscription fees are generally non-refundable. However, we may provide refunds at our sole
              discretion in certain circumstances. If you believe you are entitled to a refund, please contact
              us at support@lovelanguages.xyz.
            </p>
          </section>

          {/* 4. Partner Features */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              4. Partner Features
            </h2>
            <p>
              The Service allows you to invite a partner to learn together. By inviting a partner:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>You confirm that you have their consent to share limited profile information</li>
              <li>Your partner will be able to see your learning progress and vocabulary</li>
              <li>Tutors can create challenges and send vocabulary to their student partner</li>
              <li>Either partner may disconnect the partnership at any time</li>
            </ul>
            <p className="mt-3">
              If you are on a paid plan that includes partner access, your partner may use premium features
              at no additional cost while linked to your account.
            </p>
          </section>

          {/* 5. Acceptable Use */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              5. Acceptable Use
            </h2>
            <p>You agree not to:</p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Use the Service for any illegal purpose or in violation of any laws</li>
              <li>Harass, abuse, or harm another person through the Service</li>
              <li>Upload or transmit viruses, malware, or other malicious code</li>
              <li>Attempt to gain unauthorized access to the Service or its systems</li>
              <li>Interfere with or disrupt the Service or servers</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code</li>
              <li>Use automated systems (bots, scrapers) to access the Service</li>
              <li>Circumvent any usage limits or restrictions</li>
              <li>Share your account credentials with others</li>
              <li>Create multiple accounts to abuse free trials or promotions</li>
            </ul>
          </section>

          {/* 6. Intellectual Property */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              6. Intellectual Property
            </h2>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>6.1 Our Content</h3>
            <p>
              The Service, including its design, features, content, and all intellectual property rights therein,
              is owned by Love Languages or its licensors. You may not copy, modify, distribute, sell, or lease
              any part of the Service without our prior written consent.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>6.2 Your Content</h3>
            <p>
              You retain ownership of any content you create within the Service, including vocabulary lists,
              chat messages, and learning progress data. By using the Service, you grant us a limited license
              to store and process your content as necessary to provide the Service.
            </p>

            <h3 className="font-semibold font-header mt-4 mb-2" style={{ color: 'var(--text-primary)' }}>6.3 AI-Generated Content</h3>
            <p>
              The Service uses artificial intelligence to generate educational content, translations, and
              feedback. While we strive for accuracy, AI-generated content may contain errors. You acknowledge
              that AI outputs are provided for educational purposes and should not be relied upon as the sole
              source of linguistic or cultural information.
            </p>
          </section>

          {/* 7. Third-Party Services */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              7. Third-Party Services
            </h2>
            <p>
              The Service integrates with third-party services including:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li><strong>Supabase</strong> - Database and authentication</li>
              <li><strong>Google Gemini</strong> - AI language coaching and content generation</li>
              <li><strong>Gladia</strong> - Speech-to-text transcription</li>
              <li><strong>Stripe</strong> - Payment processing</li>
            </ul>
            <p className="mt-3">
              Your use of these third-party services is subject to their respective terms and privacy policies.
              We are not responsible for the practices of third-party service providers.
            </p>
          </section>

          {/* 8. Disclaimers */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              8. Disclaimers
            </h2>
            <p>
              THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS
              OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A
              PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
            </p>
            <p className="mt-3">
              We do not guarantee that:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>The Service will be uninterrupted, secure, or error-free</li>
              <li>Learning outcomes or fluency will be achieved</li>
              <li>AI-generated content will be accurate or appropriate</li>
              <li>The Service will meet your specific requirements</li>
            </ul>
          </section>

          {/* 9. Limitation of Liability */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              9. Limitation of Liability
            </h2>
            <p>
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, LOVE LANGUAGES SHALL NOT BE LIABLE FOR ANY INDIRECT,
              INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES,
              WHETHER INCURRED DIRECTLY OR INDIRECTLY, OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE
              LOSSES RESULTING FROM:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Your access to or use of (or inability to use) the Service</li>
              <li>Any conduct or content of any third party on the Service</li>
              <li>Unauthorized access, use, or alteration of your content</li>
            </ul>
            <p className="mt-3">
              Our total liability shall not exceed the amount you paid us in the twelve (12) months preceding
              the claim.
            </p>
          </section>

          {/* 10. Indemnification */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              10. Indemnification
            </h2>
            <p>
              You agree to indemnify and hold harmless Love Languages and its officers, directors, employees,
              and agents from any claims, damages, losses, liabilities, and expenses (including reasonable
              attorneys' fees) arising out of or relating to your use of the Service or violation of these Terms.
            </p>
          </section>

          {/* 11. Termination */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              11. Termination
            </h2>
            <p>
              We may suspend or terminate your access to the Service at any time, with or without cause, and
              with or without notice. Upon termination:
            </p>
            <ul className="list-disc ml-6 mt-3 space-y-2">
              <li>Your right to use the Service will immediately cease</li>
              <li>You may request export of your data in accordance with our Privacy Policy</li>
              <li>We may delete your account and associated data after a reasonable period</li>
            </ul>
            <p className="mt-3">
              You may delete your account at any time through your account settings.
            </p>
          </section>

          {/* 12. Changes to Terms */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              12. Changes to Terms
            </h2>
            <p>
              We may modify these Terms at any time. If we make material changes, we will notify you by email
              or through the Service. Your continued use of the Service after the changes take effect constitutes
              your acceptance of the new Terms.
            </p>
          </section>

          {/* 13. Governing Law */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              13. Governing Law
            </h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of the United Kingdom,
              without regard to its conflict of law provisions. Any disputes arising under these Terms shall be
              resolved in the courts of England and Wales.
            </p>
          </section>

          {/* 14. Contact Us */}
          <section>
            <h2 className="text-xl font-bold font-header mb-3" style={{ color: 'var(--text-primary)' }}>
              14. Contact Us
            </h2>
            <p>
              If you have any questions about these Terms, please contact us at:
            </p>
            <p className="mt-3">
              <strong style={{ color: 'var(--text-primary)' }}>Email:</strong>{' '}
              <a href="mailto:support@lovelanguages.xyz" style={{ color: accentHex }}>
                support@lovelanguages.xyz
              </a>
            </p>
          </section>

          {/* Footer */}
          <section className="pt-8 border-t" style={{ borderColor: 'var(--border-color)' }}>
            <p className="text-sm">
              By using Love Languages, you acknowledge that you have read, understood, and agree to be bound
              by these Terms of Service.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;
