interface Props {
  languageName: string;
  familyGroup: string;
}

// Map family groups to hub URLs and descriptions
const familyHubs: Record<string, { url: string; description: string; emoji: string } | null> = {
  'Romance': {
    url: '/learn/romance-languages/',
    description: 'Spanish, French, Italian, Portuguese, Romanian',
    emoji: '\u{1F495}'
  },
  'Slavic': {
    url: '/learn/slavic-languages/',
    description: 'Polish, Russian, Ukrainian, Czech',
    emoji: '\u{1F524}'
  },
  'Germanic': {
    url: '/learn/easiest-languages/',
    description: 'German, Dutch, Swedish, Norwegian, Danish',
    emoji: '\u{1F4CA}'
  },
  // Languages without a dedicated family hub
  'Uralic': null,
  'Turkic': null,
  'Hellenic': null,
};

export default function FamilyHubLink({ languageName, familyGroup }: Props) {
  const hubInfo = familyHubs[familyGroup];

  if (!hubInfo) return null;

  return (
    <div className="bg-gradient-to-r from-gray-50 to-white border-b border-gray-100">
      <div className="max-w-6xl mx-auto px-4 py-3">
        <a
          href={hubInfo.url}
          className="flex items-center justify-center gap-3 text-sm text-gray-600 hover:text-accent transition-colors group"
        >
          <span>{hubInfo.emoji}</span>
          <span>
            <span className="font-medium text-gray-900">{languageName}</span> is part of the{' '}
            <span className="font-semibold text-accent group-hover:underline">{familyGroup} Languages</span> family
          </span>
          <svg className="w-4 h-4 opacity-50 group-hover:opacity-100 group-hover:translate-x-1 transition-all" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      </div>
    </div>
  );
}
