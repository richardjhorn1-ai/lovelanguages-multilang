interface Conjugation {
  person: string;
  // New language-agnostic props (preferred)
  word?: string;
  translation?: string;
  // Legacy props (backward compatibility)
  polish?: string;
  english?: string;
}

interface Props {
  verb: string;
  meaning: string;
  conjugations: Conjugation[];
}

// Helper to get display values with fallback to legacy props
const getWord = (c: Conjugation) => c.word || c.polish || '';
const getTranslation = (c: Conjugation) => c.translation || c.english || '';

export default function ConjugationTable({ verb, meaning, conjugations }: Props) {
  return (
    <div className="my-8 bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200">
      <div className="bg-accent text-white px-6 py-4">
        <h4 className="text-xl font-bold font-header">{verb}</h4>
        <p className="text-white/80">{meaning}</p>
      </div>
      <table className="w-full">
        <tbody>
          {conjugations.map((c, i) => (
            <tr key={i} className={i % 2 === 0 ? 'bg-gray-50' : ''}>
              <td className="px-4 py-3 font-medium text-gray-600 w-1/4">{c.person}</td>
              <td className="px-4 py-3 font-bold text-accent">{getWord(c)}</td>
              <td className="px-4 py-3 text-gray-600">{getTranslation(c)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
