import { describe, expect, it } from 'vitest';

import { buildListenExtractionMessages } from '../utils/listen-word-extraction';

describe('buildListenExtractionMessages', () => {
  it('keeps target-language utterances as the extraction source', () => {
    const messages = buildListenExtractionMessages([
      {
        text: 'kocham cię',
        translation: 'I love you',
        language: 'target',
        languageCode: 'pl',
      },
    ], 'pl', 'en');

    expect(messages).toEqual([
      {
        role: 'user',
        content: 'TARGET_TEXT: kocham cię\nNATIVE_GLOSS: I love you',
      },
    ]);
  });

  it('uses translated target text when the utterance was spoken in native language', () => {
    const messages = buildListenExtractionMessages([
      {
        text: 'I miss you',
        translation: 'tęsknię za tobą',
        language: 'native',
        languageCode: 'en',
      },
    ], 'pl', 'en');

    expect(messages).toEqual([
      {
        role: 'user',
        content: 'TARGET_TEXT: tęsknię za tobą\nORIGINAL_NATIVE: I miss you',
      },
    ]);
  });

  it('skips blank transcript entries', () => {
    const messages = buildListenExtractionMessages([
      { text: '   ', translation: 'hello', language: 'target' },
      { text: 'cześć', translation: 'hi', language: 'target' },
    ], 'pl', 'en');

    expect(messages).toEqual([
      {
        role: 'user',
        content: 'TARGET_TEXT: cześć\nNATIVE_GLOSS: hi',
      },
    ]);
  });
});
