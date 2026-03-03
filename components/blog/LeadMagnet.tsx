interface Props {
  title?: string;
  description?: string;
  buttonText?: string;
  language?: string; // Target language name for dynamic content
}

export default function LeadMagnet({
  title = "Get Our Free Phrasebook",
  description = "50 essential phrases for couples - pronunciation guides, romantic expressions, and conversation starters. Delivered to your inbox.",
  buttonText = "Send Me the Guide"
}: Props) {
  return (
    <div className="my-12 bg-white border-2 border-accent/20 rounded-2xl p-8 relative overflow-hidden">
      {/* Decorative element */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent/10 to-pink-100 rounded-full -translate-y-1/2 translate-x-1/2"></div>

      <div className="relative">
        <div className="flex items-start gap-4 mb-6">
          <div className="text-4xl">{'\u{1F4DA}'}</div>
          <div>
            <h3 className="text-xl font-bold font-header text-gray-900 mb-2">{title}</h3>
            <p className="text-gray-600">{description}</p>
          </div>
        </div>

        <form
          className="flex flex-col sm:flex-row gap-3"
          action="https://www.lovelanguages.io/api/lead-magnet"
          method="POST"
        >
          <input
            type="email"
            name="email"
            placeholder="your@email.com"
            required
            className="flex-1 px-4 py-3 rounded-xl border border-gray-300 focus:border-accent focus:ring-2 focus:ring-accent/20 outline-none transition-all"
          />
          <button
            type="submit"
            className="px-6 py-3 bg-accent text-white font-bold rounded-xl hover:bg-accent/90 transition-colors whitespace-nowrap"
          >
            {buttonText} {'\u2192'}
          </button>
        </form>

        <p className="text-xs text-gray-500 mt-3">
          No spam, ever. Unsubscribe anytime.
        </p>
      </div>
    </div>
  );
}
