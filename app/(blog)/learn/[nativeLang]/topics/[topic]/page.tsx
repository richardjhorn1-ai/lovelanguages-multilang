import { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import { getArticlesByTopic, TOPIC_DEFINITIONS } from '@/lib/blog-api';
import { canonicalUrl } from '@/lib/blog-urls';
import { getUITranslations } from '@blog-data/ui-translations';
import { getLanguageForDisplay, SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';
import { getTopicDisplayName, getTopicIcon, TOPICS, isValidTopic } from '@blog-data/topic-info';
import { LANGUAGE_HUB_DATA } from '@blog-data/language-hub-data';

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ nativeLang: string; topic: string }>;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang, topic } = await params;
  const nativeLanguageCode = nativeLang?.toLowerCase() || 'en';
  const topicSlug = topic?.toLowerCase() || 'pet-names';

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLanguageCode) || !isValidTopic(topicSlug)) {
    return {};
  }

  const text = getUITranslations(nativeLanguageCode);
  const topicName = getTopicDisplayName(topicSlug, nativeLanguageCode);
  const topicIcon = getTopicIcon(topicSlug);
  const pageTitle = text.topicHubTitle.replace('{topic}', topicName);
  const pageDescription = text.topicHubSubtitle.replace('{topic}', topicName);
  const pageCanonical = canonicalUrl(`/learn/${nativeLanguageCode}/topics/${topicSlug}`);

  const hreflangAlternates: Record<string, string> = {};
  for (const lang of SUPPORTED_NATIVE_LANGS) {
    hreflangAlternates[lang] = canonicalUrl(`/learn/${lang}/topics/${topicSlug}`);
  }
  hreflangAlternates['x-default'] = canonicalUrl(`/learn/en/topics/${topicSlug}`);

  return {
    title: `${topicIcon} ${pageTitle} - Love Languages`,
    description: pageDescription,
    alternates: {
      canonical: pageCanonical,
      languages: hreflangAlternates,
    },
  };
}

