interface Phrase {
  phrase: string;
  pronunciation: string;
  translation: string;
}

interface Props {
  name: string;
  phrases: Phrase[];
  learnMoreUrl?: string;
}

export default function PhrasesPreview({ name, phrases, learnMoreUrl }: Props) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
          Essential {name} Phrases
        </h2>
        <p className="text-gray-600 mb-8">Start speaking from day one with these must-know phrases.</p>

        <div className="grid md:grid-cols-2 gap-4">
          {phrases.map(phrase => (
            <div key={phrase.phrase} className="p-4 bg-white rounded-xl border border-gray-200 hover:border-accent hover:shadow-sm transition-all">
              <div className="text-lg font-bold text-gray-900 mb-1">{phrase.phrase}</div>
              <div className="text-sm text-accent mb-2">/{phrase.pronunciation}/</div>
              <div className="text-gray-600">{phrase.translation}</div>
            </div>
          ))}
        </div>

        {learnMoreUrl && (
          <div className="mt-8 text-center">
            <a href={learnMoreUrl} className="inline-flex items-center gap-2 bg-accent text-white px-6 py-3 rounded-full hover:bg-accent/90 transition-colors font-medium">
              <span>See all {name} phrases</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
