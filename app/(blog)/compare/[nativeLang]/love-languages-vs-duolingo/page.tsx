import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import BlogFAQ from '@/components/blog/BlogFAQ';
import { getComparisonContent } from '@blog-data/comparison-features';

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((nativeLang) => ({ nativeLang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nativeLang: string }>;
}): Promise<Metadata> {
  const { nativeLang } = await params;
  const lang = nativeLang || 'en';
  const content = getComparisonContent(lang);

  const title = content.page.title.replace('{competitor}', 'Duolingo');
  const description = content.page.description.replace('{competitor}', 'Duolingo');

  return {
    title,
    description,
    alternates: {
      canonical: `https://www.lovelanguages.io/compare/${lang}/love-languages-vs-duolingo/`,
    },
  };
}

export default async function VsDuolingoPage({
  params,
}: {
  params: Promise<{ nativeLang: string }>;
}) {
  const { nativeLang } = await params;
  const lang = nativeLang || 'en';

  if (!SUPPORTED_LANGS.includes(lang)) {
    notFound();
  }

  const content = getComparisonContent(lang);

  const title = content.page.title.replace('{competitor}', 'Duolingo');
  const description = content.page.description.replace('{competitor}', 'Duolingo');
  const heroTitle = content.page.heroTitle.replace('{competitor}', 'Duolingo');

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: title,
    description,
    url: `https://www.lovelanguages.io/compare/${lang}/love-languages-vs-duolingo/`,
    inLanguage: lang,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-gradient-to-b from-accent/10 to-white">
        <div className="max-w-5xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              {heroTitle}
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {content.page.heroSubtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Quick Summary */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 border-2 border-accent">
            <div className="flex items-center gap-3 mb-4">
              <img src="/favicon.svg" alt="Love Languages" className="w-10 h-10" />
              <div>
                <h2 className="text-xl font-bold font-header text-gray-900">Love Languages</h2>
                <p className="text-sm text-accent font-medium">{content.page.bestForCouples}</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-600">
              {content.loveLanguagesSummary.map((item: { text: string }, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className="text-green-500">{"\u2713"}</span> {item.text}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-white rounded-2xl shadow-lg p-6 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-green-500 rounded-lg flex items-center justify-center text-white text-xl font-bold">D</div>
              <div>
                <h2 className="text-xl font-bold font-header text-gray-900">Duolingo</h2>
                <p className="text-sm text-gray-500 font-medium">{content.duolingoSubtitle}</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-600">
              {content.duolingoSummary.map((item: { text: string; positive: boolean }, idx: number) => (
                <li key={idx} className="flex items-center gap-2">
                  <span className={item.positive ? "text-green-500" : "text-red-400"}>{item.positive ? "\u2713" : "\u2717"}</span>
                  {item.text}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Key Differentiators */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold font-header text-gray-900 mb-6 text-center">{content.page.whatMakesDifferent}</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">{"\uD83C\uDFA7"}</div>
            <h3 className="font-bold text-gray-900 mb-2">{content.listenMode.title}</h3>
            <p className="text-gray-600 text-sm">{content.listenMode.description}</p>
          </div>
          <div className="bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">{"\uD83C\uDFAF"}</div>
            <h3 className="font-bold text-gray-900 mb-2">{content.partnerChallenges.title}</h3>
            <p className="text-gray-600 text-sm">{content.partnerChallenges.description}</p>
          </div>
          <div className="bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-6">
            <div className="text-3xl mb-3">{"\uD83C\uDF81"}</div>
            <h3 className="font-bold text-gray-900 mb-2">{content.wordGifts.title}</h3>
            <p className="text-gray-600 text-sm">{content.wordGifts.description}</p>
          </div>
        </div>
      </section>

      {/* Detailed Comparison Table */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold font-header text-gray-900 mb-6 text-center">{content.page.featureComparison}</h2>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50">
                  <th className="text-left p-4 font-bold text-gray-700">Feature</th>
                  <th className="text-center p-4 font-bold text-accent">Love Languages</th>
                  <th className="text-center p-4 font-bold text-gray-700">Duolingo</th>
                </tr>
              </thead>
              <tbody>
                {content.duolingoFeatures.map((feature: { name: string; loveLanguages: { value: string; highlight: boolean }; competitor: { value: string; highlight: boolean } }, i: number) => (
                  <tr key={i} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="p-4 font-medium text-gray-900">{feature.name}</td>
                    <td className={`p-4 text-center ${feature.loveLanguages.highlight ? 'text-accent font-bold' : 'text-gray-600'}`}>
                      {feature.loveLanguages.value}
                    </td>
                    <td className={`p-4 text-center ${feature.competitor.highlight ? 'text-green-600 font-bold' : 'text-gray-600'}`}>
                      {feature.competitor.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* When to Choose Which */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-accent/10 to-pink-50 rounded-2xl p-6">
            <h3 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">{"\uD83D\uDC95"}</span> {content.chooseLoveLanguagesTitle}
            </h3>
            <ul className="space-y-3 text-gray-700">
              {content.chooseLoveLanguages.slice(0, 5).map((reason: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-accent mt-1">{"\u2665"}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-gray-50 rounded-2xl p-6">
            <h3 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-2xl">{"\uD83E\uDD89"}</span> {content.chooseDuolingoTitle}
            </h3>
            <ul className="space-y-3 text-gray-700">
              {content.chooseDuolingo.map((reason: string, idx: number) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-gray-400 mt-1">{"\u2022"}</span>
                  <span>{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Couple Features Deep Dive */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-6 text-center">{content.page.builtForLearning}</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-accent">{"\uD83C\uDFAE"}</span> {content.gameModes.title}
              </h3>
              <p className="text-gray-600 mb-4">{content.gameModes.description}</p>

              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-accent">{"\uD83D\uDCDA"}</span> {content.loveLog.title}
              </h3>
              <p className="text-gray-600">{content.loveLog.description}</p>
            </div>
            <div>
              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-accent">{"\uD83C\uDFC6"}</span> {content.progressXP.title}
              </h3>
              <p className="text-gray-600 mb-4">{content.progressXP.description}</p>

              <h3 className="font-bold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-accent">{"\uD83C\uDF0D"}</span> {content.languages18.title}
              </h3>
              <p className="text-gray-600">{content.languages18.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-3xl mx-auto px-4 py-8">
        <BlogFAQ items={content.duolingoFaqs} />
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-4 py-12">
        <div className="bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            {content.page.ctaTitle}
          </h2>
          <p className="text-white/90 mb-6 text-lg max-w-2xl mx-auto">
            {content.page.ctaSubtitle}
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-accent font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            {content.page.ctaButton} &rarr;
          </Link>
          <p className="mt-4 text-white/80 text-sm">
            {content.page.ctaFooter}
          </p>
        </div>
      </section>

      {/* Other Comparisons */}
      <section className="max-w-5xl mx-auto px-4 py-8">
        <h2 className="text-xl font-bold font-header text-gray-900 mb-4 text-center">{content.page.otherComparisons}</h2>
        <div className="flex justify-center gap-4 flex-wrap">
          <Link href={`/compare/${lang}/love-languages-vs-babbel/`} className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-accent/10 hover:text-accent transition-colors">
            Love Languages vs Babbel
          </Link>
          <Link href={`/compare/${lang}/`} className="px-4 py-2 bg-gray-100 rounded-full text-gray-700 hover:bg-accent/10 hover:text-accent transition-colors">
            {content.page.allComparisons}
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-5xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold font-header text-accent mb-4">
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </Link>
          <p className="text-gray-600 mb-6">{content.page.footerTagline}</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href={`/learn/${lang}/`} className="hover:text-accent">{content.page.blog}</Link>
            <Link href="/tools/" className="hover:text-accent">{content.page.tools}</Link>
            <Link href={`/compare/${lang}/`} className="hover:text-accent">{content.page.compare}</Link>
            <Link href="/terms/" className="hover:text-accent">{content.page.terms}</Link>
            <Link href="/privacy/" className="hover:text-accent">{content.page.privacy}</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
