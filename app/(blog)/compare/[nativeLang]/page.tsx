import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getComparisonContent } from '@blog-data/comparison-features';

const SUPPORTED_LANGS = ['en', 'es', 'fr', 'de', 'it', 'pt', 'nl', 'pl', 'ru', 'uk', 'tr', 'ro', 'sv', 'no', 'da', 'cs', 'el', 'hu'];

// Page-specific translations
const UI_TEXT: Record<string, {
  pageTitle: string;
  pageDescription: string;
  heroTitle: string;
  heroSubtitle: string;
  whyChooseTitle: string;
  builtForCouples: { title: string; description: string };
  listenMode: { title: string; description: string };
  languages18: { title: string; description: string };
  aiConversations: { title: string; description: string };
  gameModes: { title: string; description: string };
  wordGifts: { title: string; description: string };
  ctaTitle: string;
  ctaSubtitle: string;
  ctaButton: string;
  duolingoDescription: string;
  duolingoVerdict: string;
  babbelDescription: string;
  babbelVerdict: string;
  compare: string;
}> = {
  en: {
    pageTitle: "Compare Language Learning Apps - Love Languages vs Duolingo, Babbel & More",
    pageDescription: "Compare Love Languages with Duolingo, Babbel, and other language learning apps. Find the best app for couples learning 18 languages together with Listen Mode and partner challenges.",
    heroTitle: "Compare Language Learning Apps",
    heroSubtitle: "Honest comparisons to help you choose the right app for learning languages with your partner",
    whyChooseTitle: "Why Couples Choose Love Languages",
    builtForCouples: { title: "Built for Couples", description: "The only language app designed for learning together with partner challenges, word gifts, and shared progress." },
    listenMode: { title: "Listen Mode", description: "Learn passively while cooking, commuting, or relaxing. No other app lets you absorb language so naturally." },
    languages18: { title: "18 Languages", description: "Spanish, French, German, Italian, Portuguese, Polish, and more. Any native language to any target language." },
    aiConversations: { title: "AI Conversations", description: "Real conversations with AI that adapts to your level. Practice speaking anytime, not just scripted exercises." },
    gameModes: { title: "5 Game Modes", description: "Flashcard battles, listening challenges, and more. Games designed for couples to compete and learn together." },
    wordGifts: { title: "Word Gifts", description: "Send romantic vocabulary to your partner. A sweet way to share your progress and encourage each other." },
    ctaTitle: "See Why Couples Love Us",
    ctaSubtitle: "AI coaching, Listen Mode, partner challenges, and games designed for learning 18 languages together.",
    ctaButton: "Start Learning Together",
    duolingoDescription: "Compare the gamified free option with our couple-focused multi-language app. See how Listen Mode and partner features stack up.",
    duolingoVerdict: "Best free alternative",
    babbelDescription: "Compare structured solo courses with AI-powered conversational learning for couples. 18 languages vs 14.",
    babbelVerdict: "Best for structured learners",
    compare: "Compare"
  },
  es: {
    pageTitle: "Comparar Apps de Idiomas - Love Languages vs Duolingo, Babbel y Mas",
    pageDescription: "Compara Love Languages con Duolingo, Babbel y otras apps de idiomas. Encuentra la mejor app para parejas aprendiendo 18 idiomas juntos con Modo Escucha y desafios de pareja.",
    heroTitle: "Comparar Apps de Idiomas",
    heroSubtitle: "Comparaciones honestas para ayudarte a elegir la app correcta para aprender idiomas con tu pareja",
    whyChooseTitle: "Por Que las Parejas Eligen Love Languages",
    builtForCouples: { title: "Disenado para Parejas", description: "La unica app de idiomas disenada para aprender juntos con desafios de pareja, regalos de palabras y progreso compartido." },
    listenMode: { title: "Modo Escucha", description: "Aprende pasivamente mientras cocinas, viajas o te relajas. Ninguna otra app te permite absorber idiomas tan naturalmente." },
    languages18: { title: "18 Idiomas", description: "Espanol, frances, aleman, italiano, portugues, polaco y mas. Cualquier idioma nativo a cualquier idioma objetivo." },
    aiConversations: { title: "Conversaciones con IA", description: "Conversaciones reales con IA que se adapta a tu nivel. Practica hablando en cualquier momento, no solo ejercicios guionizados." },
    gameModes: { title: "5 Modos de Juego", description: "Batallas de tarjetas, desafios de escucha y mas. Juegos disenados para que las parejas compitan y aprendan juntas." },
    wordGifts: { title: "Regalos de Palabras", description: "Envia vocabulario romantico a tu pareja. Una forma dulce de compartir tu progreso y animarse mutuamente." },
    ctaTitle: "Descubre Por Que las Parejas Nos Aman",
    ctaSubtitle: "Coaching de IA, Modo Escucha, desafios de pareja y juegos disenados para aprender 18 idiomas juntos.",
    ctaButton: "Empezar a Aprender Juntos",
    duolingoDescription: "Compara la opcion gratuita gamificada con nuestra app multiidioma para parejas. Ve como se comparan el Modo Escucha y las funciones de pareja.",
    duolingoVerdict: "Mejor alternativa gratuita",
    babbelDescription: "Compara cursos estructurados individuales con aprendizaje conversacional con IA para parejas. 18 idiomas vs 14.",
    babbelVerdict: "Mejor para aprendices estructurados",
    compare: "Comparar"
  },
  fr: {
    pageTitle: "Comparer les Apps de Langues - Love Languages vs Duolingo, Babbel et Plus",
    pageDescription: "Comparez Love Languages avec Duolingo, Babbel et d'autres apps de langues. Trouvez la meilleure app pour les couples apprenant 18 langues ensemble.",
    heroTitle: "Comparer les Apps de Langues",
    heroSubtitle: "Comparaisons honnetes pour vous aider a choisir la bonne app pour apprendre des langues avec votre partenaire",
    whyChooseTitle: "Pourquoi les Couples Choisissent Love Languages",
    builtForCouples: { title: "Concu pour les Couples", description: "La seule app de langues concue pour apprendre ensemble avec des defis de couple, des cadeaux de mots et des progres partages." },
    listenMode: { title: "Mode Ecoute", description: "Apprenez passivement en cuisinant, voyageant ou vous relaxant. Aucune autre app ne vous permet d'absorber les langues si naturellement." },
    languages18: { title: "18 Langues", description: "Espagnol, francais, allemand, italien, portugais, polonais et plus. N'importe quelle langue maternelle vers n'importe quelle langue cible." },
    aiConversations: { title: "Conversations IA", description: "De vraies conversations avec une IA qui s'adapte a votre niveau. Pratiquez a tout moment, pas seulement des exercices scriptes." },
    gameModes: { title: "5 Modes de Jeu", description: "Batailles de cartes, defis d'ecoute et plus. Des jeux concus pour que les couples rivalisent et apprennent ensemble." },
    wordGifts: { title: "Cadeaux de Mots", description: "Envoyez du vocabulaire romantique a votre partenaire. Une facon douce de partager vos progres et de vous encourager." },
    ctaTitle: "Decouvrez Pourquoi les Couples Nous Adorent",
    ctaSubtitle: "Coaching IA, Mode Ecoute, defis de couple et jeux concus pour apprendre 18 langues ensemble.",
    ctaButton: "Commencer a Apprendre Ensemble",
    duolingoDescription: "Comparez l'option gratuite gamifiee avec notre app multilingue pour couples. Voyez comment se comparent le Mode Ecoute et les fonctionnalites couple.",
    duolingoVerdict: "Meilleure alternative gratuite",
    babbelDescription: "Comparez les cours structures solo avec l'apprentissage conversationnel IA pour couples. 18 langues vs 14.",
    babbelVerdict: "Meilleur pour apprenants structures",
    compare: "Comparer"
  },
  de: {
    pageTitle: "Sprachlern-Apps Vergleichen - Love Languages vs Duolingo, Babbel & Mehr",
    pageDescription: "Vergleiche Love Languages mit Duolingo, Babbel und anderen Sprachlern-Apps. Finde die beste App fur Paare, die 18 Sprachen zusammen lernen.",
    heroTitle: "Sprachlern-Apps Vergleichen",
    heroSubtitle: "Ehrliche Vergleiche, um die richtige App zum Sprachenlernen mit deinem Partner zu finden",
    whyChooseTitle: "Warum Paare Love Languages Wahlen",
    builtForCouples: { title: "Fur Paare Entwickelt", description: "Die einzige Sprach-App, die fur gemeinsames Lernen mit Partner-Challenges, Wort-Geschenken und geteiltem Fortschritt entwickelt wurde." },
    listenMode: { title: "Hormodus", description: "Lerne passiv beim Kochen, Pendeln oder Entspannen. Keine andere App lasst dich Sprachen so naturlich aufnehmen." },
    languages18: { title: "18 Sprachen", description: "Spanisch, Franzosisch, Deutsch, Italienisch, Portugiesisch, Polnisch und mehr. Jede Muttersprache zu jeder Zielsprache." },
    aiConversations: { title: "KI-Gesprache", description: "Echte Gesprache mit KI, die sich deinem Niveau anpasst. Ube jederzeit sprechen, nicht nur geskriptete Ubungen." },
    gameModes: { title: "5 Spielmodi", description: "Karteikarten-Battles, Hor-Challenges und mehr. Spiele, die fur Paare zum gemeinsamen Wettkampf und Lernen entwickelt wurden." },
    wordGifts: { title: "Wort-Geschenke", description: "Sende romantisches Vokabular an deinen Partner. Eine susse Art, Fortschritte zu teilen und sich gegenseitig zu ermutigen." },
    ctaTitle: "Entdecke Warum Paare Uns Lieben",
    ctaSubtitle: "KI-Coaching, Hormodus, Partner-Challenges und Spiele zum gemeinsamen Lernen von 18 Sprachen.",
    ctaButton: "Gemeinsam Lernen Starten",
    duolingoDescription: "Vergleiche die gamifizierte kostenlose Option mit unserer Paar-fokussierten Mehrsprachen-App.",
    duolingoVerdict: "Beste kostenlose Alternative",
    babbelDescription: "Vergleiche strukturierte Solo-Kurse mit KI-gestutztem Konversationslernen fur Paare. 18 Sprachen vs 14.",
    babbelVerdict: "Beste fur strukturierte Lerner",
    compare: "Vergleichen"
  },
};

