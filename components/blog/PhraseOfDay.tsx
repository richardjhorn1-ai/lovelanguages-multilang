interface Props {
  // New language-agnostic props (preferred)
  word?: string;
  translation?: string;
  // Legacy props (backward compatibility with existing Polish articles)
  polish?: string;
  english?: string;
  // Common props
  pronunciation: string;
  context?: string;
}

export default function PhraseOfDay({ word, translation, polish, english, pronunciation, context }: Props) {
  // Use new props if provided, fall back to legacy props
  const displayWord = word || polish || '';
  const displayTranslation = translation || english || '';

  return (
    <div className="speakable-phrase my-8 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8">
      <div className="absolute top-4 right-4 text-6xl opacity-20">{'\u{1F495}'}</div>
      <p className="text-sm uppercase tracking-wide text-accent font-bold mb-2">
        Phrase to Learn
      </p>
      <p className="text-3xl font-bold text-gray-900 font-header mb-2">{displayWord}</p>
      <p className="text-lg text-gray-600 mb-1">{displayTranslation}</p>
      <p className="text-sm text-accent">[ {pronunciation} ]</p>
      {context && (
        <p className="mt-4 text-gray-600 italic border-t border-accent/20 pt-4">
          {context}
        </p>
      )}
    </div>
  );
}
