import { Metadata } from 'next';
import { redirect, notFound } from 'next/navigation';
import { supabaseBlog } from '@/lib/supabase-blog';
import { canonicalUrl } from '@/lib/blog-urls';
import { SUPPORTED_NATIVE_LANGS } from '@blog-data/language-info';

export const revalidate = 86400;

type PageProps = {
  params: Promise<{ nativeLang: string }>;
};

// Page content per language
const pageContent: Record<string, { title: string; subtitle: string; description: string }> = {
  en: {
    title: 'Couples Language Learning Methodology',
    subtitle: 'The science-backed approach to learning your partner\'s language together',
    description: 'Discover our research-based methodology for couples learning languages together. From avoiding common mistakes to AI coaching strategies.',
  },
  es: {
    title: 'Metodologia de Aprendizaje de Idiomas para Parejas',
    subtitle: 'El enfoque respaldado por la ciencia para aprender el idioma de tu pareja juntos',
    description: 'Descubre nuestra metodologia basada en investigacion para parejas que aprenden idiomas juntas.',
  },
  fr: {
    title: 'Methodologie d\'Apprentissage des Langues pour Couples',
    subtitle: 'L\'approche scientifique pour apprendre la langue de votre partenaire ensemble',
    description: 'Decouvrez notre methodologie basee sur la recherche pour les couples qui apprennent les langues ensemble.',
  },
  de: {
    title: 'Methodik des Paar-Sprachlernens',
    subtitle: 'Der wissenschaftlich fundierte Ansatz zum gemeinsamen Erlernen der Sprache Ihres Partners',
    description: 'Entdecken Sie unsere forschungsbasierte Methodik fur Paare, die gemeinsam Sprachen lernen.',
  },
  it: {
    title: 'Metodologia di Apprendimento Linguistico per Coppie',
    subtitle: 'L\'approccio scientifico per imparare la lingua del partner insieme',
    description: 'Scopri la nostra metodologia basata sulla ricerca per coppie che imparano le lingue insieme.',
  },
  pt: {
    title: 'Metodologia de Aprendizado de Idiomas para Casais',
    subtitle: 'A abordagem cientifica para aprender o idioma do seu parceiro juntos',
    description: 'Descubra nossa metodologia baseada em pesquisa para casais aprendendo idiomas juntos.',
  },
  pl: {
    title: 'Metodologia Nauki Jezykow dla Par',
    subtitle: 'Naukowo uzasadnione podejscie do wspolnej nauki jezyka partnera',
    description: 'Odkryj nasza metodologie oparta na badaniach dla par uczacych sie jezykow razem.',
  },
  ru: {
    title: 'Metodologiya Izucheniya Yazykov dlya Par',
    subtitle: 'Nauchnyy podkhod k sovmestnomu izucheniyu yazyka partnera',
    description: 'Otkroyte nashu metodologiyu, osnovannuyu na issledovaniyakh, dlya par, izuchayushchikh yazyki vmeste.',
  },
  uk: {
    title: 'Metodologiya Vyvchennya Mov dlya Par',
    subtitle: 'Naukovyy pidkhid do spilnoho vyvchennya movy partnera',
    description: 'Vidkryyte nashu metodologiyu, zasnovanu na doslidzhennyakh, dlya par, yaki vyvchayut movy razom.',
  },
  nl: {
    title: 'Methodologie voor Taal Leren voor Koppels',
    subtitle: 'De wetenschappelijk onderbouwde aanpak om samen de taal van je partner te leren',
    description: 'Ontdek onze op onderzoek gebaseerde methodologie voor koppels die samen talen leren.',
  },
  sv: {
    title: 'Metodik for Pars Sprakinlarning',
    subtitle: 'Det vetenskapligt grundade tillvagagangssattet for att lara sig partnerns sprak tillsammans',
    description: 'Upptack var forskningsbaserade metodik for par som lar sig sprak tillsammans.',
  },
  no: {
    title: 'Metodikk for Parspraklering',
    subtitle: 'Den vitenskapelig baserte tilnermingen til a lere partnerens sprak sammen',
    description: 'Oppdag var forskningsbaserte metodikk for par som lerer sprak sammen.',
  },
  da: {
    title: 'Metode til Parsprogindlering',
    subtitle: 'Den videnskabeligt baserede tilgang til at lere din partners sprog sammen',
    description: 'Opdag vores forskningsbaserede metode for par, der lerer sprog sammen.',
  },
  cs: {
    title: 'Metodika Uceni Jazyku pro Pary',
    subtitle: 'Vedecky podlozeny pristup ke spolecnemu uceni se jazyku partnera',
    description: 'Objevte nasi metodiku zalozenou na vyzkumu pro pary, ktere se uci jazyky spolecne.',
  },
  ro: {
    title: 'Metodologia Invatarii Limbilor pentru Cupluri',
    subtitle: 'Abordarea bazata pe stiinta pentru a invata limba partenerului impreuna',
    description: 'Descopera metodologia noastra bazata pe cercetare pentru cupluri care invata limbi impreuna.',
  },
  el: {
    title: 'Methodologia Ekmathisis Glosson gia Zevgaria',
    subtitle: 'I epistimonika tekmeriomeni prosengisi gia na mathete ti glossa tou syntrofou sas mazi',
    description: 'Anakalypste ti methodologia mas vasismeni stin erevna gia zevgaria pou mathainoun glosses mazi.',
  },
  hu: {
    title: 'Paros Nyelvtanulasi Modszertan',
    subtitle: 'A tudomanyosan megalapozott megkozelites a partner nyelvenek kozos tanulasahoz',
    description: 'Fedezd fel kutatasalapu modszertanunkat paroknak, akik egyutt tanulnak nyelveket.',
  },
  tr: {
    title: 'Ciftler Icin Dil Ogrenimi Metodolojisi',
    subtitle: 'Partnerinizin dilini birlikte ogrenmek icin bilime dayali yaklasim',
    description: 'Birlikte dil ogrenen ciftler icin arastirmaya dayali metodolojimizi kesfedin.',
  },
};

