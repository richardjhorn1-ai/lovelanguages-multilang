import React from 'react';

// Custom components for beautiful MDX rendering
// These replace default HTML elements with styled versions

interface Props {
  children?: React.ReactNode;
  [key: string]: any;
}

// Headings with anchor links
export const H1: React.FC<Props> = ({ children, ...props }) => (
  <h1
    className="text-4xl md:text-5xl font-black font-header text-[var(--text-primary)] mb-6 leading-tight"
    {...props}
  >
    {children}
  </h1>
);

export const H2: React.FC<Props> = ({ children, ...props }) => (
  <h2
    className="text-2xl md:text-3xl font-bold font-header text-[var(--text-primary)] mt-12 mb-4 pb-2 border-b border-[var(--border-color)]"
    {...props}
  >
    {children}
  </h2>
);

export const H3: React.FC<Props> = ({ children, ...props }) => (
  <h3
    className="text-xl md:text-2xl font-bold font-header text-[var(--text-primary)] mt-8 mb-3"
    {...props}
  >
    {children}
  </h3>
);

// Paragraphs with good readability
export const P: React.FC<Props> = ({ children, ...props }) => (
  <p
    className="text-lg text-[var(--text-secondary)] leading-relaxed mb-6"
    {...props}
  >
    {children}
  </p>
);

// Lists
export const UL: React.FC<Props> = ({ children, ...props }) => (
  <ul
    className="list-none space-y-3 mb-6 ml-0"
    {...props}
  >
    {children}
  </ul>
);

export const OL: React.FC<Props> = ({ children, ...props }) => (
  <ol
    className="list-decimal list-inside space-y-3 mb-6 text-[var(--text-secondary)]"
    {...props}
  >
    {children}
  </ol>
);

export const LI: React.FC<Props> = ({ children, ...props }) => (
  <li
    className="text-lg text-[var(--text-secondary)] flex items-start gap-3"
    {...props}
  >
    <span className="text-[var(--accent-color)] mt-1.5">♥</span>
    <span>{children}</span>
  </li>
);

// Blockquote for cultural tips or important notes
export const Blockquote: React.FC<Props> = ({ children, ...props }) => (
  <blockquote
    className="border-l-4 border-[var(--accent-color)] bg-[var(--accent-color)]/5 rounded-r-xl px-6 py-4 my-8 italic"
    {...props}
  >
    <div className="text-lg text-[var(--text-primary)]">{children}</div>
  </blockquote>
);

// Links
export const A: React.FC<Props> = ({ children, href, ...props }) => (
  <a
    href={href}
    className="text-[var(--accent-color)] hover:underline font-medium transition-colors"
    {...props}
  >
    {children}
  </a>
);

// Strong/Bold text - Polish words
export const Strong: React.FC<Props> = ({ children, ...props }) => (
  <strong
    className="font-bold text-[var(--accent-color)]"
    {...props}
  >
    {children}
  </strong>
);

// Code/pronunciation
export const Code: React.FC<Props> = ({ children, ...props }) => (
  <code
    className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg px-2 py-1 font-mono text-sm text-[var(--text-primary)]"
    {...props}
  >
    {children}
  </code>
);

// Horizontal rule
export const HR: React.FC<Props> = (props) => (
  <hr
    className="my-12 border-t-2 border-[var(--border-color)]"
    {...props}
  />
);

// Table for vocabulary/conjugations
export const Table: React.FC<Props> = ({ children, ...props }) => (
  <div className="overflow-x-auto my-8">
    <table
      className="w-full border-collapse bg-[var(--bg-card)] rounded-xl overflow-hidden shadow-sm"
      {...props}
    >
      {children}
    </table>
  </div>
);

export const TH: React.FC<Props> = ({ children, ...props }) => (
  <th
    className="bg-[var(--accent-color)]/10 text-[var(--accent-color)] font-bold text-left px-4 py-3 border-b border-[var(--border-color)]"
    {...props}
  >
    {children}
  </th>
);

export const TD: React.FC<Props> = ({ children, ...props }) => (
  <td
    className="px-4 py-3 border-b border-[var(--border-color)] text-[var(--text-secondary)]"
    {...props}
  >
    {children}
  </td>
);

// Image with caption support
export const Img: React.FC<Props> = ({ src, alt, ...props }) => (
  <figure className="my-8">
    <img
      src={src}
      alt={alt}
      className="w-full rounded-2xl shadow-lg"
      loading="lazy"
      {...props}
    />
    {alt && (
      <figcaption className="text-center text-sm text-[var(--text-secondary)] mt-3 italic">
        {alt}
      </figcaption>
    )}
  </figure>
);

// Custom components for language learning content

