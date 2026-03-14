import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import {
  buildChatPrompt,
  buildVoiceModeInstruction,
} from '../utils/prompt-templates';

const testDir = dirname(fileURLToPath(import.meta.url));

describe('buildChatPrompt', () => {
  it('keeps Ask mode mostly plain prose with rare light blocks only', () => {
    const prompt = buildChatPrompt({
      targetLanguage: 'pl',
      nativeLanguage: 'en',
      mode: 'ask',
      userRole: 'student',
      partnerName: 'Ania',
      learningGoal: 'plan a sweet dinner date',
    });

    expect(prompt).toContain('Default to plain prose');
    expect(prompt).toContain('Use at most ONE lightweight enrichment block');
    expect(prompt).toContain('Avoid ::: table and ::: drill unless the user explicitly asks');
    expect(prompt).toContain('If the user asks for a simple translation or quick phrase, do not use blocks');
  });

  it('gives Learn mode all four block types with anti-overuse guidance', () => {
    const prompt = buildChatPrompt({
      targetLanguage: 'es',
      nativeLanguage: 'en',
      mode: 'learn',
      userRole: 'student',
      includeVocabularyExtraction: true,
    });

    expect(prompt).toContain('::: table');
    expect(prompt).toContain('::: drill');
    expect(prompt).toContain('::: culture[Optional title]');
    expect(prompt).toContain('::: slang[Optional title]');
    expect(prompt).toContain('Use 1-2 blocks max');
    expect(prompt).toContain('VOCABULARY EXTRACTION:');
  });

  it('gives Coach mode nativeness guidance and optional action rules', () => {
    const prompt = buildChatPrompt({
      targetLanguage: 'fr',
      nativeLanguage: 'en',
      mode: 'coach',
      userRole: 'tutor',
      includeCoachActions: true,
      partnerContext: {
        learnerName: 'Claire',
        stats: {
          totalWords: 120,
          masteredCount: 45,
          xp: 500,
          level: 'Conversational 1',
        },
        weakSpots: [{ word: 'toujours' }],
        recentWords: [{ word: 'bisou' }],
      },
    });

    expect(prompt).toContain('culture and slang guidance are especially helpful');
    expect(prompt).toContain('=== ACTIONS (Optional Superpower) ===');
    expect(prompt).toContain('word_gift: send vocabulary');
  });
});

describe('buildVoiceModeInstruction', () => {
  it('keeps voice mode semantic but non-markdown', () => {
    const prompt = buildVoiceModeInstruction({
      targetLanguage: 'it',
      nativeLanguage: 'en',
      mode: 'ask',
    });

    expect(prompt).toContain('Do not use markdown, tables, bullet lists, or block syntax');
    expect(prompt).toContain('If a cultural note or more native-sounding alternative would help');
    expect(prompt).not.toContain(':::');
  });
});

describe('prompt wiring', () => {
  it('uses the shared prompt builders from both API entry points', () => {
    const chatApi = readFileSync(resolve(testDir, '../api/chat.ts'), 'utf8');
    const streamApi = readFileSync(resolve(testDir, '../api/chat-stream.ts'), 'utf8');
    const liveTokenApi = readFileSync(resolve(testDir, '../api/live-token.ts'), 'utf8');

    expect(chatApi).toContain('buildChatPrompt({');
    expect(streamApi).toContain('buildChatPrompt({');
    expect(liveTokenApi).toContain('buildVoiceModeInstruction({');
  });
});
