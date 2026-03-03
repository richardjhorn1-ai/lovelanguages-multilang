import BlogCTA from './BlogCTA';
import RALLMethodologySection from './RALLMethodologySection';

interface RelatedArticle {
  slug: string;
  data: {
    title: string;
    description: string;
    category: string;
    readTime: number;
    image?: string;
  };
}

interface LanguageInfo {
  flag: string;
  name: string;
  nativeName: string;
}

interface ReverseArticle {
  slug: string;
  data: {
    title: string;
    description: string;
    category: string;
    readTime: number;
    language?: string;
    nativeLanguage?: string;
  };
}

interface CrossPairArticle {
  slug: string;
  data: {
    title: string;
    description: string;
    category: string;
    readTime: number;
    language?: string;
    nativeLanguage?: string;
  };
}

interface ArticleLayoutProps {
  title: string;
  description: string;
  category: string | null;
  difficulty?: string | null;
  readTime?: number | null;
  image?: string | null;
  date?: string | null;
  tags?: string[] | null;
  relatedArticles?: RelatedArticle[];
  languageCode?: string;
  languageInfo?: LanguageInfo;
  nativeLanguageCode?: string;
  nativeLanguageInfo?: LanguageInfo;
  updatedAt?: string | null;
  alternateVersions?: Array<{ nativeLang: string; href: string }>;
  reverseArticle?: ReverseArticle;
  crossPairArticles?: CrossPairArticle[];
  articleSlug?: string;
  faqItems?: Array<{question: string, answer: string}> | null;
  children: React.ReactNode;
}

const LANG_FLAGS: Record<string, string> = {
  en: '\u{1F1EC}\u{1F1E7}', es: '\u{1F1EA}\u{1F1F8}', fr: '\u{1F1EB}\u{1F1F7}', de: '\u{1F1E9}\u{1F1EA}',
  it: '\u{1F1EE}\u{1F1F9}', pt: '\u{1F1F5}\u{1F1F9}', pl: '\u{1F1F5}\u{1F1F1}', nl: '\u{1F1F3}\u{1F1F1}',
  ru: '\u{1F1F7}\u{1F1FA}', uk: '\u{1F1FA}\u{1F1E6}', el: '\u{1F1EC}\u{1F1F7}', tr: '\u{1F1F9}\u{1F1F7}',
  cs: '\u{1F1E8}\u{1F1FF}', hu: '\u{1F1ED}\u{1F1FA}', ro: '\u{1F1F7}\u{1F1F4}', sv: '\u{1F1F8}\u{1F1EA}',
  no: '\u{1F1F3}\u{1F1F4}', da: '\u{1F1E9}\u{1F1F0}'
};

