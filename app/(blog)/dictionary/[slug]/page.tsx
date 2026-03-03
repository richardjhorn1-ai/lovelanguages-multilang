import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { polishDictionary, getWordBySlug, getRelatedWords } from '@blog-data/polish-dictionary';

// Word type display labels
const wordTypeLabels: Record<string, string> = {
  noun: 'Noun',
  verb: 'Verb',
  adjective: 'Adjective',
  adverb: 'Adverb',
  phrase: 'Phrase',
  pronoun: 'Pronoun',
  preposition: 'Preposition',
  conjunction: 'Conjunction',
  interjection: 'Interjection',
};

// Gender display labels
const genderLabels: Record<string, string> = {
  masculine: 'Masculine',
  feminine: 'Feminine',
  neuter: 'Neuter',
  'masculine-personal': 'Masculine Personal',
  'non-masculine-personal': 'Non-Masculine Personal',
};

// Difficulty colors
const difficultyColors: Record<string, { bg: string; text: string }> = {
  beginner: { bg: 'bg-green-100', text: 'text-green-700' },
  intermediate: { bg: 'bg-yellow-100', text: 'text-yellow-700' },
  advanced: { bg: 'bg-red-100', text: 'text-red-700' },
};

export function generateStaticParams() {
  return polishDictionary.map((word) => ({ slug: word.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const word = getWordBySlug(slug);

  if (!word) {
    return { title: 'Word Not Found' };
  }

  return {
    title: `${word.polish} - Polish Word Meaning, Pronunciation & Examples`,
    description: `Learn the Polish word "${word.polish}" meaning "${word.english}". Pronunciation: ${word.pronunciation}. Example sentences and usage for couples learning Polish together.`,
    alternates: {
      canonical: `https://www.lovelanguages.io/dictionary/${word.slug}/`,
    },
  };
}

export default async function DictionaryWordPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const word = getWordBySlug(slug);

  if (!word) {
    notFound();
  }

  const relatedWords = getRelatedWords(word.relatedWords);
  const difficulty = difficultyColors[word.difficulty];

  // JSON-LD Schema
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: word.polish,
    description: `${word.polish} means "${word.english}" in Polish. Pronunciation: ${word.pronunciation}`,
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      name: "Polish Dictionary for Couples",
      url: "https://www.lovelanguages.io/dictionary/",
    },
  };

  // Breadcrumb Schema
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: "https://www.lovelanguages.io/" },
      { "@type": "ListItem", position: 2, name: "Dictionary", item: "https://www.lovelanguages.io/dictionary/" },
      { "@type": "ListItem", position: 3, name: word.polish, item: `https://www.lovelanguages.io/dictionary/${word.slug}/` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumb */}
      <nav className="max-w-4xl mx-auto px-4 py-3 bg-gray-50">
        <ol className="flex items-center gap-2 text-sm text-gray-500">
          <li><Link href="/" className="hover:text-accent">Home</Link></li>
          <li>/</li>
          <li><Link href="/dictionary/" className="hover:text-accent">Dictionary</Link></li>
          <li>/</li>
          <li className="text-gray-900">{word.polish}</li>
        </ol>
      </nav>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Main Word Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8 mb-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
            <div>
              <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-2">
                {word.polish}
              </h1>
              <p className="text-2xl text-gray-600">{word.english}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className={`px-3 py-1 rounded-full text-sm font-bold ${difficulty.bg} ${difficulty.text}`}>
                {word.difficulty}
              </span>
              <span className="px-3 py-1 rounded-full text-sm font-bold bg-accent/10 text-accent">
                {wordTypeLabels[word.wordType]}
              </span>
              {word.gender && (
                <span className="px-3 py-1 rounded-full text-sm font-bold bg-purple-100 text-purple-700">
                  {genderLabels[word.gender]}
                </span>
              )}
            </div>
          </div>

          {/* Pronunciation */}
          <div className="bg-gradient-to-r from-accent/5 to-pink-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{"\uD83D\uDD0A"}</span>
              <div>
                <p className="text-sm text-gray-500 mb-1">Pronunciation</p>
                <p className="text-xl font-bold text-gray-900 font-mono">{word.pronunciation}</p>
              </div>
            </div>
          </div>

          {/* Cultural Note */}
          {word.culturalNote && (
            <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">{"\uD83D\uDCA1"}</span>
                <div>
                  <p className="font-bold text-amber-800 mb-1">Cultural Note</p>
                  <p className="text-amber-700">{word.culturalNote}</p>
                </div>
              </div>
            </div>
          )}

          {/* Examples */}
          <div className="mb-6">
            <h2 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
              <span className="text-xl">{"\uD83D\uDCDD"}</span> Example Sentences
            </h2>
            <div className="space-y-3">
              {word.examples.map((example, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-4">
                  <p className="text-lg font-medium text-gray-900 mb-1">{example.polish}</p>
                  <p className="text-gray-600">{example.english}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Conjugation Table (for verbs) */}
          {word.conjugations && word.conjugations.length > 0 && (
            <div className="mb-6">
              <h2 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">{"\uD83D\uDCCA"}</span> Conjugation
              </h2>
              {word.conjugations.map((conj, ci) => (
                <div key={ci} className="mb-4">
                  <h3 className="font-bold text-gray-700 mb-2">{conj.tense} Tense</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full bg-white rounded-xl overflow-hidden border border-gray-200">
                      <thead className="bg-accent/10">
                        <tr>
                          <th className="px-4 py-2 text-left text-accent font-bold">Person</th>
                          <th className="px-4 py-2 text-left text-accent font-bold">Polish</th>
                        </tr>
                      </thead>
                      <tbody>
                        {conj.forms.ja && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">ja (I)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.ja}</td>
                          </tr>
                        )}
                        {conj.forms.ty && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">ty (you)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.ty}</td>
                          </tr>
                        )}
                        {conj.forms.on_ona_ono && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">on/ona/ono (he/she/it)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.on_ona_ono}</td>
                          </tr>
                        )}
                        {conj.forms.my && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">my (we)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.my}</td>
                          </tr>
                        )}
                        {conj.forms.wy && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">wy (you plural)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.wy}</td>
                          </tr>
                        )}
                        {conj.forms.oni_one && (
                          <tr className="border-t border-gray-100">
                            <td className="px-4 py-2 text-gray-600">oni/one (they)</td>
                            <td className="px-4 py-2 font-medium text-gray-900">{conj.forms.oni_one}</td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Adjective Forms */}
          {word.adjectiveForms && (
            <div className="mb-6">
              <h2 className="text-xl font-bold font-header text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">{"\uD83D\uDCCA"}</span> Adjective Forms
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full bg-white rounded-xl overflow-hidden border border-gray-200">
                  <thead className="bg-accent/10">
                    <tr>
                      <th className="px-4 py-2 text-left text-accent font-bold">Gender</th>
                      <th className="px-4 py-2 text-left text-accent font-bold">Form</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Masculine</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{word.adjectiveForms.masculine}</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Feminine</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{word.adjectiveForms.feminine}</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Neuter</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{word.adjectiveForms.neuter}</td>
                    </tr>
                    <tr className="border-t border-gray-100">
                      <td className="px-4 py-2 text-gray-600">Plural</td>
                      <td className="px-4 py-2 font-medium text-gray-900">{word.adjectiveForms.plural}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Tags */}
          <div className="flex flex-wrap gap-2">
            {word.tags.map((tag) => (
              <Link
                key={tag}
                href={`/dictionary/?tag=${tag}`}
                className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-sm hover:bg-accent/10 hover:text-accent transition-colors"
              >
                #{tag}
              </Link>
            ))}
          </div>
        </div>

        {/* Related Words */}
        {relatedWords.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold font-header text-gray-900 mb-4">Related Words</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {relatedWords.map((related) => (
                <Link
                  key={related.slug}
                  href={`/dictionary/${related.slug}/`}
                  className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow border border-gray-100 hover:border-accent/30"
                >
                  <p className="font-bold text-gray-900 mb-1">{related.polish}</p>
                  <p className="text-sm text-gray-500">{related.english}</p>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            Want to Master Polish?
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            Learn {word.polish} and thousands more words with AI coaching designed for couples.
          </p>
          <Link
            href="/"
            className="inline-block bg-white text-accent font-bold px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all text-lg"
          >
            Start Learning Polish &rarr;
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-100 border-t border-gray-200 py-12 mt-12">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <Link href="/" className="inline-flex items-center gap-2 text-2xl font-bold font-header text-accent mb-4">
            <img src="/favicon.svg" alt="Love Languages" className="w-8 h-8" />
            Love Languages
          </Link>
          <p className="text-gray-600 mb-6">Learn Polish together with your partner</p>
          <nav className="flex justify-center gap-6 text-sm text-gray-500">
            <Link href="/learn/" className="hover:text-accent">Blog</Link>
            <Link href="/dictionary/" className="hover:text-accent">Dictionary</Link>
            <Link href="/tools/" className="hover:text-accent">Tools</Link>
            <Link href="/compare/" className="hover:text-accent">Compare</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