// Vocabulary Card
export const VocabCard: React.FC<{
  polish: string;
  english: string;
  pronunciation?: string;
  example?: string;
}> = ({ polish, english, pronunciation, example }) => (
  <div className="bg-gradient-to-br from-[var(--accent-color)]/5 to-[var(--accent-color)]/10 rounded-2xl p-6 my-6 border border-[var(--accent-color)]/20">
    <div className="flex items-center justify-between mb-2">
      <span className="text-2xl font-bold text-[var(--accent-color)] font-header">{polish}</span>
      <span className="text-lg text-[var(--text-primary)]">{english}</span>
    </div>
    {pronunciation && (
      <p className="text-sm text-[var(--text-secondary)] mb-2">
        Pronunciation: <code className="bg-white/50 px-2 py-0.5 rounded">{pronunciation}</code>
      </p>
    )}
    {example && (
      <p className="text-[var(--text-secondary)] italic border-t border-[var(--accent-color)]/20 pt-3 mt-3">
        "{example}"
      </p>
    )}
  </div>
);

// Conjugation Table
export const ConjugationTable: React.FC<{
  verb: string;
  meaning: string;
  conjugations: { person: string; polish: string; english: string }[];
}> = ({ verb, meaning, conjugations }) => (
  <div className="my-8 bg-[var(--bg-card)] rounded-2xl overflow-hidden shadow-sm border border-[var(--border-color)]">
    <div className="bg-[var(--accent-color)] text-white px-6 py-4">
      <h4 className="text-xl font-bold font-header">{verb}</h4>
      <p className="text-white/80">{meaning}</p>
    </div>
    <table className="w-full">
      <tbody>
        {conjugations.map((c, i) => (
          <tr key={i} className={i % 2 === 0 ? 'bg-[var(--bg-primary)]' : ''}>
            <td className="px-4 py-3 font-medium text-[var(--text-secondary)] w-1/4">{c.person}</td>
            <td className="px-4 py-3 font-bold text-[var(--accent-color)]">{c.polish}</td>
            <td className="px-4 py-3 text-[var(--text-secondary)]">{c.english}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

// Cultural Tip Box
export const CultureTip: React.FC<Props> = ({ children, title = "Cultural Tip" }) => (
  <div className="my-8 bg-amber-50 border border-amber-200 rounded-2xl p-6">
    <div className="flex items-center gap-2 mb-3">
      <span className="text-2xl">🇵🇱</span>
      <h4 className="font-bold text-amber-800 font-header">{title}</h4>
    </div>
    <div className="text-amber-900">{children}</div>
  </div>
);

// Call to Action
export const CTA: React.FC<{ text?: string; buttonText?: string }> = ({
  text = "Ready to start learning Polish with your partner?",
  buttonText = "Start Learning Free"
}) => (
  <div className="mt-12 bg-gradient-to-r from-[var(--accent-color)] to-pink-500 rounded-2xl p-8 text-center text-white">
    <h3 className="text-2xl font-bold font-header mb-4">{text}</h3>
    <a
      href="/#/"
      className="inline-block bg-white text-[var(--accent-color)] font-bold px-8 py-3 rounded-full hover:shadow-lg transition-shadow"
    >
      {buttonText} →
    </a>
  </div>
);

// Phrase of the Day
export const PhraseOfDay: React.FC<{
  polish: string;
  english: string;
  pronunciation: string;
  context?: string;
}> = ({ polish, english, pronunciation, context }) => (
  <div className="my-8 relative overflow-hidden bg-gradient-to-br from-rose-100 to-pink-100 rounded-2xl p-8">
    <div className="absolute top-4 right-4 text-6xl opacity-20">💕</div>
    <p className="text-sm uppercase tracking-wide text-[var(--accent-color)] font-bold mb-2">
      Phrase to Learn
    </p>
    <p className="text-3xl font-bold text-[var(--text-primary)] font-header mb-2">{polish}</p>
    <p className="text-lg text-[var(--text-secondary)] mb-1">{english}</p>
    <p className="text-sm text-[var(--accent-color)]">[ {pronunciation} ]</p>
    {context && (
      <p className="mt-4 text-[var(--text-secondary)] italic border-t border-[var(--accent-color)]/20 pt-4">
        {context}
      </p>
    )}
  </div>
);

// Export all components for MDX provider
export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  p: P,
  ul: UL,
  ol: OL,
  li: LI,
  blockquote: Blockquote,
  a: A,
  strong: Strong,
  code: Code,
  hr: HR,
  table: Table,
  th: TH,
  td: TD,
  img: Img,
  // Custom components
  VocabCard,
  ConjugationTable,
  CultureTip,
  CTA,
  PhraseOfDay,
};

export default mdxComponents;
