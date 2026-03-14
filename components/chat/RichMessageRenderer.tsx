import React from 'react';
import { ICONS } from '../../constants';
import { speak } from '../../services/audio';
import { escapeHtml, sanitizeHtml } from '../../utils/sanitize';
import {
  isMarkdownTable,
  parseChatMessageSegments,
  type ChatMessageSegment,
} from '../../utils/chat-blocks';

type TranslateFn = (key: string, defaultValue?: string) => string;

function formatRichMessageHtml(text: string): string {
  if (!text) return '';

  let clean = text
    .split('(#FF4761) font-semibold">').join('')
    .split('(#FF4761)font-semibold">').join('')
    .split('#FF4761) font-semibold">').join('')
    .split('font-semibold">').join('')
    .split('font-semibold>').join('');

  clean = clean
    .replace(/\(?#[A-Fa-f0-9]{3,6}\)?\s*font-semibold[^a-z>]*>/gi, '')
    .replace(/\(#[A-Fa-f0-9]{3,6}\)/g, '')
    .replace(/font-semibold["'>:\s]*/gi, '')
    .replace(/text-\[#[A-Fa-f0-9]{3,6}\]/g, '')
    .replace(/<\/?(?:span|strong|div|em|b|i)[^>]*>/gi, '')
    .replace(/style=["'][^"']*["']/gi, '')
    .replace(/class=["'][^"']*["']/gi, '')
    .replace(/#[A-Fa-f0-9]{6}(?![A-Fa-f0-9])/g, '')
    .replace(/["']\s*>/g, '')
    .replace(/<\s*["']/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  clean = escapeHtml(clean);
  clean = clean.replace(
    /\[(.*?)\]/g,
    '<span class="text-[var(--text-secondary)] italic text-scale-label">($1)</span>'
  );
  clean = clean.replace(
    /\*\*(.*?)\*\*/g,
    '<strong class="tts-word" data-word="$1" style="color: var(--accent-color); font-weight: 600; cursor: pointer;">$1</strong>'
  );
  clean = clean.replace(/\n/g, '<br />');

  return sanitizeHtml(clean);
}

const TextSegment: React.FC<{ content: string }> = ({ content }) => (
  <div
    className="text-scale-label leading-relaxed text-[var(--text-primary)]"
    dangerouslySetInnerHTML={{ __html: formatRichMessageHtml(content) }}
  />
);

const InsightCard: React.FC<{
  content: string;
  label: string;
  variant: 'culture' | 'slang';
}> = ({ content, label, variant }) => {
  const isSlang = variant === 'slang';

  return (
    <div
      className={`my-4 overflow-hidden rounded-2xl border shadow-sm w-full ${
        isSlang
          ? 'bg-gradient-to-br from-[var(--secondary-light)] to-[var(--bg-card)] border-[var(--secondary-border)]'
          : 'bg-gradient-to-br from-[var(--accent-light)] to-[var(--bg-card)] border-[var(--accent-border)]'
      }`}
    >
      <div
        className={`px-4 py-2 border-b flex items-center gap-2 ${
          isSlang
            ? 'bg-[var(--secondary-light)] border-[var(--secondary-border)]'
            : 'bg-[var(--accent-light)] border-[var(--accent-border)]'
        }`}
      >
        {isSlang ? (
          <ICONS.MessageCircle className="w-4 h-4 text-[var(--secondary-color)]" />
        ) : (
          <ICONS.Sparkles className="w-4 h-4 text-[var(--accent-color)]" />
        )}
        <h3
          className={`text-box-trim text-scale-caption font-black font-header uppercase tracking-widest ${
            isSlang ? 'text-[var(--secondary-color)]' : 'text-[var(--accent-color)]'
          }`}
        >
          {label}
        </h3>
      </div>
      <div className="p-4 text-scale-label text-[var(--text-secondary)] leading-relaxed">
        <div dangerouslySetInnerHTML={{ __html: formatRichMessageHtml(content) }} />
      </div>
    </div>
  );
};

const DrillCard: React.FC<{ content: string; t: TranslateFn }> = ({ content, t }) => (
  <div className="my-4 rounded-2xl border-2 border-dashed border-[var(--secondary-border)] bg-[var(--secondary-light)] p-1 relative w-full">
    <div className="text-box-trim absolute -top-3 left-4 bg-[var(--secondary-light)] text-[var(--secondary-color)] text-scale-micro font-black uppercase tracking-widest px-2 py-0.5 rounded-full border border-[var(--secondary-border)]">
      {t('chat.blocks.practiceChallenge', 'Practice Challenge')}
    </div>
    <div className="p-4 text-scale-label text-[var(--text-primary)] font-medium">
      <div dangerouslySetInnerHTML={{ __html: formatRichMessageHtml(content) }} />
    </div>
  </div>
);

const GrammarTable: React.FC<{ content: string }> = ({ content }) => {
  if (!isMarkdownTable(content)) {
    return <TextSegment content={content} />;
  }

  const rows = content
    .trim()
    .split('\n')
    .map((row) => row.trim())
    .filter(Boolean);
  const header = rows[0].split('|').map((cell) => cell.trim()).filter(Boolean);
  const body = rows
    .slice(2)
    .map((row) => row.split('|').map((cell) => cell.trim()).filter(Boolean));

  return (
    <div className="my-4 overflow-hidden rounded-xl glass-card w-full overflow-x-auto">
      <table className="w-full text-scale-label text-left">
        <thead className="text-box-trim bg-[var(--bg-primary)] text-[var(--text-secondary)] text-scale-micro uppercase font-bold tracking-wider">
          <tr>{header.map((cell, index) => <th key={index} className="px-4 py-3 font-black">{cell}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {body.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-[var(--bg-primary)]/50">
              {row.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className="px-4 py-2.5 text-[var(--text-secondary)] font-medium"
                  dangerouslySetInnerHTML={{ __html: formatRichMessageHtml(cell) }}
                />
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

function renderSegment(segment: ChatMessageSegment, index: number, t: TranslateFn) {
  switch (segment.type) {
    case 'table':
      return <GrammarTable key={index} content={segment.content} />;
    case 'drill':
      return <DrillCard key={index} content={segment.content} t={t} />;
    case 'culture':
      return (
        <InsightCard
          key={index}
          content={segment.content}
          label={segment.title || t('chat.blocks.cultureNote', 'Culture Note')}
          variant="culture"
        />
      );
    case 'slang':
      return (
        <InsightCard
          key={index}
          content={segment.content}
          label={segment.title || t('chat.blocks.nativeUsage', 'Native Usage')}
          variant="slang"
        />
      );
    case 'text':
    default:
      return <TextSegment key={index} content={segment.content} />;
  }
}

export const RichMessageRenderer: React.FC<{
  content: string;
  t: TranslateFn;
  targetLanguage?: string;
}> = ({ content, t, targetLanguage }) => {
  const segments = parseChatMessageSegments(content);

  const handleTTSClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    if (!target.classList.contains('tts-word') || !targetLanguage) return;

    const word = target.dataset.word;
    if (word) {
      speak(word, targetLanguage);
    }
  };

  return (
    <div className="space-y-2 w-full break-words" onClick={handleTTSClick}>
      {segments.map((segment, index) => renderSegment(segment, index, t))}
    </div>
  );
};

export default RichMessageRenderer;
