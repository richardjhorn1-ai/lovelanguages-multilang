import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getArticlesByNativeLang, getArticleCountsByTargetLang } from '@/lib/blog-api';
import { canonicalUrl, hubUrl } from '@/lib/blog-urls';
import { LANGUAGE_HUB_DATA } from '@blog-data/language-hub-data';
import { getUITranslations } from '@blog-data/ui-translations';
import { LANGUAGES, getLanguageForDisplay, SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';
import { getAllTopics, getTopicDisplayName } from '@blog-data/topic-info';

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ nativeLang: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang } = await params;

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    return {};
  }

  const text = getUITranslations(nativeLang);
  const pageCanonical = canonicalUrl(`/learn/${nativeLang}`);

  const hreflangAlternates: Record<string, string> = {};
  for (const lang of SUPPORTED_NATIVE_LANGS) {
    hreflangAlternates[lang] = canonicalUrl(`/learn/${lang}`);
  }
  hreflangAlternates['x-default'] = canonicalUrl('/learn/en');

  return {
    title: `${text.heroTitle} - Love Languages`,
    description: text.heroSubtitle,
    alternates: {
      canonical: pageCanonical,
      languages: hreflangAlternates,
    },
  };
}

export default async function NativeLangHubPage({ params }: PageProps) {
  const { nativeLang } = await params;
  const nativeLanguageCode = nativeLang || 'en';

  // Validate native language
  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLanguageCode)) {
    notFound();
  }

  // Count articles per target language for this native language (single query)
  const languageCounts = await getArticleCountsByTargetLang(nativeLanguageCode);

  // Get all languages except native, with translated names
  const sortedLanguageCodes = Object.keys(LANGUAGES)
    .filter(code => code !== nativeLanguageCode)
    .sort((codeA, codeB) => {
      const countA = languageCounts[codeA] || 0;
      const countB = languageCounts[codeB] || 0;
      if (countA > 0 && countB === 0) return -1;
      if (countB > 0 && countA === 0) return 1;
      const nameA = getLanguageForDisplay(codeA, nativeLanguageCode).name;
      const nameB = getLanguageForDisplay(codeB, nativeLanguageCode).name;
      return nameA.localeCompare(nameB);
    });

  // Get total article count for this native language
  const totalArticles = Object.values(languageCounts).reduce((sum, count) => sum + count, 0);

  // Get language data with article counts (using translated names)
  const allLanguages = sortedLanguageCodes.map(code => ({
    ...getLanguageForDisplay(code, nativeLanguageCode),
    articleCount: languageCounts[code] || 0,
    hubData: LANGUAGE_HUB_DATA[code],
  }));

  // Latest articles for this native language
  const latestArticles = await getArticlesByNativeLang(nativeLanguageCode, { limit: 4 });

  const getArticleUrl = (article: { native_lang: string; target_lang: string; slug: string }) =>
    `/learn/${article.native_lang}/${article.target_lang}/${article.slug}/`;
  const getLangFromArticle = (article: { target_lang: string }) => article.target_lang;

  // Get translations for this native language
  const text = getUITranslations(nativeLanguageCode);

  // Get topics for "Browse by Topic" section
  const topics = getAllTopics();

  // JSON-LD
  const pageCanonical = canonicalUrl(`/learn/${nativeLanguageCode}`);
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `Love Languages - ${text.heroTitle}`,
    description: text.heroSubtitle,
    url: pageCanonical,
    inLanguage: nativeLanguageCode,
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
    numberOfItems: totalArticles,
  };

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

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header
        className="relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #fdfcfd 50%, #E7F5FF 100%)' }}
      >
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <p className="text-[#FF6B6B] font-medium mb-3 tracking-wide uppercase text-sm">
                {text.heroTagline}
              </p>
              <h1 className="text-4xl md:text-6xl font-black font-header text-[#292F36] mb-6 leading-tight">
                {text.heroTitle}
              </h1>
              <p className="text-xl text-gray-600 mb-8 leading-relaxed">{text.heroSubtitle}</p>
              <div className="flex flex-wrap gap-4 mb-8">
                <a
                  href="#languages"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
                >
                  {text.browseLanguages}
                </a>
                <a
                  href={`/learn/${nativeLanguageCode}/couples-language-learning/`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold transition-all hover:scale-105"
                  style={{ color: '#4ECDC4', border: '2px solid #4ECDC4' }}
                >
                  {text.whyLearnTogether}
                </a>
              </div>
              <div className="flex gap-6 text-sm">
                <div>
                  <span className="font-bold text-[#292F36] text-lg">{totalArticles}+</span>{' '}
                  <span className="text-gray-500">{text.articles}</span>
                </div>
                <div>
                  <span className="font-bold text-[#292F36] text-lg">17</span>{' '}
                  <span className="text-gray-500">{text.languages}</span>
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

      {/* Languages Section */}
      <section id="languages" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold font-header text-[#292F36] mb-3">
              {text.chooseLanguage}
            </h2>
            <p className="text-gray-600">{text.chooseLanguageSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {allLanguages.map(lang => (
              <a
                key={lang.code}
                href={`/learn/${nativeLanguageCode}/${lang.code}/`}
                className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-[#FF6B6B] hover:shadow-lg transition-all bg-white"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {lang.flag}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#FF6B6B] text-center">
                  {lang.name}
                </span>
                {lang.articleCount > 0 && (
                  <span className="text-xs text-gray-400 mt-1">
                    {lang.articleCount} {text.guides}
                  </span>
                )}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Browse by Topic */}
      <section className="py-12" style={{ background: '#fdfcfd' }}>
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold font-header text-[#292F36] mb-2">
              {text.browseByTopic}
            </h2>
            <p className="text-gray-600 text-sm">{text.browseByTopicSubtitle}</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            {topics.map(topic => (
              <a
                key={topic.slug}
                href={`/learn/${nativeLanguageCode}/topics/${topic.slug}/`}
                className="group flex flex-col items-center p-4 rounded-xl border border-gray-100 hover:border-[#FF6B6B] hover:shadow-lg transition-all bg-white"
              >
                <span className="text-3xl mb-2 group-hover:scale-110 transition-transform">
                  {topic.icon}
                </span>
                <span className="text-sm font-medium text-gray-700 group-hover:text-[#FF6B6B] text-center">
                  {getTopicDisplayName(topic.slug, nativeLanguageCode)}
                </span>
              </a>
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
                  {text.freshReads}
                </h2>
                <p className="text-gray-600 text-sm">{text.latestGuides}</p>
              </div>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              {latestArticles.map(article => {
                const langCode = getLangFromArticle(article);
                const langData = LANGUAGE_HUB_DATA[langCode];
                return (
                  <a key={article.id} href={getArticleUrl(article)} className="group block">
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
                      <p className="text-xs text-gray-500 line-clamp-2">{article.description}</p>
                    </div>
                  </a>
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
            style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #E7F5FF 100%)' }}
          >
            <div className="relative text-center">
              <div className="inline-flex items-center gap-3 mb-6">
                <span className="text-5xl">{'\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}'}</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold font-header text-[#292F36] mb-4">
                {text.betterTogether}
              </h2>
              <p className="text-gray-600 mb-8 max-w-xl mx-auto text-lg">
                {text.couplesMotivation}
              </p>
              <a
                href={`/learn/${nativeLanguageCode}/couples-language-learning/`}
                className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-xl"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
              >
                {text.discoverCouples}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* App CTA */}
      <section
        className="py-20"
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold font-header mb-4">{text.ctaTitle}</h2>
          <p className="text-white/90 mb-8 text-lg">{text.ctaSubtitle}</p>
          <a
            href="/"
            className="inline-block bg-white font-bold px-10 py-4 rounded-full hover:shadow-2xl hover:scale-105 transition-all text-lg"
            style={{ color: '#FF6B6B' }}
          >
            {text.ctaButton}
          </a>
          <p className="mt-6 text-white/70 text-sm">{text.freeToStart}</p>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-12 border-t"
        style={{ background: '#fdfcfd', borderColor: '#f0f0f0' }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-2xl font-bold font-header mb-4"
            style={{ color: '#FF6B6B' }}
          >
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </a>
          <p className="text-gray-600 mb-6">{text.heroSubtitle}</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-400">
            <a href={`/learn/${nativeLanguageCode}/`} className="hover:text-[#FF6B6B]">
              {text.blog}
            </a>
            <a href="/tools/" className="hover:text-[#FF6B6B]">
              {text.tools}
            </a>
          </nav>
        </div>
      </footer>
    </>
  );
}
