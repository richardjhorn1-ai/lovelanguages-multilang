import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { canonicalUrl } from '@/lib/blog-urls';
import { getUITranslations } from '@blog-data/ui-translations';
import { SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ nativeLang: string }>;
};

// Page content per language
const pageContent: Record<string, { title: string; subtitle: string; description: string; methodologyLabel: string; methodologyDesc: string; whyTitle: string; whyItems: string[] }> = {
  en: {
    title: 'Couples Language Learning',
    subtitle: 'Learn your partner\'s language together - the most romantic way to become bilingual',
    description: 'Discover how couples can learn languages together more effectively with our research-backed methodology.',
    methodologyLabel: 'Our Methodology',
    methodologyDesc: 'Science-backed strategies for couples learning languages together. From avoiding common mistakes to AI-powered coaching.',
    whyTitle: 'Why Learn Together?',
    whyItems: [
      'Couples who learn together are 3x more likely to stick with it',
      'Shared vocabulary creates deeper connection',
      'Built-in practice partner who understands your mistakes',
      'Transform language barriers into bonding experiences',
    ],
  },
  es: {
    title: 'Aprendizaje de Idiomas para Parejas',
    subtitle: 'Aprende el idioma de tu pareja juntos - la forma mas romantica de ser bilingue',
    description: 'Descubre como las parejas pueden aprender idiomas juntas de manera mas efectiva.',
    methodologyLabel: 'Nuestra Metodologia',
    methodologyDesc: 'Estrategias respaldadas por la ciencia para parejas que aprenden idiomas juntas.',
    whyTitle: 'Por que aprender juntos?',
    whyItems: [
      'Las parejas que aprenden juntas tienen 3 veces mas probabilidades de continuar',
      'El vocabulario compartido crea una conexion mas profunda',
      'Un companero de practica que entiende tus errores',
      'Transforma las barreras del idioma en experiencias de union',
    ],
  },
  fr: {
    title: 'Apprentissage des Langues en Couple',
    subtitle: 'Apprenez la langue de votre partenaire ensemble',
    description: 'Decouvrez comment les couples peuvent apprendre les langues ensemble plus efficacement.',
    methodologyLabel: 'Notre Methodologie',
    methodologyDesc: 'Strategies basees sur la science pour les couples qui apprennent les langues ensemble.',
    whyTitle: 'Pourquoi apprendre ensemble?',
    whyItems: [
      'Les couples qui apprennent ensemble sont 3 fois plus susceptibles de perseverer',
      'Le vocabulaire partage cree un lien plus profond',
      'Un partenaire de pratique qui comprend vos erreurs',
      'Transformez les barrieres linguistiques en experiences de rapprochement',
    ],
  },
  de: {
    title: 'Gemeinsam Sprachen Lernen',
    subtitle: 'Lernen Sie die Sprache Ihres Partners gemeinsam',
    description: 'Entdecken Sie, wie Paare gemeinsam effektiver Sprachen lernen konnen.',
    methodologyLabel: 'Unsere Methodik',
    methodologyDesc: 'Wissenschaftlich fundierte Strategien fur Paare, die gemeinsam Sprachen lernen.',
    whyTitle: 'Warum gemeinsam lernen?',
    whyItems: [
      'Paare, die gemeinsam lernen, bleiben 3x wahrscheinlicher dabei',
      'Geteilter Wortschatz schafft tiefere Verbindung',
      'Ein Ubungspartner, der Ihre Fehler versteht',
      'Verwandeln Sie Sprachbarrieren in gemeinsame Erlebnisse',
    ],
  },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang } = await params;

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    return {};
  }

  const content = pageContent[nativeLang] || pageContent.en;
  const pageCanonical = canonicalUrl(`/learn/${nativeLang}/couples-language-learning`);

  const hreflangAlternates: Record<string, string> = {};
  for (const lang of SUPPORTED_NATIVE_LANGS) {
    hreflangAlternates[lang] = canonicalUrl(`/learn/${lang}/couples-language-learning`);
  }
  hreflangAlternates['x-default'] = canonicalUrl('/learn/en/couples-language-learning');

  return {
    title: `${content.title} | Love Languages`,
    description: content.description,
    alternates: {
      canonical: pageCanonical,
      languages: hreflangAlternates,
    },
  };
}

