export const CHAT_BLOCK_TYPES = ['table', 'drill', 'culture', 'slang'] as const;

export type ChatBlockType = typeof CHAT_BLOCK_TYPES[number];

export type ChatMessageSegment =
  | {
      type: 'text';
      content: string;
    }
  | {
      type: ChatBlockType;
      content: string;
      title?: string;
      explicit: boolean;
      open: boolean;
    };

const CHAT_BLOCK_TYPE_SET = new Set<string>(CHAT_BLOCK_TYPES);
const BLOCK_OPEN_RE = /^:::\s*([a-z]+)(?:(?:\[(.*?)\])|(?:\s+(.+?)))?\s*$/i;
const BLOCK_CLOSE_RE = /^:::\s*$/;
const BLOCK_CLOSE_WITH_TEXT_RE = /^:::\s+(.+?)\s*$/;
const TABLE_SEPARATOR_RE = /^\s*\|?(?:\s*:?-{3,}:?\s*\|)+(?:\s*:?-{3,}:?\s*)\|?\s*$/;

function normalizeContent(lines: string[]): string {
  return lines.join('\n').trim();
}

function isSupportedChatBlockType(type: string): type is ChatBlockType {
  return CHAT_BLOCK_TYPE_SET.has(type.toLowerCase());
}

function isPipeDelimitedRow(line: string): boolean {
  return line.includes('|');
}

function getPipeDelimitedCellCount(line: string): number {
  return line
    .split('|')
    .map((cell) => cell.trim())
    .filter(Boolean).length;
}

function isMarkdownSeparatorRow(line: string): boolean {
  return TABLE_SEPARATOR_RE.test(line) && line.includes('|');
}

function isMarkdownHeaderRow(line: string): boolean {
  return isPipeDelimitedRow(line) && getPipeDelimitedCellCount(line) >= 2;
}

export function isMarkdownTable(content: string): boolean {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) return false;
  if (!isMarkdownHeaderRow(lines[0])) return false;
  if (!isMarkdownSeparatorRow(lines[1])) return false;

  const bodyLines = lines.slice(2);
  return bodyLines.length === 0 || bodyLines.every((line) => isPipeDelimitedRow(line));
}

function splitTextSegmentsWithNakedTables(content: string): ChatMessageSegment[] {
  const lines = content.split(/\r?\n/);
  const segments: ChatMessageSegment[] = [];
  const textBuffer: string[] = [];

  const flushText = () => {
    const normalized = normalizeContent(textBuffer);
    if (normalized) {
      segments.push({ type: 'text', content: normalized });
    }
    textBuffer.length = 0;
  };

  let index = 0;
  while (index < lines.length) {
    const line = lines[index];
    const nextLine = lines[index + 1];

    if (
      nextLine !== undefined &&
      isMarkdownHeaderRow(line.trim()) &&
      isMarkdownSeparatorRow(nextLine.trim())
    ) {
      flushText();

      const tableLines = [line, nextLine];
      index += 2;

      while (index < lines.length) {
        const currentLine = lines[index];
        if (!currentLine.trim()) break;
        if (!isPipeDelimitedRow(currentLine.trim())) break;
        tableLines.push(currentLine);
        index += 1;
      }

      const normalizedTable = normalizeContent(tableLines);
      if (normalizedTable) {
        segments.push({
          type: 'table',
          content: normalizedTable,
          explicit: false,
          open: false,
        });
      }
      continue;
    }

    textBuffer.push(line);
    index += 1;
  }

  flushText();
  return segments;
}

export function parseChatMessageSegments(content: string): ChatMessageSegment[] {
  const lines = content.split(/\r?\n/);
  const rawSegments: ChatMessageSegment[] = [];
  const textBuffer: string[] = [];
  let openBlock: { type: ChatBlockType; title?: string; lines: string[] } | null = null;

  const flushText = () => {
    const normalized = normalizeContent(textBuffer);
    if (normalized) {
      rawSegments.push({ type: 'text', content: normalized });
    }
    textBuffer.length = 0;
  };

  const flushBlock = (open: boolean) => {
    if (!openBlock) return;
    const normalized = normalizeContent(openBlock.lines);
    if (normalized) {
      rawSegments.push({
        type: openBlock.type,
        content: normalized,
        title: openBlock.title,
        explicit: true,
        open,
      });
    }
    openBlock = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();

    if (openBlock) {
      if (BLOCK_CLOSE_RE.test(trimmed)) {
        flushBlock(false);
      } else {
        const closeWithTextMatch = trimmed.match(BLOCK_CLOSE_WITH_TEXT_RE);
        const trailingText = closeWithTextMatch?.[1]?.trim() || '';

        if (trailingText) {
          const trailingOpenMatch = trailingText.match(/^([a-z]+)(?:\[(.*?)\])?\s*$/i);
          const trailingStartsNewBlock =
            trailingOpenMatch &&
            isSupportedChatBlockType(trailingOpenMatch[1]);

          if (!trailingStartsNewBlock) {
            flushBlock(false);
            textBuffer.push(trailingText);
            continue;
          }
        }

        openBlock.lines.push(line);
      }
      continue;
    }

    const openMatch = trimmed.match(BLOCK_OPEN_RE);
    if (openMatch && isSupportedChatBlockType(openMatch[1])) {
      flushText();
      openBlock = {
        type: openMatch[1].toLowerCase() as ChatBlockType,
        title: openMatch[2]?.trim() || openMatch[3]?.trim() || undefined,
        lines: [],
      };
      continue;
    }

    textBuffer.push(line);
  }

  flushText();
  flushBlock(true);

  return rawSegments.flatMap((segment) => {
    if (segment.type !== 'text') return [segment];
    return splitTextSegmentsWithNakedTables(segment.content);
  });
}
