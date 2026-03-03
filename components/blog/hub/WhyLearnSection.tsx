interface Props {
  name: string;
  reasons: string[];
}

const icons = ['\u{1F30D}', '\u{1F4BC}', '\u{1F4DA}', '\u2764\uFE0F', '\u{1F3AF}'];

export default function WhyLearnSection({ name, reasons }: Props) {
  return (
    <section className="py-12 bg-white">
      <div className="max-w-4xl mx-auto px-4">
        <h2 className="text-2xl md:text-3xl font-bold font-header text-gray-900 mb-8">
          Why Learn {name}?
        </h2>
        <div className="grid md:grid-cols-2 gap-4">
          {reasons.map((reason, i) => (
            <div key={i} className="flex gap-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <span className="text-2xl flex-shrink-0">{icons[i % icons.length]}</span>
              <p className="text-gray-700">{reason}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
