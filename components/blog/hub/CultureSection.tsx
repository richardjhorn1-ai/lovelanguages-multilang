interface Props {
  name: string;
  tips: string[];
}

const icons = ['\u{1F4A1}', '\u{1F91D}', '\u{1F37D}\uFE0F', '\u{1F389}'];

export default function CultureSection({ name, tips }: Props) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-2">
          {name} Cultural Tips
        </h2>
        <p className="text-gray-600 mb-8">
          Language is culture. Understanding these nuances will help you connect more authentically.
        </p>

        <div className="grid md:grid-cols-2 gap-4">
          {tips.map((tip, i) => (
            <div key={i} className="flex gap-4 p-4 bg-gradient-to-br from-accent/5 to-pink-50 rounded-xl border border-accent/10">
              <span className="text-2xl flex-shrink-0">{icons[i % icons.length]}</span>
              <p className="text-gray-700">{tip}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