export default async function TopicHubPage({ params }: PageProps) {
  const { nativeLang, topic } = await params;
  const nativeLanguageCode = nativeLang?.toLowerCase() || 'en';
  const topicSlug = topic?.toLowerCase() || 'pet-names';

  // Validate
  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLanguageCode)) {
    redirect('/learn/');
  }

  if (!isValidTopic(topicSlug)) {
    redirect(`/learn/${nativeLanguageCode}/`);
  }

  // Get UI translations
  const text = getUITranslations(nativeLanguageCode);

  // Get topic info
  const topicName = getTopicDisplayName(topicSlug, nativeLanguageCode);
  const topicIcon = getTopicIcon(topicSlug);

  // Fetch articles for this topic
  const articlesByLang = await getArticlesByTopic(nativeLanguageCode, topicSlug);

  // Count total articles and languages
  const totalArticles = articlesByLang.reduce((sum, group) => sum + group.articles.length, 0);
  const languageCount = articlesByLang.length;

  // Page title with topic
  const pageTitle = text.topicHubTitle.replace('{topic}', topicName);
  const pageDescription = text.topicHubSubtitle.replace('{topic}', topicName);

  const pageCanonical = canonicalUrl(`/learn/${nativeLanguageCode}/topics/${topicSlug}`);

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${topicIcon} ${pageTitle}`,
    description: pageDescription,
    url: pageCanonical,
    inLanguage: nativeLanguageCode,
    publisher: {
      '@type': 'Organization',
      name: 'Love Languages',
      url: 'https://www.lovelanguages.io/',
    },
    numberOfItems: totalArticles,
  };

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
        <div className="max-w-6xl mx-auto px-4 py-12 md:py-16">
          <nav className="mb-6">
            <a
              href={`/learn/${nativeLanguageCode}/`}
              className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#FF6B6B] transition-colors"
              style={{ color: '#666' }}
            >
              <span>&larr;</span> {text.backToLearn}
            </a>
          </nav>

          <div className="text-center max-w-3xl mx-auto">
            <span className="text-6xl mb-6 block">{topicIcon}</span>
            <h1 className="text-3xl md:text-5xl font-black font-header text-[#292F36] mb-4 leading-tight">
              {pageTitle}
            </h1>
            <p className="text-lg text-gray-600 mb-6">{pageDescription}</p>
            {languageCount > 0 && (
              <div className="flex justify-center gap-6 text-sm">
                <div>
                  <span className="font-bold text-[#292F36] text-lg">{totalArticles}</span>
                  <span className="text-gray-500 ml-1">{text.guides}</span>
                </div>
                <div>
                  <span className="font-bold text-[#292F36] text-lg">{languageCount}</span>
                  <span className="text-gray-500 ml-1">{text.languages}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Languages Grid */}
      <section className="py-12 bg-white">
        <div className="max-w-6xl mx-auto px-4">
          {languageCount > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {articlesByLang.map(({ targetLang, articles }) => {
                const langInfo = getLanguageForDisplay(targetLang, nativeLanguageCode);
                const hubData = LANGUAGE_HUB_DATA[targetLang];
                const firstArticle = articles[0];

                return (
                  <a
                    key={targetLang}
                    href={`/learn/${nativeLanguageCode}/${targetLang}/${firstArticle.slug}/`}
                    className="group block p-6 rounded-2xl border border-gray-100 bg-white hover:shadow-xl hover:border-[#FF6B6B] transition-all"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-4xl flex-shrink-0">{langInfo.flag}</span>
                      <div className="flex-1 min-w-0">
                        <h2 className="font-bold text-lg text-[#292F36] group-hover:text-[#FF6B6B] transition-colors mb-1">
                          {langInfo.name}
                        </h2>
                        <p className="text-sm text-gray-500 mb-3 line-clamp-2">
                          {firstArticle.title}
                        </p>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-medium px-2 py-1 rounded-full"
                            style={{ background: '#FFF0F3', color: '#FF6B6B' }}
                          >
                            {articles.length} {articles.length === 1 ? 'guide' : 'guides'}
                          </span>
                          {firstArticle.read_time && (
                            <span className="text-xs text-gray-400">
                              {firstArticle.read_time} min
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <span className="text-sm font-medium text-[#4ECDC4] group-hover:text-[#FF6B6B] transition-colors inline-flex items-center gap-1">
                        {text.viewArticle}
                        <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <p className="text-gray-500 text-lg mb-6">{text.noArticlesForTopic}</p>
              <a
                href={`/learn/${nativeLanguageCode}/`}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full font-bold text-white transition-all hover:scale-105"
                style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
              >
                {text.browseLanguages}
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Other Topics */}
      <section className="py-12" style={{ background: '#fdfcfd' }}>
        <div className="max-w-6xl mx-auto px-4">
          <h2 className="text-xl font-bold font-header text-[#292F36] mb-6 text-center">
            {text.browseByTopic}
          </h2>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.filter(t => t !== topicSlug).map(otherTopic => (
              <a
                key={otherTopic}
                href={`/learn/${nativeLanguageCode}/topics/${otherTopic}/`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-gray-200 hover:border-[#FF6B6B] hover:bg-white transition-all text-sm font-medium text-gray-600 hover:text-[#FF6B6B]"
              >
                <span>{getTopicIcon(otherTopic)}</span>
                {getTopicDisplayName(otherTopic, nativeLanguageCode)}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        className="py-16"
        style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)' }}
      >
        <div className="max-w-2xl mx-auto px-4 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-4">{text.ctaTitle}</h2>
          <p className="text-white/90 mb-6">{text.ctaSubtitle}</p>
          <a
            href="/"
            className="inline-block bg-white font-bold px-8 py-3 rounded-full hover:shadow-xl hover:scale-105 transition-all"
            style={{ color: '#FF6B6B' }}
          >
            {text.ctaButton}
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer
        className="py-10 border-t"
        style={{ background: '#fdfcfd', borderColor: '#f0f0f0' }}
      >
        <div className="max-w-6xl mx-auto px-4 text-center">
          <a
            href="/"
            className="inline-flex items-center gap-2 text-xl font-bold font-header mb-3"
            style={{ color: '#FF6B6B' }}
          >
            <img src="/favicon.svg" alt="Love Languages" className="w-6 h-6" />
            Love Languages
          </a>
          <nav className="flex justify-center gap-4 text-sm text-gray-400">
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