export default async function CouplesLandingPage({ params }: PageProps) {
  const { nativeLang } = await params;

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    notFound();
  }

  const content = pageContent[nativeLang] || pageContent.en;
  const text = getUITranslations(nativeLang);

  const pageCanonical = canonicalUrl(`/learn/${nativeLang}/couples-language-learning`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: content.title,
    description: content.description,
    url: pageCanonical,
    inLanguage: nativeLang,
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

      <div className="bg-white min-h-screen">
        {/* Hero */}
        <header
          className="relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #FFF0F3 0%, #fdfcfd 50%, #E7F5FF 100%)' }}
        >
          <div className="max-w-4xl mx-auto px-4 py-16 md:py-24 text-center">
            <nav className="mb-8">
              <a
                href={`/learn/${nativeLang}/`}
                className="inline-flex items-center gap-2 text-sm font-medium hover:text-[#FF6B6B] transition-colors"
                style={{ color: '#666' }}
              >
                <span>&larr;</span> {text.backToLearn || 'Back to Learn'}
              </a>
            </nav>

            <div className="inline-flex items-center gap-3 mb-6">
              <span className="text-6xl">{'\u{1F469}\u200D\u2764\uFE0F\u200D\u{1F468}'}</span>
            </div>
            <h1 className="text-3xl md:text-5xl font-black font-header text-[#292F36] mb-4 leading-tight">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
              {content.subtitle}
            </p>
            <a
              href={`/learn/${nativeLang}/couples-language-learning/methodology/`}
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full font-bold text-white transition-all hover:scale-105 hover:shadow-xl"
              style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
            >
              {content.methodologyLabel} &rarr;
            </a>
          </div>
        </header>

        {/* Why Learn Together */}
        <section className="py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4">
            <h2 className="text-2xl md:text-3xl font-bold font-header text-[#292F36] mb-8 text-center">
              {content.whyTitle}
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {content.whyItems.map((item, i) => (
                <div
                  key={i}
                  className="flex items-start gap-4 p-6 rounded-2xl border border-gray-100 bg-white"
                >
                  <span
                    className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                    style={{ background: 'linear-gradient(135deg, #FF6B6B, #FF8E8E)' }}
                  >
                    {i + 1}
                  </span>
                  <p className="text-gray-700">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Methodology Card */}
        <section className="py-16" style={{ background: '#fdfcfd' }}>
          <div className="max-w-4xl mx-auto px-4">
            <a
              href={`/learn/${nativeLang}/couples-language-learning/methodology/`}
              className="group block p-8 rounded-3xl border border-gray-200 bg-white hover:shadow-xl hover:border-[#FF6B6B] transition-all"
            >
              <div className="flex items-start gap-6">
                <span className="text-5xl flex-shrink-0">{'\u{1F4DA}'}</span>
                <div>
                  <h3 className="text-xl font-bold text-[#292F36] group-hover:text-[#FF6B6B] transition-colors mb-2">
                    {content.methodologyLabel}
                  </h3>
                  <p className="text-gray-600 mb-4">{content.methodologyDesc}</p>
                  <span className="text-sm font-medium text-[#4ECDC4] group-hover:text-[#FF6B6B] transition-colors inline-flex items-center gap-1">
                    Read our methodology articles
                    <span className="group-hover:translate-x-1 transition-transform">&rarr;</span>
                  </span>
                </div>
              </div>
            </a>
          </div>
        </section>

        {/* CTA */}
        <section
          className="py-16"
          style={{ background: 'linear-gradient(135deg, #FF6B6B 0%, #FF8E8E 50%, #FFB4B4 100%)' }}
        >
          <div className="max-w-2xl mx-auto px-4 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold font-header mb-4">
              {text.ctaTitle}
            </h2>
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
              <a href={`/learn/${nativeLang}/`} className="hover:text-[#FF6B6B]">
                {text.blog}
              </a>
              <a href="/tools/" className="hover:text-[#FF6B6B]">
                {text.tools}
              </a>
            </nav>
          </div>
        </footer>
      </div>
    </>
  );
}
