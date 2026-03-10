import { describe, expect, it } from 'vitest';

import {
  MAX_VOICE_EXTRACTION_CHARS,
  MAX_VOICE_EXTRACTION_MESSAGES,
  selectVoiceMessagesForExtraction,
} from '../utils/voice-vocabulary';

describe('selectVoiceMessagesForExtraction', () => {
  it('keeps the full short voice session instead of trimming to six messages', () => {
    const messages = Array.from({ length: 10 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'model',
      content: `message-${index + 1}`,
    }));

    const selected = selectVoiceMessagesForExtraction(messages);

    expect(selected).toEqual(messages);
  });

  it('drops empty and attachment-only messages before extraction', () => {
    const selected = selectVoiceMessagesForExtraction([
      { role: 'user', content: '   ' },
      { role: 'model', content: 'hola' },
      { role: 'user', content: 'photo [Media Attached]' },
      { role: 'model', content: 'adios' },
    ]);

    expect(selected).toEqual([
      { role: 'model', content: 'hola' },
      { role: 'model', content: 'adios' },
    ]);
  });

  it('caps long sessions with a bounded recent window instead of a hard six-message slice', () => {
    const messages = Array.from({ length: MAX_VOICE_EXTRACTION_MESSAGES + 6 }, (_, index) => ({
      role: index % 2 === 0 ? 'user' : 'model',
      content: `turn-${index + 1} `.repeat(60).trim(),
    }));

    const selected = selectVoiceMessagesForExtraction(messages);

    expect(selected.length).toBeGreaterThan(6);
    expect(selected.length).toBeLessThanOrEqual(MAX_VOICE_EXTRACTION_MESSAGES);
    expect(selected).toEqual(messages.slice(messages.length - selected.length));

    const totalChars = selected.reduce((sum, message) => sum + message.content.trim().length, 0);
    expect(totalChars).toBeLessThanOrEqual(MAX_VOICE_EXTRACTION_CHARS);
  });
});
