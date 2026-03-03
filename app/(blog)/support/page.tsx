import type { Metadata } from 'next';
import Link from 'next/link';
import { canonicalUrl } from '@/lib/blog-urls';

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export const metadata: Metadata = {
  title: 'Support \u2014 Love Languages',
  description:
    'Get help with the Love Languages app. Contact support, report bugs, and find answers to common questions.',
  alternates: {
    canonical: canonicalUrl('/support'),
  },
  openGraph: {
    title: 'Support \u2014 Love Languages',
    description:
      'Get help with the Love Languages app. Contact support, report bugs, and find answers to common questions.',
    url: canonicalUrl('/support'),
    type: 'website',
    siteName: 'Love Languages',
  },
};

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default function SupportPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Support \u2014 Love Languages',
    description:
      'Get help with the Love Languages app. Contact support, report bugs, and find answers to common questions.',
    url: canonicalUrl('/support'),
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Header */}
      <header className="bg-gradient-to-b from-accent/10 to-white">
        <div className="max-w-3xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              Support
            </h1>
            <p className="text-xl text-gray-600">
              We&apos;re here to help you and your partner on your language
              learning journey.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-10">
        {/* Contact */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-4">
            Contact Us
          </h2>
          <p className="text-gray-600 text-lg mb-4">
            Have a question, suggestion, or need help with your account? Reach
            out and we&apos;ll get back to you as soon as possible.
          </p>
          <a
            href="mailto:support@lovelanguages.xyz"
            className="inline-flex items-center gap-2 bg-accent text-white font-bold px-6 py-3 rounded-full hover:shadow-lg hover:scale-105 transition-all"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
              <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
            </svg>
            support@lovelanguages.xyz
          </a>
        </section>

        {/* Bug Reports */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-4">
            Report a Bug
          </h2>
          <p className="text-gray-600 text-lg mb-4">
            Found something that isn&apos;t working right? You can report bugs
            directly from within the app using the bug report button in the
            navigation bar. This automatically captures helpful details like your
            browser and app state so we can fix things faster.
          </p>
          <p className="text-gray-600 text-lg">
            If you can&apos;t access the app, email us at{' '}
            <a
              href="mailto:support@lovelanguages.xyz"
              className="text-accent font-medium hover:underline"
            >
              support@lovelanguages.xyz
            </a>{' '}
            with a description of the issue.
          </p>
        </section>

        {/* FAQ */}
        <section className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-6">
            Common Questions
          </h2>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-bold font-header text-gray-900 mb-1">
                How do I reset my password?
              </h3>
              <p className="text-gray-600">
                Tap &ldquo;Forgot password&rdquo; on the login screen and enter
                your email. You&apos;ll receive a link to set a new password.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-header text-gray-900 mb-1">
                How do I invite my partner?
              </h3>
              <p className="text-gray-600">
                Go to your Profile tab and tap &ldquo;Invite Partner.&rdquo;
                You&apos;ll get a link to share with them. One of you learns as
                the Student, the other guides as the Tutor.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-header text-gray-900 mb-1">
                Can I switch my target language?
              </h3>
              <p className="text-gray-600">
                Yes &mdash; go to your Profile and tap on your language settings.
                You can change your target or native language at any time. Your
                vocabulary is saved per language pair.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-header text-gray-900 mb-1">
                How do I cancel my subscription?
              </h3>
              <p className="text-gray-600">
                You can manage or cancel your subscription from your Profile tab
                under &ldquo;Manage Subscription.&rdquo; You&apos;ll keep access
                until the end of your current billing period.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-bold font-header text-gray-900 mb-1">
                What languages are supported?
              </h3>
              <p className="text-gray-600">
                We support 18 languages: English, Spanish, French, German,
                Italian, Portuguese, Polish, Dutch, Swedish, Norwegian, Danish,
                Czech, Russian, Ukrainian, Romanian, Greek, Hungarian, and
                Turkish. Any language can be your native or target language.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold font-header text-accent mb-4"
          >
            <img
              src="/favicon.svg"
              alt="Love Languages"
              className="w-8 h-8"
            />
            Love Languages
          </Link>
          <p className="text-gray-600 mb-6">
            Learn your partner&apos;s language together
          </p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/learn/" className="hover:text-accent">
              Blog
            </Link>
            <Link href="/tools/" className="hover:text-accent">
              Tools
            </Link>
            <Link href="/support/" className="hover:text-accent">
              Support
            </Link>
            <Link href="/terms/" className="hover:text-accent">
              Terms
            </Link>
            <Link href="/privacy/" className="hover:text-accent">
              Privacy
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