// Breadcrumb labels per language
const breadcrumbLabels: Record<string, { home: string; couples: string; methodology: string }> = {
  en: { home: 'Learn', couples: 'Couples Language Learning', methodology: 'Methodology' },
  es: { home: 'Aprender', couples: 'Aprendizaje en Pareja', methodology: 'Metodologia' },
  fr: { home: 'Apprendre', couples: 'Apprentissage en Couple', methodology: 'Methodologie' },
  de: { home: 'Lernen', couples: 'Paar-Sprachlernen', methodology: 'Methodik' },
  it: { home: 'Impara', couples: 'Apprendimento di Coppia', methodology: 'Metodologia' },
  pt: { home: 'Aprender', couples: 'Aprendizado para Casais', methodology: 'Metodologia' },
  pl: { home: 'Nauka', couples: 'Nauka dla Par', methodology: 'Metodologia' },
  ru: { home: 'Uchit', couples: 'Obuchenie dlya Par', methodology: 'Metodologiya' },
  uk: { home: 'Vchyty', couples: 'Navchannya dlya Par', methodology: 'Metodologiya' },
  nl: { home: 'Leren', couples: 'Taal Leren voor Koppels', methodology: 'Methodologie' },
  sv: { home: 'Lar dig', couples: 'Pars Sprakinlarning', methodology: 'Metodik' },
  no: { home: 'Ler', couples: 'Parspraklering', methodology: 'Metodikk' },
  da: { home: 'Ler', couples: 'Parsprogindlering', methodology: 'Metode' },
  cs: { home: 'Ucit se', couples: 'Uceni pro Pary', methodology: 'Metodika' },
  ro: { home: 'Invata', couples: 'Invatare pentru Cupluri', methodology: 'Metodologie' },
  el: { home: 'Mathe', couples: 'Ekmathisi gia Zevgaria', methodology: 'Methodologia' },
  hu: { home: 'Tanulj', couples: 'Paros Nyelvtanulas', methodology: 'Modszertan' },
  tr: { home: 'Ogren', couples: 'Ciftler Icin Dil Ogrenimi', methodology: 'Metodoloji' },
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { nativeLang } = await params;

  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    return {};
  }

  const content = pageContent[nativeLang] || pageContent.en;
  const pageCanonical = canonicalUrl(`/learn/${nativeLang}/couples-language-learning/methodology`);

  const hreflangAlternates: Record<string, string> = {};
  for (const lang of SUPPORTED_NATIVE_LANGS) {
    hreflangAlternates[lang] = canonicalUrl(`/learn/${lang}/couples-language-learning/methodology`);
  }
  hreflangAlternates['x-default'] = canonicalUrl('/learn/en/couples-language-learning/methodology');

  return {
    title: `${content.title} | Love Languages`,
    description: content.description,
    alternates: {
      canonical: pageCanonical,
      languages: hreflangAlternates,
    },
  };
}