const categoryConfig = {
  phrases: { icon: '\u{1F4AC}', bg: 'bg-rose-100', text: 'text-rose-700', label: 'Phrases' },
  vocabulary: { icon: '\u{1F4DA}', bg: 'bg-purple-100', text: 'text-purple-700', label: 'Vocabulary' },
  grammar: { icon: '\u{1F4DD}', bg: 'bg-blue-100', text: 'text-blue-700', label: 'Grammar' },
  culture: { icon: '', bg: 'bg-amber-100', text: 'text-amber-700', label: 'Culture' },
  situations: { icon: '\u{1F3AD}', bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Situations' },
  pronunciation: { icon: '\u{1F5E3}\u{FE0F}', bg: 'bg-teal-100', text: 'text-teal-700', label: 'Pronunciation' },
  communication: { icon: '\u{1F4AC}', bg: 'bg-cyan-100', text: 'text-cyan-700', label: 'Communication' },
};

export default function ArticleLayout({
  title,
  description,
  category,
  difficulty: rawDifficulty,
  readTime: rawReadTime,
  image: rawImage,
  date: rawDate,
  tags: rawTags,
  relatedArticles = [],
  languageCode = 'pl',
  languageInfo = { flag: '\u{1F1F5}\u{1F1F1}', name: 'Polish', nativeName: 'Polski' },
  nativeLanguageCode = 'en',
  nativeLanguageInfo = { flag: '\u{1F1EC}\u{1F1E7}', name: 'English', nativeName: 'English' },
  reverseArticle,
  crossPairArticles = [],
  articleSlug,
  faqItems: rawFaqItems,
  children,
}: ArticleLayoutProps) {
  // Safe fallbacks for nullable fields
  const readTime = rawReadTime || 8;
  const image = rawImage || null;
  const date = rawDate || new Date().toISOString().split('T')[0];
  const faqItems = rawFaqItems || [];

  // Use language flag for culture category
  const cat = { ...categoryConfig[category] };
  if (category === 'culture') {
    cat.icon = languageInfo.flag;
  }

  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const nativeHubUrl = `/learn/${nativeLanguageCode}/`;
  const languagePairUrl = `/learn/${nativeLanguageCode}/${languageCode}/`;

  return (
    <>
      {/* Breadcrumb */}
      <nav className="max-w-3xl mx-auto px-4 py-3 bg-gray-50" aria-label="Breadcrumb">
        <ol className="flex items-center gap-1.5 text-sm text-gray-500 flex-wrap">
          <li><a href="/" className="hover:text-accent">Home</a></li>
          <li className="text-gray-300">/</li>
          <li><a href="/learn/" className="hover:text-accent">Learn</a></li>
          <li className="text-gray-300">/</li>
          <li><a href={nativeHubUrl} className="hover:text-accent">{nativeLanguageInfo.flag} {nativeLanguageInfo.nativeName}</a></li>
          <li className="text-gray-300">&rarr;</li>
          <li><a href={languagePairUrl} className="hover:text-accent">{languageInfo.flag} {languageInfo.name}</a></li>
          <li className="text-gray-300">/</li>
          <li className="text-gray-900 truncate max-w-[180px]">{title}</li>
        </ol>
      </nav>

      {/* Hero Image or Emoji Fallback */}
      <div className="relative h-64 md:h-80 bg-gradient-to-br from-accent/20 to-pink-100">
        {image ? (
          <img
            src={image}
            alt={title}
            className="w-full h-full object-cover relative z-[1]"
            loading="eager"
          />
        ) : null}
        <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-30 z-0">
          {cat.icon}
        </div>
      </div>

      {/* Article Content Card */}
      <main className="max-w-3xl mx-auto px-4 -mt-16 relative z-10 pb-16">
        <article className="bg-white rounded-2xl shadow-lg p-6 md:p-10">
          {/* Meta */}
          <div className="flex flex-wrap items-center gap-3 mb-6 text-sm">
            <span className={`px-3 py-1 rounded-full font-bold ${cat.bg} ${cat.text}`}>
              {cat.icon} {cat.label}
            </span>
            <span className="text-gray-500">{formattedDate}</span>
            <span className="text-gray-500">{readTime} min read</span>
          </div>

          {/* Author byline (E-E-A-T signal) */}
          <div className="flex items-center gap-2 text-sm text-gray-600 mb-4">
            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">LL</div>
            <span>By <strong className="text-gray-800">Love Languages Editorial Team</strong></span>
          </div>

          {/* Title - marked as speakable for voice assistants */}
          <h1 className="speakable-title text-3xl md:text-4xl font-black font-header text-gray-900 mb-4 leading-tight">
            {title}
          </h1>

          {/* Summary - speakable description for voice search answers */}
          <p className="speakable-summary text-lg text-gray-600 mb-6 leading-relaxed">
            {description}
          </p>

          {/* Content */}
          <div className="prose max-w-none">
            {children}
          </div>

          {/* App Signup CTA */}
          <BlogCTA />

          {/* FAQ Section — visible accordion */}
          {faqItems.length > 0 && (
            <section className="mt-10 pt-8 border-t border-gray-200">
              <h2 className="text-xl font-bold font-header text-gray-900 mb-4">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqItems.map((faq, index) => (
                  <details key={index} className="group bg-gray-50 rounded-xl border border-gray-200 overflow-hidden">
                    <summary className="flex items-center justify-between p-4 cursor-pointer font-semibold text-gray-900 hover:bg-gray-100 transition-colors">
                      <span className="pr-2">{faq.question}</span>
                      <svg className="w-5 h-5 text-gray-500 group-open:rotate-180 transition-transform flex-shrink-0 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </summary>
                    <div className="p-4 pt-0 text-gray-700 border-t border-gray-200">
                      <p>{faq.answer}</p>
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Explore More CTA */}
        <div className="mt-8 p-6 bg-gradient-to-r from-accent/5 to-pink-50 rounded-2xl border border-accent/10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="text-gray-600 text-sm mb-1">Want to learn more?</p>
              <p className="font-bold text-gray-900">More {languageInfo.name} articles for {nativeLanguageInfo.nativeName} speakers</p>
            </div>
            <a
              href={languagePairUrl}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent text-white font-bold rounded-full hover:shadow-lg hover:scale-105 transition-all text-sm"
            >
              {nativeLanguageInfo.flag} &rarr; {languageInfo.flag} Articles
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>
      </main>

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 pb-16">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-6">Keep Learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {relatedArticles.map((related) => {
              const relCat = categoryConfig[related.data.category as keyof typeof categoryConfig];
              return (
                <a
                  key={related.slug}
                  href={`/learn/${related.slug}/`}
                  className="group bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow overflow-hidden"
                >
                  <div className="aspect-video bg-gradient-to-br from-accent/20 to-pink-100 relative">
                    {related.data.image ? (
                      <img
                        src={related.data.image}
                        alt={related.data.title}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-30">
                        {relCat?.icon || '\u{1F4D6}'}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-bold mb-2 ${relCat?.bg || 'bg-gray-100'} ${relCat?.text || 'text-gray-700'}`}>
                      {relCat?.icon} {relCat?.label || related.data.category}
                    </span>
                    <h3 className="font-bold text-gray-900 group-hover:text-accent transition-colors line-clamp-2">
                      {related.data.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-1">{related.data.readTime} min read</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* RALL Methodology Section */}
      {articleSlug && (
        <RALLMethodologySection nativeLang={nativeLanguageCode} seed={articleSlug} />
      )}

      {/* SEO: Reverse Language Pair Link */}
      {reverseArticle && (
        <section className="max-w-3xl mx-auto px-4 pb-8">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-2xl">{'\u{1F504}'}</span>
              <h3 className="font-bold text-gray-900">Learn the Reverse!</h3>
            </div>
            <p className="text-gray-600 text-sm mb-4">
              {nativeLanguageInfo.flag} {nativeLanguageInfo.name} speaker learning {languageInfo.flag} {languageInfo.name}?
              Check out the reverse perspective:
            </p>
            <a
              href={`/learn/${reverseArticle.slug}/`}
              className="inline-flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow text-sm font-medium text-gray-900"
            >
              <span>{languageInfo.flag} &rarr; {nativeLanguageInfo.flag}</span>
              <span className="text-gray-600 truncate max-w-[200px]">{reverseArticle.data.title}</span>
              <svg className="w-4 h-4 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </section>
      )}

      {/* SEO: Cross-Language Pair Articles */}
      {crossPairArticles.length > 0 && (
        <section className="max-w-3xl mx-auto px-4 pb-12">
          <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>{'\u{1F30D}'}</span> Similar Topics in Other Languages
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {crossPairArticles.map((article) => {
              const parts = article.slug.split('/');
              const fromLang = parts[0];
              const toLang = parts[1];
              return (
                <a
                  key={article.slug}
                  href={`/learn/${article.slug}/`}
                  className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100 hover:border-accent/30 hover:shadow-sm transition-all group"
                >
                  <span className="text-lg">
                    {LANG_FLAGS[fromLang] || '\u{1F310}'} &rarr; {LANG_FLAGS[toLang] || '\u{1F310}'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 group-hover:text-accent transition-colors text-sm truncate">
                      {article.data.title}
                    </p>
                    <p className="text-xs text-gray-500">{article.data.readTime} min read</p>
                  </div>
                </a>
              );
            })}
          </div>
        </section>
      )}

      {/* Sticky Mobile CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-accent to-pink-500 p-3 md:hidden z-50 shadow-lg">
        <a
          href={`/?utm_source=blog&utm_medium=sticky-cta&utm_campaign=${nativeLanguageCode}-${languageCode}&utm_content=${articleSlug}&ref_native=${nativeLanguageCode}&ref_target=${languageCode}`}
          className="flex items-center justify-center gap-2 text-white font-bold"
        >
          <span>Learn {languageInfo.name} Together</span>
          <span className="bg-white text-accent px-3 py-1 rounded-full text-sm">Start Now &rarr;</span>
        </a>
      </div>

      {/* Spacer for sticky CTA on mobile */}
      <div className="h-16 md:hidden" />

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <a href="/" className="inline-flex items-center gap-2 text-2xl font-bold font-header text-accent mb-4">
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </a>
          <p className="text-gray-600 mb-6">Learn {languageInfo.name} together with your partner</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <a href="/learn/" className="hover:text-accent">Blog</a>
            <a href="/tools/" className="hover:text-accent">Tools</a>
            <a href="/terms/" className="hover:text-accent">Terms</a>
            <a href="/privacy/" className="hover:text-accent">Privacy</a>
          </nav>
        </div>
      </footer>
    </>
  );
}
