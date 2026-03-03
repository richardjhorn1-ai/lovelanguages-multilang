import { Metadata } from 'next';
import Link from 'next/link';
import { polishDictionary, getAllTags, getWordsByTag } from '@blog-data/polish-dictionary';
import DictionarySearch from './DictionarySearch';

export const metadata: Metadata = {
  title: 'Polish Dictionary - Learn Polish Words with Pronunciation & Examples',
  description: `Browse ${polishDictionary.length}+ Polish words with pronunciation guides, example sentences, and cultural notes. Perfect for couples learning Polish together.`,
  alternates: {
    canonical: 'https://www.lovelanguages.io/dictionary/',
  },
};

// Group words alphabetically
function getWordsByLetter() {
  const wordsByLetter: Record<string, typeof polishDictionary> = {};
  for (const word of polishDictionary) {
    const letter = word.polish.charAt(0).toUpperCase();
    if (!wordsByLetter[letter]) wordsByLetter[letter] = [];
    wordsByLetter[letter].push(word);
  }
  return wordsByLetter;
}

export default function DictionaryIndexPage() {
  const wordsByLetter = getWordsByLetter();
  const sortedLetters = Object.keys(wordsByLetter).sort((a, b) => a.localeCompare(b, 'pl'));

  // Featured categories
  const featuredCategories = [
    { tag: 'romance', label: 'Romance & Love', icon: '\uD83D\uDC95', color: 'from-pink-500 to-rose-500' },
    { tag: 'essential', label: 'Essential Words', icon: '\u2B50', color: 'from-amber-500 to-orange-500' },
    { tag: 'family', label: 'Family', icon: '\uD83D\uDC68\u200D\uD83D\uDC69\u200D\uD83D\uDC67', color: 'from-blue-500 to-cyan-500' },
    { tag: 'food', label: 'Food & Drink', icon: '\uD83C\uDF7D\uFE0F', color: 'from-green-500 to-emerald-500' },
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTermSet",
    name: "Polish Dictionary for Couples",
    description: "Learn Polish vocabulary with pronunciation, examples, and cultural notes. Perfect for couples learning Polish together.",
    url: "https://www.lovelanguages.io/dictionary/",
    hasDefinedTerm: polishDictionary.slice(0, 50).map(word => ({
      "@type": "DefinedTerm",
      name: word.polish,
      description: word.english,
      url: `https://www.lovelanguages.io/dictionary/${word.slug}/`,
    })),
  };

  // Prepare word data for the client-side search component
  const wordDataForSearch = polishDictionary.map(w => ({
    slug: w.slug,
    polish: w.polish,
    english: w.english,
    pronunciation: w.pronunciation,
    wordType: w.wordType,
    tags: w.tags,
  }));

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Hero */}
      <header className="bg-gradient-to-b from-accent/10 to-white">
        <div className="max-w-6xl mx-auto px-4 py-10 md:py-14">
          <div className="text-center">
            <h1 className="text-4xl md:text-5xl font-black font-header text-gray-900 mb-4">
              Polish Dictionary
            </h1>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {polishDictionary.length}+ essential Polish words with pronunciation, examples, and cultural notes for couples learning together.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Search - Client Component */}
        <DictionarySearch words={wordDataForSearch} />

        {/* Featured Categories */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold font-header text-gray-900 mb-6">Browse by Category</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {featuredCategories.map((cat) => {
              const words = getWordsByTag(cat.tag);
              return (
                <a
                  key={cat.tag}
                  href={`#${cat.tag}`}
                  className={`group relative overflow-hidden rounded-2xl p-6 text-white bg-gradient-to-br ${cat.color} hover:shadow-lg transition-shadow`}
                  data-category={cat.tag}
                >
                  <div className="text-4xl mb-2">{cat.icon}</div>
                  <h3 className="font-bold text-lg mb-1">{cat.label}</h3>
                  <p className="text-white/80 text-sm">{words.length} words</p>
                </a>
              );
            })}
          </div>
        </div>

        {/* Word Stats */}
        <div className="bg-gradient-to-r from-accent/5 to-pink-50 rounded-2xl p-6 mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-accent">{polishDictionary.length}</p>
              <p className="text-gray-600">Total Words</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">{polishDictionary.filter(w => w.wordType === 'verb').length}</p>
              <p className="text-gray-600">Verbs</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">{polishDictionary.filter(w => w.wordType === 'noun').length}</p>
              <p className="text-gray-600">Nouns</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-accent">{polishDictionary.filter(w => w.conjugations).length}</p>
              <p className="text-gray-600">With Conjugations</p>
            </div>
          </div>
        </div>

        {/* Alphabetical Index */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-8 sticky top-16 z-30">
          <div className="flex flex-wrap gap-2 justify-center">
            {sortedLetters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-10 h-10 flex items-center justify-center rounded-lg font-bold text-gray-600 hover:bg-accent hover:text-white transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>

        {/* Word List by Letter */}
        <div className="space-y-8" id="word-list">
          {sortedLetters.map((letter) => (
            <section key={letter} id={`letter-${letter}`} className="scroll-mt-32">
              <h2 className="text-3xl font-black font-header text-accent mb-4 pb-2 border-b-2 border-accent/20">
                {letter}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {wordsByLetter[letter].map((word) => (
                  <Link
                    key={word.slug}
                    href={`/dictionary/${word.slug}/`}
                    className="word-card bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition-all border border-gray-100 hover:border-accent/30"
                    data-polish={word.polish.toLowerCase()}
                    data-english={word.english.toLowerCase()}
                    data-tags={word.tags.join(' ')}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{word.polish}</h3>
                        <p className="text-gray-600">{word.english}</p>
                        <p className="text-sm text-gray-400 mt-1">{word.pronunciation}</p>
                      </div>
                      <span className="text-xs px-2 py-1 bg-gray-100 text-gray-500 rounded-full">
                        {word.wordType}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* CTA */}
        <div className="mt-12 bg-gradient-to-r from-accent to-pink-500 rounded-2xl p-8 text-center text-white">
          <h2 className="text-2xl md:text-3xl font-bold font-header mb-3">
            Ready to Use These Words?
          </h2>
          <p className="text-white/90 mb-6 text-lg">
            Practice pronunciation with AI and learn in context with your partner.
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
        <div className="max-w-6xl mx-auto px-4 text-center">
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