// Fallback for languages not explicitly listed — use English
function getText(lang: string) {
  return UI_TEXT[lang] || UI_TEXT.en;
}

export function generateStaticParams() {
  return SUPPORTED_LANGS.map((nativeLang) => ({ nativeLang }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ nativeLang: string }>;
}): Promise<Metadata> {
  const { nativeLang } = await params;
  const text = getText(nativeLang);

  return {
    title: text.pageTitle,
    description: text.pageDescription,
    alternates: {
      canonical: `https://www.lovelanguages.io/compare/${nativeLang}/`,
    },
  };
}

export default async function CompareIndexPage({
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
  const text = getText(lang);

  const comparisons = [
    {
      title: "Love Languages vs Duolingo",
      description: text.duolingoDescription,
      href: `/compare/${lang}/love-languages-vs-duolingo/`,
      competitor: "Duolingo",
      competitorIcon: "\uD83E\uDD89",
      verdict: text.duolingoVerdict,
    },
    {
      title: "Love Languages vs Babbel",
      description: text.babbelDescription,
      href: `/compare/${lang}/love-languages-vs-babbel/`,
      competitor: "Babbel",
      competitorIcon: "\uD83D\uDCDA",
      verdict: text.babbelVerdict,
    },
  ];

  const canonicalUrl = `https://www.lovelanguages.io/compare/${lang}/`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: text.heroTitle,
    description: text.pageDescription,
    url: canonicalUrl,
    inLanguage: lang,
    publisher: {
      "@type": "Organization",
      name: "Love Languages",
      url: "https://www.lovelanguages.io/",
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
        <div className="max-w-4xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              {text.heroTitle}
            </h1>
            <p className="text-xl text-gray-600">
              {text.heroSubtitle}
            </p>
          </div>
        </div>
      </header>

      {/* Comparisons Grid */}
      <main className="max-w-4xl mx-auto px-4 py-12">
        <div className="grid md:grid-cols-2 gap-6">
          {comparisons.map((comp) => (
            <Link
              key={comp.competitor}
              href={comp.href}
              className="group bg-white rounded-2xl shadow-md hover:shadow-lg transition-all p-6 border border-gray-100 hover:border-accent/30"
            >
              <div className="flex items-center gap-4 mb-4">
                <img src="/favicon.svg" alt="Love Languages" className="w-12 h-12" />
                <span className="text-2xl text-gray-300">vs</span>
                <span className="text-4xl">{comp.competitorIcon}</span>
              </div>
              <h2 className="text-xl font-bold font-header text-gray-900 group-hover:text-accent transition-colors mb-2">
                {comp.title}
              </h2>
              <p className="text-gray-600 mb-3">{comp.description}</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">
                  {comp.competitor}: {comp.verdict}
                </span>
                <span className="text-accent font-medium group-hover:translate-x-1 transition-transform">
                  {text.compare} &rarr;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {/* Why Love Languages Section */}
        <section className="mt-12 bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-8">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-6 text-center">
            {text.whyChooseTitle}
          </h2>
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83D\uDC95"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.builtForCouples.title}</h3>
              <p className="text-gray-600 text-sm">{text.builtForCouples.description}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83C\uDFA7"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.listenMode.title}</h3>
              <p className="text-gray-600 text-sm">{text.listenMode.description}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83C\uDF0D"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.languages18.title}</h3>
              <p className="text-gray-600 text-sm">{text.languages18.description}</p>
            </div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83E\uDD16"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.aiConversations.title}</h3>
              <p className="text-gray-600 text-sm">{text.aiConversations.description}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83C\uDFAE"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.gameModes.title}</h3>
              <p className="text-gray-600 text-sm">{text.gameModes.description}</p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">{"\uD83C\uDF81"}</div>
              <h3 className="font-bold text-gray-900 mb-2">{text.wordGifts.title}</h3>
              <p className="text-gray-600 text-sm">{text.wordGifts.description}</p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            {text.ctaTitle}
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            {text.ctaSubtitle}
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-accent font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            {text.ctaButton} &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
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
