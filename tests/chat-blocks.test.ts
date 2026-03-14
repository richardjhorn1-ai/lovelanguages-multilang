import { describe, expect, it } from 'vitest';
import {
  isMarkdownTable,
  parseChatMessageSegments,
} from '../utils/chat-blocks';

describe('chat block parsing', () => {
  it('parses prose before and after an explicit table block', () => {
    const segments = parseChatMessageSegments(`Intro

::: table
| Person | Form |
| --- | --- |
| I | amo |
:::

Outro`);

    expect(segments).toEqual([
      { type: 'text', content: 'Intro' },
      {
        type: 'table',
        content: '| Person | Form |\n| --- | --- |\n| I | amo |',
        explicit: true,
        open: false,
      },
      { type: 'text', content: 'Outro' },
    ]);
  });

  it('supports optional titles for culture and slang blocks', () => {
    const segments = parseChatMessageSegments(`::: culture[Dating etiquette]
Keep eye contact and smile.
:::

::: slang[Casual version]
Try **que guay** with friends.
:::`);    

    expect(segments).toEqual([
      {
        type: 'culture',
        title: 'Dating etiquette',
        content: 'Keep eye contact and smile.',
        explicit: true,
        open: false,
      },
      {
        type: 'slang',
        title: 'Casual version',
        content: 'Try **que guay** with friends.',
        explicit: true,
        open: false,
      },
    ]);
  });

  it('supports inline block titles without brackets for malformed model output', () => {
    const segments = parseChatMessageSegments(`::: table Polish Verb Conjugation: mieć (to have)
| Person | Form |
| --- | --- |
| ja | mam |
:::`);

    expect(segments).toEqual([
      {
        type: 'table',
        title: 'Polish Verb Conjugation: mieć (to have)',
        content: '| Person | Form |\n| --- | --- |\n| ja | mam |',
        explicit: true,
        open: false,
      },
    ]);
  });

  it('keeps unfinished blocks open while streaming', () => {
    const segments = parseChatMessageSegments(`Before

::: drill
Say **te quiero** tonight.`);

    expect(segments).toEqual([
      { type: 'text', content: 'Before' },
      {
        type: 'drill',
        content: 'Say **te quiero** tonight.',
        explicit: true,
        open: true,
      },
    ]);
  });

  it('detects naked markdown tables without confusing horizontal rules', () => {
    const segments = parseChatMessageSegments(`| Phrase | Meaning |
| --- | --- |
| te quiero | I love you |`);

    expect(segments).toEqual([
      {
        type: 'table',
        content: '| Phrase | Meaning |\n| --- | --- |\n| te quiero | I love you |',
        explicit: false,
        open: false,
      },
    ]);

    expect(
      parseChatMessageSegments(`Intro
---
Outro`)
    ).toEqual([{ type: 'text', content: 'Intro\n---\nOutro' }]);
  });

  it('treats unknown block types as normal text', () => {
    const segments = parseChatMessageSegments(`Intro
::: mystery
Hidden
:::
Outro`);

    expect(segments).toEqual([
      {
        type: 'text',
        content: 'Intro\n::: mystery\nHidden\n:::\nOutro',
      },
    ]);
  });

  it('treats close markers with trailing prose as close-plus-text', () => {
    const segments = parseChatMessageSegments(`::: table
| Pronoun | Form |
| --- | --- |
| ja | mam |
::: Notice how the ending changes depending on who is speaking.
::: drill
Try building your own sentence.
::: How does that feel?`);

    expect(segments).toEqual([
      {
        type: 'table',
        content: '| Pronoun | Form |\n| --- | --- |\n| ja | mam |',
        explicit: true,
        open: false,
      },
      {
        type: 'text',
        content: 'Notice how the ending changes depending on who is speaking.',
      },
      {
        type: 'drill',
        content: 'Try building your own sentence.',
        explicit: true,
        open: false,
      },
      {
        type: 'text',
        content: 'How does that feel?',
      },
    ]);
  });
});

describe('isMarkdownTable', () => {
  it('requires a real header row and separator row', () => {
    expect(
      isMarkdownTable(`| Phrase | Meaning |
| --- | --- |
| te adoro | I adore you |`)
    ).toBe(true);

    expect(
      isMarkdownTable(`Intro
---
Outro`)
    ).toBe(false);
  });
});
