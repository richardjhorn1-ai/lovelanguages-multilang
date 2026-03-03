interface Testimonial {
  quote: string;
  name: string;
  context: string;
  avatar?: string;
}

interface Props {
  title?: string;
}

// Testimonials - update these with real ones when you have them
const testimonials: Testimonial[] = [
  {
    quote: "Finally an app that understands learning Polish isn't just about vocabulary - it's about connecting with my partner's family.",
    name: "Sarah & Tomek",
    context: "Together 3 years",
  },
  {
    quote: "The AI tutor feels like having a patient Polish friend. My pronunciation has improved so much that my mother-in-law finally understands me!",
    name: "James",
    context: "Married to Polish wife",
  },
  {
    quote: "We use the conversation practice before every trip to Poland. It's become our favorite pre-flight ritual.",
    name: "Emma & Piotr",
    context: "Long-distance couple",
  },
];

export default function Testimonials({ title = "What Couples Say" }: Props) {
  return (
    <section className="my-12 bg-gradient-to-br from-accent/5 to-pink-50 rounded-2xl p-8">
      <h2 className="text-2xl font-bold font-header text-center text-gray-900 mb-8">{title}</h2>
      <div className="grid md:grid-cols-3 gap-6">
        {testimonials.map((t) => (
          <div key={t.name} className="bg-white rounded-xl p-6 shadow-sm">
            <div className="text-accent text-3xl mb-3">&ldquo;</div>
            <p className="text-gray-700 mb-4 italic">{t.quote}</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-accent to-pink-400 flex items-center justify-center text-white font-bold">
                {t.name.charAt(0)}
              </div>
              <div>
                <p className="font-semibold text-gray-900">{t.name}</p>
                <p className="text-sm text-gray-500">{t.context}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
