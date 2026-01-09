import { createHash } from 'crypto';
import { describe, expect, it } from 'vitest';

import { buildCacheLogContext } from '../api/tts';

describe('tts logging', () => {
  it('does not include raw text in cache log context', () => {
    const sampleText = 'Sensitive user text.';
    const context = buildCacheLogContext(sampleText);

    expect(context).toEqual({
      length: sampleText.length,
      hash: createHash('sha256').update(sampleText).digest('hex'),
    });
    expect(JSON.stringify(context)).not.toContain(sampleText);
  });
});