export default async function MethodologyIndexPage({ params }: PageProps) {
  const { nativeLang } = await params;

  // Validate native language
  if (!SUPPORTED_NATIVE_LANGS.includes(nativeLang)) {
    redirect('/learn/en/couples-language-learning/methodology/');
  }

  // Fetch articles from Supabase
  let articles: { slug: string; title: string; description: string | null; read_time: number | null; difficulty: string | null }[] = [];

  try {
    const { data, error } = await supabaseBlog
      .from('blog_articles')
      .select('slug, title, description, read_time, difficulty')
      .eq('native_lang', nativeLang)
      .eq('target_lang', 'all')
      .eq('category', 'couples-methodology')
      .eq('published', true)
      .order('title');

    if (error) {
      console.error('Methodology index Supabase error:', error.message);
    }

    if (data) {
      articles = data;
    }
  } catch (err) {
    console.error('Methodology index error:', err);
  }

  const content = pageContent[nativeLang] || pageContent.en;
  const labels = breadcrumbLabels[nativeLang] || breadcrumbLabels.en;
  const pageCanonical = canonicalUrl(`/learn/${nativeLang}/couples-language-learning/methodology`);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
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
        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* Breadcrumbs */}
          <nav className="text-sm text-gray-500 mb-6">
            <ol className="flex items-center space-x-2">
              <li>
                <a href={`/learn/${nativeLang}/`} className="hover:text-pink-600">
                  {labels.home}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li>
                <a
                  href={`/learn/${nativeLang}/couples-language-learning/`}
                  className="hover:text-pink-600"
                >
                  {labels.couples}
                </a>
              </li>
              <li className="text-gray-400">/</li>
              <li className="text-gray-700 font-medium">{labels.methodology}</li>
            </ol>
          </nav>

          {/* Hero */}
          <header className="text-center mb-12">
            <span className="text-5xl mb-4 block">{'\u{1F4DA}'}</span>
            <h1 className="text-3xl md:text-4xl font-black font-header text-gray-900 mb-4">
              {content.title}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-6">{content.subtitle}</p>
            <a
              href={`/learn/${nativeLang}/couples-language-learning/`}
              className="inline-flex items-center gap-2 text-[#FF6B6B] hover:underline font-medium"
            >
              &larr; {labels.couples}
            </a>
          </header>

          {/* Article List */}
          {articles.length > 0 ? (
            <div className="grid gap-6">
              {articles.map(article => (
                <a
                  key={article.slug}
                  href={`/learn/${nativeLang}/couples-language-learning/methodology/${article.slug}/`}
                  className="block p-6 bg-white border border-gray-200 rounded-xl hover:border-pink-300 hover:shadow-lg transition-all"
                >
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{article.title}</h2>
                  {article.description && (
                    <p className="text-gray-600 mb-3">{article.description}</p>
                  )}
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    {article.read_time && <span>{'\u{1F4D6}'} {article.read_time} min</span>}
                    {article.difficulty && (
                      <span className="px-2 py-1 bg-pink-100 text-pink-700 rounded-full text-xs">
                        {article.difficulty}
                      </span>
                    )}
                  </div>
                </a>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No methodology articles available yet.</p>
            </div>
          )}

          {/* CTA */}
          <div className="mt-12 p-6 bg-gradient-to-r from-pink-500 to-red-500 rounded-2xl text-white text-center">
            <h3 className="text-xl font-bold mb-2">Ready to start learning together?</h3>
            <p className="mb-4 opacity-90">Apply these methods with Love Languages</p>
            <a
              href="/"
              className="inline-block px-6 py-3 bg-white text-pink-600 font-bold rounded-full hover:bg-pink-50 transition-colors"
            >
              Get Started Free &rarr;
            </a>
          </div>
        </div>
      </div>
    </>
  );
}
