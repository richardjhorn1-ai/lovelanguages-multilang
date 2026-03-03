import type { Metadata } from 'next';
import Link from 'next/link';
import { getArticleCountsByTargetLang, getArticlesByNativeLang } from '@/lib/blog-api';
import { LANGUAGE_HUB_DATA } from '@blog-data/language-hub-data';
import { SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';

export const revalidate = 86400; // ISR: 24 hours

// ---------------------------------------------------------------------------
// Metadata
// ---------------------------------------------------------------------------

export async function generateMetadata(): Promise<Metadata> {
  const languageCounts = await getArticleCountsByTargetLang('en');
  const totalArticles = Object.values(languageCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  const languages: Record<string, string> = {
    en: 'https://www.lovelanguages.io/learn/en/',
    'x-default': 'https://www.lovelanguages.io/learn/en/',
  };
  for (const lang of SUPPORTED_NATIVE_LANGS.filter((l) => l !== 'en')) {
    languages[lang] = `https://www.lovelanguages.io/learn/${lang}/`;
  }

  return {
    title: 'Learn Any Language Together - Love Languages',
    description: `Free language lessons, vocabulary guides, and cultural tips for couples learning together. ${totalArticles}+ articles across 17 languages.`,
    alternates: {
      canonical: 'https://www.lovelanguages.io/learn/',
      languages,
    },
    openGraph: {
      title: 'Learn Any Language Together - Love Languages',
      description: `Free language lessons for couples. ${totalArticles}+ articles across 17 languages.`,
      url: 'https://www.lovelanguages.io/learn/',
      type: 'website',
      siteName: 'Love Languages',
    },
  };
}

// ---------------------------------------------------------------------------
// Page Component
// ---------------------------------------------------------------------------

export default async function LearnIndexPage() {
  const [languageCounts, latestArticles] = await Promise.all([
    getArticleCountsByTargetLang('en'),
    getArticlesByNativeLang('en', { limit: 4 }),
  ]);

  const totalArticles = Object.values(languageCounts).reduce(
    (sum, count) => sum + count,
    0,
  );

  // Featured languages (most content)
  const allLanguages = Object.entries(LANGUAGE_HUB_DATA)
    .map(([code, data]) => ({
      code,
      ...data,
      articleCount: languageCounts[code] || 0,
    }))
    .sort((a, b) => b.articleCount - a.articleCount);

  const featuredLanguages = allLanguages.slice(0, 6);
  const otherLanguages = allLanguages.slice(6);

  const getArticleUrl = (article: { native_lang: string; target_lang: string; slug: string }) =>
    `/learn/${article.native_lang}/${article.target_lang}/${article.slug}/`;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Learn Any Language Together - Love Languages',
    description: `Free language lessons for couples. ${totalArticles}+ articles across 17 languages.`,
    url: 'https://www.lovelanguages.io/learn/',
    inLanguage: 'en',
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
  };

  // Flag cluster positions
  const positions = [
    { x: 0, y: -60, rotate: -5, scale: 1.4 },
    { x: 70, y: -30, rotate: 8, scale: 1.2 },
    { x: 85, y: 40, rotate: -3, scale: 1.1 },
    { x: 30, y: 70, rotate: 10, scale: 1 },
    { x: -50, y: 60, rotate: -8, scale: 1.1 },
    { x: -80, y: 10, rotate: 5, scale: 1.2 },
    { x: -60, y: -45, rotate: -10, scale: 1 },
    { x: 10, y: 10, rotate: 0, scale: 1.6 },
  ];

  const gradients = [
    'linear-gradient(135deg, #FFF0F3 0%, white 100%)',
    'linear-gradient(135deg, #E7F5FF 0%, white 100%)',
    'linear-gradient(135deg, #F0FDF4 0%, white 100%)',
  ];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header
        className="relative overflow-hidden"
        style={{
          background:
            'linear-gradient(135deg, #FFF0F3 0%, #fdfcfd 50%, #E7F5FF 100%)',
        }}
      >
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[#FF6B6B] font-medium mb-3 tracking-wide uppercase text-sm">
                For Couples
              </p>
              <h1 className="text-4xl md:text-6xl font-black font-header text-[#292F36] mb-6 leading-tight">
                Learn Any Language{' '}
                <span className="text-[#FF6B6B]">Together</span>
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">
                Free lessons, phrases, and cultural tips designed for partners
                learning side by side.
              </p>
              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href="#languages"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                  style={{
                    background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                  }}
                >
                  Browse Languages
                </a>
                <Link
                  href="/learn/couples-language-learning/"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:scale-105"
                  style={{ color: '#4ECDC4', border: '2px solid #4ECDC4' }}
                >
                  Why Learn Together?
                </Link>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-[#292F36] text-lg">
                    {totalArticles}+
                  </span>{' '}
                  <span className="text-gray-500">articles</span>
                </div>
                <div>
                  <span className="font-bold text-[#292F36] text-lg">17</span>{' '}
                  <span className="text-gray-500">languages</span>
                </div>
              </div>
            </div>

            {/* Flag cluster */}
            <div className="hidden md:flex justify-center items-center relative h-64">
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative">
                  {allLanguages.slice(0, 8).map((lang, i) => {
                    const pos = positions[i];
                    return (
                      <span
                        key={lang.code}
                        className="absolute text-4xl transition-transform hover:scale-125 cursor-default select-none"
                        style={{
                          transform: `translate(${pos.x}px, ${pos.y}px) rotate(${pos.rotate}deg) scale(${pos.scale})`,
                          filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))',
                        }}
                      >
                        {lang.flag}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Browse by Topic */}
      <section className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-header text-[#292F36] mb-3">
              Browse by Topic
            </h2>
            <p className="text-gray-600">
              Find exactly what you&apos;re looking for
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[
              { href: '/learn/en/topics/pet-names/', icon: '\u{1F495}', label: 'Pet Names' },
              { href: '/learn/en/topics/i-love-you/', icon: '\u{2764}\u{FE0F}', label: 'I Love You' },
              { href: '/learn/en/topics/pronunciation/', icon: '\u{1F5E3}\u{FE0F}', label: 'Pronunciation' },
              { href: '/learn/en/topics/grammar-basics/', icon: '\u{1F4DD}', label: 'Grammar' },
              { href: '/learn/en/topics/essential-phrases/', icon: '\u{1F4AC}', label: 'Essential Phrases' },
              { href: '/learn/en/topics/romantic-phrases/', icon: '\u{1F498}', label: 'Romantic Phrases' },
            ].map((topic) => (
              <Link
                key={topic.href}
                href={topic.href}
                className="group p-5 rounded-2xl border-2 border-gray-100 hover:border-[#FF6B6B] hover:shadow-lg transition-all bg-white text-center"
              >
                <div className="text-3xl mb-2">{topic.icon}</div>
                <h3 className="font-bold text-[#292F36] group-hover:text-[#FF6B6B] transition-colors text-sm">
                  {topic.label}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Languages Section */}
      <section id="languages" className="py-16" style={{ background: '#fdfcfd' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-header text-[#292F36] mb-3">
              Choose Your Language
            </h2>
            <p className="text-gray-600">
              Complete guides with lessons, phrases, grammar &amp; culture
            </p>
          </div>

          {/* Featured */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {featuredLanguages.map((lang, i) => (
              <Link
                key={lang.code}
                href={`/learn/en/${lang.code}/`}
                className="group relative p-6 rounded-2xl transition-all hover:shadow-2xl hover:-translate-y-1 overflow-hidden"
                style={{ background: gradients[i % 3] }}
              >
                <div className="relative">
                  <span className="text-5xl mb-4 block group-hover:scale-110 transition-transform origin-left">
                    {lang.flag}
                  </span>
                  <h3 className="text-2xl font-bold text-[#292F36] mb-1 group-hover:text-[#FF6B6B] transition-colors">
                    {lang.name}
                  </h3>
                  <p className="text-gray-500 text-sm mb-4">
                    {lang.nativeName}
                  </p>

                  <div className="flex gap-4 mb-4 text-sm">
                    <div>
                      <span className="font-bold text-[#292F36]">
                        {lang.articleCount}
                      </span>
                      <span className="text-gray-500 ml-1">guides</span>
                    </div>
                    <div>
                      <span className="font-bold text-[#292F36]">
                        {lang.fsiHours}h
                      </span>
                      <span className="text-gray-500 ml-1">to fluency</span>
                    </div>
                  </div>

                  <p className="text-gray-600 text-sm line-clamp-2">
                    {lang.whyLearn[0]}
                  </p>
                </div>
              </Link>
            ))}
          </div>

          {/* All Languages */}
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-11 gap-3">
            {otherLanguages.map((lang) => (
              <Link
                key={lang.code}
                href={`/learn/en/${lang.code}/`}
                className="group flex flex-col items-center p-3 rounded-xl border border-gray-100 hover:border-[#FF6B6B] hover:shadow-md transition-all bg-white"
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {lang.flag}
                </span>
                <span className="text-xs font-medium text-gray-700 group-hover:text-[#FF6B6B] text-center">
                  {lang.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      {latestArticles.length > 0 && (
        <section className="py-16" style={{ background: '#fdfcfd' }}>
          <div className="max-w-6xl mx-auto px-4">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-bold font-header text-[#292F36]">
                  Fresh Reads
                </h2>
                <p className="text-gray-600 text-sm">
                  Latest guides and lessons
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestArticles.map((article) => {
                const langCode = article.target_lang;
                const langData = LANGUAGE_HUB_DATA[langCode];
                return (
                  <Link
                    key={article.id}
                    href={getArticleUrl(article)}
                    className="group block"
                  >
                    <div className="p-5 rounded-2xl border border-gray-100 bg-white hover:shadow-lg hover:border-[#4ECDC4] transition-all h-full">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">{langData?.flag}</span>
                        <span
                          className="text-xs font-medium px-2 py-0.5 rounded-full"
                          style={{ background: '#E7F5FF', color: '#4ECDC4' }}
                        >
                          {langData?.name}
                        </span>
                      </div>
                      <h3 className="font-bold text-[#292F36] group-hover:text-[#4ECDC4] transition-colors mb-2 line-clamp-2 text-sm">
                        {article.title}
                      </h3>
                      <p className="text-xs text-gray-500 line-clamp-2">
                        {article.description}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Couples CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div
            className="relative rounded-3xl p-8 md:p-12 overflow-hidden"
            style={{
              background:
                'linear-gradient(135deg, #FFF0F3 0%, #E7F5FF 100%)',
            }}
          >
            <div className="relative text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="text-5xl">{'\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}'}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-header text-[#292F36] mb-4">
                Better Together
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto text-lg">
                Couples who learn together stay motivated, practice more often,
                and create memories that last forever.
              </p>
              <Link
                href="/learn/couples-language-learning/"
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-xl"
                style={{
                  background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)',
                }}
              >
                Discover Why Couples Learn Faster
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* App CTA */}
      <section
        className="py-20"
        style={{
          background:
            'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)',
        }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold font-header mb-4">
            Ready to Start?
          </h2>
          <p className="text-white/90 mb-8 text-lg">
            AI coaching, voice practice, and games designed for two.
          </p>
          <Link
            href="/"
            className="inline-block bg-white font-bold px-10 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all text-lg"
            style={{ color: '#FF6B6B' }}
          >
            Begin Your Journey
          </Link>
          <p className="mt-6 text-white/70 text-sm">
            Free to start &bull; No credit card
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 border-t"
        style={{ background: '#fdfcfd', borderColor: '#f0f0f0' }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold font-header mb-4"
            style={{ color: '#FF6B6B' }}
          >
            <img
              src="/favicon.svg"
              alt="Love Languages"
              className="w-8 h-8"
            />
            Love Languages
          </Link>
          <p className="text-gray-600 mb-6">
            Learn any language together with your partner
          </p>
          <nav className="flex justify-center gap-6 text-sm text-gray-400">
            <Link href="/learn/" className="hover:text-[#FF6B6B]">
              Blog
            </Link>
            <Link href="/tools/" className="hover:text-[#FF6B6B]">
              Tools
            </Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
