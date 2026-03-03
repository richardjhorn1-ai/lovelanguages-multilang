interface Mistake {
  mistake: string;
  explanation: string;
}

interface Props {
  nativeLanguage?: string;
  mistakes: Mistake[];
}

export default function CommonMistakes({ nativeLanguage = 'English', mistakes }: Props) {
  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
          Common Mistakes {nativeLanguage} Speakers Make
        </h2>
        <p className="text-gray-600 mb-8">
          Avoid these pitfalls to accelerate your learning.
        </p>

        <div className="space-y-4">
          {mistakes.map((item, i) => (
            <div key={i} className="bg-white rounded-xl p-5 border border-gray-200 hover:border-accent/30 transition-colors">
              <div className="flex gap-4 items-start">
                <span className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center flex-shrink-0 font-bold text-sm">
                  {i + 1}
                </span>
                <div>
                  <h3 className="font-bold text-gray-900 mb-1">{item.mistake}</h3>
                  <p className="text-gray-600 text-sm md:text-base">{item.explanation}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
